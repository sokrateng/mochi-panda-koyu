'use strict';
/* ============ Deniz Adaları: her hayvan kurtarışında yeni bir ada ve köprü açılır ============ */
const totalRescued = () => Object.keys(FRIENDS).filter((f) => save.rescued[f]).length;

/* [anahtar, ad, emoji, söz, özellikler] */
const SEA_DEF = [
  ['penguen', 'Pengu', '🐧', 'Buz gibi sulardan kurtuldum! Teşekkürler!', { body: 0x2b2f3a, belly: 0xffffff, ear: 'none', tail: 'tiny', nose: 0xffa21a, snout: 0xffa21a, size: 1 }],
  ['fok', 'Foki', '🦭', 'Ork ork! Adamda yalnızdım, sağ ol!', { body: 0x9aa8b8, belly: 0xdde4ee, ear: 'none', tail: 'tiny', nose: 0x23232b, snout: 0xdde4ee, size: 1.1 }],
  ['yengec', 'Kıskaç', '🦀', 'Kıs kıs! Kumda saklanıyordum, beni buldun!', { body: 0xe8503a, belly: 0xff8a6a, ear: 'round', earIn: 0xff8a6a, tail: 'none', nose: 0x23232b, size: 0.9 }],
  ['marti', 'Martı', '🕊️', 'Çığlık çığlığa seni bekledim! Sağ ol!', { body: 0xffffff, belly: 0xffffff, ear: 'none', tail: 'tiny', nose: 0xffb02a, snout: 0xffb02a, size: 0.95 }],
  ['suaygiri', 'Hippo', '🦛', 'Suda bile yüzemiyordum, çok sağ ol!', { body: 0x9a8aa8, belly: 0xd8cce0, ear: 'round', earIn: 0xf0b8c8, tail: 'tiny', nose: 0x5a4a68, snout: 0xb8a8c8, size: 1.25 }],
  ['flamingo', 'Pembe', '🦩', 'Tek ayak üstünde bekledim! Teşekkürler!', { body: 0xff8fb1, belly: 0xffc2d6, ear: 'none', tail: 'tiny', nose: 0xffa21a, snout: 0xffd0a0, size: 1 }],
  ['timsah', 'Yeşil', '🐊', 'Ben yemem, söz! Kurtardığın için sağ ol!', { body: 0x5aae4a, belly: 0xe6f0b8, ear: 'round', earIn: 0x3f8a3a, tail: 'long', nose: 0x2a5a24, snout: 0x7ac86a, size: 1.1 }],
  ['kunduz', 'Kunduz', '🦫', 'Baraj yapacaktım ama kapana kısıldım. Sağ ol!', { body: 0x8a5a3a, belly: 0xc89a6a, ear: 'round', earIn: 0xc89a6a, tail: 'tiny', nose: 0x1d1410, teeth: true, size: 1 }],
  ['samur', 'Samur', '🦦', 'Taşımla oynuyordum, sen geldin! Sağ ol!', { body: 0x7a5a3a, belly: 0xe0c8a0, ear: 'round', earIn: 0xe0c8a0, tail: 'long', nose: 0x1d1410, snout: 0xe0c8a0, whiskers: true, size: 1 }],
  ['papagan', 'Renk', '🦜', 'Merhaba merhaba! Seni çok sevdim!', { body: 0xe8453c, belly: 0xffd23f, ear: 'none', tail: 'long', nose: 0xffd23f, snout: 0xffd23f, size: 1 }],
  ['tukan', 'Tukan', '🐦', 'Gagam büyük, kalbim daha büyük! Sağ ol!', { body: 0x2b2b33, belly: 0xffffff, ear: 'none', tail: 'tiny', nose: 0xff8a2a, snout: 0xffb02a, size: 1 }],
  ['zurafa', 'Uzun', '🦒', 'Boyum uzun ama yolum bulunamadı. Sağ ol!', { body: 0xf2c04a, belly: 0xfff1c2, ear: 'point', earTip: 0x8a5a2a, tail: 'long', stripes: 0x9a6a2a, nose: 0x4a2a14, size: 1.2 }],
  ['gergedan', 'Boynuz', '🦏', 'Güçlüyüm ama kafesi kıramadım. Teşekkürler!', { body: 0x9a9ea8, belly: 0xd0d4dc, ear: 'round', earIn: 0xf0b8c8, tail: 'tiny', nose: 0x4a4a52, snout: 0xb0b4bc, size: 1.2 }],
  ['rakun', 'Maske', '🦝', 'Gizlice yiyecek arıyordum, sen buldun beni!', { body: 0x8a8a92, belly: 0xd8d8e0, ear: 'round', earIn: 0xd8d8e0, tail: 'long', stripes: 0x2b2b33, nose: 0x1d1410, snout: 0xf0f0f4, size: 1 }],
  ['lama', 'Lama', '🦙', 'Tüylerim ıslanmıştı! Beni kurtardığın için sağ ol!', { body: 0xf0e6d2, belly: 0xfffaf0, ear: 'long', earIn: 0xffb6c8, tail: 'puff', nose: 0x6a4a3a, size: 1.15 }],
  ['kanguru', 'Zıpzıp', '🦘', 'Zıpla zıpla! Özgürlük çok güzel, sağ ol!', { body: 0xd9884a, belly: 0xf6dcc0, ear: 'long', earIn: 0xf6dcc0, tail: 'long', nose: 0x2b2023, size: 1.1 }],
  ['leopar', 'Benek', '🐆', 'Benekli ama kötü değilim! Sağ ol!', { body: 0xf0b84a, belly: 0xfff1d6, ear: 'round', earIn: 0xffe0b0, tail: 'long', stripes: 0x2b2023, nose: 0x2b2023, size: 1.05 }],
  ['yunus', 'Yuvarlak', '🐬', 'Cik cik cik! Dalgalarla seni bekledim!', { body: 0x7aaed8, belly: 0xe8f4ff, ear: 'none', tail: 'tiny', nose: 0x23232b, snout: 0xe8f4ff, size: 1.1 }],
  ['ahtapot', 'Dokunaç', '🐙', 'Sekiz kolum var ama hiçbiri kafesi açamadı! Sağ ol!', { body: 0xe0507a, belly: 0xff8aa8, ear: 'none', tail: 'none', nose: 0x7a2a49, size: 1 }],
  ['balina', 'Mavi', '🐳', 'Fışşş! Adaya sıkışmıştım, sağ ol!', { body: 0x4a78b8, belly: 0xdce8f6, ear: 'none', tail: 'tiny', nose: 0x23324a, snout: 0xdce8f6, size: 1.3 }],
  ['denizyildizi', 'Yıldız', '⭐', 'Yıldızlar gibi parlıyorsun! Teşekkürler!', { body: 0xff9a3a, belly: 0xffd08a, ear: 'point', earIn: 0xffd08a, tail: 'none', nose: 0xc2602a, size: 0.95 }],
  ['kopekbaligi', 'Dişsiz', '🦈', 'Korkma, ben iyi bir köpekbalığıyım! Sağ ol!', { body: 0x8a9ab0, belly: 0xffffff, ear: 'point', tail: 'long', nose: 0x2b2f3a, teeth: true, size: 1.15 }],
  ['ejderha', 'Alev', '🐉', 'Ateş püskürtmem bile işe yaramadı. Sen harikasın!', { body: 0x6fcf5a, belly: 0xf6e49a, ear: 'point', earTip: 0xff6a3a, tail: 'bushy', nose: 0x2a5a24, snout: 0x8fe07a, size: 1.2 }],
  ['unicorn', 'Gökkuşağı', '🦄', 'Sihrimle bile kaçamadım! Sen en iyisisin!', { body: 0xf6eefc, belly: 0xffffff, ear: 'point', earIn: 0xffb6d8, tail: 'bushy', nose: 0xff9db4, snout: 0xf6eefc, size: 1.1 }],
];
SEA_DEF.forEach(([k, name, emoji, line, spec]) => { ANIMALS[k] = spec; FRIENDS[k] = { name, emoji, world: 'sea', bonus: 50, line }; });
WORLD_META.sea = { name: 'Deniz Adaları', music: 'xsky' };

