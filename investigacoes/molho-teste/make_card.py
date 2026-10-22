"""Gera um card fictício de post (estilo Instagram) em PNG transparente, 768x1376."""
from PIL import Image, ImageDraw, ImageFont
import math, sys

# uso: make_card.py saida.png [largura altura y_topo]
out = sys.argv[1] if len(sys.argv) > 1 else "card.png"
W, H, Y0 = (int(v) for v in sys.argv[2:5]) if len(sys.argv) > 4 else (768, 1376, 520)
CARD = (0, Y0, W, Y0 + 300)  # faixa de borda a borda no meio do frame

B = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
R = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
f_num = ImageFont.truetype(B, 26)
f_user = ImageFont.truetype(B, 30)
f_cap = ImageFont.truetype(R, 30)

img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
x0, y0, x1, y1 = CARD
d.rounded_rectangle(CARD, radius=0, fill=(16, 16, 16, 245))
WHITE = (255, 255, 255, 255)
lw = 4

def heart(cx, cy, s):
    pts = []
    for i in range(200):
        t = 2 * math.pi * i / 200
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * s, cy - y * s))
    d.line(pts + [pts[0]], fill=WHITE, width=lw, joint="curve")

def bubble(cx, cy, r):
    d.arc((cx - r, cy - r, cx + r, cy + r), 60, 400, fill=WHITE, width=lw)
    d.line([(cx + r * 0.45, cy + r * 0.85), (cx + r * 1.05, cy + r * 1.05), (cx + r * 0.9, cy + r * 0.5)], fill=WHITE, width=lw)

def repost(cx, cy, r):
    d.arc((cx - r, cy - r, cx + r, cy + r), 200, 340, fill=WHITE, width=lw)
    d.arc((cx - r, cy - r, cx + r, cy + r), 20, 160, fill=WHITE, width=lw)
    d.polygon([(cx + r + 7, cy - 4), (cx + r - 7, cy - 4), (cx + r, cy + 6)], fill=WHITE)
    d.polygon([(cx - r + 7, cy + 4), (cx - r - 7, cy + 4), (cx - r, cy - 6)], fill=WHITE)

def send(cx, cy, s):
    p = [(cx - s, cy - s * 0.8), (cx + s, cy - s * 0.8), (cx, cy + s)]
    d.polygon(p, outline=WHITE, width=lw)
    d.line([(cx - s, cy - s * 0.8), (cx + s * 0.05, cy - s * 0.05)], fill=WHITE, width=lw)

def bookmark(cx, cy, s):
    d.line([(cx - s * 0.7, cy - s), (cx + s * 0.7, cy - s), (cx + s * 0.7, cy + s), (cx, cy + s * 0.45),
            (cx - s * 0.7, cy + s), (cx - s * 0.7, cy - s)], fill=WHITE, width=lw, joint="curve")

iy = y0 + 45
heart(x0 + 38, iy, 1.05); d.text((x0 + 64, iy), "24,6 mil", font=f_num, fill=WHITE, anchor="lm")
bubble(x0 + 205, iy, 16); d.text((x0 + 232, iy), "3.112", font=f_num, fill=WHITE, anchor="lm")
repost(x0 + 345, iy, 15)
send(x0 + 400, iy, 15); d.text((x0 + 425, iy), "2.087", font=f_num, fill=WHITE, anchor="lm")
bookmark(x1 - 38, iy, 16)

cy = y0 + 110
d.text((x0 + 24, cy), "molho.do.teste", font=f_user, fill=WHITE, anchor="lm")
uw = d.textlength("molho.do.teste  ", font=f_user)
d.text((x0 + 24 + uw, cy), "O molho mais", font=f_cap, fill=WHITE, anchor="lm")
d.text((x0 + 24, cy + 40), "picante da cidade 🌶" .replace("🌶", ""), font=f_cap, fill=WHITE, anchor="lm")

ay = y1 - 65
d.ellipse((x0 + 22, ay - 28, x0 + 78, ay + 28), outline=(225, 48, 108, 255), width=4)
d.ellipse((x0 + 30, ay - 20, x0 + 70, ay + 20), fill=(240, 120, 40, 255))
d.text((x0 + 92, ay), "molho.do.teste", font=f_user, fill=WHITE, anchor="lm")
for k in range(3):
    d.ellipse((x1 - 60 + k * 13 - 4, ay - 4, x1 - 60 + k * 13 + 4, ay + 4), fill=WHITE)

img.save(out)
print("card salvo em", out, "região", CARD)
