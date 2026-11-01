'use strict';
/* ============ 3D modeller: Mochi (panda), arkadaşlar, kötüler, aksesuarlar ============ */
const matCache = new Map();
const M = (color, o = {}) => {
  const key = color + JSON.stringify(o);
  if (!matCache.has(key)) matCache.set(key, new T.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o }));
  return matCache.get(key);
};
const geoCache = new Map();
function noisySphere(r, seed) {
  const g = new T.SphereGeometry(r, 22, 16), p = g.attributes.position, v = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const n = v.clone().multiplyScalar(2.1 / r);
    const k = Math.sin(n.x * 2.3 + seed * 1.7) * Math.cos(n.y * 2.1 + seed) + Math.sin(n.z * 2.7 - seed * 0.9) * 0.7 + Math.sin((n.x + n.z) * 4.1 + seed) * 0.25;
    v.multiplyScalar(1 + k * 0.13); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
const geo = (kind, ...a) => {
  const key = kind + a.join(',');
  if (!geoCache.has(key)) {
    const f = { sph: () => new T.SphereGeometry(a[0], a[1] || 18, a[2] || 14),
      blob: () => noisySphere(a[0], a[1] || 0), box: () => new T.BoxGeometry(a[0], a[1], a[2]),
      cyl: () => new T.CylinderGeometry(a[0], a[1], a[2], a[3] || 14), cone: () => new T.ConeGeometry(a[0], a[1], a[2] || 14),
      ico: () => new T.IcosahedronGeometry(a[0], a[1] || 0), oct: () => new T.OctahedronGeometry(a[0]), tor: () => new T.TorusGeometry(a[0], a[1], 6, a[2] || 14),
      half: () => new T.SphereGeometry(a[0], 20, 10, 0, Math.PI * 2, 0, Math.PI / 2) };
    geoCache.set(key, f[kind]());
  }
  return geoCache.get(key);
};
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); return o; };
const chain = (o, k, ax, v) => { o[k][ax] = v; return o; };
const shadowAll = (obj, cast = true, recv = false) => { obj.traverse((c) => { if (c.isMesh) { c.castShadow = cast; c.receiveShadow = recv; } }); return obj; };

