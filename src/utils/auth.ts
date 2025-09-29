export function isLoggedIn() {
  const token = localStorage.getItem("access_token");
  const expiry = localStorage.getItem("access_token_expiry");

  if (!token || !expiry) return false;

  const now = Math.floor(Date.now() / 1000);
  return now < parseInt(expiry, 10); // valid if now < expiry
}

export function login(token: string, expiresIn: number) {
  const expiry = Math.floor(Date.now() / 1000) + expiresIn; // seconds
  localStorage.setItem("access_token", token);
  localStorage.setItem("access_token_expiry", expiry.toString());
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("access_token_expiry");
}
