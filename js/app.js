/**
 * app.js - Main application entry
 * - Reads content from content.data.js (window.SITE_DATA)
 * - Detects device (Mobile vs Desktop)
 * - Loads corresponding CSS and JS module
 * - Builds Layout (Top, Middle)
 * - Initializes Router and Renderer
 */
(function (global) {
    'use strict';

    var Device = global.Device;
    var Layout = global.Layout;
    var Router = global.Router;
    var Renderer = global.Renderer;

    function loadCSS(href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    function loadScript(src, callback) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = callback || function () {};
        script.onerror = callback || function () {};
        document.body.appendChild(script);
    }

    function loadDeviceModules() {
        var isMobile = Device && Device.isMobile ? Device.isMobile() : (Device && Device.getLayoutWidth ? Device.getLayoutWidth() < Device.BREAKPOINT : false);

        if (isMobile) {
            loadCSS('css/mobile.css');
            loadScript('js/modules/mobile.js', function () {
                if (global.MobileModule && global.MobileModule.init) {
                    global.MobileModule.init();
                }
            });
        } else {
            loadCSS('css/desktop.css');
            loadScript('js/modules/desktop.js', function () {
                if (global.DesktopModule && global.DesktopModule.init) {
                    global.DesktopModule.init();
                }
            });
        }
    }

    function handleRoute() {
        var route = Router.parseHash();
        var resolved = Router.resolveRoute(route);
        Router.applyTheme(resolved.section);
        if (global.SvgHeader && global.SvgHeader._instance && global.SvgHeader._instance.setTheme) {
            global.SvgHeader._instance.setTheme(resolved.section);
        }
        if (global.HeaderUI && global.HeaderUI._instance && global.HeaderUI._instance.onRouteChange) {
            global.HeaderUI._instance.onRouteChange(resolved);
        }
        Renderer.render(resolved, 'app');
        if (global.ContentFrame && global.ContentFrame._instance) {
            refreshContentFrame();
        }
    }

    function init() {
        if (!global.SITE_DATA) {
            console.error('app.js: SITE_DATA not loaded. Ensure content.data.js loads before app.js.');
            return;
        }

        Layout.build();
        loadDeviceModules();

        var headerEl = document.querySelector('.header');
        if (headerEl) {
            headerEl.classList.add('has-svg-header');
            if (global.SvgHeader && global.SvgHeader.init) {
                global.SvgHeader._instance = global.SvgHeader.init(headerEl);
            }
            if (global.HeaderUI && global.HeaderUI.init) {
                global.HeaderUI._instance = global.HeaderUI.init(headerEl);
            }
        }

        var middleEl = Layout.getMiddle();
        if (middleEl && global.ContentFrame && global.ContentFrame.createContentFrame) {
            global.ContentFrame._instance = global.ContentFrame.createContentFrame(middleEl);
            if (global.ContentFrame.initFrameStage) {
                global.ContentFrame.initFrameStage(global.ContentFrame._instance, middleEl);
            }
            refreshContentFrame();
        }

        window.addEventListener('hashchange', handleRoute);
        window.addEventListener('resize', onResize);
        handleRoute();
    }

    function computeCenterHeight() {
        var headerH = document.querySelector('.header') ? (document.querySelector('.header').offsetHeight || 0) : 0;
        var h = (typeof document !== 'undefined' && document.documentElement) ? document.documentElement.clientHeight : window.innerHeight;
        return Math.max(200, (h || 600) - headerH - 202 - 101);
    }

    function refreshContentFrame() {
        var frame = global.ContentFrame && global.ContentFrame._instance;
        if (!frame) return;
        var route = Router.parseHash();
        var resolved = Router.resolveRoute(route);
        var themeKey = global.SECTION_TO_THEME_KEY && global.SECTION_TO_THEME_KEY[resolved.section];
        var theme = themeKey && global.THEME && global.THEME[themeKey];
        var h = (frame._contentHeight != null) ? frame._contentHeight : computeCenterHeight();
        global.ContentFrame.updateContentFrame(frame, {
            contentHeight: h,
            theme: theme
        });
        if (global.ContentFrame.updateWordmarkSlot) {
            global.ContentFrame.updateWordmarkSlot(frame, resolved.section);
        }
    }

    var _resizePending = null;
    function onResize() {
        if (_resizePending != null) return;
        _resizePending = requestAnimationFrame(function () {
            _resizePending = null;
            if (global.ScrollTrigger && global.ScrollTrigger.refresh) {
                global.ScrollTrigger.refresh();
            }
            refreshContentFrame();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.App = { init: init };
})(typeof window !== 'undefined' ? window : this);
