# Review: scrum-poker-v1

Kapsam: 5 temel feature (room-create-share, join-with-name, private-vote-reveal, results-consensus, story-queue). Eğlenceli feature'lar henüz yok; bulgu sayılmadı.

## Özet
Revize gerekli. Sunucu otoriter yapı, yetki kontrolleri, payload düzeyinde oy gizliliği ve `roundId`/`STALE_ROUND` koruması doğru çalışıyor. Ancak oy vermemiş birinin sayfayı yenilemesi turu hemen açıyor (P0). SPA içinden odadan çıkan kişi de sunucuda çevrimiçi kalıyor. Ayrıca tek bir socket, oda limitini doldurarak servisi kilitleyebiliyor.

Doğrulama: `PORT=3917 npm start` ile açılan sunucuya socket.io-client script'i bağlandı (`/private/tmp` altında, projeye eklenmedi; süreç kapatıldı). Sonuçlar:
- Voting sırasında B'nin `room:state` payload'unda A'nın oyu (`"8"`) yok, token yok.
- B'nin yenilemesi turu açtı (aşağıda P0).
- Çift `round:reveal` için `{ok:true}` ve `STALE_ROUND` döndü.
- Facilitator olmayanın `round:revote` isteği `NOT_FACILITATOR` aldı.
- `​` ve `Bora​` isimleri kabul edildi.
- Tek socket 300 oda kurdu.

## Bulgular

### [P0] Oy vermemiş katılımcının sayfayı yenilemesi turu otomatik açıyor — ✅ düzeltildi (8 sn grace; doğrulandı)
- Dosya: `server/handlers.ts:56-60`, `server/room-logic.ts:108-116`
- Sorun: Bir katılımcının son socket'i koptuğunda `detach`, `maybeAutoReveal`'ı hemen çağırıyor. O kişi oy vermemişse ve geri kalan çevrimiçi herkes oy vermişse tur anında açılıyor. Sayfa yenileme ile gerçekten ayrılma ayırt edilmiyor. Facilitator için 30 sn grace var, oy için yok.
- Senaryo (doğrulandı): A oda kurar, B katılır, A `8` verir, B oy vermeden F5'e basar. A'nın ekranı `revealed {A:"8"}` gösterir. B geri döndüğünde (`room:rejoin` ok) A'nın oyunu görür. `vote:cast` isteği de `ROUND_REVEALED` ile reddedilir.
  - Aynı durum şunlarda da olur: mobilde ekran kilidi veya arka plana alma (ping timeout), laptop uykusu, oy vermemiş facilitator'ın yenilemesi.
  - Bu durum şu kriteri kırar: "Oy açılmadan önce diğer kişiler yalnızca oy verdi/bekleniyor durumunu görür." Yenileyen kişi başkalarının oylarını kendi oyundan önce görür (çapa etkisi) ve o turda oy hakkını kaybeder. Durum geri alınamaz; ancak yeniden oylama ile kurtarılır.
- Öneri: `detach` içinde otomatik açılışı hemen yapma. Facilitator devrindeki gibi kısa bir bekleme kur (örn. 5–10 sn). Süre dolunca şunları kontrol et: oda hâlâ aynı mı (`rooms.get(id) === room`), `round.id` aynı mı, `status === 'voting'` mı, kişi hâlâ çevrimdışı mı. Hepsi tutuyorsa `maybeAutoReveal` + `broadcastRoom` çalıştır. `vote:cast` yolundaki anlık otomatik açılış aynen kalabilir.

### [P1] SPA içinden odadan çıkan kişi sunucuda çevrimiçi kalıyor — ✅ düzeltildi (`room:leave`)
- Dosya: `client/src/pages/Room.tsx:51` (`goHome`), `client/src/useRoom.ts:51-55`; sunucuda `room:leave` benzeri bir event yok
- Sorun: Logo, "Yeni oda kur" veya tarayıcı geri tuşu `Room`'u unmount ediyor. Bu sırada yalnızca dinleyiciler kaldırılıyor. Socket bağlı kaldığı ve `socket.data` odayı gösterdiği için katılımcı çevrimiçi ve "Bekleniyor" görünmeye devam ediyor.
- Senaryo:
  - 3 kişilik odada C logoya tıklayıp ana sayfaya döner. A ve B oy verir, ama otomatik açılış hiç olmaz, çünkü C "çevrimiçi ve oy vermemiş" sayılır.
  - Ayrılan kişi facilitator ise yetki devri de tetiklenmez. Diğerleri kartları açamaz, yeniden oylayamaz, story yönetemez. Bu durum sekme kapanana kadar sürer.
  - Bu davranış şu kriteri karşılamaz: "ayrılınca durumu çevrimdışı olur."
- Öneri: `useRoom` cleanup'ında (ya da `goHome`'da) `room:leave` gönder. Sunucuda bu event'i `detach` ile aynı yoldan işle: `socket.data` temizlenir, gerekirse facilitator kontrolü ve otomatik açılış zamanlayıcısı çalışır. Alternatif olarak çıkışta `socket.disconnect().connect()` yapılabilir.

