'use strict';
/* ============ Açık arazi dünyaları: Bambu Ormanı, Gizli Mağara, Buzul Dağ (boşluksuz, yürüyerek keşfedilir) ============ */
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const flatBlend = (h, x, z, f) => lerp(f[4], h, smooth(f[2], f[3], Math.hypot(x - f[0], z - f[1])));
function segDist(ax, az, bx, bz, x, z) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1) : 0;
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}
function pathDist(paths, x, z) {
  let best = 1e9;
  for (const p of paths) for (let i = 0; i < p.length - 1; i++) best = Math.min(best, segDist(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], x, z));
  return best;
}

/* ---------- Arazi ---------- */
function noiseTexture(size, base, spread, blotches) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  x.fillStyle = `rgb(${base},${base},${base})`; x.fillRect(0, 0, size, size);
  for (let i = 0; i < blotches; i++) {
    const v = Math.round(base - Math.random() * spread), r = 2 + Math.random() * 9;
    x.fillStyle = `rgba(${v},${v},${v},0.5)`; x.beginPath(); x.arc(Math.random() * size, Math.random() * size, r, 0, 6.283); x.fill();
  }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t;
}
let DETAIL_TEX = null;
function makeTerrain(w, o) {
  const half = o.half, step = o.step, n = Math.round((half * 2) / step), stride = n + 1, H = new Float32Array(stride * stride);
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) H[j * stride + i] = o.hfn(-half + i * step, -half + j * step);
  const sample = (x, z) => {
    const fx = (x + half) / step, fz = (z + half) / step;
    if (fx < 0 || fz < 0 || fx >= n || fz >= n) return -50;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const h00 = H[j * stride + i], h10 = H[j * stride + i + 1], h01 = H[(j + 1) * stride + i], h11 = H[(j + 1) * stride + i + 1];
    return u + v <= 1 ? h00 + u * (h10 - h00) + v * (h01 - h00) : h11 + (1 - u) * (h01 - h11) + (1 - v) * (h10 - h11);
  };
  const cnt = stride * stride, pos = new Float32Array(cnt * 3), nor = new Float32Array(cnt * 3), col = new Float32Array(cnt * 3), uv = new Float32Array(cnt * 2), c = new T.Color();
  const hAt = (i, j) => H[clamp(j, 0, n) * stride + clamp(i, 0, n)];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const k = j * stride + i, x = -half + i * step, z = -half + j * step, h = H[k];
    const dx = (hAt(i + 1, j) - hAt(i - 1, j)) / (2 * step), dz = (hAt(i, j + 1) - hAt(i, j - 1)) / (2 * step), l = Math.hypot(dx, 1, dz);
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = -dx / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = -dz / l;
    c.set(o.color(x, z, h, Math.hypot(dx, dz))); col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; uv[k * 2] = x / 6; uv[k * 2 + 1] = z / 6;
  }
  const idx = new Uint32Array(n * n * 6); let q = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * stride + i, b = (j + 1) * stride + i, cc = j * stride + i + 1, d = (j + 1) * stride + i + 1; idx[q++] = a; idx[q++] = b; idx[q++] = cc; idx[q++] = cc; idx[q++] = b; idx[q++] = d; }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3));
  g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(new T.BufferAttribute(idx, 1));
  DETAIL_TEX = DETAIL_TEX || noiseTexture(256, 236, 60, 900);
  const m = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, map: DETAIL_TEX })); m.receiveShadow = true; m.frustumCulled = false; w.group.add(m);
  w.groundAt = sample;
}
/* Çim demetleri (tek çizimde binlerce) */
function addGrass(w, colors, count) {
  count = Math.round(count * (save.settings.quality === 'low' ? 0.25 : 1));
  const g = geo('cone', 0.06, 0.55, 5), m = new T.MeshStandardMaterial({ roughness: 0.9, side: T.DoubleSide }), im = new T.InstancedMesh(g, m, count), d = new T.Object3D(), c = new T.Color(); let k = 0, tries = 0;
  while (k < count && tries++ < count * 6) {
    const x = lerp(-100, 100, w.rng()), z = lerp(-100, 100, w.rng()), h = w.groundAt(x, z);
    if (h < 0.9 || pathDist(w.paths, x, z) < 2.6) continue;
    const s = 0.4 + w.rng() * 0.6; d.position.set(x, h + 0.25 * s, z); d.rotation.set((w.rng() - 0.5) * 0.4, w.rng() * 6, (w.rng() - 0.5) * 0.4); d.scale.set(s, s * (0.9 + w.rng() * 0.9), s); d.updateMatrix();
    im.setMatrixAt(k, d.matrix); c.set(pick(colors)); im.setColorAt(k, c); k++;
  }
  im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.receiveShadow = true; im.frustumCulled = false; w.group.add(im);
}
function openWorld(cfg) {
  const w = newWorld(cfg.id, { sky: cfg.sky, fog: cfg.fog, fogD: cfg.fogD, water: cfg.water, hemi: cfg.hemi, sunI: cfg.sunI, theme: cfg.theme, waterY: cfg.waterY ?? -1.2, minY: (cfg.waterY ?? -1.2) - 1.4 });
  w.paths = cfg.paths || []; w.flats = cfg.flats; w.surfaceAt = cfg.surfaceAt || null;
  /* Yeryüzü: dalgalı tepeler + çukurlar (alt kısmı çamur) + tümsekler. Düz alanlara ve yollara dokunmaz. */
  const rr = mulberry(hashStr(cfg.id + 'relief')), rel = Object.assign({ pits: 7, mounds: 10, amp: 1.5 }, cfg.relief || {}), spots = [], pits = [], mounds = [];
  const roomFor = (x, z, r) => !cfg.flats.some((f) => Math.hypot(x - f[0], z - f[1]) < f[3] + r + 2) && pathDist(w.paths, x, z) > r + 4 && Math.hypot(x / cfg.rx, z / cfg.rz) < 0.74 && !spots.some((s) => Math.hypot(x - s[0], z - s[1]) < s[2] + r + 3);
  const place = (n, list, r0, r1, a0, a1, minBase = -99) => { for (let t = 0, k = 0; k < n && t < n * 120; t++) { const x = lerp(-95, 95, rr()), z = lerp(-95, 95, rr()), r = lerp(r0, r1, rr()); if (!roomFor(x, z, r) || cfg.hills(x, z) < minBase) continue; list.push({ x, z, r, a: lerp(a0, a1, rr()) }); spots.push([x, z, r]); k++; } };
  place(rel.pits, pits, 5, 8, 2.4, 3.4, rel.minBase ?? 4.2); place(rel.mounds, mounds, 7, 12, 2.6, 5.2);
  w.pits = pits; w.mounds = mounds; const floor = (cfg.waterY ?? -1.2) + 0.9;
  const hfn = (x, z) => {
    let h = cfg.hills(x, z) - 11 * smooth(0.78, 1.0, Math.hypot(x / cfg.rx, z / cfg.rz));
    h += rel.amp * (Math.sin(x * 0.115 + z * 0.06 + 1.3) * Math.cos(z * 0.1 - x * 0.04) + 0.5 * Math.sin(x * 0.21 - z * 0.17));
    for (const m of mounds) { const d = Math.hypot(x - m.x, z - m.z); if (d < m.r) h += m.a * (1 - smooth(0, m.r, d)); }
    for (const p of pits) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r) h -= Math.min(p.a * (1 - smooth(p.r * 0.42, p.r, d)), Math.max(0, h - floor)); }
    for (const f of cfg.flats) h = flatBlend(h, x, z, f);
    return h;
  };
  pits.forEach((p) => addMud(w, p.x, p.z, p.r * 0.5));
  const mudAt = (x, z) => w.mudZones.some((m) => Math.hypot(x - m.x, z - m.z) < m.r);
  makeTerrain(w, { half: 120, step: save.settings.quality === 'low' ? 3 : 2, hfn, color: (x, z, h, sl) => (mudAt(x, z) ? 0x6b4a2e : pits.some((p) => Math.hypot(x - p.x, z - p.z) < p.r * 0.75) ? 0x8a6a42 : cfg.color(x, z, h, sl, pathDist(w.paths, x, z))) });
  if (cfg.grass) addGrass(w, cfg.grass, cfg.grassCount || 16000);
  return w;
}
/* Yol kenarlarına dikenli tuzaklar ve gökyüzüne enerji balonları */
function sprinkleHazards(w, nTraps, nBalloons, avoid = []) {
  const pr = mulberry(hashStr(w.id + 'hz')), cols = [0xff5f8d, 0xffd23f, 0x5ec8ff, 0x7ed957, 0xb28bff, 0xff9a3d];
  for (let k = 0, t = 0; k < nTraps && t < 400; t++) {
    const p = pick2(w.paths, pr), i = Math.floor(pr() * (p.length - 1)), u = 0.2 + pr() * 0.6, ax = p[i][0], az = p[i][1], bx = p[i + 1][0], bz = p[i + 1][1];
    const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, off = (pr() < 0.5 ? -1 : 1) * 1.7, x = ax + dx * u - (dz / l) * off, z = az + dz * u + (dx / l) * off;
    if (Math.hypot(x, z - 72) < 16 || w.flats.some((f) => Math.hypot(x - f[0], z - f[1]) < f[2] + 4) || avoid.some((a) => Math.hypot(x - a[0], z - a[1]) < a[2]) || w.traps.some((q) => Math.hypot(x - q.x, z - q.z) < 14) || w.mudZones.some((m) => Math.hypot(x - m.x, z - m.z) < m.r + 2)) continue;
    addTrap(w, x, gy(w, x, z), z); k++;
  }
  for (let k = 0, t = 0; k < nBalloons && t < 600; t++) {
    const x = lerp(-90, 90, pr()), z = lerp(-90, 90, pr()); if (Math.hypot(x, z - 72) < 10) continue;
    const g = gy(w, x, z); if (g < -0.5 || w.balloons.some((b) => Math.hypot(x - b.x, z - b.z) < 12)) continue;
    addBalloon(w, x, g + 6 + pr() * 9, z, cols[Math.floor(pr() * cols.length)]); k++;
  }
}
const pick2 = (arr, r) => arr[Math.floor(r() * arr.length)];
const gy = (w, x, z) => w.groundAt(x, z);
function scatterT(w, n, fn, ex = [], o = {}) {
  n = Math.ceil(n * (save.settings.quality === 'low' ? 0.55 : 1));
  let placed = 0, tries = 0; const minH = o.minH ?? 0.8, reach = o.reach ?? 100;
  while (placed < n && tries++ < n * 50) {
    const x = lerp(-reach, reach, w.rng()), z = lerp(-reach, reach, w.rng()), h = gy(w, x, z);
    if (h < minH) continue;
    if (ex.some((e) => Math.hypot(x - e[0], z - e[1]) < e[2])) continue;
    if (!o.onPath && pathDist(w.paths, x, z) < 3.2) continue;
    fn(x, h, z); placed++;
  }
}
const exclusions = (w) => w.flats.map((f) => [f[0], f[1], f[2] + 3]).concat((w.pits || []).map((p) => [p.x, p.z, p.r + 2]), w.traps.map((t) => [t.x, t.z, 3]));
function coinsAlong(w, pts, every = 4) {
  for (let s = 0; s < pts.length - 1; s++) {
    const [ax, az] = pts[s], [bx, bz] = pts[s + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.floor(len / every));
    for (let i = 0; i < n; i++) { const t = i / n, x = lerp(ax, bx, t), z = lerp(az, bz, t); addCoin(w, x, gy(w, x, z) + 1.15, z); }
  }
}
function coinRingG(w, cx, cz, r, n) { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; addCoin(w, x, gy(w, x, z) + 1.15, z); } }
const blobAt = (w, x, z, axis, range, speed, color) => addBlob(w, x, gy(w, x, z), z, axis, range, speed, color);
const flagAt = (w, x, z) => addFlag(w, x, gy(w, x, z), z);
const chestAt = (w, key, x, z) => addChest(w, key, x, gy(w, x, z), z);
const signAt = (w, x, z, text) => addSign(w, x, gy(w, x, z), z, text);

