const ACCESS_TOKEN_KEY = "accessToken";
const AUTH_EVENT_NAME = "auth-change";

export function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function removeAccessToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function isLoggedIn() {
  return Boolean(getAccessToken());
}

export function subscribeAuth(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener(AUTH_EVENT_NAME, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function getAuthSnapshot() {
  if (typeof window === "undefined") return false;
  return isLoggedIn();
}

export function getAuthServerSnapshot() {
  return false;
}
