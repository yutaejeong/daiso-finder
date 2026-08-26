import { css } from "@styled-system/css";
import clsx from "clsx";
import Link from "next/link";
import { HomeClient } from "./HomeClient";
import { SiteFooter } from "@/components/SiteFooter";
import { popularBranches } from "@/lib/seoBranches";
import { CLI_PACKAGE_NAME, SITE_NAME, SITE_NAME_EN } from "@/lib/site";

const sectionClass = css({
  marginTop: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const headingClass = css({
  margin: 0,
  fontSize: "1rem",
  fontWeight: 700,
  color: "#1f2937",
});

const paragraphClass = css({
  margin: 0,
  fontSize: "0.875rem",
  lineHeight: 1.75,
  color: "#374151",
});

const listClass = css({
  margin: 0,
  paddingLeft: "18px",
  listStyle: "disc outside",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "0.875rem",
  lineHeight: 1.7,
  color: "#374151",
});

/**
 * 홈은 검색 UI(클라이언트)와 서비스 설명(서버 렌더링)으로 나뉜다.
 * 검색 영역은 기존과 동일하게 첫 화면을 그대로 채우고, 설명 영역은
 * 스크롤해야 보이므로 화면 구성은 바뀌지 않으면서 원본 HTML 에는
 * 자바스크립트 없이도 읽히는 본문이 남는다.
 */
export default function Home() {
  return (
    <div
      className={css({
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
      })}
    >
      <main
        className={css({
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        })}
      >
        <HomeClient />
      </main>

      <div
        className={css({
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          paddingTop: "32px",
          paddingBottom: "32px",
        })}
      >
        <section className={sectionClass}>
          <h2 className={headingClass}>{SITE_NAME}는 어떤 서비스인가요</h2>
          <p className={paragraphClass}>
            {SITE_NAME}({SITE_NAME_EN})는 전국 다이소 매장을 찾고, 그 매장에
            원하는 상품이 지금 있는지 확인하는 무료 웹 서비스입니다. 주소나
            지점명으로 검색하거나 현재 위치를 기준으로 가까운 매장을 찾은 다음,
            매장 안에서 상품명을 검색하면 재고 수량과 가격은 물론 그 상품이 몇
            층 몇 번 구역에 진열돼 있는지까지 알려줍니다. 매장에 헛걸음하지
            않고, 도착해서도 진열대를 헤매지 않도록 돕는 것이 목표입니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>이렇게 사용하세요</h2>
          <ol
            className={clsx(listClass, css({ listStyle: "decimal outside" }))}
          >
            <li>
              위 검색창에 주소나 지점명을 입력하거나, 위치 버튼을 눌러 주변
              매장을 찾습니다.
            </li>
            <li>매장을 선택해 매장 상세 페이지로 이동합니다.</li>
            <li>
              상품명을 검색하면 그 매장에 재고가 있는 상품만 가격·재고 수량과
              함께 보여줍니다.
            </li>
            <li>
              상품을 선택하면 진열 층과 구역, 그리고 재고가 있는 주변 매장을
              확인할 수 있습니다.
            </li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>많이 찾는 다이소 매장</h2>
          <p className={paragraphClass}>
            아래 매장은 바로 열어볼 수 있습니다. 검색으로 전국 어느 매장이든
            찾을 수 있습니다.
          </p>
          <ul className={listClass}>
            {popularBranches.slice(0, 8).map((branch) => (
              <li key={branch.code}>
                <Link href={`/branch/${branch.code}`}>
                  다이소 {branch.name} 상품 찾기
                </Link>{" "}
                — {branch.address}
              </li>
            ))}
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>
            개발자와 AI 에이전트를 위한 {SITE_NAME} API
          </h2>
          <p className={paragraphClass}>
            {SITE_NAME}의 매장·재고 데이터는 API 키 없이 무료로 호출할 수 있는
            공개 REST API 로도 제공됩니다. 전체 스펙은{" "}
            <Link href="/developers">개발자 포털</Link>과{" "}
            <a href="/openapi.json">OpenAPI 문서</a>에 공개돼 있고,{" "}
            <a href="/api/sandbox">샌드박스</a>에서 고정된 예시 데이터로 먼저
            시험해 볼 수 있습니다. AI 에이전트는 <code>/api/mcp</code> MCP
            서버에 연결하거나{" "}
            <a href="/agent-instructions.md">에이전트 사용 안내</a>와{" "}
            <a href="/llms.txt">llms.txt</a>를 참고하세요. 터미널에서는{" "}
            <code>npx {CLI_PACKAGE_NAME} stores 강남</code> 으로 바로 조회할 수
            있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>데이터 출처와 정확도</h2>
          <p className={paragraphClass}>
            매장 정보와 재고, 진열 위치는 다이소가 운영하는 다이소몰 API 에서
            조회 시점마다 실시간으로 가져오며 별도로 저장하지 않습니다. 표시되는
            재고는 다이소몰이 제공하는 값이라 실제 매장 상황과 다를 수 있으니,
            꼭 필요한 물건이라면 방문 전 매장에 확인해주세요. {SITE_NAME}는
            아성다이소의 공식 서비스가 아닌 개인 오픈소스 프로젝트입니다. 자세한
            내용은 <Link href="/about">서비스 소개</Link>와{" "}
            <Link href="/privacy">개인정보 처리방침</Link>에서 확인할 수
            있습니다.
          </p>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
