import {
  Branch,
  BranchResponse,
  SimplifiedBranch,
} from "@/app/api/branches/types";
import { selStr } from "@/generated/daiso/client";
import { DaisoApiError } from "@/lib/daisoApiClient";

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
  try {
    const data = (await selStr({
      inclusiveStrCd: code,
    })) as unknown as BranchResponse;
    const branch = data.data?.[0];

    return branch ? simplifyBranch(branch) : null;
  } catch (error) {
    if (!(error instanceof DaisoApiError)) {
      throw error;
    }

    throw new DaisoBranchApiError(
      "매장 정보를 불러오는 중 오류가 발생했습니다.",
      error.status,
      error.detail,
    );
  }
}
