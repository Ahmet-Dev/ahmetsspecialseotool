import React from 'react';

interface StructuredDataProps {
  type: 'website' | 'application' | 'organization';
  data?: Record<string, unknown>;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const getStructuredData = () => {
    const baseUrl = 'https://seo.ahmetkahraman.tech';
    
    switch (type) {
      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Ahmet's Special SEO Tool",
          "description": "Kapsamlı SEO analizi ve optimizasyon önerileri sunan profesyonel web uygulaması",
          "url": baseUrl,
          "inLanguage": ["tr", "en"],
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/analysis?url={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          },
          "author": {
            "@type": "Person",
            "name": "Ahmet Kahraman",
            "url": "https://ahmetkahraman.tech"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Ahmet Kahraman",
            "url": "https://ahmetkahraman.tech"
          }
        };
        
      case 'application':
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Ahmet's Special SEO Tool",
          "description": "Web sitenizin SEO performansını ücretsiz analiz edin. 30+ Google operatörü, AI optimizasyonu, teknik SEO denetimi.",
          "url": baseUrl,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "browserRequirements": "Chrome 80+, Firefox 75+, Safari 13+",
          "featureList": [
            "SEO Analizi",
            "Google Operatörleri",
            "AI Optimizasyonu",
            "Teknik SEO Denetimi",
            "Performans Analizi",
            "Güvenlik Taraması"
          ],
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "TRY",
            "availability": "https://schema.org/InStock"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "150",
            "bestRating": "5",
            "worstRating": "1"
          },
          "author": {
            "@type": "Person",
            "name": "Ahmet Kahraman",
            "url": "https://ahmetkahraman.tech"
          }
        };
        
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Ahmet Kahraman",
          "url": "https://ahmetkahraman.tech",
          "sameAs": [
            "https://seo.ahmetkahraman.tech"
          ],
          "founder": {
            "@type": "Person",
            "name": "Ahmet Kahraman"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "technical support",
            "url": "https://seo.ahmetkahraman.tech"
          }
        };
        
      default:
        return {};
    }
  };

  const structuredData = { ...getStructuredData(), ...data };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
};

export default StructuredData;
