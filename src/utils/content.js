export function slugifyTitle(value) {
  return (value || "")
    .toString()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractImageFromHtml(html) {
  if (!html) return "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return match?.[1] || "";
}

export function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveItemBySlug(items, slug, fallbackId) {
  const list = Array.isArray(items) ? items : [];
  return list.find((item) => {
    const itemSlug = item?.slug || slugifyTitle(item?.title);
    if (slug && itemSlug === slug) return true;
    if (fallbackId && item?.id?.toString() === fallbackId.toString()) return true;
    return false;
  });
}
