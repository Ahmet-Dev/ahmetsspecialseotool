import * as cheerio from 'cheerio';
import { HttpService } from './HttpService';

export interface TechnicalSEOResult {
  robotsTxt: {
    exists: boolean;
    content: string;
    isValid: boolean;
    hasDisallows: boolean;
    hasSitemap: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  };
  sitemap: {
    exists: boolean;
    content: string;
    urlCount: number;
    hasImages: boolean;
    hasNews: boolean;
    lastModified: string | null;
    score: number;
    issues: string[];
    recommendations: string[];
  };
  ssl: {
    isSecure: boolean;
    hasHsts: boolean;
    redirectsToHttps: boolean;
    score: number;
    issues: string[];
  };
  mobileOptimization: {
    hasViewport: boolean;
    isResponsive: boolean;
    touchOptimized: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  };
  pageSpeed: {
    resourceCount: number;
    totalSize: number;
    estimatedLoadTime: number;
    hasCompression: boolean;
    hasCaching: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  };
  structuredData: {
    schemas: Array<{ type: string; count: number }>;
    totalSchemas: number;
    hasOrgSchema: boolean;
    hasWebsiteSchema: boolean;
    hasArticleSchema: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  };
  indexability: {
    isIndexable: boolean;
    hasNoindexMeta: boolean;
    robotsBlocked: boolean;
    canonicalIssues: boolean;
    score: number;
    issues: string[];
  };
  internalLinking: {
    totalInternalLinks: number;
    uniqueInternalLinks: number;
    brokenLinks: number;
    averageDepth: number;
    score: number;
    issues: string[];
    recommendations: string[];
  };
  overallScore: number;
}

/**
 * Gelişmiş Teknik SEO Analiz Sınıfı
 * Kapsamlı teknik SEO faktörlerini analiz eder
 */
export class TechnicalSEOAnalyzer {
  private httpService: HttpService;

  constructor() {
    this.httpService = new HttpService();
  }

