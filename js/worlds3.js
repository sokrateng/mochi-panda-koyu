'use strict';
/* ============ Sonsuz dünyalar: her kurtarılan hayvan bir sonraki dünyanın kapısını açar (w4 … w23) ============ */

/* ---------- Yeni hayvanlar (makeCreature bunları ANIMALS tablosundan çizer) ---------- */
Object.assign(ANIMALS, {
  deve:    { body: 0xd8b075, belly: 0xf3e2bd, ear: 'round', earIn: 0xf3d0a0, tail: 'tiny', nose: 0x6b4a2a, snout: 0xf3e2bd, size: 1.1 },
  koyun:   { body: 0xfdfaf2, belly: 0xffffff, ear: 'round', earIn: 0xffc8d8, tail: 'puff', nose: 0xff9db4, size: 1 },
  kirpi:   { body: 0x8a6a4a, belly: 0xf0d9b5, ear: 'round', earIn: 0xf0b8a0, tail: 'tiny', nose: 0x2b2023, snout: 0xf0d9b5, collar: true, size: 0.95 },
  aslan:   { body: 0xe8a13a, belly: 0xfff1d6, ear: 'round', earIn: 0xffd0a0, tail: 'long', nose: 0x6b3a1a, collar: true, size: 1.1 },
  fil:     { body: 0xb8c4d4, belly: 0xdde4ee, ear: 'round', earIn: 0xf0b8c8, tail: 'long', nose: 0x8a98aa, snout: 0xb8c4d4, size: 1.2 },
  maymun:  { body: 0x9a6a3a, belly: 0xe8c89a, ear: 'round', earIn: 0xe8c89a, tail: 'long', nose: 0x4a2a14, snout: 0xe8c89a, size: 1 },
  koala:   { body: 0xc4c8d4, belly: 0xf2f2f6, ear: 'round', earIn: 0xf0c8d8, tail: 'tiny', nose: 0x2b2a33, size: 1 },
  ordek:   { body: 0xffe04a, belly: 0xfff4b0, ear: 'none', tail: 'tiny', nose: 0xff8a2a, snout: 0xff9a3a, size: 0.95 },
  zebra:   { body: 0xffffff, belly: 0xffffff, ear: 'round', earIn: 0x777777, tail: 'long', stripes: 0x23232b, nose: 0x23232b, snout: 0x23232b, size: 1.1 },
  inek:    { body: 0xffffff, belly: 0xffd9e6, ear: 'round', earIn: 0xffb6c8, tail: 'long', nose: 0xff9db4, snout: 0xffc2d2, size: 1.1 },
  geyik:   { body: 0xb87a42, belly: 0xf3e2c6, ear: 'point', earIn: 0xf0c8a0, tail: 'tiny', nose: 0x2b2023, size: 1.05 },
  kurt:    { body: 0x8a909c, belly: 0xdfe3ea, ear: 'point', earTip: 0x2b2a33, tail: 'bushy', nose: 0x23232b, snout: 0xdfe3ea, size: 1.05 },
  at:      { body: 0xf3eefa, belly: 0xffffff, ear: 'point', earIn: 0xffb6d8, tail: 'bushy', nose: 0xff9db4, snout: 0xf3eefa, size: 1.1 },
  kurbaga: { body: 0x6fcf5a, belly: 0xe6f8c8, ear: 'none', tail: 'tiny', nose: 0x2f8a2a, snout: 0xe6f8c8, size: 0.95 },
  baykus:  { body: 0x8a6a8a, belly: 0xe8d8c8, ear: 'point', earTip: 0x4a3a4a, tail: 'tiny', nose: 0xffb02a, snout: 0xe8d8c8, size: 0.95 },
  domuz:   { body: 0xffb6c8, belly: 0xffd0dc, ear: 'round', earIn: 0xff8aa8, tail: 'tiny', nose: 0xff7a98, snout: 0xff9ab0, size: 1 },
  kopek:   { body: 0xe0b078, belly: 0xfff1d6, ear: 'round', earIn: 0xb07a42, tail: 'long', nose: 0x2b2023, snout: 0xfff1d6, size: 1 },
  ayicik:  { body: 0x8a5a3a, belly: 0xd8b080, ear: 'round', earIn: 0xd8b080, tail: 'tiny', nose: 0x1d1410, snout: 0xd8b080, size: 1.05 },
  sincap:  { body: 0xc9772e, belly: 0xf6e2c0, ear: 'point', earIn: 0xf6e2c0, tail: 'bushy', nose: 0x2b2023, size: 0.95 },
  yarasa:  { body: 0x5a4a7a, belly: 0xb8a8d8, ear: 'point', earIn: 0xffb6d8, tail: 'tiny', nose: 0xff7aa8, size: 0.95 },
});

