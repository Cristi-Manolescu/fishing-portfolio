/**
 * Scroll Snap component - Snaps sections on scroll
 * Reusable across sections (e.g. gallery, full-screen blocks)
 */
(function (global) {
    'use strict';

    function init(container, options) {
        options = options || {};
        var containerEl = typeof container === 'string' ? document.querySelector(container) : container;
        if (!containerEl) return;

        containerEl.style.scrollSnapType = options.type || 'y mandatory';
        var children = containerEl.querySelectorAll(options.selector || '[data-snap]');
        children.forEach(function (el) {
            el.style.scrollSnapAlign = options.align || 'start';
            el.style.scrollSnapStop = options.stop || 'always';
        });
    }

    function createSnapSection(html, id) {
        return '<div class="scroll-snap-section" data-snap' + (id ? ' id="' + id + '"' : '') + '>' + html + '</div>';
    }

    global.ScrollSnapComponent = {
        init: init,
        createSnapSection: createSnapSection
    };
})(typeof window !== 'undefined' ? window : this);
