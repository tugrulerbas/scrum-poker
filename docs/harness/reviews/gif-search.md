# Review: gif-search

## Özet
Onay, küçük revizelerle. Güvenlik tarafı (anahtar izolasyonu, id → `served` çözümü, `rating=g` + yanıt filtresi, timeout, savunmacı parse, bellek sınırları) doğru. P0/P1 yok. Revize: anahtar yokken Esc ile kapanmama, debounce sırasında görünmeyen GIF'in seçili kalması ve tek kullanıcının global saatlik kotayı bitirebilmesi (P2). Gerisi P3.

## Doğrulanan noktalar (bulgu değil)
- Anahtar yalnızca `server/giphy.ts` fetch URL'inde. Loglarda yalnızca `res.status` ve `err.name` var. Ack yalnızca kod veya `items` döndürüyor, medya URL'lerinin query'si `cleanUrl` ile atılıyor. İstemcide `process.env` yok.
- `gif:send` yalnızca `isGifId` + `resolveGif` (sunucunun verdiği sonuç) + `isGiphyMediaUrl` ile oynatıyor. Elle yazılmış URL ya da id ile atlatılamıyor. Alan tarafında da (`useGifs.onGif`) host kontrolü var.
- `toItems`: dizi, `type`, `rating === 'g'`, id, URL ve boyut kontrolleri var. Bozuk yanıt `[]` döndürüyor, çökmüyor.
- `AbortSignal.timeout(5000)` gövde okumayı da kapsıyor. Hata önbelleğe alınmıyor. `inflight` aynı anda gelen istekleri birleştiriyor.
- `served` ekleme sırası `at` sırasıyla aynı (`delete` + `set`). Temizlik döngüsü doğru, üst sınır 5000. Önbellek ≤300 girdi. Limiter'lar kayan pencere kullanıyor ve kendi kendini süpürüyor.
- İstemci: `reqSeq` eski yanıtları yok sayıyor. Unmount'ta seq artırılıyor ve timer temizleniyor. Boş sorgu debounce'suz gidiyor.
- Render uykusu: `served` ve önbellek boşalıyor, odalar da siliniyor. Seçili GIF "Bu GIF gönderilemedi, yeniden ara." toast'ını alıyor. Analizde kabul edilmiş.
- Detector: 0 anti-pattern. 4 advisory'nin hepsi GIF dışındaki eski satırlarda.

## Bulgular

### [P2] Anahtar yokken (GIF_DISABLED) Esc paneli kapatmıyor — ✅ düzeltildi (off olunca odak panele)
- Dosya: `client/src/components/GifPanel.tsx:48-49, 148, 76-95`
- Sorun: Panel açılınca odak arama kutusuna gidiyor. `GIF_DISABLED` gelince input `disabled` oluyor ve tarayıcı odağı `body`'ye düşürüyor. Esc dinleyicisi panelin `onKeyDown`'unda olduğu için olay panele ulaşmıyor. Mobil sheet'te odak tuzağı da devre dışı kalıyor.
- Senaryo: `GIPHY_API_KEY` tanımsız (lokal dev ya da yanlış yapılandırılmış prod) → GIF butonu → panel "kullanılamıyor" diyor → Esc'ye basılıyor, hiçbir şey olmuyor. "Esc paneli kapatır" kriteri bu durumda karşılanmıyor.
- Öneri: `off` olunca odağı panele (`panelRef`, zaten `tabIndex={-1}`) ya da kapat butonuna taşı. Alternatif: input'u `disabled` yerine `readOnly` + `aria-disabled` yap.

### [P2] Debounce sırasında seçilen GIF yeni sonuçlarda görünmese de seçili kalıyor — ✅ düzeltildi (items değişince geçersiz seçim sıfırlanır)
- Dosya: `client/src/components/GifPanel.tsx:58, 189-196`; `client/src/useGifSearch.ts:31-35`
- Sorun: Seçim `query` değişince sıfırlanıyor. Ama ızgara, debounce süresince (350 ms) ve istek dönene kadar eski sonuçları göstermeye devam ediyor (`ready`, sonra soluk `loading`). Bu arada yapılan seçim, yeni sonuçlar gelince sıfırlanmıyor.
- Senaryo: Trend açıkken "kedi" yazılıyor. 350 ms dolmadan ya da yanıt gelmeden bir trend kutucuğuna tıklanıyor. "kedi" sonuçları geliyor ve seçili GIF ızgarada yok, ama "Gönder" etkin kalıyor. Gönderilince kullanıcının göremediği GIF oynuyor.
- Öneri: Yeni `items` geldiğinde seçili id listede yoksa seçimi sıfırla. Alternatif: `status === 'loading'` ya da debounce bekleyen bir istek varken ızgara seçimini kilitle.

