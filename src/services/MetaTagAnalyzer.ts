import * as cheerio from 'cheerio';

export interface MetaAnalysisResult {
  title: {
    content: string;
    length: number;
    score: number;
    issues: string[];
    recommendations: string[];
  };
  metaDescription: {
    content: string;
    length: number;
    score: number;
    issues: string[];
    recommendations: string[];
  };
  canonical: {
    href: string | null;
    isCorrect: boolean;
    score: number;
    issues: string[];
  };
  robotsMeta: {
    content: string | null;
    isIndexable: boolean;
    isFollowable: boolean;
    score: number;
    issues: string[];
  };
  viewport: {
    content: string | null;
    isMobileFriendly: boolean;
    score: number;
    issues: string[];
  };
  hreflang: {
    tags: Array<{ lang: string; href: string }>;
    count: number;
    score: number;
    issues: string[];
  };
  openGraph: {
    title: string | null;
    description: string | null;
    type: string | null;
    url: string | null;
    image: string | null;
    siteName: string | null;
    score: number;
    issues: string[];
  };
  twitterCard: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
    score: number;
    issues: string[];
  };
  charset: {
    encoding: string | null;
    isUTF8: boolean;
    score: number;
    issues: string[];
  };
  overallScore: number;
}

/**
 * Gelişmiş Meta Tag Analiz Sınıfı
 * Tüm SEO meta etiketlerini detaylı analiz eder
 */
export class MetaTagAnalyzer {
  constructor() {}

  /**
   * Kapsamlı meta tag analizi
   */
  analyze(html: string, url: string): MetaAnalysisResult {
    const $ = cheerio.load(html);
    
    const title = this.analyzeTitle($);
    const metaDescription = this.analyzeMetaDescription($);
    const canonical = this.analyzeCanonical($, url);
    const robotsMeta = this.analyzeRobotsMeta($);
    const viewport = this.analyzeViewport($);
    const hreflang = this.analyzeHreflang($);
    const openGraph = this.analyzeOpenGraph($);
    const twitterCard = this.analyzeTwitterCard($);
    const charset = this.analyzeCharset($);

    const overallScore = this.calculateOverallScore({
      title,
      metaDescription,
      canonical,
      robotsMeta,
      viewport,
      hreflang,
      openGraph,
      twitterCard,
      charset
    });

    return {
      title,
      metaDescription,
      canonical,
      robotsMeta,
      viewport,
      hreflang,
      openGraph,
      twitterCard,
      charset,
      overallScore
    };
  }

  /**
   * Title tag analizi
   */
  private analyzeTitle($: cheerio.Root): MetaAnalysisResult['title'] {
    const titleElement = $('title').first();
    const content = titleElement.text().trim();
    const length = content.length;
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Title eksiklik kontrolü
    if (!content) {
      issues.push('Title tag eksik');
      score -= 50;
      recommendations.push('Title tag ekleyin');
    } else {
      // Uzunluk kontrolü
      if (length < 30) {
        issues.push('Title çok kısa (30 karakterden az)');
        score -= 20;
        recommendations.push('Title uzunluğunu 30-60 karakter arasında tutun');
      } else if (length > 60) {
        issues.push('Title çok uzun (60 karakterden fazla)');
        score -= 15;
        recommendations.push('Title uzunluğunu 60 karakterin altında tutun');
      }

      // Çoklu title kontrolü
      if ($('title').length > 1) {
        issues.push('Birden fazla title tag bulundu');
        score -= 25;
        recommendations.push('Sadece bir title tag kullanın');
      }

      // İçerik kalitesi kontrolü
      if (content.toLowerCase().includes('untitled') || content.toLowerCase().includes('başlıksız')) {
        issues.push('Varsayılan title metni kullanılıyor');
        score -= 30;
        recommendations.push('Açıklayıcı ve benzersiz title yazın');
      }

      // Tekrar eden kelimeler
      const words = content.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      if (words.length - uniqueWords.size > 2) {
        issues.push('Title\'da çok fazla tekrar eden kelime');
        score -= 10;
        recommendations.push('Tekrar eden kelimeleri azaltın');
      }

      // Özel karakterler
      if (content.includes('|') || content.includes('-') || content.includes('::')) {
        // Pozitif durum - brand ayırıcı kullanımı
      } else if (length > 30) {
        recommendations.push('Brand ismini ayırmak için | veya - kullanabilirsiniz');
      }
    }

    return {
      content,
      length,
      score: Math.max(score, 0),
      issues,
      recommendations
    };
  }

