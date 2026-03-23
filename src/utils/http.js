export async function safeJson(response) {
  const text = await response.text();
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) {
    throw new Error("Empty response body");
  }
  return JSON.parse(cleaned);
}

export function normalizeMediaUrl(url) {
  if (!url) return url;
  const origin = window.location.origin;
  return url.replace(/^https?:\/\/localhost(:\d+)?/i, origin);
}
