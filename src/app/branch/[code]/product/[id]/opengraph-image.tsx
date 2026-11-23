import { fetchBranchByCode } from "@/lib/daisoBranches";
import { fetchProductById } from "@/lib/daisoProducts";
import { formatDaisoBranchName } from "@/lib/branchNames";
import {
  createProductOgImage,
  ogImageContentType,
  ogImageSize,
} from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "다이소 매장 상품 상세 재고·위치";
export const runtime = "nodejs";

export default async function Image({
  params,
}: {
  params: { code: string; id: string };
}) {
  const [branch, product] = await Promise.all([
    fetchBranchByCode(params.code).catch(() => null),
    fetchProductById(params.id).catch(() => null),
  ]);

  const branchLabel = branch
    ? formatDaisoBranchName(branch.name)
    : "다이소 매장";
  const productName = product?.name ?? "다이소 상품";

  return createProductOgImage({
    branchName: branchLabel,
    productName,
    price: product?.price ?? null,
    productImageUrl: product?.image ?? null,
    footer: `daiso-finder.kr/branch/${params.code}`,
  });
}
