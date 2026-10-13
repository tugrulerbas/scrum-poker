# Backlog

| Slug | Başlık | Değer | Efor | Durum |
|------|--------|-------|------|-------|
| room-create-share | Oda oluştur ve paylaşılabilir link üret | Y | S | done |
| join-with-name | Linke tıklayıp kendi ismini girerek odaya katıl | Y | S | done |
| private-vote-reveal | Gizli oy ver, herkes oy verince/facilitator tek tuşla aynı anda aç | Y | M | done |
| results-consensus | Sonuç istatistikleri (ortalama/medyan/dağılım) ve konsensüs göstergesi | Y | S | done |
| story-queue | Story/issue listesi: başlık ekle, sırayla oyla, final puanı kaydet | Y | M | done |
| card-flip-reveal | Kartların açılışta 3D çevrilme animasyonu | O | S | analyzed |
| consensus-confetti | Herkes aynı kartı seçince konfeti kutlaması | O | S | analyzed |
| emoji-throw | Emoji tepkileri ve oyuncu masasına kağıt/emoji fırlatma | O | M | analyzed |
| avatar-picker | Katılırken eğlenceli avatar/emoji seçimi | O | S | analyzed |
| coffee-break-card | Deste içinde kahve molası kartı, tüm oda moladaysa mola ekranı | O | S | analyzed |
| vote-timer-nudge | Oylama zamanlayıcısı ve oy vermeyeni dürtme | O | M | analyzed |
| scrum-poker-v1 | Birleşik spec: yukarıdaki 11 feature'ı kapsar (5 MVP + 6 eğlenceli) | Y | L | done |

## Gerekçeler

Çekirdek MVP (zorunlu: link paylaş, isimle katıl, oyla)
- **room-create-share**: Zorunlu çekirdek. Pointing Poker ve Kollabe gibi araçlarda hesap açmadan tek tıkla oda + link akışı standarttır.
- **join-with-name**: Zorunlu çekirdek. Giriş sürtünmesi sıfır olmalı; yalnızca isim istenir (Pointing Poker, Scrum Poker Online yaklaşımı).
- **private-vote-reveal**: Planning Poker'ın özü. Jira eklentileri (Sync Poker, Planning Poker for Jira) gizli oyları birlikte açmayı temel alır; çapa etkisini önler. Oy ilerleme göstergesi PointPoker'dan.
- **results-consensus**: Sync Poker ortalama/medyan/mod/aralık gösterir; Planning Poker for Jira oylar çok dağıldığında uyarır. Konsensüs yoksa yeniden oylama (re-vote) tek tıkla.
- **story-queue**: Jira eklentilerinin issue bazlı tahmin akışı, Parabol Sprint Poker'ın ticket sırası. Jira entegrasyonu şimdilik kapsam dışı, elle başlık girişi yeterli; sonuç story point olarak listede kalır.

Eğlenceli / yenilikçi
- **card-flip-reveal**: Parabol'ün etkileşimli kart destesi hissinden ilham; açılış anını toplantının "an"ına çevirir. Düşük efor, yüksek his.
- **consensus-confetti**: Ortak fikir birliği ödüllendirilsin; ekip aynı sayfada olmayı kutlar. Araştırmada rakiplerde belirgin bir karşılığı bulunmadı, ayrışma noktası.
- **emoji-throw**: Parabol ve Kollabe emoji tepkilerini sunuyor; üstüne oyuncuya "kağıt fırlatma" ile oyun hissi ekleniyor. Toplantı enerjisini canlı tutar.
- **avatar-picker**: Parabol/Kollabe'deki kişiselleştirme; isim yanında avatar ile masa daha canlı, uzak ekipte kimlik hissi.
- **coffee-break-card**: AgileDeck gibi eklentilerdeki "?" ve kahve kartı geleneği; uzun toplantılarda mola sinyali. Eğlenceli ek: herkes kahve seçerse mola ekranı.
- **vote-timer-nudge**: Zamanlayıcı toplantıyı hızlandırır; oy vermeyeni nazikçe dürtmek (PointPoker oy ilerlemesi ilhamı) bekleme sorununu çözer. Rakiplerde belirgin değil, farklılaşma fırsatı.

Notlar: Jira'ya story point yazma (Sync Poker, AgileDeck, PointPoker'da var) ve rol bazlı oy gruplama değerli ama sonraki turda ele alınmalı.
