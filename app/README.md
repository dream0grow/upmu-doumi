# 교무부장 도우미 — 데스크톱 앱 (app/)

학교 공문을 100% 로컬에서 처리하는 윈도우 데스크톱 앱입니다.
기술 스택은 빌드 가이드(`docs/Manus빌드가이드.md`) 확정대로 Electron + React + Tailwind + shadcn/ui 이며,
로컬 저장은 SQLite(better-sqlite3)를 씁니다.

## 절대 원칙

- 클라우드 API 금지. 모든 처리는 로컬에서만.
- 개인정보·원문 본문은 저장하지 않음. SQLite 에는 카드 메타(제목·발신·마감·성격·배치)만 저장.
- 추출 로직은 다시 만들지 않음. 기존 파이썬 코어(`src/`)를 자식 프로세스로 실행해 씀.

## 구조

```
app/
  electron/           Electron 메인(백엔드)
    main.js           창 생성 + IPC 핸들러
    preload.js        contextBridge 로 안전한 API 만 노출 (window.gyomu)
    db.js             SQLite 저장소 (카드/상태만 저장)
    engine.js         python -m src.extract "파일" --json 자식 프로세스 실행
    eisenhower.cjs    아이젠하워 배치 규칙(가이드 §4) — 메인용
    seed_cards.json   최초 실행용 시드 데이터(프로토타입 69건)
  renderer/           React 화면(프론트엔드)
    src/
      pages/Dashboard.tsx     홈 대시보드(5칸 칸반 + 요약 띠 + 드래그 이동)
      components/             TopBar / Sidebar / OfficialCard / DetailModal
      lib/eisenhower.ts       배치 규칙(가이드 §4) — 화면용(메인과 동일)
      types.ts                데이터 계약(가이드 §2) 타입
```

## 실행

사전 준비: 저장소 루트에서 파이썬 코어 의존성 설치.

```bash
# 저장소 루트에서
pip install -r requirements.txt
```

앱 개발 실행:

```bash
cd app
pnpm install
pnpm dev        # Vite(5173) + Electron 동시 실행
```

윈도우 설치본 빌드:

```bash
pnpm dist        # electron-builder (win/nsis)
```

파이썬 실행 파일을 바꾸려면 환경변수 `GYOMU_PYTHON` 을 지정하세요 (기본 `python3`).

## 파이썬 엔진 연동 (가이드 §1·§2)

Electron 메인이 파일을 받으면 다음을 자식 프로세스로 실행합니다.

```
python -m src.extract "<파일경로>" --json      # AI 포함 시 --ai
```

stdout 의 JSON(가이드 §2 데이터 계약)을 그대로 파싱해 화면에 표시합니다.
`notebook` 카드에는 배치 정보(quadrant)가 없으므로, 가이드 §4 규칙을 앱에서 계산해 붙입니다.

## 현재 진행 상황

- [x] 홈 대시보드 — 아이젠하워 5칸, 카드(제목·D-day·성격 태그), 상세 모달, 상단 요약 띠,
      좌측 메뉴, 🔒 로컬 작동중 표시, 카드 드래그 이동 + SQLite 저장.
- [ ] 들어온 공문 — 드래그&드롭 → 엔진 실행 → 목록 (다음)
- [ ] 교무수첩 — 우선순위·D-day·세부 할일 (그다음)
