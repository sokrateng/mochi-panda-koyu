'use strict';
/* ============ Dünyalar: köy + Bambu Ormanı + Gizli Mağara + Buzul Dağ ============ */
const BOX = () => geo('box', 1, 1, 1);

function newWorld(id, o) {
  const w = Object.assign({
    id, group: new T.Group(), decor: new T.Group(), solids: [], movers: [], crumbles: [], breakables: [], barriers: [], springs: [],
    coins: [], blobs: [], chests: [], cages: [], flags: [], portals: [], signs: [], interacts: [], npcs: [], lights: [], bossDef: null,
    spawn: new T.Vector3(0, 0, 0), minY: -12, waterY: -3.2, groundAt: null, surfaceAt: null, rng: mulberry(hashStr(id)),
  }, o);
  w.group.add(w.decor); return w;
}
const add = (w, obj) => { w.group.add(obj); return obj; };
const addD = (w, obj) => { w.decor.add(obj); return obj; };

/* Hareketsiz dekoru malzemeye göre tek bir mesh'e birleştirir (çizim sayısını düşürür) */
function mergeGroup(group) {
  group.updateMatrixWorld(true);
  const byMat = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push({ g, m: o.matrixWorld });
  });
  const out = new T.Group(), v = new T.Vector3(), nm = new T.Matrix3();
  byMat.forEach((list, mat) => {
    let n = 0; list.forEach(({ g }) => { n += g.attributes.position.count; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let off = 0;
    list.forEach(({ g, m }) => {
      nm.getNormalMatrix(m); const p = g.attributes.position, nn = g.attributes.normal;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m); pos[(off + i) * 3] = v.x; pos[(off + i) * 3 + 1] = v.y; pos[(off + i) * 3 + 2] = v.z;
        v.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize(); nor[(off + i) * 3] = v.x; nor[(off + i) * 3 + 1] = v.y; nor[(off + i) * 3 + 2] = v.z;
      }
      off += p.count;
    });
    const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.BufferAttribute(pos, 3)); bg.setAttribute('normal', new T.BufferAttribute(nor, 3));
    const me = new T.Mesh(bg, mat); me.castShadow = true; me.receiveShadow = true; me.frustumCulled = false; out.add(me);
  });
  return out;
}
function finishWorld(w) { const merged = mergeGroup(w.decor); w.group.remove(w.decor); w.group.add(merged); return w; }

