'use strict';
/* ============ Çekirdek: yardımcılar, sabitler, kayıt, ses ============ */
const T = THREE;
/* sRGB iş akışı: onaltılık renkler sRGB sayılıp doğrusal uzaya çevrilir (daha doğal ışık ve renk) */
(() => { const orig = T.Color.prototype.setHex; T.Color.prototype.setHex = function (hex) { orig.call(this, hex); return this.convertSRGBToLinear(); }; })();
const G = (window.G = {});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const $ = (id) => document.getElementById(id);
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const yesterdayStr = () => { const d = new Date(Date.now() - 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* ---------- Sabitler ---------- */
const FRIEND_ORDER = ['tavsan', 'kaplumbaga', 'kedi', 'tilki', 'minipanda'];
const FRIENDS = {
  tavsan:     { name: 'Tosun',        emoji: '🐰', world: 'w1', gift: { cat: 'hat', id: 'party' },     line: 'Beni kurtardın, teşekkürler! Sana bir parti külahı hediye ediyorum!' },
  kaplumbaga: { name: 'Kaptan Kabuk', emoji: '🐢', world: 'w1', gift: { cat: 'pack', id: 'shell' },    line: 'Yavaş ama sağlam! Sana kabuğumdan bir sırt eşyası yaptım, giy bakalım!' },
  kedi:       { name: 'Pati',         emoji: '🐱', world: 'w2', gift: { cat: 'scarf', id: 'red' },     line: 'Miyav! Beni bulduğun için sağ ol! Bu atkı senin olsun.' },
  tilki:      { name: 'Kızıl',        emoji: '🦊', world: 'w2', gift: { cat: 'glasses', id: 'sun' },  line: 'Sonunda özgürüm! Güneş gözlüğümü sana veriyorum, havalı durur!' },
  minipanda:  { name: 'Minik Bambi',  emoji: '🐼', world: 'w3', gift: { cat: 'trail', id: 'hearts' }, line: 'Özgürüm! Yürürken arkanda kalpler bıraksın diye sana bir iz hediye ediyorum!' },
};
const ABILITIES = [
  { id: 'double', icon: '🦘', name: 'Çift Zıplama', key: 'Boşluk ×2', from: 'tavsan' },
  { id: 'roll',   icon: '🌀', name: 'Yuvarlanma',   key: 'C',         from: 'kaplumbaga' },
  { id: 'sprint', icon: '⚡', name: 'Hızlı Koşu',   key: 'Shift',     from: 'kedi' },
  { id: 'invis',  icon: '👻', name: 'Görünmezlik',  key: 'V',         from: 'tilki' },
  { id: 'fly',    icon: '🪽', name: 'Uçma',         key: 'F',         from: 'minipanda' },
];
const WORLD_META = {
  village: { name: 'Panda Köyü',      music: 'village' },
  w1:      { name: 'Bambu Ormanı',    music: 'w1' },
  w2:      { name: 'Gizli Mağara',    music: 'w2' },
  w3:      { name: 'Buzul Dağ',       music: 'w3' },
};
const FURS = {
  classic:    { body: 0xf8f5ef, accent: 0x26232e, name: 'Klasik' },
  strawberry: { body: 0xffd0e0, accent: 0x7a2a49, name: 'Çilek' },
  sky:        { body: 0xd6efff, accent: 0x1f3a6e, name: 'Gökyüzü' },
  mint:       { body: 0xd3ffe6, accent: 0x1e5a46, name: 'Nane' },
  gold:       { body: 0xfff0b0, accent: 0x6b4a10, name: 'Altın' },
  galaxy:     { body: 0xe4daff, accent: 0x2a1e5c, name: 'Galaksi' },
};
const SHOP = {
  hat: { label: 'Şapka', icon: '🎩', items: [
    { id: 'none', name: 'Yok', price: 0, icon: '🚫' }, { id: 'party', name: 'Parti', price: 30, icon: '🎉' },
    { id: 'flower', name: 'Çiçek Tacı', price: 40, icon: '🌸' }, { id: 'cowboy', name: 'Kovboy', price: 50, icon: '🤠' },
    { id: 'pirate', name: 'Korsan', price: 60, icon: '🏴‍☠️' }, { id: 'wizard', name: 'Büyücü', price: 70, icon: '🧙' },
    { id: 'crown', name: 'Taç', price: 80, icon: '👑' }, { id: 'astro', name: 'Astronot', price: 120, icon: '🧑‍🚀' } ] },
  glasses: { label: 'Gözlük', icon: '🕶️', items: [
    { id: 'none', name: 'Yok', price: 0, icon: '🚫' }, { id: 'sun', name: 'Güneş', price: 25, icon: '🕶️' },
    { id: 'nerd', name: 'Bilge', price: 30, icon: '🤓' }, { id: 'heart', name: 'Kalpli', price: 35, icon: '😍' },
    { id: 'star', name: 'Yıldızlı', price: 45, icon: '🤩' } ] },
  scarf: { label: 'Atkı', icon: '🧣', items: [
    { id: 'none', name: 'Yok', price: 0, icon: '🚫' }, { id: 'red', name: 'Kırmızı', price: 25, icon: '🧣' },
    { id: 'blue', name: 'Mavi', price: 25, icon: '🧣' }, { id: 'rainbow', name: 'Gökkuşağı', price: 60, icon: '🌈' } ] },
  pack: { label: 'Sırt', icon: '🎒', items: [
    { id: 'none', name: 'Klasik', price: 0, icon: '🎒' }, { id: 'bag', name: 'Kırmızı', price: 50, icon: '🎒' },
    { id: 'shell', name: 'Kabuk', price: 70, icon: '🐢' }, { id: 'wings', name: 'Peri Kanadı', price: 120, icon: '🧚' },
    { id: 'rocket', name: 'Roket', price: 150, icon: '🚀' } ] },
  trail: { label: 'İz', icon: '✨', items: [
    { id: 'none', name: 'Yok', price: 0, icon: '🚫' }, { id: 'bubbles', name: 'Baloncuk', price: 50, icon: '🔵' },
    { id: 'hearts', name: 'Kalpler', price: 60, icon: '💖' }, { id: 'stars', name: 'Yıldızlar', price: 80, icon: '⭐' },
    { id: 'rainbow', name: 'Gökkuşağı', price: 100, icon: '🌈' } ] },
  fur: { label: 'Renk', icon: '🎨', items: [
    { id: 'classic', name: 'Klasik', price: 0, icon: '⚪' }, { id: 'strawberry', name: 'Çilek', price: 40, icon: '🍓' },
    { id: 'sky', name: 'Gökyüzü', price: 40, icon: '🩵' }, { id: 'mint', name: 'Nane', price: 40, icon: '💚' },
    { id: 'gold', name: 'Altın', price: 120, icon: '🟡' }, { id: 'galaxy', name: 'Galaksi', price: 150, icon: '🌌' } ] },
};
const QUEST_POOL = [
  { stat: 'coins',  icon: '🪙', txt: (n) => `${n} bambu parası topla`,        range: [15, 40], reward: [15, 30] },
  { stat: 'stomps', icon: '😴', txt: (n) => `${n} düşmanı uyut`,              range: [3, 6],   reward: [15, 30] },
  { stat: 'jumps',  icon: '🦘', txt: (n) => `${n} kez zıpla`,                 range: [30, 70], reward: [10, 20] },
  { stat: 'rolls',  icon: '🌀', txt: (n) => `${n} kez yuvarlan`,              range: [4, 8],   reward: [15, 25], need: 'roll' },
  { stat: 'abil',   icon: '✨', txt: (n) => `Yeteneklerini ${n} kez kullan`,  range: [6, 14],  reward: [15, 30], need: 'double' },
  { stat: 'chests', icon: '🧰', txt: (n) => `${n} sandık aç`,                 range: [1, 2],   reward: [25, 40] },
  { stat: 'ride',   icon: '🛹', txt: (n) => `Araçlarınla ${n} metre yol yap`, range: [150, 400], reward: [15, 30] },
  { stat: 'worlds', icon: '🗺️', txt: (n) => `Bir dünyayı ziyaret et`,         range: [1, 1],   reward: [15, 25] },
];
const VEH_ORDER = ['skate', 'inline', 'scooter', 'bike', 'car'];
const VEH = {
  skate:   { icon: '🛹', name: 'Kaykay',   speed: 9.5,  acc: 0.45, jump: 1.0,  lift: 0.12, z: 0,    sit: false, hold: false, desc: 'Hızlı ve kaygan' },
  inline:  { icon: '🛼', name: 'Paten',    speed: 9,    acc: 0.3,  jump: 0.95, lift: 0.1,  z: 0,    sit: false, hold: false, desc: 'Buz gibi kayar' },
  scooter: { icon: '🛴', name: 'Scooter',  speed: 10.5, acc: 0.6,  jump: 0.85, lift: 0.16, z: -0.05, sit: false, hold: true,  desc: 'Dengeli ve çevik' },
  bike:    { icon: '🚲', name: 'Bisiklet', speed: 13,   acc: 0.5,  jump: 0.55, lift: 0.52, z: -0.2,  sit: true,  hold: false, desc: 'Çok hızlı' },
  car:     { icon: '🚙', name: 'Mini Araba', speed: 17, acc: 0.45, jump: 0.3,  lift: 0.3,  z: -0.3,  sit: true,  hold: false, desc: 'En hızlısı, üstü açık' },
};
/* Gizli hileler (bug): sadece gizli kulübelerin yakınında çalışır, yalnızca içeri girmeye yarar */
const BUGS = {
  clip:    { icon: '🌀', name: 'Yuvarlanma Kayması', hint: 'Yuvarlanırken bir kulübenin duvarında bir şey dene…', how: 'Gizli kulübenin duvarına doğru yuvarlan (C), duvara çarpmadan hemen önce Boşluk tuşuna bas: duvarın içinden kayarsın.' },
  hop:     { icon: '🛹', name: 'Tekerlek Sıçraması', hint: 'Küçük tekerlekli araçlarla kulübeye hızla yaklaşmayı dene…', how: 'Kaykay, paten ya da scooter ile hızla kulübeye sür, duvardan 3-4 adım önce zıpla: duvarın üstünden aşarsın.' },
  smash:   { icon: '🚲', name: 'Çarpma Hatası', hint: 'Hızlı araçlar tahta kapıya ne yapar acaba?', how: 'Bisiklet ya da mini arabayla tahta kapıya tam hızla çarp: kapı paramparça olur.' },
  curtain: { icon: '⚡', name: 'Perde Çatlağı', hint: 'Sihirli perdenin önünde hızlı koşup zıpla…', how: 'Hızlı koşarken (Shift) sihirli perdenin önünde havada ikinci kez zıpla: perde bir an delinir.' },
};
const DIFFICULTY = {
  easy:   { name: 'Kolay',  bossHp: 2, bossSpeed: 0.8 },
  normal: { name: 'Normal', bossHp: 3, bossSpeed: 1.0 },
  hard:   { name: 'Zor',    bossHp: 4, bossSpeed: 1.2 },
};

/* ---------- Kayıt ---------- */
const SAVE_KEY = 'mochi_panda_koyu_kayit_v1';
const defaultSave = () => ({
  v: 1, name: 'Mochi', coins: 0, rescued: {}, bossDown: {}, chests: {}, owned: {},
  equip: { hat: 'none', glasses: 'none', scarf: 'none', pack: 'none', trail: 'none', fur: 'classic' },
  stats: { jumps: 0, stomps: 0, coins: 0, rolls: 0, abil: 0, chests: 0, worlds: 0 },
  daily: { date: '', quests: [], bonus: false },
  streak: { last: '', count: 0 },
  difficulty: 'normal', settings: { music: true, sfx: true, shadows: true, chat: true, voice: false, time: 'auto', quality: (typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches) ? 'low' : 'high', easy: false }, finale: false, intro: false, bugs: {},
});
const mergeSave = (base, src) => {
  if (!src || typeof src !== 'object') return base;
  const out = { ...base };
  for (const k of Object.keys(base)) {
    if (src[k] === undefined) continue;
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) out[k] = { ...base[k], ...(typeof src[k] === 'object' && src[k] ? src[k] : {}) };
    else if (typeof src[k] === typeof base[k]) out[k] = src[k];
  }
  out.daily = { ...base.daily, ...(src.daily || {}) };
  if (!Array.isArray(out.daily.quests)) out.daily.quests = [];
  return out;
};
let save = defaultSave();
function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) save = mergeSave(defaultSave(), JSON.parse(raw)); } catch (e) { console.warn('Kayıt okunamadı', e); }
  save.name = String(save.name || 'Mochi').slice(0, 12);
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* dolu/engelli olabilir */ } }
let saveTimer = 0;
function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(writeSave, 400); }
function exportCode() { return 'MK1.' + btoa(unescape(encodeURIComponent(JSON.stringify(save)))); }
function importCode(code) {
  try {
    const t = String(code).trim();
    if (!t.startsWith('MK1.')) return false;
    const obj = JSON.parse(decodeURIComponent(escape(atob(t.slice(4)))));
    if (typeof obj !== 'object' || typeof obj.coins !== 'number') return false;
    save = mergeSave(defaultSave(), obj); writeSave(); return true;
  } catch (e) { return false; }
}
/* Tüm süper güçler en baştan açık: her karakter hepsini kullanabilir */
const hasAbility = () => true;
const rescuedCount = () => FRIEND_ORDER.filter((f) => save.rescued[f]).length;
const worldDone = (w) => FRIEND_ORDER.filter((f) => FRIENDS[f].world === w).every((f) => save.rescued[f]);
const isOwned = (cat, id) => id === 'none' || id === 'classic' || !!save.owned[cat + ':' + id];

