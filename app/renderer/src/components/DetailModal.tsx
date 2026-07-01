import type { Card } from "../types";

interface Props {
  card: Card | null;
  onClose: () => void;
}

// 카드 클릭 상세 모달. prototype/dashboard.html 의 showDetail() 을 React 로 옮긴 것.
// 발신기관·문서번호·성격·업무유형·마감일은 규칙 추출(정확)값을 그대로 표시하고,
// 한 줄 요약·세부 할 일은 로컬 AI(Ollama) 제안이라 '확인 필요' 문구를 붙입니다.
export default function DetailModal({ card, onClose }: Props) {
  if (!card) return null;

  const dl = card.deadline_iso ? (
    <>
      [{card.deadline_label}] {card.deadline_raw} <b>{card.d_day_text}</b>
    </>
  ) : (
    "없음 (기한 없는 공문)"
  );

  const others = (card.other_deadlines || [])
    .map((o) => `[${o.label}] ${o.raw}`)
    .join(", ");

  const ai = card.ai;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 22,
          maxWidth: 560,
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>{card.title || ""}</h2>

        <Row k="발신기관">
          {card.sender || ""} ({card.sender_level})
        </Row>
        <Row k="문서번호">{card.doc_number || ""}</Row>
        <Row k="공문 성격">
          ▣ {card.category} → {card.placement}
        </Row>
        <Row k="업무 유형">{card.task_type}</Row>
        <Row k="마감일">{dl}</Row>
        {others && <Row k="다른 기한">{others}</Row>}

        {/* 한 줄 요약·세부 할 일 = 로컬 AI(Ollama) 제안. 반드시 확인 필요. */}
        {ai && ai.available ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: "#fef9e7",
              border: "1px solid #f7dc6f",
            }}
          >
            <div style={{ fontSize: 12, color: "#b7950b", marginBottom: 6 }}>
              ⚠ {ai.notice || "AI가 제안한 내용입니다. 반드시 확인해 주세요."}
            </div>
            {ai.summary && (
              <div style={{ fontSize: 14, marginBottom: 6 }}>
                한 줄 요약: {ai.summary}
              </div>
            )}
            {ai.tasks && ai.tasks.length > 0 && (
              <ul style={{ fontSize: 13.5, paddingLeft: 18, margin: 0 }}>
                {ai.tasks.map((t, i) => (
                  <li key={i}>{t.text}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div
            style={{
              color: "#95a5a6",
              fontSize: 12.5,
              marginTop: 10,
            }}
          >
            ※ 한 줄 요약·세부 할 일은 로컬 AI(Ollama)가 제안하는 부분입니다 (MVP-4).
            <br />
            <span style={{ fontSize: 12 }}>
              ⚠ AI 제안은 반드시 확인해 주세요. 마감일·발신기관은 규칙 추출(정확)값입니다.
            </span>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            background: "#34495e",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "7px 0", fontSize: 14 }}>
      <span style={{ color: "#7f8c8d", display: "inline-block", width: 90 }}>{k}</span>
      {children}
    </div>
  );
}
