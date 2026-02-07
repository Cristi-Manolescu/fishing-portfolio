// ./mobile/mobileBoot.js
import { startMobileAcasa } from "./sections/acasa.js";
import { startMobileDespre } from "./sections/despre.js";
import { startMobilePartide } from "./sections/partide.js"; // ✅ NEW
import { installBarAnchor } from "./lib/barAnchor.js";

function destroyCtrl(ctrl) {
  try {
    if (!ctrl) return;
    if (typeof ctrl === "function") return ctrl();       // ✅ Acasa style
    if (typeof ctrl.destroy === "function") return ctrl.destroy();
  } catch (_) {}
}

export async function bootMobile({ navigate, onRouteChange, parseHash } = {}) {
  document.documentElement.classList.add("is-mobile");
  document.body.classList.add("is-mobile");

  const cleanupBarAnchor = installBarAnchor({ offsetPx: 10 });

  const root = document.querySelector("#m-root");
  if (!root) throw new Error("bootMobile: missing #m-root");

  let ctrl = null;
  let active = null;

  async function mount(type) {
    const next = String(type || "acasa").toLowerCase();

    if (next === active && ctrl) return;

    destroyCtrl(ctrl);
    ctrl = null;
    root.innerHTML = "";
    active = next;

    if (next === "despre") {
      ctrl = await startMobileDespre({ navigate });
      return;
    }

    if (next === "partide") { // ✅ NEW
      ctrl = await startMobilePartide({ navigate });
      return;
    }

    // safe fallback: anything else -> Acasa (no regressions)
    ctrl = await startMobileAcasa({ navigate });
  }

  // Drive mobile by your real router (preferred)
  if (typeof onRouteChange === "function") {
    const stop = onRouteChange((route) => mount(route?.type || "acasa"));

    // Return a teardown handle (optional)
    return () => {
      try { stop?.(); } catch (_) {}
      destroyCtrl(ctrl);
      cleanupBarAnchor?.();
      root.innerHTML = "";
    };
  }

  // Fallback single-shot
  const r = typeof parseHash === "function" ? parseHash(window.location.hash) : { type: "acasa" };
  await mount(r?.type || "acasa");
  return ctrl;
}
