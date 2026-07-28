/* ============================================================
   memories of me — the real music video, alive under glass
   The mp4 decodes into a hidden <video>; WebGL draws it to a canvas
   through a shader that (1) smears the footage into a melting memory
   trail behind the cursor, (2) ripples it like it's underwater, and
   (3) in the black final act, hides everything but a soft light that
   finds the lingering memory. Falls back to the plain <video> if
   WebGL is unavailable. Keeps the responsive cut-switch + iOS bars.
   ============================================================ */
import * as THREE from "three";

(function () {
  "use strict";

  const stage    = document.getElementById("stage");
  const film     = document.getElementById("film");
  const canvas   = document.getElementById("fx");
  const landing  = document.getElementById("landing");
  const endcard  = document.getElementById("endcard");
  const playBtn  = document.getElementById("playBtn");
  const replayBtn = document.getElementById("replayBtn");

  const SRC = { wide: "assets/mom-desktop.mp4", tall: "assets/mom-mobile.mp4" };
  const BLACK_AT = 166.4;             // the video cuts to black here

  let running = false;
  let curKind = null;

  const vertMQ = window.matchMedia("(max-width: 820px), (orientation: portrait)");
  function pickKind() { return vertMQ.matches ? "tall" : "wide"; }

  /* ---------- iOS chrome matches the video ---------- */
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  let lastBcast = null;
  function broadcastBg(color) {
    if (color === lastBcast) return;
    lastBcast = color;
    if (themeMeta) themeMeta.setAttribute("content", color);
    if (window.parent !== window) { try { window.parent.postMessage({ iam: "bg", color: color }, "*"); } catch (e) {} }
    stage.classList.toggle("is-black", color === "#000000");
  }
  film.addEventListener("timeupdate", function () {
    broadcastBg(film.currentTime >= BLACK_AT ? "#000000" : "#ffffff");
  });

  /* ---------- load / swap the right cut ---------- */
  function loadKind(kind, at, autoplay) {
    if (kind === curKind && film.src) {   // already fetched by the landing preloader — reuse it
      if (at != null) { try { film.currentTime = at; } catch (e) {} }
      if (autoplay) { const p = film.play(); if (p && p.catch) p.catch(function () {}); }
      return;
    }
    curKind = kind;
    document.body.classList.toggle("is-vert", kind === "tall");
    film.src = SRC[kind];
    film.load();
    const resume = function () {
      film.removeEventListener("loadedmetadata", resume);
      fitCover();
      if (at != null) { try { film.currentTime = at; } catch (e) {} }
      if (autoplay) { const p = film.play(); if (p && p.catch) p.catch(function () {}); }
    };
    film.addEventListener("loadedmetadata", resume);
  }
  function maybeSwap() {
    if (!running) return;
    const want = pickKind();
    if (want === curKind) return;
    loadKind(want, film.currentTime, !film.paused);
  }
  if (vertMQ.addEventListener) vertMQ.addEventListener("change", maybeSwap);
  else if (vertMQ.addListener) vertMQ.addListener(maybeSwap);
  let swapT;
  window.addEventListener("resize", function () { clearTimeout(swapT); swapT = setTimeout(function () { maybeSwap(); resize(); }, 150); });
  window.addEventListener("orientationchange", function () { maybeSwap(); resize(); });

  /* ============================================================
     WEBGL — memory smear + underwater ripple + dark-act spotlight
     ============================================================ */
  let renderer, sim, disp, rtA, rtB, vtex, glOK = false, DPR = 1;
  const U = {
    uVideo: { value: null }, uPrev: { value: null }, uTex: { value: null },
    uCover: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVel:   { value: new THREE.Vector2(0, 0) },
    uPresence: { value: 0 },
    uTime:  { value: 0 },
    uDark:  { value: 0 },
    uAspect: { value: 1 },
    /* the effect "knobs" — the timeline picks WHICH flavour is available;
       interaction (moving / holding) is what actually reveals it. Idle = clean video. */
    uRipple:  { value: 0.0 },   // ring lens around the moving cursor
    uSmear:   { value: 0.0 },   // memory-melt trail dragged behind motion
    uRGB:     { value: 0.0 },   // colour-split intensity while click-holding
    uDrown:   { value: 0.0 },   // cold-water lens around the cursor
    uGlitch:  { value: 0.0 },   // glitch patch at the cursor only
    uHold:    { value: 0.0 },   // pointer held → the colour effect holds
  };
  const VERT = "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }";
  const SIM_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVideo, uPrev;
    uniform vec2 uCover, uMouse, uVel;
    uniform float uPresence, uHold, uTime, uDark, uAspect;
    uniform float uRipple, uSmear, uRGB, uDrown, uGlitch;
    vec2 coverUV(vec2 uv){ return (uv-0.5)*uCover + 0.5; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5453); }
    void main(){
      vec2 uv = vUv;
      vec2 asp = vec2(uAspect, 1.0);
      vec2 dm = (uv - uMouse) * asp;
      float dist = length(dm);
      float move = uPresence;                     /* 0 when still → clean video */
      float lens = smoothstep(0.42, 0.0, dist);   /* 1 at the cursor → 0 away */

      /* ripple: concentric rings from the cursor — only while moving */
      vec2 disp = vec2(0.0);
      float ring = sin(dist*40.0 - uTime*3.2) * exp(-dist*6.0);
      disp += (normalize(dm + 1e-4)/asp) * ring * 0.014 * move * uRipple;
      /* water: cold slow swell around the cursor while moving (drowning) */
      disp += vec2(sin(uv.y*7.0 + uTime*1.1), sin(uv.x*6.0 - uTime*0.8)) * 0.007 * uDrown * move * lens;

      /* glitch: horizontal band tearing — ONLY in a patch around the cursor, while moving */
      float gmask = uGlitch * move * lens;
      float gshift = 0.0;
      if(gmask > 0.001){
        float band = floor(uv.y * 26.0);
        float seed = hash(vec2(band, floor(uTime * 10.0)));
        gshift = step(0.70, seed) * (seed - 0.5) * 0.22 * gmask;
      }

      vec2 off = disp + vec2(gshift, 0.0);
      vec2 suv = coverUV(uv + off);

      /* colour: chromatic split that HOLDS while you click-and-hold, around the cursor */
      float split = uHold * (0.5 + uRGB) * lens * 0.013;
      vec3 vid;
      if(split > 0.0002){
        vec2 dir = normalize(dm + vec2(0.001, 0.0)) / asp;
        vid.r = texture2D(uVideo, coverUV(uv + off + dir*split)).r;
        vid.g = texture2D(uVideo, suv).g;
        vid.b = texture2D(uVideo, coverUV(uv + off - dir*split)).b;
      } else {
        vid = texture2D(uVideo, suv).rgb;
      }

      /* memory smear: the picture dragged behind the cursor's motion = melting trail.
         Purely velocity-driven, so it vanishes the moment you stop moving. */
      vec2 fbUv = uv - uVel*0.35;
      fbUv = (fbUv - 0.5)*0.9975 + 0.5;
      vec3 ghost = texture2D(uPrev, fbUv).rgb;
      float smear = clamp((0.6 + uSmear*1.4) * length(uVel) * 6.0, 0.0, 0.94) * exp(-dist*2.0);
      vec3 col = mix(vid, ghost, smear);

      /* NOTE: the video keeps feeding through the black act — the end text is IN the
         footage; the lantern in the disp pass is what makes it readable. */
      gl_FragColor = vec4(col, 1.0);
    }`;
  const DISP_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uMouse;
    uniform float uDark, uAspect, uTime, uDrown, uGlitch, uPresence, uHold;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5453); }
    void main(){
      vec3 col = texture2D(uTex, vUv).rgb;
      vec2 asp = vec2(uAspect, 1.0);
      float dist = length((vUv - uMouse) * asp);
      float move = uPresence;
      float lens = smoothstep(0.42, 0.0, dist);   /* 1 at the cursor → 0 away */

      /* water: a cold cast washes around the cursor while moving (drowning) */
      float wmask = uDrown * move * lens;
      if(wmask > 0.001){
        vec3 deep = col * vec3(0.40, 0.66, 0.92);
        float caus = 0.5 + 0.5*sin(vUv.x*30.0 + uTime*1.3)*sin(vUv.y*24.0 - uTime*1.1);
        deep += caus * 0.05;
        col = mix(col, deep, wmask * 0.9);
      }

      /* glitch: scanlines + channel drop — only inside the cursor patch, while moving */
      float gm = uGlitch * move * lens;
      if(gm > 0.001){
        float scan = 0.90 + 0.10*sin(vUv.y*700.0);
        col *= mix(1.0, scan, gm);
        float drop = step(0.90, hash(vec2(floor(uTime*10.0), floor(vUv.y*30.0))));
        col.g = mix(col.g, col.g*(1.0 - drop*0.6), gm);
      }

      /* THE BLACK ACT — the light went out. The video (and its end text) keeps
         playing but is swallowed by darkness; only the warm lantern the mouse
         carries lets you read it. Outside the light: pure black. */
      if(uDark > 0.001){
        vec3 mem0 = col;
        float pulse = 0.27 + 0.02 * sin(uTime * 1.6);            /* gentle breath */
        float orb  = smoothstep(pulse, 0.03, dist);              /* the light circle */
        float halo = smoothstep(pulse*1.9, pulse*0.5, dist);     /* faint outer glow */
        vec3 warm = mem0 * vec3(1.10, 0.97, 0.82);               /* candlelit read */
        vec3 lantern = warm * orb + vec3(0.95, 0.60, 0.28) * halo * 0.10;
        col = mix(mem0, lantern, uDark);                         /* → black outside the light */
      }

      float gr = hash(vUv*vec2(1280.0, 720.0) + uTime);
      col += (gr - 0.5) * 0.02;                                  /* subtle film grain */
      gl_FragColor = vec4(col, 1.0);
    }`;

  /* ============================================================
     THE EFFECT TIMELINE — the look morphs with the song.
     Each mode is a set of knob targets; the render loop crossfades
     the live uniforms toward the active mode so nothing snaps.
     Modes are keyed to the emotional beat of each lyric moment.
     ============================================================ */
  const MODES = {
    //          ripple smear  rgb   drown glitch      (rgb = colour intensity while click-holding)
    dream:    { ripple:1.00, smear:0.20, rgb:0.20, drown:0.00, glitch:0.00 }, // floating ring lens
    pieces:   { ripple:0.55, smear:0.85, rgb:0.20, drown:0.00, glitch:0.00 }, // melting memory trail
    fracture: { ripple:0.55, smear:0.25, rgb:1.10, drown:0.00, glitch:0.10 }, // can't see — colour splits hard on hold
    suffocate:{ ripple:0.40, smear:0.30, rgb:1.30, drown:0.14, glitch:0.10 }, // can't breathe
    debris:   { ripple:0.50, smear:0.45, rgb:0.45, drown:0.00, glitch:1.00 }, // becomes debris — glitch patch
    drown:    { ripple:1.00, smear:0.35, rgb:0.25, drown:1.00, glitch:0.00 }, // now I'm drowning — cold water lens
    hollow:   { ripple:0.40, smear:0.20, rgb:0.35, drown:0.10, glitch:0.90 }, // no more / only objects
    spotlight:{ ripple:0.50, smear:0.35, rgb:0.20, drown:0.00, glitch:0.00 }, // black act (uDark drives the lantern)
  };
  // [time(s), mode] — which flavour is available at each moment of the song
  const TIMELINE = [
    [0.0,   "dream"],      // intro / "all around — memories of me"
    [28.3,  "pieces"],     // lost & found, the pieces that didn't complete
    [41.0,  "fracture"],   // still can't see — nothing but defeat
    [49.0,  "suffocate"],  // not even me / can't breathe
    [59.0,  "debris"],     // memories become debris
    [64.0,  "fracture"],   // are we enemies / will you remember me
    [74.0,  "dream"],      // the turn — calm before the drop
    [85.0,  "drown"],      // falling down — now I'm drowning — into the sea
    [95.4,  "hollow"],     // no more projects / prospects / only objects
    [103.0, "pieces"],     // reminding me — fading
    [111.0, "suffocate"],  // not even me / can't breathe (reprise)
    [121.2, "debris"],     // memories become debris (reprise, harder)
    [126.0, "fracture"],   // are we enemies (reprise)
    [131.0, "pieces"],     // remember? — the looping memory
    [166.4, "spotlight"],  // cut to black — the lantern
  ];
  function modeAt(t) {
    let m = TIMELINE[0][1];
    for (let i = 0; i < TIMELINE.length; i++) { if (t >= TIMELINE[i][0]) m = TIMELINE[i][1]; else break; }
    return m;
  }
  let forcedMode = null;   // debug override
  let pointerDown = false;  // for the click-and-hold colour effect

  function initGL() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch (e) { return false; }
    if (!renderer) return false;
    DPR = Math.min(window.devicePixelRatio || 1, matchMedia("(pointer: coarse)").matches ? 1.4 : 1.75);
    renderer.setPixelRatio(DPR);

    vtex = new THREE.VideoTexture(film);
    vtex.minFilter = THREE.LinearFilter; vtex.magFilter = THREE.LinearFilter;
    vtex.generateMipmaps = false;
    vtex.wrapS = vtex.wrapT = THREE.ClampToEdgeWrapping;
    U.uVideo.value = vtex;

    const geo = new THREE.PlaneGeometry(2, 2);
    sim = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: SIM_FRAG, uniforms: U, depthTest: false, depthWrite: false }));
    disp = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: DISP_FRAG, uniforms: U, depthTest: false, depthWrite: false }));
    simScene = new THREE.Scene(); simScene.add(sim);
    dispScene = new THREE.Scene(); dispScene.add(disp);
    cam = new THREE.Camera();

    makeRTs();
    // context-loss safety (heavy in an iframe)
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); }, false);
    canvas.addEventListener("webglcontextrestored", function () { makeRTs(); resize(); }, false);
    glOK = true;
    return true;
  }
  let simScene, dispScene, cam;
  function makeRTs() {
    const w = Math.max(2, Math.floor(canvas.clientWidth * DPR));
    const h = Math.max(2, Math.floor(canvas.clientHeight * DPR));
    const opt = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
    if (rtA) rtA.dispose(); if (rtB) rtB.dispose();
    rtA = new THREE.WebGLRenderTarget(w, h, opt);
    rtB = new THREE.WebGLRenderTarget(w, h, opt);
  }
  function cw() { return canvas.clientWidth || window.innerWidth || 0; }
  function ch() { return canvas.clientHeight || window.innerHeight || 0; }
  function resize() {
    if (!glOK) return;
    const w = cw(), h = ch();
    if (!w || !h) return;              // never size to 0 (throttled/hidden tab)
    renderer.setSize(w, h, false);
    makeRTs();
    fitCover();
  }
  // cover-fit the video into the canvas (like object-fit: cover)
  function fitCover() {
    if (!glOK) return;
    const vw = film.videoWidth, vh = film.videoHeight, w = cw(), h = ch();
    if (!vw || !vh || !w || !h) return;
    const Ca = w / h, Va = vw / vh;
    if (!isFinite(Ca) || Ca <= 0) return;
    let sx = 1, sy = 1;
    if (Va > Ca) sx = Ca / Va; else sy = Va / Ca;
    U.uCover.value.set(sx, sy);
    U.uAspect.value = Ca;
  }

  /* pointer → mouse uv + velocity + presence */
  const mouse = new THREE.Vector2(0.5, 0.5);
  const mTarget = new THREE.Vector2(0.5, 0.5);
  let lastMove = -10, hasPointer = false;
  function onMove(cx, cy) {
    const r = canvas.getBoundingClientRect();
    mTarget.set((cx - r.left) / r.width, 1 - (cy - r.top) / r.height);
    lastMove = U.uTime.value; hasPointer = true;
  }
  window.addEventListener("pointermove", function (e) { onMove(e.clientX, e.clientY); });
  window.addEventListener("pointerdown", function (e) {
    onMove(e.clientX, e.clientY); pointerDown = true;
    // during the film a finger belongs to the effect — never to a page gesture.
    // Scoped to `running` so it can never interfere with the landing's play button.
    if (running && e.cancelable) e.preventDefault();
  }, { passive: false });
  window.addEventListener("pointerup", function () { pointerDown = false; });
  window.addEventListener("pointercancel", function () { pointerDown = false; });
  window.addEventListener("mouseleave", function () { hasPointer = false; pointerDown = false; });

  let prevMouse = new THREE.Vector2(0.5, 0.5);
  let lastCW = 0, lastCH = 0;
  const clock = { t: 0, last: performance.now() };
  function renderGL() {
    if (!running || !glOK) return;
    // the canvas can report 0 size until the tab is really visible — self-correct
    if (canvas.clientWidth && (canvas.clientWidth !== lastCW || canvas.clientHeight !== lastCH)) {
      lastCW = canvas.clientWidth; lastCH = canvas.clientHeight; resize();
    }
    const now = performance.now();
    const dt = Math.min(0.05, (now - clock.last) / 1000); clock.last = now;
    U.uTime.value += dt;

    // the cursor follows the real pointer only — no idle drift, so a still pointer = clean video
    mouse.lerp(mTarget, 0.18);
    U.uMouse.value.copy(mouse);
    const vel = mouse.clone().sub(prevMouse);
    U.uVel.value.lerp(vel, 0.5);
    prevMouse.copy(mouse);

    // presence = movement activity: quick to rise, gentle to fade → effects only while moving
    const moving = hasPointer && (U.uTime.value - lastMove < 0.22) ? 1 : 0;
    U.uPresence.value += (moving - U.uPresence.value) * (moving > U.uPresence.value ? 0.30 : 0.05);
    // hold = pointer pressed → the colour effect holds
    const held = pointerDown ? 1 : 0;
    U.uHold.value += (held - U.uHold.value) * (held ? 0.30 : 0.10);

    // smooth dark-act crossfade
    const wantDark = film.currentTime >= BLACK_AT ? 1 : 0;
    U.uDark.value += (wantDark - U.uDark.value) * 0.06;

    // ---- effect timeline: crossfade the knobs toward the active mode's flavour ----
    const M = MODES[forcedMode || modeAt(film.currentTime)] || MODES.dream;
    const kf = 1 - Math.exp(-dt * 2.6);   // ~0.4s to arrive, graceful morph
    U.uRipple.value += (M.ripple - U.uRipple.value) * kf;
    U.uSmear.value  += (M.smear  - U.uSmear.value)  * kf;
    U.uRGB.value    += (M.rgb    - U.uRGB.value)    * kf;
    U.uDrown.value  += (M.drown  - U.uDrown.value)  * kf;
    U.uGlitch.value += (M.glitch - U.uGlitch.value) * kf;

    if (film.readyState >= 2) vtex.needsUpdate = true;
    drawFrame();
    requestAnimationFrame(renderGL);
  }
  // the two-pass feedback draw, factored out so it can be called synchronously (verify)
  function drawFrame() {
    if (!glOK) return;
    U.uPrev.value = rtA.texture;
    renderer.setRenderTarget(rtB);
    renderer.render(simScene, cam);
    U.uTex.value = rtB.texture;
    renderer.setRenderTarget(null);
    renderer.render(dispScene, cam);
    const tmp = rtA; rtA = rtB; rtB = tmp;
  }

  /* ---------- the play triangle IS the loading bar ----------
     A hairline outline appears immediately; real load progress fills it
     black left-to-right; at 100% it settles with a pop and goes live. */
  const triRect = document.getElementById("triRect");
  let triShown = 0, triReal = 0, triTrickle = 0, triReady = false;
  function triProgress(p) { triReal = Math.max(triReal, Math.min(1, p || 0)); }
  const triTimer = setInterval(function () {
    triTrickle = Math.min(triTrickle + 0.004, 0.3);       // always alive, never lies far ahead
    const t = Math.max(triReal, triTrickle);
    triShown += (t - triShown) * 0.14;
    if (triReal >= 1 && triShown > 0.985) triShown = 1;
    if (triRect) triRect.setAttribute("width", (triShown * 62).toFixed(2));
    if (triShown >= 1) {
      clearInterval(triTimer);
      triReady = true;
      playBtn.classList.remove("is-loading");
      playBtn.classList.add("is-ready");
    }
  }, 40);
  window.__tri = triProgress;

  playBtn.classList.add("is-loading");
  (function () {
    let fontsP = 0, vidP = 0;
    function upd() { triProgress(0.2 * fontsP + 0.8 * vidP); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fontsP = 1; upd(); });
    setTimeout(function () { fontsP = 1; upd(); }, 5000);
    film.preload = "auto";
    loadKind(pickKind(), null, false);          // start fetching the right cut immediately
    function vid() {
      try {
        if (film.readyState >= 4) vidP = 1;
        else if (film.duration && film.buffered.length) vidP = Math.max(vidP, Math.min(1, (film.buffered.end(film.buffered.length - 1) / film.duration) / 0.6));
      } catch (e) {}
      upd();
    }
    film.addEventListener("progress", vid);
    film.addEventListener("canplaythrough", function () { vidP = 1; upd(); });
    const poll = setInterval(function () { vid(); if (vidP >= 1 && fontsP >= 1) clearInterval(poll); }, 300);
    setTimeout(function () { fontsP = 1; vidP = 1; upd(); }, 15000);    // never strand the button
    vid();
  })();

  /* ---------- landing water: the play button ripples like the video's water ---------- */
  (function water() {
    const cv = document.getElementById("waterCanvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, DPRw = 1;
    const ripples = [];
    function size() {
      DPRw = Math.min(window.devicePixelRatio || 1, 2);
      W = landing.clientWidth || window.innerWidth;
      H = landing.clientHeight || window.innerHeight;
      cv.width = Math.max(1, Math.floor(W * DPRw));
      cv.height = Math.max(1, Math.floor(H * DPRw));
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(DPRw, 0, 0, DPRw, 0, 0);
    }
    function localXY(clientX, clientY) {
      const lr = landing.getBoundingClientRect();
      return { x: clientX - lr.left, y: clientY - lr.top };
    }
    function btnCenter() {
      const r = playBtn.getBoundingClientRect(), lr = landing.getBoundingClientRect();
      return { x: r.left + r.width / 2 - lr.left, y: r.top + r.height / 2 - lr.top };
    }
    // Hard cap: a handful at most. 48 concurrent rings turned the landing into a
    // spirograph of overlapping arcs — that must never be possible again.
    const MAX_RIPPLES = 6;
    function drop(x, y, strength) {
      ripples.push({ x: x, y: y, t: performance.now(), s: strength || 1 });
      while (ripples.length > MAX_RIPPLES) ripples.shift();
    }
    function drawFrame(now) {
      ctx.clearRect(0, 0, W, H);
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        const age = (now - rp.t) / 1000;
        const s = Math.min(rp.s, 2.2);
        const life = 1.1 * s + 0.9;                                  // short — they can't stack up
        if (age > life) { ripples.splice(i, 1); continue; }
        const p = age / life;
        const rad = p * (120 + 70 * s);                              // a pool at the button, not the whole page
        const a = (1 - p) * (1 - p) * 0.95 * Math.min(1, 0.55 + s * 0.45);      // stronger, holds then fades
        ctx.lineWidth = 6.0 * (1 - p) + 0.8;                         // outer ring — thick
        ctx.strokeStyle = "rgba(40,130,205," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rad, 0, 6.2832); ctx.stroke();
        ctx.lineWidth = 4.0 * (1 - p) + 0.5;                         // mid ring
        ctx.strokeStyle = "rgba(95,175,230," + (a * 0.85).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rad * 0.62, 0, 6.2832); ctx.stroke();
        ctx.lineWidth = 2.6 * (1 - p) + 0.4;                         // inner ring
        ctx.strokeStyle = "rgba(150,205,240," + (a * 0.7).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rad * 0.32, 0, 6.2832); ctx.stroke();
      }
    }
    let lastAmbient = 0;
    function loop(now) {
      if (landing.classList.contains("is-gone")) {                 // done at showtime
        ripples.length = 0; ctx.clearRect(0, 0, W, H); return;
      }
      if (cv.clientWidth && Math.abs(cv.clientWidth - W) > 1) size();  // self-correct if it sized to 0 at load
      if (now - lastAmbient > 1900) { lastAmbient = now; const c = btnCenter(); drop(c.x, c.y, 1.3); }
      drawFrame(now);
      requestAnimationFrame(loop);
    }
    size();
    window.addEventListener("resize", size);
    window.__water = {
      size: size, drop: drop, step: function () { drawFrame(performance.now()); },
      get count() { return ripples.length; }, max: MAX_RIPPLES,
      // the click burst: two rings expanding at different rates = a real splash
      splash: function () { const c = btnCenter(); drop(c.x, c.y, 2.2); drop(c.x, c.y, 1.1); }
    };
    // NO ripples from moving the pointer: one per 46px of travel filled the screen with
    // overlapping arcs the moment you swept the mouse across the landing. The water now
    // comes only from the button's own pulse and from an actual press.
    landing.addEventListener("pointerdown", function (e) {
      const q = localXY(e.clientX, e.clientY); drop(q.x, q.y, 2.2);   // a firm splash on press
    });
    requestAnimationFrame(loop);
  })();

  /* ---------- flow ---------- */
  function beginPlayback(at, autoplay) {
    stage.classList.add("is-live");
    stage.setAttribute("aria-hidden", "false");
    document.body.classList.add("playing");
    broadcastBg("#ffffff");
    running = true;
    loadKind(pickKind(), at, autoplay);
    if (glOK) { clock.last = performance.now(); requestAnimationFrame(renderGL); }
  }
  let starting = false;
  function start() {
    if (!triReady || starting) return;
    starting = true;
    // the click bursts the water + an RGB colour glitch on the title/arrow — held ~1s so you see it
    if (window.__water && window.__water.splash) window.__water.splash();
    landing.classList.add("is-glitch");
    setTimeout(function () {
      landing.classList.add("is-gone");
      setTimeout(function () { landing.hidden = true; }, 500);
      beginPlayback(0, true);          // still within transient activation → autoplay-with-sound holds
    }, 1000);
  }
  playBtn.addEventListener("click", start);

  film.addEventListener("ended", function () {
    running = false;
    broadcastBg("#000000");
    stage.classList.remove("is-live");
    endcard.hidden = false;
    requestAnimationFrame(function () { endcard.classList.add("is-visible"); });
  });
  replayBtn.addEventListener("click", function () {
    endcard.classList.remove("is-visible");
    setTimeout(function () { endcard.hidden = true; }, 400);
    U.uDark.value = 0;
    beginPlayback(0, true);
  });

  window.addEventListener("keydown", function (e) {
    const isSpace = e.code === "Space" || e.key === " ";
    const isEnter = e.key === "Enter";
    if (isSpace || isEnter) {
      if (!landing.classList.contains("is-gone")) { e.preventDefault(); start(); }
      else if (!endcard.hidden) { e.preventDefault(); replayBtn.click(); }
      else if (running && isSpace) { e.preventDefault(); if (film.paused) film.play(); else film.pause(); }
    }
  });

  // bfcache / context restore
  window.addEventListener("pageshow", function (e) { if (e.persisted && glOK) { resize(); } });

  /* ---------- boot ---------- */
  if (!initGL()) {
    document.body.classList.add("no-gl");   // styles fall back to the plain <video>
  } else {
    resize();
  }

  // debug hook
  window.__mom = {
    seek: function (t) { film.currentTime = t; },
    startAt: function (t) { if (!running) start(); film.currentTime = t || 0; },
    mode: function (name) { forcedMode = name || null; },   // force / clear an effect mode
    modeAt: modeAt,
    renderOnce: function () { if (film.readyState >= 2) vtex.needsUpdate = true; drawFrame(); },
    pause: function () { running = false; },                // halt the rAF loop (verify: hold a state still)
    resume: function () { if (!running) { running = true; clock.last = performance.now(); requestAnimationFrame(renderGL); } },
    // set knob uniforms directly + draw — for verifying a look in the throttled preview tab
    set: function (o) { for (const k in o) { const u = U["u" + k.charAt(0).toUpperCase() + k.slice(1)]; if (u) u.value = o[k]; } if (film.readyState >= 2) vtex.needsUpdate = true; drawFrame(); },
    get kind() { return curKind; },
    get time() { return film.currentTime; },
    get dark() { return U.uDark.value; },
    get curMode() { return forcedMode || modeAt(film.currentTime); },
    U: U,
  };
})();
