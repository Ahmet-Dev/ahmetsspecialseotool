# Ahmet's Special SEO Tool

Kapsamlı SEO analizi ve optimizasyon önerileri sunan modern web uygulaması. Sayfa içi, sayfa dışı ve teknik SEO analizlerini tek platformda gerçekleştirin.

## 🚀 Özellikler

### SEO Analiz Modülleri
- **Sayfa İçi SEO**: Meta etiketler, başlık yapısı, içerik analizi, görsel optimizasyonu
- **Sayfa Dışı SEO**: Backlink analizi, domain authority, sosyal sinyaller
- **Teknik SEO**: Robots.txt, sitemap, SSL, mobil uyumluluk, sayfa hızı
- **Google Arama Operatörleri**: 30+ farklı operatör ile detaylı analiz
- **Yapılandırılmış Veri**: Schema.org testleri
- **Sosyal Medya Meta Etiketleri**: Open Graph ve Twitter Cards analizi

### Güvenlik ve Performans
- **7G Güvenlik Duvarı**: SQL injection, XSS, CSRF koruması
- **Rate Limiting**: İstek sınırlaması ve bot koruması
- **Session Yönetimi**: Güvenli ve geçici veri saklama
- **Modern UI/UX**: Responsive tasarım ve kullanıcı dostu arayüz

### Teknik Özellikler
- **React 19 + TypeScript**: Modern frontend teknolojileri
- **Vite**: Hızlı geliştirme ve build süreci
- **Tailwind CSS**: Utility-first CSS framework
- **i18n Desteği**: Türkçe ve İngilizce dil desteği
- **Docker**: Konteynerizasyon ve kolay dağıtım
- **SOLID Prensipleri**: Temiz ve sürdürülebilir kod yapısı

## 🛠️ Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Docker (opsiyonel)

### Geliştirme Ortamı

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd seo-tool-ahmet
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

## 🐳 Docker ile Çalıştırma

### Hızlı Başlangıç
```bash
# Docker Hub'dan çalıştır
docker run -d -p 3000:80 axxmet/ahmets-special-seo-tool:latest

# Veya özel port ile
docker run -d -p 1389:80 axxmet/ahmets-special-seo-tool:latest
```

### Docker Compose
```bash
# Proje dizininde
docker-compose up -d

# Veya Docker Hub'dan
services:
  seo-tool:
    image: axxmet/ahmets-special-seo-tool:latest
    ports:
      - "3000:80"
```

