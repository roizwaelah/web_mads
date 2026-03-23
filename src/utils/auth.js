const AUTH_STORAGE_KEY = "cp_auth_session_v1";
const LOGIN_ATTEMPT_KEY = "cp_login_attempt_v1";
const ACTIVITY_LOG_KEY = "cp_activity_log_v1";

function parseTokenPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

export function isJwtExpired(token) {
  const payload = parseTokenPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

function getStorage(rememberMe = false) {
  return rememberMe ? localStorage : sessionStorage;
}

export function saveAuthSession(session, rememberMe = false) {
  const safeSession = {
    token: session?.token || "",
    user: session?.user || null,
    rememberMe: Boolean(rememberMe),
  };
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  getStorage(rememberMe).setItem(AUTH_STORAGE_KEY, JSON.stringify(safeSession));
}

export function getAuthSession() {
  const raw =
    sessionStorage.getItem(AUTH_STORAGE_KEY) ||
    localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.token || isJwtExpired(parsed.token)) {
      clearAuthSession();
      return null;
    }
    return parsed;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getLoginAttempt() {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_ATTEMPT_KEY) || "{}");
  } catch {
    return {};
  }
}

export function registerFailedLogin(maxAttempts = 5, lockMinutes = 15) {
  const current = getLoginAttempt();
  const now = Date.now();
  const failedAttempts = Number(current.failedAttempts || 0) + 1;
  const next = {
    failedAttempts,
    lockedUntil:
      failedAttempts >= maxAttempts ? now + lockMinutes * 60 * 1000 : 0,
    lastFailedAt: now,
  };
  localStorage.setItem(LOGIN_ATTEMPT_KEY, JSON.stringify(next));
  return next;
}

export function resetFailedLogin() {
  localStorage.removeItem(LOGIN_ATTEMPT_KEY);
}

export function isLoginLocked() {
  const state = getLoginAttempt();
  const lockedUntil = Number(state.lockedUntil || 0);
  if (!lockedUntil) return { locked: false, lockedUntil: 0 };
  if (Date.now() >= lockedUntil) {
    resetFailedLogin();
    return { locked: false, lockedUntil: 0 };
  }
  return { locked: true, lockedUntil };
}

export function addActivityLog(action, detail = "") {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const next = [
      {
        at: new Date().toISOString(),
        action,
        detail,
      },
      ...existing,
    ].slice(0, 200);
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function getActivityLogs() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}
