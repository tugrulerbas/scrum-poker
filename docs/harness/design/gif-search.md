# Tasarım: GIPHY Aramasıyla GIF Seçme

Mod: Operate. Yön: mevcut "Samimi Kart Masası" dili; `docs/harness/design/gif-send.md` (GIF butonu, overlay, GifToggle, cooldown/offline çipleri, toast'lar) aynen korunur. Yalnızca **panel içeriği** değişir: URL input + önizleme kalkar, arama + ızgara + atıf gelir. Yeni token/bağımlılık/ikon kütüphanesi yok (Icon.tsx'e `search` yoksa 2px çizgili büyüteç eklenir).

Korunur: butona bağlı popover (koltuk altı, sığmazsa kayar), mobilde alt sheet + karartma + odak tuzağı, `role="dialog"`, Esc/dışarı tıklama/x kapatır, kapanışta odak GIF butonuna, `--z-gif-panel`.

## Ekranlar / yerleşim

Masaüstü popover (genişlik min(360px, 100vw-32px), padding sp-4):
```
+-----------------------------------+
| GIF gönder                    [x] |
| [🔍 GIPHY'de ara            (x)]  |  <- açılışta odaklı
| Trend GIF'ler                     |  <- arama boşken; doluysa gizli
| +---------+ +---------+ +--------+|
| |  gif    | |  gif ✓  | |  gif   ||  3 sütun, kendi içinde kaydırılır
| +---------+ +---------+ +--------+|  maks yükseklik 264px
| +---------+ +---------+ +--------+|
| ...                               |
| GIF senin kartında herkese oynar. |
|                       [ Gönder ]  |
| ───────────────────────────────── |
| Powered by GIPHY                  |
| GIF'ler GIPHY'den yüklenir.       |
+-----------------------------------+
```
Mobil (<768px): alt sheet (mevcut), max-height 80dvh. Izgara 2 sütun, ızgara alanı `flex:1; min-height:0; overflow-y:auto` (başlık/arama üstte, Gönder + atıf altta sabit; klavye açılınca ızgara küçülür). Gönder tam genişlik.

Izgara durumları (aynı kutuda, yükseklik sabit, düzen kaymaz):
```
Yükleniyor      Boş                    Hata / Hız sınırı        Anahtar yok
[▒▒][▒▒][▒▒]    "“kedi” için sonuç     "GIF'ler yüklenemedi."   "GIF araması şu
[▒▒][▒▒][▒▒]     bulunamadı. Başka      [ Tekrar dene ]          an kullanılamıyor."
                 bir kelime dene."                               (arama kutusu pasif)
```

## Bileşenler

