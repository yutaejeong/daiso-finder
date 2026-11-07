"use client";

import { css } from "@styled-system/css";
import { IconFlame, IconPhotoX } from "@tabler/icons-react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { trackEvent } from "@/lib/gtag";
import type { PopularProduct } from "@/lib/popular";

interface Props {
  branchCode: string;
  products: PopularProduct[];
}

/** 매장 화면에서 검색 전에 보여주는, 이 매장에서 많이 찾는 상품 목록 */
export function PopularProducts({ branchCode, products }: Props) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="popular-products-title">
      <h2
        id="popular-products-title"
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "6px",
          margin: "4px 0 8px",
          fontSize: "0.9375rem",
          fontWeight: 700,
          color: "#4a4a4a",
        })}
      >
        <IconFlame
          aria-hidden="true"
          width={18}
          height={18}
          className={css({ color: "#c4002f" })}
        />
        이 매장에서 많이 찾는 상품
      </h2>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        })}
      >
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={`/branch/${branchCode}/product/${product.id}`}
            onClick={() =>
              trackEvent("popular_product_click", {
                branch_code: branchCode,
                product_id: product.id,
                product_name: product.name,
                result_position: index + 1,
                result_count: products.length,
              })
            }
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e5e5e5",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.15s",
              _hover: { borderColor: "#c4002f" },
            })}
          >
            {product.image ? (
              <ImageWithFallback
                src={product.image}
                alt=""
                width={48}
                height={64}
                className={css({
                  borderRadius: "4px",
                  objectFit: "cover",
                  flexShrink: 0,
                  width: "48px",
                  height: "64px",
                  backgroundColor: "#f5f5f5",
                })}
              />
            ) : (
              <div
                aria-hidden="true"
                className={css({
                  width: "48px",
                  height: "64px",
                  flexShrink: 0,
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                })}
              >
                <IconPhotoX width={24} height={24} />
              </div>
            )}
            <div className={css({ minWidth: 0 })}>
              <h3
                className={css({
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  lineHeight: 1.4,
                  wordBreak: "keep-all",
                  color: "#1a1a1a",
                })}
              >
                {product.name}
              </h3>
              <p
                className={css({
                  margin: "2px 0 0",
                  fontSize: "0.875rem",
                  color: "#666",
                  fontVariantNumeric: "tabular-nums",
                })}
              >
                {product.price.toLocaleString()}원
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
