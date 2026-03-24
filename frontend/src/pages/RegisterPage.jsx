import React, { useState } from "react";
import { UserPlus, Lock, User, Mail, Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";

function GlitchText({ text }) {
  const [display, setDisplay] = React.useState(text);
  React.useEffect(() => {
    let iter = 0;
    const iv = setInterval(() => {
      setDisplay(text.split("").map((c, i) => i < iter ? c : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join(""));
      if (iter >= text.length) clearInterval(iv);
      iter += 1.5;
    }, 40);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{display}</span>;
}

function StrengthBar({ password }) {
  const checks = [
    { label: "6+ chars",    ok: password.length >= 6 },
    { label: "Not all digits", ok: password.length > 0 && !password.match(/^\d+$/) },
    { label: "10+ chars",   ok: password.length >= 10 },
    { label: "Mixed case",  ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["var(--red)", "var(--red)", "var(--gold)", "var(--gold)", "var(--green)"];
  const labels = ["", "Weak", "Weak", "Medium", "Strong"];

  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score] : "var(--border)", transition: "background 0.2s" }} />
        ))}
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: colors[score], marginLeft: 6, whiteSpace: "nowrap" }}>{labels[score]}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {checks.map(c => (
          <span key={c.label} style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: c.ok ? "var(--green)" : "var(--text-3)" }}>
            {c.ok ? <CheckCircle size={9} /> : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HexCorner({ pos }) {
  const s = { tl:{top:-1,left:-1}, tr:{top:-1,right:-1}, bl:{bottom:-1,left:-1}, br:{bottom:-1,right:-1} };
  return <div style={{ position:"absolute", width:14, height:14, ...s[pos], borderColor:"var(--cyan)", borderTopWidth:pos.includes("t")?2:0, borderBottomWidth:pos.includes("b")?2:0, borderLeftWidth:pos.includes("l")?2:0, borderRightWidth:pos.includes("r")?2:0, borderStyle:"solid" }} />;
}

export default function RegisterPage({ onSwitchToLogin }) {
  const [form, setForm] = useState({ username:"", password:"", full_name:"", email:"" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password || !form.full_name) { setError("All required fields must be filled"); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/register", form);
      setSuccess(true);
      toast.success("ACCOUNT CREATED — Please login", {
        style: { background:"#060d14", color:"#00ff88", border:"1px solid #00ff88", fontFamily:"JetBrains Mono" },
      });
      setTimeout(() => onSwitchToLogin(), 2000);
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.response?.data?.detail || err.message;
      setError(detail || "Registration failed");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(0,255,136,0.1)", border:"2px solid var(--green)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:"0 0 40px rgba(0,255,136,0.3)" }}>
          <CheckCircle size={36} style={{ color:"var(--green)" }} />
        </div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:18, color:"var(--green)", marginBottom:8 }}>ACCOUNT CREATED</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"var(--text-3)" }}>Redirecting to login...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", position:"relative", overflow:"hidden", padding:20 }}>
      {[...Array(5)].map((_,i) => (
        <div key={i} style={{ position:"absolute", width:`${160+i*110}px`, height:`${160+i*110}px`, borderRadius:"50%", border:`1px solid rgba(0,245,255,${0.06-i*0.01})`, top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:`rotate-border ${8+i*3}s linear ${i%2===0?"":"reverse"} infinite`, pointerEvents:"none" }} />
      ))}

      <div style={{ width:"100%", maxWidth:440, position:"relative", zIndex:10 }}>
        {/* Brand */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:66, height:66, borderRadius:14, marginBottom:14, background:"rgba(0,245,255,0.08)", border:"2px solid var(--cyan)", boxShadow:"0 0 40px rgba(0,245,255,0.2)", animation:"glow-pulse 3s ease-in-out infinite" }}>
            <UserPlus size={28} style={{ color:"var(--cyan)" }} />
          </div>
          <h1 style={{ fontFamily:"'Orbitron',monospace", fontWeight:900, fontSize:26, letterSpacing:"-0.02em", lineHeight:1, marginBottom:6 }}>
            <GlitchText text="JOB" /><span style={{ color:"var(--gold)", textShadow:"0 0 20px rgba(245,200,66,0.5)" }}>DETECT</span>
          </h1>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--text-3)", letterSpacing:"0.2em" }}>CREATE YOUR ACCOUNT</div>
        </div>

        {/* Card */}
        <div className="cyber-card" style={{ padding:30 }}>
          <HexCorner pos="tl"/><HexCorner pos="tr"/><HexCorner pos="bl"/><HexCorner pos="br"/>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700, color:"var(--cyan)", letterSpacing:"0.1em" }}>REGISTER</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", marginTop:3, letterSpacing:"0.1em" }}>SECURE ACCOUNT CREATION</div>
            </div>
            <div className="lock-badge"><Shield size={10} />ENCRYPTED</div>
          </div>

          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,51,85,0.08)", border:"1px solid rgba(255,51,85,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:16, fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"var(--red)" }}>
              <AlertTriangle size={13}/>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Full name */}
            <div>
              <div className="lbl"><User size={10}/> Full Name <span style={{ color:"var(--cyan)" }}>*</span></div>
              <div style={{ position:"relative" }}>
                <input className="inp" type="text" placeholder="Your full name" value={form.full_name} onChange={set("full_name")} required style={{ paddingLeft:40 }} />
                <User size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text-3)" }}/>
              </div>
            </div>

            {/* Username */}
            <div>
              <div className="lbl">@ Username <span style={{ color:"var(--cyan)" }}>*</span></div>
              <div style={{ position:"relative" }}>
                <input className="inp" type="text" placeholder="3–30 chars, letters/numbers/_/-" value={form.username} onChange={set("username")} required maxLength={30} style={{ paddingLeft:40 }} />
                <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text-3)", fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>@</span>
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="lbl"><Mail size={10}/> Email <span style={{ color:"var(--text-3)", fontSize:9 }}>(optional)</span></div>
              <div style={{ position:"relative" }}>
                <input className="inp" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} style={{ paddingLeft:40 }} />
                <Mail size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text-3)" }}/>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="lbl"><Lock size={10}/> Password <span style={{ color:"var(--cyan)" }}>*</span></div>
              <div style={{ position:"relative" }}>
                <input className="inp" type={showPw?"text":"password"} placeholder="Min 6 characters" value={form.password} onChange={set("password")} required maxLength={128} style={{ paddingLeft:40, paddingRight:44 }} />
                <Lock size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"var(--text-3)" }}/>
                <button type="button" onClick={() => setShowPw(v=>!v)} style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", display:"flex", alignItems:"center" }}>
                  {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              <StrengthBar password={form.password} />
            </div>

            <button type="submit" disabled={loading} className="btn-cyber" style={{ marginTop:4 }}>
              {loading ? <>⬡ CREATING ACCOUNT...</> : <><UserPlus size={14}/> CREATE ACCOUNT</>}
            </button>
          </form>

          <div style={{ marginTop:20, textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--text-3)" }}>
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--cyan)", fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>
              LOGIN →
            </button>
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:18, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", letterSpacing:"0.12em" }}>
          DETECT · CLASSIFY · EXPOSE · SECURE
        </div>
      </div>
    </div>
  );
}
