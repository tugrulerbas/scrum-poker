---
name: Mimeda Scrum Poker
description: Hesapsız, tek linkle Planning Poker — çivit bir masa, ebru sırtlı kartlar.
colors:
  bg: "#F4F5F8"
  surface: "#FFFFFF"
  surface-2: "#E9ECF3"
  border: "#D5DAE6"
  ink: "#161B33"
  ink-muted: "#545B78"
  primary: "#2C3B8F"
  primary-hover: "#22307A"
  primary-soft: "#E3E7F7"
  on-primary: "#FFFFFF"
  table: "#1E2A66"
  on-table: "#F4F5F8"
  on-table-muted: "#B9C2EE"
  table-success: "#92DDB0"
  card-face: "#FFFFFF"
  card-ink: "#1E2A66"
  ebru-madder: "#B8323A"
  ebru-saffron: "#E0A526"
  success: "#17803D"
  success-soft: "#DDF5E4"
  warning-text: "#7A4B00"
  warning-soft: "#FFEFC2"
  danger: "#C62840"
  danger-soft: "#FDE3E7"
  night-bg: "#0E1226"
  night-surface: "#171C36"
  night-surface-2: "#20264A"
  night-border: "#2F3660"
  night-ink: "#ECEEF7"
  night-ink-muted: "#A3A9C6"
  night-primary: "#A9B5FF"
  night-table: "#1C2554"
  night-card-face: "#E4E8F5"
typography:
  display:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.5625rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.5
  card-numeral:
    fontFamily: "Young Serif, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1
  median:
    fontFamily: "Young Serif, Georgia, serif"
    fontSize: "clamp(3rem, 8vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.05
  mono:
    fontFamily: "ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.875rem"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "28px"
  seat-card: "7px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "72px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
  table:
    backgroundColor: "{colors.table}"
    textColor: "{colors.on-table}"
    rounded: "{rounded.xl}"
    padding: "32px 24px 24px"
  seat-card:
    backgroundColor: "{colors.card-face}"
    textColor: "{colors.card-ink}"
    typography: "{typography.card-numeral}"
    rounded: "{rounded.seat-card}"
    width: "56px"
    height: "80px"
  playing-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.card-numeral}"
    rounded: "{rounded.md}"
    width: "64px"
    height: "92px"
  playing-card-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: Mimeda Scrum Poker

## Overview

**Creative North Star: "Ebru Masa"** (The Marbled Table)

Sakin, serin, çivit mavisi bir masa. Arayüzün geri kalanı neredeyse sessiz: çivitten tonlanmış kâğıt zemin, tek aksiyon rengi, ince 1px çizgiler. Tek gösterişli şey, oy verilmiş ama açılmamış kartın **ebru sırtı**. Ebru, eski kitapların iç kapağında ve oyun kartlarının arka yüzünde kullanılan Türk kâğıt sanatı; gizli oy (ürün ilkesi 2) görsel olarak en güzel an olur.

Mod Operate: oda ekranı bir iş aracıdır, video call sırasında ve ekran paylaşımında okunur. Durum (kaç kişi oy verdi, medyan) büyük ve tabular rakamlarla verilir; marka ayrıntıda yaşar (kart rakamlarındaki serif, ebru sırt, çivit tekne).

Reddedilen kategori varsayılanları: yeşil çuha + altın casino masası; mor SaaS + her şeyde hap buton; krem/fildişi "sıcak" zemin.

**Key Characteristics:**
- Restrained palet + tek committed bölge: masa (tekne) koyu çivit bir alan, geri kalan nötr.
- Kök boya ve safran **yalnızca** ebru deseninin içinde yaşar.
- UI tamamen Schibsted Grotesk; Young Serif yalnızca karta basılan rakamlarda ve medyanda.
- Hiyerarşiye göre yarıçap: çip 6px, buton/input/kart 10px, panel 16px, masa 28px.
- Açık ve koyu tema; koyu tema gece çividi, aksiyon açık lavanta-çivit.

## Colors

Tek çivit tonundan türetilmiş nötr rampa üzerinde tek aksiyon rengi; durum renkleri yumuşak zeminli çiftler.

### Primary
- **Çivit** (primary, koyu: night-primary): Birincil buton, seçili kart, medyan, ilerleme ve dağılım çubukları, focus halkası, aktif story zemini (primary-soft). Beyaz metinle 9.9:1; koyuda `#0E1226` metinle 9.5:1.

