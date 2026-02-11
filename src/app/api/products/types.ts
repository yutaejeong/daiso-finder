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

export interface ProductApiResponse {
  products: SimplifiedProduct[];
  hasMore: boolean;
  nextPage: number;
}
