'use strict';
/* ============ Ev Arsası: odun kes, evini inşa et ve tasarla, mangal, yemek, otur/yat, pijama partisi ============ */
const HOME_PAL = {
  wall: { cream: 0xfff0d6, mint: 0xcdeed6, sky: 0xcfe6ff, pink: 0xffd1dc, sun: 0xffe08a },
  roof: { red: 0xd9534f, blue: 0x4a78d0, green: 0x4a9d5b, purple: 0x8e5bd0, brown: 0x8a5a3a },
  door: { blue: 0x4aa8ff, red: 0xe05555, yellow: 0xf4c430, green: 0x4cc76a, purple: 0xa56bff },
};
const HOME_KIND = { wall: '🧱 Duvar', roof: '🏠 Çatı', door: '🚪 Kapı' };
const HOME_STAGES = [{ name: 'Temel', icon: '🪨', wood: 4 }, { name: 'Duvarlar', icon: '🧱', wood: 8 }, { name: 'Çatı', icon: '🏠', wood: 6 }];
const HOME_ITEMS = {
  bed: { name: 'Yatak', icon: '🛏️', wood: 4 }, sofa: { name: 'Koltuk', icon: '🛋️', wood: 3 }, table: { name: 'Masa', icon: '🍽️', wood: 2 },
  rug: { name: 'Halı', icon: '🟣', wood: 1 }, lamp: { name: 'Lamba', icon: '💡', wood: 1 }, shelf: { name: 'Kitaplık', icon: '📚', wood: 3 }, plant: { name: 'Saksı', icon: '🪴', wood: 1 },
};
const FOODS = {
  corn:   { name: 'Közlenmiş Mısır', icon: '🌽', price: 4,  en: 8,  boost: 0,  time: 2.5 },
  marsh:  { name: 'Marshmallow',     icon: '🍡', price: 3,  en: 6,  boost: 15, time: 2 },
  sausage:{ name: 'Sosis',           icon: '🌭', price: 6,  en: 12, boost: 25, time: 3 },
  fish:   { name: 'Izgara Balık',    icon: '🐟', price: 8,  en: 16, boost: 0,  time: 3.5 },
  soup:   { name: 'Mantar Çorbası',  icon: '🍲', price: 8,  en: 18, boost: 0,  time: 3 },
  kebab:  { name: 'Şiş Kebap',       icon: '🍢', price: 10, en: 22, boost: 45, time: 4 },
};
const Home = (Ex.home = {
  O: { x: -54, z: 38 }, HX: 5, HZ: 4, FY: 0.3, Y: { cx: -46, cz: 38, hx: 17, hz: 14 },
  fire: { x: -39, z: 32 }, grill: { x: -37, z: 45 }, bench: { x: -46, z: 31 },
  w: null, solids: [], itx: [], seats: [], trees: [], grp: null, roof: null, wallMat: null, gate: null, chopCd: 0, grillT: 0, campT: 0, cook: null, party: null,
});
Ex.mods.push(Home);
const hm = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));
const gAdd = (grp, m, x, y, z, sx, sy, sz) => { const o = mesh(BOX(), m, x, y, z); o.scale.set(sx, sy, sz); grp.add(o); return o; };
const aabb = (w, list, minx, maxx, miny, maxy, minz, maxz, type = 'wood') => { const s = { minx, maxx, miny, maxy, minz, maxz, type, active: true, deco: true }; w.solids.push(s); if (list) list.push(s); return s; };
Home.setWood = (n) => { save.wood = Math.max(0, n); queueSave(); const p = $('woodPill'); if (p) { p.querySelector('b').textContent = save.wood; } };

