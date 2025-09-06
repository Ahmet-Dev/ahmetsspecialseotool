import type { SecurityEvent } from '../types';

/**
 * 7G Güvenlik Duvarı Sınıfı
 * SOLID prensiplerine uygun güvenlik sistemi
 */
export class SecurityFirewall {
  private blockedIPs: Set<string> = new Set();
  private rateLimits: Map<string, { count: number; lastReset: number }> = new Map();
  // private suspiciousPatterns: RegExp[] = [];
  private maxRequestsPerMinute = 1000; // Çok esnek limit (development için)
  private maxRequestsPerHour = 10000; // Çok esnek limit (development için)

  constructor() {
    this.initializeSecurityPatterns();
  }

  /**
   * Güvenlik desenlerini başlat
   */
  private initializeSecurityPatterns(): void {
    // Güvenlik desenleri artık checkSuspiciousPatterns metodunda tanımlanıyor
    // Bu metod boş bırakıldı çünkü artık kullanılmıyor
  }

  /**
   * İsteği güvenlik kontrolünden geçir
   */
  async checkRequest(
    ip: string,
    userAgent: string,
    url: string,
    method: string,
    headers: Record<string, string>
  ): Promise<{ allowed: boolean; reason?: string; event?: SecurityEvent }> {
    
    // IP engelleme kontrolü
    if (this.blockedIPs.has(ip)) {
      return {
        allowed: false,
        reason: 'IP adresi engellenmiş',
        event: this.createSecurityEvent('blocked_request', ip, userAgent, { url, method })
      };
    }

    // Rate limiting kontrolü
    const rateLimitResult = this.checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        reason: 'İstek limiti aşıldı',
        event: this.createSecurityEvent('rate_limit_exceeded', ip, userAgent, { url, method })
      };
    }

    // Şüpheli desen kontrolü
    const suspiciousResult = this.checkSuspiciousPatterns(url, headers, userAgent);
    if (!suspiciousResult.allowed) {
      this.blockedIPs.add(ip);
      return {
        allowed: false,
        reason: 'Şüpheli aktivite tespit edildi',
        event: this.createSecurityEvent('suspicious_activity', ip, userAgent, { 
          url, 
          method, 
          pattern: suspiciousResult.pattern 
        })
      };
    }

    return { allowed: true };
  }

  /**
   * Rate limiting kontrolü
   */
  private checkRateLimit(ip: string): { allowed: boolean; remaining?: number } {
    const now = Date.now();
    const hourAgo = now - 3600000; // 1 saat

    const current = this.rateLimits.get(ip) || { count: 0, lastReset: now };

    // Dakika bazında kontrol
    if (now - current.lastReset < 60000) {
      if (current.count >= this.maxRequestsPerMinute) {
        return { allowed: false };
      }
    } else {
      current.count = 0;
      current.lastReset = now;
    }

    // Saat bazında kontrol
    const hourlyCount = this.getHourlyRequestCount(ip, hourAgo);
    if (hourlyCount >= this.maxRequestsPerHour) {
      return { allowed: false };
    }

    current.count++;
    this.rateLimits.set(ip, current);

    return { 
      allowed: true, 
      remaining: this.maxRequestsPerMinute - current.count 
    };
  }

  /**
   * Şüpheli desen kontrolü
   */
  private checkSuspiciousPatterns(
    url: string, 
    headers: Record<string, string>, 
    userAgent: string
  ): { allowed: boolean; pattern?: string } {
    
    // Sadece gerçekten tehlikeli desenleri kontrol et
    const dangerousPatterns = [
      /\.\.\//, // Directory traversal
      /<script/i, // XSS attempts
      /union\s+select/i, // SQL injection
      /drop\s+table/i, // SQL injection
      /javascript:/i, // JavaScript injection
      /vbscript:/i, // VBScript injection
      /onload=/i, // Event handler injection
      /onerror=/i // Event handler injection
    ];

    const checkString = `${url} ${JSON.stringify(headers)} ${userAgent}`.toLowerCase();

    for (const pattern of dangerousPatterns) {
      if (pattern.test(checkString)) {
        return { allowed: false, pattern: pattern.toString() };
      }
    }

    // Normal tarayıcıları ve SEO araçlarını kabul et
    const allowedUserAgents = [
      /mozilla/i, /chrome/i, /safari/i, /firefox/i, /edge/i,
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i
    ];

    const isAllowedUserAgent = allowedUserAgents.some(pattern => pattern.test(userAgent));
    if (!isAllowedUserAgent && userAgent.length < 10) {
      return { allowed: false, pattern: 'suspicious_user_agent' };
    }

    return { allowed: true };
  }

  /**
   * Saatlik istek sayısını hesapla
   */
  private getHourlyRequestCount(ip: string, since: number): number {
    const current = this.rateLimits.get(ip);
    if (!current) return 0;
    
    if (current.lastReset < since) {
      return 0;
    }
    
    return current.count;
  }

  /**
   * Güvenlik olayı oluştur
   */
  private createSecurityEvent(
    type: SecurityEvent['type'],
    ip: string,
    userAgent: string,
    details: Record<string, unknown>
  ): SecurityEvent {
    return {
      id: this.generateId(),
      type,
      ip,
      userAgent,
      timestamp: new Date(),
      details
    };
  }

  /**
   * Benzersiz ID oluştur
   */
  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * IP adresini engelle
   */
  blockIP(ip: string): void {
    this.blockedIPs.add(ip);
  }

  /**
   * IP adresinin engelini kaldır
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }

  /**
   * Engellenmiş IP'leri getir
   */
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  /**
   * Rate limit istatistiklerini getir
   */
  getRateLimitStats(): Record<string, { count: number; lastReset: Date }> {
    const stats: Record<string, { count: number; lastReset: Date }> = {};
    
    this.rateLimits.forEach((value, ip) => {
      stats[ip] = {
        count: value.count,
        lastReset: new Date(value.lastReset)
      };
    });
    
    return stats;
  }

  /**
   * Güvenlik duvarını sıfırla
   */
  reset(): void {
    this.blockedIPs.clear();
    this.rateLimits.clear();
  }
}