/* ---------- Mochi (daha gerçekçi: tüylü doku, pürüzsüz yüzeyler, parlak gözler, panda yüz yapısı) ---------- */
let FUR_MAP = null;
function furMap() {
  if (FUR_MAP) return FUR_MAP;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#f6f6f6'; x.fillRect(0, 0, 256, 256); x.lineWidth = 1.3;
  for (let i = 0; i < 3800; i++) {
    const px = Math.random() * 256, py = Math.random() * 256, a = Math.PI / 2 + (Math.random() - 0.5) * 1.2, l = 4 + Math.random() * 8, v = 205 + Math.floor(Math.random() * 50);
    x.strokeStyle = `rgba(${v},${v},${v},0.4)`; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  FUR_MAP = new T.CanvasTexture(c); FUR_MAP.wrapS = FUR_MAP.wrapT = T.RepeatWrapping; FUR_MAP.repeat.set(2, 2); FUR_MAP.anisotropy = 4; return FUR_MAP;
}
const gloss = (color, r = 0.12) => M(color, { roughness: r, metalness: 0.1 });
function makePanda(equip, opt = {}) {
  const fur = FURS[equip.fur] || FURS.classic, fm = furMap();
  const hi = save.settings.quality !== 'low', bm = hi ? fm : null;
  const mW = new T.MeshStandardMaterial({ color: fur.body, roughness: 0.97, map: fm, bumpMap: bm, bumpScale: 0.35 });
  const mB = new T.MeshStandardMaterial({ color: fur.accent, roughness: 0.95, map: fm, bumpMap: bm, bumpScale: 0.35 });
  mW.userData = { own: true, base: 1 }; mB.userData = { own: true, base: 1 };
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const torso = mesh(geo('sph', 0.55, 32, 24), mW, 0, 0.52, 0); torso.scale.set(0.92, 1.0, 0.84); body.add(torso);
  const band = mesh(geo('sph', 0.56, 32, 14), mB, 0, 0.9, 0); band.scale.set(0.97, 0.3, 0.86); body.add(band);
  body.add(mesh(geo('sph', 0.13, 14, 10), mW, 0, 0.3, -0.5));
  const head = new T.Group(); head.position.y = 1.17; body.add(head);
  head.add(mesh(geo('sph', 0.54, 40, 28), mW));
  const muzzle = mesh(geo('sph', 0.25, 24, 18), M(0xffffff, { roughness: 0.95 }), 0, -0.12, 0.4); muzzle.scale.set(1, 0.78, 0.9); head.add(muzzle);
  head.add(mesh(geo('sph', 0.07, 14, 10), gloss(0x161616, 0.25), 0, -0.03, 0.62)).scale.set(1.3, 0.85, 0.95);
  head.add(mesh(geo('box', 0.12, 0.022, 0.02), mB, 0, -0.19, 0.58)); head.add(mesh(geo('box', 0.02, 0.07, 0.02), mB, 0, -0.12, 0.61));
  [-1, 1].forEach((s) => {
    head.add(mesh(geo('sph', 0.2, 20, 14), mB, s * 0.43, 0.42, -0.02));
    const patch = mesh(geo('sph', 0.17, 20, 14), mB, s * 0.22, 0.06, 0.43); patch.scale.set(0.8, 1.3, 0.42); patch.rotation.z = s * 0.5; head.add(patch);
    head.add(mesh(geo('sph', 0.075, 16, 12), M(0xffffff, { roughness: 0.25 }), s * 0.205, 0.07, 0.5));
    head.add(mesh(geo('sph', 0.058, 16, 12), gloss(0x120d0a, 0.08), s * 0.205, 0.07, 0.552));
    head.add(mesh(geo('sph', 0.02, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), s * 0.19, 0.095, 0.605));
    head.add(mesh(geo('sph', 0.085, 12, 10), M(0xff9db0, { transparent: true, opacity: 0.45 }), s * 0.37, -0.1, 0.38));
  });
  const armL = new T.Group(), armR = new T.Group(); armL.position.set(-0.5, 0.84, 0.04); armR.position.set(0.5, 0.84, 0.04);
  [armL, armR].forEach((a) => { const m = mesh(geo('sph', 0.16, 18, 14), mB, 0, -0.16, 0); m.scale.set(0.95, 1.45, 0.95); a.add(m); body.add(a); });
  const legL = new T.Group(), legR = new T.Group(); legL.position.set(-0.24, 0.34, 0.03); legR.position.set(0.24, 0.34, 0.03);
  [legL, legR].forEach((l) => { const m = mesh(geo('sph', 0.2, 18, 14), mB, 0, -0.14, 0.04); m.scale.set(1, 1.15, 1.2); l.add(m); l.add(mesh(geo('sph', 0.07, 10, 8), M(0x3a3a3a), 0, -0.25, 0.21)); body.add(l); });
  const accBody = new T.Group(), accHead = new T.Group(); body.add(accBody); head.add(accHead);
  const p = root; p.userData = { body, head, armL, armR, legL, legR, mW, mB, accBody, accHead, mats: [], squash: 0, flame: null, kind: 'panda', phase: Math.random() * 6 };
  setEquip(p, equip); shadowAll(root, opt.shadow !== false);
  return p;
}
const clearGroup = (g) => { while (g.children.length) g.remove(g.children[0]); };
function setEquip(p, e) {
  const u = p.userData, fur = FURS[e.fur] || FURS.classic;
  u.mW.color.setHex(fur.body); u.mB.color.setHex(fur.accent);
  clearGroup(u.accBody); clearGroup(u.accHead); u.flame = null;
  const hat = buildHat(e.hat), gl = buildGlasses(e.glasses), sc = buildScarf(e.scarf), pk = buildPack(e.pack, u);
  const of = buildOutfit(e.outfit); if (of) u.accBody.add(of);
  if (hat) u.accHead.add(hat); if (gl) u.accHead.add(gl); if (sc) u.accBody.add(sc); if (pk) u.accBody.add(pk);
  shadowAll(u.accBody); shadowAll(u.accHead); ownMats(p);
  u.equip = { ...e }; if (G.looks) G.looks.applyForm(p, e.form || 'panda');
}
/* Paylaşılan (önbellekli) malzemeleri kopyalar; böylece saydamlık sadece bu modeli etkiler */
function ownMats(obj) {
  obj.traverse((c) => {
    if (!c.isMesh || c.material.userData.own) return;
    c.material = c.material.clone(); c.material.userData = { own: true, base: c.material.opacity };
  });
}
function setAlpha(obj, a) {
  obj.traverse((c) => {
    if (!c.isMesh || !c.material.userData.own) return;
    const m = c.material; m.transparent = a < 1 || m.userData.base < 1; m.opacity = m.userData.base * a;
  });
}
function buildHat(id) {
  const g = new T.Group();
  switch (id) {
    case 'crown': g.add(mesh(geo('cyl', 0.36, 0.4, 0.2), M(0xffc83a), 0, 0.58, 0));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(mesh(geo('cone', 0.08, 0.22, 5), M(0xffc83a), Math.sin(a) * 0.33, 0.78, Math.cos(a) * 0.33)); }
      g.add(mesh(geo('sph', 0.07, 6, 6), M(0xff4d6d), 0, 0.6, 0.4)); return g;
    case 'cowboy': g.add(mesh(geo('cyl', 0.8, 0.8, 0.05, 12), M(0x9c6a3a), 0, 0.5, 0)); g.add(mesh(geo('cyl', 0.32, 0.4, 0.34), M(0xb07c45), 0, 0.68, 0));
      g.add(mesh(geo('cyl', 0.405, 0.405, 0.07), M(0x5b3a1c), 0, 0.57, 0)); return g;
    case 'pirate': { const h = mesh(geo('sph', 0.58, 10, 8), M(0x1d1d24), 0, 0.5, 0); h.scale.set(1.15, 0.6, 1); g.add(h);
      g.add(mesh(geo('box', 0.7, 0.07, 0.07), M(0xd33b3b), 0, 0.5, 0.54)); g.add(mesh(geo('sph', 0.09, 6, 6), M(0xffffff), 0, 0.68, 0.5)); return g; }
    case 'wizard': { const c = mesh(geo('cone', 0.46, 1.0, 9), M(0x5b3fd1), 0, 1.0, 0); c.rotation.z = 0.12; g.add(c);
      g.add(mesh(geo('cyl', 0.72, 0.72, 0.05, 12), M(0x4a30b0), 0, 0.5, 0)); g.add(mesh(geo('oct', 0.1), M(0xffe24a), 0.12, 1.5, 0)); return g; }
    case 'party': { const c = mesh(geo('cone', 0.27, 0.62, 8), M(0xff5fa2), 0, 0.84, 0); c.rotation.z = 0.15; g.add(c);
      g.add(mesh(geo('sph', 0.08, 6, 6), M(0xffe24a), 0.1, 1.17, 0)); g.add(mesh(geo('cyl', 0.28, 0.28, 0.05), M(0x58d0ff), 0, 0.57, 0)); return g; }
    case 'astro': g.add(mesh(geo('sph', 0.78, 14, 10), M(0x9fe6ff, { transparent: true, opacity: 0.28 }), 0, 0.02, 0));
      g.add(mesh(geo('tor', 0.66, 0.07, 16), M(0xe8e8f0), 0, -0.4, 0)).rotation.x = Math.PI / 2; return g;
    case 'flower': for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; g.add(mesh(geo('sph', 0.1, 6, 6), M([0xff7eb6, 0xffd23f, 0xffffff][i % 3]), Math.sin(a) * 0.42, 0.42 + (i % 2) * 0.05, Math.cos(a) * 0.42)); } return g;
    case 'chef': g.add(mesh(geo('cyl', 0.36, 0.33, 0.5, 14), M(0xffffff), 0, 0.72, 0)); [[0, 1.05, 0], [0.22, 1.0, 0.1], [-0.22, 1.0, 0.1], [0, 1.0, -0.2]].forEach(([a, b, c]) => g.add(mesh(geo('sph', 0.24, 10, 8), M(0xffffff), a, b, c))); return g;
    case 'cap': { const h = mesh(geo('half', 0.57), M(0xe0453c), 0, 0.36, 0); g.add(h); const v = mesh(geo('box', 0.5, 0.04, 0.36), M(0xc2352e), 0, 0.48, 0.52); v.rotation.x = 0.12; g.add(v); g.add(mesh(geo('sph', 0.06, 6, 6), M(0xffffff), 0, 0.93, 0)); return g; }
    case 'catears': [-1, 1].forEach((s) => { g.add(chain(mesh(geo('cone', 0.17, 0.36, 4), M(0x2b2b33), s * 0.34, 0.66, 0), 'rotation', 'z', -s * 0.25)); g.add(chain(mesh(geo('cone', 0.1, 0.22, 4), M(0xff9db4), s * 0.34, 0.62, 0.05), 'rotation', 'z', -s * 0.25)); }); return g;
    case 'bunny': [-1, 1].forEach((s) => { const e = mesh(geo('sph', 0.13, 8, 6), M(0xf4f0ea), s * 0.2, 1.0, 0); e.scale.set(1, 3.3, 0.6); e.rotation.z = -s * 0.2; g.add(e); const i = mesh(geo('sph', 0.08, 6, 6), M(0xffb6c8), s * 0.2, 1.0, 0.04); i.scale.set(0.8, 3, 0.4); i.rotation.z = -s * 0.2; g.add(i); }); return g;
    case 'beanie': g.add(mesh(geo('half', 0.58), M(0x3a78d8), 0, 0.36, 0)); g.add(chain(mesh(geo('tor', 0.5, 0.09, 12), M(0x2a5aa8), 0, 0.4, 0), 'rotation', 'x', Math.PI / 2)); g.add(mesh(geo('sph', 0.14, 8, 6), M(0xffffff), 0, 0.98, 0)); return g;
    case 'headphones': for (let i = 0; i <= 6; i++) { const a = -1.35 + (i / 6) * 2.7; g.add(chain(mesh(geo('box', 0.07, 0.07, 0.11), M(0x2b2b33), Math.sin(a) * 0.6, 0.02 + Math.cos(a) * 0.6, 0), 'rotation', 'z', -a)); }
      [-1, 1].forEach((s) => { const c = mesh(geo('cyl', 0.2, 0.2, 0.14, 12), M(0xe0453c), s * 0.58, 0.02, 0); c.rotation.z = Math.PI / 2; g.add(c); }); return g;
    case 'santa': { const c = mesh(geo('cone', 0.42, 0.85, 12), M(0xd62f2f), 0.08, 0.9, 0); c.rotation.z = -0.25; g.add(c); g.add(chain(mesh(geo('tor', 0.42, 0.1, 12), M(0xffffff), 0, 0.48, 0), 'rotation', 'x', Math.PI / 2)); g.add(mesh(geo('sph', 0.13, 8, 6), M(0xffffff), 0.27, 1.28, 0)); return g; }
    case 'unicorn': { const h = mesh(geo('cone', 0.12, 0.7, 8), M(0xfff1c2, { emissive: 0xffd86b, emissiveIntensity: 0.25 }), 0, 0.92, 0.22); h.rotation.x = 0.35; g.add(h); [-1, 1].forEach((s) => g.add(chain(mesh(geo('cone', 0.13, 0.3, 4), M(0xf4e8ff), s * 0.3, 0.62, -0.02), 'rotation', 'z', -s * 0.2))); return g; }
    default: return null;
  }
}
function buildGlasses(id) {
  const g = new T.Group(); g.position.set(0, 0.08, 0.5);
  if (id === 'sun') { [-1, 1].forEach((s) => { const l = mesh(geo('sph', 0.17, 8, 6), M(0x111111), s * 0.2, 0, 0); l.scale.set(1.15, 0.85, 0.3); g.add(l); }); g.add(mesh(geo('box', 0.1, 0.03, 0.03), M(0x111111), 0, 0.02, 0)); return g; }
  if (id === 'heart') { [-1, 1].forEach((s) => { const l = mesh(geo('oct', 0.17), M(0xff4d8d), s * 0.2, 0, 0.0); l.scale.set(1.1, 1, 0.3); g.add(l); }); return g; }
  if (id === 'star') { [-1, 1].forEach((s) => { const l = mesh(geo('oct', 0.19), M(0xffd23f), s * 0.2, 0, 0.0); l.scale.set(1, 1, 0.3); l.rotation.z = Math.PI / 4; g.add(l); }); return g; }
  if (id === 'nerd') { [-1, 1].forEach((s) => g.add(mesh(geo('tor', 0.15, 0.028, 14), M(0x222222), s * 0.2, 0, 0))); g.add(mesh(geo('box', 0.1, 0.025, 0.025), M(0x222222), 0, 0.03, 0)); return g; }
  if (id === 'round') { [-1, 1].forEach((s) => g.add(mesh(geo('tor', 0.17, 0.03, 14), M(0x3a78d8), s * 0.21, 0, 0))); g.add(mesh(geo('box', 0.1, 0.025, 0.025), M(0x3a78d8), 0, 0.03, 0)); return g; }
  if (id === 'ski') { const b = mesh(geo('box', 0.7, 0.26, 0.1), M(0xff8a2a), 0, 0, 0.0); g.add(b); [-1, 1].forEach((s) => { const l = mesh(geo('sph', 0.15, 8, 6), M(0x1a1a22, { roughness: 0.1, metalness: 0.4 }), s * 0.18, 0, 0.05); l.scale.set(1.2, 0.9, 0.4); g.add(l); }); return g; }
  if (id === 'mustache') { g.position.set(0, -0.12, 0.54); [-1, 1].forEach((s) => { const m = mesh(geo('sph', 0.12, 8, 6), M(0x4a2a14), s * 0.12, 0, 0); m.scale.set(1.4, 0.6, 0.7); m.rotation.z = -s * 0.35; g.add(m); }); return g; }
  return null;
}
function buildScarf(id) {
  if (id === 'none' || !id) return null;
  if (id === 'bow') { const g = new T.Group(); [-1, 1].forEach((s) => { const w = mesh(geo('cone', 0.2, 0.34, 3), M(0xff6fb5), s * 0.2, 0.84, 0.5); w.rotation.z = s * Math.PI / 2; g.add(w); }); g.add(mesh(geo('sph', 0.08, 8, 6), M(0xe0509a), 0, 0.84, 0.52)); return g; }
  if (id === 'gold') { const g = new T.Group(), t = mesh(geo('tor', 0.44, 0.1, 14), M(0xffc83a, { metalness: 0.6, roughness: 0.3, emissive: 0x7a5a10, emissiveIntensity: 0.3 }), 0, 0.84, 0); t.rotation.x = Math.PI / 2; g.add(t); g.add(mesh(geo('sph', 0.1, 8, 6), M(0xff4d6d), 0, 0.78, 0.46)); return g; }
  const g = new T.Group(); const cols = id === 'rainbow' ? [0xff4d4d, 0xffc83a, 0x4ad66d, 0x3a8dff] : id === 'stripe' ? [0xe0453c, 0xffffff, 0xe0453c] : [id === 'blue' ? 0x3a8dff : 0xff4d4d];
  cols.forEach((c, i) => { const t = mesh(geo('tor', 0.44, 0.1, 14), M(c), 0, 0.84 - i * 0.04 * (cols.length > 1 ? 1 : 0), 0); t.rotation.x = Math.PI / 2; t.scale.set(1, 0.95, 1); g.add(t); });
  const tail = mesh(geo('box', 0.2, 0.55, 0.07), M(cols[cols.length - 1]), 0.28, 0.52, 0.4); tail.rotation.z = 0.15; g.add(tail);
  return g;
}
function buildPack(id, u) {
  const g = new T.Group(); g.position.set(0, 0.62, -0.52); g.scale.setScalar(0.8);
  if (id === 'none' || !id) { g.add(mesh(geo('box', 0.62, 0.78, 0.34), M(0x4f9a5a))); g.add(mesh(geo('box', 0.5, 0.3, 0.12), M(0x3a7a46), 0, 0.2, -0.2)); g.add(mesh(geo('box', 0.18, 0.4, 0.04), M(0xffc83a), 0, -0.1, -0.19)); const bd = mesh(geo('box', 0.2, 0.8, 0.05), M(0x3f8de0), 0.3, 0.2, -0.2); bd.rotation.z = -0.2; g.add(bd); }
  if (id === 'bag') { g.add(mesh(geo('box', 0.6, 0.7, 0.3), M(0xe0533d))); g.add(mesh(geo('box', 0.4, 0.28, 0.1), M(0xffc83a), 0, -0.12, -0.18)); }
  if (id === 'shell') { const s = mesh(geo('half', 0.55), M(0x3f9b4a), 0, -0.1, -0.05); s.rotation.x = -Math.PI / 2; s.scale.set(1.1, 1.1, 0.8); g.add(s); }
  if (id === 'wings') { [-1, 1].forEach((s) => { const w = mesh(geo('cone', 0.42, 0.95, 4), M(0xbfe9ff, { transparent: true, opacity: 0.8 }), s * 0.5, 0.15, -0.05); w.rotation.z = -s * 1.1; w.rotation.x = 0.2; w.scale.z = 0.25; g.add(w); }); }
  if (id === 'rocket') { [-1, 1].forEach((s) => g.add(mesh(geo('cyl', 0.14, 0.14, 0.8), M(0xcfd3dc), s * 0.2, 0, 0)));
    [-1, 1].forEach((s) => g.add(mesh(geo('cone', 0.14, 0.25), M(0xe0533d), s * 0.2, 0.52, 0)));
    const f = mesh(geo('cone', 0.12, 0.4), M(0xffa21a, { transparent: true, opacity: 0.9 }), 0, -0.55, 0); f.rotation.x = Math.PI; f.visible = false; g.add(f); u.flame = f; }
  if (id === 'angel') { [-1, 1].forEach((s) => { const w = mesh(geo('cone', 0.5, 1.25, 4), M(0xffffff, { emissive: 0xfff6c8, emissiveIntensity: 0.25 }), s * 0.6, 0.3, -0.05); w.rotation.z = -s * 1.0; w.rotation.x = 0.2; w.scale.z = 0.22; g.add(w); }); g.add(chain(mesh(geo('tor', 0.3, 0.04, 10), M(0xffe27a, { emissive: 0xffc800, emissiveIntensity: 0.6 }), 0, 1.1, 0.4), 'rotation', 'x', Math.PI / 2)); }
  if (id === 'butterfly') { [[1, 0.55, 0xff7ad9], [-1, 0.55, 0xff7ad9], [1, -0.1, 0xb28bff], [-1, -0.1, 0xb28bff]].forEach(([s, y, c]) => { const w = mesh(geo('sph', 0.42, 8, 6), M(c, { transparent: true, opacity: 0.88 }), s * 0.5, y, -0.05); w.scale.set(1, 0.9, 0.12); g.add(w); }); }
  if (id === 'jet') { g.add(mesh(geo('box', 0.62, 0.7, 0.3), M(0x4a78d0))); [-1, 1].forEach((s) => { g.add(mesh(geo('cyl', 0.13, 0.15, 0.3), M(0xcfd3dc), s * 0.2, -0.5, 0)); const f = mesh(geo('cone', 0.11, 0.35), M(0x7fd8ff, { transparent: true, opacity: 0.85 }), s * 0.2, -0.78, 0); f.rotation.x = Math.PI; g.add(f); }); }
  return g;
}
function buildOutfit(id) {
  if (!id || id === 'none') return null;
  const g = new T.Group();
  const sh = (c, y, sy, r = 0.585, o = {}) => { const k = mesh(geo('sph', r, 22, 16), M(c, o), 0, y, 0); k.scale.set(0.96, sy, 0.88); g.add(k); return k; };
  switch (id) {
    case 'tshirt': sh(0xe8453c, 0.62, 0.62); g.add(chain(mesh(geo('oct', 0.13), M(0xffe24a), 0, 0.64, 0.5), 'scale', 'z', 0.3)); break;
    case 'hoodie': sh(0x3a78d8, 0.6, 0.72); g.add(mesh(geo('box', 0.34, 0.15, 0.05), M(0x2a5aa8), 0, 0.38, 0.5)); { const h = mesh(geo('sph', 0.34, 12, 10), M(0x3a78d8), 0, 1.0, -0.32); h.scale.set(1.2, 0.8, 0.8); g.add(h); } [-1, 1].forEach((s) => g.add(mesh(geo('cyl', 0.02, 0.02, 0.3, 5), M(0xffffff), s * 0.1, 0.8, 0.5))); break;
    case 'dress': sh(0xff8fc0, 0.72, 0.5); { const k = mesh(geo('cone', 0.8, 0.75, 18), M(0xff8fc0), 0, 0.3, 0); g.add(k); g.add(chain(mesh(geo('tor', 0.78, 0.05, 8), M(0xffffff), 0, -0.05, 0), 'rotation', 'x', Math.PI / 2)); } g.add(mesh(geo('sph', 0.07, 6, 6), M(0xffe24a), 0, 0.75, 0.52)); break;
    case 'cape': { const c = mesh(geo('box', 0.95, 1.15, 0.05), M(0xd62f2f), 0, 0.5, -0.5); c.rotation.x = 0.12; g.add(c); g.add(chain(mesh(geo('tor', 0.4, 0.07, 10), M(0xffc83a), 0, 0.98, 0), 'rotation', 'x', Math.PI / 2)); g.add(mesh(geo('oct', 0.1), M(0xffe24a), 0, 0.92, 0.42)); break; }
    case 'overall': sh(0x2f6fd0, 0.42, 0.7); [-1, 1].forEach((s) => { g.add(mesh(geo('box', 0.08, 0.5, 0.05), M(0x2f6fd0), s * 0.2, 0.98, 0.48)); g.add(mesh(geo('sph', 0.04, 6, 5), M(0xffd23f), s * 0.2, 0.78, 0.52)); }); g.add(mesh(geo('box', 0.3, 0.2, 0.04), M(0x2558a8), 0, 0.42, 0.52)); break;
    case 'astro': sh(0xf2f4f8, 0.55, 0.92); g.add(mesh(geo('box', 0.32, 0.22, 0.05), M(0x9aa4b8), 0, 0.62, 0.5)); [[-0.08, 0xff4d4d], [0.08, 0x4ad66d]].forEach(([x, c]) => g.add(mesh(geo('sph', 0.04, 6, 5), M(c, { emissive: c, emissiveIntensity: 0.6 }), x, 0.64, 0.54))); g.add(chain(mesh(geo('tor', 0.56, 0.05, 10), M(0x3a78d8), 0, 0.28, 0), 'rotation', 'x', Math.PI / 2)); break;
    case 'tutu': sh(0xffffff, 0.62, 0.45); for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283, c = mesh(geo('cone', 0.16, 0.5, 4), M(0xff9ad5), Math.sin(a) * 0.5, 0.3, Math.cos(a) * 0.46); c.rotation.set(Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2); g.add(c); } break;
    case 'robe': { const k = mesh(geo('cone', 0.86, 1.25, 16), M(0x5b3fd1), 0, 0.5, 0); g.add(k); for (let i = 0; i < 5; i++) { const a = i * 1.26; g.add(mesh(geo('oct', 0.07), M(0xffe24a, { emissive: 0xffc800, emissiveIntensity: 0.5 }), Math.sin(a) * 0.5, 0.25 + (i % 3) * 0.2, Math.cos(a) * 0.5)); } g.add(chain(mesh(geo('tor', 0.52, 0.06, 10), M(0xffc83a), 0, 0.62, 0), 'rotation', 'x', Math.PI / 2)); break; }
    case 'pirate': sh(0x2a2a32, 0.6, 0.78); g.add(chain(mesh(geo('tor', 0.56, 0.07, 10), M(0xd62f2f), 0, 0.3, 0), 'rotation', 'x', Math.PI / 2)); [0.5, 0.65, 0.8].forEach((y) => g.add(mesh(geo('sph', 0.04, 6, 5), M(0xffc83a), 0, y, 0.55))); break;
    case 'jersey': sh(0xffd23f, 0.62, 0.62); [0.5, 0.74].forEach((y) => g.add(chain(mesh(geo('tor', 0.56, 0.04, 10), M(0x3a78d8), 0, y, 0), 'rotation', 'x', Math.PI / 2))); g.add(mesh(geo('box', 0.2, 0.26, 0.04), M(0x3a78d8), 0, 0.62, 0.52)); break;
    case 'apron': g.add(mesh(geo('box', 0.66, 0.8, 0.05), M(0xffffff), 0, 0.5, 0.5)); g.add(mesh(geo('box', 0.3, 0.16, 0.04), M(0xe8e8ee), 0, 0.38, 0.54)); g.add(chain(mesh(geo('tor', 0.4, 0.03, 8), M(0xffffff), 0, 0.92, 0), 'rotation', 'x', Math.PI / 2)); break;
    case 'rain': sh(0xffc928, 0.6, 0.86, 0.6); { const h = mesh(geo('sph', 0.34, 12, 10), M(0xffc928), 0, 1.0, -0.3); h.scale.set(1.2, 0.85, 0.8); g.add(h); } [0.45, 0.65, 0.85].forEach((y) => g.add(mesh(geo('sph', 0.04, 6, 5), M(0x2a2a32), 0, y, 0.56))); break;
    default: return null;
  }
  return g;
}

