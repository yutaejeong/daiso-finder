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

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data: BranchResponse = await response.json();

    return new Response(
      JSON.stringify({
        code: data.data[0].strCd,
        name: data.data[0].strNm,
        lat: data.data[0].strLttd,
        lng: data.data[0].strLitd,
        address: data.data[0].strAddr,
        openTime: data.data[0].opngTime,
        closeTime: data.data[0].clsngTime,
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
