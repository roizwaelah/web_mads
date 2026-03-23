function ensureMetaTag(selector, attrs) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    Object.keys(attrs).forEach((key) => {
      tag.setAttribute(key, attrs[key]);
    });
    document.head.appendChild(tag);
  }
  return tag;
}

function ensureLinkTag(rel) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  return tag;
}

export function setCanonical(url) {
  const tag = ensureLinkTag("canonical");
  tag.setAttribute("href", url);
}

export function setMetaContent(name, content) {
  const tag = ensureMetaTag(`meta[name="${name}"]`, { name });
  tag.setAttribute("content", content);
}

export function setMetaProperty(property, content) {
  const tag = ensureMetaTag(`meta[property="${property}"]`, { property });
  tag.setAttribute("content", content);
}

export function setSeoMeta({ title, description, image, url, type }) {
  if (title) document.title = title;
  if (description) {
    setMetaContent("description", description);
    setMetaProperty("og:description", description);
    setMetaContent("twitter:description", description);
  }
  if (image) {
    setMetaProperty("og:image", image);
    setMetaContent("twitter:image", image);
  }
  if (url) {
    setMetaProperty("og:url", url);
    setCanonical(url);
  }
  setMetaProperty("og:type", type || "website");
  if (title) {
    setMetaProperty("og:title", title);
    setMetaContent("twitter:title", title);
  }
  setMetaContent("twitter:card", "summary_large_image");
}

export function setJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = id;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}