/* ---------- Hayvanlar ve kötüler ---------- */
const ANIMALS = {
  tavsan:     { body: 0xf3efe9, belly: 0xffffff, ear: 'long',  earIn: 0xffb6c8, tail: 'puff',  nose: 0xff8aa8, size: 1 },
  kaplumbaga: { body: 0x9ad66f, shell: 0x3f9b4a, ear: 'none', tail: 'tiny', nose: 0x5a9a3a, size: 1 },
  kedi:       { body: 0xf0a64c, belly: 0xfff1d6, ear: 'point', earIn: 0xffb6c8, tail: 'long', stripes: 0xc7782a, nose: 0xff8aa8, whiskers: true, size: 1 },
  tilki:      { body: 0xff8a3d, belly: 0xffffff, ear: 'point', earTip: 0x2b2023, tail: 'bushy', nose: 0x2b2023, snout: 0xffffff, size: 1 },
  devfare:    { body: 0x9aa0ab, belly: 0xd9dce2, ear: 'round', earIn: 0xffa6b8, tail: 'long', nose: 0xff7f98, angry: true, teeth: true, size: 5.0 },
  kaplan:     { body: 0xffa21a, belly: 0xfff1d6, ear: 'round', earIn: 0xffe0b0, tail: 'long', stripes: 0x2b2023, nose: 0x2b2023, angry: true, size: 5.4 },
  ayi:        { body: 0x7a4a2a, belly: 0xc89a6a, ear: 'round', earIn: 0xc89a6a, tail: 'tiny', nose: 0x1d1410, angry: true, collar: true, size: 6.0 },
};
function makeCreature(kind) {
  if (kind === 'minipanda') { const p = makePanda({ hat: 'flower', glasses: 'none', scarf: 'none', pack: 'none', trail: 'none', fur: 'strawberry' }); p.scale.setScalar(0.75); p.userData.kind = 'npc'; return p; }
  const c = ANIMALS[kind], g = new T.Group(), inner = new T.Group(); g.add(inner);
  const mB = M(c.body), eye = M(0xffffff), pup = M(0x111111);
  const body = mesh(geo('sph', 0.58, 12, 10), mB, 0, 0.62, 0); body.scale.set(1, 0.95, 1.05); inner.add(body);
  if (c.belly) { const b = mesh(geo('sph', 0.44, 10, 8), M(c.belly), 0, 0.56, 0.24); b.scale.set(1, 0.95, 0.55); inner.add(b); }
  if (c.stripes) for (let i = 0; i < 3; i++) { const s = mesh(geo('box', 0.08, 0.2, 0.85), M(c.stripes), (i - 1) * 0.28, 1.12 - Math.abs(i - 1) * 0.1, -0.05); s.rotation.z = (i - 1) * -0.3; inner.add(s); }
  if (c.shell) { const s = mesh(geo('half', 0.78), M(c.shell), 0, 0.5, -0.05); s.scale.set(1, 0.9, 1.1); inner.add(s); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; inner.add(mesh(geo('ico', 0.14), M(0x2c7a36), Math.sin(a) * 0.38, 0.95 - 0.12 * Math.abs(Math.sin(a)), Math.cos(a) * 0.38 - 0.05)); } inner.add(mesh(geo('ico', 0.17), M(0x2c7a36), 0, 1.1, -0.05)); }
  const head = new T.Group(); head.position.set(0, c.shell ? 0.78 : 1.3, c.shell ? 0.62 : 0.12); inner.add(head);
  head.add(mesh(geo('sph', c.shell ? 0.33 : 0.44, 12, 10), mB));
  const r = c.shell ? 0.33 : 0.44;
  [-1, 1].forEach((s) => { head.add(mesh(geo('sph', 0.1, 8, 6), eye, s * 0.18 * r / 0.44, 0.07, r * 0.8)); head.add(mesh(geo('sph', 0.055, 6, 6), pup, s * 0.18 * r / 0.44, 0.07, r * 0.8 + 0.07));
    if (c.angry) { const br = mesh(geo('box', 0.2, 0.05, 0.06), M(0x201010), s * 0.18, 0.2, r * 0.82); br.rotation.z = s * 0.55; head.add(br); }
    if (c.ear === 'long') { const e = mesh(geo('sph', 0.12, 8, 6), mB, s * 0.17, 0.62, -0.04); e.scale.set(1, 3.1, 0.55); e.rotation.z = s * 0.15; head.add(e); const i2 = mesh(geo('sph', 0.07, 6, 6), M(c.earIn), s * 0.17, 0.62, 0.02); i2.scale.set(0.8, 3, 0.4); i2.rotation.z = s * 0.15; head.add(i2); }
    if (c.ear === 'round') { head.add(mesh(geo('sph', 0.17, 8, 6), mB, s * 0.32, 0.36, -0.04)); head.add(mesh(geo('sph', 0.1, 6, 6), M(c.earIn), s * 0.32, 0.36, 0.06)); }
    if (c.ear === 'point') { const e = mesh(geo('cone', 0.16, 0.36, 4), c.earTip ? M(c.body) : mB, s * 0.25, 0.46, -0.02); e.rotation.z = -s * 0.15; head.add(e); if (c.earTip) head.add(mesh(geo('cone', 0.09, 0.15, 4), M(c.earTip), s * 0.27, 0.62, -0.02)); }
    if (c.whiskers) { for (let k = -1; k <= 1; k += 2) { const w = mesh(geo('box', 0.3, 0.012, 0.012), M(0xffffff), s * 0.3, -0.07 + k * 0.04, r * 0.9); w.rotation.z = s * k * 0.15; head.add(w); } }
    inner.add(mesh(geo('sph', 0.15, 8, 6), c.shell ? mB : M(c.body), s * 0.28, 0.14, 0.3));
    if (c.shell) inner.add(mesh(geo('sph', 0.13, 8, 6), mB, s * 0.36, 0.14, -0.35));
  });
  if (!c.shell) { const sn = mesh(geo('sph', 0.2, 8, 6), M(c.snout || c.belly || c.body), 0, -0.1, 0.38); sn.scale.set(1, 0.8, c.snout ? 1.4 : 1); head.add(sn); }
  head.add(mesh(geo('sph', 0.06, 6, 6), M(c.nose), 0, c.shell ? -0.02 : -0.03, c.shell ? r : (c.snout ? 0.62 : 0.55)));
  if (c.teeth) [-1, 1].forEach((s) => head.add(mesh(geo('box', 0.07, 0.12, 0.04), M(0xffffff), s * 0.06, -0.22, 0.52)));
  let tail = null;
  if (c.tail === 'puff') tail = mesh(geo('sph', 0.16, 8, 6), M(0xffffff), 0, 0.5, -0.62);
  if (c.tail === 'tiny') tail = mesh(geo('sph', 0.1, 8, 6), mB, 0, 0.4, -0.62);
  if (c.tail === 'long') { tail = new T.Group(); const t = mesh(geo('cyl', 0.05, 0.08, 0.95), c.stripes ? mB : M(c.nose), 0, 0, -0.45); t.rotation.x = Math.PI / 2 - 0.5; tail.add(t); tail.position.set(0, 0.45, -0.5); }
  if (c.tail === 'bushy') { tail = new T.Group(); const t = mesh(geo('sph', 0.26, 8, 6), mB, 0, 0, -0.5); t.scale.set(1, 1, 1.9); tail.add(t); tail.add(mesh(geo('sph', 0.2, 8, 6), M(0xffffff), 0, 0, -1.0)); tail.position.set(0, 0.5, -0.5); }
  if (tail) inner.add(tail);
  if (c.collar) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const s = mesh(geo('cone', 0.07, 0.22, 4), M(0xb0b0b8), Math.sin(a) * 0.46, 1.0, Math.cos(a) * 0.46); s.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9); inner.add(s); }
  g.scale.setScalar(c.size); g.userData = { inner, head, tail, kind, size: c.size, angry: !!c.angry, phase: Math.random() * 6 };
  return shadowAll(g);
}
function animCreature(g, t, mode = 'idle', k = 1) {
  const u = g.userData, ph = t + u.phase;
  if (u.kind === 'npc' || u.kind === 'panda') { u.body.position.y = Math.abs(Math.sin(ph * 4)) * 0.12 * k; u.armL.rotation.z = Math.sin(ph * 4) * 0.6; u.armR.rotation.z = -Math.sin(ph * 4) * 0.6; return; }
  u.inner.position.y = Math.abs(Math.sin(ph * (mode === 'angry' ? 9 : 3.5))) * 0.1 * k;
  u.head.rotation.z = Math.sin(ph * 2) * 0.08; if (u.tail) u.tail.rotation.y = Math.sin(ph * (mode === 'angry' ? 14 : 5)) * 0.4;
}

