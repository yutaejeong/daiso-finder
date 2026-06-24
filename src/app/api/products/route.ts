import { NextRequest } from "next/server";
import {
  pdThumbSelSimple,
  selOfflStrStckList,
  selPdStDispInfo,
} from "@/generated/daiso/client";
import {
  Product,
  ProductEquippingResponse,
  ProductResponse,
  ProductStockResponse,
  SimplifiedProduct,
} from "./types";

export const dynamic = "force-dynamic";

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (match, entity) => {
    switch (entity) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "apos":
      case "#39":
        return "'";
      case "nbsp":
        return " ";
      default:
        return match;
    }
  });
}

async function searchProductsByKeyword(
  keyword: string | null,
  currentPage: number,
) {
  if (keyword === null || isNaN(currentPage)) {
    return [];
  }

  const data = (await pdThumbSelSimple({
    searchText: keyword,
    currentPage: currentPage || 1,
    pageSize: 10,
  })) as unknown as ProductResponse;

  return data.data;
}

async function checkProductStock(products: Product[], branchCode: string) {
  const payload = products.map((product) => ({
    pdNo: product.pdNo,
    strCd: branchCode,
  }));

  const data = (await selOfflStrStckList(
    payload,
  )) as unknown as ProductStockResponse;

  return data.data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");
    const currentPage = parseInt(searchParams.get("currentPage") || "1");
    const branchCode =
      searchParams.get("branchCode") ?? searchParams.get("branchCd");

    if (!keyword?.trim()) {
      return new Response(
        JSON.stringify({
          error: "상품명을 입력해주세요.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!branchCode) {
      return new Response(
        JSON.stringify({
          error: "매장 정보가 필요합니다.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    let page = currentPage;
    let existingProducts: SimplifiedProduct[] = [];
    const seenProductIds = new Set<string>();
    let hasMore = true;

    while (hasMore) {
      const products = await searchProductsByKeyword(keyword, page);

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      const stock = await checkProductStock(products, branchCode);
      const pageProducts = (
        await Promise.all(
          products
            .map((product) => ({
              id: product.pdNo,
              name: decodeHtmlEntities(product.pdNm),
              price: parseInt(product.pdPrc),
              image: product.atchFileUrl
                ? `https://cdn.daisomall.co.kr${product.atchFileUrl}`
                : null,
              stock: (() => {
                const stockInfo = stock.find((s) => s.pdNo === product.pdNo);
                if (stockInfo) {
                  const stockNumber = parseInt(stockInfo.stck);
                  if (isNaN(stockNumber)) {
                    return 0;
                  }
                  return stockNumber;
                }
                return 0;
              })(),
            }))
            .filter((product) => product.stock > 0)
            .map(async (product) => {
              try {
                const data = (await selPdStDispInfo({
                  pdNo: product.id,
                  strCd: branchCode,
                })) as unknown as ProductEquippingResponse;
                return {
                  ...product,
                  stairNo: parseInt(data.data[0].stairNo),
                  zoneNo: parseInt(data.data[0].zoneNo),
                } satisfies SimplifiedProduct;
              } catch (error) {
                console.error("API 오류:", error);
                return null;
              }
            }),
        )
      ).filter((product): product is SimplifiedProduct => product !== null);

      const uniquePageProducts = pageProducts.filter((product) => {
        if (seenProductIds.has(product.id)) {
          return false;
        }

        seenProductIds.add(product.id);
        return true;
      });

      existingProducts = [...existingProducts, ...uniquePageProducts];

      // 외부 API 마지막 페이지면 더 이상 없음
      if (products.length < 10) {
        hasMore = false;
        break;
      }

      // 10개 이상 모이면 중단
      if (existingProducts.length >= 10) {
        hasMore = true;
        break;
      }

      page++;
    }

    return new Response(
      JSON.stringify({
        products: existingProducts,
        hasMore,
        nextPage: page + 1,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("API 오류:", error);
    return new Response(
      JSON.stringify({
        error: "서버 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
