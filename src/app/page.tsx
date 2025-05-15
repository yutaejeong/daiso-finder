"use client";

import { css } from "@styled-system/css";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SimplifiedBranchResponse } from "./api/branches/types";
import { Search } from "@/components/Search";

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { data, fetchNextPage, isFetching } = useInfiniteQuery<
    SimplifiedBranchResponse,
    Error,
    InfiniteData<SimplifiedBranchResponse>,
    ["branches", string],
    number
  >({
    queryKey: ["branches", keyword],
    enabled: false,
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < 10 ? undefined : lastPageParam + 1,
    queryFn: async ({ pageParam = 1 }) => {
      const url = new URL("/api/branches/search", window.location.origin);
      url.searchParams.set("keyword", keyword);
      url.searchParams.set("currentPage", pageParam.toString());
      url.searchParams.set("pageSize", "10");
      url.searchParams.set("pageIndex", "0");
      const response = await fetch(url);
      const data: SimplifiedBranchResponse = await response.json();
      return data;
    },
  });
  const branches = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  useEffect(() => {
    if (keyword) {
      fetchNextPage();
    }
  }, [keyword, fetchNextPage]);

  useEffect(() => {
    if (ref.current) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && branches.length > 0) {
            fetchNextPage();
          }
        });
      });
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [fetchNextPage, branches]);

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
      <Search
        title="매장을 선택해주세요"
        placeholder="주소 혹은 지점명을 입력하세요"
        searchInput={searchInput}
        onSearchInputChange={(value) => setSearchInput(value)}
        onSubmit={handleSearch}
        isFetching={isFetching}
        hasResults={branches.length > 0}
        keyword={keyword}
      >
        {branches?.map((branch) => (
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
        <div ref={ref} className={css({ width: "100%", height: "10px" })} />
      </Search>
    </main>
  );
}
