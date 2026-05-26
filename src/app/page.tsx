"use client";

import { css } from "@styled-system/css";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { IconHistory, IconMapPinFilled, IconX } from "@tabler/icons-react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { SimplifiedBranchResponse } from "./api/branches/types";
import { Search } from "@/components/Search";
import { useRecentBranches } from "@/hooks/useRecentBranches";
import { trackEvent } from "@/lib/gtag";
import { popularBranches } from "@/lib/seoBranches";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://daiso-finder.kr"
).replace(/\/$/, "");

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState<{
    curLitd: number;
    curLttd: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { recentBranches, removeRecentBranch } = useRecentBranches();
  const { data, error, fetchNextPage, isError, isFetching, refetch } =
    useInfiniteQuery<
      SimplifiedBranchResponse,
      Error,
      InfiniteData<SimplifiedBranchResponse>,
      ["branches", string],
      number
    >({
      queryKey: ["branches", keyword],
      enabled: false,
      meta: { suppressGlobalError: true },
      initialPageParam: 1,
      getNextPageParam: (lastPage, _pages, lastPageParam) =>
        lastPage.length < 10 ? undefined : lastPageParam + 1,
      queryFn: async ({ pageParam = 1 }) => {
        const url = new URL("/api/branches/search", window.location.origin);
        if (location) {
          url.searchParams.set("curLttd", location.curLttd.toFixed(14));
          url.searchParams.set("curLitd", location.curLitd.toFixed(14));
        } else {
          url.searchParams.set("keyword", keyword);
        }
        url.searchParams.set("currentPage", pageParam.toString());
        url.searchParams.set("pageSize", "10");
        url.searchParams.set("pageIndex", "0");
        const response = await fetch(url);
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || "매장 검색 중 오류가 발생했습니다.", {
            cause: body?.detail,
          });
        }
        const data: SimplifiedBranchResponse = await response.json();
        return data;
      },
    });
  const branches = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );
  const popularBranchesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "다이소 주요 인기 매장 바로가기",
    itemListElement: popularBranches.map((branch, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `다이소 ${branch.name} 재고 확인`,
      url: `${APP_URL}/branch/${branch.code}`,
    })),
  };

  const getCurrentPosition = async () => {
    if (!navigator.geolocation) {
      throw new Error("이 브라우저는 위치 정보를 지원하지 않습니다.");
    }

    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error: GeolocationPositionError) => {
          let errorMessage = "위치 정보를 가져오는데 실패했습니다.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "위치 정보 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 정보 권한을 허용해주세요.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage =
                "위치 정보를 사용할 수 없습니다. GPS가 켜져있는지 확인하거나, 잠시 후 다시 시도해주세요.";
              break;
            case error.TIMEOUT:
              errorMessage =
                "위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요.";
              break;
            default:
              errorMessage = `위치 정보 오류: ${error.message || "알 수 없는 오류가 발생했습니다."}`;
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  };

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const button = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement;
    const action = button.value;

    if (action === "location") {
      try {
        const position = await getCurrentPosition();
        setLocation({
          curLitd: position.coords.longitude,
          curLttd: position.coords.latitude,
        });
        setKeyword(
          `${position.coords.longitude.toFixed(14)},${position.coords.latitude.toFixed(14)}`,
        );
        trackEvent("branch_location_search");
      } catch (error) {
        console.error("위치 정보 오류:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "위치 정보를 가져오는데 실패했습니다. 다시 시도해주세요.";
        alert(errorMessage);
      }
    } else {
      trackEvent("branch_search", { keyword: searchInput });
      setKeyword(searchInput);
    }
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
            trackEvent("branches_load_more");
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(popularBranchesJsonLd),
        }}
      />
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
        withLocation
        errorMessage={isError ? error.message : undefined}
        onRetry={keyword ? () => refetch() : undefined}
        beforeForm={
          <>
            {recentBranches.length > 0 && (
              <nav
                aria-label="최근 본 다이소 매장"
                className={css({
                  display: "flex",
                  gap: "10px",
                  overflowX: "auto",
                  paddingBlock: 4,
                  paddingInline: 4,
                  marginBottom: "6px",
                  scrollbarWidth: "none",
                  WebkitMaskImage:
                    "linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 22px), transparent 100%)",
                  maskImage:
                    "linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 22px), transparent 100%)",
                  "&::-webkit-scrollbar": { display: "none" },
                })}
              >
                <span
                  aria-hidden="true"
                  className={css({
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    flexShrink: 0,
                    color: "#666",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                  })}
                >
                  <IconHistory width={15} height={15} />
                  최근
                </span>
                {recentBranches.map((branch) => (
                  <span
                    key={branch.code}
                    className={clsx(
                      "badge bg-blue-lt",
                      css({
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                        minHeight: "32px",
                        padding: "4px 4px 4px 11px",
                        fontSize: "0.875rem",
                        lineHeight: 1.2,
                      }),
                    )}
                  >
                    <Link
                      href={`/branch/${branch.code}`}
                      onClick={() =>
                        trackEvent("recent_branch_click", {
                          branch_code: branch.code,
                          branch_name: branch.name,
                        })
                      }
                      className={css({
                        color: "inherit",
                        textDecoration: "none",
                      })}
                    >
                      {branch.name}
                    </Link>
                    <button
                      type="button"
                      aria-label={`${branch.name} 최근 본 매장에서 제거`}
                      onClick={() => {
                        removeRecentBranch(branch.code);
                        trackEvent("recent_branch_remove", {
                          branch_code: branch.code,
                        });
                      }}
                      className={css({
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px",
                        padding: 0,
                        border: "none",
                        borderRadius: "50%",
                        backgroundColor: "transparent",
                        color: "inherit",
                        cursor: "pointer",
                        opacity: 0.7,
                        _hover: { opacity: 1 },
                      })}
                    >
                      <IconX width={14} height={14} />
                    </button>
                  </span>
                ))}
              </nav>
            )}
            <nav
              aria-label="주요 다이소 매장"
              className={css({
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                paddingBlock: 4,
                paddingInline: 4,
                marginBottom: "10px",
                scrollbarWidth: "none",
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 22px), transparent 100%)",
                maskImage:
                  "linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 22px), transparent 100%)",
                "&::-webkit-scrollbar": { display: "none" },
              })}
            >
              {popularBranches.map((branch) => (
                <Link
                  key={branch.code}
                  href={`/branch/${branch.code}`}
                  className={clsx(
                    "badge bg-red-lt",
                    css({
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                      minHeight: "32px",
                      padding: "7px 11px",
                      fontSize: "0.875rem",
                      lineHeight: 1.2,
                    }),
                  )}
                >
                  <IconMapPinFilled
                    aria-hidden="true"
                    width={15}
                    height={15}
                    className={css({
                      color: "#ED1C24",
                      flexShrink: 0,
                    })}
                  />
                  {branch.name}
                </Link>
              ))}
            </nav>
          </>
        }
      >
        {branches?.map((branch) => (
          <Link
            href={`/branch/${branch.code}`}
            className="card"
            key={branch.code}
            onClick={() =>
              trackEvent("branch_click", {
                branch_code: branch.code,
                branch_name: branch.name,
              })
            }
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
