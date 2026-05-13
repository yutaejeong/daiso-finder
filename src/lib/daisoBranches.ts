import {
  Branch,
  BranchResponse,
  SimplifiedBranch,
} from "@/app/api/branches/types";

export class DaisoBranchApiError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number, detail: string) {
    super(message);
    this.name = "DaisoBranchApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function simplifyBranch(branch: Branch): SimplifiedBranch {
  return {
    code: branch.strCd,
    name: branch.strNm,
    lat: branch.strLttd,
    lng: branch.strLitd,
    address: branch.strAddr,
    openTime: branch.opngTime,
    closeTime: branch.clsngTime,
  };
}

export async function fetchBranchByCode(
  code: string,
): Promise<SimplifiedBranch | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/ms/msg/selStr`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inclusiveStrCd: code,
      }),
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new DaisoBranchApiError(
      "매장 정보를 불러오는 중 오류가 발생했습니다.",
      response.status,
      responseText,
    );
  }

  const data: BranchResponse = JSON.parse(responseText);
  const branch = data.data?.[0];

  return branch ? simplifyBranch(branch) : null;
}
