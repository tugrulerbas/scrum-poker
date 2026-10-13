# Scrum Poker v1
**Slug:** scrum-poker-v1

Kapsam: room-create-share, join-with-name, private-vote-reveal, results-consensus, story-queue, card-flip-reveal, consensus-confetti, emoji-throw, avatar-picker, coffee-break-card, vote-timer-nudge.

## Problem
Scrum ekipleri story point tahminini çoğu zaman ya hesap/kurulum isteyen araçlarla ya da sohbette sırayla oy verip birbirini etkileyerek yapıyor. Uzak ekipler için hesapsız, tek linkle girilen, oyların aynı anda açıldığı ve toplantıyı canlı tutan bir deneyim yok.

## Hedef / Hedef dışı
**Hedef**
- Oda kuran kişi link paylaşır; linke tıklayan herkes yalnızca ismini girerek oylamaya katılır.
- Gizli oy, eş zamanlı açılış, sonuç özeti ve story sırası ile eksiksiz bir tahmin oturumu.
- Eğlenceli ve modern his: animasyon, kutlama, tepkiler, avatarlar.
- Arayüz dili Türkçe.

**Hedef dışı**
- Hesap, kayıt, şifre, e-posta doğrulama.
- Jira API entegrasyonu ve Jira'ya puan yazma (story'ler elle girilir).
- Rol bazlı oy gruplama, özel deste editörü, geçmiş oturum arşivi/raporlama.

## Kullanıcı hikayeleri
Aşağıdaki feature bölümlerinde, her feature kendi hikayesiyle yer alır.

## Akış
1. Facilitator ana sayfada ismini girip "Oda kur" der; oda ve paylaşılabilir link oluşur.
2. Facilitator linki ekibe gönderir.
3. Katılımcı linke tıklar, ismini (ve isterse avatarını) seçip odaya girer.
4. Facilitator story ekler ve oylamayı başlatır.
5. Herkes gizlice kart seçer; kimin oy verdiği görünür, ne verdiği görünmez.
6. Herkes oy verince (veya facilitator tek tuşla) kartlar aynı anda açılır.
7. Sonuç ve konsensüs gösterilir; ya final puan kaydedilir ya da yeniden oylanır.
8. Sıradaki story'ye geçilir; tüm story'ler bitince özet liste görünür.

Varsayılan deste: Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, ?, ☕).

---

## 1. room-create-share — Oda oluştur ve link paylaş
**Hikaye:** Facilitator olarak hesap açmadan tek adımda oda kurup linki ekibimle paylaşmak istiyorum, böylece dakikalar içinde oylamaya başlayabilirim.

**Kabul kriterleri**
- [ ] Ana sayfada isim girip "Oda kur" ile oda oluşur; kullanıcı doğrudan odaya düşer.
- [ ] Oda başına benzersiz, tahmin edilmesi zor bir link üretilir ve odada görünür.
- [ ] "Linki kopyala" tek tıkla panoya kopyalar ve kopyalandığını belirtir.
- [ ] Odayı kuran kişi facilitator rolünü alır ve odada bu belirgindir.
- [ ] Hesap, giriş veya kayıt hiçbir noktada istenmez.

**Edge case'ler**
- Kopyalama izni yoksa link seçilebilir halde gösterilir.
- Var olmayan/süresi dolmuş oda linki: anlaşılır hata + "Yeni oda kur" yönlendirmesi.
- Facilitator odadan ayrılırsa oda devam eder; facilitator yetkisi odadaki başka birine geçer (bkz. Açık sorular).
- Boş veya yalnızca boşluktan oluşan isimle oda kurulamaz.

## 2. join-with-name — İsimle katıl
**Hikaye:** Katılımcı olarak linke tıklayıp sadece ismimi yazarak odaya girmek istiyorum, böylece sürtünmesiz oylamaya katılırım.

**Kabul kriterleri**
- [ ] Linke tıklayan kişi önce isim giriş ekranını görür; isim girince odaya katılır.
- [ ] Katılan kişi diğer herkesin listesinde anında görünür; ayrılınca (bağlantı kopunca) durumu "çevrimdışı" olur.
- [ ] Sayfa yenilenince veya sekme kapanıp açılınca aynı cihazdan tekrar girişte kişi aynı isim/oyuyla devam eder.
- [ ] Aynı isim tekrar kullanılırsa kullanıcı uyarılır ve ayırt edici bir ek önerilir.
- [ ] İsim uzunluğu sınırlıdır (örn. 1-24 karakter); sınır aşılınca açıklayıcı mesaj görünür.