### [P2] Tek bir katılımcı global saatlik GIPHY kotasını dakikalar içinde bitirebiliyor — ✅ düzeltildi (önbellek ıskalarında IP başına saatte HOURLY_MAX/5 upstream limiti)
- Dosya: `server/handlers.ts:226`, `server/giphy.ts:10-11, 64`
- Sorun: Katılımcı başına sınır dakikada 30 arama, global sınır ise saatte 90 GIPHY çağrısı. Önbellekte olmayan farklı sorgular her seferinde global kotadan düşüyor.
- Senaryo: Bir kullanıcı (ya da script) 3 dakikada 90 farklı sorgu gönderiyor. Saatin geri kalanında tüm odalarda önbellekte olmayan aramalar "GIF'ler yüklenemedi" alıyor. GIPHY kotası korunuyor ama özellik herkes için duruyor. Analiz global sınırı istiyor, adil paylaşımı ele almıyor.
- Öneri: Önbellek ıskalarına ayrı ve daha sıkı bir katılımcı/IP limiti koy (ör. katılımcı başına saatte `HOURLY_MAX/5` upstream çağrısı). Bunun yerine bilinçli bir kabul olarak bırakılacaksa analize not düş.

### [P3] `GIPHY_HOURLY_MAX` geçersiz değerleri yakalamıyor — ✅ düzeltildi
- Dosya: `server/giphy.ts:10`
- Sorun: `Number(x) || 90` ifadesi negatif ya da kesirli değerleri olduğu gibi kabul ediyor. `-1` verilirse limiter her çağrıyı reddediyor ve özellik sessizce kapanıyor.
- Öneri: `Number.isInteger(n) && n > 0 ? n : 90`.

### [P3] Trend boş dönerse boş durum metni `“” için sonuç bulunamadı` oluyor — ✅ düzeltildi
- Dosya: `client/src/components/GifPanel.tsx:200-205`
- Sorun: `searched === ''` iken de sorgu metnine göre yazılmış boş durum metni gösteriliyor.
- Öneri: Sorgu boşsa "Şu an trend GIF yok." gibi ayrı bir metin göster.

### [P3] Yalnızca boşluk farkı yeni istek atıyor ve seçimi sıfırlıyor — ✅ düzeltildi (normalize sorguya bağlı)
- Dosya: `client/src/useGifSearch.ts:31-35`, `client/src/components/GifPanel.tsx:58`
- Sorun: Effect'ler ham `query`'ye bağlı. "kedi" → "kedi " değişikliği aynı normalize sorguyu yeniden gönderiyor (önbellek isabeti olsa da 30/dk limitinden düşüyor) ve seçimi kaldırıyor.
- Öneri: Effect bağımlılığını normalize edilmiş sorgu (`trim` + boşluk tekilleştirme) yap.

### [P3] CLAUDE.md Stack satırı eklenmemiş — ⏭️ atlandı (kullanıcıya bırakıldı)
- Dosya: `CLAUDE.md`
- Sorun: Analizin 5. adımı GIPHY ve `GIPHY_API_KEY` / `GIPHY_HOURLY_MAX` satırını istiyor, satır eklenmemiş.
- Öneri: Stack bölümüne tek satır ekle.

## Kabul kriterleri kontrolü
- [x] Arama kutusu, ızgara ve "Powered by GIPHY" var; açılışta odak arama kutusunda.
- [x] Boş sorguda trend listeleniyor.
- [x] Debounce var; eski yanıt yenisinin üzerine yazmıyor (`reqSeq`).
- [x] Yükleniyor, boş ve hata durumları + "Tekrar dene" Türkçe.
- [x] Küçük önizleme, tıklayarak ya da klavyeyle (roving tabindex, oklar, Home/End, Enter/Space) seçim, vurgu + check rozeti. (Bkz. P2: debounce sırasındaki seçim.)
- [x] Seçim yokken Gönder pasif; gönderilince 4 sn oynuyor.
- [x] `rating=g` sunucuda sabit, yanıt filtreleniyor, gönderim `served` üzerinden.
- [x] Anahtar tarayıcıya gitmiyor.
- [ ] Anahtar yoksa çökmüyor ve Türkçe mesaj gösteriliyor. Ancak bu durumda Esc ile kapanmıyor (P2).
- [x] Yalnızca GIPHY kaynaklı ve sunucunun verdiği GIF'ler oynatılıyor; elle gönderilen istek reddediliyor.
- [x] Arama hız sınırı + "Çok hızlı arıyorsun, biraz bekle."; gönderim limitleri değişmedi. (Bkz. P2: global kota adaleti.)
- [x] Sorgu ≤50 karakter (istemcide `maxLength`, sunucuda `normalizeQuery`); boş sorgu trende dönüyor.
- [x] "GIF'leri gizle" ve hareketi azalt: oda davranışı aynı, panelde `still` kareler ve animasyonsuz durumlar.
- [x] Esc ve dışarı tıklama paneli kapatıyor (anahtarsız durum hariç); mobilde 2 sütun, kaydırılabilir.
- [x] Atıf her durumda görünüyor (metin olarak; logo eklenmemiş, tasarım notu buna izin veriyor).
- [x] Metinler Türkçe.
