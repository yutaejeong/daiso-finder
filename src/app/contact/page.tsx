import type { Metadata } from "next";
import {
  ContentPage,
  headingClass,
  listClass,
  paragraphClass,
  sectionClass,
} from "@/components/ContentPage";
import { CONTACT_EMAIL, SITE_NAME, SOURCE_REPOSITORY } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} 문의`,
  description:
    "다이소 파인더에 버그를 제보하거나 기능을 제안하고, API·MCP 연동을 문의하는 방법을 안내합니다.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ContentPage
      title={`${SITE_NAME} 문의`}
      lead="버그 제보, 기능 제안, API·MCP 연동 문의를 아래 창구로 보내주세요. 개인이 운영하는 프로젝트라 답변까지 며칠이 걸릴 수 있습니다."
    >
      <section className={sectionClass}>
        <h2 className={headingClass}>이메일</h2>
        <p className={paragraphClass}>
          일반 문의와 제휴·연동 문의는{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 로 보내주세요.
          재현이 필요한 버그라면 접속한 페이지 주소, 검색한 매장 이름 또는 매장
          코드, 검색어, 발생 시각, 사용한 브라우저와 기기를 함께 적어주시면
          확인이 훨씬 빠릅니다. API 문제라면 요청 URL 과 응답 본문의{" "}
          <code>code</code>, <code>detail</code> 필드를 그대로 붙여주세요.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>GitHub 이슈</h2>
        <p className={paragraphClass}>
          공개적으로 논의해도 되는 버그와 기능 제안은{" "}
          <a
            href={`${SOURCE_REPOSITORY}/issues`}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub 이슈
          </a>
          가 가장 빠릅니다. 소스 코드가 모두 공개돼 있으므로 직접 고친 뒤 풀
          리퀘스트를 보내주셔도 좋습니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>문의 유형별 안내</h2>
        <ul className={listClass}>
          <li>
            <strong>재고가 실제와 다릅니다</strong> — 재고 수량은 다이소몰이
            제공하는 값을 그대로 전달합니다. 다이소 파인더가 값을 보정하지
            않으므로, 매장 실물과 차이가 있으면 매장에 직접 확인해주세요.
          </li>
          <li>
            <strong>매장이 검색되지 않습니다</strong> — 매장 코드와 검색어를
            알려주시면 외부 API 응답을 확인해 드립니다.
          </li>
          <li>
            <strong>API 를 서비스에 붙이고 싶습니다</strong> — 별도 승인 절차가
            없으니 바로 사용하시면 됩니다. 스펙은 개발자 포털과{" "}
            <code>/openapi.json</code> 에 공개돼 있습니다.
          </li>
          <li>
            <strong>AI 에이전트에 연결하고 싶습니다</strong> — MCP 엔드포인트{" "}
            <code>/api/mcp</code> 를 Streamable HTTP 서버로 등록하면 됩니다.
          </li>
          <li>
            <strong>권리 침해·삭제 요청</strong> — 상표나 저작물 관련 요청은
            이메일로 보내주시면 확인 후 조치하겠습니다.
          </li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>서비스 정보</h2>
        <p className={paragraphClass}>
          {SITE_NAME}는 대한민국에서 운영되는 개인 오픈소스 프로젝트이며,
          아성다이소의 공식 서비스가 아닙니다. 다이소 상품 구매, 교환·환불, 매장
          운영에 대한 문의는 다이소 고객센터로 연락해주세요. 이 사이트로는
          서비스 자체에 대한 문의만 처리할 수 있습니다.
        </p>
      </section>
    </ContentPage>
  );
}
