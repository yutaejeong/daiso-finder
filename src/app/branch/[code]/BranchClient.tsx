"use client";

import { SimplifiedBranch } from "@/app/api/branches/types";
import {
  ProductApiResponse,
  SimplifiedProduct,
} from "@/app/api/products/types";
import { Search } from "@/components/Search";
import { useI18n } from "@/i18n/I18nProvider";
import { trackEvent } from "@/lib/gtag";
import { css } from "@styled-system/css";
import { IconPhotoX } from "@tabler/icons-react";
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Props {
  code: string;
  initialBranch: SimplifiedBranch | null;
}

export function BranchClient({ code, initialBranch }: Props) {
  const { t } = useI18n();
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const { data: branch } = useQuery<SimplifiedBranch>({
    queryKey: ["branch", code],
    queryFn: async () => {
      const res = await fetch(`/api/branches/${code}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || t("branch", "branchLoadError"), {
          cause: body?.detail,
        });
      }
      return res.json();
    },
    initialData: initialBranch ?? undefined,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery<
      ProductApiResponse,
      Error,
      InfiniteData<ProductApiResponse>,
      ["products", string, string],
      number
    >({
      queryKey: ["products", code, keyword],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await fetch(
          `/api/products?keyword=${keyword}&currentPage=${pageParam}&branchCode=${code}`,
        );
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || t("branch", "productLoadError"), {
            cause: body?.detail,
          });
        }
        return response.json();
      },
      getNextPageParam: (lastPage) => {
        if (!lastPage.hasMore) return undefined;
        return lastPage.nextPage;
      },
      enabled: !!keyword,
      initialPageParam: 1,
    });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent("product_search", { keyword: searchInput, branch_code: code });
    setKeyword(searchInput);
  };

  const products = data?.pages.flatMap((page) => page.products) || [];

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
      <Link href="/" aria-label={t("common", "homeAriaLabel")}>
        <Image
          src="/logo.svg"
          alt={t("common", "logoAlt")}
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
      <h1
        className={css({
          marginBottom: "8px",
          wordBreak: "keep-all",
        })}
      >
        {t("branch", "headingBefore")}
        <mark>{branch?.name}</mark>
        {t("branch", "headingAfter")}
      </h1>
      <address
        className={css({
          width: "100%",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          padding: "16px",
          marginBottom: "16px",
          fontStyle: "normal",
        })}
      >
        <div>
          <strong className={css({ marginRight: "4px" })}>
            {t("branch", "address")}
          </strong>
          <a
            href={`https://map.kakao.com/link/to/다이소 ${branch?.name},${branch?.lat},${branch?.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {branch?.address}
          </a>
        </div>
        <div>
          <strong className={css({ marginRight: "4px" })}>
            {t("branch", "openingHours")}
          </strong>
          <time dateTime={branch?.openTime}>{branch?.openTime}</time>
          <span className={css({ margin: "0 4px" })}>~</span>
          <time dateTime={branch?.closeTime}>{branch?.closeTime}</time>
        </div>
      </address>

      <Search
        title={t("branch", "productSearchTitle")}
        placeholder={t("branch", "productSearchPlaceholder")}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSubmit={handleSearch}
        isFetching={isFetching}
        hasResults={products.length > 0}
        keyword={keyword}
      >
        {products.map((product: SimplifiedProduct) => (
          <article
            key={product.id}
            className={css({
              padding: "14px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e5e5e5",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            })}
          >
            <h2
              className={css({
                fontSize: "0.95rem",
                fontWeight: "bold",
                wordBreak: "keep-all",
                lineHeight: 1.4,
                color: "#1a1a1a",
                margin: 0,
              })}
            >
              {product.name}
            </h2>
            <div
              className={css({
                display: "flex",
                gap: "12px",
                alignItems: "stretch",
              })}
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={84}
                  height={112}
                  className={css({
                    borderRadius: "6px",
                    objectFit: "cover",
                    flexShrink: 0,
                    aspectRatio: "3 / 4",
                    backgroundColor: "#f5f5f5",
                  })}
                />
              ) : (
                <div
                  aria-hidden="true"
                  className={css({
                    width: "84px",
                    aspectRatio: "3 / 4",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "6px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                  })}
                >
                  <IconPhotoX width={36} height={36} />
                </div>
              )}
              <div
                className={css({
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "4px",
                  minWidth: 0,
                })}
              >
                <div
                  className={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  })}
                >
                  <p
                    className={css({
                      color: "#1a1a1a",
                      fontSize: "1.125rem",
                      fontWeight: "bold",
                      margin: 0,
                      fontVariantNumeric: "tabular-nums",
                    })}
                  >
                    {t("branch", "priceFormat", {
                      price: product.price.toLocaleString(),
                    })}
                  </p>
                  <p
                    className={css({
                      color: "#888",
                      fontSize: "0.8125rem",
                      margin: 0,
                    })}
                  >
                    {t("branch", "stockLessThan", { count: product.stock })}
                  </p>
                </div>
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    alignSelf: "flex-end",
                  })}
                  aria-label={t("branch", "shelfAriaLabel", {
                    floor:
                      product.stairNo < 0
                        ? t("branch", "floorBelowSpoken", {
                            n: -product.stairNo,
                          })
                        : t("branch", "floorAboveSpoken", {
                            n: product.stairNo,
                          }),
                    zone: product.zoneNo,
                  })}
                >
                  <span
                    className={css({
                      fontWeight: "black",
                      fontSize: "1.25rem",
                      color: "#ED1C24",
                      lineHeight: 1,
                    })}
                  >
                    {product.stairNo < 0
                      ? t("branch", "floorBelow", { n: -product.stairNo })
                      : t("branch", "floorAbove", { n: product.stairNo })}
                  </span>
                  <span
                    className={css({
                      backgroundColor: "#ED1C24",
                      color: "white",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      lineHeight: 1.2,
                      fontVariantNumeric: "tabular-nums",
                    })}
                  >
                    {product.zoneNo}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
        {hasNextPage && (
          <button
            onClick={() => { fetchNextPage(); trackEvent("product_load_more", { branch_code: code }); }}
            disabled={isFetchingNextPage}
            className={css({
              marginTop: "16px",
              padding: "8px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              cursor: "pointer",
              "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
            })}
          >
            {isFetchingNextPage
              ? t("search", "loadingMore")
              : t("search", "loadMore")}
          </button>
        )}
      </Search>
    </main>
  );
}
