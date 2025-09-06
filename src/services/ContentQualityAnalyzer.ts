import * as cheerio from 'cheerio';

export interface ContentQualityResult {
  readabilityScore: {
    score: number;
    level: string;
    fleschKincaid: number;
    averageSentenceLength: number;
    averageWordsPerSentence: number;
    issues: string[];
    recommendations: string[];
  };
  keywordDensity: {
    totalWords: number;
    topKeywords: Array<{ keyword: string; count: number; density: number }>;
    overOptimized: string[];
    underOptimized: string[];
    score: number;
    issues: string[];
  };
  contentStructure: {
    headingStructure: {
      h1Count: number;
      h2Count: number;
      h3Count: number;
      h4Count: number;
      h5Count: number;
      h6Count: number;
      hierarchy: string[];
      score: number;
      issues: string[];
    };
    paragraphStructure: {
      paragraphCount: number;
      averageParagraphLength: number;
      shortParagraphs: number;
      longParagraphs: number;
      score: number;
      issues: string[];
    };
    listUsage: {
      unorderedLists: number;
      orderedLists: number;
      listItems: number;
      score: number;
      issues: string[];
    };
  };
  semanticKeywords: {
    mainTopic: string;
    relatedTerms: string[];
    semanticDensity: number;
    topicCoverage: number;
    score: number;
    recommendations: string[];
  };
  duplicateContent: {
    duplicatePercentage: number;
    repeatedSentences: string[];
    score: number;
    issues: string[];
  };
  contentLength: {
    wordCount: number;
    characterCount: number;
    readingTime: number;
    isOptimal: boolean;
    score: number;
    recommendations: string[];
  };
  overallScore: number;
}

/**
 * İçerik Kalitesi Analiz Sınıfı
 * SEO için içerik kalitesini çok boyutlu analiz eder
 */
export class ContentQualityAnalyzer {
  // Türkçe stop words
  private readonly TURKISH_STOP_WORDS = new Set([
    've', 'ile', 'bir', 'bu', 'o', 'şu', 'da', 'de', 'ta', 'te', 'ya', 'ye',
    'için', 'gibi', 'kadar', 'ama', 'fakat', 'ancak', 'lakin', 'veya', 'yahut',
    'ki', 'ise', 'eğer', 'hatta', 'daha', 'en', 'çok', 'az', 'biraz', 'oldukça',
    'son', 'ilk', 'önceki', 'sonraki', 'şimdi', 'bugün', 'dün', 'yarın',
    'her', 'hiç', 'hep', 'bazen', 'ara', 'sıra', 'gene', 'yine', 'tekrar',
    'bile', 'sadece', 'yalnız', 'salt', 'hem', 'ne', 'nasıl', 'neden', 'niçin',
    'nerede', 'nereden', 'nereye', 'ne', 'zaman', 'hangi', 'kim', 'kime', 'kimi',
    'kimin', 'ben', 'sen', 'o', 'biz', 'siz', 'onlar', 'ben', 'bana', 'beni',
    'benim', 'sen', 'sana', 'seni', 'senin', 'ona', 'onu', 'onun', 'bize',
    'bizi', 'bizim', 'size', 'sizi', 'sizin', 'onlara', 'onları', 'onların'
  ]);

  // SEO önemli kelime kategorileri
  private readonly SEO_KEYWORDS = {
    commercial: ['satın', 'al', 'fiyat', 'ücret', 'bedava', 'ücretsiz', 'indirim', 'kampanya', 'teklif'],
    informational: ['nasıl', 'nedir', 'hangi', 'ne', 'zaman', 'rehber', 'ipuçları', 'öğren'],
    local: ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya', 'şehir', 'bölge'],
    temporal: ['2024', '2025', 'güncel', 'yeni', 'son', 'trend', 'popüler']
  };

  constructor() {}

