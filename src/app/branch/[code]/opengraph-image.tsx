import { fetchBranchByCode } from "@/lib/daisoBranches";
import { formatDaisoBranchName } from "@/lib/branchNames";
import {
  createDaisoOgImage,
  ogImageContentType,
  ogImageSize,
} from "@/lib/ogImage";
import { popularBranches } from "@/lib/seoBranches";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "다이소 지점 상품 찾기";
export const runtime = "nodejs";

export default async function Image({ params }: { params: { code: string } }) {
  const fallbackBranch = popularBranches.find(
    (item) => item.code === params.code,
  );
  const branch = fallbackBranch
    ? null
    : await fetchBranchByCode(params.code).catch(() => null);
  const branchName = branch?.name ?? fallbackBranch?.name ?? "매장";
  const branchLabel = formatDaisoBranchName(branchName);

  return createDaisoOgImage({
    eyebrow: "지점별 상품 검색",
    title: `${branchLabel}\n상품 찾기`,
    subtitle: "매장 재고, 가격, 진열 위치를 한 번에 확인하세요.",
    badge: "상품 검색",
    footer: `/branch/${params.code}`,
  });
}