  /**
   * Meta description analizi
   */
  private analyzeMetaDescription($: cheerio.Root): MetaAnalysisResult['metaDescription'] {
    const metaElement = $('meta[name="description"]').first();
    const content = metaElement.attr('content')?.trim() || '';
    const length = content.length;
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    if (!content) {
      issues.push('Meta description eksik');
      score -= 40;
      recommendations.push('Meta description ekleyin');
    } else {
      // Uzunluk kontrolü
      if (length < 120) {
        issues.push('Meta description çok kısa (120 karakterden az)');
        score -= 15;
        recommendations.push('Meta description uzunluğunu 120-160 karakter arasında tutun');
      } else if (length > 160) {
        issues.push('Meta description çok uzun (160 karakterden fazla)');
        score -= 20;
        recommendations.push('Meta description uzunluğunu 160 karakterin altında tutun');
      }

      // Çoklu meta description kontrolü
      if ($('meta[name="description"]').length > 1) {
        issues.push('Birden fazla meta description bulundu');
        score -= 25;
        recommendations.push('Sadece bir meta description kullanın');
      }

      // İçerik kalitesi
      if (content.toLowerCase().includes('lorem ipsum') || content.toLowerCase().includes('test')) {
        issues.push('Test metni kullanılıyor');
        score -= 30;
        recommendations.push('Gerçek ve açıklayıcı metin yazın');
      }

      // Call-to-action kontrolü
      const cta_patterns = /\b(şimdi|hemen|tıklayın|keşfedin|daha fazla|detay|incele|satın al|ücretsiz)\b/i;
      if (!cta_patterns.test(content)) {
        recommendations.push('Call-to-action kelimeler ekleyebilirsiniz (şimdi, keşfedin, vb.)');
      }
    }

    return {
      content,
      length,
      score: Math.max(score, 0),
      issues,
      recommendations
    };
  }