/* ---------- Günlük görevler ---------- */
function ensureDaily() {
  const today = todayStr();
  let msg = null;
  if (save.streak.last !== today) {
    save.streak.count = save.streak.last === yesterdayStr() ? save.streak.count + 1 : 1;
    save.streak.last = today;
    const bonus = 10 * Math.min(save.streak.count, 7);
    save.coins += bonus;
    msg = `Günlük giriş ödülü: +${bonus} 🪙 (${save.streak.count}. gün)`;
  }
  if (save.daily.date !== today) {
    const rng = mulberry(hashStr(today));
    const pool = QUEST_POOL.map((q, i) => ({ q, i })).filter(({ q }) => !q.need || hasAbility(q.need));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    save.daily = {
      date: today, bonus: false,
      quests: pool.slice(0, 3).map(({ q, i }) => ({
        i, goal: Math.round(q.range[0] + rng() * (q.range[1] - q.range[0])),
        reward: Math.round(q.reward[0] + rng() * (q.reward[1] - q.reward[0])), progress: 0, done: false,
      })),
    };
  }
  queueSave();
  return msg;
}
function addCoins(n) { save.coins += n; queueSave(); G.ui && G.ui.coinsChanged(n > 0); }
function addStat(stat, n = 1) {
  save.stats[stat] = (save.stats[stat] || 0) + n;
  let changed = false;
  for (const q of save.daily.quests) {
    if (q.done || QUEST_POOL[q.i].stat !== stat) continue;
    q.progress = Math.min(q.goal, q.progress + n); changed = true;
    if (q.progress >= q.goal) {
      q.done = true; addCoins(q.reward);
      G.ui && G.ui.toast(`✅ Görev tamamlandı! +${q.reward} 🪙`, 'gold'); Sfx.play('quest');
    }
  }
  if (changed && !save.daily.bonus && save.daily.quests.length && save.daily.quests.every((q) => q.done)) {
    save.daily.bonus = true; addCoins(80);
    G.ui && G.ui.toast('🎁 Üç görev bitti! Altın sandık: +80 🪙', 'gold'); Sfx.play('rescue');
  }
  if (changed) G.ui && G.ui.questsChanged();
  queueSave();
}