/* Gizli kulübe: kapısı tahta (yuvarlanarak kırılır) ya da sihirli perde (görünmezken geçilir) */
function hut(w, cx, cz, door, inner) {
  const fh = gy(w, cx, cz), top = fh + 5, st = { h: 9, type: 'stone', color: 0x6d6a80, top: 0x8c88a2 };
  const walls = [solid(w, cx, top, cz - 3.5, 9, 1, st), solid(w, cx - 4, top, cz, 1, 8, st), solid(w, cx + 4, top, cz, 1, 8, st), solid(w, cx - 3, top, cz + 3.5, 3, 1, st), solid(w, cx + 3, top, cz + 3.5, 3, 1, st)];
  const d = door === 'barrier' ? addBarrier(w, cx, fh, cz + 3.5, 3, 1.1, 5) : addBreakable(w, cx, fh, cz + 3.5, 3, 1, 5);
  addBeacon(w, cx, fh, cz + 1, door === 'barrier' ? 0xb28bff : 0xffb347, door === 'barrier' ? 52 : 34);
  const rec = { cx, cz, fh, walls, door: d, kind: door }; (w.huts || (w.huts = [])).push(rec);
  walls.forEach((s) => { s.hutWall = true; s.hut = rec; }); d.hutDoor = true; d.hut = rec;
  inner(fh);
}
/* Boss arenası: taş halka (giriş boşluklu) */
function arenaRing(w, cx, cz, r, col, entry) {
  const n = 40;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2; if (Math.abs(angDiff(a, entry)) < 0.3) continue;
    const x = cx + Math.cos(a) * (r + 1.5), z = cz + Math.sin(a) * (r + 1.5), s = 1.8 + w.rng() * 1.6;
    rock(w, x, gy(w, x, z) - 0.2, z, s, i % 5 === 0 ? col + 0x151515 : col);
  }
}

