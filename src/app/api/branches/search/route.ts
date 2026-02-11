import { BranchResponse } from "../types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const currentPage = searchParams.get("currentPage");
    const pageSize = searchParams.get("pageSize");
    const curLttd = searchParams.get("curLttd");
    const curLitd = searchParams.get("curLitd");

    const hasLocation = curLttd && curLitd;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/ms/msg/selStr`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
          ...(hasLocation && {
            curLttd: parseFloat(curLttd),
            curLitd: parseFloat(curLitd),
            geolocationAgrYn: "Y",
          }),
          srchBassPkupStrYn: "Y",
          srchYn: "N",
          currentPage: currentPage ? parseInt(currentPage) : 1,
          pageSize: pageSize ? parseInt(pageSize) : 10,
        }),
      },
    );

    const responseText = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "매장 검색 중 오류가 발생했습니다.",
          detail: responseText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data: BranchResponse = JSON.parse(responseText);

    return new Response(
      JSON.stringify(
        data.data.map((branch) => ({
          code: branch.strCd,
          name: branch.strNm,
          lat: branch.strLttd,
          lng: branch.strLitd,
          address: branch.strAddr,
          openTime: branch.opngTime,
          closeTime: branch.clsngTime,
        })),
      ),
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
