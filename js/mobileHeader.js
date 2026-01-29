// /js/mobileHeader.js
// Mobile header: floating chips (logo + menu), responsive nav (portrait fullscreen / landscape inline)

export function initMobileHeader({ navigate, onRouteChange, logoSrc } = {}) {
  const enabled = shouldEnableMobile();
  if (!enabled) return { enabled: false, destroy() {} };

  document.body.classList.add("is-mobile");

  // Ensure header exists once
  let header = document.getElementById("m-header");
  if (!header) {
    header = document.createElement("header");
    header.id = "m-header";
    header.className = "m-header";
    document.body.appendChild(header);
  }

  const LOGO_SRC = logoSrc || "./assets/img-m/ui/brand/logo__icon.png";

  header.innerHTML = `
    <div class="m-header__inner">
      <button type="button" class="m-logo" id="m-logo" aria-label="Acasă">
        <img class="m-logo__img" src="${escapeAttr(LOGO_SRC)}" alt="" decoding="async">
      </button>

      <button type="button" class="m-menu" id="m-menu" aria-label="Meniu" aria-expanded="false">
        <span class="m-menu__icon" aria-hidden="true"></span>
      </button>

      <nav class="m-nav" id="m-nav" aria-label="Navigație">
        <button type="button" class="m-nav__close" id="m-nav-close" aria-label="Închide meniul">×</button>

        <button type="button" class="m-nav__btn" data-label="Despre mine">Despre</button>
        <button type="button" class="m-nav__btn" data-label="Partide">Partide</button>
        <button type="button" class="m-nav__btn" data-label="Galerie">Galerie</button>
        <button type="button" class="m-nav__btn" data-label="Contact">Contact</button>
      </nav>
    </div>
  `;

  const logoBtn = header.querySelector("#m-logo");
  const menuBtn = header.querySelector("#m-menu");
  const nav = header.querySelector("#m-nav");
  const closeBtn = header.querySelector("#m-nav-close");

  // Expose header height via CSS var (still safe if you later use it)
  const applyHeaderH = () => {
    const h = header.getBoundingClientRect().height || 56;
    document.documentElement.style.setProperty("--m-header-h", `${Math.round(h)}px`);
  };
  applyHeaderH();

  const isOpen = () => document.body.classList.contains("m-menu-open");

  function closeMenu() {
    document.body.classList.remove("m-menu-open");
    menuBtn?.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    const next = !isOpen();
    document.body.classList.toggle("m-menu-open", next);
    menuBtn?.setAttribute("aria-expanded", next ? "true" : "false");
  }

  // --- Events ---

  // Menu toggle
  const onMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  };

  // Close "X"
  const onCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
  };

  // Tap outside / empty overlay area to close
  const onDocClick = (e) => {
    if (!isOpen()) return;

    // If clicked a nav button, let nav handler manage (and close after)
    const clickedBtn = e.target.closest?.(".m-nav__btn, .m-nav__close, #m-menu, #m-logo");
    if (clickedBtn) return;

    // If click happened inside the fullscreen nav (glass area), close
    if (nav && nav.contains(e.target)) {
      closeMenu();
      return;
    }

    // If click is elsewhere in the document, also close
    closeMenu();
  };

  // Close on scroll (mobile will be the real test, but safe)
  const onScroll = () => {
    if (isOpen()) closeMenu();
  };

  // ESC close (desktop testing)
  const onKeyDown = (e) => {
    if (e.key === "Escape") closeMenu();
  };

  // Logo click: go Acasa + scroll to top
  const onLogoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (typeof navigate === "function") navigate("#/acasa");
      else window.location.hash = "#/acasa";
    } catch {}

    const se = document.scrollingElement || document.documentElement;
    se.scrollTo({ top: 0, behavior: "smooth" });

    closeMenu();
  };

  // Buttons inert for now, but close menu on tap
  const onNavClick = (e) => {
    const btn = e.target.closest?.(".m-nav__btn");
    if (!btn) return;
    // no-op navigation for now
    closeMenu();
  };

  const onResize = () => applyHeaderH();

  menuBtn?.addEventListener("click", onMenuClick);
  closeBtn?.addEventListener("click", onCloseClick);
  logoBtn?.addEventListener("click", onLogoClick);
  nav?.addEventListener("click", onNavClick);

  document.addEventListener("click", onDocClick);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);

  // Keep menu closed on route change (safe)
  if (typeof onRouteChange === "function") {
    onRouteChange(() => closeMenu());
  }

  return {
    enabled: true,
    destroy() {
      menuBtn?.removeEventListener("click", onMenuClick);
      closeBtn?.removeEventListener("click", onCloseClick);
      logoBtn?.removeEventListener("click", onLogoClick);
      nav?.removeEventListener("click", onNavClick);

      document.removeEventListener("click", onDocClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    },
  };
}

function shouldEnableMobile() {
  try {
    const qs = new URLSearchParams(location.search);
    if (qs.get("mobile") === "1") return true;
    if (qs.get("mobile") === "0") return false;
  } catch {}
  return window.matchMedia?.("(max-width: 820px)")?.matches ?? false;
}

function escapeAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
