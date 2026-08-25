import type { Metadata } from "next";
import {
  ContentPage,
  codeBlockClass,
  headingClass,
  listClass,
  paragraphClass,
  sectionClass,
} from "@/components/ContentPage";
import { MCP_TOOLS } from "@/lib/mcpTools";
import {
  CLI_PACKAGE_NAME,
  CONTACT_EMAIL,
  SITE_NAME,
  SITE_NAME_EN,
  SOURCE_REPOSITORY,
  getBaseUrl,
} from "@/lib/site";

const base = getBaseUrl();

export const metadata: Metadata = {
  title: `${SITE_NAME} 개발자 포털 — API·MCP·CLI`,
  description:
    "다이소 파인더 개발자 포털: 무료 키 없는 공개 REST API, OpenAPI 스펙, MCP 서버, CLI, 샌드박스 사용법.",
  alternates: { canonical: "/developers" },
  keywords: [
    "다이소 파인더 API",
    "Daiso Finder API",
    "다이소 재고 API",
    "Daiso Finder MCP server",
    "Daiso Finder OpenAPI",
    "Daiso Finder CLI",
  ],
};

const endpoints = [
  {
    method: "GET",
    path: "/api/branches/search",
    operationId: "searchStores",
    description: "키워드 또는 좌표로 매장 검색",
  },
  {
    method: "GET",
    path: "/api/branches/{code}",
    operationId: "getStore",
    description: "매장 코드로 단건 조회",
  },
  {
    method: "GET",
    path: "/api/products",
    operationId: "searchStoreProducts",
    description: "매장 내 재고 있는 상품 검색 (NDJSON 스트리밍 지원)",
  },
  {
    method: "GET",
    path: "/api/products/{id}",
    operationId: "getProductAvailability",
    description: "상품 단건의 재고·진열 위치와 주변 매장 재고",
  },
  {
    method: "GET",
    path: "/api",
    operationId: "getApiIndex",
    description: "전체 엔드포인트와 발견 문서 목록",
  },
  {
    method: "POST",
    path: "/api/mcp",
    operationId: "callMcp",
    description: "MCP Streamable HTTP JSON-RPC 엔드포인트",
  },
];

const resources = [
  { href: "/openapi.json", label: "OpenAPI 3.1 스펙 (JSON)" },
  { href: "/openapi.yaml", label: "OpenAPI 3.1 스펙 (YAML)" },
  { href: "/agent-instructions.md", label: "에이전트 사용 안내 (when-to-use)" },
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/.well-known/api-catalog", label: "RFC 9727 API 카탈로그" },
  { href: "/.well-known/mcp.json", label: "MCP 서버 매니페스트" },
  { href: "/.well-known/mcp/server-card.json", label: "MCP 서버 카드" },
  {
    href: "/.well-known/agent-skills/index.json",
    label: "에이전트 스킬 인덱스",
  },
  { href: "/api/sandbox", label: "샌드박스 API 루트" },
  { href: "/auth.md", label: "인증 정책 (auth.md)" },
];

