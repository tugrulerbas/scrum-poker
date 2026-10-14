# Odadaki Kullanıcıya GIF Gönderme
**Slug:** gif-send

## Problem
Uzak ekiplerde toplantı havası kuru kalıyor; kullanıcılar birbirine espri/tepki iletmek istiyor ama oda içinde bunun yolu yok. Kullanıcı, bir GIF linkini odadaki birinin kartı üzerinde kısa süre oynatarak anlık, eğlenceli bir tepki verebilmeli.

## Hedef / Hedef dışı
Hedef:
- Kullanıcı bir GIF URL'si girip odadaki bir kullanıcıya gönderebilsin.
- GIF, hedef kullanıcının kartının/kutusunun üzerinde odadaki herkesin ekranında kısa süre oynasın, sonra kaybolsun.
- Kendi kartına hover edince küçük bir "GIF" butonu çıksın; gönderim buradan başlasın.
- Kötüye kullanıma karşı temel güvenlik (URL doğrulama, yalnızca https, hız sınırı).

Hedef dışı:
- GIF arama / Giphy-Tenor entegrasyonu, dosya yükleme.
- GIF'lerin kalıcı saklanması veya geçmişi.
- Ses, video dosyaları (mp4/webm) desteği.
- Moderasyon paneli, kullanıcı engelleme/raporlama.

## Kullanıcı hikayeleri
- Kullanıcı olarak kendi kartımın üzerine gelince "GIF" butonunu görmek istiyorum, böylece GIF göndermeye hızlıca başlayabilirim.
- Kullanıcı olarak bir GIF linki yapıştırıp göndermek istiyorum, böylece istediğim GIF'i kullanabilirim.
- Kullanıcı olarak GIF'in kimin kartına gideceğini seçmek istiyorum, böylece tepkimi doğru kişiye yöneltebilirim.
- Kullanıcı olarak bana gönderilen GIF'in kartımın üzerinde kısa süre oynayıp kaybolmasını istiyorum, böylece oylama akışım bozulmaz.
- Kullanıcı olarak geçersiz/güvensiz linklerde net bir uyarı görmek istiyorum, böylece neyin yanlış olduğunu anlarım.
- Kullanıcı olarak istenmeyen GIF'leri kapatabilmek istiyorum, böylece dikkatim dağılmaz.

## Akış
1. Kullanıcı odada, masadaki kendi kartının/kutusunun üzerine gelir (hover); küçük bir "GIF" butonu görünür.
2. Butona tıklar; küçük bir panel açılır: GIF URL alanı, hedef kullanıcı seçimi ve "Gönder" butonu.
3. Kullanıcı linki yapıştırır; geçerliyse küçük bir önizleme görünür, geçersizse satır içi hata mesajı çıkar.
4. Hedefi seçer (varsayım: odadaki diğer katılımcılar listelenir, bir tanesi seçilir; kendisi listede yoktur).
5. "Gönder"e basar; panel kapanır, kısa bir onay (ör. "GIF gönderildi") görünür.
6. Odadaki herkes, GIF'i hedef kullanıcının kartı/kutusunun üzerinde oynarken görür (varsayım: yaklaşık 4 sn).
7. Süre dolunca GIF kaybolur; kart normal haline döner.
8. Gönderen kısa bir bekleme süresi dolana kadar tekrar gönderemez; buton bu sürede devre dışı görünür.

