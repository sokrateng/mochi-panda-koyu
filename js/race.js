'use strict';
/* ============ Yarış Arenası: arkadaşlarla parkur yarışları ve Survivor (Düşen Karolar) ============ */
const LOOP = [[-18, 22], [20, 22], [36, 6], [30, -18], [8, -32], [-18, -30], [-34, -10], [-30, 10]];
const LCUM = [0]; let LLEN = 0;
LOOP.forEach((p, i) => { const q = LOOP[(i + 1) % LOOP.length]; LLEN += Math.hypot(q[0] - p[0], q[1] - p[1]); LCUM.push(LLEN); });
const lseg = (i) => { const a = LOOP[i % LOOP.length], b = LOOP[(i + 1) % LOOP.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return { a, b, l, tx: (b[0] - a[0]) / l, tz: (b[1] - a[1]) / l }; };
function pathAt(s) {
  s = ((s % LLEN) + LLEN) % LLEN; let i = 0; while (i < LOOP.length - 1 && s >= LCUM[i + 1]) i++;
  const g = lseg(i), u = s - LCUM[i]; return { x: g.a[0] + g.tx * u, z: g.a[1] + g.tz * u, tx: g.tx, tz: g.tz, seg: i };
}
const RACE_EVENTS = {
  dash: { name: 'Koşu Parkuru', icon: '🏃', laps: 1, boost: true, base: 60, desc: 'Hız tabelalı düz parkur. İlk bitiren kazanır!' },
  obst: { name: 'Engelli Parkur', icon: '🚧', laps: 1, hurdles: true, mud: true, need: 'dash', base: 90, desc: 'Engellerin üstünden zıpla, çamurdan kaç!' },
  fall: { name: 'Survivor: Düşen Karolar', icon: '🥊', type: 'fall', need: 'obst', base: 120, desc: 'Karolar teker teker düşer. En son ayakta kalan kazanır!' },
  cup:  { name: 'Şampiyonlar Kupası', icon: '🏆', laps: 2, hurdles: true, mud: true, boost: true, need: 'fall', friends: 3, base: 200, desc: '2 turluk büyük final! Engeller, çamur ve hız tabelaları.' },
};
const RACE_REWARDS = [
  { pts: 3, cat: 'hat', id: 'crown' }, { pts: 8, cat: 'hat', id: 'astro' }, { pts: 14, cat: 'fur', id: 'galaxy' }, { pts: 22, cat: 'trail', id: 'rainbow' },
];
const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
const FILL = ['tavsan', 'kedi', 'tilki', 'kaplumbaga', 'minipanda'];

const Race = (Ex.race = {
  w: null, state: 'idle', ev: null, join: false, t: 0, racers: [], props: null, tiles: [], boostT: 0, cpCount: 0, finished: [], place: 0, big: null, hud: null, hudT: 0, lastTv: -1,
});
Ex.mods.push(Race);
const medal = (i) => MEDALS[i] || `${i + 1}.`;
const evOpen = (id) => { const e = RACE_EVENTS[id]; return (!e.need || !!save.race.wins[e.need]) && (!e.friends || rescuedCount() >= e.friends); };
const needText = (id) => { const e = RACE_EVENTS[id]; const a = []; if (e.need && !save.race.wins[e.need]) a.push(`${RACE_EVENTS[e.need].name} yarışını kazan`); if (e.friends && rescuedCount() < e.friends) a.push(`${e.friends} arkadaş kurtar`); return a.join(' ve '); };

/* ---------- Köy girişi ---------- */
function buildArenaGate(w) {
  const g = new T.Group(), ox = 30, oz = 40; g.position.set(ox, 0, oz); g.rotation.y = -0.5; const wm = M(0xd8cfb8);
  [-3, 3].forEach((x) => g.add(mesh(geo('cyl', 0.5, 0.6, 5.2, 8), wm, x, 2.6, 0)));
  const ban = mesh(BOX(), M(0xffffff), 0, 5.3, 0); ban.scale.set(7.4, 1.5, 0.4); g.add(ban);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) { const sq = mesh(BOX(), M(0x222222), -3.3 + i * 0.73, 5.65 - j * 0.75, 0.22); sq.scale.set(0.73, 0.75, 0.05); g.add(sq); }
  [-3, 3].forEach((x) => { const f = mesh(geo('cone', 0.45, 0.9, 3), M(x < 0 ? 0xff6f61 : 0x4aa8ff, { flatShading: true }), x, 5.9, 0); f.rotation.z = -Math.PI / 2; g.add(f); });
  shadowAll(g); add(w, g); blockAt(w, ox - 3 * Math.cos(0.5), 0, oz + 3 * Math.sin(0.5), 0.7, 5); blockAt(w, ox + 3 * Math.cos(0.5), 0, oz - 3 * Math.sin(0.5), 0.7, 5);
  addSign(w, ox - 5, 0, oz + 4.5, '🏁'); Race.gateSign = w.signs[w.signs.length - 1];
  w.interacts.push({ x: ox, z: oz, r: 4.2, label: '🏁 Yarış Arenasına Gir', fn: () => { if (!Ex.isOpen('arena')) { G.ui.toast('🔒 Arena için önce 1 arkadaşını kurtar!'); return; } G.loadWorld('arena'); } });
}

