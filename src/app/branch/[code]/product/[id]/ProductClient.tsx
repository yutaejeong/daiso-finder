"use client";

import { SimplifiedBranch } from "@/app/api/branches/types";
import {
  ProductDetailResponse,
  SimplifiedProductInfo,
} from "@/app/api/products/types";
import { css } from "@styled-system/css";
import {
  IconArrowLeft,
  IconBuildingStore,
  IconMapPin,
  IconPhotoX,
  IconStairs,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

interface Props {
  code: string;
  productId: string;
  branch: SimplifiedBranch;
  product: SimplifiedProductInfo | null;
}

function formatFloor(stairNo: number) {
  return stairNo < 0 ? `B${-stairNo}` : `${stairNo}F`;
}

export function ProductClient({ code, productId, branch, product }: Props) {
  const name = product?.name ?? null;
  const image = product?.image ?? null;
  const price = product?.price ?? null;
  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<ProductDetailResponse>({
      queryKey: ["product-detail", code, productId],
      queryFn: async () => {
        const params = new URLSearchParams({ branchCode: code });
        const res = await fetch(
          `/api/products/${productId}?${params.toString()}`,
        );
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            body?.error || "상품 정보를 불러오는 중 오류가 발생했습니다.",
            { cause: body?.detail },
          );
        }
        return res.json();
      },
      meta: { suppressGlobalError: true },
    });

  const stock = data?.stock ?? null;
  const stairNo = data?.stairNo ?? null;
  const zoneNo = data?.zoneNo ?? null;
  const otherBranches = data?.otherBranches ?? [];

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
      <Link href="/" aria-label="다이소 파인더 홈으로 이동">
        <Image
          src="/logo.svg"
          alt="다이소 파인더 로고"
          width={200}
          height={80}
          priority
          draggable={false}
          style={{ WebkitUserDrag: "none" } as React.CSSProperties}
          className={css({
            userSelect: "none",
            marginBottom: "16px",
            width: "150px",
            height: "60px",
            lg: { width: "200px", height: "80px" },
          })}
        />
      </Link>

      <Link
        href={`/branch/${code}`}
        className={css({
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "12px",
          color: "#666",
          fontSize: "0.875rem",
          textDecoration: "none",
          width: "fit-content",
          _hover: { color: "#c4002f" },
        })}
      >
        <IconArrowLeft width={16} height={16} aria-hidden="true" />
        <mark
          className={css({ backgroundColor: "transparent", color: "inherit" })}
        >
          {branch.name}
        </mark>
        <span>상품 검색으로 돌아가기</span>
      </Link>

      <div
        className={css({
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        })}
      >
        {/* 상품 헤더 */}
        <article
          className={css({
            display: "flex",
            gap: "14px",
            padding: "16px",
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #e5e5e5",
          })}
        >
          {image ? (
            <Image
              src={image}
              alt={name ?? "상품 이미지"}
              width={96}
              height={128}
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
                width: "96px",
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
              <IconPhotoX width={40} height={40} />
            </div>
          )}
          <div
            className={css({
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "8px",
            })}
          >
            <h1
              className={css({
                fontSize: "1.05rem",
                fontWeight: "bold",
                wordBreak: "keep-all",
                lineHeight: 1.4,
                color: "#1a1a1a",
                margin: 0,
              })}
            >
              {name ?? "상품 상세"}
            </h1>
            {price !== null && (
              <p
                className={css({
                  color: "#1a1a1a",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  margin: 0,
                  fontVariantNumeric: "tabular-nums",
                })}
              >
                {price.toLocaleString()}원
              </p>
            )}
          </div>
        </article>

        {/* 현재 지점 재고/위치 */}
        <section
          className={css({
            padding: "16px",
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #e5e5e5",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          })}
        >
          <h2
            className={css({
              fontSize: "1rem",
              fontWeight: "bold",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            })}
          >
            <IconBuildingStore
              width={20}
              height={20}
              color="#c4002f"
              aria-hidden="true"
            />
            <span>
              <mark>{branch.name}</mark> 재고·위치
            </span>
          </h2>

          <div
            className={css({
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            })}
          >
            <div
              className={css({
                flex: "1 1 120px",
                backgroundColor: "#f8f8f8",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center",
              })}
            >
              <p
                className={css({
                  fontSize: "0.75rem",
                  color: "#888",
                  margin: "0 0 4px",
                })}
              >
                재고
              </p>
              <p
                className={css({
                  fontSize: "1.25rem",
                  fontWeight: "black",
                  color: stock && stock > 0 ? "#c4002f" : "#999",
                  margin: 0,
                  fontVariantNumeric: "tabular-nums",
                })}
              >
                {stock === null
                  ? isLoading
                    ? "조회 중..."
                    : "-"
                  : stock > 0
                    ? `${stock}개 이하`
                    : "품절"}
              </p>
            </div>
            <div
              className={css({
                flex: "1 1 120px",
                backgroundColor: "#f8f8f8",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center",
              })}
              aria-label={
                stairNo !== null && zoneNo !== null
                  ? `진열 위치: ${stairNo < 0 ? `지하${-stairNo}층` : `${stairNo}층`} ${zoneNo}구역`
                  : "진열 위치 정보 없음"
              }
            >
              <p
                className={css({
                  fontSize: "0.75rem",
                  color: "#888",
                  margin: "0 0 4px",
                })}
              >
                진열 위치
              </p>
              {stairNo !== null && zoneNo !== null ? (
                <p
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    margin: 0,
                  })}
                >
                  <span
                    className={css({
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    })}
                  >
                    <IconStairs
                      width={16}
                      height={16}
                      stroke={2.25}
                      color="#666"
                      aria-hidden="true"
                    />
                    <span
                      className={css({
                        fontWeight: "black",
                        fontSize: "1.25rem",
                        color: "#c4002f",
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                      })}
                    >
                      {formatFloor(stairNo)}
                    </span>
                  </span>
                  <span
                    className={css({
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    })}
                  >
                    <IconMapPin
                      width={16}
                      height={16}
                      stroke={2.25}
                      color="#666"
                      aria-hidden="true"
                    />
                    <span
                      className={css({
                        backgroundColor: "#c4002f",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        lineHeight: 1.2,
                        fontVariantNumeric: "tabular-nums",
                      })}
                    >
                      {zoneNo}
                    </span>
                  </span>
                </p>
              ) : (
                <p
                  className={css({
                    fontSize: "1rem",
                    color: "#999",
                    margin: 0,
                  })}
                >
                  {isLoading ? "조회 중..." : "정보 없음"}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 다른 지점 재고 */}
        <section
          className={css({
            padding: "16px",
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #e5e5e5",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          })}
        >
          <h2
            className={css({
              fontSize: "1rem",
              fontWeight: "bold",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            })}
          >
            <IconMapPin
              width={20}
              height={20}
              color="#c4002f"
              aria-hidden="true"
            />
            <span>이 상품이 있는 다른 지점</span>
          </h2>

          {isError ? (
            <div
              role="alert"
              className={css({
                textAlign: "center",
                padding: "20px 8px",
                color: "#4a4a4a",
              })}
            >
              <p className={css({ margin: "0 0 12px" })}>{error.message}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="btn btn-red"
              >
                다시 시도
              </button>
            </div>
          ) : isLoading || isFetching ? (
            <p
              role="status"
              aria-live="polite"
              className={css({
                textAlign: "center",
                color: "#888",
                padding: "16px 0",
                margin: 0,
              })}
            >
              주변 지점 재고를 확인하고 있어요...
            </p>
          ) : otherBranches.length === 0 ? (
            <p
              className={css({
                textAlign: "center",
                color: "#888",
                padding: "16px 0",
                margin: 0,
              })}
            >
              주변에 이 상품이 있는 다른 지점을 찾지 못했어요.
            </p>
          ) : (
            <ul
              className={css({
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              })}
            >
              {otherBranches.map((other) => (
                <li key={other.code}>
                  <Link
                    href={`/branch/${other.code}/product/${productId}`}
                    className={css({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      padding: "12px",
                      backgroundColor: "#f8f8f8",
                      borderRadius: "8px",
                      border: "1px solid #eee",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "border-color 0.15s",
                      _hover: { borderColor: "#c4002f" },
                    })}
                  >
                    <div className={css({ minWidth: 0 })}>
                      <p
                        className={css({
                          fontWeight: "bold",
                          fontSize: "0.95rem",
                          color: "#1a1a1a",
                          margin: "0 0 2px",
                          wordBreak: "keep-all",
                        })}
                      >
                        {other.name}
                      </p>
                      <p
                        className={css({
                          fontSize: "0.8125rem",
                          color: "#888",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        })}
                      >
                        {other.distanceKm !== null
                          ? `${other.distanceKm.toFixed(1)}km · `
                          : ""}
                        {other.address}
                      </p>
                    </div>
                    <span
                      className={css({
                        flexShrink: 0,
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                        color: "#c4002f",
                        fontVariantNumeric: "tabular-nums",
                      })}
                    >
                      재고 {other.stock}개 이하
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
