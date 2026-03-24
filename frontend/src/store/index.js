import { create } from "zustand";

const TOKEN_KEY   = "jd_token";
const REFRESH_KEY = "jd_refresh";
const USER_KEY    = "jd_user";

export const useAppStore = create((set) => ({
  // ── Auth ──
  token:    localStorage.getItem(TOKEN_KEY)   || null,
  refresh:  localStorage.getItem(REFRESH_KEY) || null,
  user:     JSON.parse(localStorage.getItem(USER_KEY) || "null"),
  isAuthed: !!localStorage.getItem(TOKEN_KEY),

  login: (access_token, refresh_token, user) => {
    localStorage.setItem(TOKEN_KEY,   access_token);
    localStorage.setItem(REFRESH_KEY, refresh_token);
    localStorage.setItem(USER_KEY,    JSON.stringify(user));
    set({ token: access_token, refresh: refresh_token, user, isAuthed: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    set({
      token: null, refresh: null, user: null, isAuthed: false,
      activeTab: "classify", lastResult: null,
      history: [], stats: [], trends: [], keywords: [],
    });
  },

  // ── UI ──
  activeTab: "classify",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Classify ──
  lastResult: null,
  setLastResult: (r) => set({ lastResult: r }),
  isClassifying: false,
  setIsClassifying: (v) => set({ isClassifying: v }),

  // ── History ──
  history: [],
  setHistory: (h) => set({ history: h }),

  // ── Analytics ──
  stats:    [], setStats:    (s) => set({ stats: s }),
  trends:   [], setTrends:   (t) => set({ trends: t }),
  keywords: [], setKeywords: (k) => set({ keywords: k }),

  // ── System ──
  apiOnline: null,
  setApiOnline: (v) => set({ apiOnline: v }),
}));
