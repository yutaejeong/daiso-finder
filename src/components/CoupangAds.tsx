"use client";

import { css } from "@styled-system/css";
import {
  IconExternalLink,
  IconPhotoX,
  IconShoppingCart,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { trackEvent } from "@/lib/gtag";
import { sendViewBeacon } from "@/lib/viewBeacon";
import type { CoupangAd, CoupangAdList } from "@/lib/coupangPartners";

interface Props {
  keyword: string;
  branchCode: string;
}

const AD_NETWORK = "coupang";

/** 노란 "광고" 표시. 카드마다, 그리고 묶음 제목 옆에 붙는다. */
function AdBadge() {
  return (
    <span
      className={css({
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        padding: "2px 7px",
        borderRadius: "6px",
        backgroundColor: "var(--ad-badge)",
        color: "var(--ad-ink)",
        fontSize: "0.6875rem",
        fontWeight: 800,
        lineHeight: 1.4,
        letterSpacing: "0.02em",
      })}
    >
      광고
    </span>
  );
}

function AdImage({ ad }: { ad: CoupangAd }) {
  const [failed, setFailed] = useState(false);
  const boxClass = css({
    width: "84px",
    height: "84px",
    flexShrink: 0,
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--ad-line)",
    objectFit: "contain",
  });

  if (!ad.image || failed) {
    return (
      <div
        aria-hidden="true"
        className={`${boxClass} ${css({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
        })}`}
      >
        <IconPhotoX width={32} height={32} />
      </div>
    );
  }

  return (
    // 쿠팡 이미지는 그쪽 CDN 에서 바로 받는다. 이미지 최적화 한도를 광고에 쓰지 않는다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ad.image}
      alt=""
      width={84}
      height={84}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={boxClass}
    />
  );
}

/**
 * 매장 상품 검색이 0건일 때 같은 검색어로 찾은 쿠팡 상품(쿠팡 파트너스 광고).
 * 매장 상품 카드와 같은 골격을 쓰되, 노란 배경과 "광고" 표시로 광고임을 분명히 한다.
 * 광고가 꺼져 있거나 하나도 없으면 아무것도 그리지 않는다.
 */