/* ---------- Adaların yerleşimi ---------- */
const SEA_ISLANDS = (() => {
  const L = [{ x: 0, z: 0, R0: 24, R1: 36, center: true, idx: -1, parent: -1 }], rings = [[6, 85, 0], [8, 150, 22.5], [10, 215, 18]];
  const prevIdx = [[-1]], rad = (d) => (d * Math.PI) / 180; let n = 0, prevStart = -1, prevCount = 1;
  rings.forEach(([cnt, r, off], ri) => {
    const start = n;
    for (let k = 0; k < cnt; k++) {
      const ang = off + (k * 360) / cnt, x = Math.round(Math.sin(rad(ang)) * r), z = Math.round(-Math.cos(rad(ang)) * r);
      let parent = -1;
      if (ri > 0) { let best = 1e9; for (let q = 0; q < prevCount; q++) { const o = L[1 + prevStart + q], d = Math.hypot(o.x - x, o.z - z); if (d < best) { best = d; parent = prevStart + q; } } }
      L.push({ x, z, R0: 11, R1: 18, idx: n, parent }); n++;
    }
    prevStart = start; prevCount = cnt;
  });
  return L;
})();
const seaIsl = (i) => (i < 0 ? SEA_ISLANDS[0] : SEA_ISLANDS[1 + i]);
const Sea = (G.sea = { w: null, list: [] });
Sea.isOpen = (idx) => totalRescued() >= idx + 1;

