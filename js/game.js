'use strict';
/* ============ Oyun motoru: sahne, fizik, oyuncu, düşman, boss, kamera, girdi ============ */
const canvas = $('game');
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
let renderer;
/* iPhone/iPad Safari belleği sınırlı: önce hafif ayarlarla, olmazsa en hafif ayarlarla dene */
for (const opts of [{ antialias: !isTouch, powerPreference: 'default' }, { antialias: false, powerPreference: 'low-power' }]) {
  try { renderer = new T.WebGLRenderer({ canvas, ...opts }); break; } catch (e) { renderer = null; }
}
if (!renderer) { window.__bootError && window.__bootError('WebGL başlatılamadı'); throw new Error('WebGL yok'); }
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setTimeout(() => location.reload(), 1200); });
const pixelRatio = () => (save.settings.quality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));
renderer.setPixelRatio(pixelRatio());
renderer.shadowMap.enabled = true; renderer.shadowMap.type = isTouch ? T.PCFShadowMap : T.PCFSoftShadowMap;
renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.88;
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(60, 1, 0.1, 700);
const hemi = new T.HemisphereLight(0xffffff, 0x88aa88, 0.8); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff2d6, 0.9); sun.castShadow = true; sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 140 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05; scene.add(sun, sun.target);

/* gökyüzü kubbesi */
const skyGeo = new T.SphereGeometry(400, 16, 12);
skyGeo.setAttribute('color', new T.BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
const sky = new T.Mesh(skyGeo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -1; scene.add(sky);
function setSky(top, bot) {
  const pos = skyGeo.attributes.position, col = skyGeo.attributes.color, ct = new T.Color(top), cb = new T.Color(bot), c = new T.Color();
  for (let i = 0; i < pos.count; i++) { const t = clamp((pos.getY(i) / 400 + 0.12) / 1.0, 0, 1); c.copy(cb).lerp(ct, Math.pow(t, 0.75)); col.setXYZ(i, c.r, c.g, c.b); }
  col.needsUpdate = true;
}
const waterNormal = (() => {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S);
  const h = (u, v) => Math.sin(u * 6.283 * 3 + Math.sin(v * 6.283 * 2) * 1.4) * 0.5 + Math.sin((u + v) * 6.283 * 5) * 0.25 + Math.sin((u * 2 - v) * 6.283 * 7) * 0.12;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const e = 1 / S, dx = (h((i + 1) * e, j * e) - h((i - 1) * e, j * e)) * 6, dy = (h(i * e, (j + 1) * e) - h(i * e, (j - 1) * e)) * 6, l = Math.hypot(dx, dy, 1), k = (j * S + i) * 4;
    img.data[k] = (-dx / l * 0.5 + 0.5) * 255; img.data[k + 1] = (-dy / l * 0.5 + 0.5) * 255; img.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(90, 90); return t;
})();
const waterMat = new T.MeshStandardMaterial({ color: 0x3fb6e8, transparent: true, opacity: 0.86, roughness: 0.12, metalness: 0.15, normalMap: waterNormal, normalScale: new T.Vector2(0.6, 0.6) });
const water = new T.Mesh(new T.PlaneGeometry(900, 900), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = -3.2; scene.add(water);

/* güneş */
const sunDir = new T.Vector3(22, 38, 14).normalize();
const sunSprite = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.18, 'rgba(255,240,190,0.9)'); g.addColorStop(0.5, 'rgba(255,220,150,0.25)'); g.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), blending: T.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); s.scale.set(150, 150, 1); s.renderOrder = -1; scene.add(s); return s;
})();

/* ---------- Gün ışığı: sabah / akşam ---------- */
const stars = (() => {
  const n = 700, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, e = Math.random() * 1.35 + 0.12, r = 380; p[i * 3] = Math.cos(a) * Math.cos(e) * r; p[i * 3 + 1] = Math.sin(e) * r; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3));
  const pts = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9, depthWrite: false }));
  pts.visible = false; pts.frustumCulled = false; scene.add(pts); return pts;
})();
const todMode = () => { const m = save.settings.time; if (m === 'morning' || m === 'evening') return m; const h = new Date().getHours(); return h >= 6 && h < 17 ? 'morning' : 'evening'; };
function applyTod(w) {
  const mode = todMode(), c = (h) => new T.Color(h); G.tod = mode;
  let top = c(w.sky[0]), bot = c(w.sky[1]), fog = c(w.fog), hc = c(w.hemi[0]), hg = c(w.hemi[1]), hI = w.hemi[2] * 0.7, sc = c(0xfff2d6), sI = w.sunI * 1.05, dir = [22, 38, 14], spr = 0xfff0c0, sprS = 150, st = false;
  if (w.id === 'w2') { sc = c(0xb8b0ff); }
  else if (mode === 'morning') { top.lerp(c(0xffd9b0), 0.12); bot.lerp(c(0xffe0bd), 0.5); fog.lerp(c(0xffdfc0), 0.45); hc = c(0xfff0e0); sc = c(0xffddb0); sI *= 0.95; dir = [34, 17, 9]; spr = 0xffd9a0; sprS = 190; }
  else { top = c(0x1b2460); bot = c(0xff8a5a); fog = c(0xb8788c); hc = c(0x8f86c8); hg = c(0x5a4864); hI *= 0.85; sc = c(0xff8c4a); sI *= 0.8; dir = [-34, 11, 12]; spr = 0xff9a50; sprS = 230; st = true; }
  setSky(top, bot); scene.fog = new T.FogExp2(fog, w.fogD); hemi.color.copy(hc); hemi.groundColor.copy(hg); hemi.intensity = hI; sun.color.copy(sc); sun.intensity = sI;
  sunDir.set(dir[0], dir[1], dir[2]).normalize(); sunSprite.material.color.set(spr); sunSprite.scale.set(sprS, sprS, 1); sunSprite.visible = w.id !== 'w2'; stars.visible = st && w.id !== 'w2';
}
G.reapplyTod = () => { if (G.world) applyTod(G.world); };

/* ---------- Parçacıklar ---------- */
const fxMats = {}; const fxMat = (c) => fxMats[c] || (fxMats[c] = new T.MeshBasicMaterial({ color: c }));
const FX = {
  pool: [], live: [],
  init() { for (let i = 0; i < 320; i++) { const m = new T.Mesh(geo('oct', 0.5), fxMat(0xffffff)); m.visible = false; scene.add(m); this.pool.push(m); } },
  spawn(x, y, z, vx, vy, vz, color, size, life, grav) {
    const m = this.pool.pop(); if (!m) return; m.material = fxMat(color); m.position.set(x, y, z); m.visible = true;
    this.live.push({ m, vx, vy, vz, size, life, max: life, grav, spin: rand(-8, 8) });
  },
  burst(x, y, z, color, n = 8, speed = 4, size = 0.25, life = 0.6, grav = 10, up = 2) {
    for (let i = 0; i < n; i++) { const a = rand(0, 6.283), s = rand(0.4, 1) * speed; this.spawn(x, y, z, Math.cos(a) * s, rand(0, 1) * speed * 0.8 + up, Math.sin(a) * s, Array.isArray(color) ? pick(color) : color, size * rand(0.7, 1.3), life * rand(0.7, 1.2), grav); }
  },
  confetti(x, y, z, n = 60) { this.burst(x, y, z, [0xff5f8d, 0xffd23f, 0x5ec8ff, 0x7ed957, 0xb28bff, 0xffffff], n, 8, 0.28, 1.8, 9, 6); },
  update(dt) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i]; p.life -= dt;
      if (p.life <= 0) { p.m.visible = false; this.pool.push(p.m); this.live.splice(i, 1); continue; }
      p.vy -= p.grav * dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      p.m.rotation.y += p.spin * dt; p.m.rotation.x += p.spin * dt * 0.5; p.m.scale.setScalar(p.size * Math.min(1, (p.life / p.max) * 2.2));
    }
  },
};
FX.init();

