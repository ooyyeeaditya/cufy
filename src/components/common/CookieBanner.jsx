import React, { useState, useEffect } from 'react';
import { analytics } from '../../utils/analytics';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cufy_cookie_consent');
    if (!saved) {
      setVisible(true);
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
        Cufy uses essential cookies to ensure secure login and minimal privacy-first analytics to improve your intentional matching experience. No tracking across third-party sites.
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
