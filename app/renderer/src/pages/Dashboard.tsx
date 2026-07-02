import { useEffect, useMemo, useState } from "react";
import type { Card, Category, Todo, TodoPriority } from "../types";
import {
  BUCKETS, CATEGORIES, CATEGORY_META, bucketOf, sortInBucket, summarize,
} from "../lib/cards";
import { cn } from "../lib/utils";
import OfficialCard from "../components/OfficialCard";
import DetailModal from "../components/DetailModal";
import MiniCalendar from "../components/MiniCalendar";
import TodoPanel from "../components/TodoPanel";

// 홈 대시보드 — 날짜별 보기 개편판 (2026-07 사용자 피드백).
//   · 캘린더: 날짜마다 마감 건수 표시, 누르면 그 날짜만 필터
//   · 칸반: 지난 마감 / 오늘 / 이번 주 / 다음 주 이후 / 기한 없음
//   · 투두리스트: 홈에서 바로 작성, 중요도 태그·필터
//   · 성격 필터 칩(할일형·공람형·배포형·참고형·규정형) + 제목 검색
export default function Dashboard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [catFilter, setCatFilter] = useState<Category | null>(null);
  const [day, setDay] = useState<string | null>(null); // 캘린더에서 고른 날짜
  const [query, setQuery] = useState("");
  const [showDone, setShowDone] = useState(false);

  // 최초 로드: 저장된 카드가 없으면 시드 주입 후 카드·투두를 불러옵니다.
  useEffect(() => {
    (async () => {
      await window.gyomu.seedIfEmpty();
      const [list, tds] = await Promise.all([
        window.gyomu.listCards(),
        window.gyomu.listTodos(),
      ]);
      setCards(list);
      setTodos(tds);
      setLoading(false);
    })();
  }, []);

  const summary = useMemo(() => summarize(cards), [cards]);

  // 화면에 보일 카드 (성격·날짜·검색·완료 필터 적용)
  const visible = useMemo(() => {
    const q = query.trim();
    return cards.filter((c) => {
      if (!showDone && c.done) return false;
      if (catFilter && c.category !== catFilter) return false;
      if (day && c.deadline_iso !== day) return false;
      if (q && !(c.title || "").includes(q) && !(c.sender || "").includes(q))
        return false;
      return true;
    });
  }, [cards, catFilter, day, query, showDone]);

  // 카드 완료 체크 → 상태 갱신 + SQLite 저장
  async function toggleDone(card: Card, done: boolean) {
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, done } : c))
    );
    if (card.id !== undefined) await window.gyomu.setCardDone(card.id, done);
  }

  // 투두 CRUD (저장 후 다시 읽어 목록 동기화)
  async function addTodo(text: string, priority: TodoPriority) {
    await window.gyomu.addTodo(text, priority);
    setTodos(await window.gyomu.listTodos());
  }
  async function toggleTodo(id: number, done: boolean) {
    await window.gyomu.toggleTodo(id, done);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
  }
  async function removeTodo(id: number) {
    await window.gyomu.removeTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return <div style={{ padding: 20, color: "#7f8c8d" }}>불러오는 중…</div>;
  }

  return (
    <div style={{ flex: 1, padding: 20, minWidth: 0 }}>
      {/* 상단 요약 띠 */}
      <div className="strip">
        <div>전체 공문 <b>{summary.total}</b>건</div>
        <div>📌 할 일 <b>{summary.task_n}</b>건</div>
        <div>📢 공람 <b>{summary.circulate_n}</b>건</div>
        <div>이번 주 마감 <b>{summary.week_n}</b>건</div>
        <div className="over">지난 마감 <b>{summary.overdue_n}</b>건 ⚠</div>
      </div>

      {/* 캘린더 + (성격 필터 · 검색) */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "stretch" }}>
        <MiniCalendar cards={cards} selectedDay={day} onSelectDay={setDay} />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* 성격 필터 칩 */}
          <div className="chips">
            <button
              className={cn("chip", catFilter === null && "on")}
              onClick={() => setCatFilter(null)}
            >
              전체
            </button>
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const n = cards.filter((c) => c.category === cat && !c.done).length;
              return (
                <button
                  key={cat}
                  className={cn("chip", catFilter === cat && "on")}
                  style={catFilter === cat ? { background: meta.color, color: "#fff" } : undefined}
                  onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                >
                  {meta.icon} {cat} {n}
                </button>
              );
            })}
          </div>

          {/* 검색 + 완료 보기 */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              className="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 제목·발신기관 검색"
            />
            <label style={{ fontSize: 12.5, color: "#7f8c8d", whiteSpace: "nowrap" }}>
              <input
                type="checkbox"
                checked={showDone}
                onChange={(e) => setShowDone(e.target.checked)}
              />{" "}
              완료된 것도 보기
            </label>
          </div>

          {/* 활성 필터 안내 */}
          {(day || catFilter || query) && (
            <div style={{ fontSize: 12.5, color: "#2471a3" }}>
              필터: {day ? `${day} 마감 ` : ""}{catFilter ? `· ${catFilter} ` : ""}
              {query ? `· "${query}" ` : ""}
              <button
                className="chip mini"
                onClick={() => { setDay(null); setCatFilter(null); setQuery(""); }}
              >
                모두 해제 ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 날짜별 칸반 + 투두리스트 */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* 날짜별 5칸 */}
        <div className="board">
          {BUCKETS.map((b) => {
            const items = visible.filter((c) => bucketOf(c) === b.key).sort(sortInBucket);
            return (
              <div key={b.key} className={cn("q", b.cls)}>
                <h3>
                  {b.icon} {b.key}{" "}
                  <span className="desc">{b.desc} · {items.length}건</span>
                </h3>
                {items.length > 0 ? (
                  items.map((c) => (
                    <OfficialCard
                      key={c.id}
                      card={c}
                      onClick={() => setSelected(c)}
                      onToggleDone={(done) => toggleDone(c, done)}
                    />
                  ))
                ) : (
                  <div style={{ color: "#bbb", fontSize: 12 }}>(없음)</div>
                )}
              </div>
            );
          })}
        </div>

        {/* 투두리스트 (홈에서 바로 작성) */}
        <TodoPanel
          todos={todos}
          onAdd={addTodo}
          onToggle={toggleTodo}
          onRemove={removeTodo}
        />
      </div>

      <div className="note">
        ※ 마감일·발신기관은 규칙 추출(정확), 성격·처리주체는 자동 초안이라 부장이
        조정합니다. 카드의 체크박스 = 처리 완료 표시, 카드 클릭 = 상세 보기.
      </div>

      <DetailModal card={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
