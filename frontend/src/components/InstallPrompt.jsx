import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

/** Detect iOS Safari */
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/CriOS|FxiOS|OPiOS|mercury/i.test(navigator.userAgent); // exclude Chrome/Firefox on iOS

/** Detect if already installed (standalone mode) */
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null); // Chrome
  const [showChrome, setShowChrome]   = useState(false);      // Android / Desktop Chrome banner
  const [showIOS, setShowIOS]         = useState(false);      // iOS Safari guide
  const [installing, setInstalling]   = useState(false);
  const [dismissed, setDismissed]     = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    // ── iOS Safari: show manual guide ──
    if (isIOS()) {
      // Show after 4 seconds so user has time to look around
      const t = setTimeout(() => setShowIOS(true), 4000);
      return () => clearTimeout(t);
    }

    // ── Chrome / Edge / Samsung: capture prompt ──
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowChrome(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setShowChrome(false));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    setShowChrome(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowChrome(false);
    setShowIOS(false);
    setDismissed(true);
  };

  // ════════════════════════════════════════
  // iOS Safari — "Add to Home Screen" guide
  // ════════════════════════════════════════
  if (showIOS) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-[200] flex justify-center px-4 animate-in slide-in-from-bottom duration-500">
        <div
          className="w-full max-w-md rounded-2xl px-4 py-4 shadow-2xl relative"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(10,5,20,0.97) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(168,85,247,0.3)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.12)',
          }}
        >
          {/* Dismiss */}
          <button onClick={dismiss} className="absolute top-3 right-3 p-1 text-white/30 hover:text-white/70 transition-colors">
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <img src="/vibe-logo.png" alt="VIBE" className="w-10 h-10 rounded-xl object-cover shadow-lg flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-[13px]">Install VIBE on iPhone</p>
              <p className="text-purple-300/60 text-[10px]">Follow these 2 quick steps</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/8">
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-black">1</div>
              <div className="flex-1 flex items-center gap-2">
                <p className="text-white text-[12px] font-semibold">Tap the</p>
                {/* Safari share icon */}
                <div className="flex items-center gap-1 bg-blue-500/20 border border-blue-400/30 rounded-lg px-2 py-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  <span className="text-blue-400 text-[10px] font-bold">Share</span>
                </div>
                <p className="text-white/60 text-[12px]">at the bottom</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/8">
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-black">2</div>
              <div className="flex-1 flex items-center gap-2">
                <p className="text-white text-[12px] font-semibold">Select</p>
                <div className="flex items-center gap-1 bg-white/10 border border-white/15 rounded-lg px-2 py-1">
                  <span className="text-[13px]">＋</span>
                  <span className="text-white text-[10px] font-bold">Add to Home Screen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow pointing down for the share button */}
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-1.5 text-purple-400/60 text-[10px] font-semibold">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              Safari toolbar is at the bottom of your screen
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // Chrome / Android — native install banner
  // ════════════════════════════════════════
  if (!showChrome) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[200] flex justify-center px-4 animate-in slide-in-from-bottom duration-500">
      <div
        className="w-full max-w-md flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(10,5,20,0.96) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(168,85,247,0.3)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.15)',
        }}
      >
        <img src="/vibe-logo.png" alt="VIBE" className="w-12 h-12 rounded-2xl flex-shrink-0 object-cover shadow-lg" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[13px] leading-tight">Install VIBE App</p>
          <p className="text-purple-300/70 text-[10px] mt-0.5">Add to home screen for the best experience</p>
        </div>
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-[12px] font-black uppercase tracking-wide transition-all flex-shrink-0 shadow-lg shadow-purple-900/40 disabled:opacity-70"
        >
          {installing ? <span className="animate-pulse">...</span> : <><Download size={13} strokeWidth={3} />Install</>}
        </button>
        <button onClick={dismiss} className="p-1.5 text-white/30 hover:text-white/70 transition-colors flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
