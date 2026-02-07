// /js/router.js

export function parseHash(hash = window.location.hash) {
  const h = String(hash || "").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);

  if (!parts.length) return { type: "acasa" };

  const [root, a, b] = parts;

  if (root === "acasa") return { type: "acasa" };
  if (root === "galerie") return { type: "galerie" };
  if (root === "contact") return { type: "contact" };

  if (root === "despre") {
    const subId = a ? decodeURIComponent(a) : null;
    return subId ? { type: "despre", subId } : { type: "despre" };
  }

if (root === "partide") {
  const groupId = a ? decodeURIComponent(a) : null;
  const subId   = b ? decodeURIComponent(b) : null;

  if (groupId && subId) return { type: "partide", groupId, subId };
  if (groupId) return { type: "partide", groupId }; // group-only
  return { type: "partide" }; // home
}

  return { type: "acasa" };
}

export function toHash(target) {
  if (!target || target.type === "acasa") return "#/acasa";
  if (target.type === "galerie") return "#/galerie";
  if (target.type === "contact") return "#/contact";

  if (target.type === "despre") {
    return target.subId
      ? `#/despre/${encodeURIComponent(target.subId)}`
      : "#/despre";
  }

if (target.type === "partide") {
  if (target.groupId && target.subId) {
    return `#/partide/${encodeURIComponent(target.groupId)}/${encodeURIComponent(target.subId)}`;
  }
  if (target.groupId) {
    return `#/partide/${encodeURIComponent(target.groupId)}`;
  }
  return "#/partide";
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
