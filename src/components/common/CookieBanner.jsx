import React, { useState, useEffect } from 'react';
import { analytics } from '../../utils/analytics';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Never show cookie banner inside Standalone PWA App Mode
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (inStandalone) {
      localStorage.setItem('cufy_cookie_consent', JSON.stringify({ analytics: true, timestamp: new Date().toISOString() }));
      setVisible(false);
      return;
    }

    // 2. Never show if already accepted/saved in localStorage
    const saved = localStorage.getItem('cufy_cookie_consent');
    if (!saved) {
      // Auto-set consent for seamless mobile web experience so it doesn't block onboarding
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        localStorage.setItem('cufy_cookie_consent', JSON.stringify({ analytics: true, timestamp: new Date().toISOString() }));
        setVisible(false);
      } else {
        setVisible(true);
      }
    }
  }, []);

  const handleAccept = () => {
    const consent = { analytics: true, timestamp: new Date().toISOString() };
    localStorage.setItem('cufy_cookie_consent', JSON.stringify(consent));
    analytics.setConsent(true);
    analytics.trackEvent('cookie_consent_accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    const consent = { analytics: false, timestamp: new Date().toISOString() };
    localStorage.setItem('cufy_cookie_consent', JSON.stringify(consent));
    analytics.setConsent(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner animate-fade-in" role="dialog" aria-label="Cookie Preferences">
      <p className="cookie-text">
        Cufy uses essential cookies for secure authentication and privacy-first matching.
      </p>
      <div className="cookie-actions">
        <button onClick={handleDecline} className="btn-cookie-decline">
          Necessary Only
        </button>
        <button onClick={handleAccept} className="btn-cookie-accept">
          Accept All
        </button>
      </div>
    </div>
  );
}
