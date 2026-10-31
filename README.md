# 🐼 Mochi'nin Panda Köyü

6-15 yaş için tarayıcıda oynanan 3B macera oyunu. Mochi adlı panda, kötü Dev Fare, Kaplan ve Kötü Ayı'nın gizli yerlere hapsettiği arkadaşlarını kurtarır ve Panda Köyü'nü yeniden neşeyle doldurur.

![Köy](ekran-goruntuleri/11-kurtarilan-koy-genel.png)

## Özellikler
- 3 açık dünya: Bambu Ormanı, Gizli Mağara, Buzul Dağ (tepeler, çukurlar, çamur, dikenli tuzaklar)
- 5 süper güç: çift zıplama, yuvarlanma, hızlı koşu, görünmezlik, uçma (enerji balonlarıyla uçuş enerjisi dolar)
- Zorunlu maceracı çantası: kaykay, paten, scooter, bisiklet, mini üstü açık araba + yakalama ağı 🕸️ ve yumruk 👊
- Büyük boss'lar: duvara çarptır ya da ağla yakala, sonra vur
- Taş, ağaç ve evlerin içinden geçilmez; köydeki evlere girilir, içinde eşyalar var
- Gizli kulübeler, sihirli perdeler ve gizli hileler (Bug Defteri)
- Günlük görevler, oyun içi para, gardırop, karakter boyutu ayarı (gerçek para ve reklam yok)
- Kutlama efektleri ve "Yuppi!" sesleri
- 15 kişiye kadar çok oyunculu oda (oda kodu), yazılı ve sesli sohbet
- Sabah / akşam modu, düşük kalite seçeneği, küçük kaşif modu
- Kayıt cihazda otomatik tutulur; kısa kod (MOCHI-XXXX-…) ya da paylaşılabilir bağlantıyla başka cihaza taşınır

![Akşam](ekran-goruntuleri/03-koy-aksam-araba.png)

## Çalıştırma
Derleme gerekmez, düz HTML/CSS/JS'tir.

```bash
node serve.mjs
```

Sonra `http://localhost:3000` adresini aç. 3B kütüphane (three.js) ve PeerJS `js/vendor/` altında yerel durur; yalnızca yazı tipleri ve çok oyunculu eşleşme sunucusu internetten gelir.

## Kontroller
`WASD` yürü · `Boşluk` zıpla (havada tekrar: çift zıplama) · `X` vur · `N` ağ at · `C` yuvarlan · `Shift` hızlı koş · `V` görünmez ol · `F` uç · `1-5` araç · `B` çanta · `E` konuş/kullan · `Enter` sohbet. Dokunmatik cihazlarda joystick ve etiketli düğmeler (ZIPLA, VUR, AĞ, KOŞ, YUVARLAN, GİZLEN, UÇ) çıkar.
