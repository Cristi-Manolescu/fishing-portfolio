/**
 * screen-3.js - Screen 3 component (vanilla JS + GSAP)
 * Search bar (decorative) + parallax hero grid
 * Single column, subtle 10% parallax, landscape height constraint
 */
(function (global) {
    'use strict';

    var LATEST_COUNT = 6;
    var PARALLAX_OFFSET_PORTRAIT = 5;
    var PARALLAX_OFFSET_LANDSCAPE = 15;
    var _parallaxTriggers = [];
    var _resizeHandler = null;
    var _resizeTimeout = null;
    var _lastOrientation = null;

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getLatestPath(idx) {
        var getAssetPath = global.getAssetPath;
        if (getAssetPath) {
            var idxStr = idx < 10 ? '0' + idx : String(idx);
            return getAssetPath('latest', null, null, idxStr);
        }
        return 'assets/img/ui/acasa/latest/latest-' + (idx < 10 ? '0' + idx : idx) + '__thumb.avif';
    }

    function create(opts) {
        var count = (opts && opts.count) || LATEST_COUNT;
        var deepLinks = (opts && opts.deepLinks) || [];

        var searchHtml = '<div class="screen3-search">' +
            '<input type="text" class="screen3-search-input" placeholder="Caută..." disabled>' +
            '<span class="screen3-search-icon">🔍</span>' +
            '</div>';

        var imagesHtml = '';
        for (var i = 1; i <= count; i++) {
            var src = getLatestPath(i);
            var link = deepLinks[i - 1] || '#';
            imagesHtml += '<a href="' + escapeHtml(link) + '" class="screen3-item" data-index="' + i + '">' +
                '<div class="screen3-item-inner">' +
                '<img src="' + escapeHtml(src) + '" alt="Latest ' + i + '" loading="lazy">' +
                '</div></a>';
        }

        return '<section class="screen3" id="screen3">' +
            searchHtml +
            '<div class="screen3-grid">' + imagesHtml + '</div>' +
            '</section>';
    }

    function killTriggers() {
        _parallaxTriggers.forEach(function (st) {
            if (st && st.kill) st.kill();
        });
        _parallaxTriggers = [];
    }

    function killResizeHandler() {
        if (_resizeHandler) {
            window.removeEventListener('resize', _resizeHandler);
            _resizeHandler = null;
        }
        if (_resizeTimeout) {
            clearTimeout(_resizeTimeout);
            _resizeTimeout = null;
        }
        _lastOrientation = null;
    }

    function isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    function getParallaxOffset() {
        return isLandscape() ? PARALLAX_OFFSET_LANDSCAPE : PARALLAX_OFFSET_PORTRAIT;
    }

    function getCurrentOrientation() {
        return isLandscape() ? 'landscape' : 'portrait';
    }

    function clearInlineStyles(container) {
        var inners = container.querySelectorAll('.screen3-item-inner');
        for (var i = 0; i < inners.length; i++) {
            inners[i].removeAttribute('style');
        }
    }

    function initParallax(container) {
        var gsap = global.gsap || (typeof window !== 'undefined' && window.gsap);
        var ScrollTrigger = global.ScrollTrigger || (typeof window !== 'undefined' && window.ScrollTrigger);
        if (!gsap || !ScrollTrigger || !container) return;
        if (gsap.registerPlugin) gsap.registerPlugin(ScrollTrigger);

        killTriggers();
        killResizeHandler();

        var items = container.querySelectorAll('.screen3-item');
        if (!items.length) return;

        _lastOrientation = getCurrentOrientation();

        /* Create triggers - store items for recreation on orientation change */
        function createAllTriggers() {
            for (var j = 0; j < items.length; j++) {
                (function(item, index) {
                    var inner = item.querySelector('.screen3-item-inner');
                    if (!inner) return;

                    var direction = (index % 2 === 0) ? 1 : -1;
                    var offset = getParallaxOffset();

                    /* Clear any existing inline styles */
                    inner.removeAttribute('style');

                    var tween = gsap.fromTo(inner, 
                        { yPercent: -offset * direction },
                        { 
                            yPercent: offset * direction,
                            ease: 'none',
                            scrollTrigger: {
                                trigger: item,
                                start: 'top bottom',
                                end: 'bottom top',
                                scrub: 0.5
                            }
                        }
                    );

                    _parallaxTriggers.push(tween.scrollTrigger);
                })(items[j], j);
            }
        }

        createAllTriggers();

        /* Handle orientation change - kill and recreate triggers */
        _resizeHandler = function() {
            if (_resizeTimeout) clearTimeout(_resizeTimeout);
            _resizeTimeout = setTimeout(function() {
                var newOrientation = getCurrentOrientation();
                if (newOrientation !== _lastOrientation) {
                    _lastOrientation = newOrientation;
                    
                    /* Kill all existing triggers */
                    killTriggers();
                    
                    /* Clear styles */
                    var screen3 = document.getElementById('screen3');
                    if (screen3) clearInlineStyles(screen3);
                    
                    /* Wait for CSS to apply, then recreate */
                    setTimeout(function() {
                        /* Re-query items in case DOM changed */
                        items = container.querySelectorAll('.screen3-item');
                        if (items.length) {
                            createAllTriggers();
                        }
                    }, 200);
                }
            }, 100);
        };
        window.addEventListener('resize', _resizeHandler);
    }

    function init(container) {
        var root = (typeof container === 'string' ? document.getElementById(container) : container) || document.getElementById('screen3');
        if (!root) return;
        /* Delay init slightly to ensure CSS has applied */
        setTimeout(function () {
            initParallax(root);
        }, 50);
    }

    function destroy() {
        killTriggers();
        killResizeHandler();
    }

    global.Screen3Component = {
        create: create,
        init: init,
        destroy: destroy,
        LATEST_COUNT: LATEST_COUNT
    };
})(typeof window !== 'undefined' ? window : this);
