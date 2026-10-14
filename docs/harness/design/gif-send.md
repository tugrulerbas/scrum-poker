# Tasarım: GIF Gönderme (gönderenin kendi koltuğunda)

Mod: Operate. Yön: mevcut "Samimi Kart Masası" dili; GIF eğlence anıdır ama günlük akışı bozmaz (Product Principle 4). Yeni tasarım dili yok. Yeni bağımlılık/ikon kütüphanesi yok.

Karar: overlay, `.seat-card` (48x68, çok küçük) yerine **tüm koltuk kutusunu** (`.seat`, 136-160px) kaplar; GIF okunur olsun. Gizlilik: GIF oy kartını örter ama oy değeri zaten kapalıyken görünmez; açıkken 4 sn örtülmesi kabul (oy `Deck`/özet/sonuç panelinde de görünür). Ad etiketi overlay'in altında şeritle kalır.

## Ekranlar / yerleşim

Masaüstü, kendi koltuk (hover/focus):
```
 +----------------+        başkasının koltuğu: buton yok
 |        [GIF]   |<- sağ üst köşe, koltuk içinde
 |   +--------+   |
 |   | kart   |   |
 |   +--------+   |
 |   Ayşe (sen)   |
 +----------------+
```
Panel (butona bağlı popover, koltuğun altında açılır, sol kenara hizalı; sığmazsa yukarı/içeri kayar):
```
+-------------------------------+
| GIF gönder                [x] |
| [ https://…/ornek.gif       ] |
|  (satır içi hata / ipucu)     |
| +---------------------------+ |
| |        önizleme           | |  16:10 kutu, maks 240x150
| +---------------------------+ |
| GIF senin kartında herkese    |
| oynar.                        |
|            [ Gönder ]         |
| GIF, linkin bulunduğu siteden |
| yüklenir; bu site izleyenlerin|
| IP adresini görebilir.        |
+-------------------------------+
```
GIF oynarken (tüm odada, gönderenin koltuğunda):
```
 +----------------+
 |  [ GIF img ]   |  koltuğu doldurur, object-fit: cover, r-md
 |                |  [GIF] butonu (yalnız gönderende) üstte kalır
 |  ▁▁ Ayşe ▁▁    |  ad şeridi: yarı saydam surface zemin
 +----------------+
```
Üst bar: `[Tema] [GIF'leri gizle]` `topbar-end` içinde, ThemeToggle'ın yanında.

Mobil (<768px):
- Koltuk 2 sütun; GIF butonu **sürekli görünür** (`hover: none`), 44x44 dokunma alanı (görsel 28px pill, `::before` ile hit alanı genişler).
- Panel: alt kenara yapışık sheet (`position: fixed; bottom: 0; left/right: 0`, üst köşeler r-lg, kart gölgesi), arka plan hafif karartma; max-height 80dvh, klavye açılınca içerik kayar. Önizleme tam genişlik, maks 200px yükseklik.
- Üst bar anahtarı yalnız ikon (metin `sr-only`), 44px.

## Bileşenler

