/* ============================================================
   memories of me — embedded player
   After Play: plays clay & kelsy's actual music video (with sound).
   Picks the 16:9 cut on desktop, the vertical cut on a narrow /
   portrait viewport, and swaps between them on resize without
   losing your place. Flips the iOS status bar / toolbar to black
   for the final act (same trick as the other pieces).
   ============================================================ */
(function () {
  "use strict";

  const stage    = document.getElementById("stage");
  const film     = document.getElementById("film");
  const landing  = document.getElementById("landing");
  const endcard  = document.getElementById("endcard");
  const playBtn  = document.getElementById("playBtn");
  const replayBtn = document.getElementById("replayBtn");

  const SRC = {
    wide: "assets/mom-desktop.mp4",   // the 16:9 cut
    tall: "assets/mom-mobile.mp4",    // the vertical cut
  };
  const BLACK_AT = 166.4;             // the video cuts to black here — flip the phone chrome too

  let running = false;
  let curKind = null;                 // "wide" | "tall"

  // narrow OR portrait viewport → the vertical cut
  const vertMQ = window.matchMedia("(max-width: 820px), (orientation: portrait)");
  function pickKind() { return vertMQ.matches ? "tall" : "wide"; }

  /* ---------- keep the browser chrome (iOS bars) matching the video ---------- */
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
      if (at != null) { try { film.currentTime = at; } catch (e) {} }
      if (autoplay) { const p = film.play(); if (p && p.catch) p.catch(function () {}); }
    };
    film.addEventListener("loadedmetadata", resume);
  }

  // swap cuts when the viewport crosses the breakpoint, preserving position + play state.
  // (listen to matchMedia AND resize/orientation — the media 'change' event alone is flaky.)
  function maybeSwap() {
    if (!running) return;
    const want = pickKind();
    if (want === curKind) return;
    loadKind(want, film.currentTime, !film.paused);
  }
  if (vertMQ.addEventListener) vertMQ.addEventListener("change", maybeSwap);
  else if (vertMQ.addListener) vertMQ.addListener(maybeSwap);
  let swapT;
  window.addEventListener("resize", function () { clearTimeout(swapT); swapT = setTimeout(maybeSwap, 150); });
  window.addEventListener("orientationchange", maybeSwap);

  /* ---------- flow ---------- */
  function start() {
    landing.classList.add("is-gone");
    setTimeout(function () { landing.hidden = true; }, 500);
    stage.classList.add("is-live");
    stage.setAttribute("aria-hidden", "false");
    document.body.classList.add("playing");
    broadcastBg("#ffffff");
    running = true;
    loadKind(pickKind(), 0, true);
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
    stage.classList.add("is-live");
    document.body.classList.add("playing");
    broadcastBg("#ffffff");
    running = true;
    loadKind(pickKind(), 0, true);
  });

  // space / enter = play / replay; space also pauses mid-video
  window.addEventListener("keydown", function (e) {
    const isSpace = e.code === "Space" || e.key === " ";
    const isEnter = e.key === "Enter";
    if (isSpace || isEnter) {
      if (!landing.classList.contains("is-gone")) { e.preventDefault(); start(); }
      else if (!endcard.hidden) { e.preventDefault(); replayBtn.click(); }
      else if (running && isSpace) { e.preventDefault(); if (film.paused) film.play(); else film.pause(); }
    }
  });

  // debug hook
  window.__mom = {
    seek: function (t) { film.currentTime = t; },
    get kind() { return curKind; },
    get time() { return film.currentTime; },
  };
})();
