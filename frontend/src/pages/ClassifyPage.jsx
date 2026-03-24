import React, { useState } from "react";
import { Loader2, Zap, Shield, ShieldAlert, Clock, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { classifyJob } from "../services/api";
import { useAppStore } from "../store";
import { getCategoryMeta, formatPercent, formatMs } from "../services/categories";
import toast from "react-hot-toast";

const EXAMPLES = [
  { title:"Senior Machine Learning Engineer", description:"We are building next-gen recommendation systems using deep learning. You will design and train large-scale ML models using PyTorch and TensorFlow, deploy on AWS SageMaker, and collaborate with data engineers. Experience with transformers, A/B testing, and MLOps required.", company:"DeepMind Labs", location:"Remote", salary_range:"$180k–$230k", requirements:"PyTorch, TensorFlow, MLOps" },
  { title:"Digital Marketing Manager", description:"Drive user acquisition through data-driven campaigns. Manage paid channels on Google Ads and Meta, own SEO strategy, run email marketing via HubSpot, optimize landing pages. Report on ROI and ROAS. Experience with Mixpanel required.", company:"GrowthHive", location:"Chicago, IL", salary_range:"$110k–$140k", requirements:"Google Ads, SEO, HubSpot" },
  { title:"Enterprise Account Executive", description:"Manage the full sales cycle from prospecting to closing large SaaS deals. Run product demos, negotiate contracts, consistently hit quarterly quotas of $1.5M ARR. Work with SDRs and maintain Salesforce CRM.", company:"CloudSell Corp", location:"New York, NY", salary_range:"$120k + commission", requirements:"5+ yrs B2B sales" },
];

function StatChip({ label, value, color }) {
  return (
    <div className="card" style={{ padding:"12px 16px" }}>
      <div className="lbl" style={{ marginBottom:5 }}>{label}</div>
      <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:800, fontSize:22, color, letterSpacing:"-0.02em", lineHeight:1, textShadow:`0 0 20px ${color}88` }}>
        {value}
      </div>
    </div>
  );
}

function ConfidenceRing({ value, color }) {
  const r = 44, circ = 2 * Math.PI * r;
  return (
    <svg width={120} height={120} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(0,245,255,0.08)" strokeWidth={7} />
      <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ - value * circ}
        style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)", filter:`drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

function ScoreBar({ label, emoji, value, color, delay=0 }) {
  const [w, setW] = useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setW(value * 100), delay + 80);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
      <span style={{ fontSize:12, flexShrink:0 }}>{emoji}</span>
      <span style={{ fontFamily:"'Exo 2',sans-serif", fontSize:12, color:"var(--text-2)", width:130, flexShrink:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</span>
      <div style={{ flex:1, height:3, background:"rgba(0,245,255,0.08)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:2, transition:"width 0.9s cubic-bezier(0.4,0,0.2,1)", boxShadow:`0 0 8px ${color}` }} />
      </div>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"var(--text-3)", width:40, textAlign:"right" }}>{formatPercent(value)}</span>
    </div>
  );
}

