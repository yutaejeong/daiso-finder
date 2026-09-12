import type { Metadata } from "next";
import {
  ContentPage,
  headingClass,
  listClass,
  paragraphClass,
  sectionClass,
} from "@/components/ContentPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} 개인정보 처리방침`,
  description:
    "다이소 파인더가 어떤 정보를 수집하고, 위치 정보와 검색어를 어떻게 다루며, 어떤 외부 서비스로 전달하는지 설명합니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title={`${SITE_NAME} 개인정보 처리방침`}
      lead="다이소 파인더는 회원 가입이 없고 이름·연락처 같은 개인정보를 저장하지 않습니다. 아래는 서비스가 실제로 다루는 정보와 그 처리 방식입니다."
    >
      <section className={sectionClass}>
        <h2 className={headingClass}>수집하지 않는 정보</h2>
        <p className={paragraphClass}>
          {SITE_NAME}에는 회원 가입, 로그인, 결제 기능이 없습니다. 따라서 이름,
          전화번호, 이메일 주소, 주소, 결제 수단 같은 개인정보를 수집하거나
          저장하는 절차 자체가 없습니다. 이메일로 문의를 주신 경우에만 답변에
          필요한 범위에서 해당 메일 내용을 확인합니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>위치 정보</h2>
        <p className={paragraphClass}>
          주변 매장 검색을 누르면 브라우저가 위치 정보 제공 동의를 요청합니다.
          허용하면 좌표는 그 검색 요청에만 사용돼 주변 매장 목록을 받아오는 데
          쓰이고, 서버에 기록하거나 다른 정보와 연결해 보관하지 않습니다.
          동의하지 않아도 주소나 지점명 검색으로 서비스를 그대로 이용할 수
          있습니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>검색어 보관</h2>
        <p className={paragraphClass}>
          어떤 매장과 상품을 많이 찾는지 파악해 서비스를 개선하려고, 입력하신
          매장·상품 검색어를 검색 시각, 검색한 매장 코드, 결과 건수와 함께
          운영자의 구글 스프레드시트에 기록합니다. IP 주소, 브라우저 정보,
          식별자처럼 검색한 사람을 특정할 수 있는 값은 함께 저장하지 않으므로
          검색어만으로는 누가 검색했는지 알 수 없습니다. 위치 기반 주변 매장
          검색은 검색어가 없으므로 기록되지 않습니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>브라우저에 저장되는 정보</h2>
        <ul className={listClass}>
          <li>
            최근 본 매장 목록은 브라우저의 로컬 저장소에만 저장되며 서버로
            전송되지 않습니다. 목록의 X 버튼으로 개별 삭제하거나 브라우저
            저장소를 비우면 함께 사라집니다.
          </li>
          <li>
            PWA 설치 안내를 다시 보지 않도록 하는 설정값 등 화면 상태 일부가
            같은 방식으로 저장됩니다.
          </li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>외부로 전달되는 정보</h2>
        <ul className={listClass}>
          <li>
            <strong>다이소몰 API</strong> — 검색어, 매장 코드, 상품 번호, 좌표는
            재고와 매장 정보를 조회하기 위해 다이소가 운영하는 API 로
            전달됩니다.
          </li>
          <li>
            <strong>Google Sheets</strong> — 위에서 설명한 검색어 기록은
            운영자가 소유한 구글 스프레드시트에 저장됩니다.
          </li>
          <li>
            <strong>Google Analytics</strong> — 어떤 기능이 얼마나 쓰이는지
            파악하기 위해 페이지 조회와 검색·클릭 같은 익명 이벤트를 수집합니다.
            개인을 식별할 수 있는 값은 보내지 않습니다.
          </li>
          <li>
            <strong>Sentry</strong> — 오류가 났을 때 원인을 찾기 위해 오류
            메시지와 오류가 난 화면 주소를 오류 추적 서비스로 보냅니다. 주소에
            담긴 검색어와 좌표는 보내기 전에 가려지며, IP 주소 같은 식별 정보도
            함께 보내지 않습니다.
          </li>
          <li>
            <strong>호스팅 사업자</strong> — 서비스 제공에 필요한 접속 로그(IP,
            사용자 에이전트 등)가 호스팅 사업자 측에 일시적으로 기록될 수
            있습니다.
          </li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>공개 API 이용 시</h2>
        <p className={paragraphClass}>
          <code>/api</code> 이하의 공개 API 와 <code>/api/mcp</code> MCP
          엔드포인트는 인증 없이 익명으로 호출됩니다. API 키를 발급하지 않으므로
          호출자를 식별하는 정보도 보관하지 않습니다. 다만 API 로 들어온
          검색어도 위 &ldquo;검색어 보관&rdquo; 과 같은 방식으로 기록됩니다.{" "}
          <code>/api/sandbox</code> 는 고정된 예시 데이터만 반환하며 외부로 어떤
          요청도 보내지 않습니다.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>문의와 변경</h2>
        <p className={paragraphClass}>
          개인정보 처리에 대한 문의는{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 로 보내주세요.
          이 방침이 바뀌면 이 페이지를 통해 알리며, 변경 내용은 서비스 소스 코드
          저장소의 커밋 기록으로도 확인할 수 있습니다.
        </p>
      </section>
    </ContentPage>
  );
}
