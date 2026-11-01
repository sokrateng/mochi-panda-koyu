'use strict';
/* ============ Arkadaş evleri (3 katlı, geniş), mahalle, mangal, pijama partisi ve yazışma ============ */
const Fh = (G.fh = { slots: [], HX: 8.5, HZ: 6.5, FH: 3.7, FY: 0.1, WH: 3.3 });
const FH_ORIG = [['tavsan', -31, 4, 0xffe7c2], ['kaplumbaga', -27, -14, 0xc9f0cf], ['kedi', 31, 4, 0xffd5c2], ['tilki', 27, -14, 0xffe0a8], ['minipanda', 0, 33, 0xe6dcff]];
const FH_COL = [0xffe7c2, 0xc9f0cf, 0xffd5c2, 0xffe0a8, 0xe6dcff, 0xcfe6ff, 0xffd1dc, 0xfff0d6, 0xcdeed6, 0xffe08a];
const FH_ACC = [0xffa24a, 0x5ec27a, 0xff7eb6, 0xe8743b, 0xb28bff, 0x5ec8ff, 0xffd23f, 0x7ed957];
const fhRot = (x, z) => { const dx = -x, dz = 10 - z; return Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? Math.PI / 2 : -Math.PI / 2) : (dz > 0 ? 0 : Math.PI); };
const fhHash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

/* mahalle arsaları: köy merkezinin etrafında üç halka; arsa ve limandan uzak olanlar */
Fh.slots = (() => {
  const out = [], bad = (x, z) => HOME_PLOTS.some((p) => Math.hypot(x - p.x, z - p.z) < 48) || Math.hypot(x - 125, z + 40) < 38;
  [[112, 0.12], [138, 0.02], [164, 0.2]].forEach(([r, off]) => {
    const n = Math.floor((2 * Math.PI * r) / 40);
    for (let k = 0; k < n; k++) { const a = off + (k * 2 * Math.PI) / n, x = Math.round(Math.sin(a) * r), z = Math.round(-Math.cos(a) * r); if (!bad(x, z)) out.push({ x, z }); }
  });
  return out;
})();
Fh.plan = () => {
  const L = FH_ORIG.map(([fid, x, z, color]) => ({ fid, x, z, color, orig: true }));
  Object.keys(FRIENDS).filter((f) => !FRIEND_ORDER.includes(f)).forEach((fid, i) => { const s = Fh.slots[i]; if (s) L.push({ fid, x: s.x, z: s.z, color: FH_COL[i % FH_COL.length], orig: false }); });
  L.forEach((r) => { r.rot = fhRot(r.x, r.z); });
  return L;
};

/* ---------- Mangal (arkadaşın bahçesinde) ---------- */
Home.fgrills = [];
function fhGrill(w, gx, gz, yaw) {
  const g = new T.Group(); g.position.set(gx, 0, gz); g.rotation.y = yaw; const dk = hm(0x2c2f38, { metalness: 0.4, roughness: 0.5 });
  [[-0.55, -0.28], [0.55, -0.28], [-0.55, 0.28], [0.55, 0.28]].forEach(([x, z]) => g.add(mesh(geo('cyl', 0.05, 0.05, 0.8, 6), dk, x, 0.4, z)));
  g.add(mesh(geo('box', 1.3, 0.34, 0.72), dk, 0, 0.9, 0)); const coals = mesh(geo('box', 1.12, 0.06, 0.55), new T.MeshStandardMaterial({ color: 0x2a2220, emissive: 0x000000 }), 0, 1.07, 0); g.add(coals);
  for (let i = -4; i <= 4; i++) g.add(mesh(geo('box', 0.02, 0.02, 0.7), hm(0xcfd2d8, { metalness: 0.7 }), i * 0.13, 1.13, 0));
  g.add(mesh(geo('box', 0.9, 0.06, 0.6), hm(0xb98550), 1.2, 0.85, 0)); g.add(mesh(geo('cyl', 0.04, 0.04, 0.85, 5), hm(0x8b5a2b), 1.55, 0.42, 0.22)); g.add(mesh(geo('cyl', 0.04, 0.04, 0.85, 5), hm(0x8b5a2b), 0.85, 0.42, -0.22));
  const flames = mkFlames(g, 1.1, 3); shadowAll(g); w.group.add(g);
  const rec = { x: gx, z: gz, t: 0, g, flames, coals, it: null }; rec.it = { x: gx, z: gz, r: 3.2, label: '🍖 Mangalı Yak (1 🪵)', fn: () => Home.useGrillAt(rec) }; w.interacts.push(rec.it); Home.fgrills.push(rec);
  return rec;
}

