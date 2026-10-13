---
description: 9) GitHub'a gönder — kontrol, commit ve origin'e push (Sonnet). "pr <slug>" ile feature dalı + PR açar.
argument-hint: [commit mesajı] | pr <slug>
---

Use the **git-shipper** subagent to ship the current changes to GitHub.

Argümanlar: $ARGUMENTS
- Boşsa: mevcut dala commit + push, commit mesajını değişikliklerden üret.
- `pr <slug>` ile başlıyorsa: `feature/<slug>` dalı aç, commit, push ve PR oluştur.
- Aksi halde: argümanı commit başlığı olarak kullan.

Bittiğinde dal, commit hash'i, (varsa) PR linkini ve hariç tutulan dosyaları kısaca bildir. Kimlik hatası olursa kullanıcıya `gh auth login` çalıştırmasını söyle; kimlik bilgisi isteme.
