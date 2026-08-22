import { NextRequest } from "next/server";
import {
  pdThumbSelSimple,
  selOfflStrStckList,
  selPdStDispInfo,
} from "@/generated/daiso/client";
import {
  Product,
  ProductApiResponse,
  ProductEquippingResponse,
  ProductResponse,
  ProductSearchProgress,
  ProductStockResponse,
  ProductStreamEvent,
  SimplifiedProduct,
} from "./types";

export const dynamic = "force-dynamic";

/** 한 응답 페이지에 채우려는 상품 수. 진행률(10%씩)의 기준이 된다. */
const PAGE_TARGET = 10;

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
    pageSize: PAGE_TARGET,
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

async function collectProducts(
  keyword: string,
  currentPage: number,
  branchCode: string,
  onProgress?: (progress: ProductSearchProgress) => void,
): Promise<ProductApiResponse> {
  let page = currentPage;
  let existingProducts: SimplifiedProduct[] = [];
  const seenProductIds = new Set<string>();
  let hasMore = true;
  let scanned = 0;
  let found = 0;

  const report = () =>
    onProgress?.({
      found,
      target: PAGE_TARGET,
      percent: Math.min(100, Math.round((found / PAGE_TARGET) * 100)),
      page,
      scanned,
    });

  report();

  while (hasMore) {
    const products = await searchProductsByKeyword(keyword, page);

    if (products.length === 0) {
      hasMore = false;
      break;
    }

    const stock = await checkProductStock(products, branchCode);
    scanned += products.length;

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

              if (seenProductIds.has(product.id)) {
                return null;
              }
              seenProductIds.add(product.id);

              const equipped = {
                ...product,
                stairNo: parseInt(data.data[0].stairNo),
                zoneNo: parseInt(data.data[0].zoneNo),
              } satisfies SimplifiedProduct;

              // 현재 지점에 구비된 상품을 하나 확정할 때마다 진행률을 올린다.
              found += 1;
              report();

              return equipped;
            } catch (error) {
              console.error("API 오류:", error);
              return null;
            }
          }),
      )
    ).filter((product): product is SimplifiedProduct => product !== null);

    // Promise.all 은 완료 순서와 무관하게 배열 순서를 보존하므로 검색 결과 순서가 유지된다.
    existingProducts = [...existingProducts, ...pageProducts];

    // 외부 API 마지막 페이지면 더 이상 없음
    if (products.length < PAGE_TARGET) {
      hasMore = false;
      break;
    }

    // 10개 이상 모이면 중단
    if (existingProducts.length >= PAGE_TARGET) {
      hasMore = true;
      break;
    }

    page++;
    report();
  }

  return {
    products: existingProducts,
    hasMore,
    nextPage: page + 1,
  };
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");
  const currentPage = parseInt(searchParams.get("currentPage") || "1");
  const branchCode =
    searchParams.get("branchCode") ?? searchParams.get("branchCd");
  const wantsStream =
    searchParams.get("stream") === "1" ||
    (request.headers.get("accept") ?? "").includes("application/x-ndjson");

  if (!keyword?.trim()) {
    return errorResponse("상품명을 입력해주세요.", 400);
  }

  if (!branchCode) {
    return errorResponse("매장 정보가 필요합니다.", 400);
  }

  if (!wantsStream) {
    try {
      const result = await collectProducts(keyword, currentPage, branchCode);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: ProductStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // 클라이언트가 연결을 끊은 경우
          closed = true;
        }
      };

      try {
        const result = await collectProducts(
          keyword,
          currentPage,
          branchCode,
          (progress) => send({ type: "progress", ...progress }),
        );
        send({ type: "result", ...result });
      } catch (error) {
        console.error("API 오류:", error);
        send({
          type: "error",
          error: "서버 오류가 발생했습니다.",
          detail: error instanceof Error ? error.message : String(error),
        });
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