/* ---------- Zemin ve platformlar ---------- */
const TYPES = {
  grass: [0x8a5a3a, 0x7ed957], stone: [0x4a4468, 0x6e689a], ice: [0x7fb4dd, 0xcaeeff], snow: [0x8db5d6, 0xd3e7f5],
  wood: [0x8b5a2b, 0xc9924e], sand: [0xd9c28a, 0xf2e3b0], bridge: [0x7a5230, 0xb98550],
};
function solid(w, cx, top, cz, sx, sz, o = {}) {
  const h = o.h ?? 4, type = o.type || 'grass', col = TYPES[type];
  const g = new T.Group(); g.position.set(cx, 0, cz);
  const b = mesh(BOX(), M(o.color ?? col[0]), 0, top - h / 2, 0); b.scale.set(sx, h, sz); g.add(b);
  const t = mesh(BOX(), M(o.top ?? col[1]), 0, top - 0.2, 0); t.scale.set(sx + 0.15, 0.4, sz + 0.15); g.add(t);
  g.traverse((c) => { if (c.isMesh) { c.receiveShadow = true; c.castShadow = true; } });
  add(w, g);
  const s = { minx: cx - sx / 2, maxx: cx + sx / 2, miny: top - h, maxy: top, minz: cz - sz / 2, maxz: cz + sz / 2, type, active: true, mesh: g, w: sx, d: sz, h };
  w.solids.push(s); return s;
}
function addMover(w, cx, top, cz, sx, sz, ax, az, amp, period, o = {}) {
  const s = solid(w, cx, top, cz, sx, sz, { h: 1.2, type: 'wood', ...o });
  s.mover = { ox: cx, oz: cz, ax, az, amp, period, dx: 0, dz: 0, px: cx, pz: cz }; w.movers.push(s); return s;
}
function addCrumble(w, cx, top, cz, sx, sz, delay = 0.55, type = 'wood') {
  const s = solid(w, cx, top, cz, sx, sz, { h: 0.9, type, color: type === 'ice' ? 0x9fd4f2 : 0x6a4524, top: type === 'ice' ? 0xdff6ff : 0xb98550 });
  s.crumble = { state: 'idle', t: 0, delay, oy: 0, vy: 0 }; w.crumbles.push(s); return s;
}
function addBreakable(w, cx, y, cz, sx, sz, h = 6) {
  const g = new T.Group(); g.position.set(cx, y, cz);
  const planks = Math.round(h / 0.75);
  for (let i = 0; i < planks; i++) { const p = mesh(BOX(), M(i % 2 ? 0xb07a43 : 0x9c6a3a), 0, 0.375 + i * 0.75, 0); p.scale.set(sx, 0.7, sz); g.add(p); }
  const x = mesh(BOX(), M(0x5b3a1c), 0, h / 2, sz / 2 + 0.03); x.scale.set(sx * 0.9, 0.18, 0.05); x.rotation.z = 0.5; g.add(x);
  const y2 = mesh(BOX(), M(0x5b3a1c), 0, h / 2, sz / 2 + 0.03); y2.scale.set(sx * 0.9, 0.18, 0.05); y2.rotation.z = -0.5; g.add(y2);
  shadowAll(g, true, true); add(w, g);
  const s = { minx: cx - sx / 2, maxx: cx + sx / 2, miny: y, maxy: y + h, minz: cz - sz / 2, maxz: cz + sz / 2, type: 'wood', active: true, mesh: g, breakable: true };
  w.solids.push(s); w.breakables.push(s); return s;
}
function addBarrier(w, cx, y, cz, sx, sz, h = 6.4) {
  const m = mesh(BOX(), new T.MeshBasicMaterial({ color: 0xb28bff, transparent: true, opacity: 0.38, depthWrite: false }), cx, y + h / 2, cz); m.scale.set(sx, h, sz);
  const edge = mesh(BOX(), new T.MeshBasicMaterial({ color: 0xe9dcff, transparent: true, opacity: 0.65 }), cx, y + h / 2, cz); edge.scale.set(sx + 0.02, 0.15, sz + 0.02);
  add(w, m); add(w, edge);
  const s = { minx: cx - sx / 2, maxx: cx + sx / 2, miny: y, maxy: y + h, minz: cz - sz / 2, maxz: cz + sz / 2, type: 'barrier', active: true, mesh: m, barrier: true, edge };
  w.solids.push(s); w.barriers.push(s); return s;
}
function addSpring(w, x, y, z) {
  const g = new T.Group(); g.position.set(x, y, z);
  g.add(mesh(geo('cyl', 0.7, 0.8, 0.25), M(0xd33b3b), 0, 0.12, 0)); const pad = mesh(geo('cyl', 0.62, 0.62, 0.14), M(0xffd23f), 0, 0.42, 0); g.add(pad);
  shadowAll(g); add(w, g); w.springs.push({ x, y, z, mesh: g, pad, t: 0 });
}

