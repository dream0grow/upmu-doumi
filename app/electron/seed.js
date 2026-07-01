// 시드 데이터: 첨부해 주신 prototype dashboard.html 의 CARDS(69건)를 그대로 담았습니다.
// 최초 실행 시 DB 가 비어 있으면 이 데이터를 넣어, 프로토타입과 동일한 화면을 보여줍니다.
// (quadrant 는 가이드 §4 규칙으로 이미 계산된 값)
const fs = require("node:fs");
const path = require("node:path");

function loadSeed() {
  const file = path.join(__dirname, "seed_cards.json");
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw);
}

module.exports = { loadSeed };