### Committed bölge
- **Tekne** (table): Masa alanı. Üstünde metin on-table (12.2:1), soluk on-table-muted (7.6:1). Masa içindeki focus ve "sen" halkası `--focus-on-table` (#B9C2EE); çivit focus koyu zeminde görünmez.
- **Masa çipleri**: `rgba(244,245,248,.10)` zemin; "Oy verdi" metni table-success (#92DDB0).

### Ebru (yalnızca desen)
- **Kök boya** (ebru-madder) ve **Safran** (ebru-saffron): `client/public/ebru.svg` içinde, çivit zemin + kâğıt beyazı damarlarla. Metin, buton, durum veya dekor rengi olarak kullanılmaz.

### Neutral
- **Kâğıt** (bg): Sayfa zemini, topbar, yapışık deste zemini.
- **Yüzey** (surface): Paneller, inputlar, deste kartları, menü, dialog.
- **Yüzey-2** (surface-2): İstatistik kutuları, çipler, hover zemini, sayaçlar.
- **Kenar** (border): 1px çizgiler, ilerleme çubuğu rayı.
- **Mürekkep / Soluk** (ink / ink-muted): 15.5:1 / 6.1:1 (yüzey-2 üstünde 5.6:1).

### Named Rules
**The One Indigo Rule.** Aksiyon ve seçim yalnızca çivit taşır. Kırmızı (kök boya) desende kalır; `--danger` ile karışmasın diye asla aksiyon değildir.
**The Ebru-Only-Hides Rule.** Ebru deseni yalnızca gizli oyu (ve Home/katılım ekranındaki kart yelpazesini) temsil eder; topbar, panel, zemin sade kalır.
**The Paired Status Rule.** Durum her zaman soft zemin + koyu metin + ikon + kelime olarak gelir; yalnız renk yetmez.

## Typography

**UI Font:** Schibsted Grotesk (400/500/700/800, Google Fonts; system-ui yedek)
**Card Font:** Young Serif (400, tek ağırlık)
**Mono:** ui-monospace, yalnızca oda linki

**Character:** Sıkı, gazete kökenli bir grotesk; 800'de net ve kararlı, 500'de rahat. Young Serif'in kalın, eski baskı rakamları kartı kâğıt nesnesi yapar.

### Hierarchy
- **Display** (800, clamp(2rem, 4.5vw, 3rem), 1.05, -0.03em): Home ve katılım başlığı.
- **Headline** (800, 1.5625rem): Aktif story başlığı, hata ekranı başlıkları. Açıklama ölçüsü 70ch.
- **Title** (800, 1rem): Bölüm başlıkları ("Kartını seç", "Story sırası", "Dağılım"). Cümle düzeni.
- **Body** (500, 1rem, 1.5): Açıklamalar, story metni. Home alt başlığı 1.25rem.
- **Label** (700, 0.875rem): Form etiketleri, butonlar, isimler; çip ve sayaçlar 0.75rem.
- **Card numeral** (Young Serif 400): deste 1.75rem, masa 1.375rem, dağılım 1.25rem, puan rozeti, medyan clamp(3rem, 8vw, 4rem).

### Named Rules
**The Serif-Only-On-Cards Rule.** Serif yalnızca karta basılır (deste, masa, Home yelpazesi, puan rozeti, dağılım etiketi) ve medyanda. Başlıklar ve UI asla serif değildir.
**The No Kicker Rule.** Başlığın üstüne küçük büyük-harf etiket konmaz.
**The Tabular Count Rule.** Oy sayısı, istatistik, sayaç ve cooldown sayacı `tabular-nums`; kart rakamları `lining-nums`.

## Layout

4px tabanlı ölçek (4-72px). Topbar 60px yapışık. Masaüstü (≥1024px) iki sütun: `1fr` sahne + 320px story paneli (yapışık), en fazla 1280px. Tablet (768-1023px) tek sütun, story paneli sağdan çekmece. Mobil (<768px) tek sütun, story paneli alttan sheet, sabit tam genişlik alt sekme.

Home (≥1024px) iki sütun: solda 440px form, sağda üç kartlık yelpaze (iki ebru sırt + ortada Young Serif "8"). Mobilde yelpaze küçülüp formun üstüne geçer. Linkle gelenin katılım ekranı aynı yelpazeyi (üç ebru sırt) formun üstünde küçük gösterir; form panelsizdir.

Masa: başlıklar ve paneller sol hizalı; yalnızca masa içindeki koltuklar 144px'lik hücrelerde ortalanır (mobil 3 eşit sütun). Koltuk kutusu yoktur: kart + isim + durum çipi doğrudan teknede durur. Kartlar açılınca koltuk kartı 64×92'ye büyür; boş meta satırı kapanır. Deste oylamada altta yapışıktır; açılınca normal akışa döner.

## Elevation & Depth

Tonal katman (Kâğıt → Yüzey-2 → Yüzey) + tek "elde tutulan" gölge. Masadaki kartlar gölgesizdir; derinlik masanın kendi renginden gelir.

### Shadow Vocabulary
- **Elde tutulan** (`0 1px 0 rgba(22,27,51,.06), 0 10px 28px rgba(22,27,51,.10)`): Home yelpazesi, toast, menü, dialog, GIF paneli, çekmece. Koyuda siyah (.3/.4).
- **Deste kartı** (`0 1px 0 rgba(22,27,51,.06), 0 3px 8px rgba(22,27,51,.08)`): Yalnızca destedeki oyun kartları.

### Named Rules
**The Flat Table Rule.** Teknedeki kartlar ve çipler gölgesizdir; kart içinde kart, kutu içinde kutu yok.

## Shapes

Hiyerarşiye göre yarıçap: çip/rozet/menü öğesi 6px, buton/input/deste kartı/dialog içi 10px, panel/story paneli/dialog 16px, masa 28px (mobil 16px). Masadaki küçük kart 7px; ebru iç yüzeyi kart yarıçapı eksi kâğıt çerçeve (3px). Hap biçimi yalnızca ilerleme ve dağılım çubuklarında.

Çerçeveler 1px; 2px yalnızca focus ve seçim halkasında. Renkli tek taraflı kalın kenar kullanılmaz.

## Components

### Buttons
- **Shape:** 10px, yükseklik 44px; masaüstünde satır içi küçük boy 36px (mobilde 44px).
- **Primary:** Çivit dolgu, beyaz metin, 700. Hover koyu çivit, basınca 1px aşağı.
- **Secondary:** Yüzey + 1px kenar; hover'da çerçeve ve metin çivit (iç 1px halka). **Ghost:** şeffaf, hover yüzey-2. **Danger-ghost:** tehlike çerçeve/metin.
- **Focus:** 2px çivit halka, 2px offset (masada açık çivit).
- **Disabled:** %50 opaklık, `not-allowed`; ipucu gerekiyorsa `aria-disabled` ile odaklanabilir kalır ve tooltip gösterir.

### Chips
- **Durum çipi:** 6px, ikon + kelime. Masada saydam beyaz zemin; "Oy verdi" açık yeşil, "Bekleniyor" soluk. Masa dışında success-soft/success.
- **Owner rozeti:** taç ikonu + "Owner"; mobilde metin görsel olarak gizli (sr-only), `title` korunur.
- **Seçim çipi (puan):** 44px dokunma (masaüstü 36px), 1px kenar; seçili çivit dolgu.

### Inputs / Fields
- 1px kenar, 10px köşe, 44px; etiket üstte 700, sayaç sağ altta tabular. Hover'da kenar soluk mürekkep; focus 2px çivit halka; hata tehlike kenarı + altında kalın mesaj (`aria-describedby`).

### Navigation
- **Topbar:** Kâğıt zemin, alt 1px çizgi, 60px yapışık. Solda Mimeda logosu + "Mimeda **Scrum Poker**", ortada oda linki (mono, yüzey-2) + "Linki kopyala", sağda tema düğmesi ve GIF aç/kapa. Mobilde logo yazısı ve link alanı gizlenir.

### Masa / Tekne (imza)
Çivit alan, 28px köşe. Koltuk: kart (56×80, mobil 44×62; açılınca 64×92 / 48×68) + avatar ve isim + durum çipi. Boş yuva kesikli açık çizgi; "sen" kartı masa renginde boşluk + açık çivit halka; çevrimdışı koltuk %50.

### Ebru kart sırtı (imza)
Kâğıt çerçeve (3px) içinde `public/ebru.svg` (statik, `feTurbulence` + `feDisplacementMap` ile bir kez üretilmiş). Katılımcı id'sinden türetilen kaydırma/döndürme/ayna ile her koltukta farklı görünür; oy değerini asla yansıtmaz. Ekran okuyucuya "Oy verdi, değer gizli".

### Deste
64×92 (mobil 56×80), 10px, Young Serif rakam; hover 4px kalkış + çivit kenar; seçili çivit dolgu, 6px kalkış, çift halka ve sağ üstte çizili onay. ☕ çizili fincan ikonu. Mobilde yatay kaydırma + snap.

### Sonuç paneli
Durum bandı (fikir birliği yeşil, tartışmaya değer sarı), medyan primary-soft kutuda Young Serif 64px, ortalama ikincil, dağılım çivit hap çubukları, Owner için puan çipleri + "Bu puanı kaydet".

### GIF
Koltuk kartının yanında "GIF" düğmesi (kendi koltuğunda; hover/focus'ta görünür, dokunmatikte hep), cooldown'da saniye sayacı. Panel masaüstünde açılır kutu, mobilde alt sheet; overlay koltuğun üstünde açık çivit halkayla oynar.

## Do's and Don'ts

### Do:
- **Do** aksiyon ve seçimi yalnızca Çivit (#2C3B8F / koyu #A9B5FF) ile işaretle.
- **Do** masa içinde focus ve vurgu için `--focus-on-table` kullan.
- **Do** ikonları `Icon` bileşeninden al: 24px viewBox, 2px çizgi, yuvarlak uç.
- **Do** durumları ikon + kelime + soft zemin üçlüsüyle ver.
- **Do** her animasyonu `--dur`/`--ease` ile ver ve `prefers-reduced-motion` altında kapat.

### Don't:
- **Don't** kök boya veya safranı ebru deseni dışında kullanma.
- **Don't** başlıkta veya UI metninde serif kullanma; serif yalnızca karta basılır.
- **Don't** her şeyi hap yapma; yarıçap hiyerarşiyi izler.
- **Don't** masadaki kartlara ya da çiplere gölge ekleme.
- **Don't** krem/fildişi zemine dönme; nötrler çivitten tonlanır.
- **Don't** başlık üstüne kicker, emoji ikon ya da 1px'ten kalın renkli tek taraflı kenar koyma.