function buildSea() {
  const flats = SEA_ISLANDS.map((i) => [i.x, i.z, i.R0, i.R1, 1.0]);
  const w = openWorld({
    id: 'sea', sky: [0x4cc8ff, 0xfff6e0], fog: 0xd0f0ff, fogD: 0.0033, water: 0x2fc4e8, hemi: [0xffffff, 0xbfe6ff, 1.0], sunI: 1.0, theme: 'sea', rx: 265, rz: 265, half: 290, reach: 255, step: 3, mapHalf: 262,
    flats, paths: [], relief: { pits: 0, mounds: 0, amp: 0 }, hills: () => -6,
    color: (x, z, h) => (h < 0.1 ? 0xd9c88a : h < 0.6 ? 0xf3e5b4 : [0x7fdc58, 0x6fcf4a, 0x8fe068][Math.abs(Math.floor(x * 0.21 + z * 0.17)) % 3]),
  });
  const A0 = SEA_ISLANDS[0]; w.spawn.set(0, 1.05, -2);
  addPortal(w, -9, 1.0, 9, 'village', 0xffe27a, 'Köye dön');
  addSign(w, 5, 1.0, 5, '🏝️ Deniz Adaları! Her hayvanı kurtardığında yeni bir ada ve köprü açılır. Sisli adalar henüz kapalı.');
  addSign(w, -5, 1.0, -8, '🌉 Köprülerden yürüyerek ya da uçarak (F) adalara git. Kafesi bulup arkadaşını kurtar!');
  Sea.w = w; Sea.list = [];
  const tops = (x, z) => w.groundAt(x, z);
  /* köprüler: üst ada kenarından alt ada kenarına, 2.2 birim aralıklı tahtalar */
  SEA_ISLANDS.slice(1).forEach((isl) => {
    const par = isl.parent < 0 ? A0 : seaIsl(isl.parent), dx = isl.x - par.x, dz = isl.z - par.z, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
    const s0 = par.R0 - 0.5, s1 = len - isl.R0 + 0.5, planks = [];
    for (let s = s0; s <= s1; s += 2.2) { const cx = par.x + ux * s, cz = par.z + uz * s, p = { minx: cx - 1.5, maxx: cx + 1.5, minz: cz - 1.5, maxz: cz + 1.5, miny: 0.3, maxy: 1.0, type: 'wood', active: true, mesh: { visible: true } }; w.solids.push(p); planks.push(p); }
    const bl = s1 - s0 + 1, bm = new T.Group(); bm.position.set(par.x + ux * (s0 + s1) / 2, 0, par.z + uz * (s0 + s1) / 2); bm.rotation.y = Math.atan2(ux, uz); w.group.add(bm);
    const deck = mesh(BOX(), M(0xb98550), 0, 0.72, 0); deck.scale.set(3, 0.5, bl); deck.receiveShadow = true; bm.add(deck);
    for (let q = -bl / 2 + 0.6; q < bl / 2; q += 1.2) { const pl = mesh(BOX(), M(0x8b5a2b), 0, 0.99, q); pl.scale.set(3.05, 0.04, 0.12); bm.add(pl); }
    [-1.55, 1.55].forEach((sx) => { const rl = mesh(BOX(), M(0x6a4222), sx, 1.5, 0); rl.scale.set(0.12, 0.12, bl); bm.add(rl); for (let q = -bl / 2; q <= bl / 2; q += 4) { const po = mesh(BOX(), M(0x6a4222), sx, 1.2, q); po.scale.set(0.16, 0.9, 0.16); bm.add(po); } });
    const rec = { isl, planks, bridge: bm, op: null, mist: null, beacon: null, cage: null, sign: null }; Sea.list.push(rec);
    /* adanın süsü */
    const cx = isl.x, cz = isl.z;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283 + isl.idx, r = 6 + w.rng() * 2.5, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (tops(x, z) > 0.6) palm(w, x, tops(x, z), z, 0.9 + w.rng() * 0.5); }
    for (let i = 0; i < 5; i++) { const a = w.rng() * 6.283, r = 3 + w.rng() * 7, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (tops(x, z) > 0.6 && Math.hypot(x - cx, z - cz) > 3.5) rock(w, x, tops(x, z), z, 0.6 + w.rng() * 0.8, 0xb8b0a0); }
    for (let i = 0; i < 10; i++) { const a = w.rng() * 6.283, r = 3 + w.rng() * 7, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (tops(x, z) > 0.6) flower(w, x, tops(x, z), z, pick([0xff7eb6, 0xffd23f, 0xffffff, 0x8fd0ff])); }
    coinRingG(w, cx, cz, 4.8, 8);
    const key = SEA_DEF[isl.idx][0]; addCage(w, key, cx, tops(cx, cz), cz, false); rec.cage = w.cages[w.cages.length - 1]; rec.cage.lockFn = () => !Sea.isOpen(isl.idx);
    addBeacon(w, cx, 1.0, cz, 0x7affd0, 34); rec.beacon = w.beacons[w.beacons.length - 1];
    addSign(w, cx + 3.4, 1.0, cz + 3.4, `${SEA_DEF[isl.idx][2]} ${SEA_DEF[isl.idx][1]} burada bekliyor! (${isl.idx + 1}. ada)`); rec.sign = w.signs[w.signs.length - 1];
    if (isl.idx % 3 === 2) addChest(w, 'sea' + isl.idx, cx - 4, 1.0, cz - 4);
    const mist = mesh(geo('cyl', isl.R0 + 4, isl.R0 + 4, 16, 22), new T.MeshBasicMaterial({ color: 0xeef6ff, transparent: true, opacity: 0.62, depthWrite: false, fog: false }), cx, 7, cz); add(w, mist); rec.mist = mist;
  });
  /* merkez ada */
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283, r = 14 + w.rng() * 4, x = Math.cos(a) * r, z = Math.sin(a) * r; palm(w, x, tops(x, z), z, 1 + w.rng() * 0.5); }
  coinRingG(w, 0, 0, 10, 14); addChest(w, 'seaC', 8, 1.0, -8);
  for (let i = 0; i < 14; i++) cloud(w, lerp(-250, 250, w.rng()), 30 + w.rng() * 16, lerp(-250, 250, w.rng()), 2 + w.rng());
  Sea.refresh(w, true);
  return finishWorld(w);
}
Sea.refresh = (w, first) => {
  let opened = 0;
  Sea.list.forEach((rec) => {
    const op = Sea.isOpen(rec.isl.idx), resc = !!save.rescued[SEA_DEF[rec.isl.idx][0]];
    if (op !== rec.op) {
      rec.planks.forEach((p) => { p.active = op; }); rec.bridge.visible = op; rec.mist.visible = !op; if (rec.op === false && op) opened++;
      rec.sign.text = op ? `${SEA_DEF[rec.isl.idx][2]} ${SEA_DEF[rec.isl.idx][1]} burada bekliyor! (${rec.isl.idx + 1}. ada)` : `🌫️ Sisli ada: ${rec.isl.idx + 1}. hayvanı kurtarınca açılır.`;
      if (rec.op === false && op && !first) { celebrate(rec.isl.x, 4, rec.isl.z, true, 'Yeni ada! 🏝️'); G.ui.toast(`🏝️ Yeni ada açıldı: ${rec.isl.idx + 1}. ada!`, 'gold'); }
      rec.op = op;
    }
    rec.beacon.b.visible = op && !resc; rec.beacon.star.visible = op && !resc; rec.beacon.ring.visible = op && !resc;
  });
};
WORLD_BUILDERS.sea = buildSea;
Ex.mods.push({
  onWorld(w) { if (w.id !== 'sea') Sea.w = null; },
  update() { if (G.world && G.world.id === 'sea' && Sea.w === G.world) { Sea.t = (Sea.t || 0) + 1; if (Sea.t % 20 === 0) Sea.refresh(G.world, false); } },
});
