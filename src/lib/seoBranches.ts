export type PopularBranch = {
  code: string;
  name: string;
  city: string;
  district: string;
  address: string;
  keywords: string[];
};

export const popularBranches: PopularBranch[] = [
  {
    code: "11199",
    name: "강남역점",
    city: "서울",
    district: "강남",
    address: "서울특별시 강남구 강남대로 422 (역삼동)",
    keywords: ["다이소 강남역", "강남 다이소", "강남역 다이소 재고"],
  },
  {
    code: "10528",
    name: "명동본점",
    city: "서울",
    district: "명동",
    address: "서울특별시 중구 명동길 43 (명동1가)",
    keywords: ["다이소 명동", "명동 다이소", "명동 다이소 상품 위치"],
  },
  {
    code: "10962",
    name: "홍대입구점",
    city: "서울",
    district: "홍대",
    address: "서울특별시 마포구 홍익로 25 (서교동)",
    keywords: ["다이소 홍대", "홍대입구 다이소", "홍대 다이소 재고"],
  },
  {
    code: "10595",
    name: "신촌본점",
    city: "서울",
    district: "신촌",
    address: "서울특별시 마포구 신촌로 90 (노고산동)",
    keywords: ["다이소 신촌", "신촌 다이소", "신촌 다이소 재고 확인"],
  },
  {
    code: "10087",
    name: "잠실점",
    city: "서울",
    district: "잠실",
    address: "서울특별시 송파구 석촌호수로 88 (잠실동)",
    keywords: ["다이소 잠실", "잠실 다이소", "잠실 다이소 상품 찾기"],
  },
  {
    code: "11015",
    name: "서울역점",
    city: "서울",
    district: "서울역",
    address: "서울특별시 중구 한강대로 405(봉래동2가)",
    keywords: ["다이소 서울역", "서울역 다이소", "서울역 다이소 재고"],
  },
  {
    code: "10440",
    name: "부산서면점",
    city: "부산",
    district: "서면",
    address: "부산광역시 부산진구 중앙대로702번길 43 (부전동)",
    keywords: ["다이소 서면", "부산 서면 다이소", "서면 다이소 재고"],
  },
  {
    code: "10502",
    name: "부산해운대점",
    city: "부산",
    district: "해운대",
    address: "부산광역시 해운대구 구남로 11 (우동)",
    keywords: ["다이소 해운대", "부산 해운대 다이소", "해운대 다이소 상품 위치"],
  },
  {
    code: "10610",
    name: "대구동성로본점",
    city: "대구",
    district: "동성로",
    address: "대구광역시 중구 동성로 48-1 (동성로2가)",
    keywords: ["다이소 동성로", "대구 동성로 다이소", "동성로 다이소 재고"],
  },
  {
    code: "10626",
    name: "대전본점",
    city: "대전",
    district: "동구",
    address: "대전광역시 동구 동서대로1695번길 8 (용전동)",
    keywords: ["다이소 대전", "대전본점 다이소", "대전 다이소 재고"],
  },
  {
    code: "11042",
    name: "광주광천점",
    city: "광주",
    district: "광천",
    address: "광주 서구 죽봉대로 122",
    keywords: ["다이소 광주", "광주광천 다이소", "광주 다이소 재고 확인"],
  },
  {
    code: "10152",
    name: "제주본점",
    city: "제주",
    district: "제주시",
    address: "제주특별자치도 제주시 남광로 220 (건입동)",
    keywords: ["다이소 제주", "제주본점 다이소", "제주 다이소 상품 찾기"],
  },
];

export const branchSearchKeywords = [
  "다이소 상품 찾기",
  "다이소 재고 확인",
  "다이소 상품 재고",
  "다이소 매장 재고",
  "다이소 매장 찾기",
  "다이소 영업시간",
  "다이소 상품 위치",
  "다이소 진열 위치",
  "다이소 층별 위치",
  "다이소 구역 찾기",
];
