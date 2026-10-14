---
name: Mimeda Scrum Poker
description: Hesapsız, tek linkle Planning Poker — sıcak bir kart masası.
colors:
  primary: "#6C4DF5"
  primary-hover: "#5A3BE0"
  primary-soft: "#EDE8FF"
  on-primary: "#FFFFFF"
  coral: "#FF7A59"
  sun: "#FFC83D"
  cream-bg: "#FFF7EC"
  surface: "#FFFFFF"
  surface-2: "#FBF0E1"
  border: "#EAD9C3"
  ink: "#2A2133"
  ink-muted: "#6B5F78"
  success: "#17803D"
  success-soft: "#DDF5E4"
  warning-text: "#7A4B00"
  warning-soft: "#FFEFC2"
  danger: "#C62840"
  danger-soft: "#FDE3E7"
  night-bg: "#17131F"
  night-surface: "#221C2E"
  night-primary: "#A895FF"
typography:
  display:
    fontFamily: "Nunito, Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.2
  headline:
    fontFamily: "Nunito, Inter, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.2
  title:
    fontFamily: "Nunito, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Nunito, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Nunito, Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.875rem"
rounded:
  sm: "8px"
  md: "14px"
  lg: "22px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "44px"
  playing-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    width: "64px"
    height: "92px"
  playing-card-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  seat:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px"
  chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
---

# Design System: Mimeda Scrum Poker

## Overview

**Creative North Star: "Samimi Kart Masası"** (The Friendly Card Table)

Ekip, sıcak krem bir masanın etrafında toplanmış; ortada oyun kartları, herkesin önünde kendi kartı. Arayüz bu masa metaforunu taşır ama oyun salonu gösterişine kaçmaz: yumuşak köşeler, tek bir canlı mor, kart yüzlerinde kalın rakamlar. Günlük kontroller sakin ve hızlıdır; renk ve hareket açılış anında ve sonuç panelinde toplanır.

Yoğunluk orta: masaüstünde sol tarafta sahne (aktif story, masa, kontroller, sonuç, deste), sağda story sırası. Ekran paylaşımında uzaktan okunabilmesi için durum (kaç kişi oy verdi, medyan) büyük ve tabular rakamlarla verilir.

Görüşme yapılmadan, mevcut koddan ve `docs/harness/design/scrum-poker-v1.md`'den çıkarıldı; kuzey yıldızı adı ve renk adları varsayımdır.

**Key Characteristics:**
- Sıcak krem zemin + tek mor aksiyon rengi; mercan ve güneş sarısı yalnızca dekor/uyarı.
- Nunito 800 başlıklar, 500 gövde; büyük harf etiket yok, cümle düzeni.
- Oyun kartı oranı (64×92) ve masa yüzeyi (surface-2) ürünün imzası.
- İkonlar tek çizgi kalınlığında (2px, yuvarlak uç) çizilmiş SVG; emoji yalnızca mikro metinde.
- Açık ve koyu tema; koyu tema gece mor-siyahı, mor açılır.

## Colors

Sıcak, kağıt gibi nötrler üzerinde tek doygun mor; durum renkleri yumuşak zeminli çiftler halinde.

### Primary
- **Kart Moru** (primary): Birincil buton, seçili kart, sonuçta medyan, "sen" koltuğunun çerçevesi, ilerleme çubuğu, focus halkası. Beyaz metinle 5.4:1.
- **Lavanta Sis** (primary-soft): Aktif story satırı, medyan kutusu, seçim vurgusu, toast/hata ikon zemini.

### Secondary
- **Mercan** (coral): Yalnızca dekor (ana sayfa kartları). Metin için kullanılmaz.

### Tertiary
- **Güneş** (sun): Dekor ve uyarı tonu; metin için `warning-text` kullanılır.