/* ---------- Bahçe: çit, kapı, ağaçlar, mangal, kamp ateşi ---------- */
function fenceRect(w, cx, cz, hx, hz, gw) {
  const g = new T.Group(), pm = hm(0xb98550), rm = hm(0x8b5a2b);
  const side = (x0, z0, x1, z1, gate) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2.6)), ax = (x1 - x0) / len, az = (z1 - z0) / len;
    for (let i = 0; i <= n; i++) { const t = (i / n) * len, x = x0 + ax * t, z = z0 + az * t; if (gate && Math.abs(z - cz) < gw / 2 - 0.2) continue; gAdd(g, pm, x, 0.75, z, 0.24, 1.5, 0.24); }
    const segs = gate ? [[0, len / 2 - gw / 2], [len / 2 + gw / 2, len]] : [[0, len]];
    segs.forEach(([a, b]) => {
      const mx = x0 + ax * (a + b) / 2, mz = z0 + az * (a + b) / 2, l = b - a, horiz = Math.abs(ax) > 0.5;
      [0.55, 1.1].forEach((y) => gAdd(g, rm, mx, y, mz, horiz ? l : 0.1, 0.14, horiz ? 0.1 : l));
      aabb(w, null, horiz ? mx - l / 2 : mx - 0.15, horiz ? mx + l / 2 : mx + 0.15, -1, 1.7, horiz ? mz - 0.15 : mz - l / 2, horiz ? mz + 0.15 : mz + l / 2);
    });
  };
  side(cx - hx, cz - hz, cx + hx, cz - hz); side(cx - hx, cz + hz, cx + hx, cz + hz); side(cx - hx, cz - hz, cx - hx, cz + hz); side(cx + hx, cz - hz, cx + hx, cz + hz, true);
  /* kapı kanatları */
  const leaves = [-1, 1].map((s) => {
    const p = new T.Group(); p.position.set(cx + hx, 0, cz + s * gw / 2); const lm = hm(0xd9a15b);
    const L = gw / 2 - 0.1; [0.5, 1.0].forEach((y) => gAdd(p, lm, 0, y, -s * L / 2, 0.12, 0.16, L)); gAdd(p, lm, 0, 0.75, -s * L / 2, 0.1, 0.12, L * 0.9).rotation.x = s * 0.5; gAdd(p, hm(0xb98550), 0, 0.75, 0, 0.26, 1.5, 0.26); g.add(p); return { p, s };
  });
  const lock = mesh(geo('box', 0.5, 0.45, 0.2), hm(0xffc933, { metalness: 0.5 }), cx + hx + 0.18, 0.95, cz); g.add(lock);
  const sh = mesh(geo('tor', 0.17, 0.05, 10), hm(0xdddddd, { metalness: 0.6 }), cx + hx + 0.18, 1.2, cz); sh.rotation.y = Math.PI / 2; g.add(sh); lock.add(sh); sh.position.set(0, 0.3, 0); sh.scale.setScalar(1);
  const block = aabb(w, null, cx + hx - 0.2, cx + hx + 0.2, -1, 1.7, cz - gw / 2, cz + gw / 2); shadowAll(g); w.group.add(g);
  return { leaves, lock, block, t: 0 };
}
function chopTree(w, x, z, s) {
  const g = new T.Group(), inner = new T.Group(); g.position.set(x, 0, z); g.add(inner);
  inner.add(mesh(geo('cyl', 0.24, 0.4, 2.0, 10), barkMat(), 0, 1.0, 0));
  const sd = Math.floor(rand(0, 5)), c = pick([0x3fae5a, 0x4fc060, 0x35a055]);
  inner.add(mesh(geo('blob', 1.3, sd), M(c), 0, 2.7, 0)); inner.add(mesh(geo('blob', 0.95, sd + 1), M(c + 0x0a1408), 0.7, 2.3, 0.3)); inner.add(mesh(geo('blob', 0.9, sd + 2), M(c + 0x081006), -0.6, 3.3, -0.2));
  g.scale.setScalar(s); shadowAll(g); w.group.add(g);
  const blk = blockAt(w, x, 0, z, 0.4 * s, 4 * s);
  const tr = { x, z, s, g, inner, hp: 4, shake: 0, fall: 0, regrow: 0, blk, it: null };
  tr.it = { x, z, r: 2.7, label: '🪓 Ağacı Kes (4/4)', fn: () => Home.chop(tr) }; w.interacts.push(tr.it); Home.trees.push(tr); return tr;
}
Home.chop = (tr) => {
  if (tr.hp <= 0 || G.time < Home.chopCd) return; Home.chopCd = G.time + 0.38;
  P.punch = 0.3; P.yaw = Math.atan2(tr.x - P.pos.x, tr.z - P.pos.z); tr.shake = 0.4; tr.hp--; Sfx.play('hit');
  FX.burst(tr.x, 1.4, tr.z, [0x9b6b3a, 0xc9924e, 0x6bc94a], 7, 3.5, 0.17, 0.55, 8, 2);
  tr.it.label = `🪓 Ağacı Kes (${tr.hp}/4)`;
  if (tr.hp <= 0) {
    tr.fall = 0.001; tr.dir = Math.atan2(tr.x - P.pos.x, tr.z - P.pos.z); tr.g.rotation.y = tr.dir; tr.it.r = 0; tr.blk.active = false; Sfx.play('stomp');
    const n = 4 + (Math.random() < 0.4 ? 1 : 0); Home.setWood(save.wood + n); G.ui.toast(`🪵 +${n} odun! (Toplam ${save.wood})`, 'gold'); addStat && addStat('abil');
  }
};
Home.updateTrees = (dt) => {
  for (const tr of Home.trees) {
    if (tr.shake > 0) { tr.shake -= dt; tr.inner.rotation.z = Math.sin(G.time * 55) * 0.05 * (tr.shake / 0.4); } else if (tr.fall === 0) tr.inner.rotation.z = 0;
    if (tr.fall > 0) {
      tr.fall += dt * 1.5; const k = Math.min(1, tr.fall); tr.inner.rotation.x = k * k * 1.5;
      if (tr.fall > 1.25) { FX.burst(tr.x, 0.6, tr.z, [0x9b6b3a, 0xc9924e], 10, 4, 0.2, 0.6, 8, 2); tr.fall = 0; tr.g.visible = false; tr.regrow = 90; }
    } else if (tr.regrow > 0) {
      tr.regrow -= dt; if (tr.regrow <= 0) { tr.hp = 4; tr.g.visible = true; tr.inner.rotation.set(0, 0, 0); tr.g.scale.setScalar(0.2); tr.grow = 0; tr.blk.active = true; tr.it.r = 2.7; tr.it.label = '🪓 Ağacı Kes (4/4)'; }
    } else if (tr.grow !== undefined && tr.grow < 1) { tr.grow += dt * 0.5; tr.g.scale.setScalar(lerp(0.2, tr.s, Math.min(1, tr.grow))); }
  }
};
function mkFlames(grp, y, n) {
  const fl = new T.Group(), cols = [0xff7a1a, 0xffb02e, 0xffe27a]; fl.position.y = y; grp.add(fl);
  for (let i = 0; i < n; i++) { const m = mesh(geo('cone', 0.22 - i * 0.04, 0.8 - i * 0.12, 6), new T.MeshBasicMaterial({ color: cols[i % 3], transparent: true, opacity: 0.9 }), (i - n / 2 + 0.5) * 0.2, 0.3, (i % 2) * 0.12 - 0.06); fl.add(m); }
  fl.visible = false; return fl;
}
Home.buildYard = (w) => {
  const Y = Home.Y, gw = 4.6; Home.trees = []; Home.itx = []; Home.seats = [];
  Home.gate = fenceRect(w, Y.cx, Y.cz, Y.hx, Y.hz, gw);
  addSign(w, Y.cx + Y.hx + 2.2, 0, Y.cz - 3.4, '🔒'); Home.signG = w.signs[w.signs.length - 1];
  /* ağaçlar */
  [[-60, 27.5, 1.15], [-55, 26.5, 1.0], [-60.5, 49, 1.1], [-55, 50.2, 1.05], [-45, 50.2, 1.0], [-33.5, 27.5, 1.1], [-61, 32, 0.95]].forEach(([x, z, s]) => chopTree(w, x, z, s));
  /* patika taşları: kapıdan eve */
  const pathM = hm(0xd6c3a0); for (let x = Y.cx + Y.hx - 1; x > Home.O.x + Home.HX + 0.5; x -= 1.6) { const st = mesh(geo('cyl', 0.62, 0.66, 0.08, 9), pathM, x, 0.04, Home.O.z + Math.sin(x * 2) * 0.18); st.receiveShadow = true; w.group.add(st); }
  /* mangal */
  const gr = Home.grill, g = new T.Group(); g.position.set(gr.x, 0, gr.z); g.rotation.y = -0.5; const dk = hm(0x2c2f38, { metalness: 0.4, roughness: 0.5 });
  [[-0.55, -0.28], [0.55, -0.28], [-0.55, 0.28], [0.55, 0.28]].forEach(([x, z]) => g.add(mesh(geo('cyl', 0.05, 0.05, 0.8, 6), dk, x, 0.4, z)));
  const tub = mesh(geo('box', 1.3, 0.34, 0.72), dk, 0, 0.9, 0); g.add(tub); Home.coals = mesh(geo('box', 1.12, 0.06, 0.55), new T.MeshStandardMaterial({ color: 0x2a2220, emissive: 0x000000 }), 0, 1.07, 0); g.add(Home.coals);
  for (let i = -4; i <= 4; i++) g.add(mesh(geo('box', 0.02, 0.02, 0.7), hm(0xcfd2d8, { metalness: 0.7 }), i * 0.13, 1.13, 0));
  const side = mesh(geo('box', 0.9, 0.06, 0.6), hm(0xb98550), 1.2, 0.85, 0); g.add(side); g.add(mesh(geo('cyl', 0.04, 0.04, 0.85, 5), hm(0x8b5a2b), 1.55, 0.42, 0.22)); g.add(mesh(geo('cyl', 0.04, 0.04, 0.85, 5), hm(0x8b5a2b), 0.85, 0.42, -0.22));
  Home.grillFlames = mkFlames(g, 1.1, 3); shadowAll(g); w.group.add(g); blockAt(w, gr.x, 0, gr.z, 1.0, 1.4);
  Home.grillIt = { x: gr.x, z: gr.z, r: 3.2, label: '', fn: () => Home.useGrill() }; w.interacts.push(Home.grillIt);
  /* kamp ateşi + minderler */
  const f = Home.fire, cg = new T.Group(); cg.position.set(f.x, 0, f.z);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283; cg.add(mesh(geo('sph', 0.26, 6, 5), hm(0x8d8a96), Math.cos(a) * 0.95, 0.12, Math.sin(a) * 0.95)); }
  for (let i = 0; i < 3; i++) { const l = mesh(geo('cyl', 0.1, 0.12, 1.3, 6), hm(0x6a4222), 0, 0.22, 0); l.rotation.z = Math.PI / 2; l.rotation.y = i * 1.05; cg.add(l); }
  Home.campFlames = mkFlames(cg, 0.15, 3); Home.campFlames.scale.setScalar(1.7); shadowAll(cg); w.group.add(cg); blockAt(w, f.x, 0, f.z, 1.15, 0.8);
  Home.pads = []; const padCols = [0xff8fb1, 0xffd23f, 0x7fd8ff, 0xa6e36f, 0xc89bff, 0xffa05c];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.283 + 0.3, x = f.x + Math.cos(a) * 3.4, z = f.z + Math.sin(a) * 3.4, pd = mesh(geo('cyl', 0.62, 0.66, 0.2, 14), hm(padCols[i]), x, 0.1, z); pd.receiveShadow = true; w.group.add(pd);
    const pad = { x, z, yaw: Math.atan2(f.x - x, f.z - z) }; Home.pads.push(pad);
    const it = { x, z, r: 1.6, base: '🧘 Minderde Otur', label: '🧘 Minderde Otur', fn: () => Home.sitAt({ kind: 'sit', x, y: 0.22, z, yaw: pad.yaw, ex: x + Math.sin(pad.yaw) * 1.3, ez: z + Math.cos(pad.yaw) * 1.3 }) }; w.interacts.push(it); Home.itx.push(it);
  }
  Home.campIt = { x: f.x, z: f.z, r: 2.6, label: '', fn: () => Home.useCamp() }; w.interacts.push(Home.campIt);
  /* yapı tezgahı */
  const b = Home.bench, bg = new T.Group(); bg.position.set(b.x, 0, b.z); bg.rotation.y = 0.3;
  gAdd(bg, hm(0xc9924e), 0, 0.85, 0, 2.3, 0.14, 1.05); [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]].forEach(([x, z]) => bg.add(mesh(geo('cyl', 0.07, 0.07, 0.85, 6), hm(0x8b5a2b), x, 0.42, z)));
  for (let i = 0; i < 3; i++) gAdd(bg, hm(0xe0b074), -0.7 + i * 0.05, 0.99 + i * 0.07, 0.1, 1.0, 0.06, 0.3);
  bg.add(mesh(geo('box', 0.12, 0.12, 0.5), hm(0x8b5a2b), 0.5, 1.0, 0.1)); bg.add(mesh(geo('box', 0.34, 0.12, 0.14), hm(0x9aa0aa, { metalness: 0.6 }), 0.5, 1.07, -0.12));
  shadowAll(bg); w.group.add(bg); blockAt(w, b.x, 0, b.z, 1.4, 1.2); w.interacts.push({ x: b.x, z: b.z, r: 3.4, label: '🔨 Yapı Tezgahı: Evini Tasarla', fn: () => Home.openBuild() });
  addSign(w, Y.cx + Y.hx - 2.6, 0, Y.cz + 3.4, '🏡 Ev Arsan! Ağaç kes 🪓 → odun topla 🪵 → Yapı Tezgahı\'nda evini inşa et. Mangalda yemek pişir 🍖');
  /* sepet-işaret: odun sayacı */
  Home.buildHud();
};
Home.buildHud = () => { const p = $('woodPill'); if (p) p.classList.remove('hidden'); Home.setWood(save.wood); };

