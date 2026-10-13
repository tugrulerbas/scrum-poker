---
description: 5) Analizi koda dökme — teknik planı uygular (Opus)
argument-hint: <slug>
---

Use the **implementer** subagent to implement `docs/harness/analysis/$ARGUMENTS.md` (spec: `docs/harness/specs/$ARGUMENTS.md`; design, if it exists: `docs/harness/design/$ARGUMENTS.md`).

Analiz dosyası yoksa dur ve önce `/analyze` çalıştırılmasını iste. Bittiğinde değişen dosyaları, sapmaları ve build sonucunu özetle; sonraki adım olarak tasarım dokümanı varsa `/frontend $ARGUMENTS`, yoksa `/review $ARGUMENTS` öner.