export default function DevelopersPage() {
  return (
    <ContentPage
      title={`${SITE_NAME} 개발자 포털`}
      lead={`${SITE_NAME_EN} 는 API 키도, 가입도, 승인 절차도 없는 무료 공개 API 입니다. 아래 예제를 그대로 복사해 실행하면 바로 첫 응답을 받을 수 있습니다.`}
    >
      <section className={sectionClass}>
        <h2 className={headingClass}>1분 퀵스타트</h2>
        <p className={paragraphClass}>
          매장을 먼저 찾아 <code>code</code> 를 얻고, 그 코드를{" "}
          <code>branchCode</code> 로 넘겨 매장 안 상품 재고를 조회하는
          순서입니다.
        </p>
        <pre className={codeBlockClass}>
          <code>{`# 1. 매장 검색
curl "${base}/api/branches/search?keyword=강남"

# 2. 매장 코드로 상품 재고 검색
curl "${base}/api/products?branchCode=11199&keyword=수세미"

# 3. 상품 단건의 재고와 진열 위치
curl "${base}/api/products/1019373?branchCode=11199"`}</code>
        </pre>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>인증과 요금</h2>
        <ul className={listClass}>
          <li>
            <strong>인증 없음</strong> — API 키, 토큰, OAuth 모두 필요 없습니다.
            익명으로 바로 호출하세요.
          </li>
          <li>
            <strong>무료</strong> — 요금제와 유료 등급이 없습니다. 영업 문의
            폼도 없습니다.
          </li>
          <li>
            <strong>셀프 서비스</strong> — 발급받을 자격 증명이 없으므로 별도
            온보딩 절차 없이 첫 요청이 곧 시작입니다.
          </li>
          <li>
            <strong>사용량</strong> — 고정 한도는 없지만 요청이 외부 다이소
            서비스로 전달되므로 초당 수 건 수준으로 여유 있게 호출하고, 자주
            바뀌지 않는 매장 정보는 캐시해 주세요.
          </li>
          <li>
            <strong>CORS</strong> — 발견 문서와 샌드박스 응답은{" "}
            <code>Access-Control-Allow-Origin: *</code> 로 내려갑니다.
          </li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>샌드박스</h2>
        <p className={paragraphClass}>
          <code>/api/sandbox</code> 이하는 외부 다이소 API 를 호출하지 않고
          고정된 예시 데이터를 돌려줍니다. 응답 형태는 실제 엔드포인트와 같아서
          통합 테스트의 기대값으로 그대로 쓸 수 있습니다. 매장 코드{" "}
          <code>11199</code>, <code>10528</code>, <code>10962</code> 가 준비돼
          있습니다.
        </p>
        <pre className={codeBlockClass}>
          <code>{`curl "${base}/api/sandbox/branches/search?keyword=강남"
curl "${base}/api/sandbox/products?branchCode=11199&keyword=수세미"`}</code>
        </pre>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>엔드포인트</h2>
        <ul className={listClass}>
          {endpoints.map((endpoint) => (
            <li key={`${endpoint.method} ${endpoint.path}`}>
              <code>
                {endpoint.method} {endpoint.path}
              </code>{" "}
              — {endpoint.description} (operationId:{" "}
              <code>{endpoint.operationId}</code>)
            </li>
          ))}
        </ul>
        <p className={paragraphClass}>
          전체 파라미터와 응답 스키마는{" "}
          <a href="/openapi.json">/openapi.json</a> (또는{" "}
          <a href="/openapi.yaml">/openapi.yaml</a>) 에 OpenAPI 3.1 로 기술돼
          있으며, 모든 오퍼레이션에 고유한 <code>operationId</code> 와 설명이
          있어 LLM 함수 호출 스키마로 바로 변환할 수 있습니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>오류 응답</h2>
        <p className={paragraphClass}>
          모든 오류는 HTML 이 아니라 아래 형태의 JSON 으로 내려갑니다.{" "}
          <code>code</code> 는 기계 판독용 안정 식별자이고 <code>hint</code> 는
          무엇을 고치면 되는지 알려줍니다.
        </p>
        <pre className={codeBlockClass}>
          <code>{`{
  "error": "매장 정보가 필요합니다.",
  "code": "missing_parameter",
  "message": "The \`branchCode\` query parameter is required.",
  "hint": "Call GET /api/branches/search first and pass the \`code\` field ...",
  "status": 400,
  "documentation": "${base}/developers"
}`}</code>
        </pre>
        <p className={paragraphClass}>
          <code>code</code> 값은 <code>missing_parameter</code>,{" "}
          <code>invalid_parameter</code>, <code>not_found</code>,{" "}
          <code>route_not_found</code>, <code>method_not_allowed</code>,{" "}
          <code>upstream_error</code>, <code>internal_error</code> 중
          하나입니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>MCP 서버</h2>
        <p className={paragraphClass}>
          <code>{base}/api/mcp</code> 는 Streamable HTTP 전송을 쓰는 MCP
          서버입니다. Claude, ChatGPT 등 MCP 를 지원하는 클라이언트에 원격
          서버로 등록하면 아래 도구를 그대로 호출할 수 있습니다.
        </p>
        <ul className={listClass}>
          {MCP_TOOLS.map((tool) => (
            <li key={tool.name}>
              <code>{tool.name}</code> — {tool.description}
            </li>
          ))}
        </ul>
        <pre className={codeBlockClass}>
          <code>{`curl -X POST "${base}/api/mcp" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</code>
        </pre>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>CLI</h2>
        <p className={paragraphClass}>
          터미널이나 스크립트에서 바로 쓰려면 공식 CLI 를 설치하지 않고 실행할
          수 있습니다. API 키가 없으므로 설정 단계도 없습니다.
        </p>
        <pre className={codeBlockClass}>
          <code>{`npx ${CLI_PACKAGE_NAME} stores 강남
npx ${CLI_PACKAGE_NAME} store 11199
npx ${CLI_PACKAGE_NAME} products 11199 수세미 --json
npx ${CLI_PACKAGE_NAME} product 1019373 11199`}</code>
        </pre>
        <p className={paragraphClass}>
          소스는 저장소의 <code>cli/</code> 디렉터리에 있고,{" "}
          <code>--base-url</code> 옵션으로 샌드박스나 자체 배포본을 가리킬 수
          있습니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>에이전트용 발견 문서</h2>
        <ul className={listClass}>
          {resources.map((resource) => (
            <li key={resource.href}>
              <a href={resource.href}>{resource.label}</a>{" "}
              <code>{resource.href}</code>
            </li>
          ))}
        </ul>
        <p className={paragraphClass}>
          HTML 페이지는 <code>Accept: text/markdown</code> 으로 요청하면 같은
          URL 에서 Markdown 표현을 돌려줍니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>지원</h2>
        <p className={paragraphClass}>
          연동 문의와 버그 제보는{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 또는{" "}
          <a
            href={`${SOURCE_REPOSITORY}/issues`}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub 이슈
          </a>
          로 보내주세요.
        </p>
      </section>
    </ContentPage>
  );
}