/* ---------- Ev: aşama aşama inşa ---------- */
Home.rebuild = () => {
  const w = Home.w; if (!w) return;
  if (Home.grp) w.group.remove(Home.grp); if (Home.plotSign) { const i = w.signs.indexOf(Home.plotSign.s); if (i >= 0) w.signs.splice(i, 1); w.group.remove(Home.plotSign.g); Home.plotSign = null; }
  Home.solids.forEach((s) => { const i = w.solids.indexOf(s); if (i >= 0) w.solids.splice(i, 1); }); Home.solids = [];
  Home.itx.filter((i) => i.house).forEach((it) => { const k = w.interacts.indexOf(it); if (k >= 0) w.interacts.splice(k, 1); }); Home.itx = Home.itx.filter((i) => !i.house); Home.seats = Home.seats.filter((s) => !s.house);
  const H = save.home, st = H.stage, O = Home.O, HX = Home.HX, HZ = Home.HZ, FY = Home.FY, Tk = 0.35, g = new T.Group(); g.position.set(O.x, 0, O.z); Home.grp = g; w.group.add(g);
  const wallC = HOME_PAL.wall[H.wall] || 0xfff0d6, roofC = HOME_PAL.roof[H.roof] || 0xd9534f, doorC = HOME_PAL.door[H.door] || 0x4aa8ff;
  const col = (lx0, lx1, y0, y1, lz0, lz1) => aabb(w, Home.solids, O.x + lx0, O.x + lx1, y0, y1, O.z + lz0, O.z + lz1);
  Home.roof = null; Home.wallMat = null;
  if (st < 1) {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { g.add(mesh(geo('cyl', 0.07, 0.07, 1.4, 5), hm(0xb98550), sx * HX, 0.7, sz * HZ)); const fl = mesh(geo('cone', 0.25, 0.4, 3), hm(0xff6f61), sx * HX + 0.25, 1.3, sz * HZ); fl.rotation.z = -Math.PI / 2; g.add(fl); });
    [[0, -HZ, 2 * HX, 0.08], [0, HZ, 2 * HX, 0.08]].forEach(([x, z, l]) => gAdd(g, hm(0xf2e3b0), x, 0.04, z, l, 0.05, 0.12)); [[-HX, 0], [HX, 0]].forEach(([x, z]) => gAdd(g, hm(0xf2e3b0), x, 0.04, z, 0.12, 0.05, 2 * HZ));
    const mk = mesh(geo('box', 1, 1, 1), hm(0xd6a15d), 0, 1.5, 0); mk.scale.set(2.6, 0.9, 0.1); g.add(mk); g.add(mesh(geo('cyl', 0.07, 0.07, 1.6, 5), hm(0x7a4a22), -1.1, 0.8, 0)); g.add(mesh(geo('cyl', 0.07, 0.07, 1.6, 5), hm(0x7a4a22), 1.1, 0.8, 0));
    addSign(w, O.x + HX + 2.5, 0, O.z + HZ - 1, '🏗️ Boş arsa! Odun topla, Yapı Tezgahı\'ndan evini inşa et.'); Home.plotSign = { s: w.signs[w.signs.length - 1], g: w.group.children[w.group.children.length - 1] };
  } else {
    /* temel + zemin */
    const fl = mesh(BOX(), hm(0xc99a5c, { roughness: 0.7 }), 0, FY - 0.2, 0); fl.scale.set(2 * HX + 0.9, 0.4, 2 * HZ + 0.9); fl.receiveShadow = true; g.add(fl);
    for (let i = -HX; i <= HX; i += 1) { const pl = mesh(BOX(), hm(0xb98550), i, FY + 0.005, 0); pl.scale.set(0.04, 0.01, 2 * HZ); g.add(pl); }
    col(-HX - 0.45, HX + 0.45, -1, FY, -HZ - 0.45, HZ + 0.45);
    gAdd(g, hm(0xb7b2a4), HX + 0.9, 0.08, 0, 0.9, 0.16, 2.8);
  }
  if (st >= 2) {
    const wm = new T.MeshStandardMaterial({ color: wallC, roughness: 0.85, transparent: true }); Home.wallMat = wm; Home.wallOp = 1;
    const WH = 3.2, wy = FY + WH / 2, wall = (cx, cz, sx, sz, y0 = FY, y1 = FY + WH) => { const b = mesh(BOX(), wm, cx, (y0 + y1) / 2, cz); b.scale.set(sx, y1 - y0, sz); b.castShadow = true; b.receiveShadow = true; g.add(b); col(cx - sx / 2, cx + sx / 2, y0, y1, cz - sz / 2, cz + sz / 2); };
    wall(-HX, 0, Tk, 2 * HZ + Tk); wall(0, -HZ, 2 * HX + Tk, Tk); wall(0, HZ, 2 * HX + Tk, Tk);
    wall(HX, -(HZ + 1.2) / 2, Tk, HZ - 1.2 + Tk / 2); wall(HX, (HZ + 1.2) / 2, Tk, HZ - 1.2 + Tk / 2); wall(HX, 0, Tk, 2.4, FY + 2.6, FY + WH);
    const dm = hm(doorC); gAdd(g, dm, HX + 0.02, FY + 1.3, -1.28, 0.42, 2.6, 0.16); gAdd(g, dm, HX + 0.02, FY + 1.3, 1.28, 0.42, 2.6, 0.16); gAdd(g, dm, HX + 0.02, FY + 2.66, 0, 0.42, 0.16, 2.72);
    const lf = gAdd(g, dm, HX + 0.9, FY + 1.2, -1.75, 1.3, 2.4, 0.1); lf.rotation.y = 0.5; g.add(mesh(geo('sph', 0.07, 6, 5), hm(0xffd23f), HX + 1.3, FY + 1.2, -1.5));
    const glass = new T.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x3a6a88, emissiveIntensity: 0.35, roughness: 0.1, metalness: 0.3 }), fm = hm(0xffffff);
    [[-2.8, -HZ], [2.6, -HZ], [-2.8, HZ], [2.8, HZ]].forEach(([x, z]) => { const s = z < 0 ? -1 : 1; gAdd(g, fm, x, FY + 1.8, z + s * 0.19, 1.7, 1.3, 0.06); gAdd(g, glass, x, FY + 1.8, z + s * 0.23, 1.45, 1.05, 0.04); gAdd(g, fm, x, FY + 1.8, z + s * 0.26, 0.06, 1.05, 0.04); });
    gAdd(g, fm, -HX - 0.19, FY + 1.8, 0, 0.06, 1.3, 1.7); gAdd(g, glass, -HX - 0.23, FY + 1.8, 0, 0.04, 1.05, 1.45);
  }
  if (st >= 3) {
    const roof = new T.Group(); roof.position.y = FY + 3.2; g.add(roof), Home.roof = roof;
    const rm = new T.MeshStandardMaterial({ color: roofC, roughness: 0.8, flatShading: true }), body = mesh(geo('cone', 1, 1, 4), rm, 0, 1.75, 0); body.rotation.y = Math.PI / 4; body.scale.set((2 * HX + 1.9) / 2 / 0.7071, 3.5, (2 * HZ + 1.9) / 2 / 0.7071); body.castShadow = true; roof.add(body);
    const ch = mesh(BOX(), hm(0xa8553c), 3, 2.2, -1.6); ch.scale.set(0.8, 2.2, 0.8); ch.castShadow = true; roof.add(ch); gAdd(roof, hm(0x5b3a2a), 3, 3.38, -1.6, 1.0, 0.14, 1.0);
  }
  /* mobilyalar */
  if (st >= 2) {
    const it = H.items || {}, wood = hm(0xc9924e), dark = hm(0x8b5a2b), cosyC = HOME_PAL.roof[H.roof] || 0xd9534f, fab = hm(cosyC), fab2 = hm(cosyC + 0x181818);
    const seat = (id, kind, lx, y, lz, yaw, ex, ez, label, rad = 2.6) => {
      const x = O.x + lx, z = O.z + lz, s = { house: true, kind, x, y, z, yaw, ex: O.x + ex, ez: O.z + ez }; Home.seats.push(s);
      const itx = { house: true, x, z, r: rad, base: label, label, fn: () => Home.sitAt(s) }; w.interacts.push(itx); Home.itx.push(itx);
    };
    if (it.bed) {
      const b = new T.Group(); b.position.set(-3.1, FY, -1.9); gAdd(b, dark, 0, 0.22, 0, 2.3, 0.44, 3.7); gAdd(b, hm(0xffffff), 0, 0.55, 0, 2.05, 0.22, 3.4); gAdd(b, fab2, 0, 0.7, 0.6, 2.08, 0.1, 2.0); gAdd(b, hm(0xfff7ea), 0, 0.72, -1.35, 1.5, 0.18, 0.7); gAdd(b, dark, 0, 0.7, -1.82, 2.3, 1.0, 0.12); shadowAll(b); g.add(b);
      col(-4.25, -1.95, FY - 0.5, FY + 0.7, -3.75, -0.05); seat('bed', 'lie', -3.1, FY + 0.95, -1.4, 0, -1.2, 0.6, '🛏️ Yatağa Yat');
    }
    if (it.sofa) {
      const s = new T.Group(); s.position.set(-0.6, FY, 3.0); gAdd(s, fab, 0, 0.27, 0, 3.3, 0.5, 1.3); gAdd(s, fab2, 0, 0.8, 0.55, 3.3, 0.85, 0.3); [-1, 1].forEach((k) => gAdd(s, fab2, k * 1.62, 0.52, 0, 0.26, 0.6, 1.3));
      [-0.8, 0.8].forEach((x) => gAdd(s, hm(cosyC + 0x303030), x, 0.62, -0.05, 1.3, 0.2, 1.0)); shadowAll(s); g.add(s); col(-2.3, 1.1, FY - 0.5, FY + 0.6, 2.35, 3.7);
      seat('sofa', 'sit', -0.6, FY + 0.5, 2.9, Math.PI, -0.6, 1.2, '🛋️ Koltuğa Otur');
    }
    if (it.table) { const t = new T.Group(); t.position.set(1.4, FY, -0.7); gAdd(t, wood, 0, 0.85, 0, 1.9, 0.12, 1.15); [[-0.8, -0.45], [0.8, -0.45], [-0.8, 0.45], [0.8, 0.45]].forEach(([x, z]) => gAdd(t, dark, x, 0.42, z, 0.1, 0.84, 0.1)); t.add(mesh(geo('cyl', 0.2, 0.17, 0.05, 10), hm(0xffffff), -0.3, 0.94, 0)); t.add(mesh(geo('cyl', 0.07, 0.06, 0.12, 8), hm(0xff8fb1), 0.4, 0.97, 0.1)); shadowAll(t); g.add(t); col(0.4, 2.4, FY - 0.5, FY + 0.92, -1.3, -0.1); }
    if (it.rug) { const r = mesh(geo('cyl', 1.8, 1.8, 0.03, 20), hm(0xb28bff), 0.4, FY + 0.02, 0.5); g.add(r); const r2 = mesh(geo('cyl', 1.15, 1.15, 0.035, 20), hm(0xffd23f), 0.4, FY + 0.025, 0.5); g.add(r2); }
    if (it.lamp) { const l = new T.Group(); l.position.set(3.7, FY, -3.0); l.add(mesh(geo('cyl', 0.2, 0.25, 0.08, 8), dark, 0, 0.04, 0)); l.add(mesh(geo('cyl', 0.04, 0.04, 1.5, 6), dark, 0, 0.8, 0)); l.add(mesh(geo('cone', 0.4, 0.5, 10), new T.MeshBasicMaterial({ color: 0xffe9a0 }), 0, 1.7, 0)); shadowAll(l); g.add(l); }
    if (it.shelf) { const s = new T.Group(); s.position.set(-4.55, FY, 2.0); gAdd(s, wood, 0, 1.15, 0, 0.5, 2.3, 2.1); [0.55, 1.15, 1.75].forEach((y) => { for (let k = 0; k < 6; k++) gAdd(s, hm([0xe05555, 0x4aa8ff, 0xf4c430, 0x4cc76a, 0xa56bff, 0xff8fb1][k]), 0.2, y + 0.2, -0.85 + k * 0.32, 0.22, 0.4, 0.22); }); shadowAll(s); g.add(s); col(-4.85, -4.25, FY - 0.5, FY + 2.3, 0.9, 3.1); }
    if (it.plant) { const p = new T.Group(); p.position.set(3.7, FY, 3.0); p.add(mesh(geo('cyl', 0.3, 0.22, 0.45, 9), hm(0xc2693c), 0, 0.22, 0)); p.add(mesh(geo('blob', 0.5, 2), hm(0x3fae5a), 0, 0.85, 0)); p.add(mesh(geo('blob', 0.34, 3), hm(0x58c76a), 0.2, 1.25, 0.1)); shadowAll(p); g.add(p); }
  }
};

