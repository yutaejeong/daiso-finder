import { buildOpenApiDocument } from "@/lib/openapi";
import { getBaseUrl } from "@/lib/site";
import { toYaml } from "@/lib/yaml";

function resolveBaseUrl(request: Request) {
  // 프리뷰 배포처럼 NEXT_PUBLIC_APP_URL 과 실제 호스트가 다를 수 있으므로
  // 요청 origin 을 우선 사용하고, 없을 때만 설정값으로 떨어진다.
  try {
    return new URL(request.url).origin;
  } catch {
    return getBaseUrl();
  }
}

const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=86400";

export function openApiJsonResponse(request: Request) {
  const document = buildOpenApiDocument(resolveBaseUrl(request));

  return new Response(`${JSON.stringify(document, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": CACHE_CONTROL,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function openApiYamlResponse(request: Request) {
  const document = buildOpenApiDocument(resolveBaseUrl(request));

  return new Response(toYaml(document as never), {
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": CACHE_CONTROL,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
