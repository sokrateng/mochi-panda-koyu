'use strict';
/* ============ Çok oyunculu: oda kodu ile (PeerJS / WebRTC), sunucu gerekmez ============
   Arkadaşlar başka uygulamaya geçse, ekran kilitlense ya da internet kısa süre kesilse bile odadan ayrılmaz:
   bağlantı otomatik yeniden kurulur, oyuncu 45 sn boyunca "uzakta" (💤) görünür. */
const EMOTES = ['👋', '😀', '❤️', '🎉', '🤗', '😮'];
const cleanName = (n) => String(n || '').replace(/[^\p{L}\p{N} ]/gu, '').trim().slice(0, 12) || 'Mochi';
const cleanEquip = (e) => {
  const out = { hat: 'none', glasses: 'none', scarf: 'none', pack: 'none', trail: 'none', fur: 'classic', outfit: 'none', form: 'panda', pet: 'none' };
  if (e && typeof e === 'object') for (const k of Object.keys(out)) if (typeof e[k] === 'string' && SHOP[k].items.some((i) => i.id === e[k])) out[k] = e[k];
  return out;
};
const cleanChat = (m) => String(m || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80);
const cleanVs = (c, z) => ({ c: VEH_COLORS.some((x) => x.id === c) ? c : 'def', z: clamp(Number(z) || 1, 0.5, 2.5) });
const num = (v, lim = 2000) => (Number.isFinite(v) ? clamp(v, -lim, lim) : 0);
const AWAY_GRACE_MS = 45000;

/* ---------- Sesli sohbet (WebRTC arama, odadaki herkesle birebir) ---------- */
const Voice = {
  on: false, micOk: false, muted: false, stream: null, calls: new Map(), audios: new Map(), analysers: new Map(), ctx: null,
  async start() {
    if (this.on) return;
    try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); this.micOk = true; }
    catch (_) { this.stream = this.silentStream(); this.micOk = false; G.ui.toast('🎙️ Mikrofon izni yok, sadece dinleyebilirsin.'); }
    this.on = true; this.muted = false; G.ui.netChanged();
  },
  silentStream() { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); return this.ctx.createMediaStreamDestination().stream; },
  setMuted(m) { this.muted = m; if (this.stream) this.stream.getAudioTracks().forEach((t) => { t.enabled = !m; }); G.ui.netChanged(); },
  stop() {
    this.calls.forEach((c) => { try { c.close(); } catch (_) { /* kapalı */ } }); this.calls.clear();
    this.audios.forEach((a) => a.remove()); this.audios.clear(); this.analysers.clear();
    if (this.stream && this.micOk) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null; this.on = false; this.micOk = false;
  },
  callPeer(id) { if (!this.on || !Net.peer || this.calls.has(id) || this.calls.size >= 8) return; this.bind(id, Net.peer.call(id, this.stream)); },
  answer(call) { if (!this.on) { call.close(); return; } call.answer(this.stream); this.bind(call.peer, call); },
  bind(id, call) {
    this.calls.set(id, call);
    call.on('stream', (rs) => this.attach(id, rs)); call.on('close', () => this.detach(id)); call.on('error', () => this.detach(id));
  },
  attach(id, rs) {
    let a = this.audios.get(id);
    if (!a) { a = document.createElement('audio'); a.autoplay = true; a.setAttribute('playsinline', ''); document.body.appendChild(a); this.audios.set(id, a); }
    a.srcObject = rs; a.play().catch(() => { /* kullanıcı etkileşimi bekleniyor */ });
    try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); const an = this.ctx.createAnalyser(); an.fftSize = 256; this.ctx.createMediaStreamSource(rs).connect(an); this.analysers.set(id, an); } catch (_) { /* konuşma göstergesi yok */ }
  },
  detach(id) { this.calls.delete(id); const a = this.audios.get(id); if (a) { a.remove(); this.audios.delete(id); } this.analysers.delete(id); },
  level(id) {
    const an = this.analysers.get(id); if (!an) return 0; const buf = new Uint8Array(an.fftSize); an.getByteTimeDomainData(buf);
    let m = 0; for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128)); return m / 128;
  },
};

