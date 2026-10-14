# Review: gif-send

## Özet
Genel olarak sağlam: sunucu tarafı URL doğrulaması, limiter'lar, XSS yüzeyi ve timer temizlikleri doğru. Revize gerekli: 1 P1 (dışarı tıklayınca odak çalınıyor), birkaç P2. P0 yok.

Doğrulanıp sorunsuz bulunanlar:
- `checkGifUrl` sunucuda otorite olarak çalışıyor; `javascript:`/`data:`/`http:`/`file:` → NOT_HTTPS, `user:pass@` → CREDENTIALS, port → INVALID. WHATWG URL `0x7f000001`, `127.1`, `2130706433` gibi biçimleri `127.0.0.1`'e normalize ettiği için IPv4 kalıbı bunları da yakalıyor. Sonda nokta olan host (`localhost.`) temizleniyor. Normalize edilmiş `href` yayınlanıyor ve yalnızca React `<img src>` içine gidiyor; XSS yüzeyi yok.
- Limiter: geçersiz istek kota yemiyor; `||` kısa devresi yüzünden kullanıcı limitine takılan istek oda kotasını yemiyor. `createLimiter`'ın periyodik temizliği her iki Map'i de boşaltıyor (anahtarlar `room:pid` ve `room`), sızıntı yok. Ack geldiği an başlayan istemci cooldown'u sunucu zaman damgasından sonra bitiyor, yani gereksiz RATE_LIMITED yok.
- `GifOverlay` `key={gif.id}` ile bağlanmış; yükleme zaman aşımı (5 sn) ve gösterim (4 sn) timer'ları temizleniyor, `onError` ile kırık görsel bırakmadan kapanıyor (`opacity:0` iken yüklenmiş değil). `onDone` kapanışı `p.id`/`gif.id` için sabit.
- Visibility (gizlenince `active={}` ve gizliyken gelen olay yok sayılıyor), mute (dinleyici kaldırılıyor + temizleniyor), gönderen çevrimdışı olunca girdi siliniyor (`useGifs` + `Table`'daki `p.online`).
- `showSummary` durumunda `Table` unmount oluyor, panel de onunla kapanıyor.

## Bulgular

### [P1] Panelin dışına tıklayınca odak GIF butonuna geri çekiliyor (input'a tıklama bozuluyor) — ✅ düzeltildi
- Dosya: `client/src/components/GifSender.tsx:25-28`, `client/src/components/GifPanel.tsx:57-62`
- Sorun: Dışarı tıklama `pointerdown` anında `onClose` → `close()` çağırıyor, o da `setTimeout(0)` ile `btnRef.focus()` yapıyor. Tarayıcı mousedown sırasında odağı tıklanan öğeye veriyor, ardından timeout odağı GIF butonuna geri alıyor.
- Senaryo: Masaüstünde panel açıkken kullanıcı yan paneldeki story ekleme alanına (veya herhangi bir input/textarea'ya) tıklıyor. Panel kapanıyor ama odak GIF butonunda kalıyor, yazılanlar input'a gitmiyor. Deste kartına tıklamada oy veriliyor ama odak yine GIF butonuna sıçrıyor.
- Öneri: Odağı yalnızca Esc, kapat butonu ve başarılı gönderim gibi klavye/panel içi kapanışlarda geri ver. Örneğin `close(restoreFocus = true)` yapılabilir; dışarı tıklama yolu `false` ile çağırır. Bir diğer yol: timeout içinde `document.activeElement` body/panel içi değilse odağı taşımamak.

### [P2] Masaüstü popover'da panel içindeki metne tıklanınca Esc çalışmıyor — ✅ düzeltildi
- Dosya: `client/src/components/GifPanel.tsx:120-127`
- Sorun: Esc yalnızca panel `div`'inin `onKeyDown` olayıyla yakalanıyor. Panelin `tabIndex`'i yok. Panel içindeki odaklanamayan bir alana (önizleme kutusu, not metni, başlık) tıklanınca odak `body`'ye düşüyor ve keydown artık panele ulaşmıyor.
- Senaryo: Kullanıcı linki yapıştırıyor, önizlemeye tıklıyor, Esc'ye basıyor. Panel kapanmıyor. Bu durumda kabul kriterindeki "Esc paneli kapatır" kısmen karşılanıyor.
- Öneri: Panel `div`'ine `tabIndex={-1}` vermek (tıklama odağı panelde tutar) ya da panel açıkken Esc'yi `document` seviyesinde dinlemek.

### [P2] `GifToggle` hem `aria-pressed` hem değişen etiket kullanıyor — ✅ düzeltildi
- Dosya: `client/src/components/GifToggle.tsx:4-10`
- Sorun: Erişilebilir ad duruma göre "GIF'leri gizle" ile "GIF'ler gizli" arasında değişiyor ve aynı anda `aria-pressed` kullanılıyor. Ekran okuyucu "GIF'ler gizli, basılı" / "GIF'leri gizle, basılı değil" diye okuyor; durum iki kez ve çelişkili ifade ediliyor. `title` ise üçüncü bir metin ("GIF'leri göster") gösteriyor.
- Öneri: Etiketi sabit "GIF'leri gizle" yapıp durumu yalnızca `aria-pressed` ile iletmek. Görsel metin değişecekse `aria-pressed`'i kaldırmak.

### [P2] Cooldown süresi üç yerde ayrı ayrı izleniyor — ✅ düzeltildi
- Dosya: `client/src/components/GifSender.tsx:15-23`, `client/src/useGifs.ts:41-46`, `client/src/components/GifPanel.tsx:79-85`
- Sorun: `useGifs` süre dolunca `cooldownUntil`'i zaten `0`'a çekiyor. `GifSender` ayrıca kendi `cooling` state'i ve timer'ını tutuyor. Bu fazlalık; ilk render'da `cooling=false` olup effect sonrası `true` oluyor, yani bir karelik tutarsızlık da var.
- Öneri: `GifSender`'da `const cooling = cooldownUntil > 0` yeterli (`useGifs` sıfırlamayı yaptığı için). State ve effect kaldırılabilir.

### [P2] Detector advisory: radius ölçek dışı — ✅ düzeltildi (DESIGN.md'ye iç yarıçap kuralı notu)
- Dosya: `client/src/styles.css:314`
- Sorun: `.seat-overlay` içindeki `calc(var(--r-md) - 2px)` için `[design-system-radius] border-radius: 2px is outside the DESIGN.md rounded scale` uyarısı var (anti-pattern sayısı 0, sadece advisory). Değer kasıtlı (koltuk border'ının iç yarıçapı) ama DESIGN.md'de yok.
- Öneri: DESIGN.md'ye "iç yarıçap = radius − border" kuralını not etmek ya da bir token tanımlamak. Davranış değişikliği gerekmiyor.

### [P3] Geçersiz `gif:send` istekleri hız sınırına tabi değil — ⏭️ atlandı (analiz kararı, kabul edilebilir)
- Dosya: `server/handlers.ts:213-215`
- Sorun: Doğrulama limiter'lardan önce çalışıyor (analiz kararı, geçerli istek kotası korunuyor). Sonuç olarak odadaki bir katılımcı sınırsız geçersiz istek gönderebiliyor. Her istek ucuz (≤500 karakterde kesiliyor, yayın yok); yine de diğer handler'larla aynı seviyede.
- Öneri: Şimdilik kabul edilebilir. İleride socket başına genel bir event limiter düşünülebilir (ayrı iş).

## Kabul kriterleri kontrolü
- [x] Kendi kartta hover/focus'ta "GIF" butonu görünür, panel kapalıyken kaybolur (`.seat-you:hover/:focus-within`, `aria-expanded`)
- [x] Başkalarının kartında buton yok (`gifSlot` yalnızca `isYou` koltuğunda)
- [~] Panel açılır; dışarı tıklama kapatır; Esc kapatır ama odak paneldeyken (bkz. P2 Esc). Dışarı tıklama odak çalıyor (bkz. P1)
- [x] Yalnızca `https://`; http/data/javascript/file reddedilir, satır içi Türkçe hata; sunucu da reddeder
- [x] Boş / >500 / ayrıştırılamaz → Gönder pasif + hata (EMPTY'de mesaj yok, tasarım gereği)
- [-] Hedef seçimi: kullanıcı kararıyla geçersiz
- [x] GIF tüm bağlı kullanıcılarda gönderenin kartında oynar (gönderen dahil)
- [x] ~4 sn sonra kaybolur; overlay `pointer-events:none`, Deck ayrı, oylama/açma engellenmez
- [x] Yüklenemezse bozuk görsel kalmaz (`opacity:0` + `onError` + 5 sn zaman aşımı)
- [x] 10 sn'de 1 + oda başına dakikada 10; "Biraz bekle..." toast'ı ve buton pasif + geri sayım
- [x] Aynı kartta yığılma yok (koltuk başına tek girdi, yeni GIF eskisini değiştirir)
- [x] "GIF'leri gizle" anahtarı, localStorage ile kalıcı
- [-] Ayrılmış kullanıcıya gönderim: geçersiz. Çevrimdışı gönderenin overlay'i kalkar
- [x] Tüm metinler Türkçe
- [x] Dokunmatikte buton sürekli görünür (`@media (hover: none)`), mobilde alt sayfa + focus trap
- [x] Edge: sekme arka planda / geç katılan / reduced motion (yalnızca "GIF gönderdi" etiketi) / gizlilik notu

## Notlar
- Analizde kabul edilen risk: GIF linki herhangi bir https hostuna gidebiliyor. Bu yüzden izleyicilerin tarayıcısı o adrese çerezli GET isteği atıyor ve DNS ile özel IP'ye çözülen alan adları (ör. `*.nip.io`) engellenmiyor. `referrerPolicy="no-referrer"` oda URL'sinin sızmasını önlüyor. Spec dışı bir sertleştirme gerekirse ayrı feature olarak ele alınmalı.