### Neutral
- **Krem Masa Örtüsü** (cream-bg): Sayfa zemini, topbar, yapışık deste zemini.
- **Kağıt** (surface): Paneller, koltuklar, kartlar, inputlar.
- **Keçe** (surface-2): Masa yüzeyi, istatistik kutuları, çipler, hover zemini.
- **Kenar Çizgisi** (border): 1-2px çerçeveler ve ayraçlar.
- **Mürekkep / Soluk Mürekkep** (ink / ink-muted): Metin; muted ≥5.4:1.

### Named Rules
**The One Purple Rule.** Aksiyon ve seçim yalnızca mor taşır; mercan ve sarı asla tıklanabilir bir şeyi işaretlemez.
**The Paired Status Rule.** Durum her zaman soft zemin + koyu metin + ikon + kelime olarak gelir (ör. success-soft üzerinde success "Oy verdi"); yalnız renk yetmez.

## Typography

**Display Font:** Nunito (Inter, system-ui yedek)
**Body Font:** Nunito
**Label/Mono Font:** ui-monospace yalnızca oda linki gibi veri için

**Character:** Yuvarlak uçlu, sıcak bir grotesk; 800 ağırlıkta oyuncu, 500'de rahat okunur.

### Hierarchy
- **Display** (800, clamp(2rem, 5vw, 3rem), 1.2): Ana sayfa başlığı, sonuçta medyan rakamı.
- **Headline** (800, 1.75rem, 1.2): Aktif story başlığı, katılım ve hata ekranı başlıkları. Ölçü 70ch.
- **Title** (800, 1rem): Bölüm başlıkları ("Kartını seç", "Story sırası", "Dağılım"). Cümle düzeni, mürekkep rengi.
- **Body** (500, 1rem, 1.5): Açıklamalar, story metni.
- **Label** (700, 0.875rem): Form etiketleri, çipler, küçük butonlar; sayaçlar 0.75rem.

### Named Rules
**The No Kicker Rule.** Başlığın üstüne küçük büyük-harf etiket konmaz; başlık kendi ağırlığıyla konuşur.
**The Tabular Count Rule.** Oy sayısı, istatistik, puan rozeti, sayaç ve masa değerleri `tabular-nums` ile yazılır.

## Layout

4px tabanlı boşluk ölçeği (4-48px). Masaüstü (≥1024px) iki sütun: `1fr` sahne + 320px story paneli (yapışık), en fazla 1280px. Tablet (768-1023px) tek sütun, story paneli sağdan çekmece. Mobil (<768px) tek sütun, story paneli alttan sheet, sabit alt sekme; masa 2 sütun; deste yatay kaydırılır; facilitator butonları tam genişlik; kaydedilecek puan çipleri 4'lü ızgara.

Masa, koltukları 136-160px'lik sütunlarda ortalar; az kişide bile masa ortada toplanmış görünür. Deste oylama sırasında altta yapışıktır; kartlar açılınca normal akışa döner ki sonuç paneli kapanmasın.

## Elevation & Depth

Hibrit: zemin ve masa tonal katmanla (cream-bg → surface-2 → surface) ayrılır; gölge yalnızca "elde tutulan" nesnelerde (paneller, oyun kartları, toast, menü, dialog). Masadaki koltuklar gölgesizdir; kart içinde kart gölgesi kullanılmaz.

### Shadow Vocabulary
- **Kart gölgesi** (`0 2px 0 rgba(60,40,20,.06), 0 8px 24px rgba(60,40,20,.08)`): Panel, oyun kartı, toast, menü, dialog. Koyu temada `rgba(0,0,0,.3)/.35`.

### Named Rules
**The Flat Seat Rule.** Masa yüzeyindeki koltuklar düzdür; derinlik masanın kendisinden gelir.

## Shapes

Yumuşak ama gevşek değil: inputlar ve çip butonlar 8px, kartlar/koltuklar/menüler 14px, paneller ve masa 22px, butonlar ve durum çipleri hap (999px). Çerçeveler 1px (panel) veya 2px (input, kart, seçim); seçili/sen durumunda çerçeve mora döner. Renkli tek taraflı kalın kenar çizgisi kullanılmaz.

