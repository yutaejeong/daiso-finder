"use client";

import { SimplifiedBranch } from "@/app/api/branches/types";
import {
  ProductApiResponse,
  SimplifiedProduct,
} from "@/app/api/products/types";
import { Search } from "@/components/Search";
import { css } from "@styled-system/css";
import { IconPhotoX } from "@tabler/icons-react";
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
}

export default function Branch() {
  const { code } = useParams<{ code: string }>();
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const { data: branch } = useQuery<SimplifiedBranch>({
    queryKey: ["branch", code],
    queryFn: async () => {
      const res = await fetch(`/api/branches/${code}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error || "매장 정보를 불러오는 중 오류가 발생했습니다.",
          { cause: body?.detail },
        );
      }
      return res.json();
    },
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
          throw new Error(body?.error || "상품 검색 중 오류가 발생했습니다.", {
            cause: body?.detail,
          });
        }
        return response.json();
      },
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage.hasMore) return undefined;
        return allPages.length + 1;
      },
      enabled: !!keyword,
      initialPageParam: 1,
    });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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
      <Link href="/">
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
      </Link>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "8px",
        })}
      >
        <h1>
          <mark>{branch?.name}</mark>
          <span>의 상품을 찾아드려요.</span>
        </h1>
      </div>
      <div
        className={css({
          width: "100%",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          padding: "16px",
          marginBottom: "16px",
        })}
      >
        <div>
          <strong className={css({ marginRight: "4px" })}>주소</strong>
          <a
            href={`https://map.kakao.com/link/to/다이소 ${branch?.name},${branch?.lat},${branch?.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {branch?.address}
          </a>
        </div>
        <div>
          <strong className={css({ marginRight: "4px" })}>영업시간</strong>
          <time>{branch?.openTime}</time>
          <span className={css({ margin: "0 4px" })}>~</span>
          <time>{branch?.closeTime}</time>
        </div>
      </div>

      <Search
        title="상품을 검색해보세요"
        placeholder="상품명을 입력해주세요"
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSubmit={handleSearch}
        isFetching={isFetching}
        hasResults={products.length > 0}
        keyword={keyword}
      >
        {products.map((product: SimplifiedProduct) => (
          <div
            key={product.id}
            className={css({
              padding: "12px",
              backgroundColor: "white",
              borderRadius: "4px",
              border: "1px solid #e0e0e0",
            })}
          >
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
                  width={80}
                  height={80}
                  className={css({
                    borderRadius: "4px",
                    objectFit: "cover",
                    flexShrink: 0,
                  })}
                />
              ) : (
                <div
                  className={css({
                    width: "80px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "4px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#666",
                  })}
                >
                  <IconPhotoX width={40} height={40} />
                </div>
              )}
              <div className={css({ flex: 1, display: "flex", gap: "8px" })}>
                <div
                  className={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    flex: 1,
                  })}
                >
                  <h3 className={css({ fontSize: "1rem", fontWeight: "bold" })}>
                    {product.name}
                  </h3>
                  <div className={css({ flex: 1 })} />
                  <span className={css({ color: "#666" })}>
                    {product.price.toLocaleString()}원
                  </span>
                  <span className={css({ color: "#666" })}>
                    재고 {product.stock}개 이하
                  </span>
                </div>
                <div
                  className={css({
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    width: "100px",
                  })}
                >
                  <h1
                    className={css({
                      fontWeight: "black",
                      color: "#ED1C24 !important",
                      marginBottom: "0 !important",
                    })}
                  >
                    {product.stairNo < 0
                      ? `B${-product.stairNo}`
                      : `${product.stairNo}F`}
                  </h1>
                  <span
                    className={css({
                      backgroundColor: "#ED1C24",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                    })}
                  >
                    {product.zoneNo}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className={css({
              marginTop: "16px",
              padding: "8px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              cursor: "pointer",
              "&:disabled": {
                opacity: 0.5,
                cursor: "not-allowed",
              },
            })}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"}
          </button>
        )}
      </Search>
    </main>
  );
}
