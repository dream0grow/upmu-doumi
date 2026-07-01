/** @type {import('tailwindcss').Config} */
export default {
  content: ["./renderer/index.html", "./renderer/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // prototype/dashboard.html 의 :root 색과 동일하게 맞춥니다.
        ink: "#2c3e50",       // 기본 글자색
        panel: "#f4f6f8",     // 페이지 배경
        topbar: "#34495e",    // 상단 바
        sidebar: "#2c3e50",   // 좌측 메뉴
        "side-active": "#3d566e",
        "side-accent": "#1abc9c",
        red: "#e74c3c",
        yellow: "#f1c40f",
        "yellow-ink": "#c9a400",
        orange: "#e67e22",
        green: "#27ae60",
        gray5: "#95a5a6",
        muted: "#7f8c8d",
      },
      fontFamily: {
        kr: ["Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.08)",
        cardHover: "0 2px 8px rgba(0,0,0,.12)",
      },
    },
  },
  plugins: [],
};