  /**
   * Kapsamlı içerik kalitesi analizi
   */
  analyze(html: string): ContentQualityResult {
    const $ = cheerio.load(html);
    
    // Sadece ana içeriği al (nav, footer, sidebar hariç)
    const mainContent = this.extractMainContent($);
    const cleanText = this.cleanText(mainContent);

    const readabilityScore = this.analyzeReadability(cleanText);
    const keywordDensity = this.analyzeKeywordDensity(cleanText);
    const contentStructure = this.analyzeContentStructure($);
    const semanticKeywords = this.analyzeSemanticKeywords(cleanText);
    const duplicateContent = this.analyzeDuplicateContent(cleanText);
    const contentLength = this.analyzeContentLength(cleanText);

    const overallScore = this.calculateOverallScore({
      readabilityScore,
      keywordDensity,
      contentStructure,
      semanticKeywords,
      duplicateContent,
      contentLength
    });

    return {
      readabilityScore,
      keywordDensity,
      contentStructure,
      semanticKeywords,
      duplicateContent,
      contentLength,
      overallScore
    };
  }

  /**
   * Ana içeriği çıkar (nav, footer, sidebar hariç)
   */
  private extractMainContent($: cheerio.Root): string {
    // İstenmeyen elementleri kaldır
    $('nav, footer, aside, .sidebar, .nav, .menu, .footer, script, style, .advertisement, .ads').remove();
    
    // Ana içerik alanlarını dene
    const mainSelectors = [
      'main', 'article', '.content', '.main-content', '.post-content', 
      '.entry-content', '.article-content', '#content', '#main'
    ];

    for (const selector of mainSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        return element.text();
      }
    }