## Kabul kriterleri
- [ ] Kullanıcı kendi kartının üzerine gelince "GIF" butonu görünür; fareyi çekince (panel açık değilse) kaybolur.
- [ ] Başkalarının kartında "GIF" butonu görünmez.
- [ ] Butona tıklayınca URL girişi, hedef seçimi ve Gönder butonu içeren panel açılır; Esc veya dışarı tıklama paneli kapatır.
- [ ] Yalnızca `https://` ile başlayan linkler kabul edilir; `http://`, `data:`, `javascript:`, `file:` vb. reddedilir ve hata mesajı gösterilir.
- [ ] Link boşsa, çok uzunsa (varsayım: 500 karakter üstü) veya URL olarak ayrıştırılamıyorsa Gönder devre dışıdır / hata gösterilir.
- [ ] Hedef seçilmeden gönderim yapılamaz.
- [ ] Gönderilen GIF, odadaki tüm bağlı kullanıcıların ekranında hedef kullanıcının kartı üzerinde oynar.
- [ ] GIF yaklaşık 4 sn sonra otomatik kaybolur ve oylama/açma akışını engellemez (kart seçimi, oy açma çalışmaya devam eder).
- [ ] GIF yüklenemezse (kırık link, resim olmayan içerik) hedef kartta hiçbir bozuk görsel/ikon kalmaz; gönderene hata bildirimi gösterilmez zorunlu değildir, ancak oda akışı bozulmaz.
- [ ] Aynı kullanıcı kısa sürede art arda gönderemez (varsayım: 10 sn'de en fazla 1 gönderim); sınır aşılırsa kullanıcıya "Biraz bekle" benzeri Türkçe mesaj gösterilir.
- [ ] Odada aynı anda çok GIF gelirse (varsayım: aynı hedefte tek GIF) yeni GIF öncekini değiştirir veya sıraya girer; ekranda üst üste yığılma olmaz.
- [ ] Kullanıcı, gelen GIF'leri kapatan bir seçenek (kendi ekranı için) bulabilir; kapalıyken GIF'ler o kullanıcıda görünmez.
- [ ] Odadan ayrılmış / bağlantısı kopmuş bir kullanıcıya gönderim yapılamaz; seçim listesinde yalnızca odadaki kullanıcılar bulunur.
- [ ] Tüm arayüz metinleri Türkçedir.
- [ ] Mobil/dokunmatik cihazda hover olmadığı için aynı işlev kendi kartına dokunarak erişilebilir (bkz. Edge case'ler).

## Edge case'ler
- **Mobil / hover yok:** Dokunmatik cihazlarda kendi kartına dokunmak (veya sürekli görünen küçük GIF butonu) aynı paneli açar. Mevcut kart seçme etkileşimiyle çakışmamalı.
- **Klavye erişilebilirliği:** Buton klavyeyle odaklanılabilir olmalı; odaklanınca görünür hale gelir.
- **URL güvenliği:** Yalnızca https; kullanıcı bilgisi içeren (`user:pass@`) linkler reddedilir; yerel/özel ağ adresleri (localhost, IP adresleri) reddedilir. Doğrulama sunucuda da yapılır, yalnızca istemcide değil.
- **İçerik türü:** Link bir GIF'e (veya animasyonlu görsele) işaret etmeli; varsayım olarak uzantı `.gif` olan veya bilinen GIF servis alanlarından gelen linkler kabul edilir (bkz. Açık sorular). Resim olmayan sayfa linkleri (ör. giphy.com/gifs/... sayfası) çalışmayabilir ve bu kullanıcıya açıklanmalı.
- **Gizlilik:** GIF'i yükleyen dış sunucu, izleyenlerin IP'sini görür; bu kabul edilen bir takas olarak belirtilir (kısa bilgi notu).
- **Uygunsuz içerik:** Otomatik moderasyon yok; kötüye kullanım riski var. Hız sınırı + kapatma seçeneği ilk koruma olarak yeterli sayılır.
- **Hız sınırı:** Gönderen başına bekleme süresi; ayrıca oda başına toplam sınır (varsayım: dakikada 10) ve spam durumunda mesaj.
- **Kendine gönderim:** Varsayım olarak kapalı (hedef listesinde kendisi yok).
- **Hedef ayrılırsa:** GIF oynarken hedef odadan çıkarsa GIF kaybolur.
- **Oy açılışı / yeni tur / story değişimi sırasında:** Oynayan GIF kesilmez ya da kısa süre sonra bitmesine izin verilir; oy akışını bozmaz.
- **Geç katılan kullanıcı:** O an oynayan GIF'i görmeyebilir; sonradan gelene geçmiş GIF'ler gösterilmez.
- **Çok büyük GIF:** Yükleme çok uzun sürerse veya çok büyükse gösterim zaman aşımına uğrar ve sessizce kaybolur.
- **Sekme arka planda:** GIF süresi dolmuş olabilir; sekme öne gelince eski GIF gösterilmez.
- **Hareket azaltma tercihi:** Sistemde "hareketi azalt" açıksa GIF yine de gösterilebilir mi? Varsayım: gösterilmez ya da ilk karede durur (bkz. Açık sorular).
- **Gözlemci / oy vermeyen katılımcı:** Kartı olmayan kullanıcılar için gönderme/alma davranışı belirsiz (bkz. Açık sorular).

## Açık sorular
> **Kullanıcı kararı (1. soru):** Hedef seçimi yok — seçenek (c). GIF gönderenin KENDİ kartında oynar, odadaki herkes görür. Bu nedenle hedef seçimiyle ilgili hikaye (3.), akış adımı 4, "Hedef seçilmeden gönderim yapılamaz" ve "ayrılmış kullanıcıya gönderim / seçim listesi" kabul kriterleri ile "Kendine gönderim" edge case'i geçersizdir; GIF'in "hedef kartta" oynadığını söyleyen maddeler "gönderenin kartında" olarak okunur.

1. **Hedef seçimi nasıl olacak?** (Karar: c — yukarıya bakın.) Kullanıcının ifadesi "kendi kartının üstüne gelince buton çıksın" diyor ama hedefi belirtmiyor. Seçenekler: (a) butondan sonra panelde hedef kullanıcı seçimi, (b) GIF tüm odaya/herkesin kartında oynar, (c) GIF yalnızca kendi kartında oynar (kendini ifade etme). **Varsayım:** (a) — butona tıkla, linki gir, listeden bir hedef seç; GIF hedefin kartında herkese gösterilir. Alternatif olarak hedef kartına tıklayarak seçim de düşünülebilir.
2. GIF oynatma süresi sabit mi (varsayım 4 sn) yoksa GIF'in kendi uzunluğuna mı bağlı olsun (üst sınırla)?
3. Hangi linkler kabul edilsin: yalnızca doğrudan `.gif` dosya linkleri mi, yoksa belirli servislerin (Giphy, Tenor) alanları da mı? Varsayım: https + doğrudan görsel linki; alan adı beyaz listesi yok.
4. Hedef kullanıcı veya oda yöneticisi (facilitator) gelen GIF'leri engelleyebilsin mi, yoksa yalnızca her kullanıcı kendi ekranı için mi kapatsın? Varsayım: yalnızca kendi ekranı için.
5. Gözlemci/oy vermeyen katılımcılar GIF gönderebilir/alabilir mi? Varsayım: kartı olan tüm katılımcılar gönderip alabilir.
6. Gönderenin kim olduğu hedefte gösterilsin mi (ör. "Ayşe gönderdi")? Varsayım: evet, GIF üzerinde küçük bir etiket.
7. "Hareketi azalt" tercihinde GIF nasıl davranmalı? Varsayım: gösterilmez, yerine yalnızca gönderen adı etiketi çıkar.
8. Hız sınırı değerleri (10 sn bekleme, dakikada 10) uygun mu?
9. emoji-throw feature'ı ile hedef seçimi/animasyon katmanı ortak mı tasarlansın? Varsayım: bağımsız ilerler, analizde birleştirme değerlendirilir.
