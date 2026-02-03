// /js/router.js
export function parseHash(hash = window.location.hash) {
  const h = String(hash || "").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);

  if (!parts.length) return { type: "acasa" };

  const [root, a, b] = parts; // ✅ allow 3rd segment

  if (root === "acasa") return { type: "acasa" };
  if (root === "galerie") return { type: "galerie" };
  if (root === "contact") return { type: "contact" };

  // ✅ section home routes
  if (root === "despre") {
    const subId = a ? decodeURIComponent(a) : null;
    const articleId = b ? decodeURIComponent(b) : null;
    if (subId && articleId) return { type: "despre", subId, articleId };
    return subId ? { type: "despre", subId } : { type: "despre" };
  }

  if (root === "partide") {
    const subId = a ? decodeURIComponent(a) : null;
    // (leave articleId for Partide later if needed)
    return subId ? { type: "partide", subId } : { type: "partide" };
  }

  return { type: "acasa" };
}

export function toHash(target) {
  if (!target || target.type === "acasa") return "#/acasa";
  if (target.type === "galerie") return "#/galerie";
  if (target.type === "contact") return "#/contact";

  if (target.type === "despre") {
    if (target.subId && target.articleId) {
      return `#/despre/${encodeURIComponent(target.subId)}/${encodeURIComponent(target.articleId)}`;
    }
    return target.subId ? `#/despre/${encodeURIComponent(target.subId)}` : "#/despre";
  }

  if (target.type === "partide") {
    return target.subId ? `#/partide/${encodeURIComponent(target.subId)}` : "#/partide";
  }

  return "#/acasa";
}

export function navigate(target) {
  const next = toHash(target);

  if (window.location.hash === next) {
    window.dispatchEvent(new Event("hashchange"));
    return;
  }

  window.location.hash = next;
}

export function onRouteChange(cb) {
  const handler = () => cb(parseHash());
  window.addEventListener("hashchange", handler);
  handler();
  return () => window.removeEventListener("hashchange", handler);
}
