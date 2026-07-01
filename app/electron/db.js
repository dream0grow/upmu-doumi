// 로컬 저장소 (SQLite via better-sqlite3).
// 절대 원칙: 카드 메타·상태·우선순위(quadrant)만 저장.
// 원문 본문(text)·학생/교사 식별정보는 저장하지 않습니다.
const path = require("node:path");
const fs = require("node:fs");
const Database = require("better-sqlite3");

let db;

function initDb(userDataDir) {
  fs.mkdirSync(userDataDir, { recursive: true });
  const file = path.join(userDataDir, "gyomu.db");
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      sender TEXT,
      doc_number TEXT,
      kind TEXT,
      extension TEXT,
      sender_level TEXT,
      category TEXT,
      category_reason TEXT,
      placement TEXT,
      task_type TEXT,
      deadline_iso TEXT,
      deadline_label TEXT,
      deadline_raw TEXT,
      d_day INTEGER,
      d_day_text TEXT,
      other_deadlines TEXT,   -- JSON 문자열
      stale_dropped INTEGER DEFAULT 0,
      is_image INTEGER DEFAULT 0,
      needs_review INTEGER DEFAULT 1,
      quadrant TEXT,          -- 아이젠하워 배치(사용자가 드래그로 조정 가능)
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

// 카드를 화면용 객체로 되돌립니다 (JSON 필드 복원, boolean 변환).
function rowToCard(r) {
  return {
    id: r.id,
    title: r.title,
    sender: r.sender,
    doc_number: r.doc_number,
    kind: r.kind,
    extension: r.extension,
    sender_level: r.sender_level,
    category: r.category,
    category_reason: r.category_reason,
    placement: r.placement,
    task_type: r.task_type,
    deadline_iso: r.deadline_iso,
    deadline_label: r.deadline_label,
    deadline_raw: r.deadline_raw,
    d_day: r.d_day,
    d_day_text: r.d_day_text,
    other_deadlines: r.other_deadlines ? JSON.parse(r.other_deadlines) : [],
    stale_dropped: r.stale_dropped,
    is_image: !!r.is_image,
    needs_review: !!r.needs_review,
    quadrant: r.quadrant,
  };
}

function listCards() {
  const rows = db.prepare("SELECT * FROM cards ORDER BY id ASC").all();
  return rows.map(rowToCard);
}

function insertCard(c) {
  const stmt = db.prepare(`
    INSERT INTO cards (
      title, sender, doc_number, kind, extension, sender_level,
      category, category_reason, placement, task_type,
      deadline_iso, deadline_label, deadline_raw, d_day, d_day_text,
      other_deadlines, stale_dropped, is_image, needs_review, quadrant
    ) VALUES (
      @title, @sender, @doc_number, @kind, @extension, @sender_level,
      @category, @category_reason, @placement, @task_type,
      @deadline_iso, @deadline_label, @deadline_raw, @d_day, @d_day_text,
      @other_deadlines, @stale_dropped, @is_image, @needs_review, @quadrant
    )
  `);
  return stmt.run({
    title: c.title ?? null,
    sender: c.sender ?? null,
    doc_number: c.doc_number ?? null,
    kind: c.kind ?? null,
    extension: c.extension ?? null,
    sender_level: c.sender_level ?? null,
    category: c.category ?? null,
    category_reason: c.category_reason ?? null,
    placement: c.placement ?? null,
    task_type: c.task_type ?? null,
    deadline_iso: c.deadline_iso ?? null,
    deadline_label: c.deadline_label ?? null,
    deadline_raw: c.deadline_raw ?? null,
    d_day: c.d_day ?? null,
    d_day_text: c.d_day_text ?? "",
    other_deadlines: JSON.stringify(c.other_deadlines ?? []),
    stale_dropped: c.stale_dropped ?? 0,
    is_image: c.is_image ? 1 : 0,
    needs_review: c.needs_review === false ? 0 : 1,
    quadrant: c.quadrant ?? "기타",
  }).lastInsertRowid;
}

function updateQuadrant(id, quadrant) {
  db.prepare("UPDATE cards SET quadrant = ? WHERE id = ?").run(quadrant, id);
}

function count() {
  return db.prepare("SELECT COUNT(*) AS n FROM cards").get().n;
}

// 시드: 비어 있으면 카드들을 한 번에 넣습니다 (트랜잭션).
function seedCards(cards) {
  const insertMany = db.transaction((rows) => {
    for (const c of rows) insertCard(c);
  });
  insertMany(cards);
  return cards.length;
}

module.exports = { initDb, listCards, insertCard, updateQuadrant, count, seedCards };