/* ---------- Toplanabilirler / varlıklar ---------- */
function addCoin(w, x, y, z, gem = false) {
  const g = new T.Group(); g.position.set(x, y, z);
  if (gem) { const o = mesh(geo('oct', 0.42), M(0x45c7ff, { emissive: 0x1a6a99, flatShading: true, roughness: 0.15, metalness: 0.3 }), 0, 0, 0); o.scale.y = 1.3; g.add(o); }
  else { const c = mesh(geo('cyl', 0.36, 0.36, 0.1, 14), M(0xffc929, { emissive: 0x5a3b00, metalness: 0.6, roughness: 0.3 }), 0, 0, 0); c.rotation.x = Math.PI / 2; g.add(c);
    const r = mesh(geo('cyl', 0.27, 0.27, 0.13, 14), M(0xffe27a, { emissive: 0x5a3b00, metalness: 0.6, roughness: 0.3 }), 0, 0, 0); r.rotation.x = Math.PI / 2; g.add(r); }
  add(w, g); w.coins.push({ mesh: g, x, y, z, val: gem ? 5 : 1, gem, taken: false, ph: Math.random() * 6 });
}
function coinLine(w, x1, y1, z1, x2, y2, z2, n, arc = 0) {
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); addCoin(w, lerp(x1, x2, t), lerp(y1, y2, t) + Math.sin(t * Math.PI) * arc, lerp(z1, z2, t)); }
}
function coinRing(w, x, y, z, r, n) { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; addCoin(w, x + Math.cos(a) * r, y, z + Math.sin(a) * r); } }
function addBlob(w, x, y, z, axis, range, speed, color) {
  const m = makeBlob(color); m.position.set(x, y, z); add(w, m);
  w.blobs.push({ mesh: m, ox: x, oy: y, oz: z, axis, range, speed, t: Math.random() * 6, alive: true, respawn: 0, squash: 0, x, z });
}
function addChest(w, key, x, y, z) {
  const g = new T.Group(); g.position.set(x, y, z);
  g.add(mesh(BOX(), M(0x9c5a2a), 0, 0.35, 0)).scale.set(1.1, 0.7, 0.8);
  const lid = new T.Group(); lid.position.set(0, 0.7, -0.4); const lm = mesh(geo('cyl', 0.4, 0.4, 1.1, 10), M(0xb86a30), 0, 0, 0.4); lm.rotation.z = Math.PI / 2; lm.scale.set(1, 1, 1); lid.add(lm);
  g.add(lid); g.add(mesh(BOX(), M(0xffc83a), 0, 0.55, 0.42)).scale.set(0.2, 0.28, 0.06); g.add(mesh(BOX(), M(0xffc83a), 0, 0.35, 0.41)).scale.set(1.12, 0.1, 0.84);
  shadowAll(g); add(w, g); w.chests.push({ key, x, y, z, mesh: g, lid, open: false, t: 0 });
}
function addCage(w, fid, x, y, z, needBoss) {
  const g = new T.Group(); g.position.set(x, y, z);
  const kind = fid; const cr = makeCreature(kind); cr.position.y = 0.05; g.add(cr);
  const barM = M(0x9aa3b5); const bars = new T.Group(); g.add(bars);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; bars.add(mesh(geo('cyl', 0.06, 0.06, 2.6, 5), barM, Math.sin(a) * 1.25, 1.3, Math.cos(a) * 1.25)); }
  const top = mesh(geo('cyl', 1.35, 1.35, 0.1, 12), barM, 0, 2.6, 0); bars.add(top); const bot = mesh(geo('cyl', 1.35, 1.35, 0.15, 12), M(0x6b7388), 0, 0.05, 0); bars.add(bot);
  let lock = null; if (needBoss) { lock = mesh(BOX(), M(0xffc83a), 0, 1.2, 1.3); lock.scale.set(0.5, 0.45, 0.2); bars.add(lock); }
  shadowAll(g); add(w, g); w.cages.push({ fid, x, y, z, mesh: g, bars, creature: cr, needBoss, lock, freed: false, t: 0 });
}
function addFlag(w, x, y, z) {
  const g = new T.Group(); g.position.set(x, y, z);
  g.add(mesh(geo('cyl', 0.07, 0.07, 2.4, 6), M(0xe8e8f0), 0, 1.2, 0));
  const f = mesh(geo('cone', 0.45, 0.9, 3), M(0xff6f61, { flatShading: true }), 0.4, 2.05, 0); f.rotation.z = -Math.PI / 2; g.add(f);
  g.add(mesh(geo('sph', 0.12, 6, 6), M(0xffc83a), 0, 2.45, 0)); shadowAll(g); add(w, g); w.flags.push({ x, y, z, flag: f, hit: false });
}
function addSign(w, x, y, z, text) {
  const g = new T.Group(); g.position.set(x, y, z);
  g.add(mesh(geo('cyl', 0.07, 0.09, 1.2, 5), M(0x7a4a22), 0, 0.6, 0)); const b = mesh(BOX(), M(0xd6a15d), 0, 1.25, 0); b.scale.set(1.0, 0.6, 0.1); g.add(b);
  g.add(mesh(BOX(), M(0x8b5a2b), 0, 1.25, 0.06)).scale.set(0.75, 0.08, 0.02); g.add(mesh(BOX(), M(0x8b5a2b), 0, 1.1, 0.06)).scale.set(0.75, 0.08, 0.02);
  shadowAll(g); add(w, g); w.signs.push({ x, y, z, text });
}
function addPortal(w, x, y, z, dest, color, label, lockedBy) {
  const g = new T.Group(); g.position.set(x, y, z);
  const pm = M(0xd8cfb8); [-1.6, 1.6].forEach((s) => g.add(mesh(geo('cyl', 0.38, 0.45, 4.2, 8), pm, s, 2.1, 0)));
  const arch = mesh(geo('tor', 1.6, 0.38, 20), pm, 0, 4.2, 0); arch.scale.set(1, 0.85, 0.9); g.add(arch);
  const disc = mesh(geo('cyl', 1.5, 1.5, 0.12, 20), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }), 0, 2.15, 0); disc.rotation.x = Math.PI / 2; disc.scale.set(1, 1, 1); g.add(disc);
  disc.scale.set(1, 1, 1);
  shadowAll(g); add(w, g);
  w.portals.push({ x, y, z, dest, label, lockedBy, mesh: g, disc, color });
}
function addInteract(w, x, z, r, label, fn) { w.interacts.push({ x, z, r, label, fn }); }

