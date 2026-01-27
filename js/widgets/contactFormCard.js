// /js/widgets/contactFormCard.js
/**
 * ============================================================
 * CONTACT SECTION — LOCKED
 * ============================================================
 *
 * Status:
 * ✔ Visual design final
 * ✔ Geometry final
 * ✔ Button behavior final
 * ✔ Tooltips final
 * ✔ Social icons final
 *
 * DO NOT REFACTOR without explicit intent.
 * Only minor copy / link updates allowed.
 *
 * Locked on: 2026-01-27
 * Tag: v1.5-contact-complete
 */


function elFromHTML(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function isValidEmail(v) {
  const s = String(v || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function safeEncodeMailto(text) {
  return encodeURIComponent(text);
}

function buildMailtoHref({ to, subject, body }) {
  const qs = `subject=${safeEncodeMailto(subject)}&body=${safeEncodeMailto(body)}`;
  return `mailto:${to}?${qs}`;
}

async function copyText(text) {
  const v = String(text ?? "");
  if (!v) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(v);
      return true;
    } catch (_) {}
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = v;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return !!ok;
  } catch (_) {
    return false;
  }
}

export function createContactFormCard(mountEl, { emailTo }) {
  if (!mountEl) throw new Error("createContactFormCard: mountEl missing");
  if (!emailTo) throw new Error("createContactFormCard: emailTo missing");

  // ✅ FINAL paths (as provided)
  const PATH_NUME =
    `M 772 51 C 572.3822 51.3949 372 51 173 51 C 155 51 153.3595 56.8869 148.8025 66.8356 C 146.9328 70.9174 145.3873 75.1476 143.6911 79.3089 C 141.4788 84.736 139.2632 90.1618 136.879 96.0052 C 141 96 141 96 141 96 C 406.7862 96.0052 670.8896 96.0052 937 96 C 937 96 937 96 940 96 C 944 87 946 82 949 75 C 957 55 944 51 933 51 C 880 51 827 51 772 51`;

  const PATH_EMAIL =
    `M 328 106 C 264 106 201 106 133 106 C 127.2254 120.091 122.45 131.2721 117.9147 142.5458 C 116.8448 145.2051 116.0105 147.9593 114.953 151 C 117 151 119 151 120 151 C 385 151 649 151 915 151 C 915 151 915 151 918 151 C 924.6239 134.8902 930.3387 120.7195 936.3162 106.0001 C 733 106 531 106 328 106`;

  const PATH_MSG =
    `M 203 161 C 174 161 144 161 111 161 C 93.0623 204.5793 77.0644 244.0862 61.1106 283.6108 C 58.7414 289.4803 56.2035 295.2877 54.0236 301.2266 C 51 310 53 326 71 326 C 171 326 271 326 387 326 C 392 340 393.0659 342.4556 394.0269 345.095 C 395.7922 349.944 399 351 404 351 C 543 351 682 351 821 351 C 833 351 838.6384 345.8927 842.9861 337.0869 C 845.6312 331.7296 847.7303 326.0974 849.9737 320.5479 C 866.6511 279.2915 883.3309 238.0362 899.9454 196.7544 C 904.6379 185.0946 909.1155 173.3482 913.9424 161 C 677 161 440 161 203 161`;

  const root = elFromHTML(`
    <section class="contact-card" aria-label="Contact">

      <form class="contact-form" novalidate>

        <!-- BOARD (fixed aspect, no distortion) -->
        <div class="contact-board" aria-label="Contact form">

          <svg class="contact-board-svg"
               viewBox="0 0 1000 400"
               preserveAspectRatio="xMidYMid meet"
               aria-hidden="true">
            <!-- Glass fills (same paths) -->
            <path class="board-fill" fill="#000000" fill-opacity="0.25" d="${PATH_NUME}"></path>
            <path class="board-fill" fill="#000000" fill-opacity="0.25" d="${PATH_EMAIL}"></path>
            <path class="board-fill" fill="#000000" fill-opacity="0.25" d="${PATH_MSG}"></path>

            <!-- Strokes (same paths) -->
            <path class="board-stroke" d="${PATH_NUME}"></path>
            <path class="board-stroke" d="${PATH_EMAIL}"></path>
            <path class="board-stroke board-stroke--msg" d="${PATH_MSG}"></path>
          </svg>

          <!-- Inputs placed in board coordinate space -->
          <input class="board-input board-input--name"
                 type="text"
                 name="name"
                 placeholder="Nume"
                 autocomplete="name" />

          <input class="board-input board-input--email"
                 type="email"
                 name="email"
                 placeholder="E-mail"
                 autocomplete="email"
                 required />

          <textarea class="board-textarea"
                    name="message"
                    placeholder="Mesaj"
                    required></textarea>

          <!-- Hint pinned inside board, does not affect geometry -->
        </div>

        <!-- Actions are OUTSIDE the board so board geometry stays stable -->


<!-- BUTTON GROUP (anchored to board, identical to main buttons, flipped gfx only) -->
<div class="contact-btngroup" role="group" aria-label="Acțiuni contact">
  <!-- Copy email -->
  <button type="button" class="cbtn" data-action="copy-email" data-hint="Copiază e-mail" aria-label="Copiază e-mail">
    <span class="cbtn__gfx" aria-hidden="true">
      <svg class="cbtn__svg" viewBox="0 0 115 25" preserveAspectRatio="none" focusable="false">
        <defs>
          <path id="cbtn-shape"
            d="M 0 0 L 96.91 0 A 8 8 0 0 1 103.96 4.24 L 115 25 L 13.29 25 Z" />

          <clipPath id="cbtn-clip">
            <use href="#cbtn-shape"></use>
          </clipPath>

          <clipPath id="cbtn-top-strip-band" clipPathUnits="userSpaceOnUse">
            <rect x="-50" y="3" width="300" height="2"></rect>
          </clipPath>

          <clipPath id="cbtn-cp-contact-visible" clipPathUnits="userSpaceOnUse">
            <rect x="-50" y="-50" width="300" height="82"></rect>
            <rect x="92" y="-50" width="200" height="300"></rect>
          </clipPath>

          <g id="cbtn-base-black">
            <use href="#cbtn-shape" fill="#000"></use>
          </g>

          <!-- only the Contact filter we need -->
          <filter id="cbtn-contact-shadow-contact" x="-60%" y="-300%" width="220%" height="600%">
            <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="rgba(56,145,251,1)"></feDropShadow>
            <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="rgba(56,145,251,1)"></feDropShadow>
          </filter>
          <filter id="cbtn-contact-shadow-grey" x="-60%" y="-300%" width="220%" height="600%">
            <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="rgba(180,180,180,0.85)"></feDropShadow>
            <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="rgba(180,180,180,0.65)"></feDropShadow>
         </filter>
        </defs>

        <!-- Flip H + V on the SHAPE ONLY -->
        <g transform="translate(115 25) scale(-1 -1)">
          <use href="#cbtn-base-black"></use>

          <!-- Contact deco (same logic as main Contact button) -->
          <g clip-path="url(#cbtn-clip)">
            <!-- hardcoded insetXLocal = (INSET+LINE/2)/sx ; sx≈122.5/115=1.0652 => 4/1.0652=3.76 -->
            <g transform="translate(-3.76 4)">
 <!-- DEFAULT (grey) -->
 <g class="cbtn__deco cbtn__deco--off" clip-path="url(#cbtn-cp-contact-visible)" filter="url(#cbtn-contact-shadow-grey)">
  <use href="#cbtn-shape" fill="none" class="cbtn__stroke" stroke-width="2" vector-effect="non-scaling-stroke"></use>
 </g>
 <g class="cbtn__deco cbtn__deco--off" clip-path="url(#cbtn-cp-contact-visible)">
  <use href="#cbtn-shape" fill="none" class="cbtn__stroke" stroke-width="2" vector-effect="non-scaling-stroke"></use>
 </g>

 <!-- ACTIVE (blue) -->
 <g class="cbtn__deco cbtn__deco--on" clip-path="url(#cbtn-cp-contact-visible)" filter="url(#cbtn-contact-shadow-contact)">
  <use href="#cbtn-shape" fill="none" class="cbtn__stroke" stroke-width="2" vector-effect="non-scaling-stroke"></use>
 </g>
 <g class="cbtn__deco cbtn__deco--on" clip-path="url(#cbtn-cp-contact-visible)">
  <use href="#cbtn-shape" fill="none" class="cbtn__stroke" stroke-width="2" vector-effect="non-scaling-stroke"></use>
 </g>

            </g>
          </g>
        </g>
      </svg>
    </span>
   <span class="cbtn__icon" aria-hidden="true">
  <!-- envelope -->
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M20 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 2v.2l-8 5-8-5V8h16zm0 10H4V10.6l7.5 4.7c.3.2.7.2 1 0L20 10.6V18z"></path>
  </svg>
</span>

  </button>

  <!-- Copy message -->
  <button type="button" class="cbtn" data-action="copy-message" data-hint="Copiază mesaj" aria-label="Copiază mesaj">
    <span class="cbtn__gfx" aria-hidden="true">
      <svg class="cbtn__svg" viewBox="0 0 115 25" preserveAspectRatio="none" focusable="false">
        <!-- Same defs, separate IDs per button instance to avoid collisions -->
        <defs>
          <path id="cbtn2-shape"
            d="M 0 0 L 96.91 0 A 8 8 0 0 1 103.96 4.24 L 115 25 L 13.29 25 Z" />
          <clipPath id="cbtn2-clip"><use href="#cbtn2-shape"></use></clipPath>
          <clipPath id="cbtn2-cp-contact-visible" clipPathUnits="userSpaceOnUse">
            <rect x="-50" y="-50" width="300" height="82"></rect>
            <rect x="92" y="-50" width="200" height="300"></rect>
          </clipPath>
          <g id="cbtn2-base-black"><use href="#cbtn2-shape" fill="#000"></use></g>
          <filter id="cbtn2-contact-shadow-contact" x="-60%" y="-300%" width="220%" height="600%">
            <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="rgba(56,145,251,1)"></feDropShadow>
            <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="rgba(56,145,251,1)"></feDropShadow>
          </filter>
          <clipPath id="cbtn2-top-strip-band" clipPathUnits="userSpaceOnUse">
  <rect x="-50" y="3" width="300" height="2"></rect>
 </clipPath>

 <filter id="cbtn2-bar-shadow-contact" filterUnits="userSpaceOnUse" x="-80" y="-120" width="280" height="360">
  <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="rgba(56,145,251,1)"></feDropShadow>
  <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="rgba(56,145,251,1)"></feDropShadow>
 </filter>
 <filter id="cbtn2-bar-shadow-grey" filterUnits="userSpaceOnUse" x="-80" y="-120" width="280" height="360">
  <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="rgba(180,180,180,0.85)"></feDropShadow>
  <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="rgba(180,180,180,0.65)"></feDropShadow>
 </filter>
        </defs>

        <g transform="translate(115 25) scale(-1 -1)">
 <use href="#cbtn2-base-black"></use>

 <!-- stripDeco style (top band only) -->

 <!-- DEFAULT (grey strip) -->
 <g class="cbtn__deco cbtn__deco--off">
  <g filter="url(#cbtn2-bar-shadow-grey)">
    <g clip-path="url(#cbtn2-top-strip-band)">
      <use href="#cbtn2-shape" class="cbtn__strip"></use>
    </g>
  </g>

  <g clip-path="url(#cbtn2-clip)">
    <g clip-path="url(#cbtn2-top-strip-band)">
      <use href="#cbtn2-shape" class="cbtn__strip"></use>
     </g>
   </g>
 </g>

 <!-- ACTIVE (blue strip) -->
 <g class="cbtn__deco cbtn__deco--on">
  <g filter="url(#cbtn2-bar-shadow-contact)">
    <g clip-path="url(#cbtn2-top-strip-band)">
      <use href="#cbtn2-shape" class="cbtn__strip"></use>
    </g>
  </g>

  <g clip-path="url(#cbtn2-clip)">
    <g clip-path="url(#cbtn2-top-strip-band)">
      <use href="#cbtn2-shape" class="cbtn__strip"></use>
    </g>
  </g>
 </g>


        </g>
      </svg>
    </span>
    <span class="cbtn__icon" aria-hidden="true">
  <!-- clipboard -->
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M16 4h-1.2a3 3 0 0 0-5.6 0H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-4-1a1 1 0 0 1 1 1h-2a1 1 0 0 1 1-1zm4 17H8V6h1.5v2h5V6H16v14z"></path>
  </svg>
</span>

  </button>

  <!-- Submit -->
  <button type="submit" class="cbtn cbtn--primary" data-hint="Trimite mesajul" aria-label="Trimite">
    <span class="cbtn__gfx" aria-hidden="true">
      <svg class="cbtn__svg" viewBox="0 0 115 25" preserveAspectRatio="none" focusable="false">
        <defs>
          <path id="cbtn3-shape"
            d="M 0 0 L 96.91 0 A 8 8 0 0 1 103.96 4.24 L 115 25 L 13.29 25 Z" />
          <clipPath id="cbtn3-clip"><use href="#cbtn3-shape"></use></clipPath>
          <clipPath id="cbtn3-cp-contact-visible" clipPathUnits="userSpaceOnUse">
            <rect x="-50" y="-50" width="300" height="82"></rect>
            <rect x="92" y="-50" width="200" height="300"></rect>
          </clipPath>
          <g id="cbtn3-base-black"><use href="#cbtn3-shape" fill="#000"></use></g>
          <filter id="cbtn3-contact-shadow-contact" x="-60%" y="-300%" width="220%" height="600%">
            <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="rgba(56,145,251,1)"></feDropShadow>
            <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="rgba(56,145,251,1)"></feDropShadow>
          </filter>
          <clipPath id="cbtn3-top-strip-band" clipPathUnits="userSpaceOnUse">
  <rect x="-50" y="3" width="300" height="2"></rect>
 </clipPath>

 <filter id="cbtn3-bar-shadow-contact" filterUnits="userSpaceOnUse" x="-80" y="-120" width="280" height="360">
  <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="rgba(56,145,251,1)"></feDropShadow>
  <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="rgba(56,145,251,1)"></feDropShadow>
 </filter>
 <filter id="cbtn3-bar-shadow-grey" filterUnits="userSpaceOnUse" x="-80" y="-120" width="280" height="360">
  <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="rgba(180,180,180,0.85)"></feDropShadow>
  <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="rgba(180,180,180,0.65)"></feDropShadow>
 </filter>

        </defs>

        <g transform="translate(115 25) scale(-1 -1)">
 <use href="#cbtn3-base-black"></use>

 <!-- stripDeco style (top band only) -->
 <!-- DEFAULT (grey strip) -->
 <g class="cbtn__deco cbtn__deco--off">
  <g filter="url(#cbtn3-bar-shadow-grey)">
    <g clip-path="url(#cbtn3-top-strip-band)">
      <use href="#cbtn3-shape" class="cbtn__strip"></use>
    </g>
  </g>

  <g clip-path="url(#cbtn3-clip)">
    <g clip-path="url(#cbtn3-top-strip-band)">
      <use href="#cbtn3-shape" class="cbtn__strip"></use>
    </g>
  </g>
 </g>

 <!-- ACTIVE (blue strip) -->
 <g class="cbtn__deco cbtn__deco--on">
  <g filter="url(#cbtn3-bar-shadow-contact)">
    <g clip-path="url(#cbtn3-top-strip-band)">
      <use href="#cbtn3-shape" class="cbtn__strip"></use>
    </g>
  </g>

  <g clip-path="url(#cbtn3-clip)">
    <g clip-path="url(#cbtn3-top-strip-band)">
      <use href="#cbtn3-shape" class="cbtn__strip"></use>
    </g>
  </g>
 </g>


        </g>
      </svg>
    </span>
    <span class="cbtn__icon" aria-hidden="true">
  <!-- paper plane -->
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M2.2 21.8 23 12 2.2 2.2 2 10l14 2-14 2 .2 7.8z"></path>
  </svg>
</span>

  </button>
</div>
          <p class="contact-hint">
            Trimiterea folosește clientul tău de e-mail (mailto). Dacă nu se deschide, poți copia mesajul și e-mailul.
          </p>

      </form>
    </section>
  `);

  mountEl.appendChild(root);

  function positionButtonsFromMsgPath() {
  const board = root.querySelector(".contact-board");
  const svg = root.querySelector(".contact-board-svg");
  const msgPath = root.querySelector(".board-stroke--msg");
  const group = root.querySelector(".contact-btngroup");
  if (!board || !svg || !msgPath || !group) return;

  // real rendered size of the board (px)
  const br = board.getBoundingClientRect();

  // viewBox scaling (1000x400)
  const VB_W = 1000;
  const VB_H = 400;
  const sx = br.width / VB_W;
  const sy = br.height / VB_H;

  // bbox in viewBox units
  const bb = msgPath.getBBox();

  const BTN_H = 25;   // your button svg height
  const GAP = 6;

  // anchor to message holder left/bottom
  const leftPx = Math.round((bb.x * sx) + 10); // 10px inside from shape left
  const topPx  = Math.round(((bb.y + bb.height) * sy) - BTN_H - GAP);

  group.style.left = `${leftPx}px`;
  group.style.top  = `${topPx}px`;

  const hint = root.querySelector(".contact-hint");
if (hint) {
  // Same baseline as buttons, 20px to the right of the group
  const groupW = group.getBoundingClientRect().width;
  hint.style.left = `${leftPx + groupW + 20}px`;
  hint.style.top  = `${topPx + 6}px`; // small baseline align tweak
}
}

// call once + on resize (board is fixed but layout can still shift slightly)
positionButtonsFromMsgPath();
window.addEventListener("resize", positionButtonsFromMsgPath);


  const form = root.querySelector(".contact-form");
  const feedback = root.querySelector(".contact-feedback");
  const fallbackRow = root.querySelector(".contact-fallback");
  const btnCopyEmail = root.querySelector('[data-action="copy-email"]');
  const btnCopyMessage = root.querySelector('[data-action="copy-message"]');

  const inputName = root.querySelector('input[name="name"]');
  const inputEmail = root.querySelector('input[name="email"]');
  const inputMessage = root.querySelector('textarea[name="message"]');

  let lastBuiltMessage = "";

  function setFeedback(msg, type = "") {
    if (!feedback) return;
    feedback.textContent = msg || "";
    feedback.dataset.type = type;
  }

  function showFallback(show) {
    if (!fallbackRow) return;
    fallbackRow.hidden = !show;
  }

  function buildBody({ name, email, message }) {
    const lines = [];
    if (name) lines.push(`Nume: ${name}`);
    lines.push(`E-mail: ${email}`);
    lines.push("");
    lines.push("Mesaj:");
    lines.push(message);
    return lines.join("\n");
  }

  function validate() {
    const name = String(inputName?.value || "").trim();
    const email = String(inputEmail?.value || "").trim();
    const message = String(inputMessage?.value || "").trim();

    if (!email) {
      setFeedback("Completează câmpul E-mail.", "error");
      inputEmail?.focus?.();
      return null;
    }
    if (!isValidEmail(email)) {
      setFeedback("E-mail invalid. Verifică formatul.", "error");
      inputEmail?.focus?.();
      return null;
    }
    if (!message) {
      setFeedback("Completează câmpul Mesaj.", "error");
      inputMessage?.focus?.();
      return null;
    }

    setFeedback("", "");
    return { name, email, message };
  }

  function estimateMailtoLength(href) {
    return href.length;
  }

  function tryOpenMailto(href) {
    const a = document.createElement("a");
    a.href = href;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function onSubmit(e) {
    e.preventDefault();

    const data = validate();
    if (!data) return;

    const subject = data.name ? `Contact site — ${data.name}` : "Contact site";
    const body = buildBody(data);
    lastBuiltMessage = body;

    const href = buildMailtoHref({ to: emailTo, subject, body });

    if (estimateMailtoLength(href) > 1800) {
      showFallback(true);
      setFeedback("Mesaj prea lung pentru trimitere automată. Folosește butoanele de copiere.", "warn");
      return;
    }

    showFallback(false);
    setFeedback("Se deschide clientul de e-mail...", "ok");

    try {
      tryOpenMailto(href);
      showFallback(true);
      setFeedback("Dacă nu s-a deschis, poți copia mesajul și e-mailul.", "hint");
    } catch (_) {
      showFallback(true);
      setFeedback("Nu am putut deschide mailto. Copiază mesajul și e-mailul.", "error");
    }
  }

  async function onCopyEmail() {
    const ok = await copyText(emailTo);
    setFeedback(ok ? "Copiat: e-mail" : "Nu s-a putut copia e-mailul.", ok ? "ok" : "error");
  }

  async function onCopyMessage() {
    const msg = lastBuiltMessage || buildBody({
      name: String(inputName?.value || "").trim(),
      email: String(inputEmail?.value || "").trim(),
      message: String(inputMessage?.value || "").trim(),
    });
    const ok = await copyText(msg);
    setFeedback(ok ? "Copiat: mesaj" : "Nu s-a putut copia mesajul.", ok ? "ok" : "error");
  }

  form?.addEventListener("submit", onSubmit);
  btnCopyEmail?.addEventListener("click", onCopyEmail);
  btnCopyMessage?.addEventListener("click", onCopyMessage);

  return {
    destroy() {
      form?.removeEventListener("submit", onSubmit);
      btnCopyEmail?.removeEventListener("click", onCopyEmail);
      btnCopyMessage?.removeEventListener("click", onCopyMessage);
      root.remove();
    },
  };
}
