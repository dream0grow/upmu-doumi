import type { Card } from "../types";
import { cn, ddayClass } from "../lib/utils";

interface Props {
  card: Card;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}

// 공문 카드 한 장. prototype/dashboard.html 의 cardHtml() 을 React 로 옮긴 것.
// 제목 + D-day 배지 + 성격 태그 + 업무유형 태그 + 발신기관.
export default function OfficialCard({
  card,
  onClick,
  onDragStart,
  onDragEnd,
  dragging,
}: Props) {
  const ddc = ddayClass(card);
  return (
    <div
      className={cn("card", dragging && "dragging")}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="t">{card.title || "(제목 없음)"}</div>
      <div className="m">
        {ddc && <span className={cn("badge", ddc)}>{card.d_day_text}</span>}
        <span className="tag">{card.category}</span>
        <span className="tag">{card.task_type}</span>
        <span>{card.sender || ""}</span>
      </div>
    </div>
  );
}
