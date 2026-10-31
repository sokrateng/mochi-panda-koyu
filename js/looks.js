'use strict';
/* ============ Görünüm: karakteri hayvana çevirme, evcil hayvanlar, arkadaşlarla ortak ekran ============ */
const Looks = (G.looks = { pets: new Map() });
const lerpA = (a, b, k) => a + (b - a) * k;

/* ---------- Karakter biçimi (kedi, köpek, kuş…) ---------- */
Looks.makeForm = (id) => {
  if (id === 'kus') {
    const b = mkBird(0x4aa8ff); b.scale.setScalar(3.4); b.userData.fh = { y: 1.02, z: 0.58, r: 0.34 }; b.userData.kind = 'bird'; return shadowAll(b);
  }
  const c = makeCreature(id), s = ANIMALS[id], shell = !!s.shell, k = (shell ? 1.3 : 0.9) / s.size;
  c.scale.setScalar(s.size * k); c.userData.fh = shell ? { y: 0.78 * 1.3, z: 0.62 * 1.3, r: 0.33 * 1.3 } : { y: 1.3 * 0.9, z: 0.12 * 0.9, r: 0.44 * 0.9 };
  c.userData.tailAnim = true; return c;
};
Looks.applyForm = (p, form) => {
  const u = p.userData; form = form || 'panda'; if (u.formId === form) return; u.formId = form;
  if (u.formMesh) { p.remove(u.formMesh); u.formMesh = null; }
  const show = form === 'panda';
  u.body.traverse((o) => {
    if (!o.isMesh) return; let a = o, acc = false; while (a && a !== u.body) { if (a === u.accBody || a === u.accHead) { acc = true; break; } a = a.parent; } if (!acc) o.visible = show;
  });
  if (show) { u.head.position.set(0, 1.17, 0); u.head.scale.setScalar(1); return; }
  if (!ANIMALS[form] && form !== 'kus') { u.formId = 'panda'; return; }
  const f = Looks.makeForm(form), h = f.userData.fh; ownMats(f); p.add(f); u.formMesh = f;
  u.head.position.set(0, h.y, h.z); u.head.scale.setScalar(h.r / 0.54);
};
/* st: { run, air, fly, roll } */
Looks.anim = (m, st, dt, t) => {
  const u = m.userData, f = u.formMesh; if (!f) return;
  const k = Math.min(1, dt * 12), vid = u.vehId, vs = u.vsize || 1;
  let y = st.run ? Math.abs(Math.sin(t * 10)) * 0.12 : Math.sin(t * 2.2) * 0.02;
  if (st.fly) y += 0.15; if (vid && VEH[vid]) y += VEH[vid].lift * vs;
  f.position.y = y; f.position.z = vid && VEH[vid] ? VEH[vid].z * vs : 0;
  if (st.roll) f.rotation.x += dt * 20; else f.rotation.x = lerpA(f.rotation.x % (Math.PI * 2) > Math.PI ? f.rotation.x - Math.PI * 2 : f.rotation.x, st.fly ? 0.5 : st.run ? 0.07 : 0, k);
  f.rotation.z = Math.sin(t * 10) * 0.05 * (st.run ? 1 : 0);
  if (u.formId === 'kus') { const w = f.userData.wings; if (w) w.forEach((q, i) => { q.rotation.z = (i ? 1 : -1) * ((st.air || st.fly) ? Math.sin(t * 24) * 0.9 : 0.12); }); }
  else animCreature(f, t, 'idle', st.run ? 2.2 : 0.6);
};
Looks.visual = (m, dt) => {
  if (!m.userData.formMesh) return;
  const sp = Math.hypot(P.vel.x, P.vel.z);
  Looks.anim(m, { run: P.onGround && sp > 0.6, air: !P.onGround, fly: P.fly, roll: P.rolling > 0 }, dt, G.time);
};
Looks.animRemote = (p, m, dt) => { if (m.userData.formMesh) Looks.anim(m, { run: p.a === 1, air: p.a === 2, fly: p.a === 4, roll: p.a === 3 }, dt, G.time); };