export function CoupangAds({ keyword, branchCode }: Props) {
  const titleId = useId();
  const { data } = useQuery<CoupangAdList>({
    queryKey: ["partners", "coupang", keyword],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/partners/coupang?keyword=${encodeURIComponent(keyword)}`,
        { signal },
      );
      if (!response.ok) {
        throw new Error(`광고를 불러오지 못했습니다. (${response.status})`);
      }
      return response.json();
    },
    enabled: keyword.length > 0,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    meta: { suppressGlobalError: true },
  });

  const ads = data?.items ?? [];

  // 노출은 첫 광고 카드가 절반 이상 화면에 들어왔을 때 검색어마다 한 번만 센다.
  // 광고 묶음은 "검색 결과가 없습니다" 아래에 있어 그려졌다고 보인 것은 아니다.
  // 스프레드시트 쪽은 탭 세션 안에서 같은 매장·검색어를 한 번만 센다(viewBeacon).
  const firstAdRef = useRef<HTMLAnchorElement | null>(null);
  const reportedRef = useRef<string | null>(null);
  const adCount = ads.length;
  useEffect(() => {
    const target = firstAdRef.current;
    if (adCount === 0 || !target) return;
    const key = `${branchCode}:${keyword}`;
    if (reportedRef.current === key) return;

    const report = () => {
      if (reportedRef.current === key) return;
      reportedRef.current = key;
      trackEvent("ad_impression", {
        ad_network: AD_NETWORK,
        ad_count: adCount,
        keyword,
        branch_code: branchCode,
      });
      sendViewBeacon({ type: "ad_impression", branchCode, keyword, adCount });
    };

    if (typeof IntersectionObserver === "undefined") {
      report();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          report();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [adCount, keyword, branchCode]);

  if (ads.length === 0 || !data) {
    return null;
  }

  return (
    <section
      aria-labelledby={titleId}
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      })}
    >
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          margin: "0 2px 2px",
        })}
      >
        <h2
          id={titleId}
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "6px",
            margin: 0,
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "var(--ink-2)",
            wordBreak: "keep-all",
          })}
        >
          <IconShoppingCart
            aria-hidden="true"
            width={18}
            height={18}
            className={css({ flexShrink: 0, color: "var(--ad-ink)" })}
          />
          <span>이 매장엔 없지만, 쿠팡에서 찾아봤어요</span>
          <AdBadge />
        </h2>
        <p
          className={css({
            margin: 0,
            fontSize: "0.75rem",
            lineHeight: 1.5,
            color: "var(--muted)",
            wordBreak: "keep-all",
          })}
        >
          {data.disclosure}
        </p>
      </div>

      {ads.map((ad, index) => (
        <a
          key={ad.id}
          ref={index === 0 ? firstAdRef : undefined}
          href={ad.url}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          aria-label={`광고: ${ad.name}, ${ad.price.toLocaleString()}원, 쿠팡에서 보기 (새 창)`}
          onClick={() => {
            trackEvent("ad_click", {
              ad_network: AD_NETWORK,
              product_id: ad.id,
              product_name: ad.name.slice(0, 100),
              result_position: index + 1,
              result_count: ads.length,
              keyword,
              branch_code: branchCode,
            });
            sendViewBeacon({
              type: "ad_click",
              branchCode,
              keyword,
              productId: ad.id,
              productName: ad.name,
            });
          }}
          className={css({
            padding: "14px",
            backgroundColor: "var(--ad-bg)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--ad-line)",
            boxShadow: "var(--shadow-1)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            textDecoration: "none",
            color: "inherit",
            transition:
              "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
            _active: { transform: "scale(0.985)" },
            "@media (hover: hover)": {
              "&:hover": {
                borderColor: "var(--ad-line-strong)",
                boxShadow: "var(--shadow-hover)",
              },
            },
          })}
        >
          <div
            className={css({
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            })}
          >
            <AdBadge />
            <h3
              className={css({
                fontSize: "0.95rem",
                fontWeight: "bold",
                wordBreak: "keep-all",
                lineHeight: 1.4,
                color: "var(--ink)",
                margin: 0,
                minWidth: 0,
                lineClamp: 2,
              })}
            >
              {ad.name}
            </h3>
          </div>
          <div
            className={css({
              display: "flex",
              gap: "12px",
              alignItems: "stretch",
            })}
          >
            <AdImage ad={ad} />
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
                  gap: "4px",
                })}
              >
                <p
                  className={css({
                    color: "var(--ink)",
                    fontSize: "1.125rem",
                    fontWeight: "bold",
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  })}
                >
                  {ad.price.toLocaleString()}원
                </p>
                {(ad.isRocket || ad.isFreeShipping) && (
                  <p
                    className={css({
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                      margin: 0,
                    })}
                  >
                    {ad.isRocket && <ShippingTag>로켓배송</ShippingTag>}
                    {ad.isFreeShipping && <ShippingTag>무료배송</ShippingTag>}
                  </p>
                )}
              </div>
              <span
                aria-hidden="true"
                className={css({
                  alignSelf: "flex-end",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--ad-ink)",
                })}
              >
                쿠팡에서 보기
                <IconExternalLink width={15} height={15} stroke={2.25} />
              </span>
            </div>
          </div>
        </a>
      ))}
    </section>
  );
}

function ShippingTag({ children }: { children: string }) {
  return (
    <span
      className={css({
        padding: "1px 6px",
        borderRadius: "6px",
        border: "1px solid var(--ad-line)",
        backgroundColor: "var(--surface)",
        color: "var(--ink-2)",
        fontSize: "0.75rem",
        fontWeight: 600,
        lineHeight: 1.5,
      })}
    >
      {children}
    </span>
  );
}
