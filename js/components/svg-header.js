/**
 * svg-header.js - Unified SVG Header
 * Smoked glass fill (no glow) + neon stroke glow
 * THEME-driven stroke color
 */
(function (global) {
    'use strict';

    var PATH_WIDTH = 271.166;
    var RADIUS = 25;
    var TOTAL_HEIGHT_PORTRAIT = 150;
    var TOTAL_HEIGHT_LANDSCAPE = 100;

    /**
     * Fixed path curve segment (corrected path data).
     * 185.271 -> 185, c89.483,0 -> c0 0
     */
    function getFixedCurveSegment(yOffset) {
        var y100 = 100 + yOffset;
        var y150 = 150 + yOffset;
        var y156 = 156.579 + yOffset;
        var y200 = 200 + yOffset;
        return (
            'c0,0-17.73,0-26.863,0' +
            'C239,' + y150 + ',239,' + y150 + ',233.254,' + y156 +
            'C195.333,' + y200 + ',195.333,' + y200 + ',185,' + y200 +
            'c0,0-185.104,0-185.104,0' +
            'L0,' + y100
        );
    }

    function buildPathD(portrait, w) {
        w = Math.max(w || 0, PATH_WIDTH + RADIUS);

        if (portrait) {
            return (
                'M0,0' +
                'L' + w + ',0' +
                'L' + w + ',50' +
                'L' + w + ',' + (100 - RADIUS) +
                'A' + RADIUS + ',' + RADIUS + ' 0 0 1 ' + (w - RADIUS) + ',100' +
                'L' + PATH_WIDTH + ',100' +
                getFixedCurveSegment(-50) +
                'L0,50' +
                'L0,0Z'
            );
        } else {
            return (
                'M0,0' +
                'L' + PATH_WIDTH + ',0' +
                'L' + w + ',0' +
                'L' + w + ',' + RADIUS +
                'A' + RADIUS + ',' + RADIUS + ' 0 0 1 ' + (w - RADIUS) + ',50' +
                'L' + PATH_WIDTH + ',50' +
                getFixedCurveSegment(-100) +
                'L0,0Z'
            );
        }
    }

    function updateHeaderPath(headerObj) {
        if (!headerObj || !headerObj.pathFill) return;

        var portrait = headerObj._portrait;
        var w = (typeof document !== 'undefined' && document.documentElement) ? document.documentElement.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 800);
        var d = buildPathD(portrait, w);
        headerObj.pathFill.setAttribute('d', d);
        if (headerObj.pathStroke) headerObj.pathStroke.setAttribute('d', d);
        if (headerObj.clipPathEl) headerObj.clipPathEl.setAttribute('d', d);
    }

    function createClipPath(svg) {
        var defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        if (!svg.querySelector('defs')) svg.insertBefore(defs, svg.firstChild);

        var clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', 'header-shape-clip');
        clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', 'header-clip-path');
        clipPath.appendChild(path);
        defs.appendChild(clipPath);
        return path;
    }

    function createNeonGlowFilter(svg, filterId) {
        var defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        if (!svg.contains(defs)) svg.insertBefore(defs, svg.firstChild);
        var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', filterId);
        filter.setAttribute('x', '-50%');
        filter.setAttribute('y', '-50%');
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');
        filter.setAttribute('color-interpolation-filters', 'sRGB');

        var feMorphology = document.createElementNS('http://www.w3.org/2000/svg', 'feMorphology');
        feMorphology.setAttribute('in', 'SourceAlpha');
        feMorphology.setAttribute('operator', 'dilate');
        feMorphology.setAttribute('radius', '1');
        feMorphology.setAttribute('result', 'thickened');

        var feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('in', 'thickened');
        feGaussianBlur.setAttribute('stdDeviation', '4');
        feGaussianBlur.setAttribute('result', 'blur');

        var feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
        feFlood.setAttribute('flood-color', 'var(--accent-color, #ff6701)');
        feFlood.setAttribute('result', 'glowColor');

        var feComposite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feComposite.setAttribute('in', 'glowColor');
        feComposite.setAttribute('in2', 'blur');
        feComposite.setAttribute('operator', 'in');
        feComposite.setAttribute('result', 'glow');

        var feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        var n1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        n1.setAttribute('in', 'glow');
        var n2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        n2.setAttribute('in', 'SourceGraphic');
        feMerge.appendChild(n1);
        feMerge.appendChild(n2);

        filter.appendChild(feMorphology);
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feFlood);
        filter.appendChild(feComposite);
        filter.appendChild(feMerge);
        defs.appendChild(filter);
    }

    function createSvgHeader() {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'svg-header');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');

        var clipPathEl = createClipPath(svg);
        createNeonGlowFilter(svg, 'svg-header-neon-glow');

        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'svg-header-group');

        var pathFill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathFill.setAttribute('class', 'svg-header-fill');

        var pathStroke = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathStroke.setAttribute('class', 'svg-header-stroke');
        pathStroke.setAttribute('filter', 'url(#svg-header-neon-glow)');

        g.appendChild(pathFill);
        g.appendChild(pathStroke);
        svg.appendChild(g);

        return { svg: svg, pathFill: pathFill, pathStroke: pathStroke, group: g, clipPathEl: clipPathEl };
    }

    function isPortrait() {
        if (typeof document === 'undefined' || !document.documentElement) return typeof window !== 'undefined' && window.innerHeight >= window.innerWidth;
        var w = document.documentElement.clientWidth || 0;
        var h = document.documentElement.clientHeight || 0;
        return w > 0 && h >= w;
    }

    function setTheme(headerObj, sectionKey) {
        if (!headerObj) return;

        var themeKey = global.SECTION_TO_THEME_KEY && global.SECTION_TO_THEME_KEY[sectionKey];
        var theme = themeKey && global.THEME && global.THEME[themeKey];
        var hex = (theme && theme.hex) || '#ff6701';

        document.documentElement.style.setProperty('--accent-color', hex);

        var feFlood = headerObj.svg && headerObj.svg.querySelector('feFlood');
        if (feFlood) feFlood.setAttribute('flood-color', hex);
    }

    function init(headerEl) {
        if (!headerEl) return null;

        var header = createSvgHeader();
        header._portrait = isPortrait();

        var container = document.createElement('div');
        container.className = 'svg-header-wrap';
        var glass = document.createElement('div');
        glass.className = 'svg-header-glass glass-smoked';
        glass.setAttribute('aria-hidden', 'true');
        container.appendChild(glass);
        container.appendChild(header.svg);
        headerEl.insertBefore(container, headerEl.firstChild);

        function setViewBoxAndHeight(portrait) {
            var h = portrait ? TOTAL_HEIGHT_PORTRAIT : TOTAL_HEIGHT_LANDSCAPE;
            var w = (typeof document !== 'undefined' && document.documentElement) ? document.documentElement.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 800);
            header.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

            if (global.gsap && global.gsap.to) {
                global.gsap.to(header.svg, { duration: 0.4, ease: 'power2.inOut', height: h });
            } else {
                header.svg.style.height = h + 'px';
            }
        }

        function applyOrientation() {
            header._portrait = isPortrait();
            setViewBoxAndHeight(header._portrait);
            updateHeaderPath(header);
        }

        applyOrientation();
        var _resizePending = null;
        window.addEventListener('resize', function () {
            if (_resizePending != null) return;
            _resizePending = requestAnimationFrame(function () {
                _resizePending = null;
                applyOrientation();
            });
        });

        header.setTheme = function (sectionKey) { setTheme(header, sectionKey); };
        header.update = function () {
            header._portrait = isPortrait();
            setViewBoxAndHeight(header._portrait);
            updateHeaderPath(header);
        };

        return header;
    }

    global.SvgHeader = {
        init: init,
        create: createSvgHeader,
        updateHeaderPath: updateHeaderPath,
        setTheme: setTheme,
        buildPathD: buildPathD
    };
})(typeof window !== 'undefined' ? window : this);
