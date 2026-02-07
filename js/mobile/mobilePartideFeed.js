// ./js/mobile/mobilePartideFeed.js
import { hashFromTarget } from "../content.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Minimal Partide FEED placeholder.
 * Later: Screen 1 bg only, Screen 2 repeating lake blocks, Screen 3 contact.
 */
export async function mobilePartideFeed({ mountId = "m-root", navigate, scroller, groupId = null } = {}) {
  const root = document.getElementById(mountId);
  if (!root) throw new Error("mobilePartideFeed: missing mount");

  root.innerHTML = `
    <section id="m-partide">

      <div class="m-panel" id="m-partide-s1">
        <div class="m-down" aria-hidden="true">↓</div>
      </div>

      <div class="m-panel" id="m-partide-s2">
        <div class="m-hero-cap">
          <p class="m-hero-title">Partide</p>
          <div class="m-hero-hint">
            Feed mounted ✅ ${groupId ? `(focus: ${esc(groupId)})` : ""}
          </div>

          <!-- demo: one clickable card -->
          <button class="m-hero-btn" type="button"
            data-target='${esc(JSON.stringify({ type: "partide", groupId: "ozone", subId: "ozone_s01" }))}'>
            <div class="m-hero-hint">Open demo article →</div>
          </button>
        </div>

        <div class="m-down" aria-hidden="true">↓</div>
      </div>

      <div class="m-panel" id="m-partide-s3">
        <div class="m-hero-cap">
          <p class="m-hero-title">Contact</p>
          <div class="m-hero-hint">(urmează)</div>
        </div>
      </div>

    </section>
  `;

  const els = {
    section: root.querySelector("#m-partide"),
    // treat Screen 2 as “free scroll” zone later if needed
    feedPanel: root.querySelector("#m-partide-s2"),
  };

  const onClick = (e) => {
    const btn = e.target.closest?.(".m-hero-btn");
    if (!btn) return;

    let target = null;
    try { target = JSON.parse(btn.getAttribute("data-target") || "null"); } catch {}
    if (!target) return;

    // Prefer object navigate if your router supports it; otherwise set hash.
    if (typeof navigate === "function") navigate(target);
    else window.location.hash = hashFromTarget(target);
  };

  els.section?.addEventListener("click", onClick);

  return {
    els,
    api: {},
    destroy() {
      els.section?.removeEventListener("click", onClick);
      root.innerHTML = "";
    },
  };
}
