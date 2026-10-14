# GIPHY Aramasıyla GIF Seçme
**Slug:** gif-search

Not: `gif-send` feature'ının geliştirmesidir. Orada kararlaştırılan ve burada "korunur" denen davranışlar aynen geçerlidir.

## Problem
Bugün GIF göndermek için kullanıcının dışarıda bir GIF bulup doğrudan `.gif` linkini kopyalayıp yapıştırması gerekiyor. Bu zor ve yavaş; birçok kullanıcı doğru (doğrudan görsel) linki bulamıyor, GIF özelliği kullanılmıyor. Slack'teki gibi uygulama içinde arayıp tıklayarak seçmek isteniyor.

## Hedef / Hedef dışı
Hedef:
- GIF panelinde arama kutusu ve sonuç ızgarası olsun; kullanıcı bir GIF'e tıklayıp seçsin ve göndersin.
- Arama kutusu boşken trend GIF'ler gösterilsin.
- Sonuçlar GIPHY'den gelsin; GIPHY atıf kuralına uyulsun ("Powered by GIPHY").
- GIPHY API anahtarı gizli kalsın; tarayıcıya hiçbir şekilde ulaşmasın.
- Sunucu yalnızca GIPHY kaynaklı GIF'leri kabul etsin.

Korunacaklar (davranış değişmez):
- GIF, gönderenin kendi kartında odadaki herkese yaklaşık 4 sn oynar, sonra kaybolur.
- Gönderim hız sınırı (gönderen başına 10 sn'de 1, oda başına dakikada 10) ve "Biraz bekle" mesajı.
- "GIF'leri gizle" anahtarı (kullanıcının kendi ekranı için).
- "Hareketi azalt" tercihindeki davranış.
- Kendi kartına hover edince çıkan küçük "GIF" butonu (klavye ve dokunmatik erişimi dahil).

Hedef dışı:
- Tenor veya başka GIF sağlayıcıları, sticker/emoji sekmeleri, kategori sekmeleri.
- Favoriler, son kullanılanlar, GIF geçmişi.
- Dosya yükleme.
- Moderasyon paneli, kullanıcı engelleme/raporlama.

## Kullanıcı hikayeleri
- Kullanıcı olarak GIF panelinde bir şey yazıp arayabilmek istiyorum, böylece link aramadan istediğim GIF'i bulurum.
- Kullanıcı olarak panel açılır açılmaz trend GIF'leri görmek istiyorum, böylece ne arayacağımı bilmesem de seçebilirim.
- Kullanıcı olarak bir GIF'e tıklayıp seçmek ve göndermek istiyorum, böylece link kopyalamam gerekmez.
- Kullanıcı olarak yükleniyor, sonuç yok ve hata durumlarında ne olduğunu görmek istiyorum, böylece panelin bozuk olduğunu düşünmem.
- Kullanıcı olarak iş yerine uygun içerik görmek istiyorum, böylece toplantıda uygunsuz GIF çıkmaz.
- Kullanıcı olarak GIF'i kendi ekranım için kapatabilmek istiyorum, böylece dikkatim dağılmaz (mevcut davranış).

## Akış
1. Kullanıcı kendi kartına hover eder, "GIF" butonuna tıklar; panel açılır.
2. Panelde üstte arama kutusu (odaklanmış halde), altında sonuç ızgarası, en altta "Powered by GIPHY" atfı bulunur. Arama kutusu boşken ızgarada trend GIF'ler görünür.
3. Kullanıcı yazdıkça, yazmayı kısa süre bıraktıktan sonra (debounce) arama yapılır; ızgara sonuçlarla güncellenir. Arama sürerken yükleniyor durumu görünür.
4. Kullanıcı bir GIF'e tıklar; GIF seçili olarak vurgulanır (tekrar tıklayınca seçim kalkar, başka bir GIF'e tıklayınca seçim değişir).
5. "Gönder" yalnızca bir GIF seçiliyken etkindir. Kullanıcı gönderir; panel kapanır, kısa onay ("GIF gönderildi") görünür.
6. GIF, kullanıcının kendi kartında herkesin ekranında yaklaşık 4 sn oynar ve kaybolur (gif-send ile aynı).
7. Anahtar yapılandırılmamışsa veya GIPHY erişilemiyorsa panel ilgili Türkçe durumu gösterir (aşağıya bakın).

