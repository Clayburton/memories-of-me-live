# memories of me — embedded player

The album page for "memories of me" (clay and kelsy). A white, on-brand
landing (Playfair title + play arrow) → plays the actual music video with
sound. Desktop shows the 16:9 cut; a narrow / portrait viewport switches to
the vertical cut, and it swaps between them on resize without losing your
place. The phone's status bar / toolbar flip to black for the video's final
act (same trick as the other pieces).

## Files
- `index.html` — landing, the `<video>` player, end card. Bump `?v=N` after edits.
- `styles.css` — framed player (`object-fit: contain` desktop, `cover` on the vertical cut), landing, end card.
- `app.js` — picks the cut by viewport, swaps on resize preserving position + play state, flips `theme-color` at the final act, end card on ended. Debug: `window.__mom`.
- `assets/mom-desktop.mp4` — the 16:9 cut (1280×720, with audio).
- `assets/mom-mobile.mp4` — the vertical cut (720×1280, with audio).

Preview: launch config `memories-of-me-live`, port 8848.
Embed on WordPress with `wordpress-embed.html` (full-bleed iframe + iOS chrome sync).