/* ---------- Dünya listesi: 8 tema, 20 dünya, her dünyada bir hayvan ---------- */
const XW = [
  ['Altın Çöl', 'desert', 'deve', '🐫', 'Hörgüç', 'Çölün sıcağında kaybolmuştum! Beni buldun, çok sağ ol!'],
  ['Şeker Diyarı', 'candy', 'koyun', '🐑', 'Pamuk', 'Mee! Şekerlerin arasında hapsolmuştum. Teşekkürler!'],
  ['Sonbahar Ormanı', 'autumn', 'kirpi', '🦔', 'Dikenli', 'Dikenlerim var ama kalbim yumuşak! Beni kurtardın!'],
  ['Volkan Adası', 'lava', 'aslan', '🦁', 'Alev', 'Rraaar! Özgürüm! Cesaretin için sana teşekkür ederim!'],
  ['Bulut Ülkesi', 'sky', 'fil', '🐘', 'Hortum', 'Bulutların üstünde bile kurtarıcı varmış! Sağ ol!'],
  ['Tropik Orman', 'jungle', 'maymun', '🐒', 'Muzo', 'Uu-aa! Ağaçtan ağaca atlayabilirim artık, sağ ol!'],
  ['Yıldız Gezegeni', 'space', 'koala', '🐨', 'Astro', 'Uzayda kaybolmuştum! Beni kurtardığın için sağ ol!'],
  ['Oyuncak Dünyası', 'toy', 'ordek', '🦆', 'Vak', 'Vak vak! Oyuncakların arasından çıktım, teşekkürler!'],
  ['Kızıl Kanyon', 'desert', 'zebra', '🦓', 'Çizgi', 'Çizgilerim kanyonda kaybolmuştu! Beni buldun!'],
  ['Dondurma Vadisi', 'candy', 'inek', '🐮', 'Benekli', 'Möö! Dondurma erimeden beni kurtardın, harikasın!'],
  ['Akçaağaç Köyü', 'autumn', 'geyik', '🦌', 'Yavru', 'Yapraklar arasında yolumu bulamıyordum. Sağ ol!'],
  ['Kor Mağarası', 'lava', 'kurt', '🐺', 'Gri', 'Auuu! Korların arasından çıktım. Sana borçluyum!'],
  ['Gökkuşağı Adaları', 'sky', 'at', '🐴', 'Rüzgar', 'Rüzgar gibi koşacağım artık! Teşekkür ederim!'],
  ['Mercan Koyu', 'jungle', 'kurbaga', '🐸', 'Vırak', 'Vırak! Gölden çıktım, sen olmasan çıkamazdım!'],
  ['Ay Üssü', 'space', 'baykus', '🦉', 'Gece', 'Huu huu! Ay ışığında seni bekliyordum. Sağ ol!'],
  ['Lego Şehri', 'toy', 'domuz', '🐷', 'Pembiş', 'Oink! Bloklar arasında sıkışmıştım. Sağ ol dostum!'],
  ['Dev Kumul', 'desert', 'kopek', '🐶', 'Fındık', 'Hav hav! Kumullarda iz sürdüm, sen buldun beni!'],
  ['Çikolata Nehri', 'candy', 'ayicik', '🧸', 'Kahve', 'Çikolata kokusu her yerde! Beni kurtardığın için sağ ol!'],
  ['Kestane Tepesi', 'autumn', 'sincap', '🐿️', 'Cevizli', 'Cevizlerimi topladım, şimdi özgürüm! Teşekkürler!'],
  ['Samanyolu', 'space', 'yarasa', '🦇', 'Pırıl', 'Yıldızlar kadar parlıyorsun! Beni kurtardığın için sağ ol!'],
].map(([name, theme, animal, emoji, aname, line], i) => ({ id: 'w' + (i + 4), name, theme, animal, emoji, aname, line, n: i }));
const XW_BOSS = [['devfare', 'Gölge Fare'], ['kaplan', 'Kızgın Kaplan'], ['ayi', 'Dev Ayı']];
const XW_BY_ID = Object.fromEntries(XW.map((d) => [d.id, d]));

