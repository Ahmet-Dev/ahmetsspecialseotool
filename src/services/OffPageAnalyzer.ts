// import axios from 'axios'; // CORS nedeniyle mock data kullanıldığından geçici olarak disable
import type { OffPageSEO } from '../types/seo';

/**
 * Sayfa Dışı SEO Analiz Sınıfı
 * Backlink, domain authority ve sosyal sinyaller analizi
 */
export class OffPageAnalyzer {
  constructor() {}

  /**
   * Kapsamlı sayfa dışı SEO analizi
   */
  async analyzeOffPageSEO(url: string): Promise<OffPageSEO> {
    try {
      const domain = new URL(url).hostname;
      
      const [backlinks, domainAuthority, pageAuthority, socialSignals, mentions] = await Promise.all([
        this.analyzeBacklinks(domain),
        this.analyzeDomainAuthority(domain),
        this.analyzePageAuthority(url),
        this.analyzeSocialSignals(domain),
        this.analyzeMentions(domain)
      ]);

      return {
        backlinks,
        domainAuthority,
        pageAuthority,
        socialSignals,
        mentions
      };
    } catch (error) {
      console.error('Sayfa dışı SEO analizi hatası:', error);
      return this.getDefaultOffPageSEO();
    }
  }

  /**
   * Backlink analizi
   */
  private async analyzeBacklinks(domain: string): Promise<OffPageSEO['backlinks']> {
    try {
      // Google arama operatörleri ile backlink tespiti
      const backlinkQueries = [
        `"${domain}" -site:${domain}`,
        `link:${domain}`,
        `"${domain}" inurl:blog`,
        `"${domain}" inurl:article`
      ];

      const backlinkSources: string[] = [];
      let totalBacklinks = 0;

      for (const query of backlinkQueries) {
        try {
          const results = await this.searchGoogle(query);
          if (results.length > 0) {
            backlinkSources.push(...results.slice(0, 5)); // İlk 5 sonucu al
            totalBacklinks += results.length;
          }
        } catch (error) {
          console.warn(`Backlink sorgusu hatası (${query}):`, error);
        }
      }

      // Backlink kalitesi analizi ve gerçekçi puanlama
      const qualityScore = this.calculateBacklinkQuality(backlinkSources);
      
      // Gerçekçi backlink skorlaması (0-10 arası)
      let score = 0;
      if (totalBacklinks >= 500) score = 10;
      else if (totalBacklinks >= 100) score = 9;
      else if (totalBacklinks >= 50) score = 8;
      else if (totalBacklinks >= 25) score = 7;
      else if (totalBacklinks >= 10) score = 6;
      else if (totalBacklinks >= 5) score = 5;
      else if (totalBacklinks >= 3) score = 4;
      else if (totalBacklinks >= 2) score = 3;
      else if (totalBacklinks >= 1) score = 2;
      
      // Kalite bonusu (maksimum +2 puan)
      score = Math.min(score + Math.floor(qualityScore / 5), 10);

      return {
        count: totalBacklinks,
        score,
        sources: [...new Set(backlinkSources)] // Duplikatları kaldır
      };
    } catch (error) {
      console.error('Backlink analizi hatası:', error);
      return {
        count: 0,
        score: 0,
        sources: []
      };
    }
  }

