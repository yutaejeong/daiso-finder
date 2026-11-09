import { HomeClient } from "./HomeClient";
import { AppShell } from "@/components/AppShell";

/**
 * 홈은 검색에만 집중한다. 서비스 설명·사용법·API 안내는 /about 으로 옮겼고,
 * 하단에는 사이트 링크 한 줄만 남긴다(AppShell 의 footer).
 */
export default function Home() {
  return (
    <AppShell footer>
      <HomeClient />
    </AppShell>
  );
}
