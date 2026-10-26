import json, math, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops, ImageEnhance

D = sys.argv[1]
OUT = sys.argv[2]
geo = json.load(open(D + '/../v30/sp3d/public/geo.json'))
K, LON0, LAT0 = geo['tex']['k'], geo['tex']['lon0'], geo['tex']['lat0']
F = lambda w, s: ImageFont.truetype(f'{D}/P-{w}.ttf', s)
SP_OR = (255, 138, 61)
W, H = 1920, 1080


def ll(p):  # geo.json -> lon/lat
    return p[0] / K + LON0, p[1] + LAT0


class View:
    def __init__(self, img, zoom_txt, cx, cy, scale):
        z, x0, y0 = map(int, open(img + '.txt').read().split())
        self.src = Image.open(img).convert('RGB')
        self.z, self.x0, self.y0 = z, x0, y0
        self.cx, self.cy, self.s = cx, cy, scale  # center lon/lat, output px per source px

    def src_px(self, lon, lat):
        n = 2 ** self.z
        x = (lon + 180) / 360 * n
        l = math.radians(lat)
        y = (1 - math.log(math.tan(l) + 1 / math.cos(l)) / math.pi) / 2 * n
        return (x - self.x0) * 256, (y - self.y0) * 256

    def px(self, lon, lat):
        sx, sy = self.src_px(lon, lat)
        cx, cy = self.src_px(self.cx, self.cy)
        return (sx - cx) * self.s + W / 2, (sy - cy) * self.s + H / 2

    def base(self):
        cx, cy = self.src_px(self.cx, self.cy)
        w, h = W / self.s, H / self.s
        im = self.src.crop((int(cx - w / 2), int(cy - h / 2), int(cx + w / 2), int(cy + h / 2))).resize((W, H), Image.LANCZOS)
        return im


def grade(im, dark=0.0):
    # look "Johnny Harris": mar quase preto, terra natural mais viva
    im = ImageEnhance.Color(im).enhance(1.25 - 0.9 * dark)
    if not dark: im = ImageEnhance.Brightness(im).enhance(1.12)
    im = ImageEnhance.Contrast(im).enhance(1.15)
    # escurece azul (mar)
    r, g, b = im.split()
    sea = ImageChops.subtract(b, r).point(lambda v: min(255, v * 4))
    sea = sea.filter(ImageFilter.GaussianBlur(3))
    black = Image.new('RGB', im.size, (6, 9, 16))
    im = Image.composite(black, im, sea.point(lambda v: int(v * 0.85)))
    if dark:
        im = Image.blend(im, Image.new('RGB', im.size, (4, 6, 12)), 0.72 * dark)
    return vignette(im)