/* ---------- Otur / yat ---------- */
Home.sitAt = (s) => {
  if (Ex.seat) { Home.stand(); return; }
  Ex.seat = { kind: s.kind, x: s.x, y: s.y, z: s.z, yaw: s.yaw, ex: s.ex, ez: s.ez, t: 0, zz: 0, slept: false }; P.vel.set(0, 0, 0); P.fly = false; P.rolling = 0; P.vehicle = null; P.sprintOn = false;
  G.ui.toast(s.kind === 'lie' ? '😴 Yattın! Kalkmak için hareket et ya da zıpla.' : '😌 Oturdun! Kalkmak için hareket et ya da zıpla.');
};
Home.stand = () => {
  const s = Ex.seat; if (!s) return; Ex.seat = null; const w = G.world; P.pos.set(s.ex, (w.groundAt ? Math.max(w.groundAt(s.ex, s.ez), Home.FY * (Home.w && Math.abs(s.ex - Home.O.x) < Home.HX && Math.abs(s.ez - Home.O.z) < Home.HZ && save.home.stage >= 1 ? 1 : 0)) : 0) + 0.05, s.ez); P.vel.set(0, 0, 0);
};
Home.hold = (dt) => {
  const s = Ex.seat; if (!s) return false;
  P.vel.set(0, 0, 0); P.pos.set(s.x, s.y, s.z); P.onGround = true; P.fly = false; s.t += dt;
  const mv = Math.hypot(Input.tx, Input.tz) > 0.35 || ['KeyW', 'KeyA', 'KeyS', 'KeyD'].some((k) => Input.keys.has(k)) || Input.jumpTouch || P.jumpHeld;
  if (s.t > 0.7 && mv) { Home.stand(); return false; }
  if (s.kind === 'lie') {
    P.energy = Math.min(Math.max(P.energy, maxEn()), P.energy + dt * maxEn() * 0.22); s.zz -= dt;
    if (s.t > 1.5 && s.zz <= 0) { s.zz = 1.4; Labels.temp('💤', 'emote', (v) => v.set(s.x, s.y + 1.6, s.z - 0.6), 1.8); }
    if (s.t > 5 && !s.slept) { s.slept = true; G.ui.toast('😴 Güzelce dinlendin! Enerjin doldu.', 'gold'); }
  } else if (s.t > 8 && !s.rest) { s.rest = true; P.energy = Math.min(Math.max(P.energy, maxEn()), P.energy + maxEn() * 0.3); G.ui.toast('😌 Biraz dinlendin, enerji toparladın!'); }
  return true;
};
Home.visual = (m) => {
  const s = Ex.seat, u = m.userData;
  if (!s) { if (Home.posed) { m.rotation.x = 0; Home.posed = false; if (u.body) { u.body.position.y = 0; } } return; }
  Home.posed = true; m.position.set(s.x, s.y, s.z); m.rotation.y = s.yaw; const t = G.time;
  if (s.kind === 'lie') { m.rotation.x = -Math.PI / 2; m.position.y = s.y - 0.1; u.legL.rotation.x = 0; u.legR.rotation.x = 0; u.armL.rotation.set(0, 0, -0.3); u.armR.rotation.set(0, 0, 0.3); u.body.position.y = 0; u.head.rotation.z = Math.sin(t * 1.2) * 0.04; }
  else { m.rotation.x = 0; m.position.y = s.y - 0.12; u.legL.rotation.x = -1.4; u.legR.rotation.x = -1.4; u.armL.rotation.set(-0.5, 0, -0.2); u.armR.rotation.set(-0.5, 0, 0.2); u.body.position.y = -0.1 + Math.sin(t * 2) * 0.01; }
};

