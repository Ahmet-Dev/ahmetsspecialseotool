import * as cheerio from 'cheerio';
import type { StructuredDataTest } from '../types/seo';

interface StructuredDataItem {
  '@type'?: string;
  '@context'?: string;
  [key: string]: unknown;
}

/**
 * Yapılandırılmış Veri Analiz Sınıfı
 * Schema.org ve JSON-LD analizi
 */
export class StructuredDataAnalyzer {
  constructor() {}

  /**
   * Kapsamlı yapılandırılmış veri analizi
   */
  async analyzeStructuredData(_url: string, htmlContent: string): Promise<StructuredDataTest> {
    try {
      const $ = cheerio.load(htmlContent);
      
      const jsonLdData = this.extractJSONLD($);
      const microdataData = this.extractMicrodata($);
      const rdfaData = this.extractRDFa($);
      
      const allStructuredData = [...jsonLdData, ...microdataData, ...rdfaData];
      
      const errors = this.validateStructuredData(allStructuredData);
      const warnings = this.checkStructuredDataWarnings(allStructuredData);
      
      const score = this.calculateStructuredDataScore(allStructuredData, errors, warnings);
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        structuredData: allStructuredData,
        score
      };
    } catch (error) {
      console.error('Yapılandırılmış veri analizi hatası:', error);
      return {
        valid: false,
        errors: ['Yapılandırılmış veri analizi başarısız'],
        warnings: [],
        structuredData: [],
        score: 0
      };
    }
  }

  /**
   * JSON-LD verilerini çıkar
   */
  private extractJSONLD($: cheerio.Root): StructuredDataItem[] {
    const jsonLdData: StructuredDataItem[] = [];
    
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const content = $(element).html();
        if (content) {
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            jsonLdData.push(...data);
          } else {
            jsonLdData.push(data);
          }
        }
      } catch (error) {
        console.warn('JSON-LD parse hatası:', error);
      }
    });
    
    return jsonLdData;
  }

  /**
   * Microdata verilerini çıkar
   */
  private extractMicrodata($: cheerio.Root): Record<string, unknown>[] {
    const microdata: Record<string, unknown>[] = [];
    
    $('[itemscope]').each((_, element) => {
      const item = this.extractMicrodataItem($, $(element));
      if (item) {
        microdata.push(item);
      }
    });
    
    return microdata;
  }

  /**
   * Tek bir microdata item'ını çıkar
   */
  private extractMicrodataItem($: cheerio.Root, element: cheerio.Cheerio): Record<string, unknown> | null {
    const itemType = element.attr('itemtype');
    if (!itemType) return null;
    
    const item: Record<string, unknown> = {
      '@type': itemType,
      '@context': 'http://schema.org'
    };
    
    // itemprop'ları çıkar
    element.find('[itemprop]').each((_: number, propElement: unknown) => {
      const propName = $(propElement).attr('itemprop');
      const propValue = $(propElement).text().trim() || $(propElement).attr('content') || $(propElement).attr('src');
      
      if (propName && propValue) {
        if (item[propName]) {
          if (Array.isArray(item[propName])) {
            item[propName].push(propValue);
          } else {
            item[propName] = [item[propName], propValue];
          }
        } else {
          item[propName] = propValue;
        }
      }
    });
    
    return Object.keys(item).length > 2 ? item : null; // Sadece @type ve @context varsa null döndür
  }

  /**
   * RDFa verilerini çıkar
   */
  private extractRDFa($: cheerio.Root): Record<string, unknown>[] {
    const rdfaData: Record<string, unknown>[] = [];
    
    $('[typeof]').each((_, element) => {
      const typeOf = $(element).attr('typeof');
      if (!typeOf) return;
      
      const item: Record<string, unknown> = {
        '@type': typeOf,
        '@context': 'http://schema.org'
      };
      
      // property'leri çıkar
      $(element).find('[property]').each((_, propElement) => {
        const property = $(propElement).attr('property');
        const value = $(propElement).text().trim() || $(propElement).attr('content');
        
        if (property && value) {
          item[property] = value;
        }
      });
      
      if (Object.keys(item).length > 2) {
        rdfaData.push(item);
      }
    });
    
    return rdfaData;
  }

  /**
   * Yapılandırılmış veri doğrulama
   */
  private validateStructuredData(data: Array<Record<string, unknown>>): string[] {
    const errors: string[] = [];
    
    data.forEach((item, index) => {
      // @type kontrolü
      if (!item['@type']) {
        errors.push(`Item ${index + 1}: @type eksik`);
      }
      
      // @context kontrolü
      if (!item['@context']) {
        errors.push(`Item ${index + 1}: @context eksik`);
      }
      
      // Boş item kontrolü
      if (Object.keys(item).length <= 2) {
        errors.push(`Item ${index + 1}: Boş veya eksik veri`);
      }
      
      // Geçersiz @type kontrolü
      if (item['@type'] && typeof item['@type'] === 'string' && !this.isValidSchemaType(item['@type'])) {
        errors.push(`Item ${index + 1}: Geçersiz @type: ${item['@type']}`);
      }
      
      // Gerekli alanlar kontrolü
      const typeValue = item['@type'];
      if (typeof typeValue === 'string') {
        const requiredFields = this.getRequiredFields(typeValue);
        requiredFields.forEach(field => {
          if (!item[field]) {
            errors.push(`Item ${index + 1}: Gerekli alan eksik: ${field}`);
          }
        });
      }
    });
    
    return errors;
  }

  /**
   * Yapılandırılmış veri uyarıları
   */
  private checkStructuredDataWarnings(data: Array<Record<string, unknown>>): string[] {
    const warnings: string[] = [];
    
    data.forEach((item, index) => {
      // Önerilen alanlar kontrolü
      const typeValue = item['@type'];
      if (typeof typeValue === 'string') {
        const recommendedFields = this.getRecommendedFields(typeValue);
        recommendedFields.forEach(field => {
          if (!item[field]) {
            warnings.push(`Item ${index + 1}: Önerilen alan eksik: ${field}`);
          }
        });
      }
      
      // URL formatı kontrolü
      const urlFields = ['url', 'image', 'logo', 'sameAs'];
      urlFields.forEach(field => {
        if (item[field] && typeof item[field] === 'string') {
          try {
            new URL(item[field]);
          } catch {
            warnings.push(`Item ${index + 1}: Geçersiz URL formatı: ${field}`);
          }
        }
      });
    });
    
    return warnings;
  }

  /**
   * Yapılandırılmış veri skoru hesaplama
   */
  private calculateStructuredDataScore(data: Array<Record<string, unknown>>, errors: string[], warnings: string[]): number {
    if (data.length === 0) return 0;
    
    let score = 100;
    
    // Hata başına -20 puan
    score -= errors.length * 20;
    
    // Uyarı başına -5 puan
    score -= warnings.length * 5;
    
    // Veri çeşitliliği bonusu
    const uniqueTypes = new Set(data.map(item => item['@type']));
    score += uniqueTypes.size * 5;
    
    // Veri zenginliği bonusu
    const avgFields = data.reduce((sum, item) => sum + Object.keys(item).length, 0) / data.length;
    if (avgFields > 5) score += 10;
    
    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Geçerli schema tipi kontrolü
   */
  private isValidSchemaType(type: string): boolean {
    const validTypes = [
      'Article', 'BlogPosting', 'NewsArticle', 'WebPage', 'WebSite',
      'Organization', 'Person', 'Product', 'Review', 'Rating',
      'Event', 'Place', 'LocalBusiness', 'Restaurant', 'Hotel',
      'BreadcrumbList', 'FAQPage', 'HowTo', 'Recipe', 'VideoObject',
      'ImageObject', 'AudioObject', 'SoftwareApplication', 'Book',
      'Movie', 'TVSeries', 'MusicAlbum', 'Course', 'JobPosting'
    ];
    
    return validTypes.includes(type);
  }

  /**
   * Gerekli alanları getir
   */
  private getRequiredFields(type: string): string[] {
    const requiredFields: { [key: string]: string[] } = {
      'Article': ['headline', 'author'],
      'BlogPosting': ['headline', 'author'],
      'NewsArticle': ['headline', 'author'],
      'WebPage': ['name'],
      'WebSite': ['name', 'url'],
      'Organization': ['name'],
      'Person': ['name'],
      'Product': ['name'],
      'Review': ['reviewBody', 'author'],
      'Event': ['name', 'startDate'],
      'Place': ['name'],
      'LocalBusiness': ['name', 'address'],
      'BreadcrumbList': ['itemListElement'],
      'FAQPage': ['mainEntity'],
      'HowTo': ['name', 'step'],
      'Recipe': ['name', 'ingredients'],
      'VideoObject': ['name', 'description'],
      'ImageObject': ['url'],
      'SoftwareApplication': ['name', 'applicationCategory'],
      'Course': ['name', 'provider'],
      'JobPosting': ['title', 'description', 'hiringOrganization']
    };
    
    return requiredFields[type] || [];
  }

  /**
   * Önerilen alanları getir
   */
  private getRecommendedFields(type: string): string[] {
    const recommendedFields: { [key: string]: string[] } = {
      'Article': ['description', 'datePublished', 'image'],
      'BlogPosting': ['description', 'datePublished', 'image'],
      'NewsArticle': ['description', 'datePublished', 'image'],
      'WebPage': ['description', 'url'],
      'WebSite': ['description', 'potentialAction'],
      'Organization': ['description', 'url', 'logo'],
      'Person': ['description', 'url', 'image'],
      'Product': ['description', 'image', 'offers'],
      'Review': ['rating', 'datePublished'],
      'Event': ['description', 'location', 'endDate'],
      'Place': ['description', 'address'],
      'LocalBusiness': ['description', 'telephone', 'openingHours'],
      'BreadcrumbList': [],
      'FAQPage': [],
      'HowTo': ['description', 'totalTime'],
      'Recipe': ['description', 'cookTime', 'prepTime'],
      'VideoObject': ['thumbnailUrl', 'uploadDate'],
      'ImageObject': ['description', 'width', 'height'],
      'SoftwareApplication': ['description', 'operatingSystem'],
      'Course': ['description', 'provider'],
      'JobPosting': ['datePosted', 'employmentType', 'jobLocation']
    };
    
    return recommendedFields[type] || [];
  }
}
