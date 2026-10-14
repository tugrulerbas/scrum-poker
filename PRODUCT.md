# Product

<!-- impeccable:product-schema 1 -->

> Not: Bu dosya kullanıcıyla görüşme yapılmadan, görev özeti ve `docs/harness/specs/scrum-poker-v1.md` + `docs/harness/design/scrum-poker-v1.md` üzerinden çıkarıldı. "Varsayım" etiketli maddeler doğrulanmadı.

## Platform

web

## Users

- **Facilitator** (genelde Scrum Master / takım lideri): planning toplantısını yönetir; oda kurar, linki paylaşır, story ekler, kartları açar, final puanı kaydeder.
- **Katılımcılar** (geliştirici, test, ürün): linke tıklayıp yalnızca isimle girer, gizlice kart seçer.
- Durum: canlı planning toplantısı, çoğunlukla video call sırasında; facilitator ekranını paylaşıyor olabilir. Masaüstü ağırlıklı, telefondan katılan da var.
- Ekip büyüklüğü: oda başına en fazla 20 kişi (spec varsayımı; tipik ekip boyutu doğrulanmadı).

## Product Purpose

Scrum ekiplerinin story point tahminini hesapsız, tek linkle ve çapa etkisi olmadan (gizli oy, eş zamanlı açılış) yapmasını sağlar. Başarı: oda kurmadan ilk oya kadar dakikalar değil saniyeler; tur sonunda ekip sonucu ve fikir birliğini tek bakışta görür ve sıradaki story'ye geçer.

## Positioning

Jira eklentilerinden daha samimi ve eğlenceli (oyun kartı masası, sıcak ton, "sen" dili), ama işi hızlı gören bir araç: hesap yok, kurulum yok, link + isim yeterli. Eğlence toplantıyı yavaşlatmaz.

## Operating Context

- Planning toplantısı ritüeli: story okunur → herkes oylar → kartlar açılır → tartışma ya da kayıt → sonraki story.
- Ekran paylaşımı: oda ekranı, video call penceresi içinde küçültülmüş veya başkasının paylaşımında görülebilir; sonuç ve ilerleme uzaktan okunabilir olmalı.
- Story'ler elle girilir (Jira entegrasyonu yok); başlık + isteğe bağlı açıklama/link.

## Capabilities and Constraints

- Mevcut (v1, `done`): oda kurma + link paylaşma, isimle katılma, gizli oy + eş zamanlı açılış, sonuç istatistikleri (ortalama, medyan, dağılım, fikir birliği / tartışmaya değer), story sırası ve özet.
- Deste: Fibonacci 0, 1, 2, 3, 5, 8, 13, 21, ?, ☕ (sabit; özel deste yok).
- Kalıcılık yok; odalar bellekte, süresi dolunca silinir. Hesap, e-posta, giriş yok.
- Sıradaki eğlenceli feature'lar (analiz edildi, henüz yok): kart çevirme animasyonu, fikir birliği konfetisi, emoji tepkileri, avatar seçimi, kahve molası ekranı, zamanlayıcı/dürtme.
- Terimler: "facilitator", "story", "oda", "masa", "deste", "Kartları aç", "Yeniden oyla", "Fikir birliği".
- Açık kararlar: facilitator devri kuralı, oda ömrü, gözlemci rolü (spec "Açık sorular").

## Brand Commitments

- Ad: "Mimeda Scrum Poker" (Mimeda ekibinin iç aracı; logo Mimeda logosu). Arayüz dili Türkçe, samimi "sen" hitabı.
- Oyun kartı / masa metaforu ürünün kimliği (spec ve tasarım dokümanında yerleşik).

## Evidence on Hand

- Müşteri, kullanım verisi, testimonial yok. Bunlar uydurulmamalı.

## Product Principles

1. **Sürtünme sıfır:** Hiçbir adımda hesap ya da gereksiz alan yok; isim tek zorunlu bilgi.
2. **Oy gizliliği kutsal:** Açılıştan önce hiçbir görsel/metinsel ipucu kimin ne oyladığını sızdırmaz.
3. **Toplantının ritmine hizmet et:** Durum (kim oy verdi, sıradaki adım) tek bakışta ve ekran paylaşımında uzaktan okunur.
4. **Eğlence süs değil, an:** Neşe açılış ve fikir birliği anlarında toplanır; günlük kontroller sakin ve hızlı kalır.

## Accessibility & Inclusion

- Metin kontrastı ≥4.5:1, durum renk + ikon + metinle verilir, klavye ile tam kullanım (deste radiogroup), `prefers-reduced-motion` ve `prefers-color-scheme` desteklenir (tasarım dokümanı).
- Mobil dokunma hedefi ≥44px.
