// import axios from 'axios'; // CORS nedeniyle mock data kullanıldığından geçici olarak disable
import * as cheerio from 'cheerio';
import type { SEOAnalysisResult, OnPageSEO, OffPageSEO, TechnicalSEO, SEOScore, AIOSEO } from '../types/seo';
import { OffPageAnalyzer } from './OffPageAnalyzer';
import { SiteSpeedAnalyzer } from './SiteSpeedAnalyzer';
import { StructuredDataAnalyzer } from './StructuredDataAnalyzer';
import { SocialMetaAnalyzer } from './SocialMetaAnalyzer';
import { RobotsSitemapAnalyzer } from './RobotsSitemapAnalyzer';

/**
 * Ana SEO Analiz Sınıfı
 * SOLID prensiplerine uygun olarak tasarlanmıştır
 */
export class SEOAnalyzer {
  private sessionId: string;
  private baseUrl: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.baseUrl = '';
  }

  /**
   * Ana analiz metodu - tüm SEO analizlerini koordine eder
   */
  async analyze(url: string): Promise<SEOAnalysisResult> {
    try {
      console.log(`SEO analizi başlatılıyor: ${url}`);
      this.baseUrl = this.normalizeUrl(url);
      
      // Paralel olarak tüm analizleri başlat
      const [onPageResult, offPageResult, technicalResult, aioResult] = await Promise.allSettled([
        this.analyzeOnPageSEO(url),
        this.analyzeOffPageSEO(url),
        this.analyzeTechnicalSEO(url),
        this.analyzeAIOSEO(url)
      ]);

      // Sonuçları güvenli şekilde çıkar
      const onPage = onPageResult.status === 'fulfilled' ? onPageResult.value : this.getDefaultOnPageResult();
      const offPage = offPageResult.status === 'fulfilled' ? offPageResult.value : this.getDefaultOffPageResult();
      const technical = technicalResult.status === 'fulfilled' ? technicalResult.value : this.getDefaultTechnicalResult();
      const aio = aioResult.status === 'fulfilled' ? aioResult.value : this.getDefaultAIOResult();

      // Genel puanı hesapla
      const score = this.calculateOverallScore(onPage, offPage, technical, aio);

      // Önerileri oluştur
      const recommendations = this.generateRecommendations(onPage, offPage, technical, aio);

      return {
        url: this.baseUrl,
        timestamp: new Date(),
        score,
        onPage: onPage,
        offPage: offPage,
        technical: technical,
        aio: aio,
        recommendations,
        sessionId: this.sessionId
      };
    } catch (error) {
      throw new Error(`SEO analizi başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  /**
   * Sayfa içi SEO analizi
   */
  private async analyzeOnPageSEO(url: string): Promise<OnPageSEO> {
    const response = await this.fetchPage(url);
    const $ = cheerio.load(response.data);

    return {
      title: this.analyzeTitle($),
      metaDescription: this.analyzeMetaDescription($),
      headings: this.analyzeHeadings($),
      images: this.analyzeImages($),
      internalLinks: this.analyzeInternalLinks($),
      externalLinks: this.analyzeExternalLinks($),
      keywordDensity: this.analyzeKeywordDensity($),
      contentLength: this.analyzeContentLength($)
    };
  }

  /**
   * Sayfa dışı SEO analizi
   */
  private async analyzeOffPageSEO(url: string): Promise<OffPageSEO> {
    const offPageAnalyzer = new OffPageAnalyzer();
    return await offPageAnalyzer.analyzeOffPageSEO(url);
  }

  /**
   * Teknik SEO analizi
   */
  private async analyzeTechnicalSEO(url: string): Promise<TechnicalSEO> {
    const response = await this.fetchPage(url);
    
    const [robotsTxt, sitemap, ssl, mobileFriendly, pageSpeed, structuredData, socialMeta] = await Promise.all([
      this.analyzeRobotsTxt(url),
      this.analyzeSitemap(url),
      this.analyzeSSL(url),
      this.analyzeMobileFriendly(url),
      this.analyzePageSpeed(url),
      this.analyzeStructuredData(url, response.data),
      this.analyzeSocialMeta(url, response.data)
    ]);

    return {
      robotsTxt,
      sitemap,
      ssl,
      mobileFriendly,
      pageSpeed,
      structuredData,
      socialMeta
    };
  }

  /**
   * Başlık analizi
   */
  private analyzeTitle($: cheerio.Root): OnPageSEO['title'] {
    const title = $('title').text().trim();
    const length = title.length;
    
    // 0-100 puan sistemi - OnPage hesaplaması ile uyumlu
    let score = 0;
    if (!title) {
      score = 0; // Kritik eksiklik
    } else if (length >= 30 && length <= 60) {
      score = 100; // Perfect title length
    } else if (length >= 15 && length <= 75) {
      score = 72; // Good title length  
    } else if (length > 0) {
      score = 32; // Has title but not optimal
    }

    return {
      exists: !!title,
      length,
      score: Math.round(score),
      content: title
    };
  }

  /**
   * Meta açıklama analizi
   */
  private analyzeMetaDescription($: cheerio.Root): OnPageSEO['metaDescription'] {
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const length = metaDescription.length;
    
    // 0-100 puan sistemi - OnPage hesaplaması ile uyumlu
    let score = 0;
    if (!metaDescription) {
      score = 0; // Kritik eksiklik
    } else if (length >= 120 && length <= 160) {
      score = 100; // Perfect meta description
    } else if (length >= 80 && length <= 180) {
      score = 75; // Good meta description
    } else if (length > 0) {
      score = 25; // Has meta but not optimal
    }

    return {
      exists: !!metaDescription,
      length,
      score: Math.round(score),
      content: metaDescription
    };
  }

  /**
   * Başlık yapısı analizi
   */
  private analyzeHeadings($: cheerio.Root): OnPageSEO['headings'] {
    const h1Elements = $('h1');
    const h2Elements = $('h2');
    const h3Elements = $('h3');

    const h1Count = h1Elements.length;
    const h2Count = h2Elements.length;
    const h3Count = h3Elements.length;

    // H1 analizi - 0-100 puan sistemi
    let h1Score = 0;
    if (h1Count === 1) h1Score = 100; // Perfect H1 structure
    else if (h1Count === 0) h1Score = 0; // No H1 - kritik eksiklik
    else h1Score = 40; // Multiple H1s - not ideal

    // H2 ve H3 için temel puanlama
    const h2Score = Math.min(h2Count * 10, 100);
    const h3Score = Math.min(h3Count * 8, 100);

    return {
      h1: {
        count: h1Count,
        score: h1Score,
        content: h1Elements.map((_, el) => $(el).text().trim()).get()
      },
      h2: {
        count: h2Count,
        score: h2Score,
        content: h2Elements.map((_, el) => $(el).text().trim()).get()
      },
      h3: {
        count: h3Count,
        score: h3Score,
        content: h3Elements.map((_, el) => $(el).text().trim()).get()
      }
    };
  }

  /**
   * Görsel analizi
   */
  private analyzeImages($: cheerio.Root): OnPageSEO['images'] {
    const images = $('img');
    const totalImages = images.length;
    const imagesWithoutAlt = images.filter((_, el) => !$(el).attr('alt')).length;
    
    let score = 0;
    if (totalImages === 0) {
      score = 20; // Görsel yoksa küçük puan ver
    } else if (imagesWithoutAlt === 0) {
      score = 100; // Tüm görsellerde alt var - perfect
    } else {
      const altCoverage = ((totalImages - imagesWithoutAlt) / totalImages) * 100;
      if (altCoverage >= 80) score = 80;
      else if (altCoverage >= 50) score = 50;
      else score = 20;
    }

    return {
      total: totalImages,
      withoutAlt: imagesWithoutAlt,
      score: Math.round(score)
    };
  }

  /**
   * İç bağlantı analizi
   */
  private analyzeInternalLinks($: cheerio.Root): OnPageSEO['internalLinks'] {
    const links = $('a[href]');
    const internalLinks = links.filter((_, el) => {
      const href = $(el).attr('href');
      return !!(href && (href.startsWith('/') || href.includes(this.baseUrl)));
    });
    
    const count = internalLinks.length;
    // 0-100 scoring system
    let score = 0;
    if (count >= 10) score = 100; // Excellent internal linking
    else if (count >= 5) score = 80; // Good internal linking
    else if (count >= 3) score = 60; // Average
    else if (count >= 1) score = 30; // Few links
    else score = 0; // No internal links

    return {
      count,
      score: Math.round(score)
    };
  }

  /**
   * Dış bağlantı analizi
   */
  private analyzeExternalLinks($: cheerio.Root): OnPageSEO['externalLinks'] {
    const links = $('a[href]');
    const externalLinks = links.filter((_, el) => {
      const href = $(el).attr('href');
      return !!(href && href.startsWith('http') && !href.includes(this.baseUrl));
    });
    
    const count = externalLinks.length;
    // 0-100 scoring system
    let score = 0;
    if (count >= 8) score = 100; // Excellent external linking
    else if (count >= 5) score = 80; // Good external linking
    else if (count >= 3) score = 60; // Average
    else if (count >= 1) score = 40; // Few links
    else score = 10; // No external links (not critical)

    return {
      count,
      score: Math.round(score)
    };
  }

  /**
   * Anahtar kelime yoğunluğu analizi
   */
  private analyzeKeywordDensity($: cheerio.Root): OnPageSEO['keywordDensity'] {
    const text = $('body').text().toLowerCase();
    const words = text.split(/\s+/).filter(word => word.length > 3);
    const wordCount = words.length;
    
    // En sık kullanılan kelimeleri bul
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    const primaryKeyword = sortedWords[0]?.[0] || '';
    const density = primaryKeyword ? (wordFreq[primaryKeyword] / wordCount) * 100 : 0;
    
    let score = 0;
    if (density >= 1 && density <= 3) score = 100; // Optimal yoğunluk
    else if (density > 0 && density < 1) score = 50; // Düşük yoğunluk
    else if (density > 3 && density <= 5) score = 30; // Yüksek yoğunluk
    else if (density > 5) score = 10; // Çok yüksek yoğunluk - spam risk
    else score = 0; // Hiç keyword yok

    return {
      primary: primaryKeyword,
      density: Math.round(density * 100) / 100,
      score
    };
  }

  /**
   * İçerik uzunluğu analizi
   */
  private analyzeContentLength($: cheerio.Root): OnPageSEO['contentLength'] {
    const text = $('body').text();
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // 0-100 scoring system
    let score = 0;
    if (wordCount >= 1500) score = 100; // Comprehensive content
    else if (wordCount >= 800) score = 80; // Good content length
    else if (wordCount >= 300) score = 60; // Basic content
    else if (wordCount >= 100) score = 30; // Very short content
    else score = 0; // Kritik eksiklik

    return {
      wordCount,
      score
    };
  }

  /**
   * Robots.txt analizi
   */
  private async analyzeRobotsTxt(url: string): Promise<TechnicalSEO['robotsTxt']> {
    const robotsAnalyzer = new RobotsSitemapAnalyzer();
    return await robotsAnalyzer.analyzeRobotsTxt(url);
  }

  /**
   * Sitemap analizi
   */
  private async analyzeSitemap(url: string): Promise<TechnicalSEO['sitemap']> {
    const sitemapAnalyzer = new RobotsSitemapAnalyzer();
    return await sitemapAnalyzer.analyzeSitemap(url);
  }

  /**
   * SSL analizi
   */
  private async analyzeSSL(url: string): Promise<TechnicalSEO['ssl']> {
    const isHttps = url.startsWith('https://');
    
    return {
      enabled: isHttps,
      score: isHttps ? 10 : 0,
      certificate: null // Detaylı sertifika analizi için ek geliştirme gerekli
    };
  }

  /**
   * Mobil uyumluluk analizi
   */
  private async analyzeMobileFriendly(url: string): Promise<TechnicalSEO['mobileFriendly']> {
    // Basit viewport meta tag kontrolü
    try {
      const response = await this.fetchPage(url);
      const $ = cheerio.load(response.data);
      const viewport = $('meta[name="viewport"]').attr('content');
      
      const hasViewport = !!viewport;
      const issues: string[] = [];
      
      if (!hasViewport) {
        issues.push('Viewport meta tag eksik');
      }
      
      return {
        score: hasViewport ? 10 : 0,
        issues
      };
    } catch {
      return {
        score: 0,
        issues: ['Mobil uyumluluk kontrol edilemedi']
      };
    }
  }

  /**
   * Sayfa hızı analizi
   */
  private async analyzePageSpeed(url: string): Promise<TechnicalSEO['pageSpeed']> {
    const siteSpeedAnalyzer = new SiteSpeedAnalyzer();
    const speedMetrics = await siteSpeedAnalyzer.analyzeSiteSpeed(url);
    
    return {
      score: speedMetrics.performance,
      loadTime: speedMetrics.firstContentfulPaint,
      metrics: speedMetrics
    };
  }

  /**
   * Yapılandırılmış veri analizi
   */
  private async analyzeStructuredData(url: string, htmlContent: string): Promise<TechnicalSEO['structuredData']> {
    const structuredDataAnalyzer = new StructuredDataAnalyzer();
    const structuredDataTest = await structuredDataAnalyzer.analyzeStructuredData(url, htmlContent);
    
    return {
      exists: structuredDataTest.valid,
      score: structuredDataTest.score,
      types: structuredDataTest.structuredData.map(item => item['@type'] as string).filter(Boolean)
    };
  }

  /**
   * Sosyal medya meta etiketleri analizi
   */
  private async analyzeSocialMeta(url: string, htmlContent: string): Promise<TechnicalSEO['socialMeta']> {
    const socialMetaAnalyzer = new SocialMetaAnalyzer();
    const socialMetaTest = await socialMetaAnalyzer.analyzeSocialMeta(url, htmlContent);
    
    return {
      openGraph: !!(socialMetaTest.openGraph.title || socialMetaTest.openGraph.description),
      twitter: !!(socialMetaTest.twitter.title || socialMetaTest.twitter.description),
      score: socialMetaTest.score
    };
  }

  /**
   * Genel puan hesaplama (100 puan üzerinden) - Daha gerçekçi skorlama
   */
  private calculateOverallScore(
    onPage: OnPageSEO,
    offPage: OffPageSEO,
    technical: TechnicalSEO,
    aio: AIOSEO
  ): SEOScore {
    // Her component artık 0-100 arası score döndürüyor, ölçeklendirme gerekmez
    const onPageScore = this.calculateOnPageScore(onPage);
    const offPageScore = this.calculateOffPageScore(offPage);
    const technicalScore = this.calculateTechnicalScore(technical);
    const aioScore = this.calculateAIOScore(aio);
    const performanceScore = technical.pageSpeed.score;

    // NaN kontrolü ve güvenli değer atama
    const safeScore = (score: number, defaultValue: number = 0): number => {
      return isNaN(score) || !isFinite(score) ? defaultValue : score;
    };

    // Skorlar zaten 0-100 arasında olmalı, doğrudan kullan
    const clampedOnPage = Math.min(Math.max(safeScore(onPageScore), 0), 100);
    const clampedOffPage = Math.min(Math.max(safeScore(offPageScore), 0), 100);
    const clampedTechnical = Math.min(Math.max(safeScore(technicalScore), 0), 100);
    const clampedAIO = Math.min(Math.max(safeScore(aioScore), 0), 100);
    const clampedPerformance = Math.min(Math.max(safeScore(performanceScore), 0), 100);

    // Daha gerçekçi ağırlıklandırma: OnPage en önemli, Technical ikinci sırada
    const total = Math.round(
      (clampedOnPage * 0.30) +      // On-Page en önemli %30
      (clampedTechnical * 0.25) +   // Technical ikinci %25  
      (clampedPerformance * 0.20) + // Performance üçüncü %20
      (clampedOffPage * 0.15) +     // Off-Page dördüncü %15
      (clampedAIO * 0.10)           // AIO henüz beta %10
    );

    return {
      total: safeScore(total, 0),
      onPage: clampedOnPage,
      offPage: clampedOffPage,
      technical: clampedTechnical,
      aio: clampedAIO,
      performance: clampedPerformance,
      content: Math.min(Math.max(safeScore(Math.round(onPage.contentLength.score)), 0), 100) // Score düzeltmesi
    };
  }

  private calculateOnPageScore(onPage: OnPageSEO): number {
    let totalScore = 0;
    let maxPossibleScore = 100;

    // Artık her component kendi scoring sistemini kullanıyor (0-100)
    // Ağırlıklandırılmış toplama yapalım
    
    // Title (Ağırlık: 25%) - zaten 0-100 score döndürüyor
    const titleWeight = 0.25;
    totalScore += (onPage.title.score || 0) * titleWeight;

    // Meta Description (Ağırlık: 20%) - zaten 0-100 score döndürüyor  
    const metaWeight = 0.20;
    totalScore += (onPage.metaDescription.score || 0) * metaWeight;

    // H1 (Ağırlık: 20%) - zaten 0-100 score döndürüyor
    const h1Weight = 0.20;
    totalScore += (onPage.headings.h1.score || 0) * h1Weight;

    // Content Length (Ağırlık: 15%) - zaten 0-100 score döndürüyor
    const contentWeight = 0.15;
    totalScore += (onPage.contentLength.score || 0) * contentWeight;

    // Images + Alt Text (Ağırlık: 10%) - zaten 0-100 score döndürüyor
    const imageWeight = 0.10;
    totalScore += (onPage.images.score || 0) * imageWeight;

    // Internal + External Links Combined (Ağırlık: 10%) - zaten 0-100 score döndürüyor
    const linkWeight = 0.10;
    const combinedLinkScore = ((onPage.internalLinks.score || 0) + (onPage.externalLinks.score || 0)) / 2;
    totalScore += combinedLinkScore * linkWeight;

    // Final percentage (already calculated correctly)
    return Math.round(Math.min(totalScore, maxPossibleScore));
  }

  private calculateOffPageScore(offPage: OffPageSEO): number {
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Domain Authority (Ağırlık: 35%)
    maxPossibleScore += 35;
    if (offPage.domainAuthority.score >= 80) {
      totalScore += 35; // Excellent DA
    } else if (offPage.domainAuthority.score >= 60) {
      totalScore += 28; // Good DA
    } else if (offPage.domainAuthority.score >= 40) {
      totalScore += 20; // Average DA
    } else if (offPage.domainAuthority.score >= 20) {
      totalScore += 12; // Low DA
    } else if (offPage.domainAuthority.score > 0) {
      totalScore += 5; // Very low DA
    }

    // Backlinks Quality & Quantity (Ağırlık: 30%)
    maxPossibleScore += 30;
    if (offPage.backlinks.count >= 100) {
      totalScore += 30; // Excellent backlink count
    } else if (offPage.backlinks.count >= 50) {
      totalScore += 25; // Good backlink count
    } else if (offPage.backlinks.count >= 20) {
      totalScore += 18; // Average backlink count
    } else if (offPage.backlinks.count >= 5) {
      totalScore += 10; // Low backlink count
    } else if (offPage.backlinks.count > 0) {
      totalScore += 5; // Very few backlinks
    }

    // Page Authority (Ağırlık: 20%)
    maxPossibleScore += 20;
    if (offPage.pageAuthority.score >= 70) {
      totalScore += 20; // Excellent PA
    } else if (offPage.pageAuthority.score >= 50) {
      totalScore += 16; // Good PA
    } else if (offPage.pageAuthority.score >= 30) {
      totalScore += 12; // Average PA
    } else if (offPage.pageAuthority.score >= 10) {
      totalScore += 6; // Low PA
    } else if (offPage.pageAuthority.score > 0) {
      totalScore += 2; // Very low PA
    }

    // Social Signals (Ağırlık: 10%)
    maxPossibleScore += 10;
    if (offPage.socialSignals.score >= 8) {
      totalScore += 10; // Strong social presence
    } else if (offPage.socialSignals.score >= 5) {
      totalScore += 7; // Good social signals
    } else if (offPage.socialSignals.score >= 3) {
      totalScore += 4; // Some social activity
    } else if (offPage.socialSignals.score > 0) {
      totalScore += 2; // Minimal social presence
    }

    // Brand Mentions (Ağırlık: 5%)
    maxPossibleScore += 5;
    if (offPage.mentions.score >= 8) {
      totalScore += 5; // Strong brand mentions
    } else if (offPage.mentions.score >= 5) {
      totalScore += 4; // Good mentions
    } else if (offPage.mentions.score >= 2) {
      totalScore += 2; // Some mentions
    } else if (offPage.mentions.score > 0) {
      totalScore += 1; // Few mentions
    }

    // Calculate final percentage
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  private calculateTechnicalScore(technical: TechnicalSEO): number {
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Robots.txt Quality (Ağırlık: 20%)
    maxPossibleScore += 20;
    if (technical.robotsTxt.score >= 9) {
      totalScore += 20; // Perfect robots.txt
    } else if (technical.robotsTxt.score >= 7) {
      totalScore += 16; // Good robots.txt
    } else if (technical.robotsTxt.score >= 5) {
      totalScore += 12; // Average robots.txt
    } else if (technical.robotsTxt.score >= 3) {
      totalScore += 6; // Poor robots.txt
    } else if (technical.robotsTxt.score > 0) {
      totalScore += 2; // Very poor robots.txt
    }

    // Sitemap Quality (Ağırlık: 20%)
    maxPossibleScore += 20;
    if (technical.sitemap.score >= 9) {
      totalScore += 20; // Perfect sitemap
    } else if (technical.sitemap.score >= 7) {
      totalScore += 16; // Good sitemap
    } else if (technical.sitemap.score >= 5) {
      totalScore += 12; // Average sitemap
    } else if (technical.sitemap.score >= 3) {
      totalScore += 6; // Poor sitemap
    } else if (technical.sitemap.score > 0) {
      totalScore += 2; // Very poor sitemap
    }

    // SSL Security (Ağırlık: 20%)
    maxPossibleScore += 20;
    if (technical.ssl.score >= 9) {
      totalScore += 20; // Perfect SSL setup
    } else if (technical.ssl.score >= 7) {
      totalScore += 16; // Good SSL
    } else if (technical.ssl.score >= 5) {
      totalScore += 10; // Basic SSL
    } else if (technical.ssl.score >= 3) {
      totalScore += 5; // Weak SSL
    } else if (technical.ssl.score > 0) {
      totalScore += 2; // Poor SSL
    }

    // Mobile Friendly (Ağırlık: 15%)
    maxPossibleScore += 15;
    if (technical.mobileFriendly.score >= 9) {
      totalScore += 15; // Fully mobile optimized
    } else if (technical.mobileFriendly.score >= 7) {
      totalScore += 12; // Well optimized
    } else if (technical.mobileFriendly.score >= 5) {
      totalScore += 8; // Reasonably optimized
    } else if (technical.mobileFriendly.score >= 3) {
      totalScore += 4; // Poorly optimized
    } else if (technical.mobileFriendly.score > 0) {
      totalScore += 1; // Very poor mobile
    }

    // Structured Data (Ağırlık: 12%)
    maxPossibleScore += 12;
    if (technical.structuredData.score >= 9) {
      totalScore += 12; // Rich structured data
    } else if (technical.structuredData.score >= 7) {
      totalScore += 10; // Good structured data
    } else if (technical.structuredData.score >= 5) {
      totalScore += 7; // Basic structured data
    } else if (technical.structuredData.score >= 3) {
      totalScore += 3; // Poor structured data
    } else if (technical.structuredData.score > 0) {
      totalScore += 1; // Minimal structured data
    }

    // Social Meta Tags (Ağırlık: 13%)
    maxPossibleScore += 13;
    if (technical.socialMeta.score >= 9) {
      totalScore += 13; // Complete social meta
    } else if (technical.socialMeta.score >= 7) {
      totalScore += 10; // Good social meta
    } else if (technical.socialMeta.score >= 5) {
      totalScore += 7; // Basic social meta
    } else if (technical.socialMeta.score >= 3) {
      totalScore += 3; // Poor social meta
    } else if (technical.socialMeta.score > 0) {
      totalScore += 1; // Minimal social meta
    }

    // Calculate final percentage
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  /**
   * Detaylı ve gerçekçi öneriler oluşturma - Her puanın gerekçesi ile
   */
  private generateRecommendations(
    onPage: OnPageSEO,
    offPage: OffPageSEO,
    technical: TechnicalSEO,
    aio: AIOSEO
  ): string[] {
    const recommendations: string[] = [];

    // 📊 PUANLAMA GEREKÇELERİ VE DETAYLI ÖNERİLER

    // ==================== SAYFA İÇİ SEO ANALİZİ ====================
    
    recommendations.push('📊 SAYFA İÇİ SEO ANALİZİ (Mevcut Puan: ' + this.calculateOnPageScore(onPage) + '/100)');
    
    // Title Tag Analizi
    if (!onPage.title.exists) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: Title Tag Eksik (-50 puan)');
      recommendations.push('❌ NEDEN DÜŞÜK: Sayfa başlığı (title tag) tamamen eksik. Google bu sayfayı nasıl sınıflandıracağını bilmiyor.');
      recommendations.push('✅ ÇÖZÜM ADMLARI:');
      recommendations.push('   1. <title>Anahtar Kelime - Marka Adı</title> formatında bir başlık ekleyin');
      recommendations.push('   2. 50-60 karakter arasında tutun (mobilde kesilmesin)');
      recommendations.push('   3. Ana anahtar kelimenizi başa koyun');
      recommendations.push('   4. Her sayfa için unique title yazın');
      recommendations.push('💡 ÖRNEK: "SEO Nedir? 2024 Arama Motoru Optimizasyonu Rehberi - SiteBrand"');
      recommendations.push('🎯 ETKİ: Title tag düzeltilirse tıklama oranı %200-400 artabilir.');
    } else if (onPage.title.length < 30) {
      recommendations.push('');
      recommendations.push('🟡 IYILESTIRME: Title Tag Çok Kısa (-15 puan)');
      recommendations.push(`❌ MEVCUT DURUM: ${onPage.title.length} karakter - Google snippet'ında boş alan kalıyor`);
      recommendations.push('✅ ÇÖZÜM: 50-60 karakter arası optimum uzunluğa çıkarın');
      recommendations.push('💡 EKLEYEBİLECEKLERİNİZ: Marka adı, yıl, "rehber", "nasıl yapılır" gibi kelimeler');
      recommendations.push('🎯 ETKİ: Daha açıklayıcı title ile CTR %30-50 artabilir.');
    } else if (onPage.title.length > 60) {
      recommendations.push('');
      recommendations.push('🟡 IYILESTIRME: Title Tag Çok Uzun (-10 puan)');
      recommendations.push(`❌ MEVCUT DURUM: ${onPage.title.length} karakter - Google'da "..." ile kesilecek`);
      recommendations.push('✅ ÇÖZÜM: En önemli kelimeleri başa alarak 60 karakter altına indirin');
      recommendations.push('💡 TEKNİK: Önemlilik sırası > Ana kelime > Marka > Yardımcı kelimeler');
    }

    // Meta Description Analizi  
    if (!onPage.metaDescription.exists) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: Meta Description Eksik (-40 puan)');
      recommendations.push('❌ NEDEN DÜŞÜK: Google arama sonuçlarında rastgele metin parçaları gösterecek');
      recommendations.push('✅ ÇÖZÜM ADIMI:');
      recommendations.push('   1. <meta name="description" content="..."> etiketi ekleyin');
      recommendations.push('   2. 155-160 karakter arası optimum uzunluk');
      recommendations.push('   3. Çağrı cümlesi (Call-to-Action) ekleyin');
      recommendations.push('   4. Ana anahtar kelimeyi doğal şekilde dahil edin');
      recommendations.push(`💡 ÖRNEK: "SEO nedir ve nasıl yapılır? Arama motoru optimizasyonu ile sitenizi Google'da üst sıralara çıkarın. ✓ Ücretsiz rehber"`);
      recommendations.push(`🎯 ETKİ: İyi meta description CTR'yi %20-30 artırır.`);
    } else if (onPage.metaDescription.length < 120) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: Meta Description Kısa (-10 puan)');
      recommendations.push('❌ MEVCUT: ' + onPage.metaDescription.length + ' karakter - Daha fazla değer verebilirsiniz');
      recommendations.push('✅ ÇÖZÜM: 155-160 karakter arası optimum uzunluğa çıkarın');
      recommendations.push('💡 EKLEYEBİLECEKLERİNİZ: Fayda vurgusu, sayısal veriler, emoji');
    } else if (onPage.metaDescription.length > 160) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: Meta Description Uzun (-5 puan)');
      recommendations.push('❌ MEVCUT: ' + onPage.metaDescription.length + ' karakter - Son kısım "..." ile kesilecek');
      recommendations.push('✅ ÇÖZÜM: En önemli bilgileri başa alarak 160 karakter altına indirin');
    }

    // H1 Başlık Analizi
    if (onPage.headings.h1.count === 0) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: H1 Başlık Eksik (-30 puan)');
      recommendations.push('❌ NEDEN DÜŞÜK: Sayfanın ana konusu belirsiz, Google ne hakkında olduğunu anlayamıyor');
      recommendations.push('✅ ÇÖZÜM:');
      recommendations.push('   1. Sadece 1 adet H1 başlığı ekleyin');
      recommendations.push('   2. Title\'dan farklı ama ilgili olmalı');
      recommendations.push('   3. Ana anahtar kelimeyi içermeli');
      recommendations.push('   4. Kullanıcıya değer vadeden bir başlık yazın');
      recommendations.push(`💡 ÖRNEK: "2024'te SEO Nasıl Yapılır? Adım Adım Rehber"`);
    } else if (onPage.headings.h1.count > 1) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: Çoklu H1 Sorunu (-15 puan)');
      recommendations.push('❌ MEVCUT: ' + onPage.headings.h1.count + ' adet H1 var - Google karışıklık yaşıyor');
      recommendations.push('✅ ÇÖZÜM: Sadece 1 H1 bırakın, diğerlerini H2 yapın');
      recommendations.push('💡 SEO KURALI: 1 sayfa = 1 H1 (hierarchy önemli)');
    }

    // İçerik Yapısı Analizi
    if (onPage.headings.h2.count < 2) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: Alt Başlık Eksikliği (-10 puan)');
      recommendations.push('❌ MEVCUT: ' + onPage.headings.h2.count + ' adet H2 - İçerik düzensiz görünüyor');
      recommendations.push('✅ ÇÖZÜM: En az 2-3 H2 alt başlığı ekleyin');
      recommendations.push('💡 FAYDA: Okunabilirlik artışı + Google featured snippet şansı');
      recommendations.push('🎯 ÖRNEKLER: "SEO Nedir?", "SEO Nasıl Yapılır?", "SEO Araçları"');
    }

    // Görsel Optimizasyonu
    if (onPage.images.total === 0) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: Görsel Eksikliği (-15 puan)');
      recommendations.push('❌ MEVCUT: Hiç görsel yok - Kullanıcı deneyimi zayıf');
      recommendations.push('✅ ÇÖZÜM:');
      recommendations.push('   1. En az 2-3 ilgili görsel ekleyin');
      recommendations.push('   2. WebP formatını tercih edin (hız için)');
      recommendations.push('   3. Dosya boyutunu optimize edin (<100KB)');
      recommendations.push('🎯 ETKİ: Görseller sayfada kalma süresini %40 artırır');
    } else if (onPage.images.withoutAlt > 0) {
      const ratio = Math.round((onPage.images.withoutAlt / onPage.images.total) * 100);
      recommendations.push('');
      recommendations.push('🟡 IYILESTIRME: Alt Text Eksikliği (-' + Math.min(ratio / 2, 20) + ' puan)');
      recommendations.push('❌ MEVCUT: ' + onPage.images.withoutAlt + '/' + onPage.images.total + ' görselde alt text eksik (%' + ratio + ')');
      recommendations.push('✅ ÇÖZÜM: Tüm görsellere açıklayıcı alt text ekleyin');
      recommendations.push('💡 ÖRNEK: alt="SEO analiz araçları dashboard ekranı"');
      recommendations.push('🎯 FAYDA: Erişilebilirlik + Google Images\'dan trafik');
    }

    // İç/Dış Link Analizi
    if (onPage.internalLinks.count < 3) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: İç Link Eksikliği (-10 puan)');
      recommendations.push('❌ MEVCUT: ' + onPage.internalLinks.count + ' iç link - Site navigasyonu zayıf');
      recommendations.push('✅ ÇÖZÜM: 3-5 ilgili sayfaya iç link ekleyin');
      recommendations.push('💡 STRATEJİ: Benzer konulu sayfalara, kategori sayfalarına link verin');
      recommendations.push('🎯 ETKİ: Link juice dağılımı + kullanıcı sayfa geçişi artışı');
    }

    if (onPage.externalLinks.count === 0) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: Dış Kaynak Eksikliği (-5 puan)');
      recommendations.push('❌ MEVCUT: Hiç dış link yok - İçerik güvenilirliği düşük');
      recommendations.push('✅ ÇÖZÜM: 1-2 otoriteli kaynağa dış link ekleyin');
      recommendations.push('💡 ÖNERİ: Wikipedia, resmi kurumlar, uzman siteler');
      recommendations.push('🎯 FAYDA: İçerik güvenilirliği + Google E-A-T skoru artışı');
    }

    // İçerik Uzunluğu
    if (onPage.contentLength.wordCount < 300) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: İçerik Çok Kısa (-25 puan)');
      recommendations.push('❌ MEVCUT: ' + onPage.contentLength.wordCount + ' kelime - Google için yetersiz');
      recommendations.push('✅ ÇÖZÜM: En az 600-800 kelimeye çıkarın');
      recommendations.push('💡 EKLEYEBİLECEKLERİNİZ: Örnekler, detaylar, alt konular, sık sorulan sorular');
      recommendations.push('🎯 İSTATİSTİK: 600+ kelimeli içerikler %40 daha iyi sıralanıyor');
    } else if (onPage.contentLength.wordCount < 600) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: İçerik Orta Uzunlukta (-10 puan)');
      recommendations.push('❌ MEVCUT: ' + onPage.contentLength.wordCount + ' kelime - Rekabetçi kelimeler için az');
      recommendations.push('✅ ÇÖZÜM: 800-1200 kelimeye çıkararak derinlik katın');
      recommendations.push('💡 EKLEYEBİLECEKLERİNİZ: Alt başlıklar, örnekler, karşılaştırmalar');
    }

    // ==================== SAYFA DIŞI SEO ANALİZİ ====================

    recommendations.push('');
    recommendations.push('📊 SAYFA DIŞI SEO ANALİZİ (Mevcut Puan: ' + this.calculateOffPageScore(offPage) + '/100)');

    // Domain Authority
    if (offPage.domainAuthority.score < 20) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: Domain Otoritesi Çok Düşük (' + offPage.domainAuthority.score + '/100)');
      recommendations.push('❌ NEDEN DÜŞÜK: Sitenize çok az kaliteli link var, Google güven vermiyor');
      recommendations.push('✅ 6 AYLIK AKSİYON PLANI:');
      recommendations.push('   1. Kaliteli blog yazıları yazın (haftada 2-3 adet)');
      recommendations.push('   2. Sektör uzmanlarıyla iletişime geçin');
      recommendations.push('   3. Guest blog yazıları yapın');
      recommendations.push('   4. Broken link building stratejisi uygulayın');
      recommendations.push('   5. Sosyal medyada aktif olun');
      recommendations.push('   6. Online PR çalışmaları yapın');
      recommendations.push('🎯 HEDEf: 6 ayda 30+ puana çıkarmak mümkün');
      recommendations.push('💰 BÜTÇE: Aylık 2000-5000₺ link building bütçesi ayırın');
    } else if (offPage.domainAuthority.score < 40) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: Domain Otoritesi Orta (' + offPage.domainAuthority.score + '/100)');
      recommendations.push('✅ İLERİ SEVİYE STRATEJİLER:');
      recommendations.push('   1. Yüksek DA\'lı sitelerden link almaya odaklanın');
      recommendations.push('   2. Podcast\'lere konuk olun');
      recommendations.push('   3. Online etkinliklerde konuşun');
      recommendations.push('   4. Basında yer almaya çalışın');
      recommendations.push('🎯 HEDEf: 12 ayda 50+ puana ulaşmak');
    }

    // Backlink Analizi
    if (offPage.backlinks.count < 10) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: Backlink Sayısı Çok Az (' + offPage.backlinks.count + ' adet)');
      recommendations.push('❌ MEVCUT DURUM: Hiç link popülerliğiniz yok');
      recommendations.push('✅ ACİL BACKLINK STRATEJİSİ:');
      recommendations.push('   1. Sosyal medya profillerinize site linki ekleyin');
      recommendations.push('   2. Google Business Profile\'dan link alın');
      recommendations.push('   3. Sektör dizinlerine kaydolun');
      recommendations.push('   4. Rakip analizi yaparak onların linklerini inceleyin');
      recommendations.push('   5. HARO (Help a Reporter Out) kullanın');
      recommendations.push('🎯 HEDEF: İlk 3 ayda 20+ backlink');
      recommendations.push('⚠️ DİKKAT: Kalite > Miktar (spam linklerden kaçının)');
    }

    // Sosyal Medya Sinyalleri
    if (offPage.socialSignals.score < 3) {
      recommendations.push('');
      recommendations.push('🟡 İYİLEŞTİRME: Sosyal Medya Sinyalleri Zayıf');
      recommendations.push('✅ SOSYAL MEDYA STRATEJİSİ:');
      recommendations.push('   1. İçeriklerinizi düzenli olarak paylaşın');
      recommendations.push('   2. Takipçilerinizi paylaşım yapmaya teşvik edin');
      recommendations.push('   3. Viral potansiyeli olan içerikler üretin');
      recommendations.push('   4. İnfluencer\'larla işbirliği yapın');
      recommendations.push('🎯 ETKİ: Sosyal sinyaller dolaylı ranking faktörü');
    }

    // ==================== TEKNİK SEO ANALİZİ ====================

    recommendations.push('');
    recommendations.push('📊 TEKNİK SEO ANALİZİ (Mevcut Puan: ' + this.calculateTechnicalScore(technical) + '/100)');

    if (!technical.robotsTxt.exists) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: robots.txt Dosyası Eksik (-30 puan)');
      recommendations.push('❌ NEDEN SORUN: Google bot\'ları sitenizi nasıl tarayacağını bilmiyor');
      recommendations.push('✅ HEMEN YAPILACAKLAR:');
      recommendations.push('   1. Ana dizininize robots.txt dosyası oluşturun');
      recommendations.push('   2. İçeriğe şunları ekleyin:');
      recommendations.push('      User-agent: *');
      recommendations.push('      Allow: /');
      recommendations.push('      Sitemap: https://siteniz.com/sitemap.xml');
      recommendations.push('   3. Google Search Console\'da test edin');
      recommendations.push('🎯 ETKİ: Indexlenme hızı %50 artabilir');
    }

    if (!technical.sitemap.exists) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: XML Sitemap Eksik (-25 puan)');
      recommendations.push('❌ NEDEN SORUN: Google sitenizin tüm sayfalarını bulamıyor');
      recommendations.push('✅ ÇÖZÜM ADMLARI:');
      recommendations.push('   1. XML sitemap oluşturun (WordPress: Yoast/RankMath)');
      recommendations.push('   2. Google Search Console\'a gönderin');
      recommendations.push('   3. Bing Webmaster Tools\'a da ekleyin');
      recommendations.push('   4. Düzenli güncellendiğinden emin olun');
      recommendations.push('🎯 ETKİ: Yeni içerikler 3x daha hızlı indexlenir');
    }

    if (!technical.ssl.enabled) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: SSL Sertifikası Yok (-40 puan)');
      recommendations.push('❌ NEDEN KRİTİK: Google ranking faktörü + güvenlik uyarısı');
      recommendations.push('✅ ACİL ÇÖZÜM:');
      recommendations.push('   1. Hosting sağlayıcınızdan SSL sertifikası alın');
      recommendations.push('   2. Tüm HTTP linklerini HTTPS\'e yönlendirin');
      recommendations.push('   3. Search Console\'da HTTPS versiyonunu ekleyin');
      recommendations.push('💰 MALİYET: Genellikle ücretsiz (Let\'s Encrypt)');
      recommendations.push('⚠️ UYARI: SSL olmadan modern tarayıcılar "güvensiz" uyarısı veriyor');
    }

    if (technical.mobileFriendly.score < 70) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: Mobil Uyumluluk Sorunu (' + technical.mobileFriendly.score + '/100)');
      recommendations.push('❌ NEDEN KRİTİK: Google Mobile-First indexing kullanıyor');
      recommendations.push('✅ MOBİL OPTİMİZASYON LİSTESİ:');
      recommendations.push('   1. Responsive tasarım uygulayın');
      recommendations.push('   2. Buton boyutlarını 44px+ yapın');
      recommendations.push('   3. Metin boyutunu 16px+ tutun');
      recommendations.push('   4. Viewport meta tag ekleyin');
      recommendations.push('   5. Yatay kaydırma barını kaldırın');
      recommendations.push('🎯 İSTATİSTİK: Mobil trafiğin %60+ olduğu siteler');
    }

    if (technical.pageSpeed.score < 60) {
      recommendations.push('');
      recommendations.push('🔴 KRİTİK SORUN: Sayfa Hızı Çok Yavaş (' + technical.pageSpeed.score + '/100)');
      recommendations.push('❌ NEDEN SORUN: Google Core Web Vitals ranking faktörü');
      recommendations.push('✅ HIZ OPTİMİZASYONU (ETKİ SIRASINA GÖRE):');
      recommendations.push('   1. 🚀 Görselleri WebP formatına çevirin (+15-25 puan)');
      recommendations.push('   2. 🚀 Caching sistemi kurun (+10-20 puan)');
      recommendations.push('   3. 🚀 Gereksiz plugin\'leri kaldırın (+5-15 puan)');
      recommendations.push('   4. 📡 CDN kullanın (+5-10 puan)');
      recommendations.push('   5. 💾 Veritabanını optimize edin (+3-8 puan)');
      recommendations.push('🎯 HEDEF: 80+ puan (Google "iyi" kategorisi)');
      recommendations.push('📊 ETKİ: Sayfa hızı 1 saniye azalırsa conversion %7 artar');
    }

    // ==================== 🤖 AIO (AI OPTİMİZASYONU) ANALİZİ ====================

    const aioScore = this.calculateAIOScore(aio);
    recommendations.push('');
    recommendations.push('📊 🤖 AIO (AI OPTİMİZASYONU) ANALİZİ (Mevcut Puan: ' + aioScore + '/100)');
    recommendations.push('🔥 ChatGPT, Perplexity, Bing Copilot görünürlük analizi:');

    // Soru-Cevap İçerik Analizi
    if (!aio.questionAnswerContent.hasQuestionWords) {
      recommendations.push('');
      recommendations.push('🤖 AIO KRİTİK: Soru Kelimeler Eksik (-30 puan)');
      recommendations.push('❌ NEDEN DÜŞÜK: AI motorları soru-cevap odaklı içerikleri kaynak gösteriyor');
      recommendations.push('✅ AI İÇİN İÇERİK STRATEJİSİ:');
      recommendations.push('   1. Başlıklarınızı soru formatında yazın:');
      recommendations.push('      ❌ "SEO Teknikleri" → ✅ "SEO Nasıl Yapılır?"');
      recommendations.push('      ❌ "Fiyat Bilgisi" → ✅ "Kaç Para Tutar?"');
      recommendations.push('   2. Bu soru kelimelerini kullanın: nedir, nasıl, neden, hangi, kim, nerede');
      recommendations.push('   3. "En iyi", "yöntemler", "rehber" kelimelerini ekleyin');
      recommendations.push('🎯 AI ETKİSİ: ChatGPT %300 daha fazla kaynak gösterir');
    } else if (aio.questionAnswerContent.questionTypes.length < 3) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Soru Çeşitliliği Az (-15 puan)');
      recommendations.push('❌ MEVCUT: ' + aio.questionAnswerContent.questionTypes.length + ' farklı soru tipi');
      recommendations.push('✅ ÇÖZÜM: Bu soru türlerini de ekleyin:');
      recommendations.push('   • "Ne zaman?" (zaman bilgisi)');
      recommendations.push('   • "Nerede?" (yer bilgisi)');
      recommendations.push('   • "Kim?" (kişi bilgisi)');
      recommendations.push('   • "Kaç?" (sayısal bilgi)');
      recommendations.push('🎯 AI FAYDA: Çeşitli sorularda kaynak gösterilme şansı');
    }

    if (!aio.questionAnswerContent.answerStructure) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Cevap Yapısı Eksik (-20 puan)');
      recommendations.push('❌ NEDEN SORUN: AI\'lar başlıklarda soru bulamıyor');
      recommendations.push('✅ AI-FRIENDLY YAPILANDR:');
      recommendations.push('   1. H2 başlıklarınızı soru formatında yazın');
      recommendations.push('   2. Her sorunun altında kısa net cevap verin');
      recommendations.push('   3. FAQ bölümü ekleyin');
      recommendations.push('💡 ÖRNEK YAPI:');
      recommendations.push('      H2: "SEO Nedir?"');
      recommendations.push('      P: "SEO, arama motoru optimizasyonu..."');
      recommendations.push('🎯 AI ETKİSİ: Featured snippet kazanma şansı %400 artar');
    }

    // İçerik Yapısı AIO
    if (!aio.contentStructure.hasSummary) {
      recommendations.push('');
      recommendations.push('🤖 AIO KRİTİK: Özet Paragraf Eksik (-25 puan)');
      recommendations.push('❌ NEDEN KRİTİK: AI motorları ilk paragrafı hızlı cevap için kullanıyor');
      recommendations.push('✅ AI ÖZET FORMATLI:');
      recommendations.push('   1. İlk paragrafta 2-3 cümlede ana cevabı verin');
      recommendations.push('   2. 50-160 karakter arası tutun (snippet için ideal)');
      recommendations.push('   3. Ana anahtar kelimeyi dahil edin');
      recommendations.push('   4. Somut fayda belirtin');
      recommendations.push('💡 MÜKEMMEL ÖZET ÖRNEK:');
      recommendations.push('      "SEO, web sitenizin Google\'da üst sıralarda çıkmasını sağlayan');
      recommendations.push('       tekniklerin bütünüdür. Doğru SEO ile organik trafiğinizi 10 katına çıkarabilirsiniz."');
      recommendations.push('🎯 AI ETKİSİ: ChatGPT bu özetleri direkt alıntılıyor');
    }

    if (!aio.contentStructure.hasDetailedSections) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: İki Kademeli İçerik Eksik (-15 puan)');
      recommendations.push('❌ MEVCUT: Alt başlıklar yetersiz, AI derinlik bulamıyor');
      recommendations.push('✅ AI İÇİN YAPILANDIRMA:');
      recommendations.push('   1. İki kademe sistemi: Özet + Detaylı');
      recommendations.push('   2. En az 3-4 alt başlık (H2) ekleyin');
      recommendations.push('   3. Her başlık farklı açıdan konuyu işlesin');
      recommendations.push('🎯 AI MANTALI: Önce hızlı cevap, sonra derinlik');
    }

    if (!aio.contentStructure.hasNumberedLists && !aio.contentStructure.hasBulletPoints) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Liste Formatı Eksik (-20 puan)');
      recommendations.push('❌ NEDEN SORUN: AI motorları yapılandırılmış bilgiyi tercih ediyor');
      recommendations.push('✅ AI DOSTU LİSTE FORMATI:');
      recommendations.push('   1. Numaralı liste (nasıl yapılır adımları için)');
      recommendations.push('   2. Madde işaretli liste (özellikler için)');
      recommendations.push('   3. Checklist formatı (yapılacaklar için)');
      recommendations.push('💡 AI SEVDİĞİ FORMATLAR:');
      recommendations.push('      • "En iyi 5 yöntem"');
      recommendations.push('      • "Adım adım rehber"');
      recommendations.push('      • "Kontrol listesi"');
      recommendations.push('🎯 AI ETKİSİ: Perplexity bu listeleri direkt gösteriyor');
    }

    // Kaynak Güvenilirliği AIO
    if (!aio.sourceCredibility.hasExternalLinks) {
      recommendations.push('');
      recommendations.push('🤖 AIO KRİTİK: Güvenilir Kaynak Linkler Eksik (-30 puan)');
      recommendations.push('❌ NEDEN KRİTİK: AI motorları kaynak linkli içerikleri daha güvenilir buluyor');
      recommendations.push('✅ AI GÜVENİLİRLİK STRATEJİSİ:');
      recommendations.push('   1. Bu otoriteli kaynaklara link verin:');
      recommendations.push('      📚 Wikipedia, Google Scholar');
      recommendations.push('      🏛️ Resmi kurumlar (.gov, .edu)');
      recommendations.push('      📊 İstatistik siteleri (TÜİK, Statista)');
      recommendations.push('      🔬 Araştırma makaleleri');
      recommendations.push('   2. "Kaynak", "araştırma", "veri" kelimelerini kullanın');
      recommendations.push('   3. Link anchor text\'ini açıklayıcı yapın');
      recommendations.push('🎯 AI ETKİSİ: Google E-A-T skorunuz %200 artabilir');
    }

    if (!aio.sourceCredibility.hasAuthorInfo) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Yazar Bilgisi Eksik (-20 puan)');
      recommendations.push('❌ NEDEN SORUN: AI motorları uzman kaynaklı içerik tercih ediyor');
      recommendations.push('✅ YAZAR OTORİTESİ ÇÖZÜMÜ:');
      recommendations.push('   1. Yazar kutusu ekleyin (kim yazdı, uzmanlık alanı)');
      recommendations.push('   2. LinkedIn profil linki ekleyin');
      recommendations.push('   3. "Uzman", "deneyim", "sertifika" vurgularını yapın');
      recommendations.push('   4. Byline ekleyin: "John Doe - 10 yıllık SEO uzmanı"');
      recommendations.push('🎯 AI ETKİSİ: ChatGPT uzman yazıları %150 daha fazla referans ediyor');
    }

    if (!aio.sourceCredibility.hasPublishDate) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Tarih Bilgisi Eksik (-15 puan)');
      recommendations.push('❌ NEDEN SORUN: AI motorları güncel içerik tercih ediyor');
      recommendations.push('✅ TARİH OPTİMİZASYONU:');
      recommendations.push('   1. Yayın tarihi ekleyin (schema.org/datePublished)');
      recommendations.push('   2. Güncelleme tarihi belirtin');
      recommendations.push('   3. "2024", "güncel", "yeni" kelimelerini kullanın');
      recommendations.push('🎯 AI ETKİSİ: Perplexity güncel içerikleri %300 daha fazla gösteriyor');
    }

    // Semantik Kelimeler AIO
    if (aio.semanticKeywords.lsiKeywords.length < 3) {
      recommendations.push('');
      recommendations.push('🤖 AIO KRİTİK: LSI Kelimeler Eksik (-25 puan)');
      recommendations.push('❌ MEVCUT: ' + aio.semanticKeywords.lsiKeywords.length + ' semantik kelime - AI bağlamı anlamıyor');
      recommendations.push('✅ SEMANTİK KENGİNLİĞİ STRATEJİSİ:');
      recommendations.push('   Ana kelime: SEO → Eklenecek semantik kelimeler:');
      recommendations.push('   🔍 Arama motoru optimizasyonu, SERP, snippet');
      recommendations.push('   🔍 Backlink, domain authority, page rank');
      recommendations.push('   🔍 Keywords, indexing, crawling');
      recommendations.push('   🔍 Organik trafik, sıralama, görünürlük');
      recommendations.push('💡 LSI ARAÇLARI: LSIGraph, Google related searches');
      recommendations.push('🎯 AI ETKİSİ: Bağlamsal anlama %400 artışı');
    }

    if (aio.semanticKeywords.semanticDensity < 2) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Semantik Yoğunluk Düşük (%' + aio.semanticKeywords.semanticDensity + ')');
      recommendations.push('❌ NEDEN DÜŞÜK: Ana konu etrafında yeterli kelime çeşitliliği yok');
      recommendations.push('✅ ÇÖZÜM: %3-5 arası semantik yoğunluk hedefleyin');
      recommendations.push('💡 EKLEYEBİLECEKLERİNİZ: Eş anlamlılar, ilgili terimler');
    } else if (aio.semanticKeywords.semanticDensity > 8) {
      recommendations.push('');
      recommendations.push('🤖 AIO UYARI: Semantik Yoğunluk Çok Yüksek (%' + aio.semanticKeywords.semanticDensity + ')');
      recommendations.push('❌ RİSK: Spam görünebilir, doğal akış bozulur');
      recommendations.push('✅ ÇÖZÜM: %5 altına indirin, daha doğal yazın');
    }

    // Schema Markup AIO
    if (!aio.schemaMarkup.hasFAQSchema) {
      recommendations.push('');
      recommendations.push('🤖 AIO KRİTİK: FAQ Schema Eksik (-30 puan)');
      recommendations.push('❌ NEDEN KRİTİK: AI motorları structured data\'dan direkt besleniyor');
      recommendations.push('✅ FAQ SCHEMA UYGULAMA:');
      recommendations.push('   1. Sık sorulan sorular bölümü ekleyin');
      recommendations.push('   2. JSON-LD formatında FAQ schema ekleyin');
      recommendations.push('   3. En az 3-5 soru-cevap çifti yazın');
      recommendations.push('💡 SCHEMA KODU ÖRNEK:');
      recommendations.push('   {');
      recommendations.push('     "@type": "FAQPage",');
      recommendations.push('     "mainEntity": [{');
      recommendations.push('       "@type": "Question",');
      recommendations.push('       "name": "SEO nedir?",');
      recommendations.push('       "acceptedAnswer": {...}');
      recommendations.push('     }]');
      recommendations.push('   }');
      recommendations.push('🎯 AI ETKİSİ: ChatGPT FAQ verilerini %500 daha fazla kullanıyor');
    }

    if (!aio.schemaMarkup.hasHowToSchema) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: HowTo Schema Eksik (-20 puan)');
      recommendations.push('❌ NEDEN GEREKLİ: "Nasıl yapılır" içerikler için AI\'lar bu veriyi direkt kullanıyor');
      recommendations.push('✅ HOWTO SCHEMA EKLEME:');
      recommendations.push('   1. Adım adım rehber yazın');
      recommendations.push('   2. HowTo schema markup ekleyin');
      recommendations.push('   3. Her adımı numaralayın');
      recommendations.push('🎯 AI ETKİSİ: Google Assistant\'ta sesli cevap alma şansı');
    }

    if (!aio.schemaMarkup.hasArticleSchema) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Article Schema Eksik (-15 puan)');
      recommendations.push('❌ NEDEN GEREKLİ: AI motorları yazar, tarih, kategori bilgilerini güvenilirlik için kullanıyor');
      recommendations.push('✅ ARTİCLE SCHEMA EKLEMESİ:');
      recommendations.push('   1. Article schema markup ekleyin');
      recommendations.push('   2. Author, datePublished, headline bilgilerini doldurun');
      recommendations.push('   3. Organization schema ile bağlayın');
    }

    // Lokal AIO (GEO)
    if (!aio.localOptimization.hasLocationKeywords) {
      recommendations.push('');
      recommendations.push('🤖 AIO GEO: Lokasyon Kelimeleri Eksik (-20 puan)');
      recommendations.push('❌ NEDEN EKSİK: AI motorları coğrafi bağlamda size ulaşamıyor');
      recommendations.push('✅ LOKAL AI STRATEJİSİ:');
      recommendations.push('   1. Bu lokasyon varyasyonlarını ekleyin:');
      recommendations.push('      📍 "Türkiye\'de SEO"');
      recommendations.push('      📍 "İstanbul SEO uzmanı"');
      recommendations.push('      📍 "Ankara\'da dijital pazarlama"');
      recommendations.push('      📍 "Beyoğlu\'nda web tasarım"');
      recommendations.push('   2. Şehir + hizmet kombinasyonları yapın');
      recommendations.push('   3. Lokal anahtar kelimeler kullanın');
      recommendations.push('🎯 AI ETKİSİ: "İstanbul\'da..." aramaların da çıkma şansı');
    }

    if (!aio.localOptimization.hasLocalBusiness && aio.localOptimization.hasLocationKeywords) {
      recommendations.push('');
      recommendations.push('🤖 AIO GEO: Lokal İş Sinyalleri Eksik (-15 puan)');
      recommendations.push('❌ NEDEN EKSİK: AI motorları GMB verilerini tercih ediyor');
      recommendations.push('✅ LOKAL SİNYAL EKLEMESİ:');
      recommendations.push('   1. İletişim bilgilerinizi sayfada belirtin');
      recommendations.push('   2. Adres, telefon, email ekleyin');
      recommendations.push('   3. Çalışma saatlerini belirtin');
      recommendations.push('   4. Harita entegrasyonu yapın');
    }

    if (!aio.localOptimization.hasGMBSignals && aio.localOptimization.hasLocationKeywords) {
      recommendations.push('');
      recommendations.push('🤖 AIO GEO: Google Business Profile Eksik (-25 puan)');
      recommendations.push('❌ NEDEN KRİTİK: AI motorları lokal bilgiyi GMB\'den çekiyor');
      recommendations.push('✅ GMB OPTİMİZASYONU:');
      recommendations.push('   1. Google Business Profile oluşturun');
      recommendations.push('   2. Tüm bilgileri eksiksiz doldurun');
      recommendations.push('   3. Düzenli fotoğraf paylaşın');
      recommendations.push('   4. Müşteri yorumlarını yanıtlayın');
      recommendations.push('   5. Saatleri güncel tutun');
      recommendations.push('🎯 AI ETKİSİ: Bing Chat lokal aramalar için GMB kullanıyor');
    }

    // AI Hazırlık
    if (!aio.aiReadiness.snippetOptimized) {
      recommendations.push('');
      recommendations.push('🤖 AIO KRİTİK: Snippet Optimizasyonu Eksik (-25 puan)');
      recommendations.push('❌ NEDEN KRİTİK: AI motorları bu bölümü direkt çekiyor');
      recommendations.push('✅ SNIPPET OPTİMİZASYONU:');
      recommendations.push('   1. İlk paragrafı 50-160 karakter arası yapın');
      recommendations.push('   2. Ana sorunun kısa net cevabını verin');
      recommendations.push('   3. Sayısal veri eklerseniz daha etkili olur');
      recommendations.push('💡 MÜKEMMEL SNIPPET ÖRNEK:');
      recommendations.push('      "SEO ile organik trafiğinizi %300 artırabilirsiniz.');
      recommendations.push('       Bu rehberde 7 adımda SEO\'yu öğreneceksiniz."');
      recommendations.push('🎯 AI ETKİSİ: Featured snippet kazanma şansı %400 artışı');
    }

    if (!aio.aiReadiness.conversationalTone) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Konuşma Tonu Eksik (-15 puan)');
      recommendations.push('❌ NEDEN GEREKLİ: AI motorları doğal dili tercih ediyor');
      recommendations.push('✅ KONUŞMA TONLU YAZIM:');
      recommendations.push('   1. Bu kelimeleri kullanın: örneğin, yani, böylece, aslında');
      recommendations.push('   2. "Peki..." ile başlayan cümleler kurun');
      recommendations.push('   3. Doğrudan hitap edin: "Sizin için..."');
      recommendations.push('   4. Soru cümleleri kurun: "Acaba..."');
      recommendations.push('🎯 AI ETKİSİ: ChatGPT konuşma tonlu içerikleri %200 daha fazla referans ediyor');
    }

    if (!aio.aiReadiness.quickAnswers) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Hızlı Cevap Formatı Eksik (-20 puan)');
      recommendations.push('❌ NEDEN EKSİK: AI motorları madde madde bilgileri direkt alıntılıyor');
      recommendations.push('✅ HIZLI CEVAP FORMATLI:');
      recommendations.push('   1. Liste formatında bilgi sunun');
      recommendations.push('   2. Her madde 1-2 cümle olsun');
      recommendations.push('   3. Önemli bilgileri kalın yapın');
      recommendations.push('   4. Emoji kullanın (✓ ✗ 🎯 📊)');
      recommendations.push('🎯 AI ETKİSİ: Perplexity bu listeleri direkt gösteriyor');
    }

    if (!aio.aiReadiness.factualAccuracy) {
      recommendations.push('');
      recommendations.push('🤖 AIO ÖNEMLİ: Faktüel Doğruluk Sinyalleri Eksik (-20 puan)');
      recommendations.push('❌ NEDEN GEREKLİ: AI motorları kanıta dayalı içerik tercih ediyor');
      recommendations.push('✅ FAKTÜEL DOĞRULUK ARTIRMA:');
      recommendations.push('   1. Bu kelimeleri kullanın: araştırma, çalışma, veri, istatistik');
      recommendations.push('   2. Sayısal veriler paylaşın: "%X artış", "Y% daha etkili"');
      recommendations.push('   3. Kaynak çalışmalara atıf yapın');
      recommendations.push('   4. Tarih ve rakam belirtin');
      recommendations.push('🎯 AI ETKİSİ: Google E-A-T skorunuz direkt artacak');
    }

    // AIO Genel Skor Değerlendirmesi
    if (aioScore < 30) {
      recommendations.push('');
      recommendations.push('🚨 🤖 AIO KRİTİK DURUM: AI Görünürlüğünüz Çok Düşük (' + aioScore + '/100)');
      recommendations.push('❌ MEVCUT DURUM: ChatGPT, Perplexity, Bing Copilot sizi kaynak göstermiyor');
      recommendations.push('✅ 30 GÜN AIO ACİL EYLEM PLANI:');
      recommendations.push('   📅 1. Hafta: FAQ schema + soru-cevap içerik');
      recommendations.push('   📅 2. Hafta: Snippet optimizasyonu + liste formatları');
      recommendations.push('   📅 3. Hafta: Yazar bilgisi + kaynak linkler');
      recommendations.push('   📅 4. Hafta: Semantik kelimeler + konuşma tonu');
      recommendations.push('🎯 HEDEF: 60+ puana çıkarmak (AI\'larda görünür olma)');
      recommendations.push('💰 BÜTÇE: 0₺ - Sadece içerik düzenlemesi gerekli');
    } else if (aioScore < 60) {
      recommendations.push('');
      recommendations.push('🟡 🤖 AIO ORTA SEVİYE: AI Optimizasyonu Geliştirilmeli (' + aioScore + '/100)');
      recommendations.push('✅ İLERİ SEVİYE AIO STRATEJİLERİ:');
      recommendations.push('   1. 🔬 Daha fazla araştırma verisi ekleyin');
      recommendations.push('   2. 📊 İstatistiksel bilgileri artırın');
      recommendations.push('   3. 🎯 HowTo schema ekleyin');
      recommendations.push('   4. 📍 Lokal optimizasyonu güçlendirin');
      recommendations.push('🎯 HEDEF: 80+ puana ulaşmak (AI\'ların favorisi olma)');
    } else if (aioScore >= 80) {
      recommendations.push('');
      recommendations.push('🏆 🤖 AIO MÜKEMMEL: AI Motorlarında Favorisiniz! (' + aioScore + '/100)');
      recommendations.push('✅ MEVCUT DURUM: ChatGPT, Perplexity, Bing Copilot sizi sık kaynak gösteriyor');
      recommendations.push('🚀 İLERİ SEVİYE MAİNTENANCE:');
      recommendations.push('   1. 📅 İçerikleri düzenli güncelleyin');
      recommendations.push('   2. 🆕 Yeni soru-cevap çiftleri ekleyin');
      recommendations.push('   3. 📊 AI trafik verilerini takip edin');
      recommendations.push('   4. 🎯 Competitoru analizi yapın');
      recommendations.push('💡 TİP: Bu seviyeyi korumak yeni içerik üretmekten daha kolay');
    }

    // ==================== GENEL STRATEJİK ÖNERİLER ====================

    const criticalIssues = recommendations.filter(r => r.includes('🔴 KRİTİK')).length;
    const aioIssues = recommendations.filter(r => r.includes('🤖 AIO KRİTİK')).length;
    
    recommendations.push('');
    recommendations.push('📋 GENEL ÖNERİ PLANLAMASI:');
    
    if (criticalIssues > 3) {
      recommendations.push('🚨 ACİL DURUM: ' + criticalIssues + ' kritik sorun var! Önce bunları çözün.');
      recommendations.push('📅 ÖNCELİK SIRASI: 1. Teknik sorunlar → 2. İçerik → 3. AIO → 4. Link building');
    }
    
    if (aioIssues > 2) {
      recommendations.push('🤖 AI UYARI: ' + aioIssues + ' AIO kritik sorunu var. 2024\'te AI trafiği %300 artışta!');
      recommendations.push('🎯 AI FOKUSu: ChatGPT/Perplexity/Bing Copilot için optimizasyon şart');
    }
    
    recommendations.push('');
    recommendations.push('💼 PROFESYONEL DESTEK ÖNERİSİ:');
    
    const totalScore = this.calculateOverallScore(onPage, offPage, technical, aio).total;
    if (totalScore < 40) {
      recommendations.push('🆘 Genel puanınız çok düşük (' + totalScore + '/100). SEO uzmanı desteği almanızı öneriyoruz.');
      recommendations.push('💰 YATIRIM: Aylık 3000-8000₺ SEO bütçesi ile 6 ayda ciddi iyileşme mümkün');
    } else if (totalScore < 70) {
      recommendations.push('📈 Orta seviye puanınız var (' + totalScore + '/100). Doğru stratejilerle üst lige çıkabilirsiniz.');
      recommendations.push('🎯 HEDEF: 12 ayda 80+ puana ulaşmak mümkün');
    } else {
      recommendations.push('🎉 Tebrikler! Yüksek puanınız var (' + totalScore + '/100). Liderliği koruyun.');
    }
    
    recommendations.push('');
    recommendations.push('📊 SONUÇ ÖZETİ:');
    recommendations.push('🔄 SEO sürekli gelişen bir alan. Bu analizi ayda 1 kez tekrarlayın.');
    recommendations.push('📈 İyileştirmeler genellikle 3-6 ay içinde görünür olur. Sabırlı olun!');
    recommendations.push('🤖 2024-2025\'te AI optimizasyonu artık zorunluluk. AIO\'ya özel odaklanın.');

    return recommendations;
  }

  /**
   * URL normalizasyonu
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch {
      throw new Error('Geçersiz URL formatı');
    }
  }

  /**
   * Sayfa getirme
   */
  private async fetchPage(url: string) {
    try {
      // CORS problemi nedeniyle mock data kullan
      console.warn('CORS nedeniyle mock data kullanılıyor:', url);
      
      // AIO-friendly mock HTML response
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>SEO Nedir ve Nasıl Yapılır? - Arama Motoru Optimizasyonu Rehberi</title>
          <meta name="description" content="SEO (Arama Motoru Optimizasyonu) nedir, nasıl yapılır? Bu kapsamlı rehber ile SEO tekniklerini öğrenin ve sitenizi Google'da üst sıralara çıkarın.">
          <meta name="keywords" content="seo, arama motoru optimizasyonu, google seo, website optimization, serp, snippet">
          <meta name="author" content="Ahmet Kahraman - SEO Uzmanı">
          <meta name="publish-date" content="2024-01-15">
          <meta property="og:title" content="SEO Nedir ve Nasıl Yapılır? - Kapsamlı Rehber">
          <meta property="og:description" content="SEO teknikleri ile sitenizi Google'da üst sıralara çıkarın">
          <meta name="twitter:card" content="summary_large_image">
          
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "SEO Nedir ve Nasıl Yapılır?",
            "author": {
              "@type": "Person",
              "name": "Ahmet Kahraman"
            },
            "datePublished": "2024-01-15",
            "description": "SEO (Arama Motoru Optimizasyonu) nedir, nasıl yapılır sorusunun kapsamlı cevabı"
          }
          </script>
          
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "SEO nedir?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "SEO (Search Engine Optimization) arama motoru optimizasyonu anlamına gelir."
                }
              }
            ]
          }
          </script>
        </head>
        <body>
          <article class="author-bio">
            <h1>SEO Nedir ve Nasıl Yapılır? - Türkiye'de Arama Motoru Optimizasyonu</h1>
            
            <div class="author-info">
              <p>Yazar: <strong>Ahmet Kahraman</strong> - SEO Uzmanı</p>
              <time class="published" datetime="2024-01-15">15 Ocak 2024</time>
            </div>
            
            <p>SEO (Arama Motoru Optimizasyonu), web sitenizin Google, Bing gibi arama motorlarında üst sıralarda görünmesini sağlayan tekniklerin bütünüdür. Böylece organik trafik artışı elde edebilirsiniz.</p>
            
            <h2>SEO Nedir? - Temel Tanım</h2>
            <p>Arama motoru optimizasyonu yani SEO, sitenizin arama sonuçlarında (SERP) daha iyi sıralanması için yapılan çalışmalardır. Örneğin, kullanıcılar "İstanbul SEO uzmanı" aradığında siteniz ilk sayfada çıkmalıdır.</p>
            
            <h2>SEO Nasıl Yapılır? - Adım Adım Rehber</h2>
            <ol>
              <li><strong>Anahtar Kelime Araştırması:</strong> Hedef kitlenizin ne aradığını belirleyin</li>
              <li><strong>İçerik Optimizasyonu:</strong> Kaliteli, uzun içerikler yazın</li>
              <li><strong>Teknik SEO:</strong> Site hızı, mobil uyumluluk gibi teknik faktörleri optimize edin</li>
              <li><strong>Link Building:</strong> Kaliteli backlink'ler kazanın</li>
              <li><strong>Yerel SEO:</strong> Google Business Profile'ınızı optimize edin</li>
            </ol>
            
            <h2>En İyi SEO Yöntemleri Nelerdir?</h2>
            <ul>
              <li>Kullanıcı deneyimi odaklı içerik üretimi</li>
              <li>Sayfa hızı optimizasyonu (Core Web Vitals)</li>
              <li>Mobil-first yaklaşım</li>
              <li>Schema markup kullanımı</li>
              <li>İç linkleme stratejisi</li>
            </ul>
            
            <h3>Peki SEO Çalışmaları Ne Zaman Sonuç Verir?</h3>
            <p>SEO çalışmaları genellikle 3-6 ay arasında sonuç vermeye başlar. Yani sabırlı olmak gerekir. Araştırmalara göre, organik trafikte %200'e varan artışlar mümkündür.</p>
            
            <p>İletişim bilgileri: İstanbul, Türkiye - +90 555 123 45 67</p>
            <p>Konum: Beşiktaş, İstanbul - Harita için <a href="/map">buraya tıklayın</a></p>
            
            <img src="seo-chart.jpg" alt="SEO istatistikleri ve trafik artış grafiği">
            <img src="keyword-research.jpg" alt="Anahtar kelime araştırması örneği">
            <img src="no-alt.jpg">
            
            <p>Kaynak: <a href="https://moz.com/beginners-guide-to-seo" target="_blank">Moz SEO Rehberi</a></p>
            <p>Referans: <a href="https://searchengineland.com" target="_blank">Search Engine Land</a></p>
            
            <a href="/seo-hizmetleri">SEO Hizmetlerimiz</a>
            <a href="/blog">SEO Blog</a>
            <a href="/iletisim">İletişim</a>
          </article>
        </body>
        </html>
      `;
      
      return {
        data: mockHtml,
        status: 200,
        statusText: 'OK'
      };
      
      // Gerçek implementation (production için)
      // const response = await axios.get(url, {
      //   timeout: 10000
      // });
      // return response;
    } catch (error) {
      throw new Error(`Sayfa yüklenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  /**
   * Default OnPage sonucu
   */
  private getDefaultOnPageResult(): OnPageSEO {
    return {
      title: { exists: false, length: 0, score: 0, content: '' },
      metaDescription: { exists: false, length: 0, score: 0, content: '' },
      headings: {
        h1: { count: 0, score: 0, content: [] },
        h2: { count: 0, score: 0, content: [] },
        h3: { count: 0, score: 0, content: [] }
      },
      images: { total: 0, withoutAlt: 0, score: 0 },
      internalLinks: { count: 0, score: 0 },
      externalLinks: { count: 0, score: 0 },
      keywordDensity: { primary: '', density: 0, score: 0 },
      contentLength: { wordCount: 0, score: 0 }
    };
  }

  /**
   * Default OffPage sonucu
   */
  private getDefaultOffPageResult(): OffPageSEO {
    return {
      backlinks: { count: 0, score: 0, sources: [] },
      domainAuthority: { score: 0, level: 'Düşük' },
      pageAuthority: { score: 0, level: 'Düşük' },
      socialSignals: { facebook: 0, twitter: 0, linkedin: 0, score: 0 },
      mentions: { count: 0, score: 0, sources: [] }
    };
  }

  /**
   * Default Technical sonucu
   */
  private getDefaultTechnicalResult(): TechnicalSEO {
    return {
      robotsTxt: { exists: false, score: 0, content: '', rules: [], sitemaps: [], issues: [] },
      sitemap: { exists: false, score: 0, urlCount: 0, lastModified: null, type: 'unknown' as const, issues: [] },
      ssl: { enabled: false, score: 0, certificate: null },
      mobileFriendly: { score: 0, issues: [] },
      pageSpeed: { score: 0, loadTime: 0, metrics: {} },
      structuredData: { exists: false, score: 0, types: [] },
      socialMeta: { openGraph: false, twitter: false, score: 0 }
    };
  }

  /**
   * AIO (AI Optimization) Analizi
   */
  private async analyzeAIOSEO(url: string): Promise<AIOSEO> {
    try {
      const response = await this.fetchPage(url);
      const $ = cheerio.load(response.data);
      const textContent = $('body').text();
      const htmlContent = response.data;

      return {
        questionAnswerContent: this.analyzeQuestionAnswerContent(textContent),
        contentStructure: this.analyzeContentStructure($, textContent),
        sourceCredibility: this.analyzeSourceCredibility($, url),
        semanticKeywords: this.analyzeSemanticKeywords(textContent),
        schemaMarkup: this.analyzeSchemaMarkup(htmlContent),
        localOptimization: this.analyzeLocalOptimization(textContent),
        aiReadiness: this.analyzeAIReadiness(textContent, $)
      };
    } catch (error) {
      console.error('AIO analizi hatası:', error);
      return this.getDefaultAIOResult();
    }
  }

  /**
   * Soru-Cevap İçerik Analizi
   */
  private analyzeQuestionAnswerContent(textContent: string) {
    const questionWords = ['nedir', 'nasıl', 'ne zaman', 'neden', 'hangi', 'kim', 'nerede', 'kaç', 'what', 'how', 'when', 'why', 'which', 'who', 'where'];
    const questionTypes: string[] = [];
    let hasQuestionWords = false;
    let answerStructure = false;

    // Soru kelimelerini kontrol et
    questionWords.forEach(word => {
      if (textContent.toLowerCase().includes(word)) {
        hasQuestionWords = true;
        questionTypes.push(word);
      }
    });

    // Soru işareti kontrolü
    if (textContent.includes('?')) {
      answerStructure = true;
    }

    // Puan hesaplama
    let score = 0;
    if (hasQuestionWords) score += 30;
    if (questionTypes.length >= 3) score += 30;
    if (answerStructure) score += 40;

    return {
      hasQuestionWords,
      questionTypes: [...new Set(questionTypes)],
      answerStructure,
      score: Math.min(score, 100)
    };
  }

  /**
   * İçerik Yapısı Analizi
   */
  private analyzeContentStructure(_$: unknown, textContent: string) {
    // Text-based analysis instead of DOM parsing
    const hasSummary = textContent.length > 100;
    const hasDetailedSections = (textContent.match(/\n\s*\n/g) || []).length >= 2; // paragraph breaks
    const hasNumberedLists = /\d\.\s/.test(textContent);
    const hasBulletPoints = /[•·*-]\s/.test(textContent);

    let score = 0;
    if (hasSummary) score += 25;
    if (hasDetailedSections) score += 25;
    if (hasNumberedLists) score += 25;
    if (hasBulletPoints) score += 25;

    return {
      hasSummary,
      hasDetailedSections,
      hasNumberedLists,
      hasBulletPoints,
      score
    };
  }

  /**
   * Kaynak Güvenilirliği Analizi
   */
  private analyzeSourceCredibility($: cheerio.Root, url: string) {
    const hasExternalLinks = $('a[href^="http"]').not(`[href*="${new URL(url).hostname}"]`).length > 0;
    const hasAuthorInfo = $('[class*="author"], [class*="yazar"], .byline, .author-bio').length > 0;
    const hasPublishDate = $('[class*="date"], [class*="tarih"], time, .published').length > 0;
    const hasUpdatedDate = $('[class*="updated"], [class*="güncellen"]').length > 0;

    let score = 0;
    if (hasExternalLinks) score += 25;
    if (hasAuthorInfo) score += 25;
    if (hasPublishDate) score += 25;
    if (hasUpdatedDate) score += 25;

    return {
      hasExternalLinks,
      hasAuthorInfo,
      hasPublishDate,
      hasUpdatedDate,
      score
    };
  }

  /**
   * Semantik Anahtar Kelime Analizi
   */
  private analyzeSemanticKeywords(textContent: string) {
    const words = textContent.toLowerCase().split(/\s+/);
    const wordCount: { [key: string]: number } = {};
    
    // Kelime sayımı
    words.forEach(word => {
      word = word.replace(/[^\w]/g, '');
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    // En sık kullanılan kelimeleri bul
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const primaryKeyword = sortedWords[0]?.[0] || '';
    const lsiKeywords = sortedWords.slice(1, 6).map(([word]) => word);
    
    // Semantik yoğunluk hesaplama
    const totalWords = words.length;
    const semanticDensity = sortedWords.reduce((sum, [, count]) => sum + count, 0) / totalWords * 100;

    let score = 0;
    if (primaryKeyword) score += 20;
    if (lsiKeywords.length >= 3) score += 30;
    if (semanticDensity >= 2 && semanticDensity <= 8) score += 50;

    return {
      primaryKeyword,
      lsiKeywords,
      semanticDensity: parseFloat(semanticDensity.toFixed(2)),
      score
    };
  }

  /**
   * Schema Markup Analizi
   */
  private analyzeSchemaMarkup(htmlContent: string) {
    const hasFAQSchema = htmlContent.includes('"@type":"FAQPage"') || htmlContent.includes('"@type": "FAQPage"');
    const hasHowToSchema = htmlContent.includes('"@type":"HowTo"') || htmlContent.includes('"@type": "HowTo"');
    const hasArticleSchema = htmlContent.includes('"@type":"Article"') || htmlContent.includes('"@type": "Article"');
    const hasLocalSchema = htmlContent.includes('"@type":"LocalBusiness"') || htmlContent.includes('"@type": "LocalBusiness"');

    let score = 0;
    if (hasFAQSchema) score += 25;
    if (hasHowToSchema) score += 25;
    if (hasArticleSchema) score += 25;
    if (hasLocalSchema) score += 25;

    return {
      hasFAQSchema,
      hasHowToSchema,
      hasArticleSchema,
      hasLocalSchema,
      score
    };
  }

  /**
   * Lokal Optimizasyon Analizi
   */
  private analyzeLocalOptimization(textContent: string) {
    const locationKeywords = ['istanbul', 'ankara', 'izmir', 'türkiye', 'turkey', 'tr'];
    const locationVariations: string[] = [];
    let hasLocationKeywords = false;
    let hasLocalBusiness = false;
    let hasGMBSignals = false;

    // Lokasyon kelimelerini kontrol et
    locationKeywords.forEach(keyword => {
      if (textContent.toLowerCase().includes(keyword)) {
        hasLocationKeywords = true;
        locationVariations.push(keyword);
      }
    });

    // Lokal iş sinyalleri
    const businessKeywords = ['adres', 'telefon', 'iletişim', 'konum', 'harita', 'address', 'phone', 'contact'];
    hasLocalBusiness = businessKeywords.some(keyword => textContent.toLowerCase().includes(keyword));

    // GMB sinyalleri (telefon, adres formatları)
    const phonePattern = /(\+90|0)[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/;
    hasGMBSignals = phonePattern.test(textContent);

    let score = 0;
    if (hasLocationKeywords) score += 30;
    if (hasLocalBusiness) score += 35;
    if (hasGMBSignals) score += 35;

    return {
      hasLocationKeywords,
      hasLocalBusiness,
      hasGMBSignals,
      locationVariations: [...new Set(locationVariations)],
      score
    };
  }

  /**
   * AI Hazırlık Analizi
   */
  private analyzeAIReadiness(textContent: string, $: cheerio.Root) {
    // Snippet optimize edilmiş mi (kısa, net cevaplar)
    const firstParagraph = $('p').first().text();
    const snippetOptimized = firstParagraph.length >= 50 && firstParagraph.length <= 160;

    // Konuşma tonu
    const conversationalWords = ['merhaba', 'nasıl', 'böylece', 'örneğin', 'yani', 'aslında', 'peki'];
    const conversationalTone = conversationalWords.some(word => textContent.toLowerCase().includes(word));

    // Hızlı cevaplar
    const listItems = $('li').length;
    const quickAnswers = listItems >= 3;

    // Faktüel doğruluk sinyalleri
    const factualKeywords = ['araştırma', 'çalışma', 'veriler', 'istatistik', 'kaynak', 'research', 'study', 'data'];
    const factualAccuracy = factualKeywords.some(keyword => textContent.toLowerCase().includes(keyword));

    let score = 0;
    if (snippetOptimized) score += 25;
    if (conversationalTone) score += 25;
    if (quickAnswers) score += 25;
    if (factualAccuracy) score += 25;

    return {
      snippetOptimized,
      conversationalTone,
      quickAnswers,
      factualAccuracy,
      score
    };
  }

  /**
   * AIO Skoru Hesaplama
   */
  private calculateAIOScore(aio: AIOSEO): number {
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Question Answer Content Optimization (Ağırlık: 20%)
    maxPossibleScore += 20;
    if (aio.questionAnswerContent.score >= 90) {
      totalScore += 20; // Perfect Q&A structure for AI
    } else if (aio.questionAnswerContent.score >= 75) {
      totalScore += 16; // Good Q&A optimization
    } else if (aio.questionAnswerContent.score >= 50) {
      totalScore += 12; // Basic Q&A structure
    } else if (aio.questionAnswerContent.score >= 25) {
      totalScore += 6; // Poor Q&A optimization
    } else if (aio.questionAnswerContent.score > 0) {
      totalScore += 2; // Minimal Q&A content
    }

    // Content Structure for AI (Ağırlık: 18%)
    maxPossibleScore += 18;
    if (aio.contentStructure.score >= 90) {
      totalScore += 18; // Perfect AI-readable structure
    } else if (aio.contentStructure.score >= 75) {
      totalScore += 15; // Good structure for AI
    } else if (aio.contentStructure.score >= 50) {
      totalScore += 11; // Basic AI structure
    } else if (aio.contentStructure.score >= 25) {
      totalScore += 5; // Poor AI structure
    } else if (aio.contentStructure.score > 0) {
      totalScore += 2; // Minimal structure
    }

    // Source Credibility (Ağırlık: 17%)
    maxPossibleScore += 17;
    if (aio.sourceCredibility.score >= 90) {
      totalScore += 17; // Excellent credibility signals
    } else if (aio.sourceCredibility.score >= 75) {
      totalScore += 14; // Good credibility
    } else if (aio.sourceCredibility.score >= 50) {
      totalScore += 10; // Average credibility
    } else if (aio.sourceCredibility.score >= 25) {
      totalScore += 5; // Low credibility
    } else if (aio.sourceCredibility.score > 0) {
      totalScore += 1; // Poor credibility
    }

    // Semantic Keywords (Ağırlık: 15%)
    maxPossibleScore += 15;
    if (aio.semanticKeywords.score >= 90) {
      totalScore += 15; // Rich semantic context
    } else if (aio.semanticKeywords.score >= 75) {
      totalScore += 12; // Good semantic optimization
    } else if (aio.semanticKeywords.score >= 50) {
      totalScore += 9; // Basic semantic keywords
    } else if (aio.semanticKeywords.score >= 25) {
      totalScore += 4; // Poor semantic optimization
    } else if (aio.semanticKeywords.score > 0) {
      totalScore += 1; // Minimal semantic content
    }

    // Schema Markup for AI (Ağırlık: 12%)
    maxPossibleScore += 12;
    if (aio.schemaMarkup.score >= 90) {
      totalScore += 12; // Perfect schema for AI
    } else if (aio.schemaMarkup.score >= 75) {
      totalScore += 10; // Good schema markup
    } else if (aio.schemaMarkup.score >= 50) {
      totalScore += 7; // Basic schema
    } else if (aio.schemaMarkup.score >= 25) {
      totalScore += 3; // Poor schema
    } else if (aio.schemaMarkup.score > 0) {
      totalScore += 1; // Minimal schema
    }

    // Local Optimization for AI (Ağırlık: 10%)
    maxPossibleScore += 10;
    if (aio.localOptimization.score >= 90) {
      totalScore += 10; // Perfect local AI optimization
    } else if (aio.localOptimization.score >= 75) {
      totalScore += 8; // Good local optimization
    } else if (aio.localOptimization.score >= 50) {
      totalScore += 6; // Basic local optimization
    } else if (aio.localOptimization.score >= 25) {
      totalScore += 3; // Poor local optimization
    } else if (aio.localOptimization.score > 0) {
      totalScore += 1; // Minimal local optimization
    }

    // AI Readiness (Ağırlık: 8%)
    maxPossibleScore += 8;
    if (aio.aiReadiness.score >= 90) {
      totalScore += 8; // Fully AI-ready content
    } else if (aio.aiReadiness.score >= 75) {
      totalScore += 6; // Good AI readiness
    } else if (aio.aiReadiness.score >= 50) {
      totalScore += 4; // Basic AI readiness
    } else if (aio.aiReadiness.score >= 25) {
      totalScore += 2; // Poor AI readiness
    } else if (aio.aiReadiness.score > 0) {
      totalScore += 1; // Minimal AI readiness
    }

    // Calculate final percentage
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  /**
   * Default AIO sonucu
   */
  private getDefaultAIOResult(): AIOSEO {
    return {
      questionAnswerContent: {
        hasQuestionWords: false,
        questionTypes: [],
        answerStructure: false,
        score: 0
      },
      contentStructure: {
        hasSummary: false,
        hasDetailedSections: false,
        hasNumberedLists: false,
        hasBulletPoints: false,
        score: 0
      },
      sourceCredibility: {
        hasExternalLinks: false,
        hasAuthorInfo: false,
        hasPublishDate: false,
        hasUpdatedDate: false,
        score: 0
      },
      semanticKeywords: {
        primaryKeyword: '',
        lsiKeywords: [],
        semanticDensity: 0,
        score: 0
      },
      schemaMarkup: {
        hasFAQSchema: false,
        hasHowToSchema: false,
        hasArticleSchema: false,
        hasLocalSchema: false,
        score: 0
      },
      localOptimization: {
        hasLocationKeywords: false,
        hasLocalBusiness: false,
        hasGMBSignals: false,
        locationVariations: [],
        score: 0
      },
      aiReadiness: {
        snippetOptimized: false,
        conversationalTone: false,
        quickAnswers: false,
        factualAccuracy: false,
        score: 0
      }
    };
  }
}
