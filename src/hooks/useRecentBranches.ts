"use client";

import { SimplifiedBranch } from "@/app/api/branches/types";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "recent-branches";
const MAX_RECENT_BRANCHES = 5;

function isSimplifiedBranch(value: unknown): value is SimplifiedBranch {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.code === "string" &&
    typeof v.name === "string" &&
    typeof v.address === "string" &&
    typeof v.lat === "number" &&
    typeof v.lng === "number" &&
    typeof v.openTime === "string" &&
    typeof v.closeTime === "string"
  );
}

function readFromStorage(): SimplifiedBranch[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSimplifiedBranch).slice(0, MAX_RECENT_BRANCHES);
  } catch {
    return [];
  }
}

function writeToStorage(branches: SimplifiedBranch[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
  } catch {
    // localStorage may be unavailable (private mode); silently ignore
  }
}

export function useRecentBranches() {
  const [recentBranches, setRecentBranches] = useState<SimplifiedBranch[]>([]);

  useEffect(() => {
    setRecentBranches(readFromStorage());
  }, []);

  const addRecentBranch = useCallback((branch: SimplifiedBranch) => {
    setRecentBranches((prev) => {
      const filtered = prev.filter((b) => b.code !== branch.code);
      const next = [branch, ...filtered].slice(0, MAX_RECENT_BRANCHES);
      writeToStorage(next);
      return next;
    });
  }, []);

  const removeRecentBranch = useCallback((code: string) => {
    setRecentBranches((prev) => {
      const next = prev.filter((b) => b.code !== code);
      writeToStorage(next);
      return next;
    });
  }, []);

  return { recentBranches, addRecentBranch, removeRecentBranch };
}
