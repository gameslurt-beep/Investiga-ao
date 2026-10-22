---
name: quem-e-voce-producao
description: State of the "Quem é você (Dia 1)" video: script, Flow images, build backup and what is pending (Lucas's narration + captions)
metadata:
  type: project
  modified: 2026-10-22T22:46:06.528Z
---

Story chosen from [[direcao-novas-historias]]. You think you are the victim; CCTV CAM 2 shows the intruder is you; owner hides in the closet; blue box with a child photo bearing your name; ends on a viewer decision (1 open closet / 2 leave with box).
- Script v2 (hook A: black screen, woman's whisper "Por favor, venham rápido. Ele está dentro da minha casa." + CAM 2 notification): /mnt/project-files/roteiros/quem-e-voce-v2.md
- Flow prompts: /mnt/project-files/quem-e-voce/flow_prompt_imagens_final.md, flow_prompt_rodada2.md. Images: flow_rodada1/ (14) and flow_rodada2/ (LIT/DARK room pairs, back puppet parts, cat poses, box, woman, CCTV; cutaway = 43_casa_corte_lit_v2.jpg).
- Style approved: painterly cinematic, flashlight reveals LIT version over DARK, faceless protagonist (back-view cut-out puppet), amber=you / green=CCTV / red=alert, pull-back to dark cutaway house.

2026-10-22 22:18-23:xx UTC: full build at max effort (Remotion). Lucas asked to leave narration and captions for later ("não vou conseguir enviar a narração agora"): delivered video with SFX only, timed to a provisional TTS guide (88 s).
- Build sources + keyed assets backup: /mnt/project-files/quem-e-voce/build/ (LEIA-ME.md has the steps). Video outputs: /mnt/project-files/quem-e-voce/video/.
**Why:** the container is ephemeral; the next thread must rebuild from the backup.
**How to apply:** when Lucas sends his narration, align words (Whisper word timestamps) into audio/<id>.json, rerun timeline.py (cuts follow the voice), add captions, re-render. Report time and tokens when he asks for them.