**Edge case'ler**
- Oy açıkken (reveal sonrası) katılan kişi mevcut sonucu görür, o turda oy veremez; sonraki turdan itibaren oy verir.
- Çok sayıda katılımcıda liste okunabilir kalır (üst sınır Açık sorular'da).
- Emoji/özel karakterli isimler düzgün gösterilir; HTML/script içeren isimler metin olarak görünür.

## 3. private-vote-reveal — Gizli oy ve eş zamanlı açılış
**Hikaye:** Katılımcı olarak kimseden etkilenmeden gizlice oy vermek, facilitator olarak herkes hazır olunca oyları aynı anda açmak istiyorum.

**Kabul kriterleri**
- [ ] Aktif story için deste kartları görünür; tıklanan kart seçili olarak vurgulanır.
- [ ] Oy açılmadan önce diğer kişiler yalnızca "oy verdi / bekleniyor" durumunu görür, kart değerini görmez.
- [ ] Oy ilerlemesi gösterilir (örn. "4/6 oy verdi").
- [ ] Açılmadan önce kişi oyunu değiştirebilir veya geri çekebilir.
- [ ] Herkes oy verdiğinde kartlar otomatik açılır; facilitator ayrıca "Kartları aç" ile istediği an açabilir.
- [ ] Açıldıktan sonra oylar değişmez; yalnızca facilitator "Yeniden oyla" ile yeni tur başlatır ve tüm oylar temizlenir.
- [ ] Yalnızca facilitator açma ve yeniden oylama aksiyonlarını görür/kullanır.

**Edge case'ler**
- Oy vermemiş biri çevrimdışıysa "herkes oy verdi" otomatik açılışı çevrimdışıları bekletmez.
- Hiç oy yokken "Kartları aç" pasiftir (veya uyarır).
- Oy verdikten sonra bağlantısı kopan kişinin oyu geri geldiğinde korunur.
- İki kişi aynı anda açma/yeniden oyla tıklarsa tek bir tutarlı sonuç oluşur.

## 4. results-consensus — Sonuç istatistikleri ve konsensüs
**Hikaye:** Ekip olarak açılan oyların özetini ve fikir birliği olup olmadığını görmek istiyorum, böylece hızlıca karar verebilir ya da tartışabilirim.

**Kabul kriterleri**
- [ ] Açılışta ortalama, medyan ve oy dağılımı (hangi karttan kaç oy) gösterilir.
- [ ] Sayısal olmayan kartlar (?, ☕) istatistiğe katılmaz; dağılımda ayrı gösterilir.
- [ ] Herkes aynı kartı seçtiyse "Fikir birliği" durumu açıkça belirtilir.
- [ ] Oylar çok dağınıksa (örn. en düşük ve en yüksek oy arasında büyük fark) kullanıcıya "Tartışmaya değer" uyarısı çıkar; en düşük/en yüksek oyu verenler belirtilir.
- [ ] Facilitator sonuçtan "Bu puanı kaydet" (öneri: medyana/seçilen değere yakın kart) veya "Yeniden oyla" yapabilir.

**Edge case'ler**
- Yalnızca bir kişi oy verdiyse istatistik gösterilir ama konsensüs ilan edilmez.
- Tüm oylar "?" ise sayısal sonuç yerine "Belirsiz — daha fazla bilgi gerek" mesajı görünür.
- Ortalama deste dışı bir sayıya denk gelirse (örn. 4,3) olduğu gibi gösterilir, kaydedilecek puan kullanıcı seçimidir.

## 5. story-queue — Story sırası
**Hikaye:** Facilitator olarak oturum için story başlıklarını sıraya dizip sırayla oylamak ve her biri için final puanı kaydetmek istiyorum.

**Kabul kriterleri**
- [ ] Facilitator başlık (zorunlu) ve isteğe bağlı kısa açıklama/link alanıyla story ekler; liste odadaki herkese görünür.
- [ ] Aktif story belirgindir; facilitator herhangi bir story'yi aktif yapabilir.
- [ ] Facilitator story'yi düzenleyebilir, silebilir, sırasını değiştirebilir.
- [ ] Oylama sonrası seçilen final puan story'nin yanında görünür kalır.
- [ ] "Sonraki story"ye geçince oylar sıfırlanır ve yeni tur başlar.
- [ ] Tüm story'ler puanlanınca toplam puan ve story/puan özet listesi görünür.
- [ ] Story eklemeden de oda oylamaya izin verir (başlıksız hızlı tur).

**Edge case'ler**
- Oylama sürerken aktif story silinirse oylar temizlenir ve facilitator'a bilgi verilir.
- Puanlanmış story tekrar oylanırsa eski puan yeni kayıtla değişir.
- Çok uzun başlıklar kısaltılarak gösterilir, tamamı görüntülenebilir.
- Listede yüzlerce story olursa liste kaydırılabilir kalır.

---

## 6. card-flip-reveal — Kart çevrilme animasyonu
**Hikaye:** Katılımcı olarak oylar açılırken kartların çevrilmesini görmek istiyorum, böylece açılış anı heyecanlı olur.

**Kabul kriterleri**
- [ ] Açılışta her kart arka yüzden ön yüze 3D çevrilme animasyonuyla açılır.
- [ ] Kartlar aynı anda veya çok kısa, ardışık gecikmeyle çevrilir; toplam animasyon 1,5 sn'yi geçmez.
- [ ] Animasyon bitmeden istatistikler ve konsensüs görünmez; bitince görünür.
- [ ] Kullanıcının işletim sistemi "hareketi azalt" tercihi varsa animasyon sade geçişe indirgenir.

**Edge case'ler**
- Animasyon sırasında sayfaya yeni giren kişi doğrudan açılmış hali görür.
- Düşük performanslı cihazlarda animasyon takılırsa sonuç yine de gecikmeden okunabilir olur.

## 7. consensus-confetti — Fikir birliği konfetisi
**Hikaye:** Ekip olarak aynı karta oy verdiğimizde bunu kutlamak istiyorum, böylece uyumumuz eğlenceli şekilde fark edilir.

**Kabul kriterleri**
- [ ] Kartlar açıldıktan ve çevrilme animasyonu bittikten sonra herkes aynı sayısal kartı seçtiyse ekranda konfeti patlar.
- [ ] Konfeti birkaç saniye içinde kendiliğinden biter ve arayüzü engellemez.
- [ ] Konfeti odadaki herkeste aynı anda tetiklenir.
- [ ] Hareket azaltma tercihi olanlarda konfeti yerine sade bir "Fikir birliği" vurgusu görünür.

**Edge case'ler**
- Tek kişilik odada veya yalnızca 1 oy varsa konfeti çıkmaz.
- Herkes "?" veya ☕ seçtiyse konfeti çıkmaz.
- Aynı turda sonuç tekrar görüntülendiğinde (yenileme) konfeti tekrar patlamaz.

## 8. emoji-throw — Emoji tepkileri ve fırlatma
**Hikaye:** Katılımcı olarak tepkimi emoji ile göstermek ve arkadaşıma kağıt/emoji fırlatmak istiyorum, böylece toplantı eğlenceli kalır.

**Kabul kriterleri**
- [ ] Odada hızlı tepki paleti bulunur (örn. 👍 😂 🤔 🔥 🎉); seçilen emoji odadaki herkese kısa süreli animasyonla görünür.
- [ ] Bir oyuncunun avatarına/adına tıklayıp emoji seçilerek o kişiye doğru fırlatma animasyonu yapılır; hedef kişi bildirim görür.
- [ ] Tepki ve fırlatmalar oy gizliliğini ve oy açılışını bozmaz; kimin ne oy verdiğine dair ipucu içermez.
- [ ] Spam'e karşı aynı kişi kısa sürede sınırlı sayıda tepki gönderebilir; sınır aşılınca kısa bekleme bildirilir.
- [ ] Kullanıcı gelen fırlatma/tepki animasyonlarını kendi ekranında kapatabilir.

**Edge case'ler**
- Hedef kişi çevrimdışıysa fırlatma gönderilmez, kullanıcı bilgilendirilir.
- Kişi kendine fırlatma yapamaz.
- Hareket azaltma tercihi olanlarda animasyon yerine statik rozet görünür.

## 9. avatar-picker — Avatar seçimi
**Hikaye:** Katılımcı olarak katılırken kendime eğlenceli bir avatar seçmek istiyorum, böylece masada tanınır ve eğlenceli görünürüm.

**Kabul kriterleri**
- [ ] İsim ekranında hazır avatar/emoji seçenekleri sunulur; seçim zorunlu değildir.
- [ ] Seçim yapılmazsa isme bağlı otomatik bir avatar atanır.
- [ ] Avatar, katılımcı listesinde ve kart masasında isimle birlikte görünür.
- [ ] Kullanıcı odadayken avatarını değiştirebilir; değişiklik herkeste anında görünür.
- [ ] Seçilen avatar aynı cihazdan tekrar girişte hatırlanır.

**Edge case'ler**
- İki kişi aynı avatarı seçebilir; ayrım isimle yapılır.
- Avatar yüklenemezse isim baş harfli yedek görünüm gösterilir.

## 10. coffee-break-card — Kahve molası kartı
**Hikaye:** Katılımcı olarak molaya ihtiyacım olduğunu kartla belirtmek, ekip olarak da herkes moladaysa kısa mola yapmak istiyorum.

**Kabul kriterleri**
- [ ] Destede ☕ kartı bulunur ve tıklanınca diğer kartlar gibi gizli oy olarak seçilir.
- [ ] Açılışta ☕ seçenler sonuçta ayrı gösterilir; sayısal istatistiğe katılmaz.
- [ ] Odadaki tüm aktif katılımcılar ☕ seçtiyse oda tam ekran "Mola zamanı" ekranına geçer.
- [ ] Mola ekranında herkesin gördüğü bir geri sayım/süre ve "Molayı bitir" (facilitator) aksiyonu vardır.
- [ ] Mola bitince oda önceki story ve yeni (boş) tura geri döner.

**Edge case'ler**
- Yalnızca bazıları ☕ seçtiyse mola ekranı açılmaz; diğerlerinin oyları normal değerlendirilir.
- Mola sırasında yeni biri katılırsa mola ekranını görür.
- Mola sırasında story ve puanlar korunur.

## 11. vote-timer-nudge — Zamanlayıcı ve dürtme
**Hikaye:** Facilitator olarak oylamaya süre koymak ve oy vermeyeni nazikçe dürtmek istiyorum, böylece toplantı uzamaz.

**Kabul kriterleri**
- [ ] Facilitator tur için süre seçip (örn. 30 sn, 1 dk, 2 dk) zamanlayıcıyı başlatır; kalan süre herkese aynı anda görünür.
- [ ] Süre bitince kartlar otomatik açılmaz; odaya "Süre doldu" bildirilir ve facilitator açma kararını verir (bkz. Açık sorular).
- [ ] Facilitator oy vermemiş kişilere tek tıkla "dürt" gönderebilir; kişi ekranında nazik bir uyarı (görsel + varsa sesli) görür.
- [ ] Dürtme, kişinin oy vermemiş olduğunu zaten herkesin gördüğü bilgiden fazlasını açığa çıkarmaz.
- [ ] Aynı kişiye art arda dürtme kısa bir bekleme süresiyle sınırlıdır.
- [ ] Yeniden oylama veya sonraki story zamanlayıcıyı sıfırlar.

**Edge case'ler**
- Herkes süre dolmadan oy verirse zamanlayıcı durur.
- Süre içinde oy açılırsa zamanlayıcı biter.
- Sayfa yenilense veya geç katılsa bile kalan süre doğru gösterilir.
- Oy vermiş veya çevrimdışı kişiye dürtme gönderilemez.

## Açık sorular
1. Facilitator ayrılırsa yetki otomatik olarak en eski katılımcıya mı geçsin, yoksa facilitator "yetki devret" mi yapsın? (Varsayım: en eski katılımcıya otomatik.)
2. Oda ömrü ne kadar? İnaktif oda ne zaman silinsin? (Varsayım: kullanıcıya bildirim olmadan uzun süre inaktif oda kapanır; süre architect'e bırakıldı.)
3. Oda başına katılımcı üst sınırı nedir? (Varsayım: ~20.)
4. Gözlemci (oy vermeyen izleyici) rolü v1'de var mı? (Varsayım: yok, herkes oy verir.)
5. Süre dolunca kartlar otomatik açılsın mı? (Varsayım: açılmasın, facilitator karar versin.)
6. Final puan seçimi: sistem medyanı mı önersin, facilitator elle mi seçsin? (Varsayım: medyana yakın deste kartı önerilir, facilitator değiştirebilir.)
7. Oda linki paylaşan herkes katılabilir; oda şifresi/kilidi gerekli mi? (Varsayım: yok.)
8. Özel deste (T-shirt, Fibonacci dışı) v1'de var mı? (Varsayım: yalnızca Fibonacci.)
9. Sesli dürtme/bildirim varsayılan açık mı? (Varsayım: kapalı, kullanıcı açar.)
