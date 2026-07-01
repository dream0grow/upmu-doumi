// 메인 프로세스(CommonJS)용 아이젠하워 배치 규칙.
// renderer/src/lib/eisenhower.ts 와 완전히 동일한 규칙(가이드 §4)입니다.
// 파이썬 엔진 결과에는 quadrant 가 없으므로 여기서 계산합니다.
function eisenhower(card) {
  if (card.category !== "할일형") return "기타";
  const d = card.d_day;
  const urgent = d !== null && d !== undefined && d <= 3;
  const important =
    card.sender_level === "상급기관" ||
    ["연수/교육", "행사/사업", "보고/제출"].includes(card.task_type);
  if (urgent && important) return "급함+중요";
  if (!urgent && important) return "안급하지만 중요";
  if (urgent && !important) return "급함(덜중요)";
  return "해야할일";
}
module.exports = { eisenhower };
