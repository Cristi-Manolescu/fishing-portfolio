// /js/mobileFeed.js
// Step 2A: Create a mobile content root and render a placeholder Acasa feed.
// No data wiring yet (content.js later). No observers. No heavy logic.

export function ensureMobileRoot() {
  let root = document.getElementById("m-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "m-root";
    root.className = "m-root";
    document.body.appendChild(root);
  }
  return root;
}

export function renderAcasaPlaceholder() {
  const root = ensureMobileRoot();

  root.innerHTML = `
    <section class="m-section" id="m-acasa">
      <div class="m-text">
        <div style="color: var(--m-accent); font-weight:600; letter-spacing:0.2px;">Acasa</div>
        <p style="margin:10px 0 0;">
          (Step 2A) Aici va fi: banner carousel + text intro + 6 hero cards.
        </p>
      </div>

      <div class="m-hero">
        <button type="button" id="m-hero-demo">
          <img src="./assets/thumbs/demo.jpg" alt="">
          <div class="m-hero-meta">
            <div class="m-hero-title">Demo hero (click → deep-link)</div>
            <div class="m-hero-sub">Folosim doar thumb/hero — fara full-res aici</div>
          </div>
        </button>
      </div>
    </section>
  `;

  // Demo click: route to a known location (replace later)
  root.querySelector("#m-hero-demo")?.addEventListener("click", () => {
    location.hash = "#/despre/demo";
  });
}
