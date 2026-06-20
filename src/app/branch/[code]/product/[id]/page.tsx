import { SimplifiedBranch } from "@/app/api/branches/types";
import { formatDaisoBranchName } from "@/lib/branchNames";
import { fetchBranchByCode } from "@/lib/daisoBranches";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductClient } from "./ProductClient";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://daiso-finder.kr").replace(
    /\/$/,
    "",
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

type SearchParams = { [key: string]: string | string[] | undefined };

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { code: string; id: string };
  searchParams: SearchParams;
}): Promise<Metadata> {
  const branch = await fetchBranchByCode(params.code).catch(() => null);
  const branchLabel = branch
    ? formatDaisoBranchName(branch.name)
    : "다이소 지점";
  const productName = firstParam(searchParams.name) ?? "상품";
  const title = `${productName} - ${branchLabel} 재고·위치`;
  const description = `${branchLabel}의 ${productName} 재고와 진열 위치를 확인하고, 해당 상품이 있는 다른 지점도 함께 살펴보세요.`;
  const url = `${getBaseUrl()}/branch/${params.code}/product/${params.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "다이소 파인더",
      locale: "ko_KR",
      url,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: { code: string; id: string };
  searchParams: SearchParams;
}) {
  const branch: SimplifiedBranch | null = await fetchBranchByCode(
    params.code,
  ).catch(() => null);

  if (!branch) {
    notFound();
  }

  const name = firstParam(searchParams.name);
  const image = firstParam(searchParams.image) ?? null;
  const priceRaw = firstParam(searchParams.price);
  const stockRaw = firstParam(searchParams.stock);
  const stairRaw = firstParam(searchParams.stairNo);
  const zoneRaw = firstParam(searchParams.zoneNo);

  const toNumber = (value: string | undefined): number | null => {
    if (value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  return (
    <ProductClient
      code={params.code}
      productId={params.id}
      branch={branch}
      name={name ?? null}
      image={image}
      price={toNumber(priceRaw)}
      initialStock={toNumber(stockRaw)}
      initialStairNo={toNumber(stairRaw)}
      initialZoneNo={toNumber(zoneRaw)}
    />
  );
}