## Kabul kriterleri
- [ ] GIF panelinde arama kutusu, sonuç ızgarası ve "Powered by GIPHY" atfı görünür; panel açılınca arama kutusu odaklıdır.
- [ ] Arama kutusu boşken trend GIF'ler listelenir.
- [ ] Yazma durduktan kısa süre sonra arama çalışır; her tuş vuruşunda ayrı istek gitmez. Hızlı yazılırken eski aramanın geç dönen sonucu yeni sonuçların üzerine yazılmaz.
- [ ] Arama sürerken yükleniyor göstergesi, sonuç yoksa "sonuç bulunamadı" benzeri Türkçe boş durum, istek başarısızsa Türkçe hata mesajı ve "Tekrar dene" eylemi görünür.
- [ ] Izgarada sonuçlar küçük önizleme olarak görünür; kullanıcı bir GIF'e tıklayarak seçer, seçili olan belirgin vurgulanır; seçim klavyeyle de yapılabilir.
- [ ] Bir GIF seçili değilken "Gönder" devre dışıdır; seçiliyken gönderince GIF kendi kartında herkese yaklaşık 4 sn oynar.
- [ ] Sonuçlar güvenli (iş yerine uygun) içerik derecelendirmesiyle sınırlıdır; kullanıcı bunu değiştiremez. Uygunsuz içerik aramalarında da (ör. bilinen uygunsuz terimler) açık içerik görünmez.
- [ ] GIPHY API anahtarı tarayıcıya gitmez: sayfa kaynağında, ağ isteklerinde (URL, başlık, yanıt), istemci kodunda görünmez. İstemci yalnızca uygulamanın kendi sunucusuyla konuşur.
- [ ] Sunucuda anahtar tanımlı değilse uygulama çökmez; GIF butonu görünmeye devam eder (veya gizlenir, bkz. Açık sorular) ve panel açılırsa "GIF araması şu an kullanılamıyor" benzeri Türkçe mesaj gösterir. Odanın geri kalanı normal çalışır.
- [ ] Sunucu, gönderilen GIF'in yalnızca GIPHY kaynaklı olduğunu doğrular; GIPHY dışı bir adres (elle üretilmiş istek dahil) reddedilir, odada oynatılmaz.
- [ ] Arama isteklerine hız sınırı uygulanır (kötüye kullanımda GIPHY kotası tükenmesin); sınır aşılırsa kullanıcı "Biraz bekle" benzeri Türkçe mesaj görür. Gönderim hız sınırları (10 sn'de 1, dakikada 10) değişmeden geçerlidir.
- [ ] Arama metni uzunluk sınırına sahiptir; boşluk/boş metin trend durumuna döner.
- [ ] "GIF'leri gizle" açıkken gelen GIF'ler o kullanıcıda görünmez; "hareketi azalt" açıkken eski davranış (GIF oynamaz, yalnızca gönderen etiketi) korunur. Panelde de önizlemeler hareketi azalt tercihine saygı gösterir (ör. hareketsiz önizleme).
- [ ] Esc veya dışarı tıklama paneli kapatır; mobilde ızgara kaydırılabilir ve dokunarak seçilebilir.
- [ ] "Powered by GIPHY" atfı panelde her zaman görünür; GIPHY'nin kullanım koşullarının gerektirdiği atıf kuralları sağlanır.
- [ ] Tüm arayüz metinleri Türkçedir.

## Edge case'ler
- **API anahtarı yok / geçersiz / kota dolmuş:** Kullanıcıya anlamlı Türkçe mesaj; sunucu çökmez, anahtar hata mesajlarında bile sızmaz.
- **GIPHY erişilemiyor / yavaş:** Zaman aşımında hata durumu ve tekrar dene; panel takılı kalmaz.
- **Hızlı yazma / ardışık aramalar:** Yalnızca en son aramanın sonucu gösterilir.
- **Arama sonucu yok:** Boş durum mesajı; kullanıcı yeni arama yapabilir.
- **Sonuçların bazı görselleri yüklenmezse:** Bozuk görsel ikonu kalmaz, ızgara düzeni bozulmaz.
- **Seçili GIF varken arama değişirse:** Seçim korunur mu sıfırlanır mı belirsiz (varsayım: seçim sıfırlanır).
- **Çok sayıda sonuç:** Varsayım: ilk sayfa (yaklaşık 20-30 GIF) gösterilir; sonsuz kaydırma yok.
- **Eski/elle yapıştırılmış istek:** Sunucu GIPHY dışı kaynağı ve geçersiz biçimi reddeder, kullanıcıya genel hata gösterir.
- **Gizlilik:** Aramalar sunucu üzerinden GIPHY'ye gider; ancak GIF görselleri izleyenlerin tarayıcısına GIPHY'nin sunucularından yüklenir ve IP'leri GIPHY'ye görünür. Panelde kısa bir bilgi notu gerekebilir (bkz. Açık sorular).
- **Reklam/ek içerik:** Yalnızca GIF sonuçları; sponsorlu veya sticker içeriği varsa gösterilmez.
- **Anahtar olmayan ortam (lokal dev):** Özellik zarifçe devre dışı kalır; geliştirici nedenini mesajdan anlar.

## Açık sorular
1. **Link yapıştırma kalsın mı?** Varsayım: kaldırılır; yalnızca GIPHY araması kalır (basitlik, güvenlik ve "yalnızca GIPHY kaynaklı" kuralıyla tutarlı). Alternatif: panelde ikincil bir "Link yapıştır" seçeneği; ancak bu GIPHY dışı kaynak kabulünü gerektirir ve sunucu kuralıyla çelişir.
2. **İçerik derecelendirmesi hangi seviye?** Varsayım: "g" (en güvenli, iş yeri için). Alternatif "pg" veya "pg-13" daha geniş seçim sunar ama risk artar.
3. **Anahtar yoksa GIF butonu ne yapsın?** Varsayım: buton görünür, panel "GIF araması şu an kullanılamıyor" der. Alternatif: buton tamamen gizlenir.
4. **GIPHY anahtar türü / üretim erişimi:** GIPHY geliştirici anahtarları başlangıçta düşük kotalıdır (sınırlı istek); canlıda "production" onayı gerekebilir. Varsayım: ekip bunu ayrıca yönetir; kota dolunca hata durumu gösterilir.
5. **Arama hız sınırı değerleri:** Varsayım: kullanıcı/IP başına makul bir sınır (ör. dakikada 30 arama). Uygun mu?
6. **Aynı aramanın kısa süreli önbelleğe alınması** istenir mi (kota tasarrufu)? Varsayım: evet, kısa süreli; kullanıcıya görünür fark yaratmaz.
7. **Mevcut gif-send'in "GIF linki" API'si/davranışı** geriye dönük uyumluluk gerektiriyor mu (açık eski sekmeler)? Varsayım: gerekmez; deploy sonrası eski istemciler yenilenene kadar hata alabilir.
8. **Gizlilik notu** panelde gösterilsin mi ("GIF'ler GIPHY'den yüklenir")? Varsayım: atıfın yanında kısa not yeterli.
9. **Hareketi azalt:** Panel önizlemeleri hareketsiz mi olsun, yoksa yalnızca odadaki oynatma mı kısıtlansın? Varsayım: ikisi de hareketsiz/etiketli.
10. **Sonuç sayısı / sayfalama:** Varsayım: tek sayfa, sonsuz kaydırma yok.