const Net = {
  active: false, isHost: false, peer: null, conns: new Map(), players: new Map(), code: '', id: '', status: 'idle', sendT: 0, hostConn: null, max: 15, error: '',
  wantRoom: false, clientId: '', sid: '', retryTimer: 0, lastRecv: 0, awayLocal: false,
  hello() { return { t: 'hello', name: cleanName(save.name), equip: save.equip, w: G.world ? G.world.id : 'village', v: Voice.on ? 1 : 0, sid: this.sid, sz: save.settings.size || 1, vc: vehStyle().color, vz: vehSize(), hs: G.ex && G.ex.home ? G.ex.home.pubInfo() : null }; },
  setStatus(s, err = '') {
    const was = this.status; this.status = s; this.error = err;
    if (s === 'reconnecting' && was !== 'reconnecting') G.ui.toast('🔄 Bağlantı yeniden kuruluyor… Odadan ayrılmadın.');
    G.ui && G.ui.netChanged();
  },
  ready() { if (typeof Peer === 'undefined') { this.setStatus('error', 'Bağlantı kütüphanesi yüklenemedi. İnternet bağlantını kontrol et.'); return false; } return true; },
  labelText(p) { return (p.away ? '💤 ' : '') + (p.speaking ? '🔊 ' : '') + p.name; },
  refreshLabel(p) { if (p.label) p.label.el.textContent = this.labelText(p); },
  newClientId() { return 'mkc' + Math.random().toString(36).slice(2, 12); },
  explain(e) { return { 'peer-unavailable': 'Oda bulunamadı. Kodu kontrol et.', network: 'Ağa ulaşılamadı.', 'server-error': 'Sunucuya ulaşılamadı.', 'browser-incompatible': 'Tarayıcı desteklemiyor.' }[e.type] || 'Bağlantı kurulamadı.'; },

  /* ----- oda sahibi ----- */
  host() {
    if (!this.ready()) return; this.leave(true, true); this.isHost = true; this.wantRoom = true; this.sid = Math.random().toString(36).slice(2, 10); this.setStatus('connecting'); this.openHost(null, 0);
  },
  openHost(code, n) {
    const useCode = code || String(Math.floor(1000 + Math.random() * 9000)), peer = new Peer('mochikoy-' + useCode); this.peer = peer;
    peer.on('open', (id) => { this.id = id; this.code = useCode; this.active = true; this.setStatus('hosting'); });
    peer.on('connection', (c) => this.onClient(c)); peer.on('call', (call) => Voice.answer(call));
    peer.on('error', (e) => {
      if (this.peer !== peer) return;
      if (e.type === 'unavailable-id') {
        if (code && n < 10) { this.setStatus('reconnecting'); setTimeout(() => { if (this.wantRoom && this.isHost && this.peer === peer) { try { peer.destroy(); } catch (_) { /* kapalı */ } this.openHost(code, n + 1); } }, 3000); }
        else if (!code && n < 5) { try { peer.destroy(); } catch (_) { /* kapalı */ } this.openHost(null, n + 1); }
        else this.setStatus('error', this.explain(e));
      } else if (this.active) this.setStatus('reconnecting'); else this.setStatus('error', this.explain(e));
    });
    peer.on('disconnected', () => { if (this.wantRoom && this.peer === peer) { this.setStatus('reconnecting'); setTimeout(() => { try { if (this.peer === peer && peer.disconnected && !peer.destroyed) peer.reconnect(); } catch (_) { /* tekrar denenecek */ } }, 2500); } });
    peer.on('close', () => { if (this.wantRoom && this.isHost && this.peer === peer) setTimeout(() => { if (this.wantRoom && this.peer === peer) this.openHost(this.code, 0); }, 3000); });
  },
  onClient(c) {
    c.on('open', () => {
      const known = this.players.has(c.peer);
      if (!known && this.conns.size >= this.max - 1) { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); return; }
      const old = this.conns.get(c.peer); if (old && old !== c) { try { old.close(); } catch (_) { /* kapalı */ } }
      this.conns.set(c.peer, c);
      const p = this.players.get(c.peer); if (p) { clearTimeout(p.dropTimer); p.away = false; this.refreshLabel(p); }
      c.send({ ...this.hello(), id: this.id });
      this.players.forEach((q, id) => { if (id !== c.peer) c.send({ t: 'hello', id, name: q.name, equip: q.equip, w: q.w, v: q.v ? 1 : 0, sz: q.sz || 1, vc: q.vs ? q.vs.c : 'def', vz: q.vs ? q.vs.z : 1, hs: q.hs || null }); });
      G.ui.netChanged();
    });
    c.on('data', (d) => this.onMsg(d, c));
    c.on('close', () => {
      if (this.conns.get(c.peer) !== c) return; this.conns.delete(c.peer); Voice.detach(c.peer);
      const p = this.players.get(c.peer);
      if (p) { p.away = true; this.refreshLabel(p); clearTimeout(p.dropTimer); p.dropTimer = setTimeout(() => { this.dropPlayer(c.peer); this.conns.forEach((o) => o.open && o.send({ t: 'bye', id: c.peer })); }, AWAY_GRACE_MS); }
      G.ui.netChanged();
    });
  },

  /* ----- katılan oyuncu ----- */
  join(code) {
    if (!this.ready()) return; code = String(code).replace(/\D/g, '').slice(0, 4); if (code.length !== 4) { this.setStatus('error', 'Oda kodu 4 rakam olmalı.'); return; }
    this.leave(true, true); this.isHost = false; this.wantRoom = true; this.code = code; this.clientId = this.newClientId(); this.sid = Math.random().toString(36).slice(2, 10); this.setStatus('connecting'); this.connectClient(0, true);
  },
  connectClient(n, first) {
    if (!this.wantRoom || this.isHost) return;
    if (this.peer) { try { this.peer.destroy(); } catch (_) { /* kapalı */ } this.peer = null; }
    const code = this.code, peer = new Peer(this.clientId); this.peer = peer; let opened = false, done = false;
    const fail = (msg) => {
      if (done) return; done = true; clearTimeout(timer);
      if (first && !this.active) { this.leave(true); this.setStatus('error', msg); } else if (this.wantRoom) this.scheduleRetry(n + 1);
    };
    const timer = setTimeout(() => { if (!opened) fail('Oda bulunamadı. Kodu ve interneti kontrol et.'); }, 15000);
    peer.on('call', (call) => Voice.answer(call));
    peer.on('open', (id) => {
      this.id = id; const c = peer.connect('mochikoy-' + code, { reliable: true });
      c.on('open', () => {
        opened = true; done = true; clearTimeout(timer); this.hostConn = c; this.active = true; this.lastRecv = performance.now(); this.setStatus('joined');
        this.send(this.hello()); if (this.awayLocal) this.send({ t: 'away', a: 1 }); G.ui.toast(first ? '🤝 Odaya katıldın!' : '🤝 Odaya geri döndün!');
      });
      c.on('data', (d) => { this.lastRecv = performance.now(); this.onMsg(d, c); });
      c.on('close', () => { if (this.hostConn === c) { this.hostConn = null; if (this.wantRoom) { this.setStatus('reconnecting'); this.scheduleRetry(0); } } });
    });
    peer.on('error', (e) => {
      if (this.peer !== peer) return;
      if (e.type === 'unavailable-id') this.clientId = this.newClientId();
      if (!opened) fail(this.explain(e)); else if (this.wantRoom) { this.setStatus('reconnecting'); this.scheduleRetry(0); }
    });
    peer.on('disconnected', () => { try { if (!peer.destroyed) peer.reconnect(); } catch (_) { /* tekrar denenecek */ } });
  },
  scheduleRetry(n) {
    clearTimeout(this.retryTimer); if (!this.wantRoom || this.isHost) return;
    if (n > 45) { this.leave(); G.ui.toast('Oda ile bağlantı kurulamadı, oda kapanmış olabilir.'); return; }
    this.retryTimer = setTimeout(() => this.connectClient(n, false), Math.min(1000 + n * 500, 5000));
  },

  /* ----- ortak ----- */
  send(msg) {
    if (!this.active) return; msg.id = this.id;
    if (this.isHost) this.conns.forEach((c) => c.open && c.send(msg)); else if (this.hostConn && this.hostConn.open) this.hostConn.send(msg);
  },
  onMsg(d, from) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'full') { this.leave(true); this.setStatus('error', 'Oda dolu (en fazla 15 oyuncu).'); return; }
    if (d.t === 'ping') return;
    if (this.isHost && from && this.conns.get(from.peer) !== from) return; /* kayıtsız (oda dolu) bağlantıyı yok say */
    if (typeof d.id !== 'string' || d.id === this.id) return;
    if (this.isHost) this.conns.forEach((c) => { if (c !== from && c.open) c.send(d); });
    switch (d.t) {
      case 'hello': {
        const sid = typeof d.sid === 'string' ? d.sid.slice(0, 16) : '';
        if (sid) for (const [oid, op] of [...this.players]) if (oid !== d.id && op.sid === sid) { this.dropPlayer(oid, true); if (this.isHost) this.conns.forEach((c) => c.open && c.send({ t: 'bye', id: oid })); }
        this.upsert(d.id, { name: cleanName(d.name), equip: cleanEquip(d.equip), w: String(d.w), v: d.v ? 1 : 0, sid, sz: clamp(Number(d.sz) || 1, 0.6, 1.5), vs: cleanVs(d.vc, d.vz), hs: G.ex && G.ex.home ? G.ex.home.cleanInfo(d.hs) : null }); break; }
      case 'chat': { const p = this.players.get(d.id), text = cleanChat(d.m); if (p && text && save.settings.chat) { G.ui.chatLine(p.name, text); if (p.mesh) Labels.temp(text, 'bubble', (v) => v.set(p.mesh.position.x, p.mesh.position.y + 3.1, p.mesh.position.z), 5); } break; }
      case 'away': { const p = this.players.get(d.id); if (p) { p.away = !!d.a; this.refreshLabel(p); } break; }
      case 'st': {
        const p = this.players.get(d.id);
        if (p) { p.w = String(d.w); p.tx = num(d.x); p.ty = num(d.y); p.tz = num(d.z); p.tr = num(d.r, 20); p.a = d.a | 0; p.inv = d.i ? 1 : 0; p.vh = clamp(d.vh | 0, 0, 5); if (d.vc !== undefined) p.vs = cleanVs(d.vc, d.vz); if (!p.seen) { p.seen = true; if (p.mesh) p.mesh.position.set(p.tx, p.ty, p.tz); } p.last = G.time; }
        break; }
      case 'goto': if (G.looks) G.looks.followGoto(d); break;
      case 'rescue': if (!FRIENDS[d.f] && G.series) G.series.ensureId(d.f); if (FRIENDS[d.f]) rescueFriend(d.f, true); break;
      case 'emote': { const p = this.players.get(d.id); const e = EMOTES[d.e | 0]; if (p && e && p.mesh) Labels.temp(e, 'emote', (v) => v.set(p.mesh.position.x, p.mesh.position.y + 3, p.mesh.position.z), 2.2); break; }
      case 'bye': this.dropPlayer(d.id); break;
    }
  },
  upsert(id, info) {
    let p = this.players.get(id);
    if (!p) { p = { id, mesh: null, tx: 0, ty: 0, tz: 0, tr: 0, a: 0, inv: 0, vh: 0, w: 'village', phase: 0, label: null, seen: false, away: false, name: info.name, equip: info.equip, vs: { c: 'def', z: 1 } }; this.players.set(id, p); G.ui.toast(`🐼 ${info.name} geldi!`); }
    clearTimeout(p.dropTimer); p.away = false;
    const changed = !p.mesh || JSON.stringify(p.equip) !== JSON.stringify(info.equip);
    Object.assign(p, info);
    if (!p.mesh) { p.mesh = makePanda(p.equip); scene.add(p.mesh); p.mesh.visible = false; p.label = Labels.make(p.name, ''); p.label.getPos = (v) => v.set(p.mesh.position.x, p.mesh.position.y + 2.5, p.mesh.position.z); }
    else if (changed) setEquip(p.mesh, p.equip);
    if (p.sz) p.mesh.scale.setScalar(p.sz);
    this.refreshLabel(p); if (p.v && Voice.on && this.id < id) Voice.callPeer(id);
    G.ui.netChanged();
  },
  dropPlayer(id, quiet) {
    const p = this.players.get(id); if (!p) return; clearTimeout(p.dropTimer); Voice.detach(id);
    if (p.mesh) scene.remove(p.mesh); if (p.label) Labels.remove(p.label); this.players.delete(id); if (!quiet) G.ui.toast(`👋 ${p.name} ayrıldı.`); G.ui.netChanged();
  },
  leave(silent, keepVoice) {
    this.wantRoom = false; clearTimeout(this.retryTimer);
    if (!keepVoice) Voice.stop();
    this.players.forEach((p) => { clearTimeout(p.dropTimer); if (p.mesh) scene.remove(p.mesh); if (p.label) Labels.remove(p.label); }); this.players.clear();
    this.conns.forEach((c) => { try { c.close(); } catch (_) { /* kapalı */ } }); this.conns.clear();
    if (this.hostConn) { try { this.hostConn.close(); } catch (_) { /* kapalı */ } } this.hostConn = null;
    if (this.peer) { try { this.peer.destroy(); } catch (_) { /* kapalı */ } } this.peer = null;
    const was = this.active; this.active = false; this.isHost = false; this.code = ''; this.id = '';
    if (!silent) { this.setStatus('idle'); if (was) G.ui.toast('Odadan ayrıldın.'); } else this.status = 'idle';
    G.ui && G.ui.netChanged();
  },
  sendEmote(i) { this.send({ t: 'emote', e: i }); },
  sendChat(text) {
    const m = cleanChat(text); if (!m || !save.settings.chat) return;
    G.ui.chatLine(save.name, m, true); Labels.temp(m, 'bubble', (v) => v.set(P.pos.x, P.pos.y + 3.1, P.pos.z), 5); this.send({ t: 'chat', m });
  },
  onWorld() {
    if (!this.active) return; this.send(this.hello());
    if (this.suppressGoto === G.world.id) this.suppressGoto = ''; else this.send({ t: 'goto', w: G.world.id });
  },
  sendState() {
    if (!G.world) return; const r = (v) => Math.round(v * 100) / 100;
    const a = P.fly ? 4 : P.rolling > 0 ? 3 : !P.onGround ? 2 : Math.hypot(P.vel.x, P.vel.z) > 1 ? 1 : 0;
    this.send({ t: 'st', w: G.world.id, x: r(P.pos.x), y: r(P.pos.y), z: r(P.pos.z), r: r(P.yaw), a, i: P.invis > 0 ? 1 : 0, vh: P.vehicle ? VEH_ORDER.indexOf(P.vehicle) + 1 : 0, vc: P.vehicle ? vehStyle().color : undefined, vz: P.vehicle ? vehSize() : undefined });
  },
  /* uygulama arka plandayken oyun döngüsü durur; bu sayaç bağlantıyı canlı tutar */
  beat() {
    if (!this.active) return;
    if (document.hidden) this.sendState();
    if (this.isHost) this.send({ t: 'ping' });
    else if (!document.hidden && this.hostConn && this.hostConn.open && this.lastRecv && performance.now() - this.lastRecv > 12000) { try { this.hostConn.close(); } catch (_) { /* kapalı */ } }
  },
  lifecycle() {
    const resume = () => {
      if (!this.wantRoom) return;
      if (this.peer && this.peer.disconnected && !this.peer.destroyed) { try { this.peer.reconnect(); } catch (_) { /* tekrar denenecek */ } }
      if (!this.isHost && (!this.hostConn || !this.hostConn.open)) this.scheduleRetry(0);
      if (this.active) this.send(this.hello());
    };
    document.addEventListener('visibilitychange', () => {
      this.awayLocal = document.hidden; if (this.active) this.send({ t: 'away', a: document.hidden ? 1 : 0 });
      if (!document.hidden) { this.lastRecv = performance.now(); resume(); }
    });
    addEventListener('online', resume); addEventListener('pageshow', resume);
    setInterval(() => this.beat(), 2000);
  },
  update(dt) {
    if (!this.active) return;
    this.sendT -= dt; if (this.sendT <= 0) { this.sendT = 0.085; this.sendState(); }
    this.players.forEach((p) => {
      if (!p.mesh) return; const here = G.world && p.w === G.world.id && p.seen; p.mesh.visible = !!here; if (p.label) p.label.hidden = !here; if (!here) return;
      const k = Math.min(1, dt * 12), u = p.mesh.userData, m = p.mesh, ox = m.position.x, oz = m.position.z;
      m.position.x = lerp(m.position.x, p.tx, k); m.position.y = lerp(m.position.y, p.ty, k); m.position.z = lerp(m.position.z, p.tz, k);
      m.rotation.y += angDiff(m.rotation.y, p.tr) * k; p.phase += dt * 9;
      p.vt = (p.vt || 0) - dt; if (p.vt <= 0) { p.vt = 0.15; const sp = Voice.level(p.id) > 0.08; if (sp !== p.speaking) { p.speaking = sp; this.refreshLabel(p); } }
      const run = p.a === 1 ? 1 : 0, air = p.a === 2 || p.a === 4;
      u.legL.rotation.x = Math.sin(p.phase) * 0.9 * run; u.legR.rotation.x = -u.legL.rotation.x; u.armL.rotation.x = -u.legL.rotation.x * 0.8; u.armR.rotation.x = -u.armL.rotation.x;
      u.armL.rotation.z = lerp(u.armL.rotation.z, air ? -1.8 : -0.1, k); u.armR.rotation.z = lerp(u.armR.rotation.z, air ? 1.8 : 0.1, k);
      if (p.a === 3) u.body.rotation.x += dt * 20; else u.body.rotation.x = lerp(u.body.rotation.x % (Math.PI * 2) > Math.PI ? u.body.rotation.x - Math.PI * 2 : u.body.rotation.x, p.a === 4 ? 0.55 : 0, k);
      u.body.position.y = Math.abs(Math.sin(p.phase)) * 0.1 * run; u.body.position.z = 0; if (u.flame) u.flame.visible = p.a === 4;
      const vid = p.vh ? VEH_ORDER[p.vh - 1] : null, vs = p.vs || { c: 'def', z: 1 }; if ((u.vehId || null) !== vid || (vid && (u.vcol !== vs.c || Math.abs((u.vsize || 1) - vs.z) > 0.01))) setVehicle(m, vid, { color: vs.c, size: vs.z });
      if (vid) applyRiderPose(m, vid, Math.hypot(m.position.x - ox, m.position.z - oz) / Math.max(dt, 0.001), dt, G.time);
      if (G.looks) G.looks.animRemote(p, m, dt);
      const al = p.inv ? 0.3 : 1; if (p.alpha !== al) { p.alpha = al; setAlpha(m, al); }
    });
  },
};
Net.lifecycle();
