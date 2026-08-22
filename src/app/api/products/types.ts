export interface Product {
  pdNo: string;
  pdNm: string;
  pdPrc: string;
  exhPdNm: string;
  atchFileUrl: string | null;
  totalCnt: number;
  currentPageCnt: number;
  onlyPkupYn: "Y" | "N";
  sleStsCd: string;
  newPdYn: "Y" | "N";
  optPdYn: "Y" | "N" | null;
  onlSclCd: string;
  pkupOrPsblYn: "Y" | "N";
  brndNm: string | null;
}

export interface ProductResponse {
  message: string | null;
  data: Product[];
  extraData: Record<string, unknown>;
  extraString: string | null;
  returnCode: string | null;
  success: boolean;
}

export interface ProductStock {
  pdNo: string;
  strCd: string;
  sleStsCd: string;
  stck: string;
}

export interface ProductStockResponse {
  returnCode: string | null;
  data: ProductStock[];
  extraData: Record<string, unknown>;
  success: boolean;
  extraString: string | null;
  message: string | null;
}

export interface ProductEquippingResponse {
  returnCode: string | null;
  data: ProductEquipping[];
  extraData: Record<string, unknown>;
  success: boolean;
  extraString: string | null;
  message: string | null;
}

export interface ProductEquipping {
  storeErp: string;
  stairNo: string;
  zoneNo: string;
}

export interface SimplifiedProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  stairNo: number;
  zoneNo: number;
}

export interface SimplifiedProductInfo {
  id: string;
  name: string;
  price: number;
  image: string | null;
  brand: string | null;
}

export interface ProductApiResponse {
  products: SimplifiedProduct[];
  hasMore: boolean;
  nextPage: number;
}

export interface OtherBranchStock {
  code: string;
  name: string;
  address: string;
  stock: number;
  distanceKm: number | null;
}

export interface ProductDetailResponse {
  stock: number;
  stairNo: number | null;
  zoneNo: number | null;
  otherBranches: OtherBranchStock[];
}

export interface ProductSearchProgress {
  /** 현재 응답 페이지에서 지금까지 확보한(현재 지점에 재고가 있는) 상품 수 */
  found: number;
  /** 한 페이지에 채우려는 목표 상품 수 */
  target: number;
  /** found / target 기반 진행률 (0~100) */
  percent: number;
  /** 현재 조회 중인 외부 API 페이지 번호 */
  page: number;
  /** 지금까지 검사한 검색 결과 상품 수 */
  scanned: number;
}

export type ProductStreamEvent =
  | ({ type: "progress" } & ProductSearchProgress)
  | ({ type: "result" } & ProductApiResponse)
  | { type: "error"; error: string; detail?: string };
