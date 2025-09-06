/**
 * Rate Limiting Service
 * IP bazlı istek sınırlama ve spam koruması
 */

interface RequestEntry {
  ip: string;
  timestamp: number;
  count: number;
}

interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // milisaniye
  blockDuration: number; // milisaniye
}

class RateLimiter {
  private requests: Map<string, RequestEntry[]> = new Map();
  private blockedIPs: Map<string, number> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = {
    maxRequests: 5,
    timeWindow: 10000, // 10 saniye
    blockDuration: 300000 // 5 dakika
  }) {
    this.config = config;
    
    // Temizlik işlemi - her dakika eski kayıtları sil
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * IP adresini al (client-side için simüle)
   */
  private getClientIP(): string {
    // Client-side'da gerçek IP alamayız, browser fingerprint kullanabiliriz
    // Basit bir browser fingerprint oluşturalım
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      new Date().getTimezoneOffset().toString()
    ].join('|');
    
    // Fingerprint'i basit hash'e çevir
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer'a çevir
    }
    
    return 'fp_' + Math.abs(hash).toString();
  }

  /**
   * İstek kontrolü yap
   */
  checkRequest(): { allowed: boolean; captchaRequired: boolean; remainingTime?: number } {
    const ip = this.getClientIP();
    const now = Date.now();

    console.log('RateLimiter: İstek kontrolü yapılıyor', { ip, now });

    // Engellenen IP kontrolü
    const blockedUntil = this.blockedIPs.get(ip);
    if (blockedUntil && now < blockedUntil) {
      console.log('RateLimiter: IP engellenmiş', { ip, blockedUntil, remainingTime: blockedUntil - now });
      return { 
        allowed: false, 
        captchaRequired: false, 
        remainingTime: blockedUntil - now 
      };
    }

    // Engel süresi dolmuşsa kaldır
    if (blockedUntil && now >= blockedUntil) {
      this.blockedIPs.delete(ip);
      console.log('RateLimiter: IP engeli kaldırıldı', { ip });
    }

    // IP'nin geçmiş isteklerini al
    const userRequests = this.requests.get(ip) || [];
    
    // Zaman penceresi dışındaki istekleri filtrele
    const recentRequests = userRequests.filter(
      req => now - req.timestamp < this.config.timeWindow
    );

    console.log('RateLimiter: Yakın zamanlı istekler', { 
      ip, 
      totalRequests: userRequests.length, 
      recentRequests: recentRequests.length,
      maxRequests: this.config.maxRequests,
      timeWindow: this.config.timeWindow
    });

    // Güncel istekleri kaydet
    this.requests.set(ip, recentRequests);

    // Captcha gerekip gerekmediğini kontrol et
    if (recentRequests.length >= this.config.maxRequests) {
      console.log('RateLimiter: Captcha gerekli', { ip, requestCount: recentRequests.length });
      return { 
        allowed: false, 
        captchaRequired: true 
      };
    }

    // Yeni istek ekle
    recentRequests.push({
      ip,
      timestamp: now,
      count: recentRequests.length + 1
    });
    
    this.requests.set(ip, recentRequests);

    console.log('RateLimiter: İstek onaylandı', { ip, newRequestCount: recentRequests.length });

    return { 
      allowed: true, 
      captchaRequired: false 
    };
  }

  /**
   * Captcha doğrulandıktan sonra IP'yi geçici olarak beyaz listeye al
   */
  captchaVerified(): void {
    const ip = this.getClientIP();
    // Captcha doğrulandıktan sonra istekleri sıfırla
    this.requests.delete(ip);
    this.blockedIPs.delete(ip);
  }

  /**
   * Captcha başarısız olursa IP'yi engelle
   */
  captchaFailed(): void {
    const ip = this.getClientIP();
    const blockUntil = Date.now() + this.config.blockDuration;
    this.blockedIPs.set(ip, blockUntil);
    this.requests.delete(ip);
  }

  /**
   * Eski kayıtları temizle
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Eski istekleri temizle
    for (const [ip, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(
        req => now - req.timestamp < this.config.timeWindow * 2
      );
      
      if (recentRequests.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recentRequests);
      }
    }

    // Süresi dolmuş engelleri temizle
    for (const [ip, blockUntil] of this.blockedIPs.entries()) {
      if (now >= blockUntil) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  /**
   * Debug bilgileri al
   */
  getDebugInfo(): Record<string, unknown> {
    const ip = this.getClientIP();
    return {
      currentIP: ip,
      requests: this.requests.get(ip) || [],
      isBlocked: this.blockedIPs.has(ip),
      blockedUntil: this.blockedIPs.get(ip),
      totalTrackedIPs: this.requests.size,
      totalBlockedIPs: this.blockedIPs.size
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
export default RateLimiter;
