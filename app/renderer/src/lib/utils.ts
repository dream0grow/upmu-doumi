import type { Card } from "../types";

// 여러 className 을 조건부로 합칩니다 (shadcn/ui 스타일 헬퍼).
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// D-day 배지의 색 클래스 계산 — prototype/dashboard.html 의 ddayBadge() 와 동일.
export function ddayClass(c: Pick<Card, "d_day">): string | null {
  if (c.d_day === null || c.d_day === undefined) return null;
  if (c.d_day < 0) return "dday over";
  if (c.d_day <= 7) return "dday soon"; // 3일·7일 모두 soon (원본과 동일)
  return "dday ok";
}