İç öğeler (ör. koltuk içindeki overlay) için iç yarıçap = dış yarıçap − çerçeve kalınlığı (ör. 14px − 2px); ölçek dışı görünür ama kasıtlıdır.

## Components

### Buttons
- **Shape:** Hap (999px), yükseklik 44px; masaüstü satır içi küçük boy 36px (mobilde 44px).
- **Primary:** Mor dolgu, beyaz metin, 700.
- **Hover / Focus:** Hover'da koyu mor; basınca 1px aşağı; focus 3px mor halka, 2px offset.
- **Secondary / Ghost:** Kağıt zemin + kenar çizgisi, hover'da çerçeve ve metin mor; ghost şeffaf, hover'da keçe zemin. Silme `danger-ghost`.
- **Disabled:** %50 opaklık, `not-allowed`; ipucu gerekiyorsa `aria-disabled` ile odaklanabilir kalır.

### Chips
- **Durum çipi:** Keçe zemin, ikon + kelime; "Oy verdi" success-soft/success; facilitator rozeti warning-soft + taç ikonu.
- **Seçim çipi (puan):** 8px köşe, 2px çerçeve; seçili mor dolgu.

### Cards / Containers
- **Corner Style:** 22px (panel), 14px (koltuk, kart).
- **Background:** Kağıt; masa keçe.
- **Shadow Strategy:** Bkz. Elevation; koltuk gölgesiz.
- **Internal Padding:** 24px panel (mobil 16px), 12px koltuk.

### Inputs / Fields
- **Style:** 2px kenar, 8px köşe, 44px; etiket üstte 700, sayaç sağ altta tabular.
- **Focus:** 3px mor halka, çerçeve mor. **Error:** tehlike kırmızısı çerçeve + altında kalın mesaj, `aria-describedby`.

### Navigation
- **Topbar:** Krem zemin, alt kenar çizgisi, yapışık 56px; solda mor kare içinde çizili maça logosu, ortada oda linki (mono, keçe zemin) + "Linki kopyala", sağda tema düğmesi (ay/güneş ikonu). Mobilde logo yazısı ve link alanı gizlenir.

### Playing Card (imza)
64×92 (mobil 56×80), 14px köşe, kalın 800 rakam; hover'da 4px yukarı ve mor çerçeve, seçili mor dolgu + köşede ✓, 6px yukarı. ☕ kartı çizili fincan ikonuyla gösterilir. Masada oy verilmiş kart mor çizgili arka yüzle, boş koltuk kesikli çerçeveyle görünür.

### Results Panel (imza)
Durum bandı (fikir birliği yeşil, tartışmaya değer sarı), medyan mor zeminde display boyutunda, ortalama ikincil, dağılım hap çubukları, facilitator için puan seçimi + "Bu puanı kaydet".

## Do's and Don'ts

### Do:
- **Do** aksiyon ve seçimi yalnızca Kart Moru (#6C4DF5 / koyu #A895FF) ile işaretle.
- **Do** ikonları `Icon` bileşeninden al: 24px viewBox, 2px çizgi, yuvarlak uç.
- **Do** durumları ikon + kelime + soft zemin üçlüsüyle ver.
- **Do** sayıları `tabular-nums` ile yaz.
- **Do** her animasyonu `--dur`/`--ease` ile ver ve `prefers-reduced-motion` altında kapat.

### Don't:
- **Don't** başlık üstüne büyük harfli küçük etiket (kicker) koyma.
- **Don't** toast, liste satırı veya kartta 1px'ten kalın renkli tek taraflı kenar kullanma.
- **Don't** emoji veya unicode sembolü arayüz ikonu olarak kullanma (mikro metindeki 🎯 🎉 içerik sayılır).
- **Don't** masa içindeki koltuklara gölge ekleme (kart içinde kart).
- **Don't** mercan veya sarıyı metin rengi ya da tıklanabilir öğe rengi yapma.
