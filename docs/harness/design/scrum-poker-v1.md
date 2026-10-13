# Tasarım: Scrum Poker v1

Kapsam (kullanıcı kararı): room-create-share, join-with-name, private-vote-reveal, results-consensus, story-queue. Eğlenceli feature'lar (card-flip-reveal, consensus-confetti, emoji-throw, avatar-picker, coffee-break-card, vote-timer-nudge) bu turda tasarlanmadı; ayrılan yerler "Gelecek için not" ile işaretli. ☕ kartı destede kalır, mola ekranı yok (açılışta sayısal olmayan kart olarak ayrı gösterilir).

Ton: sıcak krem zemin, mor ana renk, mercan/sarı vurgular, yumuşak köşeler, "sen" dili. Jira'dan samimi, ama sade.

## Ekranlar / yerleşim

### 1. Ana sayfa `/`
```
Masaüstü                              Mobil (<768)
+----------------------------------+  +----------------+
|  [♠] Scrum Poker        [☾/☀]    |  | ♠ Scrum Poker ☾|
|                                  |  |                |
|     Tahmin yapmak oyun gibi.     |  | Tahmin yapmak  |
|     Hesap yok, tek link.         |  | oyun gibi.     |
|   +--------------------------+   |  | +------------+ |
|   | Adın                     |   |  | | Adın       | |
|   | [______________] 0/24    |   |  | | [_______]  | |
|   | [   Oda kur →   ]        |   |  | | [Oda kur →]| |
|   +--------------------------+   |  | +------------+ |
|   (dekor: 3 eğik kart 5 · 8 · ?) |  | (kartlar altta)|
+----------------------------------+  +----------------+
```
Gelecek için not: isim alanının üstü avatar seçici için boş bırakılır (kart içinde `slot-avatar`).

### 2. Katılım `/r/:id` (ilk giriş)
Ana sayfa kartıyla aynı düzen; başlık "Odaya katıl", altında oda bilgisi yok (gizlilik), buton "Katıl". Hata mesajı alanın altında satır içi.

### 3. Oda ekranı
```
Masaüstü (>=1024)
+--------------------------------------------------------------+
| ♠ Scrum Poker   [ scrumpoker.app/r/Ab3k.. ][Linki kopyala]  ☾|  üst bar
+------------------------------------------+-------------------+
| AKTİF STORY: Giriş ekranı validasyonu    | STORY SIRASI      |
| ---------------------------------------- | [+ Story ekle]    |
|  MASA (katılımcı kartları, ızgara)       | ▶ Giriş ekranı… 5 |
|  [Ayşe 👑 ✓] [Can ✓] [Elif ⏳] [Mert ⚫]  | ○ Ödeme akışı     |
|  4/6 oy verdi  ▓▓▓▓░░                    | ✓ Profil sayfası 3|
|  [ Kartları aç ] [ Yeniden oyla ]  (F)   |  ...(kaydırılır)  |
| ---------------------------------------- |                   |
|  SONUÇ PANELİ (açılınca)                 | Toplam: 8 puan    |
|  Ort 5,2  Medyan 5  [Fikir birliği]      |                   |
|  Dağılım ▇3 ▇2 ▇1 ; ? : 1                |                   |
|  [Bu puanı kaydet: 5] [Yeniden oyla]     |                   |
| ---------------------------------------- |                   |
|  DESTE: 0 1 2 3 5 8 13 21 ? ☕ (alta yapışık)                |
+------------------------------------------+-------------------+

Mobil (<768): tek sütun
+--------------------+
| ♠  [Kopyala] [☾]  |
| Aktif story ▾      |   (dokununca story paneli alttan sheet olarak açılır)
| Masa (2 sütun)     |
| 4/6 oy verdi ▓▓░   |
| F kontrolleri      |
| Sonuç paneli       |
| ------------------ |
| Deste (yatay kay.) |   alt sabit, kaydırılabilir
| [Story sırası (5)] |   sabit alt sekme -> sheet
+--------------------+
```
Tablet (768–1023): tek sütun, story paneli sağdan çekmece.

