import type { GoogleOperatorResult } from '../types/seo';

/**
 * Google Arama Operatörleri Servisi
 * Proje dosyasında belirtilen operatörleri kullanarak SEO analizi
 * CORS kısıtlamaları nedeniyle mock data kullanır - production için backend proxy gerekli
 */
export class GoogleOperators {

  /**
   * Site indeksleme kontrolü
   */
  async checkSiteIndexing(domain: string): Promise<GoogleOperatorResult> {
    const query = `site:${domain}`;
    return this.executeGoogleQuery(query, 'site_indexing');
  }

  /**
   * Belirli klasör indeksleme kontrolü
   */
  async checkFolderIndexing(domain: string, folder: string): Promise<GoogleOperatorResult> {
    const query = `site:${domain}/${folder}`;
    return this.executeGoogleQuery(query, 'folder_indexing');
  }

  /**
   * HTTP ile indekslenen sayfaları kontrol et
   */
  async checkHttpIndexing(domain: string): Promise<GoogleOperatorResult> {
    const query = `site:${domain} -inurl:https`;
    return this.executeGoogleQuery(query, 'http_indexing');
  }

  /**
   * Google cache tarihini kontrol et
   */
  async checkCacheDate(domain: string): Promise<GoogleOperatorResult> {
    const query = `cache:${domain}`;
    return this.executeGoogleQuery(query, 'cache_date');
  }

  /**
   * Anahtar kelime sıralama kontrolü
   */
  async checkKeywordRanking(keyword: string, domain: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" site:${domain}`;
    return this.executeGoogleQuery(query, 'keyword_ranking');
  }