- **GifPanel**: mevcut kabuk (surface, 1px border, r-md, shadow). İç sıra: başlık satırı, arama, bölüm etiketi, ızgara alanı, not, Gönder satırı, atıf. Cooldown çipi ve "Bağlantı yok" çipi başlığın altında (mevcut stil), çevrimdışıyken Gönder pasif.
- **GifSearch**: `input type="search"` (mevcut input stili 44px, r-sm, 2px border; solda 20px büyüteç ikonu, sağda tarayıcı yerine özel × temizle butonu 44px hit alanı). `maxLength=50`, `aria-label="GIF ara"`. Odak: mor çerçeve + halka. Disabled (anahtar yok): %50 opaklık, placeholder "Arama kapalı". ArrowDown ızgaraya geçer.
- **Bölüm etiketi** ("Trend GIF'ler" / "Sonuçlar"): Label, ink-muted, `fs-xs`, uppercase yok. Arama doluyken "Sonuçlar".
- **GifGrid** (`role=listbox`, `aria-label="GIF sonuçları"`): CSS grid, boşluk sp-2, 3 sütun masaüstü / 2 mobil. Kutucuk = `button role=option`, sabit **kare** (`aspect-ratio:1`, `object-fit:cover`, r-sm, surface-2 zemin) — oran kayması ve yükleme sıçraması yok; `w/h` img'de de verilir.
  - default: 2px şeffaf kenar. hover: kenar `border` rengi, hafif parlaklık (+transform yok). focus-visible: 3px mor halka (offset 2px). active: scale .98.
  - seçili: 3px `--primary` çerçeve + sağ üst 22px dolu mor daire içinde beyaz check rozeti (renge ek olarak şekil işareti); `aria-selected=true`. Tekrar tıklama seçimi kaldırır.
  - görsel yüklenirken: surface-2 zemin + sakin nabız (reduced-motion'da statik). Görsel hatası: kutucuk tamamen gizlenir (boşluk kapanır).
  - Yeni sonuç gelirken önceki kutucuklar %50 opaklıkta kalır (titreme yok) + üstte ince indeterminate çubuk (2px, primary; reduced-motion'da statik dolu çubuk yerine "Yükleniyor…" metni).
- **GifStatus** (ızgara alanının ortası, `role=status` `aria-live=polite`): ikon (24px) + metin + ops. ikincil buton. Hata/hız sınırı: danger-soft zemin YOK (sakin kal); ink-muted metin, ikon danger. Tekrar dene = secondary hap buton 44px.
- **Gönder**: Primary hap (masaüstü sağa hizalı, mobil tam). Pasif: seçim yok / cooldown / çevrimdışı / gönderiliyor. "Gönderiliyor…" durumunda pasif. Altında mevcut not "GIF senin kartında herkese oynar."
- **GifAttribution**: panelin en altında, üst 1px `border` çizgisi, sp-3 üst boşluk. Sol: "Powered by GIPHY" (Label, ink; **resmi GIPHY logo SVG'si repoya yerel dosya olarak eklenir**, harici yükleme yok; logo yoksa metin yeterli, ama logo tercih edilir; koyu temada logo açık varyant). Sağ/alt satır: "GIF'ler GIPHY'den yüklenir." `fs-xs`, ink-muted. Her durumda görünür (hata/anahtar yok dahil), sheet'te de sabit altta.

## Token'lar

Mevcut yeterli: `--surface(-2)`, `--border`, `--primary(-soft)`, `--on-primary`, `--text(-muted)`, `--danger`, `--r-sm/md/pill`, `--sp-*`, `--fs-xs/sm`, `--dur(-fast)`, `--ease`, `--shadow`, `--z-gif-panel`. Yeni (öneri, `styles.css`):
```
--gif-grid-max-h: 264px;      /* mobil sheet'te: flex ile doldurur */
--gif-tile-gap: var(--sp-2);
--gif-panel-w: min(360px, 100vw - 32px);
```
Eski `--gif-preview-max-h` ve `.gif-preview*` / `.gif-error` stilleri silinir.

## Etkileşimler ve geçişler

- Açılış: mevcut fade + 4px kayma (200ms); odak arama kutusunda; trend hemen istenir (debounce'suz). Kapanışta odak GIF butonuna.
- Yazma: 350ms debounce; yazarken ızgara önceki sonuçlarla soluk kalır + yükleme çubuğu. Arama değişince seçim sıfırlanır (Gönder pasifleşir). × veya boşaltma trende döner, odak input'ta kalır.
- Seçim: tıkla/dokun = seç, tekrar = kaldır; başka kutucuk seçimi taşır. Seçim ızgara kaydırmasını bozmaz.
- Gönder: panel kapanır, toast "GIF gönderildi", cooldown (mevcut).
- Hareket: kutucuk fade-in 150ms; seçim rozeti 120ms pop. Hepsi `prefers-reduced-motion`'da kapalı.
- **Hareketi azalt**: kutucuklar `still` kare gösterir; hover/seçili/odakta da oynamaz; nabız/çubuk animasyonları statik. Kullanıcıya ek metin yok (odadaki "GIF gönderdi" etiketi mevcut).
- **Klavye (listbox, roving tabindex)**: Tab ile ızgaraya tek durak (seçili varsa o, yoksa ilk kutucuk). ←/→ ±1, ↑/↓ ±sütun sayısı, Home/End ilk/son, Enter/Space seç-kaldır, Enter seçiliyken arama kutusundayken değil (arama kutusunda Enter = ızgaraya geç). Esc paneli kapatır (mevcut; arama doluyken ilk Esc yalnız temizler **değil**, direkt kapatır — davranış korunur). Shift+Tab ızgaradan aramaya döner.
- Hata/limit: "Tekrar dene" aynı sorguyu yeniden gönderir; başarılıysa durum kalkar, odak ızgaraya taşınmaz.
- Çevrimdışı: arama istekleri hataya düşer, durum "GIF'ler yüklenemedi." + Tekrar dene; "Bağlantı yok" çipi görünür.

## Mikro metinler (TR)

- Panel başlığı "GIF gönder"; kapat aria-label "Paneli kapat"; arama placeholder "GIPHY'de ara", aria-label "GIF ara"; temizle aria-label "Aramayı temizle".
- Etiketler: "Trend GIF'ler" / "Sonuçlar". Izgara aria-label "GIF sonuçları"; kutucuk aria-label "GIF {n} / {toplam}" (seçiliyken `aria-selected`).
- Yükleniyor: "Yükleniyor…". Boş: "“{q}” için sonuç bulunamadı. Başka bir kelime dene." (sorgu 20+ karakterse kırpılıp "…"). Hata: "GIF'ler yüklenemedi." + "Tekrar dene". Hız sınırı: "Çok hızlı arıyorsun, biraz bekle." + "Tekrar dene". Anahtar yok: "GIF araması şu an kullanılamıyor." (arama placeholder "Arama kapalı").
- Gönder "Gönder" / "Gönderiliyor…"; not "GIF senin kartında herkese oynar."; cooldown "{n} sn sonra tekrar gönderebilirsin"; çevrimdışı "Bağlantı yok, GIF gönderemezsin."
- Atıf: "Powered by GIPHY"; gizlilik "GIF'ler GIPHY'den yüklenir."
- Toast: "GIF gönderildi"; "Biraz bekle, sonra tekrar gönderebilirsin."; geçersiz GIF "Bu GIF gönderilemedi, yeniden ara."; genel `GENERIC_ERROR`.

## Erişilebilirlik

- Arama `type=search`, etiketli; ızgara `listbox` + `option` + `aria-selected`; roving tabindex (yukarıdaki klavye haritası); focus-visible halkası 3px mor, seçili durumda da görünür.
- Seçim yalnız renkle değil: kalın çerçeve + check rozeti. Rozet ve metinler ≥4.5:1 (mevcut tokenlar, koyu tema otomatik).
- Yükleme/boş/hata `role=status` `aria-live=polite`; sonuç sayısı duyurulmaz (gürültü), yalnız durum değişimi.
- `img alt=""` (kutucuk adı butonda), `referrerPolicy=no-referrer`; × temizle, kapat, Tekrar dene, kutucuk, Gönder hedefleri ≥44px (mobilde kutucuk zaten >44px; masaüstü 3 sütun ≈100px).
- Mobil sheet `aria-modal=true`, odak tuzağı; ızgara `overscroll-behavior: contain`, dokunarak kaydır/seç; dar ekranda kısa yükseklikte (klavye açık) Gönder ve atıf görünür kalır, ızgara küçülür.
- Hareketi azalt: still kareler, animasyonsuz durumlar (yukarıda). Atıf logosu `alt="GIPHY"`; metin zaten "Powered by GIPHY" ise logo dekoratif (`alt=""`).

## Notlar
- Resmi GIPHY logosu/marka yönergesi dosyası repoda yok; frontend-dev ya metin-only atıf yapar ya da ekip logoyu ekler (harici yükleme yok).
- Kutucuk kare + `cover` seçildi (düzen kayması yok); geniş GIF'lerin kenarları kırpılır, bu kabul.
