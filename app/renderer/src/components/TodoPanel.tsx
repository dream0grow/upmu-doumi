import { useState } from "react";
import type { Todo, TodoPriority } from "../types";
import { cn } from "../lib/utils";

interface Props {
  todos: Todo[];
  onAdd: (text: string, priority: TodoPriority) => void;
  onToggle: (id: number, done: boolean) => void;
  onRemove: (id: number) => void;
}

// 중요도 태그 정의 (색·아이콘). 태그 클릭으로 필터.
const PRIORITIES: { key: TodoPriority; icon: string; cls: string }[] = [
  { key: "중요", icon: "🔴", cls: "p-high" },
  { key: "보통", icon: "🟡", cls: "p-mid" },
  { key: "낮음", icon: "⚪", cls: "p-low" },
];

// 홈 화면 투두리스트 — 바로 입력, 중요도 태그, 태그별 필터, 완료 체크.
export default function TodoPanel({ todos, onAdd, onToggle, onRemove }: Props) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("보통");
  const [filter, setFilter] = useState<TodoPriority | null>(null);

  const shown = filter ? todos.filter((t) => t.priority === filter) : todos;
  // 중요도 순(중요→낮음), 같은 중요도면 최신 먼저. 완료는 맨 아래.
  const order = (p: TodoPriority) => PRIORITIES.findIndex((x) => x.key === p);
  const sorted = [...shown].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (order(a.priority) !== order(b.priority))
      return order(a.priority) - order(b.priority);
    return b.id - a.id;
  });

  function submit() {
    const t = text.trim();
    if (!t) return;
    onAdd(t, priority);
    setText("");
  }

  return (
    <div className="todo-panel">
      <h3>✅ 투두리스트</h3>

      {/* 입력 줄: 내용 + 중요도 선택 + 추가 */}
      <div className="todo-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="할 일을 입력하고 엔터"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TodoPriority)}
          title="중요도 태그"
        >
          {PRIORITIES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.icon} {p.key}
            </option>
          ))}
        </select>
        <button onClick={submit}>추가</button>
      </div>

      {/* 중요도 태그 필터 */}
      <div className="todo-filters">
        <button
          className={cn("chip", filter === null && "on")}
          onClick={() => setFilter(null)}
        >
          전체 {todos.length}
        </button>
        {PRIORITIES.map((p) => {
          const n = todos.filter((t) => t.priority === p.key).length;
          return (
            <button
              key={p.key}
              className={cn("chip", p.cls, filter === p.key && "on")}
              onClick={() => setFilter(filter === p.key ? null : p.key)}
            >
              {p.icon} {p.key} {n}
            </button>
          );
        })}
      </div>

      {/* 목록 */}
      <div className="todo-list">
        {sorted.length === 0 && (
          <div className="todo-empty">
            {filter ? "이 태그의 할 일이 없습니다" : "할 일을 추가해 보세요"}
          </div>
        )}
        {sorted.map((t) => {
          const p = PRIORITIES.find((x) => x.key === t.priority);
          return (
            <div key={t.id} className={cn("todo-item", t.done && "done")}>
              <input
                type="checkbox"
                checked={t.done}
                onChange={(e) => onToggle(t.id, e.target.checked)}
              />
              <span className="txt">{t.text}</span>
              <span className={cn("chip mini", p?.cls)}>{p?.icon}</span>
              <button
                className="del"
                title="삭제"
                onClick={() => onRemove(t.id)}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
