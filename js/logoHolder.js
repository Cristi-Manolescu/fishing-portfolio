export function setLogoGlowColor(hex) {
  const flood = document.getElementById("l-glow-flood");
  if (flood) flood.setAttribute("flood-color", hex);
}

// NEW subsystem: logo holder (top-left)
export function renderLogo(dom, glowHex) {
  const logoSvg = dom.logoSvg;
  const gGlow = dom.gLogoGlow;
  const gMask = dom.gLogoFillMask;
  const gLogo = dom.gLogoLayer;

  // === FINAL per your spec ===
  const LOGO_W = 600;
  const LOGO_H = 125;
  const R = 20;
  const ANG_DEG = 21.8;
  const PAD = 10;

  const tanA = Math.tan((ANG_DEG * Math.PI) / 180);
  const skewX = tanA * LOGO_H;

  const baseW = LOGO_W - skewX;
  const xShift = skewX;

  // SVG placement
  logoSvg.setAttribute("width", LOGO_W);
  logoSvg.setAttribute("height", LOGO_H);
  logoSvg.style.left = PAD + "px";
  logoSvg.style.top = PAD + "px";

  // Rounded-rect path (before skew)
  const rr = `
    M ${R} 0
    H ${baseW - R}
    Q ${baseW} 0 ${baseW} ${R}
    V ${LOGO_H - R}
    Q ${baseW} ${LOGO_H} ${baseW - R} ${LOGO_H}
    H ${R}
    Q 0 ${LOGO_H} 0 ${LOGO_H - R}
    V ${R}
    Q 0 0 ${R} 0
    Z
  `.trim();

  const holderGroup = (pathMarkup) => `
    <g transform="translate(${xShift}, 0) skewX(${-ANG_DEG})">
      ${pathMarkup}
    </g>
  `;

  // Mask shapes (white via mask group fill="white")
  gMask.innerHTML = holderGroup(`<path d="${rr}"></path>`);

  // Glow layer (opaque alpha only) — uses the SAME transform
  gGlow.innerHTML = holderGroup(
    `<path fill="#000" fill-opacity="1" d="${rr}"></path>`
  );

  const gFill = dom.gLogoFill; // make sure you still have this at the top

gFill.innerHTML = holderGroup(
  `<path fill="#000" fill-opacity="0.2" d="${rr}"></path>`
);

  // --- PNG placement box (logo image stays the authoritative visual) ---
  const innerPad = 16;
  const imgW = LOGO_W - innerPad * 2;
  const imgH = LOGO_H - innerPad * 2;

  // Your provided silhouette path (multi-subpath OK)
  const LOGO_PATH_D = `
M32.438416,88.634598 
	C31.595894,90.289818 31.079134,91.708290 30.315434,92.978256 
	C29.611015,94.149628 28.594095,96.080338 27.799353,96.039307 
	C26.435408,95.968880 25.027828,94.755638 23.842842,93.775269 
	C22.696932,92.827232 21.890808,91.479103 20.792137,90.461418 
	C17.304905,87.231232 15.628936,83.520813 17.868376,78.938843 
	C20.018435,74.539749 21.976103,69.955734 24.785297,65.997284 
	C27.206978,62.584888 26.874128,60.276711 24.119116,57.583286 
	C18.382730,51.975128 17.129230,46.126022 20.442009,38.837849 
	C25.839632,26.962984 35.876667,21.015678 48.188293,19.171259 
	C56.639610,17.905157 65.265594,17.719248 73.647011,20.891949 
	C81.000023,23.675358 85.995483,27.991018 87.113617,36.235821 
	C87.545013,39.416771 89.082268,42.447750 90.237129,45.911274 
	C98.452057,44.885693 101.257256,50.222691 101.427025,56.794567 
	C104.758530,53.452896 107.718933,49.298309 111.709831,46.770950 
	C117.078766,43.370911 120.709846,44.454521 124.691025,48.761806 
	C135.701706,43.335171 143.222427,45.069084 146.515854,54.005619 
	C147.294235,52.989594 148.059952,52.120972 148.680145,51.158581 
	C151.815430,46.293446 154.387589,45.682896 159.207214,48.381248 
	C160.047775,48.851864 161.581268,48.676929 162.542709,48.242466 
	C168.333145,45.625828 173.944901,48.270218 175.595428,55.231686 
	C178.434464,50.799519 179.439743,44.188320 185.697083,46.913837 
	C186.513138,43.647610 186.835999,40.624580 188.035614,38.002720 
	C189.456909,34.896435 191.658508,32.151188 193.477158,29.221685 
	C195.732407,25.588924 201.105011,27.315647 205.082809,30.751476 
	C206.015976,31.557501 206.502121,32.881065 206.672455,33.148331 
	C209.028641,31.368744 211.359299,28.153811 213.457382,28.299034 
	C219.528748,28.719275 221.490799,33.619534 221.766220,38.567745 
	C225.665680,38.917103 229.316620,38.825237 232.621307,39.849998 
	C233.397614,40.090721 233.004227,44.103416 233.184036,46.932621 
	C236.302734,48.653973 237.068344,51.235138 233.399353,53.701412 
	C230.045441,55.955872 225.626907,57.469067 221.606049,57.641499 
	C217.905685,57.800182 215.545532,58.545349 213.210663,61.419819 
	C208.808182,66.839729 203.644302,71.655624 199.407303,77.189911 
	C196.993301,80.343040 195.846237,84.450821 193.997253,88.061432 
	C193.465057,89.100708 192.260361,90.780228 191.737320,90.651321 
	C190.283173,90.292923 188.288986,89.425369 187.828690,88.244286 
	C186.480789,84.785698 184.677917,84.907166 181.675827,86.078354 
	C175.866501,88.344719 172.511856,87.277496 168.840729,82.528580 
	C163.617844,85.298218 158.483643,90.817978 152.312241,84.257706 
	C142.457993,88.147247 141.403442,88.009193 138.752167,83.348213 
	C134.312546,84.624939 129.923141,87.203835 125.977165,86.645981 
	C122.149353,86.104820 118.776978,82.342186 115.173798,79.974083 
	C108.847183,89.001564 99.721397,90.718079 92.876999,83.401932 
	C91.196678,84.250587 89.496780,85.243118 87.696091,85.993935 
	C81.839127,88.436043 77.900955,87.087372 74.145470,81.777054 
	C71.501839,78.038925 68.607643,74.478012 65.793480,70.796295 
	C60.509201,71.258278 54.290543,71.708344 48.103249,72.428047 
	C46.972389,72.559586 45.782242,73.618340 44.938820,74.541000 
	C40.785633,79.084358 36.740047,83.726074 32.438416,88.634598 

M367.283997,103.832466 
	C366.176453,102.359169 365.471191,101.013107 364.466736,99.949654 
	C357.577759,92.656303 357.371124,90.927185 362.700012,83.167084 
	C359.481384,82.173622 357.436340,82.952820 355.633942,86.203339 
	C350.858337,94.815796 343.316376,99.601990 333.402283,100.168793 
	C330.551697,100.331757 327.565247,99.858551 329.363556,95.495918 
	C328.251740,95.081528 326.740875,94.819283 325.610107,94.019547 
	C324.246826,93.055351 322.338684,91.682556 322.268188,90.398666 
	C322.196625,89.095634 323.908478,87.505638 325.134735,86.356674 
	C328.479553,83.222748 331.980225,80.255157 335.419159,77.221664 
	C334.947754,76.679573 334.476379,76.137474 334.005005,75.595383 
	C332.812012,76.490074 331.678436,77.480339 330.416595,78.264236 
	C320.832977,84.218002 311.314056,90.286026 301.561127,95.950249 
	C299.077789,97.392494 295.862183,97.817986 292.919098,98.159409 
	C289.651489,98.538467 288.467621,96.868500 290.152344,93.410080 
	C288.953674,93.234398 287.629700,93.420227 286.882812,92.850067 
	C285.425385,91.737450 283.381012,90.257378 283.293823,88.825104 
	C283.216064,87.547752 285.211273,85.721352 286.706726,84.847794 
	C291.875946,81.828293 297.226379,79.119133 301.961456,76.584305 
	C298.528564,71.047318 295.263794,66.504784 292.894257,61.535397 
	C292.147156,59.968575 293.385956,56.977074 294.579315,55.226151 
	C294.987854,54.626717 298.017456,55.958843 299.876740,56.175690 
	C305.349609,56.813976 310.825592,57.623318 316.320160,57.824577 
	C322.196869,58.039833 326.818176,55.437202 330.815979,50.927322 
	C339.522156,41.105972 348.639099,31.649025 357.559204,22.016338 
	C358.211060,21.312393 358.485443,20.231316 359.185303,19.604778 
	C360.991913,17.987417 363.801270,14.860563 364.670349,15.310537 
	C367.456268,16.752975 370.457794,19.121271 371.734161,21.889381 
	C375.819702,30.750025 373.285950,39.354733 368.427002,49.140514 
	C373.990875,44.590923 379.018188,41.667469 384.333557,45.448288 
	C385.893799,46.558071 385.654236,50.198181 386.240448,52.682457 
	C390.241852,50.911777 394.841125,48.732159 399.552307,46.829544 
	C405.024200,44.619709 409.348724,46.748108 412.924133,50.926624 
	C426.773010,42.258610 435.892334,44.445068 437.329132,57.717583 
	C439.664215,50.719635 443.880768,46.417744 450.261139,45.362869 
	C452.770538,44.947987 455.921021,46.311867 458.213806,47.760899 
	C459.081512,48.309280 458.354706,51.380634 458.354706,53.934753 
	C460.677460,55.033619 462.131317,56.646446 458.332062,59.968269 
	C456.415894,61.643600 455.813629,64.866043 454.726013,67.434990 
	C452.724457,72.162743 451.460693,77.353531 448.704102,81.577873 
	C443.801178,89.091415 434.276703,89.865646 427.827942,83.657684 
	C419.146545,89.887001 411.952332,87.686539 406.932983,78.841965 
	C400.743744,86.580490 395.388794,94.212868 389.063416,100.931633 
	C382.191101,108.231377 375.062225,108.810707 367.283997,103.832466 

M269.401642,48.405857 
	C278.358612,45.371605 279.330627,47.241913 283.136627,56.002411 
	C286.346558,63.390884 282.490173,66.818573 279.115845,71.308105 
	C276.170166,75.227333 272.360596,78.371078 271.797913,83.965256 
	C271.431885,87.603943 268.085388,86.710899 266.077576,84.999046 
	C263.714447,82.984253 261.815552,80.424927 259.042847,77.357796 
	C258.195129,79.622948 257.267883,81.272354 256.988495,83.025024 
	C256.458008,86.353142 255.034103,86.708031 252.150101,85.416542 
	C250.675674,84.756279 248.731842,84.833900 247.047546,85.016106 
	C243.334915,85.417717 238.873032,87.657295 236.142410,86.293236 
	C232.168396,84.308037 228.525452,80.257591 226.559189,76.205620 
	C225.459274,73.938980 227.468277,69.574112 229.083847,66.726189 
	C231.178040,63.034588 234.278030,59.914005 236.940689,56.544174 
	C237.754028,55.514816 239.103989,54.553127 239.265671,53.425327 
	C240.074982,47.779774 243.628860,46.281448 249.210861,47.101898 
	C247.186447,38.857452 253.422119,34.410107 256.705109,28.732792 
	C257.284393,27.730995 260.248322,27.049353 261.378235,27.634621 
	C264.139404,29.064837 266.974915,30.940670 268.819794,33.367462 
	C270.342590,35.370594 271.000122,38.404179 271.080750,41.010841 
	C271.143127,43.028370 269.720245,45.091835 268.656311,47.561668 
	C268.703918,48.127590 269.052765,48.266724 269.401642,48.405857
  `.trim();

  // New timing: reveal 0.5s -> visible 10s -> hide 0.5s -> hidden 10s (loop)
const LOOP_DUR = 21;
const k1 = 0.5 / LOOP_DUR;     // ~0.0238095238
const k2 = 10.5 / LOOP_DUR;    // 0.5
const k3 = 11 / LOOP_DUR;      // ~0.5238095238

// Glow look (20px-ish reach via blur stdDeviation; tune if needed)
const OUTER_BLUR = 8;          // 7–10
const INNER_BLUR = 4;          // 3–6

// Build ONCE to prevent SMIL restarts on hover/layout (fixes “3 pulses”)
if (gLogo.getAttribute("data-logo-built") !== "1") {
  gLogo.setAttribute("data-logo-built", "1");

  gLogo.innerHTML = `
    <defs>
      <filter id="logo-text-outer-glow" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${OUTER_BLUR}" result="b1"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="${INNER_BLUR}" result="b2"/>
        <feMerge>
          <feMergeNode in="b1"/>
          <feMergeNode in="b2"/>
        </feMerge>
      </filter>

      <!-- Clip path for inner glow (we'll transform this path in JS to match the fitted silhouette) -->
      <clipPath id="logo-text-clip" clipPathUnits="userSpaceOnUse">
        <path id="logo-text-clip-path" d="${LOGO_PATH_D}" />
      </clipPath>
    </defs>

    <!-- TEXT GLOW (under PNG) -->
    <g id="logo-text-glow-group">
      <!-- Outer glow stroke (MASTER) -->
      <path
        id="logo-text-stroke-outer"
        d="${LOGO_PATH_D}"
        fill="none"
        stroke="var(--ui-accent)"
        stroke-width="10"
        opacity="0.85"
        filter="url(#logo-text-outer-glow)"
        pathLength="100"
        stroke-dasharray="0 100"
        stroke-linecap="butt"
        stroke-linejoin="round"
      >
        <animate
          id="logo-sweep-anim"
          attributeName="stroke-dasharray"
          dur="${LOOP_DUR}s"
          repeatCount="indefinite"
          begin="indefinite"
          values="0 100; 100 0; 100 0; 0 100; 0 100"
          keyTimes="0; ${k1}; ${k2}; ${k3}; 1"
          calcMode="linear"
        />
      </path>

      <!-- Inner glow stroke (SLAVED to MASTER, clipped inside silhouette) -->
      <g clip-path="url(#logo-text-clip)">
        <path
          id="logo-text-stroke-inner"
          d="${LOGO_PATH_D}"
          fill="none"
          stroke="var(--ui-accent)"
          stroke-width="18"
          opacity="0.45"
          filter="url(#logo-text-outer-glow)"
          pathLength="100"
          stroke-dasharray="0 100"
          stroke-linecap="butt"
          stroke-linejoin="round"
        >
          <animate
            attributeName="stroke-dasharray"
            dur="${LOOP_DUR}s"
            repeatCount="indefinite"
            begin="logo-sweep-anim.begin"
            values="0 100; 100 0; 100 0; 0 100; 0 100"
            keyTimes="0; ${k1}; ${k2}; ${k3}; 1"
            calcMode="linear"
          />
        </path>
      </g>

      <!-- Crisp binder stroke (SLAVED to MASTER) -->
      <path
        id="logo-text-stroke-crisp"
        d="${LOGO_PATH_D}"
        fill="none"
        stroke="var(--ui-accent)"
        stroke-width="2"
        opacity="0.18"
        pathLength="100"
        stroke-dasharray="0 100"
        stroke-linecap="butt"
        stroke-linejoin="round"
      >
        <animate
          attributeName="stroke-dasharray"
          dur="${LOOP_DUR}s"
          repeatCount="indefinite"
          begin="logo-sweep-anim.begin"
          values="0 100; 100 0; 100 0; 0 100; 0 100"
          keyTimes="0; ${k1}; ${k2}; ${k3}; 1"
          calcMode="linear"
        />
      </path>
    </g>

    <!-- Base PNG (topmost) -->
    <image
      id="logo-png"
      href="assets/logo/logo.png"
      x="${innerPad}" y="${innerPad}"
      width="${imgW}" height="${imgH}"
      preserveAspectRatio="xMidYMid meet"
      opacity="0"
    >
      <animate
        id="logo-png-reveal"
        attributeName="opacity"
        begin="indefinite"
        dur="0.5s"
        values="0;0.95"
        fill="freeze"
      />
    </image>
  `;

  // ---- Auto-fit the silhouette to the PNG box (no viewBox provided) ----
  // We transform:
  //  - the visible glow group
  //  - the clip path silhouette
  // so inner/outer glow align perfectly with the PNG placement area.
  const glowGroup = logoSvg.querySelector("#logo-text-glow-group");
  const outerPath = logoSvg.querySelector("#logo-text-stroke-outer");
  const clipPath = logoSvg.querySelector("#logo-text-clip-path");

  if (glowGroup && outerPath && clipPath) {
    try {
      const bb = outerPath.getBBox();

      // Tune this visually: 1.0 = fit to full PNG box.
      // Smaller values shrink the glow toward the true text bounds inside the PNG.
      const SILHOUETTE_SCALE = 0.82; // locked best value

      const sx = imgW / bb.width;
      const sy = imgH / bb.height;
      const sFit = Math.min(sx, sy);
      const s = sFit * SILHOUETTE_SCALE;

      const tx = innerPad + (imgW - bb.width * s) / 2 - bb.x * s;
      const ty = innerPad + (imgH - bb.height * s) / 2 - bb.y * s;

      const xf = `translate(${tx}, ${ty}) scale(${s})`;

      glowGroup.setAttribute("transform", xf);
      clipPath.setAttribute("transform", xf);
    } catch (e) {
      // Keep untransformed on failure
    }
  }
}

// NOTE: holder background fill (0.2) should be applied via gFill using rr + holderGroup.
// e.g. gFill.innerHTML = holderGroup(`<path fill="#000" fill-opacity="0.2" d="${rr}"></path>`);

setLogoGlowColor(glowHex);

return {
  logoTopViewport: PAD,
  logoBottomViewport: PAD + LOGO_H
};
}
