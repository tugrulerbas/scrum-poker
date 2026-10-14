# Analiz: GIF Gönderme (gönderenin kendi kartında)

Spec: `docs/harness/specs/gif-send.md`. Yeni npm bağımlılığı yok.

## Mevcut durum
- Sunucu otoriter; kalıcı değişiklikler `inRoom()` sarmalayıcısıyla işlenir ve her başarıda `room:state` yayınlanır (`server/handlers.ts`). Geçici olaylar için örnek: `notice` event'i + `emitToParticipant()`.
- Hız sınırı: `server/rate-limit.ts` → `createLimiter(max, windowMs)(key)` (kayan pencere, bellek içi).
- Doğrulama: `server/validate.ts` (`isObject`, `cleanText`...). Paylaşılan saf fonksiyonlar `shared/` altında.
- Masa: `client/src/components/Table.tsx` her katılımcı için `<li className="seat ...">`; kendi koltuğu `seat-you`. Koltukta tıklama etkileşimi yok (oy `Deck` ile verilir) → koltuktaki buton oy seçimiyle çakışmaz.
- Oda state'i `client/src/useRoom.ts`; ack'li çağrı `call()` (`client/src/socket.ts`); bildirim `useToast()` (`client/src/toasts.tsx`).
- Gözlemci rolü yok; her katılımcının koltuğu var. emoji-throw henüz koda dökülmemiş.
- Sunucu CSP/güvenlik başlığı göndermiyor → harici `https` görseller `<img>` ile yüklenebilir.

## Seçilen yaklaşım
Geçici, durumsuz "relay" olayı: istemci `gif:send { url }` gönderir; sunucu URL'yi doğrular, hız sınırını uygular, odadaki tüm çevrimiçi katılımcılara (gönderen dahil) `gif { id, fromId, url }` yayar. **GIF gönderenin (`fromId`) koltuğunda oynar**; hedef seçimi yok (kullanıcı kararı). Sunucu GIF'i saklamaz, `RoomView`'a eklemez, URL'yi fetch etmez (SSRF yok). İstemci koltuk (fromId) başına tek aktif GIF tutar, `<img>` yüklenince 4 sn gösterir, sonra siler.

URL doğrulaması `shared/gif.ts` içinde tek saf fonksiyon; istemci (satır içi hata) ve sunucu (otorite) aynı kodu kullanır.

Reddedilenler:
- Hedef seçimi (`<select>` / karta tıklama): kullanıcı kararıyla kapsam dışı.
- GIF'i `RoomView`'a koymak: her değişiklikte snapshot yayını, süre yönetimi sunucuya geçer, geç katılan eski GIF'i görür.
- Sunucuda URL fetch + Content-Type kontrolü: SSRF riski + gecikme; istemci önizlemesi aynı işi görür.
- Giphy/Tenor alan adı beyaz listesi: spec dışı.
- emoji-throw ile ortak katman: o feature kodda yok; şimdi soyutlama gereksiz.

## Açık sorulara kararlar
1. **Hedef:** (c) — hedef seçimi yok; GIF gönderenin kendi kartında, odadaki herkese görünür. Kendine gönderim / hedefin ayrılması soruları ortadan kalkar.
2. **Süre:** Sabit `GIF_SHOW_MS = 4000`, görsel yüklendiği andan itibaren. Yükleme `GIF_LOAD_TIMEOUT_MS = 5000` içinde bitmezse sessizce düşer.
3. **Kabul edilen linkler:** `https:` + varsayılan port + kullanıcı bilgisi yok + IP literal / localhost / yerel alan adı değil + ≤500 karakter. Uzantı/alan adı beyaz listesi yok. "Görsel mi" kontrolü istemci önizlemesiyle; önizleme yüklenmeden Gönder pasif.
4. **Engelleme:** Yalnızca kişinin kendi ekranı için; üst barda "GIF'leri gizle" (localStorage). Facilitator engellemesi yok.
5. **Yetki:** Tüm katılımcılar gönderebilir; herkes görür.
6. **Gönderen etiketi:** Normal modda ayrı etiket yok (GIF zaten gönderenin koltuğunda, ad koltukta yazıyor).
7. **Hareketi azalt:** `<img>` render edilmez; yalnızca "GIF gönderdi" etiketi 4 sn (animasyonsuz).
8. **Hız sınırı:** Gönderen başına 10 sn'de 1 (`GIF_COOLDOWN_MS`), oda başına dakikada 10 (`RATE_GIF_ROOM_MAX`, `RATE_WINDOW_MS`).
9. **emoji-throw:** Bağımsız; yalnızca overlay CSS sınıfı yeniden kullanılabilir adlandırılır.

