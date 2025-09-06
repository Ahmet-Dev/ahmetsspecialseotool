import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import type { Language } from '../types';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { state, changeLanguage } = useApp();

  const languages: Language[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const handleLanguageChange = (language: Language) => {
    console.log('Dil değiştiriliyor:', language);
    changeLanguage(language);
    // i18n dilini de değiştir
    i18n.changeLanguage(language.code).then(() => {
      console.log('i18n dili değiştirildi:', language.code);
    }).catch((error: unknown) => {
      console.error('i18n dil değiştirme hatası:', error);
    });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo ve Başlık */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold text-primary-600">
                {t('seo.title')}
              </h1>
            </div>
            <div className="ml-4 hidden sm:block">
              <p className="text-sm text-gray-500">
                {t('seo.subtitle')}
              </p>
            </div>
          </div>

          {/* Dil Seçici */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={state.currentLanguage.code}
                onChange={(e) => {
                  const selectedLang = languages.find(lang => lang.code === e.target.value);
                  if (selectedLang) handleLanguageChange(selectedLang);
                }}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
