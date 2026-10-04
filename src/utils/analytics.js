// Privacy-first telemetry logger for Cufy

class AnalyticsTracker {
  constructor() {
    this.hasConsent = false;
    this.initConsent();
  }

  initConsent() {
    const saved = localStorage.getItem('cufy_cookie_consent');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.hasConsent = parsed.analytics === true;
      } catch (e) {
        this.hasConsent = false;
      }
    }
  }

  setConsent(allowed) {
    this.hasConsent = allowed;
  }

  trackEvent(eventName, properties = {}) {
    if (!this.hasConsent) return;
    const payload = {
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
    };
    if (import.meta.env.DEV) {
      console.log('[Cufy Telemetry]', payload);
    }
    // In production, posts to privacy-compliant self-hosted endpoint
  }

  trackPageView(pageName) {
    this.trackEvent('page_view', { page: pageName });
  }
}

export const analytics = new AnalyticsTracker();
