// ./js/mobile/mobilePartideLake.js

import { resolvePartideLakeById } from "../content.js";
import { installHeroParallax } from "./lib/parallax.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function mobilePartideLake({ mountId = "m-root", navigate, scroller, groupId } = {}) {
  const root = document.getElementById(mountId);
  if (!root) throw new Error("mobilePartideLake: missing mount");

  const lake = resolvePartideLakeById(groupId);
  if (!lake) {
    root.innerHTML = `
      <section id="m-partide" class="m-partide">
        <div class="m-panel">
          <div class="m-hero-cap">
            <p class="m-hero-title">Partide</p>
            <div class="m-hero-hint">Lake not found: ${esc(groupId)}</div>
          </div>
        </div>
      </section>
    `;
    return { els: { screen2: root.querySelector(".m-panel") }, api: {}, destroy(){ root.innerHTML=""; } };
  }

  root.innerHTML = `
    <section id="m-partide" class="m-partide">

      <div class="m-panel" id="m-partide-lake-s1">
        <div class="m-hero-cap">
          <p class="m-hero-title">${esc(lake.title)}</p>
          <div class="m-hero-hint">Alege o partidă ↓</div>
        </div>
        <div class="m-down" aria-hidden="true">↓</div>
      </div>

      <div class="m-panel m-feed-panel" id="m-partide-lake-s2">
        <div class="m-feed" id="m-partide-feed">
          ${(lake.subs || []).map((s) => `
            <article class="m-hero-card">
              <button type="button" class="m-hero-btn"
                data-group="${esc(lake.id)}"
                data-sub="${esc(s.id)}">
                <div class="m-hero-media">
                  <img src="${esc(s.heroImg || "")}" alt="" loading="lazy" decoding="async">
                </div>
                <div class="m-hero-cap">
                  <p class="m-hero-title">${esc(s.title)}</p>
                  <div class="m-hero-hint">Tap pentru articol →</div>
                </div>
              </button>
            </article>
          `).join("")}
        </div>
      </div>

      <div class="m-panel" id="m-partide-lake-s3">
        <div class="m-hero-cap">
          <p class="m-hero-title">Contact</p>
          <div class="m-hero-hint">Social media + email (urmează)</div>
        </div>
      </div>

    </section>
  `;

  const els = {
    section: root.querySelector("#m-partide"),
    screen2: root.querySelector("#m-partide-lake-s2"),
    feedPanel: root.querySelector("#m-partide-lake-s2"),
  };

  // ✅ parallax only on lake page sessions list
  const cleanupParallax = installHeroParallax(els.feedPanel, { scroller });

  const onClick = (e) => {
    const btn = e.target.closest?.(".m-hero-btn");
    if (!btn) return;

    const g = btn.getAttribute("data-group");
    const sub = btn.getAttribute("data-sub");
    if (!g || !sub) return;

    navigate?.({ type: "partide", groupId: g, subId: sub });
  };

  els.section?.addEventListener("click", onClick);

  return {
    els,
    api: { cleanupParallax },
    destroy() {
      els.section?.removeEventListener("click", onClick);
      cleanupParallax?.();
      root.innerHTML = "";
    },
  };
}
