/* ============================================================
   memories of me — cue sheet (the timeline) · v3
   Rebuilt against the per-frame element table + direct frame
   reads of the 4K master. HARD CUTS only (DaVinci pops) — no
   fades. The doubled-text moments are TIGHT static double-strikes
   (the same word popped as two near-identical copies, sometimes
   one a light-gray ghost), exactly as in the master — not drifting
   or fading. Continuous motions (falling line, typing, erase,
   decay, the final zoom) are generated live from cue-local time.

   White stage 0→166.566s, then a hard cut to BLACK.
   `size` = vh. `fit` = fraction of stage width. `dbl` = skip auto-calib.
   ============================================================ */

const A = "assets/film-a.mp4";   // the candle being lit
const B = "assets/film-b.mp4";   // the face in candlelight / burning flower

const CUES = [
  /* ---------- title ---------- */
  { s: 0.00, e: 0.83, text: "memories of me", role: "serifIt", size: 7.4, y: 49, weight: 500 },
  { s: 0.00, e: 0.83, text: "clay and kelsy", role: "sans",   size: 3.2, y: 56.5 },
  { s: 0.83, e: 1.33, text: "made by clay",   role: "sans",   size: 3.3, y: 52.3 },

  /* ---------- FILM A — the candle (vertical panel, hard pop) ---------- */
  { s: 1.334, e: 23.323, film: A, vStart: 0 },

  /* ---------- "all / around all around" (stacking pops) ---------- */
  { s: 23.32, e: 24.93, text: "all", role: "serif", size: 8.2, y: 50, dbl: true },
  { s: 23.79, e: 24.93, text: "around", role: "serif", size: 6.6, y: 40, dbl: true },
  { s: 23.96, e: 24.93, text: "around", role: "serif", size: 6.6, y: 60, dbl: true },
  { s: 24.12, e: 24.93, text: "around", role: "serif", size: 6.6, x: 30, y: 50, dbl: true },
  { s: 24.29, e: 24.93, text: "around", role: "serif", size: 6.6, x: 70, y: 50, dbl: true },

  /* ---------- memories of me — tight double-strike (both black, offset a hair) ---------- */
  { s: 25.89, e: 27.23, text: "memories of me", role: "serifIt", size: 6.4, x: 50, y: 50, dbl: true },
  { s: 26.16, e: 27.23, text: "memories of me", role: "serifIt", size: 6.4, x: 49.2, y: 53, dbl: true },

  /* ---------- "lost and found" — "lost" flickers off/on ---------- */
  { s: 28.53, e: 29.80, text: "lost", role: "serif", size: 5.4, x: 40.5, y: 50.5, anchor: "r", fx: "flicker", flickDur: 0.15, flickLow: 0, dbl: true },
  { s: 28.53, e: 29.80, text: " and found", role: "serif", size: 5.4, x: 40.5, y: 50.5, anchor: "l", dbl: true },

  /* ---------- "all the pieces / that we / talked / about" ---------- */
  { s: 30.43, e: 31.70, text: "all the pieces", role: "serif", size: 5.6, y: 50.7, fx: "type", typeDur: 0.95, noCaret: true },
  { s: 31.70, e: 32.00, text: "that", role: "serifIt", size: 6.4, y: 50 },
  { s: 32.00, e: 32.30, text: "that we", role: "serifIt", size: 6.4, y: 50 },
  { s: 33.63, e: 33.93, text: "talked", role: "serif", size: 6.4, x: 16.9, y: 50 },
  { s: 33.93, e: 34.23, text: "talked", role: "serif", size: 6.4, x: 83.1, y: 50 },
  { s: 34.23, e: 34.70, text: "about", role: "serif", size: 5.6, y: 50.5 },

  /* ---------- "but didn't complete / wish me well" ---------- */
  { s: 35.90, e: 36.20, text: "but", role: "serifIt", size: 5.6, y: 50.5 },
  { s: 36.20, e: 36.84, text: "but didn't", role: "serifIt", size: 5.6, y: 50.5 },
  { s: 36.84, e: 37.64, text: "but didn't complete", role: "serifIt", size: 5.6, y: 51.9 },
  { s: 38.87, e: 39.27, text: "wish", role: "serifIt", size: 6.4, y: 50 },
  { s: 39.27, e: 39.47, text: "me", role: "serif", size: 5.4, y: 51.4 },
  { s: 39.47, e: 40.14, text: "well", role: "serif", size: 6.2, y: 50.5, weight: 700 },

  /* ---------- "cause i still can't see…" ---------- */
  { s: 41.04, e: 41.34, text: "cause", role: "serif", size: 5.6, y: 50.9 },
  { s: 41.34, e: 41.64, text: "cause i", role: "serif", size: 5.6, y: 50 },
  { s: 41.64, e: 41.94, text: "cause i still", role: "serif", size: 5.6, y: 49.5 },
  { s: 41.94, e: 42.61, text: "can't see", role: "serifIt", size: 3.2, y: 52.8 },

  /* ---------- nothing else / but my defeat (bottom-right) ---------- */
  { s: 43.94, e: 46.55, text: "nothing else", role: "sans", fit: 0.95, fitH: 0.32, y: 52.8 },
  { s: 46.55, e: 48.05, text: "but my defeat", role: "sans", size: 7.4, x: 69.3, y: 93.1, weight: 700 },
  { s: 49.12, e: 51.72, text: "NOTHING ELSE", role: "sans", fit: 0.94, fitH: 0.2, y: 53.2 },
  { s: 51.72, e: 52.05, text: "NOT",          role: "serifIt", size: 2.9, y: 55.6, track: 0.08 },
  { s: 52.05, e: 52.39, text: "NOT EV",       role: "serifIt", size: 2.9, y: 55.6, track: 0.08 },
  { s: 52.39, e: 52.69, text: "NOT EVEN",     role: "serifIt", size: 2.9, y: 55.6, track: 0.08 },
  { s: 52.69, e: 53.92, text: "NOT EVEN ME",  role: "serifIt", size: 2.9, y: 55.6, track: 0.08 },
  { s: 53.99, e: 54.49, text: "i can't see", role: "serifIt", size: 6.8, y: 51.9 },

  /* ---------- "i can't breathe" — types, then can never finish ---------- */
  { s: 56.59, e: 58.33, text: "i can't breathe", role: "serifIt", size: 7.2, y: 51.2, fx: "typeloop", cps: 16, loopTo: 12 },

  /* ---------- memories — black word + light-gray ghost above ---------- */
  { s: 59.43, e: 60.26, text: "memories", role: "serif", size: 6.6, x: 50, y: 52, dbl: true },
  { s: 59.43, e: 60.26, text: "memories", role: "serif", size: 6.6, x: 49, y: 48.5, color: "#c4c4c4", dbl: true },

  /* ---------- become / debris (sinks below the frame) ---------- */
  { s: 61.86, e: 62.53, text: "become", role: "sans", size: 6.6, y: 51.9, weight: 800, style: "italic" },
  { s: 62.53, e: 63.06, text: "debris", role: "serif", size: 6.6, y: 91, fx: "sink" },

  /* ---------- SO ARE WE — WE is a tight double-strike; then ENEMIES? erases ---------- */
  { s: 64.20, e: 64.60, text: "SO",  role: "serif", size: 6.0, y: 52.8 },
  { s: 64.60, e: 65.30, text: "ARE", role: "serifIt", size: 6.0, y: 52.8 },
  { s: 65.30, e: 66.00, text: "WE",  role: "serif", size: 7.0, x: 50, y: 52.3, dbl: true },
  { s: 65.30, e: 66.00, text: "WE",  role: "serif", size: 7.0, x: 51, y: 52.3, dbl: true },
  { s: 67.10, e: 68.03, text: "ENEMIES?", role: "serif", size: 7.0, y: 51.9, weight: 700 },
  { s: 68.03, e: 68.50, text: "ENEMIES",  role: "serif", size: 7.0, y: 52.8, weight: 700, fx: "erase" },

  /* ---------- will you still remember me? (tail pops rightward) ---------- */
  { s: 69.50, e: 69.80, text: "WILL", role: "serif", size: 6.0, y: 52.8 },
  { s: 69.80, e: 70.27, text: "WILL YOU", role: "serif", size: 6.0, y: 52.8 },
  { s: 70.27, e: 71.07, text: "WILL YOU STILL", role: "serif", size: 6.0, y: 52.8 },
  { s: 72.04, e: 73.17, text: "'EMBER ME?", role: "serifIt", size: 6.6, y: 51.9 },
  { s: 73.21, e: 73.34, text: "ME?", role: "serifIt", size: 6.6, x: 67, y: 51.9 },
  { s: 73.34, e: 73.41, text: "'E?", role: "serifIt", size: 6.6, x: 69, y: 51.9 },
  { s: 73.41, e: 73.47, text: "E?", role: "serifIt", size: 6.6, x: 70, y: 51.9 },
  { s: 73.51, e: 73.57, text: "?", role: "serifIt", size: 8, x: 72, y: 51.9 },

  /* ---------- FILM B — the face / the burning flower (hard pop) ---------- */
  { s: 73.574, e: 83.984, film: B, vStart: 0 },

  /* ---------- "falling down" (the one true continuous motion) ---------- */
  { s: 85.35, e: 86.62, text: "falling down", role: "serifIt", size: 6.2, y: -6, fx: "fallLine" },

  /* ---------- "down to my feet" (bottom line: reveal → crawl → gone) ---------- */
  { s: 87.95, e: 88.52, text: "down to my feet", role: "serifIt", size: 6.0, x: 60, y: 92.8, fx: "type", typeDur: 0.5, noCaret: true, reverseType: true, dbl: true },
  { s: 88.52, e: 89.52, text: "down to my feet", role: "serifIt", size: 6.0, x: 40, y: 92.8, driftX: -34, dbl: true },
  { s: 88.52, e: 89.52, text: "down to my feet", role: "serifIt", size: 6.0, x: 104, y: 92.8, driftX: -34, dbl: true },
  { s: 89.52, e: 89.72, text: "down to", role: "serifIt", fit: 0.9, fitH: 0.5, y: 60 },

  /* ---------- now i'm drowning / fall in into the sea ---------- */
  { s: 90.36, e: 92.26, text: "NOW I'M DROWNING", role: "serif", fit: 0.84, fitH: 0.14, y: 50, track: 0.14 },
  { s: 92.63, e: 92.96, text: "fall", role: "serifIt", size: 9, y: 50 },
  { s: 92.96, e: 93.29, text: "in",   role: "serifIt", size: 13, y: 58 },
  { s: 93.29, e: 93.63, text: "into", role: "serifIt", size: 9, y: 68 },
  { s: 93.63, e: 93.96, text: "the",  role: "serifIt", size: 10, y: 85 },
  { s: 93.96, e: 94.29, text: "sea",  role: "serifIt", size: 9, y: 96 },

  /* ---------- NO MORE PROJECTS (+ the dialog) / NO MORE / PROSPECTS ---------- */
  { s: 95.60, e: 95.90, text: "NO",   role: "sans", size: 8.4, y: 51, weight: 300 },
  { s: 95.90, e: 96.53, text: "MORE", role: "sans", size: 8.4, y: 51, weight: 300 },
  { s: 96.53, e: 98.17, text: "PROJECTS", role: "sans", size: 7.6, y: 52, weight: 300, style: "italic" },
  /* (96.86–98.17: the classic-Mac "Confirm File Delete" dialog is live — engine-driven) */
  { s: 98.17, e: 98.43, text: "NO",   role: "sans", size: 9.4, y: 51, weight: 800 },
  { s: 98.43, e: 99.07, text: "MORE", role: "sans", size: 9.4, y: 51, weight: 800 },
  { s: 99.07, e: 100.27, text: "PROSPECTS", role: "sans", size: 8.6, y: 52.5, weight: 800, style: "italic", grow: [1, 0.07], easing: "in" },

  /* ---------- "only objects" — the big morphing shape (square → circle), text centered ---------- */
  { s: 100.73, e: 103.04, text: "only objects", role: "serif", size: 5.4, y: 44, shape: [11, 50], shapeW: 62 },

  /* ---------- reminding me (top) ---------- */
  { s: 103.00, e: 104.24, text: "reminding me", role: "serifIt", size: 5.2, x: 74, y: 14 },
  { s: 104.24, e: 105.14, text: "reminding me", role: "serifIt", size: 5.2, x: 22, y: 26 },

  /* ---------- NOTHING ELSE (right, then a full-width double-strike) ---------- */
  { s: 105.94, e: 106.24, text: "NOTHING ELSE", role: "sans", fit: 0.5, fitH: 0.18, x: 74, y: 40, weight: 800 },
  { s: 106.24, e: 108.54, text: "NOTHING ELSE", role: "sans", fit: 0.5, fitH: 0.2, x: 26, y: 52, weight: 800, dbl: true },
  { s: 106.24, e: 108.54, text: "NOTHING ELSE", role: "sans", fit: 0.5, fitH: 0.2, x: 74, y: 52, weight: 800, dbl: true },

  /* ---------- but my defeat…. decays at the bottom-right ---------- */
  { s: 108.00, e: 111.11, text: "but my defeat....", role: "sans", size: 5.4, x: 78, y: 93, weight: 500, fx: "decay", decayTo: 4, seed: 7 },

  /* ---------- NOTHING ELSE / NOT EVEN ME ---------- */
  { s: 111.11, e: 113.71, text: "NOTHING ELSE", role: "sans", fit: 0.92, fitH: 0.26, y: 51.9, weight: 800, style: "italic" },
  { s: 113.71, e: 114.05, text: "NOT",         role: "serifIt", size: 6.4, y: 51.4, track: 0.06 },
  { s: 114.05, e: 114.38, text: "NOT EV",      role: "serifIt", size: 6.4, y: 51.4, track: 0.06 },
  { s: 114.38, e: 114.68, text: "NOT EVEN",    role: "serifIt", size: 6.4, y: 51.4, track: 0.06 },
  { s: 114.68, e: 115.92, text: "NOT EVEN ME", role: "serifIt", size: 6.4, y: 51.4, track: 0.06 },
  { s: 115.92, e: 117.18, text: "can't see", role: "serifIt", size: 1.5, x: 51, y: 55.6, color: "#9a9a9a" },

  /* ---------- I CAN'T BREATHE (caps reprise — can never finish) ---------- */
  { s: 118.48, e: 121.39, text: "I CAN'T BREATHE", role: "serifIt", size: 8.2, y: 49, fx: "typeloop", cps: 15, loopTo: 12 },

  /* ---------- MEMORIES — black + light-gray ghost up-right; BECOME; DEBRIS sinks ---------- */
  { s: 121.39, e: 122.22, text: "MEMORIES", role: "serif", size: 7.0, x: 50, y: 50, track: 0.06, dbl: true },
  { s: 121.49, e: 122.22, text: "MEMORIES", role: "serif", size: 7.0, x: 53, y: 46, track: 0.06, color: "#c6c6c6", dbl: true },
  { s: 123.76, e: 124.49, text: "BECOME", role: "sans", size: 9.5, y: 51.9, weight: 300 },
  { s: 124.49, e: 125.12, text: "DEBRIS", role: "sans", size: 8.0, y: 92, weight: 300, fx: "sink" },

  /* ---------- SO ARE / WE WE (spread wide) / ENEMIES? erases ---------- */
  { s: 126.16, e: 126.56, text: "SO",  role: "serif", size: 8.4, y: 50 },
  { s: 126.56, e: 127.26, text: "ARE", role: "serifIt", size: 8.4, y: 50 },
  { s: 127.26, e: 127.96, text: "WE", role: "serif", size: 8.0, x: 30, y: 50.5, dbl: true },
  { s: 127.26, e: 127.96, text: "WE", role: "serif", size: 8.0, x: 70, y: 50.5, dbl: true },
  { s: 129.06, e: 130.00, text: "ENEMIES?", role: "serif", size: 9.4, y: 50, weight: 700 },
  { s: 130.00, e: 130.46, text: "ENEMIES", role: "serif", size: 8.0, y: 50.9, weight: 700, fx: "erase" },
  { s: 131.37, e: 131.76, text: "WILL",  role: "serif", size: 7.0, y: 50.9 },
  { s: 131.76, e: 132.26, text: "YOU",   role: "serif", size: 8.4, y: 51.9 },
  { s: 132.26, e: 133.10, text: "STILL", role: "serif", size: 8.4, y: 50.9 },

  /* ---------- REMEMBER? — staggered right-aligned wall, tail pops right ---------- */
  { s: 134.00, e: 135.03, text: "MEMBER?\nREMEMBER?\nREMEMBER?", role: "serifIt", fit: 0.62, fitH: 0.68, x: 62, y: 49, align: "right", anchor: "r", lh: 1.5, weight: 700, dbl: true },
  { s: 135.20, e: 135.27, text: "R?\nBER?", role: "serifIt", fit: 0.24, fitH: 0.4, x: 84, y: 66, align: "right", anchor: "r", lh: 1.5, weight: 700, dbl: true },

  /* ---------- remember me — types up (upper-center), then the collage builds ---------- */
  { s: 137.00, e: 138.34, text: "re",          role: "serifIt", size: 5.0, x: 50, y: 22 },
  { s: 138.34, e: 139.37, text: "remem",       role: "serifIt", size: 5.0, x: 50, y: 22 },
  { s: 139.37, e: 140.77, text: "remember",    role: "serifIt", size: 5.0, x: 50, y: 22 },
  { s: 140.77, e: 141.34, text: "remember me", role: "serifIt", size: 5.0, x: 50, y: 22 },

  /* the collage (hard-cut pops matched to the source frames) --------------- */
  /* the constant: a small "remember me" holds in the upper-left the whole time */
  { s: 143.00, e: 165.60, text: "remember me", role: "serifIt", size: 3.4, x: 16, y: 40, dbl: true },
  /* a "(breathe)" drifts around the corners */
  { s: 143.00, e: 146.00, text: "(breathe)", role: "sans", size: 1.9, x: 5,  y: 50, color: "#8a8a8a", dbl: true },
  { s: 146.00, e: 152.00, text: "(breathe)", role: "sans", size: 1.9, x: 5,  y: 68, color: "#8a8a8a", dbl: true },
  { s: 152.00, e: 156.00, text: "(breathe)", role: "sans", size: 1.9, x: 82, y: 20, color: "#8a8a8a", dbl: true },
  { s: 156.00, e: 165.60, text: "(breathe)", role: "sans", size: 1.9, x: 30, y: 12, color: "#8a8a8a", dbl: true },
  /* the transient "remember me" copies, one region at a time */
  { s: 141.34, e: 143.00, text: "remember me", role: "serifIt", size: 3.6, x: 76, y: 22, dbl: true },
  { s: 144.50, e: 146.00, text: "remember me", role: "serifIt", size: 3.4, x: 48, y: 46, dbl: true },
  { s: 146.00, e: 148.00, text: "remember me", role: "serifIt", size: 3.4, x: 78, y: 46, dbl: true },
  { s: 150.00, e: 152.00, text: "re",          role: "serifIt", size: 3.2, x: 48, y: 65, dbl: true },
  { s: 152.00, e: 153.50, text: "remember",    role: "serifIt", size: 3.2, x: 55, y: 65, dbl: true },
  { s: 152.00, e: 154.00, text: "remember me", role: "serifIt", size: 3.4, x: 88, y: 46, dbl: true },
  { s: 154.00, e: 156.00, text: "remember me", role: "serifIt", size: 3.4, x: 26, y: 82, dbl: true },
  { s: 156.00, e: 158.00, text: "enemies?",    role: "serifIt", size: 3.2, x: 48, y: 45, dbl: true },
  { s: 156.00, e: 158.00, text: "remember me", role: "serifIt", size: 3.4, x: 55, y: 82, dbl: true },
  { s: 158.00, e: 165.60, text: "remember me", role: "serifIt", size: 3.4, x: 82, y: 82, dbl: true },
  /* the big Didone grows as discrete pops, lower-center, then zooms through */
  { s: 158.00, e: 160.19, text: "RE",          role: "didoneIt", fit: 0.16, fitH: 0.24, x: 82, y: 45, dbl: true },
  { s: 160.19, e: 161.43, text: "REMEM",       role: "didoneIt", fit: 0.42, fitH: 0.26, x: 30, y: 68, dbl: true },
  { s: 161.43, e: 163.00, text: "REMEMBER ME", role: "didoneIt", fit: 0.86, fitH: 0.28, x: 46, y: 68, dbl: true },
  { s: 163.00, e: 166.43, text: "REMEMBER ME", role: "didoneIt", fit: 0.92, fitH: 0.3, x: 50, y: 66, grow: [1, 2.8], easing: "in", dbl: true },

  /* ============ THE BLACK ACT (white type on black, hard pops) ============ */
  { s: 172.67, e: 173.94, text: "i can't see",     role: "serifIt", size: 6.0, y: 52.5, color: "#efefef" },
  { s: 175.31, e: 176.44, text: "i can't breathe", role: "serifIt", size: 6.0, y: 52.5, color: "#efefef" },
  { s: 177.81, e: 179.31, text: "i can't see",     role: "serifIt", size: 6.0, y: 52.5, color: "#efefef" },
  { s: 180.78, e: 181.91, text: "can't breathe",   role: "serifIt", size: 6.0, y: 52.5, color: "#efefef" },
  { s: 183.38, e: 185.22, text: "nothing else", role: "sans", size: 6.4, y: 51.5, color: "#e9e9e9", weight: 300 },
  { s: 185.89, e: 186.15, text: "but",    role: "sans", size: 8.0, y: 50, weight: 800, color: "#fff" },
  { s: 186.15, e: 186.49, text: "my",     role: "sans", size: 9.5, y: 54.6, weight: 800, color: "#fff" },
  { s: 186.49, e: 187.85, text: "defeat", role: "sans", size: 8.0, x: 22, y: 91, weight: 800, color: "#fff" },
  { s: 188.46, e: 190.42, text: "nothing else", role: "sans", size: 7.0, y: 53.7, color: "#bdbdbd", weight: 300 },
  { s: 191.06, e: 192.59, text: "notevenme", role: "sans", size: 2.6, y: 55.6, color: "#6f6f6f" },
];

