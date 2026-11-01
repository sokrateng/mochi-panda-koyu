'use strict';
/* ============ Bitmeyen dünyalar: w24, w25… her kurtarılan hayvan bir sonraki dünyayı açar ============ */
const Series = (G.series = { max: XW.length - 1 });
const SER_THEMES = ['desert', 'candy', 'autumn', 'lava', 'sky', 'jungle', 'space', 'toy'];
const SER_COLORS = [['Pembe', 0.9], ['Mavi', 0.55], ['Mor', 0.75], ['Yeşil', 0.3], ['Turuncu', 0.07], ['Altın', 0.13], ['Turkuaz', 0.48], ['Kırmızı', 0.0], ['Lila', 0.8], ['Nane', 0.38]];
const SER_BASE = () => Object.keys(FRIENDS).filter((k) => ANIMALS[k] && !FRIEND_ORDER.includes(k) && !/^v\d+$/.test(k) && FRIENDS[k].world !== 'sea').concat(Object.keys(FRIENDS).filter((k) => FRIENDS[k].world === 'sea'));
Series.make = (n) => {
  const bases = SER_BASE(), bk = bases[n % bases.length], b = FRIENDS[bk], [cn, hue] = SER_COLORS[Math.floor(n / bases.length + n) % SER_COLORS.length];
  const tint = (hex, k) => new T.Color(hex).offsetHSL(((hue * 1) % 1) - 0.0, k, 0).getHex();
  const spec = Object.assign({}, ANIMALS[bk]); spec.body = new T.Color(0xffffff).setHSL(hue, 0.65, 0.62).getHex(); if (spec.belly) spec.belly = new T.Color(0xffffff).setHSL(hue, 0.5, 0.9).getHex(); if (spec.stripes) spec.stripes = new T.Color(0xffffff).setHSL(hue, 0.6, 0.3).getHex();
  void tint;
  const aid = 'v' + n, theme = SER_THEMES[n % SER_THEMES.length], wn = XW[n % 20].name, round = Math.floor(n / 20) + 1;
  return { id: 'w' + (n + 4), name: `${wn} ${round}`, theme, animal: aid, emoji: b.emoji, aname: `${cn} ${b.name}`, line: b.line, n, base: bk, spec };
};
Series.register = (d) => {
  ANIMALS[d.animal] = d.spec; FRIENDS[d.animal] = { name: d.aname, emoji: d.emoji, world: d.id, bonus: 45, line: d.line, base: d.base };
  WORLD_META[d.id] = { name: d.name, music: 'x' + d.theme }; XW[d.n] = d; XW_BY_ID[d.id] = d; WORLD_BUILDERS[d.id] = () => buildExtra(d);
  const prev = XW[d.n - 1];
  Ex.REGIONS.push({ id: d.id, icon: d.emoji, name: d.name, world: d.id, series: true, open: () => worldDone(prev.id), need: `${prev.name} arkadaşını kurtar` });
};
Series.ensure = (upTo) => { for (let n = Series.max + 1; n <= upTo; n++) { Series.register(Series.make(n)); Series.max = n; } };
Series.ensureId = (aid) => { const m = /^v(\d+)$/.exec(aid); if (m) Series.ensure(+m[1] + 1); };
Series.afterRescue = (fid) => { const d = Object.values(XW).find((x) => x && x.animal === fid); if (d) Series.ensure(d.n + 2); };
/* kayıtta kurtarılmış en uzak dünyanın ötesini hazırla */
(() => { let hi = XW.length - 1; Object.keys(save.rescued || {}).forEach((k) => { const m = /^v(\d+)$/.exec(k); if (m) hi = Math.max(hi, +m[1]); }); Series.ensure(hi + 2); })();
Series.ensure(XW.length + 1);
