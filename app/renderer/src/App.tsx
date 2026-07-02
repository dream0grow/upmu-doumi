import { useState } from "react";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import FeedbackModal from "./components/FeedbackModal";

// 전체 셸: 상단 바 + (좌측 메뉴 | 우측 작업영역).
// prototype/dashboard.html 의 .top / .layout(.side + .main) 구조 그대로.
export default function App() {
  const today = todayIso();
  const [showFeedback, setShowFeedback] = useState(false);
  return (
    <div style={{ minHeight: "100vh" }}>
      <TopBar today={today} />
      <div style={{ display: "flex", minHeight: "calc(100vh - 48px)" }}>
        <Sidebar active="home" onFeedback={() => setShowFeedback(true)} />
        <Dashboard />
      </div>
      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}

function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