  /**
   * Domain authority analizi (Google operatörleri ile)
   */
  private async analyzeDomainAuthority(domain: string): Promise<OffPageSEO['domainAuthority']> {
    try {
      let score = 0;
      let level = 'Düşük';

      // Google operatörleri ile domain authority hesapla
      const googleOperators = new (await import('./GoogleOperators')).GoogleOperators();
      
      // 1. Site indeksleme kontrolü (0-25 puan) - Daha sıkı kriterler
      const indexingResult = await googleOperators.checkSiteIndexing(domain);
      const indexedPages = indexingResult.resultCount || 0;
      if (indexedPages > 10000) score += 25;     // 10K+ sayfa - büyük site
      else if (indexedPages > 5000) score += 20; // 5K+ sayfa - orta-büyük site  
      else if (indexedPages > 1000) score += 15; // 1K+ sayfa - gelişmiş site
      else if (indexedPages > 500) score += 10;  // 500+ sayfa - orta site
      else if (indexedPages > 100) score += 5;   // 100+ sayfa - küçük site
      else if (indexedPages > 10) score += 2;    // 10+ sayfa - minimal site

      // 2. Subdomain analizi (0-15 puan)
      const subdomainResult = await googleOperators.checkSubdomainIndexing(domain);
      const subdomains = subdomainResult.resultCount || 0;
      if (subdomains > 10) score += 15;
      else if (subdomains > 5) score += 10;
      else if (subdomains > 2) score += 7;
      else if (subdomains > 0) score += 5;

      // 3. Mention analizi (0-20 puan)
      const mentionResult = await googleOperators.checkMentions(domain);
      const mentions = mentionResult.resultCount || 0;
      if (mentions > 100) score += 20;
      else if (mentions > 50) score += 15;
      else if (mentions > 20) score += 10;
      else if (mentions > 5) score += 5;

      // 4. Cache tarih kontrolü (0-10 puan)
      const cacheResult = await googleOperators.checkCacheDate(domain);
      if (cacheResult.score > 8) score += 10;
      else if (cacheResult.score > 6) score += 7;
      else if (cacheResult.score > 4) score += 5;
      else if (cacheResult.score > 2) score += 2;

      // 5. SSL ve güvenlik kontrolü (0-10 puan)
      const httpsResult = await googleOperators.checkHttpIndexing(domain);
      if (!httpsResult.resultCount || httpsResult.resultCount === 0) {
        score += 10; // HTTP sayfası bulunamadı = iyi SSL
      } else if (httpsResult.resultCount < 5) {
        score += 7;
      } else if (httpsResult.resultCount < 20) {
        score += 5;
      }

      // 6. Site bilgi kontrolü (0-20 puan)
      const siteInfoResult = await googleOperators.getSiteInfo(domain);
      if (siteInfoResult.score > 8) {
        score += 20;
      } else if (siteInfoResult.score > 5) {
        score += 15;
      } else if (siteInfoResult.score > 0) {
        score += 10;
      }

      // 7. Domain yaşı kontrolü (0-15 puan)
      const domainAge = await this.getDomainAge();
      if (domainAge >= 10) score += 15;
      else if (domainAge >= 5) score += 10;
      else if (domainAge >= 2) score += 5;
      else if (domainAge >= 1) score += 2;

      // 8. SSL sertifikası kontrolü (0-10 puan)
      const hasSSL = await this.checkSSL(`https://${domain}`);
      if (hasSSL) score += 10;

      // 9. Subdomain çeşitliliği kontrolü (0-10 puan)
      const subdomainCount = await this.getSubdomainCount(domain);
      if (subdomainCount >= 10) score += 10;
      else if (subdomainCount >= 5) score += 7;
      else if (subdomainCount >= 2) score += 5;
      else if (subdomainCount >= 1) score += 2;

      // Toplam skor normalize et (0-100)
      score = Math.min(score, 100);

      // Level belirleme
      if (score >= 80) level = 'Çok Yüksek';
      else if (score >= 60) level = 'Yüksek';
      else if (score >= 40) level = 'Orta';
      else if (score >= 20) level = 'Düşük';
      else level = 'Çok Düşük';

      return {
        score: Math.round(score),
        level
      };
    } catch (error) {
      console.error('Domain authority analizi hatası:', error);
      return {
        score: 0,
        level: 'Bilinmiyor'
      };
    }
  }