Gelecek için not: masanın altında "tepki çubuğu" (emoji), üst barda zamanlayıcı rozeti ve ayarlar menüsü için yer ayrıldı (`slot-reactions`, `slot-timer`, `slot-settings`; v1'de render edilmez, boşluk bırakılmaz sadece grid alanı tanımlı).

### 4. Özet görünümü (tüm story'ler puanlandığında)
Masa ve deste yerine kart: "Hepsi tamam!" başlığı, story/puan listesi, "Toplam: N puan", altta "Yeni story ekle".

### 5. Hata / boş durumlar (tam sayfa, ortalanmış kart + ikon)
```
+--------------------------+
|          🔍              |
|   Bu oda bulunamadı      |
|   Süresi dolmuş ya da    |
|   link hatalı olabilir.  |
|   [ Yeni oda kur ]       |
+--------------------------+
```
- Oda bulunamadı, oda dolu (ikon 🪑, "Yeni oda kur" + "Tekrar dene"), isim alınmış (katılım formunda satır içi), bağlantı koptu (üst bant, aşağıda).

## Bileşenler
Genel durum sırası: default / hover / active / focus / disabled / yükleniyor / hata.

- **Button**: `primary` (mor dolgu), `secondary` (çerçeveli), `ghost`, `danger-ghost` (silme). Yükleniyor: metin yerine küçük spinner, tıklanamaz. Disabled: opaklık .5, `cursor:not-allowed`. Yükseklik 44px (küçük: 36px yalnızca masaüstü satır içi).
- **TextField**: etiket üstte, sayaç sağ altta (`0/24`). Hata: kırmızı çerçeve + altında mesaj + `aria-describedby`. Focus: 3px mor halka.
- **HomeCard / JoinCard**: isim alanı + birincil buton; Enter ile gönder. İsim boşken buton disabled.
- **ShareLink** (üst bar): salt-okunur input (tam link, ortadan kısaltılmış görünüm değil, tek satır taşan kaydırılır) + "Linki kopyala" butonu. Durumlar: default; kopyalandı (buton 2 sn "✓ Kopyalandı", yeşil ton, toast'a ek olarak `aria-live`); izin yok (fallback: input otomatik seçilir, buton "Seç ve Ctrl+C" yazar, yardım metni görünür). Mobilde input gizli, yalnızca buton; fallback'te input açılır.
- **FacilitatorBadge**: 👑 + "Facilitator" (masada isim yanında; mobilde sadece 👑 ve sr-only metin).
- **ParticipantCard** (masa): yuvarlak baş harf avatarı (isme göre renk, 8 renkli sabit palet), isim (tek satır kısaltılır, `title` ile tam), durum çipi. Durumlar: `bekliyor` (⏳ gri), `oy verdi` (✓ yeşil, kart arka yüzü görünür), `çevrimdışı` (soluk, ⚫ "çevrimdışı"), `açıldı` (kart değeri büyük gösterilir), `sen` (mor halka + "(sen)"). Gelecek için not: avatar alanı emoji/özel avatar ile değiştirilebilir; kartın üst köşesi tepki/fırlatma hedefi menüsü için boş.
- **VoteProgress**: "4/6 oy verdi" + ince ilerleme çubuğu (`role=progressbar`). Çevrimdışılar paydadan hariç değil, ama metinde "(1 çevrimdışı)" notu.
- **Deck / PlayingCard**: 10 kart (0 1 2 3 5 8 13 21 ? ☕). Boyut 64x92 (mobil 56x80), yatay sarmalama (masaüstü) / yatay kaydırma (mobil). Durumlar: default, hover (4px yukarı), seçili (mor dolgu, hafif yukarı, ✓ köşede), disabled (oy açıldıktan sonra, soluk), focus-visible halka. Seçili karta tekrar tıklama oyu geri çeker. Gelecek için not: kartın ön/arka yüzü ayrı katman, `PlayingCard` içinde flip animasyonu için `.card-inner` sarmalayıcı bırakılır.
- **FacilitatorControls** (yalnızca F): "Kartları aç" (voting, ≥1 oy yoksa disabled + tooltip "Henüz oy yok"), "Yeniden oyla" (revealed), "Sonraki story". Katılımcıda bu satır yerine yardımcı metin: "Facilitator kartları açınca sonuçlar görünür." Slot: gelecekte süre seçici.
- **ResultsPanel** (revealed): üstte durum bandı, altında ortalama, medyan (tr-TR, 1 ondalık), dağılım çubukları (kart başına çubuk + sayı), "Sayısal olmayan" satırı (? ve ☕ ayrı). Durumlar:
  - `Fikir birliği` (yeşil bant, ≥2 oy ve hepsi aynı sayısal kart),
  - `Tartışmaya değer` (sarı bant; "En düşük: Can (2) · En yüksek: Elif (13)"),
  - tek oy (istatistik var, bant yok),
  - hepsi "?" ("Belirsiz — daha fazla bilgi gerek", sayı yok),
  - normal (bant yok).
  Altta F için "Bu puanı kaydet: <öneri>" (önerilen kart seçili çip, diğer destekartları küçük çiplerle değiştirilebilir; story yoksa kaydet butonu gizli) + "Yeniden oyla". Katılımcıya yalnızca salt-okunur sonuç. Gelecek için not: banttın solunda konfeti/vurgu için `slot-celebrate`.
- **StoryQueue** (yan panel): başlık + sayaç, "Story ekle" (F), liste. Satır: durum ikonu (▶ aktif, ○ bekliyor, ✓ puanlı), başlık (2 satıra kısaltılır, tıklayınca genişler), puan rozeti, F için "⋯" menüsü: Aktif yap, Düzenle, Yukarı, Aşağı, Sil. Boş: "Henüz story yok. Eklemeden de hızlı tur oynayabilirsin." Liste kaydırılabilir (panel içi, `overflow:auto`). Story linki yalnızca http(s) ise bağlantı.
- **StoryForm** (satır içi / mobilde sheet): başlık (zorunlu, 120), açıklama/link (500), "Ekle" / "Kaydet" / "Vazgeç".
- **StorySummary**: story/puan tablosu + toplam.
- **ConnectionBanner** (üst, sabit): `yeniden bağlanıyor` (sarı, dönen nokta), `bağlantı koptu` (kırmızı + "Tekrar dene"), geri gelince 2 sn yeşil "Tekrar bağlandın" ve kaybolur. Bu sırada aksiyon butonları disabled.
- **Toast**: sağ alt (mobilde üst orta), 3 sn, `role=status`. Türler: bilgi, başarı, uyarı. Metinler: kopyalandı, facilitator değişti, aktif story silindi.
- **ErrorScreen**: ikon + başlık + açıklama + birincil buton (RoomNotFound, RoomFull).
- **ConfirmDialog**: yalnızca story silme ve "Yeniden oyla" (oylar silinir) için; Esc kapatır, odak tuzağı.
- **ThemeToggle**: ☀/☾; varsayılan sistem tercihi, seçim `localStorage`'da (try/catch).

## Token'lar
Henüz global stil yok; temel set burada tanımlanır, `client/src/styles.css` `:root`'a aynen alınır. Koyu tema `prefers-color-scheme: dark` + `[data-theme="dark"]` ile, açık zorlama `[data-theme="light"]` ile.

```css
:root {
  /* Yüzeyler */
  --bg: #FFF7EC;            /* sıcak krem */
  --surface: #FFFFFF;
  --surface-2: #FBF0E1;     /* panel, çip zemini */
  --border: #EAD9C3;
  --shadow: 0 2px 0 rgba(60,40,20,.06), 0 8px 24px rgba(60,40,20,.08);

  /* Metin */
  --text: #2A2133;          /* bg üzerinde 14:1 */
  --text-muted: #6B5F78;    /* bg üzerinde 5.4:1 */

  /* Marka / aksiyon */
  --primary: #6C4DF5;       /* beyaz metinle 5.4:1 */
  --primary-hover: #5A3BE0;
  --on-primary: #FFFFFF;
  --primary-soft: #EDE8FF;
  --accent: #FF7A59;        /* mercan: dekor, vurgu (metin için kullanılmaz) */
  --sun: #FFC83D;           /* sarı: uyarı bandı zemini, dekor */

  /* Durum */
  --success: #17803D;  --success-soft: #DDF5E4;
  --warning-text: #7A4B00; --warning-soft: #FFEFC2;
  --danger: #C62840;   --danger-soft: #FDE3E7;
  --focus: #6C4DF5;

  /* Tipografi */
  --font: "Nunito", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;
  --fs-xs: .75rem; --fs-sm: .875rem; --fs-md: 1rem; --fs-lg: 1.25rem;
  --fs-xl: 1.75rem; --fs-2xl: clamp(2rem, 5vw, 3rem);
  --fw-regular: 500; --fw-bold: 700; --fw-black: 800;
  --lh: 1.5;

  /* Boşluk (4px tabanı) */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px;

  /* Radius */
  --r-sm: 8px; --r-md: 14px; --r-lg: 22px; --r-pill: 999px;

  /* Hareket */
  --ease: cubic-bezier(.2,.8,.2,1);
  --dur-fast: 120ms; --dur: 200ms;

  /* Yerleşim */
  --bp-md: 768px; --bp-lg: 1024px;   /* @media'da sabit değer kullan */
  --topbar-h: 56px; --side-w: 320px;
  --card-w: 64px; --card-h: 92px;
}

@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { /* koyu değerler */ } }
:root[data-theme="dark"] {
  --bg: #17131F;  --surface: #221C2E;  --surface-2: #2C2539;  --border: #3C3350;
  --shadow: 0 2px 0 rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.35);
  --text: #F4EFFA;          /* 14:1 */
  --text-muted: #B3A8C4;    /* 7:1 */
  --primary: #A895FF;       /* --on-primary ile 7:1 */
  --primary-hover: #BDAEFF;
  --on-primary: #1A1030;
  --primary-soft: #33294F;
  --accent: #FF8F72;  --sun: #FFD25E;
  --success: #5FD38A; --success-soft: #1D3A2A;
  --warning-text: #FFD25E; --warning-soft: #3D3214;
  --danger: #FF7B8E;  --danger-soft: #3E1D26;
  --focus: #A895FF;
}
```
Avatar renk paleti (isim hash'i ile seçilir, baş harf `--on-avatar` ile; hepsi beyaz/koyu metinle ≥4.5:1): `#6C4DF5 #D9480F #0B7A75 #B0306A #3B6FD4 #7A5A00 #2F7D32 #8E3FBF` (koyu temada aynı, metin beyaz).

Yazı tipi: Nunito (Google Fonts, yumuşak ve sıcak; yedek system-ui). Yeni bağımlılık değil, `<link>`; yüklenemezse yedek kullanılır.

## Etkileşimler ve geçişler
- **Oda kur**: isim geçerli → buton yükleniyor → ack gelince `/r/<id>`'ye `history.pushState` ile geç. Hata (`SERVER_BUSY`): satır içi "Şu an çok yoğunuz, biraz sonra tekrar dene."
- **Link kopyalama**: `navigator.clipboard.writeText` başarılı → buton metni "✓ Kopyalandı" (2 sn, sonra eski haline), toast "Link panoya kopyalandı"; `aria-live=polite` ile duyurulur. Hata/izin yok → input `select()` edilir, yardım metni "Kopyalayamadık. Link seçili, Ctrl/Cmd+C ile kopyalayabilirsin." Oda kurulduktan sonra ilk girişte link alanı 1 sn hafif vurgu animasyonu alır (reduced-motion'da yok).
- **Oy verme**: karta tıkla → anında seçili görünür (iyimser), sunucu ack'i reddederse geri alınır + toast. Aynı karta tekrar tıkla = geri çek. Masada kendi kartın arka yüzü "oy verdi" olur. Açıldıktan sonra deste disabled.
- **Kartları aç / Yeniden oyla**: çift tıklama güvenli (sunucu tek sonuç). Yeniden oyla onay dialogu ister yalnızca oy varsa.
- **Açılış**: v1'de basit geçiş (kartlar 200 ms opaklık/ölçek ile değere döner, sonuç paneli aşağıdan kayar). Gelecek için not: 3D flip ve konfeti bu noktaya takılır.
- **Story**: ekle → listenin sonuna, otomatik aktif değilse "Aktif yap". Taşıma yukarı/aşağı butonlarıyla (sürükle-bırak yok). Aktif story silinirse F'ye toast "Aktif story silindi, oylar temizlendi."
- **Sonraki story**: yeni tur, deste temizlenir, masa kartları arka yüze döner.
- **Bağlantı**: kopunca ConnectionBanner; yeniden bağlanınca otomatik `rejoin`, oy korunur.
- **Facilitator değişimi**: toast "Facilitator artık <isim>." Yeni F'ye kontroller belirir.
- Tüm geçişler `--dur`/`--ease`; `prefers-reduced-motion: reduce` altında süreler 0, hover kayması ve ilerleme animasyonu kapalı.
- Duyarlı: ≥1024 iki sütun (`1fr var(--side-w)`); <1024 tek sütun, story paneli çekmece/sheet; <768 deste alt sabit yatay kaydırma, masa 2 sütun, F kontrolleri tam genişlik.

## Mikro metinler (TR)
**Ana sayfa:** başlık "Tahmin yapmak oyun gibi olsun." Alt: "Hesap yok, kurulum yok. Bir oda kur, linki paylaş, oylamaya başla." Etiket "Adın"; placeholder "Örn. Ayşe"; buton "Oda kur"; yükleniyor "Oda hazırlanıyor…"
**Katılım:** başlık "Odaya katıl"; alt "Sadece adını yaz, gerisini biz hallederiz."; buton "Katıl"; yükleniyor "Katılıyorsun…"
**Doğrulama:** boş "Adını yazmadan olmaz." ; uzun "En fazla 24 karakter olabilir." ; isim alınmış "Bu isim odada kullanılıyor. “Ali (2)” olarak katılmak ister misin?" + buton "Evet, bunu kullan" / "Başka isim yaz" ; oda dolu başlık "Oda dolu", metin "Bu odada en fazla 20 kişi olabilir. Yer açılınca tekrar dene ya da yeni bir oda kur." butonlar "Tekrar dene", "Yeni oda kur".
**Oda bulunamadı:** "Bu oda bulunamadı" / "Süresi dolmuş ya da link hatalı olabilir." / "Yeni oda kur".
**Bağlantı:** "Bağlantı koptu, yeniden bağlanıyoruz…" ; başarısız "Bağlanamadık." + "Tekrar dene" ; geri geldi "Tekrar bağlandın".
**Link:** buton "Linki kopyala" ; "✓ Kopyalandı" ; toast "Link panoya kopyalandı" ; fallback "Kopyalayamadık. Link seçili, Ctrl/Cmd+C ile kopyalayabilirsin."
**Masa:** "Facilitator" ; "(sen)" ; durumlar "Bekleniyor", "Oy verdi", "Çevrimdışı" ; ilerleme "4/6 oy verdi" ; kart arka yüz sr-only "Oy verdi, değer gizli".
**Kontroller:** "Kartları aç" ; disabled ipucu "Henüz kimse oy vermedi" ; "Yeniden oyla" ; onay "Mevcut oylar silinecek. Devam edilsin mi?" [Yeniden oyla] [Vazgeç] ; "Sonraki story" ; katılımcı bilgisi "Facilitator kartları açınca sonuçlar görünür." ; deste başlığı "Kartını seç" ; oy sonrası "Oyun gizli, değiştirebilirsin."
**Sonuç:** "Ortalama" ; "Medyan" ; "Dağılım" ; "Sayısal olmayan" ; "Fikir birliği 🎯 Herkes aynı fikirde." ; "Tartışmaya değer — oylar çok dağınık." ; "En düşük: {isim} ({kart}) · En yüksek: {isim} ({kart})" ; "Belirsiz — daha fazla bilgi gerek." ; "Bu puanı kaydet: {kart}" ; "Puan kaydedildi" toast.
**Story:** panel "Story sırası" ; "Story ekle" ; alanlar "Başlık", "Açıklama veya link (isteğe bağlı)" ; "Ekle", "Kaydet", "Vazgeç" ; menü "Aktif yap", "Düzenle", "Yukarı taşı", "Aşağı taşı", "Sil" ; silme onayı "Bu story silinsin mi?" ; boş "Henüz story yok. Eklemeden de hızlı tur oynayabilirsin." ; başlıksız tur "Hızlı tur" ; aktif silindi toast "Aktif story silindi, oylar temizlendi." ; özet "Hepsi tamam! 🎉", "Toplam: {n} puan", "Yeni story ekle".
**Genel toast:** "Facilitator artık {isim}." ; "Bir şeyler ters gitti, tekrar dene." ; "Eski bir tur için işlem yapıldı, ekran güncellendi."

## Erişilebilirlik
- Tüm etkileşimli öğeler gerçek `<button>`/`<input>`; dokunma hedefi ≥44x44px (kartlar mobilde 56x80). Sekme sırası: üst bar, masa/kontroller, deste, story paneli.
- Deste: `role="radiogroup"` + `aria-label="Kartını seç"`, her kart `role="radio"` `aria-checked`; ok tuşları gezinir, Boşluk/Enter seçer ve geri çeker. Disabled kartlarda `aria-disabled`.
- Focus: görünür 3px `--focus` halka + 2px offset; hiçbir yerde `outline:none` yalnız bırakılmaz.
- Kontrast: metin ≥4.5:1, büyük metin/UI bileşenleri ≥3:1 (token yorumlarında doğrulanmış değerler). Durum yalnızca renkle verilmez: ikon + metin (✓ Oy verdi, ⏳ Bekleniyor, ⚫ Çevrimdışı).
- Canlı bölgeler: VoteProgress ve toast `aria-live="polite"`; ConnectionBanner `role="status"`, bağlantı koptu `role="alert"`. Kartlar açıldığında "Oylar açıldı. Medyan 5." duyurulur.
- Link input'u `aria-label="Oda linki"`; hata mesajları `aria-describedby` + `aria-invalid`.
- Dialog/sheet: odak tuzağı, Esc ile kapanma, açılınca odak ilk alana, kapanınca tetikleyiciye döner.
- `prefers-reduced-motion` ve `prefers-color-scheme` desteklenir; `lang="tr"`; ekran okuyucu için facilitator rozeti ve (sen) metinleri sr-only olarak eklenir.
