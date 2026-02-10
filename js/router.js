/**
 * router.js - Hash-based Router
 * Parses up to 3 levels: section / sub-section / detail
 * Resolves route to SITE_DATA and returns resolved object for Renderer
 */
(function (global) {
    'use strict';

    var SITE_DATA = global.SITE_DATA;

    function parseHash() {
        var hash = (window.location.hash || '').slice(1).toLowerCase();
        if (!hash) return { section: 'home', subSection: null, detail: null };

        var parts = hash.split('/').filter(Boolean);
        return {
            section: parts[0] || 'home',
            subSection: parts[1] || null,
            detail: parts[2] || null
        };
    }

    function resolveRoute(route) {
        if (!SITE_DATA) return { type: 'notfound', data: null, section: 'home' };

        var section = route.section;
        var subSection = route.subSection;
        var detail = route.detail;
        var sectionData = SITE_DATA[section];

        if (!sectionData) return { type: 'notfound', data: null, section: 'home' };

        if (!subSection) {
            return { type: 'section', data: sectionData, section: section };
        }

        if (section === 'about' && sectionData.subSections) {
            var gear = sectionData.subSections[subSection];
            if (gear) return { type: 'about-gear', data: gear, section: section, parent: sectionData };
        }

        if (section === 'sessions' && sectionData.lakes) {
            var lake = sectionData.lakes[subSection];
            if (!lake) return { type: 'section', data: sectionData, section: section };

            if (!detail) {
                return { type: 'lake', data: lake, section: section, parent: sectionData };
            }

            var trip = lake.trips && lake.trips[detail];
            if (trip) {
                return { type: 'trip', data: trip, section: section, parent: sectionData, lake: lake };
            }
            return { type: 'lake', data: lake, section: section, parent: sectionData };
        }

        return { type: 'section', data: sectionData, section: section };
    }

    function applyTheme(sectionKey) {
        if (!SITE_DATA || !sectionKey) return;
        var section = SITE_DATA[sectionKey];
        if (!section) return;

        var themeClass = 'app-body ' + (section.themeClass || '');
        document.body.className = themeClass;
        document.documentElement.style.setProperty('--theme-color', section.themeColor || '#333');

        var themeKey = global.SECTION_TO_THEME_KEY && global.SECTION_TO_THEME_KEY[sectionKey];
        var theme = themeKey && global.THEME && global.THEME[themeKey];
        if (theme && theme.hex) {
            document.documentElement.style.setProperty('--accent-color', theme.hex);
        }

        var bg = global.getAssetPath ? global.getAssetPath('bg', section.sectionId || section.id || sectionKey) : '';
        var bgUrl = bg ? 'url(' + bg + ')' : '';
        document.body.style.backgroundImage = bgUrl;

        var bgLayer = document.querySelector('.layout-bg-fixed');
        if (bgLayer) {
            bgLayer.className = 'layout-bg-fixed ' + (section.themeClass || '').trim();
            bgLayer.style.backgroundImage = bgUrl;
            bgLayer.style.backgroundColor = section.themeColor ? section.themeColor : '';
        }
    }

    global.Router = {
        parseHash: parseHash,
        resolveRoute: resolveRoute,
        applyTheme: applyTheme
    };
})(typeof window !== 'undefined' ? window : this);
