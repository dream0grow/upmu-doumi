// 상단 바. prototype/dashboard.html 의 .top 을 그대로 옮긴 것.
// 오른쪽에 "🔒 로컬 작동중" 배지를 항상 표시합니다 (절대 원칙: 100% 로컬).
export default function TopBar({ today }: { today: string }) {
  return (
    <div
      style={{
        background: "#34495e",
        color: "#fff",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <b>📒 교무부장 도우미</b>{" "}
        <span style={{ opacity: 0.7, fontSize: 13 }}>홈 대시보드</span>
      </div>
      <div>
        <span className="lock-badge">🔒 로컬 작동중 · 오늘 {today}</span>
      </div>
    </div>
  );
}
