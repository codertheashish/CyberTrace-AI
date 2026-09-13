// Demo-only credential gate helpers. Credentials are checked entirely
// client-side — fine for a hackathon/demo gate, NOT real authentication for
// production use (anyone can read the current values from devtools).
//
// Precedence: a custom username/password saved via the in-app Admin Settings
// page (localStorage) always wins over the VITE_ADMIN_USERNAME /
// VITE_ADMIN_PASSWORD build-time env vars, which act as the initial default.

const LS_USER_KEY = 'ct_custom_admin_user';
const LS_PASS_KEY = 'ct_custom_admin_pass';

const ENV_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const ENV_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'cybertrace@2026';

export function getCredentials(): { username: string; password: string; isCustom: boolean } {
  const customUser = localStorage.getItem(LS_USER_KEY);
  const customPass = localStorage.getItem(LS_PASS_KEY);
  if (customUser && customPass) {
    return { username: customUser, password: customPass, isCustom: true };
  }
  return { username: ENV_USERNAME, password: ENV_PASSWORD, isCustom: false };
}

export function setCredentials(username: string, password: string) {
  localStorage.setItem(LS_USER_KEY, username);
  localStorage.setItem(LS_PASS_KEY, password);
}

export function resetCredentials() {
  localStorage.removeItem(LS_USER_KEY);
  localStorage.removeItem(LS_PASS_KEY);
}
