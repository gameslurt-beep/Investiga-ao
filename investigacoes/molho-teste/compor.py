"""Monta o efeito: vídeo base -> card do post -> filete de molho recortado por cima do card.

Uso: python3 -I compor.py video_veo.mp4 card.png saida.mp4
O recorte separa o molho do fundo cinza pela saturação da cor (o molho é laranja, o fundo é cinza).
"""
import subprocess, sys, json
import numpy as np
from PIL import Image, ImageFilter

src, card_path, out = sys.argv[1:4]
probe = json.loads(subprocess.check_output([
    "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
    "stream=width,height,r_frame_rate", "-of", "json", src]))["streams"][0]
w, h, fps = probe["width"], probe["height"], probe["r_frame_rate"]

card = Image.open(card_path).convert("RGBA").resize((w, h))
card_np = np.asarray(card).astype(np.float32) / 255.0
card_a = card_np[..., 3:4]
card_rgb = card_np[..., :3]

dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                        "-s", f"{w}x{h}", "-r", fps, "-i", "-", "-i", src, "-map", "0:v", "-map", "1:a?",
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "copy", out],
                       stdin=subprocess.PIPE)

size = w * h * 3
n = 0
while True:
    buf = dec.stdout.read(size)
    if len(buf) < size:
        break
    f = np.frombuffer(buf, np.uint8).reshape(h, w, 3).astype(np.float32) / 255.0
    mx, mn = f.max(2), f.min(2)
    sat = (mx - mn) / (mx + 1e-6)
    # molho: saturado e com vermelho > azul; fundo cinza tem saturação ~0
    raw = np.clip((sat - 0.25) / 0.15, 0, 1) * (f[..., 0] > f[..., 2])
    m = Image.fromarray((raw * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    sauce = (np.asarray(m).astype(np.float32) / 255.0)[..., None]
    comp = f * (1 - card_a) + card_rgb * card_a          # card sobre o vídeo
    comp = comp * (1 - sauce) + f * sauce                # molho sobre o card
    enc.stdin.write((comp * 255).astype(np.uint8).tobytes())
    n += 1

enc.stdin.close(); enc.wait(); dec.wait()
print(f"{n} frames -> {out}")
