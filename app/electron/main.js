// Electron 메인 프로세스.
// - 창을 만들고 React 화면을 로드
// - SQLite(카드 저장) + 파이썬 엔진(추출) IPC 핸들러 등록
// - 절대 원칙: 공문 원문·개인정보는 PC 밖으로 안 나감. 처리는 전부 로컬.
//   (개인정보 아닌 의견·분류 수정 내역만, 사용자가 '보내기'를 눌렀을 때 전송)
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

// 의견·분류 개선 데이터를 받을 관리자 메일 (환경변수로 바꿀 수 있음)
const ADMIN_EMAIL = process.env.GYOMU_ADMIN_EMAIL || "leehg0211@gmail.com";
const db = require("./db");
const engine = require("./engine");
const { loadSeed } = require("./seed");
const { eisenhower } = require("./eisenhower.cjs");

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    title: "교무부장 도우미",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

function registerIpc() {
  // 저장된 카드 목록
  ipcMain.handle("cards:list", () => db.listCards());

  // 드래그 이동 결과 저장 (구 아이젠하워 — 남겨둠)
  ipcMain.handle("cards:updateQuadrant", (_e, { id, quadrant }) => {
    db.updateQuadrant(id, quadrant);
    return true;
  });

  // 카드 처리 완료/해제
  ipcMain.handle("cards:setDone", (_e, { id, done }) => {
    db.setCardDone(id, done);
    return true;
  });

  // 성격·처리주체 수동 수정 (자동 분류가 틀렸을 때 부장이 직접)
  ipcMain.handle("cards:updateClass", (_e, { id, category, owner }) => {
    db.updateCardClass(id, category, owner);
    return true;
  });

  // ── 투두리스트 (홈에서 바로 작성, 중요도 태그) ──
  ipcMain.handle("todos:list", () => db.listTodos());
  ipcMain.handle("todos:add", (_e, { text, priority, cardId }) =>
    db.addTodo(text, priority, cardId)
  );
  ipcMain.handle("todos:toggle", (_e, { id, done }) => {
    db.toggleTodo(id, done);
    return true;
  });
  ipcMain.handle("todos:update", (_e, { id, text, priority }) => {
    db.updateTodo(id, text, priority);
    return true;
  });
  ipcMain.handle("todos:remove", (_e, { id }) => {
    db.removeTodo(id);
    return true;
  });

  // 비어 있으면 시드 주입. quadrant 가 없으면 규칙(§4)으로 계산해 채웁니다.
  ipcMain.handle("cards:seedIfEmpty", () => {
    if (db.count() > 0) return 0;
    const seed = loadSeed().map((c) => ({
      ...c,
      quadrant: c.quadrant || eisenhower(c),
    }));
    return db.seedCards(seed);
  });

  // 파일 추출 (파이썬 엔진 자식 프로세스). 결과에 quadrant 를 붙여 반환.
  // ★ 로컬 학습: 같은 제목을 부장이 이전에 고쳐 뒀으면 그 분류를 우선 적용.
  ipcMain.handle("engine:extract", async (_e, { filePath, withAi }) => {
    const result = await engine.extractFile(filePath, !!withAi);
    if (result && result.notebook) {
      const learned = db.findClassOverride(result.notebook.title);
      if (learned) {
        result.notebook.category = learned.category;
        result.notebook.owner = learned.owner;
        result.notebook.category_reason =
          "부장이 이전에 직접 고친 분류를 적용 (로컬 학습)";
      }
      result.notebook.quadrant = eisenhower(result.notebook);
    }
    return result;
  });

  // ── 의견 보내기 (불편·문의·아이디어 + 분류 수정 내역) ──
  ipcMain.handle("feedback:add", (_e, { kind, text }) => db.addFeedback(kind, text));
  ipcMain.handle("feedback:list", () => db.listFeedback());
  ipcMain.handle("feedback:remove", (_e, { id }) => {
    db.removeFeedback(id);
    return true;
  });

  // 보낼 내용 미리보기 (사용자가 눈으로 확인한 뒤에만 보냄)
  ipcMain.handle("feedback:preview", () => db.collectOutbox());

  // '보내기': ① JSON 파일로 저장(폴더 열어줌) ② 메일 창을 미리 채워 열어줌.
  // 앱이 몰래 전송하지 않습니다 — 마지막 전송 버튼은 사용자가 메일에서 누릅니다.
  ipcMain.handle("feedback:send", () => {
    const outbox = db.collectOutbox();
    const n = outbox.feedback.length + outbox.corrections.length;
    if (n === 0) return { ok: false, message: "보낼 내용이 없습니다." };

    // ① 전체 데이터를 JSON 파일로 (메일에 첨부하기 좋게)
    const dir = path.join(app.getPath("userData"), "outbox");
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const file = path.join(dir, `교무도우미-의견-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify(outbox, null, 2), "utf-8");
    shell.showItemInFolder(file);

    // ② 메일 초안 (본문은 요약 — 전체는 첨부 파일로 안내)
    const lines = [
      "[교무부장 도우미] 사용 의견 + 분류 수정 내역입니다.",
      "",
      `- 의견 ${outbox.feedback.length}건`,
      ...outbox.feedback.slice(0, 5).map((f) => `  · (${f.kind}) ${f.text.slice(0, 80)}`),
      `- 분류 수정 ${outbox.corrections.length}건`,
      ...outbox.corrections.slice(0, 5).map(
        (c) => `  · "${(c.card_title || "").slice(0, 40)}" ${c.old_category}→${c.new_category}`
      ),
      "",
      "※ 전체 내용은 방금 열린 폴더의 JSON 파일을 첨부해 주세요.",
    ];
    const mailto =
      `mailto:${ADMIN_EMAIL}` +
      `?subject=${encodeURIComponent("[교무부장 도우미] 사용 의견")}` +
      `&body=${encodeURIComponent(lines.join("\n"))}`;
    shell.openExternal(mailto);

    db.markFeedbackSent();
    return { ok: true, file, count: n };
  });

  // 원본 파일 열기 (OS 기본 프로그램)
  ipcMain.handle("shell:openFile", (_e, filePath) => shell.openPath(filePath));
}

app.whenReady().then(() => {
  const userDataDir = path.join(app.getPath("userData"), "data");
  db.initDb(userDataDir);
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