/* ---------- Ateşler, yemek ---------- */
Home.fuelLeft = (t) => (t > 0 ? `${Math.ceil(t)} sn` : '');
Home.useGrill = () => {
  if (Home.grillT > 0) { Home.openCook(); return; }
  if (save.wood < 1) { G.ui.toast('🪵 Mangalı yakmak için 1 odun lazım. Ağaç kes!'); return; }
  Home.setWood(save.wood - 1); Home.grillT = 150; Sfx.play('pop'); FX.burst(Home.grill.x, 1.2, Home.grill.z, [0xff7a1a, 0xffd23f], 12, 3, 0.2, 0.6, -2, 3); G.ui.toast('🔥 Mangal yandı! Yemek pişirebilirsin.', 'gold');
};
Home.useCamp = () => {
  if (Home.party) { G.ui.toast('🎉 Parti sürüyor! Eğlen!'); return; }
  if (Home.campT <= 0) {
    if (save.wood < 2) { G.ui.toast('🪵 Kamp ateşi için 2 odun lazım. Ağaç kes!'); return; }
    Home.setWood(save.wood - 2); Home.campT = 240; Sfx.play('pop'); FX.burst(Home.fire.x, 0.6, Home.fire.z, [0xff7a1a, 0xffd23f], 14, 3, 0.22, 0.6, -2, 3); G.ui.toast('🔥 Kamp ateşi yandı! Evin hazırsa pijama partisi başlatabilirsin.', 'gold'); return;
  }
  Home.startParty();
};
Home.openCook = () => {
  const rows = Object.entries(FOODS).map(([id, f]) => `<div class="quest"><div class="qi">${f.icon}</div><div class="qt">${f.name}<br><small>⚡ +${f.en} sn enerji${f.boost ? ` • 🏃 ${f.boost} sn hızlı koşu` : ''}</small></div><div class="qr"><button class="tab" data-act="cook" data-id="${id}">${f.price} 🪙 Pişir</button></div></div>`).join('');
  showScreen(`<div class="panel">${closeBtn}<h2>🍖 Mangal</h2><p class="sub">🪙 ${save.coins} • Mangal ${Home.fuelLeft(Home.grillT)} yanacak</p>${rows}${Home.foodList()}<p class="note">Pişen yemekler çantana girer. Yiyince uçuş enerjin bile dolu halinden fazla olur!</p></div>`, 'cook');
};
Home.foodList = () => {
  const have = Object.keys(FOODS).filter((id) => (save.food[id] || 0) > 0);
  if (!have.length) return '<p class="note" style="margin-top:10px">🎒 Çantanda yemek yok.</p>';
  return `<h3 style="margin:12px 0 4px">🎒 Çantadaki yemekler</h3><div class="row">${have.map((id) => `<button class="tab" data-act="eat" data-id="${id}">${FOODS[id].icon} ${FOODS[id].name} ×${save.food[id]} • Ye</button>`).join('')}</div>`;
};
Ex.acts.cook = (d) => {
  const f = FOODS[d.id]; if (!f || Home.cook) return;
  if (Home.grillT <= 0) { G.ui.toast('🔥 Mangal söndü!'); closeScreen(); return; }
  if (save.coins < f.price) { G.ui.toast('🪙 Yeterli paran yok.'); return; }
  addCoins(-f.price); Home.cook = { id: d.id, t: 0, total: f.time }; closeScreen(); $('cookBar').classList.remove('hidden'); Sfx.play('click');
};
Ex.acts.eat = (d) => { Home.eat(d.id); if (Scr.kind === 'cook') Home.openCook(); else if (Scr.kind === 'bag') ui.openBag(); };
Home.eat = (id) => {
  const f = FOODS[id]; if (!f || !(save.food[id] > 0)) return; save.food[id]--; queueSave();
  P.energy = Math.min(maxEn() * 1.6, Math.max(P.energy, 0) + f.en); if (f.boost) P.boost = Math.max(P.boost || 0, f.boost); Sfx.play('pop');
  Labels.temp('😋 Nam nam!', 'emote', (v) => v.set(P.pos.x, P.pos.y + 2.6, P.pos.z), 1.8); FX.burst(P.pos.x, P.pos.y + 1.2, P.pos.z, [0xffd23f, 0xff8fb1], 8, 3, 0.2, 0.6, 4, 2);
  G.ui.toast(`${f.icon} ${f.name}: +${f.en} sn enerji${f.boost ? ` ve ${f.boost} sn hızlı koşu!` : '!'}`, 'gold');
};
Home.updateCook = (dt) => {
  const c = Home.cook; if (!c) return;
  const gr = Home.grill, far = Math.hypot(P.pos.x - gr.x, P.pos.z - gr.z) > 7;
  if (far || Home.grillT <= 0) { Home.cook = null; $('cookBar').classList.add('hidden'); addCoins(FOODS[c.id].price); G.ui.toast('🍳 Mangaldan uzaklaştın, pişirme iptal. Paran iade!'); return; }
  c.t += dt; $('cookFill').style.transform = `scaleX(${clamp(c.t / c.total, 0, 1)})`; $('cookTxt').textContent = `${FOODS[c.id].icon} ${FOODS[c.id].name} pişiyor…`;
  if (Math.random() < 0.5) FX.spawn(gr.x + rand(-0.4, 0.4), 1.3, gr.z + rand(-0.3, 0.3), rand(-0.3, 0.3), rand(1.2, 2.2), rand(-0.3, 0.3), 0xe8e8ee, 0.18, 1.1, -1);
  if (c.t >= c.total) { save.food[c.id] = (save.food[c.id] || 0) + 1; queueSave(); Home.cook = null; $('cookBar').classList.add('hidden'); Sfx.play('chest'); celebrate(gr.x, 1.2, gr.z, false, 'Hazır! 😋'); G.ui.toast(`${FOODS[c.id].icon} ${FOODS[c.id].name} hazır! Çantana eklendi.`, 'gold'); addStat && addStat('abil'); }
};

