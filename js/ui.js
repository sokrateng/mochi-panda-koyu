'use strict';
/* ============ Arayüz: HUD, paneller, görevler, gardırop, kayıt, çok oyunculu ============ */
const scrEl = $('screen');
const Scr = { open: false, kind: '' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function showScreen(html, kind, cls = '') {
  scrEl.className = cls; scrEl.innerHTML = html; Scr.open = true; Scr.kind = kind;
  if (G.mode === 'play') G.paused = true; Sfx.play('click');
}
function closeScreen() {
  scrEl.className = 'hidden'; scrEl.innerHTML = ''; Scr.open = false; Scr.kind = '';
  if (G.mode === 'wardrobe') G.mode = 'play'; if (G.mode === 'play') G.paused = false;
}
scrEl.addEventListener('click', (e) => {
  if (e.target === scrEl && !['title', 'story', 'finale'].includes(Scr.kind)) { closeScreen(); return; }
  const b = e.target.closest('[data-act]'); if (!b) return; const f = ACT[b.dataset.act]; if (f) f(b.dataset, b);
});
addEventListener('keydown', (e) => { if (e.code === 'Escape' && Scr.open && !['title', 'story', 'finale'].includes(Scr.kind)) { e.preventDefault(); closeScreen(); } });
const closeBtn = '<button class="round-btn close" data-act="close" aria-label="Kapat">✖</button>';

/* ---------- Toast / diyalog / ipucu ---------- */
let dlgTimer = 0;
const ui = (G.ui = {
  toast(text, cls = '') {
    const box = $('toasts'); const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = text; box.appendChild(t);
    while (box.children.length > 4) box.firstChild.remove(); setTimeout(() => t.remove(), 3300);
  },
  showDialog(icon, name, text) { $('dlgIcon').textContent = icon; $('dlgName').textContent = name; $('dlgText').textContent = text; $('dialog').classList.remove('hidden'); clearTimeout(dlgTimer); dlgTimer = setTimeout(() => $('dialog').classList.add('hidden'), 6500); },
  setHint(t) { const h = $('hint'); if (t) { if (h.textContent !== t) h.textContent = t; h.classList.remove('hidden'); } else h.classList.add('hidden'); },
  setInteract(it) { const b = $('interactBtn'); if (it && !G.paused) { if (b.textContent !== it.label + (isTouch ? '' : ' (E)')) b.textContent = it.label + (isTouch ? '' : ' (E)'); b.classList.remove('hidden'); } else b.classList.add('hidden'); },
  coinsChanged(up) { $('coinCount').textContent = save.coins; if (up) { const c = $('coins'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } },
  friendsChanged() { $('friendsCount').textContent = `Arkadaşlar ${FRIEND_ORDER.map((f) => (save.rescued[f] ? FRIENDS[f].emoji : '❔')).join(' ')}  ${rescuedCount()}/5`; },
  questsChanged() { const open = save.daily.quests.some((q) => !q.done) && G.questSeen !== todayStr(); $('questBadge').classList.toggle('hidden', !open); if (Scr.kind === 'quests') ui.openQuests(true); },
  abilitiesChanged() {
    $('abilityBar').innerHTML = ABILITIES.map((a) => `<div class="ab ${hasAbility(a.id) ? '' : 'locked'}" data-ab="${a.id}" title="${a.name}">${hasAbility(a.id) ? a.icon : '🔒'}<small>${a.key}</small><div class="cd"></div></div>`).join('');
    [['roll', 'tRoll'], ['sprint', 'tSprint'], ['invis', 'tInvis'], ['fly', 'tFly']].forEach(([a, id]) => $(id).classList.toggle('hidden', !hasAbility(a)));
  },
  worldChanged(id) {
    $('worldName').textContent = '🌍 ' + WORLD_META[id].name; ui.friendsChanged(); ui.abilitiesChanged(); ui.coinsChanged(false); ui.questsChanged();
    ui.setHint(null); if (id === 'village' && G.mode === 'play' && rescuedCount() === 5) ui.toast('🎉 Panda Köyü özgür! Şenlik başlasın!', 'gold');
  },
  toggleMute() { const on = !(save.settings.music || save.settings.sfx); save.settings.music = on; save.settings.sfx = on; Sfx.applySettings(); queueSave(); $('btnMute').textContent = on ? '🔊' : '🔇'; },
  frame(dt) {
    ui.t = (ui.t || 0) + dt; if (ui.t < 0.1) return; ui.t = 0;
    document.querySelectorAll('.ab').forEach((el) => {
      const id = el.dataset.ab, on = (id === 'sprint' && P.sprintOn) || (id === 'fly' && P.fly) || (id === 'invis' && P.invis > 0) || (id === 'roll' && P.rolling > 0);
      el.classList.toggle('active', on); const cd = el.querySelector('.cd');
      const k = id === 'invis' ? P.invisCd / 10 : id === 'roll' ? P.rollCd / 0.55 : id === 'fly' ? 1 - P.energy / MAX_ENERGY : 0; cd.style.transform = `scaleY(${clamp(k, 0, 1)})`;
    });
    const sp = $('tSprint'); sp.classList.toggle('on', !!P.sprintOn); $('tFly').classList.toggle('on', P.fly);
    $('tNet').classList.toggle('cool', P.netCd > 0); $('tHit').classList.toggle('cool', P.hitCd > 0.05);
    const eb = $('energyBar'), show = G.mode === 'play' && (P.fly || P.energy < MAX_ENERGY - 0.05); eb.classList.toggle('hidden', !show);
    if (show) eb.querySelector('i').style.transform = `scaleX(${clamp(P.energy / MAX_ENERGY, 0, 1)})`;
  },
  netChanged() {
    const l = $('mpList'); l.innerHTML = '';
    Net.players.forEach((p) => { const d = document.createElement('div'); d.className = 'pill small'; d.textContent = `🐼 ${p.name} · 📍${WORLD_META[p.w] ? WORLD_META[p.w].name : '?'}`; d.title = 'Yanına git'; d.onclick = () => { if (G.world) G.loadWorld(WORLD_META[p.w] ? p.w : 'village', { pos: { x: p.tx, y: p.ty, z: p.tz }, silent: true }); }; l.appendChild(d); });
    $('btnChat').classList.toggle('hidden', !Net.active); $('btnMic').classList.toggle('hidden', !Net.active);
    const mic = $('btnMic'); mic.textContent = !Voice.on ? '🎙️' : Voice.muted || !Voice.micOk ? '🔇' : '🎙️'; mic.classList.toggle('on', Voice.on && !Voice.muted && Voice.micOk);
    if (!Net.active) $('chatForm').classList.add('hidden');
    if (Scr.kind === 'mp') ui.openMP();
  },
  chatLine(name, text, me) {
    if (!save.settings.chat) return; const log = $('chatLog'), d = document.createElement('div'); d.className = 'chatline' + (me ? ' me' : '');
    const b = document.createElement('b'); b.textContent = name + ': '; d.append(b, document.createTextNode(text)); log.appendChild(d);
    while (log.children.length > 6) log.firstChild.remove(); setTimeout(() => d.remove(), 9200);
  },
  openChat() {
    if (!Net.active) { ui.toast('💬 Sohbet için önce bir odaya katıl.'); return; } if (!save.settings.chat) { ui.toast('💬 Sohbet ayarlardan kapalı.'); return; }
    const f = $('chatForm'); f.classList.remove('hidden'); $('chatInput').focus();
  },
  /* ----- paneller ----- */
  openMenu() {
    if (Scr.open) { closeScreen(); return; }
    showScreen(`<div class="panel">${closeBtn}<h2>Menü</h2><p class="sub">${esc(save.name)} • 🪙 ${save.coins} • Arkadaşlar ${rescuedCount()}/5</p>
      <div class="grid tiles">
        <button class="tile" data-act="quests"><span class="e">📋</span>Günlük Görevler</button>
        <button class="tile" data-act="wardrobe"><span class="e">👗</span>Gardırop</button>
        <button class="tile" data-act="mp"><span class="e">🤝</span>Arkadaşla Oyna</button>
        <button class="tile" data-act="savepanel"><span class="e">💾</span>Kayıt</button>
        <button class="tile" data-act="bag"><span class="e">🎒</span>Çanta (Araçlar)</button>
        <button class="tile" data-act="bugs"><span class="e">🐞</span>Bug Defteri</button>
        <button class="tile" data-act="timecycle"><span class="e">🌅</span>Sabah / Akşam</button>
        <button class="tile" data-act="settings"><span class="e">⚙️</span>Ayarlar</button>
        <button class="tile" data-act="controls"><span class="e">🎮</span>Kontroller</button>
        ${G.world && G.world.id !== 'village' ? '<button class="tile" data-act="home"><span class="e">🏡</span>Köye Dön</button>' : ''}
      </div></div>`, 'menu');
  },
  openQuests(keep) {
    G.questSeen = todayStr(); $('questBadge').classList.add('hidden');
    const q = save.daily.quests.map((q) => { const d = QUEST_POOL[q.i], pc = Math.round((q.progress / q.goal) * 100);
      return `<div class="quest ${q.done ? 'done' : ''}"><div class="qi">${q.done ? '✅' : d.icon}</div><div class="qt">${d.txt(q.goal)}<div class="qb"><i style="transform:scaleX(${pc / 100})"></i></div><small>${q.progress}/${q.goal}</small></div><div class="qr">+${q.reward} 🪙</div></div>`; }).join('');
    const all = save.daily.quests.every((x) => x.done);
    const html = `<div class="panel">${closeBtn}<h2>📋 Günlük Görevler</h2><p class="sub">🔥 ${save.streak.count}. gün üst üste! Her gün yeni görevler gelir.</p>${q}
      <div class="quest ${all ? 'done' : ''}"><div class="qi">🎁</div><div class="qt">Üçünü de bitir: Altın Sandık!<br><small>${all ? 'Ödül alındı! Yarın görüşürüz.' : 'Bonus: +80 🪙'}</small></div></div>
      <p class="note">Bambu parasıyla gardıroptan Mochi'ye şapka, gözlük, atkı ve daha fazlasını alabilirsin. Sandıklar her gün yeniden dolar!</p></div>`;
    showScreen(html, 'quests');
  },
  openWardrobe(cat = 'hat') {
    if (G.mode === 'title') return; G.mode = 'wardrobe'; G.paused = true; ui.wcat = cat; const sh = SHOP[cat];
    const tabs = Object.entries(SHOP).map(([k, v]) => `<button class="tab ${k === cat ? 'on' : ''}" data-act="wtab" data-c="${k}">${v.icon} ${v.label}</button>`).join('');
    const items = sh.items.map((it) => { const own = isOwned(cat, it.id), sel = save.equip[cat] === it.id;
      return `<button class="item ${sel ? 'sel' : ''} ${own ? '' : 'lock'}" data-act="wpick" data-c="${cat}" data-i="${it.id}"><span class="e">${it.icon}</span>${it.name}<span class="p">${sel ? '✔ Giyili' : own ? 'Senin' : it.price + ' 🪙'}</span></button>`; }).join('');
    cam.yaw = P.yaw + 0.35; Sfx.play('click');
    scrEl.className = 'side clear'; scrEl.innerHTML = `<div class="panel" style="width:min(430px,100%)">${closeBtn}<h2>👗 Gardırop</h2><p class="sub">🪙 ${save.coins} • ${esc(save.name)} için stil seç!</p><div class="tabs">${tabs}</div><div class="items">${items}</div>
      <p class="note" style="margin-top:12px">📏 Boyut</p>${sizeBox()}
      <div class="row" style="margin-top:14px"><button class="btn small" data-act="close">✔ Bitti</button></div></div>`; Scr.open = true; Scr.kind = 'wardrobe';
  },
  openFinale() {
    FX.confetti(P.pos.x, P.pos.y + 3, P.pos.z, 120); Sfx.play('rescue');
    showScreen(`<div class="panel finale"><h2>🎉 Tebrikler! 🎉</h2><p style="font-size:1.2rem;font-weight:800">Tosun, Kaptan Kabuk, Pati, Kızıl ve Minik Bambi özgür!<br>Panda Köyü yeniden neşeyle doldu. Sen gerçek bir kahramansın, Mochi! 🐼</p>
      <p class="note">Köye dön, şenliği izle ve gökteki gizli adaları keşfet. Günlük görevlerle yeni kıyafetler kazanmaya devam et!</p>
      <div class="stack" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button class="btn sun" data-act="home">🏡 Köye Dön</button><button class="btn ghost" data-act="close">Devam Et</button></div></div>`, 'finale');
  },
  openSave() {
    const chunks = codeChunks(exportCode()).map((c) => `<span>${c}</span>`).join('');
    showScreen(`<div class="panel">${closeBtn}<h2>💾 Kayıt</h2><p class="sub">Oyun bu cihazda otomatik kaydedilir. Başka cihazda devam etmek için 2 kolay yol var:</p>
      <p class="note"><span class="stepno">1</span><b>Bağlantı gönder</b> (en kolayı): Bağlantıya dokunan cihazda oyun senin kaydınla açılır.</p>
      <div class="codecard"><div class="btns"><button class="btn small sun" data-act="sharelink">🔗 Bağlantıyı Paylaş</button><button class="btn small sky" data-act="copylink">📋 Bağlantıyı Kopyala</button></div></div>
      <p class="note"><span class="stepno">2</span><b>Kısa kod</b>: Diğer cihazda Kayıt panelindeki kutuya yaz (harf büyüklüğü ve çizgiler fark etmez).</p>
      <div class="codecard"><div class="chunks" id="codeOut">${chunks}</div><div class="btns"><button class="btn small sky" data-act="copy">📋 Kodu Kopyala</button></div></div>
      <p class="note" style="margin-top:14px"><b>📥 Bu cihaza kayıt getir:</b> diğer cihazdaki kodu yaz ya da yapıştır.</p>
      <input type="text" id="codeIn" class="codein" placeholder="MOCHI-XXXX-XXXX…" autocomplete="off" autocapitalize="characters" spellcheck="false">
      <div id="saveMsg" class="note" style="min-height:1.4em"></div>
      <div class="row" style="margin-top:8px"><button class="btn small" data-act="load">📥 Kodu Yükle</button><button class="btn small ghost" data-act="paste">📎 Panodan Yapıştır</button><button class="btn small coral" data-act="reset">🗑️ Sıfırla</button></div></div>`, 'save');
  },
  openSettings() {
    const s = save.settings, tg = (k, l) => `<button class="tab ${s[k] ? 'on' : ''}" data-act="tog" data-k="${k}">${l}: ${s[k] ? 'Açık' : 'Kapalı'}</button>`;
    showScreen(`<div class="panel">${closeBtn}<h2>⚙️ Ayarlar</h2><p class="sub">Oyunu sana göre ayarla.</p>
      <p class="note">Oyuncu adı (arkadaşların görür)</p><input type="text" id="nameIn" maxlength="12" value="${esc(save.name)}"><br><br>
      <p class="note">Karakter boyutu</p>${sizeBox()}<br>
      <div class="tabs">${tg('music', '🎵 Müzik')}${tg('sfx', '🔊 Ses')}${tg('shadows', '🌓 Gölge')}${tg('chat', '💬 Yazılı sohbet')}</div>
      <p class="note">Gün ışığı</p><div class="seg">${[['morning', '🌅 Sabah'], ['evening', '🌇 Akşam'], ['auto', '🕒 Otomatik']].map(([k, l]) => `<button class="tab ${save.settings.time === k ? 'on' : ''}" data-act="settime" data-k="${k}">${l}</button>`).join('')}</div>
      <p class="note" style="margin-top:12px">Grafik kalitesi</p><div class="seg">${[['high', '✨ Yüksek'], ['low', '🔋 Düşük']].map(([k, l]) => `<button class="tab ${save.settings.quality === k ? 'on' : ''}" data-act="quality" data-k="${k}">${l}</button>`).join('')}</div>
      <p class="note">Düşük kalite: gölgeler kapanır, çim ve dekor azalır, ekran daha az detayla çizilir. Telefon ve eski tabletlerde daha akıcı olur. Dünyaya yeniden girince tam geçerli olur.</p>
      <p class="note" style="margin-top:12px">Küçük kaşif modu</p><div class="tabs"><button class="tab ${save.settings.easy ? 'on' : ''}" data-act="tog" data-k="easy">🧒 Gizli yerlere kolay giriş: ${save.settings.easy ? 'Açık' : 'Kapalı'}</button></div>
      <p class="note">Açıkken gizli kulübelerin kapıları ve sihirli perdeleri baştan açıktır, hiçbir güç gerekmez. Dünyaya yeniden girince geçerli olur.</p>
<p class="note" style="margin-top:12px">Zorluk</p><div class="seg">${Object.entries(DIFFICULTY).map(([k, d]) => `<button class="tab ${save.difficulty === k ? 'on' : ''}" data-act="diff" data-k="${k}">${d.name}</button>`).join('')}</div>
      <p class="note">Kolay: boss'lar daha yavaş ve çabuk yorulur. Zor: boss'lar daha çevik ve daha dayanıklı. Değişiklik köye/dünyaya girince geçerli olur.</p></div>`, 'settings');
  },
  openControls() {
    showScreen(`<div class="panel">${closeBtn}<h2>🎮 Kontroller</h2><p class="sub">Bilgisayar</p><div class="keys">
      <span><kbd>W A S D</kbd></span><span>Yürü</span><span><kbd>Boşluk</kbd></span><span>Zıpla (havada tekrar: çift zıplama)</span><span><kbd>C</kbd></span><span>Yuvarlan (tahta duvarı kırar)</span>
      <span><kbd>Shift</kbd></span><span>Hızlı koş</span><span><kbd>V</kbd></span><span>Görünmez ol</span><span><kbd>F</kbd></span><span>Uç (Boşluk: yüksel, C: alçal)</span>
      <span><kbd>X</kbd></span><span>Vur 👊 (düşmanı uyutur, sersemlemiş boss'a hasar verir)</span><span><kbd>N</kbd></span><span>Ağ at 🕸️ (boss'u ve düşmanı yakalar)</span><span><kbd>E</kbd></span><span>Konuş / kullan</span><span><kbd>1-5</kbd></span><span>Araç seç (kaykay, paten, scooter, bisiklet, araba), <kbd>0</kbd> yürü</span><span><kbd>B</kbd></span><span>Çantayı aç</span><span><kbd>Fare sürükle</kbd></span><span>Kamerayı çevir</span><span><kbd>← →</kbd></span><span>Kamerayı çevir</span></div>
      <p class="sub" style="margin-top:14px">Tablet / Telefon</p><p class="note">Sol tarafta joystick, sağda zıpla ve yetenek düğmeleri. Ekranın boş yerini sürükleyerek kamerayı çevir.</p></div>`, 'controls');
  },
  openMP() {
    const st = Net.status, err = Net.error ? `<p class="bad note">⚠️ ${esc(Net.error)}</p>` : '';
    let body;
    if (Net.active) {
      const list = [`🐼 ${esc(save.name)} (sen)`, ...[...Net.players.values()].map((p) => `🐼 ${esc(p.name)}`)].map((x) => `<div class="pill small" style="margin:3px">${x}</div>`).join('');
      body = `<p class="note">Arkadaşların bu kodu "Odaya Katıl" kısmına yazsın:</p><div class="code">${Net.code}</div><div class="row">${list}</div>
        ${st === 'reconnecting' ? '<p class="note">🔄 Bağlantı yeniden kuruluyor… Odadan ayrılmadın, biraz bekle.</p>' : ''}<p class="note">💬 Yazmak için ekranın sağındaki 💬 düğmesine (ya da Enter tuşuna) bas. 🎙️ düğmesi mikrofonu açıp kapatır.</p><p class="note">${Net.isHost ? 'Sen odanın sahibisin. En fazla 15 kişi oynayabilir. Sesli sohbette ilk 8 kişiyle bağlanılır. Sen oyundan çıkarsan oda kapanır.' : 'Odaya bağlandın!'} Selam vermek için ekranın sağ üstündeki 😊 düğmesini kullan. Arkadaşının adına dokunarak yanına gidebilirsin. Başka uygulamaya geçersen odada kalırsın; 45 saniye boyunca 💤 olarak görünürsün ve geri dönünce bağlantı otomatik kurulur.</p>
        <button class="btn small coral" data-act="mpleave">🚪 Odadan Ayrıl</button>`;
    } else {
      body = `<p class="note">Oyuncu adı</p><input type="text" id="nameIn" maxlength="12" value="${esc(save.name)}"><br><br>
        <div class="tabs"><button class="tab ${save.settings.voice ? 'on' : ''}" data-act="togvoice">🎙️ Sesli sohbet: ${save.settings.voice ? 'Açık' : 'Kapalı'}</button><button class="tab ${save.settings.chat ? 'on' : ''}" data-act="togchat">💬 Yazılı sohbet: ${save.settings.chat ? 'Açık' : 'Kapalı'}</button></div>
        <button class="btn sun" data-act="mphost" ${st === 'connecting' ? 'disabled' : ''}>🏠 Oda Aç</button>
        <p class="note" style="margin:18px 0 6px">Ya da arkadaşının 4 haneli kodunu gir:</p>
        <div class="row"><input type="text" id="codeIn4" inputmode="numeric" maxlength="4" placeholder="1234" style="width:130px;font-size:1.5rem;text-align:center"><button class="btn sky" data-act="mpjoin" ${st === 'connecting' ? 'disabled' : ''}>🚀 Katıl</button></div>
        ${st === 'connecting' ? '<p class="note">Bağlanıyor…</p>' : ''}`;
    }
    showScreen(`<div class="panel">${closeBtn}<h2>🤝 Arkadaşla Oyna</h2><p class="sub">Aynı dünyada birlikte macera! (İnternet gerekir)</p>${err}${body}<p class="note" style="margin-top:14px">🛡️ Odanın kodunu sadece tanıdığın arkadaşlarınla paylaş. Yanında bir yetişkin olsun, rahatsız edici biri olursa odadan ayrıl.</p></div>`, 'mp');
  },
});

/* ---------- Panel eylemleri ---------- */
const ACT = {
  close: () => closeScreen(),
  quests: () => ui.openQuests(), wardrobe: () => ui.openWardrobe(), mp: () => ui.openMP(), savepanel: () => ui.openSave(), settings: () => ui.openSettings(), controls: () => ui.openControls(),
  home: () => { closeScreen(); if (G.world.id !== 'village') G.loadWorld('village'); },
  wtab: (d) => ui.openWardrobe(d.c),
  wpick: (d) => {
    const cat = d.c, id = d.i, it = SHOP[cat].items.find((x) => x.id === id);
    if (!isOwned(cat, id)) { if (save.coins < it.price) { ui.toast('🪙 Yeterli paran yok. Daha çok topla!'); return; } save.coins -= it.price; save.owned[cat + ':' + id] = true; Sfx.play('buy'); ui.coinsChanged(false); }
    save.equip[cat] = id; G.refreshPanda(); queueSave(); Net.active && Net.send(Net.hello()); FX.burst(P.pos.x, P.pos.y + 1.2, P.pos.z, [0xffe27a, 0xffffff], 10, 3, 0.2, 0.6); ui.openWardrobe(cat);
  },
  copy: () => copyText(prettyCode(), '📋 Kod kopyalandı!'),
  copylink: () => copyText(saveLink(), '🔗 Bağlantı kopyalandı! Arkadaşına yapıştırıp gönder.'),
  sharelink: () => { const url = saveLink(); if (navigator.share) navigator.share({ title: 'Mochi\'nin Panda Köyü', text: `${save.name} kaydı: bu bağlantıya dokun, oyun kayıtla açılsın! 🐼`, url }).catch(() => {}); else copyText(url, '🔗 Bağlantı kopyalandı! Arkadaşına yapıştırıp gönder.'); },
  paste: async () => { try { const t = await navigator.clipboard.readText(); $('codeIn').value = t.trim(); ui.toast('📎 Yapıştırıldı. Şimdi "Kodu Yükle"ye dokun.'); } catch (e) { ui.toast('📎 Yapıştırma izni verilmedi. Kutuya basılı tutup yapıştır.'); } },
  load: () => { const ok = importCode($('codeIn').value); $('saveMsg').innerHTML = ok ? '<span class="ok">✅ Yüklendi! Oyun yeniden başlıyor…</span>' : '<span class="bad">⚠️ Kod tam okunamadı. Başındaki MOCHI ve tüm gruplar yazılı mı? Bağlantı yöntemi daha kolay olabilir.</span>'; if (ok) setTimeout(() => location.reload(), 900); },
  hashload: () => { const ok = importCode(G.hashCode || ''); history.replaceState(null, '', location.pathname); G.hashCode = ''; if (ok) { closeScreen(); ui.toast('✅ Kayıt yüklendi!'); setTimeout(() => location.reload(), 600); } else { ui.toast('⚠️ Bağlantıdaki kayıt okunamadı.'); closeScreen(); } },
  hashskip: () => { history.replaceState(null, '', location.pathname); G.hashCode = ''; showTitle(); },
  reset: (d, b) => { if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '⚠️ Emin misin? Tekrar dokun'; return; } localStorage.removeItem(SAVE_KEY); location.reload(); },
  tog: (d) => { save.settings[d.k] = !save.settings[d.k]; Sfx.applySettings(); queueSave(); keepName(); ui.openSettings(); },
  diff: (d) => { save.difficulty = d.k; queueSave(); keepName(); ui.openSettings(); },
  mphost: async () => { keepName(); if (save.settings.voice) await Voice.start(); Net.host(); ui.openMP(); },
  mpjoin: async () => { keepName(); const code = $('codeIn4').value; if (save.settings.voice) await Voice.start(); Net.join(code); ui.openMP(); },
  togvoice: () => { keepName(); save.settings.voice = !save.settings.voice; queueSave(); ui.openMP(); },
  togchat: () => { keepName(); save.settings.chat = !save.settings.chat; queueSave(); ui.openMP(); },
  mpleave: () => { Net.leave(); ui.openMP(); },
  play: () => startPlaying(),
  startgame: () => { save.intro = true; queueSave(); closeScreen(); },
};
const saveLink = () => `${location.origin}${location.pathname}#kod=${exportCode()}`;
function copyText(text, msg) {
  const done = () => ui.toast(msg);
  const fallback = () => { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;left:-999px;top:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { ui.toast('⚠️ Kopyalanamadı. Kodu elle yaz: ' + text.slice(0, 24) + '…'); } t.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(fallback); else fallback();
}
function keepName() { const n = $('nameIn'); if (n) { save.name = cleanName(n.value); queueSave(); } }
const sizeBox = () => `<div class="sizebox"><span>🐜</span><input type="range" id="sizeIn" min="60" max="150" step="5" value="${Math.round((save.settings.size || 1) * 100)}" aria-label="Karakter boyutu"><span>🐘</span><b id="sizeVal">${Math.round((save.settings.size || 1) * 100)}%</b></div>`;
scrEl.addEventListener('input', (e) => {
  if (e.target.id === 'nameIn') { save.name = cleanName(e.target.value); queueSave(); }
  if (e.target.id === 'sizeIn') { save.settings.size = clamp(+e.target.value / 100, 0.6, 1.5); $('sizeVal').textContent = Math.round(save.settings.size * 100) + '%'; G.applySize(); queueSave(); Net.active && Net.send(Net.hello()); }
});
scrEl.addEventListener('change', (e) => { if (e.target.id === 'nameIn') { save.name = cleanName(e.target.value); queueSave(); Net.active && Net.send(Net.hello()); } });

/* ---------- Başlangıç ---------- */
function showTitle() {
  const has = rescuedCount() > 0 || save.coins > 0;
  showScreen(`<div class="panel title"><h1 class="logo">Mochi<small>Panda Köyü Macerası</small></h1><div class="stack">
    <button class="btn sun" data-act="play">▶ ${has ? 'Devam Et' : 'Oyna'}</button><button class="btn sky" data-act="mp">🤝 Arkadaşla Oyna</button><button class="btn ghost" data-act="savepanel">💾 Kayıt</button></div></div>`, 'title', 'clear');
}
function startPlaying() {
  Sfx.init(); G.mode = 'play'; closeScreen(); $('hud').classList.remove('hidden'); if (isTouch) $('touch').classList.remove('hidden');
  ui.coinsChanged(false); ui.abilitiesChanged(); ui.worldChanged('village'); $('btnMute').textContent = save.settings.music || save.settings.sfx ? '🔊' : '🔇';
  const dm = G.dailyMsg; G.dailyMsg = null; if (dm) setTimeout(() => ui.toast('🔥 ' + dm, 'gold'), 500);
  if (!save.intro) showScreen(`<div class="panel"><h2>🐼 Mochi'nin Macerası</h2><p style="font-weight:800;font-size:1.1rem;line-height:1.5">Bir gün Dev Fare, Kaplan ve Kötü Ayı Panda Köyü'ndeki tüm arkadaşları gizli yerlere hapsetti. Köy bomboş kaldı…<br><br>Ama Mochi pes etmedi! Portallardan geçerek üç gizli dünyaya git, arkadaşlarını kurtar ve köyü yeniden neşeyle doldur!</p>
    <p class="note">Mochi'nin 5 süper gücü var: çift zıplama, yuvarlanma, hızlı koşu, görünmezlik ve uçma. Arkadaşlarını kurtarınca sana hediyeler verirler. Bambu paralarıyla da Mochi'yi dilediğin gibi giydirebilirsin. 🪙</p><div class="row" style="justify-content:center;margin-top:14px"><button class="btn sun" data-act="startgame">🚀 Hadi Başlayalım!</button></div></div>`, 'story');
}
$('btnMenu').onclick = () => ui.openMenu(); $('btnQuests').onclick = () => ui.openQuests(); $('btnMute').onclick = () => ui.toggleMute();
$('interactBtn').onclick = () => G.interact && G.interact.fn();
$('btnChat').onclick = () => ui.openChat();
$('btnMic').onclick = async () => { if (!Voice.on) { await Voice.start(); Net.send(Net.hello()); Net.players.forEach((p, id) => { if (p.v && Net.id < id) Voice.callPeer(id); }); } else Voice.setMuted(!Voice.muted); };
$('chatForm').addEventListener('submit', (e) => { e.preventDefault(); const i = $('chatInput'); Net.sendChat(i.value); i.value = ''; $('chatForm').classList.add('hidden'); i.blur(); });
$('chatInput').addEventListener('keydown', (e) => { if (e.code === 'Escape') { $('chatForm').classList.add('hidden'); e.target.blur(); } });
addEventListener('keydown', (e) => { if (e.code === 'Enter' && G.mode === 'play' && !Scr.open && Net.active && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); ui.openChat(); } });
$('btnEmote').onclick = () => { $('emoteRow').classList.toggle('hidden'); };
$('emoteRow').innerHTML = EMOTES.map((e, i) => `<button data-i="${i}" aria-label="Selam">${e}</button>`).join('');
$('emoteRow').addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return; const i = +b.dataset.i; Sfx.play('emote'); $('emoteRow').classList.add('hidden'); Labels.temp(EMOTES[i], 'emote', (v) => v.set(P.pos.x, P.pos.y + 3, P.pos.z), 2.2); Net.active && Net.sendEmote(i); });
$('dialog').onclick = () => $('dialog').classList.add('hidden');
addEventListener('pointerdown', () => Sfx.init(), { once: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) writeSave(); });
addEventListener('beforeunload', () => { writeSave(); });

