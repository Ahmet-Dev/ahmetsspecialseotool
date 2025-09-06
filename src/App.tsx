import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppProvider } from './contexts/AppContext';
import { useApp } from './hooks/useApp';
import { ErrorBoundary } from './components/ErrorBoundary';
import Header from './components/Header';
import AnalysisForm from './components/AnalysisForm';
import SEOResults from './components/SEOResults';
import StructuredData from './components/StructuredData';
import './utils/i18n';

// SEO Component for dynamic meta tags
const SEOHead: React.FC<{ title?: string; description?: string; path?: string }> = ({ 
  title = "Ahmet's Special SEO Tool - Ücretsiz SEO Analiz Aracı",
  description = "Web sitenizin SEO performansını ücretsiz analiz edin. 30+ Google operatörü, AI optimizasyonu, teknik SEO denetimi ve detaylı raporlama.",
  path = ""
}) => {
  const canonicalUrl = `https://seo.ahmetkahraman.tech${path}`;
  
  useEffect(() => {
    // Dynamic title update
    document.title = title;
    
    // Dynamic meta description update
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Dynamic canonical URL update
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    }
    
    // Dynamic Open Graph updates
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDescription) ogDescription.setAttribute('content', description);
    if (ogUrl) ogUrl.setAttribute('href', canonicalUrl);
    
    // Dynamic Twitter Card updates
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    
    if (twitterTitle) twitterTitle.setAttribute('content', title);
    if (twitterDescription) twitterDescription.setAttribute('content', description);
    if (twitterUrl) twitterUrl.setAttribute('content', canonicalUrl);
    
  }, [title, description, canonicalUrl]);

  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
              </Routes>
            </main>
            
            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-sm text-gray-500">
                  Developed by{' '}
                  <a 
                    href="https://ahmetkahraman.tech/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 font-medium transition-colors duration-200"
                  >
                    Ahmet Kahraman
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

