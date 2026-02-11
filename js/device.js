/**
 * device.js - Mobile vs Desktop detection
 * Exposed as window.Device
 * Uses layout viewport (clientWidth/clientHeight) — stable during orientation; innerWidth varies with visualViewport.scale
 */
(function (global) {
    'use strict';

    var BREAKPOINT = 768;

    function getLayoutWidth() {
        if (typeof document === 'undefined' || !document.documentElement) return typeof window !== 'undefined' ? window.innerWidth : 800;
        return document.documentElement.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    }

    function getLayoutHeight() {
        if (typeof document === 'undefined' || !document.documentElement) return typeof window !== 'undefined' ? window.innerHeight : 600;
        return document.documentElement.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
    }

    function isMobile() {
        /* Use screen width as primary check - more reliable than touch detection */
        var width = getLayoutWidth();
        if (width < BREAKPOINT) return true;
        
        /* Also check user agent for mobile devices */
        var ua = navigator.userAgent || '';
        var mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        
        return mobileUA;
    }

    function isDesktop() {
        return !isMobile();
    }

    function getView() {
        return isMobile() ? 'mobile' : 'desktop';
    }

    global.Device = {
        isMobile: isMobile,
        isDesktop: isDesktop,
        getView: getView,
        getLayoutWidth: getLayoutWidth,
        getLayoutHeight: getLayoutHeight,
        BREAKPOINT: BREAKPOINT
    };
})(typeof window !== 'undefined' ? window : this);
