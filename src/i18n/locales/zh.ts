import type { Translation } from "./ko";

const zh: Translation = {
  common: {
    logoAlt: "大创门店查找 标志",
    homeAriaLabel: "返回大创门店查找首页",
    confirm: "确定",
    error: "出错了",
    languageSelectorLabel: "语言",
    defaultErrorMessage: "出错了，请稍后重试。",
  },
  home: {
    heading: "帮您查找身边大创门店的商品",
    searchTitle: "请选择门店",
    searchPlaceholder: "输入地址或门店名称",
    branchSearchError: "搜索门店时出错了。",
  },
  branch: {
    headingBefore: "为您查找 ",
    headingAfter: " 店内的商品。",
    address: "地址",
    openingHours: "营业时间",
    productSearchTitle: "搜索商品",
    productSearchPlaceholder: "请输入商品名称",
    stockLessThan: "库存 {count} 件以下",
    priceFormat: "₩{price}",
    floorBelow: "B{n}",
    floorAbove: "{n}F",
    shelfAriaLabel: "陈列位置：{floor} {zone}区",
    floorBelowSpoken: "地下{n}层",
    floorAboveSpoken: "{n}层",
    branchLoadError: "加载门店信息时出错了。",
    productLoadError: "搜索商品时出错了。",
  },
  search: {
    searching: "正在搜索…",
    noResults: "没有找到结果",
    promptInput: "请输入搜索关键词",
    loadMore: "加载更多",
    loadingMore: "加载中…",
  },
  location: {
    unsupported: "此浏览器不支持位置信息功能。",
    fallback: "无法获取您的位置信息。",
    permissionDenied:
      "位置信息访问被拒绝。请在浏览器设置中允许使用位置信息。",
    positionUnavailable:
      "暂时无法获取位置信息。请确认 GPS 已开启，稍后再试。",
    timeout: "位置信息请求超时。请重试。",
    unknown: "位置信息错误：{message}",
    unknownFallback: "发生了未知错误。",
    retry: "获取位置信息失败。请重试。",
  },
};

export default zh;
