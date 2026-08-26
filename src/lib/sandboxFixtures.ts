import type { SimplifiedBranch } from "@/app/api/branches/types";
import type { SimplifiedProduct } from "@/app/api/products/types";

/**
 * 샌드박스 고정 데이터. 외부 다이소 API 를 전혀 호출하지 않으며
 * 응답 형태는 실제 엔드포인트와 동일하다. 값이 바뀌지 않으므로
 * 에이전트가 통합 테스트의 기대값으로 사용할 수 있다.
 */
export const SANDBOX_STORES: SimplifiedBranch[] = [
  {
    code: "11199",
    name: "강남역점",
    lat: 37.497175,
    lng: 127.027926,
    address: "서울특별시 강남구 강남대로 422 (역삼동)",
    openTime: "10:00",
    closeTime: "22:00",
  },
  {
    code: "10528",
    name: "명동본점",
    lat: 37.563692,
    lng: 126.98269,
    address: "서울특별시 중구 명동길 43 (명동1가)",
    openTime: "10:00",
    closeTime: "22:00",
  },
  {
    code: "10962",
    name: "홍대입구점",
    lat: 37.556862,
    lng: 126.923363,
    address: "서울특별시 마포구 홍익로 25 (서교동)",
    openTime: "10:00",
    closeTime: "23:00",
  },
];

export const SANDBOX_PRODUCTS: SimplifiedProduct[] = [
  {
    id: "1019373",
    name: "다용도 수세미 3입",
    price: 1000,
    image: null,
    stock: 12,
    stairNo: 1,
    zoneNo: 4,
  },
  {
    id: "1024881",
    name: "실리콘 주방장갑",
    price: 3000,
    image: null,
    stock: 5,
    stairNo: 2,
    zoneNo: 7,
  },
  {
    id: "1031244",
    name: "microfiber 청소포 10매",
    price: 2000,
    image: null,
    stock: 30,
    stairNo: 1,
    zoneNo: 5,
  },
];

export function findSandboxStore(code: string) {
  return SANDBOX_STORES.find((store) => store.code === code) ?? null;
}

export function filterSandboxStores(keyword: string) {
  const needle = keyword.trim();

  if (!needle) {
    return SANDBOX_STORES;
  }

  const matches = SANDBOX_STORES.filter(
    (store) => store.name.includes(needle) || store.address.includes(needle),
  );

  // 어떤 키워드로도 빈 배열만 받으면 통합 테스트가 어려워지므로
  // 매칭되는 매장이 없으면 전체 목록을 돌려준다.
  return matches.length > 0 ? matches : SANDBOX_STORES;
}

export function filterSandboxProducts(keyword: string) {
  const needle = keyword.trim().toLowerCase();
  const matches = SANDBOX_PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(needle),
  );

  return matches.length > 0 ? matches : SANDBOX_PRODUCTS;
}