### [P1] Tek socket sınırsız oda kurup `MAX_ROOMS` limitini doldurabiliyor (servis kilitlenir) — ✅ düzeltildi (socket+IP rate limit; kısa TTL önerisi uygulanmadı: yenilemeyi bozar)
- Dosya: `server/handlers.ts:100-107`, `server/rooms.ts:59,65-72`
- Sorun: `room:create` için hiçbir hız sınırı yok. Her yeni oda kurulduğunda `enter`, socket'i önceki odadan ayırıyor. Geride kalan tek kişilik oda çevrimdışı olsa da 2 saat (`ROOM_TTL_MS`) yaşıyor.
- Senaryo (doğrulandı: tek socket 300 oda kurdu): Bir döngü saniyeler içinde 5000 oda kurar. Bundan sonra herkes 2 saat boyunca `SERVER_BUSY` alır. `room:join` ile de benzer bir saldırı yapılabilir: link bilen biri odayı 20 hayalet katılımcıyla doldurur ve oda 15 dk boyunca `ROOM_FULL` olur.
- Öneri:
  - Socket ve IP başına basit bir kayan pencere limiti ekle (örn. dakikada 5 `room:create` ve 10 `room:join`).
  - Hiç kimsenin çevrimiçi olmadığı ve yalnızca kurucusu bulunan odalara kısa TTL ver. Alternatif: `enter` önceki odadan ayrılırken, oda tek kişilikse ve o kişi artık çevrimdışıysa odayı hemen sil.

### [P2] Süpürücü, açılmış turdan çevrimdışı kişinin oyunu siliyor — ✅ düzeltildi
- Dosya: `server/rooms.ts:77`
- Sorun: 15 dk çevrimdışı kalan katılımcı silinirken `round.votes.delete(p.id)` turun durumuna bakmadan çalışıyor. Tur `revealed` ise açılmış sonuç sonradan değişiyor. Bu, "Açıldıktan sonra oylar değişmez" kriterine aykırı.
- Senaryo: Oylar açılır, ekip 15+ dk tartışır, bu arada oy vermiş biri çevrimdışı kalmıştır. Sweep sonrası ortalama, medyan, dağılım ve önerilen kart değişir, en düşük/en yüksek listesi kayar.
- Öneri: Oyu yalnızca `round.status === 'voting'` iken sil. Açılmış turda oy kalsın; görünümde ismi bulunamayan oy için mevcut `'?'` yerine bir yedek isim kullanılabilir.

### [P2] Görünmez karakterli isimler kabul ediliyor, isim benzersizliği atlatılabiliyor — ✅ düzeltildi
- Dosya: `server/validate.ts:4-10`, `server/room-logic.ts:14`
- Sorun: Yalnızca `\p{Cc}` temizleniyor. `\p{Cf}` sınıfındaki karakterler (`​`, `‎`, bidi override vb.) `trim()` ile de kalkmıyor.
- Senaryo (doğrulandı): `"​"` adı boş bir isim olarak kabul ediliyor. Odada "Bora" varken `"Bora​"` adı `NAME_TAKEN` almadan giriyor, masada iki tane aynı görünen "Bora" oluyor. Spec'teki "Boş isimle oda kurulamaz" ve "Aynı isim uyarısı" kriterleri delinmiş oluyor.
- Öneri: `cleanText` içinde `\p{Cf}` karakterlerini de sil (ya da reddet) ve `normalize('NFC')` uygula. Benzersizlik anahtarı (`nameKey`) da normalize edilmiş metinden üretilsin.

### [P2] Eşzamanlı/çift aksiyonlarda yanıltıcı hata toast'ı — ✅ düzeltildi (toast susturuldu; buton kilidi eklenmedi)
- Dosya: `client/src/useRoom.ts:79-81`, `client/src/components/FacilitatorControls.tsx:27`
- Sorun: Sunucu tutarlı tek bir sonuç üretiyor (doğrulandı), ama istemci kaybeden isteğe uyarı gösteriyor:
  - "Kartları aç"a çift tıklanırsa ikinci istek `STALE_ROUND` alır ve "Eski bir tur için işlem yapıldı" toast'ı çıkar.
  - Son oy otomatik açılışı tetiklediği anda başka biri kart değiştirirse istek `ROUND_REVEALED` alır ve genel "Bir şeyler ters gitti" toast'ı çıkar.
- Senaryo: Facilitator kartları açarken çift tıklar ya da iki kişi neredeyse aynı anda oy verir. Kullanıcı ortada hata yokken hata mesajı görür.
- Öneri: `round:reveal` için `STALE_ROUND` ve `vote:cast` için `ROUND_REVEALED` sessizce yutulsun (yeni state zaten geliyor). Bunun yanında reveal butonu istek sürerken kilitlenebilir.