## Veri modeli değişiklikleri
`shared/constants.ts`:
- `GIF_URL_MAX = 500`, `GIF_SHOW_MS = 4000`, `GIF_LOAD_TIMEOUT_MS = 5000`, `GIF_COOLDOWN_MS = 10_000`, `RATE_GIF_ROOM_MAX = 10`.

`shared/types.ts`:
- `ErrorCode`'a: `'RATE_LIMITED'` (yoksa). `INVALID_TARGET` eklenmez.
- `ClientToServerEvents`: `'gif:send': (p: { url: string }, ack: AckFn) => void;`
- `export interface GifEvent { id: string; fromId: string; url: string }`
- `ServerToClientEvents`: `gif: (g: GifEvent) => void;`
- `RoomView` / `Participant` değişmez → geriye uyumlu; eski istemci `gif`'i yok sayar.

`shared/gif.ts` (yeni, saf):
```ts
export type GifUrlCheck =
  | { ok: true; url: string }   // new URL(...).href
  | { ok: false; reason: 'EMPTY' | 'TOO_LONG' | 'INVALID' | 'NOT_HTTPS' | 'CREDENTIALS' | 'PRIVATE_HOST' };
export function checkGifUrl(v: unknown): GifUrlCheck
```
Kurallar (sırayla): string değil/trim sonrası boş → EMPTY; `> GIF_URL_MAX` → TOO_LONG; `new URL()` atarsa → INVALID; `protocol !== 'https:'` → NOT_HTTPS; `username || password` → CREDENTIALS; `port !== ''` → INVALID; hostname IPv4 kalıbı (`/^\d+(\.\d+){3}$/`) veya `[` ile başlıyor (IPv6) veya `localhost` / `*.localhost` / `*.local` / `*.internal` / `*.lan` / `*.home.arpa` veya nokta içermiyor → PRIVATE_HOST.

Sunucu bellek state'i: yeni alan yok; yalnızca iki limiter.

## Dosya bazlı değişiklik planı
- `shared/constants.ts` — 5 sabit.
- `shared/types.ts` — `RATE_LIMITED`, `gif:send`, `GifEvent`, `gif`.
- `shared/gif.ts` — `checkGifUrl` (yeni).
- `server/handlers.ts`:
  - Modül seviyesi: `gifUserLimit = createLimiter(1, GIF_COOLDOWN_MS)`, `gifRoomLimit = createLimiter(RATE_GIF_ROOM_MAX, RATE_WINDOW_MS)`, `let gifSeq = 0`.
  - `gif:send` için **ayrı** `socket.on` (inRoom gereksiz `room:state` yayını yapar). Akış: ack fonksiyon değilse no-op → oda/katılımcı yoksa `NOT_IN_ROOM` → `!isObject(p)` veya `checkGifUrl(p.url)` başarısız → `INVALID_INPUT` → `!gifUserLimit(`${room.id}:${pid}`)` veya `!gifRoomLimit(room.id)` → `RATE_LIMITED` → her çevrimiçi katılımcıya `emitToParticipant(..., s => s.emit('gif', { id: String(++gifSeq), fromId: pid, url: check.url }))` → `ack({ ok: true })`.
  - Doğrulama limitlerden önce (geçersiz istek kota yemez).
- `client/src/useGifs.ts` (yeni hook):
  - `useGifs(view)` döner: `{ active: Record<fromId, ActiveGif>, dismiss(fromId, id), muted, setMuted, send(url): Promise<boolean>, cooldownUntil }`. `ActiveGif = { id, url }`.
  - `socket.on('gif')`: `muted` veya `document.hidden` ise yok say; değilse `active[fromId] = g` (aynı koltuktaki eskiyi değiştirir).
  - `visibilitychange` → gizlenince `active = {}`.
  - `view` değişince gönderen artık çevrimiçi/odada değilse girdiyi sil.
  - `muted`: localStorage `sp-gif-muted` (`'1'`); açılınca `active = {}`.
  - `send(url)`: `call('gif:send', { url })`; başarı → `toast('GIF gönderildi', 'success')` + `cooldownUntil = Date.now() + GIF_COOLDOWN_MS` (+ bitişte rerender için setTimeout). Hatalar: `RATE_LIMITED` → "Biraz bekle, sonra tekrar gönderebilirsin." (warning, cooldown başlar); `INVALID_INPUT` → "Bu link kabul edilmedi."; diğer → `GENERIC_ERROR`.