/* ---------- Evcil hayvan: peşinde dolaşır ---------- */
Looks.makePet = (id) => {
  let m;
  if (id === 'kus') { m = mkBird(pick([0x4aa8ff, 0xffd23f, 0xff6f91, 0x4ad66d])); m.scale.setScalar(2.1); }
  else if (id === 'minipanda') { m = makePanda({ hat: 'none', glasses: 'none', scarf: 'none', pack: 'none', trail: 'none', fur: 'strawberry', outfit: 'none', form: 'panda', pet: 'none' }, { shadow: true }); m.scale.setScalar(0.42); }
  else { m = makeCreature(id); m.scale.setScalar(0.5 / (id === 'kaplumbaga' ? 1.2 : 1)); }
  ownMats(m); const g = new T.Group(); g.add(m); scene.add(g); return { g, m, id, x: 0, z: 0, y: 0, ang: 0, ph: Math.random() * 9, moving: 0, ready: false };
};
Looks.dropPet = (pet) => { if (pet && pet.g.parent) pet.g.parent.remove(pet.g); };
Looks.followPet = (key, id, ox, oy, oz, oyaw, onGround, visible, dt) => {
  let pet = Looks.pets.get(key);
  if (!id || id === 'none') { if (pet) { Looks.dropPet(pet); Looks.pets.delete(key); } return; }
  if (pet && pet.id !== id) { Looks.dropPet(pet); pet = null; }
  if (!pet) { pet = Looks.makePet(id); Looks.pets.set(key, pet); }
  pet.g.visible = visible; if (!visible) { pet.ready = false; return; }
  const w = G.world, bird = id === 'kus', t = G.time, side = key === 'me' ? 1 : -1;
  const tx = ox - Math.sin(oyaw) * 2.3 + Math.cos(oyaw) * 0.9 * side, tz = oz - Math.cos(oyaw) * 2.3 - Math.sin(oyaw) * 0.9 * side;
  if (!pet.ready || Math.hypot(pet.x - ox, pet.z - oz) > 26) { pet.x = tx; pet.z = tz; pet.y = oy; pet.ready = true; }
  const dx = tx - pet.x, dz = tz - pet.z, d = Math.hypot(dx, dz);
  const sp = d > 0.6 ? Math.min(d * 3.2, bird ? 14 : 13) : 0; pet.moving = lerpA(pet.moving, sp > 0.4 ? 1 : 0, Math.min(1, dt * 8));
  if (d > 0.01) { pet.x += (dx / d) * sp * dt; pet.z += (dz / d) * sp * dt; }
  const face = sp > 0.4 ? Math.atan2(dx, dz) : Math.atan2(ox - pet.x, oz - pet.z); pet.ang += angWrap(face - pet.ang) * Math.min(1, dt * 7);
  const gnd = w && w.groundAt ? w.groundAt(pet.x, pet.z) : 0, wantY = bird ? oy + 2.1 + Math.sin(t * 2 + pet.ph) * 0.3 : (onGround ? oy : gnd);
  pet.y = lerpA(pet.y, wantY, Math.min(1, dt * (bird ? 4 : 14)));
  const hop = bird ? 0 : pet.moving * Math.abs(Math.sin(t * 9 + pet.ph)) * 0.2;
  pet.g.position.set(pet.x, pet.y + hop, pet.z); pet.g.rotation.y = pet.ang;
  if (bird) { const wg = pet.m.userData.wings; wg.forEach((q, i) => { q.rotation.z = (i ? 1 : -1) * Math.sin(t * 26 + pet.ph) * 0.9; }); }
  else if (id === 'minipanda') { const u = pet.m.userData; u.legL.rotation.x = Math.sin(t * 10) * 0.8 * pet.moving; u.legR.rotation.x = -u.legL.rotation.x; u.armL.rotation.x = -u.legL.rotation.x; u.armR.rotation.x = u.legL.rotation.x; }
  else animCreature(pet.m, t, 'idle', 0.5 + pet.moving * 1.6);
  if (key === 'me' && !pet.heart) pet.heart = G.time + 20 + Math.random() * 25;
  if (key === 'me' && G.time > pet.heart && G.mode === 'play') { pet.heart = G.time + 25 + Math.random() * 30; Labels.temp('💕', 'emote', (v) => v.set(pet.g.position.x, pet.g.position.y + 1.3, pet.g.position.z), 1.8); }
};
Looks.updatePets = (dt) => {
  if (G.mode !== 'play' && G.mode !== 'wardrobe') return;
  Looks.followPet('me', save.equip.pet, P.pos.x, P.pos.y, P.pos.z, P.yaw, P.onGround || !!Ex.seat, true, dt);
  const seen = new Set(['me']);
  if (Net.active) Net.players.forEach((p, id) => {
    seen.add(id); if (!p.mesh) return; const here = G.world && p.w === G.world.id && p.seen;
    Looks.followPet(id, p.equip && p.equip.pet, p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, p.mesh.rotation.y, p.a !== 2 && p.a !== 4, !!here, dt);
  });
  Looks.pets.forEach((pet, key) => { if (!seen.has(key)) { Looks.dropPet(pet); Looks.pets.delete(key); } });
};

/* ---------- Arkadaşlarla ortak ekran: biri portala girince herkes birlikte gider ---------- */
Looks.followGoto = (d) => {
  if (save.settings.follow === false || !G.world || G.mode !== 'play') return; const id = String(d.w || '');
  if (!WORLD_META[id] || G.world.id === id || G.traveling || G.time - (Looks.lastGoto || -9) < 2.5) return;
  const reg = Ex.region(id); if (reg && !reg.open()) { G.ui.toast(`🔒 Arkadaşların ${WORLD_META[id].name} dünyasına gitti ama sende kilitli.`); return; }
  Looks.lastGoto = G.time; Net.suppressGoto = id; G.ui.toast(`🌍 Arkadaşlarınla birlikte ${WORLD_META[id].name} dünyasına gidiyorsun!`);
  G.traveling = true; loadWorld(id, { fromNet: true }); setTimeout(() => { G.traveling = false; }, 900);
};

Ex.mods.push({ visual: (m, dt) => { Looks.visual(m, dt); Looks.updatePets(dt); } });