/* ---------- Ses ---------- */
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MUSIC = {
  village: { root: 60, scale: [0, 2, 4, 7, 9], bpm: 104, wave: 'triangle', vol: 0.5 },
  w1:      { root: 55, scale: [0, 2, 4, 7, 9], bpm: 120, wave: 'triangle', vol: 0.5 },
  w2:      { root: 57, scale: [0, 3, 5, 7, 10], bpm: 86, wave: 'sine', vol: 0.7 },
  w3:      { root: 64, scale: [0, 2, 3, 7, 8], bpm: 94, wave: 'sine', vol: 0.7 },
  boss:    { root: 52, scale: [0, 1, 4, 5, 7], bpm: 150, wave: 'sawtooth', vol: 0.22 },
};
const Sfx = {
  ctx: null, master: null, sfxG: null, musG: null, theme: 'village', step: 0, next: 0, idx: 2, timer: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(this.ctx.destination);
    this.sfxG = this.ctx.createGain(); this.sfxG.connect(this.master); this.musG = this.ctx.createGain(); this.musG.connect(this.master);
    this.applySettings(); this.next = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 120);
  },
  applySettings() { if (!this.ctx) return; this.sfxG.gain.value = save.settings.sfx ? 0.6 : 0; this.musG.gain.value = save.settings.music ? 0.22 : 0; },
  setTheme(t) { if (MUSIC[t]) { this.theme = t; this.idx = 2; } },
  osc(freq, dur, type = 'sine', vol = 0.3, slide = 0, when = 0, dest = null) {
    if (!this.ctx) return; const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.sfxG); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  noise(dur, vol = 0.3, when = 0) {
    if (!this.ctx) return; const n = Math.floor(this.ctx.sampleRate * dur), buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = buf; g.gain.value = vol; s.connect(g); g.connect(this.sfxG); s.start(this.ctx.currentTime + when);
  },
  play(name) {
    if (!this.ctx || !save.settings.sfx) return;
    switch (name) {
      case 'jump': this.osc(380, 0.16, 'square', 0.12, 380); break;
      case 'jump2': this.osc(560, 0.18, 'square', 0.12, 520); break;
      case 'coin': this.osc(988, 0.08, 'sine', 0.25); this.osc(1319, 0.2, 'sine', 0.25, 0, 0.07); break;
      case 'gem': [988, 1319, 1568, 1976].forEach((f, i) => this.osc(f, 0.2, 'sine', 0.22, 0, i * 0.07)); break;
      case 'stomp': this.osc(220, 0.15, 'square', 0.2, -150); this.noise(0.1, 0.2); break;
      case 'hurt': this.osc(320, 0.35, 'sawtooth', 0.2, -240); break;
      case 'land': this.noise(0.06, 0.1); break;
      case 'roll': this.osc(200, 0.4, 'triangle', 0.2, 300); break;
      case 'dash': this.osc(300, 0.25, 'sawtooth', 0.1, 500); break;
      case 'invis': this.osc(900, 0.5, 'sine', 0.2, -600); break;
      case 'fly': this.osc(300, 0.4, 'triangle', 0.2, 500); break;
      case 'spring': this.osc(250, 0.3, 'square', 0.15, 600); break;
      case 'break': this.noise(0.35, 0.35); this.osc(140, 0.2, 'square', 0.15, -80); break;
      case 'chest': [523, 659, 784, 1046].forEach((f, i) => this.osc(f, 0.25, 'triangle', 0.25, 0, i * 0.08)); break;
      case 'flag': this.osc(660, 0.15, 'triangle', 0.2); this.osc(880, 0.25, 'triangle', 0.2, 0, 0.1); break;
      case 'quest': [659, 784, 988].forEach((f, i) => this.osc(f, 0.2, 'triangle', 0.22, 0, i * 0.09)); break;
      case 'buy': this.osc(700, 0.1, 'square', 0.15); this.osc(1050, 0.2, 'square', 0.15, 0, 0.09); break;
      case 'click': this.osc(520, 0.07, 'triangle', 0.18); break;
      case 'portal': [392, 523, 659, 784, 1046].forEach((f, i) => this.osc(f, 0.35, 'sine', 0.2, 0, i * 0.07)); break;
      case 'boss': this.osc(110, 0.6, 'sawtooth', 0.25, -40); this.noise(0.4, 0.3); break;
      case 'rescue': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.osc(f, 0.3, 'triangle', 0.25, 0, i * 0.11)); break;
      case 'emote': this.osc(880, 0.1, 'sine', 0.15); break;
    }
  },
  tick() {
    if (!this.ctx || !save.settings.music || this.ctx.state !== 'running') { if (this.ctx) this.next = Math.max(this.next, this.ctx.currentTime); return; }
    const th = MUSIC[G.bossFight ? 'boss' : this.theme]; const beat = 60 / th.bpm / 2;
    while (this.next < this.ctx.currentTime + 0.4) {
      const when = this.next - this.ctx.currentTime;
      if (this.step % 8 === 0) this.osc(mtof(th.root - 12 + th.scale[(this.step / 8) % 2 === 0 ? 0 : 2]), beat * 6, 'sine', 0.5 * th.vol, 0, when, this.musG);
      if (this.step % 2 === 0 && Math.random() < 0.8) {
        this.idx = clamp(this.idx + pick([-1, -1, 0, 1, 1, 2]), 0, th.scale.length * 2 - 1);
        const m = th.root + 12 * Math.floor(this.idx / th.scale.length) + th.scale[this.idx % th.scale.length];
        this.osc(mtof(m), beat * 1.6, th.wave, 0.35 * th.vol, 0, when, this.musG);
      }
      if (this.step % 4 === 2) this.osc(mtof(th.root + th.scale[this.step % 5]), beat, 'triangle', 0.18 * th.vol, 0, when, this.musG);
      this.step = (this.step + 1) % 32; this.next += beat;
    }
  },
};
