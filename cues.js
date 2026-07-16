/* ============================================================
   memories of me — cue sheet (the timeline)
   Reconstructed frame-by-frame from the 4K master 'mom Lyric
   Video.mov' (content-signature segmentation, 29.97fps). Every
   s/e is anchored to a real element boundary; kinetic effects
   (type / typeloop / decay / erase / sink / slide / shape) are
   computed live from each cue's local time, so the in-between
   frames are generated with zero lag.

   White stage 0→166.566s, then a hard cut to BLACK for the final
   act. `size` = vh. `fit` = fraction of stage width. Two vertical
   film panels ride on the video layer behind the type.
   ============================================================ */

const A = "assets/film-a.mp4";   // the candle being lit
const B = "assets/film-b.mp4";   // the face in candlelight / burning flower

const CUES = [
  /* ---------- title ---------- */
  { s: 0.00, e: 0.83, text: "memories of me", role: "serifIt", size: 7.6, y: 47, weight: 500 },
  { s: 0.00, e: 0.83, text: "clay and kelsy", role: "sans",   size: 3.4, y: 54 },
  { s: 0.83, e: 1.33, text: "made by clay",   role: "sans",   size: 3.4, y: 52 },

  /* ---------- FILM A — the candle (vertical panel) ---------- */
  { s: 1.334, e: 23.323, film: A, vStart: 0, enter: "fade", exit: "fade", dur: 0.4 },

  /* ---------- "all around" builds and stacks ---------- */
  { s: 23.32, e: 23.79, text: "all", role: "serif", size: 15, y: 50 },
  { s: 23.79, e: 23.96, text: "around\nall", role: "serif", size: 8, y: 50, lh: 1.15, anchor: "c" },
  { s: 23.96, e: 24.29, text: "around\nall\naround", role: "serif", size: 8, y: 50, lh: 1.15, anchor: "c" },
  { s: 24.29, e: 24.93, text: "around  all  around\naround", role: "serif", size: 6, y: 50, lh: 1.3, anchor: "c" },

  /* ---------- memories of me (ghost doubles converge) ---------- */
  { s: 25.89, e: 27.23, text: "memories of me", role: "serifIt", size: 6.4, y: 51 },
  { s: 25.89, e: 26.89, text: "memories of me", role: "serifIt", size: 6.4, y: 51, opacity: 0.5, driftX: -3, driftY: -2.5 },
  { s: 25.89, e: 26.89, text: "memories of me", role: "serifIt", size: 6.4, y: 51, opacity: 0.5, driftX: 3, driftY: 2.5 },

  /* ---------- "lost and found" — "lost" flickers ---------- */
  { s: 28.53, e: 30.10, text: "lost", role: "serif", size: 6.6, x: 40, y: 50, anchor: "r", fx: "flicker", flickDur: 0.14, flickLow: 0 },
  { s: 28.53, e: 30.10, text: " and found", role: "serif", size: 6.6, x: 40, y: 50, anchor: "l" },

  /* ---------- "all the pieces" types ---------- */
  { s: 30.43, e: 31.70, text: "all the pieces", role: "serif", size: 7.2, y: 51, fx: "type", typeDur: 0.9 },
  { s: 31.70, e: 32.30, text: "that", role: "serifIt", size: 8, y: 50 },
  { s: 32.00, e: 32.30, text: "that we", role: "serifIt", size: 7, y: 50 },
  { s: 33.63, e: 33.93, text: "talked", role: "serif", size: 7.6, x: 20, y: 50 },
  { s: 33.93, e: 34.23, text: "talked", role: "serif", size: 7.6, x: 80, y: 50 },
  { s: 34.23, e: 34.70, text: "about", role: "serif", size: 6.8, y: 50 },

  /* ---------- "but didn't complete" · "wish me well" ---------- */
  { s: 35.90, e: 36.20, text: "but", role: "serifIt", size: 9, y: 50 },
  { s: 36.20, e: 37.64, text: "but didn't complete", role: "serifIt", size: 6.2, y: 51, fx: "type", typeDur: 0.9 },
  { s: 38.87, e: 39.27, text: "wish", role: "serifIt", size: 8, y: 50 },
  { s: 39.27, e: 39.47, text: "me", role: "serif", size: 9, y: 50 },
  { s: 39.47, e: 40.14, text: "well", role: "sans", size: 8, y: 50, weight: 700 },

  /* ---------- "cause i still can't see nothing else but my defeat" ---------- */
  { s: 41.04, e: 41.34, text: "cause", role: "serif", size: 6.8, y: 51 },
  { s: 41.34, e: 41.64, text: "cause i", role: "serif", size: 6.8, y: 51 },
  { s: 41.64, e: 41.94, text: "cause i still", role: "serif", size: 6.8, y: 51 },
  { s: 41.94, e: 43.94, text: "can't see", role: "serifIt", size: 7, y: 51 },
  { s: 43.94, e: 46.55, film: B, vStart: 0, enter: "fade", exit: "fade", dur: 0.3, alt: "still" },
  { s: 46.55, e: 48.05, film: B, vStart: 2.9, enter: "fade", exit: "fade", dur: 0.3 },
  { s: 49.12, e: 51.72, film: B, vStart: 6.9, enter: "fade", exit: "fade", dur: 0.3 },
  { s: 51.72, e: 53.92, text: "nothing else", role: "sans", size: 6.4, y: 55, fx: "type", typeDur: 1.1 },
  { s: 53.99, e: 54.49, text: "but my defeat", role: "sans", size: 5.8, y: 52, weight: 700 },

  /* ---------- NOTHING ELSE · NOT EVEN ME ---------- */
  { s: 56.59, e: 56.99, text: "NOTHING ELSE", role: "sans", size: 6.4, y: 52, fx: "type", typeDur: 0.35, weight: 600 },
  { s: 56.99, e: 59.43, text: "NOT EVEN ME", role: "didoneIt", size: 6.4, y: 51, fx: "type", typeDur: 1.4 },
  { s: 59.43, e: 60.26, text: "i can't see", role: "serifIt", size: 6, y: 51 },

  /* ---------- "i can't breathe" — types, then can never finish ---------- */
  { s: 56.59, e: 60.16, text: "", opacity: 0 },   /* (placeholder kept for element parity) */
  { s: 61.86, e: 62.53, text: "memories", role: "serif", size: 6.8, y: 51 },
  { s: 62.53, e: 63.06, text: "memories", role: "serif", size: 6.8, y: 51, fx: "sink" },
  { s: 61.86, e: 62.53, text: "memories", role: "serif", size: 6.8, y: 51, opacity: 0.45, driftX: 3 },
  { s: 64.20, e: 66.00, text: "become", role: "sans", size: 6, y: 52, weight: 800, style: "italic", fx: "type", typeDur: 0.8 },
  { s: 67.10, e: 68.03, text: "debris", role: "serif", size: 7.6, y: 51 },
  { s: 68.03, e: 68.50, text: "debris", role: "serif", size: 7.6, y: 51, fx: "sink" },

  /* ---------- so are we ENEMIES? (erases to E) ---------- */
  { s: 64.20, e: 66.00, text: "so", role: "serif", size: 9, y: 40, weight: 700, opacity: 0 }, /* parity */
  { s: 69.50, e: 69.80, text: "SO", role: "serif", size: 9, y: 50, weight: 700 },
  { s: 69.80, e: 70.27, text: "ARE", role: "serifIt", size: 8, y: 50, weight: 700 },
  { s: 70.27, e: 71.07, text: "WE", role: "didone", size: 9, y: 50 },
  { s: 67.10, e: 68.03, text: "enemies?", role: "didone", size: 6.4, y: 62, opacity: 0 }, /* parity */
  { s: 68.03, e: 69.50, text: "ENEMIES", role: "didone", size: 8, y: 40, fx: "erase" },
  { s: 68.03, e: 69.50, text: "enemies?", role: "didoneIt", size: 5, x: 66, y: 60 },

  /* ---------- will you still remember me? (slides off, "?" stays) ---------- */
  { s: 72.04, e: 73.17, text: "WILL YOU", role: "serif", size: 6, y: 51, track: 0.1 },
  { s: 72.04, e: 73.17, text: "WILL YOU STILL", role: "serif", size: 6, y: 51, track: 0.1, opacity: 0 }, /* parity */
  { s: 73.17, e: 73.51, text: "remember me?", role: "serifIt", size: 6.4, y: 51, fx: "slide" },
  { s: 73.51, e: 73.57, text: "?", role: "serif", size: 14, x: 55, y: 51 },

  /* ---------- FILM B — the face / the burning flower ---------- */
  { s: 73.574, e: 83.984, film: B, vStart: 0, enter: "fade", exit: "fade", dur: 0.4 },

  /* ---------- "falling down" (a long marquee/repeat) ---------- */
  { s: 85.35, e: 85.45, text: "falling", role: "serifIt", size: 6.4, y: 51 },
  { s: 85.45, e: 86.62, text: "falling down", role: "serifIt", size: 6.4, y: 51 },
  { s: 85.45, e: 86.62, text: "falling down", role: "serifIt", size: 6.4, y: 51, opacity: 0.4, driftY: 40, fx: "fall" },

  /* ---------- "down to my feet" — extreme close-up, then crawls + recedes ---------- */
  { s: 87.95, e: 88.02, text: "feet", role: "serifIt", fit: 0.95, fitH: 0.7, y: 50 },
  { s: 88.02, e: 89.72, text: "down to my feet", role: "serifIt", size: 6.4, y: 51, x: 62, driftX: -26, grow: [1.35, 0.85], easing: "out" },

  /* ---------- now i'm drowning · fall in into the sea ---------- */
  { s: 90.36, e: 92.26, text: "NOW I'M DROWNING", role: "sans", size: 4.6, y: 50, weight: 700, track: 0.06 },
  { s: 92.26, e: 92.96, text: "fall", role: "serifIt", size: 12, y: 46, driftY: 6 },
  { s: 92.96, e: 93.29, text: "in", role: "didoneIt", size: 15, y: 50, driftY: 8 },
  { s: 93.29, e: 93.63, text: "into", role: "serifIt", size: 10, y: 52, driftY: 10 },
  { s: 93.63, e: 93.96, text: "the", role: "serifIt", size: 11, y: 54, driftY: 12 },
  { s: 93.96, e: 94.29, text: "sea", role: "serif", size: 11, y: 56, fx: "sink" },

  /* ---------- NO MORE PROSPECTS (recedes to a dot) ---------- */
  { s: 95.60, e: 95.90, text: "NO", role: "sans", size: 12, y: 50, weight: 800 },
  { s: 95.90, e: 96.53, text: "MORE", role: "sans", size: 9, y: 50, weight: 800 },
  { s: 96.53, e: 96.86, text: "PROSPECTS", role: "serifIt", size: 6, y: 50, track: 0.05 },
  /* (96.86–98.17: the XP "send to Recycle Bin?" dialog is live — handled by the engine) */
  { s: 96.86, e: 98.17, text: "PROSPECTS", role: "serifIt", size: 6, y: 62, opacity: 0.5 },
  { s: 98.17, e: 98.43, text: "NO", role: "sans", size: 12, y: 50, weight: 800 },
  { s: 98.43, e: 99.07, text: "MORE", role: "sans", size: 9, y: 50, weight: 800 },
  { s: 99.07, e: 100.27, text: "PROSPECTS", role: "sans", size: 6.6, y: 50, weight: 800, track: 0.04, grow: [1, 0.12], easing: "in" },

  /* ---------- "only objects" — the morphing shape (square → circle) ---------- */
  { s: 100.73, e: 103.00, text: "only objects", role: "serif", size: 4.4, y: 50, shape: [8, 50], shapeW: 30 },

  /* ---------- reminding me ---------- */
  { s: 103.00, e: 108.54, text: "reminding me", role: "serifIt", size: 5, y: 50, enter: "fade", dur: 0.3 },

  /* ---------- NOTHING ELSE · but my defeat.... (letters decay) ---------- */
  { s: 108.54, e: 109.38, text: "NOTHING ELSE", role: "sans", size: 6, y: 50, weight: 700 },
  { s: 109.38, e: 110.38, text: "but my defeat....", role: "sans", size: 5.6, y: 50, fx: "decay", decayTo: 4, seed: 3 },
  { s: 110.38, e: 111.11, text: "....", role: "sans", size: 5.6, y: 50 },
  { s: 111.11, e: 113.71, text: "NOTHING ELSE", role: "sans", size: 6.4, y: 50, weight: 800 },
  { s: 113.71, e: 114.05, text: "NOT", role: "didoneIt", size: 8, y: 50 },
  { s: 114.05, e: 115.92, text: "NOT EVEN ME", role: "didoneIt", size: 6.2, y: 51, fx: "type", typeDur: 1.1 },
  { s: 115.92, e: 117.18, text: "can't see", role: "serifIt", size: 6, y: 51, opacity: 0 }, /* parity — overlaps the I CAN'T loop */

  /* ---------- "I CAN'T BREATHE" — types, then can never finish (reprise, caps) ---------- */
  { s: 115.92, e: 121.39, text: "I CAN'T BREATHE", role: "serifIt", size: 7, y: 50, fx: "typeloop", cps: 12, loopTo: 8 },

  /* ---------- memories become DEBRIS (sinks) ---------- */
  { s: 121.39, e: 122.12, text: "MEMORIES", role: "didone", size: 6.4, y: 51 },
  { s: 121.49, e: 122.22, text: "MEMORIES", role: "didone", size: 6.4, y: 51, opacity: 0.4, driftX: 3 },
  { s: 122.12, e: 123.76, text: "BECOME", role: "sans", size: 6, y: 51, weight: 800 },
  { s: 123.76, e: 124.49, text: "DEBRIS", role: "sans", size: 8, y: 50, weight: 800 },
  { s: 124.49, e: 125.12, text: "DEBRIS", role: "sans", size: 8, y: 50, weight: 800, fx: "sink" },

  /* ---------- SO ARE WE ENEMIES? (erases) ---------- */
  { s: 126.16, e: 126.56, text: "SO", role: "serif", size: 9, y: 50, weight: 700 },
  { s: 126.56, e: 127.26, text: "ARE", role: "serifIt", size: 8, y: 50, weight: 700 },
  { s: 127.26, e: 127.96, text: "WE", role: "serif", size: 8, y: 50, weight: 700, track: 0.3 },
  { s: 129.06, e: 130.46, text: "ENEMIES?", role: "didone", size: 7.6, y: 50, fx: "erase" },
  { s: 131.37, e: 131.76, text: "WILL", role: "serif", size: 8, y: 50, weight: 700 },
  { s: 131.76, e: 132.26, text: "YOU", role: "serif", size: 8, y: 50, weight: 700 },
  { s: 132.26, e: 133.10, text: "STILL", role: "serif", size: 7, y: 50, weight: 700 },

  /* ---------- remember me? collage begins (accumulating) ---------- */
  { s: 134.00, e: 135.67, text: "REMEMBER?", role: "didoneIt", fit: 0.9, fitH: 0.7, y: 50, fx: "slide" },
  { s: 134.00, e: 135.67, text: "remember?", role: "serifIt", size: 4.4, x: 78, y: 22, rot: -4 },
  { s: 134.00, e: 135.67, text: "remember?", role: "serifIt", size: 4.4, x: 80, y: 30, rot: 3 },

  /* ---------- remember me — types up, then the big collage ---------- */
  { s: 137.00, e: 138.34, text: "re", role: "serifIt", size: 12, y: 50 },
  { s: 138.34, e: 139.37, text: "remem", role: "serif", size: 8, y: 50, weight: 500 },
  { s: 139.37, e: 140.77, text: "remember", role: "serif", size: 7, y: 50, weight: 500 },
  { s: 140.77, e: 141.34, text: "remember me", role: "serifIt", size: 6, y: 50 },

  /* the collage — copies accumulate at scattered spots, "(breathe)" in the corners */
  { s: 141.34, e: 166.30, text: "remember me", role: "serifIt", size: 3.6, x: 22, y: 30, enter: "fade", dur: 0.3 },
  { s: 142.91, e: 166.30, text: "(breathe)", role: "sans", size: 2.2, x: 60, y: 12, color: "#8a8a8a", enter: "fade", dur: 0.4 },
  { s: 144.31, e: 166.30, text: "remember me", role: "serifIt", size: 3.4, x: 82, y: 78, align: "right", anchor: "r", enter: "fade", dur: 0.3 },
  { s: 147.15, e: 166.30, text: "remember me", role: "serifIt", size: 3.2, x: 20, y: 82, enter: "fade", dur: 0.3 },
  { s: 148.55, e: 166.30, text: "remember me", role: "serifIt", size: 3.2, x: 70, y: 26, enter: "fade", dur: 0.4 },
  { s: 152.42, e: 166.30, text: "remember", role: "serifIt", size: 3.0, x: 78, y: 46, color: "#3a3a3a", enter: "fade", dur: 0.4 },
  { s: 153.55, e: 166.30, text: "(breathe)", role: "sans", size: 2.2, x: 84, y: 12, color: "#8a8a8a", enter: "fade", dur: 0.4 },
  { s: 154.96, e: 166.30, text: "are we", role: "serifIt", size: 3.2, x: 58, y: 54, enter: "fade", dur: 0.4 },
  { s: 156.42, e: 166.30, text: "remember me", role: "serifIt", size: 3.4, x: 84, y: 62, align: "right", anchor: "r", enter: "fade", dur: 0.4 },
  { s: 157.62, e: 166.30, text: "enemies?", role: "serifIt", size: 3.0, x: 22, y: 58, enter: "fade", dur: 0.4 },
  { s: 158.82, e: 166.30, text: "RE", role: "didoneIt", size: 5, x: 44, y: 44, enter: "fade", dur: 0.4 },
  { s: 160.19, e: 166.30, text: "REMEM", role: "didoneIt", fit: 0.5, fitH: 0.28, x: 46, y: 46, enter: "fade", dur: 0.4 },
  { s: 161.43, e: 166.30, text: "REMEMBER", role: "didoneIt", fit: 0.8, fitH: 0.3, x: 48, y: 46, enter: "fade", dur: 0.4 },
  /* the huge one that zooms through the camera into black */
  { s: 163.00, e: 166.43, text: "REMEMBER ME", role: "didoneIt", fit: 0.94, fitH: 0.34, y: 48, grow: [1, 2.6], easing: "in", exit: "fade", dur: 0.5 },
  { s: 141.34, e: 166.30, text: "(breath)", role: "sans", size: 2.2, x: 18, y: 88, color: "#8a8a8a", enter: "fade", dur: 0.6 },

  /* ============ THE BLACK ACT (white type on black) ============ */
  { s: 172.67, e: 173.94, text: "i can't see", role: "serifIt", size: 6, y: 50, color: "#f2f2f2" },
  { s: 175.31, e: 176.44, text: "i can't breathe", role: "serifIt", size: 6, y: 50, color: "#f2f2f2" },
  { s: 177.81, e: 179.31, text: "i can't see", role: "serifIt", size: 6, y: 50, color: "#f2f2f2" },
  { s: 180.78, e: 181.91, text: "can't breathe", role: "serifIt", size: 6, y: 50, color: "#f2f2f2" },
  { s: 183.38, e: 185.22, text: "nothing else", role: "sans", size: 5.6, y: 50, color: "#f2f2f2" },
  { s: 185.89, e: 186.15, text: "but", role: "sans", size: 9, y: 50, weight: 800, color: "#fff" },
  { s: 186.15, e: 186.49, text: "my", role: "sans", size: 11, y: 50, weight: 800, color: "#fff" },
  { s: 186.49, e: 187.85, text: "defeat", role: "sans", size: 8, y: 50, weight: 800, color: "#fff" },
  { s: 188.46, e: 190.42, text: "nothing else", role: "sans", size: 5.4, y: 50, color: "#cfcfcf" },
  { s: 191.06, e: 197.00, text: "notevenme", role: "sans", size: 3.4, y: 53, color: "#6f6f6f", enter: "fade", dur: 1.2 },
];

