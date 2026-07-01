// 헤드리스 스모크 테스트: DB 초기화 → 시드 주입 → 목록/요약/엔진을 검증합니다.
// Electron 없이 순수 Node 로 백엔드 로직만 확인합니다.
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const db = require("../electron/db");
const { loadSeed } = require("../electron/seed");
const { eisenhower } = require("../electron/eisenhower.cjs");
const engine = require("../electron/engine");

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gyomu-test-"));
  db.initDb(dir);
  console.log("초기 카드 수:", db.count());

  const seed = loadSeed().map((c) => ({ ...c, quadrant: c.quadrant || eisenhower(c) }));
  const n = db.seedCards(seed);
  console.log("시드 주입:", n, "건");

  const cards = db.listCards();
  console.log("불러온 카드:", cards.length);

  // 요약 검증 (프로토타입과 동일해야 함: total 69 / task 24 / week 8 / overdue 8)
  const tasks = cards.filter((c) => c.category === "할일형");
  const overdue = tasks.filter((c) => c.d_day !== null && c.d_day < 0).length;
  const week = tasks.filter((c) => c.d_day !== null && c.d_day >= 0 && c.d_day <= 7).length;
  console.log("요약 → total:", cards.length, "task:", tasks.length, "week:", week, "overdue:", overdue);

  // quadrant 분포
  const dist = {};
  for (const c of cards) dist[c.quadrant] = (dist[c.quadrant] || 0) + 1;
  console.log("quadrant 분포:", dist);

  // 드래그 이동 저장 검증
  const first = cards.find((c) => c.quadrant !== "기타");
  db.updateQuadrant(first.id, "기타");
  const moved = db.listCards().find((c) => c.id === first.id);
  console.log("이동 저장 검증:", moved.quadrant === "기타" ? "OK" : "FAIL");

  // 엔진 검증 (실제 파이썬 자식 프로세스)
  const testFile =
    "/tmp/gongmun/(무릉초등학교-3001 (본문) 제주특별자치도교육청 교육과정과) 2026년 여름방학 방과후학교 운영 신청 안내.xlsx";
  if (fs.existsSync(testFile)) {
    const r = await engine.extractFile(testFile, false);
    r.notebook.quadrant = eisenhower(r.notebook);
    console.log(
      "엔진 검증 → ok:",
      r.ok,
      "| category:",
      r.notebook.category,
      "| d_day:",
      r.notebook.d_day,
      "| quadrant:",
      r.notebook.quadrant
    );
  } else {
    console.log("엔진 검증 스킵 (테스트 파일 없음)");
  }
  console.log("SMOKE TEST DONE");
}

main().catch((e) => {
  console.error("SMOKE TEST FAIL:", e);
  process.exit(1);
});
