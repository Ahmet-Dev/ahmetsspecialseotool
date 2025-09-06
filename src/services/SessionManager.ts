import type { Session, SEOAnalysisResult } from '../types';

/**
 * Session Yönetimi Sınıfı
 * Her kullanıcı için ayrı session ve geçici veri saklama
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private analysisResults: Map<string, SEOAnalysisResult> = new Map();
  private sessionTimeout = 30 * 60 * 1000; // 30 dakika

  constructor() {
    // Her 5 dakikada bir eski session'ları temizle
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * Yeni session oluştur
   */
  createSession(userId?: string): Session {
    try {
      const sessionId = this.generateSessionId();
      console.log('SessionManager.createSession çağrıldı, ID:', sessionId);
      console.log('Önceki session sayısı:', this.sessions.size);
      
      const session: Session = {
        id: sessionId,
        userId,
        createdAt: new Date(),
        lastActivity: new Date(),
        analyses: []
      };

      this.sessions.set(sessionId, session);
      console.log(`Yeni session oluşturuldu ve kaydedildi: ${sessionId}`);
      console.log('Yeni session sayısı:', this.sessions.size);
      console.log('Mevcut session ID\'ler:', Array.from(this.sessions.keys()));
      return session;
    } catch (error) {
      console.error('Session oluşturma hatası:', error);
      throw new Error('Session oluşturulamadı');
    }
  }

  /**
   * Session'ı getir
   */
  getSession(sessionId: string): Session | null {
    console.log('SessionManager.getSession çağrıldı:', sessionId);
    console.log('Mevcut session sayısı:', this.sessions.size);
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn('Session bulunamadı:', sessionId);
      console.log('Mevcut session ID\'ler:', Array.from(this.sessions.keys()));
      return null;
    }

    // Son aktiviteyi güncelle
    session.lastActivity = new Date();
    console.log('Session bulundu ve güncellendi:', sessionId);
    return session;
  }

  /**
   * Session'ı güncelle
   */
  updateSession(sessionId: string, updates: Partial<Session>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    Object.assign(session, updates);
    session.lastActivity = new Date();
    return true;
  }

  /**
   * Session'ı sil
   */
  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Session'a ait analiz sonuçlarını sil
    session.analyses.forEach(analysisId => {
      this.analysisResults.delete(analysisId);
    });

    this.sessions.delete(sessionId);
    return true;
  }

  /**
   * Analiz sonucunu kaydet
   */
  saveAnalysisResult(sessionId: string, result: SEOAnalysisResult): string {
    console.log('SessionManager.saveAnalysisResult çağrıldı:', sessionId);
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('Session bulunamadı saveAnalysisResult\'ta:', sessionId);
      console.log('Mevcut session ID\'ler:', Array.from(this.sessions.keys()));
      throw new Error('Session bulunamadı');
    }

    const analysisId = this.generateAnalysisId();
    result.sessionId = sessionId;
    
    this.analysisResults.set(analysisId, result);
    session.analyses.push(analysisId);
    session.lastActivity = new Date();

    console.log('Analiz sonucu kaydedildi:', analysisId, 'Session:', sessionId);
    console.log('Session\'daki toplam analiz sayısı:', session.analyses.length);
    return analysisId;
  }

  /**
   * Analiz sonucunu getir
   */
  getAnalysisResult(analysisId: string): SEOAnalysisResult | null {
    return this.analysisResults.get(analysisId) || null;
  }

  /**
   * Session'a ait tüm analiz sonuçlarını getir
   */
  getSessionAnalyses(sessionId: string): SEOAnalysisResult[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.analyses
      .map(analysisId => this.analysisResults.get(analysisId))
      .filter((result): result is SEOAnalysisResult => result !== undefined);
  }

  /**
   * Analiz sonucunu sil
   */
  deleteAnalysisResult(analysisId: string): boolean {
    const result = this.analysisResults.get(analysisId);
    if (!result) return false;

    // Session'dan da kaldır
    const session = this.sessions.get(result.sessionId);
    if (session) {
      const index = session.analyses.indexOf(analysisId);
      if (index > -1) {
        session.analyses.splice(index, 1);
      }
    }

    this.analysisResults.delete(analysisId);
    return true;
  }

  /**
   * Session istatistiklerini getir
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    totalAnalyses: number;
    averageAnalysesPerSession: number;
  } {
    const now = new Date();
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => now.getTime() - session.lastActivity.getTime() < this.sessionTimeout)
      .length;

    const totalAnalyses = this.analysisResults.size;
    const averageAnalysesPerSession = this.sessions.size > 0 
      ? totalAnalyses / this.sessions.size 
      : 0;

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      totalAnalyses,
      averageAnalysesPerSession: Math.round(averageAnalysesPerSession * 100) / 100
    };
  }

  /**
   * Eski session'ları temizle
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, sessionId) => {
      if (now.getTime() - session.lastActivity.getTime() > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.deleteSession(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`${expiredSessions.length} eski session temizlendi`);
    }
  }

  /**
   * Session ID oluştur
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Analiz ID oluştur
   */
  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Tüm session'ları temizle (test için)
   */
  clearAll(): void {
    this.sessions.clear();
    this.analysisResults.clear();
  }
}
