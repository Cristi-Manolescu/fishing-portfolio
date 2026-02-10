/**
 * header-ui.js - Logo, Back button, Section title, Responsive nav
 * GSAP pulse (main section only), transitions, full-screen overlay
 */
(function (global) {
    'use strict';

    var LOGO_PATH = 'M185.446,379.833c-14.149,1.529-24.268,8.689-32.695,16.121c-8.657,7.633-15.425,17.215-20.435,28.381c3.467-17.753,16.736-31.035,30.198-40.869c4.585-3.349,9.867-7.244,15.212-8.401C180.428,374.479,184.583,377.743,185.446,379.833z M154.113,400.04c0.581-0.01,0.277,0.169,0.227,0.454c-4.479,4.445-10.383,16.712-6.812,27.02c0.985,2.842,5.071,9.785,9.082,9.763c2.437-0.014,3.477-2.406,5.449-3.405c-0.804,2.98-3.521,6.015-3.406,10.671c-8.465-3.054-15.77-8.624-16.575-19.072C141.14,413.274,147.068,405.298,154.113,400.04z M222.683,400.267c7.37,4.24,13.351,12.933,12.487,24.975c-0.761,10.622-8.056,16.472-16.801,19.3c0.271-4.965-1.915-7.471-3.406-10.671c2.318,0.664,3.104,3.276,5.449,3.405c2.353,0.129,5.566-3.162,7.039-5.222C233.994,422.898,229.122,405.082,222.683,400.267z M176.137,418.204c-11.282-0.676-11.498-12.418-20.889-14.985c3.461-1.18,7.949,0.036,10.217,1.362C170.647,407.611,170.514,416.071,176.137,418.204z M221.774,402.765c-8.582,3.528-9.411,14.807-20.889,15.439c5.617-1.94,5.514-9.2,9.763-12.488C213.357,403.621,216.513,402.673,221.774,402.765z M217.461,407.76c4.441,8.471-5.653,14.364-12.715,9.99C212.993,418.429,216.534,414.401,217.461,407.76z M159.79,407.987c0.264-0.037,0.404,0.05,0.454,0.227c0.21,6.98,4.816,9.564,11.807,9.763C164.795,421.917,155.748,416.059,159.79,407.987z M160.698,439.547c2.213-7.248,7.564-13.324,16.348-14.758c0.386-0.084,0.428,0.177,0.454,0.453C171.082,429.194,164.512,432.992,160.698,439.547z M220.866,461.798c-8.231-1.91-11.551-8.732-11.807-18.618c-1.439,3.782-4.947,5.497-8.628,7.039c1.724-1.683,3.75-3.062,4.314-5.904c-4.228-1.026-8.502,1.685-13.169,2.044c-7.617,0.587-12.899-2.253-19.072-2.271c0.536,2.87,2.459,4.353,4.314,5.903c-3.37-0.793-7.29-3.003-8.401-6.812c-0.899,1.671-0.509,3.726-0.681,5.449c-0.712,7.123-5.107,11.428-11.353,13.169c3.709-2.484,6.605-5.95,7.039-11.579c0.162-2.106-0.343-4.475,0-7.266c0.383-3.122,2.441-6.358,4.314-8.401c4.479-4.886,12.482-9.046,20.435-9.536c5.509-0.34,12.162,2.579,16.348,5.449c4.403,3.019,8.873,7.349,9.536,12.715c0.391,3.166-0.252,5.939,0,8.4C214.569,456.603,217.139,458.588,220.866,461.798z M169.78,442.953c4.636-3.18,12.712-0.682,18.845-0.682c6.201,0,14.633-2.324,19.072,0.454C203.271,429.248,173.274,429.49,169.78,442.953z M142.08,435.914c2.543,1.549,3.952,3.946,7.039,5.903c3.852,2.442,8.933,2.897,10.898,6.812C151.503,447.833,145.904,442.155,142.08,435.914z M234.717,435.688c0.405-0.064,0.466,0.214,0.227,0.227c-3.438,6.78-9.022,11.412-17.71,12.941C221.348,442.753,231.296,442.483,234.717,435.688z M237.895,440.909c3.332,1.588,7.184,4.624,12.488,4.995c-2.801-1.963-5.707-3.921-8.4-7.039c-1.631-1.886-4.027-5.04-4.314-7.038c-0.368-2.567,1.449-4.9,0.908-8.174c7.094,9.026,16.355,15.886,28.154,20.208c-6.885,5.783-23.908,8.875-32.241,2.27c-0.67-0.53-1.824-1.189-1.589-2.043c3.252,1.742,7.328,2.662,11.807,3.179C242.073,445.511,239.634,443.561,237.895,440.909z M257.422,443.634c-5.378-2.645-9.824-6.222-14.759-9.31C245.588,439.271,250.706,443.235,257.422,443.634z M139.355,440.455c-0.927,2.706-3.986,5.247-7.039,6.584c4.108,0.021,8.658-1.482,12.034-2.951c0.285,1.028-1.062,1.458-1.816,2.043c-7.968,6.182-25.211,3.809-32.241-2.27c11.977-4.145,21.176-11.065,28.381-19.98c-0.315,3.015,1.217,5.283,0.908,7.719c-0.506,3.992-6.651,10.08-9.536,12.262c-1.076,0.813-2.408,1.377-3.406,1.816C131.811,445.776,135.982,442.91,139.355,440.455z M119.829,443.861c6.912-1.035,12.375-4.729,14.758-9.537C129.857,437.693,124.837,440.771,119.829,443.861z M199.523,425.242c8.937-0.292,14.317,7.412,17.482,14.531C212.837,434.18,206.687,428.6,199.523,425.242z M196.799,373.929c11.991,3.899,21.712,11.46,29.971,19.299c8.215,7.798,15.532,17.745,17.938,31.105c-4.584-11.45-11.552-20.86-20.208-28.381c-8.436-7.329-18.385-14.617-32.468-16.121c-0.491-0.984,1.21-1.945,2.271-2.725c1.133-0.833,2.494-1.877,3.86-2.043c-0.766-1.238-2.329-0.122-3.86-0.227c0.072-3.402-0.649-6.011-1.362-8.628c-0.331,3.908-0.718,7.759-2.498,10.217c-0.497-4.533-0.428-11.683-1.816-13.85c-1.381,2.934-1.423,9.172-1.816,13.85c-1.677-2.41-2.216-5.958-2.271-9.99c-1.129,2.201-1.323,5.337-1.589,8.401c-1.598-0.206-2.654-0.604-4.314-0.227c0.299-0.609,1.439-0.377,2.043-0.681c0.948-9.118,2.963-17.169,7.947-22.251C193.898,356.547,195.552,365.035,196.799,373.929z';

    var NAV_ITEMS = [
        { hash: 'home', label: 'Home' },
        { hash: 'about', label: 'About' },
        { hash: 'sessions', label: 'Sessions' },
        { hash: 'gallery', label: 'Gallery' },
        { hash: 'contact', label: 'Contact' }
    ];

    var OVERLAY_NAV_ITEMS = NAV_ITEMS.filter(function (item) { return item.hash !== 'home'; });

    function hexToRgba(hex, alpha) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha || 0.5) + ')';
    }

    function createLogoSvg() {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'header-logo-svg');
        /* viewBox with padding so path is not clipped */
        svg.setAttribute('viewBox', '100 350 160 120');
        svg.setAttribute('overflow', 'visible');
        svg.setAttribute('aria-hidden', 'true');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'header-logo-path');
        path.setAttribute('d', LOGO_PATH);
        svg.appendChild(path);
        return svg;
    }

    function getParentHash() {
        var hash = (window.location.hash || '').slice(1);
        var parts = hash.split('/').filter(Boolean);
        if (parts.length <= 1) return null;
        parts.pop();
        return '#' + parts.join('/');
    }

    function getHashLevelCount() {
        var hash = (window.location.hash || '').slice(1);
        return hash ? hash.split('/').filter(Boolean).length : 0;
    }

    function isMainSection(route) {
        return route && !route.subSection;
    }

    function getSectionTitle(resolved) {
        if (!resolved || !resolved.data) return '';
        var key = global.SECTION_TO_THEME_KEY && global.SECTION_TO_THEME_KEY[resolved.section];
        if (resolved.type === 'section') return key || resolved.data.title || resolved.section;
        return resolved.data.title || key || '';
    }

    function getParentTitle(resolved) {
        if (!resolved || getHashLevelCount() <= 1) return '';
        if (resolved.type === 'trip' && resolved.lake) return resolved.lake.title || '';
        if (resolved.type === 'lake' && resolved.parent) return resolved.parent.title || '';
        if (resolved.type === 'about-gear' && resolved.parent) return resolved.parent.title || '';
        return '';
    }

    function build(headerEl) {
        var bar = document.createElement('div');
        bar.className = 'header-bar';

        var logoArea = document.createElement('div');
        logoArea.className = 'header-logo-area';

        var logoLink = document.createElement('a');
        logoLink.href = '#home';
        logoLink.className = 'header-logo';
        logoLink.appendChild(createLogoSvg());
        logoLink.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.hash = '#home';
        });
        logoArea.appendChild(logoLink);

        var breadcrumb = document.createElement('div');
        breadcrumb.className = 'header-breadcrumb';

        var backBtn = document.createElement('button');
        backBtn.className = 'header-back';
        backBtn.type = 'button';
        backBtn.style.display = 'none';
        backBtn.addEventListener('click', function () {
            var parent = getParentHash();
            if (parent) window.location.hash = parent;
        });

        var titleWrap = document.createElement('div');
        titleWrap.className = 'header-title-wrap';

        var titleEl = document.createElement('span');
        titleEl.className = 'header-section-title';

        titleWrap.appendChild(titleEl);
        breadcrumb.appendChild(backBtn);
        breadcrumb.appendChild(titleWrap);

        var navArea = document.createElement('div');
        navArea.className = 'header-nav-area';

        var hamburger = document.createElement('button');
        hamburger.className = 'header-hamburger';
        hamburger.setAttribute('aria-label', 'Deschide meniul');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.innerHTML = '<span class="hamburger-bar"></span><span class="hamburger-bar"></span><span class="hamburger-bar"></span>';

        var nav = document.createElement('nav');
        nav.className = 'header-nav-landscape';
        var list = document.createElement('ul');
        list.className = 'header-nav-list';
        NAV_ITEMS.forEach(function (item) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + item.hash;
            a.className = 'header-nav-link';
            a.textContent = item.label;
            a.dataset.hash = item.hash;
            li.appendChild(a);
            list.appendChild(li);
        });
        nav.appendChild(list);

        navArea.appendChild(hamburger);
        navArea.appendChild(nav);

        bar.appendChild(logoArea);
        bar.appendChild(breadcrumb);
        bar.appendChild(navArea);

        var overlay = document.createElement('div');
        overlay.className = 'header-overlay';

        var overlayLogoLink = document.createElement('a');
        overlayLogoLink.href = '#home';
        overlayLogoLink.className = 'header-overlay-logo';
        overlayLogoLink.appendChild(createLogoSvg());
        overlayLogoLink.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.hash = '#home';
            overlay.classList.remove('is-open');
            hamburger.setAttribute('aria-expanded', 'false');
        });

        var overlayList = document.createElement('ul');
        overlayList.className = 'header-overlay-list';
        OVERLAY_NAV_ITEMS.forEach(function (item) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + item.hash;
            a.className = 'header-overlay-link';
            a.textContent = item.label;
            a.dataset.hash = item.hash;
            var themeKey = global.SECTION_TO_THEME_KEY && global.SECTION_TO_THEME_KEY[item.hash];
            var theme = themeKey && global.THEME && global.THEME[themeKey];
            if (theme && theme.hex) a.style.setProperty('--link-glow', theme.hex);
            li.appendChild(a);
            overlayList.appendChild(li);
        });

        overlay.appendChild(overlayLogoLink);
        overlay.appendChild(overlayList);

        var svgWrap = headerEl.querySelector('.svg-header-wrap');
        if (svgWrap) {
            headerEl.insertBefore(bar, svgWrap.nextSibling);
        } else {
            headerEl.appendChild(bar);
        }
        document.body.appendChild(overlay);

        return {
            logo: logoLink,
            logoPath: logoLink.querySelector('.header-logo-path'),
            backBtn: backBtn,
            breadcrumb: breadcrumb,
            titleEl: titleEl,
            hamburger: hamburger,
            nav: nav,
            overlay: overlay,
            overlayLogo: overlayLogoLink,
            overlayLinks: overlay.querySelectorAll('.header-overlay-link'),
            navLinks: nav.querySelectorAll('.header-nav-link')
        };
    }

    function update(ui, resolved, accentHex) {
        var showBack = getHashLevelCount() > 1;
        var parentTitle = getParentTitle(resolved);
        var title = getSectionTitle(resolved);
        var mainSection = isMainSection(resolved);

        ui.backBtn.style.display = showBack ? '' : 'none';
        ui.backBtn.textContent = parentTitle ? '\u2190 ' + parentTitle : '';
        ui.titleEl.textContent = title ? title.toUpperCase() : '';
        ui.titleEl.style.display = title ? '' : 'none';
        ui.breadcrumb.style.display = (showBack || title) ? '' : 'none';

        if (global.gsap) {
            /* Slide transition: out old, in new */
            var titleWrap = ui.titleEl && ui.titleEl.parentElement;
            if (titleWrap && (showBack || title)) {
                if (ui._titleTl) ui._titleTl.kill();
                ui._titleTl = global.gsap.timeline();
                ui._titleTl.fromTo(ui.breadcrumb, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' });
            }

            if (mainSection && ui.logoPath) {
                var darkFill = accentHex ? hexToRgba(accentHex, 0.6) : 'rgba(255,103,1,0.6)';
                ui.logoPath.style.fill = darkFill;
                if (ui._pulse) ui._pulse.kill();
                var hex = accentHex || '#ff6701';
                ui._pulse = global.gsap.fromTo(ui.logoPath,
                    { filter: 'drop-shadow(0 0 2px ' + hex + ')' },
                    { filter: 'drop-shadow(0 0 12px ' + hex + ')', duration: 1.2, ease: 'power1.inOut', yoyo: true, repeat: -1 }
                );
            } else if (ui._pulse) {
                ui._pulse.kill();
                ui._pulse = null;
                if (ui.logoPath) ui.logoPath.style.filter = '';
            }
        }

        var hash = (window.location.hash || '#home').slice(1).split('/')[0];
        ui.navLinks.forEach(function (a) {
            a.classList.toggle('active', a.dataset.hash === hash);
        });
        ui.overlayLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + hash);
        });
    }

    function init(headerEl) {
        if (!headerEl) return null;

        var ui = build(headerEl);

        ui.hamburger.addEventListener('click', function () {
            var open = ui.overlay.classList.toggle('is-open');
            ui.hamburger.setAttribute('aria-expanded', open);
            if (open && global.gsap) {
                var links = ui.overlay.querySelectorAll('.header-overlay-link');
                var logoEl = ui.overlay.querySelector('.header-overlay-logo');
                global.gsap.set([logoEl].concat([].slice.call(links)), { opacity: 0, y: 20 });
                global.gsap.to(logoEl, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
                global.gsap.to(links, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, delay: 0.1, ease: 'power2.out' });
            }
        });

        ui.overlay.addEventListener('click', function (e) {
            if (e.target === ui.overlay || e.target.classList.contains('header-overlay-link') || e.target.closest('.header-overlay-logo')) {
                ui.overlay.classList.remove('is-open');
                ui.hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && ui.overlay.classList.contains('is-open')) {
                ui.overlay.classList.remove('is-open');
                ui.hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        ui.onRouteChange = function (resolved) {
            var themeKey = global.SECTION_TO_THEME_KEY && global.SECTION_TO_THEME_KEY[resolved.section];
            var theme = themeKey && global.THEME && global.THEME[themeKey];
            update(ui, resolved, theme && theme.hex);
        };

        return ui;
    }

    global.HeaderUI = {
        init: init,
        LOGO_PATH: LOGO_PATH
    };
})(typeof window !== 'undefined' ? window : this);
