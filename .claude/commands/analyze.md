---
description: 3) Analiz — spec'i teknik plana çevirir (Opus)
argument-hint: <slug>
---

Use the **architect** subagent to analyze `docs/harness/specs/$ARGUMENTS.md` and write `docs/harness/analysis/$ARGUMENTS.md`.

Spec dosyası yoksa dur ve önce `/spec` çalıştırılmasını iste. Bittiğinde seçilen yaklaşımı 2-3 cümleyle özetle; sonraki adım olarak UI gereksinimi varsa `/design $ARGUMENTS`, yoksa `/implement $ARGUMENTS` öner.
