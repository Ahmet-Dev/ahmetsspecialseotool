# Security Policy

## 🔒 Güvenlik Politikası

Ahmet's Special SEO Tool güvenliği ciddiye alır ve kullanıcı verilerinin korunması için gerekli önlemleri almıştır.

## 🛡️ Desteklenen Versiyonlar

| Versiyon | Güvenlik Desteği |
| ------- | --------------- |
| 1.0.x   | ✅ Destekleniyor |
| < 1.0   | ❌ Desteklenmiyor |

## 🚨 Güvenlik Açığı Bildirimi

Güvenlik açığı tespit ettiyseniz, lütfen aşağıdaki adımları takip edin:

### 📧 İletişim
**Email**: iletisimahmetkahraman@gmail.com

**Konu**: `[SECURITY] Güvenlik Açığı Raporu - SEO Tool`

### 📝 Rapor İçeriği
Raporunuzda şunları belirtin:
- Açığın tanımı ve kapsamı
- Yeniden üretme adımları
- Potansiyel etki analizi
- Önerilen çözüm (varsa)

### ⏱️ Yanıt Süresi
- **İlk yanıt**: 24 saat içinde
- **Durum güncellemesi**: 72 saat içinde  
- **Çözüm**: Kritiklik seviyesine göre 1-30 gün

## 🔐 Güvenlik Önlemleri

### Mevcut Korumalar:
- ✅ **7G Firewall**: SQL injection, XSS, CSRF koruması
- ✅ **Rate Limiting**: DDoS ve brute force koruması
- ✅ **Input Validation**: Tüm kullanıcı girdileri doğrulanır
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options
- ✅ **CORS Koruması**: Sadece izinli domain'lerden erişim
- ✅ **Session Security**: Güvenli cookie ve session yönetimi

### Docker Güvenliği:
- ✅ **Alpine Linux**: Minimal attack surface
- ✅ **Non-root User**: Container root yetkisi ile çalışmaz
- ✅ **Health Checks**: Sürekli sağlık kontrolü
- ✅ **Read-only Filesystem**: Yazma koruması

## 🚫 Güvenlik Politikaları

### Yasak Aktiviteler:
- **Penetration Testing**: İzinsiz güvenlik testi yapılması
- **Reverse Engineering**: Yazılımın tersine mühendisliği
- **Data Scraping**: Toplu veri çekme girişimleri
- **API Abuse**: API limitlerini aşan kullanım

### İhlal Sonuçları:
1. **IP Blocking**: Otomatik IP yasaklama
2. **Legal Action**: Hukuki işlem başlatma
3. **ISP Notification**: İnternet sağlayıcı bildirimi

## 🏆 Güvenlik Ödülleri

Ciddi güvenlik açıkları için teşekkür ve atıf verilir:

### Kritiklik Seviyeleri:
- **Kritik**: Remote Code Execution, Authentication Bypass
- **Yüksek**: SQL Injection, XSS, CSRF
- **Orta**: Information Disclosure, DoS
- **Düşük**: Minor configuration issues

### Ödül Sistemi:
- **Kritik**: Hall of Fame + LinkedIn Recommendation
- **Yüksek**: Hall of Fame + Public Thanks
- **Orta**: Public Thanks
- **Düşük**: Private Thanks

## 📋 Hall of Fame

*Henüz güvenlik açığı raporu alınmamıştır.*

## 🔍 Güvenlik Denetimi

Son güvenlik denetimi: **6 Eylül 2025**

### Test Edilen Alanlar:
- Frontend React bileşenleri
- Backend API güvenliği
- Docker container security
- Nginx configuration
- Third-party dependencies

## 📞 Acil Durum İletişimi

**Kritik güvenlik açıkları için:**
- **Email**: iletisimahmetkahraman@gmail.com
- **Konu**: `[URGENT SECURITY] Kritik Güvenlik Açığı`

**Beklenen yanıt süresi**: 2 saat (çalışma saatleri)

---

**Son güncelleme**: 6 Eylül 2025  
**Geçerli versiyon**: v1.0