/* ---------- Ev kurucu ---------- */
Fh.build = (w, r) => {
  const { HX, HZ, FH, FY, WH } = Fh, TH = 0.4, DW = 2.6, DH = 2.8, o = { x: r.x, z: r.z, r: r.rot }, rescued = !!save.rescued[r.fid], hs = fhHash(r.fid);
  const accent = FH_ACC[hs % FH_ACC.length], c = Math.cos(r.rot), s = Math.sin(r.rot), tw = (lx, lz) => ({ x: r.x + lx * c + lz * s, z: r.z - lx * s + lz * c });
  const n0 = w.solids.length, i0 = w.interacts.length, s0 = w.signs.length, np0 = w.npcs.length, Ly = (f) => FY + f * FH;
  const g = new T.Group(); g.position.set(r.x, 0, r.z); g.rotation.y = r.rot; w.group.add(g);
  const wallMat = new T.MeshStandardMaterial({ color: r.color, roughness: 0.92, bumpMap: roughTex(), bumpScale: 0.6, transparent: true });
  const trim = M(0x7a4a22), dark = M(0x5b3a1c), floorM = M(0xc99a5b, { roughness: 0.75 }), slabM = M(0xc99a5c, { roughness: 0.7 });
  const box = (parent, m, px, py, pz, sx, sy, sz) => { const b = mesh(BOX(), m, px, py, pz); b.scale.set(sx, sy, sz); parent.add(b); return b; };
  const blk = (lx, lz, sx, sz, y0, y1) => localBlock(w, o, lx, lz, sx, sz, y0, y1);
  const wall = (lx, lz, sx, sz, ya, yb) => { box(g, wallMat, lx, (ya + yb) / 2, lz, sx, yb - ya, sz); blk(lx, lz, sx, sz, ya > FY + 0.5 ? ya : ya - 1.5, yb); };
  /* zemin */
  box(g, floorM, 0, 0.05, 0, HX * 2, 0.1, HZ * 2); for (let i = -7; i <= 7; i++) box(g, M(0xb98550, { roughness: 0.8 }), i * 1.15, 0.101, 0, 0.04, 0.004, HZ * 2 - 0.2);
  blk(0, 0, HX * 2 - 0.4, HZ * 2, -2, FY);
  /* duvarlar */
  const fw = HX - DW / 2;
  for (let f = 0; f < 3; f++) {
    const ya = Ly(f), yb = ya + WH;
    wall(0, -HZ + TH / 2, HX * 2, TH, ya, yb); wall(-HX + TH / 2, 0, TH, HZ * 2, ya, yb); wall(HX - TH / 2, 0, TH, HZ * 2, ya, yb);
    if (f === 0) { wall(-(HX + DW / 2) / 2, HZ - TH / 2, fw, TH, ya, yb); wall((HX + DW / 2) / 2, HZ - TH / 2, fw, TH, ya, yb); wall(0, HZ - TH / 2, DW, TH, FY + DH, yb); }
    else wall(0, HZ - TH / 2, HX * 2, TH, ya, yb);
    /* pencereler */
    const glass = rescued ? new T.MeshBasicMaterial({ color: 0xfff1a0 }) : M(0x7fa9c9, { roughness: 0.1, metalness: 0.3 });
    [-HX + 2.2, -HX / 3, HX / 3, HX - 2.2].forEach((x) => [HZ - TH / 2, -HZ + TH / 2].forEach((z) => { box(g, trim, x, ya + 1.8, z, 1.7, 1.3, TH + 0.1); box(g, glass, x, ya + 1.8, z, 1.35, 0.95, TH + 0.16); box(g, trim, x, ya + 1.8, z, 0.06, 0.95, TH + 0.2); }));
    [-3, 3].forEach((z) => [HX - TH / 2, -HX + TH / 2].forEach((x) => { box(g, trim, x, ya + 1.8, z, TH + 0.1, 1.3, 1.7); box(g, glass, x, ya + 1.8, z, TH + 0.16, 0.95, 1.35); box(g, trim, x, ya + 1.8, z, TH + 0.2, 0.95, 0.06); }));
  }
  /* kapı çerçevesi ve açık kapı kanadı */
  box(g, trim, -DW / 2 - 0.08, FY + DH / 2, HZ, 0.16, DH, 0.55); box(g, trim, DW / 2 + 0.08, FY + DH / 2, HZ, 0.16, DH, 0.55); box(g, trim, 0, FY + DH + 0.08, HZ, DW + 0.32, 0.16, 0.55);
  const leaf = new T.Group(); leaf.position.set(-DW / 2, FY, HZ + 0.05); leaf.rotation.y = -1.75; g.add(leaf); box(leaf, M(0x8a5a2b), DW / 4, DH / 2 - 0.05, 0, DW / 2, DH - 0.1, 0.08); box(leaf, M(0xffd23f, { metalness: 0.5 }), DW / 2 - 0.15, DH * 0.45, 0.07, 0.1, 0.1, 0.06);
  box(g, M(accent), 0, 0.12, HZ + 1.0, 2.2, 0.04, 1.2);
  /* katlar arası döşeme (merdiven boşluklu) ve merdivenler */
  const Z0 = HZ - 1.85, Z1 = HZ - 0.15, HX1 = HX - 0.18, HX0 = HX1 - 5.2, HL = HX0 - 1.3, stepA = M(0xe0b074), stepB = M(0xd6a15d);
  for (let f = 1; f < 3; f++) {
    const top = Ly(f), bot = top - 0.35, north = f === 1;
    const rects = north ? [[-HX, HX, -HZ, -Z1], [-HX, HL, -Z1, -Z0], [HX1, HX, -Z1, -Z0], [-HX, HX, -Z0, HZ]] : [[-HX, HX, -HZ, Z0], [-HX, HL, Z0, Z1], [HX1, HX, Z0, Z1], [-HX, HX, Z1, HZ]];
    rects.forEach(([x0, x1, z0, z1]) => { box(g, slabM, (x0 + x1) / 2, (top + bot) / 2, (z0 + z1) / 2, x1 - x0, 0.35, z1 - z0); blk((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, bot, top); });
    const base = Ly(f - 1), N = 9, rise = FH / N, run = (HX1 - HX0) / N, zs = north ? [-Z1, -Z0] : [Z0, Z1];
    for (let i = 0; i < N; i++) {
      const x0 = HX0 + i * run, x1 = x0 + run, y = base + (i + 1) * rise;
      box(g, i % 2 ? stepA : stepB, (x0 + x1) / 2, (y + base - 0.2) / 2, (zs[0] + zs[1]) / 2, run, y - base + 0.2, zs[1] - zs[0]); blk((x0 + x1) / 2, (zs[0] + zs[1]) / 2, run, zs[1] - zs[0], base - 0.2, y);
    }
  }
  /* çatı */
  const roofG = new T.Group(); roofG.position.y = Ly(2) + WH; g.add(roofG);
  const cone = mesh(geo('cone', 1, 1, 4), M(0xc2523a, { flatShading: true, roughness: 0.7 }), 0, 1.75, 0); cone.rotation.y = Math.PI / 4; cone.scale.set((2 * HX + 1.9) / 2 / 0.7071, 3.5, (2 * HZ + 1.9) / 2 / 0.7071); roofG.add(cone);
  box(roofG, M(0x6a3a2a), 0, -0.1, 0, HX * 2 + 1.2, 0.2, HZ * 2 + 1.2); roofG.add(mesh(geo('cyl', 0.4, 0.4, 2.0, 8), M(0xb98a6a), 3.6, 2.4, -1.6));
  /* mobilya yardımcıları */
  const seat = (kind, lx, y, lz, yawL, exL, ezL, label, rad, fy) => {
    const p = tw(lx, lz), e = tw(exL, ezL), st = { house: true, kind, x: p.x, y, z: p.z, yaw: r.rot + yawL, ex: e.x, ez: e.z, fy };
    w.interacts.push({ x: p.x, z: p.z, r: rad, label, fn: () => Home.sitAt(st), y: fy });
  };
  const fab = M(accent), fab2 = M(accent + 0x181818), wood = M(0xc9924e);
  const bed = (lx, lz, by, label) => {
    const b = new T.Group(); b.position.set(lx, by, lz); box(b, dark, 0, 0.22, 0, 2.3, 0.44, 3.7); box(b, M(0xffffff), 0, 0.55, 0, 2.05, 0.22, 3.4); box(b, fab2, 0, 0.7, 0.6, 2.08, 0.1, 2.0); box(b, M(0xfff7ea), 0, 0.72, -1.35, 1.5, 0.18, 0.7); box(b, dark, 0, 0.7, -1.82, 2.3, 1.0, 0.12); g.add(b);
    blk(lx, lz, 2.3, 3.7, by - 0.5, by + 0.7); seat('lie', lx, by + 0.95, lz + 0.5, 0, lx + 1.9, lz + 0.6, label, 2.6, by);
  };
  const sofa = (lx, lz, by, flip) => {
    const sf = new T.Group(); sf.position.set(lx, by, lz); if (flip) sf.rotation.y = Math.PI; box(sf, fab, 0, 0.27, 0, 3.3, 0.5, 1.3); box(sf, fab2, 0, 0.8, 0.55, 3.3, 0.85, 0.3); [-1, 1].forEach((k) => box(sf, fab2, k * 1.62, 0.52, 0, 0.26, 0.6, 1.3)); g.add(sf);
    blk(lx, lz, 3.4, 1.3, by - 0.5, by + 0.6); seat('sit', lx, by + 0.5, lz + (flip ? 0.1 : 0.1), flip ? 0 : Math.PI, lx, lz + (flip ? 1.3 : -1.3), '🛋️ Koltuğa Otur', 2.6, by);
  };
  const rug = (lx, lz, by, c1, c2) => { g.add(mesh(geo('cyl', 2.0, 2.0, 0.03, 24), M(c1), lx, by + 0.02, lz)); g.add(mesh(geo('cyl', 1.3, 1.3, 0.035, 24), M(c2), lx, by + 0.025, lz)); };
  const lamp = (lx, lz, by) => { const l = new T.Group(); l.position.set(lx, by, lz); l.add(mesh(geo('cyl', 0.2, 0.25, 0.08, 8), dark, 0, 0.04, 0)); l.add(mesh(geo('cyl', 0.04, 0.04, 1.5, 6), dark, 0, 0.8, 0)); l.add(mesh(geo('cone', 0.4, 0.5, 10), new T.MeshBasicMaterial({ color: 0xffe9a0 }), 0, 1.7, 0)); g.add(l); };
  const pot = (lx, lz, by) => { const p = new T.Group(); p.position.set(lx, by, lz); p.add(mesh(geo('cyl', 0.3, 0.22, 0.45, 9), M(0xc2693c), 0, 0.22, 0)); p.add(mesh(geo('sph', 0.5, 8, 6), M(0x3fae5a), 0, 0.85, 0)); p.add(mesh(geo('sph', 0.34, 8, 6), M(0x58c76a), 0.2, 1.25, 0.1)); g.add(p); };
  const table = (lx, lz, by) => { const t = new T.Group(); t.position.set(lx, by, lz); box(t, wood, 0, 0.85, 0, 2.0, 0.12, 1.2); [[-0.85, -0.5], [0.85, -0.5], [-0.85, 0.5], [0.85, 0.5]].forEach(([x, z]) => box(t, dark, x, 0.42, z, 0.1, 0.84, 0.1)); t.add(mesh(geo('cyl', 0.2, 0.17, 0.05, 10), M(0xffffff), -0.3, 0.94, 0)); t.add(mesh(geo('cyl', 0.07, 0.06, 0.12, 8), M(0xff8fb1), 0.4, 0.97, 0.1)); g.add(t); blk(lx, lz, 2.0, 1.2, by - 0.5, by + 0.92); };
  /* zemin kat: salon (parti halısı ortada) */
  rug(0, 0.5, FY, accent, 0xfff6e3); lamp(-HX + 0.8, -HZ + 0.8, FY); pot(-HX + 0.9, 0.2, FY); lamp(HX - 0.8, 1.2, FY);
  sofa(-5.2, HZ - 1.0, FY, false); sofa(-1.4, -HZ + 1.0, FY, true); table(5.2, 0.4, FY);
  { const sh = new T.Group(); sh.position.set(-HX + 0.45, FY, -3.2); box(sh, wood, 0, 1.15, 0, 0.5, 2.3, 2.4); [0.55, 1.15, 1.75].forEach((y) => { for (let k = 0; k < 6; k++) box(sh, M([0xe05555, 0x4aa8ff, 0xf4c430, 0x4cc76a, 0xa56bff, 0xff8fb1][k]), 0.2, y + 0.2, -1 + k * 0.38, 0.22, 0.4, 0.22); }); g.add(sh); blk(-HX + 0.45, -3.2, 0.7, 2.4, FY - 0.5, FY + 2.3); }
  { const th = new T.Group(); th.position.set(-HX + 2.4, FY, -3.6); g.add(th); const h2 = hs % 4;
    if (r.fid === 'tavsan' || h2 === 0) { box(th, M(0x8b5a2b), 0, 0.25, 0, 0.9, 0.5, 0.7); for (let i = 0; i < 4; i++) { const cc = mesh(geo('cone', 0.09, 0.5, 8), M(0xff8a2a), (i - 1.5) * 0.2, 0.7, 0); cc.rotation.z = Math.PI; th.add(cc); } }
    else if (r.fid === 'kaplumbaga' || h2 === 1) { for (let i = 0; i < 3; i++) th.add(mesh(geo('sph', 0.34, 10, 8), M([0x5ec27a, 0x3f9b4a, 0x9fe3a8][i]), (i - 1) * 0.5, 0.25, i === 1 ? 0.3 : 0)); }
    else if (r.fid === 'kedi' || h2 === 2) { box(th, M(0xd6a15d), 0, 0.5, 0, 0.1, 1.0, 0.1); box(th, M(0xffd2e1), 0, 0.12, 0, 0.7, 0.24, 0.7); box(th, M(0xffd2e1), 0, 1.05, 0, 0.5, 0.18, 0.5); }
    else for (let i = 0; i < 4; i++) box(th, M([0xe8743b, 0x5ec8ff, 0xffd23f, 0x7ed957][i]), 0, 0.08 + i * 0.14, 0, 0.7 - i * 0.04, 0.12, 0.5); }
  /* 1. kat: yatak odası (4 yatak) */
  { const by = Ly(1); [[-HX + 1.6, -HZ + 2.2], [-HX + 1.6, HZ - 2.2], [-HX + 5, -HZ + 2.2], [-HX + 5, HZ - 2.2]].forEach(([bx, bz]) => bed(bx, bz, by, '🛏️ Yatağa Yat (2. kat)')); rug(1.5, 0, by, 0x7fd8ff, 0xffffff); lamp(HX - 0.8, 1.8, by); pot(HX - 1.1, -1.0, by); lamp(-1.2, -HZ + 0.8, by); }
  /* 2. kat: teras salonu */
  { const by = Ly(2); sofa(-5.2, HZ - 1.0, by, false); sofa(-1.6, HZ - 1.0, by, false); sofa(-5.2, -HZ + 1.0, by, true); sofa(-1.6, -HZ + 1.0, by, true); rug(-3.4, 0, by, 0xffd23f, 0xff8fb1); table(-3.4, 0, by); lamp(HX - 0.8, -2.2, by); lamp(-HX + 0.7, 0, by); pot(HX - 1.1, 1.0, by); }
  shadowAll(g, true, true);
  /* parti: halının üstü (zemin kat) ve kapının önü */
  const rp = tw(0, 0.5), dp = tw(0, HZ + 3.4);
  if (rescued) {
    w.interacts.push({ x: rp.x, z: rp.z, r: 3.6, label: '🌙 Pijama Partisi Yap', fn: () => Home.houseParty({ fid: r.fid, o }), y: FY });
    w.interacts.push({ x: dp.x, z: dp.z, r: 3.4, label: '🌙 Pijama Partisi Yap', fn: () => Home.houseParty({ fid: r.fid, o }) });
  }
  /* bahçe: mangal, patika, tabela, arkadaş */
  const gp = tw(7.6, HZ + 4.6), sg = tw(-5.5, HZ + 3.2), np = tw(3.4, HZ + 4.2);
  const grill = fhGrill(w, gp.x, gp.z, -r.rot + 0.4); blockAt(w, gp.x, 0, gp.z, 1.0, 1.4);
  for (let q = 0; q < 5; q++) { const sp = tw(Math.sin(q * 2) * 0.2, HZ + 0.9 + q * 1.5), st = mesh(geo('cyl', 0.62, 0.66, 0.08, 9), M(0xd6c3a0), sp.x, 0.04, sp.z); st.receiveShadow = true; w.group.add(st); }
  addSign(w, sg.x, 0, sg.z, rescued ? `${FRIENDS[r.fid].emoji} ${FRIENDS[r.fid].name}'in evi (3 katlı)! İçeri gir, yatağa yat, mangal yak, pijama partisi yap!` : '❔ Boş ev — arkadaşını bul!');
  if (rescued) { const n = makeCreature(r.fid); n.position.set(np.x, 0, np.z); n.rotation.y = r.rot + Math.PI * 0.9; w.group.add(n); w.npcs.push({ fid: r.fid, x: np.x, z: np.z, mesh: n }); }
  const hrec = { minx: r.x - 12, maxx: r.x + 12, minz: r.z - 12, maxz: r.z + 12, o, hx: HX, hz: HZ, roof: roofG, mat: wallMat, op: 1, top: Ly(2) + WH + 0.6 }; w.houses.push(hrec);
  return { g, hrec, grill, solids: w.solids.slice(n0), itx: w.interacts.slice(i0), signs: w.signs.slice(s0), npcs: w.npcs.slice(np0), extra: [] };
};
Fh.destroy = (w, b) => {
  w.group.remove(b.g); b.solids.forEach((x) => { const i = w.solids.indexOf(x); if (i >= 0) w.solids.splice(i, 1); });
  b.itx.forEach((x) => { const i = w.interacts.indexOf(x); if (i >= 0) w.interacts.splice(i, 1); }); b.signs.forEach((x) => { const i = w.signs.indexOf(x); if (i >= 0) w.signs.splice(i, 1); });
  b.npcs.forEach((x) => { const i = w.npcs.indexOf(x); if (i >= 0) w.npcs.splice(i, 1); w.group.remove(x.mesh); });
  const hi = w.houses.indexOf(b.hrec); if (hi >= 0) w.houses.splice(hi, 1); const gi = Home.fgrills.indexOf(b.grill); if (gi >= 0) Home.fgrills.splice(gi, 1);
};
/* yakınlık: oyuncu yaklaşınca kur, uzaklaşınca kaldır */
Fh.sync = (w, fast) => {
  if (!w.fhouses) return; let built = 0;
  for (const r of w.fhouses) {
    const has = w.fh.built.get(r), d = Math.hypot(P.pos.x - r.x, P.pos.z - r.z), want = r.orig || !!save.rescued[r.fid];
    if (!has && want && d < 125 && (fast || built < 1)) { w.fh.built.set(r, Fh.build(w, r)); built++; }
    else if (has && (d > 170 || !want) && !(Home.party && Home.party.house)) { Fh.destroy(w, has); w.fh.built.delete(r); }
  }
};
Ex.mods.push({
  onWorld(w) { Home.fgrills = []; if (w.id === 'village' && w.fhouses) { w.fh = { built: new Map() }; Fh.sync(w, true); } },
  update(dt) {
    const w = G.world; if (!w || w.id !== 'village') return;
    Fh.acc = (Fh.acc || 0) + dt; if (Fh.acc > 0.25) { Fh.acc = 0; Fh.sync(w, false); }
    const t = G.time;
    for (const gr of Home.fgrills) {
      if (gr.t > 0) gr.t -= dt; const on = gr.t > 0; gr.flames.visible = on;
      if (on) { gr.flames.children.forEach((c, i) => { c.scale.set(1 + Math.sin(t * 13 + i * 2) * 0.18, 1 + Math.sin(t * 9 + i) * 0.3, 1 + Math.sin(t * 11 + i) * 0.18); }); if (Math.random() < 0.3) FX.spawn(gr.x + rand(-0.4, 0.4), 1.3, gr.z + rand(-0.3, 0.3), rand(-0.3, 0.3), rand(1.5, 3), rand(-0.3, 0.3), pick([0xff9a3d, 0xffd23f]), 0.1, 0.9, -1); }
      gr.coals.material.emissive.setHex(on ? 0xff4a10 : 0x000000); gr.it.label = on ? `🍖 Yemek Pişir (${Home.fuelLeft(gr.t)})` : '🍖 Mangalı Yak (1 🪵)';
    }
  },
});

/* ============ Arkadaşlarla yazışma ============ */
const Chat = (G.chat = { fid: null, logs: {}, busy: false });
const CHAT_SOUND = { kedi: 'Miyav!', kopek: 'Hav hav!', tavsan: 'Zıp zıp!', kaplumbaga: 'Yavaş yavaş…', tilki: 'Hii hii!', minipanda: 'Pandaaa!', ordek: 'Vak vak!', inek: 'Möö!', koyun: 'Mee!', domuz: 'Oink!', aslan: 'Rraaar!', kurt: 'Auuu!', baykus: 'Huu huu!', kurbaga: 'Vırak!', fil: 'Tuuut!', maymun: 'Uu-aa!', at: 'Ihihi!', penguen: 'Pengu pengu!', papagan: 'Merhaba merhaba!', yunus: 'Cik cik!' };
const CHAT_JOKES = ['Neden bulutlar okula gitmez? Çünkü hep "yağmur" yağıyor, çantaları ağır! ☁️', 'Pandanın en sevdiği şarkı hangisi? "Bambu yok bambu…" 🎋', 'Kaplumbağa neden mutlu? Çünkü evi hep yanında! 🐢', 'Balık neden okula gitmez? Zaten hep "sınıfta" yüzüyor! 🐟', 'Havuç tavşana ne demiş? "Beni ye ama önce yıka!" 🥕'];
const trNorm = (s) => s.toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü ]/g, ' ');
Chat.quick = ['Merhaba! 👋', 'Nasılsın?', 'Pijama partisi yapalım mı? 🌙', 'Mangal yakalım! 🍖', 'Bir şaka anlat 😄', 'Evin çok güzel! 🏡'];
Chat.make = (fid, txt) => {
  const f = FRIENDS[fid], sound = CHAT_SOUND[fid] || CHAT_SOUND[f.base] || '', pre = sound && Math.random() < 0.6 ? sound + ' ' : '', t = ' ' + trNorm(txt) + ' ', has = (...k) => k.some((x) => t.includes(x)), me = save.name || 'Mochi';
  if (has('merhaba', 'selam', 'günaydın', 'hey')) return `${pre}Merhaba ${me}! Seni görmek çok güzel! 💛`;
  if (has('nasılsın', 'naber', 'ne haber', 'nasıl gidiyor')) return pick([`${pre}Çok iyiyim, sen kurtardığından beri çok mutluyum! 😊`, `${pre}Harikayım! Bugün hava da güzel, değil mi? ☀️`]);
  if (has('adın', 'ismin', 'kimsin')) return `${pre}Ben ${f.name}! ${f.emoji} Beni kurtardığın için sana hep teşekkür edeceğim!`;
  if (has('teşekkür', 'sağ ol', 'sagol')) return `${pre}Rica ederim! Arkadaşlar böyle yapar. 🤗`;
  if (has('pijama', 'parti')) return `${pre}Evet evet! Evimin kapısının önünde ya da halının yanında "Pijama Partisi Yap" yazan yere gel, herkesi çağıralım! 🌙🎉`;
  if (has('mangal', 'yemek', 'aç ', 'sosis', 'mısır', 'kebap')) return `${pre}Bahçemde mangal var! Bir odun ile yakarsın, sosis ve mısır pişiririz. 🍖🌽`;
  if (has('ev', 'kat', 'oda', 'yatak')) return `${pre}Evim 3 katlı! Altta salon, ortada 4 yataklı yatak odası, üstte teras salonu var. Merdivenlerden çık, yatağa yat, enerjin dolsun! 🏡`;
  if (has('uç', 'halı', 'uçak', 'araç', 'araba', 'bisiklet')) return `${pre}Çantandan Uçan Halı (6) ya da Tek Pervaneli Uçak (7) seç! Boşluk yükselir, C alçaltır. Enerjin 1 dakika sürer. 🧞🛩️`;
  if (has('odun', 'ağaç', 'agac', 'kes')) return `${pre}Köydeki bütün ağaçları baltayla kesebilirsin! 🪓 Ağaca yaklaş, E'ye bas. Odun toplayınca evini büyütebilirsin. 🪵`;
  if (has('dünya', 'portal', 'ada', 'hayvan', 'kurtar', 'nerede')) return `${pre}Her hayvanı kurtardığında yeni bir dünya, yeni bir ada ve yeni bir ev açılır. Hiç bitmez! Haritaya (M) bak! 🗺️`;
  if (has('şaka', 'fıkra', 'komik', 'güldür')) return pick(CHAT_JOKES);
  if (has('seviyorum', 'arkadaş', 'dost')) return `${pre}Ben de seni seviyorum ${me}! En iyi arkadaşımsın! 💖`;
  if (has('hoşça', 'görüşürüz', 'bay bay', 'güle güle')) return `${pre}Görüşürüz ${me}! Yine gel, seni bekleyeceğim! 👋`;
  if (has('oyun', 'oynayalım')) return `${pre}Saklambaç oynayalım mı? Sen say, ben saklanayım! 🙈`;
  return pick([`${pre}Hmm, bunu hiç düşünmemiştim! Biraz daha anlatır mısın? 🤔`, `${pre}Çok ilginç! Sen ne düşünüyorsun? 💭`, `${pre}Evimizde pijama partisi ya da mangal yapmaya ne dersin? 🌙🍖`, `${pre}Sana bir sır vereyim: Her yeni hayvanla yeni bir dünya açılıyor! 🌍`]);
};
Chat.render = () => {
  const f = FRIENDS[Chat.fid], log = Chat.logs[Chat.fid] || [], rows = log.map((m) => `<div class="msg ${m.me ? 'me' : 'fr'}">${esc(m.t)}</div>`).join('');
  const q = Chat.quick.map((t, i) => `<button class="tab" data-act="chatq" data-i="${i}">${esc(t)}</button>`).join('');
  showScreen(`<div class="panel">${closeBtn}<h2>${f.emoji} ${esc(f.name)} ile yazış</h2><div class="chatlog" id="chatLog">${rows}${Chat.busy ? '<div class="msg fr">…</div>' : ''}</div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin:8px 0">${q}</div>
    <div class="row" style="gap:6px"><input type="text" id="chatIn" maxlength="80" placeholder="Bir şeyler yaz…" autocomplete="off" style="flex:1"><button class="btn sky" data-act="chatsend">Gönder</button></div></div>`, 'fchat');
  const el = $('chatLog'); if (el) el.scrollTop = el.scrollHeight;
};
Chat.open = (fid) => {
  if (!FRIENDS[fid]) return; Chat.fid = fid; Chat.busy = false; const log = Chat.logs[fid] || (Chat.logs[fid] = []);
  if (!log.length) log.push({ me: false, t: `${FRIENDS[fid].emoji} ${FRIENDS[fid].line}` });
  Chat.render(); setTimeout(() => { const i = $('chatIn'); if (i && !isTouch) i.focus(); }, 60);
};
Chat.send = (txt) => {
  txt = (txt || '').trim().slice(0, 80); if (!txt || Chat.busy || !Chat.fid) return; const fid = Chat.fid, log = Chat.logs[fid]; log.push({ me: true, t: txt }); Chat.busy = true; Chat.render(); Sfx.play('click');
  setTimeout(() => { log.push({ me: false, t: Chat.make(fid, txt) }); if (log.length > 40) log.splice(0, log.length - 40); Chat.busy = false; if (Scr.open && Scr.kind === 'fchat' && Chat.fid === fid) { Chat.render(); const i = $('chatIn'); if (i && !isTouch) i.focus(); } Sfx.play('pop'); }, 600 + Math.random() * 500);
};
Ex.acts.chatq = (d) => Chat.send(Chat.quick[+d.i]);
Ex.acts.chatsend = () => { const i = $('chatIn'); if (i) { const v = i.value; i.value = ''; Chat.send(v); } };
addEventListener('keydown', (e) => { if (e.code === 'Enter' && e.target && e.target.id === 'chatIn') { e.preventDefault(); Ex.acts.chatsend(); } });
