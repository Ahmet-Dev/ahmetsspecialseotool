import * as cheerio from 'cheerio';
import type { SocialMetaTest } from '../types/seo';

/**
 * Sosyal Medya Meta Etiketleri Analiz Sınıfı
 * Open Graph ve Twitter Cards analizi
 */
export class SocialMetaAnalyzer {
  constructor() {}

  /**
   * Kapsamlı sosyal medya meta etiketleri analizi
   */
  async analyzeSocialMeta(_url: string, htmlContent: string): Promise<SocialMetaTest> {
    try {
      const $ = cheerio.load(htmlContent);
      
      const openGraph = this.extractOpenGraph($);
      const twitter = this.extractTwitterCards($);
      
      const score = this.calculateSocialMetaScore(openGraph, twitter);
      
      return {
        openGraph,
        twitter,
        score
      };
    } catch (error) {
      console.error('Sosyal medya meta analizi hatası:', error);
      return {
        openGraph: {
          title: '',
          description: '',
          image: '',
          url: ''
        },
        twitter: {
          card: '',
          title: '',
          description: '',
          image: ''
        },
        score: 0
      };
    }
  }

  /**
   * Open Graph verilerini çıkar
   */
  private extractOpenGraph($: cheerio.Root): SocialMetaTest['openGraph'] {
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const ogUrl = $('meta[property="og:url"]').attr('content') || '';

    return {
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
      url: ogUrl
    };
  }

  /**
   * Twitter Cards verilerini çıkar
   */
  private extractTwitterCards($: cheerio.Root): SocialMetaTest['twitter'] {
    const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
    const twitterTitle = $('meta[name="twitter:title"]').attr('content') || '';
    const twitterDescription = $('meta[name="twitter:description"]').attr('content') || '';
    const twitterImage = $('meta[name="twitter:image"]').attr('content') || '';

    return {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      image: twitterImage
    };
  }