  /**
   * Kapsamlı teknik SEO analizi
   */
  async analyze(url: string, html?: string): Promise<TechnicalSEOResult> {
    try {
      // HTML yoksa fetch et
      let htmlContent = html;
      let headers: Record<string, string> = {};
      
      if (!htmlContent) {
        const response = await this.httpService.fetchHTML(url);
        htmlContent = response.data;
        headers = response.headers;
      }

      const $ = cheerio.load(htmlContent);

      const [robotsTxt, sitemap, ssl, mobileOptimization, pageSpeed, structuredData, indexability, internalLinking] = await Promise.all([
        this.analyzeRobotsTxt(url),
        this.analyzeSitemap(url),
        this.analyzeSSL(url, headers),
        this.analyzeMobileOptimization($, htmlContent),
        this.analyzePageSpeed(htmlContent, headers),
        this.analyzeStructuredData($),
        this.analyzeIndexability($, url),
        this.analyzeInternalLinking($, url)
      ]);

      const overallScore = this.calculateOverallScore({
        robotsTxt,
        sitemap,
        ssl,
        mobileOptimization,
        pageSpeed,
        structuredData,
        indexability,
        internalLinking
      });

      return {
        robotsTxt,
        sitemap,
        ssl,
        mobileOptimization,
        pageSpeed,
        structuredData,
        indexability,
        internalLinking,
        overallScore
      };
    } catch (error) {
      console.error('Technical SEO analysis failed:', error);
      throw new Error(`Technical SEO analizi başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  /**
   * Robots.txt analizi
   */
  private async analyzeRobotsTxt(url: string): Promise<TechnicalSEOResult['robotsTxt']> {
    try {
      const robotsContent = await this.httpService.fetchRobotsTxt(url);
      const exists = robotsContent.length > 0;
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      if (!exists) {
        issues.push('Robots.txt dosyası bulunamadı');
        score -= 30;
        recommendations.push('Robots.txt dosyası oluşturun');
      }

      // İçerik analizi
      const hasDisallows = /Disallow:/i.test(robotsContent);
      const hasSitemap = /Sitemap:/i.test(robotsContent);
      const hasUserAgent = /User-agent:/i.test(robotsContent);
      
      let isValid = true;

      if (exists) {
        if (!hasUserAgent) {
          issues.push('User-agent direktifi eksik');
          score -= 20;
          isValid = false;
        }

        if (!hasSitemap) {
          issues.push('Sitemap referansı eksik');
          score -= 15;
          recommendations.push('Sitemap URL\'ini robots.txt\'e ekleyin');
        }

        // Güvenlik kontrolleri
        if (robotsContent.includes('Disallow: /')) {
          issues.push('Tüm site robotlara kapatılmış');
          score -= 50;
        }

        // Gereksiz bloklamalar
        const blockedPaths = robotsContent.match(/Disallow:\s*([^\n\r]+)/gi) || [];
        
        if (blockedPaths.length === 0 && hasDisallows) {
          issues.push('Disallow direktifi boş');
          score -= 10;
        }

        // Çok fazla disallow
        if (blockedPaths.length > 20) {
          issues.push('Çok fazla disallow direktifi - yönetimi zorlaştırıyor');
          score -= 10;
          recommendations.push('Gereksiz disallow direktiflerini temizleyin');
        }

        // Sitemap URL kontrolü
        if (hasSitemap) {
          const sitemapUrls = robotsContent.match(/Sitemap:\s*([^\n\r]+)/gi) || [];
          sitemapUrls.forEach(sitemapLine => {
            const sitemapUrl = sitemapLine.replace(/Sitemap:\s*/i, '').trim();
            try {
              new URL(sitemapUrl);
            } catch {
              issues.push(`Geçersiz sitemap URL: ${sitemapUrl}`);
              score -= 15;
            }
          });
        }
      }

      return {
        exists,
        content: robotsContent,
        isValid,
        hasDisallows,
        hasSitemap,
        score: Math.max(score, 0),
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Robots.txt analizi hatası:', error);
      return {
        exists: false,
        content: '',
        isValid: false,
        hasDisallows: false,
        hasSitemap: false,
        score: 0,
        issues: ['Robots.txt analizi başarısız'],
        recommendations: ['Robots.txt dosyasının erişilebilir olduğundan emin olun']
      };
    }
  }

  /**
   * Sitemap analizi
   */
  private async analyzeSitemap(url: string): Promise<TechnicalSEOResult['sitemap']> {
    try {
      const sitemapContent = await this.httpService.fetchSitemap(url);
      const exists = sitemapContent.length > 0 && sitemapContent.includes('<urlset');
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      if (!exists) {
        issues.push('Sitemap.xml dosyası bulunamadı');
        score -= 40;
        recommendations.push('XML sitemap oluşturun');
        
        return {
          exists: false,
          content: '',
          urlCount: 0,
          hasImages: false,
          hasNews: false,
          lastModified: null,
          score: Math.max(score, 0),
          issues,
          recommendations
        };
      }

      // XML parsing
      const urlMatches = sitemapContent.match(/<loc>([^<]+)<\/loc>/g) || [];
      const urlCount = urlMatches.length;

      const hasImages = sitemapContent.includes('image:image') || sitemapContent.includes('<image:');
      const hasNews = sitemapContent.includes('news:news') || sitemapContent.includes('<news:');

      // Son güncelleme tarihi
      const lastmodMatch = sitemapContent.match(/<lastmod>([^<]+)<\/lastmod>/);
      const lastModified = lastmodMatch ? lastmodMatch[1] : null;

      // Sitemap kalitesi kontrolü
      if (urlCount === 0) {
        issues.push('Sitemap\'ta URL bulunamadı');
        score -= 30;
      } else if (urlCount > 50000) {
        issues.push('Sitemap çok büyük (50.000+ URL)');
        score -= 20;
        recommendations.push('Sitemap\'ı parçalara bölün');
      }

      // Lastmod kontrolü
      if (urlCount > 0 && !lastModified) {
        issues.push('Lastmod bilgisi eksik');
        score -= 10;
        recommendations.push('URL\'lere son güncelleme tarihi ekleyin');
      }

      // Priority ve changefreq kontrolü
      const hasPriority = sitemapContent.includes('<priority>');
      const hasChangefreq = sitemapContent.includes('<changefreq>');

      if (!hasPriority && urlCount > 10) {
        recommendations.push('Priority değerleri ekleyebilirsiniz');
      }

      if (!hasChangefreq && urlCount > 10) {
        recommendations.push('Changefreq değerleri ekleyebilirsiniz');
      }

      // Sitemap index kontrolü
      const hasSitemapIndex = sitemapContent.includes('<sitemapindex');
      if (!hasSitemapIndex && urlCount > 1000) {
        recommendations.push('Sitemap index kullanmayı düşünün');
      }

      // URL formatı kontrolü
      let invalidUrls = 0;
      urlMatches.forEach(urlMatch => {
        const url = urlMatch.replace(/<\/?loc>/g, '');
        try {
          new URL(url);
        } catch {
          invalidUrls++;
        }
      });

      if (invalidUrls > 0) {
        issues.push(`${invalidUrls} geçersiz URL formatı`);
        score -= Math.min(invalidUrls * 2, 20);
      }

      return {
        exists,
        content: sitemapContent,
        urlCount,
        hasImages,
        hasNews,
        lastModified,
        score: Math.max(score, 0),
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Sitemap analizi hatası:', error);
      return {
        exists: false,
        content: '',
        urlCount: 0,
        hasImages: false,
        hasNews: false,
        lastModified: null,
        score: 0,
        issues: ['Sitemap analizi başarısız'],
        recommendations: ['Sitemap dosyasının erişilebilir olduğundan emin olun']
      };
    }
  }

  /**
   * SSL ve güvenlik analizi
   */
  private async analyzeSSL(url: string, headers: Record<string, string>): Promise<TechnicalSEOResult['ssl']> {
    const urlObj = new URL(url);
    const isSecure = urlObj.protocol === 'https:';
    
    const hasHsts = !!(headers['strict-transport-security']);
    
    let score = 100;
    const issues: string[] = [];

    if (!isSecure) {
      issues.push('HTTPS kullanılmıyor');
      score -= 50;
    }

    if (isSecure && !hasHsts) {
      issues.push('HSTS header eksik');
      score -= 15;
    }

    // HTTP'den HTTPS'e yönlendirme kontrolü (simülasyon)
    let redirectsToHttps = isSecure;
    if (!isSecure) {
      // HTTP sitesi için HTTPS yönlendirmesi test edilebilir
      redirectsToHttps = false;
      issues.push('HTTP\'den HTTPS\'e yönlendirme yok');
      score -= 20;
    }

    return {
      isSecure,
      hasHsts,
      redirectsToHttps,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Mobil optimizasyon analizi
   */
  private async analyzeMobileOptimization($: cheerio.Root, htmlContent: string): Promise<TechnicalSEOResult['mobileOptimization']> {
    const viewport = $('meta[name="viewport"]').attr('content');
    const hasViewport = !!viewport && viewport.includes('width=device-width');
    
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!hasViewport) {
      issues.push('Viewport meta tag eksik veya yanlış');
      score -= 40;
      recommendations.push('Viewport meta tag ekleyin: width=device-width, initial-scale=1');
    }

    // CSS media queries kontrolü
    const hasMediaQueries = htmlContent.includes('@media') || htmlContent.includes('media=');
    let isResponsive = hasMediaQueries || hasViewport;

    if (!isResponsive) {
      issues.push('Responsive tasarım belirtileri bulunamadı');
      score -= 30;
      recommendations.push('CSS media queries kullanarak responsive tasarım uygulayın');
    }

    // Touch optimization kontrolleri
    const hasTouchOptimization = htmlContent.includes('touch-action') || 
                                htmlContent.includes('pointer-events') ||
                                htmlContent.includes('user-select');
    
    let touchOptimized = hasTouchOptimization;

    // Font boyutu kontrolü
    const hasSmallFonts = htmlContent.includes('font-size') && 
                         (htmlContent.includes('10px') || htmlContent.includes('11px') || htmlContent.includes('12px'));
    
    if (hasSmallFonts) {
      issues.push('Çok küçük font boyutları mobilde okunabilirlik sorunu yaratabilir');
      score -= 10;
      recommendations.push('Minimum 14px font boyutu kullanın');
    }

    // Flash content kontrolü
    const hasFlash = htmlContent.includes('<embed') || htmlContent.includes('<object') || 
                    htmlContent.includes('application/x-shockwave-flash');
    
    if (hasFlash) {
      issues.push('Flash content bulundu - mobilde desteklenmiyor');
      score -= 25;
      recommendations.push('Flash içerikleri HTML5 ile değiştirin');
    }

    // User-scalable kontrolü
    if (viewport && (viewport.includes('user-scalable=no') || viewport.includes('maximum-scale=1'))) {
      issues.push('Kullanıcı zoom\'u engellenmiş - erişilebilirlik sorunu');
      score -= 15;
      recommendations.push('Kullanıcının zoom yapabilmesine izin verin');
    }

    return {
      hasViewport,
      isResponsive,
      touchOptimized,
      score: Math.max(score, 0),
      issues,
      recommendations
    };
  }

  /**
   * Sayfa hızı analizi
   */
  private async analyzePageSpeed(htmlContent: string, headers: Record<string, string>): Promise<TechnicalSEOResult['pageSpeed']> {
    // Resource sayımı
    const $ = cheerio.load(htmlContent);
    const scripts = $('script[src]').length;
    const stylesheets = $('link[rel="stylesheet"]').length;
    const images = $('img[src]').length;
    const resourceCount = scripts + stylesheets + images;

    // Tahmini boyut hesaplama
    const totalSize = htmlContent.length + (scripts * 25000) + (stylesheets * 15000) + (images * 50000);
    
    // Tahmini yükleme süresi (basit hesaplama)
    const estimatedLoadTime = Math.max(1000, totalSize / 1000); // milliseconds

    const hasCompression = !!(headers['content-encoding'] && 
                             (headers['content-encoding'].includes('gzip') || 
                              headers['content-encoding'].includes('br')));
    
    const hasCaching = !!(headers['cache-control'] || headers['expires']);

    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Resource sayısı kontrolü
    if (resourceCount > 100) {
      issues.push('Çok fazla resource (100+)');
      score -= 25;
      recommendations.push('Resource sayısını azaltın ve birleştirin');
    } else if (resourceCount > 50) {
      issues.push('Yüksek resource sayısı');
      score -= 15;
      recommendations.push('CSS ve JS dosyalarını birleştirmeyi düşünün');
    }

    // Sayfa boyutu kontrolü
    if (totalSize > 5000000) { // 5MB
      issues.push('Sayfa boyutu çok büyük (5MB+)');
      score -= 30;
      recommendations.push('İmajları optimize edin ve gereksiz içerikleri kaldırın');
    } else if (totalSize > 3000000) { // 3MB
      issues.push('Sayfa boyutu büyük (3MB+)');
      score -= 20;
      recommendations.push('İmaj optimizasyonu yapın');
    }

    // Compression kontrolü
    if (!hasCompression) {
      issues.push('Gzip/Brotli sıkıştırma aktif değil');
      score -= 20;
      recommendations.push('Sunucuda gzip sıkıştırma aktif edin');
    }

    // Cache kontrolü
    if (!hasCaching) {
      issues.push('Cache headers eksik');
      score -= 15;
      recommendations.push('Static resource\'lar için cache headers ekleyin');
    }

    // İmaj optimizasyonu kontrolleri
    const unoptimizedImages = $('img:not([width]):not([height])').length;
    if (unoptimizedImages > 0) {
      issues.push(`${unoptimizedImages} imajda boyut belirtilmemiş`);
      score -= 10;
      recommendations.push('İmajlara width ve height özellikleri ekleyin');
    }

    // Inline CSS/JS kontrolü
    const inlineStyles = $('style').length;
    const inlineScripts = $('script:not([src])').length;
    
    if (inlineStyles > 5) {
      issues.push('Çok fazla inline CSS');
      score -= 10;
      recommendations.push('Inline CSS\'leri harici dosyalara taşıyın');
    }

    if (inlineScripts > 3) {
      issues.push('Çok fazla inline JavaScript');
      score -= 10;
      recommendations.push('Inline JavaScript\'leri harici dosyalara taşıyın');
    }

    return {
      resourceCount,
      totalSize,
      estimatedLoadTime,
      hasCompression,
      hasCaching,
      score: Math.max(score, 0),
      issues,
      recommendations
    };
  }

  /**
   * Structured Data analizi
   */
  private async analyzeStructuredData($: cheerio.Root): Promise<TechnicalSEOResult['structuredData']> {
    const schemas: Array<{ type: string; count: number }> = [];
    const schemaMap = new Map<string, number>();

    // JSON-LD schema kontrolü
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const content = $(element).html() || '';
        const jsonData = JSON.parse(content);
        
        if (jsonData['@type']) {
          const type = jsonData['@type'];
          schemaMap.set(type, (schemaMap.get(type) || 0) + 1);
        } else if (Array.isArray(jsonData)) {
          jsonData.forEach(item => {
            if (item['@type']) {
              const type = item['@type'];
              schemaMap.set(type, (schemaMap.get(type) || 0) + 1);
            }
          });
        }
      } catch (error) {
        console.warn('Schema parsing error:', error);
      }
    });

    // Microdata kontrolü
    $('[itemtype]').each((_, element) => {
      const itemtype = $(element).attr('itemtype') || '';
      const schemaType = itemtype.split('/').pop() || itemtype;
      schemaMap.set(schemaType, (schemaMap.get(schemaType) || 0) + 1);
    });

    // Schema map'ini array'e çevir
    schemaMap.forEach((count, type) => {
      schemas.push({ type, count });
    });

    const totalSchemas = schemas.reduce((sum, schema) => sum + schema.count, 0);
    const hasOrgSchema = schemas.some(s => s.type.toLowerCase().includes('organization'));
    const hasWebsiteSchema = schemas.some(s => s.type.toLowerCase().includes('website'));
    const hasArticleSchema = schemas.some(s => s.type.toLowerCase().includes('article'));

    let score = 50; // Base score
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (totalSchemas === 0) {
      issues.push('Structured data bulunamadı');
      score = 0;
      recommendations.push('Schema.org structured data ekleyin');
    } else {
      // Temel schema'lar için puan
      if (hasWebsiteSchema) score += 15;
      else recommendations.push('Website schema ekleyebilirsiniz');
      
      if (hasOrgSchema) score += 15;
      else recommendations.push('Organization schema ekleyebilirsiniz');
      
      if (hasArticleSchema) score += 10;
      
      // Çeşitlilik için bonus
      if (schemas.length >= 3) score += 10;
      else if (schemas.length >= 2) score += 5;

      // Çok fazla schema uyarısı
      if (totalSchemas > 20) {
        issues.push('Çok fazla schema - performans etkileyebilir');
        score -= 5;
      }
    }

    return {
      schemas,
      totalSchemas,
      hasOrgSchema,
      hasWebsiteSchema,
      hasArticleSchema,
      score: Math.min(score, 100),
      issues,
      recommendations
    };
  }

  /**
   * İndekslenebilirlik analizi
   */
  private async analyzeIndexability($: cheerio.Root, url: string): Promise<TechnicalSEOResult['indexability']> {
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const hasNoindexMeta = robotsMeta.toLowerCase().includes('noindex');
    
    // Canonical kontrolleri
    const canonicalElement = $('link[rel="canonical"]');
    const canonicalUrl = canonicalElement.attr('href');
    let canonicalIssues = false;

    if (canonicalElement.length > 1) {
      canonicalIssues = true;
    } else if (canonicalUrl) {
      try {
        const currentUrl = new URL(url);
        const canonical = new URL(canonicalUrl, url);
        
        // Self-referencing canonical kontrolü
        if (canonical.href !== currentUrl.href) {
          // Bu normal olabilir, kritik değil
        }
      } catch {
        canonicalIssues = true;
      }
    }

    // Robots.txt engellemesi (simülasyon)
    const robotsBlocked = false; // Bu gerçek robots.txt analizi ile belirlenir

    const isIndexable = !hasNoindexMeta && !robotsBlocked && !canonicalIssues;

    let score = 100;
    const issues: string[] = [];

    if (hasNoindexMeta) {
      issues.push('Sayfada noindex meta tag var');
      score -= 50;
    }

    if (robotsBlocked) {
      issues.push('Robots.txt sayfayı engelliyor');
      score -= 40;
    }

    if (canonicalIssues) {
      issues.push('Canonical URL sorunları');
      score -= 25;
    }

    // X-Robots-Tag kontrolü
    const xRobotsTag = $('meta[http-equiv="X-Robots-Tag"]').attr('content');
    if (xRobotsTag && xRobotsTag.toLowerCase().includes('noindex')) {
      issues.push('X-Robots-Tag noindex içeriyor');
      score -= 30;
    }

    return {
      isIndexable,
      hasNoindexMeta,
      robotsBlocked,
      canonicalIssues,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * İç link analizi
   */
  private async analyzeInternalLinking($: cheerio.Root, url: string): Promise<TechnicalSEOResult['internalLinking']> {
    const baseUrl = new URL(url).origin;
    const allLinks = $('a[href]');
    
    const internalLinks: string[] = [];
    let brokenLinks = 0;

    allLinks.each((_, element) => {
      const href = $(element).attr('href') || '';
      
      try {
        const linkUrl = new URL(href, url);
        
        if (linkUrl.origin === baseUrl) {
          internalLinks.push(linkUrl.href);
        }
      } catch {
        // Relative link veya geçersiz URL
        if (href.startsWith('/') || (!href.startsWith('http') && !href.startsWith('mailto:'))) {
          try {
            const fullUrl = new URL(href, url).href;
            internalLinks.push(fullUrl);
          } catch {
            brokenLinks++;
          }
        }
      }
    });

    const totalInternalLinks = internalLinks.length;
    const uniqueInternalLinks = new Set(internalLinks).size;
    
    // Ortalama derinlik tahmini (basit hesaplama)
    const averageDepth = Math.round(
      internalLinks.reduce((sum, link) => {
        const path = new URL(link).pathname;
        return sum + (path.split('/').length - 1);
      }, 0) / Math.max(totalInternalLinks, 1)
    );

    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (totalInternalLinks === 0) {
      issues.push('İç link bulunamadı');
      score -= 40;
      recommendations.push('İç linkler ekleyerek site navigasyonunu güçlendirin');
    } else {
      // Link sayısı kontrolü
      if (totalInternalLinks < 3) {
        issues.push('Çok az iç link');
        score -= 20;
        recommendations.push('Daha fazla iç link ekleyin');
      } else if (totalInternalLinks > 100) {
        issues.push('Çok fazla iç link');
        score -= 15;
        recommendations.push('İç link sayısını optimize edin');
      }

      // Benzersizlik oranı
      const uniquenessRatio = uniqueInternalLinks / totalInternalLinks;
      if (uniquenessRatio < 0.7) {
        issues.push('Aynı sayfalara çok fazla link');
        score -= 10;
        recommendations.push('Link dağılımını çeşitlendirin');
      }

      // Kırık linkler
      if (brokenLinks > 0) {
        issues.push(`${brokenLinks} potansiyel kırık link`);
        score -= Math.min(brokenLinks * 5, 25);
        recommendations.push('Kırık linkleri düzeltin');
      }

      // Derinlik kontrolü
      if (averageDepth > 4) {
        issues.push('Sayfa derinliği çok yüksek');
        score -= 15;
        recommendations.push('Önemli sayfaları ana sayfaya daha yakın konumlandırın');
      }
    }

    return {
      totalInternalLinks,
      uniqueInternalLinks,
      brokenLinks,
      averageDepth,
      score: Math.max(score, 0),
      issues,
      recommendations
    };
  }

  /**
   * Genel teknik SEO skoru hesaplama
   */
  private calculateOverallScore(results: Omit<TechnicalSEOResult, 'overallScore'>): number {
    const weights = {
      robotsTxt: 0.15,
      sitemap: 0.15,
      ssl: 0.15,
      mobileOptimization: 0.15,
      pageSpeed: 0.15,
      structuredData: 0.10,
      indexability: 0.10,
      internalLinking: 0.05
    };

    const totalScore = (
      results.robotsTxt.score * weights.robotsTxt +
      results.sitemap.score * weights.sitemap +
      results.ssl.score * weights.ssl +
      results.mobileOptimization.score * weights.mobileOptimization +
      results.pageSpeed.score * weights.pageSpeed +
      results.structuredData.score * weights.structuredData +
      results.indexability.score * weights.indexability +
      results.internalLinking.score * weights.internalLinking
    );

    return Math.round(totalScore);
  }
}
