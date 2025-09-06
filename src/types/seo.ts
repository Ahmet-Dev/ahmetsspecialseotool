// SEO Analiz Sonuçları için Temel Tipler
export interface SEOScore {
  total: number;
  onPage: number;
  offPage: number;
  technical: number;
  content: number;
  performance: number;
  aio: number; // AI Optimization score
}

export interface OnPageSEO {
  title: {
    exists: boolean;
    length: number;
    score: number;
    content: string;
  };
  metaDescription: {
    exists: boolean;
    length: number;
    score: number;
    content: string;
  };
  headings: {
    h1: {
      count: number;
      score: number;
      content: string[];
    };
    h2: {
      count: number;
      score: number;
      content: string[];
    };
    h3: {
      count: number;
      score: number;
      content: string[];
    };
  };
  images: {
    total: number;
    withoutAlt: number;
    score: number;
  };
  internalLinks: {
    count: number;
    score: number;
  };
  externalLinks: {
    count: number;
    score: number;
  };
  keywordDensity: {
    primary: string;
    density: number;
    score: number;
  };
  contentLength: {
    wordCount: number;
    score: number;
  };
}

export interface OffPageSEO {
  backlinks: {
    count: number;
    score: number;
    sources: string[];
  };
  domainAuthority: {
    score: number;
    level: string;
  };
  pageAuthority: {
    score: number;
    level: string;
  };
  socialSignals: {
    facebook: number;
    twitter: number;
    linkedin: number;
    score: number;
  };
  mentions: {
    count: number;
    score: number;
    sources: string[];
  };
  indexing?: {
    totalPages: number;
    subdomainPages: number;
    httpPages: number;
    indexingScore: number;
  };
  competitors?: {
    relatedSitesCount: number;
    competitorStrength: number;
    competitorScore: number;
  };
}

export interface TechnicalSEO {
  robotsTxt: {
    exists: boolean;
    score: number;
    content: string;
    rules: Array<Record<string, unknown>>;
    sitemaps: string[];
    issues: string[];
  };
  sitemap: {
    exists: boolean;
    score: number;
    urlCount: number;
    lastModified: Date | null;
    type: 'index' | 'url' | 'unknown';
    issues: string[];
  };
  ssl: {
    enabled: boolean;
    score: number;
    certificate: Record<string, unknown> | null;
  };
  mobileFriendly: {
    score: number;
    issues: string[];
  };
  pageSpeed: {
    score: number;
    loadTime: number;
    metrics: Record<string, unknown>;
  };
  structuredData: {
    exists: boolean;
    score: number;
    types: string[];
  };
  socialMeta: {
    openGraph: boolean;
    twitter: boolean;
    score: number;
  };
}

export interface SEOAnalysisResult {
  url: string;
  timestamp: Date;
  score: SEOScore;
  onPage: OnPageSEO;
  offPage: OffPageSEO;
  technical: TechnicalSEO;
  aio: AIOSEO; // AI Optimization results
  recommendations: string[];
  sessionId: string;
}

export interface GoogleOperatorResult {
  operator: string;
  query: string;
  resultCount: number;
  score: number;
  results: string[];
}

export interface SiteSpeedMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
  [key: string]: unknown;
}

export interface StructuredDataTest {
  valid: boolean;
  errors: string[];
  warnings: string[];
  structuredData: Array<Record<string, unknown>>;
  score: number;
}

export interface SocialMetaTest {
  openGraph: {
    title: string;
    description: string;
    image: string;
    url: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  score: number;
}

export interface RobotsTxtTest {
  exists: boolean;
  score: number;
  content: string;
  rules: Array<Record<string, unknown>>;
  sitemaps: string[];
  issues: string[];
}

export interface SitemapTest {
  exists: boolean;
  score: number;
  type: 'index' | 'url' | 'unknown';
  urlCount: number;
  lastModified: Date | null;
  issues: string[];
}

// AIO (AI Optimization) Types
export interface AIOSEO {
  questionAnswerContent: {
    hasQuestionWords: boolean;
    questionTypes: string[];
    answerStructure: boolean;
    score: number;
  };
  contentStructure: {
    hasSummary: boolean;
    hasDetailedSections: boolean;
    hasNumberedLists: boolean;
    hasBulletPoints: boolean;
    score: number;
  };
  sourceCredibility: {
    hasExternalLinks: boolean;
    hasAuthorInfo: boolean;
    hasPublishDate: boolean;
    hasUpdatedDate: boolean;
    score: number;
  };
  semanticKeywords: {
    primaryKeyword: string;
    lsiKeywords: string[];
    semanticDensity: number;
    score: number;
  };
  schemaMarkup: {
    hasFAQSchema: boolean;
    hasHowToSchema: boolean;
    hasArticleSchema: boolean;
    hasLocalSchema: boolean;
    score: number;
  };
  localOptimization: {
    hasLocationKeywords: boolean;
    hasLocalBusiness: boolean;
    hasGMBSignals: boolean;
    locationVariations: string[];
    score: number;
  };
  aiReadiness: {
    snippetOptimized: boolean;
    conversationalTone: boolean;
    quickAnswers: boolean;
    factualAccuracy: boolean;
    score: number;
  };
}
