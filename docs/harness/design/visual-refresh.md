# visual-refresh — Görsel yön planı

Durum: plan (kod yok). Kullanıcı isteği: "yeni, güzel, fancy ama sade". Mod: **Operate** (çalışan oda ekranı; Home da aynı dünyayı paylaşır).
Kullanıcıyla karar turu yapılamadı (subagent, soru kanalı yok): Impeccable `concept-seed` (key `5bd101ba`) atanan yönle ilerlendi; varsayımlar aşağıda işaretli. Kullanıcı alternatif yönü (bkz. "Diğer kartlar") seçebilir.

## Konu / izleyici / ana iş
- Mimeda ekibinin Türkçe Planning Poker'ı: video call sırasında, çoğu masaüstü, kimi telefondan; Owner ekran paylaşıyor olabilir.
- Ana iş: gizli kart seç → herkes oyladı mı tek bakışta gör → kartlar aynı anda açılsın → sonucu oku, sonraki story.

## Yön: "Ebru Masa"
- Dünya: Türk **ebru** sanatı (marbled paper). Ebru, eski kitapların iç kapağında ve oyun kartlarının **arka yüzünde** kullanılan desen geleneği; yani kartın gizli yüzü için gerçek bir kökü var.
- Tez: Arayüz sakin, serin, çivit mavisi bir masa. Tek gösterişli şey, **oy verilmiş ama açılmamış kartın ebru sırtı**. Gizlilik (ürün ilkesi 2) görsel olarak en güzel an olur.
- Reddettiği kategori varsayılanı: yeşil çuha + altın casino masası; mor SaaS + hap butonlar (mevcut).

## Palet
Strateji: **Restrained + tek committed bölge.** Nötrler çivitten türetilmiş, aksiyon tek renk (çivit), masa yüzeyi çivit bir alan. Kök boya ve safran **yalnızca ebru deseninin içinde** yaşar.

| Ad | Açık | Koyu | Rol | Mevcut token |
|---|---|---|---|---|
| Kâğıt | `#F4F5F8` | `#0E1226` | Sayfa zemini, topbar | `--bg` |
| Yüzey / Yüzey-2 | `#FFFFFF` / `#E9ECF3` | `#171C36` / `#20264A` | Panel, input / istatistik kutusu, hover | `--surface` / `--surface-2` |
| Kenar | `#D5DAE6` | `#2F3660` | 1px çizgiler | `--border` |
| Mürekkep / Soluk | `#161B33` / `#545B78` | `#ECEEF7` / `#A3A9C6` | Metin | `--text` / `--text-muted` |
| **Çivit** | `#2C3B8F` (hover `#22307A`, soft `#E3E7F7`) | `#A9B5FF` (hover `#C2CBFF`, soft `#262E5C`, on `#0E1226`) | Buton, seçili kart, focus, medyan | `--primary*`, `--focus` |
| **Tekne** (masa) | `#1E2A66`, üstünde metin `#F4F5F8`, soluk `#B9C2EE` | `#1C2554` | Masa alanı (committed bölge) | yeni `--table`, `--on-table`, `--on-table-muted`, `--focus-on-table` (`#B9C2EE`) |
| Kök boya / Safran | `#B8323A` / `#E0A526` | aynı | **Yalnızca** ebru deseni | `--accent` → `--ebru-madder`, `--sun` → `--ebru-saffron` |

- Kontrast (ölçüldü): metin 15.5:1, soluk 6.1:1 (yüzey-2 üstünde 5.6), çivit buton beyaz metin 9.9:1, masa üstü isim 12.2:1 / soluk 7.6:1; koyu: metin 16:1, soluk 7.2:1, çivit üstü 9.5:1.
- Durum renkleri (`--success*`, `--warning*`, `--danger*`) korunur; Paired Status Rule geçerli.
- Gölge: tek "elde tutulan" gölgesi, renk çivitten: `0 1px 0 rgba(22,27,51,.06), 0 10px 28px rgba(22,27,51,.10)`; koyuda siyah. Masadaki kartlar gölgesiz kalır (Flat Seat Rule).

