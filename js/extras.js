'use strict';
/* ============ Ekstralar çekirdeği: kancalar, bölgeler, harita, yaban hayatı, zorluk seçici ============ */
const Ex = (G.ex = { acts: {}, seat: null, mods: [] });
const hdist = (x, z, o) => Math.hypot(x - o.x, z - o.z);
const angWrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/* ağaçların yerini sakla (sincap ve kuşlar için) */
{
  const _tree = tree;
  tree = function (w, x, y, z, s = 1, col) { (w.treeSpots || (w.treeSpots = [])).push({ x, y, z, s }); return _tree.call(this, w, x, y, z, s, col); };
}

/* ---------- Kancalar (game.js buradan çağırır) ---------- */
Ex.hold = (dt) => Ex.mods.some((m) => m.hold && m.hold(dt));
Ex.speedMul = () => (P.boost > 0 ? 1.2 : 1) * (Ex.race ? Ex.race.speedMul() : 1);
Ex.visual = (m, dt) => Ex.mods.forEach((x) => x.visual && x.visual(m, dt));
Ex.onWorld = (w) => {
  Ex.w = w; w.treeSpots = w.treeSpots || [];
  Ex.mods.forEach((m) => m.onWorld && m.onWorld(w));
  Wild.populate(w);
};
let exAcc = 0;
Ex.update = (dt) => {
  if (!Ex.w) return;
  P.boost = Math.max(0, (P.boost || 0) - dt);
  Wild.update(dt);
  Ex.mods.forEach((m) => m.update && m.update(dt));
  exAcc += dt; if (exAcc > 0.12) { exAcc = 0; Ex.minimap(); Ex.watchRegions(); const mp = $('modePill'), tx = `${DIFFICULTY[save.difficulty].icon} ${DIFFICULTY[save.difficulty].name}`; if (mp && mp.textContent !== tx) mp.textContent = tx; }
  const eb = $('energyBar'); if (eb) eb.classList.toggle('over', P.energy > maxEn() + 0.05);
  if (!Ex.uiPatched && G.ui && G.ui.openBag) {
    Ex.uiPatched = true; const ob = G.ui.openBag;
    G.ui.openBag = function (...a) { ob.apply(this, a); const p = Scr.open && Scr.kind === 'bag' ? scrEl.querySelector('.panel') : null; if (p) p.insertAdjacentHTML('beforeend', Ex.home.foodList()); };
  }
};

/* ---------- Bölgeler (arkadaş kurtardıkça açılır) ---------- */
const need = (n) => () => rescuedCount() >= n;
Ex.REGIONS = [
  { id: 'village', icon: '🏘️', name: 'Panda Köyü', world: 'village', open: () => true, need: 'Baştan açık' },
  { id: 'w1', icon: '🎋', name: 'Bambu Ormanı', world: 'w1', open: () => true, need: 'Baştan açık' },
  { id: 'arena', icon: '🏁', name: 'Yarış Arenası', world: 'arena', mapIn: 'village', x: 30, z: 40, tp: { x: 30, z: 34 }, open: need(1), need: '1 arkadaş kurtar' },
  { id: 'home', icon: '🏡', name: 'Ev Arsası ve Mangal Bahçesi', world: 'village', x: -46, z: 38, r: 17, tp: { x: -24, z: 38 }, open: need(2), need: '2 arkadaş kurtar' },
  { id: 'w2', icon: '🔮', name: 'Gizli Mağara', world: 'w2', open: () => worldDone('w1'), need: 'Bambu Ormanı arkadaşlarını kurtar' },
  { id: 'w3', icon: '🏔️', name: 'Buzul Dağ', world: 'w3', open: () => worldDone('w2'), need: 'Gizli Mağara arkadaşlarını kurtar' },
];
/* sonsuz dünyalar: her biri bir öncekinin hayvanı kurtarılınca açılır */
XW.forEach((d, i) => {
  const prev = i ? XW[i - 1] : { id: 'w3', name: 'Buzul Dağ' };
  Ex.REGIONS.push({ id: d.id, icon: d.emoji, name: d.name, world: d.id, series: true, open: () => worldDone(prev.id), need: `${prev.name} arkadaşını kurtar` });
});
Ex.region = (id) => Ex.REGIONS.find((r) => r.id === id);
Ex.isOpen = (id) => { const r = Ex.region(id); return !!r && r.open(); };
Ex.watchRegions = () => {
  if (G.mode !== 'play') return;
  if (!save.seen.init) { save.seen.init = 1; Ex.REGIONS.forEach((r) => { if (r.open()) save.seen[r.id] = 1; }); queueSave(); return; }
  for (const r of Ex.REGIONS) {
    if (!r.open() || save.seen[r.id]) continue;
    save.seen[r.id] = 1; queueSave();
    G.ui.toast(`🗺️ Yeni bölge açıldı: ${r.icon} ${r.name}!`, 'gold'); celebrate(P.pos.x, P.pos.y, P.pos.z, true, 'Yeni bölge! 🗺️');
    Ex.mods.forEach((m) => m.regionOpened && m.regionOpened(r));
  }
};

