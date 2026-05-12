"use client";

import { css } from "@styled-system/css";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { SimplifiedBranchResponse } from "./api/branches/types";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Search } from "@/components/Search";
import { useI18n } from "@/i18n/I18nProvider";
import { trackEvent } from "@/lib/gtag";

export default function Home() {
  const { t } = useI18n();
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState<{
    curLitd: number;
    curLttd: number;
  } | null>(null);
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
        throw new Error(body?.error || t("home", "branchSearchError"), {
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

  const getCurrentPosition = async () => {
    if (!navigator.geolocation) {
      throw new Error(t("location", "unsupported"));
    }

    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error: GeolocationPositionError) => {
          let errorMessage = t("location", "fallback");

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = t("location", "permissionDenied");
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = t("location", "positionUnavailable");
              break;
            case error.TIMEOUT:
              errorMessage = t("location", "timeout");
              break;
            default:
              errorMessage = t("location", "unknown", {
                message: error.message || t("location", "unknownFallback"),
              });
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
          error instanceof Error ? error.message : t("location", "retry");
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
      <Image
        src="/logo.svg"
        alt={t("common", "logoAlt")}
        width={200}
        height={80}
        draggable={false}
        style={{ WebkitUserDrag: 'none' } as React.CSSProperties}
        className={css({
          userSelect: 'none',
          marginBottom: "24px",
          width: "150px",
          height: "60px",
          lg: {
            width: "200px",
            height: "80px",
          },
        })}
      />
      <LanguageSelector />
      <h1>{t("home", "heading")}</h1>
      <Search
        title={t("home", "searchTitle")}
        placeholder={t("home", "searchPlaceholder")}
        searchInput={searchInput}
        onSearchInputChange={(value) => setSearchInput(value)}
        onSubmit={handleSearch}
        isFetching={isFetching}
        hasResults={branches.length > 0}
        keyword={keyword}
        withLocation
      >
        {branches?.map((branch) => (
          <Link
            href={`/branch/${branch.code}`}
            className="card"
            key={branch.code}
            onClick={() => trackEvent("branch_click", { branch_code: branch.code, branch_name: branch.name })}
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