XW.forEach((d) => {
  FRIENDS[d.animal] = { name: d.aname, emoji: d.emoji, world: d.id, bonus: 40, line: d.line };
  WORLD_META[d.id] = { name: d.name, music: 'x' + d.theme };
});
const XMUSIC = {
  xdesert: { root: 53, scale: [0, 1, 4, 5, 7], bpm: 100, wave: 'triangle', vol: 0.5 },
  xcandy: { root: 65, scale: [0, 2, 4, 7, 9], bpm: 126, wave: 'triangle', vol: 0.5 },
  xautumn: { root: 57, scale: [0, 2, 3, 7, 9], bpm: 92, wave: 'triangle', vol: 0.55 },
  xlava: { root: 48, scale: [0, 1, 3, 6, 7], bpm: 112, wave: 'sawtooth', vol: 0.2 },
  xsky: { root: 67, scale: [0, 2, 4, 7, 9], bpm: 108, wave: 'sine', vol: 0.65 },
  xjungle: { root: 55, scale: [0, 3, 5, 7, 10], bpm: 118, wave: 'triangle', vol: 0.5 },
  xspace: { root: 60, scale: [0, 2, 7, 9, 14], bpm: 80, wave: 'sine', vol: 0.7 },
  xtoy: { root: 62, scale: [0, 4, 7, 9, 12], bpm: 132, wave: 'square', vol: 0.18 },
};
Object.assign(MUSIC, XMUSIC);

