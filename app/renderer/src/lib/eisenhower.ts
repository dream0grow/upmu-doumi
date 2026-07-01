import type { Card, NotebookEntry, Quadrant, Summary } from "../types";

// prototype/build_prototype.py 의 _eisenhower() 규칙을 그대로 옮긴 것입니다.
// 빌드 가이드 §4 아이젠하워 자동 배치 규칙과 동일합니다.
//
//   할일형이 아니면            → ⚪ 기타
//   할일형 + 마감 3일이내 + 중요 → 🟡 급함+중요
//   할일형 + 마감 여유  + 중요   → 🔴 안급하지만 중요 (가장 먼저!)
//   할일형 + 마감 3일이내 + 덜중요 → 🟠 급함(덜중요)
//   그 외                      → 🟢 해야할일
//   (중요 = 상급기관 발신 or 업무유형 연수/행사/보고)
export function eisenhower(card: NotebookEntry): Quadrant {
  if (card.category !== "할일형") return "기타";

  const d = card.d_day;
  const urgent = d !== null && d !== undefined && d <= 3; // 3일 이내(또는 지남)
  const important =
    card.sender_level === "상급기관" ||
    ["연수/교육", "행사/사업", "보고/제출"].includes(card.task_type);

  if (urgent && important) return "급함+중요";
  if (!urgent && important) return "안급하지만 중요"; // 🔴 가장 먼저!
  if (urgent && !important) return "급함(덜중요)";
  return "해야할일";
}

// 상단 요약 띠 수치 계산 (프로토타입 render_html 과 동일한 정의).
export function summarize(cards: Card[]): Summary {
  const tasks = cards.filter((c) => c.category === "할일형");
  const overdue = tasks.filter(
    (c) => c.d_day !== null && c.d_day !== undefined && c.d_day < 0
  ).length;
  const week = tasks.filter(
    (c) => c.d_day !== null && c.d_day !== undefined && c.d_day >= 0 && c.d_day <= 7
  ).length;
  return {
    total: cards.length,
    task_n: tasks.length,
    week_n: week,
    overdue_n: overdue,
  };
}

// 아이젠하워 5칸 정의 (색 클래스·설명·순서) — 프로토타입 QUADS 와 동일.
export const QUADS: {
  key: Quadrant;
  icon: string;
  desc: string;
  cls: string;
}[] = [
  { key: "안급하지만 중요", icon: "🔴", desc: "★가장 먼저! (기획·계획)", cls: "left-red" },
  { key: "급함+중요", icon: "🟡", desc: "지금 처리", cls: "left-yellow" },
  { key: "급함(덜중요)", icon: "🟠", desc: "빨리 처리", cls: "left-orange" },
  { key: "해야할일", icon: "🟢", desc: "틈날 때", cls: "left-green" },
  { key: "기타", icon: "⚪", desc: "자료실·배포함·보관 (마감 없는 참고/규정/배포)", cls: "left-gray" },
];