/* ---------- Pijama partisi ---------- */
Home.canParty = () => save.home.stage >= 3 && Home.campT > 0 && rescuedCount() >= 1 && !Home.party;
Home.startParty = () => {
  if (save.home.stage < 3) { G.ui.toast('🏠 Önce evini bitir (temel, duvarlar, çatı)! Parti evde de devam eder.'); return; }
  if (rescuedCount() < 1) { G.ui.toast('🐾 Partiye çağıracak arkadaşın yok. Önce birini kurtar!'); return; }
  const w = Home.w, Y = Home.Y, fr = FRIEND_ORDER.filter((f) => save.rescued[f]), npcs = [];
  fr.forEach((fid, i) => {
    const m = makeCreature(fid); m.position.set(Y.cx + Y.hx + 1.5, 0, Y.cz); w.group.add(m);
    const cap = mesh(geo('cone', 0.22, 0.5, 8), new T.MeshStandardMaterial({ color: [0xb28bff, 0xff8fb1, 0x7fd8ff, 0xffd23f, 0x7ed957][i % 5] }), 0, 0.62, -0.05); cap.rotation.x = -0.25; m.userData.head.add(cap); m.userData.head.add(mesh(geo('sph', 0.07, 6, 5), M(0xffffff), 0, 0.88, -0.17));
    npcs.push({ m, fid, pad: Home.pads[i % Home.pads.length], seated: false, say: 3 + i * 1.7 });
  });
  Home.party = { t: 0, dur: 85, npcs, prevTime: save.settings.time, confetti: 2 };
  save.settings.time = 'evening'; G.reapplyTod && G.reapplyTod(); celebrate(Home.fire.x, 1, Home.fire.z, true, 'Pijama Partisi! 🌙');
  G.ui.toast(`🌙 Pijama partisi başladı! ${fr.length} arkadaşın geliyor…`, 'gold'); Sfx.play('yayBig');
};
const PARTY_LINES = ['Marshmallow harika! 🍡', 'Mangal çok güzel kokuyor 🍖', 'Hadi masal anlatalım 📖', 'En güzel pijama benimki! 🌙', 'Yastık savaşı yapalım mı? 🛏️', 'Yıldızlara baksana ⭐', 'Mochi, bu ev çok güzel! 🏡'];
Home.updateParty = (dt) => {
  const pt = Home.party; if (!pt) return; pt.t += dt; const f = Home.fire;
  for (const n of pt.npcs) {
    const m = n.m, tx = n.pad.x, tz = n.pad.z, dx = tx - m.position.x, dz = tz - m.position.z, d = Math.hypot(dx, dz);
    if (!n.seated) { if (d < 0.25) n.seated = true; else { const sp = Math.min(d, 3.4 * dt); m.position.x += dx / d * sp; m.position.z += dz / d * sp; m.rotation.y = Math.atan2(dx, dz); animCreature(m, G.time, 'idle', 2.2); } }
    else { m.position.y = lerp(m.position.y, 0.2, Math.min(1, dt * 6)); m.rotation.y += angWrap(Math.atan2(f.x - tx, f.z - tz) - m.rotation.y) * Math.min(1, dt * 4); animCreature(m, G.time, 'idle', 0.5); n.say -= dt; if (n.say <= 0) { n.say = 7 + Math.random() * 5; Labels.temp(pick(PARTY_LINES), 'bubble', (v) => v.set(m.position.x, m.position.y + 2.4, m.position.z), 4.2); } }
  }
  pt.confetti -= dt; if (pt.confetti <= 0) { pt.confetti = 3.5; FX.confetti(f.x + rand(-3, 3), 4 + rand(0, 2), f.z + rand(-3, 3), 18); }
  if (pt.t >= pt.dur) Home.endParty();
};
Home.endParty = () => {
  const pt = Home.party; if (!pt) return; Home.party = null; const w = Home.w;
  pt.npcs.forEach((n) => w.group.remove(n.m)); save.settings.time = pt.prevTime; G.reapplyTod && G.reapplyTod();
  const n = pt.npcs.length, c = 25 * n; addCoins(c); P.energy = Math.min(Math.max(P.energy, maxEn()), maxEn() * 1.3);
  const gifts = []; pt.npcs.forEach(() => { const id = pick(Object.keys(FOODS)); save.food[id] = (save.food[id] || 0) + 1; gifts.push(FOODS[id].icon); }); save.seen.parties = (save.seen.parties || 0) + 1; queueSave();
  celebrate(P.pos.x, P.pos.y, P.pos.z, true, 'Ne güzel gece! 🌙'); G.ui.toast(`🌙 Parti bitti! +${c} 🪙 • hediye yemekler ${gifts.join(' ')} • ${save.seen.parties}. parti`, 'gold');
};