- **GifButton** (kendi koltukta, sağ üst `top: 6px; right: 6px`): küçük hap, "GIF" metni, 28px yükseklik, ghost-surface (surface zemin + 1px border, ink metin). Varsayılan `opacity:0`; `.seat-you:hover`, `:focus-within`, `[aria-expanded=true]`, `@media (hover:none)` altında `opacity:1`. Hover: çerçeve+metin mor. Active: 1px aşağı. Focus: 3px mor halka. Disabled (cooldown/çevrimdışı): %50 opaklık, `aria-disabled` + `title="Biraz bekle"`, odaklanabilir. Overlay'in üstünde (z-index), kendi GIF'i oynarken de erişilir.
- **GifPanel**: surface, 1px border, r-md, kart gölgesi, padding sp-4, genişlik min(320px, 100vw-32px). Başlık "GIF gönder" (Title). Kapat: ghost ikon buton (x, 2px çizgi), 36px (mobilde 44).
  - URL input: mevcut `input` stili (44px, r-sm, 2px border). Hata: `danger` çerçeve + altında danger metin + ikon (`aria-describedby`, `aria-invalid`). Odaklanınca mor çerçeve.
  - Önizleme kutusu: surface-2 zemin, r-sm, `object-fit: contain`. Durumlar: boş (kesik çizgili çerçeve, "Önizleme burada görünecek", ink-muted); yükleniyor (kutu içinde ortalı "Yükleniyor…" + sakin skeleton nabzı; reduced-motion'da statik); yüklendi (img); hata (danger-soft zemin, danger metin + ikon, hata mikro metni).
  - Gönder: Primary hap, tam genişlik mobil / sağa hizalı masaüstü. Pasif: URL geçersiz, önizleme `loaded` değil, cooldown, ya da çevrimdışı. Gönderilirken "Gönderiliyor…" + pasif.
  - Cooldown satırı: warning-soft çip, saat ikonu + "{n} sn sonra tekrar gönderebilirsin" (tabular-nums, her sn güncellenir, `aria-live` yok; bitişte kaybolur).
  - Çevrimdışı: panelin üstünde "Bağlantı yok" danger-soft çip; Gönder pasif.
  - Notlar (not + gizlilik): `fs-xs`, ink-muted, tek paragrafta iki cümle.
- **GifOverlay** (`.seat-overlay`): koltuğu kaplar, `pointer-events:none`, r-md `overflow:hidden`. img `opacity:0` → yüklenince fade-in 200ms (`--dur`, `--ease`); çıkışta 150ms fade-out (son 150ms). Yükleme hatası/zaman aşımı: hiçbir iz. Alt ad şeridi yok (koltuk adı zaten altta); `.seat-name` overlay'in dışında kalacak şekilde overlay yalnızca kart+üst alanı kaplar, ad satırı görünür kalır: overlay yüksekliği = koltuk - ad/meta satırı (~ üst %70). Karar: implementer görsel dengeye göre `bottom` değerini ayarlar, ad okunur kalmalı.
- **GifLabel** (reduced-motion): overlay yerine koltuk üstünde primary-soft zeminli hap, ikon + "GIF gönderdi", 4 sn, animasyonsuz.
- **GifToggle**: ThemeToggle ile aynı boyut/stil (ghost, 36px/mobil 44px); ikon (görsel çerçeve, kapalıyken çizgi) + metin "GIF'leri gizle" masaüstünde. `aria-pressed`. Aktif (gizli) durumda primary-soft zemin + mor ikon, metin "GIF'ler gizli"; bu durumda tıklama geri açar. Durum yalnız renkle verilmez (ikon+metin değişir).

## Token'lar

Mevcut değişkenler yeterli: `--surface`, `--surface-2`, `--border`, `--primary`, `--primary-soft`, `--danger(-soft)`, `--warning-text/-soft`, `--text(-muted)`, `--shadow`, `--r-sm/md/lg/pill`, `--sp-*`, `--dur`, `--dur-fast`, `--ease`, `--fs-xs/sm`. Koyu tema otomatik.
Yeni (öneri):
```
--z-seat-gif: 2;      /* overlay */
--z-gif-btn: 3;       /* buton overlay üstünde */
--z-gif-panel: 40;    /* toast'ın altında, topbar'ın üstünde; mevcut z ölçeğine bak */
--gif-preview-max-h: 150px;  /* mobilde 200px */
--gif-scrim: rgba(42,33,51,.4);   /* mobil sheet arkası */
```
Tipografi: yeni boyut yok; başlık Title (800, 1rem), etiket Label, notlar `fs-xs`.

## Etkileşimler ve geçişler

- Buton görünürlüğü `opacity` ile 120ms (`--dur-fast`); `visibility` ile gizlenmez (klavye odağı çalışsın).
- Tıkla → panel açılır (fade + 4px yukarı kayma, 200ms), odak URL input'ta. Esc / dışarı tıklama / x kapatır; odak GIF butonuna döner.
- Yapıştırma: giriş sırasında 300ms debounce ile `checkGifUrl`; geçersizse satır içi hata, önizleme yüklenmez; geçerliyse `<img>` yüklenir (loading → loaded/error). Gönder yalnız `loaded`.
- Gönder → panel kapanır, toast "GIF gönderildi" (success), buton cooldown (10 sn) boyunca pasif.
- Gelen GIF: koltukta fade-in, 4 sn, fade-out. Aynı koltukta yeni GIF öncekini anında değiştirir. Oy seçme, "Kartları aç", story değişimi bozulmaz.
- "GIF'leri gizle" açılınca oynayan tüm overlay'ler anında kalkar.
- Reduced-motion (`prefers-reduced-motion: reduce`): img hiç render edilmez, fade/slide/skeleton nabzı yok; yalnız GifLabel. Gönderen kendi önizlemesini panelde görmeye devam edebilir (statik yükleme, hareket kullanıcı seçimi; önizleme kutusu animasyonlu GIF gösterir mi? Hayır: reduced-motion'da önizleme yerine "Önizleme hareketi azaltma tercihin nedeniyle gösterilmiyor" yazmaz; basitlik için önizleme yüklenir ama `loaded` sinyali için 1x1 gizli img kullanılır, kutuda "Link geçerli, görsel yüklendi" onayı gösterilir).

## Mikro metinler (TR)

- Buton: "GIF" (aria-label "GIF gönder"), panel başlığı "GIF gönder", "Gönder", "Gönderiliyor…", kapat aria-label "Paneli kapat".
- Input etiketi (görünmez, `sr-only`): "GIF linki"; placeholder: "https://…/ornek.gif".
- Not: "GIF senin kartında herkese oynar." Gizlilik: "GIF, linkin bulunduğu siteden yüklenir; bu site izleyenlerin IP adresini görebilir."
- Önizleme: boş "Önizleme burada görünecek"; yükleniyor "Yükleniyor…"; hata "Bu link bir görsel açmadı. GIF'in doğrudan linkini kopyala (sayfa linki değil)."
- Hatalar: TOO_LONG "Link en fazla 500 karakter olabilir."; INVALID "Geçerli bir link değil."; NOT_HTTPS "Yalnızca https:// ile başlayan linkler kabul edilir."; CREDENTIALS "Kullanıcı adı/şifre içeren linkler kabul edilmez."; PRIVATE_HOST "Yerel ağ veya IP adresi linkleri kabul edilmez."; EMPTY mesaj yok.
- Cooldown: "{n} sn sonra tekrar gönderebilirsin"; buton title "Biraz bekle".
- Çevrimdışı: "Bağlantı yok, GIF gönderemezsin."
- Toast: "GIF gönderildi" (success); "Biraz bekle, sonra tekrar gönderebilirsin." (warning); "Bu link kabul edilmedi." (error); genel hata mevcut `GENERIC_ERROR`.
- Üst bar: "GIF'leri gizle" / gizliyken "GIF'ler gizli"; reduced-motion etiketi: "GIF gönderdi".

## Erişilebilirlik

- GIF butonu gerçek `<button>`, Tab ile ulaşılır, odaklanınca görünür (opacity 1 + focus halkası); `aria-haspopup="dialog"`, `aria-expanded`, `aria-label="GIF gönder"`.
- Panel `role="dialog"` `aria-labelledby` başlık; masaüstünde modal değil (odak tuzağı yok, Tab panelden çıkınca kapanmaz), mobil sheet'te `aria-modal="true"` ve odak tuzağı. Esc kapatır; açılışta input'a, kapanışta butona odak.
- Hatalar `aria-describedby` ile input'a bağlı, `role="status"` (kibar); toast mevcut canlı bölgeyi kullanır. Gelen GIF dekoratif: `alt=""`, ekran okuyucuya duyuru yok (reduced-motion etiketi de `aria-hidden`; yerine isteğe bağlı değil).
- Kontrast: tüm metin ≥4.5:1 (mevcut tokenlar); ad şeridi/etiket opak yeterli zemin üstünde. Disabled durumda bile ipucu `title` + odaklanabilir (`aria-disabled`).
- Dokunma hedefi ≥44px (GIF butonu hit alanı, kapat, anahtar, Gönder). Overlay `pointer-events:none`; oy seçimi ve koltuk etkileşimleri etkilenmez.
- Ekranda hızlı yanıp sönen içerik riski: kullanıcı "GIF'leri gizle" ile kapatabilir; sistem reduced-motion'a saygı gösterilir.

## Notlar
- Önizleme-reduced-motion davranışı (yukarıda) analizde belirtilmemiş; implementer basit tutmak için reduced-motion'da önizlemeyi de statik "Link geçerli" onayına çevirebilir.
- Overlay'in koltuğun tamamı mı yoksa ad satırı hariç mi olacağı görsel denemeye bağlı; ad okunur kalmalı.