/* ---------- Dekor ---------- */
function tree(w, x, y, z, s = 1, col = 0x3fae5a) {
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
  g.add(mesh(geo('cyl', 0.24, 0.42, 1.9, 12), M(0x6f4522, { roughness: 1 }), 0, 0.95, 0));
  const sd = Math.floor(w.rng() * 5);
  g.add(mesh(geo('blob', 1.35, sd), M(col), 0, 2.6, 0)).scale.set(1, 0.9, 1); g.add(mesh(geo('blob', 1.0, sd + 1), M(col + 0x0a1408), 0.75, 2.3, 0.35));
  g.add(mesh(geo('blob', 1.05, sd + 2), M(col + 0x081006), -0.7, 3.2, -0.25)); g.add(mesh(geo('blob', 0.8, sd + 3), M(col + 0x101c0c), 0.1, 3.75, 0.3));
  shadowAll(g); addD(w, g);
}
function bamboo(w, x, y, z, h = 5) {
  const g = new T.Group(); g.position.set(x, y, z);
  for (let k = 0; k < 3; k++) {
    const bx = (k - 1) * 0.45 + (w.rng() - 0.5) * 0.2, bz = (w.rng() - 0.5) * 0.5, hh = h * (0.75 + w.rng() * 0.4), col = [0x6fcf4a, 0x58b83d, 0x7fdc5a][k];
    g.add(mesh(geo('cyl', 0.13, 0.15, hh, 10), M(col, { roughness: 0.55 }), bx, hh / 2, bz));
    for (let j = 1; j < hh / 1.2; j++) g.add(mesh(geo('cyl', 0.17, 0.17, 0.07, 10), M(0x3f8a2c), bx, j * 1.2, bz));
    const l = mesh(geo('cone', 0.12, 0.9, 4), M(0x4cc03a), bx + 0.3, hh - 0.2, bz); l.rotation.z = -1.1; g.add(l);
    const l2 = mesh(geo('cone', 0.12, 0.9, 4), M(0x4cc03a), bx - 0.3, hh - 0.5, bz); l2.rotation.z = 1.1; g.add(l2);
  }
  shadowAll(g); addD(w, g);
}
function rock(w, x, y, z, s = 1, col = 0x9a9ab0) { const r = mesh(geo('blob', 0.8, Math.floor(w.rng() * 5)), M(col, { roughness: 0.95 }), x, y + 0.3 * s, z); r.scale.set(s * 1.2, s * 0.8, s); r.rotation.y = w.rng() * 6; r.castShadow = true; addD(w, r); }
function flower(w, x, y, z, col) {
  const g = new T.Group(); g.position.set(x, y, z); g.add(mesh(geo('cyl', 0.03, 0.03, 0.4, 4), M(0x3f9b3a), 0, 0.2, 0)); g.add(mesh(geo('sph', 0.12, 6, 5), M(col), 0, 0.45, 0)); g.add(mesh(geo('sph', 0.05, 5, 4), M(0xffd23f), 0, 0.5, 0.07)); addD(w, g);
}
function mushroom(w, x, y, z, s, col = 0xff5f5f, glow = false) {
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
  g.add(mesh(geo('cyl', 0.14, 0.18, 0.5, 6), M(0xfff1d6), 0, 0.25, 0)); g.add(mesh(geo('half', 0.45), M(col, glow ? { emissive: col, emissiveIntensity: 0.6 } : {}), 0, 0.45, 0)); addD(w, g);
}
function crystal(w, x, y, z, col, s = 1) {
  const g = new T.Group(); g.position.set(x, y, z);
  for (let i = 0; i < 3; i++) { const c = mesh(geo('cone', 0.28, 1.4 + i * 0.4, 5), M(col, { emissive: col, emissiveIntensity: 0.55, flatShading: true, roughness: 0.25, metalness: 0.2 }), (i - 1) * 0.3, (0.7 + i * 0.2) * s, (i % 2) * 0.2); c.scale.setScalar(s); c.rotation.z = (i - 1) * 0.25; g.add(c); }
  addD(w, g);
}
function pine(w, x, y, z, s = 1) {
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
  g.add(mesh(geo('cyl', 0.25, 0.35, 1.2, 10), M(0x6a4528, { roughness: 1 }), 0, 0.6, 0));
  [[1.5, 1.8, 1.6], [1.15, 1.6, 2.6], [0.8, 1.4, 3.5]].forEach(([r, h, yy]) => { g.add(mesh(geo('cone', r, h, 16), M(0x2f7a58), 0, yy, 0)); g.add(mesh(geo('cone', r * 0.78, h * 0.5, 16), M(0xf4f8fc, { roughness: 0.9 }), 0, yy + h * 0.28, 0)); });
  shadowAll(g); addD(w, g);
}
function iceSpike(w, x, y, z, s = 1) { const c = mesh(geo('cone', 0.45 * s, 2.2 * s, 5), M(0xb8e8ff, { transparent: true, opacity: 0.85, flatShading: true, roughness: 0.08, metalness: 0.1 }), x, y + 1.1 * s, z); c.rotation.z = (w.rng() - 0.5) * 0.25; addD(w, c); }
function snowman(w, x, y, z, s = 1) {
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
  g.add(mesh(geo('sph', 0.8, 10, 8), M(0xffffff), 0, 0.7, 0)); g.add(mesh(geo('sph', 0.58, 10, 8), M(0xffffff), 0, 1.7, 0)); g.add(mesh(geo('sph', 0.4, 10, 8), M(0xffffff), 0, 2.4, 0));
  g.add(mesh(geo('cone', 0.07, 0.4, 5), M(0xff8a3d), 0, 2.4, 0.5)).rotation.x = Math.PI / 2;
  [-1, 1].forEach((sg) => g.add(mesh(geo('sph', 0.05, 5, 5), M(0x111111), sg * 0.14, 2.5, 0.35)));
  g.add(mesh(geo('cyl', 0.3, 0.3, 0.4, 8), M(0x2b2340), 0, 2.85, 0)); g.add(mesh(geo('tor', 0.4, 0.09, 10), M(0xff4d4d), 0, 2.05, 0)).rotation.x = Math.PI / 2;
  shadowAll(g); addD(w, g);
}
function igloo(w, x, y, z) { const h = mesh(geo('half', 2.2), M(0xeaf6ff), x, y, z); h.castShadow = true; addD(w, h); const d = mesh(geo('half', 0.9), M(0x4a6a8a), x, y, z + 1.9); d.rotation.x = Math.PI / 2; d.scale.set(1, 1.2, 1); addD(w, d); }
function cloud(w, x, y, z, s = 1) { const g = new T.Group(); g.position.set(x, y, z); [[0, 0, 0, 2.2], [2, -0.3, 0.3, 1.7], [-2, -0.2, 0, 1.6], [1, 0.8, 0, 1.5]].forEach(([a, b, c, r]) => { const m = mesh(geo('sph', r * s, 8, 6), M(0xffffff, { transparent: true, opacity: 0.92 }), a * s, b * s, c * s); m.scale.y = 0.65; g.add(m); }); addD(w, g); }
function rim(w, r, y, col = 0x7a7a90) {
  const L = [[(r.minx + r.maxx) / 2, r.minz - 1.5, r.maxx - r.minx + 3, 1], [(r.minx + r.maxx) / 2, r.maxz + 1.5, r.maxx - r.minx + 3, 1], [r.minx - 1.5, (r.minz + r.maxz) / 2, 1, r.maxz - r.minz + 3], [r.maxx + 1.5, (r.minz + r.maxz) / 2, 1, r.maxz - r.minz + 3]];
  L.forEach(([x, z, sx, sz]) => { const b = mesh(BOX(), M(col), x, y + 0.5, z); b.scale.set(sx, 1, sz); b.receiveShadow = true; add(w, b); });
  [[r.minx, r.minz], [r.maxx, r.minz], [r.minx, r.maxz], [r.maxx, r.maxz]].forEach(([x, z]) => { add(w, mesh(geo('cyl', 0.7, 0.9, 3, 6), M(col + 0x101010), x + (x < (r.minx + r.maxx) / 2 ? -1.5 : 1.5), y + 1.5, z + (z < (r.minz + r.maxz) / 2 ? -1.5 : 1.5))); });
}
function scatter(w, n, fn, ex, bounds, rngSeed) {
  const rng = rngSeed || w.rng; let tries = 0, placed = 0;
  while (placed < n && tries++ < n * 30) {
    const x = lerp(bounds[0], bounds[1], rng()), z = lerp(bounds[2], bounds[3], rng());
    if (ex.some(([ex_, ez, er]) => Math.hypot(x - ex_, z - ez) < er)) continue;
    fn(x, z); placed++;
  }
}

