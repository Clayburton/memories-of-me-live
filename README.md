# memories of me — live lyric video

A frame-accurate, DOM-rendered recreation of the "memories of me" lyric video
(clay and kelsy), synced live to the song. No emojis — this one is kinetic
typography + two vertical film passages (a candle being lit; a face in
candlelight), on white, hard-cutting to black on white type for the final act.

**The interaction:** during the "PROSPECTS" line an authentic Windows XP
"send ‘CLAYANDKELSY.exe’ to the Recycle Bin?" dialog appears and its buttons
are live. **No** does nothing (it deletes anyway). **Yes** drops into a fake
DOS terminal that deletes the discography one file at a time, hangs on
`memories-of-me.wav` ("file is currently playing — force delete?"), then
deletes `kelsy`, `clay`, and finally `us` — which errors ("in memory") before
it goes through — then dissolves into the black ending.

## Effects (all computed live from each cue's local time — no lag)
typewriter · type-loop that can never finish ("i can't breathe") · letter-decay
("but my defeat….") · word-erase ("ENEMIES" → "E") · ghost doubles · physics
fall / sink / slide ("debris" sinks, "remember me?" slides off leaving the "?")
· camera zoom · morphing shape ("only objects").

## Files
- `index.html` — stage / cue / video / dialog / terminal layers, landing, end card. Bump `?v=N` after every edit.
- `styles.css` — type roles, film panels, the XP dialog, the CRT terminal.
- `app.js` — engine: audio clock → `renderAt(t)`, crisp fit-to-px sizing, the effect handlers, the dialog + terminal controllers, preload gate. `window.__mom.freeze(t)` / `__mom.fireDialog()` debug.
- `cues.js` — the frame-exact timeline + `BG` (white→black) + `BEATS`.
- `assets/` — `memories-of-me.mp3`, `film-a.mp4` (candle), `film-b.mp4` (face).
- `tools/timemap.txt` — every source element mapped to its cue (audit: 372/372 text elements covered).

Preview: launch config `memories-of-me-live`, port 8848.
Embed on WordPress with `wordpress-embed.html` (full-bleed iframe + iOS chrome sync).
