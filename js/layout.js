/**
 * layout.js - Layout Engine
 * Top (header) | Middle (content frame)
 * Supports complex shapes (Flash-style) that adapt to window size without distortion
 * Exposed as window.Layout
 */
(function (global) {
    'use strict';

    var LAYOUT_IDS = {
        top: 'layout-top',
        middle: 'layout-middle'
    };

    /**
     * Build the core UI structure: Top | Middle
     * Uses object-fit / background-size for scalable shapes without distortion
     */
    function build() {
        var main = document.querySelector('.main') || document.body;
        var app = document.getElementById('app');

        if (!main) return null;

        document.body.classList.add('has-bg-layer');
        var bgEl = document.createElement('div');
        bgEl.className = 'layout-bg-fixed';
        if (document.body.firstChild) {
            document.body.insertBefore(bgEl, document.body.firstChild);
        } else {
            document.body.appendChild(bgEl);
        }

        var wrapper = document.createElement('div');
        wrapper.className = 'layout-wrapper';

        var top = document.createElement('div');
        top.id = LAYOUT_IDS.top;
        top.className = 'layout-holder layout-top';
        top.setAttribute('role', 'banner');

        var middle = document.createElement('div');
        middle.id = LAYOUT_IDS.middle;
        middle.className = 'layout-holder layout-middle';
        middle.setAttribute('role', 'main');

        var appContainer = app;
        if (app && app.parentNode) {
            app.parentNode.removeChild(app);
        } else {
            appContainer = document.createElement('div');
            appContainer.id = 'app';
            appContainer.className = 'app-container';
        }
        middle.appendChild(appContainer);

        wrapper.appendChild(top);
        wrapper.appendChild(middle);

        var existingWrapper = main.querySelector('.layout-wrapper');
        if (existingWrapper) {
            existingWrapper.replaceWith(wrapper);
        } else {
            main.innerHTML = '';
            main.appendChild(wrapper);
        }

        return { top: top, middle: middle };
    }

    function getTop() {
        return document.getElementById(LAYOUT_IDS.top);
    }

    function getMiddle() {
        return document.getElementById(LAYOUT_IDS.middle);
    }

    /**
     * Set content into a holder (for complex shapes, use SVG/CSS with object-fit)
     */
    function setContent(holder, html) {
        var el = typeof holder === 'string' ? document.getElementById(holder) : holder;
        if (el) el.innerHTML = html;
    }

    global.Layout = {
        build: build,
        getTop: getTop,
        getMiddle: getMiddle,
        setContent: setContent,
        IDs: LAYOUT_IDS
    };
})(typeof window !== 'undefined' ? window : this);
