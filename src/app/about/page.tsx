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
  title: `${SITE_NAME} 소개`,
  description:
    "다이소 파인더가 어떤 서비스이고, 어떤 데이터를 어디서 가져오며, 누가 만들고 운영하는지 안내합니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title={`${SITE_NAME} 소개`}
      lead="다이소 파인더는 전국 다이소 매장을 찾고, 특정 매장에 그 상품이 지금 있는지, 있다면 몇 층 몇 번 구역에 진열돼 있는지까지 알려주는 무료 웹 서비스입니다."
    >
      <section className={sectionClass}>
        <h2 className={headingClass}>무엇을 해결하나요</h2>
        <p className={paragraphClass}>
          다이소에서 필요한 물건을 사려고 매장에 갔는데 그 매장에는 없거나,
          있어도 어느 진열대에 있는지 몰라 한참 헤맨 경험에서 출발했습니다.
          다이소 파인더는 매장에 가기 전에 재고를 확인하고, 매장에 도착한 뒤에는
          진열 위치로 곧장 찾아갈 수 있게 하는 것을 목표로 합니다. 검색은 주소나
          지점명으로 할 수도 있고, 브라우저의 위치 정보 권한을 허용하면 현재
          위치 기준으로 가까운 매장을 먼저 보여줍니다.
        </p>
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
        <h2 className={headingClass}>데이터 출처</h2>
        <p className={paragraphClass}>
          매장 정보, 상품 정보, 재고 수량, 진열 위치는 모두 다이소가 공개적으로
          운영하는 다이소몰 서비스 API 에서 실시간으로 가져옵니다. 다이소
          파인더는 이 데이터를 저장하거나 가공해 보관하지 않고, 요청이 있을
          때마다 조회해 그대로 전달합니다. 따라서 재고 수량은 다이소몰이
          제공하는 시점의 값이며, 실제 매장 진열 상황과 다를 수 있습니다. 정확한
          재고는 방문 전 매장에 전화로 확인하시길 권합니다.
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
    </ContentPage>
  );
}
