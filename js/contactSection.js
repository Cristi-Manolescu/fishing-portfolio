// /js/contactSection.js
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


import { createContactFormCard } from "./widgets/contactFormCard.js";
import { createContactSocialIcons } from "./widgets/contactSocialIcons.js";

export function createContactSection(stageEl, opts = {}) {
  if (!stageEl) throw new Error("createContactSection: stageEl missing");

  const {
    emailTo = "cristi_manolescu86@yahoo.com",
    socials = { facebook: "https://www.facebook.com/ShyshyBMF?locale=ro_RO", instagram: "https://www.instagram.com/cristianmihaimanolescu/", youtube: "", github: "" },
  } = opts;

  let formApi = null;
  let socialsApi = null;


function ensureContactSocialMount() {
  let el = document.getElementById("contact-socials");
  if (el) return el;

  const bottom = document.getElementById("bottom-content");
  if (!bottom) return null;

  el = document.createElement("div");
  el.id = "contact-socials";
  el.className = "contact-socials";
  bottom.appendChild(el);
  return el;
}

function enter() {
  // Mid panel
  stageEl.innerHTML = "";
  formApi = createContactFormCard(stageEl, { emailTo });

  // Bottom holder icons (use dedicated mount; NEVER wipe bottom-content)
  const mount = ensureContactSocialMount();
  if (mount) {
    mount.innerHTML = "";
    console.log("[Contact] socials passed to icons:", socials);
    socialsApi = createContactSocialIcons(mount, { socials });
  }
}

function leave() {
  formApi?.destroy?.();
  socialsApi?.destroy?.();
  formApi = null;
  socialsApi = null;

  stageEl.innerHTML = "";

  const mount = document.getElementById("contact-socials");
  if (mount) mount.innerHTML = ""; // clear ONLY our mount
}

return { enter, leave };
}
