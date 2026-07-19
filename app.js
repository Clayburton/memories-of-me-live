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
    /* the effect "knobs" — the timeline crossfades these so the look morphs with the song */
    uRipple:  { value: 1.0 },   // underwater undulation
    uSmear:   { value: 0.1 },   // ambient memory-melt floor
    uRGB:     { value: 0.0 },   // chromatic fracture
    uDrown:   { value: 0.0 },   // sink + cold-water cast
    uGlitch:  { value: 0.0 },   // digital tearing / decay
    uKaleido: { value: 0.0 },   // hall-of-mirrors echo
    uBloom:   { value: 0.3 },   // dreamy overexposed nostalgia
    /* click shockwave */
    uBurst:   { value: 0.0 },
    uBurstPos:{ value: new THREE.Vector2(0.5, 0.5) },
    uBurstAge:{ value: 0.0 },
  };
  const VERT = "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }";
  const SIM_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVideo, uPrev;
    uniform vec2 uCover, uMouse, uVel, uBurstPos;
    uniform float uPresence, uTime, uDark, uAspect;
    uniform float uRipple, uSmear, uRGB, uDrown, uGlitch, uKaleido, uBurst, uBurstAge;
    vec2 coverUV(vec2 uv){ return (uv-0.5)*uCover + 0.5; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5453); }
    void main(){
      vec2 uv = vUv;
      vec2 asp = vec2(uAspect, 1.0);

      /* kaleido: a hall-of-mirrors echo — the memory folding back on itself */
      if(uKaleido > 0.001){
        vec2 ku = uv;
        ku.x = 0.5 - abs(ku.x - 0.5);
        ku.y = mix(ku.y, 0.75 - abs(ku.y - 0.5), 0.30);
        float pulse = 1.0 + 0.03 * sin(uTime * 0.9);
        ku = (ku - 0.5) * pulse + 0.5;
        uv = mix(uv, ku, uKaleido);
      }

      /* glitch: horizontal band tearing + jitter — the picture decaying */
      if(uGlitch > 0.001){
        float band = floor(uv.y * 24.0);
        float seed = hash(vec2(band, floor(uTime * 9.0)));
        uv.x += step(0.80, seed) * (seed - 0.5) * 0.18 * uGlitch;
        uv.x += (hash(vec2(floor(uTime*12.0), 7.0)) - 0.5) * 0.02 * uGlitch * step(0.7, seed);
      }

      vec2 dm = (uv - uMouse) * asp;
      float dist = length(dm);

      /* ripple: idle undulation + cursor rings, amplified while drowning */
      float amp = uRipple * (1.0 + 2.2 * uDrown);
      vec2 disp = vec2(sin(uv.y*16.0 + uTime*0.6), cos(uv.x*14.0 + uTime*0.5)) * 0.0016 * amp;
      disp += vec2(sin(uv.y*6.0 + uTime*1.1), sin(uv.x*5.0 - uTime*0.8)) * 0.006 * uDrown;
      disp.y += uDrown * 0.010 * (0.5 + 0.5*sin(uTime*0.7));           /* slow sink */
      float ring = sin(dist*42.0 - uTime*3.2) * exp(-dist*7.0);
      disp += (normalize(dm + 1e-4)/asp) * ring * 0.012 * (0.35 + uPresence) * uRipple;

      /* click burst: an expanding shockwave ring pushes the picture outward */
      if(uBurst > 0.001){
        vec2 bd = (uv - uBurstPos) * asp;
        float bdist = length(bd);
        float r = uBurstAge * 0.9;
        float w = exp(-pow((bdist - r) * 9.0, 2.0));
        disp += (normalize(bd + 1e-4)/asp) * w * 0.05 * uBurst;
      }

      vec2 suv = coverUV(uv + disp);

      /* RGB split: pull the colour channels apart (fracture); the burst flashes it too */
      float split = uRGB * 0.006 + uBurst * exp(-uBurstAge*3.0) * 0.012;
      vec3 vid;
      if(split > 0.0001){
        vec2 dir = normalize(dm + vec2(0.001, 0.0)) / asp;
        vid.r = texture2D(uVideo, coverUV(uv + disp + dir*split)).r;
        vid.g = texture2D(uVideo, suv).g;
        vid.b = texture2D(uVideo, coverUV(uv + disp - dir*split)).b;
      } else {
        vid = texture2D(uVideo, suv).rgb;
      }

      /* memory smear: previous frame dragged against the motion + a hair of zoom = melt */
      vec2 fbUv = uv - uVel*0.35;
      fbUv = (fbUv - 0.5)*0.9975 + 0.5;
      vec3 ghost = texture2D(uPrev, fbUv).rgb;
      float smear = clamp((0.18 + uSmear*0.42 + 1.7*length(uVel)) * exp(-dist*2.2*(1.0 - uSmear*0.5)), 0.0, 0.94);
      vec3 col = mix(vid, ghost, smear);

      /* in the black act: stop feeding the video — hold the last living memory */
      col = mix(col, ghost, uDark);
      gl_FragColor = vec4(col, 1.0);
    }`;
  const DISP_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uMouse, uBurstPos;
    uniform float uDark, uAspect, uTime, uDrown, uGlitch, uBloom, uBurst, uBurstAge;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5453); }
    void main(){
      vec3 col = texture2D(uTex, vUv).rgb;
      vec2 asp = vec2(uAspect, 1.0);

      /* bloom: dreamy overexposed highlights */
      if(uBloom > 0.001){
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        vec3 glow = col * smoothstep(0.55, 1.0, lum);
        col += glow * uBloom * 1.4;
      }

      /* drown: sink toward cold deep water, darker + bluer toward the bottom */
      if(uDrown > 0.001){
        vec3 deep = col * vec3(0.35, 0.62, 0.90);
        float depth = smoothstep(0.0, 1.0, vUv.y);
        deep *= mix(1.0, 0.55, depth * 0.8);
        float caus = 0.5 + 0.5*sin(vUv.x*30.0 + uTime*1.3)*sin(vUv.y*24.0 - uTime*1.1);
        deep += caus * 0.05 * uDrown;
        col = mix(col, deep, uDrown * 0.85);
      }

      /* glitch: scanline darkening + colour-channel drop flashes */
      if(uGlitch > 0.001){
        float scan = 0.92 + 0.08*sin(vUv.y*700.0);
        col *= mix(1.0, scan, uGlitch);
        float drop = step(0.90, hash(vec2(floor(uTime*10.0), floor(vUv.y*30.0))));
        col.g = mix(col.g, col.g*(1.0 - drop*0.6), uGlitch);
      }

      /* click burst: a shock ring that inverts what it crosses — reads on any background */
      if(uBurst > 0.001){
        float bdist = length((vUv - uBurstPos)*asp);
        float ringw = exp(-pow((bdist - uBurstAge*0.9)*10.0, 2.0));
        float k = ringw * uBurst;
        col = mix(col, 1.0 - col, k * 0.85);
        col += k * 0.12;
      }

      /* dark-act spotlight (the funeral) */
      if(uDark > 0.001){
        float d = length((vUv - uMouse)*asp);
        float sp = smoothstep(0.27, 0.015, d);            /* soft light circle */
        float g = dot(col, vec3(0.299, 0.587, 0.114));
        vec3 mem = mix(vec3(g), col, 0.45) * vec3(1.04, 0.99, 0.93);  /* faded photograph */
        col = mix(col, mem * sp, uDark);
      }

      float gr = hash(vUv*vec2(1280.0, 720.0) + uTime);
      col += (gr - 0.5) * 0.03;                            /* soft film grain */
      gl_FragColor = vec4(col, 1.0);
    }`;

  /* ============================================================
     THE EFFECT TIMELINE — the look morphs with the song.
     Each mode is a set of knob targets; the render loop crossfades
     the live uniforms toward the active mode so nothing snaps.
     Modes are keyed to the emotional beat of each lyric moment.
     ============================================================ */
  const MODES = {
    //          ripple smear rgb  drown glitch kaleido bloom
    dream:    { ripple:1.00, smear:0.10, rgb:0.00, drown:0.00, glitch:0.00, kaleido:0.00, bloom:0.38 }, // floating, nostalgic
    pieces:   { ripple:0.80, smear:0.42, rgb:0.06, drown:0.00, glitch:0.00, kaleido:0.00, bloom:0.24 }, // memory-melt trail
    fracture: { ripple:0.70, smear:0.20, rgb:0.62, drown:0.00, glitch:0.16, kaleido:0.00, bloom:0.14 }, // can't see / self splitting
    suffocate:{ ripple:0.46, smear:0.30, rgb:0.90, drown:0.10, glitch:0.10, kaleido:0.00, bloom:0.04 }, // can't breathe
    debris:   { ripple:0.60, smear:0.40, rgb:0.34, drown:0.00, glitch:0.78, kaleido:0.00, bloom:0.10 }, // becomes debris
    drown:    { ripple:1.10, smear:0.34, rgb:0.10, drown:1.00, glitch:0.00, kaleido:0.00, bloom:0.14 }, // now I'm drowning
    hollow:   { ripple:0.40, smear:0.16, rgb:0.14, drown:0.14, glitch:0.90, kaleido:0.00, bloom:0.04 }, // no more / only objects
    echo:     { ripple:0.70, smear:0.30, rgb:0.20, drown:0.26, glitch:0.00, kaleido:0.60, bloom:0.20 }, // remember me — endless loop
    spotlight:{ ripple:0.50, smear:0.40, rgb:0.00, drown:0.00, glitch:0.00, kaleido:0.00, bloom:0.00 }, // the black act (uDark drives it)
  };
  // [time(s), mode] — arrival of each new feeling in the song
  const TIMELINE = [
    [0.0,   "dream"],      // intro / "all around — memories of me"
    [28.3,  "pieces"],     // lost & found, the pieces that didn't complete
    [41.0,  "fracture"],   // still can't see — nothing but defeat
    [49.0,  "suffocate"],  // not even me / can't breathe
    [59.0,  "debris"],     // memories become debris
    [64.0,  "fracture"],   // are we enemies / will you remember me
    [74.0,  "echo"],       // the turn — loop starts to fold
    [85.0,  "drown"],      // falling down — now I'm drowning — into the sea
    [95.4,  "hollow"],     // no more projects / prospects / only objects
    [103.0, "pieces"],     // reminding me — fading
    [111.0, "suffocate"],  // not even me / can't breathe (reprise)
    [121.2, "debris"],     // memories become debris (reprise, harder)
    [126.0, "fracture"],   // are we enemies (reprise)
    [131.0, "echo"],       // remember? — the loop
    [166.4, "spotlight"],  // cut to black — the funeral
  ];
  function modeAt(t) {
    let m = TIMELINE[0][1];
    for (let i = 0; i < TIMELINE.length; i++) { if (t >= TIMELINE[i][0]) m = TIMELINE[i][1]; else break; }
    return m;
  }
  let forcedMode = null;   // debug override

  /* click shockwave */
  let burstAmp = 0, burstAge = 0;
  function fireBurst(uvx, uvy) {
    U.uBurstPos.value.set(uvx, uvy);
    burstAmp = 1.0; burstAge = 0.0;
  }

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
    onMove(e.clientX, e.clientY);
    // click = a shockwave rippling out from the point you touched (works everywhere, incl. the black act)
    if (running && glOK) {
      const r = canvas.getBoundingClientRect();
      if (r.width && r.height) fireBurst((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    }
  });
  window.addEventListener("mouseleave", function () { hasPointer = false; });

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

    // idle drift: if the pointer's been still a moment, let the ripple centre wander (keeps it alive on touch)
    if (U.uTime.value - lastMove > 1.6 || !hasPointer) {
      const t = U.uTime.value;
      mTarget.set(0.5 + 0.22 * Math.sin(t * 0.23), 0.5 + 0.16 * Math.sin(t * 0.31 + 1.0));
    }
    mouse.lerp(mTarget, 0.12);
    U.uMouse.value.copy(mouse);
    const vel = mouse.clone().sub(prevMouse);
    U.uVel.value.lerp(vel, 0.5);
    prevMouse.copy(mouse);
    U.uPresence.value += ((hasPointer && (U.uTime.value - lastMove < 0.4) ? 1 : 0) - U.uPresence.value) * 0.08;

    // smooth dark-act crossfade
    const wantDark = film.currentTime >= BLACK_AT ? 1 : 0;
    U.uDark.value += (wantDark - U.uDark.value) * 0.06;

    // ---- effect timeline: crossfade the knobs toward the active mode ----
    const M = MODES[forcedMode || modeAt(film.currentTime)] || MODES.dream;
    const kf = 1 - Math.exp(-dt * 2.6);   // ~0.4s to arrive, graceful morph
    U.uRipple.value  += (M.ripple  - U.uRipple.value)  * kf;
    U.uSmear.value   += (M.smear   - U.uSmear.value)   * kf;
    U.uRGB.value     += (M.rgb     - U.uRGB.value)     * kf;
    U.uDrown.value   += (M.drown   - U.uDrown.value)   * kf;
    U.uGlitch.value  += (M.glitch  - U.uGlitch.value)  * kf;
    U.uKaleido.value += (M.kaleido - U.uKaleido.value) * kf;
    U.uBloom.value   += (M.bloom   - U.uBloom.value)   * kf;

    // ---- click shockwave ----
    if (burstAmp > 0.001) {
      burstAge += dt;
      burstAmp *= Math.exp(-dt * 2.4);
      if (burstAmp < 0.01) burstAmp = 0;
    }
    U.uBurst.value = burstAmp;
    U.uBurstAge.value = burstAge;

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
  function start() {
    landing.classList.add("is-gone");
    setTimeout(function () { landing.hidden = true; }, 500);
    beginPlayback(0, true);
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
    burst: function (x, y) { fireBurst(x == null ? 0.5 : x, y == null ? 0.5 : y); },
    renderOnce: function () { if (film.readyState >= 2) vtex.needsUpdate = true; drawFrame(); },
    // set knob uniforms directly + draw — for verifying a look in the throttled preview tab
    set: function (o) { for (const k in o) { const u = U["u" + k.charAt(0).toUpperCase() + k.slice(1)]; if (u) u.value = o[k]; } if (film.readyState >= 2) vtex.needsUpdate = true; drawFrame(); },
    get kind() { return curKind; },
    get time() { return film.currentTime; },
    get dark() { return U.uDark.value; },
    get curMode() { return forcedMode || modeAt(film.currentTime); },
    U: U,
  };
})();