## Tipografi
Google Fonts, `client/index.html`'deki mevcut `<link>` değiştirilir (npm bağımlılığı yok).
- **Schibsted Grotesk** (400/500/700/800): tüm UI. Türkçe glifler tam. Gövde 500, başlık 800, etiket 700. `--font`.
- **Young Serif** (400, tek ağırlık, kalın görünümlü): **yalnızca kartın üstüne basılan rakamlar** (deste, masada açılan değer, Home kartları) ve sonuçtaki medyan rakamı. Yeni `--font-card`. Kural: "Serif yalnızca karta basılır."
- Mono: oda linki için `ui-monospace` korunur.
- Ölçek (1.25 oran, 16px taban): xs 12 · sm 14 · md 16 · lg 20 · xl 25 · 2xl `clamp(2rem, 4.5vw, 3rem)`; kart rakamı deste 28px, masa 22px, medyan 64px (`clamp(3rem, 8vw, 4rem)`). Sayılar `tabular-nums` (Young Serif'te sabit genişlik yoksa kartta sorun değil, istatistiklerde grotesk kullanılır).
- Büyük harf etiket, kicker, tek kelime vurgusu yok.

## Düzen
Kabuk değişmez (topbar, sahne + 320px story paneli, mobil sheet). Fark: masa artık kutu içinde kutular değil, **çivit bir tekne alanı**; koltuk kutuları kalkar, kart + isim doğrudan masada durur.

Home (masaüstü ≥1024: iki sütun, sol hizalı; mobil: tek sütun, kartlar formun üstünde küçük):
```
┌ topbar: [logo Mimeda Scrum Poker]                         [tema] ┐
│                                                                   │
│  Tahmin yapmak oyun gibi olsun.          ╭────╮                   │
│  Hesap yok, kurulum yok. Bir oda kur,   ╭│ebru│╮  ← 3 kart yelpaze │
│  linki paylaş, oylamaya başla.          ││sırt││    ortadaki açık:│
│                                          │╭────╮│    Young Serif 8 │
│  Adın  [_____________________]           ╰│  8 │╯                  │
│  [ Oda kur ]                              ╰────╯                   │
└───────────────────────────────────────────────────────────────────┘
 sol sütun max 440px, kartlar sağda dikey ortalı; mobilde kartlar 0.6 ölçek, üstte
```

Room (masaüstü):
```
┌ topbar: logo · [oda linki][Linki kopyala] ·············· [tema][GIF] ┐
├───────────────────────────────────────────────┬──────────────────────┤
│ Aktif story başlığı (xl 800, sol hizalı)      │ Story sırası          │
│ açıklama (muted, 70ch)                        │ ─ satırlar ─          │
│ ╔═══════════════ TEKNE (çivit) ════════════╗  │ (aktif: çivit soft)   │
│ ║  ▓▓   ▓▓   ░░   ▓▓   ┌┐                  ║  │                       │
│ ║ Ayşe  Mert  Can  Elif Sen                ║  │                       │
│ ║  ✓     ✓    ◷     ✓                      ║  │                       │
│ ╚══════════════════════════════════════════╝  │                       │
│ 4/5 oy verdi  ━━━━━━━━━━━━━━──   [Kartları aç] │                      │
│ Sonuç paneli (açılınca): medyan 64px serif     │                      │
├─ deste (yapışık, Kâğıt zemin) ────────────────┤                       │
│ [0][1][2][3][5][8][13][21][?][☕]              │                       │
└───────────────────────────────────────────────┴──────────────────────┘
 ▓▓ = ebru sırt (oy verdi), ░░ = kesikli boş yuva, ┌┐ = "sen" (açık çivit halka)
```
- Hizalama: başlıklar ve paneller sol; yalnızca masa içindeki kart sırası ortalı (whole-cell repack: koltuklar tam hücre olarak sarar).
- Mobil (<768): masa 3 sütun (kart 48×68 → 44×62), deste yatay kaydırma korunur, kontroller tam genişlik.

## Tek cesur öğe: ebru kart sırtı
- Oy verilmiş/gizli kart = ebru desenli sırt (çivit zemin üstünde kök boya + safran + kâğıt beyazı damarlar, "gelgit/battal" ebru). Şu anki mor çizgili `card-back`'in yerini alır.
- Aynı desen Home'daki kart yelpazesinde büyük boyutta görünür; başka hiçbir yerde ebru yok (topbar, panel, zemin sade).
- Kişiye göre varyasyon: desen, katılımcı id'sinden türetilen kaydırma/döndürme ile her koltukta biraz farklı (aynı kaynak SVG, CSS `background-position`/`rotate` farkı). Değer sızdırmaz; yalnızca kimliğe bağlı.
- Uygulama: tek statik SVG (`feTurbulence` + `feDisplacementMap`, sabit seed) → bir kez render edilen data-URI / `client/public/ebru.svg`. Koltuk başına canlı filtre yok.

## Hareket anı (tek orkestre an): açılış
- "Kartları aç" → masadaki kartlar soldan sağa 50ms aralıkla `rotateY(180°)` ile döner: ebru sırt → kâğıt yüz + Young Serif rakam; son kart oturunca medyan sayısı sonuç panelinde yerine oturur (opacity + 8px, `--dur`).
- Başka sahneleme yok: sayfa girişlerinde fade-up yok, hover'larda yalnız mevcut kart kalkışı (deste, 4px).
- `prefers-reduced-motion`: dönme yerine 120ms çapraz geçiş, stagger yok.
- **Kapsam notu:** 3D çevirme backlog'da `card-flip-reveal` (analyzed) olarak ayrı duruyor. Öneri: visual-refresh yalnızca sırt/yüz görsellerini ve token'ları getirir; çevirme `card-flip-reveal` ile uygulanır (veya caller iki işi birleştirmeye karar verir).

## Jenerik kontrolü (ilk plan → revizyon)
- İlk refleks: yeşil çuha masa + altın + oyun kartı serifi → "poker" kategorisinin tahmin edilebilir görünümü. **Değişti:** çivit tekne + ebru; kök Türk kâğıt sanatında, kartın arka yüzü geleneğinden.
- İlk zemin: fildişi/krem kart kâğıdı → AI krem tell'i. **Değişti:** serin, çivitten tonlanmış `#F4F5F8`.
- İlk aksiyon rengi: kök boya kırmızısı → terracotta'ya yakın ve `--danger` ile karışır. **Değişti:** aksiyon çivit; kırmızı yalnız desende.
- İlk tipografi: başlık da serif → "serif display" kalıbı. **Değişti:** serif yalnızca kart rakamı/medyan; UI grotesk.
- İlk masa: kartlı koltuk kutuları + gölgeler (SaaS kart kiti). **Değişti:** kutular kalkar, masa tek renk alan, kartlar düz.
- Hap butonlar (her şeyde 999px) kaldırılıyor: buton/input 10px, kart 10px, paneller 16px, masa 28px — hiyerarşiye göre yarıçap.
- Mevcut Home dekor kartlarının mercan/sarı renkleri ve döndürülmüş "sticker" hissi kalkar; yerine tek yelpaze, ebru sırtlı.

Diğer kartlar (karar turu yapılamadığı için kayıt): 
- Impeccable'ın kendi ilk tercihi: "Kâğıt oyun kartı baskısı" (kırmızı/siyah mürekkep, fildişi kart stoku). Risk: tanıdık, krem zemine kayma eğilimi.
- Seed challenger'ları (havalimanı tabelası, jet-çağı bilet cüzdanı, merkez raylı dizgi, Emigre bitmap, doujin katalog, karanlık oda pozlama kaydı) ürün netliği ve kitle tanınırlığında geriledi; her birinden alınan disiplin:
  - Tabela (sarı yalnızca yön için): çivit yalnızca aksiyon/seçim, ebru yalnızca gizli oy.
  - Bilet cüzdanı (hiçbir şey kaybolmaz, damgalanır): kaydedilen puan story satırına "basılmış" rozet olarak kalır.
  - Merkez ray (tek kalınlıkta çizgi): tüm kenarlar 1px; 2px yalnızca seçim/focus.
  - Bitmap specimen (tek form, çok boyut): kart tek bileşen, üç boy (Home 120×172, deste 64×92, masa 48×68).
  - Doujin katalog (tam hücre repack): masa koltukları tam hücre olarak sarar.
  - Karanlık oda (tek ton rampası): nötrler tek çivit tonlu rampadan.

## Kapsam
Değişecek dosyalar (frontend aşaması):
- `client/index.html` — font linki (Schibsted Grotesk 400;500;700;800 + Young Serif).
- `client/src/styles.css` — token'lar (açık/koyu), radius, gölge, masa/koltuk/kart/deste/sonuç/Home stilleri.
- `client/src/pages/Home.tsx` — dekor kartlar yelpazesi (sadece işaretleme/sınıf; form aynı).
- `client/src/components/Table.tsx` — sınıf/işaretleme (koltuk kutusu kaldırma); veri ve durum mantığı aynı.
- `client/src/components/Icon.tsx` veya yeni `client/src/components/CardBack.tsx` + `client/public/ebru.svg` — ebru sırt.
- Gerekirse `Deck.tsx`, `Results.tsx`, `Logo.tsx` yalnızca sınıf düzeyinde.
- `DESIGN.md` — frontend bittikten sonra yeni dünyaya göre yeniden yazılır (Impeccable `document`).

Korunanlar: tüm işlevsellik, socket akışı, Türkçe metinler (aynen), aria etiketleri, radiogroup klavye kullanımı, sr-only metinler ("Oy verdi, değer gizli"), 44px dokunma hedefleri, `prefers-color-scheme` + manuel tema, reduced motion.
Bitişte: Impeccable `polish` + `impeccable detect client/src`; bir tur masaüstü+mobil ekran görüntüsü; `npm run build`.

## Riskler / notlar
- Ebru SVG performansı: filtre canlı değil, statik asset olmalı; 20 koltukta tek görsel yeniden kullanılır.
- Masa koyu alan olunca masa içindeki focus halkası çivitle görünmez → `--focus-on-table` (`#B9C2EE`) şart; "sen" çerçevesi de bu açık tonla.
- Durum çipleri (Oy verdi/Bekleniyor) çivit zemin üstünde: soft zeminli çipler okunur ama koyu temada `--success-soft` masa tonuna yakın; frontend'de ölçülmeli.
- GIF overlay koltuk kartının üstünde oynar; koltuk kutusu kalkınca overlay boyutu kart + isim alanına göre yeniden ayarlanmalı.
- Logo Mimeda'nın (marka taahhüdü); renk değişmez, yalnız topbar zemini değişir.
- Young Serif tek ağırlık; `?` ve `☕` kartları için `☕` mevcut ikonla kalır.
- `card-flip-reveal` ve `consensus-confetti` ile çakışma: konfeti renkleri ebru üçlüsünden (çivit, kök boya, safran) alınmalı — not o feature'ın tasarımına.
- PRODUCT.md "sıcak ton" diyor; bu yön serin. Sıcaklık ebru'nun kök boya/safranından ve "sen" dilinden gelir. Kullanıcı sıcak zemin isterse Kâğıt'ı `#F5F3EF`'e çekmek tek token değişikliği.
