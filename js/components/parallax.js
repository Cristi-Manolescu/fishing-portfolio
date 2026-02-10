/**
 * Parallax component - Scroll-based parallax effect
 * Reusable across sections
 */
(function (global) {
    'use strict';

    function init(container, options) {
        options = options || {};
        var speed = options.speed || 0.5;
        var containerEl = typeof container === 'string' ? document.querySelector(container) : container;
        if (!containerEl) return;

        function onScroll() {
            var rect = containerEl.getBoundingClientRect();
            var scrollY = window.scrollY || window.pageYOffset;
            var offset = rect.top * speed;
            containerEl.style.transform = 'translate3d(0, ' + (offset * 0.1) + 'px, 0)';
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function createLayer(html, depth) {
        depth = depth || 0.5;
        return '<div class="parallax-layer" data-depth="' + depth + '">' + html + '</div>';
    }

    global.ParallaxComponent = {
        init: init,
        createLayer: createLayer
    };
})(typeof window !== 'undefined' ? window : this);
