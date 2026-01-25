// /js/backgrounds.js
// Section background manager (vertical strip)

export function createBackgroundManager(hostEl, {
  slideMs = 520,
  ease = "cubic-bezier(.2,.8,.2,1)",
  order = ["Despre mine", "Lacuri", "Partide", "Acasa", "Galerie", "Contact"],
} = {}) {
  if (!hostEl) return { set() {}, goTo() {}, destroy() {} };

  hostEl.innerHTML = `<div class="bg-strip"></div>`;
  const strip = hostEl.querySelector(".bg-strip");

  // ✅ Most compatible: animate transform
  strip.style.transitionProperty = "transform";
  strip.style.transitionDuration = `${slideMs}ms`;
  strip.style.transitionTimingFunction = ease;
  strip.style.willChange = "transform";

  const panels = new Map();

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

    const y = -i * 100;

    if (immediate) {
      const prev = strip.style.transitionProperty;
      strip.style.transitionProperty = "none";
      strip.style.transform = `translate3d(0, ${y}vh, 0)`;
      strip.offsetHeight; // flush
      strip.style.transitionProperty = prev || "transform";
    } else {
      strip.style.transform = `translate3d(0, ${y}vh, 0)`;
    }
  }

  function set(urlByLabelOrUrl, { immediate = false, label = null } = {}) {
    if (typeof urlByLabelOrUrl === "string" && !label) {
      const el = panels.get(currentLabel);
      if (el) el.style.backgroundImage = `url("${urlByLabelOrUrl}")`;
      applyTranslateFor(currentLabel, { immediate });
      return;
    }

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
    if (!label) return;

    const i = idx(label);
    if (i < 0) return;

    // Re-apply even if same label (prevents drift)
    if (label === currentLabel && !immediate) {
      applyTranslateFor(label, { immediate: false });
      return;
    }

    const my = ++token;
    currentLabel = label;

    if (immediate) {
      applyTranslateFor(label, { immediate: true });
      return;
    }

    applyTranslateFor(label, { immediate: false });

    await new Promise((resolve) => {
      let done = false;

      const cleanup = () => {
        if (done) return;
        done = true;
        strip.removeEventListener("transitionend", onEnd);
        clearTimeout(t);
        resolve();
      };

      const onEnd = (e) => {
        if (e.propertyName !== "transform") return;
        cleanup();
      };

      strip.addEventListener("transitionend", onEnd);
      const t = setTimeout(cleanup, slideMs + 80);
    });

    if (my !== token) return;
  }

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