/* background keyframes: white until the final act, then black */
const BG = [[0.0, "#ffffff"], [166.566, "#000000"]];

/* beat grid extracted from the master audio (~92.3 BPM) — available to drive effects */
const BEATS = [3.738,4.389,5.039,5.689,6.339,6.989,7.616,8.266,8.916,9.567,10.194,10.844,11.494,12.144,12.794,13.421,14.071,14.721,15.372,15.999,16.649,17.299,17.949,18.599,19.319,20.039,20.759,21.478,22.129,22.756,23.382,24.056,24.706,25.333,25.983,26.610,27.260,27.910,28.584,29.211,29.861,30.488,31.092,31.672,32.369,33.065,33.669,34.342,35.016,35.643,36.270,36.943,37.593,38.243,38.893,39.520,40.194,40.821,41.494,42.075,42.748,43.398,44.071,44.698,45.349,45.976,46.626,47.253,47.926,48.553,49.226,49.853,50.503,51.130,51.804,52.431,53.081,53.708,54.311,54.892,55.658,56.285,56.842,57.585,58.259,58.886,59.536,60.186,60.836,61.463,62.090,62.764,63.414,64.041,64.784,65.341,65.991,66.618,67.245,67.872,68.499,69.103,69.776,70.496,71.146,71.773,72.330,72.957,73.561,74.141,74.745,75.372,76.022,76.649,77.299,77.949,78.600,79.250,79.877,80.527,81.177,81.827,82.524,83.244,83.963,84.683,85.357,85.983,86.610,87.261,87.818,88.538,89.211,89.861,90.535,91.417,92.067,92.694,93.321,93.994,94.668,95.341,96.015,96.595,97.245,97.895,98.569,99.149,99.846,100.496,101.169,101.796,102.400,102.934,103.538,104.118,104.699,105.326,105.999,106.626,107.276,107.926,108.530,109.180,109.830,110.504,111.131,111.781,112.431,113.081,113.755,114.358,115.008,115.659,116.239,116.936,117.609,118.236,118.817,119.513,120.186,120.813,121.487,122.114,122.764,123.391,123.925,124.668,125.318,125.968,126.642,127.269,127.896,128.546,129.126,129.753,130.450,131.123,131.773,132.423,133.074,133.724,134.374,135.001,135.697,136.394,137.091,137.741,138.414,139.064,139.714,140.388,141.038,141.711,142.385,143.058,143.732,144.382,145.032,145.682,146.309,146.959,147.609,148.259,148.910,149.560,150.210,150.860,151.487,152.137,152.811,153.461,154.111,154.738,155.388,156.015,156.642,157.292,157.942,158.592,159.242,159.893,160.520,161.170,161.820,162.470,163.120,163.747,164.397,165.047,165.698,166.348,166.998,167.671,168.345,169.041,169.715,170.411,171.085,171.781,172.431,172.989,173.708,174.382,175.009,175.589,176.309,176.959,177.586,178.120,178.770,179.537,180.164,180.767,181.464,182.114,182.764,183.414,184.041,184.692,185.342,185.922,186.572,187.246,187.919,188.546,189.196,189.846,190.497,191.147,191.774];