### [P2] İyimser oy her `room:state`'te sıfırlanıyor; kart seçimi titreyebiliyor — ✅ düzeltildi
- Dosya: `client/src/useRoom.ts:41,91-93`
- Sorun:
  - `onState`, gelen her snapshot'ta `pendingVote`'u temizliyor. Kendi oyun işlenmeden önce yayınlanmış bir snapshot (başkasının aksiyonu) gelirse seçim, eski `you.vote` değerine geri dönüyor.
  - Hızlı A→B tıklamasında, A'nın snapshot'ı geldiğinde B'nin iyimser seçimi siliniyor.
  - Ayrıca başarısız eski bir istek `setPendingVote(null)` ile daha yeni bir iyimser seçimi de geri alıyor.
- Senaryo: Kalabalık odada kart seçilir. Seçim bir an önceki karta (ya da boşa) döner, sonra tekrar doğru karta geçer.
- Öneri: İstek başına artan bir sıra numarası tut. `pendingVote`'u yalnızca `view.round.id` değiştiğinde ya da `view.you.vote === pendingVote.card` olduğunda temizle. Hata durumunda yalnızca en son istek başarısızsa geri al.

### [P2] İlk yüklemede `room:rejoin` zaman aşımına uğrarsa ekran sonsuza dek spinner'da kalıyor — ✅ düzeltildi (2 sn sonra yeniden dener)
- Dosya: `client/src/useRoom.ts:28`
- Sorun: `TIMEOUT` durumunda `sync` sessizce dönüyor. Socket bağlı kaldığı için yeni bir `connect` olayı gelmiyor ve tekrar deneme yapılmıyor. Bağlantı "ok" göründüğü için `ConnectionBanner` da görünmüyor.
- Senaryo: Sunucu bir an yavaş kalır veya ack kaybolur (8 sn). Kullanıcı yalnızca yükleme göstergesini görür, ancak elle yenilerse kurtulur.
- Öneri: `TIMEOUT` durumunda kısa bir gecikmeyle `sync`'i yeniden dene, ya da "Tekrar dene" butonlu bir hata durumu göster.

## Kabul kriterleri kontrolü

**room-create-share**
- [x] İsim + "Oda kur" → doğrudan odaya düşer
- [x] Benzersiz, tahmin edilmesi zor link (64 bit) odada görünür
- [x] "Linki kopyala" + kopyalandı geri bildirimi; izin yoksa seçilebilir fallback
- [x] Kurucu facilitator ve rozetle belirgin
- [x] Hesap/giriş yok
- [ ] Edge: facilitator ayrılınca devir → sekme kapanınca çalışıyor, SPA içinden çıkışta çalışmıyor (P1 #2)

**join-with-name**
- [x] Link → isim ekranı → katılım
- [ ] Katılan anında görünür; ayrılınca "çevrimdışı" → SPA içinden çıkışta çevrimiçi kalıyor (P1 #2)
- [ ] Yenilemede aynı isim/oyla devam → isim ve oy korunuyor, ama oy vermemiş kişinin yenilemesi turu açıyor (P0 #1)
- [x] Aynı isim uyarısı + öneri (görünmez karakterle atlatılabiliyor, P2)
- [x] 1–24 karakter sınırı ve açıklayıcı mesaj

**private-vote-reveal**
- [x] Deste görünür, seçili kart vurgulu
- [ ] Açılmadan önce yalnızca oy verdi/bekleniyor → payload düzeyinde doğru (doğrulandı), ama yenileme kaynaklı erken açılış var (P0 #1)
- [x] "x/y oy verdi" ilerlemesi
- [x] Açılmadan önce değiştir/geri çek
- [ ] Herkes oy verince otomatik açılış + facilitator "Kartları aç" → yenilemede erken tetikleniyor (P0 #1), SPA çıkışında hiç tetiklenmiyor (P1 #2)
- [ ] Açıldıktan sonra oylar değişmez → sweep 15 dk sonra siliyor (P2)
- [x] Açma/yeniden oylama yalnızca facilitator'da (sunucuda `requireF`)
- [x] Edge: eşzamanlı açma/yeniden oylamada tek tutarlı sonuç (`roundId`)

**results-consensus**
- [x] Ortalama, medyan, dağılım
- [x] ?/☕ istatistik dışında, ayrı gösteriliyor
- [x] "Fikir birliği" (≥2 oy, aynı sayısal kart)
- [x] "Tartışmaya değer" + en düşük/en yüksek oyu verenler
- [x] "Bu puanı kaydet" (medyana yakın öneri, değiştirilebilir) / "Yeniden oyla"
- [x] Edge: tek oyda konsensüs yok, hepsi "?" → "Belirsiz", ondalıklı ortalama

**story-queue**
- [x] Başlık + isteğe bağlı açıklama/link ile ekleme, herkese görünür
- [x] Aktif story belirgin, herhangi biri aktif yapılabilir
- [x] Düzenle / sil / yukarı-aşağı taşı
- [x] Final puan rozeti
- [x] "Sonraki story" yeni tur başlatıyor
- [x] Hepsi puanlanınca özet + toplam
- [x] Story'siz hızlı tur
- [x] Edge: aktif story silinince oylar temizleniyor + facilitator'a bildirim
