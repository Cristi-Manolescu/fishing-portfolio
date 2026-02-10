/**
 * content-frame.js - Unified Content Frame (5 pieces)
 * Fixed geometry: NO scaling. Translate only.
 * Final pixel geometry from getBBox() normalization.
 *
 * === Step 1 — ScrollTrigger Inspection Report ===
 * Wordmark element: .frame-wordmark-wrap (wrap) containing .frame-wordmark-pescuit (span)
 * Wordmark container: .frame-s1-wordmark-slot inside holder top 250px (content-frame-wrap)
 * Filter refs: #wordmark-turb, #wordmark-disp (caustics SVG filter)
 * GSAP: loaded via CDN; registerPlugin(ScrollTrigger) in wordmark init
 * Real scroll container: window/html (window.scrollY, document.documentElement.scrollTop change)
 * Fixed background: .layout-bg-fixed (position: fixed, fullscreen) — body has has-bg-layer
 * overflow: body overflow-x: hidden; layout-middle overflow: visible (window scroll only)
 * ScrollTrigger: must NOT use custom scroller — use default (window)
 *
 */
(function (global) {
    'use strict';

    var R = 25;
    var DEBUG_SCROLL = true; /* Step 4: set false to disable debug logs/markers */
    var BR_H = 50;  /* fixed BR height */

    /* Fixed path data - DO NOT MODIFY */
    var TR_PATH = 'M 0 0 V 151 H 271.566 V -50.4 s -128.894 0.134 -175.666 0.183 c -16.829 0 -16.821 0.062 -24.961 9.072 C 61.27 -30.548 45.606 -13.378 37.931 -4.966 C 33.046 0 33.015 0 27.525 0 C 17.941 0 0 0 0 0 Z';
    var BL_PATH = 'M 0 0 V 101 s 146 0 184 0 c 11.334 0 11.334 0 22.75 -11.626 c 8.485 -9.78 20.192 -23.275 27.224 -31.38 C 240.042 51 240.042 51 246 51 c 9 0 26 0 26 0 V 0 H 0 Z';

    /* Normalized path data + viewBox (set once via getBBox) */
    var TR_NORM = { pathD: TR_PATH, viewBox: null, bbox: null };
    var BL_NORM = { pathD: BL_PATH, viewBox: null, bbox: null };

    var DEBUG_TR_ALIGN = false;

    /**
     * One-time normalization: getBBox, set viewBox. Path uses transform translate(-x,-y) for origin.
     */
    function measurePathBBox(pathD) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '1');
        svg.setAttribute('height', '1');
        svg.style.position = 'absolute';
        svg.style.left = '-9999px';
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        svg.appendChild(path);
        document.body.appendChild(svg);
        var bbox = path.getBBox();
        document.body.removeChild(svg);
        return bbox;
    }

    /**
     * Get bbox of path AFTER normalization transform (translate(-x,-y)).
     * This is the single source for TR_W, TR_H.
     */
    function getNormalizedPathBBox(pathD) {
        var origBbox = measurePathBBox(pathD);
        if (!origBbox || origBbox.width <= 0 || origBbox.height <= 0) {
            return { x: 0, y: 0, width: 272, height: 201 };
        }
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '1');
        svg.setAttribute('height', '1');
        svg.style.position = 'absolute';
        svg.style.left = '-9999px';
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('transform', 'translate(' + (-origBbox.x) + ',' + (-origBbox.y) + ')');
        svg.appendChild(path);
        document.body.appendChild(svg);
        var trPathBBox = path.getBBox();
        document.body.removeChild(svg);
        if (trPathBBox && trPathBBox.width > 0 && trPathBBox.height > 0) {
            return trPathBBox;
        }
        return { x: 0, y: 0, width: origBbox.width, height: origBbox.height };
    }

    function ensureNormalized() {
        if (!TR_NORM.viewBox) {
            var origBbox = measurePathBBox(TR_PATH);
            TR_NORM.bbox = (origBbox && origBbox.width > 0 && origBbox.height > 0) ? origBbox : { x: 0, y: 0, width: 272, height: 201 };
            var normBbox = getNormalizedPathBBox(TR_PATH);
            TR_NORM.normBbox = normBbox;
            TR_NORM.viewBox = '0 0 ' + normBbox.width + ' ' + normBbox.height;
        }
        if (!BL_NORM.viewBox) {
            var b = measurePathBBox(BL_PATH);
            BL_NORM.bbox = (b && b.width > 0 && b.height > 0) ? b : { x: 0, y: 0, width: 272, height: 101 };
            BL_NORM.viewBox = '0 0 ' + BL_NORM.bbox.width + ' ' + BL_NORM.bbox.height;
        }
    }

    /**
     * computeFrameLayout({ W, contentHeight })
     * CENTER_TOP_Y = single source of truth (y where center rect starts).
     * TR: TR_Y = CENTER_TOP_Y - TR_H, TR bottom == CENTER_TOP_Y exactly.
     */
    function computeFrameLayout(opts) {
        var ww = opts.W || (typeof document !== 'undefined' && document.documentElement ? document.documentElement.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 800));
        var CENTER_H = (opts && opts.contentHeight != null) ? opts.contentHeight : 400;

        ensureNormalized();

        var trNormBbox = TR_NORM.normBbox || getNormalizedPathBBox(TR_PATH);
        var TR_W = trNormBbox.width;
        var TR_H = trNormBbox.height;
        var BL_W = BL_NORM.bbox.width;
        var BL_H = BL_NORM.bbox.height;

        var CENTER_TOP_Y = TR_H;

        var TR_X = ww - TR_W;
        var TR_Y = CENTER_TOP_Y - TR_H;

        var tl = {
            x: 0,
            y: CENTER_TOP_Y - (TR_H - 50),
            width: ww - TR_W,
            height: TR_H - 50
        };

        var tr = {
            x: TR_X,
            y: TR_Y,
            width: TR_W,
            height: TR_H,
            pathD: TR_PATH,
            viewBox: TR_NORM.viewBox,
            bbox: TR_NORM.bbox
        };

        var center = {
            x: 0,
            y: CENTER_TOP_Y,
            width: ww,
            height: CENTER_H
        };

        var bl = {
            x: 0,
            y: CENTER_TOP_Y + CENTER_H,
            width: BL_W,
            height: BL_H,
            pathD: BL_PATH,
            viewBox: BL_NORM.viewBox,
            bbox: BL_NORM.bbox
        };

        var br = {
            x: BL_W,
            y: CENTER_TOP_Y + CENTER_H,
            width: Math.max(0, ww - BL_W),
            height: BR_H
        };

        var frameHeight = CENTER_TOP_Y + CENTER_H + BL_H;

        return { tl: tl, tr: tr, center: center, bl: bl, br: br, frameHeight: frameHeight, W: ww };
    }

    function replaceChildren(el, newChild) {
        while (el.firstChild) el.removeChild(el.firstChild);
        if (newChild) {
            if (newChild.nodeType === 11) {
                while (newChild.firstChild) el.appendChild(newChild.firstChild);
            } else {
                el.appendChild(newChild);
            }
        }
    }

    /**
     * Neon EDGE/RING filter (method 2B): crisp stroke + glow from union silhouette.
     * Morphological closing first (erode(dilate(SourceAlpha))) to remove internal seams.
     * Ring from closedAlpha: dilate(closed) OUT erode(closed). Glow=blur(ring), stroke=ring.
     * NO SourceGraphic - output is purely neon.
     */
    function createNeonEdgeFilter(defs, filterId) {
        var rClose = 1;
        var rStroke = 1;
        var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', filterId);
        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        filter.setAttribute('x', '-80');
        filter.setAttribute('y', '-80');
        filter.setAttribute('width', '2000');
        filter.setAttribute('height', '2000');
        filter.setAttribute('color-interpolation-filters', 'sRGB');

        var feCloseDilate = document.createElementNS('http://www.w3.org/2000/svg', 'feMorphology');
        feCloseDilate.setAttribute('in', 'SourceAlpha');
        feCloseDilate.setAttribute('operator', 'dilate');
        feCloseDilate.setAttribute('radius', String(rClose));
        feCloseDilate.setAttribute('result', 'closeDilated');
        filter.appendChild(feCloseDilate);

        var feCloseErode = document.createElementNS('http://www.w3.org/2000/svg', 'feMorphology');
        feCloseErode.setAttribute('in', 'closeDilated');
        feCloseErode.setAttribute('operator', 'erode');
        feCloseErode.setAttribute('radius', String(rClose));
        feCloseErode.setAttribute('result', 'closedAlpha');
        filter.appendChild(feCloseErode);

        var feRingDilate = document.createElementNS('http://www.w3.org/2000/svg', 'feMorphology');
        feRingDilate.setAttribute('in', 'closedAlpha');
        feRingDilate.setAttribute('operator', 'dilate');
        feRingDilate.setAttribute('radius', String(rStroke));
        feRingDilate.setAttribute('result', 'dilated');
        filter.appendChild(feRingDilate);

        var feRingErode = document.createElementNS('http://www.w3.org/2000/svg', 'feMorphology');
        feRingErode.setAttribute('in', 'closedAlpha');
        feRingErode.setAttribute('operator', 'erode');
        feRingErode.setAttribute('radius', String(rStroke));
        feRingErode.setAttribute('result', 'eroded');
        filter.appendChild(feRingErode);

        var feCompRing = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feCompRing.setAttribute('in', 'dilated');
        feCompRing.setAttribute('in2', 'eroded');
        feCompRing.setAttribute('operator', 'out');
        feCompRing.setAttribute('result', 'ring');
        filter.appendChild(feCompRing);

        var feBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feBlur.setAttribute('in', 'ring');
        feBlur.setAttribute('stdDeviation', '4');
        feBlur.setAttribute('result', 'glowBlur');
        filter.appendChild(feBlur);

        var feFloodGlow = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
        feFloodGlow.setAttribute('flood-color', 'var(--accent-color, #ff6701)');
        feFloodGlow.setAttribute('result', 'glowColor');
        filter.appendChild(feFloodGlow);

        var feCompGlow = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feCompGlow.setAttribute('in', 'glowColor');
        feCompGlow.setAttribute('in2', 'glowBlur');
        feCompGlow.setAttribute('operator', 'in');
        feCompGlow.setAttribute('result', 'glow');
        filter.appendChild(feCompGlow);

        var feFloodStroke = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
        feFloodStroke.setAttribute('flood-color', 'var(--accent-color, #ff6701)');
        feFloodStroke.setAttribute('result', 'strokeColor');
        filter.appendChild(feFloodStroke);

        var feCompStroke = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feCompStroke.setAttribute('in', 'strokeColor');
        feCompStroke.setAttribute('in2', 'ring');
        feCompStroke.setAttribute('operator', 'in');
        feCompStroke.setAttribute('result', 'stroke');
        filter.appendChild(feCompStroke);

        var feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        var mn1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        mn1.setAttribute('in', 'glow');
        feMerge.appendChild(mn1);
        var mn2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        mn2.setAttribute('in', 'stroke');
        feMerge.appendChild(mn2);
        filter.appendChild(feMerge);

        defs.appendChild(filter);
        return { feFloodGlow: feFloodGlow, feFloodStroke: feFloodStroke };
    }

    /**
     * Tiny dilate filter for seal underlay (fills hairline cracks).
     * Dilates alpha, then fills with seal color.
     */
    function createSealDilateFilter(defs) {
        var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'content-frame-seal-dilate');
        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        filter.setAttribute('x', '-50');
        filter.setAttribute('y', '-50');
        filter.setAttribute('width', '2500');
        filter.setAttribute('height', '2500');
        var feMorph = document.createElementNS('http://www.w3.org/2000/svg', 'feMorphology');
        feMorph.setAttribute('in', 'SourceAlpha');
        feMorph.setAttribute('operator', 'dilate');
        feMorph.setAttribute('radius', '1.0');
        feMorph.setAttribute('result', 'sealed');
        filter.appendChild(feMorph);
        var feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
        feFlood.setAttribute('flood-color', 'rgba(15, 15, 15, 0.8)');
        feFlood.setAttribute('result', 'sealColor');
        filter.appendChild(feFlood);
        var feComp = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feComp.setAttribute('in', 'sealColor');
        feComp.setAttribute('in2', 'sealed');
        feComp.setAttribute('operator', 'in');
        feComp.setAttribute('result', 'sealFill');
        filter.appendChild(feComp);
        var feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        var mn = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        mn.setAttribute('in', 'sealFill');
        feMerge.appendChild(mn);
        filter.appendChild(feMerge);
        defs.appendChild(filter);
    }

    /**
     * Single source of truth for TR/BL transform chain.
     * Fill, clipPath, mask, and stroke ALL use this.
     */
    function trTransform(tr) {
        return 'translate(' + tr.x + ',' + tr.y + ')';
    }
    function trPathTransform(tr) {
        return 'translate(' + (-tr.bbox.x) + ',' + (-tr.bbox.y) + ')';
    }
    function blTransform(bl) {
        return 'translate(' + bl.x + ',' + bl.y + ')';
    }
    function blPathTransform(bl) {
        return 'translate(' + (-bl.bbox.x) + ',' + (-bl.bbox.y) + ')';
    }

    function buildClipPathG(layout) {
        var tl = layout.tl;
        var c = layout.center;
        var bl = layout.bl;
        var br = layout.br;
        var tr = layout.tr;

        var tlPath = 'M' + (tl.x + R) + ',' + tl.y + ' H' + (tl.x + tl.width) + ' V' + (tl.y + tl.height) + ' H' + tl.x + ' V' + (tl.y + R) + ' A' + R + ',' + R + ' 0 0 1 ' + (tl.x + R) + ',' + tl.y + ' Z';
        var centerRect = 'M' + c.x + ',' + c.y + ' h' + c.width + ' v' + c.height + ' h' + (-c.width) + ' Z';
        var brPath = 'M' + br.x + ',' + br.y + ' H' + (br.x + br.width) + ' V' + (br.y + br.height - R) + ' A' + R + ',' + R + ' 0 0 1 ' + (br.x + br.width - R) + ',' + (br.y + br.height) + ' H' + br.x + ' Z';

        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        var tlEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tlEl.setAttribute('d', tlPath);
        g.appendChild(tlEl);

        var trG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        trG.setAttribute('transform', trTransform(tr));
        var trPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        trPathEl.setAttribute('d', tr.pathD);
        trPathEl.setAttribute('transform', trPathTransform(tr));
        trG.appendChild(trPathEl);
        g.appendChild(trG);

        var cEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        cEl.setAttribute('d', centerRect);
        g.appendChild(cEl);

        var blG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        blG.setAttribute('transform', blTransform(bl));
        var blPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        blPathEl.setAttribute('d', bl.pathD);
        blPathEl.setAttribute('transform', blPathTransform(bl));
        blG.appendChild(blPathEl);
        g.appendChild(blG);

        var brEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        brEl.setAttribute('d', brPath);
        g.appendChild(brEl);

        return g;
    }

    /**
     * Translate path "d" by (dx, dy). Returns new path string in world coordinates.
     */
    function pathTranslate(pathD, dx, dy) {
        var out = [];
        var cmdRx = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;
        var match;
        var lastX = 0, lastY = 0;
        var curX = 0, curY = 0;

        function pushStr(cmd, args) {
            out.push(cmd + args);
        }

        function readNums(s) {
            return (s || '').trim().replace(/(\d)-/g, '$1 -').split(/[\s,]+/).filter(Boolean).map(parseFloat);
        }

        while ((match = cmdRx.exec(pathD)) !== null) {
            var cmd = match[1];
            var raw = match[2];
            var n = readNums(raw);
            var u = cmd === cmd.toUpperCase();
            var i = 0;

            switch (cmd.toUpperCase()) {
                case 'M':
                    if (n.length >= 2) {
                        curX = u ? n[i++] + dx : curX + n[i++];
                        curY = u ? n[i++] + dy : curY + n[i++];
                        lastX = curX;
                        lastY = curY;
                        pushStr(cmd, ' ' + curX + ' ' + curY);
                        while (i < n.length - 1) {
                            curX = u ? n[i++] + dx : curX + n[i++];
                            curY = u ? n[i++] + dy : curY + n[i++];
                            pushStr('L', ' ' + curX + ' ' + curY);
                        }
                    }
                    break;
                case 'L':
                    while (i < n.length - 1) {
                        curX = u ? n[i++] + dx : curX + n[i++];
                        curY = u ? n[i++] + dy : curY + n[i++];
                        pushStr(cmd, ' ' + curX + ' ' + curY);
                    }
                    break;
                case 'H':
                    while (i < n.length) {
                        curX = u ? n[i++] + dx : curX + n[i++];
                        pushStr(cmd, ' ' + curX);
                    }
                    break;
                case 'V':
                    while (i < n.length) {
                        curY = u ? n[i++] + dy : curY + n[i++];
                        pushStr(cmd, ' ' + curY);
                    }
                    break;
                case 'C':
                    while (i < n.length - 5) {
                        var x1 = u ? n[i++] + dx : curX + n[i++];
                        var y1 = u ? n[i++] + dy : curY + n[i++];
                        var x2 = u ? n[i++] + dx : curX + n[i++];
                        var y2 = u ? n[i++] + dy : curY + n[i++];
                        curX = u ? n[i++] + dx : curX + n[i++];
                        curY = u ? n[i++] + dy : curY + n[i++];
                        pushStr(cmd, ' ' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 + ' ' + curX + ' ' + curY);
                    }
                    break;
                case 'S':
                    while (i < n.length - 3) {
                        var x2 = u ? n[i++] + dx : curX + n[i++];
                        var y2 = u ? n[i++] + dy : curY + n[i++];
                        curX = u ? n[i++] + dx : curX + n[i++];
                        curY = u ? n[i++] + dy : curY + n[i++];
                        pushStr(cmd, ' ' + x2 + ' ' + y2 + ' ' + curX + ' ' + curY);
                    }
                    break;
                case 'Z':
                    pushStr(cmd, '');
                    curX = lastX;
                    curY = lastY;
                    break;
                default:
                    pushStr(cmd, ' ' + raw);
            }
        }
        return out.join(' ');
    }

    var SILHOUETTE_OVERLAP = 1;

    /**
     * Build silhouette group (union of all pieces). MUST match FILL geometry exactly.
     * opts.outlineOverlap: when true, add 1px overlap at piece junctions (TL into TR,
     * center into top/bottom, BR into BL) to eliminate internal seams in outline only.
     * Does not affect content layout sizing.
     */
    function buildSilhouetteG(layout, opts) {
        var tl = layout.tl;
        var c = layout.center;
        var bl = layout.bl;
        var br = layout.br;
        var tr = layout.tr;
        var ov = (opts && opts.outlineOverlap) ? SILHOUETTE_OVERLAP : 0;

        var tlPath = 'M' + (tl.x + R) + ',' + tl.y + ' H' + (tl.x + tl.width + ov) + ' V' + (tl.y + tl.height) + ' H' + tl.x + ' V' + (tl.y + R) + ' A' + R + ',' + R + ' 0 0 1 ' + (tl.x + R) + ',' + tl.y + ' Z';
        var centerRect = 'M' + c.x + ',' + (c.y - ov) + ' h' + c.width + ' v' + (c.height + ov + ov) + ' h' + (-c.width) + ' Z';
        var brPath = 'M' + (br.x - ov) + ',' + br.y + ' H' + (br.x + br.width) + ' V' + (br.y + br.height - R) + ' A' + R + ',' + R + ' 0 0 1 ' + (br.x + br.width - R) + ',' + (br.y + br.height) + ' H' + (br.x - ov) + ' Z';

        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('fill', 'white');
        g.setAttribute('stroke', 'none');

        var tlEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tlEl.setAttribute('d', tlPath);
        g.appendChild(tlEl);

        var trG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        trG.setAttribute('transform', trTransform(tr));
        var trPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        trPathEl.setAttribute('d', tr.pathD);
        trPathEl.setAttribute('transform', trPathTransform(tr));
        trG.appendChild(trPathEl);
        g.appendChild(trG);

        var cEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        cEl.setAttribute('d', centerRect);
        g.appendChild(cEl);

        var blG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        blG.setAttribute('transform', blTransform(bl));
        var blPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        blPathEl.setAttribute('d', bl.pathD);
        blPathEl.setAttribute('transform', blPathTransform(bl));
        blG.appendChild(blPathEl);
        g.appendChild(blG);

        var brEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        brEl.setAttribute('d', brPath);
        g.appendChild(brEl);

        return g;
    }

    /**
     * Water caustics SVG filter for wordmark liquid distortion.
     * feTurbulence + feDisplacementMap. Returns { turb, disp } for GSAP animation.
     */
    function createCausticsFilter(defs) {
        var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'wordmark-caustics');
        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        filter.setAttribute('x', '-20%');
        filter.setAttribute('y', '-20%');
        filter.setAttribute('width', '140%');
        filter.setAttribute('height', '140%');

        var feTurbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
        feTurbulence.setAttribute('id', 'wordmark-turb');
        feTurbulence.setAttribute('type', 'fractalNoise');
        feTurbulence.setAttribute('baseFrequency', '0.015 0.02');
        feTurbulence.setAttribute('numOctaves', '3');
        feTurbulence.setAttribute('result', 'turb');
        feTurbulence.setAttribute('seed', '1');
        filter.appendChild(feTurbulence);

        var feDisplacementMap = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
        feDisplacementMap.setAttribute('id', 'wordmark-disp');
        feDisplacementMap.setAttribute('in', 'SourceGraphic');
        feDisplacementMap.setAttribute('in2', 'turb');
        feDisplacementMap.setAttribute('scale', '3');
        feDisplacementMap.setAttribute('xChannelSelector', 'R');
        feDisplacementMap.setAttribute('yChannelSelector', 'G');
        filter.appendChild(feDisplacementMap);

        defs.appendChild(filter);
    }

    /**
     * Seal underlay: silhouette with tiny dilate to fill hairline cracks.
     * Same geometry as buildSilhouetteG, fill=smoked glass color, filter=dilate.
     */
    function buildSealUnderlayG(layout) {
        var g = buildSilhouetteG(layout);
        g.setAttribute('fill', 'rgba(15, 15, 15, 0.8)');
        g.setAttribute('filter', 'url(#content-frame-seal-dilate)');
        return g;
    }

    /*
     * DOM structure (content-first):
     * FrameShell (content-frame-shell) position:relative, in document flow
     *   ├── FrameVisual (content-frame-visual) position:absolute;inset:0;z-index:0;pointer-events:none
     *   │     ├── glassLayer
     *   │     └── svg (defs, clipPath, frameRoot: fill + outline)
     *   └── ContentLayer (content-frame-content) position:relative;z-index:1
     *         ├── wordmarkSlot
     *         └── contentSlot (#app) — real content in normal flow
     */
    function createContentFrame(rootEl) {
        if (!rootEl) return null;

        ensureNormalized();

        var shell = document.createElement('div');
        shell.className = 'content-frame-shell';

        var frameVisual = document.createElement('div');
        frameVisual.className = 'content-frame-visual';

        var wordmarkSlot = document.createElement('div');
        wordmarkSlot.className = 'frame-s1-wordmark-slot wordmark-container';

        var contentLayer = document.createElement('div');
        contentLayer.className = 'content-frame-content';

        var contentSlot = document.createElement('div');
        contentSlot.className = 'content-frame-slot';
        contentSlot.id = 'app';

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'content-frame-svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('overflow', 'visible');

        var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);

        var neonEdgeInfo = createNeonEdgeFilter(defs, 'content-frame-neon-edge');
        createSealDilateFilter(defs);
        createCausticsFilter(defs);

        var clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', 'content-frame-clip');
        clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
        defs.appendChild(clipPath);

        var frameRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        frameRoot.setAttribute('id', 'frameRoot');

        var fillGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        fillGroup.setAttribute('class', 'content-frame-fill-group');

        var outlineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        outlineGroup.setAttribute('id', 'outlineGroup');
        outlineGroup.setAttribute('class', 'content-frame-outline');
        outlineGroup.setAttribute('filter', 'url(#content-frame-neon-edge)');

        frameRoot.appendChild(fillGroup);
        frameRoot.appendChild(outlineGroup);
        svg.appendChild(frameRoot);

        var glassLayer = document.createElement('div');
        glassLayer.className = 'content-frame-glass glass-smoked';

        frameVisual.appendChild(glassLayer);
        frameVisual.appendChild(svg);

        contentLayer.appendChild(wordmarkSlot);
        contentLayer.appendChild(contentSlot);

        shell.appendChild(frameVisual);
        shell.appendChild(contentLayer);

        var app = document.getElementById('app');
        if (app && app.parentNode) {
            while (app.firstChild) contentSlot.appendChild(app.firstChild);
            app.parentNode.replaceChild(shell, app);
        } else {
            rootEl.appendChild(shell);
        }

        return {
            stage: shell,
            shell: shell,
            frameVisual: frameVisual,
            contentLayer: contentLayer,
            wordmarkSlot: wordmarkSlot,
            contentSlot: contentSlot,
            svg: svg,
            defs: defs,
            clipPath: clipPath,
            frameRoot: frameRoot,
            fillGroup: fillGroup,
            outlineGroup: outlineGroup,
            glassLayer: glassLayer,
            neonEdgeFeFloods: [neonEdgeInfo.feFloodGlow, neonEdgeInfo.feFloodStroke]
        };
    }

    function createFillPieces(layout) {
        var tl = layout.tl;
        var c = layout.center;
        var br = layout.br;
        var tr = layout.tr;
        var bl = layout.bl;

        var tlPathD = 'M' + (tl.x + R) + ',' + tl.y + ' H' + (tl.x + tl.width) + ' V' + (tl.y + tl.height) + ' H' + tl.x + ' V' + (tl.y + R) + ' A' + R + ',' + R + ' 0 0 1 ' + (tl.x + R) + ',' + tl.y + ' Z';
        var brPathD = 'M' + br.x + ',' + br.y + ' H' + (br.x + br.width) + ' V' + (br.y + br.height - R) + ' A' + R + ',' + R + ' 0 0 1 ' + (br.x + br.width - R) + ',' + (br.y + br.height) + ' H' + br.x + ' Z';

        var frag = document.createDocumentFragment();

        var tlEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tlEl.setAttribute('d', tlPathD);
        tlEl.setAttribute('class', 'content-frame-fill');
        tlEl.setAttribute('stroke', 'none');
        frag.appendChild(tlEl);

        var trGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        trGroup.setAttribute('class', 'content-frame-tr');
        trGroup.setAttribute('transform', trTransform(tr));
        var trPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        trPath.setAttribute('d', tr.pathD);
        trPath.setAttribute('transform', trPathTransform(tr));
        trPath.setAttribute('class', 'content-frame-fill');
        trPath.setAttribute('stroke', 'none');
        trGroup.appendChild(trPath);
        frag.appendChild(trGroup);

        var cRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cRect.setAttribute('x', String(c.x));
        cRect.setAttribute('y', String(c.y - 1));
        cRect.setAttribute('width', String(c.width));
        cRect.setAttribute('height', String(c.height + 2));
        cRect.setAttribute('class', 'content-frame-fill');
        cRect.setAttribute('stroke', 'none');
        frag.appendChild(cRect);

        var blSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        blSvg.setAttribute('class', 'content-frame-bl');
        blSvg.setAttribute('x', String(bl.x));
        blSvg.setAttribute('y', String(bl.y));
        blSvg.setAttribute('width', String(bl.bbox.width));
        blSvg.setAttribute('height', String(bl.bbox.height));
        blSvg.setAttribute('viewBox', bl.viewBox);
        blSvg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        var blPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        blPath.setAttribute('d', bl.pathD);
        blPath.setAttribute('transform', 'translate(' + (-bl.bbox.x) + ',' + (-bl.bbox.y) + ')');
        blPath.setAttribute('class', 'content-frame-fill');
        blPath.setAttribute('stroke', 'none');
        blSvg.appendChild(blPath);
        frag.appendChild(blSvg);

        var brEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        brEl.setAttribute('d', brPathD);
        brEl.setAttribute('class', 'content-frame-fill');
        brEl.setAttribute('stroke', 'none');
        frag.appendChild(brEl);

        return frag;
    }

    function updateContentFrame(frame, opts) {
        if (!frame) return;

        var W = (typeof document !== 'undefined' && document.documentElement) ? document.documentElement.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 800);
        var contentHeight = (opts && opts.contentHeight != null) ? opts.contentHeight : 400;

        var layout = computeFrameLayout({ W: W, contentHeight: contentHeight });

        frame.svg.setAttribute('viewBox', '0 0 ' + layout.W + ' ' + layout.frameHeight);
        frame.svg.setAttribute('width', String(layout.W));
        frame.svg.setAttribute('height', String(layout.frameHeight));

        replaceChildren(frame.clipPath, buildClipPathG(layout));

        var fillFrag = document.createDocumentFragment();
        fillFrag.appendChild(buildSealUnderlayG(layout));
        var pieces = createFillPieces(layout);
        while (pieces.firstChild) fillFrag.appendChild(pieces.firstChild);
        replaceChildren(frame.fillGroup, fillFrag);

        var outlineSilhouette = buildSilhouetteG(layout, { outlineOverlap: true });
        outlineSilhouette.setAttribute('fill', 'white');
        outlineSilhouette.setAttribute('stroke', 'none');
        replaceChildren(frame.outlineGroup, outlineSilhouette);

        var frameX = 0;
        var frameY = 0;
        frame.frameRoot.setAttribute('transform', 'translate(' + frameX + ' ' + frameY + ')');

        frame.glassLayer.style.clipPath = 'url(#content-frame-clip)';
        frame.glassLayer.style.webkitClipPath = 'url(#content-frame-clip)';
        frame.glassLayer.style.width = layout.W + 'px';
        frame.glassLayer.style.height = layout.frameHeight + 'px';

        if (global.ContentFrame && global.ContentFrame.DEBUG_GLASS) {
            var cs = typeof getComputedStyle !== 'undefined' && frame.glassLayer ? getComputedStyle(frame.glassLayer) : null;
            console.log('[GLASS_DEBUG] clipPath:', cs ? cs.clipPath : 'N/A', 'backdropFilter:', cs ? cs.backdropFilter : 'N/A', 'backgroundColor:', cs ? cs.backgroundColor : 'N/A');
        }

        /* Content is in normal flow; no layout positioning from frame */

        var theme = opts && opts.theme;
        var hex = (theme && theme.hex) ? theme.hex : '#ff6701';
        if (frame.neonEdgeFeFloods) {
            frame.neonEdgeFeFloods.forEach(function (fe) {
                fe.setAttribute('flood-color', hex);
            });
        }

        if (global.ContentFrame && global.ContentFrame.DEBUG_TR_ALIGN) {
            var tr = layout.tr;
            var trBottom = tr.y + tr.height;
            var delta = trBottom - layout.center.y;
            console.log('[TR_DEBUG] TR_H=' + tr.height + ' TR_Y=' + tr.y + ' trBottom=' + trBottom + ' CENTER_TOP_Y=' + layout.center.y + ' delta=' + delta);
            var dbg = frame.svg.querySelector('.content-frame-tr-debug');
            if (dbg && dbg.parentNode) dbg.parentNode.removeChild(dbg);
            var debugG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            debugG.setAttribute('class', 'content-frame-tr-debug');
            var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', '0');
            line1.setAttribute('y1', String(layout.center.y));
            line1.setAttribute('x2', String(layout.W));
            line1.setAttribute('y2', String(layout.center.y));
            line1.setAttribute('stroke', 'cyan');
            line1.setAttribute('stroke-width', '1');
            var line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', '0');
            line2.setAttribute('y1', String(trBottom));
            line2.setAttribute('x2', String(layout.W));
            line2.setAttribute('y2', String(trBottom));
            line2.setAttribute('stroke', 'magenta');
            line2.setAttribute('stroke-width', '1');
            debugG.appendChild(line1);
            debugG.appendChild(line2);
            frame.svg.appendChild(debugG);
        }
    }

    function updateHolderPosition(frame) {
        /* Disabled: content-first layout; no spacer/holder positioning */
        if (!frame) return;
    }

    function initFrameStage(frame, scrollContainer) {
        if (!frame || !frame.stage || !frame.contentLayer) return;

        function doRefresh() {
            var st = (typeof global !== 'undefined' && global.ScrollTrigger) ? global.ScrollTrigger : (typeof window !== 'undefined' && window.ScrollTrigger ? window.ScrollTrigger : null);
            if (st && st.refresh) st.refresh();
        }

        function doUpdateFrame() {
            var h = frame._contentHeight;
            if (h == null) h = 400;
            var route = global.Router && global.Router.parseHash ? global.Router.parseHash() : {};
            var resolved = global.Router && global.Router.resolveRoute ? global.Router.resolveRoute(route) : { section: 'home' };
            var themeKey = global.SECTION_TO_THEME_KEY && global.SECTION_TO_THEME_KEY[resolved.section];
            var theme = themeKey && global.THEME ? global.THEME[themeKey] : null;
            updateContentFrame(frame, { contentHeight: h, theme: theme });
        }

        if (typeof ResizeObserver !== 'undefined' && frame.contentLayer) {
            var ro = new ResizeObserver(function (entries) {
                for (var i = 0; i < entries.length; i++) {
                    var el = entries[i].target;
                    var h = el.offsetHeight || el.getBoundingClientRect().height;
                    frame._contentHeight = Math.max(100, h);
                    doUpdateFrame();
                }
            });
            ro.observe(frame.contentLayer);
            frame._resizeObserver = ro;
            var initialH = frame.contentLayer.offsetHeight || frame.contentLayer.getBoundingClientRect().height;
            if (initialH > 0) frame._contentHeight = Math.max(100, initialH);
        }

        requestAnimationFrame(function () {
            doUpdateFrame();
            doRefresh();
        });
        if (typeof window !== 'undefined') {
            if (document.readyState === 'complete') {
                doRefresh();
            } else {
                window.addEventListener('load', function () { doRefresh(); }, { once: true });
            }
            var _resizePending = null;
            window.addEventListener('resize', function () {
                if (_resizePending != null) return;
                _resizePending = requestAnimationFrame(function () {
                    _resizePending = null;
                    doUpdateFrame();
                    doRefresh();
                });
            });
        }
    }

    function updateWordmarkSlot(frame, sectionKey) {
        if (!frame || !frame.wordmarkSlot) return;
        killWordmarkAnimations(frame);

        frame.wordmarkSlot.innerHTML = '';
        if (sectionKey !== 'home') return;

        var wrap = document.createElement('div');
        wrap.className = 'frame-wordmark-wrap';

        var span = document.createElement('span');
        span.className = 'frame-wordmark-pescuit';
        span.textContent = 'PESCUIT ÎN ARGEȘ';
        wrap.appendChild(span);

        frame.wordmarkSlot.appendChild(wrap);
        frame._wordmarkEl = wrap;

        initWordmarkAnimations(frame, wrap);
    }

    function killWordmarkAnimations(frame) {
        if (frame._wordmarkLoop) {
            if (frame._wordmarkLoop.wrap) { frame._wordmarkLoop.wrap.kill(); frame._wordmarkLoop.wrap = null; }
            if (frame._wordmarkLoop.turb) { frame._wordmarkLoop.turb.kill(); frame._wordmarkLoop.turb = null; }
            frame._wordmarkLoop = null;
        }
        if (frame._wordmarkIntroTl) { frame._wordmarkIntroTl.kill(); frame._wordmarkIntroTl = null; }
        if (frame._wordmarkScrollTl) { frame._wordmarkScrollTl.kill(); frame._wordmarkScrollTl = null; }
        if (frame._wordmarkST) { frame._wordmarkST.kill(); frame._wordmarkST = null; }
        if (frame._wordmarkEl) {
            frame._wordmarkEl.removeEventListener('mouseenter', frame._onHoverIn);
            frame._wordmarkEl.removeEventListener('mouseleave', frame._onHoverOut);
            frame._wordmarkEl.removeEventListener('touchstart', frame._onTouchIn);
            frame._wordmarkEl.removeEventListener('touchend', frame._onTouchOut);
        }
    }

    /* Step 3 — Modular wordmark timelines (replayable, no global side effects) */
    function createWordmarkIntroTL(gsap, el, filterStuff) {
        var span = el && el.querySelector ? el.querySelector('.frame-wordmark-pescuit') : null;
        var disp = filterStuff && filterStuff.disp;
        var tl = gsap.timeline({ paused: true });
        gsap.set(el, { y: 50, opacity: 0 });
        if (span) gsap.set(span, { letterSpacing: '0.3em' });
        if (disp) gsap.set(disp, { attr: { scale: 20 } });
        tl.to(el, { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }, 0);
        if (disp) tl.to(disp, { attr: { scale: (filterStuff && filterStuff.dispScaleRest) || 3 }, duration: 1, ease: 'power2.out' }, 0);
        return tl;
    }

    function createWordmarkLoopTL(gsap, el, filterStuff) {
        var wrapTl = gsap.to(el, { y: -3, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        var turb = filterStuff && filterStuff.turb;
        var turbTl = turb ? gsap.to(turb, { attr: { baseFrequency: '0.025 0.03' }, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 }) : null;
        return { wrap: wrapTl, turb: turbTl };
    }

    function initWordmarkAnimations(frame, wrap) {
        var gsap = (typeof global !== 'undefined' && global.gsap) ? global.gsap : (typeof window !== 'undefined' && window.gsap ? window.gsap : null);
        var ScrollTrigger = (typeof global !== 'undefined' && global.ScrollTrigger) ? global.ScrollTrigger : (typeof window !== 'undefined' && window.ScrollTrigger ? window.ScrollTrigger : null);
        if (!gsap || !gsap.to) return;

        if (ScrollTrigger && gsap.registerPlugin) {
            gsap.registerPlugin(ScrollTrigger);
        }

        var turb = document.getElementById('wordmark-turb');
        var disp = document.getElementById('wordmark-disp');
        var filterStuff = { turb: turb, disp: disp, dispScaleRest: 3 };
        var span = wrap.querySelector('.frame-wordmark-pescuit');
        var DISP_SCALE_INTENSE = 12;
        var DISP_SCALE_EXIT = 15;

        /* Step 3 — Intro timeline (replayable) */
        frame._wordmarkIntroTl = createWordmarkIntroTL(gsap, wrap, filterStuff);

        function playIntro() {
            if (frame._wordmarkIntroTl) {
                frame._wordmarkIntroTl.restart();
            }
        }

        function startLiquidLoop() {
            if (frame._wordmarkLoop) {
                if (frame._wordmarkLoop.wrap) frame._wordmarkLoop.wrap.kill();
                if (frame._wordmarkLoop.turb) frame._wordmarkLoop.turb.kill();
            }
            frame._wordmarkLoop = createWordmarkLoopTL(gsap, wrap, filterStuff);
        }

        function stopLiquidLoop() {
            if (frame._wordmarkLoop) {
                if (frame._wordmarkLoop.wrap) { frame._wordmarkLoop.wrap.kill(); frame._wordmarkLoop.wrap = null; }
                if (frame._wordmarkLoop.turb) { frame._wordmarkLoop.turb.kill(); frame._wordmarkLoop.turb = null; }
                frame._wordmarkLoop = null;
            }
        }

        /* Scroll-driven hide/show — uses default scroller (window); no scroller option */
        var stConfig = {
            trigger: frame.stage,
            start: 'top top',
            end: '+=250',
            scrub: true,
            invalidateOnRefresh: true,
            onEnter: function () {
                playIntro();
                gsap.delayedCall(1, startLiquidLoop);
                if (DEBUG_SCROLL && console && console.log) console.log('[Wordmark] onEnter — Screen 1 visible');
            },
            onEnterBack: function () {
                stopLiquidLoop();
                playIntro();
                gsap.delayedCall(1, startLiquidLoop);
                if (DEBUG_SCROLL && console && console.log) console.log('[Wordmark] onEnterBack — returning to Screen 1');
            },
            onLeave: function () {
                stopLiquidLoop();
                if (DEBUG_SCROLL && console && console.log) console.log('[Wordmark] onLeave — leaving Screen 1');
            }
        };
        stConfig.markers = DEBUG_SCROLL;

        var hideTl = gsap.timeline({ scrollTrigger: stConfig });
        hideTl.to(wrap, { opacity: 0, y: 20, ease: 'power2.in' }, 0);
        if (span) hideTl.to(span, { letterSpacing: '0.1em', ease: 'power2.in' }, 0);
        if (disp) hideTl.to(disp, { attr: { scale: DISP_SCALE_EXIT }, ease: 'power2.in' }, 0);

        frame._wordmarkScrollTl = hideTl;
        frame._wordmarkST = ScrollTrigger.getAll().filter(function (st) { return st.trigger === frame.stage; })[0];

        function doRefresh() {
            if (ScrollTrigger && ScrollTrigger.refresh) ScrollTrigger.refresh();
        }
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(function () { doRefresh(); });
        }
        if (typeof window !== 'undefined') {
            if (document.readyState === 'complete') {
                doRefresh();
            } else {
                window.addEventListener('load', doRefresh, { once: true });
            }
        }

        var scrollY = (typeof window !== 'undefined' && window) ? (window.scrollY || window.pageYOffset || 0) : 0;
        if (scrollY <= 1) {
            playIntro();
            gsap.delayedCall(1, startLiquidLoop);
        }

        /* Step 4 — Debug instrumentation */
        if (DEBUG_SCROLL && ScrollTrigger && ScrollTrigger.addEventListener && typeof window !== 'undefined') {
            ScrollTrigger.addEventListener('update', function () {
                if (console && console.log) {
                    var y = window.scrollY || window.pageYOffset || 0;
                    console.log('[Wordmark] scrollY:', y, 'triggerActive:', frame._wordmarkST ? frame._wordmarkST.isActive : 'N/A');
                }
            });
        }

        frame._onHoverIn = function () {
            if (disp) gsap.to(disp, { attr: { scale: DISP_SCALE_INTENSE }, duration: 0.3, ease: 'power2.out' });
        };
        frame._onHoverOut = function () {
            if (disp) gsap.to(disp, { attr: { scale: filterStuff.dispScaleRest }, duration: 0.3, ease: 'power2.out' });
        };
        frame._onTouchIn = frame._onHoverIn;
        frame._onTouchOut = frame._onHoverOut;

        wrap.addEventListener('mouseenter', frame._onHoverIn);
        wrap.addEventListener('mouseleave', frame._onHoverOut);
        wrap.addEventListener('touchstart', frame._onTouchIn, { passive: true });
        wrap.addEventListener('touchend', frame._onTouchOut, { passive: true });
    }

    global.ContentFrame = {
        computeFrameLayout: computeFrameLayout,
        createContentFrame: createContentFrame,
        updateContentFrame: updateContentFrame,
        initFrameStage: initFrameStage,
        updateHolderPosition: updateHolderPosition,
        updateWordmarkSlot: updateWordmarkSlot,
        DEBUG_TR_ALIGN: false,
        DEBUG_STROKE_ALIGN: false,
        DEBUG_GLASS: false,
        DEBUG_SCROLL: DEBUG_SCROLL
    };
})(typeof window !== 'undefined' ? window : this);
