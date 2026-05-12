import type { Translation } from "./ko";

const ja: Translation = {
  common: {
    logoAlt: "ダイソーファインダー ロゴ",
    homeAriaLabel: "ダイソーファインダーのホームに戻る",
    confirm: "OK",
    error: "エラー",
    languageSelectorLabel: "言語",
    defaultErrorMessage: "エラーが発生しました。もう一度お試しください。",
  },
  home: {
    heading: "今いる店舗の商品をお探しします",
    searchTitle: "店舗を選んでください",
    searchPlaceholder: "住所または店舗名を入力",
    branchSearchError: "店舗の検索中にエラーが発生しました。",
  },
  branch: {
    headingBefore: "",
    headingAfter: "の商品をお探しします。",
    address: "住所",
    openingHours: "営業時間",
    productSearchTitle: "商品を検索してみましょう",
    productSearchPlaceholder: "商品名を入力してください",
    stockLessThan: "在庫 {count} 個以下",
    priceFormat: "{price}ウォン",
    floorBelow: "B{n}",
    floorAbove: "{n}F",
    shelfAriaLabel: "陳列位置: {floor} {zone}エリア",
    floorBelowSpoken: "地下{n}階",
    floorAboveSpoken: "{n}階",
    branchLoadError: "店舗情報の読み込み中にエラーが発生しました。",
    productLoadError: "商品の検索中にエラーが発生しました。",
  },
  search: {
    searching: "検索中…",
    noResults: "検索結果がありません",
    promptInput: "検索キーワードを入力してください",
    loadMore: "もっと見る",
    loadingMore: "読み込み中…",
  },
  location: {
    unsupported: "このブラウザは位置情報に対応していません。",
    fallback: "位置情報を取得できませんでした。",
    permissionDenied:
      "位置情報へのアクセスが拒否されました。ブラウザの設定で位置情報を許可してください。",
    positionUnavailable:
      "位置情報を取得できません。GPSがオンになっているか確認し、しばらくしてから再度お試しください。",
    timeout: "位置情報のリクエストがタイムアウトしました。もう一度お試しください。",
    unknown: "位置情報エラー: {message}",
    unknownFallback: "不明なエラーが発生しました。",
    retry: "位置情報の取得に失敗しました。もう一度お試しください。",
  },
};

export default ja;
