// preload: 렌더러(React)에 안전한 브리지 API 만 노출합니다.
// 네트워크 호출은 없습니다 (절대 원칙: 100% 로컬).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gyomu", {
  // 저장된 카드 목록
  listCards: () => ipcRenderer.invoke("cards:list"),
  // 카드의 아이젠하워 배치 저장 (드래그 이동 결과)
  updateQuadrant: (id, quadrant) =>
    ipcRenderer.invoke("cards:updateQuadrant", { id, quadrant }),
  // DB 가 비어 있으면 시드 데이터 주입 → 넣은 개수 반환
  seedIfEmpty: () => ipcRenderer.invoke("cards:seedIfEmpty"),
  // 파일 1개를 파이썬 엔진으로 추출 (들어온 공문 단계에서 사용)
  extractFile: (filePath, withAi) =>
    ipcRenderer.invoke("engine:extract", { filePath, withAi }),
  // 원본 파일을 OS 기본 프로그램으로 열기
  openFile: (filePath) => ipcRenderer.invoke("shell:openFile", filePath),
});
