import React, { useEffect, useState } from "react";
import { ArrowRight, Shield, Zap, BarChart2, Search } from "lucide-react";

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

function GlitchText({ text, className = "" }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    let iter = 0;
    const iv = setInterval(() => {
      setDisplay(
        text.split("").map((c, i) =>
          i < iter ? c : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        ).join("")
      );
      if (iter >= text.length) clearInterval(iv);
      iter += 1.2;
    }, 38);
    return () => clearInterval(iv);
  }, [text]);
  return <span className={className}>{display}</span>;
}

const FEATURES = [
  { icon: Search,   label: "AI Classification", desc: "Classify job postings into 12 categories in under 20ms" },
  { icon: Shield,   label: "Fraud Detection",   desc: "Real-time red-flag phrase scanning with probability score" },
  { icon: BarChart2,label: "Live Analytics",    desc: "Bar, pie, line & radar charts updated in real time" },
  { icon: Zap,      label: "Secure & Fast",     desc: "JWT auth, rate limiting, PBKDF2 hashing — production grade" },
];

export default function LandingPage({ onEnter }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "40px 20px",
    }}>

      {/* ── Grid background ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage:
          "linear-gradient(rgba(0,245,255,0.035) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(0,245,255,0.035) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* ── Ambient glow orbs ── */}
      {[
        { size: 500, top: "-120px", left: "-120px", color: "0,245,255", opacity: 0.06 },
        { size: 400, bottom: "-80px", right: "-80px", color: "245,200,66", opacity: 0.05 },
        { size: 300, top: "40%",    left: "55%",    color: "192,132,252", opacity: 0.04 },
      ].map((orb, i) => (
        <div key={i} style={{
          position: "fixed",
          width: orb.size, height: orb.size,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${orb.color},${orb.opacity}) 0%, transparent 70%)`,
          top: orb.top, left: orb.left, bottom: orb.bottom, right: orb.right,
          pointerEvents: "none", zIndex: 0,
        }} />
      ))}

      {/* ── Rotating rings ── */}
      {[320, 480, 640].map((size, i) => (
        <div key={i} style={{
          position: "fixed",
          width: size, height: size,
          borderRadius: "50%",
          border: `1px solid rgba(0,245,255,${0.055 - i * 0.015})`,
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          animation: `rotate-border ${10 + i * 4}s linear ${i % 2 === 0 ? "" : "reverse"} infinite`,
          pointerEvents: "none", zIndex: 0,
        }} />
      ))}

      {/* ── Content ── */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 780, textAlign: "center" }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 20, marginBottom: 32,
          background: "rgba(0,245,255,0.07)",
          border: "1px solid rgba(0,245,255,0.22)",
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 11, color: "var(--cyan)", letterSpacing: "0.12em",
        }}>
          <div className="status-dot" style={{ width: 7, height: 7 }} />
          AI-POWERED · SECURE · REAL-TIME
        </div>

        {/* Main title */}
        <h1 style={{ margin: 0, lineHeight: 1, marginBottom: 16 }}>
          <span style={{
            display: "block",
            fontFamily: "'Orbitron',monospace",
            fontWeight: 900,
            fontSize: "clamp(52px, 10vw, 96px)",
            letterSpacing: "-0.03em",
          }}>
            <GlitchText text="JOB" className="neon-cyan" />
            <span style={{ color: "var(--gold)", textShadow: "0 0 30px rgba(245,200,66,0.55)" }}>
              DETECT
            </span>
          </span>
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: "'Exo 2',sans-serif",
          fontSize: "clamp(15px, 2.5vw, 20px)",
          color: "var(--text-2)",
          margin: "0 0 14px",
          lineHeight: 1.6,
        }}>
          AI-Powered Job Posting Classifier &amp; Fraud Detector
        </p>
        <p style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 11,
          color: "var(--text-3)",
          letterSpacing: "0.14em",
          margin: "0 0 48px",
        }}>
          DETECT · CLASSIFY · EXPOSE · SECURE
        </p>

        {/* ── ENTER BUTTON ── */}
        <button
          onClick={onEnter}
          className="btn-cyber"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 48px",
            fontSize: 14,
            letterSpacing: "0.14em",
            width: "auto",
            borderRadius: 10,
            marginBottom: 64,
            boxShadow: "0 0 40px rgba(0,245,255,0.15), 0 0 80px rgba(0,245,255,0.05)",
          }}
        >
          ENTER SYSTEM
          <ArrowRight size={18} />
        </button>

        {/* ── Feature cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
        }}>
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="card"
              style={{ padding: "18px 16px", textAlign: "left", cursor: "default" }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, marginBottom: 10,
                background: "rgba(0,245,255,0.08)",
                border: "1px solid rgba(0,245,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={16} style={{ color: "var(--cyan)" }} />
              </div>
              <div style={{
                fontFamily: "'Exo 2',sans-serif",
                fontWeight: 600, fontSize: 13,
                color: "var(--text-1)", marginBottom: 5,
              }}>{label}</div>
              <div style={{
                fontFamily: "'Exo 2',sans-serif",
                fontSize: 11, color: "var(--text-3)", lineHeight: 1.5,
              }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: 48,
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10, color: "var(--text-3)",
          letterSpacing: "0.1em",
        }}>
          FastAPI · React · TF-IDF · Logistic Regression · SQLite · JWT
        </p>
      </div>
    </div>
  );
}
