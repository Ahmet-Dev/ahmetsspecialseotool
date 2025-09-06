// import axios from 'axios'; // CORS nedeniyle mock data kullanıldığından geçici olarak disable
import type { SiteSpeedMetrics } from '../types/seo';

/**
 * Site Hızı Analiz Sınıfı
 * Lighthouse benzeri performans metrikleri
 */
export class SiteSpeedAnalyzer {
  constructor() {}

  /**
   * Kapsamlı site hızı analizi
   */
  async analyzeSiteSpeed(url: string): Promise<SiteSpeedMetrics> {
    try {
      console.warn('SiteSpeedAnalyzer: CORS nedeniyle mock data kullanılıyor:', url);
      
      // Daha gerçekçi mock data - çoğu site için ortalama değerler
      const mockLoadTime = Math.floor(Math.random() * 2000) + 1500; // 1500-3500ms arası (daha gerçekçi)
      const mockContentLength = Math.floor(Math.random() * 200000) + 50000; // 50KB-250KB arası
      
      const mockHeaders = {
        'content-length': mockContentLength.toString(),
        'server': 'nginx',
        'cache-control': 'public, max-age=3600'
      };
      
      const mockHtmlData = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Mock Site</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Mock Content</h1>
          <img src="image.jpg" alt="test">
        </body>
        </html>
      `;
      
      // Performans metriklerini hesapla
      const performance = this.calculatePerformanceScore(mockLoadTime, mockContentLength);
      const accessibility = this.calculateAccessibilityScore(mockHtmlData);
      const bestPractices = this.calculateBestPracticesScore(mockHtmlData, mockHeaders);
      const seo = this.calculateSEOScore(mockHtmlData);

      // Core Web Vitals benzeri metrikler
      const firstContentfulPaint = this.estimateFCP(mockLoadTime);
      const largestContentfulPaint = this.estimateLCP(mockLoadTime, mockContentLength);
      const cumulativeLayoutShift = this.estimateCLS(mockHtmlData);
      const totalBlockingTime = this.estimateTBT(mockLoadTime, mockContentLength);
      const speedIndex = this.estimateSpeedIndex(mockLoadTime, mockContentLength);

      return {
        performance,
        accessibility,
        bestPractices,
        seo,
        firstContentfulPaint,
        largestContentfulPaint,
        cumulativeLayoutShift,
        totalBlockingTime,
        speedIndex
      };
    } catch (error) {
      console.error('Site hızı analizi hatası:', error);
      return this.getDefaultSpeedMetrics();
    }
  }

  /**
   * Performans skoru hesaplama - Daha sıkı kriterler
   */
  private calculatePerformanceScore(loadTime: number, contentLength: number): number {
    let score = 100;

    // Yükleme süresi (0-60 puan) - Daha sıkı
    if (loadTime > 4000) score -= 60;        // 4+ saniye kritik
    else if (loadTime > 3000) score -= 45;   // 3+ saniye çok kötü
    else if (loadTime > 2000) score -= 30;   // 2+ saniye kötü
    else if (loadTime > 1500) score -= 20;   // 1.5+ saniye orta
    else if (loadTime > 1000) score -= 10;   // 1+ saniye kabul edilebilir

    // İçerik boyutu (0-25 puan) - Daha sıkı
    if (contentLength > 1000000) score -= 25; // 1MB+ çok büyük
    else if (contentLength > 500000) score -= 15; // 500KB+ büyük
    else if (contentLength > 250000) score -= 10; // 250KB+ orta büyük
    else if (contentLength > 100000) score -= 5;  // 100KB+ biraz büyük

    // HTTP durum kodu (0-15 puan)
    // Burada response.status kullanılabilir, ancak şimdilik varsayılan olarak 200 kabul ediyoruz
    // score -= 0; // 200 OK

    return Math.max(score, 0);
  }

  /**
   * Erişilebilirlik skoru hesaplama
   */
  private calculateAccessibilityScore(htmlContent: string): number {
    let score = 100;

    // Alt metin kontrolü
    const imgTags = (htmlContent.match(/<img[^>]*>/gi) || []).length;
    const imgWithAlt = (htmlContent.match(/<img[^>]*alt\s*=\s*["'][^"']*["'][^>]*>/gi) || []).length;
    if (imgTags > 0) {
      const altRatio = imgWithAlt / imgTags;
      score -= (1 - altRatio) * 30; // Alt metin eksikliği
    }

    // Başlık yapısı kontrolü
    const h1Count = (htmlContent.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count === 0) score -= 20; // H1 eksik
    if (h1Count > 1) score -= 10; // Çoklu H1

    // Form etiketleri kontrolü
    const inputTags = (htmlContent.match(/<input[^>]*>/gi) || []).length;
    const labelTags = (htmlContent.match(/<label[^>]*>/gi) || []).length;
    if (inputTags > 0 && labelTags < inputTags) {
      score -= 15; // Form etiketleri eksik
    }

    // ARIA etiketleri kontrolü
    const ariaTags = (htmlContent.match(/aria-[^=]*=/gi) || []).length;
    if (ariaTags === 0 && inputTags > 0) {
      score -= 10; // ARIA etiketleri eksik
    }

    return Math.max(score, 0);
  }

  /**
   * En iyi uygulamalar skoru hesaplama
   */
  private calculateBestPracticesScore(htmlContent: string, headers: Record<string, string>): number {
    let score = 100;

    // HTTPS kontrolü
    if (!headers['strict-transport-security']) {
      score -= 10; // HSTS eksik
    }

    // Content Security Policy kontrolü
    if (!headers['content-security-policy']) {
      score -= 15; // CSP eksik
    }

    // X-Frame-Options kontrolü
    if (!headers['x-frame-options']) {
      score -= 10; // Clickjacking koruması eksik
    }

    // X-Content-Type-Options kontrolü
    if (!headers['x-content-type-options']) {
      score -= 5; // MIME type sniffing koruması eksik
    }

    // Console.log kontrolü (production'da olmamalı)
    const consoleLogs = (htmlContent.match(/console\.log/gi) || []).length;
    if (consoleLogs > 0) {
      score -= 5; // Console.log kullanımı
    }

    // JQuery eski versiyon kontrolü
    const jqueryVersion = htmlContent.match(/jquery[^"]*\.js/gi);
    if (jqueryVersion && jqueryVersion.some(v => v.includes('1.'))) {
      score -= 10; // Eski jQuery versiyonu
    }

    return Math.max(score, 0);
  }

  /**
   * SEO skoru hesaplama
   */
  private calculateSEOScore(htmlContent: string): number {
    let score = 100;

    // Title etiketi kontrolü
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (!titleMatch) {
      score -= 20; // Title eksik
    } else {
      const titleLength = titleMatch[1].length;
      if (titleLength < 30 || titleLength > 60) {
        score -= 10; // Title uzunluğu uygun değil
      }
    }

    // Meta description kontrolü
    const metaDescMatch = htmlContent.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["']/i);
    if (!metaDescMatch) {
      score -= 15; // Meta description eksik
    } else {
      const descLength = metaDescMatch[1].length;
      if (descLength < 120 || descLength > 160) {
        score -= 5; // Meta description uzunluğu uygun değil
      }
    }

    // H1 etiketi kontrolü
    const h1Count = (htmlContent.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count === 0) {
      score -= 15; // H1 eksik
    } else if (h1Count > 1) {
      score -= 10; // Çoklu H1
    }

    // Alt etiketleri kontrolü
    const imgTags = (htmlContent.match(/<img[^>]*>/gi) || []).length;
    const imgWithAlt = (htmlContent.match(/<img[^>]*alt\s*=\s*["'][^"']*["'][^>]*>/gi) || []).length;
    if (imgTags > 0) {
      const altRatio = imgWithAlt / imgTags;
      score -= (1 - altRatio) * 20; // Alt metin eksikliği
    }

    // Canonical URL kontrolü
    if (!htmlContent.includes('rel="canonical"')) {
      score -= 5; // Canonical URL eksik
    }

    return Math.max(score, 0);
  }

  /**
   * First Contentful Paint tahmini
   */
  private estimateFCP(loadTime: number): number {
    // FCP genellikle toplam yükleme süresinin %30-50'si arasındadır
    return Math.round(loadTime * 0.4);
  }

  /**
   * Largest Contentful Paint tahmini
   */
  private estimateLCP(loadTime: number, contentLength: number): number {
    // LCP, içerik boyutuna ve yükleme süresine bağlıdır
    const baseTime = loadTime * 0.6;
    const sizeFactor = Math.min(contentLength / 1000000, 2); // 1MB = 1x factor
    return Math.round(baseTime + (sizeFactor * 500));
  }

  /**
   * Cumulative Layout Shift tahmini
   */
  private estimateCLS(htmlContent: string): number {
    // CLS, görsel elementlerin varlığına bağlıdır
    const imgCount = (htmlContent.match(/<img[^>]*>/gi) || []).length;
    const videoCount = (htmlContent.match(/<video[^>]*>/gi) || []).length;
    const adCount = (htmlContent.match(/<div[^>]*class[^>]*ad[^>]*>/gi) || []).length;
    
    // Daha fazla görsel element = daha yüksek CLS riski
    const visualElements = imgCount + videoCount + adCount;
    return Math.min(visualElements * 0.1, 1.0); // 0-1 arası değer
  }

  /**
   * Total Blocking Time tahmini
   */
  private estimateTBT(loadTime: number, contentLength: number): number {
    // TBT, JavaScript miktarına ve yükleme süresine bağlıdır
    const jsFactor = Math.min(contentLength / 500000, 3); // 500KB = 1x factor
    return Math.round(loadTime * 0.1 * jsFactor);
  }

  /**
   * Speed Index tahmini
   */
  private estimateSpeedIndex(loadTime: number, contentLength: number): number {
    // Speed Index, görsel içeriğin yüklenme hızına bağlıdır
    const visualFactor = Math.min(contentLength / 1000000, 2); // 1MB = 1x factor
    return Math.round(loadTime * 0.5 * visualFactor);
  }

  /**
   * Varsayılan hız metrikleri
   */
  private getDefaultSpeedMetrics(): SiteSpeedMetrics {
    return {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      totalBlockingTime: 0,
      speedIndex: 0
    };
  }
}
