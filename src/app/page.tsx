"use client";

import { css } from "@styled-system/css";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SimplifiedBranchResponse } from "./api/branches/search/types";

export default function Home() {
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState<SimplifiedBranchResponse>([]);
  const ref = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = new URL("/api/branches/search", window.location.origin);
    url.searchParams.set("keyword", branch);
    url.searchParams.set("currentPage", "1");
    url.searchParams.set("pageSize", "10");
    url.searchParams.set("pageIndex", "0");
    const response = await fetch(url);
    const data = await response.json();

    setBranches(data);
  };

  useEffect(() => {
    if (ref.current) {
      // @todo: Intersection Observer 추가
    }
  }, []);

  return (
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
      <Image
        src="/logo.svg"
        alt="logo"
        width={200}
        height={80}
        className={css({
          marginBottom: "24px",
          width: "150px",
          height: "60px",
          lg: {
            width: "200px",
            height: "80px",
          },
        })}
      />
      <h1>당신이 있는 매장의 상품을 찾아드립니다</h1>
      <span
        className={clsx(
          "text-muted",
          css({
            fontSize: "1.1rem",
            marginBottom: "16px",
          }),
        )}
      >
        매장을 선택해주세요
      </span>
      <form
        className={clsx("input-group", css({ marginBottom: "16px" }))}
        onSubmit={handleSearch}
      >
        <input
          type="text"
          className="form-control"
          placeholder="주소 혹은 지점명을 입력하세요"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          required
        />
        <button className="btn btn-red" type="submit">
          검색
        </button>
      </form>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          overflowY: "auto",
          flex: 1,
          padding: "8px",
          border: "1px solid #ccc",
          backgroundColor: "#f8f8f8",
          borderRadius: "4px",
        })}
      >
        {branches.map((branch) => (
          <Link
            href={`/branch/${branch.code}`}
            className="card"
            key={branch.code}
          >
            <div className="card-body">
              <h5 className="card-title">{branch.name}</h5>
              <p className="card-text">{branch.address}</p>
            </div>
          </Link>
        ))}
        {branches.length === 0 && (
          <div
            className={clsx(
              "text-muted",
              css({ textAlign: "center", marginTop: "16px" }),
            )}
          >
            지점을 검색해주세요 🔎
          </div>
        )}
        <div ref={ref} className={css({ width: "100%", height: "10px" })} />
      </div>
    </main>
  );
}
