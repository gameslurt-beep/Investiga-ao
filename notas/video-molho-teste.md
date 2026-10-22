---
name: video-molho-teste
description: Lucas's test of the viral "sauce drips over an Instagram post card" video format, made with Veo plus compositing here
metadata:
  type: project
  modified: 2026-10-21T23:14:39.223Z
---

Started 2026-10-21. Lucas (talks in Portuguese) is testing whether he can recreate the viral format where sauce pours over a fried chicken tender and the stream passes *over* a fake Instagram post card in the middle of the frame. It's only a test/simulation.

Split of the work: Lucas makes the reference image (Gemini/Nano Banana) and the clip (Veo, image-to-video, using the image as the first frame). Claude can't generate video; it does the compositing with ffmpeg+numpy.

Files are in /mnt/project-files/molho-teste/: frame_referencia.jpg (768x1376 reference image), make_card.py -> card.png (fictional post "molho.do.teste", region 40,520-728,820), compor.py (video + card + saturation-keyed sauce on top). Done 2026-10-21: Veo clip came out 720x1280; card at y=410 (make_card.py card_720.png 720 1280 410); result in teste_final.mp4. The format works.

Key insight from Lucas (2026-10-21): the format works because of the surprise. The video opens with NOTHING crossing the card, so it looks like two separate posts (one above, one below). Then the food suddenly starts crossing the card and the viewer gets confused. So each concept needs 2 frames: a "before" frame (middle empty) as the video's first frame, and an "action" frame (element crossing) as the last frame or reference.
Approved recipe (Lucas, 2026-10-21), "do it like the first one": for each idea, ONE standalone start image with no reference image. Hero product at the top, just about to drop or pour (a drip forming at the edge), target at the bottom, empty gray middle band. The video is generated from that image as the first frame. Don't make him attach reference images.
