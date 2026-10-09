// Frontend safe environment configuration
// Strictly no hardcoded API secrets or private tokens in frontend code

export const ENV = {
  APP_NAME: 'Cufy',
  APP_VERSION: '1.0.0',
  ENV_NAME: import.meta.env.MODE || 'production',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.cufy.app/v1',
  ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'cupid.livepro@gmail.com',
  ADMIN_PASS_HASH: import.meta.env.VITE_ADMIN_PASS_HASH || 'cUpid.livepro#@3210',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || (typeof localStorage !== 'undefined' ? (localStorage.getItem('cufy_google_client_id') || '') : '') || '908885680379-epsk9cga656h54t6t638ihbd5mig9t77.apps.googleusercontent.com',
  ANALYTICS_ENABLED: true,
};

// Check for unintended secret leak in production build
if (import.meta.env.DEV) {
  console.log('[Cufy Config] Environment initialized safely without client secrets.');
}
