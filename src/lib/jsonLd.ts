import { branchSearchKeywords } from "@/lib/seoBranches";
import {
  CONTACT_EMAIL,
  ORGANIZATION_ADDRESS,
  SITE_NAME,
  SITE_NAME_EN,
  SITE_TAGLINE,
  SOURCE_REPOSITORY,
} from "@/lib/site";

/**
 * 홈에 삽입되는 JSON-LD 그래프.
 * Organization(연락처+주소), WebSite(검색 액션), WebApplication(제품 정보) 을
 * 함께 내보내 AI 가 서비스 주체와 기능을 한 번에 확인할 수 있게 한다.
 */
export function buildSiteJsonLd(appUrl: string) {
  const base = appUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: SITE_NAME,
        alternateName: SITE_NAME_EN,
        legalName: SITE_NAME,
        url: base,
        logo: {
          "@type": "ImageObject",
          url: `${base}/logo.svg`,
          caption: SITE_NAME,
        },
        image: `${base}/opengraph-image`,
        description:
          "다이소 매장과 상품 재고·진열 위치를 검색하는 웹 서비스를 만들고 운영하는 오픈소스 프로젝트입니다.",
        email: CONTACT_EMAIL,
        address: {
          "@type": "PostalAddress",
          addressCountry: ORGANIZATION_ADDRESS.addressCountry,
          addressRegion: ORGANIZATION_ADDRESS.addressRegion,
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: CONTACT_EMAIL,
            url: `${base}/contact`,
            availableLanguage: ["ko", "en"],
            areaServed: "KR",
          },
          {
            "@type": "ContactPoint",
            contactType: "technical support",
            email: CONTACT_EMAIL,
            url: `${base}/developers`,
            availableLanguage: ["ko", "en"],
            areaServed: "KR",
          },
        ],
        sameAs: [SOURCE_REPOSITORY],
        knowsLanguage: ["ko", "en"],
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: SITE_NAME,
        alternateName: SITE_NAME_EN,
        description: SITE_TAGLINE,
        inLanguage: "ko-KR",
        publisher: { "@id": `${base}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${base}/api/branches/search?keyword={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${base}/#webapp`,
        name: SITE_NAME,
        alternateName: SITE_NAME_EN,
        url: base,
        description: SITE_TAGLINE,
        applicationCategory: "ShoppingApplication",
        applicationSubCategory: "Store locator and in-store stock lookup",
        browserRequirements: "Requires JavaScript for interactive search.",
        operatingSystem: "All",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "KRW",
          availability: "https://schema.org/InStock",
          url: base,
        },
        featureList: [
          "다이소 매장 키워드 검색",
          "GPS 기반 주변 매장 검색",
          "매장별 상품 재고 및 가격 조회",
          "상품 진열 층·구역 안내",
          "무료 공개 REST API 및 MCP 서버",
        ],
        softwareHelp: { "@type": "CreativeWork", url: `${base}/developers` },
        isAccessibleForFree: true,
        inLanguage: "ko-KR",
        publisher: { "@id": `${base}/#organization` },
        provider: { "@id": `${base}/#organization` },
        audience: {
          "@type": "Audience",
          audienceType: "Korean shoppers",
          geographicArea: { "@type": "Country", name: "South Korea" },
        },
        keywords: branchSearchKeywords.join(", "),
      },
    ],
  };
}
