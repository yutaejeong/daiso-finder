const ko = {
  common: {
    logoAlt: "다이소 파인더 로고",
    homeAriaLabel: "다이소 파인더 홈으로 이동",
    confirm: "확인",
    error: "오류",
    languageSelectorLabel: "언어 선택",
    defaultErrorMessage: "오류가 발생했습니다. 다시 시도해주세요.",
  },
  home: {
    heading: "당신이 있는 매장의 상품을 찾아드립니다",
    searchTitle: "매장을 선택해주세요",
    searchPlaceholder: "주소 혹은 지점명을 입력하세요",
    branchSearchError: "매장 검색 중 오류가 발생했습니다.",
  },
  branch: {
    headingBefore: "",
    headingAfter: "의 상품을 찾아드려요.",
    address: "주소",
    openingHours: "영업시간",
    productSearchTitle: "상품을 검색해보세요",
    productSearchPlaceholder: "상품명을 입력해주세요",
    stockLessThan: "재고 {count}개 이하",
    priceFormat: "{price}원",
    floorBelow: "B{n}",
    floorAbove: "{n}F",
    shelfAriaLabel: "진열 위치: {floor} {zone}구역",
    floorBelowSpoken: "지하{n}층",
    floorAboveSpoken: "{n}층",
    branchLoadError: "매장 정보를 불러오는 중 오류가 발생했습니다.",
    productLoadError: "상품 검색 중 오류가 발생했습니다.",
  },
  search: {
    searching: "검색 중...",
    noResults: "검색 결과가 없습니다",
    promptInput: "검색어를 입력해주세요",
    loadMore: "더 보기",
    loadingMore: "로딩 중...",
  },
  location: {
    unsupported: "이 브라우저는 위치 정보를 지원하지 않습니다.",
    fallback: "위치 정보를 가져오는데 실패했습니다.",
    permissionDenied:
      "위치 정보 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 정보 권한을 허용해주세요.",
    positionUnavailable:
      "위치 정보를 사용할 수 없습니다. GPS가 켜져있는지 확인하거나, 잠시 후 다시 시도해주세요.",
    timeout: "위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요.",
    unknown: "위치 정보 오류: {message}",
    unknownFallback: "알 수 없는 오류가 발생했습니다.",
    retry: "위치 정보를 가져오는데 실패했습니다. 다시 시도해주세요.",
  },
};

export default ko;
export type Translation = typeof ko;