/* ---------- Harita ---------- */
const mapHalf = (w) => (w.id === 'arena' ? 85 : 105);
const MAP_COL = Object.assign({}, ...Object.entries(XTH).map(([k, t]) => ({ [k]: t.mapCol })), { cave: [[52, 38, 98], [128, 98, 196]], ice: [[140, 180, 214], [250, 253, 255]], forest: [[52, 140, 54], [160, 206, 92]], village: [[78, 168, 66], [176, 214, 104]] });
Ex.mapBg = (w) => {
  if (w.mapBg) return w.mapBg;
  const N = 140, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), img = x.createImageData(N, N), half = mapHalf(w), st = (half * 2) / N, col = MAP_COL[w.theme] || MAP_COL.village;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const wx = -half + (i + 0.5) * st, wz = -half + (j + 0.5) * st, h = w.groundAt ? w.groundAt(wx, wz) : 0, hl = w.groundAt ? w.groundAt(wx - st, wz - st) : h;
    const k = (j * N + i) * 4; let r, g, b;
    if (h < w.waterY + 0.12) { r = 62; g = 150; b = 214; } else {
      const u = clamp(h / 9, 0, 1), sh = clamp(1 + (h - hl) * 0.28, 0.72, 1.28);
      r = lerp(col[0][0], col[1][0], u) * sh; g = lerp(col[0][1], col[1][1], u) * sh; b = lerp(col[0][2], col[1][2], u) * sh;
      if (w.paths && w.paths.length && w.id !== 'w3' && pathDist(w.paths, wx, wz) < 2.4) { r = 222; g = 200; b = 150; }
    }
    img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0); w.mapBg = c; return c;
};
Ex.drawMap = (cv, w, full) => {
  if (!w) return; const S = cv.width, x = cv.getContext('2d'), half = mapHalf(w), px = (v) => (v / half * 0.5 + 0.5) * S;
  x.imageSmoothingEnabled = true; x.clearRect(0, 0, S, S); x.drawImage(Ex.mapBg(w), 0, 0, S, S);
  const dot = (X, Z, col, r, ch) => {
    if (full && ch) { x.font = `${Math.round(S * 0.058)}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, px(X), px(Z)); } else { x.fillStyle = col; x.beginPath(); x.arc(px(X), px(Z), r, 0, 6.283); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 1; x.stroke(); }
  };
  w.portals.forEach((p) => dot(p.x, p.z, '#b28bff', full ? 5 : 3, (p.lockedBy && !worldDone(p.lockedBy)) ? '🔒' : '🌀'));
  w.cages.forEach((c) => { if (!c.freed) dot(c.x, c.z, '#ff5f6d', full ? 5 : 3, '🐾'); });
  w.chests.forEach((c) => { if (full) dot(c.x, c.z, '#ffd23f', 3, '🧰'); });
  Ex.REGIONS.forEach((r) => {
    if ((r.mapIn || r.world) !== w.id || r.x === undefined) return; const op = r.open();
    if (full) { x.strokeStyle = op ? 'rgba(255,214,64,.95)' : 'rgba(255,90,90,.9)'; x.lineWidth = 3; x.setLineDash([6, 5]); x.beginPath(); x.arc(px(r.x), px(r.z), (r.r || 9) / half * 0.5 * S, 0, 6.283); x.stroke(); x.setLineDash([]); }
    dot(r.x, r.z, op ? '#ffd23f' : '#ff5a5a', full ? 6 : 3, op ? r.icon : '🔒');
  });
  /* oyuncu oku */
  x.save(); x.translate(px(P.pos.x), px(P.pos.z)); x.rotate(Math.PI - P.yaw);
  const a = full ? 11 : 6; x.fillStyle = '#fff'; x.strokeStyle = '#222'; x.lineWidth = full ? 3 : 2; x.beginPath(); x.moveTo(0, -a); x.lineTo(a * 0.75, a * 0.8); x.lineTo(0, a * 0.4); x.lineTo(-a * 0.75, a * 0.8); x.closePath(); x.fill(); x.stroke(); x.restore();
};
Ex.minimap = () => {
  const cv = $('minimap'); if (!cv || G.mode !== 'play' || !G.world) return; Ex.drawMap(cv, G.world, false);
};
Ex.openMap = () => {
  if (G.mode !== 'play' || !G.world) return; if (Scr.open && Scr.kind === 'map') { closeScreen(); return; } if (Scr.open) return;
  const firstLocked = Ex.REGIONS.find((r) => r.series && !r.open()), w = G.world, rows = Ex.REGIONS.filter((r) => !r.series || r.open() || r === firstLocked).map((r) => {
    const op = r.open(), here = r.world === w.id;
    const go = op && !(here && !r.tp) ? `<button class="tab" data-act="mapgo" data-id="${r.id}">✨ Git</button>` : '';
    return `<div class="quest ${op ? 'done' : ''}"><div class="qi">${op ? r.icon : '🔒'}</div><div class="qt">${esc(r.name)}${here ? ' <small>• buradasın</small>' : ''}<br><small>${op ? 'Açık' : '🔒 ' + esc(r.need)}</small></div><div class="qr">${go}</div></div>`;
  }).join('');
  showScreen(`<div class="panel mappanel">${closeBtn}<h2>🗺️ Harita</h2><p class="sub">${esc(WORLD_META[w.id].name)} • 🐾 kurtarılmamış arkadaş • 🌀 portal • 🧰 sandık</p>
    <canvas id="mapCv" width="360" height="360" aria-label="Harita"></canvas>${rows}<p class="note">Her hayvanı kurtarışında yeni bir dünya açılır, bu böyle sonsuza kadar sürer! 🌍 Haritayı M tuşuyla da açabilirsin.</p></div>`, 'map');
  Ex.drawMap($('mapCv'), w, true);
};
Ex.acts.map = () => { closeScreen(); setTimeout(Ex.openMap, 40); };
Ex.acts.mapgo = (d) => {
  const r = Ex.region(d.id); if (!r || !r.open()) return; closeScreen();
  const opts = r.tp ? { pos: { x: r.tp.x, y: 6, z: r.tp.z } } : {};
  if (G.world.id === r.world && r.tp) { P.pos.set(r.tp.x, (G.world.groundAt ? G.world.groundAt(r.tp.x, r.tp.z) : 0) + 0.5, r.tp.z); P.vel.set(0, 0, 0); snapCamera(); } else G.loadWorld(r.world, opts);
};

/* ---------- Zorluk seçici (başlık ekranı) ---------- */
Ex.diffHtml = () => `<div class="diffbox"><p class="note">Oyun modu</p><div class="seg">${Object.entries(DIFFICULTY).map(([k, d]) => `<button class="tab ${save.difficulty === k ? 'on' : ''}" data-act="pickdiff" data-k="${k}">${d.icon} ${d.name}</button>`).join('')}</div><p class="note diffinfo">${esc(DIFFICULTY[save.difficulty].info)}</p></div>`;
Ex.acts.pickdiff = (d) => {
  if (!DIFFICULTY[d.k]) return; save.difficulty = d.k; queueSave(); P.energy = Math.min(Math.max(P.energy, 0), maxEn());
  if (G.mode === 'title') showTitle(); else { ui.openSettings(); ui.toast(`${DIFFICULTY[d.k].icon} ${DIFFICULTY[d.k].name} mod`, 'gold'); }
  $('modePill') && ($('modePill').textContent = `${DIFFICULTY[save.difficulty].icon} ${DIFFICULTY[save.difficulty].name}`);
};

/* ---------- Yaban hayatı: ağaçlarda sincaplar ve kuşlar ---------- */
const Wild = (Ex.wild = { list: [], sky: [] });
function mkSquirrel() {
  const fur = M(0xc9772e), cream = M(0xf6e2c0), dark = M(0x2a1a10), g = new T.Group(), inner = new T.Group(); g.add(inner);
  const body = mesh(geo('sph', 0.2, 10, 8), fur, 0, 0.3, 0); body.scale.set(0.8, 0.95, 1.2); inner.add(body);
  const belly = mesh(geo('sph', 0.15, 8, 6), cream, 0, 0.27, 0.1); belly.scale.set(0.8, 0.9, 0.7); inner.add(belly);
  const head = mesh(geo('sph', 0.15, 10, 8), fur, 0, 0.55, 0.14); inner.add(head);
  [-1, 1].forEach((s) => { inner.add(mesh(geo('cone', 0.05, 0.12, 4), fur, s * 0.08, 0.7, 0.1)); inner.add(mesh(geo('sph', 0.025, 6, 5), dark, s * 0.07, 0.58, 0.27)); inner.add(mesh(geo('sph', 0.06, 6, 5), fur, s * 0.07, 0.14, 0.1)); });
  head.add(mesh(geo('sph', 0.035, 6, 5), dark, 0, -0.03, 0.15));
  const tail = new T.Group(); tail.position.set(0, 0.3, -0.2); inner.add(tail);
  const tb = mesh(geo('sph', 0.2, 8, 6), fur, 0, 0.28, -0.05); tb.scale.set(0.7, 1.9, 0.9); tail.add(tb); tail.rotation.x = -0.45;
  g.scale.setScalar(1.9); shadowAll(g); g.userData = { inner, tail, head }; return g;
}
function mkBird(col) {
  const body = M(col), wing = M(col + 0x181818), beak = M(0xffa31a), dark = M(0x161616), g = new T.Group();
  const b = mesh(geo('sph', 0.15, 9, 7), body, 0, 0.18, 0); b.scale.set(0.95, 0.9, 1.35); g.add(b);
  g.add(mesh(geo('sph', 0.1, 8, 6), body, 0, 0.3, 0.17)); const bk = mesh(geo('cone', 0.035, 0.1, 4), beak, 0, 0.29, 0.3); bk.rotation.x = Math.PI / 2; g.add(bk);
  [-1, 1].forEach((s) => g.add(mesh(geo('sph', 0.018, 5, 4), dark, s * 0.06, 0.33, 0.25)));
  const tl = mesh(geo('box', 0.1, 0.02, 0.2), wing, 0, 0.2, -0.27); tl.rotation.x = 0.25; g.add(tl);
  const wings = [-1, 1].map((s) => { const p = new T.Group(); p.position.set(s * 0.1, 0.22, 0); const wm = mesh(geo('box', 0.26, 0.02, 0.17), wing, s * 0.13, 0, 0); p.add(wm); g.add(p); return p; });
  g.scale.setScalar(1.5); g.userData = { wings }; return g;
}
Wild.chirp = () => { try { if (!Sfx.ctx || !save.settings.sfx || G.time - (Wild.lastChirp || 0) < 2.5) return; Wild.lastChirp = G.time; const f = rand(2300, 3300); Sfx.osc(f, 0.07, 'sine', 0.07, f * 0.5, 0); Sfx.osc(f * 1.15, 0.06, 'sine', 0.06, -f * 0.3, 0.09); Sfx.osc(f * 0.95, 0.08, 'sine', 0.05, f * 0.4, 0.18); } catch (e) { /* ses yoksa geç */ } };
Wild.populate = (w) => {
  Wild.list.forEach((e) => e.m.parent && e.m.parent.remove(e.m)); Wild.sky.forEach((e) => e.m.parent && e.m.parent.remove(e.m)); Wild.list = []; Wild.sky = [];
  const rr = mulberry(hashStr(w.id + 'wild')), low = save.settings.quality === 'low', spots = w.treeSpots.filter((s) => s.s > 0.7 && !(w.flats || []).some((f) => hdist(s.x, s.z, { x: f[0], z: f[1] }) < 12 && w.id === 'village' && f[0] < -20 && f[1] > 20));
  if (spots.length) {
    const n = Math.min(spots.length, low ? 8 : 16), used = new Set(), cols = [0xe0543c, 0x3f8fe0, 0xf2c230, 0xf4f0e8, 0x7a5cd6];
    for (let k = 0, t = 0; k < n && t < n * 6; t++) {
      const i = Math.floor(rr() * spots.length); if (used.has(i)) continue; used.add(i); k++; const s = spots[i];
      if (w.id !== 'w3' && w.id !== 'w2' && rr() < 0.55) {
        const m = mkSquirrel(), o = new T.Group(); o.add(m); w.group.add(o);
        Wild.list.push({ kind: 'sq', m: o, mm: m, s, ang: rr() * 6.283, h: 0.8 + rr() * 1.6, goal: 1.5, wait: rr() * 2, flee: 0, ph: rr() * 9 });
      } else {
        for (let q = 0; q < (rr() < 0.4 ? 2 : 1); q++) {
          const m = mkBird(w.id === 'w3' ? 0xf4f6ff : cols[Math.floor(rr() * cols.length)]), ox = (q ? 0.6 : 0), o = new T.Group(); o.add(m); w.group.add(o);
          Wild.list.push({ kind: 'bird', m: o, mm: m, s, ox, state: 'perch', t: rr() * 12 + 3, a: rr() * 6.283, ph: rr() * 9, yaw: rr() * 6.283, fy: 0 });
        }
      }
    }
  }
  const skyN = w.id === 'w2' ? 0 : low ? 2 : 4;
  for (let k = 0; k < skyN; k++) {
    const m = mkBird(w.id === 'w3' ? 0xf4f6ff : [0xf4f0e8, 0x3f8fe0, 0xe0543c][k % 3]); m.scale.setScalar(2.2); w.group.add(m);
    Wild.sky.push({ m, r: 18 + rr() * 38, cx: (rr() - 0.5) * 70, cz: (rr() - 0.5) * 70, y: 17 + rr() * 9, sp: (0.14 + rr() * 0.1) * (rr() < 0.5 ? 1 : -1), a: rr() * 6.283, ph: rr() * 9 });
  }
};
Wild.update = (dt) => {
  const p = P.pos, t = G.time;
  for (const e of Wild.list) {
    const s = e.s, dxp = p.x - s.x, dzp = p.z - s.z, dp = Math.hypot(dxp, dzp);
    if (dp > 60) { e.m.visible = false; continue; } e.m.visible = true;
    if (e.kind === 'sq') {
      const r = 0.58 * s.s, top = 2.9 * s.s, u = e.mm.userData;
      if (dp < 5.5 && p.y < s.y + 3) { e.flee = 1.6; e.goal = top * 0.8; e.wait = 0; }
      if (e.flee > 0) { e.flee -= dt; const away = Math.atan2(-dzp, -dxp); e.ang += angWrap(away - e.ang) * Math.min(1, dt * 5); }
      else if (e.wait > 0) { e.wait -= dt; e.ang += dt * 0.08; if (e.wait <= 0) e.goal = (0.6 + Math.random() * 2.1) * s.s; }
      else e.ang += dt * 0.6 * (e.goal > e.h ? 1 : -1);
      const sp = (e.flee > 0 ? 3.4 : 1.1) * dt; e.h += clamp(e.goal - e.h, -sp, sp); if (Math.abs(e.goal - e.h) < 0.02 && e.wait <= 0 && e.flee <= 0) e.wait = 1.2 + Math.random() * 3;
      e.m.position.set(s.x + Math.cos(e.ang) * r, s.y + e.h, s.z + Math.sin(e.ang) * r); e.m.rotation.y = Math.atan2(-Math.cos(e.ang), -Math.sin(e.ang));
      e.mm.rotation.x = -1.1 + Math.sin(t * 3 + e.ph) * (e.wait > 0 ? 0.04 : 0.1); u.tail.rotation.x = -0.45 + Math.sin(t * (e.flee > 0 ? 14 : 2.5) + e.ph) * 0.3; u.head.rotation.y = Math.sin(t * 1.3 + e.ph) * 0.4 * (e.wait > 0 ? 1 : 0);
    } else {
      const wings = e.mm.userData.wings, perchY = s.y + 4.3 * s.s, px = s.x + e.ox, pz = s.z + 0.15;
      e.t -= dt;
      if (e.state === 'perch') {
        e.m.position.set(px, perchY + Math.abs(Math.sin(t * 2 + e.ph)) * 0.02, pz); e.m.rotation.y = e.yaw + Math.sin(t * 0.7 + e.ph) * 0.8;
        wings.forEach((wg, i) => { wg.rotation.z = (i ? 1 : -1) * 0.12; });
        if ((dp < 6.5 && p.y < perchY + 3) || e.t <= 0) { e.state = 'fly'; e.t = 6 + Math.random() * 3; e.a = Math.atan2(-dzp, -dxp); if (dp < 7) Wild.chirp(); }
      } else if (e.state === 'fly') {
        e.a += dt * 1.7; const R = 6 + e.ox * 3, y = perchY + 2.2 + Math.sin(t * 1.3 + e.ph) * 1.2;
        const nx = s.x + Math.cos(e.a) * R, nz = s.z + Math.sin(e.a) * R; e.m.rotation.y = Math.atan2(nx - e.m.position.x, nz - e.m.position.z);
        e.m.position.x = lerp(e.m.position.x, nx, Math.min(1, dt * 6)); e.m.position.z = lerp(e.m.position.z, nz, Math.min(1, dt * 6)); e.m.position.y = lerp(e.m.position.y, y, Math.min(1, dt * 3));
        wings.forEach((wg, i) => { wg.rotation.z = (i ? 1 : -1) * Math.sin(t * 22 + e.ph) * 0.9; });
        if (e.t <= 0 && dp > 9) { e.state = 'land'; e.t = 1.6; }
      } else {
        e.m.position.x = lerp(e.m.position.x, px, Math.min(1, dt * 3)); e.m.position.z = lerp(e.m.position.z, pz, Math.min(1, dt * 3)); e.m.position.y = lerp(e.m.position.y, perchY, Math.min(1, dt * 3));
        wings.forEach((wg, i) => { wg.rotation.z = (i ? 1 : -1) * Math.sin(t * 24) * 0.8; });
        if (e.t <= 0) { e.state = 'perch'; e.t = 15 + Math.random() * 20; }
      }
    }
  }
  for (const b of Wild.sky) {
    b.a += dt * b.sp; const x = b.cx + Math.cos(b.a) * b.r, z = b.cz + Math.sin(b.a) * b.r, wg = b.m.userData.wings;
    b.m.position.set(x, b.y + Math.sin(t * 0.5 + b.ph) * 1.5, z); b.m.rotation.y = Math.atan2(-Math.sin(b.a) * Math.sign(b.sp), Math.cos(b.a) * Math.sign(b.sp));
    b.m.rotation.z = -0.25 * Math.sign(b.sp); wg.forEach((q, i) => { q.rotation.z = (i ? 1 : -1) * (Math.sin(t * 7 + b.ph) * 0.5 + 0.1); });
  }
};

/* ---------- Köyde Dünya Kapısı: açılan tüm dünyalara haritadan git ---------- */
Ex.mods.push({
  onWorld(w) {
    if (w.id !== 'village') return;
    const gx = 0, gz = -46, gyy = w.groundAt ? w.groundAt(gx, gz) : 0, g = new T.Group(), st = M(0xd8cfb8), glow = new T.MeshBasicMaterial({ color: 0x7affd0, transparent: true, opacity: 0.7 });
    g.position.set(gx, gyy, gz);
    [-2.2, 2.2].forEach((s) => g.add(mesh(geo('cyl', 0.5, 0.6, 5.2, 8), st, s, 2.6, 0)));
    const arch = mesh(geo('tor', 2.2, 0.5, 20), st, 0, 5.2, 0); arch.scale.set(1, 0.9, 0.9); g.add(arch);
    const disc = mesh(geo('cyl', 2.1, 2.1, 0.1, 24), glow, 0, 2.9, 0); disc.rotation.x = Math.PI / 2; g.add(disc); Ex.gateDisc = disc;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283, o = mesh(geo('oct', 0.3), new T.MeshBasicMaterial({ color: [0xffe27a, 0x7affd0, 0xff9ad5][i % 3] }), Math.cos(a) * 2.6, 2.9 + Math.sin(a) * 2.6, 0); g.add(o); }
    shadowAll(g); w.group.add(g);
    addSign(w, 4.2, gyy, gz + 3, '🌍 Dünya Kapısı! Her hayvanı kurtardıkça yeni dünyalar açılır. Haritadan git!');
    addInteract(w, gx, gz + 1, 4.2, '🌍 Dünya Kapısı: yeni dünyalara git', () => Ex.openMap());
  },
  update() { if (Ex.gateDisc && G.world && G.world.id === 'village') { Ex.gateDisc.rotation.z += 0.03; Ex.gateDisc.material.opacity = 0.55 + Math.sin(G.time * 3) * 0.15; } },
});
