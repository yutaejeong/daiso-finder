import { SimplifiedBranch } from "@/app/api/branches/types";
import { formatDaisoBranchName } from "@/lib/branchNames";
import { fetchBranchByCode } from "@/lib/daisoBranches";
import { branchSearchKeywords, popularBranches } from "@/lib/seoBranches";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BranchClient } from "./BranchClient";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://daiso-finder.kr"
  ).replace(/\/$/, "");
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

  const branchLabel = formatDaisoBranchName(branch.name);
  const title = `${branchLabel} 상품 찾기`;
  const popularBranch = popularBranches.find(
    (item) => item.code === params.code,
  );
  const localKeywords = popularBranch?.keywords ?? [
    `다이소 ${branch.name}`,
    `${branch.name} 다이소`,
    `${branch.name} 재고 확인`,
  ];
  const description = `${branchLabel}에서 물건을 찾아보세요! 재고, 가격, 진열 위치를 확인할 수 있습니다.`;
  const url = `${getBaseUrl()}/branch/${params.code}`;
  const imageUrl = `${url}/opengraph-image`;

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
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${branchLabel}에서 물건을 찾아보세요!`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
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
  const branchLabel = formatDaisoBranchName(branch.name);
  const pageUrl = `${getBaseUrl()}/branch/${params.code}`;

  const jsonLd = branch
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Store",
            "@id": `${pageUrl}#store`,
            name: branchLabel,
            description: `${branchLabel}에서 상품 재고, 가격, 진열 위치를 확인할 수 있습니다.`,
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
            name: `${branchLabel} 상품 찾기`,
            description: `${branchLabel}에서 물건을 찾아보세요! 재고, 가격, 진열 위치를 확인할 수 있습니다.`,
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
                name: branchLabel,
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
