# Analiz: Scrum Poker v1

Kapsam: room-create-share, join-with-name, private-vote-reveal, results-consensus, story-queue, card-flip-reveal, consensus-confetti, emoji-throw, avatar-picker, coffee-break-card, vote-timer-nudge.

## Mevcut durum
- Kod yok (greenfield). Kurulu: Node v24.14.1, npm 11.11.0.
- Stack bu analizde seçildi ve CLAUDE.md **Stack** bölümüne yazıldı.

## Seçilen yaklaşım
**Tek npm paketi, tek Node süreci.** Kökte tek `package.json`; `client/` (Vite + React + TS), `server/` (Node + Socket.IO), `shared/` (iki tarafın ortak tipleri ve saf fonksiyonları, göreli import ile).
- **Dev:** `node --watch server/index.ts` tek port (3000) açar; Vite `middlewareMode` ile aynı HTTP sunucusuna bağlanır (HMR dahil). Proxy, CORS ve `concurrently` gerekmez; socket aynı origin'de.
- **Prod:** `vite build` → `dist/client`; aynı sunucu `sirv` ile statik dosyaları + SPA fallback'i servis eder. Tek servis olarak Render/Fly/Railway'e deploy edilir (`PORT` env).
- **Sunucu TS'i derlenmez:** Node 24'ün yerleşik type stripping'i ile `.ts` doğrudan çalışır (tsx/esbuild gerekmez). Kısıt: yalnızca silinebilir TS sözdizimi (enum/namespace/parameter property yok), importlarda `.ts` uzantısı. `tsc --noEmit` build'de tip kontrolü yapar.
- **Gerçek zamanlı:** Socket.IO (oda yayını, ack callback, otomatik yeniden bağlanma, tipli event map'leri hazır). Reddedilen: `ws` (oda/ack/reconnect elle yazılır), SSE+REST (çift kanal).
- **Kalıcılık:** Bellek içi `Map<roomId, Room>`, TTL süpürücü. Reddedilen: SQLite/Redis (v1'de oda geçici; restart'ta odaların kaybı kabul).
- **Sunucu otoriter:** Tüm state ve kurallar sunucuda; istemci yalnızca niyet gönderir, her değişiklikte kişiselleştirilmiş snapshot alır. Reddedilen: diff/patch protokolü (≤20 kişide gereksiz karmaşıklık).
- **Router yok:** `location.pathname` ile `/` ve `/r/:roomId` ayrımı. **CSS:** düz CSS + CSS değişkenleri (Tailwind/UI kit yok).

### Bağımlılıklar (gerekçeli)
- Runtime: `react`, `react-dom`, `socket.io`, `socket.io-client`, `sirv` (küçük statik sunucu + SPA fallback; alternatif: express — gereksiz büyük), `canvas-confetti` (~6 KB, reduced-motion desteği var; alternatif: el yapımı CSS konfeti).
- Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`.
- Kimlik/ID: `crypto.randomBytes` (nanoid gerekmez). Doğrulama: elle yazılmış guard'lar (zod gerekmez).
- `vite` sunucuda yalnızca dev dalında dinamik import edilir → prod'da `npm ci --omit=dev` çalışır. `engines.node: ">=22.18"`.

## Sabitlenen teknik değerler
| Ad | Değer |
|---|---|
| Port | `PORT` env, varsayılan 3000 |
| Oda ID | 8 bayt rastgele → base64url (11 karakter); link `/r/<id>` |
| Katılımcı token | 16 bayt rastgele base64url; yalnızca sahibine gönderilir |
| Oda ömrü | Çevrimiçi kimse yokken son aktiviteden **2 saat** sonra silinir; süpürücü 5 dk'da bir |
| Maks. oda | 5000 (aşılırsa `room:create` → `SERVER_BUSY`) |
| Katılımcı limiti | Oda başına **20** (çevrimdışılar dahil) |
| Çevrimdışı katılımcı temizliği | **15 dk** çevrimdışı kalan listeden (ve oyu turdan) silinir |
| Facilitator devri bekleme | Facilitator'ın tüm socket'leri kopunca **30 sn** grace, sonra en eski çevrimiçi katılımcıya |
| İsim | trim sonrası 1–24 karakter (code point); büyük/küçük harf duyarsız benzersiz |
| Story | maks. 200; başlık ≤120, açıklama/link ≤500 karakter |
| Zamanlayıcı | 30 / 60 / 120 sn |
| Mola süresi | 5 dk; bitince otomatik kapanır, facilitator erken bitirebilir |
| Tepki limiti | Kişi başı 10 sn'de 5 tepki/fırlatma |
| Dürtme bekleme | Aynı hedefe 15 sn |
| Deste | `0,1,2,3,5,8,13,21,?,☕` (sabit) |
| Tepki paleti | 👍 😂 🤔 🔥 🎉 📄 (sunucuda beyaz liste) |

Açık sorulara karar: spec varsayımlarının hepsi kabul (otomatik facilitator devri, gözlemci yok, şifre yok, süre dolunca otomatik açılış yok, medyana en yakın kart önerilir, yalnızca Fibonacci, sesli dürtme varsayılan kapalı).

## Veri modeli değişiklikleri
Sunucu (bellek, `server/`):
- `Room { id, createdAt, lastActivityAt, facilitatorId, participants: Map<id, Participant>, stories: Story[], activeStoryId: string|null, round: Round, timer: {roundId, endsAt}|null, breakState: {endsAt}|null }`
- `Participant { id, token, name, avatar, joinedAt, socketIds: Set<string>, offlineSince: number|null, reactionTimes: number[], lastNudgedAt: number|null }` — `online = socketIds.size > 0`.
- `Round { id: number (artan), status: 'voting'|'revealed', votes: Map<participantId, Card>, revealedAt: number|null }`
- `Story { id, title, description: string, points: Card|null }` — sıra dizideki konum.
- `Card = '0'|'1'|'2'|'3'|'5'|'8'|'13'|'21'|'?'|'☕'`

İstemciye giden projeksiyon (`shared/types.ts` → `RoomView`):
- `{ id, serverNow, facilitatorId, participants: [{id, name, avatar, online, hasVoted}], stories, activeStoryId, round: {id, status, votes?: Record<pid, Card>}, timer, breakState, you: {id, vote: Card|null} }`
- **Oy gizliliği:** `round.votes` yalnızca `status === 'revealed'` iken doldurulur. Voting sırasında başkalarının oyu hiçbir payload'da yer almaz; yalnızca `hasVoted` boolean'ı. Kişinin kendi oyu yalnızca kendi socket'lerine `you.vote` ile gider. Bu yüzden `room:state` oda yayını değil, **socket başına** üretilir (`view.ts`). Token hiçbir view'da yoktur.
- Kimlik her zaman `socket.data.{roomId, participantId}`'den alınır; payload'daki kimliğe güvenilmez.

### Socket event'leri
Client→server (hepsi ack'li: `{ok:true, ...} | {ok:false, error: Kod, ...}`):
- `room:create {name, avatar}` → `{roomId, participantId, token}`
- `room:join {roomId, name, avatar}` → `{participantId, token}` | `ROOM_NOT_FOUND`, `ROOM_FULL`, `INVALID_NAME`, `NAME_TAKEN {suggestion}`
- `room:rejoin {roomId, participantId, token}` → ok | `ROOM_NOT_FOUND`, `INVALID_TOKEN` (istemci isim ekranına düşer)
- `profile:update {avatar}`
- `vote:cast {roundId, card|null}` (null = geri çek; yalnızca voting'de ve kişinin oy hakkı varsa)
- `round:reveal {roundId}`, `round:revote {roundId}` — F (facilitator)
- `story:add {title, description}`, `story:update {storyId, title, description}`, `story:delete {storyId}`, `story:move {storyId, toIndex}`, `story:activate {storyId}`, `story:setPoints {storyId, card}`, `story:next {}` — F
- `timer:start {seconds}`, `timer:stop {}` — F
- `break:end {}` — F
- `nudge:send {targetId}` — F
- `reaction:send {emoji, targetId?}`

Server→client:
- `room:state RoomView` (her mutasyondan sonra odadaki her socket'e kendi view'ı)
- `reaction {id, fromId, emoji, targetId?}`
- `nudge {}` (yalnızca hedefin socket'lerine)
- `timer:expired {roundId}`
- `notice {code}` — `ACTIVE_STORY_DELETED` (facilitator'a), `FACILITATOR_CHANGED` (herkese)
- Ortak hata kodları: `NOT_FACILITATOR`, `STALE_ROUND`, `RATE_LIMITED {retryAfterMs}`, `INVALID_INPUT`, `TARGET_OFFLINE`, `COOLDOWN`.

### Temel kurallar
- **Oy hakkı:** tur `voting` iken odadaki herkes; reveal sonrası katılan o turu yalnızca izler (zaten voting yok), sonraki turdan itibaren oy verir.
- **Açılış yalnızca manuel:** `round:reveal` (facilitator). Otomatik açılış kaldırıldı (2026-10-14): tek kişilik odada ilk oy turu açıp oyu kilitliyor, sonradan katılanları oy veremez halde bırakıyordu.
- **Eşzamanlılık:** Node tek thread → event'ler sıralı. `reveal`/`revote`/`vote:cast` `roundId` taşır; güncel tur değilse `STALE_ROUND` ile yok sayılır → çift tıklama tek sonuç.
- **Revote / story:next / story:activate:** yeni `Round` (id+1, votes boş), `timer=null`.
- **Mola:** reveal anında tüm oylar ☕ ise (≥1 oy) `breakState={endsAt: now+5dk}`; süre dolunca veya `break:end` ile kapanır ve aynı story'de yeni tur açılır.
- **Zamanlayıcı:** sunucu `endsAt` tutar, `setTimeout` ile `timer:expired` yayar, otomatik açmaz. Reveal/revote/next/herkes oy verdi → `timer=null`. İstemci kalan süreyi `endsAt - (Date.now() + (serverNow - clientNowAtReceive))` ile hesaplar (saat kayması düzeltmesi) → yenileme/geç katılımda doğru.
- **Dürtme:** hedef çevrimiçi, kendisi değil, oy vermemiş, tur voting, 15 sn cooldown. Payload'da yeni bilgi yok.
- **Tepki:** emoji beyaz listede; `targetId` varsa çevrimiçi ve kendisi olmamalı; kayan pencere limiti. Oy/tur bilgisi içermez.

### Facilitator devri
- Facilitator'ın son socket'i koparsa 30 sn timer kurulur (sayfa yenilemesi için). Bu sürede geri dönerse iptal.
- Süre dolunca `joinedAt`'e göre en eski çevrimiçi katılımcı facilitator olur, `FACILITATOR_CHANGED` yayılır. Çevrimiçi kimse yoksa değişmez; ilk dönen/katılan çevrimiçi kişi `ensureFacilitator()` ile alır (facilitator çevrimdışı ve grace dolmuşsa).
- Eski facilitator geri dönünce yetkiyi geri almaz. Elle devir v1'de yok.

### Yeniden bağlanma
- Create/join ack'i `{participantId, token}` döner → `localStorage['sp:room:<roomId>'] = {participantId, token}`; `localStorage['sp:profile'] = {name, avatar}` (isim formunu ve avatarı önceden doldurur).
- Oda sayfası açılınca kayıt varsa `room:rejoin`; Socket.IO otomatik reconnect'inde de `connect` event'inde aynı çağrı tekrarlanır. Başarılıysa aynı isim/avatar/oy ile devam.
- Aynı katılımcının birden çok sekmesi olabilir (`socketIds` set'i); son socket kopunca `offlineSince` set edilir.
- `INVALID_TOKEN`/katılımcı silinmişse kayıt temizlenir, isim ekranı gösterilir. `ROOM_NOT_FOUND` → "Oda bulunamadı" ekranı.

## Dosya bazlı değişiklik planı
- `package.json` — `"type": "module"`, scriptler (`dev`, `build`, `start`, `typecheck`), `engines.node`.
- `tsconfig.json` — strict, `noEmit`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `jsx: react-jsx`; client/server/shared kapsar.
- `vite.config.ts` — `root: 'client'`, `build.outDir: '../dist/client'`, react plugin.
- `shared/types.ts` — `Card`, `RoomView`, `ClientToServerEvents`, `ServerToClientEvents`, ack/hata tipleri.
- `shared/constants.ts` — deste, avatar listesi, tepki paleti, tüm sabit limitler (yukarıdaki tablo).
- `shared/stats.ts` — `computeResults(votes)`: ortalama, medyan, dağılım, sayısal olmayanlar, konsensüs, dağınıklık, önerilen kart. Saf fonksiyon; istemcide kullanılır.
- `server/index.ts` — HTTP sunucu; dev'de Vite middleware, prod'da `sirv('dist/client', {single:true})`; Socket.IO bağlama; süpürücü başlatma.
- `server/rooms.ts` — oda deposu, ID/token üretimi, TTL ve çevrimdışı katılımcı süpürücüsü.
- `server/room-logic.ts` — oda mutasyonları (join, vote, reveal, revote, story işlemleri, mola, zamanlayıcı, facilitator seçimi). Socket'ten bağımsız.
- `server/view.ts` — `toView(room, participantId)` projeksiyonu (gizlilik burada).
- `server/handlers.ts` — event bağlama, kimlik/yetki kontrolü, ack, rate limit, socket başına `room:state` yayını.
- `server/validate.ts` — isim/story/kart/emoji/sayı guard'ları.
- `client/index.html`, `client/src/main.tsx`, `client/src/App.tsx` — path'e göre Home/Room.
- `client/src/socket.ts` — tipli tekil `io()` istemcisi; `client/src/identity.ts` — localStorage yardımcıları (try/catch).
- `client/src/useRoom.ts` — bağlanma/rejoin, `RoomView` state'i, aksiyon fonksiyonları, olay abonelikleri (reaction/nudge/notice/timer).
- `client/src/pages/` — `Home.tsx`, `Room.tsx`.
- `client/src/components/` — `NameForm` (+`AvatarPicker`), `ShareLink`, `Table` (katılımcı kartları/avatarlar), `Deck`, `PlayingCard` (flip), `VoteProgress`, `FacilitatorControls`, `Results`, `StoryQueue`, `StorySummary`, `Timer`, `ReactionBar`, `ReactionLayer`, `BreakScreen`, `RoomNotFound`, `Toasts`.
- `client/src/styles.css` — tema değişkenleri, kart 3D flip, `prefers-reduced-motion` kuralları.

Not: `room-logic.ts` veya `Room.tsx` 400 satırı geçerse feature bazlı bölünmeli (ör. `stories.ts`, `fun.ts`).

## Uygulama adımları
1. **İskelet** — package.json, tsconfig, vite config, `server/index.ts` (Vite middleware/sirv + boş Socket.IO), `client` boş Home. `npm run dev` ve `npm run build && npm start` çalışır.
2. **Oda/link** — `shared/types` + `constants`, `rooms.ts`, `room:create`, `/r/:id` rotası, `ShareLink` (kopyala + seçilebilir fallback), `RoomNotFound`, TTL süpürücü, facilitator rozeti.
3. **Katılım** — `room:join`/`room:rejoin`, `identity.ts`, isim doğrulama + `NAME_TAKEN` öneri (ör. "Ali (2)"), limit 20, çevrimiçi/çevrimdışı, facilitator devri, çevrimdışı temizliği, `view.ts`.
4. **Oylama/reveal** — `Deck`, `vote:cast` (değiştir/geri çek), `hasVoted` + `VoteProgress` ("4/6 oy verdi"), otomatik ve manuel reveal (oy yoksa pasif), `revote`, `STALE_ROUND`. Gizlilik projeksiyonu bu adımda tamamlanır.
5. **Sonuçlar** — `shared/stats.ts`, `Results` (ortalama tr-TR biçimli, medyan, dağılım, ?/☕ ayrı, "Fikir birliği", "Tartışmaya değer" + en düşük/yüksek oyu verenler, tümü "?" ise "Belirsiz"), `story:setPoints` önerilen kartla (story yoksa kayıt butonu gizli).
6. **Story kuyruğu** — ekle/düzenle/sil/taşı (yukarı-aşağı butonları; sürükle-bırak gerekmez)/aktif yap, `story:next` (sıradaki puansız story), puan rozeti, aktif story silinince oy temizleme + notice, `StorySummary` (toplam = sayısal puanların toplamı), story'siz hızlı tur.
7. **Eğlenceli feature'lar** (her biri ayrı çalışır halde):
   a. avatar-picker — `AvatarPicker`, isimden hash'le otomatik avatar, `profile:update`, localStorage'da hatırlama, baş harf fallback.
   b. card-flip-reveal — `PlayingCard` CSS 3D flip, kısa kademeli gecikme (toplam ≤1,5 sn), sonuç paneli animasyon bitince; ilk yüklemede zaten açıksa animasyonsuz.
   c. consensus-confetti — yalnızca canlı voting→revealed geçişinde ve flip sonrası, `consensus` true ise; reduced-motion'da statik vurgu. (Yenilemede başlangıç state'i revealed olduğundan tekrar patlamaz.)
   d. coffee-break-card — ☕ kartı zaten destede; reveal'da mola kuralı, `BreakScreen` (geri sayım, F için "Molayı bitir").
   e. vote-timer-nudge — `timer:start/stop`, `Timer` göstergesi, "Süre doldu" bildirimi, oy vermeyen çevrimiçi kişilerin yanında "Dürt" (F), hedefte toast + opsiyonel Web Audio bip (varsayılan kapalı, localStorage tercihi).
   f. emoji-throw — `ReactionBar` (oda geneli), katılımcıya tıklayınca emoji menüsü → hedefe uçan animasyon, hedefe bildirim, `RATE_LIMITED` mesajı, "Animasyonları kapat" yerel ayarı, reduced-motion'da statik rozet.

## UI gereksinimleri
Ekranlar:
- **Ana sayfa** — ürün başlığı, isim + avatar seçimi, "Oda kur".
- **Katılım (isim) ekranı** — `/r/:id` ilk girişte; isim, avatar seçici, uyarılar (boş/uzun/aynı isim + öneri, oda dolu).
- **Oda bulunamadı** — açıklama + "Yeni oda kur".
- **Oda ekranı** — üst bar (oda linki + kopyala, facilitator rozeti, zamanlayıcı, animasyon/ses ayarları); orta masa (katılımcı avatarları, oy durumu/çevrimdışı, açılınca kartlar); alt deste; yan panel story kuyruğu (F için düzenleme kontrolleri); facilitator kontrolleri (Kartları aç, Yeniden oyla, Sonraki story, süre seç); sonuç paneli; tepki çubuğu.
- **Özet görünümü** — tüm story'ler puanlanınca story/puan listesi + toplam.
- **Mola ekranı** — tam ekran overlay, geri sayım, F için "Molayı bitir".
- Bileşen durumları: kart (seçili, pasif, kapalı arka yüz, açık), katılımcı (oy verdi/bekliyor/çevrimdışı/facilitator), toast'lar (kopyalandı, dürtüldün, süre doldu, facilitator değişti, rate limit).
- Erişilebilirlik: kartlar buton, klavyeyle seçilebilir; tüm animasyonlar `prefers-reduced-motion`'a uyar. Mobilde tek sütun (story paneli altta/açılır).

## Riskler ve edge case'ler
- Sunucu restart'ı tüm odaları siler (bellek). v1'de kabul; istemci `ROOM_NOT_FOUND` ekranını gösterir.
- Ücretsiz hostlarda uyku/yeniden başlatma aynı etkiyi yapar; ayrıca birden çok instance'a ölçeklenemez (tek instance şart, sticky gerekmez).
- Node type stripping: enum/namespace kullanılırsa sunucu açılmaz → union tipler kullan. Deploy ortamında Node ≥22.18 olmalı.
- Gizlilik regresyonu: her yeni view alanı `view.ts`'ten geçmeli; `io.to(room).emit('room:state', ...)` ile ortak yayın yapılmamalı.
- Grace süresinde facilitator yokken F aksiyonları kimse tarafından yapılamaz (30 sn kabul).
- Aynı cihazda iki sekme = aynı katılımcı; farklı tarayıcı = yeni katılımcı (isim çakışması uyarısı devreye girer).
- Clipboard API yoksa/izin yoksa link input'u seçili gösterilir.
- XSS: tüm kullanıcı metni React ile metin olarak render edilir; `dangerouslySetInnerHTML` yok. Story linki yalnızca `http(s)://` ile başlıyorsa `<a rel="noopener noreferrer" target="_blank">`.
- Oda ID tahmini: 64 bit rastgelelik; `room:join` denemelerinde ayrıca limit gerekmez (v1).

## Kabul kriteri → adım eşlemesi
| Feature | Adım |
|---|---|
| room-create-share | 2 (facilitator devri: 3) |
| join-with-name | 3 (oy koruma: 4) |
| private-vote-reveal | 4 |
| results-consensus | 5 |
| story-queue | 6 |
| avatar-picker | 7a |
| card-flip-reveal | 7b |
| consensus-confetti | 7c |
| coffee-break-card | 7d |
| vote-timer-nudge | 7e |
| emoji-throw | 7f |

## Notlar
- Sürükle-bırak sıralama, elle facilitator devri, gözlemci rolü, kalıcı depolama v1 dışında; sonraki tur adayları.
