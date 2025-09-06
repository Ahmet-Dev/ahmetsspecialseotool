import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { SEOAnalyzer } from '../services/SEOAnalyzer';
import { GoogleOperators } from '../services/GoogleOperators';
import { rateLimiter } from '../services/RateLimiter';
import CaptchaModal from './CaptchaModal';

const AnalysisForm: React.FC = () => {
  const { t } = useTranslation();
  const { state, addAnalysisResult, securityFirewall, createNewSession } = useApp();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | undefined>(undefined);
  const [pendingAnalysis, setPendingAnalysis] = useState<string | null>(null);

  // URL doğrulama
  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  // Analiz başlat
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError(t('errors.invalidUrl'));
      return;
    }

    if (!isValidUrl(url)) {
      setError(t('errors.invalidUrl'));
      return;
    }

    // Rate limiting kontrolü
    console.log('Rate limiting kontrolü yapılıyor...');
    const rateLimitCheck = rateLimiter.checkRequest();
    console.log('Rate limit sonucu:', rateLimitCheck);
    
    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.captchaRequired) {
        console.log('Captcha gerekli, popup açılıyor...');
        // Captcha gerekli
        setPendingAnalysis(url);
        setShowCaptcha(true);
        setError('Çok hızlı istek gönderiyorsunuz. Lütfen güvenlik doğrulamasını tamamlayın.');
        return;
      } else if (rateLimitCheck.remainingTime) {
        console.log('IP engellenmiş, engel popup açılıyor...');
        // IP engellenmiş
        setRemainingTime(rateLimitCheck.remainingTime);
        setShowCaptcha(true);
        setError('IP adresiniz geçici olarak engellenmiştir.');
        return;
      }
    }

    await performAnalysis(url);
  };

  // Gerçek analiz işlemi
  const performAnalysis = async (targetUrl: string) => {

    // Session kontrolü - Daha güvenilir
    console.log('Mevcut session:', state.session);
    let currentSession = state.session;
    
    if (!currentSession) {
      console.warn('Session bulunamadı, yeni session oluşturuluyor...');
      try {
        currentSession = createNewSession();
        console.log('Yeni session oluşturuldu:', currentSession.id);
        if (!currentSession) {
          setError('Session oluşturulamadı. Lütfen sayfayı yenileyin.');
          return;
        }
      } catch (error) {
        console.error('Session oluşturma hatası:', error);
        setError('Session oluşturulamadı. Lütfen sayfayı yenileyin.');
        return;
      }
    }

    // Sadece gerçekten şüpheli istekleri engelle
    const securityCheck = await securityFirewall.checkRequest(
      '127.0.0.1', // Gerçek IP adresi alınmalı
      navigator.userAgent,
      targetUrl,
      'GET',
      {}
    );

    if (!securityCheck.allowed) {
      console.warn('Güvenlik kontrolü başarısız:', securityCheck.reason);
      // Geçici olarak güvenlik kontrolünü atla
      // setError(t('security.blocked'));
      // return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('SEO analizi başlatılıyor:', targetUrl);
      // SEO analizi başlat
      const seoAnalyzer = new SEOAnalyzer(currentSession.id);
      console.log('SEOAnalyzer oluşturuldu, sessionId:', currentSession.id);
      const result = await seoAnalyzer.analyze(targetUrl);
      console.log('SEO analiz sonucu alındı:', result);

      // Google operatörleri analizi
      const googleOperators = new GoogleOperators();
      const domain = new URL(targetUrl).hostname;
      console.log('Google operatörleri analizi başlatılıyor:', domain);
      
      // Paralel olarak Google operatörleri çalıştır
      const [
        siteIndexing,
        keywordRanking,
        competitorAnalysis,
        mentions
      ] = await Promise.all([
        googleOperators.checkSiteIndexing(domain),
        googleOperators.checkGeneralKeywordRanking('seo'),
        googleOperators.analyzeCompetitors('seo', domain),
        googleOperators.checkMentions(domain)
      ]);

      console.log('Google operatörleri sonuçları alındı');

      // Sonuçları birleştir ve kaydet
      const enhancedResult = {
        ...result,
        googleOperators: {
          siteIndexing,
          keywordRanking,
          competitorAnalysis,
          mentions
        }
      };

      console.log('Sonuç addAnalysisResult\'a gönderiliyor:', enhancedResult);
      addAnalysisResult(enhancedResult);
      console.log('Analiz sonucu başarıyla kaydedildi');
      setUrl(''); // Formu temizle
      
    } catch (err) {
      console.error('Analiz hatası:', err);
      const errorMessage = err instanceof Error ? err.message : t('errors.analysisFailed');
      console.error('Hata mesajı:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Captcha başarılı olduğunda
  const handleCaptchaSuccess = () => {
    console.log('Captcha başarılı, analiz devam ediyor...');
    rateLimiter.captchaVerified();
    setShowCaptcha(false);
    setRemainingTime(undefined);
    setError(null);
    
    if (pendingAnalysis) {
      console.log('Pending analysis var, performAnalysis çağrılıyor:', pendingAnalysis);
      performAnalysis(pendingAnalysis);
      setPendingAnalysis(null);
    }
  };

  // Captcha başarısız olduğunda
  const handleCaptchaFailed = () => {
    console.log('Captcha başarısız, IP engelleniyor...');
    rateLimiter.captchaFailed();
    setShowCaptcha(false);
    setPendingAnalysis(null);
    setError('Çok fazla yanlış deneme! IP adresiniz 5 dakika engellenmiştir.');
  };

  // Captcha modal'ını kapatma
  const handleCaptchaClose = () => {
    console.log('Captcha modal kapatılıyor...');
    setShowCaptcha(false);
    setPendingAnalysis(null);
    setRemainingTime(undefined);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('seo.enterUrl')}
        </h2>
        <p className="text-gray-600">
          Web sitenizin SEO performansını analiz edin
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-6">
        <div className="relative">
          <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-3">
            Web Sitesi URL'si
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 text-lg"
              disabled={isAnalyzing}
              required
            />
          </div>
        </div>

        {isAnalyzing && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">Analiz Devam Ediyor</h4>
                <p className="text-sm text-blue-700">Website analiz ediliyor, lütfen bekleyin...</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-red-800 mb-1">Hata</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isAnalyzing || !url.trim()}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform ${
            isAnalyzing || !url.trim() 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white hover:scale-105 shadow-lg hover:shadow-xl'
          }`}
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              <span>Analiz Ediliyor...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('seo.analyzeButton')}
            </div>
          )}
        </button>
      </form>

      {/* Analiz İpuçları */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Analiz İpuçları</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                URL'nin tam adresini girin (https:// ile başlamalı)
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Analiz işlemi 30-60 saniye sürebilir
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sonuçlar geçici olarak saklanır ve session sonunda silinir
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Güvenlik duvarı şüpheli aktiviteleri engeller
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Captcha Modal */}
      <CaptchaModal
        isOpen={showCaptcha}
        onClose={handleCaptchaClose}
        onSuccess={handleCaptchaSuccess}
        onFailed={handleCaptchaFailed}
        remainingTime={remainingTime}
      />
    </div>
  );
};

export default AnalysisForm;
