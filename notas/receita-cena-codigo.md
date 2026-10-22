---
name: receita-cena-codigo
description: How to recreate a viral code-made (Remotion/SVG) illustrated scene with high finish; lessons from the Paris room test
metadata:
  type: feedback
---

Learned 2026-10-22 recreating the isometric apartment from [[video-paris-dia1]] (Lucas approved the approach, liked v2).
- Finish comes from render→look→fix rounds, not from a bigger effort level or another tool. v1 (1 round) looked like a model; v2 (~4 rounds) got close.
- Before drawing: lay a 50px grid over the reference frame and map each object's screen position to iso coords, so the camera/crop matches.
- Finish layers that matter: several light pools (screen blend) on floor and wall, blurred contact shadows under furniture, rim highlight on top edges, all colours tinted toward the ambient purple, dense small props (fringe, mugs, books), tight crop off the frame edges.
- Reusable helpers live in /mnt/project-files/paris-dia1/codigo/Scene2.tsx: p() projection, Box (auto-shaded from one colour), Contact shadow, tint/mix, Poly.
- Setup: npm i remotion @remotion/cli react react-dom @fontsource/*; render stills with npx remotion still ... --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
- Lucas wants stills (prancha) for tests, no animation, unless he asks.
- 2026-10-22 pilot (first 15 s of the Paris video, approved by Lucas): Flow made 7 images in one block (2 empty backgrounds + characters on #00FF00, main character and one protester as cut-out parts sheets). I keyed them (key.py: green-diff alpha, scipy labels, PCA to straighten limbs), rigged puppets in Remotion (Paris15.tsx: Puppet with hip/knee/shoulder/elbow, walkPose/runPose), crowd/police as whole cut-outs, HUD/captions (faster-whisper word timestamps)/smoke in code, original audio. Took ~8 min of my work after images arrived + 30 s render. Files: /mnt/project-files/paris-dia1/teste15s/, codigo/Paris15.tsx. Forearm piece came flipped (hand on top) — check orientation; shoulder/hip pivots needed manual values.
- Future idea (Lucas, 2026-10-22, park for later tests): better 2D cut-out puppets from Flow — separate head, expression sheet (eyes/mouth swaps, lip-sync), hand poses, front/side/back turnaround. Lucas sees the Flow-parts + code-rig pipeline as reusable for many formats, not only this one. Trade-off noted: faceless protagonist helps "você" projection.
- Full-video lessons (Paris, 2026-10-22, Lucas liked v2): (1) before building, list EVERY shot of the original from scene cuts (ffmpeg select scene>0.08) AND look at frames between cuts — I missed the keypad close-up 14.6–15.5 s. (2) Frame iso rooms like the original (whole room, darker), size characters vs the door (~0.65 door height). (3) Cut-outs must face their direction of travel (flip). (4) Ask Flow for moved furniture as a separate piece + room without it. (5) Close-up props generated WITH their object (hand+knob) look pasted — erase the object and wrap the hand around the scene's own. (6) Ask Flow for close-up backgrounds (notebook fills frame) instead of zooming a wide shot. (7) Actor = stepped walk + 0.12 s pose crossfade. Lucas prefers Flow for any visual asset.