/* ---------- Tezgah paneli ---------- */
Home.openBuild = () => {
  const H = save.home, st = H.stage;
  const stages = HOME_STAGES.map((s, i) => {
    const done = st > i, cur = st === i, ok = save.wood >= s.wood;
    return `<div class="quest ${done ? 'done' : ''}"><div class="qi">${done ? '✅' : s.icon}</div><div class="qt">${i + 1}. ${s.name}<br><small>${done ? 'Tamamlandı' : cur ? `${s.wood} 🪵 odun gerekiyor` : 'Önceki adımı bitir'}</small></div><div class="qr">${cur ? `<button class="tab ${ok ? 'on' : ''}" data-act="hbuild">${ok ? '🔨 İnşa et' : `🪵 ${save.wood}/${s.wood}`}</button>` : ''}</div></div>`;
  }).join('');
  const sw = (kind) => `<div class="row" style="margin:4px 0"><b style="min-width:84px">${HOME_KIND[kind]}</b>${Object.entries(HOME_PAL[kind]).map(([k, c]) => `<button class="swatch ${H[kind] === k ? 'on' : ''}" style="background:#${c.toString(16).padStart(6, '0')}" data-act="hcolor" data-kind="${kind}" data-v="${k}" aria-label="${k}"></button>`).join('')}</div>`;
  const items = Object.entries(HOME_ITEMS).map(([id, it]) => { const own = !!H.items[id]; return `<button class="tile ${own ? 'on' : ''}" data-act="hitem" data-id="${id}"><span class="e">${it.icon}</span>${it.name}<br><small>${own ? '✓ Yerleşti • kaldır' : `${it.wood} 🪵`}</small></button>`; }).join('');
  showScreen(`<div class="panel">${closeBtn}<h2>🔨 Yapı Tezgahı</h2><p class="sub">🪵 Odunun: <b>${save.wood}</b> • Ağaçlara yaklaşıp 🪓 ile odun topla</p>${stages}
    ${st >= 1 ? `<h3 style="margin:12px 0 4px">🎨 Renkler</h3>${sw('wall')}${sw('roof')}${sw('door')}` : ''}
    ${st >= 2 ? `<h3 style="margin:12px 0 4px">🛋️ Eşyalar</h3><div class="grid tiles">${items}</div><p class="note">Yatağa yatabilir, koltuğa oturabilirsin. Evde enerji dolar!</p>` : '<p class="note" style="margin-top:10px">Duvarlar bitince eşya yerleştirebilirsin.</p>'}</div>`, 'build');
};
Ex.acts.hbuild = () => {
  const H = save.home, s = HOME_STAGES[H.stage]; if (!s) return; if (save.wood < s.wood) { G.ui.toast(`🪵 ${s.wood} odun lazım (sende ${save.wood}).`); return; }
  Home.setWood(save.wood - s.wood); H.stage++; queueSave(); Home.rebuild(); Home.openBuild(); Sfx.play('chest'); const O = Home.O;
  celebrate(O.x, 1, O.z, H.stage >= 3, H.stage >= 3 ? 'Evim hazır! 🏡' : `${s.name} tamam! 🔨`); FX.burst(O.x, 1.5, O.z, [0xc9924e, 0xe0b074, 0xffffff], 24, 6, 0.25, 0.8, 6, 3);
  if (H.stage >= 3) G.ui.toast('🏡 Evin hazır! Kamp ateşini yakıp pijama partisi yapabilirsin.', 'gold');
};
Ex.acts.hcolor = (d) => { if (!HOME_PAL[d.kind] || !HOME_PAL[d.kind][d.v]) return; save.home[d.kind] = d.v; queueSave(); Home.rebuild(); Home.openBuild(); Sfx.play('click'); };
Ex.acts.hitem = (d) => {
  const it = HOME_ITEMS[d.id], H = save.home; if (!it) return;
  if (H.items[d.id]) { delete H.items[d.id]; Home.setWood(save.wood + it.wood); G.ui.toast(`${it.icon} ${it.name} kaldırıldı, odunun iade edildi.`); }
  else { if (save.wood < it.wood) { G.ui.toast(`🪵 ${it.wood} odun lazım (sende ${save.wood}).`); return; } Home.setWood(save.wood - it.wood); H.items[d.id] = 1; Sfx.play('pop'); G.ui.toast(`${it.icon} ${it.name} yerleşti!`, 'gold'); }
  queueSave(); Home.rebuild(); Home.openBuild();
};

