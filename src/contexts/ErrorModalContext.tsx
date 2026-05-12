"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { css } from "@styled-system/css";
import { createContext, useCallback, useContext, useState } from "react";

interface ErrorModalContextValue {
  showError: (message: string, detail?: string) => void;
}

const ErrorModalContext = createContext<ErrorModalContextValue | null>(null);

export function useErrorModal() {
  const context = useContext(ErrorModalContext);
  if (!context) {
    throw new Error("useErrorModal must be used within ErrorModalProvider");
  }
  return context;
}

export function ErrorModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<{
    isOpen: boolean;
    message: string;
    detail?: string;
  }>({
    isOpen: false,
    message: "",
  });

  const showError = useCallback((message: string, detail?: string) => {
    setError({ isOpen: true, message, detail });
  }, []);

  const closeError = useCallback(() => {
    setError({ isOpen: false, message: "" });
  }, []);

  return (
    <ErrorModalContext.Provider value={{ showError }}>
      {children}
      {error.isOpen && (
        <div className="modal modal-blur show" style={{ display: "block" }}>
          <div
            className={`modal-dialog modal-sm modal-dialog-centered ${css({ maxWidth: "400px", margin: "0 auto", position: "relative", zIndex: 1060 })}`}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("common", "error")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeError}
                />
              </div>
              <div className="modal-body">
                <p>{error.message}</p>
                {error.detail && (
                  <textarea
                    readOnly
                    value={error.detail}
                    className={`form-control ${css({ marginTop: "12px", fontSize: "12px", fontFamily: "monospace", resize: "vertical" })}`}
                    rows={6}
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-red w-100"
                  onClick={closeError}
                >
                  {t("common", "confirm")}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" onClick={closeError} />
        </div>
      )}
    </ErrorModalContext.Provider>
  );
}
