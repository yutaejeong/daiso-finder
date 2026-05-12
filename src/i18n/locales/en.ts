import type { Translation } from "./ko";

const en: Translation = {
  common: {
    logoAlt: "Daiso Finder logo",
    homeAriaLabel: "Back to Daiso Finder home",
    confirm: "OK",
    error: "Error",
    languageSelectorLabel: "Language",
    defaultErrorMessage: "Something went wrong. Please try again.",
  },
  home: {
    heading: "Find what's in stock at the Daiso near you",
    searchTitle: "Pick a store",
    searchPlaceholder: "Search by address or store name",
    branchSearchError: "We couldn't search stores right now.",
  },
  branch: {
    headingBefore: "Finding products at ",
    headingAfter: ".",
    address: "Address",
    openingHours: "Hours",
    productSearchTitle: "Search products",
    productSearchPlaceholder: "Enter a product name",
    stockLessThan: "Up to {count} in stock",
    priceFormat: "₩{price}",
    floorBelow: "B{n}",
    floorAbove: "{n}F",
    shelfAriaLabel: "Shelf location: {floor}, zone {zone}",
    floorBelowSpoken: "basement floor {n}",
    floorAboveSpoken: "floor {n}",
    branchLoadError: "We couldn't load this store's information.",
    productLoadError: "We couldn't search products right now.",
  },
  search: {
    searching: "Searching…",
    noResults: "No results found",
    promptInput: "Type something to search",
    loadMore: "Load more",
    loadingMore: "Loading…",
  },
  location: {
    unsupported: "This browser doesn't support location services.",
    fallback: "We couldn't get your location.",
    permissionDenied:
      "Location access was denied. Please allow location permission in your browser settings.",
    positionUnavailable:
      "Your location isn't available right now. Make sure GPS is on, then try again.",
    timeout: "The location request timed out. Please try again.",
    unknown: "Location error: {message}",
    unknownFallback: "An unknown error occurred.",
    retry: "We couldn't get your location. Please try again.",
  },
};

export default en;
