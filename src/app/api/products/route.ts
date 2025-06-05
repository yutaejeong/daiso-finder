import { NextRequest, NextResponse } from "next/server";
import {
  Product,
  ProductEquippingResponse,
  ProductResponse,
  ProductStockResponse,
  SimplifiedProduct,
} from "./types";
import { headers } from "next/headers";

async function searchProductsByKeyword(
  keyword: string | null,
  currentPage: number,
) {
  if (keyword === null || isNaN(currentPage)) {
    return [];
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/pdo/pdThumbSelSimple`,
    {
      method: "POST",
      body: JSON.stringify({
        searchText: keyword,
        currentPage: currentPage || 1,
        pageSize: 10,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data: ProductResponse = await response.json();

  return data.data;
}

async function checkProductStock(products: Product[], branchCode: string) {
  const payload = products.map((product) => ({
    pdNo: product.pdNo,
    strCd: branchCode,
  }));

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/pdo/selOfflStrStck`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data: ProductStockResponse = await response.json();

  return data.data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");
    const currentPage = parseInt(searchParams.get("currentPage") || "1");
    const branchCode = searchParams.get("branchCode");

    if (!branchCode) {
      throw new Error("branchCode가 필요합니다.");
    }

    const products = await searchProductsByKeyword(keyword, currentPage);
    const stock = await checkProductStock(products, branchCode);
    const existingProducts = (
      await Promise.all(
        products
          .map((product) => ({
          id: product.pdNo,
          name: product.pdNm,
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
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/pdo/selPdStDispInfo`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    pdNo: product.id,
                    strCd: branchCode,
                  }),
                  headers: {
                    "Content-Type": "application/json",
                  },
                },
              );
              const data: ProductEquippingResponse = await response.json();
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
    return new Response(
      JSON.stringify({
        products: existingProducts,
        hasMore: products.length === 10,
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
      JSON.stringify({ error: "서버 오류가 발생했습니다." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
