import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Key, X, Sparkles, Check, Bot, Shield, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Key className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">AI Provider & Key Settings</h3>
              <p className="text-xs text-slate-400">Configure LLM keys for live AI-driven remediation generation</p>
            </div>
          </div>
          <button
            onClick={() => setIsApiKeyModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Provider Radio Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Primary LLM Engine
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                provider === 'gemini'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <div>
                <span className="text-xs font-bold block">Google Gemini</span>
                <span className="text-[10px] text-slate-500">gemini-2.5-flash</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProvider('openai')}
              className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                provider === 'openai'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Bot className="h-4 w-4 text-indigo-400" />
              <div>
                <span className="text-xs font-bold block">OpenAI</span>
                <span className="text-[10px] text-slate-500">gpt-4o-mini</span>
              </div>
            </button>
          </div>
        </div>

        {/* Gemini Key Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Google Gemini API Key
          </label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* OpenAI Key Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-proj-..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Informational Callout */}
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Keys are saved in your browser's <code className="text-white">localStorage</code> and forwarded directly in request headers to the scanner engine. If no API key is provided, SentinelAPI uses deterministic built-in production patch templates.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-rose-400 font-medium transition-colors"
          >
            Clear Stored Keys
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
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
