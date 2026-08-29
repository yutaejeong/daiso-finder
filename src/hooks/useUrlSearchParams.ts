"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface UpdateOptions {
  /** 히스토리에 새 항목을 남기지 않고 현재 항목을 덮어쓴다. */
  replace?: boolean;
}

function toUrl(params: URLSearchParams) {
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ""}`;
}

/**
 * 현재 URL 의 쿼리스트링을 상태로 노출하고, 서버 왕복 없이 갱신한다.
 *
 * - 갱신은 Next 가 감싸 둔 `history.pushState` 를 쓰므로 라우터 상태와
 *   동기화되면서도 RSC 를 다시 받아오지 않는다.
 * - 뒤로/앞으로 가기는 `popstate` 로 감지해 다시 읽는다.
 *
 * `useSearchParams` 대신 직접 읽는 이유는, 훅을 쓰면 홈처럼 정적으로
 * 렌더링돼야 하는 페이지가 Suspense 경계 밖에서 CSR 로 밀려나기 때문이다.
 * 서버 렌더링 시점에는 쿼리스트링을 알 수 없으므로 마운트 후 한 번 읽는다.
 */
export function useUrlSearchParams() {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const sync = () => setSearch(window.location.search);
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const params = useMemo(() => new URLSearchParams(search), [search]);

  const setParams = useCallback(
    (next: URLSearchParams, { replace = false }: UpdateOptions = {}) => {
      const url = toUrl(next);
      if (url === `${window.location.pathname}${window.location.search}`) {
        // 같은 조건으로 다시 검색하면 히스토리를 늘리지 않는다.
        return;
      }

      if (replace) {
        window.history.replaceState(null, "", url);
      } else {
        window.history.pushState(null, "", url);
      }
      setSearch(next.toString() ? `?${next.toString()}` : "");
    },
    [],
  );

  return [params, setParams] as const;
}
