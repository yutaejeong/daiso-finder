import { BranchResponse } from "../types";

export async function GET(
  _request: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/ms/msg/selStr`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inclusiveStrCd: code,
        }),
      },
    );

    const responseText = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "매장 정보를 불러오는 중 오류가 발생했습니다.",
          detail: responseText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data: BranchResponse = JSON.parse(responseText);
    const branch = data.data[0];

    if (!branch) {
      return new Response(
        JSON.stringify({
          error: "매장 정보를 찾을 수 없습니다.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        code: branch.strCd,
        name: branch.strNm,
        lat: branch.strLttd,
        lng: branch.strLitd,
        address: branch.strAddr,
        openTime: branch.opngTime,
        closeTime: branch.clsngTime,
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
