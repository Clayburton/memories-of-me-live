/* ============================================================
   memories of me — live lyric video engine
   Reads the audio clock every frame and renders the cue sheet
   (CUES) + background track (BG) from cues.js as live DOM.
   Kinetic-typography effects are computed from each cue's local
   time (no timers, no reflow storms) so playback never lags.
   ============================================================ */
(function () {
  "use strict";

  const stage       = document.getElementById("stage");
  const cueLayer     = document.getElementById("cueLayer");
  const videoLayer   = document.getElementById("videoLayer");
  const dialogLayer  = document.getElementById("dialogLayer");
  const terminalLayer= document.getElementById("terminalLayer");
  const audio        = document.getElementById("song");
  const landing      = document.getElementById("landing");
  const endcard      = document.getElementById("endcard");
  const playBtn      = document.getElementById("playBtn");
  const replayBtn    = document.getElementById("replayBtn");
  const toastEl      = document.getElementById("toast");

  const ROLE_CLASS = {
    sans: "r-sans", serif: "r-serif", serifIt: "r-serifIt",
    didone: "r-didone", didoneIt: "r-didoneIt", mono: "r-mono",
  };
  const ANCHOR_XY = {
    c:  [-50, -50], t:  [-50, 0],   b:  [-50, -100],
    l:  [0,   -50], r:  [-100, -50],
    tl: [0,    0],  tr: [-100, 0],  bl: [0, -100], br: [-100, -100],
  };
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let running = false;
  let clockOverride = null;
  // this mp3 decodes sample-aligned with the master (measured), so default 0. Tunable with [ ].
  let syncOffset = parseFloat(localStorage.getItem("mom_sync") || "0");
  const mounted = new Map();          // cueIndex -> element
  let lastT = 0;

  /* ---------- colour helpers ---------- */
  function lum(hex) {
    const h = hex.replace("#", "");
    const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const r = parseInt(n.slice(0,2),16)/255, g = parseInt(n.slice(2,4),16)/255, b = parseInt(n.slice(4,6),16)/255;
    return 0.2126*r + 0.7152*g + 0.0722*b;
  }
  function bgAt(t) {
    let color = BG[0][1];
    for (let i = 0; i < BG.length; i++) { if (BG[i][0] <= t) color = BG[i][1]; else break; }
    return color;
  }

  /* ---------- crisp fit-to-fill (measured px, never transform:scale) ---------- */
  const FIT_REF = 100;
  function ensureNat(el) {
    if (el.dataset.natW) return true;
    const prev = el.style.fontSize;
    el.style.fontSize = FIT_REF + "px";
    const nw = el.offsetWidth, nh = el.offsetHeight;
    if (nw && nh) { el.dataset.natW = nw; el.dataset.natH = nh; return true; }
    el.style.fontSize = prev; return false;
  }
  function applyFit(el, cue) {
    if (!ensureNat(el)) return;
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W || !H) return;
    const natW = +el.dataset.natW, natH = +el.dataset.natH;
    const vertical = Math.abs(((cue.rot || 0) % 180)) > 45;
    let fs = vertical
      ? Math.min(FIT_REF * (cue.fit * H) / natW, FIT_REF * ((cue.fitW || 0.96) * W) / natH)
      : Math.min(FIT_REF * (cue.fit * W) / natW, FIT_REF * ((cue.fitH || 0.96) * H) / natH);
    el.style.fontSize = fs + "px";
  }
  // vh-sized cues from the 16:9 master can overflow a phone → clamp to ≤94% width
  function clampWidth(el, cue) {
    if (cue.fit) return;
    const W = stage.clientWidth;
    if (!W) return;
    const w = el.offsetWidth;
    if (w > 0.94 * W) el.style.fontSize = (parseFloat(el.style.fontSize) * 0.94 * W / w) + "vh";
  }

  /* ---------- mount / update ---------- */
  function mount(idx, cue) {
    if (cue.film) return mountFilm(idx, cue);
    const el = document.createElement("div");
    el.className = "cue " + (ROLE_CLASS[cue.role] || "r-serif");
    el.dataset.idx = idx;
    el.style.left = (cue.x != null ? cue.x : 50) + "%";
    el.style.top  = (cue.y != null ? cue.y : 50) + "%";
    el.style.textAlign = cue.align || "center";
    if (cue.weight) el.style.fontWeight = cue.weight;
    if (cue.font) el.style.fontFamily = cue.font;
    if (cue.style) el.style.fontStyle = cue.style;
    if (cue.track != null) el.style.letterSpacing = cue.track + "em";
    if (cue.lh != null) el.style.lineHeight = cue.lh;
    if (cue.case === "upper") el.style.textTransform = "uppercase";
    if (cue.case === "lower") el.style.textTransform = "lowercase";
    if (cue.color) el.style.color = cue.color;

    el.textContent = baseText(cue, 1);   // initial content (full unless an effect trims it)
    if (cue.fit) { el.style.whiteSpace = "pre"; applyFit(el, cue); }
    else el.style.fontSize = (cue.size || 8) + "vh";

    cueLayer.appendChild(el);
    if (cue.fit) applyFit(el, cue);
    clampWidth(el, cue);
    mounted.set(idx, el);
    return el;
  }

  function mountFilm(idx, cue) {
    const v = document.createElement("video");
    v.className = "film";
    v.src = cue.film;
    v.muted = true; v.loop = !!cue.loop; v.playsInline = true;
    v.setAttribute("playsinline", ""); v.preload = "auto";
    v.dataset.idx = idx;
    videoLayer.appendChild(v);
    // start it at the offset that matches this cue's window
    try { v.currentTime = cue.vStart || 0; } catch (e) {}
    const p = v.play(); if (p && p.catch) p.catch(function () {});
    mounted.set(idx, v);
    return v;
  }

  // full (or effect-trimmed) text for a cue at progress k∈[0,1]
  function baseText(cue, k) {
    if (!cue.text) return "";
    return cue.text;
  }

  function envelope(cue, localT, life) {
    const dur = cue.dur != null ? cue.dur : 0.1;
    let o = cue.opacity != null ? cue.opacity : 1;
    if (cue.enter && cue.enter !== "cut" && localT < dur) o *= localT / dur;
    if (cue.exit === "fade" && localT > life - dur) o *= Math.max(0, (life - localT) / dur);
    return o;
  }

  // deterministic pseudo-random (so decay/erase are identical on every seek)
  function rnd(seed) { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); }

  function update(idx, cue, t) {
    const el = mounted.get(idx) || mount(idx, cue);
    if (cue.film) return updateFilm(el, cue, t);
    const life = cue.e - cue.s;
    const localT = t - cue.s;
    const k = Math.min(1, Math.max(0, localT / life));

    /* ---- text-content effects (typewriter family) ---- */
    if (cue.fx) applyTextFx(el, cue, localT, life, k);

    let op = envelope(cue, localT, life);
    if (cue.fxOpacity != null) op *= cue.fxOpacity;      // set by applyTextFx (e.g. flicker)
    el.style.opacity = op;

    if (cue.fit) applyFit(el, cue);

    /* ---- transform effects ---- */
    let scale = 1, tx = 0, ty = 0, rot = cue.rot || 0;
    if (cue.grow) scale *= cue.grow[0] + (cue.grow[1] - cue.grow[0]) * ease(k, cue.easing);
    if (cue.fx === "fallLine") { ty = 116 * k; }            // linear fall through the frame
    if (cue.fx === "sink")  { ty = 14 * ease(k, "in"); }    // slips below the bottom edge
    if (cue.fx === "slide") { tx = 130 * ease(k, "in"); }
    if (cue.rise && localT < (cue.dur || 0.3)) ty += (1 - localT / (cue.dur || 0.3)) * -6;
    if (cue.driftX) tx += cue.driftX * k;
    if (cue.driftY) ty += cue.driftY * k;
    const stretch = cue.stretch ? " scaleX(" + cue.stretch + ")" : "";
    const [ax, ay] = ANCHOR_XY[cue.anchor || "c"];
    el.style.transform =
      "translate(" + tx + "vw," + ty + "vh) " +
      "translate(" + ax + "%," + ay + "%)" +
      " rotate(" + rot + "deg) scale(" + scale.toFixed(4) + ")" + stretch;

    // morphing container shape ("only objects": square → circle)
    if (cue.shape) {
      const r = (cue.shape[0] + (cue.shape[1] - cue.shape[0]) * ease(k, "inout"));
      el.style.border = "1px solid " + (cue.color || "currentColor");
      el.style.borderRadius = r + "%";
      el.style.padding = (cue.shapePad || 4) + "vh " + (cue.shapePad || 4) * 1.4 + "vh";
      el.style.width = (cue.shapeW || 26) + "vh";
      el.style.height = (cue.shapeW || 26) + "vh";
      el.style.display = "grid";
      el.style.placeItems = "center";
    }
  }

  function ease(k, kind) {
    if (kind === "in")  return k * k;
    if (kind === "out") return 1 - (1 - k) * (1 - k);
    if (kind === "inout") return k < .5 ? 2*k*k : 1 - Math.pow(-2*k+2, 2)/2;
    return k;
  }

  function applyTextFx(el, cue, localT, life, k) {
    const full = cue.text;
    cue.fxOpacity = 1;
    if (cue.fx === "type") {
      // reveal char-by-char over typeDur; reverseType reveals from the END ("…feet" → "down to my feet")
      const dur = cue.typeDur != null ? cue.typeDur : life * 0.62;
      const n = Math.min(full.length, Math.floor(full.length * Math.min(1, localT / dur) + 0.0001));
      const txt = cue.reverseType ? full.slice(full.length - n) : full.slice(0, n);
      setTyped(el, txt, n < full.length && !cue.noCaret);
    } else if (cue.fx === "typeloop") {
      // type to the end, then endlessly delete back to loopTo and retype (can never finish)
      const cps = cue.cps || 13;                       // chars per second
      const lo = cue.loopTo, hi = full.length;
      const upT = hi / cps;                            // time to fully type
      let n;
      if (localT < upT) n = Math.floor(localT * cps);
      else {
        const cyc = (hi - lo) * 2 / cps;               // delete + retype
        let p = ((localT - upT) % cyc) / cyc;          // 0..1
        n = p < .5 ? Math.round(hi - (hi - lo) * (p * 2))
                   : Math.round(lo + (hi - lo) * ((p - .5) * 2));
      }
      setTyped(el, full.slice(0, Math.max(0, Math.min(hi, n))), true);
    } else if (cue.fx === "decay") {
      // start full, drop random characters over life until only decayTo remain
      const keepN = Math.round(full.length - (full.length - (cue.decayTo || 0)) * ease(k, "in"));
      // deterministically pick which indices survive (highest rnd scores)
      const scored = [];
      for (let i = 0; i < full.length; i++) scored.push([i, rnd(i + 1 + (cue.seed || 0))]);
      scored.sort((a, b) => b[1] - a[1]);
      const keep = new Set(scored.slice(0, keepN).map((s) => s[0]));
      let out = "";
      for (let i = 0; i < full.length; i++) out += keep.has(i) ? full[i] : (full[i] === " " ? " " : " ");
      el.textContent = out;
    } else if (cue.fx === "erase") {
      // delete from the end, char by char (ENEMIES → ENEMIE → … → E)
      const n = Math.max(1, Math.round(full.length - (full.length - 1) * ease(k, "in")));
      el.textContent = full.slice(0, n);
    } else if (cue.fx === "flicker") {
      // whole cue blinks on a fixed grid (used for the "lost" flicker via a paired cue)
      const on = Math.floor(localT / (cue.flickDur || 0.16)) % 2 === 0;
      cue.fxOpacity = on ? 1 : (cue.flickLow != null ? cue.flickLow : 0.15);
      el.textContent = full;
    }
  }
  function setTyped(el, txt, caret) {
    el.textContent = txt;
    if (caret) { const c = document.createElement("span"); c.className = "caret"; el.appendChild(c); }
  }

  function updateFilm(v, cue, t) {
    // keep the panel tracking the clock if seeking (freeze/debug); live play just runs
    if (clockOverride != null) { try { v.currentTime = (cue.vStart || 0) + (t - cue.s); } catch (e) {} }
    v.style.opacity = envelope(cue, t - cue.s, cue.e - cue.s);
  }

  function unmount(idx) {
    const el = mounted.get(idx);
    if (el) {
      if (el.tagName === "VIDEO") { try { el.pause(); } catch (e) {} }
      el.remove(); mounted.delete(idx);
    }
  }

  /* ---------- browser-chrome colour (iOS bars) ---------- */
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  let lastBcast = null;
  function broadcastBg(color) {
    if (color === lastBcast) return;
    lastBcast = color;
    if (themeMeta) themeMeta.setAttribute("content", color);
    if (window.parent !== window) { try { window.parent.postMessage({ iam: "bg", color: color }, "*"); } catch (e) {} }
  }

  /* ---------- render one timestamp ---------- */
  function renderAt(t) {
    lastT = t;
    const bg = bgAt(t);
    stage.style.setProperty("--bg", bg);
    stage.style.setProperty("--fg", lum(bg) > 0.5 ? "#111" : "#f3f3f3");
    broadcastBg(bg);

    for (let i = 0; i < CUES.length; i++) {
      const c = CUES[i];
      const active = t >= c.s && t < c.e && !terminalTakeover;
      if (active) update(i, c, t);
      else if (mounted.has(i)) unmount(i);
    }

    updateDialog(t);
  }

  function frame() {
    if (!running) return;
    const t = clockOverride != null ? clockOverride : Math.max(0, audio.currentTime + syncOffset);
    renderAt(t);
    requestAnimationFrame(frame);
  }

  /* ---------- resize ---------- */
  function remountAll() { mounted.forEach((el) => el.remove()); mounted.clear(); if (running) renderAt(lastT); }
  window.addEventListener("resize", remountAll);
  if (window.ResizeObserver) {
    let lastW = 0;
    new ResizeObserver(function () {
      if (running && stage.clientWidth && stage.clientWidth !== lastW) { lastW = stage.clientWidth; remountAll(); }
    }).observe(stage);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      mounted.forEach((el) => { delete el.dataset.natW; delete el.dataset.natH; });
      if (running) renderAt(lastT);
    });
  }

  /* ---------- preload: fonts + both film clips before the show can start ---------- */
  let assetsReady = false;
  const preloadHold = [];   // keep decoded <video>s alive so nothing is re-fetched
  (function preload() {
    const clips = CUES.filter((c) => c.film).map((c) => c.film);
    const uniq = [...new Set(clips)];
    let done = 0;
    const total = uniq.length + 1;   // +1 for fonts
    playBtn.classList.add("is-loading");
    const tick = function () {
      done++; playBtn.style.setProperty("--load", done / total);
      if (done >= total) { assetsReady = true; playBtn.classList.remove("is-loading"); }
    };
    uniq.forEach(function (src) {
      const v = document.createElement("video");
      v.preload = "auto"; v.muted = true; v.src = src;
      v.oncanplaythrough = tick; v.onerror = tick;
      // some browsers won't fire canplaythrough while offscreen — nudge with a load timeout
      setTimeout(function () { if (v.readyState < 4) tick(); }, 4000);
      v.load();
      preloadHold.push(v);
    });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(tick, tick);
  })();

  /* ---------- the XP dialog + the terminal payoff ---------- */
  let dialogEl = null, dialogShown = false, terminalTakeover = false;
  const DIALOG = { s: 96.86, e: 98.17 };   // its live window in the song

  function buildDialog() {
    const d = document.createElement("div");
    d.className = "xp-dialog";
    d.innerHTML =
      '<div class="xp-dialog__bar"><span>Confirm File Delete</span><div class="xp-dialog__x">✕</div></div>' +
      '<div class="xp-dialog__body">' +
        '<svg class="xp-dialog__icon" viewBox="0 0 48 48" aria-hidden="true">' +
          '<path d="M8 14h32l-3 30H11z" fill="#c9ccd1" stroke="#7d818a" stroke-width="1.5"/>' +
          '<path d="M6 10h36v5H6z" fill="#9aa0a8" stroke="#7d818a" stroke-width="1.5"/>' +
          '<path d="M15 19v20M24 19v20M33 19v20" stroke="#7d818a" stroke-width="1.6"/>' +
        '</svg>' +
        "<div class=\"xp-dialog__msg\">Are you sure you want to send ‘CLAYANDKELSY.exe’ to the Recycle Bin?</div>" +
      '</div>' +
      '<div class="xp-dialog__btns">' +
        '<button class="xp-btn is-default" id="xpYes" type="button">Yes</button>' +
        '<button class="xp-btn" id="xpNo" type="button">No</button>' +
      '</div>';
    d.querySelector("#xpYes").addEventListener("click", onYes);
    d.querySelector("#xpNo").addEventListener("click", onNo);
    d.querySelector(".xp-dialog__x").addEventListener("click", onNo);
    return d;
  }
  function updateDialog(t) {
    if (terminalTakeover) return;
    const live = t >= DIALOG.s && t < DIALOG.e;
    if (live && !dialogShown) {
      dialogShown = true;
      dialogEl = buildDialog();
      dialogLayer.appendChild(dialogEl);
      dialogLayer.style.pointerEvents = "auto";
      document.body.classList.add("xp-cursor");
    } else if (!live && dialogShown && !terminalTakeover) {
      dialogShown = false;
      if (dialogEl) { dialogEl.remove(); dialogEl = null; }
      dialogLayer.style.pointerEvents = "none";
      document.body.classList.remove("xp-cursor");
    }
  }
  function onNo(e) { if (e) e.stopPropagation(); /* it deletes anyway — No does nothing */ }
  function onYes(e) { if (e) e.stopPropagation(); startTerminal(); }

  /* the old Mac terminal: deletes the songs, then us */
  const TERMINAL_SCRIPT = [
    { txt: "Last login: Tue Jul 15 20:14:08 on ttys000", cls: "ln-dim", wait: 650 },
    { txt: "clayandkelsy % rm -rf ~/discography", cls: "", wait: 620 },
    { txt: "removing  moo-osc-demo.wav ............ gone", cls: "ln-dim", wait: 260 },
    { txt: "removing  i-am.wav .................... gone", cls: "ln-dim", wait: 260 },
    { txt: "removing  i-miss-you.wav .............. gone", cls: "ln-dim", wait: 260 },
    { txt: "removing  the-osc-collection.wav ...... gone", cls: "ln-dim", wait: 280 },
    { txt: "removing  memories-of-me.wav ....... ", cls: "", wait: 950, nonl: true },
    { txt: "", wait: 100 },
    { txt: "rm: memories-of-me.wav: file is in use — it is playing right now", cls: "ln-err", wait: 850 },
    { txt: "  force remove? (y/n) y", cls: "ln-warn", wait: 800 },
    { txt: "removing  memories-of-me.wav .......... gone", cls: "ln-dim", wait: 550 },
    { txt: "", wait: 320 },
    { txt: "clayandkelsy % rm kelsy", cls: "", wait: 680 },
    { txt: "removing  kelsy ....................... gone", cls: "ln-dim", wait: 700 },
    { txt: "clayandkelsy % rm clay", cls: "", wait: 680 },
    { txt: "removing  clay ........................ gone", cls: "ln-dim", wait: 780 },
    { txt: "", wait: 300 },
    { txt: "clayandkelsy % rm us", cls: "", wait: 900 },
    { txt: "rm: us: operation not permitted — memory in use", cls: "ln-err", wait: 950 },
    { txt: "  retrying", cls: "ln-warn", wait: 420, nonl: true },
    { txt: " .", cls: "ln-warn", wait: 520, nonl: true },
    { txt: " .", cls: "ln-warn", wait: 520, nonl: true },
    { txt: " .", cls: "ln-warn", wait: 700, nonl: true },
    { txt: "", wait: 200 },
    { txt: "removing  us .......................... gone", cls: "ln-dim", wait: 1400 },
    { txt: "", wait: 480 },
    { txt: "nothing else. but my defeat.", cls: "ln-ok", wait: 2100 },
  ];
  let terminalTimer = null;
  function startTerminal() {
    if (terminalTakeover) return;
    terminalTakeover = true;
    // clear the show; the terminal owns the screen
    mounted.forEach((el) => el.remove()); mounted.clear();
    if (dialogEl) { dialogEl.remove(); dialogEl = null; }
    dialogLayer.style.pointerEvents = "none";
    document.body.classList.remove("xp-cursor");

    const term = document.createElement("div");
    term.className = "terminal";
    term.innerHTML =
      '<div class="terminal__bar"><div class="terminal__close"></div><div class="terminal__title">Terminal</div></div>' +
      '<div class="terminal__screen"><div class="terminal__out"></div></div>';
    const out = term.querySelector(".terminal__out");
    terminalLayer.appendChild(term);
    terminalLayer.style.pointerEvents = "auto";
    term.classList.add("is-on");   // hard pop — this video cuts, it never fades

    let i = 0;
    const step = function () {
      if (i >= TERMINAL_SCRIPT.length) return dissolveTerminal(term, out);
      const line = TERMINAL_SCRIPT[i];
      const span = document.createElement("span");
      if (line.cls) span.className = line.cls;
      span.textContent = line.txt + (line.nonl ? "" : "\n");
      out.appendChild(span);
      const oldCaret = out.querySelector(".tcaret"); if (oldCaret) oldCaret.remove();
      const caret = document.createElement("span"); caret.className = "tcaret";
      out.appendChild(caret);
      i++;
      terminalTimer = setTimeout(step, line.wait || 300);
    };
    step();
  }
  // the phosphor text decays letter-by-letter (the video's own effect), then the window pops away
  function dissolveTerminal(term, out) {
    const caret = out.querySelector(".tcaret"); if (caret) caret.remove();
    const spans = [...out.querySelectorAll("span")];
    let ticks = 0;
    const decay = function () {
      let alive = 0;
      spans.forEach(function (sp) {
        const t = sp.textContent;
        let o = "";
        for (let j = 0; j < t.length; j++) {
          const ch = t[j];
          o += (ch === "\n" || ch === " ") ? ch : (Math.random() < 0.22 ? " " : ch);
        }
        sp.textContent = o;
        if (o.trim()) alive++;
      });
      ticks++;
      if (alive && ticks < 24) terminalTimer = setTimeout(decay, 110);
      else {
        term.classList.add("is-dissolving");
        terminalTimer = setTimeout(function () {
          term.remove();
          terminalLayer.style.pointerEvents = "none";
          endShow();
        }, 1300);
      }
    };
    terminalTimer = setTimeout(decay, 500);
  }
  function endShow() {
    running = false;
    try { audio.pause(); } catch (e) {}
    stage.classList.remove("is-live");
    endcard.hidden = false;
    requestAnimationFrame(function () { endcard.classList.add("is-visible"); });
  }

  /* ---------- flow ---------- */
  function resetSequences() {
    terminalTakeover = false; dialogShown = false;
    if (dialogEl) { dialogEl.remove(); dialogEl = null; }
    dialogLayer.style.pointerEvents = "none";
    document.body.classList.remove("xp-cursor");
    terminalLayer.textContent = "";
    if (terminalTimer) { clearTimeout(terminalTimer); terminalTimer = null; }
    mounted.forEach((el) => el.remove()); mounted.clear();
  }

  function start() {
    if (!assetsReady) return;
    landing.classList.add("is-gone");
    setTimeout(function () { landing.hidden = true; }, 500);
    stage.classList.add("is-live");
    stage.setAttribute("aria-hidden", "false");
    document.body.classList.add("playing");
    broadcastBg("#ffffff");
    resetSequences();
    running = true;
    audio.currentTime = 0;
    const p = audio.play(); if (p && p.catch) p.catch(function (e) { console.warn("play blocked:", e); });
    requestAnimationFrame(frame);
  }
  playBtn.addEventListener("click", start);

  audio.addEventListener("ended", function () { if (!terminalTakeover) endShow(); });
  replayBtn.addEventListener("click", function () {
    endcard.classList.remove("is-visible");
    setTimeout(function () { endcard.hidden = true; }, 400);
    stage.classList.add("is-live");
    document.body.classList.add("playing");
    resetSequences();
    running = true;
    audio.load();
    const p = audio.play(); if (p && p.catch) p.catch(function () {});
    requestAnimationFrame(frame);
  });

  let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 1100);
  }

  window.addEventListener("keydown", function (e) {
    const isSpace = e.code === "Space" || e.key === " ";
    const isEnter = e.key === "Enter";
    if (isSpace || isEnter) {
      if (!landing.classList.contains("is-gone")) { e.preventDefault(); start(); }
      else if (!endcard.hidden) { e.preventDefault(); replayBtn.click(); }
      else if (running && isSpace && !terminalTakeover) { e.preventDefault(); if (audio.paused) audio.play(); else audio.pause(); }
    } else if (e.key === "[" || e.key === "]") {
      syncOffset += (e.key === "]" ? 0.01 : -0.01);
      localStorage.setItem("mom_sync", syncOffset.toFixed(3));
      toast("audio sync " + (syncOffset >= 0 ? "+" : "") + syncOffset.toFixed(2) + "s");
    }
  });

  /* ---------- debug hooks ---------- */
  window.__iam = window.__mom = {
    seek: function (t) { audio.currentTime = t; },
    startAt: function (t) { if (!running) start(); audio.currentTime = t || 0; },
    setOffset: function (v) { syncOffset = +v; localStorage.setItem("mom_sync", syncOffset.toFixed(3)); },
    get offset() { return syncOffset; },
    fireDialog: function () { onYes(); },     // trigger the terminal directly
    freeze: function (t) {
      clockOverride = t;
      landing.classList.add("is-gone"); landing.hidden = true;
      endcard.hidden = true;
      stage.classList.add("is-live"); stage.setAttribute("aria-hidden", "false");
      document.body.classList.add("playing");
      running = true;
      renderAt(t);
      requestAnimationFrame(frame);
    },
    unfreeze: function () { clockOverride = null; },
    get time() { return clockOverride != null ? clockOverride : audio.currentTime; },
    get mounted() { return Array.from(mounted.values()).map((e) => e.textContent || e.src); },
  };
})();