/* ---------- Yeni dekor parçaları ---------- */
function cactus(w, x, y, z, s = 1) {
  const g = new T.Group(), m = M(0x3f9a4a); g.position.set(x, y, z); g.scale.setScalar(s); blockAt(w, x, y, z, 0.5 * s, 2.2 * s);
  g.add(mesh(geo('cyl', 0.32, 0.36, 2.2, 10), m, 0, 1.1, 0)); g.add(mesh(geo('sph', 0.32, 10, 8), m, 0, 2.2, 0));
  [[-1, 1.3, 0.9], [1, 1.7, 0.7]].forEach(([sd, yy, h]) => { g.add(mesh(geo('cyl', 0.17, 0.17, 0.6, 8), m, sd * 0.5, yy, 0)).rotation.z = Math.PI / 2; g.add(mesh(geo('cyl', 0.17, 0.17, h, 8), m, sd * 0.78, yy + h / 2, 0)); g.add(mesh(geo('sph', 0.17, 8, 6), m, sd * 0.78, yy + h, 0)); });
  g.add(mesh(geo('sph', 0.1, 6, 5), M(0xff7eb6), 0.12, 2.38, 0.14)); shadowAll(g); addD(w, g);
}
function palm(w, x, y, z, s = 1) {
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); blockAt(w, x, y, z, 0.4 * s, 5.5 * s);
  const trunk = mesh(geo('cyl', 0.2, 0.34, 5, 8), M(0x9a6a3a), 0, 2.5, 0); g.add(trunk);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283, f = mesh(geo('cone', 0.32, 3, 4), M(i % 2 ? 0x3fae5a : 0x58c76a), Math.cos(a) * 1.0, 5.15, Math.sin(a) * 1.0); f.scale.set(1, 1, 0.35); f.rotation.set(Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15); g.add(f); }
  [[0.3, 4.8, 0.2], [-0.25, 4.85, -0.2]].forEach(([a, b, c]) => g.add(mesh(geo('sph', 0.22, 8, 6), M(0x6a4a22), a, b, c))); shadowAll(g); addD(w, g);
}
function lolly(w, x, y, z, s = 1) {
  const g = new T.Group(), cols = [0xff5fa8, 0xffd23f, 0x6fe0ff, 0xb28bff]; g.position.set(x, y, z); g.scale.setScalar(s); g.rotation.y = w.rng() * 6; blockAt(w, x, y, z, 0.3 * s, 3 * s);
  g.add(mesh(geo('cyl', 0.07, 0.07, 2.5, 6), M(0xffffff), 0, 1.25, 0)); const c = cols[Math.floor(w.rng() * cols.length)];
  const d1 = mesh(geo('cyl', 0.95, 0.95, 0.16, 18), M(c), 0, 2.9, 0); d1.rotation.x = Math.PI / 2; g.add(d1);
  const d2 = mesh(geo('cyl', 0.6, 0.6, 0.18, 18), M(0xffffff), 0, 2.9, 0); d2.rotation.x = Math.PI / 2; g.add(d2); const d3 = mesh(geo('cyl', 0.28, 0.28, 0.2, 14), M(c), 0, 2.9, 0); d3.rotation.x = Math.PI / 2; g.add(d3);
  shadowAll(g); addD(w, g);
}
function candyCane(w, x, y, z, s = 1) {
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); g.rotation.y = w.rng() * 6; blockAt(w, x, y, z, 0.35 * s, 3.2 * s);
  for (let i = 0; i < 7; i++) g.add(mesh(geo('cyl', 0.22, 0.22, 0.45, 10), M(i % 2 ? 0xffffff : 0xff3b5c), 0, 0.22 + i * 0.4, 0));
  const hook = mesh(geo('tor', 0.45, 0.2, 10), M(0xff3b5c), 0.45, 3.0, 0); hook.rotation.set(0, 0, 0); g.add(hook); shadowAll(g); addD(w, g);
}
function gumdrop(w, x, y, z, s = 1) {
  const c = [0xff5fa8, 0x7ed957, 0xffa23f, 0x6fb8ff, 0xc08bff][Math.floor(w.rng() * 5)], m = mesh(geo('half', 0.9), M(c, { roughness: 0.35 }), x, y, z); m.scale.setScalar(s * 1.3); m.castShadow = true; addD(w, m); blockAt(w, x, y, z, 1.05 * s, 1.1 * s);
  const sp = mesh(geo('sph', 0.07, 5, 4), M(0xffffff), x + 0.2 * s, y + 1.1 * s, z + 0.1 * s); addD(w, sp);
}
function bigFlower(w, x, y, z, s = 1, col = 0xff7eb6) {
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); blockAt(w, x, y, z, 0.25 * s, 2.6 * s);
  g.add(mesh(geo('cyl', 0.07, 0.1, 2.5, 6), M(0x3f9b3a), 0, 1.25, 0));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, p = mesh(geo('sph', 0.28, 6, 5), M(col), Math.cos(a) * 0.5, 2.55, Math.sin(a) * 0.5); p.scale.set(1, 0.4, 1); g.add(p); }
  g.add(mesh(geo('sph', 0.3, 8, 6), M(0xffd23f), 0, 2.6, 0)); addD(w, g);
}
function toyBlock(w, x, y, z, s = 1) {
  const g = new T.Group(), c = [0xff4d4d, 0x3f8fe0, 0xffd23f, 0x4cc76a, 0xb28bff, 0xff9a3d][Math.floor(w.rng() * 6)], k = 1.6 * s;
  g.position.set(x, y, z); g.rotation.y = w.rng() * 6; blockAt(w, x, y, z, k * 0.75, k);
  const b = mesh(BOX(), M(c, { roughness: 0.5 }), 0, k / 2, 0); b.scale.set(k, k, k); g.add(b);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, bb]) => g.add(mesh(geo('cyl', 0.2 * s, 0.2 * s, 0.18, 10), M(c, { roughness: 0.5 }), a * k * 0.25, k + 0.08, bb * k * 0.25)));
  shadowAll(g); addD(w, g);
}
function toyBall(w, x, y, z, s = 1) {
  const c = [0xff4d4d, 0x3f8fe0, 0xffd23f, 0x4cc76a][Math.floor(w.rng() * 4)], g = new T.Group(); g.position.set(x, y + 1.1 * s, z); blockAt(w, x, y, z, 1.0 * s, 2.0 * s);
  g.add(mesh(geo('sph', 1.1 * s, 12, 10), M(c, { roughness: 0.3 }))); const st = mesh(geo('tor', 1.1 * s, 0.1 * s, 12), M(0xffffff), 0, 0, 0); g.add(st); shadowAll(g); addD(w, g);
}
function lavaSpire(w, x, y, z, s = 1) {
  blockAt(w, x, y, z, 0.8 * s, 3.2 * s); const c = mesh(geo('cone', 0.95 * s, 3.8 * s, 6), M(0x2a2326, { flatShading: true, roughness: 0.9 }), x, y + 1.7 * s, z); c.rotation.y = w.rng() * 6; c.castShadow = true; addD(w, c);
  const gl = mesh(geo('cone', 0.34 * s, 1.2 * s, 5), M(0xff5a1f, { emissive: 0xff4a10, emissiveIntensity: 0.9 }), x, y + 3.6 * s, z); addD(w, gl);
}
function star(w, x, y, z, col = 0xffe27a, s = 1) { const m = mesh(geo('oct', 0.5 * s), M(col, { emissive: col, emissiveIntensity: 0.8, flatShading: true }), x, y, z); m.scale.y = 1.4; addD(w, m); }