/* ---------- Zıplayan küçük düşman ---------- */
function makeBlob(color = 0xb86bff) {
  const g = new T.Group(), b = mesh(geo('sph', 0.55, 10, 8), M(color), 0, 0.5, 0); b.scale.set(1.1, 0.9, 1.1); g.add(b);
  [-1, 1].forEach((s) => { g.add(mesh(geo('sph', 0.15, 6, 6), M(0xffffff), s * 0.22, 0.62, 0.42)); g.add(mesh(geo('sph', 0.07, 6, 6), M(0x111111), s * 0.22, 0.62, 0.55));
    const br = mesh(geo('box', 0.2, 0.05, 0.05), M(0x201010), s * 0.22, 0.82, 0.42); br.rotation.z = s * 0.4; g.add(br); g.add(mesh(geo('cone', 0.08, 0.2, 5), M(0xffe9ff), s * 0.35, 0.95, -0.1)); });
  g.userData = { body: b }; return shadowAll(g);
}

/* ---------- Araçlar: zorunlu sırt çantasından çıkar (kaykay, paten, scooter, bisiklet, mini üstü açık araba) ---------- */
function strut(g, a, b, r, color) {
  const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), m = mesh(geo('cyl', r, r, 1, 8), M(color, { metalness: 0.5, roughness: 0.4 }));
  m.scale.y = d.length(); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(m);
}
function wheelPivot(r, w, color, hub) {
  const pv = new T.Group(), c = mesh(geo('cyl', r, r, w, 20), M(color, { roughness: 0.75 })); c.rotation.z = Math.PI / 2; pv.add(c);
  if (hub) { const h = mesh(geo('cyl', r * 0.55, r * 0.55, w + 0.012, 14), M(hub, { metalness: 0.8, roughness: 0.25 })); h.rotation.z = Math.PI / 2; pv.add(h); }
  return pv;
}
function bikeWheel(r) {
  const pv = new T.Group(), tire = mesh(geo('tor', r, 0.045, 28), M(0x1c1c22, { roughness: 0.9 })); tire.rotation.y = Math.PI / 2; pv.add(tire);
  for (let i = 0; i < 3; i++) { const s = mesh(geo('box', 0.012, r * 2, 0.012), M(0xcfd4dc, { metalness: 0.8, roughness: 0.3 })); s.rotation.x = (i * Math.PI) / 3; pv.add(s); }
  pv.add((() => { const h = mesh(geo('cyl', 0.05, 0.05, 0.1, 10), M(0xcfd4dc, { metalness: 0.8 })); h.rotation.z = Math.PI / 2; return h; })());
  return pv;
}
function makeVehicle(kind) {
  const g = new T.Group(), wheels = [];
  const addW = (x, y, z, r, w, col, hub) => { const pv = wheelPivot(r, w, col, hub); pv.position.set(x, y, z); g.add(pv); wheels.push({ pv, r }); };
  switch (kind) {
    case 'skate':
      g.add(mesh(geo('box', 0.3, 0.05, 0.9), M(0x3f8de0), 0, 0.1, 0)); g.add(mesh(geo('box', 0.28, 0.01, 0.86), M(0x23232b), 0, 0.128, 0));
      [-1, 1].forEach((s) => { const n = mesh(geo('box', 0.3, 0.05, 0.14), M(0x3f8de0), 0, 0.125, s * 0.5); n.rotation.x = -s * 0.35; g.add(n); g.add(mesh(geo('box', 0.22, 0.03, 0.05), M(0xb8bcc6, { metalness: 0.7 }), 0, 0.07, s * 0.3)); [-1, 1].forEach((sx) => addW(sx * 0.14, 0.055, s * 0.3, 0.055, 0.05, 0xff7a3a)); });
      break;
    case 'inline':
      [-1, 1].forEach((s) => {
        g.add(mesh(geo('box', 0.2, 0.2, 0.42), M(0xf4f4f6), s * 0.24, 0.26, 0.02)); g.add(mesh(geo('box', 0.21, 0.05, 0.43), M(0xe0533d), s * 0.24, 0.35, 0.02)); g.add(mesh(geo('box', 0.07, 0.05, 0.5), M(0x2b2b33), s * 0.24, 0.13, 0.02));
        [-0.17, -0.06, 0.06, 0.17].forEach((z) => addW(s * 0.24, 0.07, z, 0.065, 0.04, 0xff4d6d));
      });
      break;
    case 'scooter':
      g.add(mesh(geo('box', 0.26, 0.05, 0.95), M(0xff6f61), 0, 0.16, -0.05)); g.add(mesh(geo('box', 0.24, 0.01, 0.8), M(0x23232b), 0, 0.19, -0.05));
      strut(g, [0, 0.16, 0.42], [0, 1.2, 0.34], 0.028, 0xcfd4dc); g.add(mesh(geo('box', 0.56, 0.04, 0.04), M(0x23232b), 0, 1.2, 0.34));
      [-1, 1].forEach((s) => g.add(chain(mesh(geo('cyl', 0.03, 0.03, 0.1, 8), M(0xffc83a), s * 0.3, 1.2, 0.34), 'rotation', 'z', Math.PI / 2)));
      addW(0, 0.14, 0.5, 0.14, 0.05, 0x23232b, 0xcfd4dc); addW(0, 0.12, -0.5, 0.12, 0.05, 0x23232b, 0xcfd4dc);
      break;
    case 'bike': {
      const A = [0, 0.4, -0.62], C = [0, 0.32, 0], B = [0, 0.97, -0.2], D = [0, 0.9, 0.42], E = [0, 0.4, 0.62], col = 0x2a9dff;
      [[A, C], [C, B], [B, D], [C, D], [A, B], [D, E]].forEach(([p, q]) => strut(g, p, q, 0.025, col));
      g.add(mesh(geo('box', 0.14, 0.045, 0.3), M(0x23232b), 0, 1.0, -0.22)); g.add(mesh(geo('box', 0.54, 0.035, 0.035), M(0x23232b), 0, 0.98, 0.44));
      [-1, 1].forEach((s) => { g.add(mesh(geo('box', 0.12, 0.03, 0.07), M(0x23232b), s * 0.16, 0.3, 0)); });
      [[0, 0.4, -0.62], [0, 0.4, 0.62]].forEach(([x, y, z]) => { const pv = bikeWheel(0.4); pv.position.set(x, y, z); g.add(pv); wheels.push({ pv, r: 0.4 }); });
      break; }
    case 'car': {
      const red = M(0xff4a43, { metalness: 0.45, roughness: 0.3 }), dark = M(0x23232b), chrome = M(0xdfe3ea, { metalness: 0.9, roughness: 0.2 });
      g.add(mesh(geo('box', 1.4, 0.36, 2.3), red, 0, 0.46, 0)); g.add(mesh(geo('box', 1.3, 0.2, 0.85), red, 0, 0.66, 0.85)); g.add(mesh(geo('box', 1.3, 0.22, 0.55), red, 0, 0.66, -0.95));
      [-1, 1].forEach((s) => { g.add(mesh(geo('box', 0.08, 0.28, 1.15), red, s * 0.68, 0.78, -0.12)); g.add(mesh(geo('sph', 0.1, 12, 10), new T.MeshBasicMaterial({ color: 0xfff2a8 }), s * 0.5, 0.66, 1.3)); g.add(mesh(geo('sph', 0.07, 10, 8), new T.MeshBasicMaterial({ color: 0xff3b30 }), s * 0.52, 0.66, -1.25)); });
      const ws = mesh(geo('box', 1.28, 0.34, 0.04), M(0xa8e4ff, { transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.2 }), 0, 0.97, 0.38); ws.rotation.x = -0.55; g.add(ws);
      g.add(mesh(geo('box', 1.0, 0.3, 0.55), dark, 0, 0.62, -0.3)); g.add(mesh(geo('box', 1.0, 0.4, 0.14), dark, 0, 0.85, -0.62));
      g.add(mesh(geo('box', 1.5, 0.09, 0.12), chrome, 0, 0.4, 1.2)); g.add(mesh(geo('box', 1.5, 0.09, 0.12), chrome, 0, 0.4, -1.2));
      const sw = mesh(geo('tor', 0.13, 0.025, 16), dark, 0, 0.92, 0.12); sw.rotation.x = 1.1; g.add(sw);
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => addW(sx * 0.72, 0.32, sz * 0.78, 0.32, 0.24, 0x1c1c22, 0xdfe3ea));
      break; }
    case 'carpet': {
      const main = M(0xd13a5a, { roughness: 0.85 }), gold = M(0xffc83a, { metalness: 0.5, roughness: 0.4 }), blue = M(0x2b4fa8, { roughness: 0.85 });
      const base = mesh(geo('box', 1.5, 0.07, 2.1), main, 0, 0.1, 0); g.add(base);
      [[0, 1.02], [0, -1.02]].forEach(([x, z]) => g.add(mesh(geo('box', 1.5, 0.08, 0.1), gold, x, 0.11, z)));
      [-0.71, 0.71].forEach((x) => g.add(mesh(geo('box', 0.1, 0.08, 2.1), gold, x, 0.11, 0)));
      g.add(mesh(geo('box', 0.9, 0.08, 1.5), blue, 0, 0.115, 0)); { const o = mesh(geo('oct', 0.3), gold, 0, 0.17, 0); o.scale.set(1, 0.3, 1.6); g.add(o); }
      for (let i = -3; i <= 3; i++) { [1, -1].forEach((s) => g.add(mesh(geo('cyl', 0.025, 0.025, 0.2, 5), gold, i * 0.2, 0.08, s * 1.16))); }
      break; }
    case 'plane': {
      const red = M(0xe8453c, { metalness: 0.3, roughness: 0.4 }), white = M(0xf4f4f6), dark = M(0x23232b), chrome = M(0xdfe3ea, { metalness: 0.9, roughness: 0.2 });
      const fus = mesh(geo('cyl', 0.34, 0.24, 2.4, 14), red, 0, 0.34, 0); fus.rotation.x = Math.PI / 2; g.add(fus);
      g.add(mesh(geo('sph', 0.34, 12, 10), red, 0, 0.34, 1.2));
      const wing = mesh(geo('box', 3.4, 0.07, 0.62), red, 0, 0.22, 0.25); g.add(wing); [-1, 1].forEach((s) => g.add(mesh(geo('box', 0.5, 0.075, 0.64), white, s * 1.5, 0.22, 0.25)));
      const tailW = mesh(geo('box', 1.2, 0.05, 0.4), red, 0, 0.4, -1.1); g.add(tailW);
      const fin = mesh(geo('box', 0.05, 0.5, 0.45), red, 0, 0.68, -1.1); fin.rotation.x = 0.2; g.add(fin);
      g.add(mesh(geo('box', 0.5, 0.08, 0.9), dark, 0, 0.62, -0.1));
      const sh = mesh(geo('box', 0.6, 0.32, 0.04), M(0xa8e4ff, { transparent: true, opacity: 0.45, roughness: 0.05 }), 0, 0.82, 0.62); sh.rotation.x = -0.5; g.add(sh);
      const prop = new T.Group(); prop.position.set(0, 0.34, 1.55); g.add(prop);
      { const nc = mesh(geo('cone', 0.12, 0.3, 10), chrome, 0, 0, 0.1); nc.rotation.x = Math.PI / 2; prop.add(nc); }
      [0, 1].forEach((i) => { const b = mesh(geo('box', 0.14, 1.5, 0.04), dark, 0, 0, 0); b.rotation.z = i * Math.PI / 2; prop.add(b); });
      [-1, 1].forEach((s) => { const st = mesh(geo('cyl', 0.03, 0.03, 0.32, 5), dark, s * 0.4, 0.05, 0.4); st.rotation.z = s * 0.3; g.add(st); const wl = mesh(geo('cyl', 0.13, 0.13, 0.08, 12), dark, s * 0.46, -0.08, 0.4); wl.rotation.z = Math.PI / 2; g.add(wl); });
      g.userData.prop = prop;
      break; }
  }
  g.userData = Object.assign({ wheels, kind }, g.userData.prop ? { prop: g.userData.prop } : {}); shadowAll(g); ownMats(g); return g;
}
/* araç boyutu ve rengi (oyuncunun ayarı) */
const VEH_COLORS = [
  { id: 'def', c: null, n: 'Orijinal' }, { id: 'red', c: 0xff3b3b, n: 'Kırmızı' }, { id: 'orange', c: 0xff8a2a, n: 'Turuncu' }, { id: 'yellow', c: 0xffd23f, n: 'Sarı' },
  { id: 'green', c: 0x3fcf6a, n: 'Yeşil' }, { id: 'teal', c: 0x1fc8b6, n: 'Turkuaz' }, { id: 'blue', c: 0x2a8dff, n: 'Mavi' }, { id: 'purple', c: 0xa56bff, n: 'Mor' },
  { id: 'pink', c: 0xff6fb5, n: 'Pembe' }, { id: 'black', c: 0x2b2b33, n: 'Siyah' }, { id: 'white', c: 0xf4f4f6, n: 'Beyaz' }, { id: 'gold', c: 0xf2b705, n: 'Altın' },
];
const VEH_PRIMARY = { skate: [0x3f8de0], inline: [0xe0533d, 0xff4d6d], scooter: [0xff6f61], bike: [0x2a9dff], car: [0xff4a43], carpet: [0xd13a5a], plane: [0xe8453c] };
const vehStyle = () => (save.vstyle || (save.vstyle = { size: 1, color: 'def' }));
const vehSize = () => clamp(vehStyle().size || 1, 0.5, 2.5);
function styleVehicle(g, kind, style) {
  const st = style || vehStyle(), col = VEH_COLORS.find((c) => c.id === st.color); g.scale.setScalar(clamp(st.size || 1, 0.5, 2.5));
  if (col && col.c !== null) g.traverse((o) => { if (o.isMesh && o.material && VEH_PRIMARY[kind].some((h) => o.material.color.equals(new T.Color(h)))) o.material.color.setHex(col.c); });
}
function setVehicle(p, id, style) {
  const u = p.userData; if (u.veh) { p.remove(u.veh); u.veh = null; } u.vehId = id || null; u.vsize = clamp((style || vehStyle()).size || 1, 0.5, 2.5); u.vcol = (style || vehStyle()).color;
  if (!id) { if (u.body) { u.body.position.z = 0; } return; }
  u.veh = makeVehicle(id); styleVehicle(u.veh, id, style); p.add(u.veh);
}
/* sürücü duruşu: tekerlekleri döndürür, gövdeyi araca oturtur/oturtur */
function applyRiderPose(p, id, speed, dt, t) {
  const u = p.userData, v = VEH[id]; if (!v) return;
  const vs = u.vsize || vehSize(); u.body.position.y += v.lift * vs; u.body.position.z = v.z * vs;
  if (v.sit) { u.legL.rotation.x = -1.15; u.legR.rotation.x = -1.15; u.armL.rotation.x = -0.95; u.armR.rotation.x = -0.95; u.armL.rotation.z = -0.22; u.armR.rotation.z = 0.22; }
  else if (v.hold) { u.armL.rotation.x = -0.85; u.armR.rotation.x = -0.85; u.armL.rotation.z = -0.18; u.armR.rotation.z = 0.18; u.legL.rotation.x = 0.1; u.legR.rotation.x = -0.15; }
  else { u.legL.rotation.x = 0.12; u.legR.rotation.x = -0.1; u.armL.rotation.z = -0.55 + Math.sin(t * 3) * 0.08; u.armR.rotation.z = 0.55 - Math.sin(t * 3) * 0.08; u.armL.rotation.x = 0; u.armR.rotation.x = 0; }
  if (u.veh && u.veh.userData.prop) u.veh.userData.prop.rotation.z += dt * (speed > 1 ? 38 : 22);
  if (u.veh && VEH[id].air) { u.veh.rotation.z = Math.sin(t * 2.2) * 0.05; u.veh.rotation.x = Math.sin(t * 1.7) * 0.04; }
  if (u.veh) for (const w of u.veh.userData.wheels) w.pv.rotation.x += (speed * dt) / (w.r * vs);
}
