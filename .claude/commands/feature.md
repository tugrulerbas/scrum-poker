---
description: ★ Yeni feature — spec → analiz → tasarım → kod → front-end → review → revize hattını uçtan uca çalıştırır
argument-hint: <fikir veya backlog slug>
---

Yeni feature'ı uçtan uca geliştir: **$ARGUMENTS**

Aşağıdaki aşamaları **sırayla** çalıştır. Her aşama ilgili subagent ile yapılır; aşamalar birbirine yalnızca `docs/harness/` dokümanları ve slug üzerinden iş devreder. Her agent'a slug'ı ve okuyacağı doküman yollarını açıkça ver, sohbet geçmişini aktarma.

1. **spec-writer** (Sonnet) → `docs/harness/specs/<slug>.md`. Agent'ın döndürdüğü slug'ı sonraki tüm aşamalarda kullan.
2. **architect** (Opus) → `docs/harness/analysis/<slug>.md`.
   - ⏸ **Kontrol noktası:** Seçilen yaklaşımı ve spec'teki açık soruları kullanıcıya 3-5 satırla göster, onay iste. Onay gelmeden devam etme.
3. **ui-designer** (Sonnet) → `docs/harness/design/<slug>.md`. Analizde "UI gereksinimleri" boşsa bu aşamayı ve 5. aşamayı atla.
4. **implementer** (Opus) → kod.
5. **frontend-dev** (Opus) → arayüz.
6. **code-reviewer** (Opus) → `docs/harness/reviews/<slug>.md`.
7. **reviser** (Sonnet) → P0/P1/P2 bulgu varsa uygula.
   - Reviser "architect'e geri gönder" dediyse veya P0 kaldıysa dur ve kullanıcıya bildir. Review → revize döngüsünü en fazla 1 kez tekrarla.

Kurallar:
- Test aşaması yok; hiçbir agent'a test yazdırma.
- Build hatası bir aşamada çözülemezse dur ve raporla.
- Sonunda kısa bir özet ver: slug, değişen dosyalar, atlanan aşamalar, kalan açık noktalar.