export default function ClassifyPage() {
  const { setLastResult, setIsClassifying, isClassifying, lastResult } = useAppStore();
  const [form, setForm] = useState({ title:"", description:"", company:"", location:"", salary_range:"", requirements:"" });
  const [showAll, setShowAll] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (k === "description") setCharCount(e.target.value.length);
  };

  const loadExample = () => {
    const ex = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    setForm(f => ({ ...f, ...ex }));
    setCharCount(ex.description.length);
    toast("EXAMPLE LOADED", { style:{ background:"#060d14", color:"var(--cyan)", border:"1px solid var(--cyan)", fontFamily:"JetBrains Mono" } });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { toast.error("Title and description required"); return; }
    if (form.description.trim().split(" ").length < 3) { toast.error("Description too short — add more detail"); return; }
    setIsClassifying(true); setShowAll(false);
    try {
      const result = await classifyJob(form);
      setLastResult(result);
      toast.success("CLASSIFIED", { style:{ background:"#060d14", color:"var(--green)", border:"1px solid var(--green)", fontFamily:"JetBrains Mono" } });
    } catch (err) {
      toast.error(err.message, { style:{ background:"#060d14", color:"var(--red)", border:"1px solid var(--red)", fontFamily:"JetBrains Mono" } });
    } finally { setIsClassifying(false); }
  };

  const meta   = lastResult ? getCategoryMeta(lastResult.predicted_category) : null;
  const scores = lastResult ? Object.entries(lastResult.all_scores).sort(([,a],[,b]) => b-a) : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Stat row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <StatChip label="Categories"      value="12"    color="var(--cyan)" />
        <StatChip label="Fraud Detection" value="ON"    color="var(--green)" />
        <StatChip label="Auth"            value="JWT"   color="var(--gold)" />
        <StatChip label="Rate Limit"      value="10/m"  color="var(--magenta)" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
        {/* FORM */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:800, fontSize:15, color:"var(--text-1)", letterSpacing:"0.02em" }}>CLASSIFY JOB</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", letterSpacing:"0.1em", marginTop:4 }}>PASTE TITLE + DESCRIPTION</div>
            </div>
            <button onClick={loadExample} style={{
              background:"rgba(0,245,255,0.06)", border:"1px solid rgba(0,245,255,0.2)",
              color:"var(--cyan)", padding:"6px 12px", borderRadius:7, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:"0.06em",
            }}>LOAD EXAMPLE ↗</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <div className="lbl"><span style={{ color:"var(--cyan)" }}>◆</span> Job Title *</div>
              <input className="inp" placeholder="e.g. Senior Backend Engineer" value={form.title} onChange={set("title")} maxLength={200} required />
            </div>
            <div>
              <div className="lbl" style={{ justifyContent:"space-between" }}>
                <span><span style={{ color:"var(--cyan)" }}>◆</span> Description *</span>
                <span style={{ color: charCount > 9000 ? "var(--red)" : "var(--text-3)" }}>{charCount}/10,000</span>
              </div>
              <textarea className="inp" rows={7} placeholder="Paste full job description here…" value={form.description} onChange={set("description")} maxLength={10000} required style={{ resize:"none" }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["company","Company","Acme Corp"],["location","Location","Remote/NYC"],["salary_range","Salary","$100k–$140k"],["requirements","Requirements","5+ yrs Python"]].map(([k,label,ph]) => (
                <div key={k}>
                  <div className="lbl">{label} <span style={{ color:"var(--text-3)", fontSize:9 }}>(optional)</span></div>
                  <input className="inp" placeholder={ph} value={form[k]} onChange={set(k)} />
                </div>
              ))}
            </div>
            <button type="submit" disabled={isClassifying} className="btn-gold" style={{ marginTop:4 }}>
              {isClassifying ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> ANALYZING...</> : <><Zap size={14} /> CLASSIFY JOB</>}
            </button>
          </form>
        </div>

        {/* RESULT */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {!lastResult ? (
            <div className="card" style={{ padding:40, textAlign:"center", minHeight:340, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
              <div style={{
                width:80, height:80, borderRadius:"50%",
                border:"2px solid rgba(0,245,255,0.2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                position:"relative",
                boxShadow:"0 0 30px rgba(0,245,255,0.1)",
              }}>
                <div style={{ position:"absolute", inset:-10, borderRadius:"50%", border:"1px dashed rgba(0,245,255,0.15)", animation:"rotate-border 8s linear infinite" }} />
                <TrendingUp size={28} style={{ color:"var(--cyan)", opacity:0.6 }} />
              </div>
              <div>
                <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:700, fontSize:16, color:"var(--text-1)", marginBottom:6 }}>READY TO ANALYZE</div>
                <div style={{ fontFamily:"'Exo 2',sans-serif", fontSize:13, color:"var(--text-3)", maxWidth:220, margin:"0 auto", lineHeight:1.6 }}>
                  Fill the form and click <span style={{ color:"var(--gold)" }}>Classify Job</span> to get AI predictions
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
                {["⚙️ Engineering","📊 Data Science","🎨 Design","💼 Sales"].map(t => (
                  <span key={t} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:"4px 10px", borderRadius:6, border:"1px solid var(--border)", color:"var(--text-3)" }}>{t}</span>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Result hero */}
              <div className="card animate-fade-up" style={{ padding:20 }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${meta.color}, transparent)`, filter:`drop-shadow(0 0 4px ${meta.color})` }} />
                <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <ConfidenceRing value={lastResult.confidence} color={meta.color} />
                    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:22 }}>{meta.emoji}</span>
                      <span style={{ fontFamily:"'Orbitron',monospace", fontSize:10, color:meta.color, fontWeight:600, marginTop:2 }}>{formatPercent(lastResult.confidence)}</span>
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", letterSpacing:"0.12em", marginBottom:4 }}>PREDICTED CATEGORY</div>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:800, fontSize:17, color:"var(--text-1)", letterSpacing:"-0.01em", lineHeight:1.2, marginBottom:10 }}>{meta.label}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, fontSize:11, fontFamily:"'JetBrains Mono',monospace", background:lastResult.is_fraudulent?"rgba(255,51,85,0.1)":"rgba(0,255,136,0.08)", border:`1px solid ${lastResult.is_fraudulent?"rgba(255,51,85,0.3)":"rgba(0,255,136,0.25)"}`, color:lastResult.is_fraudulent?"var(--red)":"var(--green)" }}>
                        {lastResult.is_fraudulent ? <ShieldAlert size={11}/> : <Shield size={11}/>}
                        {lastResult.is_fraudulent ? `Fraud ${formatPercent(lastResult.fraud_probability)}` : "Authentic"}
                      </span>
                      <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:6,fontSize:11,fontFamily:"'JetBrains Mono',monospace",background:"rgba(0,245,255,0.05)",border:"1px solid var(--border)",color:"var(--text-3)" }}>
                        <Clock size={10}/>{formatMs(lastResult.processing_time_ms)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scores */}
              <div className="card animate-fade-up" style={{ padding:18, animationDelay:"0.1s" }}>
                <div className="sec-head">Score Breakdown</div>
                {(showAll ? scores : scores.slice(0,5)).map(([cat,score],i) => {
                  const m = getCategoryMeta(cat);
                  return <ScoreBar key={cat} emoji={m.emoji} label={m.label} value={score} color={m.color} delay={i*50} />;
                })}
                {scores.length > 5 && (
                  <button onClick={() => setShowAll(v=>!v)} style={{ display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--cyan)",marginTop:6,letterSpacing:"0.06em" }}>
                    {showAll ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                    {showAll ? "SHOW LESS" : `SHOW ${scores.length-5} MORE`}
                  </button>
                )}
              </div>

              {/* Top 3 */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }} className="animate-fade-up">
                {lastResult.top_categories.map((tc,i) => {
                  const m = getCategoryMeta(tc.category);
                  return (
                    <div key={tc.category} className="card" style={{ padding:"12px 10px", textAlign:"center", borderColor: i===0?`${m.color}44`:"var(--border)" }}>
                      <div style={{ fontSize:18, marginBottom:4 }}>{m.emoji}</div>
                      <div style={{ fontFamily:"'Exo 2',sans-serif",fontSize:11,color:"var(--text-3)",marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{m.label}</div>
                      <div style={{ fontFamily:"'Orbitron',monospace",fontSize:11,fontWeight:600,color:m.color,textShadow:`0 0 10px ${m.color}` }}>{formatPercent(tc.confidence)}</div>
                      {i===0 && <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--cyan)",marginTop:3 }}>TOP</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