    // Ana içerik bulunamazsa body'den al ama istenmeyen kısımları filtrele
    return $('body').text();
  }

  /**
   * Metni temizle
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Çoklu boşlukları tek boşluğa çevir
      .replace(/[^\w\sçğıöşüÇĞIİÖŞÜ.,!?;:-]/g, '') // Özel karakterleri kaldır
      .trim();
  }

  /**
   * Okunabilirlik analizi (Flesch-Kincaid benzeri Türkçe adaptasyonu)
   */
  private analyzeReadability(text: string): ContentQualityResult['readabilityScore'] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);

    const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const averageWordsPerSentence = averageSentenceLength;
    const averageSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

    // Türkçe için uyarlanmış Flesch-Kincaid formülü
    let fleschKincaid = 0;
    if (sentences.length > 0 && words.length > 0) {
      fleschKincaid = 206.835 - (1.015 * averageSentenceLength) - (84.6 * averageSyllablesPerWord);
    }

    let level = '';
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Okunabilirlik seviyesi belirleme
    if (fleschKincaid >= 90) {
      level = 'Çok Kolay';
    } else if (fleschKincaid >= 80) {
      level = 'Kolay';
    } else if (fleschKincaid >= 70) {
      level = 'Normal';
    } else if (fleschKincaid >= 60) {
      level = 'Orta Zor';
    } else if (fleschKincaid >= 50) {
      level = 'Zor';
    } else {
      level = 'Çok Zor';
      issues.push('Metin çok karmaşık');
      score -= 30;
      recommendations.push('Daha kısa cümleler kullanın');
      recommendations.push('Basit kelimeler tercih edin');
    }

    // Cümle uzunluğu kontrolü
    if (averageSentenceLength > 25) {
      issues.push('Cümleler çok uzun (ortalama 25+ kelime)');
      score -= 20;
      recommendations.push('Cümle uzunluğunu 15-20 kelime arasında tutun');
    } else if (averageSentenceLength > 20) {
      issues.push('Cümleler biraz uzun');
      score -= 10;
    }

    // Çok kısa cümleler de sorun
    if (averageSentenceLength < 8) {
      issues.push('Cümleler çok kısa');
      score -= 15;
      recommendations.push('Cümleleri biraz uzatarak akıcılığı artırın');
    }

    return {
      score: Math.max(score, 0),
      level,
      fleschKincaid: Math.round(fleschKincaid * 100) / 100,
      averageSentenceLength: Math.round(averageSentenceLength * 100) / 100,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 100) / 100,
      issues,
      recommendations
    };
  }

  /**
   * Türkçe hece sayma (basit yaklaşım)
   */
  private countSyllables(text: string): number {
    const vowels = /[aeiouæçğıöşüÇĞIİÖŞÜ]/gi;
    const matches = text.match(vowels);
    return matches ? matches.length : 0;
  }

  /**
   * Anahtar kelime yoğunluğu analizi
   */
  private analyzeKeywordDensity(text: string): ContentQualityResult['keywordDensity'] {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const totalWords = words.length;
    
    // Stop words'leri filtrele
    const filteredWords = words.filter(word => !this.TURKISH_STOP_WORDS.has(word));
    
    // Kelime sayılarını hesapla
    const wordCounts = new Map<string, number>();
    filteredWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // En sık kullanılan kelimeleri al
    const sortedWords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const topKeywords = sortedWords.map(([keyword, count]) => ({
      keyword,
      count,
      density: Math.round((count / totalWords) * 10000) / 100
    }));

    // Over/under optimization kontrolü
    const overOptimized: string[] = [];
    const underOptimized: string[] = [];
    let score = 100;
    const issues: string[] = [];

    topKeywords.forEach(({ keyword, density }) => {
      if (density > 3) { // %3'ten fazla
        overOptimized.push(keyword);
        issues.push(`"${keyword}" kelimesi aşırı optimize edilmiş (%${density})`);
        score -= 15;
      } else if (density < 0.5 && density > 0) { // Çok az kullanılmış
        underOptimized.push(keyword);
      }
    });

    // Ana anahtar kelime eksikse
    if (topKeywords.length === 0) {
      issues.push('Yeterli anahtar kelime bulunamadı');
      score -= 30;
    } else if (topKeywords[0].density < 1) {
      issues.push('Ana anahtar kelime yoğunluğu düşük');
      score -= 10;
    }

    return {
      totalWords,
      topKeywords,
      overOptimized,
      underOptimized,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * İçerik yapısı analizi
   */
  private analyzeContentStructure($: cheerio.Root): ContentQualityResult['contentStructure'] {
    // Başlık yapısı analizi
    const headingStructure = this.analyzeHeadingStructure($);
    
    // Paragraf yapısı analizi
    const paragraphStructure = this.analyzeParagraphStructure($);
    
    // Liste kullanımı analizi
    const listUsage = this.analyzeListUsage($);

    return {
      headingStructure,
      paragraphStructure,
      listUsage
    };
  }

  /**
   * Başlık hiyerarşisi analizi
   */
  private analyzeHeadingStructure($: cheerio.Root): ContentQualityResult['contentStructure']['headingStructure'] {
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    const h4Count = $('h4').length;
    const h5Count = $('h5').length;
    const h6Count = $('h6').length;

    const hierarchy: string[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const el = element as cheerio.TagElement;
      if (el.tagName) {
        hierarchy.push(el.tagName.toLowerCase());
      }
    });

    let score = 100;
    const issues: string[] = [];

    // H1 kontrolü
    if (h1Count === 0) {
      issues.push('H1 başlığı eksik');
      score -= 30;
    } else if (h1Count > 1) {
      issues.push('Birden fazla H1 başlığı bulundu');
      score -= 20;
    }

    // H2 kontrolü
    if (h2Count === 0) {
      issues.push('H2 başlığı eksik - içerik yapılandırması zayıf');
      score -= 15;
    }

    // Hiyerarşi kontrolü
    let previousLevel = 0;
    hierarchy.forEach(tag => {
      const currentLevel = parseInt(tag.charAt(1));
      if (currentLevel > previousLevel + 1) {
        issues.push(`Başlık hiyerarşisi bozuk: ${tag} beklenenden daha düşük seviyede`);
        score -= 10;
      }
      previousLevel = currentLevel;
    });

    // Çok fazla başlık seviyesi
    const usedLevels = new Set(hierarchy.map(h => h.charAt(1))).size;
    if (usedLevels > 4) {
      issues.push('Çok fazla başlık seviyesi kullanılıyor');
      score -= 5;
    }

    return {
      h1Count,
      h2Count,
      h3Count,
      h4Count,
      h5Count,
      h6Count,
      hierarchy,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Paragraf yapısı analizi
   */
  private analyzeParagraphStructure($: cheerio.Root): ContentQualityResult['contentStructure']['paragraphStructure'] {
    const paragraphs = $('p');
    const paragraphCount = paragraphs.length;
    
    let totalLength = 0;
    let shortParagraphs = 0;
    let longParagraphs = 0;

    paragraphs.each((_, element) => {
      const text = $(element).text().trim();
      const wordCount = text.split(/\s+/).length;
      totalLength += wordCount;

      if (wordCount < 20) {
        shortParagraphs++;
      } else if (wordCount > 100) {
        longParagraphs++;
      }
    });

    const averageParagraphLength = paragraphCount > 0 ? Math.round(totalLength / paragraphCount) : 0;

    let score = 100;
    const issues: string[] = [];

    if (paragraphCount === 0) {
      issues.push('Paragraf bulunamadı');
      score -= 40;
    } else {
      // Çok uzun paragraflar
      if (longParagraphs > paragraphCount * 0.3) {
        issues.push('Çok fazla uzun paragraf - okunabilirlik düşük');
        score -= 20;
      }

      // Çok kısa paragraflar
      if (shortParagraphs > paragraphCount * 0.5) {
        issues.push('Çok fazla kısa paragraf - içerik derinliği az');
        score -= 15;
      }

      // Ortalama uzunluk kontrolü
      if (averageParagraphLength > 80) {
        issues.push('Paragraflar çok uzun');
        score -= 10;
      } else if (averageParagraphLength < 25) {
        issues.push('Paragraflar çok kısa');
        score -= 10;
      }
    }

    return {
      paragraphCount,
      averageParagraphLength,
      shortParagraphs,
      longParagraphs,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Liste kullanımı analizi
   */
  private analyzeListUsage($: cheerio.Root): ContentQualityResult['contentStructure']['listUsage'] {
    const unorderedLists = $('ul').length;
    const orderedLists = $('ol').length;
    const listItems = $('li').length;

    let score = 100;
    const issues: string[] = [];

    if (unorderedLists === 0 && orderedLists === 0) {
      issues.push('Liste kullanımı yok - içerik düzenlemesi geliştirilebilir');
      score -= 15;
    }

    // Liste öğesi kontrolü
    if (listItems > 0) {
      const averageItemsPerList = listItems / (unorderedLists + orderedLists);
      if (averageItemsPerList > 10) {
        issues.push('Listeler çok uzun - kullanıcı deneyimi olumsuz');
        score -= 10;
      }
    }

    return {
      unorderedLists,
      orderedLists,
      listItems,
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Semantik anahtar kelime analizi
   */
  private analyzeSemanticKeywords(text: string): ContentQualityResult['semanticKeywords'] {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const filteredWords = words.filter(word => !this.TURKISH_STOP_WORDS.has(word));
    
    // Ana konu tespiti (en sık kullanılan kelime)
    const wordCounts = new Map<string, number>();
    filteredWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    const sortedWords = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]);
    const mainTopic = sortedWords.length > 0 ? sortedWords[0][0] : '';

    // İlgili terimler (ana konuyla ilişkili kelimeler)
    const relatedTerms = sortedWords
      .slice(1, 6)
      .map(([word]) => word)
      .filter(word => this.isRelatedTerm(word, mainTopic));

    // SEO kategorilerinde kelime varlığı
    let commercialScore = 0;
    let informationalScore = 0;
    let localScore = 0;
    let temporalScore = 0;

    this.SEO_KEYWORDS.commercial.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) commercialScore++;
    });
    this.SEO_KEYWORDS.informational.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) informationalScore++;
    });
    this.SEO_KEYWORDS.local.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) localScore++;
    });
    this.SEO_KEYWORDS.temporal.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) temporalScore++;
    });

    const semanticDensity = relatedTerms.length / Math.max(filteredWords.length / 100, 1);
    const topicCoverage = (commercialScore + informationalScore + localScore + temporalScore) / 4;

    let score = 50; // Başlangıç skoru
    const recommendations: string[] = [];

    // Ana konu varlığı
    if (mainTopic) {
      score += 20;
    } else {
      recommendations.push('Ana konu belirgin değil - odaklanma gerekiyor');
    }

    // İlgili terimler
    if (relatedTerms.length >= 3) {
      score += 20;
    } else if (relatedTerms.length >= 1) {
      score += 10;
      recommendations.push('Daha fazla ilgili terim kullanabilirsiniz');
    } else {
      recommendations.push('Ana konuyla ilgili daha fazla terim ekleyin');
    }

    // SEO kategorileri
    if (commercialScore > 0) score += 5;
    if (informationalScore > 0) score += 5;
    if (localScore > 0) score += 3;
    if (temporalScore > 0) score += 2;

    if (commercialScore === 0 && informationalScore === 0) {
      recommendations.push('Arama niyetine uygun kelimeler ekleyin (nasıl, nedir, satın al, vb.)');
    }

    return {
      mainTopic,
      relatedTerms,
      semanticDensity: Math.round(semanticDensity * 100) / 100,
      topicCoverage: Math.round(topicCoverage * 100) / 100,
      score: Math.min(score, 100),
      recommendations
    };
  }

  /**
   * İki kelimenin ilişkili olup olmadığını kontrol et
   */
  private isRelatedTerm(word1: string, word2: string): boolean {
    // Basit yaklaşım: kelimeler benzer kök paylaşıyor mu?
    if (word1.length < 3 || word2.length < 3) return false;
    
    const root1 = word1.substring(0, Math.min(4, word1.length));
    const root2 = word2.substring(0, Math.min(4, word2.length));
    
    return root1 === root2 || word1.includes(root2) || word2.includes(root1);
  }

  /**
   * Duplikat içerik analizi
   */
  private analyzeDuplicateContent(text: string): ContentQualityResult['duplicateContent'] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sentenceMap = new Map<string, number>();
    const repeatedSentences: string[] = [];

    sentences.forEach(sentence => {
      const normalized = sentence.trim().toLowerCase();
      const count = sentenceMap.get(normalized) || 0;
      sentenceMap.set(normalized, count + 1);
      
      if (count === 1) { // İkinci kez görüldüğünde ekle
        repeatedSentences.push(sentence.trim());
      }
    });

    const duplicatePercentage = sentences.length > 0 
      ? Math.round((repeatedSentences.length / sentences.length) * 10000) / 100
      : 0;

    let score = 100;
    const issues: string[] = [];

    if (duplicatePercentage > 20) {
      issues.push('Yüksek duplikat içerik oranı (>%20)');
      score -= 40;
    } else if (duplicatePercentage > 10) {
      issues.push('Orta seviye duplikat içerik');
      score -= 20;
    } else if (duplicatePercentage > 5) {
      issues.push('Düşük seviye duplikat içerik');
      score -= 10;
    }

    return {
      duplicatePercentage,
      repeatedSentences: repeatedSentences.slice(0, 5), // İlk 5 tekrarı göster
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * İçerik uzunluğu analizi
   */
  private analyzeContentLength(text: string): ContentQualityResult['contentLength'] {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const characterCount = text.length;
    const readingTime = Math.ceil(wordCount / 200); // Dakika cinsinden (200 kelime/dk)

    let score = 50;
    let isOptimal = false;
    const recommendations: string[] = [];

    // SEO için optimal uzunluk kontrolü
    if (wordCount >= 800 && wordCount <= 2000) {
      isOptimal = true;
      score = 100;
    } else if (wordCount >= 500 && wordCount < 800) {
      score = 80;
      recommendations.push('İçerik uzunluğunu 800+ kelimeye çıkarabilirsiniz');
    } else if (wordCount >= 300 && wordCount < 500) {
      score = 60;
      recommendations.push('SEO için en az 500-800 kelime önerilir');
    } else if (wordCount < 300) {
      score = 30;
      recommendations.push('İçerik çok kısa - daha detaylı bilgi ekleyin');
    } else if (wordCount > 2000 && wordCount <= 3000) {
      score = 90;
      recommendations.push('Uzun içerik iyi ama bölümlere ayırmayı düşünün');
    } else if (wordCount > 3000) {
      score = 70;
      recommendations.push('Çok uzun içerik - kullanıcı deneyimi için bölümlendirin');
    }

    return {
      wordCount,
      characterCount,
      readingTime,
      isOptimal,
      score,
      recommendations
    };
  }

  /**
   * Genel içerik kalitesi skoru hesaplama
   */
  private calculateOverallScore(results: Omit<ContentQualityResult, 'overallScore'>): number {
    const weights = {
      readability: 0.20,
      keywordDensity: 0.20,
      contentStructure: 0.15,
      semanticKeywords: 0.15,
      duplicateContent: 0.15,
      contentLength: 0.15
    };

    // Yapı skorunu hesapla
    const structureScore = (
      results.contentStructure.headingStructure.score * 0.5 +
      results.contentStructure.paragraphStructure.score * 0.3 +
      results.contentStructure.listUsage.score * 0.2
    );

    const totalScore = (
      results.readabilityScore.score * weights.readability +
      results.keywordDensity.score * weights.keywordDensity +
      structureScore * weights.contentStructure +
      results.semanticKeywords.score * weights.semanticKeywords +
      results.duplicateContent.score * weights.duplicateContent +
      results.contentLength.score * weights.contentLength
    );

    return Math.round(totalScore);
  }
}
