import React, { useEffect } from "react";
import { RefreshCw, Database, Shield } from "lucide-react";
import { getHistory } from "../services/api";
import { useAppStore } from "../store";
import { getCategoryMeta, formatPercent, formatMs } from "../services/categories";
import toast from "react-hot-toast";

export default function HistoryPage() {
  const { history, setHistory } = useAppStore();
  const load = async () => {
    try { const d = await getHistory(50); setHistory(d); }
    catch (err) { toast.error(err.message); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:800, fontSize:20, color:"var(--text-1)", letterSpacing:"-0.01em" }}>HISTORY</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", marginTop:4, letterSpacing:"0.1em" }}>{history.length} RECORDS · JWT PROTECTED</div>
        </div>
        <button onClick={load} style={{ display:"flex",alignItems:"center",gap:7,background:"rgba(0,245,255,0.06)",border:"1px solid rgba(0,245,255,0.2)",color:"var(--cyan)",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:"0.06em" }}>
          <RefreshCw size={12}/> REFRESH
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Total", value:history.length, color:"var(--cyan)" },
          { label:"Authentic", value:history.filter(h=>!h.is_fraudulent).length, color:"var(--green)" },
          { label:"Fraud Flags", value:history.filter(h=>h.is_fraudulent).length, color:"var(--red)" },
          { label:"Avg Confidence", value:history.length ? `${(history.reduce((a,h)=>a+h.confidence,0)/history.length*100).toFixed(0)}%` : "—", color:"var(--gold)" },
        ].map(({ label,value,color }) => (
          <div key={label} className="card" style={{ padding:"14px 18px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", letterSpacing:"0.12em", marginBottom:6 }}>{label.toUpperCase()}</div>
            <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:800, fontSize:24, color, letterSpacing:"-0.02em", lineHeight:1, textShadow:`0 0 20px ${color}66` }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        {history.length === 0 ? (
          <div style={{ padding:60, textAlign:"center" }}>
            <Database size={32} style={{ color:"var(--text-3)", margin:"0 auto 12px" }} />
            <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:700, fontSize:14, color:"var(--text-2)" }}>NO DATA</div>
            <div style={{ fontFamily:"'Exo 2',sans-serif", fontSize:13, color:"var(--text-3)", marginTop:6 }}>Classify a job to see records here</div>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table className="data-table">
              <thead>
                <tr>{["ID","Category","Confidence","Fraud Status","Time","Created"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {history.map((row,i) => {
                  const meta = getCategoryMeta(row.predicted_category);
                  return (
                    <tr key={row.id}>
                      <td style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--text-3)" }}>#{row.id}</td>
                      <td>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <span style={{ fontSize:14 }}>{meta.emoji}</span>
                          <span style={{ fontFamily:"'Exo 2',sans-serif",fontSize:12,color:meta.color,fontWeight:500 }}>{meta.label}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <div style={{ width:60,height:3,background:"rgba(0,245,255,0.08)",borderRadius:2,overflow:"hidden" }}>
                            <div style={{ height:"100%",width:`${row.confidence*100}%`,background:meta.color,borderRadius:2,boxShadow:`0 0 6px ${meta.color}` }} />
                          </div>
                          <span style={{ fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:600,color:meta.color }}>{formatPercent(row.confidence)}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:5,fontSize:11,fontFamily:"'JetBrains Mono',monospace",background:row.is_fraudulent?"rgba(255,51,85,0.1)":"rgba(0,255,136,0.07)",border:`1px solid ${row.is_fraudulent?"rgba(255,51,85,0.25)":"rgba(0,255,136,0.2)"}`,color:row.is_fraudulent?"var(--red)":"var(--green)" }}>
                          {row.is_fraudulent ? "⚠ Fraud" : "✓ Clean"}
                        </span>
                      </td>
                      <td style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--text-3)" }}>{formatMs(row.processing_time_ms)}</td>
                      <td style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--text-3)" }}>{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
