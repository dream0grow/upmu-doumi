import { useState } from "react";
import type { Card } from "../types";
import { cn } from "../lib/utils";
import { computeDday, isoOf, monthMatrix, todayDate } from "../lib/cards";

interface Props {
  cards: Card[];
  selectedDay: string | null; // "YYYY-MM-DD" — 누르면 그 날짜 마감만 보기
  onSelectDay: (iso: string | null) => void;
}

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 미니 캘린더 — 날짜마다 마감 건수를 점(배지)으로 표시.
// 날짜를 누르면 그 날짜 마감 공문만 필터, 다시 누르면 해제.
export default function MiniCalendar({ cards, selectedDay, onSelectDay }: Props) {
  const today = todayDate();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());

  // 날짜(iso) → 마감 공문 수 (완료 제외)
  const countByDay = new Map<string, number>();
  for (const c of cards) {
    if (!c.deadline_iso || c.done) continue;
    countByDay.set(c.deadline_iso, (countByDay.get(c.deadline_iso) || 0) + 1);
  }

  function move(delta: number) {
    const m = month0 + delta;
    const d = new Date(year, m, 1);
    setYear(d.getFullYear());
    setMonth0(d.getMonth());
  }

  const todayIso = isoOf(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="cal">
      <div className="cal-head">
        <button onClick={() => move(-1)} title="이전 달">‹</button>
        <b>{year}년 {month0 + 1}월</b>
        <button onClick={() => move(1)} title="다음 달">›</button>
      </div>
      <div className="cal-grid">
        {WEEK_LABELS.map((w, i) => (
          <div key={w} className={cn("cal-wd", i === 0 && "sun")}>{w}</div>
        ))}
        {monthMatrix(year, month0).flat().map((day, i) => {
          if (day === null) return <div key={`e${i}`} className="cal-cell empty" />;
          const iso = isoOf(year, month0, day);
          const n = countByDay.get(iso) || 0;
          const dday = computeDday(iso);
          const overdue = n > 0 && dday !== null && dday < 0;
          return (
            <div
              key={iso}
              className={cn(
                "cal-cell",
                iso === todayIso && "today",
                iso === selectedDay && "selected",
                n > 0 && "has-deadline"
              )}
              onClick={() => onSelectDay(iso === selectedDay ? null : iso)}
              title={n > 0 ? `마감 ${n}건` : undefined}
            >
              <span>{day}</span>
              {n > 0 && (
                <span className={cn("cal-dot", overdue && "over")}>{n}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