/* ---------- Temalar ---------- */
const XTH = {
  desert: {
    sky: [0xffb85c, 0xfff0c8], fog: 0xf8dcaa, fogD: 0.0058, water: 0x37b4c8, hemi: [0xffffff, 0xe8c88a, 0.9], sunI: 1.0, amp: 1.0, ring: 0xc89a6a, blob: 0xff9a5a, grass: [0xd9b865, 0xe6c878],
    pal: { path: 0xc9a05a, low: 0xf6e6b0, steep: 0xb8845a, ground: [0xf0d890, 0xe6c878, 0xdcb868] }, mapCol: [[196, 150, 80], [250, 224, 150]],
    deco(w, ex) { scatterT(w, 40, (x, h, z) => cactus(w, x, h, z, 0.8 + w.rng() * 0.8), ex); scatterT(w, 24, (x, h, z) => palm(w, x, h, z, 0.9 + w.rng() * 0.4), ex); scatterT(w, 40, (x, h, z) => rock(w, x, h, z, 0.8 + w.rng() * 1.6, 0xc89a6a), ex); scatterT(w, 40, (x, h, z) => flower(w, x, h, z, pick([0xff7eb6, 0xffd23f, 0xff9a3d])), ex); },
  },
  candy: {
    sky: [0xffb6e6, 0xfff0fa], fog: 0xffe0f2, fogD: 0.0055, water: 0xff8fd0, hemi: [0xffffff, 0xffb0e0, 0.95], sunI: 0.9, amp: 0.8, ring: 0xffa6d0, blob: 0xff5fa8, grass: [0xff9fcf, 0xffc2e2],
    pal: { path: 0xfff0c0, low: 0xffe0f0, steep: 0xe58ab8, ground: [0xff9fcf, 0xffb2d8, 0xffc8e4] }, mapCol: [[250, 150, 200], [255, 230, 244]],
    deco(w, ex) { scatterT(w, 36, (x, h, z) => lolly(w, x, h, z, 0.9 + w.rng() * 0.7), ex); scatterT(w, 30, (x, h, z) => candyCane(w, x, h, z, 0.9 + w.rng() * 0.6), ex); scatterT(w, 40, (x, h, z) => gumdrop(w, x, h, z, 0.8 + w.rng() * 0.9), ex); scatterT(w, 60, (x, h, z) => flower(w, x, h, z, pick([0xffffff, 0xffd23f, 0xb28bff])), ex); },
  },
  autumn: {
    sky: [0xffb35c, 0xfff0d0], fog: 0xffe6c0, fogD: 0.0062, water: 0x5aa8b8, hemi: [0xfff4e0, 0xd9a060, 0.88], sunI: 0.85, amp: 1.1, ring: 0x9a7a5a, blob: 0xd9732e, grass: [0xd98a3a, 0xc9722e, 0xe0a04a],
    pal: { path: 0xb88a5a, low: 0xe8c890, steep: 0x8a6a4a, ground: [0xd98a3a, 0xc9722e, 0xe0a04a] }, mapCol: [[190, 110, 50], [240, 190, 100]],
    deco(w, ex) { const c = [0xe0702a, 0xd9a02e, 0xc2452e, 0xe8b84a]; scatterT(w, 110, (x, h, z) => tree(w, x, h, z, 0.9 + w.rng() * 0.8, pick(c)), ex); scatterT(w, 30, (x, h, z) => mushroom(w, x, h, z, 0.8 + w.rng() * 0.9, pick([0xc2452e, 0xe8a03a])), ex); scatterT(w, 36, (x, h, z) => rock(w, x, h, z, 0.7 + w.rng() * 1.3, 0x8a7a6a), ex); scatterT(w, 90, (x, h, z) => flower(w, x, h, z, pick([0xffd23f, 0xff7a3a, 0xffffff])), ex); },
  },
  lava: {
    sky: [0x4a1212, 0xff7a4a], fog: 0x6a2a20, fogD: 0.0062, water: 0xff5a1f, hemi: [0xffc8a8, 0x7a4a3a, 1.05], sunI: 0.8, amp: 1.6, ring: 0x3a3030, blob: 0xff6a2a, grass: [0x4a3a3a, 0x3a2f2f], fire: true,
    pal: { path: 0xb08a6a, low: 0x7a5244, steep: 0x4a3838, ground: [0x6a4a44, 0x7a5a50, 0x5a403a] }, mapCol: [[60, 30, 28], [180, 90, 60]],
    deco(w, ex) { scatterT(w, 50, (x, h, z) => lavaSpire(w, x, h, z, 0.8 + w.rng() * 0.9), ex); scatterT(w, 40, (x, h, z) => rock(w, x, h, z, 0.9 + w.rng() * 1.6, 0x3a3236), ex); scatterT(w, 40, (x, h, z) => crystal(w, x, h, z, pick([0xff5a1f, 0xffb02e, 0xff3b5c]), 0.7 + w.rng() * 0.8), ex); [[0, 66], [20, 10], [-20, -20], [0, -40]].forEach(([x, z]) => w.lights.push({ x, y: gy(w, x, z) + 4, z, c: 0xff7a3a })); },
  },
  sky: {
    sky: [0x8fd8ff, 0xffffff], fog: 0xf0f8ff, fogD: 0.0048, water: 0x7ad0ff, hemi: [0xffffff, 0xcfe6ff, 1.0], sunI: 0.95, amp: 0.9, ring: 0xdcecff, blob: 0x9fb8ff, grass: [0xffffff, 0xeef6ff],
    pal: { path: 0xffe9a8, low: 0xe4f1ff, steep: 0xbcd4ec, ground: [0xffffff, 0xeef6ff, 0xdcecff] }, mapCol: [[190, 215, 245], [255, 255, 255]],
    deco(w, ex) { for (let i = 0; i < 26; i++) cloud(w, lerp(-100, 100, w.rng()), 6 + w.rng() * 30, lerp(-100, 100, w.rng()), 1.6 + w.rng() * 1.4); scatterT(w, 40, (x, h, z) => crystal(w, x, h, z, pick([0xff9ad5, 0x9ad5ff, 0xfff09a, 0xb6ffcf]), 0.7 + w.rng() * 0.8), ex); scatterT(w, 50, (x, h, z) => bigFlower(w, x, h, z, 0.9 + w.rng() * 0.8, pick([0xff9ad5, 0xffe27a, 0x9ad5ff])), ex); scatterT(w, 40, (x, h, z) => star(w, x, h + 1.5 + w.rng() * 3, z, pick([0xffe27a, 0xffffff])), ex, { onPath: true }); },
  },
  jungle: {
    sky: [0x4fc3a8, 0xd8f5e0], fog: 0xcdeed8, fogD: 0.0072, water: 0x2fb8a0, hemi: [0xeaffe8, 0x4a9a5a, 0.85], sunI: 0.8, amp: 1.3, ring: 0x4a7a4a, blob: 0x6fd05a, grass: [0x2f8a3a, 0x3fa04a, 0x287a32], fireflies: true,
    pal: { path: 0xb89a64, low: 0xe0d090, steep: 0x5a7a4a, ground: [0x2f8a3a, 0x3fa04a, 0x287a32] }, mapCol: [[30, 110, 50], [110, 190, 90]],
    deco(w, ex) { scatterT(w, 70, (x, h, z) => palm(w, x, h, z, 1 + w.rng() * 0.6), ex); scatterT(w, 60, (x, h, z) => tree(w, x, h, z, 1 + w.rng() * 0.8, pick([0x2f9a4a, 0x238a40, 0x3fae5a])), ex); scatterT(w, 40, (x, h, z) => bamboo(w, x, h, z, 5 + w.rng() * 3), ex); scatterT(w, 50, (x, h, z) => bigFlower(w, x, h, z, 0.9 + w.rng() * 0.8, pick([0xff4d8d, 0xffa23f, 0xffe27a])), ex); scatterT(w, 24, (x, h, z) => mushroom(w, x, h, z, 0.9 + w.rng(), pick([0xff5f5f, 0xff9a3d])), ex); },
  },
  space: {
    sky: [0x0a0a2a, 0x4a2a8a], fog: 0x1a1040, fogD: 0.0072, water: 0x7a3cff, hemi: [0xa89cff, 0x3a2a62, 0.8], sunI: 0.4, amp: 1.5, ring: 0x6a6a9a, blob: 0x7ae0ff, grass: [0x6a6a9a, 0x5a5a8a], fireflies: true,
    pal: { path: 0x9aa0d8, low: 0x7a7ab0, steep: 0x4a4a7a, ground: [0x5a5a8a, 0x6a6a9a, 0x4a4a7a] }, mapCol: [[40, 40, 90], [140, 140, 210]],
    deco(w, ex) { scatterT(w, 70, (x, h, z) => crystal(w, x, h, z, pick([0x34d8ff, 0xff5fd2, 0x7a5cff, 0x4af0a0]), 0.8 + w.rng() * 1.0), ex); scatterT(w, 40, (x, h, z) => rock(w, x, h, z, 0.9 + w.rng() * 1.7, 0x6a6a8a), ex); scatterT(w, 40, (x, h, z) => mushroom(w, x, h, z, 0.9 + w.rng(), pick([0x7aa0ff, 0xff7ad9, 0x6fffc0]), true), ex); scatterT(w, 60, (x, h, z) => star(w, x, h + 2 + w.rng() * 6, z, pick([0xffe27a, 0x9ad5ff, 0xff9ad5]), 1 + w.rng()), ex, { onPath: true }); [[0, 66], [20, 10], [-20, -20], [0, -40]].forEach(([x, z]) => w.lights.push({ x, y: gy(w, x, z) + 4, z, c: pick([0x9a7cff, 0x4fe0ff, 0xff7ad9]) })); },
  },
  toy: {
    sky: [0x66d0ff, 0xfff7c8], fog: 0xfff2c0, fogD: 0.005, water: 0x59c9ff, hemi: [0xffffff, 0xffe27a, 0.95], sunI: 0.95, amp: 0.7, ring: 0xff9a3d, blob: 0xff4d8d, grass: [0xffd23f, 0xffe27a],
    pal: { path: 0xff6f61, low: 0xffe9a0, steep: 0xe0a02a, ground: [0xffd23f, 0xffe27a, 0xffc02a] }, mapCol: [[240, 190, 40], [255, 240, 150]],
    deco(w, ex) { scatterT(w, 60, (x, h, z) => toyBlock(w, x, h, z, 0.8 + w.rng() * 0.9), ex); scatterT(w, 24, (x, h, z) => toyBall(w, x, h, z, 0.8 + w.rng() * 0.7), ex); scatterT(w, 36, (x, h, z) => lolly(w, x, h, z, 0.8 + w.rng() * 0.5), ex); scatterT(w, 80, (x, h, z) => flower(w, x, h, z, pick([0xff4d4d, 0x3f8fe0, 0xffffff])), ex); for (let i = 0; i < 10; i++) cloud(w, lerp(-100, 100, w.rng()), 30 + w.rng() * 14, lerp(-100, 100, w.rng()), 1.8 + w.rng()); },
  },
};

