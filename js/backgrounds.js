// /js/backgrounds.js
// Section background manager (vertical strip)

export function createBackgroundManager(hostEl, {
  slideMs = 520,
  ease = "cubic-bezier(.2,.8,.2,1)",
  order = ["Despre mine", "Lacuri", "Acasa", "Partide", "Contact"],
} = {}) {
  if (!hostEl) return { set() {}, goTo() {}, destroy() {} };

  hostEl.innerHTML = `
    <div class="bg-strip"></div>
  `;

  const strip = hostEl.querySelector(".bg-strip");
  strip.style.transitionDuration = `${slideMs}ms`;
  strip.style.transitionTimingFunction = ease;

  const panels = new Map();

  // build panels once
  strip.innerHTML = order
    .map((label) => {
      const cls = labelToClass(label);
      return `<div class="bg-panel ${cls}" data-label="${escapeHtml(label)}"></div>`;
    })
    .join("");

  strip.querySelectorAll(".bg-panel").forEach((el) => {
    panels.set(el.getAttribute("data-label"), el);
  });

  let currentLabel = order[0];
  let token = 0;

  function idx(label) {
    return order.indexOf(label);
  }

  function applyTranslateFor(label, { immediate = false } = {}) {
    const i = idx(label);
    if (i < 0) return;

    // translateY is negative: move strip up to show lower panels
    const y = -i * 100;

    if (immediate) {
      // temporarily disable transition for a single paint
      const prev = strip.style.transitionProperty;
      strip.style.transitionProperty = "none";
      strip.style.translate = `0 ${y}vh`;
      // force style flush
      strip.offsetHeight; // eslint-disable-line no-unused-expressions
      strip.style.transitionProperty = prev || "translate";
    } else {
      strip.style.translate = `0 ${y}vh`;
    }
  }

  // Set image for a label (boot / preload)
  function set(urlByLabelOrUrl, { immediate = false, label = null } = {}) {
    // Supports old usage: set(url, {immediate:true}) by treating it as current panel bg
    if (typeof urlByLabelOrUrl === "string" && !label) {
      const el = panels.get(currentLabel);
      if (el) el.style.backgroundImage = `url("${urlByLabelOrUrl}")`;
      applyTranslateFor(currentLabel, { immediate });
      return;
    }

    // New usage: set({label:url...}) OR set(url, {label:"Acasa"})
    if (label) {
      const el = panels.get(label);
      if (el) el.style.backgroundImage = `url("${urlByLabelOrUrl}")`;
      return;
    }

    if (urlByLabelOrUrl && typeof urlByLabelOrUrl === "object") {
      for (const [lbl, url] of Object.entries(urlByLabelOrUrl)) {
        const el = panels.get(lbl);
        if (el) el.style.backgroundImage = `url("${url}")`;
      }
    }
  }

  async function goTo(label, { immediate = false } = {}) {
    if (!label || label === currentLabel) return;

    const my = ++token;
    currentLabel = label;

    if (immediate) {
      applyTranslateFor(label, { immediate: true });
      return;
    }

    // animate
    applyTranslateFor(label, { immediate: false });

    await new Promise((resolve) => {
      const done = (e) => {
        if (e.propertyName !== "translate") return;
        strip.removeEventListener("transitionend", done);
        resolve();
      };
      strip.addEventListener("transitionend", done);
    });

    if (my !== token) return;
  }

  // expose the order so callers can use it if they want
  return {
    order,
    set,
    goTo,
    destroy() {
      token++;
      hostEl.innerHTML = "";
    }
  };
}

function labelToClass(label) {
  return "bg-" + label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
