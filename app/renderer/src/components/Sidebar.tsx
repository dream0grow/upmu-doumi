import { cn } from "../lib/utils";

// 좌측 고정 메뉴. prototype/dashboard.html 의 .side 를 그대로 옮긴 것.
// 지금은 '홈'만 활성. 나머지는 이후 단계(들어온 공문 → 교무수첩 …)에서 연결.
const TOP = [
  { key: "home", label: "🏠 홈" },
  { key: "inbox", label: "📥 들어온 공문" },
  { key: "notebook", label: "📒 교무수첩" },
  { key: "write", label: "✍ 공문 작성" },
  { key: "minutes", label: "📝 회의록" },
  { key: "distribute", label: "📤 배포·수합" },
];
const BOTTOM = [
  { key: "past", label: "📚 과거 공문" },
  { key: "settings", label: "⚙ 설정" },
];

export default function Sidebar({ active = "home" }: { active?: string }) {
  return (
    <div
      className="flex-shrink-0"
      style={{ width: 170, background: "#2c3e50", color: "#ecf0f1", padding: "16px 0" }}
    >
      {TOP.map((m) => (
        <a key={m.key} className={cn("side-item", m.key === active && "active")}>
          {m.label}
        </a>
      ))}
      <div className="side-sep" />
      {BOTTOM.map((m) => (
        <a key={m.key} className={cn("side-item", m.key === active && "active")}>
          {m.label}
        </a>
      ))}
    </div>
  );
}
