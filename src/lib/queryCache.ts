/**
 * 검색 결과 캐시 설정.
 *
 * 결과 목록에서 상세 페이지로 갔다가 뒤로 돌아오면 컴포넌트는 다시 마운트된다.
 * 이때 캐시가 살아 있어야 로딩 없이 보던 결과가 그대로 나온다. gcTime 은 화면에서
 * 사라진 뒤 캐시를 얼마나 들고 있을지, staleTime 은 다시 마운트됐을 때 조용히
 * 다시 불러올지를 정한다.
 */

const MINUTE = 60 * 1000;

/** 매장 검색. 매장 목록은 자주 바뀌지 않는다. */
export const BRANCH_SEARCH_CACHE = {
  staleTime: 5 * MINUTE,
  gcTime: 30 * MINUTE,
} as const;

/** 상품 검색. 재고 조회까지 거쳐 비싸므로 조금 더 오래 재사용한다. */
export const PRODUCT_SEARCH_CACHE = {
  staleTime: 10 * MINUTE,
  gcTime: 30 * MINUTE,
} as const;
