import { css } from "@styled-system/css";
import { IconArrowLeft, IconMapSearch } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className={css({
        width: "100%",
        maxWidth: "480px",
        minHeight: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      })}
    >
      <Link href="/" aria-label="다이소 파인더 홈으로 이동">
        <Image
          src="/logo.svg"
          alt="다이소 파인더 로고"
          width={200}
          height={80}
          draggable={false}
          style={{ WebkitUserDrag: "none" } as React.CSSProperties}
          className={css({
            userSelect: "none",
            marginBottom: "24px",
            width: "150px",
            height: "60px",
            lg: { width: "200px", height: "80px" },
          })}
        />
      </Link>
      <section
        className={css({
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          textAlign: "center",
          padding: "32px 16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#fff",
        })}
      >
        <IconMapSearch
          aria-hidden="true"
          width={46}
          height={46}
          className={css({ color: "#ED1C24" })}
        />
        <div>
          <h1
            className={css({
              marginBottom: "8px",
              fontSize: "1.5rem",
              lineHeight: 1.35,
              wordBreak: "keep-all",
            })}
          >
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
  );
}
