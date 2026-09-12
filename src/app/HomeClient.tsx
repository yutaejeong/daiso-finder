"use client";

import { css } from "@styled-system/css";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { IconHistory, IconX } from "@tabler/icons-react";
import clsx from "clsx";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { SimplifiedBranchResponse } from "@/app/api/branches/types";
import { Search } from "@/components/Search";
import { useRecentBranches } from "@/hooks/useRecentBranches";
import { useUrlSearchParams } from "@/hooks/useUrlSearchParams";
import { trackEvent } from "@/lib/gtag";
import {
  trackJourneyStep,
  trackSearchError,
  trackSearchResult,
} from "@/lib/journey";
import {
  BranchSearchMode,
  branchSearchModeToParams,
  parseBranchSearchMode,
} from "@/lib/searchParams";
import { BRANCH_SEARCH_CACHE } from "@/lib/queryCache";
import { SEARCH_SOURCE_HEADER } from "@/lib/searchLog";

export function HomeClient() {
  const [searchInput, setSearchInput] = useState("");
  // 검색 조건은 URL 에 두어야 뒤로/앞으로 가기로 결과가 그대로 돌아온다.
  const [params, setParams] = useUrlSearchParams();
  const mode = useMemo(() => parseBranchSearchMode(params), [params]);
  const ref = useRef<HTMLDivElement>(null);
  const { recentBranches, removeRecentBranch } = useRecentBranches();
  const { data, error, fetchNextPage, isError, isFetching, refetch } =
    useInfiniteQuery<
      SimplifiedBranchResponse,
      Error,
      InfiniteData<SimplifiedBranchResponse>,
      ["branches", BranchSearchMode | null],
      number
    >({
      queryKey: ["branches", mode],
      enabled: mode !== null,
      // 무한 쿼리는 refetch 시 로드된 페이지를 전부 다시 부른다.
      // 매장 목록은 자주 바뀌지 않으므로 탭 복귀만으로 재조회하지 않는다.
      refetchOnWindowFocus: false,
      // 매장 상세를 보고 뒤로 돌아왔을 때 다시 불러오지 않도록 캐시를 오래 둔다.
      ...BRANCH_SEARCH_CACHE,
      meta: { suppressGlobalError: true },
      initialPageParam: 1,
      getNextPageParam: (lastPage, _pages, lastPageParam) =>
        lastPage.length < 10 ? undefined : lastPageParam + 1,
      queryFn: async ({ pageParam = 1, queryKey: [, searchMode] }) => {
        if (!searchMode) {
          // enabled 가 막아주므로 실제로는 도달하지 않는다.
          return [];
        }

        const url = new URL("/api/branches/search", window.location.origin);
        if (searchMode.type === "location") {
          url.searchParams.set("curLttd", searchMode.lat.toFixed(14));
          url.searchParams.set("curLitd", searchMode.lng.toFixed(14));
        } else {
          url.searchParams.set("keyword", searchMode.keyword);
        }
        url.searchParams.set("currentPage", pageParam.toString());
        url.searchParams.set("pageSize", "10");
        url.searchParams.set("pageIndex", "0");
        const response = await fetch(url, {
          // 검색어 수집에서 웹 UI 검색과 API 직접 호출을 구분하기 위한 표식.
          headers: { [SEARCH_SOURCE_HEADER]: "web" },
        });
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
  // Search 의 안내 문구는 "검색을 한 적이 있는지" 만 알면 된다.
  const searchLabel = mode
    ? mode.type === "keyword"
      ? mode.keyword
      : "현재 위치"
    : "";

  // 뒤로/앞으로 가기로 검색어가 바뀌면 입력창도 함께 되돌린다.
  useEffect(() => {
    if (mode?.type === "keyword") {
      setSearchInput(mode.keyword);
    }
  }, [mode]);

  // 검색 결과가 도착한 시점을 검색 조건마다 한 번씩 기록한다.
  // 결과가 0건이거나 오류로 끝난 자리가 곧 대표적인 이탈 지점이다.
  const reportedSearchRef = useRef<string | null>(null);
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (isFetching) didFetchRef.current = true;
  }, [isFetching]);
  useEffect(() => {
    if (!mode || isFetching) return;
    if (!isError && data === undefined) return;

    const searchKey = JSON.stringify(mode);
    if (reportedSearchRef.current === searchKey) return;
    reportedSearchRef.current = searchKey;

    const keyword = mode.type === "keyword" ? mode.keyword : "(location)";
    if (isError) {
      trackSearchError("branch", { message: error?.message, keyword });
      return;
    }

    trackSearchResult("branch", {
      result_count: branches.length,
      search_mode: mode.type,
      keyword,
    });
    trackJourneyStep("branch_results", {
      result_count: branches.length,
      search_mode: mode.type,
      // 뒤로가기로 돌아와 캐시된 결과를 다시 본 경우와 새 검색을 구분한다.
      is_restored: !didFetchRef.current,
    });
  }, [mode, isFetching, isError, error, data, branches.length]);

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
      .submitter as HTMLButtonElement | null;
    const action = button?.value ?? "keyword";

    if (action === "location") {
      try {
        const position = await getCurrentPosition();
        setParams(
          branchSearchModeToParams({
            type: "location",
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        );
        trackEvent("branch_location_search");
        trackJourneyStep("branch_search", { search_mode: "location" });
      } catch (error) {
        console.error("위치 정보 오류:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "위치 정보를 가져오는데 실패했습니다. 다시 시도해주세요.";
        // 위치 권한 거부는 첫 화면에서 바로 이탈로 이어지는 흔한 원인이다.
        trackSearchError("branch", {
          message: errorMessage,
          keyword: "(location)",
        });
        alert(errorMessage);
      }
    } else {
      if (!searchInput.trim()) {
        return;
      }
      trackEvent("branch_search", { keyword: searchInput });
      trackJourneyStep("branch_search", {
        search_mode: "keyword",
        keyword: searchInput,
      });
      setParams(
        branchSearchModeToParams({ type: "keyword", keyword: searchInput }),
      );
    }
  };

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
    <>
      <ImageWithFallback
        src="/logo.svg"
        alt="다이소 파인더"
        width={200}
        height={80}
        priority
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
        keyword={searchLabel}
        withLocation
        searchButtonLabel="매장 검색"
        locationButtonLabel="현재 위치로 주변 매장 검색"
        toolName="search_daiso_stores"
        toolDescription="Search Daiso stores by address or store name and show selectable results."
        toolParamDescription="Address, neighborhood, or Daiso store name"
        errorMessage={isError ? error.message : undefined}
        onRetry={mode ? () => refetch() : undefined}
        scrollRestorationKey={mode ? `branches:${params.toString()}` : null}
        beforeForm={
          recentBranches.length > 0 ? (
            <nav
              aria-label="최근 본 다이소 매장"
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
                      width: "28px",
                      height: "28px",
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
                    <IconX aria-hidden="true" width={14} height={14} />
                  </button>
                </span>
              ))}
            </nav>
          ) : undefined
        }
      >
        {branches?.map((branch, index) => (
          <Link
            href={`/branch/${branch.code}`}
            className="card"
            key={branch.code}
            onClick={() =>
              trackEvent("branch_click", {
                branch_code: branch.code,
                branch_name: branch.name,
                // 결과 몇 번째를 고르는지 보면 목록이 쓸 만한지 알 수 있다.
                result_position: index + 1,
                result_count: branches.length,
                search_mode: mode?.type ?? "(none)",
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
    </>
  );
}
