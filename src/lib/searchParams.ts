/**
 * 검색 조건을 URL 쿼리스트링으로 주고받는 유틸.
 *
 * 검색 조건을 컴포넌트 state 에만 두면 상세 페이지로 이동했다가 뒤로가기로
 * 돌아왔을 때 초기화된다. 조건을 URL 에 담아 두면 뒤로/앞으로 가기가 브라우저
 * 히스토리만으로 복원되고, 검색 결과 링크를 그대로 공유할 수도 있다.
 */

/**
 * 매장 검색 방식. 키워드 검색과 위치 검색이 서로를 덮어쓰지 않도록
 * 하나의 상태로 관리하고, 그대로 React Query 키로 사용한다.
 */
export type BranchSearchMode =
  | { type: "keyword"; keyword: string }
  | { type: "location"; lat: number; lng: number };

export const KEYWORD_PARAM = "q";
export const LAT_PARAM = "lat";
export const LNG_PARAM = "lng";

/** URL 에 담는 좌표 소수 자릿수. 6 자리면 10cm 수준이라 매장 검색에는 충분하다. */
const COORDINATE_DIGITS = 6;

export function parseSearchKeyword(params: URLSearchParams): string {
  return params.get(KEYWORD_PARAM)?.trim() ?? "";
}

export function searchKeywordToParams(keyword: string): URLSearchParams {
  const params = new URLSearchParams();
  const trimmed = keyword.trim();
  if (trimmed) {
    params.set(KEYWORD_PARAM, trimmed);
  }
  return params;
}

export function parseBranchSearchMode(
  params: URLSearchParams,
): BranchSearchMode | null {
  const keyword = parseSearchKeyword(params);
  if (keyword) {
    return { type: "keyword", keyword };
  }

  const lat = Number.parseFloat(params.get(LAT_PARAM) ?? "");
  const lng = Number.parseFloat(params.get(LNG_PARAM) ?? "");
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { type: "location", lat, lng };
  }

  return null;
}

export function branchSearchModeToParams(
  mode: BranchSearchMode,
): URLSearchParams {
  if (mode.type === "keyword") {
    return searchKeywordToParams(mode.keyword);
  }

  const params = new URLSearchParams();
  params.set(LAT_PARAM, mode.lat.toFixed(COORDINATE_DIGITS));
  params.set(LNG_PARAM, mode.lng.toFixed(COORDINATE_DIGITS));
  return params;
}