/* ---------- DÜNYA 1: Bambu Ormanı ---------- */
function buildW1() {
  const flats = [[0, 72, 14, 28, 1.2], [0, -62, 32, 48, 4.0], [-58, 26, 9, 18, 2.5], [66, -8, 8, 15, 3.2], [-74, -34, 8, 15, 3.0]];
  const paths = [[[0, 72], [0, 48], [8, 28], [4, 6], [0, -18], [0, -34]], [[0, 48], [-28, 38], [-58, 26]], [[8, 28], [40, 12], [66, -8]], [[4, 6], [-30, -10], [-74, -34]]];
  const w = openWorld({
    id: 'w1', grass: [0x5fb83e, 0x6fcf4a, 0x4ea835, 0x86dc5a], sky: [0x66d0ff, 0xe3f9d8], fog: 0xe3f9d8, fogD: 0.0058, water: 0x4fc3b0, hemi: [0xffffff, 0x8fcf80, 0.85], sunI: 0.9, theme: 'forest', rx: 104, rz: 108, flats, paths,
    hills: (x, z) => 3.4 * Math.sin(x * 0.035 + 0.8) * Math.cos(z * 0.03) + 2.2 * Math.sin(x * 0.08 + z * 0.05 + 2) * Math.cos(z * 0.07 - x * 0.02) + 1.0 * Math.sin(x * 0.17) * Math.sin(z * 0.15) + 2.5,
    color: (x, z, h, sl, pd) => {
      if (pd < 2.4) return 0xc9a56b; if (h < 0.7) return 0xf0e0a8; if (sl > 1.1) return 0x9a9484;
      const n = Math.sin(x * 0.31) * Math.cos(z * 0.27) + Math.sin(x * 0.13 + z * 0.17); return n > 0.6 ? 0x6fcf4a : n > -0.4 ? 0x7fdc58 : 0x62bd45;
    },
  });
  w.spawn.set(0, gy(w, 0, 72) + 0.05, 72); addPortal(w, -9, gy(w, -9, 70), 70, 'village', 0xffe27a, 'Köye dön');
  signAt(w, 4, 66, '🌿 Bambu Ormanı! Tavşan Tosun batıda bir açıklıkta saklanıyor.');
  signAt(w, 4, -28, '🐭 Dev Fare’yi duvara çarptır, sersemleyince ona dokun!');
  [[0, 50], [-50, 28], [4, 4], [0, -30]].forEach(([x, z]) => flagAt(w, x, z));
  addCage(w, 'tavsan', -58, gy(w, -58, 26), 26, false);
  [[-52, 31, 'x'], [-63, 22, 'z'], [-58, 33, 'x']].forEach(([x, z, a]) => blobAt(w, x, z, a, 5, 2));
  [[-10, 58, 'x'], [12, 52, 'z'], [-4, 30, 'x'], [14, 18, 'z'], [30, 14, 'x'], [-22, -6, 'z'], [20, -12, 'x'], [-14, -24, 'x'], [28, -30, 'z'], [-34, 40, 'z']].forEach(([x, z, a]) => blobAt(w, x, z, a, 5, 2.2));
  const A = { cx: 0, cz: -62, r: 30 };
  addCage(w, 'kaplumbaga', 0, gy(w, 0, -86), -86, true); addPortal(w, 10, gy(w, 10, -84), -84, 'village', 0xffe27a, 'Köye dön');
  arenaRing(w, 0, -62, 30, 0x7a8a6a, Math.PI / 2);
  w.bossDef = { kind: 'devfare', name: 'Dev Fare', x: 0, y: gy(w, 0, -62), z: -62, arena: A };
  hut(w, 66, -8, 'breakable', (fh) => { addChest(w, 'w1h', 66, fh, -10); coinRingG(w, 66, -10, 2, 6); });
  signAt(w, 58, -3, '🌀 Gizli kulübe! Kapıyı yuvarlanarak kır (C).');
  hut(w, -74, -34, 'barrier', (fh) => { addChest(w, 'w1g', -74, fh, -36); addCoin(w, -74, fh + 1.6, -34, true); });
  signAt(w, -66, -29, '👻 Sihirli perde! Görünmez ol (V) ve içeri gir. Mor ışık sütununu takip et!');
  chestAt(w, 'w1a', -30, -34); chestAt(w, 'w1b', 52, 52); chestAt(w, 'w1c', 70, -52);
  paths.forEach((p) => coinsAlong(w, p, 5)); coinRingG(w, -30, -34, 3, 8); coinRingG(w, 52, 52, 3, 8); coinRingG(w, 70, -52, 3, 8);
  coinRingG(w, 0, -62, 20, 18);
  sprinkleHazards(w, 7, 22, [[0, -62, 34]]);
  const ex = exclusions(w).concat([[0, -86, 6], [-9, 70, 5]]);
  const groves = [[-40, 60], [45, 38], [-60, -8], [38, -20], [60, 10], [-20, -50], [30, -56], [-50, 55], [70, 62], [-84, 20], [20, 88], [-30, 86], [84, -30], [-90, -60]];
  groves.forEach(([cx, cz]) => { for (let i = 0; i < 6; i++) { const x = cx + w.rng() * 11 - 5.5, z = cz + w.rng() * 11 - 5.5, h = gy(w, x, z); if (h > 0.6 && Math.hypot(x, z + 62) > 36) bamboo(w, x, h, z, 5 + w.rng() * 3); } });
  scatterT(w, 90, (x, h, z) => tree(w, x, h, z, 0.9 + w.rng() * 0.8, pick([0x3fae5a, 0x4fc060, 0x35a055])), ex);
  scatterT(w, 40, (x, h, z) => rock(w, x, h, z, 0.7 + w.rng() * 1.4), ex);
  scatterT(w, 240, (x, h, z) => flower(w, x, h, z, pick([0xff7eb6, 0xffd23f, 0xffffff, 0x8fd0ff])), ex);
  scatterT(w, 24, (x, h, z) => mushroom(w, x, h, z, 0.8 + w.rng() * 0.8, pick([0xff5f5f, 0xffa24a])), ex);
  for (let i = 0; i < 12; i++) cloud(w, lerp(-110, 110, w.rng()), 30 + w.rng() * 16, lerp(-110, 110, w.rng()), 1.8 + w.rng());
  return finishWorld(w);
}

