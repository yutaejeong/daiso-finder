/**
 * Accept 협상으로 HTML/Markdown 두 표현을 내려주므로 Vary 에 Accept 가 없으면
 * CDN 이 한 표현을 다른 요청에 그대로 재사용한다. Next 가 붙이는 RSC 관련
 * 값들을 지운 채 덮어쓰면 라우터 프리페치 캐시가 깨지므로 항상 병합한다.
 */
export const REQUIRED_VARY = ["Accept", "Accept-Encoding"];

export function appendVary(existing: string | null | undefined): string {
  const values = (existing ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const seen = new Set(values.map((value) => value.toLowerCase()));

  for (const value of REQUIRED_VARY) {
    if (!seen.has(value.toLowerCase())) {
      values.push(value);
      seen.add(value.toLowerCase());
    }
  }

  return values.join(", ");
}
