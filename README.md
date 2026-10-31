# 🐼 Mochi'nin Panda Köyü

6-15 yaş için tarayıcıda oynanan 3B macera oyunu. Mochi adlı panda, kötü Dev Fare, Kaplan ve Kötü Ayı'nın gizli yerlere hapsettiği arkadaşlarını kurtarır ve Panda Köyü'nü yeniden neşeyle doldurur.

![Köy](ekran-goruntuleri/11-kurtarilan-koy-genel.png)

## Özellikler
- 3 açık dünya: Bambu Ormanı, Gizli Mağara, Buzul Dağ
- 5 süper güç: çift zıplama, yuvarlanma, hızlı koşu, görünmezlik, uçma
- Zorunlu maceracı çantası: kaykay, paten, scooter, bisiklet, mini üstü açık araba
- Büyük boss'lar, gizli kulübeler ve gizli hileler (Bug Defteri)
- Günlük görevler, oyun içi para, gardırop (gerçek para ve reklam yok)
- 15 kişiye kadar çok oyunculu oda (oda kodu), yazılı ve sesli sohbet
- Sabah / akşam modu, düşük kalite seçeneği, küçük kaşif modu
- Kayıt cihazda otomatik tutulur, kayıt koduyla başka cihaza taşınır

![Akşam](ekran-goruntuleri/03-koy-aksam-araba.png)

## Çalıştırma
Derleme gerekmez, düz HTML/CSS/JS'tir.

```bash
node serve.mjs
```

Sonra `http://localhost:3000` adresini aç. 3B kütüphane (three.js), çok oyunculu bağlantı (PeerJS) ve yazı tipleri internetten yüklenir.

## Kontroller
`WASD` yürü · `Boşluk` zıpla (havada tekrar: çift zıplama) · `C` yuvarlan · `Shift` hızlı koş · `V` görünmez ol · `F` uç · `1-5` araç · `B` çanta · `E` konuş/kullan · `Enter` sohbet. Dokunmatik cihazlarda joystick ve düğmeler çıkar.
