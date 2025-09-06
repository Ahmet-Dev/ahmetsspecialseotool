// import axios from 'axios'; // CORS nedeniyle mock data kullanıldığından geçici olarak disable
import * as cheerio from 'cheerio';
import type { RobotsTxtTest, SitemapTest } from '../types/seo';

/**
 * Robots.txt ve Sitemap.xml Analiz Sınıfı
 * SEO teknik analizi için gerekli dosyaları kontrol eder
 */
interface RobotsRule {
  type: string;
  value: string;
  userAgent?: string;
  path?: string;
  delay?: number;
  [key: string]: unknown;
}

export class RobotsSitemapAnalyzer {
  constructor() {}

  /**
   * Robots.txt analizi
   */
  async analyzeRobotsTxt(url: string): Promise<RobotsTxtTest> {
    try {
      console.warn('RobotsSitemapAnalyzer: CORS nedeniyle mock data kullanılıyor:', url);
      
      // Mock robots.txt content
      const mockRobotsContent = `
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Crawl-delay: 1

Sitemap: https://example.com/sitemap.xml
      `.trim();

      // Robots.txt kurallarını analiz et
      const analysis = this.parseRobotsTxt(mockRobotsContent);
      
      // Sitemap URL'lerini bul
      const sitemapUrls = this.extractSitemapUrls(mockRobotsContent);
      
      // Puan hesapla
      const score = this.calculateRobotsScore(analysis, sitemapUrls.length);

      return {
        exists: true,
        score,
        content: mockRobotsContent,
        rules: analysis.rules,
        sitemaps: sitemapUrls,
        issues: analysis.issues
      };
    } catch (error) {
      console.error('Robots.txt analizi hatası:', error);
      return {
        exists: false,
        score: 0,
        content: '',
        rules: [],
        sitemaps: [],
        issues: ['Robots.txt dosyası bulunamadı veya erişilemiyor']
      };
    }
  }

  /**
   * Sitemap.xml analizi
   */
  async analyzeSitemap(url: string): Promise<SitemapTest> {
    try {
      console.warn('RobotsSitemapAnalyzer: CORS nedeniyle mock sitemap data kullanılıyor:', url);
      
      // Mock sitemap XML content
      const mockSitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/services</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

      const $ = cheerio.load(mockSitemapContent, { xmlMode: true });

      // Sitemap türünü belirle
      const isIndexSitemap = $('sitemapindex').length > 0;
      const isUrlSitemap = $('urlset').length > 0;

      if (!isIndexSitemap && !isUrlSitemap) {
        return {
          exists: false,
          score: 0,
          type: 'unknown',
          urlCount: 0,
          lastModified: null,
          issues: ['Geçerli sitemap formatı bulunamadı']
        };
      }

      // URL sayısını hesapla
      const urlCount = isIndexSitemap 
        ? $('sitemap').length 
        : $('url').length;

      // Son değiştirilme tarihini bul
      const lastModified = this.extractLastModified($, isIndexSitemap);

      // Puan hesapla
      const score = this.calculateSitemapScore(urlCount, lastModified, isIndexSitemap);

      return {
        exists: true,
        score,
        type: isIndexSitemap ? 'index' : 'url',
        urlCount,
        lastModified,
        issues: []
      };
    } catch (error) {
      console.error('Sitemap analizi hatası:', error);
      return {
        exists: false,
        score: 0,
        type: 'unknown',
        urlCount: 0,
        lastModified: null,
        issues: ['Sitemap.xml dosyası bulunamadı veya erişilemiyor']
      };
    }
  }

