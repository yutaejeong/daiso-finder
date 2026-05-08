import { SimplifiedBranch } from "@/app/api/branches/types";
import type { Metadata } from "next";
import { BranchClient } from "./BranchClient";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function getBranch(code: string): Promise<SimplifiedBranch | null> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/branches/${code}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const branch = await getBranch(params.code);

  if (!branch) {
    return { title: "매장 정보를 찾을 수 없습니다" };
  }

  const title = `${branch.name} 상품 재고 확인`;
  const description = `${branch.name}(${branch.address}) 다이소 매장의 상품 재고를 확인하세요. 영업시간 ${branch.openTime} ~ ${branch.closeTime}`;
  const url = `${getBaseUrl()}/branch/${params.code}`;

  return {
    title,
    description,
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

  const jsonLd = branch
    ? {
        "@context": "https://schema.org",
        "@type": "Store",
        name: branch.name,
        description: `다이소 ${branch.name} 매장`,
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
        url: `${getBaseUrl()}/branch/${params.code}`,
        parentOrganization: {
          "@type": "Organization",
          name: "다이소",
          url: "https://www.daisomall.co.kr",
        },
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
