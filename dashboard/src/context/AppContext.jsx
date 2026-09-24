import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getApiKeys, saveApiKeys } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [targetUrl, setTargetUrl] = useState('http://localhost:4000');
  const [theme, setTheme] = useState(() => localStorage.getItem('sentinel_theme') || 'dark');
  const [apiKeys, setApiKeysState] = useState(getApiKeys());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [activeScan, setActiveScan] = useState(null);
  const [pastScans, setPastScans] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [liveLogs, setLiveLogs] = useState([]);
  const [scannerStatus, setScannerStatus] = useState({ online: false, checking: true });
  const [sandboxStatus, setSandboxStatus] = useState({ online: false, appliedPatches: [] });

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sentinel_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const updateApiKeys = (newKeys) => {
    saveApiKeys(newKeys);
    setApiKeysState(newKeys);
  };

  // Append a live log message
  const addLog = useCallback((msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setLiveLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  }, []);

  // Check health of Scanner and Sandbox
  const checkHealth = useCallback(async () => {
    try {
      await api.getHealth();
      setScannerStatus({ online: true, checking: false });
    } catch (_e) {
      setScannerStatus({ online: false, checking: false });
    }

    try {
      const info = await api.getSandboxInfo(targetUrl);
      setSandboxStatus({
        online: true,
        appliedPatches: info.appliedPatches || [],
        availablePatches: info.availablePatches || {},
      });
    } catch (_e) {
      setSandboxStatus({ online: false, appliedPatches: [] });
    }
  }, [targetUrl]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Execute Security Scan
  const triggerScan = async ({ customSpec = null, modules = null } = {}) => {
    setIsScanning(true);
    setLiveLogs([`[${new Date().toLocaleTimeString()}] Initializing security assessment against ${targetUrl}...`]);

    try {
      addLog(`Connecting to target API at ${targetUrl}...`);
      addLog(`Ingesting OpenAPI specification...`);
      addLog(`Executing stateful security probes: BOLA, Excessive Exposure, Missing Auth, Rate Limiting...`);

      const result = await api.startScan({
        targetUrl,
        rawSpec: customSpec,
        modules,
        enrichWithAi: true,
      });

      setActiveScan(result);
      if (result.logs && Array.isArray(result.logs)) {
        setLiveLogs(result.logs.map((l) => `[${new Date().toLocaleTimeString()}] ${l}`));
      }
      addLog(`Assessment complete: ${result.stats.vulnerableCount} vulnerabilities flagged.`);

      // Update selected finding if currently open
      if (selectedFinding) {
        const updated = result.findings.find((f) => f.id === selectedFinding.id);
        if (updated) setSelectedFinding(updated);
      }

      await checkHealth();
      return result;
    } catch (err) {
      addLog(`❌ Scan failed: ${err.message}`);
      throw err;
    } finally {
      setIsScanning(false);
    }
  };

  // Targeted Fix Verification
  const verifyFix = async (patchId, applyPatch = true) => {
    addLog(`Running targeted verification probe for patch "${patchId}" (apply: ${applyPatch})...`);
    try {
      const verifyRes = await api.verifyFix({
        targetUrl,
        patchId,
        applyPatch,
      });

      // Update state in activeScan
      if (activeScan) {
        const updatedFindings = activeScan.findings.map((f) => {
          if (f.patchId === patchId) {
            return {
              ...f,
              status: verifyRes.status,
              evidence: verifyRes.finding?.evidence || f.evidence,
              verifiedAt: verifyRes.verifiedAt,
            };
          }
          return f;
        });

        const newVulnerableCount = updatedFindings.filter((f) => f.status === 'VULNERABLE').length;
        const newVerifiedCount = updatedFindings.filter((f) => f.status === 'FIX_VERIFIED').length;

        // Recalculate score
        let score = 100;
        for (const f of updatedFindings) {
          if (f.status === 'VULNERABLE') {
            if (f.severity === 'CRITICAL') score -= 30;
            else if (f.severity === 'HIGH') score -= 20;
            else if (f.severity === 'MEDIUM') score -= 10;
          }
        }
        score = Math.max(0, Math.min(100, score));

        const updatedScan = {
          ...activeScan,
          findings: updatedFindings,
          stats: {
            ...activeScan.stats,
            vulnerableCount: newVulnerableCount,
            verifiedFixedCount: newVerifiedCount,
            securityScore: score,
          },
        };

        setActiveScan(updatedScan);

        if (selectedFinding && selectedFinding.patchId === patchId) {
          setSelectedFinding({
            ...selectedFinding,
            status: verifyRes.status,
            evidence: verifyRes.finding?.evidence || selectedFinding.evidence,
            verifiedAt: verifyRes.verifiedAt,
          });
        }
      }

      addLog(`Verification result for ${patchId}: ${verifyRes.status} (Fixed: ${verifyRes.isFixed})`);
      await checkHealth();
      return verifyRes;
    } catch (err) {
      addLog(`❌ Verification failed: ${err.message}`);
      throw err;
    }
  };

  // AI Remediation Regeneration
  const regenerateRemediation = async (finding, customProvider = null, customKey = null) => {
    addLog(`Requesting AI remediation generation for ${finding.id}...`);
    try {
      const remediation = await api.generateRemediation(finding, customProvider, customKey);

      if (activeScan) {
        const updatedFindings = activeScan.findings.map((f) => (f.id === finding.id ? { ...f, remediation } : f));
        setActiveScan({ ...activeScan, findings: updatedFindings });
      }

      if (selectedFinding && selectedFinding.id === finding.id) {
        setSelectedFinding({ ...selectedFinding, remediation });
      }

      addLog(`AI Remediation generated via ${remediation.provider} (aiGenerated: ${remediation.aiGenerated})`);
      return remediation;
    } catch (err) {
      addLog(`❌ AI Remediation failed: ${err.message}`);
      throw err;
    }
  };

  // Reset Sandbox Environment
  const resetSandbox = async () => {
    addLog(`Resetting sandbox database state and reverting all active patches...`);
    try {
      await api.resetSandbox(targetUrl);
      addLog(`Sandbox state reset successfully. All seed data restored.`);
      await checkHealth();
      // Re-trigger scan if active scan exists
      if (activeScan) {
        await triggerScan();
      }
    } catch (err) {
      addLog(`❌ Failed to reset sandbox: ${err.message}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        targetUrl,
        setTargetUrl,
        theme,
        toggleTheme,
        apiKeys,
        updateApiKeys,
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        isSpecModalOpen,
        setIsSpecModalOpen,
        isScanning,
        activeScan,
        setActiveScan,
        pastScans,
        selectedFinding,
        setSelectedFinding,
        liveLogs,
        scannerStatus,
        sandboxStatus,
        triggerScan,
        verifyFix,
        regenerateRemediation,
        resetSandbox,
        checkHealth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
