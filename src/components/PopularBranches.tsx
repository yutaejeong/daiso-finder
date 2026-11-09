"use client";

import { css } from "@styled-system/css";
import { IconFlame } from "@tabler/icons-react";
import Link from "next/link";
import { trackEvent } from "@/lib/gtag";
import type { PopularBranch } from "@/lib/popular";

interface Props {
  branches: PopularBranch[];
}

/** 첫 화면에서 검색 전에 보여주는, 요즘 많이 찾는 매장 목록 */
export function PopularBranches({ branches }: Props) {
  if (branches.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="popular-branches-title">
      <h2
        id="popular-branches-title"
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "6px",
          margin: "4px 0 10px",
          fontSize: "0.875rem",
          fontWeight: 700,
          color: "var(--ink-2)",
        })}
      >
        <IconFlame
          aria-hidden="true"
          width={18}
          height={18}
          className={css({ color: "var(--brand)" })}
        />
        요즘 많이 찾는 매장
      </h2>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        })}
      >
        {branches.map((branch, index) => (
          <Link
            href={`/branch/${branch.code}`}
            className="card"
            key={branch.code}
            onClick={() =>
              trackEvent("popular_branch_click", {
                branch_code: branch.code,
                branch_name: branch.name,
                result_position: index + 1,
                result_count: branches.length,
              })
            }
          >
            <div className="card-body">
              <h3 className="card-title">{branch.name}</h3>
              <p className="card-text">{branch.address}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
