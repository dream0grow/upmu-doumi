import { useEffect, useMemo, useState } from "react";
import type { Card, Todo } from "../types";
import { computeDday, ddayText, overdueStyle, sortInBucket } from "../lib/cards";
import { cn } from "../lib/utils";
import DetailModal from "../components/DetailModal";

// 📒 교무수첩 — 빌드가이드 §3-3.
//   · 위: 할일형 공문 우선순위 목록. 순서는 부장이 직접 — 행을 끌어서 조정
//     (설계 원칙: 우선순위 자동화 안 함. 안 끌어본 카드는 마감 가까운 순).
//   · 카드마다 세부 할일 체크박스 — 홈 투두리스트와 같은 저장소(card_id 연결)라
//     여기서 체크하면 홈에서도 체크됩니다.
//   · 아래: 공람형(담임·교사 안내) 목록 — 안내했으면 체크.
export default function Notebook() {
  const [cards, setCards] = useState<Card[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<number | null>(null); // 드래그 중인 행
  const [openIds, setOpenIds] = useState<Set<number>>(new Set()); // 세부 할일 펼친 행

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

  // 할일형 = 교무수첩 상단 목록 (교무수첩규칙 §1·§6)
  const tasks = useMemo(
    () =>
      cards
        .filter((c) => c.category === "할일형" && (showDone || !c.done))
        .sort(sortNotebook),
    [cards, showDone]
  );
  // 공람형 = 담임·교사에게 알릴 것
  const circulars = useMemo(
    () =>
      cards
        .filter((c) => c.category === "공람형" && (showDone || !c.done))
        .sort(sortInBucket),
    [cards, showDone]
  );

  // ── 우선순위 드래그: 놓은 자리로 이동하고 그 순서를 통째로 저장 ──
  async function dropOn(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const ids = tasks.map((c) => c.id!).filter((id) => id !== undefined);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ...ids.splice(from, 1));
    const orders = ids.map((id, i) => ({ id, order: i }));
    setCards((prev) =>
      prev.map((c) => {
        const o = orders.find((x) => x.id === c.id);
        return o ? { ...c, note_order: o.order } : c;
      })
    );
    await window.gyomu.setNoteOrder(orders);
  }

  // 카드 완료 체크 → 상태 갱신 + 저장
  async function toggleDone(card: Card, done: boolean) {
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, done } : c)));
    if (card.id !== undefined) await window.gyomu.setCardDone(card.id, done);
  }

  // 상세 창에서 성격·처리주체를 고친 경우 반영
  function cardUpdated(updated: Card) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelected(updated);
  }

  // ── 세부 할일 (todos.card_id 로 카드에 연결 — 홈 투두와 같은 데이터) ──
  function subsOf(cardId?: number): Todo[] {
    return todos.filter((t) => t.card_id === cardId);
  }
  async function addSub(cardId: number, text: string) {
    await window.gyomu.addTodo(text, "보통", cardId);
    setTodos(await window.gyomu.listTodos());
  }
  async function toggleSub(id: number, done: boolean) {
    await window.gyomu.toggleTodo(id, done);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
  }
  async function removeSub(id: number) {
    await window.gyomu.removeTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }
  function toggleOpen(cardId: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  if (loading) {
    return <div style={{ padding: 20, color: "#7f8c8d" }}>불러오는 중…</div>;
  }

  return (
    <div style={{ flex: 1, padding: 20, minWidth: 0, maxWidth: 900 }}>
      {/* 머리말 + 완료 보기 토글 */}
      <div className="filter-bar" style={{ justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, color: "#7f8c8d" }}>
          우선순위는 부장이 직접 정합니다 — <b>행을 끌어서</b> 순서를 바꾸세요.
          안 끌어본 카드는 마감 가까운 순으로 자동 정렬됩니다.
        </div>
        <label style={{ fontSize: 12.5, color: "#7f8c8d", whiteSpace: "nowrap" }}>
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />{" "}
          완료된 것도 보기
        </label>
      </div>

      {/* ① 할 일 목록 (우선순위) */}
      <div className="nb-section">
        <h3>
          📌 할 일 <span className="desc">보고·제출·참석 — {tasks.length}건, 위에서부터 처리</span>
        </h3>
        {tasks.length === 0 && (
          <div style={{ color: "#bbb", fontSize: 13, padding: "8px 0" }}>
            처리할 할일형 공문이 없습니다 🎉
          </div>
        )}
        {tasks.map((c, i) => {
          const subs = subsOf(c.id);
          const subDone = subs.filter((t) => t.done).length;
          const open = c.id !== undefined && openIds.has(c.id);
          const d = computeDday(c.deadline_iso);
          return (
            <div
              key={c.id}
              className={cn("nb-row", c.done && "done", dragId === c.id && "dragging")}
              draggable
              onDragStart={(e) => {
                // 세부 할일 입력창 등에서 글자를 끌 때는 행 드래그로 안 넘어가게
                const t = e.target as HTMLElement;
                if (t.tagName === "INPUT" || t.tagName === "BUTTON") {
                  e.preventDefault();
                  return;
                }
                setDragId(c.id ?? null);
              }}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => c.id !== undefined && dropOn(c.id)}
            >
              <span className="nb-rank">{i + 1}</span>
              <span className="nb-grip" title="끌어서 우선순위 조정">☰</span>
              <input
                type="checkbox"
                checked={!!c.done}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => toggleDone(c, e.target.checked)}
                title="처리 완료 표시"
                style={{ marginTop: 3, cursor: "pointer" }}
              />
              <div className="nb-main">
                <div
                  className="nb-title"
                  onClick={() => setSelected(c)}
                  title="클릭하면 상세 (요약·마감·원본 열기)"
                >
                  {c.title || "(제목 없음)"}
                </div>
                <div className="nb-meta">
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
                  {c.deadline_iso && (
                    <span className="tag">
                      {c.deadline_label || "마감"} {c.deadline_iso}
                    </span>
                  )}
                  {c.owner && (
                    <span
                      className={cn(
                        "tag",
                        c.owner === "부장" ? "owner-me" : "owner-teachers"
                      )}
                    >
                      {c.owner === "부장" ? "👤 부장 처리" : "📢 담임 공람"}
                    </span>
                  )}
                  <span className="tag">{c.task_type}</span>
                  <span className="sender">{c.sender || ""}</span>
                  <button
                    className={cn("chip mini", subs.length > 0 && "on")}
                    onClick={() => c.id !== undefined && toggleOpen(c.id)}
                    title="세부 할일 펼치기/접기"
                  >
                    ✅ 세부 할일 {subs.length > 0 ? `${subDone}/${subs.length}` : "추가"}{" "}
                    {open ? "▾" : "▸"}
                  </button>
                </div>
                {open && c.id !== undefined && (
                  <SubTasks
                    subs={subs}
                    cardTitle={c.title}
                    onAdd={(text) => addSub(c.id!, text)}
                    onToggle={toggleSub}
                    onRemove={removeSub}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ② 공람 목록 (담임·교사 안내) */}
      <div className="nb-section">
        <h3>
          📢 공람 <span className="desc">담임·교사에게 알릴 것 — {circulars.length}건, 안내했으면 체크</span>
        </h3>
        {circulars.length === 0 && (
          <div style={{ color: "#bbb", fontSize: 13, padding: "8px 0" }}>
            공람할 공문이 없습니다
          </div>
        )}
        {circulars.map((c) => {
          const d = computeDday(c.deadline_iso);
          return (
            <div key={c.id} className={cn("nb-row", c.done && "done")}>
              <input
                type="checkbox"
                checked={!!c.done}
                onChange={(e) => toggleDone(c, e.target.checked)}
                title="공람(안내) 완료 표시"
                style={{ marginTop: 3, cursor: "pointer" }}
              />
              <div className="nb-main">
                <div className="nb-title" onClick={() => setSelected(c)}>
                  {c.title || "(제목 없음)"}
                </div>
                <div className="nb-meta">
                  {d !== null && d >= 0 && (
                    <span className={cn("badge", d <= 7 ? "dday soon" : "dday ok")}>
                      {ddayText(d)}
                    </span>
                  )}
                  {c.deadline_iso && (
                    <span className="tag">
                      {c.deadline_label || "마감"} {c.deadline_iso}
                    </span>
                  )}
                  <span className="tag">{c.task_type}</span>
                  <span className="sender">{c.sender || ""}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="note">
        ※ 할 일 = 할일형 공문(보고·제출·참석), 공람 = 공람형 공문(교사 안내).
        분류가 틀리면 카드 상세에서 직접 바꿀 수 있고, 목록에 바로 반영됩니다.
        세부 할일은 홈 투두리스트와 연결되어 어느 쪽에서 체크해도 같이 갱신됩니다.
      </div>

      <DetailModal
        card={selected}
        onClose={() => setSelected(null)}
        onUpdated={cardUpdated}
      />
    </div>
  );
}

// 교무수첩 정렬: 부장이 끌어 둔 순서(note_order)가 있으면 그게 먼저,
// 없는 카드는 마감 가까운 순으로 그 뒤에 붙습니다.
function sortNotebook(a: Card, b: Card): number {
  const ao = a.note_order ?? null;
  const bo = b.note_order ?? null;
  if (ao !== null && bo !== null) return ao - bo;
  if (ao !== null) return -1;
  if (bo !== null) return 1;
  const da = computeDday(a.deadline_iso);
  const dz = computeDday(b.deadline_iso);
  if (da === null && dz === null) return (a.id ?? 0) - (b.id ?? 0);
  if (da === null) return 1;
  if (dz === null) return -1;
  return da - dz;
}

// ── 세부 할일 체크리스트 (한 카드 아래에 붙는 부분) ─────────
function SubTasks({
  subs, cardTitle, onAdd, onToggle, onRemove,
}: {
  subs: Todo[];
  cardTitle: string | null;
  onAdd: (text: string) => void;
  onToggle: (id: number, done: boolean) => void;
  onRemove: (id: number) => void;
}) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  function submit() {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  }
  // 공문 제목 복사 — 세부 할일에 붙여넣어 어떤 공문인지 표시할 때 사용.
  async function copyTitle() {
    if (!cardTitle) return;
    await navigator.clipboard.writeText(cardTitle);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="nb-subs">
      {subs.map((t) => (
        <div key={t.id} className={cn("nb-sub", t.done && "done")}>
          <input
            type="checkbox"
            checked={t.done}
            onChange={(e) => onToggle(t.id, e.target.checked)}
          />
          <span className="txt">{t.text}</span>
          <button className="del" title="삭제" onClick={() => onRemove(t.id)}>
            ✕
          </button>
        </div>
      ))}
      <div className="nb-sub-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="세부 할일 입력하고 엔터 (예: 명단 취합해서 회신)"
        />
        {cardTitle && (
          <button
            className="copy"
            onClick={copyTitle}
            title="공문 제목을 복사합니다 — 세부 할일에 붙여넣어 쓰세요"
          >
            {copied ? "복사됨 ✓" : "📋 제목 복사"}
          </button>
        )}
        <button onClick={submit}>추가</button>
      </div>
    </div>
  );
}
