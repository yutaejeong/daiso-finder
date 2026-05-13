import { SimplifiedBranch } from "@/app/api/branches/types";
import { fetchBranchByCode } from "@/lib/daisoBranches";
import { branchSearchKeywords, popularBranches } from "@/lib/seoBranches";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BranchClient } from "./BranchClient";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function getBranch(code: string): Promise<SimplifiedBranch | null> {
  return fetchBranchByCode(code);
}

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const branch = await getBranch(params.code).catch((error) => {
    console.error("매장 메타데이터 조회 오류:", error);
    return null;
  });

  if (!branch) {
    return { title: "매장 정보를 찾을 수 없습니다" };
  }

  const title = `${branch.name} 상품 재고 확인`;
  const popularBranch = popularBranches.find(
    (item) => item.code === params.code,
  );
  const localKeywords = popularBranch?.keywords ?? [
    `다이소 ${branch.name}`,
    `${branch.name} 다이소`,
    `${branch.name} 재고 확인`,
  ];
  const description = `${branch.name}(${branch.address}) 다이소 매장의 상품 재고, 가격, 층별 진열 위치를 확인하세요. 영업시간 ${branch.openTime} ~ ${branch.closeTime}`;
  const url = `${getBaseUrl()}/branch/${params.code}`;

  return {
    title,
    description,
    keywords: [
      ...localKeywords,
      ...branchSearchKeywords,
      `${branch.name} 상품 찾기`,
      `${branch.name} 상품 위치`,
      `${branch.name} 영업시간`,
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: [
        {
          url: "/ms-icon-310x310.png",
          width: 310,
          height: 310,
          alt: `다이소 ${branch.name}`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function BranchPage({
  params,
}: {
  params: { code: string };
}) {
  const branch = await getBranch(params.code);

  if (!branch) {
    notFound();
  }

  const popularBranch = popularBranches.find(
    (item) => item.code === params.code,
  );
  const localKeywords = popularBranch?.keywords ?? [
    `다이소 ${branch.name}`,
    `${branch.name} 다이소`,
    `${branch.name} 재고 확인`,
  ];
  const pageUrl = `${getBaseUrl()}/branch/${params.code}`;

  const jsonLd = branch
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Store",
            "@id": `${pageUrl}#store`,
            name: `다이소 ${branch.name}`,
            description: `다이소 ${branch.name} 매장의 상품 재고, 가격, 진열 위치, 영업시간 정보`,
            address: {
              "@type": "PostalAddress",
              streetAddress: branch.address,
              addressCountry: "KR",
            },
            openingHours: `Mo-Su ${branch.openTime}-${branch.closeTime}`,
            geo: {
              "@type": "GeoCoordinates",
              latitude: branch.lat,
              longitude: branch.lng,
            },
            url: pageUrl,
            keywords: [...localKeywords, ...branchSearchKeywords].join(", "),
            parentOrganization: {
              "@type": "Organization",
              name: "다이소",
              url: "https://www.daisomall.co.kr",
            },
          },
          {
            "@type": "WebPage",
            "@id": `${pageUrl}#webpage`,
            url: pageUrl,
            name: `${branch.name} 다이소 상품 재고 확인`,
            description: `${branch.name} 매장의 다이소 상품 재고, 가격, 층별 진열 위치를 확인하세요.`,
            inLanguage: "ko-KR",
            about: { "@id": `${pageUrl}#store` },
            keywords: [...localKeywords, ...branchSearchKeywords].join(", "),
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${pageUrl}#breadcrumb`,
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "다이소 파인더",
                item: getBaseUrl(),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: `다이소 ${branch.name}`,
                item: pageUrl,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BranchClient code={params.code} initialBranch={branch} />
    </>
  );
}
