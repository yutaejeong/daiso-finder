/** 사람이 읽는 출력 포맷. --json 을 주면 이 함수들은 쓰이지 않는다. */

export function formatStores(stores) {
  if (!Array.isArray(stores) || stores.length === 0) {
    return "매장을 찾지 못했습니다.";
  }

  return stores
    .map(
      (store) =>
        `${store.code}\t${store.name}\n\t${store.address}\n\t영업 ${store.openTime}–${store.closeTime}  (${store.lat}, ${store.lng})`,
    )
    .join("\n\n");
}

export function formatStore(store) {
  return [
    `${store.name} (${store.code})`,
    `주소: ${store.address}`,
    `영업시간: ${store.openTime} – ${store.closeTime}`,
    `좌표: ${store.lat}, ${store.lng}`,
  ].join("\n");
}

export function formatProducts(result) {
  const products = result?.products ?? [];

  if (products.length === 0) {
    return "이 매장에 재고가 있는 상품을 찾지 못했습니다.";
  }

  const lines = products.map(
    (product) =>
      `${product.id}\t${product.name}\n\t${formatPrice(product.price)}  재고 ${product.stock}개  ${product.stairNo}층 ${product.zoneNo}구역`,
  );

  if (result.hasMore) {
    lines.push(
      `\n더 있습니다. --page ${result.nextPage} 로 이어서 조회하세요.`,
    );
  }

  return lines.join("\n\n");
}

export function formatAvailability(availability) {
  const placement =
    availability.stairNo === null || availability.zoneNo === null
      ? "진열 위치 정보 없음"
      : `${availability.stairNo}층 ${availability.zoneNo}구역`;

  const lines = [`재고 ${availability.stock}개`, placement];

  const others = availability.otherBranches ?? [];
  if (others.length > 0) {
    lines.push("", "재고가 있는 주변 매장:");
    for (const branch of others) {
      const distance =
        typeof branch.distanceKm === "number"
          ? ` (${branch.distanceKm}km)`
          : "";
      lines.push(
        `  ${branch.code}\t${branch.name}${distance}  재고 ${branch.stock}개`,
      );
    }
  }

  return lines.join("\n");
}

export function formatPrice(price) {
  return `${Number(price).toLocaleString("ko-KR")}원`;
}

/** API 오류 본문을 그대로 보여주면 hint 덕분에 다음 행동이 분명해진다. */
export function formatApiError(body, status) {
  if (!body || typeof body !== "object") {
    return `요청이 실패했습니다 (HTTP ${status}).`;
  }

  const lines = [
    `${body.error ?? "요청이 실패했습니다."} (HTTP ${body.status ?? status})`,
  ];
  if (body.code) lines.push(`code: ${body.code}`);
  if (body.hint) lines.push(`hint: ${body.hint}`);
  if (body.documentation) lines.push(`docs: ${body.documentation}`);
  return lines.join("\n");
}
