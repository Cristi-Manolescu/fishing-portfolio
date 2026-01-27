// /js/widgets/contactSocialIcons.js
/**
 * ============================================================
 * CONTACT SECTION — LOCKED
 * ============================================================
 *
 * Status:
 * ✔ Visual design final
 * ✔ Geometry final
 * ✔ Button behavior final
 * ✔ Tooltips final
 * ✔ Social icons final
 *
 * DO NOT REFACTOR without explicit intent.
 * Only minor copy / link updates allowed.
 *
 * Locked on: 2026-01-27
 * Tag: v1.5-contact-complete
 */

function elFromHTML(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function normalizeUrl(v) {
  const s = String(v || "").trim();
  return s && s !== "#" ? s : "";
}

function iconSvg(key) {
  // Your existing SVGs (keep whatever you already had)
  switch (key) {
    case "facebook":
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3H13.5V9.1c0-.9.3-1.6 1.6-1.6h1.6V4.7c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6V11H7v3h2.9v8h3.6z"></path></svg>`;
    case "instagram":
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5zM18 6.8a1.2 1.2 0 1 1-1.2 1.2A1.2 1.2 0 0 1 18 6.8z"></path></svg>`;
    case "youtube":
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z"></path></svg>`;
    case "github":
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.9.6-3.5-1.2-3.5-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.5 1.1 3.1.8.1-.7.4-1.1.7-1.3-2.3-.3-4.8-1.1-4.8-5.2 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.3.1-2.8 0 0 .9-.3 3 .1a10.3 10.3 0 0 1 5.5 0c2.1-.4 3-.1 3-.1.6 1.5.2 2.5.1 2.8.7.8 1.1 1.8 1.1 3 0 4.1-2.5 4.9-4.8 5.2.4.3.7 1 .7 2v3c0 .3.2.6.7.5A10 10 0 0 0 12 2z"></path></svg>`;
    default:
      return "";
  }
}

export function createContactSocialIcons(mountEl, { socials }) {
  if (!mountEl) throw new Error("createContactSocialIcons: mountEl missing");
  if (!socials) throw new Error("createContactSocialIcons: socials missing");

const s = socials || {};
const pick = (...keys) => {
  for (const k of keys) {
    const v = normalizeUrl(s[k]);
    if (v) return v;
  }
  return "";
};

const items = [
  { key: "facebook",  label: "Facebook",  href: pick("facebook", "fb", "face", "facebookUrl") },
  { key: "instagram", label: "Instagram", href: pick("instagram", "ig", "insta", "instagramUrl") },
  { key: "youtube",   label: "YouTube",   href: pick("youtube", "yt", "youtubeUrl") },
  { key: "github",    label: "GitHub",    href: pick("github", "gh", "githubUrl") },
];


  const root = elFromHTML(`
    <nav id="contact-socials" class="contact-socials" aria-label="Social media">
      ${items
        .map((it) => {
          const disabled = !it.href;
          const attrs = disabled
            ? `href="#" aria-disabled="true" tabindex="-1" data-disabled="true" title="În curând"`
            : `href="${it.href}" data-disabled="false" target="_blank" rel="noopener noreferrer"`;
          return `
            <a class="contact-social" ${attrs} aria-label="${it.label}">
              <span class="contact-social-ico">${iconSvg(it.key)}</span>
            </a>
          `;
        })
        .join("")}
    </nav>
  `);

  mountEl.appendChild(root);

  function onClick(e) {
    const a = e.target.closest?.("a.contact-social");
    if (!a) return;

    // prevent "#" navigation for disabled ones
    if (a.dataset.disabled === "true") {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  root.addEventListener("click", onClick);

  return {
    destroy() {
      root.removeEventListener("click", onClick);
      root.remove();
    },
  };
}