/* background keyframes: white until the final act, then black (hard cut) */
const BG = [[0.0, "#ffffff"], [166.566, "#000000"]];

/* beat grid extracted from the master audio (~92.3 BPM) */
const BEATS = [3.738,4.389,5.039,5.689,6.339,6.989,7.616,8.266,8.916,9.567,10.194,10.844,11.494,12.144,12.794,13.421,14.071,14.721,15.372,15.999,16.649,17.299,17.949,18.599,19.319,20.039,20.759,21.478,22.129,22.756,23.382,24.056,24.706,25.333,25.983,26.610,27.260,27.910,28.584,29.211,29.861,30.488,31.092,31.672,32.369,33.065,33.669,34.342,35.016,35.643,36.270,36.943,37.593,38.243,38.893,39.520,40.194,40.821,41.494,42.075,42.748,43.398,44.071,44.698,45.349,45.976,46.626,47.253,47.926,48.553,49.226,49.853,50.503,51.130,51.804,52.431,53.081,53.708,54.311,54.892,55.658,56.285,56.842,57.585,58.259,58.886,59.536,60.186,60.836,61.463,62.090,62.764,63.414,64.041,64.784,65.341,65.991,66.618,67.245,67.872,68.499,69.103,69.776,70.496,71.146,71.773,72.330,72.957,73.561,74.141,74.745,75.372,76.022,76.649,77.299,77.949,78.600,79.250,79.877,80.527,81.177,81.827,82.524,83.244,83.963,84.683,85.357,85.983,86.610,87.261,87.818,88.538,89.211,89.861,90.535,91.417,92.067,92.694,93.321,93.994,94.668,95.341,96.015,96.595,97.245,97.895,98.569,99.149,99.846,100.496,101.169,101.796,102.400,102.934,103.538,104.118,104.699,105.326,105.999,106.626,107.276,107.926,108.530,109.180,109.830,110.504,111.131,111.781,112.431,113.081,113.755,114.358,115.008,115.659,116.239,116.936,117.609,118.236,118.817,119.513,120.186,120.813,121.487,122.114,122.764,123.391,123.925,124.668,125.318,125.968,126.642,127.269,127.896,128.546,129.126,129.753,130.450,131.123,131.773,132.423,133.074,133.724,134.374,135.001,135.697,136.394,137.091,137.741,138.414,139.064,139.714,140.388,141.038,141.711,142.385,143.058,143.732,144.382,145.032,145.682,146.309,146.959,147.609,148.259,148.910,149.560,150.210,150.860,151.487,152.137,152.811,153.461,154.111,154.738,155.388,156.015,156.642,157.292,157.942,158.592,159.242,159.893,160.520,161.170,161.820,162.470,163.120,163.747,164.397,165.047,165.698,166.348,166.998,167.671,168.345,169.041,169.715,170.411,171.085,171.781,172.431,172.989,173.708,174.382,175.009,175.589,176.309,176.959,177.586,178.120,178.770,179.537,180.164,180.767,181.464,182.114,182.764,183.414,184.041,184.692,185.342,185.922,186.572,187.246,187.919,188.546,189.196,189.846,190.497,191.147,191.774];