/* ---------- KÖY ---------- */
function house(w, x, z, color, fid, rescued) {
  const rot = Math.atan2(-x, -z), g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const bd = mesh(BOX(), M(color), 0, 1.6, 0); bd.scale.set(5, 3.2, 4.4); g.add(bd);
  const roof = mesh(geo('cone', 4.3, 2.4, 4), M(0xc2523a, { flatShading: true }), 0, 4.4, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1.1, 1, 0.98); g.add(roof);
  g.add(mesh(BOX(), M(0x7a4a22), 0, 1.0, 2.22)).scale.set(1.2, 2.0, 0.12);
  [-1.6, 1.6].forEach((s) => { const win = mesh(BOX(), rescued ? new T.MeshBasicMaterial({ color: 0xfff1a0 }) : M(0x3a3450), s, 2.0, 2.22); win.scale.set(0.9, 0.9, 0.1); g.add(win); });
  g.add(mesh(geo('cyl', 0.3, 0.3, 1.4, 6), M(0xb98a6a), 1.6, 5.2, -0.8));
  shadowAll(g, true, true); add(w, g);
  const dir = new T.Vector3(Math.sin(rot), 0, Math.cos(rot)), nx = x + dir.x * 5.2, nz = z + dir.z * 5.2;
  addSign(w, nx + dir.z * 2.4, 0, nz - dir.x * 2.4, rescued ? `${FRIENDS[fid].emoji} ${FRIENDS[fid].name}'in evi` : '❔ Boş ev — arkadaşını bul!');
  if (rescued) { const n = makeCreature(fid); n.position.set(nx, 0, nz); n.rotation.y = rot + Math.PI * 0.9; add(w, n); w.npcs.push({ fid, x: nx, z: nz, mesh: n }); }
}
function buildVillage() {
  const vflats = [[0, 10, 22, 34, 0], [-31, 4, 11, 19, 0], [-27, -14, 11, 19, 0], [31, 4, 11, 19, 0], [27, -14, 11, 19, 0], [0, 33, 11, 19, 0], [-20, -28, 9, 16, 0], [0, -37, 9, 16, 0], [20, -28, 9, 16, 0]];
  const vpaths = [[[0, 10], [-31, 4]], [[0, 10], [-27, -14]], [[0, 10], [31, 4]], [[0, 10], [27, -14]], [[0, 10], [0, 33]], [[0, -6], [-20, -28]], [[0, -6], [0, -37]], [[0, -6], [20, -28]]];
  const w = openWorld({
    id: 'village', sky: [0x4fc3ff, 0xd9f6ff], fog: 0xd9f6ff, fogD: 0.0042, water: 0x3fb6e8, hemi: [0xffffff, 0x9acb8a, 0.85], sunI: 0.9, theme: 'village', rx: 100, rz: 100, flats: vflats, paths: vpaths, waterY: -1.2,
    grass: [0x6bc94a, 0x7fdc58, 0x5ab83e], grassCount: 14000,
    hills: (x, z) => 1.6 * Math.sin(x * 0.05 + 0.5) * Math.cos(z * 0.045) + 0.9 * Math.sin(x * 0.12 + z * 0.1) * Math.cos(x * 0.07) + 1.4,
    color: (x, z, h, sl, pd) => {
      if (Math.hypot(x, z - 10) < 19) return (Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? 0xe2d8c3 : 0xd8cdb6;
      if (pd < 2.2) return 0xd6c3a0; if (h < 0.9 && Math.hypot(x, z) > 66) return 0xf0e2b0; if (sl > 0.9) return 0xa09a84;
      const n = Math.sin(x * 0.3) * Math.cos(z * 0.27) + Math.sin(x * 0.13 + z * 0.17); return n > 0.5 ? 0x86dc58 : n > -0.4 ? 0x79d150 : 0x6cc24a;
    },
  });
  w.spawn.set(0, 0.02, 14);
  // çeşme
  add(w, mesh(geo('cyl', 2.7, 2.9, 0.8, 14), M(0xd0c7b2), 0, 0.4, -6)); add(w, mesh(geo('cyl', 2.3, 2.3, 0.7, 14), M(0x59c9ff, { transparent: true, opacity: 0.9 }), 0, 0.5, -6));
  add(w, mesh(geo('cyl', 0.35, 0.45, 2.2, 8), M(0xd0c7b2), 0, 1.4, -6)); add(w, mesh(geo('sph', 0.55, 8, 6), M(0x59c9ff), 0, 2.7, -6));
  // portallar
  addPortal(w, -20, 0, -28, 'w1', 0x6fe07a, 'Bambu Ormanı'); addPortal(w, 0, 0, -37, 'w2', 0xb28bff, 'Gizli Mağara', 'w1'); addPortal(w, 20, 0, -28, 'w3', 0x8fdcff, 'Buzul Dağ', 'w2');
  // görev panosu & gardırop
  { const g = new T.Group(); g.position.set(-8, 0, 7); g.rotation.y = 0.4;
    [-1, 1].forEach((s) => g.add(mesh(geo('cyl', 0.12, 0.12, 2.6, 6), M(0x7a4a22), s * 1.3, 1.3, 0)));
    const b = mesh(BOX(), M(0xd6a15d), 0, 1.9, 0); b.scale.set(3.2, 1.8, 0.15); g.add(b);
    [-0.9, 0, 0.9].forEach((x, i) => { const p = mesh(BOX(), M([0xfff6e3, 0xffe27a, 0xcff3ff][i]), x, 1.9, 0.12); p.scale.set(0.7, 1.0, 0.03); p.rotation.z = (i - 1) * 0.1; g.add(p); });
    shadowAll(g); add(w, g); addInteract(w, -8, 7, 3.6, '📋 Günlük Görevler', () => G.ui.openQuests()); }
  { const g = new T.Group(); g.position.set(8, 0, 7); g.rotation.y = -0.4;
    g.add(mesh(BOX(), M(0xb86bff), 0, 1.5, 0)).scale.set(2.4, 3, 1.1); g.add(mesh(BOX(), M(0x8a3fd6), -0.6, 1.5, 0.58)).scale.set(1.1, 2.7, 0.06); g.add(mesh(BOX(), M(0x8a3fd6), 0.6, 1.5, 0.58)).scale.set(1.1, 2.7, 0.06);
    g.add(mesh(geo('sph', 0.1, 6, 6), M(0xffd23f), -0.1, 1.5, 0.64)); g.add(mesh(geo('sph', 0.1, 6, 6), M(0xffd23f), 0.1, 1.5, 0.64)); g.add(mesh(geo('sph', 0.45, 8, 6), M(0xffd23f), 0, 3.2, 0));
    shadowAll(g); add(w, g); addInteract(w, 8, 7, 3.6, '👗 Gardırop', () => G.ui.openWardrobe()); }
  // evler
  const done = (f) => !!save.rescued[f];
  house(w, -31, 4, 0xffe7c2, 'tavsan', done('tavsan')); house(w, -27, -14, 0xc9f0cf, 'kaplumbaga', done('kaplumbaga'));
  house(w, 31, 4, 0xffd5c2, 'kedi', done('kedi')); house(w, 27, -14, 0xffe0a8, 'tilki', done('tilki')); house(w, 0, 33, 0xe6dcff, 'minipanda', done('minipanda'));
  addSign(w, 4, 0, 14, '🐼 Mochi: Arkadaşlarımı kurtarmalıyım! Portallara git!');
  addSign(w, 0, 0, -31, '🔒 Önce Bambu Ormanı’nı bitir!'); addSign(w, 20, 0, -23, '🔒 Önce Gizli Mağara’yı bitir!');
  // ağaçlar, çiçekler
  const ex = exclusions(w);
  scatterT(w, 80, (x, h, z) => tree(w, x, h, z, 0.8 + w.rng() * 0.8, pick([0x3fae5a, 0x4fc060, 0x35a055])), ex, { minH: 1 });
  scatterT(w, 200, (x, h, z) => flower(w, x, h, z, pick([0xff7eb6, 0xffd23f, 0xffffff, 0x8fd0ff])), ex, { minH: 1 });
  scatterT(w, 26, (x, h, z) => rock(w, x, h, z, 0.6 + w.rng() * 1.2), ex, { minH: 0.9 });
  scatterT(w, 10, (x, h, z) => bamboo(w, x, h, z, 4.5), ex, { minH: 1 });
  // gökte süzülen adalar (uçmayı öğrenince)
  const isl = (x, y, z, s) => { solid(w, x, y, z, s, s, { h: 3, type: 'grass' }); tree(w, x - s / 3, y, z - s / 3, 0.7); flower(w, x + 1, y, z, 0xff7eb6); flower(w, x - 1, y, z + 1, 0xffd23f); };
  isl(-30, 14, -36, 12); isl(30, 14, -36, 12); isl(0, 22, -60, 14);
  addChest(w, 'vg1', -30, 14, -33); addChest(w, 'vg2', 30, 14, -33); addChest(w, 'vg3', 0, 22, -57);
  coinRing(w, -30, 15.2, -36, 3.5, 8); coinRing(w, 30, 15.2, -36, 3.5, 8); coinRing(w, 0, 23.2, -60, 4.5, 10); addCoin(w, 0, 24.5, -60, true);
  addSign(w, -22, 14, -36, '🪽 Uçarak gelenlere sürpriz sandıklar!');
  [[-30, 24, -20], [26, 28, -10], [-6, 32, -50], [40, 22, 10], [-45, 26, 10]].forEach(([x, y, z]) => cloud(w, x, y, z, 1.4));
  return finishWorld(w);
}

const WORLD_BUILDERS = { village: buildVillage };
