export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Orbitron'", "monospace"],
        body:    ["'Exo 2'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        bg:      { DEFAULT:"#020408", 2:"#060d14", 3:"#0a1628", 4:"#0f2040" },
        cyan:    { DEFAULT:"#00f5ff", 2:"#00c8d4" },
        gold:    "#f5c842",
        magenta: "#ff00ff",
        neon:    "#00ff88",
        red:     "#ff3355",
      },
    },
  },
  plugins: [],
};
