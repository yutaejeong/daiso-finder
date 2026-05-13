"use client";

import { trackEvent } from "@/lib/gtag";
import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PWAInstallState = "hidden" | "android" | "ios";

const DISMISS_STORAGE_KEY = "pwa-install-dismissed-at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 3000;

function isWithinDismissWindow(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari standalone flag
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isNonSafariIOS = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && !isNonSafariIOS;
}

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>("hidden");
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (isStandalone() || isWithinDismissWindow()) return;

    let cancelled = false;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      delayTimer = setTimeout(() => {
        if (!cancelled) setState("android");
      }, SHOW_DELAY_MS);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setState("hidden");
      trackEvent("pwa_installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (isIOSSafari()) {
      delayTimer = setTimeout(() => {
        if (!cancelled) setState("ios");
      }, SHOW_DELAY_MS);
    }

    return () => {
      cancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (state === "hidden" || hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;
    trackEvent("pwa_install_banner_view", { platform: state });
  }, [state]);

  const promptInstall = useCallback(async () => {
    const deferred = deferredPromptRef.current;
    if (!deferred) return;
    deferredPromptRef.current = null;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    trackEvent("pwa_install_prompt_result", { outcome: choice.outcome });
    setState("hidden");
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      // localStorage may be unavailable (private mode); silently ignore
    }
    setState((prev) => {
      if (prev !== "hidden") {
        trackEvent("pwa_install_banner_dismiss", { platform: prev });
      }
      return "hidden";
    });
  }, []);

  return { state, promptInstall, dismiss };
}
