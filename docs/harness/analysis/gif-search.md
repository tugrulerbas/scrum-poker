# Analiz: GIPHY Aramasıyla GIF Seçme

Spec: `docs/harness/specs/gif-search.md`. Önceki feature: `docs/harness/analysis/gif-send.md` (uygulanmış). Yeni npm bağımlılığı yok (Node yerleşik `fetch` + `AbortSignal.timeout`).

## Mevcut durum
- `shared/gif.ts` → `checkGifUrl()` (herhangi bir https host'u kabul eder). Kullananlar: `server/handlers.ts` (`gif:send`), `client/src/components/GifPanel.tsx` (URL input + önizleme).
- `server/handlers.ts` → `gif:send { url }` ayrı `socket.on`; doğrulama → `gifUserLimit` (10 sn'de 1) + `gifRoomLimit` (dk'da 10) → odadaki herkese `gif { id, fromId, url }`. `clientIp()` ve `createLimiter()` hazır.
- `client/src/useGifs.ts` → alma (`active`), mute, `send(url)`, `cooldownUntil`, toast'lar. `GifOverlay.tsx` `gif.url`'i `<img>` ile oynatır (yükleme zaman aşımı, reduced-motion etiketi).
- `client/src/components/GifSender.tsx` → kendi koltuktaki GIF butonu + `GifPanel` (popover / mobilde sheet, Esc, dışarı tıklama, odak tuzağı).
- `client/src/socket.ts` → `call()` 8 sn ack zaman aşımı → `TIMEOUT`.
- `render.yaml` env: `NODE_VERSION`, `TRUST_PROXY`.

## Seçilen yaklaşım
- **Arama/trend: Socket.IO ack'li `gif:search` event'i** (HTTP endpoint değil). Gerekçe: istemci zaten bağlı, `call()` + `TIMEOUT` hazır; oda üyeliği (`socket.data`) ile yalnızca odadaki katılımcılar arama yapabilir → anonim kota tüketimi yok; limiter anahtarları (`room:pid`, `ip`) mevcut desenle aynı; `server/index.ts`'e route/JSON/CORS işi eklenmez.
- **GIPHY erişimi yalnızca sunucuda** (`server/giphy.ts`): `GIPHY_API_KEY` env, `fetch` ile `api.giphy.com/v1/gifs/{search|trending}`, `rating=g`. İstemciye yalnızca normalize edilmiş minimal öğe döner; medya URL'lerinin query string'i atılır.
- **`gif:send { id }`**: istemci yalnızca GIPHY id'si gönderir. Sunucu id'yi **kendi son verdiği sonuçlar tablosunda** (`served`) arar ve oynatma URL'ini oradan alır. Böylece (a) yalnızca GIPHY kaynaklı, (b) yalnızca `rating=g` sonuçlarından gelmiş, (c) URL'i sunucu tarafından belirlenmiş GIF'ler oynatılır. Elle üretilmiş id/URL reddedilir. Ek savunma: URL host'u `GIPHY_MEDIA_HOSTS` içinde değilse reddedilir.
- **Önbellek**: sunucuda sorgu bazlı bellek içi TTL önbelleği + aynı anda süren istek birleştirme.

Reddedilenler:
- HTTP `GET /api/gifs`: oda kimliği doğrulaması yok, ayrı route + hata eşlemesi gerekir; kazanım yok.
- İstemcinin GIPHY'yi doğrudan çağırması: anahtar tarayıcıya sızar (spec ihlali).
- `gif:send { url }` + host beyaz listesi: elle istekle `rating=g` dışı GIPHY GIF'i gönderilebilir.
- id'den sabit şablonla URL üretmek (`media.giphy.com/media/{id}/...`): derecelendirme kontrolü yok, aynı sorun.
- Sonsuz kaydırma / sayfalama: spec varsayımı tek sayfa.

## Açık sorulara kararlar
1. **Link yapıştırma:** Kaldırılır. `checkGifUrl` ve URL formu silinir.
2. **Derecelendirme:** `rating=g`, sunucuda sabit; istemci değiştiremez. Ek olarak yanıttaki `rating` alanı `g` değilse öğe atılır.
3. **Anahtar yoksa:** GIF butonu görünür; panel "GIF araması şu an kullanılamıyor." gösterir (Tekrar dene yok). Sunucu başlangıçta bir kez uyarı loglar.
4. **Anahtar türü / kota:** Ekip yönetir. Beta anahtar ~100 istek/saat olduğu için sunucuda **global GIPHY çağrı limiti** (`GIPHY_HOURLY_MAX`, varsayılan 90; env ile değiştirilebilir — production anahtarda artırılır). Aşılırsa geçici hata durumu.
5. **Arama hız sınırı:** Katılımcı başına dakikada 30, IP başına dakikada 60 `gif:search` (önbellek isabetleri dahil sayılır; basit). Aşılırsa "Biraz bekle" durumu.
6. **Önbellek:** Evet. Anahtar `search:<normalize q>` / `trending`; TTL 10 dk; en fazla 300 girdi (en eski silinir).
7. **Geriye uyumluluk:** Yok. Eski istemcinin `gif:send { url }` isteği `INVALID_INPUT` alır (mevcut "Bu link kabul edilmedi." toast'ı); sayfa yenilenince düzelir.
8. **Gizlilik notu:** Atfın yanında tek satır: "GIF'ler GIPHY'den yüklenir."
9. **Hareketi azalt:** Panel önizlemeleri hareketsiz (`still` görseli); odadaki oynatma mevcut davranış (yalnızca "GIF gönderdi" etiketi).
10. **Sonuç sayısı:** Tek sayfa, `limit=24`.
- **Arama değişince seçim:** sıfırlanır (spec varsayımı).
- **Arama metni sınırı:** 50 karakter (GIPHY `q` sınırı); trim + çoklu boşluk tekilleştirme; boş → trend.

## Veri modeli değişiklikleri
`shared/constants.ts`:
- Ekle: `GIF_QUERY_MAX = 50`, `GIF_RESULTS = 24`, `GIF_SEARCH_DEBOUNCE_MS = 350`, `RATE_GIF_SEARCH_MAX = 30`, `RATE_GIF_SEARCH_IP_MAX = 60`.
- Sil: `GIF_URL_MAX` (kullanımı kalmaz). Diğer GIF sabitleri aynen.

`shared/types.ts`:
- `ErrorCode`'a: `'GIF_DISABLED'` (anahtar yok), `'GIF_UNAVAILABLE'` (GIPHY hata/zaman aşımı/kota/global limit).
- Yeni:
  ```ts
  export interface GifItem { id: string; w: number; h: number; preview: string; still: string }
  ```
  `preview` = `images.fixed_width.webp` (yoksa `.url`), `still` = `images.fixed_width_still.url`; `w`/`h` = fixed_width boyutları (sayıya çevrilmiş). Oynatma URL'i istemciye ayrıca verilmez: oynatma da `fixed_width` ile yapılır (önizleme tarayıcı önbelleğinde → anında oynar).
- `ClientToServerEvents`:
  - `'gif:search': (p: { q: string }, ack: AckFn<{ items: GifItem[] }>) => void;`
  - `'gif:send': (p: { id: string }, ack: AckFn) => void;` (`url` kaldırılır)
- `GifEvent` aynen (`{ id, fromId, url }`; `url` artık daima sunucunun belirlediği GIPHY URL'i) → `GifOverlay`, `Table` değişmez.

`shared/gif.ts` (yeniden yazılır, saf):
- `GIPHY_MEDIA_HOSTS = /^(media\d?|i)\.giphy\.com$/`
- `isGiphyMediaUrl(v: unknown): v is string` — string, ≤500, `new URL` ok, `https:`, port yok, kimlik bilgisi yok, host regex'e uyar.
- `isGifId(v: unknown): v is string` — `/^[A-Za-z0-9]{1,40}$/`.
- `normalizeQuery(v: unknown): string | null` — string değilse `null`; trim, `\s+` → tek boşluk, `GIF_QUERY_MAX`'tan uzunsa `null` (sessiz kırpma değil; istemci zaten `maxLength` ile sınırlar).

Sunucu bellek state'i (`server/giphy.ts` içinde, modül seviyesi): `cache: Map<string, { at: number; items: GifItem[] }>`, `inflight: Map<string, Promise<...>>`, `served: Map<id, { url: string; at: number }>` (en fazla 5000, TTL 1 sa, en eski silinir). Oda state'i değişmez.

## Dosya bazlı değişiklik planı
- `shared/constants.ts` — yukarıdaki sabitler; `GIF_URL_MAX` sil.
- `shared/types.ts` — iki hata kodu, `GifItem`, `gif:search`, `gif:send { id }`.
- `shared/gif.ts` — `checkGifUrl`/`GifUrlError`/`PRIVATE_SUFFIXES` silinir; `isGiphyMediaUrl`, `isGifId`, `normalizeQuery` eklenir.
- `server/giphy.ts` (yeni, ~100 satır):
  - `const KEY = process.env.GIPHY_API_KEY?.trim() || ''`; `export const giphyEnabled = !!KEY`.
  - `const HOURLY_MAX = Number(process.env.GIPHY_HOURLY_MAX) || 90`; `upstreamLimit = createLimiter(HOURLY_MAX, 3_600_000)` (anahtar `'giphy'`).
  - `export async function searchGifs(q: string): Promise<GifItem[] | 'UNAVAILABLE'>`:
    1. cache anahtarı `q ? 'search:' + q.toLowerCase() : 'trending'`; taze cache → `remember(items)` + dön.
    2. `inflight` varsa onu bekle.
    3. `upstreamLimit('giphy')` false → `'UNAVAILABLE'`.
    4. URL: `URLSearchParams({ api_key: KEY, limit: GIF_RESULTS, rating: 'g', bundle: 'messaging_non_clips' })` + aramada `q`, `lang: 'tr'`. `fetch(url, { signal: AbortSignal.timeout(5000) })`.
    5. `!res.ok` → `console.warn('GIPHY hata', res.status)` → `'UNAVAILABLE'`. Catch → `console.warn('GIPHY erişilemedi', err.name)` → `'UNAVAILABLE'`. **URL, err nesnesi veya `err.cause` asla loglanmaz/döndürülmez** (anahtar içerir).
    6. `toItems(json.data)`: dizi değilse `[]`; her öğe için `type === 'gif'`, `rating === 'g'`, `isGifId(id)`, `isGiphyMediaUrl` (fixed_width webp|url ve still url — query string atıldıktan sonra: `u.origin + u.pathname`) koşulu; sağlamayan atılır. `w/h` `Number()`; geçersizse 200/200.
    7. Başarı (boş liste dahil) cache'e yazılır, cap aşılırsa en eski silinir; `remember(items)` (`served.set(id, { url: preview, at })`, cap/TTL temizliği). Hata cache'lenmez.
  - `export function resolveGif(id: string): string | null` — `served`'de ve TTL içindeyse URL.
- `server/index.ts` — başlangıçta `if (!giphyEnabled) console.warn('GIPHY_API_KEY tanımlı değil; GIF araması kapalı.')`.
- `server/handlers.ts`:
  - `checkGifUrl` importu → `isGifId`, `normalizeQuery`, `isGiphyMediaUrl`; `giphy.ts`'ten `giphyEnabled`, `searchGifs`, `resolveGif`.
  - Modül seviyesi: `gifSearchLimit = createLimiter(RATE_GIF_SEARCH_MAX, RATE_WINDOW_MS)`, `gifSearchIpLimit = createLimiter(RATE_GIF_SEARCH_IP_MAX, RATE_WINDOW_MS)`.
  - Oda/katılımcı çözümü `gif:send` ile ortak: küçük yardımcı `member(): { room, pid } | null`.
  - `socket.on('gif:search', async (payload, ack))`: ack fonksiyon değilse dön → üye değil `NOT_IN_ROOM` → `normalizeQuery(payload?.q)` null → `INVALID_INPUT` → `!giphyEnabled` → `GIF_DISABLED` → `!gifSearchLimit(room:pid) || !gifSearchIpLimit('ip:'+ip)` → `RATE_LIMITED` → `await searchGifs(q)`; `'UNAVAILABLE'` → `GIF_UNAVAILABLE`; değilse `{ ok: true, items }`. Tüm gövde try/catch → `GIF_UNAVAILABLE` (unhandled rejection yok).
  - `gif:send`: `checkGifUrl` yerine `isGifId(payload.id)` → `resolveGif(id)` → null veya `!isGiphyMediaUrl(url)` → `INVALID_INPUT`. Sonrası (limitler, yayın, `GifEvent`) aynen.
- `client/src/useGifSearch.ts` (yeni hook):
  - `useGifSearch()` → `{ query, setQuery, status, items, retry }`; `status: 'loading' | 'ready' | 'empty' | 'error' | 'disabled' | 'limited'`.
  - `query` değişince `GIF_SEARCH_DEBOUNCE_MS` sonra istek; boş/whitespace → `q: ''` (trend; debounce'suz ilk yükleme panel açılışında hemen).
  - Yarış koruması: `reqSeq` ref; ack dönünce `seq !== reqSeq.current` ise sonuç yok sayılır. Unmount'ta da yok sayılır.
  - Ack eşlemesi: ok → `items.length ? 'ready' : 'empty'`; `GIF_DISABLED` → `disabled`; `RATE_LIMITED` → `limited`; `GIF_UNAVAILABLE`/`TIMEOUT`/diğer → `error`. `retry()` son sorguyu tekrar gönderir.
  - Sonuçlar yüklenirken önceki `items` ekranda kalır (titreme yok), `loading` göstergesi üstte.
- `client/src/components/GifPanel.tsx` — yeniden yazılır (popover/sheet konumlama, Esc, dışarı tıklama, odak tuzağı, cooldown, offline chip korunur):
  - Kaldır: URL input, `checkGifUrl`, `ERRORS`, önizleme kutusu, eski gizlilik notu.
  - Ekle: arama input'u (`type="search"`, `maxLength={GIF_QUERY_MAX}`, açılınca odak), `GifGrid`, durum alanı, atıf satırı.
  - State: `selected: GifItem | null`; `query` değişince `null`. Seçili öğeye tekrar tıklama seçimi kaldırır.
  - `canSend = !!selected && cooldownLeft === 0 && !disabled && !sending`; `onSend(selected.id)`.
  - Props aynı; yalnızca `onSend: (id: string) => Promise<boolean>`.
- `client/src/components/GifGrid.tsx` (yeni) — Props: `items`, `selectedId`, `reducedMotion`, `onToggle(item)`. `role="listbox"` + `aria-label="GIF sonuçları"`, öğeler `role="option"` `aria-selected` `<button>`'lar (Tab ile ızgaraya girilir; ok tuşları ile gezinme: roving `tabIndex`, Enter/Space seçer). Her öğe: `<img src={reducedMotion ? still : preview} width={w} height={h} loading="lazy" referrerPolicy="no-referrer" alt="">`, `onError` → öğe gizlenir (yerel `Set<id>` state'i; bozuk ikon kalmaz). Erişilebilir ad: `aria-label="GIF {n}"` (GIPHY başlığı gönderilmiyor; sade tutuldu).
- `client/src/useGifs.ts` — `send(url)` → `send(id)`, `call('gif:send', { id })`; `INVALID_INPUT` toast'ı → "Bu GIF gönderilemedi, yeniden ara."; `onGif`'te `isGiphyMediaUrl(g.url)` değilse yok say (savunma).
- `client/src/components/GifSender.tsx` — `onSend` tipi `id`; başka değişiklik yok (implementer doğrular).
- `client/src/components/Icon.tsx` — gerekirse `search` ikonu (yoksa).
- `client/src/styles.css` — `.gif-panel` genişliği (~360 px masaüstü), `.gif-search`, `.gif-grid` (2–3 sütun, sabit yükseklikli kaydırılabilir alan, `overflow-y:auto`, `overscroll-behavior: contain`), `.gif-tile` (`aspect-ratio` w/h, `object-fit: cover`, seçili çerçeve + check rozeti, focus-visible halkası), durum blokları, `.gif-attribution`. Eski `.gif-preview*` / `.gif-error` stilleri silinir.
- `render.yaml` — `envVars`'a:
  ```yaml
      - key: GIPHY_API_KEY
        sync: false
  ```
- `CLAUDE.md` Stack — tek satır: "GIF araması: GIPHY API sunucu üzerinden (`GIPHY_API_KEY` env, opsiyonel `GIPHY_HOURLY_MAX`); anahtar yoksa özellik kapalı." (implementer ekler.)

Not: `GifPanel.tsx` yeniden yazımda ~220 satır kalır; ızgara `GifGrid`'e, istek mantığı `useGifSearch`'e ayrıldığı için yeterli.

## Uygulama adımları
1. **Shared:** sabitler, tipler (`GifItem`, hata kodları, `gif:search`, `gif:send { id }`), `shared/gif.ts` yeni fonksiyonlar. (Bu adımda `checkGifUrl` henüz silinmez → build kırılmaz.)
2. **Sunucu GIPHY katmanı:** `server/giphy.ts` (fetch, normalize, cache, inflight, served, global limit), `index.ts` başlangıç uyarısı, `render.yaml` env.
3. **Sunucu handler'ları:** `gif:search` + iki limiter; `gif:send` → id + `resolveGif`. (Eski istemci panel artık gönderemez; 4. adım aynı committe.)
4. **İstemci:** `useGifSearch`, `GifGrid`, `GifPanel` yeniden yazımı, `useGifs.send(id)` + alma savunması, `GifSender` tip uyumu, CSS.
5. **Temizlik:** `checkGifUrl`, `GIF_URL_MAX`, eski CSS sınıfları silinir; `CLAUDE.md` Stack satırı.

## UI gereksinimleri
(ui-designer girdisi; korunanlar: GIF butonu, popover/mobil sheet, Esc/dışarı tıklama, cooldown chip'i, offline chip'i, toast'lar, "GIF'leri gizle", overlay.)
- **Panel başlığı:** "GIF gönder" + kapat butonu (mevcut).
- **Arama kutusu:** üstte, açılışta odaklı, placeholder "GIPHY'de ara", arama ikonu, temizle (×) davranışı (`type="search"`). En fazla 50 karakter.
- **Izgara:** 2–3 sütun küçük önizlemeler; sabit maksimum yükseklik, kendi içinde kaydırılır (mobil sheet'te dokunarak kaydırma/seçme). Kutucuk oranı GIF oranında veya sabit kare + `cover` (tasarımcı seçer; düzen kayması olmamalı).
- **Seçim:** seçili kutucuk belirgin (kalın vurgu çerçevesi + köşede check rozeti, yalnız renge dayanmaz). Tekrar tıklama seçimi kaldırır. Klavye: ok tuşlarıyla gezinme, Enter/Space seçer, focus-visible halkası.
- **Durumlar (ızgara alanında, Türkçe):**
  - Yükleniyor: iskelet kutucuklar veya küçük spinner + "Yükleniyor…" (`aria-live="polite"`); önceki sonuçlar soluk kalabilir.
  - Boş: "“{q}” için sonuç bulunamadı. Başka bir kelime dene."
  - Hata: "GIF'ler yüklenemedi." + "Tekrar dene" butonu.
  - Hız sınırı: "Çok hızlı arıyorsun, biraz bekle." + "Tekrar dene".
  - Anahtar yok: "GIF araması şu an kullanılamıyor." (arama kutusu pasif, Tekrar dene yok).
  - Trend başlığı (arama boşken): küçük etiket "Trend GIF'ler".
- **Gönder butonu:** birincil, seçim yokken pasif; "Gönderiliyor…" durumu; altında mevcut "GIF senin kartında herkese oynar." notu.
- **Atıf:** panelin en altında her zaman görünür "Powered by GIPHY" (GIPHY marka yönergesine uygun; metin+logo için repo'ya resmi SVG eklenmesi gerekirse tasarımcı belirtir — harici yükleme yok) + yanında "GIF'ler GIPHY'den yüklenir." notu.
- **Hareketi azalt:** ızgarada hareketsiz kareler; seçili/hover'da da oynamaz.
- **Panel genişliği:** masaüstünde ızgaraya yetecek kadar (~360 px), viewport'a sığma mantığı mevcut.

## Riskler ve edge case'ler
- **Anahtar sızıntısı:** anahtar yalnızca `server/giphy.ts` içindeki fetch URL'inde; URL/hata nesnesi loglanmaz, ack'e yalnızca kod döner; medya URL'lerinin query'si (`cid`, `rid`) atılır. İstemci paketinde `process.env` kullanılmaz (Vite yalnızca `VITE_` önekini gömer; anahtar adında önek yok).
- **Geçersiz anahtar / kota (401/403/429):** `GIF_UNAVAILABLE` → hata + Tekrar dene. Global saatlik limit kotayı korur; dolunca trend/arama önbellekten gelmeye devam eder.
- **GIPHY yavaş:** sunucu 5 sn `AbortSignal.timeout`, istemci 8 sn `TIMEOUT` → panel takılmaz.
- **Yarış:** istemcide `reqSeq`; sunucuda `inflight` birleştirme. Debounce sırasında eski istek dönse bile yok sayılır.
- **Sunucu yeniden başlarsa:** `served` boşalır; açık paneldeki seçili GIF `INVALID_INPUT` alır → "yeniden ara" toast'ı. Kabul edilebilir (Render uykusu zaten odaları siler).
- **`served` TTL (1 sa) dolarsa:** aynı durum; panel açıkken 1 saat beklemek gerçekçi değil.
- **Uygunsuz içerik:** `rating=g` + yanıt filtresi; GIPHY'nin G filtresi kusursuz değil — kabul edilen risk, "GIF'leri gizle" mevcut.
- **Bozuk önizleme:** kutucuk gizlenir; hepsi bozuksa boş durum metni gösterilir.
- **Bellek:** cache ≤300 × 24 öğe, served ≤5000 → birkaç MB altı.
- **Sponsorlu/sticker:** `/gifs` uç noktası sticker döndürmez; `type !== 'gif'` filtrelenir; `bundle=messaging_non_clips` clip/ses içeriğini dışlar.
- **Limiter kotası:** önbellek isabetleri de arama kotasından düşer; debounce ile normal kullanımda 30/dk'ya ulaşılmaz.
- **Gizlilik:** görseller izleyenin tarayıcısına GIPHY CDN'den gelir (IP görünür); `referrerPolicy="no-referrer"` oda URL'ini sızdırmaz; panelde not var.

## Kabul kriteri → adım eşlemesi
| Kabul kriteri | Adım |
|---|---|
| Arama kutusu + ızgara + atıf; açılışta odak | 4 |
| Boşken trend | 2, 3, 4 |
| Debounce; eski sonuç yenisini ezmez | 4 (`reqSeq`), 2 (`inflight`) |
| Yükleniyor / boş / hata + Tekrar dene | 4 |
| Küçük önizleme, tıkla/klavye ile seç, vurgu | 4 |
| Seçim yokken Gönder pasif; gönderince 4 sn oynar | 3, 4 |
| Güvenli içerik, değiştirilemez | 2 (`rating=g` + filtre), 3 (`served`) |
| Anahtar tarayıcıya gitmez | 2, 3 |
| Anahtar yoksa çökmez, Türkçe mesaj | 2, 3, 4 |
| Yalnızca GIPHY kaynaklı gönderim; elle istek reddi | 1, 3 |
| Arama hız sınırı + "Biraz bekle"; gönderim limitleri aynı | 3, 4 |
| Arama uzunluk sınırı; boş → trend | 1, 3, 4 |
| GIF'leri gizle / hareketi azalt (oda + panel) | 4 (ızgarada `still`; oda değişmez) |
| Esc / dışarı tıklama; mobilde kaydırma ve dokunma | 4 (mevcut davranış korunur) |
| "Powered by GIPHY" her zaman görünür | 4 |
| Türkçe metinler | 4 |

## Notlar
- GIPHY production anahtarı başvurusu atıf ve "analytics" (onload/onclick ping) isteyebilir; bu sürümde analytics ping'i yok (spec dışı). Production onayı gerekirse ayrı feature.
- `bundle` parametresi GIPHY'de opsiyonel; sorun çıkarırsa kaldırılabilir, filtreler yine çalışır.
