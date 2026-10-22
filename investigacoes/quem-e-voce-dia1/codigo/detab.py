# remove as abas redondas de encaixe (tabs) das partes do boneco de costas:
# liga a borda de um lado ao outro da aba com uma reta e apaga o que passa dela
import json, os, shutil, numpy as np
from PIL import Image
from scipy import ndimage as nd
tabs = json.load(open('/home/user/qv/tabs.json'))
# q_orig guarda as peças como o key.py gerou (com as abas); na primeira vez, copia de rem/public/q
os.makedirs('/home/user/qv/q_orig', exist_ok=True)
for i in range(13):
    if not os.path.exists(f'/home/user/qv/q_orig/back{i}.png'):
        shutil.copy(f'/home/user/qv/rem/public/q/back{i}.png', f'/home/user/qv/q_orig/back{i}.png')
SIDES = {'back0': ['bot'], 'back1': ['bot'], 'back3': ['top', 'bot', 'lft', 'rgt'], 'back4': ['top', 'bot'], 'back5': ['top', 'bot'],
         'back6': ['top'], 'back7': ['top'], 'back9': ['top', 'bot'], 'back10': ['top', 'bot'], 'back11': ['top'], 'back12': ['top']}
R = 17
def ext(a, s, i):
    # posição da borda na linha/coluna i, vindo do lado s
    if s in ('lft', 'rgt'):
        idx = np.where(a[i])[0]
        if len(idx) == 0: return None
        return idx[0] if s == 'lft' else idx[-1]
    idx = np.where(a[:, i])[0]
    if len(idx) == 0: return None
    return idx[0] if s == 'top' else idx[-1]
for i in range(13):
    k = f'back{i}'
    im = np.array(Image.open(f'/home/user/qv/q_orig/{k}.png').convert('RGBA')).astype(np.float32)
    if k in SIDES:
        a = im[..., 3] > 100
        H, W = a.shape
        cut = np.zeros_like(a)
        for s in SIDES[k]:
            px, py = tabs[k][s][:2]
            c = py if s in ('lft', 'rgt') else px
            n = H if s in ('lft', 'rgt') else W
            i0, i1 = max(0, c - R - 7), min(n - 1, c + R + 7)
            e0, e1 = ext(a, s, i0), ext(a, s, i1)
            if e0 is None or e1 is None: print('skip', k, s); continue
            for j in range(i0, i1 + 1):
                e = e0 + (e1 - e0) * (j - i0) / max(1, i1 - i0)
                e = int(round(e))
                if s == 'lft': cut[j, :e] = True
                elif s == 'rgt': cut[j, e + 1:] = True
                elif s == 'top': cut[:e, j] = True
                else: cut[e + 1:, j] = True
        alpha = im[..., 3]
        alpha[cut] = 0
        edge = nd.binary_dilation(cut, iterations=1) & ~cut
        alpha[edge] = alpha[edge] * 0.55
        im[..., 3] = alpha
    Image.fromarray(im.clip(0, 255).astype(np.uint8)).save(f'/home/user/qv/rem/public/q/{k}.png')
print('ok')
# ajustes finos: calombos que ficaram no topo do braço e da coxa
def cutbox(k, x0, x1, ymax):
    p = f'/home/user/qv/rem/public/q/{k}.png'
    im = np.array(Image.open(p).convert('RGBA')).astype(np.float32)
    im[:ymax, x0:x1 + 1, 3] = 0
    im[ymax, x0:x1 + 1, 3] *= 0.55
    Image.fromarray(im.clip(0, 255).astype(np.uint8)).save(p)
cutbox('back4', 104, 130, 12)
cutbox('back5', 62, 85, 5)
cutbox('back10', 48, 84, 18)
print('fino ok')
# máscara da tela do celular (h8_1_scr): 2 px maior, para cobrir a tela clara do desenho, e em 4x com borda suave (a 3-4x de zoom ela ficava serrilhada)
if os.path.exists('/home/user/qv/q_orig/h8_1_scr.png'):
    a = np.array(Image.open('/home/user/qv/q_orig/h8_1_scr.png').convert('RGBA'))[..., 3].astype(np.float32)
    al = nd.binary_dilation(a > 128, iterations=2).astype(np.float32) * 255
    K = 4
    up = np.array(Image.fromarray(al.astype(np.uint8)).resize((al.shape[1] * K, al.shape[0] * K), Image.LANCZOS)).astype(np.float32)
    up = np.clip((nd.gaussian_filter(up, K * 0.9) - 128) * 2.2 + 128, 0, 255)
    out = np.zeros(up.shape + (4,), np.uint8)
    out[..., :3] = 255
    out[..., 3] = up.astype(np.uint8)
    Image.fromarray(out).save('/home/user/qv/rem/public/q/h8_1_scr.png')
    print('tela ok')
