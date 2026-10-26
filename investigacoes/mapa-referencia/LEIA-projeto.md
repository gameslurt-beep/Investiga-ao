# Projeto do mapa (Remotion)
- sp3d-mapa.tar.gz: projeto Remotion completo sem node_modules. `tar xzf sp3d-mapa.tar.gz && cd sp3d && npm install`.
  - Cena: src/Dia3.tsx (composição "Dia3" no Root.tsx). Render: `npx remotion render src/index.ts Dia3 out/dia3.mp4 --codec=h264 --crf=18` (~1 min 47 s na nuvem).
  - Assets do mapa novo: public/mapa3/ (nat.jpg, dark.jpg = mosaico tratado; mask_SP/PI/MT/RS.png; geo3.json = divisas e capitais em pixels do mosaico). Fontes Poppins em public/fonts/P-*.ttf.
- fonte/: br.jpg (mosaico EOX Sentinel-2 cloudless 2016, z6, origem no .txt: zoom x0 y0), se.jpg (z8, Sudeste), geo.json (divisas originais, lon = x/k + lon0, lat = y + lat0), prep3.py (gera nat/dark/máscaras/geo3.json; ajustar caminhos S e OUT e a lista de siglas para novas máscaras).
