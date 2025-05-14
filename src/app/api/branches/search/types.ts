export type Branch = {
  rgpsId: string | null;
  regDttm: string | null;
  mdpsId: string | null;
  modDttm: string | null;
  totalCnt: number;
  dataAllTotal: number;
  currentPageCnt: number;
  rnum: number;
  status: string | null;
  frRgerId: string | null;
  frRgDtm: string | null;
  lsUpdrId: string | null;
  lsUpdtDtm: string | null;
  strCd: string;
  strNm: string;
  strZip: string;
  strAddr: string;
  strDtlAddr: string | null;
  strTno: string;
  brchChgrCrryTno: string | null;
  parkYn: "Y" | "N";
  nmtkYn: "Y" | "N";
  phcYn: "Y" | "N";
  usimYn: "Y" | "N";
  ovrseaUsimYn: "Y" | "N";
  hbrdUsimYn: "Y" | "N";
  phstkYn: "Y" | "N";
  opngTime: string;
  clsngTime: string;
  pkupYn: "Y" | "N";
  bassPkupStrYn: "Y" | "N";
  pntAcmYn: "Y" | "N";
  pntUseYn: "Y" | "N";
  elecRctwYn: "Y" | "N";
  strLitd: number;
  strLttd: number;
  km: number | null;
  useYn: "Y" | "N";
  directYn: "Y" | "N";
  nocashYn: "Y" | "N";
};

export type BranchResponse = {
  message: string | null;
  data: Branch[];
  extraData: Record<string, unknown>;
  extraString: string | null;
  returnCode: string | null;
  success: boolean;
};

export type SimplifiedBranch = {
  code: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  openTime: string;
  closeTime: string;
};

export type SimplifiedBranchResponse = SimplifiedBranch[];