/* ---------- Dünya kancaları ---------- */
Home.onWorld = (w) => {
  Ex.seat = null; Home.party = null; Home.cook = null; $('cookBar') && $('cookBar').classList.add('hidden');
  const wp = $('woodPill'); if (wp) wp.classList.toggle('hidden', w.id !== 'village');
  if (w.id !== 'village') { Home.w = null; return; }
  Home.w = w; Home.solids = []; Home.grillT = 0; Home.campT = 0; Home.buildYard(w); Home.rebuild();
};
Home.update = (dt) => {
  const w = Home.w; if (!w || w !== G.world) return;
  const open = Ex.isOpen('home'), gt = Home.gate; gt.t = lerp(gt.t, open ? 1 : 0, Math.min(1, dt * 3));
  gt.leaves.forEach(({ p, s }) => { p.rotation.y = s * gt.t * 1.65; }); gt.lock.visible = !open; gt.block.active = !open;
  if (Home.signG) Home.signG.text = open ? '🏡 Ev Arsanıza hoş geldin! Ağaç kes, evini kur, mangal yap.' : '🔒 Ev Arsası: 2 arkadaşını kurtarınca kapı açılır!';
  const wp = $('woodPill'); if (wp && wp.firstElementChild && wp.firstElementChild.textContent !== String(save.wood)) wp.firstElementChild.textContent = save.wood;
  Home.updateTrees(dt); Home.updateCook(dt); Home.updateParty(dt);
  if (Home.grillT > 0) Home.grillT -= dt; if (Home.campT > 0) Home.campT -= dt;
  const t = G.time, flick = (fl, on) => { fl.visible = on; if (on) fl.children.forEach((c, i) => { c.scale.set(1 + Math.sin(t * 13 + i * 2) * 0.18, 1 + Math.sin(t * 9 + i) * 0.3, 1 + Math.sin(t * 11 + i) * 0.18); }); };
  flick(Home.grillFlames, Home.grillT > 0); flick(Home.campFlames, Home.campT > 0);
  Home.coals.material.emissive.setHex(Home.grillT > 0 ? 0xff4a10 : 0x000000);
  if (Home.grillT > 0 && Math.random() < 0.35) FX.spawn(Home.grill.x + rand(-0.4, 0.4), 1.3, Home.grill.z + rand(-0.3, 0.3), rand(-0.3, 0.3), rand(1.5, 3), rand(-0.3, 0.3), pick([0xff9a3d, 0xffd23f]), 0.1, 0.9, -1);
  if (Home.campT > 0 && Math.random() < 0.5) FX.spawn(Home.fire.x + rand(-0.4, 0.4), 0.9, Home.fire.z + rand(-0.4, 0.4), rand(-0.3, 0.3), rand(2, 4), rand(-0.3, 0.3), pick([0xff9a3d, 0xffd23f, 0xff6f61]), 0.13, 1.1, -1);
  Home.grillIt.label = Home.grillT > 0 ? `🍖 Yemek Pişir (${Home.fuelLeft(Home.grillT)})` : '🔥 Mangalı Yak (1 🪵)';
  Home.campIt.label = Home.party ? '🎉 Parti sürüyor!' : Home.campT > 0 ? (save.home.stage >= 3 ? '🌙 Pijama Partisi Başlat' : '🌙 Parti için evi bitir') : '🔥 Kamp Ateşini Yak (2 🪵)';
  /* ev içinde çatı kalkar, duvarlar saydamlaşır */
  if (Home.wallMat) {
    const O = Home.O, inside = Math.abs(P.pos.x - O.x) < Home.HX + 0.4 && Math.abs(P.pos.z - O.z) < Home.HZ + 0.4 && P.pos.y < 4; Home.wallOp = lerp(Home.wallOp, inside ? 0.18 : 1, Math.min(1, dt * 7));
    Home.wallMat.opacity = Home.wallOp; Home.wallMat.depthWrite = Home.wallOp > 0.6; if (Home.roof) Home.roof.visible = !inside;
    if (inside && !Home.inside) G.ui.toast(save.home.items.bed || save.home.items.sofa ? '🏡 Evine girdin! Yatağa yat, koltuğa otur.' : '🏡 Evine girdin! Tezgahtan eşya ekle.'); Home.inside = inside;
  }
  Home.itx.forEach((it) => { if (it.base) it.label = Ex.seat ? '🧍 Kalk' : it.base; });
  if (Ex.seat) { const st = { x: Ex.seat.x, z: Ex.seat.z, r: 9, label: '🧍 Kalk', fn: () => Home.stand() }; G.interact = st; G.ui.setInteract(st); }
};
