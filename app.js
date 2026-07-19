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
  };
  const VERT = "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }";
  const SIM_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVideo, uPrev;
    uniform vec2 uCover, uMouse, uVel;
    uniform float uPresence, uTime, uDark, uAspect;
    vec2 coverUV(vec2 uv){ return (uv-0.5)*uCover + 0.5; }
    void main(){
      vec2 uv = vUv;
      vec2 asp = vec2(uAspect, 1.0);
      vec2 dm = (uv - uMouse) * asp;
      float dist = length(dm);
      /* ripple: idle undulation (always) + rings from the cursor */
      vec2 disp = vec2(sin(uv.y*16.0 + uTime*0.6), cos(uv.x*14.0 + uTime*0.5)) * 0.0016;
      float ring = sin(dist*42.0 - uTime*3.2) * exp(-dist*7.0);
      disp += (normalize(dm + 1e-4) / asp) * ring * 0.012 * (0.35 + uPresence);
      vec3 vid = texture2D(uVideo, coverUV(uv + disp)).rgb;
      /* memory smear: previous frame dragged against the motion + a hair of zoom = melt */
      vec2 fbUv = uv - uVel*0.35;
      fbUv = (fbUv - 0.5)*0.9975 + 0.5;
      vec3 ghost = texture2D(uPrev, fbUv).rgb;
      float smear = clamp((0.28 + 1.7*length(uVel)) * exp(-dist*2.2), 0.0, 0.92);
      vec3 col = mix(vid, ghost, smear);
      /* in the black act: stop feeding the video — hold the last living memory */
      col = mix(col, ghost, uDark);
      gl_FragColor = vec4(col, 1.0);
    }`;
  const DISP_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uMouse;
    uniform float uDark, uAspect, uTime;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5453); }
    void main(){
      vec3 col = texture2D(uTex, vUv).rgb;
      if(uDark > 0.001){
        vec2 asp = vec2(uAspect, 1.0);
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
  window.addEventListener("pointerdown", function (e) { onMove(e.clientX, e.clientY); });
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

    if (film.readyState >= 2) vtex.needsUpdate = true;

    // feedback: sim(video, prev) -> write; then show write; swap
    U.uPrev.value = rtA.texture;
    renderer.setRenderTarget(rtB);
    renderer.render(simScene, cam);
    U.uTex.value = rtB.texture;
    renderer.setRenderTarget(null);
    renderer.render(dispScene, cam);
    const tmp = rtA; rtA = rtB; rtB = tmp;

    requestAnimationFrame(renderGL);
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
    get kind() { return curKind; },
    get time() { return film.currentTime; },
    get dark() { return U.uDark.value; },
    U: U,
  };
})();