  /**
   * Page authority analizi (Google operatörleri ile)
   */
  private async analyzePageAuthority(url: string): Promise<OffPageSEO['pageAuthority']> {
    try {
      let score = 0;
      let level = 'Düşük';
      
      const domain = new URL(url).hostname;
      const googleOperators = new (await import('./GoogleOperators')).GoogleOperators();
      
      // 1. Sayfa indeksleme kontrolü (0-20 puan)
      const pageIndexResult = await googleOperators.checkSiteIndexing(url);
      if (pageIndexResult.resultCount > 0) {
        score += 20; // Sayfa indexlendi
      }

      // 2. Anahtar kelime optimizasyon kontrolü (0-25 puan)  
      const extractKeywords = (url: string) => {
        const path = new URL(url).pathname;
        return path.split('/').filter(segment => segment.length > 2);
      };
      
      const keywords = extractKeywords(url);
      let keywordScore = 0;
      for (const keyword of keywords.slice(0, 3)) { // İlk 3 keyword
        const titleOptResult = await googleOperators.checkTitleOptimization(keyword, domain);
        const urlOptResult = await googleOperators.checkUrlOptimization(keyword, domain);
        const contentOptResult = await googleOperators.checkContentOptimization(keyword, domain);
        
        keywordScore += (titleOptResult.score + urlOptResult.score + contentOptResult.score) / 3;
      }
      score += Math.min(keywordScore / keywords.length * 25, 25);

      // 3. İçerik kalitesi analizi (0-20 puan)
      const contentDensityResult = await googleOperators.checkContentDensity(keywords[0] || domain);
      score += Math.min(contentDensityResult.score * 2, 20);

      // 4. Duplicate content kontrolü (0-15 puan)
      const duplicateResult = await googleOperators.checkContentDuplication(url.substring(0, 100), domain);
      if (duplicateResult.resultCount === 0) {
        score += 15; // Duplicate content yok
      } else if (duplicateResult.resultCount < 3) {
        score += 10;
      } else if (duplicateResult.resultCount < 10) {
        score += 5;
      }

      // 5. URL yapısı analizi (0-10 puan)
      const urlParts = new URL(url).pathname.split('/').filter(part => part);
      if (urlParts.length <= 3) score += 10; // Kısa URL yapısı
      else if (urlParts.length <= 5) score += 7;
      else if (urlParts.length <= 7) score += 5;

      // 6. HTTPS kontrolü (0-10 puan)
      if (url.startsWith('https://')) {
        score += 10;
      }

      // 7. Domain SSL kalitesi kontrolü (0-5 puan)
      const hasQualitySSL = await this.checkSSL(url);
      if (hasQualitySSL) score += 5;

      // 8. Subdomain kullanımı kontrolü (0-5 puan)
      const pageSubdomainCount = await this.getSubdomainCount(domain);
      if (pageSubdomainCount > 0) score += 5; // Subdomain kullanımı sayfa otoritesine katkı

      // Toplam skor normalize et (0-100)
      score = Math.min(score, 100);

      // Level belirleme
      if (score >= 80) level = 'Çok Yüksek';
      else if (score >= 60) level = 'Yüksek';
      else if (score >= 40) level = 'Orta';
      else if (score >= 20) level = 'Düşük';
      else level = 'Çok Düşük';

      return {
        score: Math.round(score),
        level
      };
    } catch (error) {
      console.error('Page authority analizi hatası:', error);
      return {
        score: 0,
        level: 'Bilinmiyor'
      };
    }
  }

  /**
   * Sosyal sinyaller analizi
   */
  private async analyzeSocialSignals(domain: string): Promise<OffPageSEO['socialSignals']> {
    try {
      const socialQueries = [
        `"${domain}" site:facebook.com`,
        `"${domain}" site:twitter.com`,
        `"${domain}" site:linkedin.com`,
        `"${domain}" site:instagram.com`
      ];

      let facebook = 0;
      let twitter = 0;
      let linkedin = 0;

      for (const query of socialQueries) {
        try {
          const results = await this.searchGoogle(query);
          const count = results.length;
          
          if (query.includes('facebook.com')) facebook = count;
          else if (query.includes('twitter.com')) twitter = count;
          else if (query.includes('linkedin.com')) linkedin = count;
        } catch (error) {
          console.warn(`Sosyal sinyal sorgusu hatası (${query}):`, error);
        }
      }

      const totalSignals = facebook + twitter + linkedin;
      const score = Math.min(Math.round(totalSignals * 0.2), 10);

      return {
        facebook,
        twitter,
        linkedin,
        score
      };
    } catch (error) {
      console.error('Sosyal sinyaller analizi hatası:', error);
      return {
        facebook: 0,
        twitter: 0,
        linkedin: 0,
        score: 0
      };
    }
  }