def vignette(im):
    m = Image.new('L', (W // 8, H // 8), 0)
    d = ImageDraw.Draw(m)
    for i in range(40):
        d.ellipse((-W // 8 * 0.25 + i, -H // 8 * 0.25 + i * 0.6, W // 8 * 1.25 - i, H // 8 * 1.25 - i * 0.6), fill=int(255 * i / 40))
    m = m.resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(40))
    return Image.composite(im, Image.new('RGB', im.size, (0, 0, 0)), m.point(lambda v: 90 + int(v * 165 / 255)))


def rings(v, sigla):
    st = [s for s in geo['states'] if s['sigla'] == sigla][0]
    out = []
    for poly in st['polys']:
        out.append([v.px(*ll(p)) for p in poly[0]])
    return out


def mask_of(v, sigla, blur=0):
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    for r in rings(v, sigla):
        d.polygon(r, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


def glow_line(im, pts_list, color, width=3, glow=14, strength=1.0):
    layer = Image.new('RGB', (W, H), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    for pts in pts_list:
        d.line(pts + [pts[0]], fill=color, width=width, joint='curve')
    g = layer.filter(ImageFilter.GaussianBlur(glow))
    g = ImageEnhance.Brightness(g).enhance(2.2 * strength)
    im = ImageChops.add(im, g)
    im = ImageChops.lighter(im, layer)
    return im


def all_states_lines(im, v, color=(255, 255, 255), alpha=40):
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for s in geo['states']:
        for poly in s['polys']:
            pts = [v.px(*ll(p)) for p in poly[0]]
            d.line(pts + [pts[0]], fill=color + (alpha,), width=1)
    return Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')


def caption(im, n, title, sub):
    d = ImageDraw.Draw(im)
    d.text((60, 46), f'{n:02d}', font=F('Bold', 30), fill=SP_OR)
    d.text((112, 44), title.upper(), font=F('SemiBold', 30), fill=(244, 239, 230))
    d.text((112, 88), sub, font=F('Regular', 24), fill=(190, 196, 210))
    return im


# ---------- vistas ----------
se = View(D + '/se.jpg', 8, -48.6, -22.3, 0.62)
br = View(D + '/br.jpg', 6, -54.5, -14.0, 0.56)


def se_base(dark=0):
    return all_states_lines(grade(se.base(), dark), se, alpha=55)


imgs = []

# 1 contorno aceso
im = se_base()
im = glow_line(im, rings(se, 'SP'), (255, 196, 140), width=3, glow=10)
imgs.append(caption(im, 1, 'Contorno aceso', 'Linha fina e brilhante na divisa de SP, que se desenha'))

# 2 veu laranja
im = se_base()
veil = Image.new('RGB', (W, H), SP_OR)
im = Image.composite(Image.blend(im, veil, 0.38), im, mask_of(se, 'SP', 1))
imgs.append(caption(im, 2, 'Véu laranja', 'Cor leve por cima, o satélite continua aparecendo'))

# 3 holofote
nat = all_states_lines(grade(se.base(), 0), se, alpha=55)
drk = all_states_lines(grade(se.base(), 0.75), se, alpha=35)
im = Image.composite(nat, drk, mask_of(se, 'SP', 6))
imgs.append(caption(im, 3, 'Holofote', 'O resto do Brasil apaga, SP fica com a cor natural'))

# 4 combinado
im = Image.composite(Image.blend(nat, veil, 0.22), drk, mask_of(se, 'SP', 6))
im = glow_line(im, rings(se, 'SP'), (255, 196, 140), width=3, glow=10)
combo_raw = im.copy()
imgs.append(caption(im, 4, 'Os três juntos', 'Holofote + véu leve + contorno aceso'))

# 5 natural x escuro (Brasil)
a = all_states_lines(grade(br.base(), 0), br, alpha=60)
b = all_states_lines(grade(br.base(), 0.8), br, alpha=40)
b = Image.composite(all_states_lines(grade(br.base(), 0), br, alpha=60), b, mask_of(br, 'SP', 4))
b = glow_line(b, rings(br, 'SP'), (255, 196, 140), width=2, glow=8)
half = Image.new('RGB', (W, H))
half.paste(a.crop((W // 4, 0, W // 4 + W // 2, H)), (0, 0))
half.paste(b.crop((W // 4, 0, W // 4 + W // 2, H)), (W // 2, 0))
d = ImageDraw.Draw(half)
d.line((W // 2, 0, W // 2, H), fill=(244, 239, 230), width=2)
d.text((W // 2 - 300, H - 90), 'NATURAL', font=F('SemiBold', 28), fill=(244, 239, 230))
d.text((W // 2 + 40, H - 90), 'ESCURO', font=F('SemiBold', 28), fill=(244, 239, 230))
imgs.append(caption(half, 5, 'Natural x escuro', 'Mesma imagem, muda só o tratamento; a troca é animada'))

# 6 leque de linhas SP -> capitais
CAP = {'Manaus': (-60.02, -3.1), 'Belém': (-48.5, -1.45), 'São Luís': (-44.3, -2.53), 'Fortaleza': (-38.54, -3.72),
       'Teresina': (-42.8, -5.09), 'Natal': (-35.2, -5.79), 'João Pessoa': (-34.86, -7.12), 'Recife': (-34.88, -8.05),
       'Maceió': (-35.73, -9.65), 'Aracaju': (-37.07, -10.91), 'Salvador': (-38.5, -12.97), 'Palmas': (-48.33, -10.18),
       'Porto Velho': (-63.9, -8.76), 'Rio Branco': (-67.81, -9.97), 'Boa Vista': (-60.67, 2.82), 'Macapá': (-51.07, 0.03),
       'Cuiabá': (-56.1, -15.6), 'Campo Grande': (-54.62, -20.47), 'Goiânia': (-49.25, -16.68), 'Brasília': (-47.88, -15.79),
       'Belo Horizonte': (-43.94, -19.92), 'Vitória': (-40.31, -20.32), 'Rio de Janeiro': (-43.2, -22.9),
       'Curitiba': (-49.27, -25.43), 'Florianópolis': (-48.55, -27.6), 'Porto Alegre': (-51.23, -30.03)}
base6 = Image.composite(all_states_lines(grade(br.base(), 0.15), br, alpha=50),
                        all_states_lines(grade(br.base(), 0.55), br, alpha=40), mask_of(br, 'SP', 4))
lines = Image.new('RGB', (W, H), (0, 0, 0))
d = ImageDraw.Draw(lines)
sx, sy = br.px(-46.63, -23.55)
import random
random.seed(3)
for name, (lo, la) in CAP.items():
    ex, ey = br.px(lo, la)
    for k in range(4):  # varias linhas finas por destino
        mx, my = (sx + ex) / 2, (sy + ey) / 2
        dx, dy = ex - sx, ey - sy
        L = math.hypot(dx, dy) or 1
        bend = random.uniform(0.06, 0.32) * L
        cx, cy = mx - dy / L * bend, my + dx / L * bend
        N = 90
        head = random.uniform(0.75, 1.0)  # quanto da linha ja foi desenhado
        prev = None
        for i in range(int(N * head) + 1):
            t = i / N
            x = (1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t * t * ex
            y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t * t * ey
            if prev:
                a = (i / (N * head)) ** 1.6  # cauda some, cabeca forte
                a *= random.uniform(0.35, 0.8)
                col = (int(255 * a), int(232 * a), int(210 * a))
                d.line((prev[0], prev[1], x, y), fill=col, width=1)
            prev = (x, y)
g = ImageEnhance.Brightness(lines.filter(ImageFilter.GaussianBlur(4))).enhance(1.3)
im = ImageChops.add(ImageChops.add(base6, g), lines)
im = glow_line(im, rings(br, 'SP'), (255, 196, 140), width=2, glow=8)
imgs.append(caption(im, 6, 'Leque de linhas', 'Dinheiro saindo de SP para as capitais (exemplo de fluxo)'))

# 7 etiqueta jornal
im = combo_raw.copy()
d = ImageDraw.Draw(im)
px, py = se.px(-47.2, -22.2)
d.ellipse((px - 7, py - 7, px + 7, py + 7), fill=SP_OR)
d.ellipse((px - 16, py - 16, px + 16, py + 16), outline=SP_OR, width=2)
lx, ly = px + 160, py - 300
d.line((px + 12, py - 12, lx, ly + 130), fill=(244, 239, 230), width=2)
d.line((lx, ly + 130, lx + 40, ly + 130), fill=(244, 239, 230), width=2)
d.text((lx + 56, ly + 4), 'PIB DE SÃO PAULO', font=F('SemiBold', 24), fill=(190, 196, 210))
d.text((lx + 52, ly + 30), '31%', font=F('Bold', 110), fill=(244, 239, 230))
d.text((lx + 300, ly + 100), 'do Brasil', font=F('Regular', 30), fill=(244, 239, 230))
d.text((lx + 56, ly + 175), 'FONTE: IBGE · CONTAS REGIONAIS 2021', font=F('Regular', 18), fill=(150, 156, 170))
imgs.append(caption(im, 7, 'Etiqueta de jornal', 'Linha presa ao ponto, número grande, fonte embaixo'))

for i, im in enumerate(imgs, 1):
    im.save(f'{OUT}/m{i:02d}.jpg', quality=88)
print('ok', len(imgs))
