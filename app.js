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
  const dialogLayer = document.getElementById("dialogLayer");
  const shutdown = document.getElementById("shutdown");
  const sdDots   = document.getElementById("sdDots");

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
  function syncChrome() {
    broadcastBg(film.currentTime >= BLACK_AT ? "#000000" : "#ffffff");
  }

  /* ---------- the one reactive thing: the Windows delete dialog ----------
     It rides over the "PROSPECTS" moment (dead-center, so it covers that
     part of the video at any size). Yes → a Windows shutdown effect. */
  const DLG = { s: 96.86, e: 100.3 };   // the window it can appear in
  let dialogEl = null, dialogShown = false, shuttingDown = false;

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
    d.querySelector("#xpYes").addEventListener("click", function (e) { e.stopPropagation(); startShutdown(); });
    d.querySelector("#xpNo").addEventListener("click", function (e) { e.stopPropagation(); /* No does nothing */ });
    d.querySelector(".xp-dialog__x").addEventListener("click", function (e) { e.stopPropagation(); });
    return d;
  }
  function showDialog() {
    if (dialogShown) return;
    dialogShown = true;
    dialogEl = buildDialog();
    dialogLayer.appendChild(dialogEl);
    dialogLayer.classList.add("is-on");
    document.body.classList.add("xp-cursor");
  }
  function hideDialog() {
    if (!dialogShown) return;
    dialogShown = false;
    if (dialogEl) { dialogEl.remove(); dialogEl = null; }
    dialogLayer.classList.remove("is-on");
    document.body.classList.remove("xp-cursor");
  }

  let sdTimers = [];
  function startShutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    hideDialog();
    try { film.pause(); } catch (e) {}
    running = false;
    shutdown.classList.add("is-on");
    broadcastBg("#000000");
    // animate the "shutting down..." dots
    let n = 0;
    const dots = setInterval(function () { n = (n + 1) % 4; sdDots.textContent = ".".repeat(n); }, 450);
    sdTimers.push(function () { clearInterval(dots); });
    // then to black, then the end card
    sdTimers.push(timeout(function () { shutdown.classList.add("is-off"); }, 3600));
    sdTimers.push(timeout(function () {
      clearInterval(dots);
      shutdown.classList.remove("is-on", "is-off");
      stage.classList.remove("is-live");
      endcard.hidden = false;
      requestAnimationFrame(function () { endcard.classList.add("is-visible"); });
    }, 5100));
  }
  function timeout(fn, ms) { const id = setTimeout(fn, ms); return function () { clearTimeout(id); }; }
  function resetDialogState() {
    hideDialog();
    shuttingDown = false;
    shutdown.classList.remove("is-on", "is-off");
    sdTimers.forEach(function (c) { c(); }); sdTimers = [];
    sdDots.textContent = "";
  }

  film.addEventListener("timeupdate", function () {
    syncChrome();
    if (!running || shuttingDown) return;
    const t = film.currentTime;
    if (t >= DLG.s && t < DLG.e) showDialog();
    else hideDialog();
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
      syncChrome();
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
    resetDialogState();
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
    resetDialogState();
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
    dialog: function () { running = true; showDialog(); },   // preview the reactive dialog
    shutdown: startShutdown,                                 // preview the shutdown effect
    get kind() { return curKind; },
    get time() { return film.currentTime; },
  };
})();
