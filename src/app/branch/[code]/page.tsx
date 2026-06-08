import { SimplifiedBranch } from "@/app/api/branches/types";
import { formatDaisoBranchName } from "@/lib/branchNames";
import { fetchBranchByCode } from "@/lib/daisoBranches";
import { branchSearchKeywords, popularBranches } from "@/lib/seoBranches";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BranchClient } from "./BranchClient";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://daiso-finder.kr").replace(
    /\/$/,
    "",
  );
}

async function getBranch(code: string): Promise<SimplifiedBranch | null> {
  return fetchBranchByCode(code);
}

function getBranchSeo(code: string, branch: SimplifiedBranch | null) {
  const popularBranch = popularBranches.find((item) => item.code === code);
  const branchName = branch?.name ?? popularBranch?.name;
  const branchLabel = branchName
    ? formatDaisoBranchName(branchName)
    : "다이소 지점";
  const localKeywords = popularBranch?.keywords ?? [
    ...(branch
      ? [
          `다이소 ${branch.name}`,
          `${branch.name} 다이소`,
          `${branch.name} 재고 확인`,
        ]
      : [
          "다이소 지점 상품 찾기",
          "다이소 매장 상품 검색",
          `다이소 매장 ${code}`,
        ]),
  ];
  const title = `${branchLabel} 상품 찾기`;
  const description = `${branchLabel}에서 상품 재고, 가격, 진열 위치를 확인하세요.`;
  const url = `${getBaseUrl()}/branch/${code}`;
  const imageUrl = `${url}/opengraph-image`;

  return {
    branchLabel,
    localKeywords,
    title,
    description,
    url,
    imageUrl,
    hasKnownBranch: Boolean(branch || popularBranch),
  };
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

  const seo = getBranchSeo(params.code, branch);

  return {
    title: seo.title,
    description: seo.description,
    keywords: [
      ...seo.localKeywords,
      ...branchSearchKeywords,
      ...(branch
        ? [
            `${branch.name} 상품 찾기`,
            `${branch.name} 상품 위치`,
            `${branch.name} 영업시간`,
          ]
        : []),
    ],
    alternates: { canonical: seo.url },
    robots: seo.hasKnownBranch
      ? undefined
      : {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        },
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
      siteName: "다이소 파인더",
      locale: "ko_KR",
      url: seo.url,
      images: [
        {
          url: seo.imageUrl,
          width: 1200,
          height: 630,
          alt: `${seo.branchLabel} 상품 찾기`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.imageUrl],
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

  const seo = getBranchSeo(params.code, branch);

  const jsonLd = branch
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Store",
            "@id": `${seo.url}#store`,
            name: seo.branchLabel,
            description: `${seo.branchLabel}에서 상품 재고, 가격, 진열 위치를 확인할 수 있습니다.`,
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
            url: seo.url,
            keywords: [...seo.localKeywords, ...branchSearchKeywords].join(
              ", ",
            ),
            parentOrganization: {
              "@type": "Organization",
              name: "다이소",
              url: "https://www.daisomall.co.kr",
            },
          },
          {
            "@type": "WebPage",
            "@id": `${seo.url}#webpage`,
            url: seo.url,
            name: `${seo.branchLabel} 상품 찾기`,
            description: `${seo.branchLabel}에서 상품 재고, 가격, 진열 위치를 확인할 수 있습니다.`,
            inLanguage: "ko-KR",
            about: { "@id": `${seo.url}#store` },
            keywords: [...seo.localKeywords, ...branchSearchKeywords].join(
              ", ",
            ),
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${seo.url}#breadcrumb`,
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
                name: seo.branchLabel,
                item: seo.url,
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