/* ---------- Zorunlu sırt çantası paneli ---------- */
ui.openBag = function () {
  if (Scr.open && Scr.kind === 'bag') { closeScreen(); return; }
  const items = [{ id: '', icon: '🚶', name: 'Yürü', note: 'Aracı çantaya koy' }, ...VEH_ORDER.map((id) => ({ id, icon: VEH[id].icon, name: VEH[id].name, note: VEH[id].desc }))]
    .map((v, i) => `<button class="item ${(P.vehicle || '') === v.id ? 'sel' : ''}" data-act="veh" data-v="${v.id}"><span class="e">${v.icon}</span>${v.name}<span class="p" style="color:var(--ink-soft);font-size:.72rem;font-family:var(--font-b)">${i ? '[' + i + '] ' : '[0] '}${v.note}</span></button>`).join('');
  const net = `<div class="items" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin-top:10px"><button class="item" data-act="gear" data-g="net"><span class="e">🕸️</span>Yakalama Ağı<span class="p" style="color:var(--ink-soft);font-size:.72rem;font-family:var(--font-b)">[N] Boss'u ve düşmanı yakalar</span></button><button class="item" data-act="gear" data-g="hit"><span class="e">👊</span>Yumruk<span class="p" style="color:var(--ink-soft);font-size:.72rem;font-family:var(--font-b)">[X] Vur!</span></button></div>`;
  showScreen(`<div class="panel">${closeBtn}<h2>🎒 Maceracı Çantası</h2><p class="sub">Mochi'nin zorunlu çantasında 5 araç ve 2 aksesuar var.</p><div class="items" style="grid-template-columns:repeat(auto-fill,minmax(118px,1fr))">${items}</div>
    <p class="note" style="margin-top:12px"><b>🧰 Aksesuarlar</b> — dokununca hemen kullanılır. Ağ atınca boss sersemler (7 sn), sonra yanına gidip vurursun.</p>${net}
    <p class="note" style="margin-top:12px">Araçlar yürümekten hızlıdır ama yuvarlanma ve uçma araçlarla yapılmaz. Tahta kapıları kırmak için aracı çantaya koy. Klavyede 1-5 tuşları araç seçer, 0 yürütür.</p></div>`, 'bag');
};
ui.vehicleChanged = function () { $('btnBag').textContent = P.vehicle ? VEH[P.vehicle].icon : '🎒'; $('btnBag').classList.toggle('on', !!P.vehicle); };
Object.assign(ACT, {
  bag: () => ui.openBag(),
  veh: (d) => { closeScreen(); selectVehicle(d.v || null); },
  gear: (d) => { closeScreen(); setTimeout(() => (d.g === 'net' ? G.act.net() : G.act.hit()), 60); },
  quality: (d) => { save.settings.quality = d.k; queueSave(); keepName(); G.applyQuality(); ui.openSettings(); },
  settime: (d) => { save.settings.time = d.k; queueSave(); keepName(); G.reapplyTod(); ui.openSettings(); },
  timecycle: () => { save.settings.time = G.tod === 'morning' ? 'evening' : 'morning'; queueSave(); G.reapplyTod(); ui.toast(save.settings.time === 'morning' ? '🌅 Sabah oldu!' : '🌇 Akşam oldu!'); closeScreen(); },
});
ui.openBugs = function () {
  const ids = Object.keys(BUGS), n = ids.filter((id) => save.bugs[id]).length;
  const rows = ids.map((id) => { const b = BUGS[id], f = save.bugs[id];
    return `<div class="quest ${f ? 'done' : ''}"><div class="qi">${f ? b.icon : '❓'}</div><div class="qt">${f ? esc(b.name) : '??? Gizli hile'}<br><small>${esc(f ? b.how : b.hint)}</small></div><div class="qr">${f ? '✔' : '+15 🪙'}</div></div>`; }).join('');
  showScreen(`<div class="panel">${closeBtn}<h2>🐞 Bug Defteri</h2><p class="sub">Bulunan hile: ${n}/${ids.length}. Hepsini bulursan +100 🪙!</p>${rows}
    <p class="note">Bu hileler sadece gizli kulübelerin yakınında işe yarar ve yalnızca içeri girmeni sağlar. Normalde kapıyı yuvarlanarak kırarak ya da sihirli perdeyi görünmez olarak geçerek de girebilirsin. Küçük kaşif modunda kapılar baştan açıktır.</p></div>`, 'bugs');
};
Object.assign(ACT, { bugs: () => ui.openBugs() });
$('btnBag').onclick = () => ui.openBag();

G.start();
G.dailyMsg = ensureDaily();
G.loadWorld('village', { instant: true, silent: true });
showTitle();
{
  /* Arkadaşın "Bağlantıyı Paylaş" ile kayıt gönderdiyse: onay iste, sonra yükle */
  const hm = /#kod=([0-9A-Za-z.\-+/=_%]+)/.exec(location.hash);
  if (hm) {
    try { G.hashCode = decodeURIComponent(hm[1]); } catch (e) { G.hashCode = hm[1]; }
    showScreen(`<div class="panel"><h2>📥 Kayıt bağlantısı bulundu!</h2><p class="sub">Bu bağlantıdaki kayıt yüklensin mi? Bu cihazdaki mevcut kayıt silinir.</p>
      <div class="row" style="justify-content:center;gap:14px"><button class="btn sun" data-act="hashload">✅ Evet, yükle</button><button class="btn ghost" data-act="hashskip">Hayır</button></div></div>`, 'story');
  }
}
G.ready = true;
