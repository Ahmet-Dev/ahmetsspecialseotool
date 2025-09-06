// Genel Uygulama Tipleri
export interface User {
  id: string;
  name: string;
  email: string;
  language: 'tr' | 'en';
  createdAt: Date;
}

export interface Session {
  id: string;
  userId?: string;
  createdAt: Date;
  lastActivity: Date;
  analyses: string[]; // SEO analiz ID'leri
}

export interface Language {
  code: 'tr' | 'en';
  name: string;
  flag: string;
}

export interface SecurityEvent {
  id: string;
  type: 'blocked_request' | 'suspicious_activity' | 'rate_limit_exceeded';
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// SEO Analiz Tiplerini Export Et
export * from './seo';