- `client/src/components/GifOverlay.tsx` (yeni) — tek koltuk için oynayan GIF. Props: `gif`, `reducedMotion`, `onDone()`. `id` değişince timer'lar sıfırlanır: 5 sn yükleme zaman aşımı → `onDone`; `onLoad` → görünür + 4 sn sonra `onDone`; `onError` → `onDone`. Yüklenene kadar `opacity:0`. `<img referrerPolicy="no-referrer" decoding="async" alt="">`. Reduced motion: img yok, "GIF gönderdi" etiketi + 4 sn timer.
- `client/src/components/GifPanel.tsx` (yeni) — popover: URL input, önizleme, Gönder. Props: `cooldownUntil`, `disabled` (offline), `onSend(url) => Promise<boolean>`, `onClose()`. State: `url`, `preview: 'idle'|'loading'|'loaded'|'error'`. Gönder koşulu: `checkGifUrl` ok + preview `loaded` + cooldown yok + `!disabled`. Başarıda `onClose()`. Esc ve dışarı tıklama (panel ve tetikleyici hariç) kapatır; açılınca input'a, kapanınca GIF butonuna odak.
- `client/src/components/GifToggle.tsx` (yeni) — üst bar anahtarı, `ThemeToggle` stilinde; `aria-pressed={muted}`, "GIF'leri gizle".
- `client/src/components/Table.tsx` — yeni props: `gifs`, `onGifDone(fromId, id)`, `reducedMotion`, `gifSlot?: ReactNode`. Her koltukta `p.online && gifs[p.id]` ise `<GifOverlay>`; `isYou` koltuğunda `gifSlot`. Mantık taşımaz.
- `client/src/pages/Room.tsx` — `useGifs`; `gifOpen` state'i; kendi koltuk için GIF butonu (`aria-haspopup="dialog"`, `aria-expanded`, cooldown'da `disabled` + `title="Biraz bekle"`) + açıkken `GifPanel`; `useMediaQuery('(prefers-reduced-motion: reduce)')` Table'a; `GifToggle` `topbar-end`'e. `showSummary` olursa panel kapanır.
- `client/src/styles.css` — `.seat { position: relative }`, `.seat-overlay` (kart alanını kaplar, `pointer-events:none`), `.gif-btn` (köşe; overlay'in **üstünde** z-index, kendi GIF'i oynarken de erişilebilir; varsayılan `opacity:0`, `.seat-you:hover` / `:focus-within` / `[aria-expanded=true]` / `@media (hover: none)` altında görünür), `.gif-panel`, önizleme kutusu (maks. boyut, `object-fit: contain`), `.gif-label`. Gizleme `opacity` ile (klavye odağı çalışsın).

`Room.tsx` 257 satır; büyürse buton + panel tek `GifSender` bileşenine alınabilir (implementer kararı).

## Uygulama adımları
1. **Shared:** sabitler, tipler, `shared/gif.ts`. Davranış değişmez.
2. **Sunucu:** `gif:send` handler'ı + iki limiter.
3. **İstemci alma:** `useGifs` (alma + mute + visibility), `GifOverlay`, `Table` prop'ları, `Room` bağlantısı, overlay CSS'i.
4. **İstemci gönderme:** GIF butonu, `GifPanel`, `send` + cooldown + toast'lar, CSS.
5. **Mute anahtarı:** `GifToggle` üst barda.