  /**
   * Mention analizi
   */
  private async analyzeMentions(domain: string): Promise<OffPageSEO['mentions']> {
    try {
      const mentionQueries = [
        `"${domain}"`,
        `"${domain}" -site:${domain}`,
        `"${domain}" inurl:blog`,
        `"${domain}" inurl:news`
      ];

      const mentionSources: string[] = [];
      let totalMentions = 0;

      for (const query of mentionQueries) {
        try {
          const results = await this.searchGoogle(query);
          if (results.length > 0) {
            mentionSources.push(...results.slice(0, 3)); // İlk 3 sonucu al
            totalMentions += results.length;
          }
        } catch (error) {
          console.warn(`Mention sorgusu hatası (${query}):`, error);
        }
      }

      const score = Math.min(Math.round(totalMentions * 0.1), 10);

      return {
        count: totalMentions,
        score,
        sources: [...new Set(mentionSources)] // Duplikatları kaldır
      };
    } catch (error) {
      console.error('Mention analizi hatası:', error);
      return {
        count: 0,
        score: 0,
        sources: []
      };
    }
  }

  /**
   * Google arama yapma
   */
  private async searchGoogle(query: string): Promise<string[]> {
    try {
      // CORS hatası nedeniyle mock data döndür
      console.log(`Google arama simülasyonu: ${query}`);
      
      // Mock backlink sources
      const mockSources = [
        'https://example1.com/blog/seo-tips',
        'https://example2.edu/research/seo-study',
        'https://example3.org/digital-marketing',
        'https://example4.com/resources/seo-guide',
        'https://example5.net/webmaster-tools'
      ];
      
      return mockSources.slice(0, Math.floor(Math.random() * 5) + 1);
      
    } catch (error) {
      console.warn('Google arama hatası:', error);
      return [];
    }
  }

  /**
   * Backlink kalitesi hesaplama
   */
  private calculateBacklinkQuality(sources: string[]): number {
    let qualityScore = 0;

    sources.forEach(source => {
      const url = new URL(source);
      const domain = url.hostname.toLowerCase();

      // Yüksek kaliteli domainler
      if (domain.includes('.edu') || domain.includes('.gov')) {
        qualityScore += 3;
      } else if (domain.includes('.org')) {
        qualityScore += 2;
      } else if (domain.includes('wikipedia') || domain.includes('medium') || domain.includes('reddit')) {
        qualityScore += 1;
      }

      // Domain uzunluğu (kısa domainler genelde daha güvenilir)
      if (domain.length < 10) {
        qualityScore += 1;
      }
    });

    return Math.min(qualityScore, 5);
  }

  /**
   * Domain yaşı kontrolü
   */
  private async getDomainAge(): Promise<number> {
    try {
      // WHOIS API kullanımı (gerçek implementasyon için harici servis gerekli)
      // Şimdilik simüle edilmiş değer döndürüyoruz
      return Math.floor(Math.random() * 10) + 1; // 1-10 yıl arası
    } catch {
      return 0;
    }
  }

  /**
   * SSL sertifikası kontrolü
   */
  private async checkSSL(domain: string): Promise<boolean> {
    try {
      console.warn('OffPageAnalyzer: CORS nedeniyle mock SSL data kullanılıyor:', domain);
      // Mock: HTTPS ile başlayan domain'ler için true, diğerleri için false
      return domain.startsWith('https://') || Math.random() > 0.3; // %70 şansla SSL var
    } catch {
      return false;
    }
  }

  /**
   * Subdomain sayısı kontrolü
   */
  private async getSubdomainCount(domain: string): Promise<number> {
    try {
      const subdomainQueries = [
        `site:*.${domain}`,
        `site:www.${domain}`,
        `site:blog.${domain}`,
        `site:shop.${domain}`,
        `site:app.${domain}`
      ];

      let subdomainCount = 0;
      for (const query of subdomainQueries) {
        const results = await this.searchGoogle(query);
        if (results.length > 0) {
          subdomainCount += results.length;
        }
      }

      return subdomainCount;
    } catch {
      return 0;
    }
  }

  /**
   * Varsayılan sayfa dışı SEO değerleri
   */
  private getDefaultOffPageSEO(): OffPageSEO {
    return {
      backlinks: {
        count: 0,
        score: 0,
        sources: []
      },
      domainAuthority: {
        score: 0,
        level: 'Bilinmiyor'
      },
      pageAuthority: {
        score: 0,
        level: 'Bilinmiyor'
      },
      socialSignals: {
        facebook: 0,
        twitter: 0,
        linkedin: 0,
        score: 0
      },
      mentions: {
        count: 0,
        score: 0,
        sources: []
      }
    };
  }
}