/* ---------- Arena dünyası ---------- */
function buildArena() {
  const w = openWorld({
    id: 'arena', sky: [0x4fc3ff, 0xd9f6ff], fog: 0xd9f6ff, fogD: 0.0042, water: 0x3fb6e8, hemi: [0xffffff, 0x9acb8a, 0.88], sunI: 0.95, theme: 'village', rx: 100, rz: 100,
    flats: [[0, 0, 66, 84, 0]], paths: [LOOP.concat([LOOP[0]])], waterY: -1.2, grass: [0x6bc94a, 0x7fdc58, 0x5ab83e], grassCount: 5000, relief: { pits: 0, mounds: 0, amp: 0 },
    hills: () => 1.4,
    color: (x, z, h, sl, pd) => {
      if (pd < 4.4) return (Math.floor((x + 99) / 3) + Math.floor((z + 99) / 3)) % 2 ? 0xd9b88a : 0xcfab7c;
      if (Math.hypot(x, z - 44) < 13) return (Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? 0xe2d8c3 : 0xd8cdb6;
      if (h < 0.9 && Math.hypot(x, z) > 80) return 0xf0e2b0;
      const n = Math.sin(x * 0.3) * Math.cos(z * 0.27) + Math.sin(x * 0.13 + z * 0.17); return n > 0.5 ? 0x86dc58 : n > -0.4 ? 0x79d150 : 0x6cc24a;
    },
  });
  w.spawn.set(0, 0.02, 48);
  /* kenar bayrakları */
  const fm = [0xff5f8d, 0xffd23f, 0x5ec8ff, 0x7ed957];
  for (let s = 0, k = 0; s < LLEN; s += 13, k++) {
    const p = pathAt(s), nx = -p.tz, nz = p.tx, side = k % 2 ? 1 : -1, x = p.x + nx * 5.1 * side, z = p.z + nz * 5.1 * side;
    const pl = mesh(geo('cyl', 0.06, 0.06, 2.2, 5), M(0xe8e8f0), x, 1.1, z); addD(w, pl); const fl = mesh(geo('cone', 0.32, 0.8, 3), M(fm[k % 4], { flatShading: true }), x + 0.3, 1.9, z); fl.rotation.z = -Math.PI / 2; addD(w, fl);
  }
  /* kontrol kemerleri + ışık sütunları */
  Race.arches = LOOP.map((v, i) => {
    const sg = lseg(i), pv = lseg(i + LOOP.length - 1), tx = sg.tx + pv.tx, tz = sg.tz + pv.tz, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l, fin = i === 0, col = fin ? 0xffffff : 0xffd23f;
    const g = new T.Group(); g.position.set(v[0], 0, v[1]); g.rotation.y = Math.atan2(nx, nz) + Math.PI / 2; const pm = M(fin ? 0xf2f2f8 : 0xffb347);
    [-5, 5].forEach((x) => g.add(mesh(geo('cyl', 0.28, 0.34, 4.2, 8), pm, x, 2.1, 0))); const bn = mesh(BOX(), M(col, { emissive: col, emissiveIntensity: 0.25 }), 0, 4.2, 0); bn.scale.set(10.8, 0.9, 0.3); g.add(bn);
    if (fin) for (let q = 0; q < 14; q++) if (q % 2 === 0) { const sq = mesh(BOX(), M(0x222222), -4.85 + q * 0.75, 4.2, 0.17); sq.scale.set(0.75, 0.9, 0.04); g.add(sq); }
    const beam = mesh(geo('cyl', 0.5, 0.5, 16, 10), new T.MeshBasicMaterial({ color: fin ? 0x7fe0ff : 0xffe27a, transparent: true, opacity: 0.28, depthWrite: false }), 0, 8, 0); beam.visible = false; g.add(beam);
    shadowAll(g); add(w, g); return { g, beam, x: v[0], z: v[1] };
  });
  /* engeller, çamur, hız tabelaları (olaya göre açılır) */
  Race.props = { hurdles: [], muds: [], pads: [] };
  [[0, 0.5], [0, 0.78], [2, 0.5], [3, 0.5], [4, 0.5], [4, 0.78], [6, 0.5]].forEach(([seg, u]) => {
    const g = lseg(seg), alongX = Math.abs(g.tx) > Math.abs(g.tz); if (Math.abs(g.tx) < 0.5 && Math.abs(g.tz) < 0.5) return;
    const x = g.a[0] + g.tx * g.l * u, z = g.a[1] + g.tz * g.l * u; if (!(Math.abs(g.tx) > 0.85 || Math.abs(g.tz) > 0.85)) return;
    const grp = new T.Group(); grp.position.set(x, 0, z); const span = 8;
    const log = mesh(geo('cyl', 0.38, 0.38, span, 10), M(0xc9924e), 0, 0.82, 0); log.rotation.z = alongX ? 0 : Math.PI / 2; log.rotation.x = alongX ? Math.PI / 2 : 0; grp.add(log);
    for (let q = -3; q <= 3; q++) { const st = mesh(geo('cyl', 0.4, 0.4, 0.5, 10), M(q % 2 ? 0xe05555 : 0xffffff), alongX ? 0 : q * 1.15, 0.82, alongX ? q * 1.15 : 0); st.rotation.z = alongX ? 0 : Math.PI / 2; st.rotation.x = alongX ? Math.PI / 2 : 0; grp.add(st); }
    [-1, 1].forEach((sd) => grp.add(mesh(geo('cyl', 0.1, 0.12, 0.85, 6), M(0x6a4222), alongX ? 0 : sd * 3.6, 0.42, alongX ? sd * 3.6 : 0)));
    shadowAll(grp); grp.visible = false; add(w, grp);
    const hs = { x, z, grp, alongX, s: LCUM[seg] + g.l * u, sol: { minx: alongX ? x - 0.5 : x - span / 2, maxx: alongX ? x + 0.5 : x + span / 2, miny: -1, maxy: 1.15, minz: alongX ? z - span / 2 : z - 0.5, maxz: alongX ? z + span / 2 : z + 0.5, type: 'wood', active: false, deco: true } };
    w.solids.push(hs.sol); Race.props.hurdles.push(hs);
  });
  [[1, 0.5], [3, 0.5], [5, 0.5], [7, 0.5]].forEach(([seg, u]) => {
    const g = lseg(seg), x = g.a[0] + g.tx * g.l * u, z = g.a[1] + g.tz * g.l * u, m = mesh(geo('cyl', 3.4, 3.4, 0.06, 18), M(0x6b4a2e, { roughness: 1 }), x, 0.045, z); m.visible = false; m.receiveShadow = true; add(w, m);
    for (let k = 0; k < 6; k++) { const b = mesh(geo('sph', 0.28, 6, 5), M(0x8a6a42), x + rand(-2, 2), 0.1, z + rand(-2, 2)); b.scale.y = 0.4; m.add(b); b.position.set(rand(-2, 2), 0.1, rand(-2, 2)); }
    Race.props.muds.push({ x, z, r: 3.4, m, s: LCUM[seg] + g.l * u, zone: null });
  });
  [[0, 0.25], [1, 0.45], [3, 0.3], [4, 0.45], [6, 0.35]].forEach(([seg, u]) => {
    const g = lseg(seg), x = g.a[0] + g.tx * g.l * u, z = g.a[1] + g.tz * g.l * u, grp = new T.Group(); grp.position.set(x, 0.07, z); grp.rotation.y = Math.atan2(g.tx, g.tz);
    grp.add(mesh(geo('cyl', 1.5, 1.5, 0.05, 6), new T.MeshBasicMaterial({ color: 0xffe14a }), 0, 0, 0));
    [0, 0.7].forEach((o) => { const ar = mesh(geo('cone', 0.55, 0.7, 3), new T.MeshBasicMaterial({ color: 0xe0501a }), 0, 0.04, o - 0.2); ar.rotation.x = Math.PI / 2; ar.rotation.y = 0; grp.add(ar); });
    grp.visible = false; add(w, grp); Race.props.pads.push({ x, z, grp, s: LCUM[seg] + g.l * u });
  });
  /* lobi: yarış panosu ve eve dönüş */
  { const g = new T.Group(); g.position.set(-5, 0, 40); g.rotation.y = 0.35;
    [-1, 1].forEach((s) => g.add(mesh(geo('cyl', 0.12, 0.12, 2.8, 6), M(0x7a4a22), s * 1.5, 1.4, 0)));
    const b = mesh(BOX(), M(0xd6a15d), 0, 2.0, 0); b.scale.set(3.6, 2.0, 0.15); g.add(b); const t = mesh(BOX(), M(0xff6f61), 0, 2.85, 0.1); t.scale.set(3.6, 0.35, 0.18); g.add(t);
    [-1, 0, 1].forEach((x, i) => { const p = mesh(BOX(), M([0xfff6e3, 0xffe27a, 0xcff3ff][i]), x * 1.0, 1.85, 0.12); p.scale.set(0.8, 1.1, 0.03); p.rotation.z = (i - 1) * 0.08; g.add(p); });
    shadowAll(g); add(w, g); blockAt(w, -5, 0, 40, 1.8, 3); w.interacts.push({ x: -5, z: 40, r: 4, label: '🏁 Yarış Panosu', fn: () => Race.openBoard() }); }
  { const g = new T.Group(); g.position.set(10, 0, 40); const pm = M(0xd8cfb8); [-1.6, 1.6].forEach((s) => g.add(mesh(geo('cyl', 0.35, 0.42, 3.8, 8), pm, s, 1.9, 0)));
    const arch = mesh(geo('tor', 1.6, 0.35, 20), pm, 0, 3.8, 0); arch.scale.set(1, 0.8, 0.9); g.add(arch); const d = mesh(geo('cyl', 1.4, 1.4, 0.1, 18), new T.MeshBasicMaterial({ color: 0x6fe07a, transparent: true, opacity: 0.7 }), 0, 1.95, 0); d.rotation.x = Math.PI / 2; g.add(d);
    shadowAll(g); add(w, g); w.interacts.push({ x: 10, z: 40, r: 3.6, label: '🏡 Köye Dön', fn: () => G.loadWorld('village') }); }
  addSign(w, 0, 0, 36, '🏁 Yarış Arenası! Panodan bir yarış seç. Arkadaşların seninle yarışacak!');
  const ex = [[0, -4, 56], [0, 44, 18]]; scatterT(w, 70, (x, h, z) => tree(w, x, h, z, 0.9 + w.rng() * 0.8, pick([0x3fae5a, 0x4fc060, 0x35a055])), ex, { minH: 0.6, reach: 92 });
  scatterT(w, 160, (x, h, z) => flower(w, x, h, z, pick([0xff7eb6, 0xffd23f, 0xffffff, 0x8fd0ff])), ex.concat([[0, 0, 0, 0]]).slice(0, 2), { minH: 0.6, reach: 92 });
  return finishWorld(w);
}
WORLD_BUILDERS.arena = buildArena;

/* ---------- HUD ---------- */
Race.makeHud = () => {
  const h = document.createElement('div'); h.id = 'raceHud'; h.className = 'hidden'; h.innerHTML = '<div class="rh-title"></div><div class="rh-list"></div><div class="rh-info"></div>'; document.body.appendChild(h);
  const b = document.createElement('div'); b.id = 'raceBig'; b.className = 'hidden'; document.body.appendChild(b); Race.hud = h; Race.big = b;
};
Race.makeHud();
Race.setBig = (t, ms) => { Race.big.textContent = t; Race.big.classList.remove('hidden'); Race.big.style.animation = 'none'; void Race.big.offsetWidth; Race.big.style.animation = ''; clearTimeout(Race.bigT); if (ms) Race.bigT = setTimeout(() => Race.big.classList.add('hidden'), ms); };
Race.renderHud = () => {
  const e = RACE_EVENTS[Race.ev]; if (!e) return; const h = Race.hud;
  h.querySelector('.rh-title').textContent = `${e.icon} ${e.name}`;
  const rows = Race.ranking().map((r, i) => `<div class="${r.me ? 'me' : ''}${r.out ? ' out' : ''}">${r.out ? '😵' : medal(i)} ${r.emoji} ${esc(r.name)}</div>`).join('');
  h.querySelector('.rh-list').innerHTML = rows;
  const info = e.type === 'fall' ? `Ayakta: ${Race.alive()} • ${Math.floor(Race.t)} sn` : Race.join ? `Kontrol: ${Math.min(Race.cpCount, Race.cpTotal())}/${Race.cpTotal()} • ${Race.t.toFixed(1)} sn` : `${Race.t.toFixed(1)} sn • İzliyorsun`;
  h.querySelector('.rh-info').textContent = info; h.classList.remove('hidden');
};

/* ---------- Yarış kurulumu ---------- */
Race.cpTotal = () => RACE_EVENTS[Race.ev].laps * LOOP.length;
Race.alive = () => Race.racers.filter((r) => !r.out).length;
Race.progressOf = (r) => {
  if (r.me) {
    const vi = Race.cpCount % LOOP.length, g = lseg(vi), lap = Math.floor(Race.cpCount / LOOP.length), d = (P.pos.x - g.a[0]) * g.tx + (P.pos.z - g.a[1]) * g.tz;
    return lap * LLEN + LCUM[vi] + clamp(d, 0, g.l);
  } return r.s;
};
Race.ranking = () => {
  const list = Race.racers.slice(); const e = RACE_EVENTS[Race.ev];
  if (e.type === 'fall') return list.sort((a, b) => (a.out ? 1 : 0) - (b.out ? 1 : 0) || (b.out ? b.outAt - a.outAt : 0));
  return list.sort((a, b) => (a.fin && b.fin ? a.fin - b.fin : a.fin ? -1 : b.fin ? 1 : Race.progressOf(b) - Race.progressOf(a)));
};
Race.reset = () => {
  const w = Race.w; Race.racers.forEach((r) => { if (r.tag) Labels.remove(r.tag); if (r.m && r.m.parent) r.m.parent.remove(r.m); }); Race.racers = [];
  if (w) { Race.tiles.forEach((t) => { w.group.remove(t.s.mesh); const i = w.solids.indexOf(t.s); if (i >= 0) w.solids.splice(i, 1); }); }
  Race.tiles = []; Race.state = 'idle'; Race.ev = null; Race.boostT = 0; Race.join = false;
  if (Race.hud) Race.hud.classList.add('hidden'); if (Race.big) Race.big.classList.add('hidden');
  if (Race.props && w) { Race.props.hurdles.forEach((h) => { h.grp.visible = false; h.sol.active = false; }); Race.props.muds.forEach((m) => { m.m.visible = false; if (m.zone) { const i = w.mudZones.indexOf(m.zone); if (i >= 0) w.mudZones.splice(i, 1); m.zone = null; } }); Race.props.pads.forEach((p) => { p.grp.visible = false; }); }
  if (Race.arches) Race.arches.forEach((a) => { a.beam.visible = false; });
};
Race.onWorld = (w) => {
  Race.racers.forEach((r) => { if (r.tag) Labels.remove(r.tag); }); Race.w = w.id === 'arena' ? w : null; Race.state = 'idle'; Race.racers = []; Race.tiles = []; Race.ev = null; Race.boostT = 0; Race.join = false;
  if (Race.hud) Race.hud.classList.add('hidden'); if (Race.big) Race.big.classList.add('hidden');
  if (w.id === 'village') buildArenaGate(w);
};
Race.makeRacers = (join) => {
  const rescued = FRIEND_ORDER.filter((f) => save.rescued[f]), ids = rescued.slice(); for (const f of FILL) if (ids.length < 3 && !ids.includes(f)) ids.push(f);
  const list = ids.slice(0, 5).map((fid, i) => ({ fid, name: save.rescued[fid] ? FRIENDS[fid].name : `${FRIENDS[fid].name} (misafir)`, emoji: FRIENDS[fid].emoji, ai: true, skill: 0.93 + Math.random() * 0.14, s: 0, lat: 0, hop: 0, boost: 0, fin: 0, out: false, m: null, i }));
  if (join) list.push({ me: true, name: save.name, emoji: '🐼', fin: 0, out: false, i: list.length });
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  list.forEach((r, i) => { r.slot = i; if (r.ai) { r.m = makeCreature(r.fid); Race.w.group.add(r.m); const tag = Labels.make(r.name, ''); tag.getPos = (v) => v.set(r.m.position.x, r.m.position.y + 2.1, r.m.position.z); r.tag = tag; } });
  return list;
};
Race.start = (evId, join) => {
  const e = RACE_EVENTS[evId]; if (!e || !Race.w || Race.state !== 'idle') return; if (!evOpen(evId)) { G.ui.toast('🔒 ' + needText(evId)); return; }
  closeScreen(); Race.reset(); Race.ev = evId; Race.join = join; Race.t = 0; Race.cpCount = 0; Race.finished = []; Race.racers = Race.makeRacers(join);
  P.fly = false; P.vehicle = null; P.sprintOn = false; P.rolling = 0; Race.warned = 0;
  if (e.type === 'fall') Race.setupFall(); else Race.setupTrack(e);
  Race.state = 'count'; Race.cd = 3.4; Race.lastCd = 4; Race.renderHud(); Sfx.play('portal');
};
Race.setupTrack = (e) => {
  const w = Race.w, N = Race.racers.length, p0 = pathAt(0), nx = -p0.tz, nz = p0.tx;
  Race.props.hurdles.forEach((h) => { const on = !!e.hurdles; h.grp.visible = on; h.sol.active = on; });
  Race.props.muds.forEach((m) => { m.m.visible = !!e.mud; if (e.mud) { m.zone = { x: m.x, z: m.z, r: m.r }; w.mudZones.push(m.zone); } });
  Race.props.pads.forEach((p) => { p.grp.visible = !!e.boost; });
  Race.racers.forEach((r, i) => {
    r.lat = (i - (N - 1) / 2) * 1.35; r.s = -0.8 * (i % 2); r.hop = 0; const x = p0.x + nx * r.lat - p0.tx * (i % 2) * 1.0, z = p0.z + nz * r.lat - p0.tz * (i % 2) * 1.0;
    if (r.me) { P.pos.set(x, 0.05, z); P.vel.set(0, 0, 0); P.yaw = Math.atan2(p0.tx, p0.tz); cam.yaw = P.yaw + Math.PI; cam.pitch = 0.32; snapCamera(); P.respawn.copy(P.pos); }
    else { r.m.position.set(x, 0, z); r.m.rotation.y = Math.atan2(p0.tx, p0.tz); }
  });
  Race.lastTv = -1; Race.markNext();
};
Race.markNext = () => {
  if (!Race.arches) return; const tv = Race.join ? (Race.cpCount + 1) % LOOP.length : -1;
  Race.arches.forEach((a, i) => { a.beam.visible = i === tv; });
};
Race.speedMul = () => (Race.boostT > 0 ? 1.55 : 1);
Race.hold = () => Race.state === 'count' && Race.join;

/* ---------- Survivor: düşen karolar ---------- */
Race.setupFall = () => {
  const w = Race.w, n = 7, pitch = 3.55, cx = 0, cz = -4, top = 7, tcols = [0xff8fb1, 0xffd23f, 0x7fd8ff, 0xa6e36f, 0xc89bff, 0xffa05c];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = cx + (i - (n - 1) / 2) * pitch, z = cz + (j - (n - 1) / 2) * pitch, s = solid(w, x, top, z, 3.3, 3.3, { h: 1.2, type: 'stone', color: 0x5a4f9a, top: tcols[(i + j) % tcols.length] });
    Race.tiles.push({ s, x, z, st: 'ok', t: 0, vy: 0, top: s.mesh.children[1].material, i, j });
  }
  Race.warnMat = Race.warnMat || new T.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff2010, emissiveIntensity: 0.7 });
  const free = Race.tiles.slice().sort(() => Math.random() - 0.5);
  Race.racers.forEach((r, i) => {
    const tl = free[i]; r.tile = tl; r.vy = 0; r.fall = false; r.target = null; r.react = true;
    if (r.me) { P.pos.set(tl.x, top + 0.05, tl.z); P.vel.set(0, 0, 0); P.yaw = 0; cam.yaw = Math.PI; cam.pitch = 0.5; cam.dist = 14; snapCamera(); P.respawn.set(tl.x, top + 0.2, tl.z); } else { r.m.position.set(tl.x, top, tl.z); r.m.rotation.y = Math.random() * 6; }
  });
  Race.wave = 4.5; Race.top = top;
};
const tileAt = (x, z) => Race.tiles.find((t) => t.st !== 'fall' && Math.abs(x - t.x) < 1.9 && Math.abs(z - t.z) < 1.9);
Race.updateFall = (dt) => {
  const d = DIFFICULTY[save.difficulty], e = RACE_EVENTS.fall, top = Race.top;
  Race.t += dt; Race.wave -= dt;
  if (Race.wave <= 0) {
    Race.wave = d.tile * 1.15; const ok = Race.tiles.filter((t) => t.st === 'ok'), cnt = Math.min(ok.length - 3, 2 + Math.floor(Race.t / 12));
    ok.sort(() => Math.random() - 0.5).slice(0, Math.max(0, cnt)).forEach((t) => { t.st = 'warn'; t.t = d.tile > 2 ? 1.2 : 1.0; t.s.mesh.children[1].material = Race.warnMat; });
    Race.racers.forEach((r) => { if (r.ai) r.react = Math.random() < (save.difficulty === 'easy' ? 0.82 : save.difficulty === 'hard' ? 0.985 : 0.93); });
    if (Race.tiles.some((t) => t.st === 'warn')) Sfx.play('trap');
  }
  for (const t of Race.tiles) {
    if (t.st === 'warn') { t.s.mesh.position.x = Math.sin(G.time * 60) * 0.04; t.t -= dt; if (t.t <= 0) { t.st = 'fall'; t.s.active = false; t.vy = 0; t.s.mesh.position.x = 0; } }
    else if (t.st === 'fall') { t.vy += 22 * dt; t.s.mesh.position.y -= t.vy * dt; if (t.s.mesh.position.y < -14) t.s.mesh.visible = false; }
  }
  for (const r of Race.racers) {
    if (r.out) continue;
    if (r.me) {
      if (P.pos.y < top - 2.5) { r.out = true; r.outAt = Race.t; Race.finishFall(false); return; }
      continue;
    }
    const m = r.m;
    if (r.fall) { r.vy += 26 * dt; m.position.y -= r.vy * dt; m.rotation.x += dt * 6; if (m.position.y <= 0) { r.out = true; r.outAt = Race.t; m.visible = false; r.tag.hidden = true; Sfx.play('pop'); } continue; }
    const here = tileAt(m.position.x, m.position.z);
    if (!here || here.st === 'fall') { r.fall = true; r.vy = 0; continue; }
    if (here.st === 'warn' && r.react && (!r.target || r.target.st !== 'ok')) { const c = Race.tiles.filter((t) => t.st === 'ok').sort((a, b) => Math.hypot(a.x - m.position.x, a.z - m.position.z) - Math.hypot(b.x - m.position.x, b.z - m.position.z)); r.target = c[Math.floor(Math.random() * Math.min(3, c.length))] || null; }
    else if (!r.target || r.target.st !== 'ok' || Math.hypot(r.target.x - m.position.x, r.target.z - m.position.z) < 0.3) { if (Math.random() < 0.02) { const ok = Race.tiles.filter((t) => t.st === 'ok'); r.target = ok.length ? ok[Math.floor(Math.random() * ok.length)] : null; } }
    if (r.target) { const dx = r.target.x - m.position.x, dz = r.target.z - m.position.z, dd = Math.hypot(dx, dz); if (dd > 0.2) { const sp = Math.min(dd, 6.2 * dt * (d.racer + 0.1)); m.position.x += dx / dd * sp; m.position.z += dz / dd * sp; m.rotation.y = Math.atan2(dx, dz); animCreature(m, G.time, 'idle', 2.2); } else animCreature(m, G.time, 'idle', 0.6); }
    else animCreature(m, G.time, 'idle', 0.6);
  }
  const alive = Race.alive();
  if (alive <= 1 || Race.t > 110) Race.finishFall(true);
};
Race.finishFall = (survived) => {
  if (Race.state === 'done') return; Race.state = 'done'; const me = Race.racers.find((r) => r.me);
  let place;
  if (Race.join) { if (survived && !me.out) place = 1; else { place = Race.alive() + (me.out ? 1 : 0); place = clamp(place, 1, Race.racers.length); } } else { place = 0; }
  if (!Race.join) { const win = Race.racers.find((r) => !r.out) || Race.ranking()[0]; Race.announceWinner(win); return; }
  setTimeout(() => Race.showResult(place), 600);
};

