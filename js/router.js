// /js/router.js
export function parseHash(hash = window.location.hash) {
  const h = String(hash || "").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);

  if (!parts.length) return { type: "acasa" };

  const [root, a] = parts;

  if (root === "acasa") return { type: "acasa" };
  if (root === "galerie") return { type: "galerie" };
  if (root === "contact") return { type: "contact" };

  // ✅ section home routes
  if (root === "despre") return a ? { type: "despre", subId: decodeURIComponent(a) } : { type: "despre" };
  if (root === "partide") return a ? { type: "partide", subId: decodeURIComponent(a) } : { type: "partide" };

  return { type: "acasa" };
}


export function toHash(target) {
  if (!target || target.type === "acasa") return "#/acasa";
  if (target.type === "galerie") return "#/galerie";
  if (target.type === "contact") return "#/contact";

  if (target.type === "despre") {
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
