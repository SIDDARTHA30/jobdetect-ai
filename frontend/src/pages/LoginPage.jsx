import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, Shield, Zap, AlertTriangle } from "lucide-react";
import { loginUser } from "../services/api";
import { useAppStore } from "../store";
import RegisterPage from "./RegisterPage";
import toast from "react-hot-toast";

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

function GlitchText({ text, className = "" }) {
  const [display, setDisplay] = useState(text);
  React.useEffect(() => {
    let iter = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((c, i) => i < iter ? c : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join(""));
      if (iter >= text.length) clearInterval(interval);
      iter += 1.5;
    }, 40);
    return () => clearInterval(interval);
  }, [text]);
  return <span className={className}>{display}</span>;
}

function HexCorner({ pos }) {
  const s = { tl:{top:-1,left:-1}, tr:{top:-1,right:-1}, bl:{bottom:-1,left:-1}, br:{bottom:-1,right:-1} };
  return <div style={{ position:"absolute", width:14, height:14, ...s[pos], borderColor:"var(--cyan)", borderTopWidth:pos.includes("t")?2:0, borderBottomWidth:pos.includes("b")?2:0, borderLeftWidth:pos.includes("l")?2:0, borderRightWidth:pos.includes("r")?2:0, borderStyle:"solid" }} />;
}

export default function LoginPage() {
  const { login } = useAppStore();
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  if (showRegister) return <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError("All fields required"); return; }
    setLoading(true); setError("");
    try {
      const data = await loginUser(username.trim(), password);
      login(data.access_token, data.refresh_token, { username: data.username, role: data.role });
      toast.success(`ACCESS GRANTED — ${data.username.toUpperCase()}`, {
        style: { background:"#060d14", color:"#00ff88", border:"1px solid #00ff88", fontFamily:"JetBrains Mono" },
      });
    } catch (err) {
      setAttempts(a => a + 1);
      const msg = err.message?.includes("423") || err.message?.includes("locked")
        ? "Account locked after too many failed attempts. Contact admin."
        : err.message || "Authentication failed";
      setError(msg);
      toast.error("ACCESS DENIED", {
        style: { background:"#060d14", color:"#ff3355", border:"1px solid #ff3355", fontFamily:"JetBrains Mono" },
      });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", position:"relative", overflow:"hidden", padding:20 }}>
      {[...Array(5)].map((_,i) => (
        <div key={i} style={{ position:"absolute", width:`${180+i*120}px`, height:`${180+i*120}px`, borderRadius:"50%", border:`1px solid rgba(0,245,255,${0.06-i*0.01})`, top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:`rotate-border ${8+i*3}s linear ${i%2===0?"":"reverse"} infinite`, pointerEvents:"none" }} />
      ))}

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:10 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:70, height:70, borderRadius:14, marginBottom:16, background:"linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,245,255,0.05))", border:"2px solid var(--cyan)", boxShadow:"0 0 40px rgba(0,245,255,0.3), inset 0 0 20px rgba(0,245,255,0.05)", animation:"glow-pulse 3s ease-in-out infinite" }}>
            <Shield size={30} style={{ color:"var(--cyan)" }} />
          </div>
          <h1 style={{ fontFamily:"'Orbitron',monospace", fontWeight:900, fontSize:28, letterSpacing:"-0.02em", lineHeight:1, marginBottom:6 }}>
            <GlitchText text="JOB" className="neon-cyan" />
            <span style={{ color:"var(--gold)", textShadow:"0 0 20px rgba(245,200,66,0.6)" }}>DETECT</span>
          </h1>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--text-3)", letterSpacing:"0.2em" }}>SECURE ACCESS PORTAL v4.0</div>
        </div>

        <div className="cyber-card" style={{ padding:32 }}>
          <HexCorner pos="tl"/><HexCorner pos="tr"/><HexCorner pos="bl"/><HexCorner pos="br"/>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700, color:"var(--cyan)", letterSpacing:"0.1em" }}>AUTHENTICATE</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", marginTop:3, letterSpacing:"0.1em" }}>JWT SECURED · PBKDF2-SHA256</div>
            </div>
            <div className="lock-badge"><Lock size={10}/>SECURE</div>
          </div>

          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,51,85,0.08)", border:"1px solid rgba(255,51,85,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:16, fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"var(--red)" }}>
              <AlertTriangle size={13}/>{error} {attempts > 1 && `(${attempts} attempts)`}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <div className="lbl"><User size={10}/> Username</div>
              <div style={{ position:"relative" }}>
                <input className="inp" type="text" placeholder="Enter username" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required style={{ paddingLeft:40 }}/>
                <User size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text-3)" }}/>
              </div>
            </div>
            <div>
              <div className="lbl"><Lock size={10}/> Password</div>
              <div style={{ position:"relative" }}>
                <input className="inp" type={showPw?"text":"password"} placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required style={{ paddingLeft:40, paddingRight:44 }}/>
                <Lock size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text-3)" }}/>
                <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", display:"flex", alignItems:"center" }}>
                  {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-cyber" style={{ marginTop:4 }}>
              {loading ? <><span style={{ animation:"neon-flicker 1s infinite" }}>⬡</span> AUTHENTICATING...</> : <><Zap size={14}/> INITIATE ACCESS</>}
            </button>
          </form>

          {/* Demo hint */}
          <div style={{ marginTop:20, padding:"12px 14px", background:"rgba(0,245,255,0.04)", border:"1px solid var(--border)", borderRadius:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", letterSpacing:"0.1em", marginBottom:7 }}>DEMO CREDENTIALS</div>
            {[["admin","admin123","ADMIN"],["demo","demo123","USER"]].map(([u,p,role])=>(
              <div key={u} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div style={{ display:"flex", gap:10 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--cyan)" }}>{u}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--text-3)" }}>/</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--text-2)" }}>{p}</span>
                </div>
                <button type="button" onClick={()=>{setUsername(u);setPassword(p);}} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:role==="ADMIN"?"var(--gold)":"var(--cyan)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.08em" }}>[{role}]</button>
              </div>
            ))}
          </div>

          {/* Switch to register */}
          <div style={{ marginTop:16, textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--text-3)" }}>
            New user?{" "}
            <button onClick={()=>setShowRegister(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--cyan)", fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>
              CREATE ACCOUNT →
            </button>
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", letterSpacing:"0.12em" }}>
          DETECT · CLASSIFY · EXPOSE · SECURE
        </div>
      </div>
    </div>
  );
}