/* ---------- DÜNYA 2: Gizli Mağara ---------- */
function buildW2() {
  const flats = [[0, 72, 14, 28, 1.5], [28, -62, 32, 48, 4.5], [-64, 8, 8, 15, 3.5], [70, 24, 8, 15, 3.0], [-30, -44, 8, 15, 3.2]];
  const paths = [[[0, 72], [0, 50], [-6, 26], [10, 2], [24, -30]], [[-6, 26], [-34, 16], [-64, 8]], [[10, 2], [40, 12], [70, 24]], [[10, 2], [-14, -20], [-30, -44]]];
  const w = openWorld({
    id: 'w2', grass: [0x6a5fb8, 0x5a8fb8, 0x7a5cd6], grassCount: 9000, sky: [0x1b0d36, 0x4a2a78], fog: 0x2a1648, fogD: 0.0085, water: 0x6a3cff, hemi: [0xa89cff, 0x3a2a62, 0.8], sunI: 0.45, theme: 'cave', rx: 104, rz: 108, flats, paths,
    hills: (x, z) => 5 * Math.sin(x * 0.04) * Math.cos(z * 0.035) + 3 * Math.sin(x * 0.09 + z * 0.06) * Math.cos(z * 0.08) + 1.4 * Math.sin(x * 0.2) * Math.sin(z * 0.17) + 3.2,
    color: (x, z, h, sl, pd) => {
      if (pd < 2.4) return 0x8a80c4; if (h < 0.5) return 0x6a5ea0; if (sl > 1.2) return 0x4a3f72;
      const n = Math.sin(x * 0.33) * Math.cos(z * 0.29) + Math.sin(x * 0.11 + z * 0.19); return n > 0.5 ? 0x6a5f98 : n > -0.5 ? 0x5a5088 : 0x4e4578;
    },
  });
  w.spawn.set(0, gy(w, 0, 72) + 0.05, 72); addPortal(w, -9, gy(w, -9, 70), 70, 'village', 0xffe27a, 'Köye dön');
  signAt(w, 4, 66, '💎 Kristaller yolunu aydınlatır. Kedi Pati batıdaki gizli kulübede!');
  signAt(w, 38, -34, '🐯 Kaplan hızlı! Duvara çarpınca sersemler!');
  [[0, 50], [-30, 18], [10, 2], [24, -30]].forEach(([x, z]) => flagAt(w, x, z));
  hut(w, -64, 8, 'breakable', (fh) => { addCage(w, 'kedi', -64, fh, 6, false); });
  signAt(w, -56, 13, '🌀 Kulübenin tahta kapısını yuvarlanarak kır (C)!');
  [[-58, 20, 'x'], [-70, 20, 'x'], [-52, 4, 'z']].forEach(([x, z, a]) => blobAt(w, x, z, a, 5, 2, 0x6fe0ff));
  [[-8, 56, 'x'], [10, 44, 'z'], [-14, 22, 'x'], [22, 4, 'z'], [0, -10, 'x'], [34, 18, 'x'], [50, 28, 'z'], [-24, -22, 'z'], [16, -24, 'x']].forEach(([x, z, a]) => blobAt(w, x, z, a, 5, 2.2, 0x6fe0ff));
  const A = { cx: 28, cz: -62, r: 30 };
  addCage(w, 'tilki', 28, gy(w, 28, -86), -86, true); addPortal(w, 38, gy(w, 38, -84), -84, 'village', 0xffe27a, 'Köye dön');
  arenaRing(w, 28, -62, 30, 0x4a4272, Math.PI / 2);
  w.bossDef = { kind: 'kaplan', name: 'Kaplan', x: 28, y: gy(w, 28, -62), z: -62, arena: A };
  hut(w, 70, 24, 'breakable', (fh) => { addChest(w, 'w2h', 70, fh, 22); coinRingG(w, 70, 22, 2, 6); });
  hut(w, -30, -44, 'barrier', (fh) => { addChest(w, 'w2g', -30, fh, -46); addCoin(w, -30, fh + 1.6, -44, true); });
  signAt(w, -22, -38, '👻 Sihirli perde! Görünmez ol (V) ve içeri gir.');
  chestAt(w, 'w2a', 56, -20); chestAt(w, 'w2b', -50, 60); chestAt(w, 'w2c', 80, 70);
  paths.forEach((p) => coinsAlong(w, p, 5)); coinRingG(w, 56, -20, 3, 8); coinRingG(w, -50, 60, 3, 8); coinRingG(w, 80, 70, 3, 8); coinRingG(w, 28, -62, 20, 18);
  sprinkleHazards(w, 8, 22, [[28, -62, 34]]);
  const ex = exclusions(w).concat([[28, -86, 6], [-9, 70, 5]]);
  const cols = [0x7a5cff, 0x34d8ff, 0xff5fd2, 0x4af0a0];
  scatterT(w, 90, (x, h, z) => crystal(w, x, h, z, pick(cols), 0.7 + w.rng() * 0.9), ex);
  scatterT(w, 50, (x, h, z) => mushroom(w, x, h, z, 0.9 + w.rng() * 1.0, pick([0x7aa0ff, 0xff7ad9, 0x6fffc0]), true), ex);
  scatterT(w, 40, (x, h, z) => { const ht = 7 + w.rng() * 7, c = mesh(geo('cone', 1.1, ht, 6), M(0x5a4f86), x, h + 3, z); c.castShadow = true; addD(w, c); blockAt(w, x, h, z, 0.8, ht * 0.6); }, ex);
  scatterT(w, 30, (x, h, z) => rock(w, x, h, z, 0.8 + w.rng() * 1.6, 0x6a6490), ex);
  [[0, 3, 66, 0x7ad0ff], [-30, 3, 18, 0x9a7cff], [10, 3, 2, 0xff7ad9], [28, 3, -40, 0x9a7cff], [-64, 3, 14, 0xffe27a], [70, 3, 30, 0x4fe0ff]].forEach(([x, up, z, c]) => w.lights.push({ x, y: gy(w, x, z) + up + 2, z, c }));
  w.fireflies = true;
  return finishWorld(w);
}

