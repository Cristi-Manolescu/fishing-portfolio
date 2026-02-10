/**
 * mobile.js - Mobile-specific logic
 * Loaded only on mobile devices
 */
(function (global) {
    'use strict';

    function init() {
        document.body.classList.add('view-mobile');
        document.body.classList.remove('view-desktop');
        // Mobile-specific enhancements: swipe, touch-friendly, etc.
    }

    global.MobileModule = {
        init: init
    };
})(typeof window !== 'undefined' ? window : this);
