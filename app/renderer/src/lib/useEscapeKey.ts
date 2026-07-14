import { useEffect } from "react";

// ESC 키로 창 닫기 — 모달 공용 훅.
// active(창이 열려 있을 때)에만 키를 듣고, 닫히면 바로 정리합니다.
export function useEscapeKey(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onClose]);
}