## UI gereksinimleri
(ui-designer girdisi)
- **Kendi koltukta GIF butonu:** küçük, kart köşesinde, "GIF" metinli; hover/focus'ta görünür, dokunmatikte sürekli görünür; cooldown'da pasif. Başkalarının koltuğunda yok. Kendi GIF'i oynarken de üstte kalır.
- **GIF paneli (popover):** kendi koltuğa bağlı, dar ekranda sığacak (gerekirse alt kenara yapışık). İçerik: başlık "GIF gönder"; URL alanı (placeholder "https://…/ornek.gif"); önizleme kutusu (yükleniyor/yüklendi/hata); Gönder (birincil); kısa not "GIF senin kartında herkese oynar."; gizlilik notu ("GIF, linkin bulunduğu siteden yüklenir; bu site izleyenlerin IP adresini görebilir."); cooldown metni ("{n} sn sonra tekrar gönderebilirsin").
- **Satır içi hatalar:** EMPTY → (Gönder pasif, mesaj yok); TOO_LONG → "Link en fazla 500 karakter olabilir."; INVALID → "Geçerli bir link değil."; NOT_HTTPS → "Yalnızca https:// ile başlayan linkler kabul edilir."; CREDENTIALS → "Kullanıcı adı/şifre içeren linkler kabul edilmez."; PRIVATE_HOST → "Yerel ağ veya IP adresi linkleri kabul edilmez."; önizleme hatası → "Bu link bir görsel açmadı. GIF'in doğrudan linkini kopyala (sayfa linki değil)."
- **Koltuk üstü GIF overlay:** gönderenin kart alanını kaplar, koltuğu taşırmaz; kısa fade (reduced-motion'da yok). Yığılma yok.
- **Reduced motion:** yalnızca "GIF gönderdi" etiketi.
- **Üst bar anahtarı:** "GIF'leri gizle", `ThemeToggle` ile uyumlu.
- **Toast'lar:** "GIF gönderildi" (success), "Biraz bekle, sonra tekrar gönderebilirsin." (warning).

## Riskler ve edge case'ler
- **Uygunsuz içerik / takip pikseli:** moderasyon yok; hız sınırı + "GIF'leri gizle" ilk koruma. `referrerPolicy="no-referrer"` oda URL'sini sızdırmaz.
- **DNS ile özel IP'ye çözülen alan adı:** sunucu fetch etmediği için SSRF yok; kabul edilen risk.
- **Büyük GIF:** 5 sn'de yüklenmezse düşer; yüklenen 4 sn sonra DOM'dan çıkar.
- **Limiter sırası:** oda limitine takılan istek kullanıcı kotasını da yer; kabul edilebilir.
- **Çoklu sekme:** limiter anahtarı katılımcı bazlı → ortak; iki sekme de `gif` alır.
- **Gönderen çevrimdışı olursa:** overlay `p.online` koşuluyla kalkar; `useGifs` girdiyi temizler.
- **Kendi kartında GIF + oylama:** overlay yalnızca masadaki koltukta, `Deck` ayrı → oy verme etkilenmez; overlay `pointer-events:none`.
- **`showSummary`:** masa yok → GIF görünmez; panel kapanır.
- **Bağlantı kopuk:** Gönder pasif; yeniden bağlanınca eski GIF'ler gelmez.
- **Sekme arka planda:** gelen GIF yok sayılır, gizlenince aktifler temizlenir.

## Kabul kriteri → adım eşlemesi
| Kabul kriteri | Adım |
|---|---|
| Kendi kartta hover'da GIF butonu; panel kapalıyken kaybolur | 4 |
| Başkalarının kartında buton yok | 4 |
| Panel: URL + Gönder (hedef seçimi yok — karar); Esc/dışarı tıklama kapatır | 4 |
| Yalnızca https; http/data/javascript/file reddi + hata | 1, 2, 4 |
| Boş / >500 / ayrıştırılamaz → Gönder pasif / hata | 1, 4 |
| Hedef seçimi kriteri | Geçersiz (karar: hedef yok) |
| GIF tüm bağlı kullanıcılarda gönderenin kartında oynar | 2, 3 |
| ~4 sn sonra kaybolur, oylamayı engellemez | 3 |
| Yüklenemezse bozuk görsel kalmaz | 3 |
| 10 sn'de 1; aşılırsa Türkçe "Biraz bekle" | 2, 4 |
| Aynı kartta yığılma yok | 3 (koltuk başına tek girdi) |
| GIF'leri kendi ekranında kapatma | 3, 5 |
| Ayrılmış kullanıcıya gönderim | Geçersiz (hedef yok); çevrimdışı gönderenin overlay'i kalkar (3) |
| Türkçe metinler | 3–5 |
| Mobilde dokunarak erişim | 4 (`hover: none` → buton sürekli görünür) |

## Notlar
- Spec akış 8 "buton devre dışı" diyor; mute anahtarı üst barda olduğundan cooldown'daki `disabled` buton mute erişimini engellemez.
- emoji-throw koda dökülürken `.seat-overlay` ve `useGifs`'teki "koltuk başına geçici olay" deseni yeniden kullanılabilir.
