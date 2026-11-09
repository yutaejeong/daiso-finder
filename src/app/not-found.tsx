import { css } from "@styled-system/css";
import { IconArrowLeft, IconMapSearch } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import { SiteLogo } from "@/components/SiteLogo";
import {
  statusCardClass,
  statusIconClass,
  statusTitleClass,
} from "@/components/statusStyles";
import { JourneyEvent } from "@/components/JourneyEvent";
import Link from "next/link";

export default function NotFound() {
  return (
    <AppShell>
      <main
        className={css({
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        })}
      >
        {/* 없는 주소로 들어온 것 자체가 유입-이탈 분석의 신호다. */}
        <JourneyEvent name="page_not_found" />
        <SiteLogo spaced />
        <section className={statusCardClass}>
          <span className={statusIconClass}>
            <IconMapSearch aria-hidden="true" width={34} height={34} />
          </span>
          <div>
            <h1 className={statusTitleClass}>
              요청하신 페이지를 찾을 수 없습니다
            </h1>
            <p className="text-muted">
              주소가 바뀌었거나 매장 정보가 더 이상 제공되지 않을 수 있어요.
            </p>
          </div>
          <Link href="/" className="btn btn-red">
            <IconArrowLeft width={18} height={18} />
            매장 다시 찾기
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
