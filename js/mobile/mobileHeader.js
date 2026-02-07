// /js/mobile/mobileHeader.js
// Mobile header: floating chips (logo + menu), responsive nav (portrait fullscreen / landscape inline)
// + ✅ Unified topbar (back/title/gallery) = single source of truth for ALL sections/articles.

let _navigate = null;

// internal state
let _state = {
  accent: "rgba(255,255,255,0)",

  // ✅ new: theme bar shadow/filter class name (e.g. "bar-shadow-partide")
  barFilter: "",

  showBack: false,
  backLabel: "",
  backTarget: null,

  showTitle: true,
  title: "",

  showGallery: false,
  galleryOpen: false,
};

let _els = null;

export function setMobileHeaderState(next = {}) {
  _state = { ..._state, ...(next || {}) };
  applyState();
}

export function resetMobileHeaderState() {
  _state = {
    accent: "rgba(255,255,255,0)",
    barFilter: "",
    showBack: false,
    backLabel: "",
    backTarget: null,
    showTitle: true,
    title: "",
    showGallery: false,
    galleryOpen: false,
  };
  applyState();
}

export function initMobileHeader({ navigate, onRouteChange, logoSrc } = {}) {
  if (document.getElementById("m-root")?.contains(document.getElementById("m-header"))) {
    throw new Error("m-header MUST NOT be inside #m-root");
  }

  const enabled = shouldEnableMobile();
  if (!enabled) return { enabled: false, destroy() {} };

  _navigate = typeof navigate === "function" ? navigate : null;

  document.body.classList.add("is-mobile");
  // ✅ hard reset any stuck state from a refresh
  document.body.classList.remove("m-menu-open");

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
    <!-- Logo -->
    <button type="button" class="m-logo" id="m-logo" aria-label="Acasă">
      <img
        class="m-logo__img"
        src="${escapeAttr(LOGO_SRC)}"
        alt=""
        decoding="async"
      >
    </button>

    <!-- Burger (portrait only) -->
    <button
      type="button"
      class="m-menu"
      id="m-menu"
      aria-label="Meniu"
      aria-expanded="false"
    >
      <span class="m-menu__icon" aria-hidden="true"></span>
    </button>

    <!-- ✅ Unified topbar -->
    <div
      class="m-topbar"
      id="m-topbar"
      data-accent
      style="--bar-accent: rgba(255,255,255,0)"
    >
      <div class="m-topbar__inner">
        <!-- Back -->
        <button
          class="m-topbar__btn m-topbar__back"
          id="m-topbar-back"
          type="button"
        >
          Back
        </button>

        <!-- Title -->
        <div class="m-topbar__title" id="m-topbar-title"></div>

        <!-- ✅ Inline nav slot (LANDSCAPE ONLY via CSS) -->
        <div
          class="m-topbar__nav"
          id="m-topbar-nav"
          aria-label="Navigație"
        ></div>

        <!-- Gallery toggle -->
        <button
          class="m-topbar__btn m-topbar__gallery"
          id="m-topbar-gallery"
          type="button"
          aria-label="Foto"
        >
          <span class="m-topbar__galleryFoto">Foto</span>
          <span class="m-topbar__galleryX" aria-hidden="true">✕</span>
        </button>
      </div>
    </div>

    <!-- Portrait fullscreen menu (UNCHANGED) -->
    <nav class="m-nav" id="m-nav" aria-label="Navigație">
      <button
        type="button"
        class="m-nav__close"
        id="m-nav-close"
        aria-label="Închide meniul"
      >
        ×
      </button>

      <button type="button" class="m-nav__btn" data-label="Despre mine">
        Despre
      </button>
      <button type="button" class="m-nav__btn" data-label="Partide">
        Partide
      </button>
      <button type="button" class="m-nav__btn" data-label="Galerie">
        Galerie
      </button>
      <button type="button" class="m-nav__btn" data-label="Contact">
        Contact
      </button>
    </nav>
  </div>
`;

  const logoBtn = header.querySelector("#m-logo");
  const menuBtn = header.querySelector("#m-menu");
  const nav = header.querySelector("#m-nav");
  const closeBtn = header.querySelector("#m-nav-close");

  _els = {
    header,
    logoBtn,
    menuBtn,
    nav,
    closeBtn,
    topbar: header.querySelector("#m-topbar"),
    topbarBack: header.querySelector("#m-topbar-back"),
    topbarTitle: header.querySelector("#m-topbar-title"),
    topbarGallery: header.querySelector("#m-topbar-gallery"),
    topbarNav: header.querySelector("#m-topbar-nav"),
  };

  // ✅ Inline nav: clone portrait menu buttons into the topbar slot (landscape UI)
  const topbarNav = _els.topbarNav;
  const buildInlineNav = () => {
    if (!topbarNav) return;

    topbarNav.innerHTML = "";

    const btns = header.querySelectorAll("#m-nav .m-nav__btn");
    btns.forEach((b) => {
      const clone = b.cloneNode(true);
      clone.classList.add("m-topbar__navBtn");
      topbarNav.appendChild(clone);
    });
  };
  buildInlineNav();

  // Expose header height via CSS var
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

  // If portrait menu is open and we switch to landscape, force close it
  const mqLandscape = window.matchMedia?.("(orientation: landscape)") || null;

  const syncMenuForOrientation = () => {
    const isLandscape = mqLandscape ? mqLandscape.matches : (window.innerWidth > window.innerHeight);
    if (isLandscape && isOpen()) closeMenu();
  };

  // --- Header bar events ---
  const onTopbarClick = (e) => {
    // Back
    if (e.target.closest("#m-topbar-back")) {
      const t = _state?.backTarget;
      if (t && _navigate) _navigate(t);
      return;
    }

    // Gallery toggle => dispatch event (article view listens)
    if (e.target.closest("#m-topbar-gallery")) {
      const nextOpen = !_state.galleryOpen;
      setMobileHeaderState({ galleryOpen: nextOpen });

      window.dispatchEvent(
        new CustomEvent("m:gallery-toggle", { detail: { open: nextOpen } })
      );
      return;
    }
  };

  const onMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  };

  const onCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
  };

  const onDocClick = (e) => {
    if (!isOpen()) return;
    const clickedBtn = e.target.closest?.(".m-nav__btn, .m-nav__close, #m-menu, #m-logo");
    if (clickedBtn) return;
    if (nav && nav.contains(e.target)) {
      closeMenu();
      return;
    }
    closeMenu();
  };

  const onScroll = () => {
    if (isOpen()) closeMenu();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") closeMenu();
  };

  const onLogoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (_navigate) _navigate({ type: "acasa" });
      else window.location.hash = "#/acasa";
    } catch {}

    const se = document.scrollingElement || document.documentElement;
    se.scrollTo({ top: 0, behavior: "smooth" });

    closeMenu();
  };

  // Nav buttons now actually navigate (mobile router safe)
  const onNavClick = (e) => {
    const btn = e.target.closest?.(".m-nav__btn");
    if (!btn) return;

    const label = btn.getAttribute("data-label") || "";
    closeMenu();

    if (!_navigate) return;

    if (label === "Despre mine") _navigate({ type: "despre" });
    else if (label === "Partide") _navigate({ type: "partide" });
    else if (label === "Galerie") _navigate({ type: "galerie" });
    else if (label === "Contact") _navigate({ type: "contact" });
  };

  const onResize = () => {
    applyHeaderH();
    syncMenuForOrientation();
    applyState();
  };

  menuBtn?.addEventListener("click", onMenuClick);
  closeBtn?.addEventListener("click", onCloseClick);
  logoBtn?.addEventListener("click", onLogoClick);
  nav?.addEventListener("click", onNavClick);
  topbarNav?.addEventListener("click", onNavClick);

  _els.topbar?.addEventListener("click", onTopbarClick);

  document.addEventListener("click", onDocClick);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);

  const onMQChange = () => syncMenuForOrientation();
  mqLandscape?.addEventListener?.("change", onMQChange);

  syncMenuForOrientation();

  if (typeof onRouteChange === "function") {
    onRouteChange(() => closeMenu());
  }

  applyState();

  return {
    enabled: true,
    destroy() {
      menuBtn?.removeEventListener("click", onMenuClick);
      closeBtn?.removeEventListener("click", onCloseClick);
      logoBtn?.removeEventListener("click", onLogoClick);
      nav?.removeEventListener("click", onNavClick);
      topbarNav?.removeEventListener("click", onNavClick);

      _els?.topbar?.removeEventListener("click", onTopbarClick);

      document.removeEventListener("click", onDocClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);

      mqLandscape?.removeEventListener?.("change", onMQChange);
    },
  };
}

function applyState() {
  if (!_els) return;

  const { topbar, topbarBack, topbarTitle, topbarGallery } = _els;
  if (!topbar) return;

  // Accent tint
  topbar.style.setProperty("--bar-accent", String(_state.accent || "rgba(255,255,255,0)"));

  // ✅ Theme shadow/filter class on the bar (bar-shadow-*)
  const nextFilter = String(_state.barFilter || "").trim();
  // remove any previous bar-shadow-* class
  topbar.classList.forEach((c) => {
    if (c.startsWith("bar-shadow-")) topbar.classList.remove(c);
  });
  if (nextFilter) topbar.classList.add(nextFilter);

  // Back visibility + label
  if (topbarBack) {
    topbarBack.textContent = String(_state.backLabel || "Back");
    topbarBack.style.display = _state.showBack ? "" : "none";
  }

  // Title visibility + value
  if (topbarTitle) {
    topbarTitle.textContent = String(_state.title || "");
    topbarTitle.style.display = _state.showTitle ? "" : "none";
  }

  // Gallery visibility + Foto/X swap
  if (topbarGallery) {
    topbarGallery.style.display = _state.showGallery ? "" : "none";
    topbarGallery.setAttribute("data-open", _state.galleryOpen ? "1" : "0");
    topbarGallery.setAttribute("aria-label", _state.galleryOpen ? "Închide" : "Foto");
  }

  // If everything hidden, hide the bar entirely
  const any =
    (_state.showBack || _state.showTitle || _state.showGallery) &&
    (String(_state.title || "").length || _state.showBack || _state.showGallery);

  const forceVisibleForAnim = document.body.classList.contains("m-bar-hidden");
  topbar.style.display = (any || forceVisibleForAnim) ? "" : "none";
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