/* ---------- Genel dünya kurucu (Bambu Ormanı düzeni, ayna/tema ile farklılaşır) ---------- */
function buildExtra(d) {
  const th = XTH[d.theme], n = d.n, mx = n % 2 ? 1 : -1, X = (x) => x * mx, id = d.id;
  const flats = [[0, 72, 14, 28, 1.2], [0, -62, 32, 48, 4.0], [X(-58), 26, 9, 18, 2.5], [X(66), -8, 8, 15, 3.2], [X(-74), -34, 8, 15, 3.0]];
  const paths = [[[0, 72], [0, 48], [X(8), 28], [X(4), 6], [0, -18], [0, -34]], [[0, 48], [X(-28), 38], [X(-58), 26]], [[X(8), 28], [X(40), 12], [X(66), -8]], [[X(4), 6], [X(-30), -10], [X(-74), -34]]];
  const ph = n * 1.7, A = th.amp;
  const w = openWorld({
    id, grass: th.grass, grassCount: 9000, sky: th.sky, fog: th.fog, fogD: th.fogD, water: th.water, hemi: th.hemi, sunI: th.sunI, theme: d.theme, rx: 104, rz: 108, flats, paths,
    hills: (x, z) => A * (3.2 * Math.sin(x * 0.035 + 0.8 + ph) * Math.cos(z * 0.03 - ph) + 2.0 * Math.sin(x * 0.08 + z * 0.05 + 2) * Math.cos(z * 0.07 - x * 0.02) + 0.9 * Math.sin(x * 0.17) * Math.sin(z * 0.15)) + 2.6,
    color: (x, z, h, sl, pd) => {
      if (pd < 2.4) return th.pal.path; if (h < 0.7) return th.pal.low; if (sl > 1.1) return th.pal.steep;
      const q = Math.sin(x * 0.31) * Math.cos(z * 0.27) + Math.sin(x * 0.13 + z * 0.17); return q > 0.6 ? th.pal.ground[0] : q > -0.4 ? th.pal.ground[1] : th.pal.ground[2];
    },
  });
  w.spawn.set(0, gy(w, 0, 72) + 0.05, 72); addPortal(w, -9, gy(w, -9, 70), 70, 'village', 0xffe27a, 'Köye dön');
  signAt(w, 4, 66, `${d.emoji} ${d.name}! ${d.aname} uzaklarda bir kafeste bekliyor. Önce kötü karakteri yen!`);
  signAt(w, 4, -28, '⚔️ Patrona ağ at (N), sersemleyince yumruk vur (X)!');
  [[0, 50], [X(-50), 28], [X(4), 4], [0, -30]].forEach(([x, z]) => flagAt(w, x, z));
  [[X(-52), 31, 'x'], [X(-63), 22, 'z'], [X(-58), 33, 'x']].forEach(([x, z, a]) => blobAt(w, x, z, a, 5, 2, th.blob));
  [[-10, 58, 'x'], [12, 52, 'z'], [X(-4), 30, 'x'], [14, 18, 'z'], [X(30), 14, 'x'], [-22, -6, 'z'], [20, -12, 'x'], [-14, -24, 'x'], [28, -30, 'z'], [X(-34), 40, 'z']].forEach(([x, z, a]) => blobAt(w, x, z, a, 5, 2.2, th.blob));
  const next = XW[n + 1];
  addCage(w, d.animal, 0, gy(w, 0, -86), -86, true); addPortal(w, 10, gy(w, 10, -84), -84, 'village', 0xffe27a, 'Köye dön');
  if (next) addPortal(w, -10, gy(w, -10, -84), -84, next.id, 0x7affd0, next.name, id);
  arenaRing(w, 0, -62, 30, th.ring, Math.PI / 2);
  const bk = XW_BOSS[n % 3]; w.bossDef = { kind: bk[0], name: bk[1], x: 0, y: gy(w, 0, -62), z: -62, arena: { cx: 0, cz: -62, r: 30 } };
  hut(w, X(66), -8, 'breakable', (fh) => { addChest(w, id + 'h', X(66), fh, -10); coinRingG(w, X(66), -10, 2, 6); });
  signAt(w, X(58), -3, '🌀 Gizli kulübe! Kapıyı yuvarlanarak kır (C).');
  hut(w, X(-74), -34, 'barrier', (fh) => { addChest(w, id + 'g', X(-74), fh, -36); addCoin(w, X(-74), fh + 1.6, -34, true); });
  signAt(w, X(-66), -29, '👻 Sihirli perde! Görünmez ol (V) ve içeri gir.');
  chestAt(w, id + 'a', X(-30), -34); chestAt(w, id + 'b', X(52), 52); chestAt(w, id + 'c', X(70), -52);
  paths.forEach((p) => coinsAlong(w, p, 5)); coinRingG(w, X(-30), -34, 3, 8); coinRingG(w, X(52), 52, 3, 8); coinRingG(w, X(70), -52, 3, 8); coinRingG(w, 0, -62, 20, 18);
  sprinkleHazards(w, 6 + (n % 4), 22, [[0, -62, 34]]);
  th.deco(w, exclusions(w).concat([[0, -86, 6], [-9, 70, 5], [10, -84, 5], [-10, -84, 5]]));
  if (th.fire || th.fireflies) w.fireflies = true;
  if (!w.cloudsDone && d.theme !== 'sky' && d.theme !== 'toy' && d.theme !== 'lava' && d.theme !== 'space') for (let i = 0; i < 10; i++) cloud(w, lerp(-110, 110, w.rng()), 30 + w.rng() * 16, lerp(-110, 110, w.rng()), 1.8 + w.rng());
  return finishWorld(w);
}
XW.forEach((d) => { WORLD_BUILDERS[d.id] = () => buildExtra(d); });
