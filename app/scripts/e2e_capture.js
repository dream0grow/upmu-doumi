// Electron 안에서 실제로 창을 띄우고 대시보드를 렌더링한 뒤 스크린샷을 저장합니다.
// 실행: xvfb-run -a electron scripts/e2e_capture.js
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const db = require("../electron/db");
const engine = require("../electron/engine");
const { loadSeed } = require("../electron/seed");
const { eisenhower } = require("../electron/eisenhower.cjs");

function registerIpc() {
  ipcMain.handle("cards:list", () => db.listCards());
  ipcMain.handle("cards:updateQuadrant", (_e, { id, quadrant }) => {
    db.updateQuadrant(id, quadrant);
    return true;
  });
  ipcMain.handle("cards:seedIfEmpty", () => {
    if (db.count() > 0) return 0;
    const seed = loadSeed().map((c) => ({ ...c, quadrant: c.quadrant || eisenhower(c) }));
    return db.seedCards(seed);
  });
  ipcMain.handle("engine:extract", async (_e, { filePath, withAi }) => {
    const r = await engine.extractFile(filePath, !!withAi);
    if (r && r.notebook) r.notebook.quadrant = eisenhower(r.notebook);
    return r;
  });
  ipcMain.handle("shell:openFile", (_e, p) => shell.openPath(p));
}

app.whenReady().then(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gyomu-e2e-"));
  db.initDb(dir);
  registerIpc();

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "..", "electron", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await win.loadFile(path.join(__dirname, "..", "dist", "index.html"));

  // 렌더링·시드 주입·데이터 로드가 끝날 시간을 줍니다.
  await new Promise((r) => setTimeout(r, 2500));

  // 화면에 카드가 실제로 그려졌는지 DOM 에서 확인
  const check = await win.webContents.executeJavaScript(`
    (function(){
      const cards = document.querySelectorAll('.card').length;
      const quads = document.querySelectorAll('.q').length;
      const strip = document.querySelector('.strip') ? document.querySelector('.strip').innerText.replace(/\\n/g,' ') : '';
      const lock = document.querySelector('.lock-badge') ? document.querySelector('.lock-badge').innerText : '';
      return { cards, quads, strip, lock };
    })();
  `);
  console.log("DOM 검증:", JSON.stringify(check, null, 2));

  const img = await win.webContents.capturePage();
  const outDir = path.join(__dirname, "..", "..", "prototype");
  const outFile = path.join(__dirname, "..", "screenshot_dashboard.png");
  fs.writeFileSync(outFile, img.toPNG());
  console.log("스크린샷 저장:", outFile);

  app.quit();
});