/* ---------- Etiketler (isim, selam) ---------- */
const Labels = {
  items: new Set(),
  make(text, cls = '') { const el = document.createElement('div'); el.className = 'label ' + cls; el.textContent = text; $('labels').appendChild(el); const it = { el, pos: new T.Vector3(), ttl: 0, getPos: null }; this.items.add(it); return it; },
  remove(it) { it.el.remove(); this.items.delete(it); },
  temp(text, cls, getPos, ttl) { const it = this.make(text, cls); it.getPos = getPos; it.ttl = ttl; return it; },
  update(dt) {
    const v = new T.Vector3(), w = innerWidth, h = innerHeight;
    for (const it of this.items) {
      if (it.ttl > 0) { it.ttl -= dt; if (it.ttl <= 0) { this.remove(it); continue; } }
      if (it.getPos) it.getPos(it.pos);
      v.copy(it.pos).project(camera);
      if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2 || it.hidden) { it.el.style.display = 'none'; continue; }
      it.el.style.display = ''; it.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px,${(-v.y * 0.5 + 0.5) * h}px) translate(-50%,-100%)`;
    }
  },
};

/* ---------- Durum ---------- */
G.time = 0; G.mode = 'title'; G.paused = false; G.world = null; G.bossFight = false;
const P = (G.player = {
  pos: new T.Vector3(), vel: new T.Vector3(), yaw: 0, onGround: false, coyote: 0, jumps: 0, jumpBuf: 0, jumpHeld: false, cut: false,
  rolling: 0, rollCd: 0, rollDir: new T.Vector3(0, 0, 1), sprintOn: false, invis: 0, invisCd: 0, fly: false, energy: 5,
  inv: 0, standing: null, groundIce: false, vehicle: null, rideAcc: 0, clip: 0, clipHut: null, barrierPass: 0, squash: 0, respawn: new T.Vector3(), mesh: null, phase: 0, trailT: 0, alpha: 1, anim: 0, wasGround: false,
});
const cam = { yaw: 0, pitch: 0.42, dist: 9.5, pos: new T.Vector3(), target: new T.Vector3(), dragging: false };
const Input = { keys: new Set(), tx: 0, tz: 0, jumpTouch: false, downTouch: false, interact: false };
const MAX_ENERGY = 5;
/* Karakter boyutu ayarlanabilir: çarpışma kutusu da onunla birlikte büyür/küçülür */
let HW = 0.38, PH = 1.7;
const charSize = () => clamp(save.settings.size || 1, 0.6, 1.5);
function applySize() {
  const s = charSize(); HW = 0.38 * s; PH = 1.7 * s; if (P.mesh) P.mesh.scale.setScalar(s);
  const w = G.world; if (!w) return;
  /* büyüyünce duvar/ağaç içinde kalmasın: en yakın boş yere it */
  const hit = (x, z) => w.solids.some((o) => o.active && !o.barrier && x + HW > o.minx && x - HW < o.maxx && z + HW > o.minz && z - HW < o.maxz && P.pos.y + PH > o.miny && P.pos.y < o.maxy - 0.05);
  if (!hit(P.pos.x, P.pos.z)) return;
  for (let r = 0.2; r <= 3; r += 0.2) for (let a = 0; a < 16; a++) { const x = P.pos.x + Math.cos(a * 0.3927) * r, z = P.pos.z + Math.sin(a * 0.3927) * r; if (!hit(x, z)) { P.pos.x = x; P.pos.z = z; return; } }
}
G.applySize = applySize;
const W = () => G.world;

/* ---------- Dünya yükleme ---------- */
function loadWorld(id, opts = {}) {
  const apply = () => {
    if (G.world) { scene.remove(G.world.group); G.world.group.traverse((c) => { if (c.isLight) c.dispose && c.dispose(); }); }
    G.bossFight = false; $('bossBar').classList.add('hidden');
    const w = WORLD_BUILDERS[id](); G.world = w; scene.add(w.group);
    applyTod(w);
    water.position.y = w.waterY; waterMat.color.set(w.water); waterMat.emissive.set(id === 'w2' ? 0x2a1580 : 0x000000);
    w.lights.slice(0, 6).forEach((l) => { const pl = new T.PointLight(l.c, 1.1, 30, 1.6); pl.position.set(l.x, l.y, l.z); w.group.add(pl); });
    if (id === 'w2') { w.fireflies = true; }
    spawnBoss(w);
    if (save.settings.easy) { w.breakables.forEach((s) => { s.active = false; s.mesh.visible = false; }); w.barriers.forEach((s) => { s.active = false; s.mesh.visible = false; s.edge.visible = false; s.extra.visible = false; }); }
    w.cages.forEach((c) => { if (save.rescued[c.fid]) freeCageVisual(c, true); });
    const today = todayStr(); w.chests.forEach((c) => { if (save.chests[c.key] === today) { c.open = true; c.lid.rotation.x = -1.7; } });
    if (id === 'village' && rescuedCount() === 5) startCelebration(w);
    const sp = opts.pos || w.spawn; P.pos.set(sp.x, sp.y + (opts.pos ? 0.5 : 0), sp.z); P.vel.set(0, 0, 0); P.respawn.copy(w.spawn); P.respawn.y += 0.2;
    P.inv = 0; P.fly = false; P.rolling = 0; P.standing = null; P.coyote = 0; P.energy = MAX_ENERGY; P.hitCd = 0; P.netCd = 0; P.punch = 0; Nets.clear();
    P.yaw = id === 'village' ? Math.PI : Math.PI; cam.yaw = 0; cam.pitch = 0.42; snapCamera();
    Sfx.setTheme(w.theme === 'village' || id === 'village' ? 'village' : id);
    G.ui && G.ui.worldChanged(id);
    if (id !== 'village' && !opts.silent) addStat('worlds');
    setTimeout(() => { $('fade').classList.remove('on'); }, 60);
    Net.onWorld && Net.onWorld();
  };
  if (opts.instant) { apply(); return; }
  $('fade').classList.add('on'); setTimeout(apply, 380);
}
G.loadWorld = loadWorld;

/* ---------- Boss ---------- */
function spawnBoss(w) {
  w.boss = null; const d = w.bossDef; if (!d || save.bossDown[w.id]) return;
  const hp = DIFFICULTY[save.difficulty].bossHp, m = makeCreature(d.kind); m.position.set(d.x, d.y, d.z); w.group.add(m);
  const stars = new T.Group(); for (let i = 0; i < 4; i++) stars.add(mesh(geo('oct', 0.14), M(0xffe24a, { emissive: 0xffc800 }), Math.cos(i * 1.57) * 0.9, 0, Math.sin(i * 1.57) * 0.9)); stars.position.y = 2.1; stars.visible = false; m.userData.inner.add(stars);
  const net = new T.Mesh(geo('ico', 1.05, 1), new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.9, fog: false })); net.position.y = 0.75; net.scale.set(1.15, 1, 1.15); net.visible = false; m.userData.inner.add(net);
  w.boss = { d, mesh: m, stars, net, netted: false, x: d.x, y: d.y, z: d.z, hp, maxHp: hp, state: 'idle', t: 0, cd: 1.5, dx: 0, dz: 1, yaw: 0, alive: true, dead: 0, size: m.userData.size, lastBounce: 0 };
}
function updateBoss(dt) {
  const w = W(), b = w.boss; if (!b) return;
  const a = b.d.arena, m = b.mesh, diff = DIFFICULTY[save.difficulty], mul = diff.bossSpeed * (1 + (b.maxHp - b.hp) * 0.1), r = b.size * 0.5, hgt = b.size * 1.1;
  const inArena = Math.hypot(P.pos.x - a.cx, P.pos.z - a.cz) < a.r + 3 && Math.abs(P.pos.y - b.y) < 10;
  const was = G.bossFight; G.bossFight = inArena && b.alive;
  if (G.bossFight !== was) { $('bossBar').classList.toggle('hidden', !G.bossFight); if (G.bossFight) { $('bossName').textContent = b.d.name; Sfx.play('boss'); G.ui.toast(`⚔️ ${b.d.name} ile karşılaştın!`); } }
  b.t += dt;
  const toP = new T.Vector3(P.pos.x - b.x, 0, P.pos.z - b.z), dist = toP.length(); if (dist > 0.01) toP.divideScalar(dist);
  const ignore = P.invis > 0 || !inArena;
  const face = (dx, dz) => { b.yaw += angDiff(b.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 5); };
  const clampArena = () => { const dx = b.x - a.cx, dz = b.z - a.cz, d = Math.hypot(dx, dz), lim = a.r - r * 0.8; if (d > lim) { b.x = a.cx + (dx / d) * lim; b.z = a.cz + (dz / d) * lim; return true; } return false; };
  const crouch = b.state === 'dizzy' ? 0.7 : 1; m.userData.inner.scale.y = lerp(m.userData.inner.scale.y, crouch, Math.min(1, dt * 8));
  switch (b.state) {
    case 'idle':
      if (ignore) { b.x += Math.sin(b.t * 0.5) * dt * 2; b.z += Math.cos(b.t * 0.35) * dt * 2; face(Math.sin(b.t * 0.5), Math.cos(b.t * 0.35)); clampArena(); }
      else { face(toP.x, toP.z); if (dist > 9) { b.x += toP.x * 2.2 * mul * dt; b.z += toP.z * 2.2 * mul * dt; } b.cd -= dt; if (b.cd <= 0 && dist < 26) { b.state = 'windup'; b.t = 0; b.dx = toP.x; b.dz = toP.z; } }
      break;
    case 'windup': face(b.dx, b.dz); m.userData.inner.position.x = Math.sin(b.t * 60) * 0.05; if (b.t > 1.2 / mul) { b.state = 'charge'; b.t = 0; m.userData.inner.position.x = 0; Sfx.play('dash'); G.shake = 0.3; } break;
    case 'charge': {
      face(b.dx, b.dz); b.x += b.dx * 13 * mul * dt; b.z += b.dz * 13 * mul * dt;
      if (Math.random() < 0.6) FX.burst(b.x, b.y + 0.3, b.z, 0xd8d0c0, 1, 3, 0.5, 0.5, 2, 1);
      if (clampArena()) { b.state = 'dizzy'; b.t = 0; Sfx.play('stomp'); FX.burst(b.x, b.y + b.size * 0.9, b.z, [0xffe24a, 0xffffff], 18, 8, 0.4, 0.8); G.shake = 0.8; }
      else if (b.t > 2.4) { b.state = 'tired'; b.t = 0; }
      break; }
    case 'tired': if (b.t > 1.0) { b.state = 'idle'; b.cd = 1.4; } break;
    case 'dizzy': b.stars.visible = true; b.stars.rotation.y += dt * 5; b.net.visible = b.netted; b.net.rotation.y += dt * 1.5; m.userData.inner.rotation.z = Math.sin(b.t * 6) * 0.1; if (b.t > (b.netted ? 7 : save.difficulty === 'easy' ? 6 : 5)) { b.state = 'idle'; b.cd = 1.2; b.stars.visible = false; b.netted = false; b.net.visible = false; m.userData.inner.rotation.z = 0; } break;
    case 'hurt': b.stars.visible = false; b.net.visible = false; b.netted = false; m.userData.inner.rotation.z = 0; m.visible = Math.floor(b.t * 18) % 2 === 0 || b.t > 1.0; if (b.t > 1.4) { b.state = 'idle'; b.cd = 1.0; m.visible = true; } break;
    case 'dead': b.dead += dt; m.rotation.y += dt * 12; m.position.y += dt * 6; m.scale.multiplyScalar(1 - dt * 0.7); if (b.dead > 1.8) { w.group.remove(m); w.boss = null; } return;
  }
  b.y = w.groundAt ? w.groundAt(b.x, b.z) : b.y;
  m.position.set(b.x, b.y, b.z); m.rotation.y = b.yaw; animCreature(m, G.time, b.state === 'charge' || b.state === 'windup' ? 'angry' : 'idle', b.state === 'dizzy' ? 0.2 : 1);
  if (b.hp > 0) $('bossFill').style.transform = `scaleX(${b.hp / b.maxHp})`;
  if (b.state === 'dead' || !b.alive) return;
  const dx = P.pos.x - b.x, dz = P.pos.z - b.z;
  if (Math.hypot(dx, dz) < r + HW + 0.4 && P.pos.y < b.y + hgt && P.pos.y + PH > b.y) {
    if (b.state === 'dizzy') hitBoss(b, dx, dz);
    else if (P.vel.y < 0 && P.pos.y > b.y + hgt * 0.8) { P.vel.y = 10; Sfx.play('spring'); }
    else if (b.state !== 'hurt' && !ignore) hurtPlayer(dx, dz);
  }
}
function hitBoss(b, dx = 0, dz = 1) {
  const l = Math.hypot(dx, dz) || 1; P.vel.x = (dx / l) * 9; P.vel.z = (dz / l) * 9; P.vel.y = 9; P.jumps = 1; P.rolling = 0;
  b.hp--; b.state = 'hurt'; b.t = 0; Sfx.play('stomp'); FX.burst(b.x, b.y + b.size * 0.9, b.z, [0xffe24a, 0xff6f61], 20, 8, 0.4, 0.8); G.shake = 0.6;
  if (b.hp <= 0) {
    b.alive = false; b.state = 'dead'; save.bossDown[W().id] = true; G.bossFight = false; $('bossBar').classList.add('hidden');
    b.netted = false; b.net.visible = false;
    celebrate(P.pos.x, P.pos.y + 1, P.pos.z, true, 'Yuppiii! 🏆'); FX.confetti(b.x, b.y + 2, b.z, 80); Sfx.play('rescue'); addCoins(40); G.ui.toast(`🎉 ${b.d.name} kaçtı! +40 🪙`, 'gold'); queueSave();
    G.ui.toast('🔓 Kafesin kilidi açıldı!');
  }
}

/* ---------- Kutlama: konfeti + "Yuppi!" sesi + uçuşan yazı ---------- */
function celebrate(x, y, z, big, text) {
  FX.confetti(x, y + 1, z, big ? 90 : 36); Sfx.play(big ? 'yayBig' : 'yay');
  Labels.temp(text || pick(['Yuppi! 🎉', 'Yaşasın! 🥳', 'Harika! ⭐', 'Hoplaaa! 🎊', 'Süper! 🌟']), 'cheer', (v) => v.set(x, y + 2.4, z), 2.2);
  if (big) { G.shake = Math.max(G.shake || 0, 0.25); for (let i = 0; i < 6; i++) setTimeout(() => FX.confetti(x + rand(-3, 3), y + rand(1, 4), z + rand(-3, 3), 26), 150 + i * 170); }
}
G.celebrate = celebrate;

/* ---------- Vurma ve ağ atma ---------- */
function hitBlob(b) {
  b.alive = false; b.respawn = 25; b.mesh.visible = false; b.frozen = 0; if (b.netMesh) b.netMesh.visible = false;
  Sfx.play('stomp'); addStat('stomps'); addCoins(2); FX.burst(b.x, b.oy + 0.5, b.z, [0xb86bff, 0xffffff, 0xffe27a], 10, 4, 0.3, 0.6);
}
let bossHint = 0;
function doHit() {
  if (!G.world || G.paused || G.mode !== 'play' || P.hitCd > 0) return;
  P.hitCd = 0.4; P.punch = 0.28; Sfx.play('whoosh');
  const w = W(), fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), reach = 2.2 * charSize() + 0.5; let any = false;
  for (const b of w.blobs) {
    if (!b.alive) continue; const dx = b.x - P.pos.x, dz = b.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d < reach + 0.4 && (d < 0.8 || (dx * fx + dz * fz) / d > 0.15) && Math.abs(b.oy - P.pos.y) < 2.2) { hitBlob(b); any = true; }
  }
  const b = w.boss;
  if (b && b.alive && b.state !== 'dead') {
    const dx = P.pos.x - b.x, dz = P.pos.z - b.z, d = Math.hypot(dx, dz);
    if (d < b.size * 0.5 + reach + 0.3 && P.pos.y < b.y + b.size * 1.1) {
      any = true;
      if (b.state === 'dizzy') hitBoss(b, dx, dz);
      else { Sfx.play('hit'); FX.burst(P.pos.x + fx * 1.2, P.pos.y + 1, P.pos.z + fz * 1.2, [0xffffff, 0xffe24a], 8, 4, 0.25, 0.4); if (G.time - bossHint > 6) { bossHint = G.time; G.ui.toast('💪 Çok sağlam! Önce sersemlet: duvara çarptır ya da 🕸️ ağ at, sonra vur!'); } }
    }
  }
  if (any) G.shake = Math.max(G.shake || 0, 0.18);
}
const Nets = {
  list: [], mat: null,
  clear() { this.list.forEach((n) => scene.remove(n.m)); this.list.length = 0; },
  target() {
    const w = W(), fx = Math.sin(P.yaw), fz = Math.cos(P.yaw); let best = null, bs = 0.6;
    const cand = (o, x, y, z, r) => { const dx = x - P.pos.x, dz = z - P.pos.z, d = Math.hypot(dx, dz); if (d > 20 || d < 0.1) return; const ang = Math.abs(angDiff(Math.atan2(fx, fz), Math.atan2(dx, dz))); if (ang < bs) { bs = ang; best = { o, x, y, z, r }; } };
    for (const b of w.blobs) if (b.alive && !(b.frozen > 0)) cand(b, b.x, b.oy + 0.5, b.z, 0.9);
    const bo = w.boss; if (bo && bo.alive && bo.state !== 'dead' && !bo.netted) cand(bo, bo.x, bo.y + bo.size * 0.5, bo.z, bo.size * 0.5);
    return best;
  },
  throw() {
    if (!G.world || G.paused || G.mode !== 'play') return;
    if (P.netCd > 0) { G.ui.toast(`🕸️ Ağ hazırlanıyor… ${Math.ceil(P.netCd)} sn`); return; }
    P.netCd = 5; P.punch = 0.3; Sfx.play('net');
    this.mat = this.mat || new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.95, fog: false });
    const m = new T.Mesh(geo('ico', 0.55, 1), this.mat); const s = charSize(), fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
    m.position.set(P.pos.x + fx * 0.8, P.pos.y + 1.1 * s, P.pos.z + fz * 0.8); scene.add(m);
    const tg = this.target(); let vx = fx * 20, vy = 3.5, vz = fz * 20;
    if (tg) { const dx = tg.x - m.position.x, dy = tg.y - m.position.y, dz = tg.z - m.position.z, l = Math.hypot(dx, dy, dz) || 1; vx = (dx / l) * 22; vy = (dy / l) * 22; vz = (dz / l) * 22; }
    this.list.push({ m, vx, vy, vz, age: 0, tg });
  },
  update(dt) {
    const w = W();
    for (let i = this.list.length - 1; i >= 0; i--) {
      const n = this.list[i], p = n.m.position; n.age += dt;
      if (n.tg) { const o = n.tg.o, ty = o.size ? o.y + o.size * 0.5 : o.oy + 0.5, dx = o.x - p.x, dy = ty - p.y, dz = o.z - p.z, l = Math.hypot(dx, dy, dz) || 1; n.vx = lerp(n.vx, (dx / l) * 22, Math.min(1, dt * 6)); n.vy = lerp(n.vy, (dy / l) * 22, Math.min(1, dt * 6)); n.vz = lerp(n.vz, (dz / l) * 22, Math.min(1, dt * 6)); }
      else n.vy -= 7 * dt;
      p.x += n.vx * dt; p.y += n.vy * dt; p.z += n.vz * dt; n.m.rotation.x += dt * 8; n.m.rotation.y += dt * 6; n.m.scale.setScalar(1 + Math.min(n.age, 0.6) * 2.4);
      let done = n.age > 1.5 || (w.groundAt && p.y < w.groundAt(p.x, p.z) + 0.1);
      const bo = w.boss;
      if (!done && bo && bo.alive && bo.state !== 'dead' && bo.state !== 'hurt' && Math.hypot(p.x - bo.x, p.z - bo.z) < bo.size * 0.5 + 0.8 && p.y > bo.y - 0.5 && p.y < bo.y + bo.size * 1.2) { netBoss(bo); done = true; }
      if (!done) for (const b of w.blobs) if (b.alive && !(b.frozen > 0) && Math.hypot(p.x - b.x, p.z - b.z) < 1.5 && Math.abs(p.y - (b.oy + 0.5)) < 1.5) { freezeBlob(b); done = true; break; }
      if (done) { FX.burst(p.x, p.y, p.z, 0xffffff, 6, 3, 0.2, 0.5, 2, 1); scene.remove(n.m); this.list.splice(i, 1); }
    }
  },
};
function netBoss(b) {
  if (b.state === 'hurt') return;
  b.mesh.visible = true; b.state = 'dizzy'; b.t = 0; b.netted = true; b.stars.visible = true; b.net.visible = true; Sfx.play('caught'); G.shake = 0.3;
  FX.burst(b.x, b.y + b.size * 0.8, b.z, [0xffffff, 0xcfeaff], 22, 7, 0.35, 0.9);
  G.ui.toast(`🕸️ ${b.d.name} ağa yakalandı! Şimdi yanına git ve 👊 vur!`, 'gold');
}
function freezeBlob(b) {
  b.frozen = 6; Sfx.play('caught');
  if (!b.netMesh) { b.netMesh = new T.Mesh(geo('ico', 0.85, 1), Nets.mat); b.netMesh.position.y = 0.5; b.mesh.add(b.netMesh); }
  b.netMesh.visible = true; FX.burst(b.x, b.oy + 0.6, b.z, [0xffffff, 0xcfeaff], 10, 3, 0.2, 0.6);
}

/* ---------- Arkadaş kurtarma ---------- */
function freeCageVisual(c, silent) {
  c.freed = true; c.bars.visible = false; c.creature.position.y = 0.05; if (silent) { c.mesh.visible = false; return; }
  c.t = 0; c.hop = true;
}
function rescueFriend(fid, fromNet) {
  if (save.rescued[fid]) return; const f = FRIENDS[fid];
  save.rescued[fid] = true; queueSave();
  const w = W(); const cage = w && w.cages.find((c) => c.fid === fid); if (cage) { freeCageVisual(cage); FX.confetti(cage.x, cage.y + 1.5, cage.z); celebrate(cage.x, cage.y + 1, cage.z, true, `${f.emoji} Yuppiii! Kurtuldu!`); }
  Sfx.play('rescue'); G.ui.toast(`${f.emoji} ${f.name} kurtarıldı!`, 'gold'); G.ui.friendsChanged();
  addCoins(60); let giftName = '';
  if (f.gift) { save.owned[f.gift.cat + ':' + f.gift.id] = true; giftName = SHOP[f.gift.cat].items.find((i) => i.id === f.gift.id).name + ' + '; }
  setTimeout(() => G.ui.showDialog(f.emoji, f.name, f.line), 600);
  setTimeout(() => G.ui.toast(`🎁 ${f.name} hediye verdi: ${giftName}60 🪙`, 'gold'), 1500);
  if (!fromNet && Net.active) Net.send({ t: 'rescue', f: fid });
  if (rescuedCount() === 5 && !save.finale) { save.finale = true; queueSave(); setTimeout(() => G.ui.openFinale(), 7000); }
  G.ui.abilitiesChanged();
}
function startCelebration(w) {
  w.celebrate = true;
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, f = mesh(geo('cone', 0.5, 0.9, 3), M(pick([0xff5f8d, 0xffd23f, 0x5ec8ff, 0x7ed957])), Math.cos(a) * 12, 4.5, 6 + Math.sin(a) * 12); f.rotation.x = Math.PI; w.group.add(f); }
}

/* ---------- Oyuncu: yetenekler ---------- */
function doJump() {
  if (!G.world || G.paused) return;
  if (P.rolling > 0 && tryClipBug()) return;
  P.jumpBuf = 0.14; P.jumpHeld = true;
}
function tryJump() {
  if (P.jumpBuf <= 0) return;
  if (P.fly) return;
  if (P.coyote > 0) { P.vel.y = tryHopBug() ? 19 : 9.8 * (P.vehicle ? VEH[P.vehicle].jump : 1); P.coyote = 0; P.jumps = 1; P.jumpBuf = 0; P.cut = false; P.onGround = false; Sfx.play('jump'); addStat('jumps'); FX.burst(P.pos.x, P.pos.y + 0.1, P.pos.z, 0xffffff, 4, 2, 0.2, 0.4, 2, 0.5); P.squash = -0.5; }
  else if (hasAbility('double') && P.jumps < 2) { tryCurtainBug(); P.vel.y = 9.4 * (P.vehicle ? Math.max(0.6, VEH[P.vehicle].jump) : 1); P.jumps = 2; P.jumpBuf = 0; P.cut = false; Sfx.play('jump2'); addStat('jumps'); addStat('abil'); FX.burst(P.pos.x, P.pos.y + 0.2, P.pos.z, [0xffe24a, 0xffffff], 8, 3, 0.25, 0.5, 2, 0.5); }
}
/* ---------- Gizli hileler (bug): sadece gizli kulübelerin yakınında çalışır ---------- */
const hutNear = (w, p, r) => { for (const h of w.huts || []) if (Math.hypot(p.x - h.cx, p.z - h.cz) < r) return h; return null; };
function rectDist(s, p) { return Math.hypot(Math.max(s.minx - p.x, 0, p.x - s.maxx), Math.max(s.minz - p.z, 0, p.z - s.maxz)); }
function insideHutWall(h) { return h.walls.some((s) => P.pos.x + HW > s.minx && P.pos.x - HW < s.maxx && P.pos.z + HW > s.minz && P.pos.z - HW < s.maxz && P.pos.y + PH > s.miny && P.pos.y < s.maxy); }
function discoverBug(id) {
  if (save.bugs[id]) return; save.bugs[id] = true; addCoins(15); queueSave(); Sfx.play('quest'); G.shake = 0.3; celebrate(P.pos.x, P.pos.y + 0.5, P.pos.z, false, 'Gizli hile! 🐞');
  G.ui.toast(`🐞 Gizli hile bulundu: ${BUGS[id].name}! +15 🪙`, 'gold');
  if (Object.keys(save.bugs).length === Object.keys(BUGS).length) { addCoins(100); G.ui.toast('🏆 Tüm gizli hileleri buldun! +100 🪙', 'gold'); }
}
function tryClipBug() {
  const h = hutNear(W(), P.pos, 8); if (!h || Math.min(...h.walls.map((s) => rectDist(s, P.pos))) > 1.7) return false;
  P.clip = 0.65; P.clipHut = h; P.rolling = 0.65; discoverBug('clip'); return true;
}
function tryHopBug() {
  if (!['skate', 'inline', 'scooter'].includes(P.vehicle)) return false;
  const sp = Math.hypot(P.vel.x, P.vel.z); if (sp < 6) return false; const h = hutNear(W(), P.pos, 10); if (!h) return false;
  const dx = P.vel.x / sp, dz = P.vel.z / sp;
  const ok = h.walls.some((s) => { const d = rectDist(s, P.pos); if (d < 2 || d > 5.5) return false; const cx = (s.minx + s.maxx) / 2 - P.pos.x, cz = (s.minz + s.maxz) / 2 - P.pos.z, l = Math.hypot(cx, cz) || 1; return (cx * dx + cz * dz) / l > 0.6; });
  if (!ok) return false; P.vel.x *= 6 / sp; P.vel.z *= 6 / sp; discoverBug('hop'); return true;
}
function tryCurtainBug() {
  if (!P.sprintOn) return; const h = hutNear(W(), P.pos, 9); if (!h || h.kind !== 'barrier' || rectDist(h.door, P.pos) > 3) return;
  P.barrierPass = 1.0; discoverBug('curtain');
}

/* ---------- Zorunlu sırt çantası: araç seçimi ---------- */
function selectVehicle(id) {
  if (!G.world || (G.mode !== 'play' && G.mode !== 'wardrobe')) return;
  if (id && id === P.vehicle) id = null;
  P.vehicle = id || null; setVehicle(P.mesh, P.vehicle); P.sprintOn = false; if (P.vehicle) P.fly = false;
  Sfx.play(id ? 'dash' : 'click'); FX.burst(P.pos.x, P.pos.y + 0.6, P.pos.z, [0xffe27a, 0xffffff], 10, 3, 0.25, 0.5, 2, 1);
  G.ui.toast(id ? `🎒 ${VEH[id].icon} ${VEH[id].name} çantadan çıktı!` : '🎒 Araç çantaya girdi.'); G.ui.vehicleChanged();
}
G.selectVehicle = selectVehicle;
function doRoll() {
  if (P.vehicle && G.world && !G.paused) { G.ui.toast('🌀 Yuvarlanmak için önce aracı çantaya koy (B).'); return; }
  if (!G.world || G.paused || !hasAbility('roll') || P.rolling > 0 || P.rollCd > 0 || P.fly) return;
  const d = moveDir(); if (d.lengthSq() < 0.01) d.set(Math.sin(P.yaw), 0, Math.cos(P.yaw)); P.rollDir.copy(d.normalize()); P.rolling = 0.7; P.rollCd = 0.55; P.yaw = Math.atan2(d.x, d.z);
  Sfx.play('roll'); addStat('rolls'); addStat('abil');
}
function doInvis() {
  if (!G.world || G.paused || !hasAbility('invis') || P.invis > 0 || P.invisCd > 0) return;
  P.invis = 6; P.invisCd = 10; Sfx.play('invis'); addStat('abil'); G.ui.toast('👻 Görünmezsin! Sihirli perdelerden geçebilirsin.'); FX.burst(P.pos.x, P.pos.y + 1, P.pos.z, [0xb28bff, 0xffffff], 14, 3, 0.3, 0.7, 0, 1);
}
function toggleFly() {
  if (!G.world || G.paused || !hasAbility('fly')) return;
  if (P.fly) { P.fly = false; return; }
  if (P.energy < 0.6) { G.ui.toast('🪽 Enerji doluyor…'); return; }
  P.fly = true; P.vel.y = 4; P.onGround = false; Sfx.play('fly'); addStat('abil');
}
function toggleSprint(on) { if (!hasAbility('sprint')) return; if (on !== undefined) P.sprintOn = on; else P.sprintOn = !P.sprintOn; if (P.sprintOn) { Sfx.play('dash'); addStat('abil'); } }
G.act = { jump: doJump, roll: doRoll, invis: doInvis, fly: toggleFly, sprint: toggleSprint, hit: () => doHit(), net: () => Nets.throw() };

function moveDir() {
  let ix = (Input.keys.has('KeyD') ? 1 : 0) - (Input.keys.has('KeyA') ? 1 : 0) + Input.tx;
  let iz = (Input.keys.has('KeyW') ? 1 : 0) - (Input.keys.has('KeyS') ? 1 : 0) + Input.tz;
  const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = -fz, rz = fx;
  return new T.Vector3(fx * iz + rx * ix, 0, fz * iz + rz * ix);
}

/* ---------- Oyuncu: fizik ---------- */
const solidOn = (s) => s.active && !(s.barrier && (P.invis > 0 || P.barrierPass > 0)) && !(s.hutWall && P.clip > 0 && s.hut === P.clipHut);
function collideAxis(axis, delta, solids) {
  const p = P.pos, w = G.world; p[axis] += delta;
  if (w.groundAt) {
    const gh = w.groundAt(p.x, p.z);
    if (axis === 'y') {
      if (delta <= 0 && P.vel.y <= 0.0001 && p.y <= gh + (P.wasGround ? 0.45 : 0)) { p.y = gh; if (P.vel.y < 0) P.vel.y = 0; P.onGround = true; P.groundIce = !!(w.surfaceAt && w.surfaceAt(p.x, p.z)); }
    } else if (gh - p.y > Math.max(0.25, Math.abs(delta) * 1.7)) { p[axis] -= delta; P['vel'][axis] = 0; }
  }
  for (const s of solids) {
    if (!solidOn(s)) continue;
    if (p.x + HW <= s.minx || p.x - HW >= s.maxx || p.z + HW <= s.minz || p.z - HW >= s.maxz || p.y + PH <= s.miny || p.y >= s.maxy) continue;
    if (axis === 'y') {
      if (delta <= 0) { p.y = s.maxy; if (P.vel.y < 0) P.vel.y = 0; P.onGround = true; P.standing = s; } else { p.y = s.miny - PH; if (P.vel.y > 0) P.vel.y = 0; }
    } else {
      if (!s.barrier && s.maxy - p.y <= 0.5 && P.vel.y <= 0.5 && !s.breakable) { p.y = s.maxy; P.onGround = true; P.standing = s; continue; }
      if (axis === 'x') { p.x = delta > 0 ? s.minx - HW - 0.001 : s.maxx + HW + 0.001; P.vel.x = 0; } else { p.z = delta > 0 ? s.minz - HW - 0.001 : s.maxz + HW + 0.001; P.vel.z = 0; }
    }
  }
}
function insideBarrier() {
  for (const s of W().barriers) if (P.pos.x + HW > s.minx && P.pos.x - HW < s.maxx && P.pos.z + HW > s.minz && P.pos.z - HW < s.maxz && P.pos.y + PH > s.miny && P.pos.y < s.maxy) return true;
  return false;
}
function hurtPlayer(fromDx, fromDz) {
  if (P.inv > 0 || P.invis > 0) return;
  P.inv = 1.2; const l = Math.hypot(fromDx, fromDz) || 1; P.vel.x = (fromDx / l) * -9 * -1; P.vel.z = (fromDz / l) * 9; P.vel.y = 8; P.rolling = 0;
  Sfx.play('hurt'); FX.burst(P.pos.x, P.pos.y + 1, P.pos.z, [0xff6f61, 0xffd23f], 10, 5, 0.25, 0.6); G.shake = 0.35;
}
function respawn() {
  $('fade').classList.add('on');
  setTimeout(() => { P.pos.copy(P.respawn); P.vel.set(0, 0, 0); P.fly = false; P.rolling = 0; P.inv = 1.5; snapCamera(); setTimeout(() => $('fade').classList.remove('on'), 80); }, 300);
}
const approach = (v, t, a) => (v < t ? Math.min(t, v + a) : Math.max(t, v - a));
function updatePlayer(dt) {
  const w = W(), p = P.pos, v = P.vel;
  P.jumpBuf = Math.max(0, P.jumpBuf - dt); P.rollCd = Math.max(0, P.rollCd - dt); P.inv = Math.max(0, P.inv - dt); P.invisCd = Math.max(0, P.invisCd - dt);
  if (P.invis > 0) { P.invis -= dt; if (P.invis <= 0 && insideBarrier()) P.invis = 0.1; }
  P.barrierPass = Math.max(0, P.barrierPass - dt); P.hitCd = Math.max(0, P.hitCd - dt); P.netCd = Math.max(0, P.netCd - dt); P.punch = Math.max(0, P.punch - dt);
  if (P.clipHut) { P.clip = Math.max(0, P.clip - dt); if (P.clip <= 0) { const h = P.clipHut; P.clipHut = null; if (insideHutWall(h)) { p.x = h.cx; p.z = h.cz; p.y = h.fh + 0.2; v.set(0, 0, 0); } } }
  if (!Input.keys.has('ShiftLeft') && !Input.keys.has('ShiftRight') && !isTouch && P.sprintKey) { P.sprintKey = false; P.sprintOn = false; }
  // hareketli platform
  if (P.standing && P.standing.mover) { p.x += P.standing.mover.dx; p.z += P.standing.mover.dz; }
  const d = moveDir(), hasIn = d.lengthSq() > 0.01;
  const veh = P.vehicle ? VEH[P.vehicle] : null;
  let speed = 7.2; if (P.sprintOn && hasAbility('sprint')) speed = 11.5; if (P.fly) speed = 9.5; if (veh && !P.fly) speed = veh.speed * (P.sprintOn ? 1.18 : 1);
  const inMud = P.onGround && !P.standing && w.mudZones.some((m) => Math.hypot(p.x - m.x, p.z - m.z) < m.r);
  if (inMud) { speed *= 0.5; if (Math.hypot(v.x, v.z) > 1 && Math.random() < 0.2) FX.spawn(p.x + rand(-0.3, 0.3), p.y + 0.15, p.z + rand(-0.3, 0.3), rand(-1, 1), rand(1, 3), rand(-1, 1), 0x6b4a2e, 0.22, 0.5, 8); if (G.time - (G.mudMsg || -99) > 8) { G.mudMsg = G.time; G.ui.toast('🟤 Çamur çukuru! Burada yavaşlarsın.'); } }
  const ice = P.onGround && ((P.standing && P.standing.type === 'ice') || (!P.standing && P.groundIce));
  const acc = (P.onGround ? (ice ? 3.2 : 48) : 24) * dt * (veh ? veh.acc : 1);
  if (P.rolling > 0) {
    P.rolling -= dt; v.x = P.rollDir.x * 13.5; v.z = P.rollDir.z * 13.5;
    for (const s of w.breakables) if (s.active && p.x + HW + 0.5 > s.minx && p.x - HW - 0.5 < s.maxx && p.z + HW + 0.5 > s.minz && p.z - HW - 0.5 < s.maxz && p.y + PH > s.miny && p.y < s.maxy) breakWall(s);
  } else if (hasIn) {
    v.x = approach(v.x, d.x * speed, acc * 7); v.z = approach(v.z, d.z * speed, acc * 7);
    P.yaw += angDiff(P.yaw, Math.atan2(d.x, d.z)) * Math.min(1, dt * 14);
  } else { v.x = approach(v.x, 0, acc * 7); v.z = approach(v.z, 0, acc * 7); }
  if (P.vehicle && (P.vehicle === 'bike' || P.vehicle === 'car') && Math.hypot(v.x, v.z) > 10) {
    for (const s of w.breakables) if (s.active && s.hutDoor && p.x + HW + 0.9 > s.minx && p.x - HW - 0.9 < s.maxx && p.z + HW + 0.9 > s.minz && p.z - HW - 0.9 < s.maxz && p.y < s.maxy) { breakWall(s); discoverBug('smash'); }
  }
  // dikey
  if (P.fly) {
    const up = P.jumpHeld || Input.jumpTouch ? 6.5 : (Input.keys.has('KeyC') || Input.downTouch ? -6.5 : -0.6);
    v.y = approach(v.y, up, 40 * dt); P.energy -= dt; if (P.energy <= 0) { P.fly = false; G.ui.toast('🪽 Enerji bitti!'); }
  } else {
    if (P.onGround) { P.coyote = 0.11; P.jumps = 0; } else { P.coyote = Math.max(0, P.coyote - dt); if (P.coyote <= 0 && P.jumps === 0) P.jumps = 1; }
    tryJump();
    if (!P.jumpHeld && v.y > 0 && !P.cut) { v.y *= 0.55; P.cut = true; }
    v.y = Math.max(-32, v.y - (v.y < 0 ? 36 : 27) * dt);
    P.energy = Math.min(MAX_ENERGY, P.energy + dt * (P.onGround ? 2.2 : 0.35));
  }
  const wasGround = P.onGround; P.wasGround = wasGround; P.onGround = false; P.standing = null; P.groundIce = false;
  const near = w.solids;
  collideAxis('x', v.x * dt, near); collideAxis('z', v.z * dt, near); collideAxis('y', v.y * dt - (wasGround && v.y <= 0 ? 0.04 : 0), near);
  if (P.fly && P.onGround) P.fly = false;
  if (P.onGround && !wasGround && P.vel.y <= 0) { P.squash = 0.6; Sfx.play('land'); FX.burst(p.x, p.y + 0.1, p.z, 0xffffff, 3, 2, 0.2, 0.35, 2, 0.3); }
  if (P.standing && P.standing.crumble && P.standing.crumble.state === 'idle') { P.standing.crumble.state = 'shake'; P.standing.crumble.t = 0; }
  if (P.standing && P.standing.crumble && P.standing.crumble.state === 'shake') { /* devam eder */ }
  if (p.y < w.minY) { G.ui.toast('💦 Suya düştün! Sorun değil.'); respawn(false); p.y = w.minY + 100; }
  P.squash = approach(P.squash, 0, dt * 3.2);
  if (P.vehicle && P.onGround) { P.rideAcc += Math.hypot(v.x, v.z) * dt; if (P.rideAcc > 25) { addStat('ride', 25); P.rideAcc -= 25; } }
  // iz efekti
  const eq = save.equip.trail, sp = Math.hypot(v.x, v.z);
  if (eq !== 'none' && (sp > 2 || !P.onGround)) { P.trailT -= dt; if (P.trailT <= 0) { P.trailT = 0.07; const col = { hearts: 0xff6fa5, stars: 0xffe24a, bubbles: 0x9fe6ff, rainbow: pick([0xff4d4d, 0xffc83a, 0x4ad66d, 0x3a8dff, 0xb28bff]) }[eq]; FX.spawn(p.x + rand(-0.2, 0.2), p.y + 0.5, p.z + rand(-0.2, 0.2), 0, 0.4, 0, col, eq === 'bubbles' ? 0.35 : 0.3, 0.8, 0); } }
}
function breakWall(s) {
  s.active = false; s.mesh.visible = false; Sfx.play('break'); G.shake = 0.4;
  for (let i = 0; i < 18; i++) FX.spawn(rand(s.minx, s.maxx), rand(s.miny + 0.3, s.maxy - 0.3), rand(s.minz, s.maxz), rand(-4, 4), rand(2, 7), rand(-4, 4), pick([0xb07a43, 0x9c6a3a, 0x7a4a22]), 0.4, 1.1, 14);
}

/* ---------- Dünya varlıkları ---------- */
function updateWorld(dt) {
  const w = W(), t = G.time, p = P.pos, cy = p.y + 0.9;
  // hareketli platformlar
  for (const s of w.movers) {
    const m = s.mover, o = Math.sin((t / m.period) * Math.PI * 2) * m.amp, nx = m.ox + m.ax * o, nz = m.oz + m.az * o;
    m.dx = nx - m.px; m.dz = nz - m.pz; m.px = nx; m.pz = nz; const hx = s.w / 2, hz = s.d / 2;
    s.minx = nx - hx; s.maxx = nx + hx; s.minz = nz - hz; s.maxz = nz + hz; s.mesh.position.set(nx, 0, nz);
  }
  // çöken platformlar
  for (const s of w.crumbles) {
    const c = s.crumble;
    if (c.state === 'shake') { c.t += dt; s.mesh.position.x = (s.minx + s.maxx) / 2 + Math.sin(t * 70) * 0.05; if (c.t > c.delay) { c.state = 'fall'; c.t = 0; c.vy = 0; Sfx.play('land'); } }
    else if (c.state === 'fall') { c.t += dt; c.vy -= 30 * dt; c.oy += c.vy * dt; s.mesh.position.y = c.oy; s.maxy = s.maxy0 ?? (s.maxy0 = s.maxy); s.maxy = s.maxy0 + c.oy; s.miny = s.maxy - s.h; if (c.t > 0.3) s.active = false; if (c.t > 1.6) { c.state = 'gone'; s.mesh.visible = false; c.t = 0; } }
    else if (c.state === 'gone') { c.t += dt; if (c.t > 4) { c.state = 'idle'; c.oy = 0; s.active = true; s.mesh.visible = true; s.mesh.position.set((s.minx + s.maxx) / 2, 0, (s.minz + s.maxz) / 2); s.maxy = s.maxy0; s.miny = s.maxy - s.h; } }
  }
  // bariyer
  for (const s of w.barriers) { s.mesh.material.opacity = (P.invis > 0 ? 0.12 : 0.34) + Math.sin(t * 3) * 0.05; }
  // paralar
  for (const c of w.coins) {
    if (c.taken) continue;
    c.mesh.rotation.y += dt * 3; c.mesh.position.y = c.y + Math.sin(t * 3 + c.ph) * 0.12;
    const dx = p.x - c.x, dz = p.z - c.z, dy = cy - c.y;
    if (dx * dx + dz * dz + dy * dy < (c.gem ? 1.7 : 1.35)) {
      c.taken = true; c.mesh.visible = false; addCoins(c.val); addStat('coins', c.val); Sfx.play(c.gem ? 'gem' : 'coin');
      FX.burst(c.x, c.y, c.z, c.gem ? 0x6fe0ff : 0xffe27a, c.gem ? 8 : 5, 3, 0.2, 0.5, 4, 1);
    }
  }
  // düşmanlar
  for (const b of w.blobs) {
    if (!b.alive) { b.respawn -= dt; b.mesh.scale.y = Math.max(0.15, b.mesh.scale.y); if (b.respawn <= 0) { b.alive = true; b.mesh.visible = true; b.mesh.scale.set(1, 1, 1); } continue; }
    if (b.frozen > 0) { b.frozen -= dt; if (b.frozen <= 0 && b.netMesh) b.netMesh.visible = false; } else b.t += dt * b.speed * 0.6;
    const o = Math.sin(b.t) * b.range, nx = b.ox + (b.axis === 'x' ? o : 0), nz = b.oz + (b.axis === 'z' ? o : 0);
    b.mesh.rotation.y = Math.atan2(nx - b.x, nz - b.z) || b.mesh.rotation.y; b.x = nx; b.z = nz;
    if (w.groundAt) b.oy = w.groundAt(nx, nz); const hop = Math.abs(Math.sin(t * 4 + b.ox)) * 0.25; b.mesh.position.set(nx, b.oy + hop, nz); b.mesh.userData.body.scale.y = 0.9 + Math.sin(t * 8 + b.ox) * 0.05;
    const dx = p.x - nx, dz = p.z - nz;
    if (dx * dx + dz * dz < 0.95 && p.y < b.oy + 1.05 && p.y + PH > b.oy) {
      if (P.rolling > 0 || (P.vel.y < 0 && p.y > b.oy + 0.55)) {
        const r = P.rolling > 0; hitBlob(b); if (!r) { P.vel.y = P.jumpHeld ? 14 : 10.5; P.jumps = 1; }
      } else if (P.invis <= 0 && !(b.frozen > 0)) hurtPlayer(dx, dz);
    }
  }
  updateBoss(dt);
  // yaylar
  for (const s of w.springs) {
    s.t = Math.max(0, s.t - dt * 3); s.pad.position.y = 0.42 + s.t * 0.35;
    if (Math.hypot(p.x - s.x, p.z - s.z) < 0.9 && p.y < s.y + 0.6 && p.y > s.y - 0.5 && P.vel.y <= 0) { P.vel.y = 17.5; P.jumps = 1; P.onGround = false; s.t = 1; Sfx.play('spring'); FX.burst(s.x, s.y + 0.5, s.z, 0xffe24a, 6, 3, 0.25, 0.5); }
  }
  // sandıklar
  const today = todayStr();
  for (const c of w.chests) {
    if (c.t > 0) { c.t -= dt; }
    if (c.open && c.lid.rotation.x > -1.7) c.lid.rotation.x = approach(c.lid.rotation.x, -1.7, dt * 6);
    if (Math.hypot(p.x - c.x, p.z - c.z) < 1.5 && Math.abs(p.y - c.y) < 1.6 && c.t <= 0) {
      c.t = 4;
      if (save.chests[c.key] !== today) {
        save.chests[c.key] = today; c.open = true; const r = Math.round(rand(20, 40)); addCoins(r); addStat('chests'); Sfx.play('chest');
        FX.burst(c.x, c.y + 1, c.z, [0xffe27a, 0xffc929, 0xffffff], 18, 5, 0.3, 0.9, 8, 4); celebrate(c.x, c.y + 0.5, c.z, false, 'Hazine! 💰'); G.ui.toast(`🧰 Sandık açıldı! +${r} 🪙`, 'gold');
      } else G.ui.toast('🧰 Bu sandık bugün boş. Yarın tekrar dolar!');
    }
  }
  // bayraklar
  for (const f of w.flags) {
    f.flag.rotation.y = Math.sin(t * 4 + f.x) * 0.25;
    if (!f.hit && Math.hypot(p.x - f.x, p.z - f.z) < 2.6 && Math.abs(p.y - f.y) < 2.5) { f.hit = true; f.flag.material = M(0x4ad66d, { flatShading: true }); P.respawn.set(f.x, f.y + 0.2, f.z + 1.2); Sfx.play('flag'); G.ui.toast('🚩 Kontrol noktası!'); FX.burst(f.x, f.y + 2.4, f.z, 0x7ed957, 8, 3, 0.25, 0.6); }
  }
  // kafesler
  for (const c of w.cages) {
    if (c.hop) { c.t += dt; c.creature.position.y = 0.05 + Math.abs(Math.sin(c.t * 7)) * 0.9 * Math.max(0, 1 - c.t / 2); c.creature.rotation.y += dt * 4; if (c.t > 4) { c.hop = false; c.mesh.visible = false; } }
    if (c.freed) continue;
    const boss = c.needBoss && w.boss && w.boss.alive; if (c.lock) c.lock.visible = !!boss;
    animCreature(c.creature, t, 'idle', 0.6);
    if (Math.hypot(p.x - c.x, p.z - c.z) < 2.4 && Math.abs(p.y - c.y) < 2.5) {
      if (boss) { if (!c.warn || t - c.warn > 3) { c.warn = t; G.ui.toast('🔒 Kilitli! Önce kötü karakteri yen.'); } } else rescueFriend(c.fid);
    }
  }
  // portallar
  for (const po of w.portals) {
    po.disc.rotation.z += dt * 2; po.disc.material.opacity = 0.6 + Math.sin(t * 3) * 0.15;
    const locked = po.lockedBy && !worldDone(po.lockedBy); po.disc.visible = !locked;
    if (Math.hypot(p.x - po.x, p.z - po.z) < 1.5 && Math.abs(p.y - po.y) < 3 && !G.traveling) {
      if (locked) { if (!po.warn || t - po.warn > 3) { po.warn = t; G.ui.toast(`🔒 ${WORLD_META[po.lockedBy].name} bitince açılır!`); } }
      else { G.traveling = true; Sfx.play('portal'); loadWorld(po.dest); setTimeout(() => { G.traveling = false; }, 900); }
    }
  }
  // enerji balonları
  for (const b of w.balloons) {
    if (b.taken) { b.t -= dt; if (b.t <= 0) { b.taken = false; b.mesh.visible = true; } continue; }
    b.mesh.position.y = b.y + Math.sin(t * 1.6 + b.ph) * 0.35; b.mesh.rotation.y += dt * 0.6; b.mesh.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.08;
    const bx = p.x - b.x, bz = p.z - b.z, by = p.y + PH * 0.5 - b.mesh.position.y;
    if (bx * bx + bz * bz + by * by < 2.4 * Math.max(1, charSize() * charSize())) {
      b.taken = true; b.t = 25; b.mesh.visible = false; const was = P.energy; P.energy = Math.min(MAX_ENERGY, P.energy + 2.5);
      Sfx.play('pop'); FX.burst(b.x, b.mesh.position.y, b.z, b.color, 16, 5, 0.3, 0.8, 6, 2); FX.burst(b.x, b.mesh.position.y, b.z, 0xffffff, 6, 3, 0.2, 0.5, 2, 1);
      G.ui.toast(P.energy >= MAX_ENERGY && was >= MAX_ENERGY - 0.05 ? '🎈 Pat! Enerjin zaten dolu.' : '🎈 Enerji balonu! Uçuş enerjin doldu.', 'gold'); addStat('abil');
    }
  }
  // dikenli tuzaklar
  for (const tr of w.traps) {
    const c = (t + tr.ph) % 3.2, st = c < 1.7 ? 'down' : c < 2.3 ? 'warn' : 'up';
    tr.up = approach(tr.up, st === 'up' ? 1 : st === 'warn' ? 0.22 : 0, dt * (st === 'up' ? 14 : 4)); tr.spikes.scale.y = 0.06 + tr.up * 0.94; tr.spikes.position.y = -0.4 + tr.up * 0.4;
    tr.ring.material.opacity = st === 'warn' ? 0.45 + 0.45 * Math.sin(t * 28) : 0; tr.spikes.rotation.y = st === 'warn' ? Math.sin(t * 60) * 0.06 : 0;
    if (st === 'up' && tr.up > 0.6 && Math.hypot(p.x - tr.x, p.z - tr.z) < tr.r + HW && p.y < tr.y + 1.0 && P.inv <= 0 && P.invis <= 0) {
      const dx = p.x - tr.x, dz = p.z - tr.z, l = Math.hypot(dx, dz) || 1; P.inv = 1.3; P.vel.x = (dx / l) * 9; P.vel.z = (dz / l) * 9; P.vel.y = 9; P.rolling = 0; P.fly = false;
      Sfx.play('trap'); G.shake = 0.35; FX.burst(p.x, p.y + 0.5, p.z, [0xff6f61, 0xffd23f, 0xffffff], 12, 5, 0.25, 0.6); if (t - (G.trapMsg || 0) > 5) { G.trapMsg = t; G.ui.toast('🌵 Ay! Dikenli tuzak! Dikenler çıkmadan önce kırmızı yanar, dikkat et.'); }
    }
  }
  // ışık sütunları ve perde kıvrımları
  for (const bc of w.beacons) { bc.b.material.opacity = 0.27 + Math.sin(t * 2 + bc.x) * 0.07; bc.ring.scale.setScalar(1 + Math.sin(t * 3 + bc.z) * 0.08); bc.ring.rotation.z += dt; bc.star.rotation.y += dt * 2; bc.star.position.y = bc.top + Math.sin(t * 2) * 0.6; }
  for (const s of w.barriers) if (s.extra.visible) s.extra.children.forEach((c) => { if (c.userData.fold !== undefined) c.position.z = (c.userData.fold % 2 ? 0.22 : -0.22) + Math.sin(t * 2 + c.userData.fold * 0.9) * 0.1; });
  if (w.barriers.length && Math.random() < 0.35) { const s = pick(w.barriers); if (s.active && Math.hypot(p.x - (s.minx + s.maxx) / 2, p.z - (s.minz + s.maxz) / 2) < 40) FX.spawn(rand(s.minx, s.maxx), s.miny + rand(0.5, s.maxy - s.miny), (s.minz + s.maxz) / 2 + rand(-0.4, 0.4), 0, 1.2, 0, pick([0xe9dcff, 0xb28bff, 0xffffff]), 0.16, 1.4, 0); }
  // evler: içeri girince çatı kalkar, duvarlar saydamlaşır
  for (const h of w.houses) {
    const dx = p.x - h.o.x, dz = p.z - h.o.z, c = Math.cos(h.o.r), s = Math.sin(h.o.r), lx = dx * c - dz * s, lz = dx * s + dz * c;
    const inside = Math.abs(lx) < h.hx + 0.5 && Math.abs(lz) < h.hz + 0.5 && p.y < 4.2;
    h.op = lerp(h.op, inside ? 0.16 : 1, Math.min(1, dt * 7)); h.mat.transparent = true; h.mat.opacity = h.op; h.mat.depthWrite = h.op > 0.6; h.roof.visible = !inside;
    if (inside && !h.entered) { h.entered = true; G.ui.toast('🏠 Eve girdin! Yatağa, masaya ve rafa bak.'); } else if (!inside) h.entered = false;
  }
  // tabelalar & etkileşim
  let hint = null; for (const s of w.signs) if (Math.hypot(p.x - s.x, p.z - s.z) < 4.2 && Math.abs(p.y - s.y) < 3) { hint = s.text; break; }
  G.ui.setHint(hint);
  let best = null, bd = 1e9;
  for (const it of w.interacts) { const dd = Math.hypot(p.x - it.x, p.z - it.z); if (dd < it.r && dd < bd) { bd = dd; best = it; } }
  for (const n of w.npcs) { const dd = Math.hypot(p.x - n.x, p.z - n.z); if (dd < 3.2 && dd < bd) { bd = dd; best = { label: `💬 ${FRIENDS[n.fid].name} ile konuş`, fn: () => G.ui.showDialog(FRIENDS[n.fid].emoji, FRIENDS[n.fid].name, npcLine(n.fid)) }; } }
  G.interact = best; G.ui.setInteract(best);
  for (const n of w.npcs) { animCreature(n.mesh, t, 'idle', 1); n.mesh.rotation.y += angDiff(n.mesh.rotation.y, Math.atan2(p.x - n.x, p.z - n.z)) * Math.min(1, dt * 3) * (Math.hypot(p.x - n.x, p.z - n.z) < 8 ? 1 : 0); }
  if (w.celebrate && Math.random() < 0.08) FX.confetti(rand(-14, 14), rand(6, 10), rand(-14, 14) + 4, 18);
  if (w.fireflies && Math.random() < 0.3) FX.spawn(p.x + rand(-14, 14), p.y + rand(0.5, 6), p.z + rand(-14, 14), 0, 0.3, 0, pick([0xb6ffec, 0xe6c7ff]), 0.16, 3, 0);
  if (w.id === 'w3' && Math.random() < 0.6) FX.spawn(p.x + rand(-18, 18), p.y + rand(6, 14), p.z + rand(-18, 18), rand(-0.5, 0.5), -2.2, rand(-0.5, 0.5), 0xffffff, 0.14, 5, 0);
}
const npcLine = (fid) => ({ tavsan: 'Havada tekrar zıpla! Çok eğlenceli!', kaplumbaga: 'Yuvarlan ve tahta duvarları kır!', kedi: 'Shift ile hızlı koş! Köprüler seni yakalayamaz!', tilki: 'Görünmezken sihirli perdeleri geçersin. Hşşt!', minipanda: 'Uçarak gökteki adalara git, orada sandıklar var!' }[fid]);

/* ---------- Oyuncu görseli ---------- */
function updatePlayerVisual(dt) {
  const m = P.mesh, u = m.userData, sp = Math.hypot(P.vel.x, P.vel.z), t = G.time;
  m.position.copy(P.pos); m.rotation.y = P.yaw;
  P.phase += dt * (3 + sp * 1.15);
  const run = P.onGround && sp > 0.6 ? Math.min(1, sp / 6) : 0, air = !P.onGround;
  let bx = 0, by = 0, lA = 0, aA = 0, spread = 0;
  if (P.rolling > 0) { u.body.rotation.x += dt * 20; by = -0.2; lA = 0; aA = 0; } else {
    u.body.rotation.x = lerp(u.body.rotation.x % (Math.PI * 2) > Math.PI ? u.body.rotation.x - Math.PI * 2 : u.body.rotation.x, P.fly ? 0.55 : 0, Math.min(1, dt * 12));
    if (P.fly) { spread = 1.5; lA = 0.3; }
    else if (air) { spread = P.vel.y > 0 ? 2.4 : 1.1; lA = P.vel.y > 0 ? 0.5 : -0.3; }
    else { lA = Math.sin(P.phase) * 0.9 * run; aA = -Math.sin(P.phase) * 0.8 * run; by = Math.abs(Math.sin(P.phase)) * 0.12 * run + Math.sin(t * 2.2) * 0.02 * (1 - run); }
  }
  u.legL.rotation.x = lA; u.legR.rotation.x = -lA; u.armL.rotation.x = aA; u.armR.rotation.x = -aA;
  u.armL.rotation.z = lerp(u.armL.rotation.z, -spread - 0.1, Math.min(1, dt * 14)); u.armR.rotation.z = lerp(u.armR.rotation.z, spread + 0.1, Math.min(1, dt * 14));
  if (P.punch > 0) { const k = Math.sin((1 - P.punch / 0.3) * Math.PI); u.armR.rotation.x = -2.4 * k; u.armR.rotation.z = 0.1; u.armL.rotation.x = 0.5 * k; }
  u.body.position.y = by; const sq = P.squash; u.body.scale.set(1 + sq * 0.18, 1 - sq * 0.22, 1 + sq * 0.18);
  u.head.rotation.z = Math.sin(P.phase * 0.5) * 0.05 * run; if (u.flame) { u.flame.visible = P.fly; u.flame.scale.setScalar(0.8 + Math.sin(t * 40) * 0.2); }
  if (P.vehicle) applyRiderPose(m, P.vehicle, sp, dt, t); else if (u.body.position.z !== 0) u.body.position.z = 0;
  const al = P.invis > 0 ? 0.28 : 1; if (al !== P.alpha) { P.alpha = al; setAlpha(m, al); }
  m.visible = !(P.inv > 0 && Math.floor(t * 20) % 2 === 0);
  if (G.mode !== 'play' && G.mode !== 'wardrobe') m.visible = G.mode === 'wardrobe';
}

/* ---------- Kamera ---------- */
function snapCamera() { cam.target.set(P.pos.x, P.pos.y + 1.4 * charSize(), P.pos.z); placeCamera(1); }
function placeCamera(k) {
  const cp = Math.cos(cam.pitch), want = new T.Vector3(cam.target.x + Math.sin(cam.yaw) * cp * cam.dist, cam.target.y + Math.sin(cam.pitch) * cam.dist, cam.target.z + Math.cos(cam.yaw) * cp * cam.dist);
  if (G.world && G.world.groundAt) want.y = Math.max(want.y, G.world.groundAt(want.x, want.z) + 1.2);
  cam.pos.lerp(want, k); camera.position.copy(cam.pos);
  if (G.shake > 0) { camera.position.x += rand(-1, 1) * G.shake * 0.3; camera.position.y += rand(-1, 1) * G.shake * 0.3; }
  camera.lookAt(cam.target);
}
function updateCamera(dt) {
  G.shake = Math.max(0, (G.shake || 0) - dt * 1.6);
  if (G.mode === 'title') { cam.yaw += dt * 0.08; cam.pitch = 0.3; cam.dist = 46; cam.target.lerp(new T.Vector3(0, 6, 0), 0.05); placeCamera(0.2); return; }
  if (G.mode === 'wardrobe') {
    const side = innerWidth > 700 ? 1.1 : 0, up = innerWidth > 700 ? 1.1 : 0.55;
    cam.pitch = lerp(cam.pitch, 0.16, dt * 4); cam.dist = lerp(cam.dist, innerWidth > 700 ? 4.8 : 8, dt * 4);
    cam.target.lerp(new T.Vector3(P.pos.x + Math.cos(cam.yaw) * side, P.pos.y + up, P.pos.z - Math.sin(cam.yaw) * side), Math.min(1, dt * 6)); placeCamera(Math.min(1, dt * 8)); return;
  }
  if (Input.keys.has('ArrowLeft')) cam.yaw += dt * 2.2; if (Input.keys.has('ArrowRight')) cam.yaw -= dt * 2.2;
  if (Input.keys.has('ArrowUp')) cam.pitch = clamp(cam.pitch - dt * 1.2, 0.05, 1.25); if (Input.keys.has('ArrowDown')) cam.pitch = clamp(cam.pitch + dt * 1.2, 0.05, 1.25);
  cam.dist = clamp(cam.dist, 5, 18); if (G.bossFight && cam.dist < 14) cam.dist += dt * 5;
  const k = Math.min(1, dt * 9); cam.target.x = lerp(cam.target.x, P.pos.x, k); cam.target.z = lerp(cam.target.z, P.pos.z, k); cam.target.y = lerp(cam.target.y, P.pos.y + 1.4 * charSize(), Math.min(1, dt * 5));
  placeCamera(Math.min(1, dt * 14));
}

/* ---------- Girdi ---------- */
addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.repeat) return; Input.keys.add(e.code); Sfx.init();
  if (G.mode !== 'play') return;
  if (e.code === 'Space') doJump(); else if (e.code === 'KeyC' && !P.fly) doRoll(); else if (e.code === 'KeyV') doInvis(); else if (e.code === 'KeyF') toggleFly();
  else if (e.code === 'KeyX' || e.code === 'KeyJ') doHit(); else if (e.code === 'KeyN' || e.code === 'KeyQ') Nets.throw();
  else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { P.sprintKey = true; toggleSprint(true); }
  else if (/^Digit[0-5]$/.test(e.code)) selectVehicle(e.code === 'Digit0' ? null : VEH_ORDER[+e.code.slice(5) - 1]); else if (e.code === 'KeyB') G.ui.openBag(); else if (e.code === 'KeyE' && G.interact) G.interact.fn(); else if (e.code === 'Escape') G.ui.openMenu(); else if (e.code === 'KeyM') G.ui.toggleMute();
});
addEventListener('keyup', (e) => { Input.keys.delete(e.code); if (e.code === 'Space') { P.jumpHeld = false; } });
addEventListener('blur', () => Input.keys.clear());
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
const drag = { id: null, x: 0, y: 0 };
canvas.addEventListener('pointerdown', (e) => { Sfx.init(); if (e.pointerType === 'mouse' && e.button === 1) return; drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (drag.id !== e.pointerId || G.mode === 'title') return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; cam.yaw -= dx * 0.0055; cam.pitch = clamp(cam.pitch + dy * 0.004, 0.05, 1.25); });
const endDrag = (e) => { if (drag.id === e.pointerId) drag.id = null; };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => { cam.dist = clamp(cam.dist + e.deltaY * 0.01, 5, 18); }, { passive: true });
// sanal joystick
(() => {
  const zone = $('stickZone'), base = $('stickBase'), knob = $('stickKnob'); let id = null, cx = 0, cy = 0; const R = 55;
  zone.addEventListener('pointerdown', (e) => { Sfx.init(); id = e.pointerId; zone.setPointerCapture(id); const r = base.getBoundingClientRect(); cx = e.clientX; cy = e.clientY; base.style.left = cx - r.width / 2 + 'px'; base.style.top = cy - r.height / 2 + 'px'; base.style.bottom = 'auto'; });
  zone.addEventListener('pointermove', (e) => { if (e.pointerId !== id) return; let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy); if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R; } knob.style.transform = `translate(${dx}px,${dy}px)`; Input.tx = dx / R; Input.tz = -dy / R; if (Math.hypot(Input.tx, Input.tz) < 0.15) { Input.tx = 0; Input.tz = 0; } });
  const end = (e) => { if (e.pointerId !== id) return; id = null; Input.tx = 0; Input.tz = 0; knob.style.transform = ''; base.style.left = ''; base.style.top = ''; base.style.bottom = ''; };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  const hold = (el, down, up) => { el.addEventListener('pointerdown', (e) => { e.preventDefault(); Sfx.init(); down(); }); ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => el.addEventListener(n, () => up && up())); };
  hold($('tJump'), () => { doJump(); Input.jumpTouch = true; }, () => { P.jumpHeld = false; Input.jumpTouch = false; });
  hold($('tRoll'), () => doRoll(), null); hold($('tInvis'), () => doInvis(), null); hold($('tFly'), () => toggleFly(), null);
  hold($('tHit'), () => doHit(), null); hold($('tNet'), () => Nets.throw(), null);
  hold($('tSprint'), () => { toggleSprint(); $('tSprint').classList.toggle('on', P.sprintOn); }, null);
})();
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 72 : 60; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ---------- Ana döngü ---------- */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; G.time += dt;
  if (G.world) {
    if (G.mode === 'play' && !G.paused) {
      updatePlayer(dt * 0.5); updatePlayer(dt * 0.5); updateWorld(dt);
    } else if (G.mode === 'title' || G.paused) { updateWorld(0.0001); }
    if (G.mode === 'title') { P.vel.set(0, 0, 0); }
    updatePlayerVisual(dt); updateCamera(dt);
    sky.position.copy(camera.position); water.position.x = camera.position.x; water.position.z = camera.position.z;
    waterNormal.offset.x += dt * 0.012; waterNormal.offset.y += dt * 0.007; sunSprite.position.copy(camera.position).addScaledVector(sunDir, 360);
    /* gölge kamerası ızgaraya oturtulur: gölge kenarları yürürken titremez/oynamaz */
    sun.target.position.set(Math.round(P.pos.x * 2) / 2, Math.round(P.pos.y * 2) / 2, Math.round(P.pos.z * 2) / 2); sun.position.copy(sun.target.position).addScaledVector(sunDir, 52); sun.castShadow = save.settings.shadows && save.settings.quality !== 'low'; stars.position.copy(camera.position);
    if (G.mode === 'play' && !G.paused) Nets.update(dt);
    FX.update(dt); Labels.update(dt); G.ui && G.ui.frame(dt); Net.update && Net.update(dt);
    renderer.render(scene, camera);
  }
}
G.start = () => {
  loadSave(); G.applyQuality(); P.mesh = makePanda(save.equip); scene.add(P.mesh); applySize(); G.setSettings = () => { Sfx.applySettings(); };
  requestAnimationFrame(frame);
};
G.applyQuality = () => { renderer.setPixelRatio(pixelRatio()); resize(); };
G.refreshPanda = () => setEquip(P.mesh, save.equip);
