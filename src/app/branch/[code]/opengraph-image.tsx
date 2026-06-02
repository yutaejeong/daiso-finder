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

export default async function Image({ params }: { params: { code: string } }) {
  const branch = await fetchBranchByCode(params.code).catch(() => null);
  const fallbackBranch = popularBranches.find(
    (item) => item.code === params.code,
  );
  const branchName = branch?.name ?? fallbackBranch?.name ?? "매장";
  const branchLabel = formatDaisoBranchName(branchName);

  return createDaisoOgImage({
    eyebrow: "지점별 상품 검색",
    title: `${branchLabel}\n에서 물건을 찾아보세요!`,
    subtitle: "재고, 가격, 진열 위치를 확인하세요.",
    badge: "지점 검색",
    footer: `/branch/${params.code}`,
  });
}
