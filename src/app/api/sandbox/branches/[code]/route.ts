import { notFound } from "@/lib/apiError";
import { findSandboxStore } from "@/lib/sandboxFixtures";

export function GET(
  _request: Request,
  { params }: { params: { code: string } },
) {
  const store = findSandboxStore(params.code);

  if (!store) {
    return notFound(
      "매장 정보를 찾을 수 없습니다.",
      `No sandbox store matches the store code "${params.code}".`,
      "Sandbox store codes are 11199, 10528, and 10962.",
    );
  }

  return Response.json(store, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
