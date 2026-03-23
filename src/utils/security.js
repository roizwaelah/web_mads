export function sanitizePlainText(value) {
  return (value ?? "")
    .toString()
    .replace(/[<>"'`\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateUsername(value) {
  const username = sanitizePlainText(value);
  return /^[a-zA-Z0-9._@-]{3,50}$/.test(username);
}

export function validateStrongPassword(value) {
  const text = (value ?? "").toString();
  if (text.length < 8) return false;
  const hasLower = /[a-z]/.test(text);
  const hasUpper = /[A-Z]/.test(text);
  const hasNumber = /\d/.test(text);
  return hasLower && hasUpper && hasNumber;
}