/* ---------- Parkur yarışı ---------- */
Race.updateTrack = (dt) => {
  const e = RACE_EVENTS[Race.ev], d = DIFFICULTY[save.difficulty], total = e.laps * LLEN, t = G.time;
  Race.t += dt; Race.boostT = Math.max(0, Race.boostT - dt);
  if (Race.join) {
    if (P.fly) { P.fly = false; if (Race.warned++ < 2) G.ui.toast('🪽 Yarışta uçmak yasak!'); } if (P.vehicle) { P.vehicle = null; if (Race.warned++ < 2) G.ui.toast('🚲 Yarışta araç yok!'); }
    const me = Race.racers.find((r) => r.me), tv = (Race.cpCount + 1) % LOOP.length, cp = LOOP[tv];
    if (!me.fin && hdist(P.pos.x, P.pos.z, { x: cp[0], z: cp[1] }) < 7.5) {
      Race.cpCount++; Sfx.play('flag'); if (Race.cpCount < Race.cpTotal()) G.ui.toast(`✔ Kontrol ${Race.cpCount}/${Race.cpTotal()}`); Race.markNext();
      if (Race.cpCount >= Race.cpTotal()) { me.fin = Race.t; Race.finished.push(me); Race.arches.forEach((a) => { a.beam.visible = false; }); Race.playerDone(); }
    }
    if (e.boost) for (const p of Race.props.pads) if (hdist(P.pos.x, P.pos.z, p) < 1.6 && P.onGround) { if (Race.boostT < 0.5) { Sfx.play('spring'); FX.burst(p.x, 0.5, p.z, [0xffe14a, 0xff7a1a], 8, 4, 0.2, 0.5, 4, 2); } Race.boostT = 1.8; }
  }
  const me = Race.racers.find((r) => r.me), myProg = me ? Race.progressOf(me) : null;
  for (const r of Race.racers) {
    if (!r.ai || r.fin) continue;
    let sp = 10 * d.racer * r.skill;
    if (myProg !== null) { const gap = myProg - r.s; if (gap > 14) sp *= 1 + Math.min(0.14, (gap - 14) * 0.004); else if (gap < -22) sp *= 0.93; }
    if (r.boost > 0) { r.boost -= dt; sp *= 1.4; } else if (e.boost) for (const p of Race.props.pads) { const ds = ((p.s - r.s) % LLEN + LLEN) % LLEN; if (ds < 0.6 || ds > LLEN - 0.6) r.boost = 1.5; }
    const pa = pathAt(r.s); if (e.mud && Race.props.muds.some((m) => hdist(pa.x, pa.z, m) < m.r)) sp *= 0.55;
    if (e.hurdles && r.hop <= 0) for (const h of Race.props.hurdles) { const ds = h.s - (r.s % LLEN); if (ds > 0 && ds < 1.6 && Math.floor(r.s / LLEN) < e.laps) { r.hop = 0.6; break; } }
    r.s += sp * dt; r.lat += Math.sin(t * 0.9 + r.slot * 2) * 0.35 * dt; r.lat = clamp(r.lat, -3.2, 3.2);
    const p = pathAt(r.s), nx = -p.tz, nz = p.tx; let y = 0; if (r.hop > 0) { r.hop -= dt; y = Math.sin((1 - r.hop / 0.6) * Math.PI) * 1.6; }
    r.m.position.set(p.x + nx * r.lat, y, p.z + nz * r.lat); r.m.rotation.y = Math.atan2(p.tx, p.tz); animCreature(r.m, t, 'idle', 2.6);
    if (r.s >= total) { r.fin = Race.t; Race.finished.push(r); r.s = total; r.m.rotation.y += 0.01; }
  }
  const aiLeft = Race.racers.filter((r) => r.ai && !r.fin).length;
  if (!Race.join && aiLeft === 0) { Race.announceWinner(Race.finished[0]); }
  if (Race.join && Race.racers.find((r) => r.me).fin && !Race.doneT) { /* sonuç playerDone içinde zamanlanır */ }
  if (Race.t > 170 && Race.state === 'run') { if (Race.join && !me.fin) { Race.state = 'done'; Race.showResult(Race.ranking().findIndex((r) => r.me) + 1); } else Race.announceWinner(Race.ranking()[0]); }
};
Race.playerDone = () => {
  const place = Race.finished.length; Race.state = 'done'; celebrate(P.pos.x, P.pos.y, P.pos.z, place === 1, place === 1 ? 'Birinci! 🥇' : `${place}. oldun!`);
  Race.setBig(place === 1 ? '🥇 BİRİNCİ!' : `${medal(place - 1)} ${place}. oldun`, 2500); setTimeout(() => Race.showResult(place), 1800);
};
Race.announceWinner = (win) => {
  Race.state = 'done'; const nm = win ? win.name : 'Kimse'; Race.setBig(`🏆 ${nm} kazandı!`, 3500); Sfx.play('yay'); if (win && win.m) FX.confetti(win.m.position.x, win.m.position.y + 1, win.m.position.z, 40);
  setTimeout(() => { Race.reset(); const w = Race.w; if (w) { P.pos.set(0, 0.05, 46); snapCamera(); } G.ui.toast(`🏆 Yarışı ${nm} kazandı!`, 'gold'); }, 3800);
};

