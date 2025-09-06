import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { SEOAnalysisResult } from '../types/seo';

interface SEOResultsProps {
  results: SEOAnalysisResult[];
}

const SEOResults: React.FC<SEOResultsProps> = ({ results }) => {
  const { t } = useTranslation();
  const [selectedResult, setSelectedResult] = useState<SEOAnalysisResult | null>(null);

  // Modal açıldığında body scroll'unu engelle
  useEffect(() => {
    if (selectedResult) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function - component unmount olduğunda overflow'u reset et
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedResult]);

  if (results.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz analiz yapılmadı</h3>
        <p className="mt-1 text-sm text-gray-500">SEO analizi başlatmak için yukarıdaki formu kullanın.</p>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-white bg-green-600 border-green-600';
    if (score >= 60) return 'text-white bg-yellow-600 border-yellow-600';
    if (score >= 40) return 'text-white bg-orange-600 border-orange-600';
    return 'text-white bg-red-600 border-red-600';
  };

  const getScoreBadgeColor = (score: number): string => {
    if (score >= 80) return 'text-green-700 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    if (score >= 40) return 'text-orange-700 bg-orange-100 border-orange-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Mükemmel';
    if (score >= 60) return 'İyi';
    if (score >= 40) return 'Orta';
    return 'Zayıf';
  };

  return (
    <div className="space-y-6">
      {/* Sonuç Listesi */}
      <div className="grid gap-4">
        {results.map((result, index) => (
          <div
            key={index}
            className="card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedResult(result)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {result.url}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(result.timestamp).toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreBadgeColor(result.score.total)}`}>
                  {result.score.total}/100 - {getScoreLabel(result.score.total)}
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detaylı Sonuç Modal */}
      {selectedResult && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedResult(null)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('seo.analysisDetailsTitle')}
                </h3>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* URL ve Tarih */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{t('seo.analysisModal.url')}</p>
                <p className="font-medium text-gray-900">{selectedResult.url}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {t('seo.analysisModal.analysisDate')} {new Date(selectedResult.timestamp).toLocaleString('tr-TR')}
                </p>
              </div>

              {/* Genel Puan */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('seo.analysisModal.generalScore')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg ${getScoreColor(selectedResult.score.total)}`}>
                      {selectedResult.score.total}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{t('seo.analysisModal.scoreLabels.total')}</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(selectedResult.score.onPage)}`}>
                      {selectedResult.score.onPage}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{t('seo.analysisModal.scoreLabels.onPage')}</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(selectedResult.score.offPage)}`}>
                      {selectedResult.score.offPage}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{t('seo.analysisModal.scoreLabels.offPage')}</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(selectedResult.score.technical)}`}>
                      {selectedResult.score.technical}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{t('seo.analysisModal.scoreLabels.technical')}</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(selectedResult.score.aio)}`}>
                      {selectedResult.score.aio}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{t('seo.analysisModal.scoreLabels.aio')}</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(selectedResult.score.performance)}`}>
                      {selectedResult.score.performance}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{t('seo.analysisModal.scoreLabels.performance')}</p>
                  </div>
                </div>
              </div>

              {/* Sayfa İçi SEO Detayları */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('seo.analysisModal.sections.onPage')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('seo.analysisModal.fields.title.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedResult.onPage.title.exists ? t('seo.analysisModal.exists') : t('seo.analysisModal.missing')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.length')}: {selectedResult.onPage.title.length} {t('seo.analysisModal.characters')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.score')}: {selectedResult.onPage.title.score}/10
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('seo.analysisModal.fields.metaDescription.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedResult.onPage.metaDescription.exists ? t('seo.analysisModal.exists') : t('seo.analysisModal.missing')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.length')}: {selectedResult.onPage.metaDescription.length} {t('seo.analysisModal.characters')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.score')}: {selectedResult.onPage.metaDescription.score}/10
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('seo.analysisModal.fields.headings.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      H1: {selectedResult.onPage.headings.h1.count} {t('seo.analysisModal.count')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      H2: {selectedResult.onPage.headings.h2.count} {t('seo.analysisModal.count')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      H3: {selectedResult.onPage.headings.h3.count} {t('seo.analysisModal.count')}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('seo.analysisModal.fields.images.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('seo.analysisModal.total')}: {selectedResult.onPage.images.total} {t('seo.analysisModal.count')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('seo.analysisModal.withoutAlt')}: {selectedResult.onPage.images.withoutAlt} {t('seo.analysisModal.count')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.score')}: {selectedResult.onPage.images.score}/10
                    </p>
                  </div>
                </div>
              </div>

              {/* 🤖 AIO (AI Optimization) Detayları */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('analysis.aio.title')}</h4>
                <p className="text-sm text-gray-600 mb-4">{t('analysis.aio.description')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('analysis.aio.questionAnswerContent.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.questionAnswerContent.hasQuestionWords')}: {selectedResult.aio.questionAnswerContent.hasQuestionWords ? t('analysis.aio.questionAnswerContent.present') : t('analysis.aio.questionAnswerContent.missing')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.questionAnswerContent.questionTypes')}: {selectedResult.aio.questionAnswerContent.questionTypes.length} {t('seo.analysisModal.count')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.questionAnswerContent.answerStructure')}: {selectedResult.aio.questionAnswerContent.answerStructure ? t('analysis.aio.questionAnswerContent.present') : t('analysis.aio.questionAnswerContent.missing')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.score')}: {selectedResult.aio.questionAnswerContent.score}/100
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('analysis.aio.contentStructure.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.contentStructure.hasSummary')}: {selectedResult.aio.contentStructure.hasSummary ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.contentStructure.hasDetailedSections')}: {selectedResult.aio.contentStructure.hasDetailedSections ? t('analysis.aio.contentStructure.sufficient') : t('analysis.aio.contentStructure.insufficient')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.contentStructure.hasNumberedLists')}: {selectedResult.aio.contentStructure.hasNumberedLists || selectedResult.aio.contentStructure.hasBulletPoints ? t('seo.analysisModal.present') : t('seo.analysisModal.absent')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.score')}: {selectedResult.aio.contentStructure.score}/100
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('analysis.aio.sourceCredibility.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.sourceCredibility.hasExternalLinks')}: {selectedResult.aio.sourceCredibility.hasExternalLinks ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.sourceCredibility.hasAuthorInfo')}: {selectedResult.aio.sourceCredibility.hasAuthorInfo ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.sourceCredibility.hasPublishDate')}: {selectedResult.aio.sourceCredibility.hasPublishDate ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.score')}: {selectedResult.aio.sourceCredibility.score}/100
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('analysis.aio.schemaMarkup.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.schemaMarkup.hasFAQSchema')}: {selectedResult.aio.schemaMarkup.hasFAQSchema ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.schemaMarkup.hasHowToSchema')}: {selectedResult.aio.schemaMarkup.hasHowToSchema ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.schemaMarkup.hasArticleSchema')}: {selectedResult.aio.schemaMarkup.hasArticleSchema ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.score')}: {selectedResult.aio.schemaMarkup.score}/100
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('analysis.aio.semanticKeywords.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.semanticKeywords.primaryKeyword')}: {selectedResult.aio.semanticKeywords.primaryKeyword || t('analysis.aio.semanticKeywords.notFound')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.semanticKeywords.lsiKeywords')}: {selectedResult.aio.semanticKeywords.lsiKeywords.length} {t('seo.analysisModal.count')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.semanticKeywords.semanticDensity')}: %{selectedResult.aio.semanticKeywords.semanticDensity}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.score')}: {selectedResult.aio.semanticKeywords.score}/100
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{t('analysis.aio.localOptimization.label')}</h5>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.localOptimization.hasLocationKeywords')}: {selectedResult.aio.localOptimization.hasLocationKeywords ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.localOptimization.hasLocalBusiness')}: {selectedResult.aio.localOptimization.hasLocalBusiness ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('analysis.aio.localOptimization.hasGMBSignals')}: {selectedResult.aio.localOptimization.hasGMBSignals ? t('seo.analysisModal.available') : t('seo.analysisModal.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('seo.analysisModal.score')}: {selectedResult.aio.localOptimization.score}/100
                    </p>
                  </div>
                </div>
              </div>

              {/* Öneriler */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('analysis.aio.optimizationRecommendations')}</h4>
                <div className="space-y-1">
                  {selectedResult.recommendations.map((recommendation, index) => {
                    // Boş satırları filtrele
                    if (!recommendation.trim()) return null;
                    
                    // Başlık kontrolü (📊 ile başlayan veya büyük harf + ANALIZI içeren)
                    const isMainTitle = recommendation.includes('📊') || 
                                       (recommendation.includes('ANALIZi') || recommendation.includes('ANALIZI'));
                    
                    // Başlık için farklı stil
                    if (isMainTitle) {
                      return (
                        <div key={index} className="pt-3 pb-1">
                          <div className="font-bold text-lg text-gray-900">{recommendation}</div>
                        </div>
                      );
                    }
                    
                    // Alt başlık kontrolü (🔴, 🟡, 🤖 ile başlayan)
                    const isSubTitle = recommendation.match(/^[\u{1F534}\u{1F7E1}\u{1F916}\u{1F6A8}\u{1F3C6}]/u);
                    
                    if (isSubTitle) {
                      return (
                        <div key={index} className="pt-2">
                          <div className="font-semibold text-base text-gray-800">{recommendation}</div>
                        </div>
                      );
                    }
                    
                    // Normal öneriler
                    return (
                      <div key={index} className="pl-4">
                        <span className="text-sm text-gray-700">{recommendation}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="btn-secondary"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOResults;
