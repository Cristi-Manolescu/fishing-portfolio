// /js/sections/contact.js

import { createContactFormCard } from "../widgets/contactFormCard.js";
import { createContactSocialIcons } from "../widgets/contactSocialIcons.js";

export function createContactSection(opts = {}) {
  const {
    emailTo = "cristi_manolescu86@yahoo.com",
    socials = { facebook: null, instagram: null, youtube: null, github: null },
  } = opts;

  let formWidget = null;
  let socialsWidget = null;

  function mount() {
    const midMount = document.getElementById("contact-stage");
    const bottomMount = document.getElementById("bottom-content");

    if (!midMount) throw new Error("Contact: missing #contact-stage");
    if (!bottomMount) throw new Error("Contact: missing #bottom-content");

    midMount.innerHTML = "";
    bottomMount.innerHTML = "";

    formWidget = createContactFormCard(midMount, { emailTo });
    socialsWidget = createContactSocialIcons(bottomMount, { socials });
  }

  function unmount() {
    formWidget?.destroy?.();
    socialsWidget?.destroy?.();
    formWidget = null;
    socialsWidget = null;
  }

  return { mount, unmount };
}
