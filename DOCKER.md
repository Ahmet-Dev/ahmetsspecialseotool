# Ahmet's Special SEO Tool - Docker Deployment

Bu Docker container, gelişmiş SEO analiz aracını içerir ve production ortamında kullanıma hazırdır.

## 🚀 Hızlı Başlangıç

### Docker Hub'dan Çalıştırma

```bash
# En son versiyonu çalıştır (port 3000)
docker run -d -p 3000:80 axxmet/ahmets-special-seo-tool:latest

# Özel port ile çalıştır (örnek: port 1389)
docker run -d -p 1389:80 axxmet/ahmets-special-seo-tool:latest

# Container'a isim ver
docker run -d --name seo-tool -p 3000:80 axxmet/ahmets-special-seo-tool:latest
```

### Docker Compose ile Çalıştırma

`docker-compose.yml` dosyası oluştur:

```yaml
services:
  seo-tool:
    image: axxmet/ahmets-special-seo-tool:latest
    ports:
      - "3000:80"
    container_name: ahmets-seo-tool
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Çalıştır:
```bash
docker-compose up -d
```

## 🌐 Erişim

Container çalıştıktan sonra:
- **Local**: http://localhost:3000
- **Custom Port**: http://localhost:[PORT]

## 📊 SEO Tool Özellikleri

### ⚡ Gerçek Zamanlı Analiz
- **OnPage SEO**: Title, Meta Description, H1-H6 başlıklar
- **Technical SEO**: SSL, Mobile-Friendly, Page Speed
- **OffPage SEO**: Backlink analizi, Domain Authority
- **AI Content**: ChatGPT entegrasyonu ile içerik analizi

### 🎯 Puanlama Sistemi
- **Ağırlıklı Hesaplama**:
  - OnPage SEO: %30
  - Technical SEO: %25  
  - Performance: %20
  - OffPage SEO: %15
  - AI Content: %10

### 📈 Gerçekçi Sonuçlar
- Yeni siteler: 15-35 puan arası
- Orta seviye siteler: 35-65 puan arası
- İleri seviye siteler: 65-85 puan arası
- Mükemmel siteler: 85+ puan

## 🔧 Konfigürasyon

### Environment Variables
```bash
# Özel konfigürasyon ile çalıştır
docker run -d -p 3000:80 \
  -e NODE_ENV=production \
  axxmet/ahmets-special-seo-tool:latest
```

### Nginx Ayarları
Container içinde optimized nginx konfigürasyonu:
- Gzip compression
- Security headers
- Rate limiting
- Static file caching

## 🛠️ Development

### Local Build
```bash
git clone [repository-url]
cd ahmets-special-seo-tool
docker build -t my-seo-tool .
docker run -d -p 3000:80 my-seo-tool
```

### Multi-stage Build
- **Builder Stage**: Node.js 20-alpine ile React build
- **Production Stage**: Nginx alpine ile optimized serving

## 🔒 Güvenlik

- HTTPS ready (SSL termination nginx'te)
- Security headers aktif
- Rate limiting koruması
- Input validation

## 📝 Loglar

```bash
# Container loglarını görüntüle
docker logs [container-name]

# Real-time log takibi
docker logs -f [container-name]
```

## 🚦 Health Check

Container otomatik health check içerir:
```bash
docker ps # STATUS: healthy/unhealthy
```

## 🔄 Update

```bash
# Yeni versiyonu çek
docker pull axxmet/ahmets-special-seo-tool:latest

# Container'ı yeniden başlat
docker-compose down
docker-compose up -d
```

## 📞 Destek

- **Docker Hub**: https://hub.docker.com/r/axxmet/ahmets-special-seo-tool
- **Issues**: GitHub repository
- **Version**: v1.0

## 🏷️ Tags

- `latest`: En son stabil versiyon
- `v1.0`: İlk stabil release
- `dev`: Development versiyonu (gelecekte)

---

**Powered by React + TypeScript + Nginx + Docker** 🚀
