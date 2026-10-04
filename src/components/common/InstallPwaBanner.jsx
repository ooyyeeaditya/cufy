import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already running as standalone PWA
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (inStandalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Listen for beforeinstallprompt event (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setIsDismissed(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger 1-Click Native Install Prompt
  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => setIsDismissed(true), 3000);
      }
      setDeferredPrompt(null);
    } else {
      setShowIOSGuide(true);
    }
  };

  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Sticky Bottom/Top PWA Install Banner */}
      <div 
        style={{
          position: 'fixed',
          bottom: '84px',
          left: '12px',
          right: '12px',
          zIndex: 9999,
          background: 'rgba(24, 24, 27, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#FFFFFF'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(255,59,48,0.4)'
            }}
          >
            <Smartphone size={22} color="#FFFFFF" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {installedSuccess ? 'App Installed! 🎉' : 'Install Cufy App 📲'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#A1A1AA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {installedSuccess ? 'Opened in native standalone mode' : 'Tap to add to Home Screen'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {!installedSuccess && (
            <button
              onClick={handleInstallClick}
              style={{
                padding: '10px 16px',
                background: '#FF3B30',
                color: '#FFFFFF',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(255, 59, 48, 0.35)',
                cursor: 'pointer'
              }}
            >
              <Download size={15} />
              Install
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            style={{
              padding: '6px',
              color: '#A1A1AA',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            title="Close banner"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* iOS & Manual Installation Instruction Modal Sheet */}
      {showIOSGuide && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: 'rgba(9, 9, 11, 0.75)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#FFFFFF',
              borderRadius: '32px',
              padding: '28px 24px 24px',
              boxShadow: '0 -16px 48px rgba(0,0,0,0.24)',
              color: '#09090B'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#FFF0F0', color: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.3px' }}>Install Cufy to Phone</h3>
              </div>
              <button onClick={() => setShowIOSGuide(false)} style={{ padding: '6px', color: '#71717A' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#3F3F46', marginBottom: '20px', lineHeight: 1.45 }}>
              Add Cufy directly to your phone's Home Screen for a 100% full-screen native mobile experience.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px', background: '#F5F3EF', borderRadius: '20px' }}>
                <div style={{ padding: '8px', background: '#FFFFFF', borderRadius: '12px', color: '#FF3B30' }}>
                  <Share size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '2px' }}>1. Tap Share Button</h4>
                  <p style={{ fontSize: '0.82rem', color: '#71717A' }}>Tap the Share icon at the bottom or top bar of your browser.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px', background: '#F5F3EF', borderRadius: '20px' }}>
                <div style={{ padding: '8px', background: '#FFFFFF', borderRadius: '12px', color: '#FF3B30' }}>
                  <PlusSquare size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '2px' }}>2. Add to Home Screen</h4>
                  <p style={{ fontSize: '0.82rem', color: '#71717A' }}>Scroll down and tap <b>"Add to Home Screen"</b> or <b>"Install App"</b>.</p>
                </div>
              </div>
            </div>

            <button 
              className="btn-black-pill" 
              onClick={() => setShowIOSGuide(false)}
              style={{ width: '100%' }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