  /**
   * Genel anahtar kelime sıralaması
   */
  async checkGeneralKeywordRanking(keyword: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}"`;
    return this.executeGoogleQuery(query, 'general_keyword_ranking');
  }

  /**
   * Rakipleri analiz et
   */
  async analyzeCompetitors(keyword: string, domain: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" -site:${domain}`;
    return this.executeGoogleQuery(query, 'competitor_analysis');
  }

  /**
   * Başlık optimizasyonu kontrolü
   */
  async checkTitleOptimization(keyword: string, domain: string): Promise<GoogleOperatorResult> {
    const query = `intitle:"${keyword}" site:${domain}`;
    return this.executeGoogleQuery(query, 'title_optimization');
  }

  /**
   * URL optimizasyonu kontrolü
   */
  async checkUrlOptimization(keyword: string, domain: string): Promise<GoogleOperatorResult> {
    const query = `inurl:"${keyword}" site:${domain}`;
    return this.executeGoogleQuery(query, 'url_optimization');
  }

  /**
   * İçerik optimizasyonu kontrolü
   */
  async checkContentOptimization(keyword: string, domain: string): Promise<GoogleOperatorResult> {
    const query = `intext:"${keyword}" site:${domain}`;
    return this.executeGoogleQuery(query, 'content_optimization');
  }

  /**
   * Rakip başlık optimizasyonu
   */
  async checkCompetitorTitleOptimization(keyword: string): Promise<GoogleOperatorResult> {
    const query = `allintitle:"${keyword}"`;
    return this.executeGoogleQuery(query, 'competitor_title_optimization');
  }

  /**
   * Rakip URL optimizasyonu
   */
  async checkCompetitorUrlOptimization(keyword: string): Promise<GoogleOperatorResult> {
    const query = `allinurl:"${keyword}"`;
    return this.executeGoogleQuery(query, 'competitor_url_optimization');
  }

  /**
   * İçerik yoğunluğu kontrolü
   */
  async checkContentDensity(keyword: string): Promise<GoogleOperatorResult> {
    const query = `allintext:"${keyword}"`;
    return this.executeGoogleQuery(query, 'content_density');
  }

  /**
   * PDF içerik kontrolü
   */
  async checkPdfContent(keyword: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" filetype:pdf`;
    return this.executeGoogleQuery(query, 'pdf_content');
  }

  /**
   * PowerPoint içerik kontrolü
   */
  async checkPptContent(keyword: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" filetype:ppt`;
    return this.executeGoogleQuery(query, 'ppt_content');
  }

  /**
   * Word döküman kontrolü
   */
  async checkDocxContent(keyword: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" filetype:docx`;
    return this.executeGoogleQuery(query, 'docx_content');
  }

  /**
   * Akademik kaynak kontrolü
   */
  async checkAcademicSources(keyword: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" site:.edu`;
    return this.executeGoogleQuery(query, 'academic_sources');
  }

  /**
   * Devlet kaynak kontrolü
   */
  async checkGovernmentSources(keyword: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" site:.gov`;
    return this.executeGoogleQuery(query, 'government_sources');
  }

  /**
   * Mention kontrolü
   */
  async checkMentions(domain: string): Promise<GoogleOperatorResult> {
    const query = `"${domain}"`;
    return this.executeGoogleQuery(query, 'mentions');
  }

  /**
   * Subdomain indeks kontrolü
   */
  async checkSubdomainIndexing(domain: string): Promise<GoogleOperatorResult> {
    const query = `site:${domain} -www.${domain}`;
    return this.executeGoogleQuery(query, 'subdomain_indexing');
  }

  /**
   * İçerik kopya kontrolü
   */
  async checkContentDuplication(content: string, domain: string): Promise<GoogleOperatorResult> {
    const query = `"${content}" -site:${domain}`;
    return this.executeGoogleQuery(query, 'content_duplication');
  }

  /**
   * Benzer siteleri bul
   */
  async findRelatedSites(domain: string): Promise<GoogleOperatorResult> {
    const query = `related:${domain}`;
    return this.executeGoogleQuery(query, 'related_sites');
  }

  /**
   * Rakip anahtar kelime hedefleme
   */
  async checkCompetitorKeywordTargeting(competitorDomain: string, keyword: string): Promise<GoogleOperatorResult> {
    const query = `site:${competitorDomain} intitle:"${keyword}"`;
    return this.executeGoogleQuery(query, 'competitor_keyword_targeting');
  }

  /**
   * Rakip marka analizi
   */
  async analyzeCompetitorBrand(keyword: string, brand: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" AND "${brand}"`;
    return this.executeGoogleQuery(query, 'competitor_brand_analysis');
  }

  /**
   * Temel site bilgisi
   */
  async getSiteInfo(domain: string): Promise<GoogleOperatorResult> {
    const query = `info:${domain}`;
    return this.executeGoogleQuery(query, 'site_info');
  }

  /**
   * Parametreli URL kontrolü
   */
  async checkParameterizedUrls(domain: string): Promise<GoogleOperatorResult> {
    const query = `site:${domain} inurl:?`;
    return this.executeGoogleQuery(query, 'parameterized_urls');
  }

  /**
   * Tag sayfaları kontrolü
   */
  async checkTagPages(domain: string): Promise<GoogleOperatorResult> {
    const query = `site:${domain} inurl:tag`;
    return this.executeGoogleQuery(query, 'tag_pages');
  }

  /**
   * Kategori sayfaları kontrolü
   */
  async checkCategoryPages(domain: string): Promise<GoogleOperatorResult> {
    const query = `site:${domain} inurl:category`;
    return this.executeGoogleQuery(query, 'category_pages');
  }

  /**
   * 404 hata sayfaları kontrolü
   */
  async check404Pages(domain: string): Promise<GoogleOperatorResult> {
    const query = `site:${domain} "404"`;
    return this.executeGoogleQuery(query, '404_pages');
  }

  /**
   * Yerel SEO kontrolü
   */
  async checkLocalSEO(keyword: string, city: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword} ${city}"`;
    return this.executeGoogleQuery(query, 'local_seo');
  }

  /**
   * Yakın konum araması
   */
  async checkNearbySearch(keyword: string, city: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" near ${city}`;
    return this.executeGoogleQuery(query, 'nearby_search');
  }

  /**
   * Ülke kodu ile arama
   */
  async checkCountrySpecificSearch(keyword: string, countryCode: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" site:.${countryCode}`;
    return this.executeGoogleQuery(query, 'country_specific_search');
  }

  /**
   * İçerikte şehir adı kontrolü
   */
  async checkCityInContent(domain: string, city: string): Promise<GoogleOperatorResult> {
    const query = `site:${domain} "${city}"`;
    return this.executeGoogleQuery(query, 'city_in_content');
  }

  /**
   * Başlıklarda şehir optimizasyonu
   */
  async checkCityInTitle(domain: string, city: string): Promise<GoogleOperatorResult> {
    const query = `intitle:"${city}" site:${domain}`;
    return this.executeGoogleQuery(query, 'city_in_title');
  }

  /**
   * Türkiye odaklı rakipler
   */
  async checkTurkeyCompetitors(keyword: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" site:.com.tr`;
    return this.executeGoogleQuery(query, 'turkey_competitors');
  }

  /**
   * Almanya odaklı rakipler
   */
  async checkGermanyCompetitors(keyword: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" site:.de`;
    return this.executeGoogleQuery(query, 'germany_competitors');
  }

  /**
   * İngiltere odaklı rakipler
   */
  async checkUKCompetitors(keyword: string): Promise<GoogleOperatorResult> {
    const query = `"${keyword}" site:.uk`;
    return this.executeGoogleQuery(query, 'uk_competitors');
  }

  /**
   * Rakip başlık optimizasyonu (site hariç)
   */
  async checkCompetitorTitleOptimizationExcluding(keyword: string, domain: string): Promise<GoogleOperatorResult> {
    const query = `intitle:"${keyword}" -site:${domain}`;
    return this.executeGoogleQuery(query, 'competitor_title_excluding');
  }

  /**
   * Google sorgusu çalıştır - Gerçekçi mock data ile
   */
  private async executeGoogleQuery(query: string, operatorType: string): Promise<GoogleOperatorResult> {
    try {
      // CORS hatası nedeniyle geçici olarak mock data döndür
      console.log(`🔍 Google operatör simülasyonu: ${query} (${operatorType})`);
      
      // Domain ve keyword'e dayalı gerçekçi mock data
      const mockResultCount = this.generateRealisticResultCount(query, operatorType);
      const score = this.calculateOperatorScore(mockResultCount, operatorType);
      
      // Daha gerçekçi sonuç örnekleri
      const mockResults = this.generateMockResults(query, operatorType, mockResultCount);
      
      return {
        query,
        operator: operatorType,
        resultCount: mockResultCount,
        score,
        results: mockResults
      };

    } catch (error) {
      console.error(`Google sorgu hatası (${operatorType}):`, error);
      return {
        operator: operatorType,
        query,
        resultCount: 0,
        score: 0,
        results: []
      };
    }
  }

  /**
   * Gerçekçi sonuç sayısı üretme
   */
  private generateRealisticResultCount(query: string, operatorType: string): number {
    const domain = this.extractDomainFromQuery(query);
    const keyword = this.extractKeywordFromQuery(query);
    
    // Popüler domain/keyword kontrolü
    const isPopularDomain = ['google.com', 'facebook.com', 'youtube.com', 'amazon.com'].some(d => domain?.includes(d));
    const isPopularKeyword = ['seo', 'marketing', 'e-commerce', 'technology', 'business'].some(k => keyword?.toLowerCase().includes(k));
    
    let baseCount = 0;
    
    switch (operatorType) {
      case 'site_indexing':
        if (isPopularDomain) baseCount = Math.floor(Math.random() * 5000) + 1000;
        else baseCount = Math.floor(Math.random() * 500) + 50;
        break;
        
      case 'mentions':
        if (isPopularDomain) baseCount = Math.floor(Math.random() * 10000) + 2000;
        else baseCount = Math.floor(Math.random() * 200) + 10;
        break;
        
      case 'keyword_ranking':
        if (isPopularKeyword) baseCount = Math.floor(Math.random() * 50) + 5;
        else baseCount = Math.floor(Math.random() * 20) + 1;
        break;
        
      case 'general_keyword_ranking':
        if (isPopularKeyword) baseCount = Math.floor(Math.random() * 50000) + 10000;
        else baseCount = Math.floor(Math.random() * 5000) + 100;
        break;
        
      case 'competitor_analysis':
        baseCount = Math.floor(Math.random() * 1000) + 100;
        break;
        
      default:
        baseCount = Math.floor(Math.random() * 100) + 10;
    }
    
    return Math.max(1, baseCount);
  }

  /**
   * Query'den domain çıkarma
   */
  private extractDomainFromQuery(query: string): string | null {
    const siteMatch = query.match(/site:([^\s]+)/);
    return siteMatch ? siteMatch[1] : null;
  }

  /**
   * Query'den keyword çıkarma
   */
  private extractKeywordFromQuery(query: string): string | null {
    const keywordMatch = query.match(/"([^"]+)"/);
    return keywordMatch ? keywordMatch[1] : null;
  }

  /**
   * Gerçekçi mock sonuçlar üretme
   */
  private generateMockResults(query: string, operatorType: string, resultCount: number): string[] {
    const maxResults = Math.min(5, Math.ceil(resultCount / 10));
    const results: string[] = [];
    
    for (let i = 0; i < maxResults; i++) {
      switch (operatorType) {
        case 'site_indexing':
          results.push(`Indexed page ${i + 1} from domain`);
          break;
        case 'mentions':
          results.push(`Mention ${i + 1} on external site`);
          break;
        case 'keyword_ranking':
          results.push(`Keyword ranking result ${i + 1}`);
          break;
        default:
          results.push(`Google operator result ${i + 1} for: ${query}`);
      }
    }
    
    return results;
  }

  /**
   * Operatör puanı hesapla
   */
  private calculateOperatorScore(resultCount: number, operatorType: string): number {
    // Operatör tipine göre farklı puanlama
    switch (operatorType) {
      case 'site_indexing':
        if (resultCount > 1000) return 10;
        if (resultCount > 500) return 8;
        if (resultCount > 100) return 6;
        if (resultCount > 10) return 4;
        if (resultCount > 0) return 2;
        return 0;

      case 'keyword_ranking':
        if (resultCount > 0) return 10;
        return 0;

      case 'general_keyword_ranking':
        if (resultCount > 10000) return 8;
        if (resultCount > 1000) return 6;
        if (resultCount > 100) return 4;
        if (resultCount > 10) return 2;
        return 0;

      case 'competitor_analysis':
        if (resultCount > 1000) return 8;
        if (resultCount > 100) return 6;
        if (resultCount > 10) return 4;
        return 2;

      case 'mentions':
        if (resultCount > 100) return 10;
        if (resultCount > 50) return 8;
        if (resultCount > 10) return 6;
        if (resultCount > 0) return 4;
        return 0;

      default:
        if (resultCount > 100) return 8;
        if (resultCount > 10) return 6;
        if (resultCount > 0) return 4;
        return 0;
    }
  }
}