/* ---------- DÜNYA 3: Buzul Dağ ---------- */
function buildW3() {
  const flats = [[0, 72, 14, 28, 1.2], [-30, -62, 32, 48, 4.0], [-48, 6, 24, 30, 1.0], [72, -20, 8, 15, 3.2], [62, 44, 8, 15, 3.0]];
  const paths = [[[0, 72], [0, 52], [-8, 30], [-20, 6], [-26, -20], [-30, -36]], [[-8, 30], [20, 22], [62, 44]], [[0, 52], [30, 40], [50, 10], [72, -20]]];
  const lake = (x, z) => Math.hypot(x + 48, z - 6) < 25;
  const w = openWorld({
    id: 'w3', sky: [0x9fd8ff, 0xfff0f6], fog: 0xeaf6ff, fogD: 0.0058, water: 0x2f78b8, hemi: [0xffffff, 0xa8c8ee, 0.95], sunI: 0.85, theme: 'ice', rx: 104, rz: 108, flats, paths, surfaceAt: lake,
    hills: (x, z) => 3.2 * Math.sin(x * 0.03) * Math.cos(z * 0.028) + 2 * Math.sin(x * 0.07 + 1) * Math.sin(z * 0.06) + 0.9 * Math.sin(x * 0.18) * Math.cos(z * 0.16) + 3,
    color: (x, z, h, sl, pd) => {
      if (lake(x, z) && sl < 0.3) return Math.sin(x * 0.5 + z * 0.4) > 0.3 ? 0xa6dcfa : 0x93d0f5;
      if (pd < 2.4) return 0xbad0e4; if (h < 0.7) return 0xcfe0ee; if (sl > 1.1) return 0x9db4cb;
      const n = Math.sin(x * 0.3) * Math.cos(z * 0.26) + Math.sin(x * 0.12 + z * 0.15); return n > 0.5 ? 0xf1f8fd : n > -0.4 ? 0xe2eff8 : 0xd6e6f3;
    },
  });
  w.spawn.set(0, gy(w, 0, 72) + 0.05, 72); addPortal(w, -9, gy(w, -9, 70), 70, 'village', 0xffe27a, 'Köye dön');
  signAt(w, 4, 66, '❄️ Buzul Dağ! Gölün üzeri kaygan. Minik Bambi dağın ucunda.');
  signAt(w, -22, -34, '🐻 Kötü Ayı çok büyük! Duvara çarpınca sersemler.');
  [[0, 52], [-20, 8], [-28, -24]].forEach(([x, z]) => flagAt(w, x, z)); flagAt(w, 50, 10);
  const A = { cx: -30, cz: -62, r: 30 };
  addCage(w, 'minipanda', -30, gy(w, -30, -86), -86, true); addPortal(w, -20, gy(w, -20, -84), -84, 'village', 0xffe27a, 'Köye dön'); addPortal(w, -40, gy(w, -40, -84), -84, 'w4', 0x7affd0, 'Altın Çöl', 'w3');
  arenaRing(w, -30, -62, 30, 0x9ab4cc, Math.PI / 2);
  w.bossDef = { kind: 'ayi', name: 'Kötü Ayı', x: -30, y: gy(w, -30, -62), z: -62, arena: A };
  [[-8, 56, 'x'], [14, 44, 'z'], [-12, 28, 'x'], [24, 24, 'z'], [40, 22, 'x'], [-60, 10, 'z'], [-40, 24, 'x'], [-50, -8, 'x'], [-22, -14, 'z'], [52, -6, 'z']].forEach(([x, z, a]) => blobAt(w, x, z, a, 5, 2.2, 0x8fdcff));
  hut(w, 72, -20, 'barrier', (fh) => { addChest(w, 'w3g', 72, fh, -22); addCoin(w, 72, fh + 1.6, -20, true); coinRingG(w, 72, -22, 2, 6); });
  signAt(w, 64, -14, '👻 Sihirli perde! Görünmez ol (V) ve içeri gir.');
  hut(w, 62, 44, 'breakable', (fh) => { addChest(w, 'w3h', 62, fh, 42); coinRingG(w, 62, 42, 2, 6); });
  chestAt(w, 'w3a', -70, 50); chestAt(w, 'w3b', 40, -50); chestAt(w, 'w3c', -80, -30);
  paths.forEach((p) => coinsAlong(w, p, 5)); coinRingG(w, -70, 50, 3, 8); coinRingG(w, 40, -50, 3, 8); coinRingG(w, -80, -30, 3, 8); coinRingG(w, -30, -62, 20, 18);
  sprinkleHazards(w, 7, 22, [[-30, -62, 34], [-48, 6, 28]]);
  const ex = exclusions(w).concat([[-30, -86, 6], [-9, 70, 5]]);
  scatterT(w, 110, (x, h, z) => pine(w, x, h, z, 0.9 + w.rng() * 0.9), ex);
  scatterT(w, 40, (x, h, z) => iceSpike(w, x, h, z, 0.8 + w.rng() * 1.2), ex);
  scatterT(w, 14, (x, h, z) => snowman(w, x, h, z, 0.9 + w.rng() * 0.4), ex);
  scatterT(w, 30, (x, h, z) => rock(w, x, h, z, 0.8 + w.rng() * 1.5, 0xaebfd0), ex);
  [[18, 62], [-20, 58], [30, 54]].forEach(([x, z]) => igloo(w, x, gy(w, x, z), z));
  for (let i = 0; i < 12; i++) cloud(w, lerp(-110, 110, w.rng()), 30 + w.rng() * 16, lerp(-110, 110, w.rng()), 2 + w.rng());
  return finishWorld(w);
}
Object.assign(WORLD_BUILDERS, { w1: buildW1, w2: buildW2, w3: buildW3 });
