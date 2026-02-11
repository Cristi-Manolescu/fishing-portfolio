/**
 * screen-4.js - Screen 4 component (vanilla JS + GSAP)
 * Contact CTA + static wordmark with loop animation only
 */
(function (global) {
    'use strict';

    function create(opts) {
        var socialText = (opts && opts.socialText) || 'Contact me on social media...';

        return '<section class="screen4" id="screen4">' +
            '<div class="screen4-content">' +
            '<p class="screen4-text">' + socialText + '</p>' +
            '</div>' +
            '<div class="screen4-wordmark">' +
            '<div class="screen4-wordmark-wrap">' +
            '<span class="screen4-wordmark-text">PESCUIT ÎN ARGEȘ</span>' +
            '</div>' +
            '</div>' +
            '</section>';
    }

    function initWordmarkLoop(container) {
        var gsap = global.gsap || (typeof window !== 'undefined' && window.gsap);
        if (!gsap || !gsap.to) return;

        var wrap = container.querySelector('.screen4-wordmark-wrap');
        var text = container.querySelector('.screen4-wordmark-text');
        if (!wrap) return;

        /* Subtle floating animation - loop only, no reveal/hide */
        gsap.to(wrap, {
            y: -5,
            duration: 2.5,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });

        /* Store reference for cleanup */
        wrap._loopTween = gsap.getTweensOf(wrap)[0];

        /* Tap/click animation */
        if (text) {
            text.addEventListener('pointerdown', function() {
                gsap.to(text, {
                    scale: 0.95,
                    duration: 0.1,
                    ease: 'power2.out'
                });
            });
            text.addEventListener('pointerup', function() {
                gsap.to(text, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
            text.addEventListener('pointerleave', function() {
                gsap.to(text, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
        }
    }

    function init(container) {
        var root = (typeof container === 'string' ? document.getElementById(container) : container) || document.getElementById('screen4');
        if (!root) return;
        initWordmarkLoop(root);
    }

    function destroy(container) {
        var root = (typeof container === 'string' ? document.getElementById(container) : container) || document.getElementById('screen4');
        if (!root) return;
        var wrap = root.querySelector('.screen4-wordmark-wrap');
        if (wrap && wrap._loopTween) {
            wrap._loopTween.kill();
            wrap._loopTween = null;
        }
    }

    global.Screen4Component = {
        create: create,
        init: init,
        destroy: destroy
    };
})(typeof window !== 'undefined' ? window : this);
