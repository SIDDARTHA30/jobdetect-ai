import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Search, Clock, BarChart2, Activity, LogOut, Shield, User } from "lucide-react";
import { useAppStore } from "./store";
import LandingPage from "./pages/LandingPage";
import ClassifyPage from "./pages/ClassifyPage";
import HistoryPage from "./pages/HistoryPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LoginPage from "./pages/LoginPage";
import { getHealth } from "./services/api";
import toast from "react-hot-toast";

const NAV = [
  { id: "classify",  label: "Classify",  icon: Search,   sub: "AI Engine" },
  { id: "history",   label: "History",   icon: Clock,    sub: "Past runs" },
  { id: "analytics", label: "Analytics", icon: BarChart2, sub: "Insights" },
];

export default function App() {
  const { isAuthed, activeTab, setActiveTab, apiOnline, setApiOnline, user, logout } = useAppStore();
  const [time, setTime] = useState(new Date());
  // Show landing page on first visit; skip if already authenticated
  const [showLanding, setShowLanding] = useState(!isAuthed);

  // Auto-logout on 401
  useEffect(() => {
    const handler = () => {
      logout();
      toast.error("Session expired. Please login again.", {
        style: { background:"#060d14", color:"#ff3355", border:"1px solid #ff3355", fontFamily:"JetBrains Mono" },
      });
    };
    window.addEventListener("jd:unauthorized", handler);
    return () => window.removeEventListener("jd:unauthorized", handler);
  }, [logout]);

  useEffect(() => {
    if (!isAuthed) return;
    const check = () => getHealth().then(() => setApiOnline(true)).catch(() => setApiOnline(false));
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [isAuthed]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!isAuthed) return (
    <>
      <Toaster position="top-right" />
      {showLanding
        ? <LandingPage onEnter={() => setShowLanding(false)} />
        : <LoginPage />}
    </>
  );

  const pad = n => String(n).padStart(2, "0");
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

  const handleLogout = () => {
    logout();
    toast("LOGGED OUT", { style: { background:"#060d14", color:"var(--cyan)", border:"1px solid var(--cyan)", fontFamily:"JetBrains Mono" } });
  };

  const sidebarItem = (id, label, Icon, sub) => {
    const active = activeTab === id;
    return (
      <button key={id} onClick={() => setActiveTab(id)} style={{
        width:"100%", display:"flex", alignItems:"center", gap:10,
        padding:"10px 12px", borderRadius:8, textAlign:"left", cursor:"pointer",
        background: active ? "rgba(0,245,255,0.06)" : "transparent",
        border: `1px solid ${active ? "rgba(0,245,255,0.2)" : "transparent"}`,
        transition:"all 0.15s",
      }}>
        <Icon size={14} style={{ color: active ? "var(--cyan)" : "var(--text-3)", flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Exo 2',sans-serif", fontSize:13, fontWeight:600, color: active ? "var(--text-1)" : "var(--text-2)" }}>{label}</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)" }}>{sub}</div>
        </div>
        {active && <div style={{ width:2, height:18, borderRadius:1, background:"var(--cyan)", boxShadow:"0 0 8px var(--cyan)", flexShrink:0 }} />}
      </button>
    );
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", position:"relative", zIndex:1 }}>
      <Toaster position="top-right" toastOptions={{
        style:{ background:"#060d14", color:"var(--text-1)", border:"1px solid var(--border)", fontFamily:"'Exo 2',sans-serif", fontSize:"13px" },
      }} />

      {/* ── SIDEBAR ── */}
      <aside style={{
        width:220, flexShrink:0, display:"flex", flexDirection:"column",
        borderRight:"1px solid var(--border)",
        background:"rgba(2,4,8,0.97)", backdropFilter:"blur(20px)",
        position:"sticky", top:0, height:"100vh",
      }}>
        {/* Logo */}
        <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{
              width:38, height:38, borderRadius:8,
              background:"rgba(0,245,255,0.1)",
              border:"1.5px solid var(--cyan)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 0 20px rgba(0,245,255,0.25)",
              flexShrink:0,
            }}>
              <Shield size={18} style={{ color:"var(--cyan)" }} />
            </div>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:900, fontSize:15, letterSpacing:"-0.02em", lineHeight:1 }}>
                <span className="neon-cyan">JOB</span>
                <span style={{ color:"var(--gold)", textShadow:"0 0 12px rgba(245,200,66,0.5)" }}>DETECT</span>
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--text-3)", letterSpacing:"0.12em", marginTop:3 }}>
                SECURE · AI · v2.0
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"14px 10px", display:"flex", flexDirection:"column", gap:2 }}>
          <div className="lbl" style={{ padding:"0 8px", marginBottom:6 }}>Navigation</div>
          {NAV.map(({ id, label, icon, sub }) => sidebarItem(id, label, icon, sub))}
        </nav>

        {/* Bottom panel */}
        <div style={{ padding:"0 10px 14px", display:"flex", flexDirection:"column", gap:8 }}>
          {/* User card */}
          <div className="card" style={{ padding:"10px 12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <div style={{
                width:28, height:28, borderRadius:6,
                background:"rgba(0,245,255,0.1)", border:"1px solid rgba(0,245,255,0.2)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <User size={13} style={{ color:"var(--cyan)" }} />
              </div>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:600, color:"var(--text-1)" }}>
                  {user?.username?.toUpperCase()}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color: user?.role === "admin" ? "var(--gold)" : "var(--cyan)" }}>
                  {user?.role?.toUpperCase()}
                </div>
              </div>
            </div>
            {/* System stats */}
            {[
              ["API", <span style={{display:"flex",alignItems:"center",gap:4}}><div className="status-dot" style={!apiOnline?{background:"var(--red)",animationName:"none"}:{}} /><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:apiOnline?"var(--green)":"var(--red)"}}>{apiOnline===null?"INIT":apiOnline?"ONLINE":"OFFLINE"}</span></span>],
              ["TIME", <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--gold)"}}>{timeStr}</span>],
              ["MODEL", <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--cyan2)"}}>TF-IDF+LR</span>],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--text-3)"}}>{k}</span>
                {v}
              </div>
            ))}
          </div>

          {/* Logout */}
          <button onClick={handleLogout} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            padding:"8px 0", borderRadius:7, cursor:"pointer",
            background:"rgba(255,51,85,0.08)", border:"1px solid rgba(255,51,85,0.2)",
            color:"var(--red)", fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            letterSpacing:"0.1em", transition:"all 0.15s",
          }}>
            <LogOut size={12} /> LOGOUT
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Topbar */}
        <header style={{
          height:52, display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 24px", borderBottom:"1px solid var(--border)",
          background:"rgba(2,4,8,0.8)", backdropFilter:"blur(16px)",
          position:"sticky", top:0, zIndex:50,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Activity size={12} style={{ color:"var(--cyan)" }} />
            <span style={{ fontFamily:"'Orbitron',monospace", fontWeight:700, fontSize:13, color:"var(--text-1)", letterSpacing:"0.05em" }}>
              {NAV.find(n => n.id === activeTab)?.label}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)" }}>
              / {NAV.find(n => n.id === activeTab)?.sub}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div className="lock-badge"><Shield size={9} /> JWT SECURED</div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", letterSpacing:"0.08em" }}>
              JOBDETECT · 12 CATEGORIES · FRAUD DETECTION
            </span>
          </div>
        </header>

        <div style={{ flex:1, padding:24, overflowY:"auto" }}>
          {activeTab === "classify"  && <ClassifyPage />}
          {activeTab === "history"   && <HistoryPage />}
          {activeTab === "analytics" && <AnalyticsPage />}
        </div>
      </main>
    </div>
  );
}
