// 상세 모달 열림과 하단(기타 full 폭 칸)까지 확인하는 캡처 스크립트.
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gyomu-e2e2-"));
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
  await new Promise((r) => setTimeout(r, 2500));

  // 첫 카드 클릭 → 상세 모달 열기
  await win.webContents.executeJavaScript(`
    (function(){ const c = document.querySelector('.card'); if(c) c.click(); })();
  `);
  await new Promise((r) => setTimeout(r, 600));

  const img = await win.webContents.capturePage();
  const outFile = path.join(__dirname, "..", "screenshot_modal.png");
  fs.writeFileSync(outFile, img.toPNG());
  console.log("모달 스크린샷 저장:", outFile);

  // 모달 닫고 맨 아래(기타 칸)로 스크롤 후 캡처
  await win.webContents.executeJavaScript(`
    (function(){ window.scrollTo(0, document.body.scrollHeight); })();
  `);
  await new Promise((r) => setTimeout(r, 500));
  const img2 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, "..", "screenshot_bottom.png"), img2.toPNG());
  console.log("하단 스크린샷 저장");

  app.quit();
});