  /**
   * Robots.txt içeriğini parse et
   */
  private parseRobotsTxt(content: string): { rules: RobotsRule[]; issues: string[] } {
    const rules: RobotsRule[] = [];
    const issues: string[] = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    let currentUserAgent = '';
    let hasDisallowAll = false;
    let hasAllowAll = false;

    for (const line of lines) {
      if (line.startsWith('#')) continue; // Yorum satırları

      const [directive, value] = line.split(':').map(s => s.trim());
      
      if (directive.toLowerCase() === 'user-agent') {
        currentUserAgent = value;
        rules.push({ type: 'user-agent', value, userAgent: value });
      } else if (directive.toLowerCase() === 'disallow') {
        rules.push({ 
          type: 'disallow', 
          value, 
          userAgent: currentUserAgent,
          path: value 
        });
        
        if (value === '/') {
          hasDisallowAll = true;
        }
      } else if (directive.toLowerCase() === 'allow') {
        rules.push({ 
          type: 'allow', 
          value, 
          userAgent: currentUserAgent,
          path: value 
        });
        
        if (value === '/') {
          hasAllowAll = true;
        }
      } else if (directive.toLowerCase() === 'crawl-delay') {
        rules.push({ 
          type: 'crawl-delay', 
          value, 
          userAgent: currentUserAgent,
          delay: parseInt(value) || 0 
        });
      }
    }

    // Sorunları tespit et
    if (hasDisallowAll && !hasAllowAll) {
      issues.push('Tüm sayfalar engellenmiş olabilir');
    }

    if (!rules.some(rule => rule.type === 'user-agent')) {
      issues.push('User-agent direktifi bulunamadı');
    }

    if (!rules.some(rule => rule.type === 'sitemap')) {
      issues.push('Sitemap direktifi bulunamadı');
    }

    return { rules, issues };
  }

  /**
   * Sitemap URL'lerini çıkar
   */
  private extractSitemapUrls(content: string): string[] {
    const sitemapUrls: string[] = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    for (const line of lines) {
      if (line.toLowerCase().startsWith('sitemap:')) {
        const url = line.split(':').slice(1).join(':').trim();
        if (url) {
          sitemapUrls.push(url);
        }
      }
    }

    return sitemapUrls;
  }

  /**
   * Son değiştirilme tarihini çıkar
   */
  private extractLastModified($: cheerio.Root, isIndexSitemap: boolean): Date | null {
    try {
      if (isIndexSitemap) {
        const lastmod = $('sitemap lastmod').first().text();
        return lastmod ? new Date(lastmod) : null;
      } else {
        const lastmod = $('url lastmod').first().text();
        return lastmod ? new Date(lastmod) : null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Robots.txt skoru hesapla
   */
  private calculateRobotsScore(analysis: { rules: RobotsRule[]; issues: string[] }, sitemapCount: number): number {
    let score = 0;

    // Temel varlık (20 puan)
    score += 20;

    // User-agent kuralları (20 puan)
    const userAgentRules = analysis.rules.filter(rule => rule.type === 'user-agent');
    if (userAgentRules.length > 0) {
      score += 20;
    }

    // Sitemap referansı (20 puan)
    if (sitemapCount > 0) {
      score += 20;
    }

    // Crawl-delay (10 puan)
    const crawlDelayRules = analysis.rules.filter(rule => rule.type === 'crawl-delay');
    if (crawlDelayRules.length > 0) {
      score += 10;
    }

    // Disallow kuralları (10 puan)
    const disallowRules = analysis.rules.filter(rule => rule.type === 'disallow');
    if (disallowRules.length > 0) {
      score += 10;
    }

    // Allow kuralları (10 puan)
    const allowRules = analysis.rules.filter(rule => rule.type === 'allow');
    if (allowRules.length > 0) {
      score += 10;
    }

    // Sorunlardan puan düş
    score -= analysis.issues.length * 5;

    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Sitemap skoru hesapla
   */
  private calculateSitemapScore(urlCount: number, lastModified: Date | null, isIndexSitemap: boolean): number {
    let score = 0;

    // Temel varlık (30 puan)
    score += 30;

    // URL sayısı (30 puan)
    if (urlCount > 1000) score += 30;
    else if (urlCount > 100) score += 20;
    else if (urlCount > 10) score += 10;

    // Son değiştirilme tarihi (20 puan)
    if (lastModified) {
      const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceModified < 7) score += 20;
      else if (daysSinceModified < 30) score += 15;
      else if (daysSinceModified < 90) score += 10;
    }

    // Sitemap türü (20 puan)
    if (isIndexSitemap) {
      score += 20; // Index sitemap daha iyi
    } else {
      score += 10; // URL sitemap
    }

    return Math.max(Math.min(score, 100), 0);
  }
}