/* ---------- Sonuç ve ödüller ---------- */
Race.showResult = (place) => {
  const evId = Race.ev, e = RACE_EVENTS[evId], d = DIFFICULTY[save.difficulty]; if (!e) return;
  const coins = Math.round(e.base * ([1, 0.55, 0.3, 0.12][place - 1] || 0.05) * d.coin), pts = [4, 2, 1][place - 1] || 0; let unlock = '', items = [];
  if (coins > 0) addCoins(coins);
  const before = save.race.pts; save.race.pts += pts; if (place === 1 && !save.race.wins[evId]) { save.race.wins[evId] = 1; const nx = Object.keys(RACE_EVENTS).find((k) => RACE_EVENTS[k].need === evId); if (nx) unlock = `🔓 Yeni yarış açıldı: ${RACE_EVENTS[nx].icon} ${RACE_EVENTS[nx].name}!`; }
  if (place === 1) save.race.wins[evId + '_n'] = (save.race.wins[evId + '_n'] || 0) + 1;
  RACE_REWARDS.forEach((rw) => { const sh = SHOP[rw.cat] && SHOP[rw.cat].items.find((i) => i.id === rw.id); if (sh && before < rw.pts && save.race.pts >= rw.pts) { save.owned[`${rw.cat}:${rw.id}`] = true; items.push(`${sh.icon} ${sh.name}`); } });
  queueSave(); const medalE = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '🏁';
  if (place === 1) celebrate(P.pos.x, P.pos.y, P.pos.z, true, 'Şampiyon! 🏆'); else Sfx.play('rescue');
  showScreen(`<div class="panel">${closeBtn}<h2>${medalE} ${place}. oldun!</h2><p class="sub">${e.icon} ${esc(e.name)} • ${d.icon} ${d.name} mod</p>
    <div class="quest done"><div class="qi">🪙</div><div class="qt">Yarış ödülü<br><small>Kolay modda ödüller daha az, Zor modda 1.6 kat</small></div><div class="qr">+${coins}</div></div>
    <div class="quest ${pts ? 'done' : ''}"><div class="qi">🏆</div><div class="qt">Kupa puanı<br><small>Toplam: ${save.race.pts}</small></div><div class="qr">+${pts}</div></div>
    ${unlock ? `<p class="note" style="margin:8px 0;font-size:1.05rem;color:#2a8a3a">${unlock}</p>` : ''}${items.length ? `<p class="note" style="margin:8px 0;font-size:1.05rem;color:#b8610a">🎁 Özel eşya kazandın: ${items.join(', ')}! Gardıroptan giyebilirsin.</p>` : ''}
    <div class="row" style="justify-content:center;gap:12px;margin-top:10px"><button class="btn sun" data-act="raceagain" data-id="${evId}">🔁 Tekrar</button><button class="btn sky" data-act="raceboard">📋 Yarış Panosu</button></div></div>`, 'raceres');
  const me = Race.racers.find((r) => r.me); Race.cleanup(); if (me) { /* sonuç ekranı arkada */ }
};
Race.cleanup = () => { Race.reset(); if (Race.w) { P.pos.set(0, 0.05, 46); P.vel.set(0, 0, 0); P.yaw = Math.PI; cam.yaw = 0; cam.pitch = 0.42; cam.dist = 9.5; snapCamera(); } };
Ex.acts.raceagain = (d) => { closeScreen(); setTimeout(() => Race.start(d.id, true), 50); };
Ex.acts.raceboard = () => Race.openBoard();
Ex.acts.racego = (d) => Race.start(d.id, d.join === '1');
Race.openBoard = () => {
  const d = DIFFICULTY[save.difficulty], nextRw = RACE_REWARDS.find((r) => save.race.pts < r.pts);
  const rows = Object.entries(RACE_EVENTS).map(([id, e]) => {
    const open = evOpen(id), won = save.race.wins[id];
    return `<div class="quest ${won ? 'done' : ''}"><div class="qi">${open ? e.icon : '🔒'}</div><div class="qt">${esc(e.name)} ${won ? '⭐' : ''}<br><small>${open ? esc(e.desc) : '🔒 ' + esc(needText(id))}</small></div>${open ? `<div class="qr" style="display:flex;flex-direction:column;gap:5px"><button class="tab on" data-act="racego" data-id="${id}" data-join="1">🏃 Yarış</button><button class="tab" data-act="racego" data-id="${id}" data-join="0">👀 İzle</button></div>` : '<div class="qr"></div>'}</div>`;
  }).join('');
  const rw = RACE_REWARDS.map((r) => { const sh = SHOP[r.cat] && SHOP[r.cat].items.find((i) => i.id === r.id); if (!sh) return ''; const got = save.race.pts >= r.pts; return `<div class="quest ${got ? 'done' : ''}"><div class="qi">${got ? '✅' : sh.icon}</div><div class="qt">${esc(sh.name)} <small>(${SHOP[r.cat].label})</small><br><small>${r.pts} kupa puanı</small></div><div class="qr">${got ? 'Senin!' : `${save.race.pts}/${r.pts}`}</div></div>`; }).join('');
  showScreen(`<div class="panel">${closeBtn}<h2>🏁 Yarış Panosu</h2><p class="sub">🏆 Kupa puanın: <b>${save.race.pts}</b>${nextRw ? ` • Sonraki ödül ${nextRw.pts} puanda` : ' • Tüm ödüller senin!'}</p>
    ${Ex.diffHtml()}<h3 style="margin:10px 0 4px">Yarışlar</h3>${rows}<h3 style="margin:12px 0 4px">🎁 Özel eşya ödülleri</h3>${rw}
    <p class="note">Arkadaşların seninle yarışır. 👀 İzle'yi seçersen sadece onlar yarışır. Birinci olursan sonraki yarış açılır.</p></div>`, 'raceboard');
};
Race.update = (dt) => {
  if (!Race.w || Race.w !== G.world) return;
  if (Race.state === 'idle') return;
  const e = RACE_EVENTS[Race.ev]; if (!e) return;
  if (Race.state === 'count') {
    Race.cd -= dt; const n = Math.ceil(Race.cd); if (n !== Race.lastCd && n > 0) { Race.lastCd = n; Race.setBig(String(n), 900); Sfx.play('click'); }
    Race.racers.forEach((r) => { if (r.ai && r.m) animCreature(r.m, G.time, 'idle', 0.7); });
    if (Race.cd <= 0) { Race.state = 'run'; Race.setBig('BAŞLA! 🏁', 900); Sfx.play('portal'); } Race.hudT = 0;
  } else if (Race.state === 'run') { if (e.type === 'fall') Race.updateFall(dt); else Race.updateTrack(dt); }
  else if (Race.state === 'done' && e.type === 'fall') { Race.tiles.forEach((t) => { if (t.st === 'fall') { t.vy += 22 * dt; t.s.mesh.position.y -= t.vy * dt; } }); }
  Race.hudT -= dt; if (Race.hudT <= 0 && Race.state !== 'idle') { Race.hudT = 0.25; Race.renderHud(); }
  if (Race.arches) Race.arches.forEach((a) => { if (a.beam.visible) { a.beam.material.opacity = 0.22 + Math.sin(G.time * 4) * 0.08; a.g.children[2].scale.y = 0.9 + Math.sin(G.time * 5) * 0.08; } });
};
