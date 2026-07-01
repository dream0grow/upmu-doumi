import { useEffect, useMemo, useState } from "react";
import type { Card, Quadrant } from "../types";
import { QUADS, summarize } from "../lib/eisenhower";
import { cn } from "../lib/utils";
import OfficialCard from "../components/OfficialCard";
import DetailModal from "../components/DetailModal";

// 홈 대시보드 — 아이젠하워 5칸 칸반.
// prototype/dashboard.html 의 배치·색·5칸·요약 띠를 그대로 React 로 옮기고,
// 카드 드래그로 칸 이동을 추가했습니다. 이동 결과(quadrant)는 SQLite 에 저장합니다.
export default function Dashboard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overQuad, setOverQuad] = useState<Quadrant | null>(null);
  const [loading, setLoading] = useState(true);

  // 최초 로드: 저장된 카드가 없으면 프로토타입과 같은 시드 데이터를 넣고 불러옵니다.
  useEffect(() => {
    (async () => {
      await window.gyomu.seedIfEmpty();
      const list = await window.gyomu.listCards();
      setCards(list);
      setLoading(false);
    })();
  }, []);

  const summary = useMemo(() => summarize(cards), [cards]);

  // 카드를 다른 칸으로 드롭 → 상태 갱신 + SQLite 저장.
  async function handleDrop(target: Quadrant) {
    setOverQuad(null);
    if (dragId === null) return;
    const card = cards.find((c) => c.id === dragId);
    if (!card || card.quadrant === target) {
      setDragId(null);
      return;
    }
    setCards((prev) =>
      prev.map((c) => (c.id === dragId ? { ...c, quadrant: target } : c))
    );
    if (card.id !== undefined) {
      await window.gyomu.updateQuadrant(card.id, target);
    }
    setDragId(null);
  }

  if (loading) {
    return <div style={{ padding: 20, color: "#7f8c8d" }}>불러오는 중…</div>;
  }

  return (
    <div style={{ flex: 1, padding: 20 }}>
      {/* 상단 요약 띠 */}
      <div className="strip">
        <div>
          전체 공문 <b>{summary.total}</b>건
        </div>
        <div>
          할 일 <b>{summary.task_n}</b>건
        </div>
        <div>
          이번 주 마감 <b>{summary.week_n}</b>건
        </div>
        <div className="over">
          지난 마감 <b>{summary.overdue_n}</b>건 ⚠
        </div>
      </div>

      {/* 아이젠하워 5칸 그리드 (2열, '기타'는 full 폭) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {QUADS.map((q) => {
          const items = cards.filter((c) => c.quadrant === q.key);
          const isFull = q.key === "기타";
          return (
            <div
              key={q.key}
              className={cn(
                "q",
                q.cls,
                isFull && "full",
                overQuad === q.key && "drop-over"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                if (overQuad !== q.key) setOverQuad(q.key);
              }}
              onDragLeave={() => {
                if (overQuad === q.key) setOverQuad(null);
              }}
              onDrop={() => handleDrop(q.key)}
            >
              <h3>
                {q.icon} {q.key}{" "}
                <span className="desc">
                  {q.desc} · {items.length}건
                </span>
              </h3>
              {items.length > 0 ? (
                items.map((c) => (
                  <OfficialCard
                    key={c.id}
                    card={c}
                    dragging={dragId === c.id}
                    onClick={() => setSelected(c)}
                    onDragStart={() => setDragId(c.id ?? null)}
                    onDragEnd={() => setDragId(null)}
                  />
                ))
              ) : (
                <div style={{ color: "#bbb", fontSize: 12 }}>(없음)</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="note">
        ※ 규칙으로 자동 배치했습니다. 카드를 드래그해 옮기거나 클릭해 상세를 봅니다.
        마감일·발신기관은 규칙 추출(정확), 성격·배치는 자동 초안이라 부장이 조정합니다.
      </div>

      <DetailModal card={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
