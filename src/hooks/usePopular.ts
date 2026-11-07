"use client";

import { useQuery } from "@tanstack/react-query";
import type { PopularBranch, PopularList, PopularProduct } from "@/lib/popular";

/**
 * 인기 순위는 매시간 갱신되고 화면의 부가 정보다. 탭 복귀나 재마운트마다 다시
 * 부르지 않고, 실패해도 오류 화면 없이 목록만 비운다.
 */
const POPULAR_QUERY_OPTIONS = {
  staleTime: 10 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: false,
  meta: { suppressGlobalError: true },
} as const;

async function fetchList<T>(path: string): Promise<PopularList<T>> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`인기 순위를 불러오지 못했습니다. (${response.status})`);
  }
  return response.json();
}

/** 최근 많이 본 매장. `enabled` 가 false 면 요청하지 않는다. */
export function usePopularBranches(enabled: boolean, limit = 8) {
  return useQuery<PopularList<PopularBranch>>({
    queryKey: ["popular", "branches", limit],
    queryFn: () => fetchList(`/api/popular/branches?limit=${limit}`),
    enabled,
    ...POPULAR_QUERY_OPTIONS,
  });
}

/** 한 매장에서 최근 많이 본 상품. */
export function usePopularProducts(
  branchCode: string,
  enabled: boolean,
  limit = 6,
) {
  return useQuery<PopularList<PopularProduct>>({
    queryKey: ["popular", "products", branchCode, limit],
    queryFn: () =>
      fetchList(
        `/api/popular/products?branchCode=${encodeURIComponent(branchCode)}&limit=${limit}`,
      ),
    enabled,
    ...POPULAR_QUERY_OPTIONS,
  });
}
