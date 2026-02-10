/**
 * screen-2.js - Screen 2 component (vanilla JS + GSAP)
 * Ticker: Blurry Slide Up word reveal
 * Carousel: 3D stacking crawler, infinite loop, long-press to pause
 */
(function (global) {
    'use strict';

    var DEFAULT_TICKER = 'Jurnalul meu de pescuit pe apele Argeșului';
    var BANNER_PATHS = [
        'assets/img/ui/acasa/banner/slide-01__banner.jpg',
        'assets/img/ui/acasa/banner/slide-02__banner.jpg',
        'assets/img/ui/acasa/banner/slide-03__banner.jpg',
        'assets/img/ui/acasa/banner/slide-04__banner.jpg',
        'assets/img/ui/acasa/banner/slide-05__banner.jpg'
    ];
    var CAROUSEL_INTERVAL = 3000;
    var LONG_PRESS_MS = 500;

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function create(opts) {
        var tickerText = (opts && opts.tickerText) || '';
        var banners = (opts && opts.banners) || BANNER_PATHS;
        var words = tickerText.trim() ? tickerText.trim().split(/\s+/).filter(Boolean) : [];

        var tickerWordsHtml = words.map(function (w) {
            return '<span class="screen2-ticker-word">' + escapeHtml(w) + '</span>';
        }).join(' ');

        var carouselHtml = banners.map(function (src, i) {
            return '<div class="screen2-carousel-item" data-index="' + i + '">' +
                '<div class="screen2-carousel-inner">' +
                '<img src="' + escapeHtml(src) + '" alt="Banner ' + (i + 1) + '">' +
                '</div></div>';
        }).join('');

        return '<section class="screen2" id="screen2">' +
            '<div class="screen2-ticker">' + tickerWordsHtml + '</div>' +
            '<div class="screen2-carousel-wrap" id="screen2-carousel-wrap">' +
            '<div class="screen2-carousel" id="screen2-carousel">' + carouselHtml + '</div>' +
            '</div></section>';
    }

    function initTicker(container) {
        var gsap = global.gsap || (typeof window !== 'undefined' && window.gsap);
        var ScrollTrigger = global.ScrollTrigger || (typeof window !== 'undefined' && window.ScrollTrigger);
        if (!gsap || !gsap.to) return;
        if (ScrollTrigger && gsap.registerPlugin) gsap.registerPlugin(ScrollTrigger);

        var ticker = container.querySelector('.screen2-ticker');
        var words = container.querySelectorAll('.screen2-ticker-word');
        if (!words.length || !ticker) return;

        words.forEach(function (word) {
            gsap.set(word, { opacity: 0, filter: 'blur(12px)', y: 30 });
        });

        var hasPlayed = false;
        function playReveal() {
            if (hasPlayed) return;
            hasPlayed = true;
            words.forEach(function (word, i) {
                gsap.to(word, {
                    opacity: 1,
                    filter: 'blur(0px)',
                    y: 0,
                    duration: 0.7,
                    ease: 'power2.out',
                    delay: 0.05 * i
                });
            });
        }

        if (ScrollTrigger) {
            ScrollTrigger.create({
                trigger: ticker,
                start: 'top 85%',
                once: true,
                onEnter: playReveal
            });
            var tickerRect = ticker.getBoundingClientRect();
            if (tickerRect.top < (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.9) playReveal();
        } else {
            playReveal();
        }
    }

    var POSITION_NAMES = ['far-left', 'left', 'center', 'right', 'far-right'];

    function initCarousel(container) {
        var carousel = container && container.querySelector('#screen2-carousel');
        var wrap = container && container.querySelector('#screen2-carousel-wrap');
        if (!carousel || !wrap) return;

        var items = carousel.querySelectorAll('.screen2-carousel-item');
        var count = items.length;
        if (count < 3) return;

        var activeIndex = 0;
        var isPaused = false;
        var intervalId = null;
        var holdTimer = null;

        function getThemeColor() {
            var v = document.documentElement.style.getPropertyValue('--accent-color');
            return (v && v.trim()) || '#ff6701';
        }

        function hexToRgba(hex, a) {
            var m = hex.replace('#', '').match(/^(..)(..)(..)$/);
            if (!m) return 'rgba(255,103,1,' + (a || 0.4) + ')';
            return 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + (a || 0.4) + ')';
        }

        function updateCarousel() {
            var color = getThemeColor();
            document.documentElement.style.setProperty('--carousel-accent', color);
            document.documentElement.style.setProperty('--carousel-glow', '0 0 20px ' + hexToRgba(color));
            items.forEach(function (item, i) {
                var diff = (i - activeIndex + count * 2) % count;
                if (diff > count / 2) diff -= count;
                var pos = POSITION_NAMES[diff + 2] || 'far-left';
                item.setAttribute('data-position', pos);
                POSITION_NAMES.forEach(function (p) { item.classList.remove('screen2-pos-' + p); });
                item.classList.add('screen2-pos-' + pos);
            });
        }

        function goNext() {
            if (isPaused) return;
            activeIndex = (activeIndex + 1) % count;
            updateCarousel();
        }

        function startInterval() {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(goNext, CAROUSEL_INTERVAL);
        }

        function stopInterval() {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        function onHoldStart() {
            holdTimer = setTimeout(function () {
                holdTimer = null;
                isPaused = true;
                stopInterval();
                wrap.classList.add('screen2-carousel-holding');
            }, LONG_PRESS_MS);
        }

        function onHoldEnd() {
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            } else if (isPaused) {
                isPaused = false;
                startInterval();
            }
            wrap.classList.remove('screen2-carousel-holding');
        }

        var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateCarousel) : null;
        if (ro && items[0]) ro.observe(items[0]);

        updateCarousel();
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(updateCarousel);
        }
        startInterval();

        carousel.addEventListener('pointerdown', onHoldStart);
        carousel.addEventListener('pointerup', onHoldEnd);
        carousel.addEventListener('pointerleave', onHoldEnd);
        carousel.addEventListener('pointercancel', onHoldEnd);

        carousel._carouselCleanup = function () {
            stopInterval();
            if (ro && items[0]) ro.unobserve(items[0]);
            wrap.classList.remove('screen2-carousel-holding');
            carousel.removeEventListener('pointerdown', onHoldStart);
            carousel.removeEventListener('pointerup', onHoldEnd);
            carousel.removeEventListener('pointerleave', onHoldEnd);
            carousel.removeEventListener('pointercancel', onHoldEnd);
        };
    }

    function init(container) {
        var root = (typeof container === 'string' ? document.getElementById(container) : container) || document.getElementById('screen2');
        if (!root) return;
        initTicker(root);
        initCarousel(root);
    }

    function destroy(container) {
        var root = (typeof container === 'string' ? document.getElementById(container) : container) || document.getElementById('screen2');
        if (!root) return;
        var carousel = root.querySelector('#screen2-carousel');
        if (carousel && carousel._carouselCleanup) carousel._carouselCleanup();
    }

    global.Screen2Component = {
        create: create,
        init: init,
        destroy: destroy,
        DEFAULT_TICKER: DEFAULT_TICKER,
        BANNER_PATHS: BANNER_PATHS
    };
})(typeof window !== 'undefined' ? window : this);
