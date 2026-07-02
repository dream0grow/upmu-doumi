import type { Card } from "../types";
import { cn } from "../lib/utils";
import {
  CATEGORY_META, computeDday, ddayText, overdueStyle,
} from "../lib/cards";

interface Props {
  card: Card;
  onClick: () => void;
  onToggleDone: (done: boolean) => void;
}

// 공문 카드 한 장 — 날짜별 보기 개편판.
// 완료 체크 + 제목 + D-day 배지(지날수록 진한 빨강) + 성격·처리주체 태그.
export default function OfficialCard({ card, onClick, onToggleDone }: Props) {
  const d = computeDday(card.deadline_iso); // 오늘 기준 재계산
  const meta = CATEGORY_META[card.category] ?? CATEGORY_META["참고형"];

  return (
    <div className={cn("card", card.done && "done")} onClick={onClick}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {/* 완료 체크 — 카드 클릭(상세)과 분리 */}
        <input
          type="checkbox"
          checked={!!card.done}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onToggleDone(e.target.checked)}
          title="처리 완료 표시"
          style={{ marginTop: 2, cursor: "pointer" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{card.title || "(제목 없음)"}</div>
          <div className="m">
            {d !== null &&
              (d < 0 ? (
                <span className="badge" style={overdueStyle(-d)}>
                  {ddayText(d)} 지남
                </span>
              ) : (
                <span className={cn("badge", d <= 7 ? "dday soon" : "dday ok")}>
                  {ddayText(d)}
                </span>
              ))}
            <span
              className="tag"
              style={{ background: meta.bg, color: meta.color, fontWeight: 600 }}
            >
              {meta.icon} {card.category}
            </span>
            {card.owner && (
              <span className={cn("tag", card.owner === "부장" ? "owner-me" : "owner-teachers")}>
                {card.owner === "부장" ? "👤 부장 처리" : "📢 담임 공람"}
              </span>
            )}
            <span className="tag">{card.task_type}</span>
            <span className="sender">{card.sender || ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