**Docker Hub**: [axxmet/ahmets-special-seo-tool](https://hub.docker.com/r/axxmet/ahmets-special-seo-tool)

### Manuel Build
```bash
# Local build
docker build -t my-seo-tool .
docker run -d -p 3000:80 my-seo-tool
```

4. **Tarayıcıda açın**
```
http://localhost:5173
```

### Docker ile Çalıştırma

1. **Docker image oluşturun**
```bash
npm run docker:build
```

2. **Container'ı çalıştırın**
```bash
npm run docker:run
```

3. **Docker Compose ile çalıştırın**
```bash
npm run docker:compose
```

## 📊 Kullanım

### Temel Analiz
1. Ana sayfada URL girin
2. "Analiz Et" butonuna tıklayın
3. Sonuçları detaylı olarak inceleyin
4. Önerileri takip edin

### Google Operatörleri
Sistem otomatik olarak şu operatörleri kullanır:
- `site:domain.com` - İndeksleme kontrolü
- `"keyword"` - Anahtar kelime sıralaması
- `intitle:"keyword"` - Başlık optimizasyonu
- `inurl:"keyword"` - URL optimizasyonu
- `allintitle:"keyword"` - Rakip analizi
- Ve 25+ diğer operatör

### Güvenlik
- 7G güvenlik duvarı otomatik olarak aktif
- Şüpheli aktiviteler engellenir
- Rate limiting ile bot koruması
- Session bazlı geçici veri saklama

## 🏗️ Proje Yapısı

```
src/
├── components/          # React bileşenleri
│   ├── Header.tsx
│   ├── AnalysisForm.tsx
│   └── SEOResults.tsx
├── contexts/           # React Context'leri
│   └── AppContext.tsx
├── services/           # İş mantığı servisleri
│   ├── SEOAnalyzer.ts
│   ├── SecurityFirewall.ts
│   ├── SessionManager.ts
│   └── GoogleOperators.ts
├── types/              # TypeScript tip tanımları
│   ├── index.ts
│   └── seo.ts
├── utils/              # Yardımcı fonksiyonlar
│   └── i18n.ts
├── locales/            # Dil dosyaları
│   ├── tr.json
│   └── en.json
└── pages/              # Sayfa bileşenleri
```

## 🔧 Yapılandırma

### Dil Değiştirme
```typescript
// AppContext'te dil değiştirme
const { changeLanguage } = useApp();
changeLanguage({ code: 'en', name: 'English', flag: '🇺🇸' });
```

### Güvenlik Ayarları
```typescript
// SecurityFirewall yapılandırması
const firewall = new SecurityFirewall();
firewall.maxRequestsPerMinute = 60;
firewall.maxRequestsPerHour = 1000;
```

### Session Yönetimi
```typescript
// Session oluşturma
const sessionManager = new SessionManager();
const session = sessionManager.createSession();
```

## 🚀 Dağıtım

### Production Build
```bash
npm run build
```

### Docker ile Dağıtım
```bash
# Production profile ile çalıştırma
npm run docker:compose:prod
```

### Nginx Yapılandırması
```nginx
# nginx.conf dosyası production için optimize edilmiştir
# Gzip compression, security headers, rate limiting dahil
```

## 📈 Performans

- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size**: Optimize edilmiş ve code splitting
- **Loading Time**: < 2 saniye
- **Memory Usage**: Minimal memory footprint

## 🔒 Güvenlik

- **7G Firewall**: SQL injection, XSS, CSRF koruması
- **Rate Limiting**: DDoS koruması
- **Input Validation**: Tüm girdiler doğrulanır
- **Security Headers**: Nginx ile güvenlik başlıkları
- **Session Security**: Güvenli session yönetimi

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans ve Telif Hakkı

Bu proje **MIT Lisansı** altında lisanslanmıştır ancak **ticari kullanım için izin gereklidir**.

### � Önemli Uyarı:
- ✅ **Kişisel kullanım**: Serbest
- ✅ **Eğitim amaçlı**: Serbest  
- ✅ **Açık kaynak katkısı**: Serbest
- ❌ **Ticari kullanım**: İzinsiz YASAK
- ❌ **Yeniden satış**: YASAK

**Ticari kullanım için**: iletisimahmetkahraman@gmail.com

Detaylı bilgi için [COPYRIGHT.md](./COPYRIGHT.md) dosyasını okuyun.

## �👨‍💻 Geliştirici

**Ahmet Kahraman** - SEO Uzmanı ve Full Stack Developer

### 🎯 Uzmanlık Alanları:
- SEO Stratejileri ve Algoritma Analizi
- React/TypeScript ile Modern Web Geliştirme  
- Docker ve DevOps Çözümleri
- Güvenlik Odaklı Yazılım Mimarisi

## 📞 İletişim

- **📧 Email**: iletisimahmetkahraman@gmail.com
- **🐙 GitHub**: [github.com/Ahmet-Dev](https://github.com/Ahmet-Dev)
- **🐳 Docker Hub**: [axxmet/ahmets-special-seo-tool](https://hub.docker.com/r/axxmet/ahmets-special-seo-tool)
- **📂 Repository**: [ahmetsspecialseotool](https://github.com/Ahmet-Dev/ahmetsspecialseotool)

## ⚠️ Yasal Uyarı

Bu yazılım telif hakkı koruması altındadır. İzinsiz ticari kullanım yasal takipata tabidir.
Lisans koşulları için [LICENSE](./LICENSE) dosyasını inceleyiniz.

---

**Copyright © 2025 Ahmet Kahraman. Tüm hakları saklıdır.**