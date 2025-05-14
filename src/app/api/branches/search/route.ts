import { BranchResponse } from "./types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");
    const currentPage = searchParams.get("currentPage");
    const pageSize = searchParams.get("pageSize");
    const pageIndex = searchParams.get("pageIndex");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/ms/msg/selStr`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
          currentPage: currentPage || 1,
          pageSize: pageSize || 10,
          pageIndex: pageIndex || 0,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data: BranchResponse = await response.json();

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
