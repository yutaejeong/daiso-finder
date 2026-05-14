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
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (isStandalone() || isWithinDismissWindow()) return;

    let cancelled = false;
    const targetState: PWAInstallState = isIOSSafari() ? "ios" : "android";

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setHasDeferredPrompt(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setHasDeferredPrompt(false);
      setState("hidden");
      trackEvent("pwa_installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const delayTimer = setTimeout(() => {
      if (!cancelled) setState(targetState);
    }, SHOW_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(delayTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (state === "hidden" || hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;
    trackEvent("pwa_install_banner_view", { platform: state });
  }, [state]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const deferred = deferredPromptRef.current;
    if (!deferred) return false;
    deferredPromptRef.current = null;
    setHasDeferredPrompt(false);
    await deferred.prompt();
    const choice = await deferred.userChoice;
    trackEvent("pwa_install_prompt_result", { outcome: choice.outcome });
    setState("hidden");
    return true;
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

  return { state, hasDeferredPrompt, promptInstall, dismiss };
}
