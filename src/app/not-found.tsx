import { css } from "@styled-system/css";
import { IconArrowLeft, IconMapSearch } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import {
  statusCardClass,
  statusIconClass,
  statusTitleClass,
} from "@/components/statusStyles";
import { ImageWithFallback } from "@/components/ImageWithFallback";
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
        <Link
          href="/"
          aria-label="다이소 파인더 홈으로 이동"
          className={css({ alignSelf: "flex-start", marginBottom: "16px" })}
        >
          <ImageWithFallback
            src="/logo.svg"
            alt="다이소 파인더"
            width={150}
            height={59}
            priority
            draggable={false}
            style={{ WebkitUserDrag: "none" } as React.CSSProperties}
            className={css({
              userSelect: "none",
              width: "auto",
              height: "36px",
            })}
          />
        </Link>
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
