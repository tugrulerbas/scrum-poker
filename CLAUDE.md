# scrum-poker

Scrum ekiplerinin story point tahmini yaptığı web uygulaması (Planning Poker). Ekip bir odada toplanır, herkes gizlice kart seçer, oylar aynı anda açılır. Arayüz dili Türkçe.

## Stack

Gerekçe ve detaylar: `docs/harness/analysis/scrum-poker-v1.md`.

- **Yapı:** Tek npm paketi (kök `package.json`, `"type": "module"`). Kaynak kod `src/` yerine kökte: `client/` (frontend), `server/` (backend), `shared/` (ortak tipler + saf fonksiyonlar, göreli `.ts` import).
- **Frontend:** Vite + React + TypeScript, router yok (`/` ve `/r/:roomId`), düz CSS (CSS değişkenleri). Konfeti için `canvas-confetti` (consensus-confetti feature'ı gelince eklenecek; şu an kurulu değil).
- **Backend:** Node ≥22.18 (lokal: 24), TypeScript derlenmeden Node type stripping ile çalışır (enum/namespace yok, importlarda `.ts` uzantısı). Statik servis `sirv`.
- **Gerçek zamanlı:** Socket.IO (tipli event map'leri `shared/types.ts`'te). Sunucu otoriter; her değişiklikte socket başına `room:state` snapshot'ı.
- **Kalıcılık:** Yok; odalar bellekte, TTL ile temizlenir. Hesap/harici servis yok.
- **Tek süreç:** Aynı Node süreci Socket.IO + frontend'i tek porttan (`PORT`, varsayılan 3000) servis eder; dev'de Vite middleware modu, prod'da `dist/client`.

- Kurulum: `npm install`
- Çalıştırma (dev): `npm run dev` → `node --watch-path=server --watch-path=shared server/index.ts` → http://localhost:3000
- Build: `npm run build` → `tsc --noEmit && vite build` (çıktı `dist/client`)
- Çalıştırma (prod): `npm start` → `NODE_ENV=production node server/index.ts`

## Harness hattı

Her aşamanın bir subagent'ı (`.claude/agents/`) ve bir komutu (`.claude/commands/`) var. Aşamalar `docs/harness/` altındaki dosyalarla birbirine iş devreder.

| # | Aşama | Komut | Agent | Model | Çıktı |
|---|-------|-------|-------|-------|-------|
| 1 | Feature bulma | `/discover` | feature-scout | Sonnet 5.5 | `docs/harness/backlog.md` |
| 2 | Feature yazma (spec) | `/spec <fikir>` | spec-writer | Sonnet 5.5 | `docs/harness/specs/<slug>.md` |
| 3 | Analiz | `/analyze <slug>` | architect | **Opus 5.5** | `docs/harness/analysis/<slug>.md` |
| 4 | Tasarım (Impeccable `shape`) | `/design <slug>` | ui-designer | Sonnet 5.5 | `docs/harness/design/<slug>.md` |
| 5 | Analizi koda dökme | `/implement <slug>` | implementer | **Opus 5.5** | `src/` değişiklikleri |
| 6 | Front-end yazma (Impeccable `craft-floor` + `polish` + `detect`) | `/frontend <slug>` | frontend-dev | **Opus 5.5** | `src/` UI + CSS |
| 7 | Kod inceleme | `/review <slug>` | code-reviewer | **Opus 5.5** | `docs/harness/reviews/<slug>.md` |
| 8 | Kodu revize etme | `/revise <slug>` | reviser | Sonnet 5.5 | `src/` düzeltmeleri |
| 9 | GitHub'a gönderme | `/ship [mesaj]` · `/ship pr <slug>` | git-shipper | Sonnet 5.5 | commit + push (+ PR) |
| ★ | Yeni feature (uçtan uca) | `/feature <fikir>` | hepsi sırayla | — | 2→8, sonunda `/ship` önerilir |

`<slug>`: kebab-case feature adı (ör. `room-create`). Tüm aşamalar aynı slug'ı kullanır.

Durum takibi `docs/harness/backlog.md` içinde: `idea → spec → analyzed → designed → implemented → reviewed → done`.

## Front-end tasarım: Impeccable

Tüm tasarım ve front-end işleri [Impeccable](https://github.com/pbakaus/impeccable) skill'iyle yapılır (`.claude/skills/impeccable/`, upstream commit `UPSTREAM_COMMIT` dosyasında, Apache 2.0).
- Ürün bağlamı `PRODUCT.md`, tasarım sistemi `DESIGN.md` (proje kökünde) — Impeccable bunları okur ve günceller.
- Elle kullanım: `/impeccable <komut> <hedef>` — ör. `/impeccable critique oda ekranı`, `/impeccable polish`, `/impeccable delight`.
- Detector: `.claude/skills/impeccable/scripts/impeccable detect client/src` (LLM'siz, deterministik).
- Upstream'deki edit/stop hook'ları token tasarrufu için kurulu değil; detector front-end ve review aşamalarında elle çalıştırılır.
- Güncelleme: `npx impeccable update` veya repo'dan `.claude/skills/impeccable` klasörünü yeniden kopyala.

## Kurallar (tüm agent'lar için)

- **Test yok.** Bu aşamada test yazma, test çalıştırma, `*.test.js` dosyası oluşturma. Doğrulama için en fazla build komutu (Stack bölümü; yalnızca implement/frontend/revise sonunda, bir kez).
- **Token tasarrufu:** Sadece ihtiyaç duyulan dosyaları oku; önceki aşamanın dokümanı yeterliyse kodu baştan tarama. Dokümanlar kısa ve madde madde olsun, kodu dokümana kopyalama.
- Mevcut kod stiline uy (kod oluştuktan sonra), Türkçe UI metinleri, yorum yoğunluğu az. Gereksiz kütüphane ekleme.
- Yeni npm bağımlılığı eklemek gerekiyorsa analizde gerekçesiyle belirt; implementer onaysız eklemez.
- Kapsam dışına çıkma: spec'te olmayan şeyi yapma, gördüğün ayrı sorunları dokümanın "Notlar" kısmına yaz.

## Git / GitHub

- Remote: `origin` → https://github.com/tugrulerbas/scrum-poker (varsayılan dal `main`).
- Gönderme her zaman `/ship` (git-shipper) ile: istenmeyen dosya + gizli bilgi kontrolü, build, commit, push. Force push yok.
- Kimlik: `gh auth login` (kullanıcı yapar). Agent'lar kimlik bilgisi istemez/girmez.