  /**
   * Canonical URL analizi
   */
  private analyzeCanonical($: cheerio.Root, currentUrl: string): MetaAnalysisResult['canonical'] {
    const canonicalElement = $('link[rel="canonical"]').first();
    const href = canonicalElement.attr('href') || null;
    
    const issues: string[] = [];
    let score = 100;
    let isCorrect = true;

    if (!href) {
      issues.push('Canonical URL eksik');
      score -= 30;
      isCorrect = false;
    } else {
      try {
        const currentUrlObj = new URL(currentUrl);
        const canonicalUrlObj = new URL(href, currentUrl);
        
        // Kendine referans kontrolü
        if (canonicalUrlObj.href !== currentUrlObj.href) {
          // Farklı URL'ye canonical - bu normal olabilir ama kontrol edilmeli
          issues.push('Canonical URL mevcut sayfadan farklı');
          score -= 10;
        }

        // HTTPS kontrolü
        if (canonicalUrlObj.protocol !== 'https:') {
          issues.push('Canonical URL HTTPS kullanmıyor');
          score -= 20;
          isCorrect = false;
        }

        // Çoklu canonical kontrolü
        if ($('link[rel="canonical"]').length > 1) {
          issues.push('Birden fazla canonical URL bulundu');
          score -= 30;
          isCorrect = false;
        }

      } catch (error) {
        issues.push('Geçersiz canonical URL formatı');
        score -= 40;
        isCorrect = false;
      }
    }

    return {
      href,
      isCorrect,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Robots meta tag analizi
   */
  private analyzeRobotsMeta($: cheerio.Root): MetaAnalysisResult['robotsMeta'] {
    const robotsElement = $('meta[name="robots"]').first();
    const content = robotsElement.attr('content') || null;
    
    const issues: string[] = [];
    let score = 100;
    let isIndexable = true;
    let isFollowable = true;

    if (content) {
      const contentLower = content.toLowerCase();
      
      // Indexability kontrolü
      if (contentLower.includes('noindex')) {
        isIndexable = false;
        // Bu kötü bir şey değil, kasıtlı olabilir
      }

      // Followability kontrolü
      if (contentLower.includes('nofollow')) {
        isFollowable = false;
        // Bu da kasıtlı olabilir
      }

      // Problematik kombinasyonlar
      if (contentLower.includes('noindex') && contentLower.includes('follow')) {
        issues.push('noindex,follow kombinasyonu - link değeri kaybolabilir');
        score -= 10;
      }

      // Gereksiz directiveler
      if (contentLower.includes('all')) {
        // 'all' gereksizdir çünkü varsayılan davranıştır
        issues.push('Gereksiz "all" directive kullanımı');
        score -= 5;
      }

      // Çelişkili directiveler
      if ((contentLower.includes('index') && contentLower.includes('noindex')) ||
          (contentLower.includes('follow') && contentLower.includes('nofollow'))) {
        issues.push('Çelişkili robots directives');
        score -= 30;
      }

      // Çoklu robots meta kontrolü
      if ($('meta[name="robots"]').length > 1) {
        issues.push('Birden fazla robots meta tag bulundu');
        score -= 20;
      }

    } else {
      // Robots meta yok - bu normal, varsayılan index,follow geçerli
    }

    return {
      content,
      isIndexable,
      isFollowable,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Viewport meta tag analizi
   */
  private analyzeViewport($: cheerio.Root): MetaAnalysisResult['viewport'] {
    const viewportElement = $('meta[name="viewport"]').first();
    const content = viewportElement.attr('content') || null;
    
    const issues: string[] = [];
    let score = 100;
    let isMobileFriendly = false;

    if (!content) {
      issues.push('Viewport meta tag eksik');
      score -= 50;
    } else {
      const contentLower = content.toLowerCase();
      
      // Mobile-friendly kontrolü
      if (contentLower.includes('width=device-width')) {
        isMobileFriendly = true;
      } else {
        issues.push('width=device-width eksik');
        score -= 30;
        isMobileFriendly = false;
      }

      // Initial scale kontrolü
      if (contentLower.includes('initial-scale=1')) {
        // İyi durum
      } else if (contentLower.includes('initial-scale')) {
        issues.push('initial-scale=1 önerilir');
        score -= 10;
      }

      // Zararlı ayarlar
      if (contentLower.includes('user-scalable=no') || contentLower.includes('maximum-scale=1')) {
        issues.push('User scaling engellenmiş - erişilebilirlik sorunu');
        score -= 20;
      }

      // Çoklu viewport kontrolü
      if ($('meta[name="viewport"]').length > 1) {
        issues.push('Birden fazla viewport meta tag bulundu');
        score -= 25;
      }
    }

    return {
      content,
      isMobileFriendly,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Hreflang analizi
   */
  private analyzeHreflang($: cheerio.Root): MetaAnalysisResult['hreflang'] {
    const hreflangElements = $('link[rel="alternate"][hreflang]');
    const tags: Array<{ lang: string; href: string }> = [];
    const issues: string[] = [];
    let score = 100;

    hreflangElements.each((_, element) => {
      const lang = $(element).attr('hreflang');
      const href = $(element).attr('href');
      
      if (lang && href) {
        tags.push({ lang, href });
      }
    });

    const count = tags.length;

    if (count > 0) {
      // x-default kontrolü
      const hasXDefault = tags.some(tag => tag.lang === 'x-default');
      if (!hasXDefault && count > 1) {
        issues.push('x-default hreflang eksik');
        score -= 15;
      }

      // Kendine referans kontrolü
      const currentLangTags = tags.filter(tag => tag.lang === 'tr' || tag.lang === 'tr-TR');
      if (currentLangTags.length === 0 && count > 1) {
        issues.push('Mevcut sayfa için hreflang eksik');
        score -= 20;
      }

      // Geçersiz dil kodları
      tags.forEach(tag => {
        if (!this.isValidLanguageCode(tag.lang)) {
          issues.push(`Geçersiz dil kodu: ${tag.lang}`);
          score -= 10;
        }
      });

      // Duplikat dil kodları
      const langCodes = tags.map(tag => tag.lang);
      const uniqueLangCodes = new Set(langCodes);
      if (langCodes.length !== uniqueLangCodes.size) {
        issues.push('Duplikat hreflang dil kodları');
        score -= 25;
      }
    }

    return {
      tags,
      count,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Open Graph meta tags analizi
   */
  private analyzeOpenGraph($: cheerio.Root): MetaAnalysisResult['openGraph'] {
    const title = $('meta[property="og:title"]').attr('content') || null;
    const description = $('meta[property="og:description"]').attr('content') || null;
    const type = $('meta[property="og:type"]').attr('content') || null;
    const url = $('meta[property="og:url"]').attr('content') || null;
    const image = $('meta[property="og:image"]').attr('content') || null;
    const siteName = $('meta[property="og:site_name"]').attr('content') || null;
    
    const issues: string[] = [];
    let score = 100;

    // Temel OG tags kontrolü
    if (!title) {
      issues.push('og:title eksik');
      score -= 20;
    }

    if (!description) {
      issues.push('og:description eksik');
      score -= 20;
    }

    if (!type) {
      issues.push('og:type eksik');
      score -= 15;
    } else if (!['website', 'article', 'product', 'profile'].includes(type)) {
      issues.push(`Desteklenmeyen og:type: ${type}`);
      score -= 10;
    }

    if (!url) {
      issues.push('og:url eksik');
      score -= 15;
    }

    if (!image) {
      issues.push('og:image eksik - sosyal medya paylaşımları için önemli');
      score -= 20;
    } else {
      // Image URL kontrolü
      try {
        new URL(image);
      } catch {
        issues.push('Geçersiz og:image URL');
        score -= 15;
      }
    }

    if (!siteName) {
      issues.push('og:site_name eksik');
      score -= 10;
    }

    return {
      title,
      description,
      type,
      url,
      image,
      siteName,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Twitter Card analizi
   */
  private analyzeTwitterCard($: cheerio.Root): MetaAnalysisResult['twitterCard'] {
    const card = $('meta[name="twitter:card"]').attr('content') || null;
    const title = $('meta[name="twitter:title"]').attr('content') || null;
    const description = $('meta[name="twitter:description"]').attr('content') || null;
    const image = $('meta[name="twitter:image"]').attr('content') || null;
    
    const issues: string[] = [];
    let score = 100;

    if (!card) {
      issues.push('twitter:card eksik');
      score -= 25;
    } else if (!['summary', 'summary_large_image', 'app', 'player'].includes(card)) {
      issues.push(`Desteklenmeyen twitter:card type: ${card}`);
      score -= 15;
    }

    if (!title) {
      issues.push('twitter:title eksik');
      score -= 20;
    }

    if (!description) {
      issues.push('twitter:description eksik');
      score -= 20;
    }

    if (card === 'summary_large_image' && !image) {
      issues.push('summary_large_image için twitter:image gerekli');
      score -= 25;
    } else if (!image) {
      issues.push('twitter:image eksik');
      score -= 15;
    }

    return {
      card,
      title,
      description,
      image,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Charset analizi
   */
  private analyzeCharset($: cheerio.Root): MetaAnalysisResult['charset'] {
    const charsetElement = $('meta[charset]').first();
    const httpEquivElement = $('meta[http-equiv="Content-Type"]').first();
    
    let encoding: string | null = null;
    const issues: string[] = [];
    let score = 100;

    if (charsetElement.length > 0) {
      encoding = charsetElement.attr('charset') || null;
    } else if (httpEquivElement.length > 0) {
      const content = httpEquivElement.attr('content') || '';
      const match = content.match(/charset=([^;]+)/i);
      encoding = match ? match[1].trim() : null;
    }

    if (!encoding) {
      issues.push('Charset tanımı eksik');
      score -= 40;
    } else {
      const encodingLower = encoding.toLowerCase();
      if (encodingLower !== 'utf-8' && encodingLower !== 'utf8') {
        issues.push(`UTF-8 yerine ${encoding} kullanılıyor`);
        score -= 20;
      }
    }

    // Çoklu charset kontrolü
    if ($('meta[charset]').length > 1) {
      issues.push('Birden fazla charset tanımı');
      score -= 25;
    }

    return {
      encoding,
      isUTF8: encoding?.toLowerCase() === 'utf-8' || encoding?.toLowerCase() === 'utf8' || false,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Genel meta tag skoru hesaplama
   */
  private calculateOverallScore(results: Omit<MetaAnalysisResult, 'overallScore'>): number {
    const weights = {
      title: 0.25,          // En önemli
      metaDescription: 0.20, // İkinci önemli
      canonical: 0.15,
      viewport: 0.15,
      robotsMeta: 0.10,
      openGraph: 0.08,
      twitterCard: 0.05,
      charset: 0.02
      // hreflang ağırlıklandırılmadı çünkü tüm siteler için gerekli değil
    };

    let totalScore = 0;
    totalScore += results.title.score * weights.title;
    totalScore += results.metaDescription.score * weights.metaDescription;
    totalScore += results.canonical.score * weights.canonical;
    totalScore += results.viewport.score * weights.viewport;
    totalScore += results.robotsMeta.score * weights.robotsMeta;
    totalScore += results.openGraph.score * weights.openGraph;
    totalScore += results.twitterCard.score * weights.twitterCard;
    totalScore += results.charset.score * weights.charset;

    return Math.round(totalScore);
  }

  /**
   * Geçerli dil kodu kontrolü
   */
  private isValidLanguageCode(langCode: string): boolean {
    if (langCode === 'x-default') return true;
    
    // ISO 639-1 (2 karakter) veya ISO 639-1 + ülke kodu kontrolü
    const langPattern = /^[a-z]{2}(-[A-Z]{2})?$/;
    return langPattern.test(langCode);
  }
}
