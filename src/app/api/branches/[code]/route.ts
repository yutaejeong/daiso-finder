import { DaisoBranchApiError, fetchBranchByCode } from "@/lib/daisoBranches";

export async function GET(
  _request: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code;

  try {
    const branch = await fetchBranchByCode(code);

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

    return new Response(JSON.stringify(branch), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof DaisoBranchApiError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          detail: error.detail,
        }),
        {
          status: error.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

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
