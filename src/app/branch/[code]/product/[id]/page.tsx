import { SimplifiedBranch } from "@/app/api/branches/types";
import { SimplifiedProductInfo } from "@/app/api/products/types";
import { formatDaisoBranchName } from "@/lib/branchNames";
import { fetchBranchByCode } from "@/lib/daisoBranches";
import { fetchProductById } from "@/lib/daisoProducts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductClient } from "./ProductClient";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://daiso-finder.kr").replace(
    /\/$/,
    "",
  );
}

export async function generateMetadata({
  params,
}: {
  params: { code: string; id: string };
}): Promise<Metadata> {
  const [branch, product] = await Promise.all([
    fetchBranchByCode(params.code).catch(() => null),
    fetchProductById(params.id).catch(() => null),
  ]);

  const branchLabel = branch
    ? formatDaisoBranchName(branch.name)
    : "다이소 지점";
  const productName = product?.name ?? "상품";
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
      ...(product?.image ? { images: [{ url: product.image }] } : {}),
    },
    twitter: {
      card: product?.image ? "summary_large_image" : "summary",
      title,
      description,
      ...(product?.image ? { images: [product.image] } : {}),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { code: string; id: string };
}) {
  const [branch, product]: [
    SimplifiedBranch | null,
    SimplifiedProductInfo | null,
  ] = await Promise.all([
    fetchBranchByCode(params.code).catch(() => null),
    fetchProductById(params.id).catch(() => null),
  ]);

  if (!branch) {
    notFound();
  }

  return (
    <ProductClient
      code={params.code}
      productId={params.id}
      branch={branch}
      product={product}
    />
  );
}
