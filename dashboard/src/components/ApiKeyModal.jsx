import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Key, X, Sparkles, Check, Bot, AlertCircle } from 'lucide-react';

export function ApiKeyModal() {
  const { isApiKeyModalOpen, setIsApiKeyModalOpen, apiKeys, updateApiKeys } = useApp();
  const [geminiKey, setGeminiKey] = useState(apiKeys.geminiApiKey || '');
  const [openaiKey, setOpenaiKey] = useState(apiKeys.openaiApiKey || '');
  const [provider, setProvider] = useState(apiKeys.preferredProvider || 'gemini');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setGeminiKey(apiKeys.geminiApiKey || '');
    setOpenaiKey(apiKeys.openaiApiKey || '');
    setProvider(apiKeys.preferredProvider || 'gemini');
  }, [apiKeys, isApiKeyModalOpen]);

  if (!isApiKeyModalOpen) return null;

  const handleSave = () => {
    updateApiKeys({
      geminiApiKey: geminiKey.trim(),
      openaiApiKey: openaiKey.trim(),
      preferredProvider: provider,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsApiKeyModalOpen(false);
    }, 800);
  };

  const handleClear = () => {
    setGeminiKey('');
    setOpenaiKey('');
    updateApiKeys({
      geminiApiKey: '',
      openaiApiKey: '',
      preferredProvider: 'gemini',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#12141a] border border-[#1f212a] rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f212a]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-[#43f283]/10 border border-[#43f283]/20">
              <Key className="h-5 w-5 text-[#43f283]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight font-display">AI Engine & API Keys</h3>
              <p className="text-xs text-ink-muted">Configure LLM keys for live AI-driven remediation generation</p>
            </div>
          </div>
          <button
            onClick={() => setIsApiKeyModalOpen(false)}
            className="p-1.5 text-ink-muted hover:text-white hover:bg-[#1a1c24] rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Provider Radio Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider font-mono">
            Primary LLM Engine
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={`p-3.5 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                provider === 'gemini'
                  ? 'border-[#43f283] bg-[#43f283]/10 text-white shadow-[0_0_15px_rgba(67,242,131,0.15)]'
                  : 'border-[#1f212a] bg-[#0e1015] text-ink-muted hover:border-[#2f3240]'
              }`}
            >
              <Sparkles className="h-4 w-4 text-[#43f283]" />
              <div>
                <span className="text-xs font-bold block text-white">Google Gemini</span>
                <span className="text-[10px] text-ink-muted">gemini-2.5-flash</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProvider('openai')}
              className={`p-3.5 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                provider === 'openai'
                  ? 'border-[#43f283] bg-[#43f283]/10 text-white shadow-[0_0_15px_rgba(67,242,131,0.15)]'
                  : 'border-[#1f212a] bg-[#0e1015] text-ink-muted hover:border-[#2f3240]'
              }`}
            >
              <Bot className="h-4 w-4 text-[#43f283]" />
              <div>
                <span className="text-xs font-bold block text-white">OpenAI</span>
                <span className="text-[10px] text-ink-muted">gpt-4o-mini</span>
              </div>
            </button>
          </div>
        </div>

        {/* Gemini Key Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-ink-muted font-mono">
            Google Gemini API Key
          </label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full rounded-xl bg-[#0a0b0e] border border-[#1f212a] px-4 py-2.5 text-xs text-white placeholder-ink-subtle focus:outline-none focus:border-[#43f283] font-mono"
          />
        </div>

        {/* OpenAI Key Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-ink-muted font-mono">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-proj-..."
            className="w-full rounded-xl bg-[#0a0b0e] border border-[#1f212a] px-4 py-2.5 text-xs text-white placeholder-ink-subtle focus:outline-none focus:border-[#43f283] font-mono"
          />
        </div>

        {/* Informational Callout */}
        <div className="p-3.5 rounded-xl bg-[#0a0b0e] border border-[#1f212a] text-xs text-ink-muted flex items-start space-x-2.5">
          <AlertCircle className="h-4 w-4 text-[#43f283] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Keys are saved in your browser's <code className="text-white font-mono">localStorage</code>. If no API key is provided, SentinelAPI uses built-in high-fidelity production patch templates.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1f212a]">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-ink-muted hover:text-[#f43f5e] font-medium transition-colors"
          >
            Clear Stored Keys
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-white bg-[#1a1c24] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-[#0a0b0e] bg-[#43f283] hover:bg-[#32e073] rounded-xl shadow-[0_0_15px_rgba(67,242,131,0.25)] transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Keys</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