const HomePage: React.FC = () => {
  const { state } = useApp();
  const { t } = useTranslation();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showHowItWorks) {
        setShowHowItWorks(false);
      }
    };

    if (showHowItWorks) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showHowItWorks]);

  const scrollToAnalysisForm = () => {
    const analysisSection = document.getElementById('analysis-section');
    if (analysisSection) {
      analysisSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  return (
    <>
      <SEOHead 
        title="Ahmet's Special SEO Tool - Ücretsiz SEO Analiz ve Optimizasyon Aracı"
        description="Web sitenizin SEO performansını ücretsiz analiz edin. 30+ Google operatörü, AI optimizasyonu, teknik SEO denetimi ve detaylı raporlama. seo.ahmetkahraman.tech"
        path="/"
      />
      <StructuredData type="website" />
      <StructuredData type="application" />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-sm font-medium mb-6">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                {t('homepage.badge')}
              </div>
              
              <header>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                  <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                    {t('homepage.title')}
                  </span>
                  <br />
                  <span className="text-gray-800">{t('homepage.subtitle')}</span>
                </h1>
              </header>
              
              <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                {t('homepage.description')}
                <br className="hidden md:block" />
                {t('homepage.descriptionExtended')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={scrollToAnalysisForm}
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-base sm:text-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t('homepage.startAnalysis')}
                </button>
                <button 
                  onClick={() => setShowHowItWorks(true)}
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-base sm:text-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('homepage.howItWorks')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Analysis Section */}
        <section id="analysis-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <AnalysisForm />
            </div>
            
            <div className="lg:col-span-2">
              <SEOResults results={state.analysisResults} />
            </div>
          </div>
        </section>
      </div>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-900">{t('howItWorks.title')}</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Adım 1 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('howItWorks.steps.step1.title')}</h3>
                  <p className="text-gray-600 mb-3">
                    {t('howItWorks.steps.step1.description')}
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <code className="text-sm text-gray-800">{t('howItWorks.steps.step1.example')}</code>
                  </div>
                </div>
              </div>

              {/* Adım 2 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('howItWorks.steps.step2.title')}</h3>
                  <p className="text-gray-600 mb-3">
                    {t('howItWorks.steps.step2.description')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-900">{t('howItWorks.steps.step2.categories.onPage.title')}</h4>
                      <p className="text-sm text-blue-700">{t('howItWorks.steps.step2.categories.onPage.description')}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-900">{t('howItWorks.steps.step2.categories.offPage.title')}</h4>
                      <p className="text-sm text-green-700">{t('howItWorks.steps.step2.categories.offPage.description')}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <h4 className="font-medium text-purple-900">{t('howItWorks.steps.step2.categories.technical.title')}</h4>
                      <p className="text-sm text-purple-700">{t('howItWorks.steps.step2.categories.technical.description')}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <h4 className="font-medium text-orange-900">{t('howItWorks.steps.step2.categories.aio.title')}</h4>
                      <p className="text-sm text-orange-700">{t('howItWorks.steps.step2.categories.aio.description')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adım 3 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('howItWorks.steps.step3.title')}</h3>
                  <p className="text-gray-600 mb-3">
                    {t('howItWorks.steps.step3.description')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">site:siteniz.com</code>
                      <span className="text-sm text-gray-600">- {t('howItWorks.steps.step3.operators.site')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">inurl: intext: intitle:</code>
                      <span className="text-sm text-gray-600">- {t('howItWorks.steps.step3.operators.inurl')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">related: link:</code>
                      <span className="text-sm text-gray-600">- {t('howItWorks.steps.step3.operators.related')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adım 4 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('howItWorks.steps.step4.title')}</h3>
                  <p className="text-gray-600 mb-3">
                    {t('howItWorks.steps.step4.description')}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">90+</div>
                      <div className="text-sm text-gray-600">{t('howItWorks.steps.step4.scoring.excellent')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">70-89</div>
                      <div className="text-sm text-gray-600">{t('howItWorks.steps.step4.scoring.good')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">50-69</div>
                      <div className="text-sm text-gray-600">{t('howItWorks.steps.step4.scoring.average')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">&lt;50</div>
                      <div className="text-sm text-gray-600">{t('howItWorks.steps.step4.scoring.poor')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adım 5 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('howItWorks.steps.step5.title')}</h3>
                  <p className="text-gray-600 mb-3">
                    {t('howItWorks.steps.step5.description')}
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-red-500">🔴</span>
                      <div>
                        <span className="font-medium">{t('howItWorks.steps.step5.reportTypes.critical')}</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-500">🟡</span>
                      <div>
                        <span className="font-medium">{t('howItWorks.steps.step5.reportTypes.improvements')}</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-500">✅</span>
                      <div>
                        <span className="font-medium">{t('howItWorks.steps.step5.reportTypes.solutions')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Güvenlik */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">{t('howItWorks.security.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{t('howItWorks.security.features.dataStorage')}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{t('howItWorks.security.features.encryption')}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{t('howItWorks.security.features.rateLimit')}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{t('howItWorks.security.features.noTracking')}</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setShowHowItWorks(false);
                    scrollToAnalysisForm();
                  }}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t('howItWorks.button')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Analiz Sayfası Bileşeni
const AnalysisPage: React.FC = () => {
  const { state } = useApp();

  return (
    <>
      <SEOHead 
        title="SEO Analiz Sonuçları - Ahmet's Special SEO Tool"
        description="Web sitenizin detaylı SEO analiz sonuçlarını görüntüleyin. Sayfa içi, sayfa dışı ve teknik SEO skorları ile optimizasyon önerileri."
        path="/analysis"
      />
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Analiz Sonuçları</h1>
          <p className="text-gray-600">Web sitenizin SEO performansını detaylı olarak inceleyin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <AnalysisForm />
          </div>
          
          <div className="lg:col-span-2">
            <SEOResults results={state.analysisResults} />
          </div>
        </div>
      </div>
    </>
  );
};

export default App;