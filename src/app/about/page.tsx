import type { Metadata } from "next";
import { css } from "@styled-system/css";
import clsx from "clsx";
import Link from "next/link";
import {
  ContentPage,
  headingClass,
  listClass,
  paragraphClass,
  sectionClass,
} from "@/components/ContentPage";
import { popularBranches } from "@/lib/seoBranches";
import {
  CLI_PACKAGE_NAME,
  CONTACT_EMAIL,
  SITE_NAME,
  SITE_NAME_EN,
  SOURCE_REPOSITORY,
} from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} 소개`,
  description:
    "다이소 파인더가 어떤 서비스이고, 어떻게 쓰며, 어떤 데이터를 어디서 가져오고, 누가 만들고 운영하는지 안내합니다.",
  alternates: { canonical: "/about" },
};

const branchLinkClass = css({
  display: "block",
  padding: "12px 14px",
  backgroundColor: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow-1)",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
  "@media (hover: hover)": {
    "&:hover": {
      borderColor: "var(--line-strong)",
      boxShadow: "var(--shadow-2)",
    },
  },
});

/**
 * 서비스 소개. 예전에는 홈 화면 아래쪽에 있던 안내 문구(서비스 설명, 사용 방법,
 * 많이 찾는 매장, API 안내, 데이터 정확도)를 이 페이지로 모았다. 홈은 검색에만
 * 집중하고, 크롤러와 에이전트가 읽을 설명은 이 페이지가 서버 렌더링으로 제공한다.
 */
export default function AboutPage() {
  return (
    <ContentPage
      title={`${SITE_NAME} 소개`}
      lead={`${SITE_NAME}(${SITE_NAME_EN})는 전국 다이소 매장을 찾고, 특정 매장에 그 상품이 지금 있는지, 있다면 몇 층 몇 번 구역에 진열돼 있는지까지 알려주는 무료 웹 서비스입니다.`}
    >
      <section className={sectionClass}>
        <h2 className={headingClass}>무엇을 해결하나요</h2>
        <p className={paragraphClass}>
          다이소에서 필요한 물건을 사려고 매장에 갔는데 그 매장에는 없거나,
          있어도 어느 진열대에 있는지 몰라 한참 헤맨 경험에서 출발했습니다.{" "}
          {SITE_NAME}는 매장에 가기 전에 재고를 확인하고, 매장에 도착한 뒤에는
          진열 위치로 곧장 찾아갈 수 있게 하는 것을 목표로 합니다. 검색은 주소나
          지점명으로 할 수도 있고, 브라우저의 위치 정보 권한을 허용하면 현재
          위치 기준으로 가까운 매장을 먼저 보여줍니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>이렇게 사용하세요</h2>
        <ol className={clsx(listClass, css({ listStyle: "decimal outside" }))}>
          <li>
            <Link href="/">홈</Link>의 검색창에 주소나 지점명을 입력하거나, 위치
            버튼을 눌러 주변 매장을 찾습니다.
          </li>
          <li>매장을 선택해 매장 상세 페이지로 이동합니다.</li>
          <li>
            상품명을 검색하면 그 매장에 재고가 있는 상품만 가격·재고 수량과 함께
            보여줍니다.
          </li>
          <li>
            상품을 선택하면 진열 층과 구역, 그리고 재고가 있는 주변 매장을
            확인할 수 있습니다.
          </li>
        </ol>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>제공하는 기능</h2>
        <ul className={listClass}>
          <li>주소·지점명 키워드 검색과 GPS 좌표 기반 주변 매장 검색</li>
          <li>매장별 주소, 위도·경도, 영업 시작/종료 시간 확인</li>
          <li>매장 안에서 상품명을 검색해 재고 수량과 가격 확인</li>
          <li>재고가 있는 상품의 진열 층(stairNo)과 구역(zoneNo) 안내</li>
          <li>현재 매장에 재고가 없을 때 재고가 있는 주변 매장 추천</li>
          <li>홈 화면에 설치해 앱처럼 쓸 수 있는 PWA 지원</li>
          <li>
            사람이 아닌 AI 에이전트도 쓸 수 있는 공개 REST API 와 MCP 서버
          </li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>많이 찾는 다이소 매장</h2>
        <p className={paragraphClass}>
          아래 매장은 바로 열어볼 수 있습니다. 검색으로 전국 어느 매장이든 찾을
          수 있습니다.
        </p>
        <ul
          className={css({
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "grid",
            gap: "10px",
            gridTemplateColumns: "1fr",
            sm: { gridTemplateColumns: "1fr 1fr" },
          })}
        >
          {popularBranches.slice(0, 8).map((branch) => (
            <li key={branch.code}>
              <Link href={`/branch/${branch.code}`} className={branchLinkClass}>
                <strong
                  className={css({
                    display: "block",
                    fontSize: "0.9375rem",
                    color: "var(--ink)",
                  })}
                >
                  다이소 {branch.name} 상품 찾기
                </strong>
                <span
                  className={css({
                    display: "block",
                    marginTop: "2px",
                    fontSize: "0.8125rem",
                    color: "var(--muted)",
                    wordBreak: "keep-all",
                  })}
                >
                  {branch.address}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>데이터 출처와 정확도</h2>
        <p className={paragraphClass}>
          매장 정보, 상품 정보, 재고 수량, 진열 위치는 모두 다이소가 공개적으로
          운영하는 다이소몰 서비스 API 에서 조회 시점마다 실시간으로 가져옵니다.{" "}
          {SITE_NAME}는 이 데이터를 저장하거나 가공해 보관하지 않고, 요청이 있을
          때마다 조회해 그대로 전달합니다. 따라서 재고 수량은 다이소몰이
          제공하는 시점의 값이며, 실제 매장 진열 상황과 다를 수 있습니다. 정확한
          재고는 방문 전 매장에 전화로 확인하시길 권합니다. 개인정보 취급은{" "}
          <Link href="/privacy">개인정보 처리방침</Link>에서 확인할 수 있습니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>운영 주체</h2>
        <p className={paragraphClass}>
          {SITE_NAME}는 아성다이소가 운영하는 공식 서비스가 아니라, 개인이
          만들어 공개한 오픈소스 프로젝트입니다. 상표와 상품 정보의 권리는 각
          권리자에게 있습니다. 서비스 전체 소스 코드는{" "}
          <a href={SOURCE_REPOSITORY} rel="noopener noreferrer" target="_blank">
            GitHub 저장소
          </a>
          에 공개돼 있으며, 버그 제보와 기능 제안은 저장소 이슈 또는{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 로 받고
          있습니다. 자세한 방법은 <Link href="/contact">문의</Link> 페이지에
          있습니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>이용 비용</h2>
        <p className={paragraphClass}>
          웹 서비스와 공개 API 모두 무료입니다. 회원 가입, 로그인, API 키 발급
          절차가 없으며 별도의 사용량 한도도 두지 않습니다. 다만 요청이 외부
          다이소 서비스로 전달되므로, 자동화된 호출은 초당 몇 건 수준으로 여유
          있게 보내주세요.
        </p>
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
          시험해 볼 수 있습니다. AI 에이전트는 <code>/api/mcp</code> MCP 서버에
          연결하거나 <a href="/agent-instructions.md">에이전트 사용 안내</a>와{" "}
          <a href="/llms.txt">llms.txt</a>를 참고하세요. 터미널에서는{" "}
          <code>npx {CLI_PACKAGE_NAME} stores 강남</code> 으로 바로 조회할 수
          있습니다.
        </p>
      </section>
    </ContentPage>
  );
}
