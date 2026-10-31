'use strict';
/* ============ Yeni giysiler, karakter biçimleri ve evcil hayvanlar (SHOP'a eklenir) ============ */
/* Kısa kayıt kodu eski biçimde kalır: yalnızca ilk (eski) eşyalar kodlanır. Tüm ilerleme "bağlantı" ile taşınır. */
const CODE_LEGACY = { hat: 8, glasses: 5, scarf: 4, pack: 5, trail: 5, fur: 6 };

SHOP.hat.items.push(
  { id: 'chef', name: 'Aşçı', price: 45, icon: '👨‍🍳' }, { id: 'cap', name: 'Kasket', price: 35, icon: '🧢' }, { id: 'catears', name: 'Kedi Kulağı', price: 40, icon: '🐱' },
  { id: 'bunny', name: 'Tavşan Kulağı', price: 40, icon: '🐰' }, { id: 'beanie', name: 'Bere', price: 35, icon: '🧶' }, { id: 'headphones', name: 'Kulaklık', price: 55, icon: '🎧' },
  { id: 'santa', name: 'Noel', price: 60, icon: '🎅' }, { id: 'unicorn', name: 'Tek Boynuz', price: 90, icon: '🦄' },
);
SHOP.glasses.items.push({ id: 'round', name: 'Yuvarlak', price: 30, icon: '👓' }, { id: 'ski', name: 'Kayak', price: 50, icon: '🥽' }, { id: 'mustache', name: 'Bıyık', price: 35, icon: '🥸' });
SHOP.scarf.items.push({ id: 'stripe', name: 'Çizgili', price: 30, icon: '🧣' }, { id: 'bow', name: 'Papyon', price: 35, icon: '🎀' }, { id: 'gold', name: 'Altın Atkı', price: 80, icon: '✨' });
SHOP.pack.items.push({ id: 'angel', name: 'Melek Kanadı', price: 130, icon: '😇' }, { id: 'butterfly', name: 'Kelebek', price: 100, icon: '🦋' }, { id: 'jet', name: 'Jet Sırt', price: 140, icon: '🛸' });

SHOP.outfit = {
  label: 'Kıyafet', icon: '👕', items: [
    { id: 'none', name: 'Yok', price: 0, icon: '🚫' }, { id: 'tshirt', name: 'Tişört', price: 30, icon: '👕' }, { id: 'hoodie', name: 'Kapüşonlu', price: 50, icon: '🧥' },
    { id: 'dress', name: 'Elbise', price: 55, icon: '👗' }, { id: 'cape', name: 'Süper Pelerin', price: 70, icon: '🦸' }, { id: 'overall', name: 'Tulum', price: 45, icon: '👖' },
    { id: 'astro', name: 'Astronot', price: 110, icon: '🧑‍🚀' }, { id: 'tutu', name: 'Tütü', price: 50, icon: '🩰' }, { id: 'robe', name: 'Büyücü Cübbesi', price: 90, icon: '🧙' },
    { id: 'pirate', name: 'Korsan', price: 80, icon: '🏴‍☠️' }, { id: 'jersey', name: 'Forma', price: 55, icon: '⚽' }, { id: 'apron', name: 'Aşçı Önlüğü', price: 40, icon: '🍳' },
    { id: 'rain', name: 'Yağmurluk', price: 45, icon: '🌧️' },
  ],
};
const FORM_LIST = [
  ['panda', 'Panda', '🐼', 0], ['kedi', 'Kedi', '🐱', 0], ['kopek', 'Köpek', '🐶', 0], ['kus', 'Kuş', '🐦', 0], ['tavsan', 'Tavşan', '🐰', 0], ['sincap', 'Sincap', '🐿️', 0],
  ['kaplumbaga', 'Kaplumbağa', '🐢', 0], ['tilki', 'Tilki', '🦊', 20], ['kirpi', 'Kirpi', '🦔', 20], ['ordek', 'Ördek', '🦆', 20], ['koyun', 'Koyun', '🐑', 20], ['domuz', 'Domuz', '🐷', 20],
  ['kurbaga', 'Kurbağa', '🐸', 30], ['maymun', 'Maymun', '🐒', 30], ['aslan', 'Aslan', '🦁', 40], ['fil', 'Fil', '🐘', 40], ['at', 'Pony', '🐴', 40],
];
SHOP.form = { label: 'Karakter', icon: '🐾', items: FORM_LIST.map(([id, name, icon, price]) => ({ id, name, icon, price })) };
const PET_LIST = [
  ['kedi', 'Kedi', '🐱', 15], ['kopek', 'Köpek', '🐶', 15], ['tavsan', 'Tavşan', '🐰', 15], ['sincap', 'Sincap', '🐿️', 15], ['kus', 'Kuş', '🐦', 15], ['kaplumbaga', 'Kaplumbağa', '🐢', 15],
  ['tilki', 'Tilki', '🦊', 25], ['kirpi', 'Kirpi', '🦔', 25], ['ordek', 'Ördek', '🦆', 25], ['koyun', 'Kuzu', '🐑', 25], ['domuz', 'Domuz', '🐷', 25], ['kurbaga', 'Kurbağa', '🐸', 25],
  ['minipanda', 'Minik Panda', '🐼', 40], ['at', 'Pony', '🐴', 40], ['aslan', 'Aslan Yavrusu', '🦁', 40],
];
SHOP.pet = { label: 'Evcil', icon: '🐕', items: [{ id: 'none', name: 'Yok', price: 0, icon: '🚫' }, ...PET_LIST.map(([id, name, icon, price]) => ({ id, name, icon, price }))] };