  /**
   * Sosyal medya meta skoru hesaplama
   */
  private calculateSocialMetaScore(openGraph: SocialMetaTest['openGraph'], twitter: SocialMetaTest['twitter']): number {
    let score = 0;
    let maxScore = 0;

    // Open Graph skoru (0-50 puan)
    const ogScore = this.calculateOpenGraphScore(openGraph);
    score += ogScore;
    maxScore += 50;

    // Twitter Cards skoru (0-50 puan)
    const twitterScore = this.calculateTwitterScore(twitter);
    score += twitterScore;
    maxScore += 50;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Open Graph skoru hesaplama
   */
  private calculateOpenGraphScore(openGraph: SocialMetaTest['openGraph']): number {
    let score = 0;

    // Title (0-15 puan)
    if (openGraph.title) {
      score += 10;
      if (openGraph.title.length >= 30 && openGraph.title.length <= 60) {
        score += 5; // Optimal uzunluk bonusu
      }
    }

    // Description (0-15 puan)
    if (openGraph.description) {
      score += 10;
      if (openGraph.description.length >= 120 && openGraph.description.length <= 160) {
        score += 5; // Optimal uzunluk bonusu
      }
    }

    // Image (0-10 puan)
    if (openGraph.image) {
      score += 10;
      // Image URL formatı kontrolü
      try {
        new URL(openGraph.image);
        score += 0; // Geçerli URL
      } catch {
        score -= 2; // Geçersiz URL
      }
    }

    // URL (0-10 puan)
    if (openGraph.url) {
      score += 10;
      // URL formatı kontrolü
      try {
        new URL(openGraph.url);
        score += 0; // Geçerli URL
      } catch {
        score -= 2; // Geçersiz URL
      }
    }

    return Math.max(score, 0);
  }

  /**
   * Twitter Cards skoru hesaplama
   */
  private calculateTwitterScore(twitter: SocialMetaTest['twitter']): number {
    let score = 0;

    // Card type (0-10 puan)
    if (twitter.card) {
      score += 5;
      const validCardTypes = ['summary', 'summary_large_image', 'app', 'player'];
      if (validCardTypes.includes(twitter.card)) {
        score += 5; // Geçerli card type bonusu
      }
    }

    // Title (0-15 puan)
    if (twitter.title) {
      score += 10;
      if (twitter.title.length >= 30 && twitter.title.length <= 60) {
        score += 5; // Optimal uzunluk bonusu
      }
    }

    // Description (0-15 puan)
    if (twitter.description) {
      score += 10;
      if (twitter.description.length >= 120 && twitter.description.length <= 160) {
        score += 5; // Optimal uzunluk bonusu
      }
    }

    // Image (0-10 puan)
    if (twitter.image) {
      score += 10;
      // Image URL formatı kontrolü
      try {
        new URL(twitter.image);
        score += 0; // Geçerli URL
      } catch {
        score -= 2; // Geçersiz URL
      }
    }

    return Math.max(score, 0);
  }

  /**
   * Sosyal medya meta etiketleri önerileri
   */
  generateSocialMetaRecommendations(openGraph: SocialMetaTest['openGraph'], twitter: SocialMetaTest['twitter']): string[] {
    const recommendations: string[] = [];

    // Open Graph önerileri
    if (!openGraph.title) {
      recommendations.push('Open Graph title etiketi ekleyin');
    } else if (openGraph.title.length < 30 || openGraph.title.length > 60) {
      recommendations.push('Open Graph title uzunluğunu optimize edin (30-60 karakter)');
    }

    if (!openGraph.description) {
      recommendations.push('Open Graph description etiketi ekleyin');
    } else if (openGraph.description.length < 120 || openGraph.description.length > 160) {
      recommendations.push('Open Graph description uzunluğunu optimize edin (120-160 karakter)');
    }

    if (!openGraph.image) {
      recommendations.push('Open Graph image etiketi ekleyin');
    }

    if (!openGraph.url) {
      recommendations.push('Open Graph url etiketi ekleyin');
    }

    // Twitter Cards önerileri
    if (!twitter.card) {
      recommendations.push('Twitter Card type etiketi ekleyin');
    } else if (!['summary', 'summary_large_image', 'app', 'player'].includes(twitter.card)) {
      recommendations.push('Geçerli bir Twitter Card type kullanın');
    }

    if (!twitter.title) {
      recommendations.push('Twitter title etiketi ekleyin');
    } else if (twitter.title.length < 30 || twitter.title.length > 60) {
      recommendations.push('Twitter title uzunluğunu optimize edin (30-60 karakter)');
    }

    if (!twitter.description) {
      recommendations.push('Twitter description etiketi ekleyin');
    } else if (twitter.description.length < 120 || twitter.description.length > 160) {
      recommendations.push('Twitter description uzunluğunu optimize edin (120-160 karakter)');
    }

    if (!twitter.image) {
      recommendations.push('Twitter image etiketi ekleyin');
    }

    // Genel öneriler
    if (openGraph.title && twitter.title && openGraph.title !== twitter.title) {
      recommendations.push('Open Graph ve Twitter title etiketlerini aynı yapın');
    }

    if (openGraph.description && twitter.description && openGraph.description !== twitter.description) {
      recommendations.push('Open Graph ve Twitter description etiketlerini aynı yapın');
    }

    if (openGraph.image && twitter.image && openGraph.image !== twitter.image) {
      recommendations.push('Open Graph ve Twitter image etiketlerini aynı yapın');
    }

    return recommendations;
  }

  /**
   * Sosyal medya meta etiketleri template'i oluştur
   */
  generateSocialMetaTemplate(title: string, description: string, image: string, url: string): string {
    return `
<!-- Open Graph Meta Tags -->
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Your Site Name">

<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:site" content="@yourtwitterhandle">
<meta name="twitter:creator" content="@yourtwitterhandle">
    `.trim();
  }
}
