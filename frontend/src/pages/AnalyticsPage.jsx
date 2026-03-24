import React, { useEffect } from "react";
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,LineChart,Line,CartesianGrid,PieChart,Pie,Cell,RadarChart,Radar,PolarGrid,PolarAngleAxis } from "recharts";
import { useAppStore } from "../store";
import { getStats, getTrends, getTopKeywords } from "../services/api";
import { getCategoryMeta } from "../services/categories";

const TT = ({ active,payload,label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:8, padding:"8px 12px", fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
      {label && <div style={{ color:"var(--text-3)", marginBottom:4 }}>{label}</div>}
      {payload.map(p=><div key={p.name} style={{ color:p.color||"var(--cyan)" }}>{p.name?`${p.name}: `:""}<span style={{ fontWeight:600 }}>{p.value}</span></div>)}
    </div>
  );
};
const Empty = () => (
  <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
    <div style={{ textAlign:"center" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--text-3)", letterSpacing:"0.1em" }}>NO DATA YET</div>
      <div style={{ fontFamily:"'Exo 2',sans-serif", fontSize:12, color:"var(--text-3)", marginTop:6 }}>Classify some jobs to populate charts</div>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const { stats,setStats,trends,setTrends,keywords,setKeywords } = useAppStore();
  useEffect(() => {
    getStats().then(setStats).catch(()=>{});
    getTrends(30).then(setTrends).catch(()=>{});
    getTopKeywords().then(setKeywords).catch(()=>{});
  }, []);

  const chartData = stats.map(s => ({
    ...s, label:getCategoryMeta(s.category).label,
    emoji:getCategoryMeta(s.category).emoji, color:getCategoryMeta(s.category).color,
  }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:800, fontSize:20, color:"var(--text-1)", letterSpacing:"-0.01em" }}>ANALYTICS</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", marginTop:4, letterSpacing:"0.1em" }}>REAL-TIME INSIGHTS · JWT SECURED</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Total Classified", value:stats.reduce((a,s)=>a+s.count,0), color:"var(--cyan)" },
          { label:"Top Category", value:chartData[0]?.emoji+" "+(chartData[0]?.label?.split(" ")[0]||"—"), color:"var(--green)" },
          { label:"Categories Seen", value:`${stats.length}/12`, color:"var(--gold)" },
          { label:"Trend Days", value:trends.length, color:"var(--magenta)" },
        ].map(({ label,value,color }) => (
          <div key={label} className="card" style={{ padding:"14px 18px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--text-3)", letterSpacing:"0.12em", marginBottom:6 }}>{label.toUpperCase()}</div>
            <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:800, fontSize:20, color, lineHeight:1, textShadow:`0 0 20px ${color}66` }}>{value||"0"}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {/* Bar */}
        <div className="card" style={{ padding:20, gridColumn:"span 2" }}>
          <div className="sec-head">Category Distribution</div>
          {chartData.length===0 ? <Empty/> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top:0,right:0,left:-25,bottom:60 }}>
                <CartesianGrid strokeDasharray="2 4" />
                <XAxis dataKey="label" tick={{ fill:"var(--text-3)",fontSize:10,fontFamily:"'JetBrains Mono',monospace" }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill:"var(--text-3)",fontSize:10 }} />
                <Tooltip content={<TT/>} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {chartData.map((d,i)=><Cell key={i} fill={d.color} style={{ filter:`drop-shadow(0 0 4px ${d.color})` }} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie */}
        <div className="card" style={{ padding:20 }}>
          <div className="sec-head">Share by Category</div>
          {chartData.length===0 ? <Empty/> : (
            <div style={{ display:"flex",gap:16,alignItems:"center" }}>
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={chartData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={38} strokeWidth={2} stroke="var(--bg2)">
                    {chartData.map((d,i)=><Cell key={i} fill={d.color} style={{ filter:`drop-shadow(0 0 3px ${d.color})` }} />)}
                  </Pie>
                  <Tooltip content={<TT/>} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex:1,display:"flex",flexDirection:"column",gap:5 }}>
                {chartData.slice(0,6).map(d=>(
                  <div key={d.category} style={{ display:"flex",alignItems:"center",gap:7 }}>
                    <div style={{ width:8,height:8,borderRadius:2,background:d.color,flexShrink:0,boxShadow:`0 0 6px ${d.color}` }} />
                    <span style={{ fontFamily:"'Exo 2',sans-serif",fontSize:11,color:"var(--text-2)",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{d.emoji} {d.label}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--text-3)" }}>{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trends */}
        <div className="card" style={{ padding:20 }}>
          <div className="sec-head">Daily Trends</div>
          {trends.length===0 ? <Empty/> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends} margin={{ top:0,right:10,left:-25,bottom:0 }}>
                <CartesianGrid strokeDasharray="2 4" />
                <XAxis dataKey="date" tick={{ fill:"var(--text-3)",fontSize:9,fontFamily:"'JetBrains Mono',monospace" }} />
                <YAxis tick={{ fill:"var(--text-3)",fontSize:9 }} />
                <Tooltip content={<TT/>} />
                <Line type="monotone" dataKey="count" stroke="var(--cyan)" strokeWidth={2} dot={{ fill:"var(--cyan)",r:3,strokeWidth:0,filter:"drop-shadow(0 0 4px var(--cyan))" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Radar */}
        <div className="card" style={{ padding:20 }}>
          <div className="sec-head">Category Radar</div>
          {chartData.length===0 ? <Empty/> : (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={chartData.slice(0,8).map(d=>({ category:d.emoji+" "+d.label.split(" ")[0], value:d.count }))}>
                <PolarGrid stroke="rgba(0,245,255,0.08)" />
                <PolarAngleAxis dataKey="category" tick={{ fill:"var(--text-3)",fontSize:9,fontFamily:"'JetBrains Mono',monospace" }} />
                <Radar dataKey="value" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.1} strokeWidth={1.5} />
                <Tooltip content={<TT/>} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Keywords */}
        <div className="card" style={{ padding:20, gridColumn:"span 2" }}>
          <div className="sec-head">Top Keywords</div>
          {keywords.length===0 ? <Empty/> : (
            <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
              {keywords.slice(0,50).map((kw,i)=>{
                const size=10+(kw.count/keywords[0].count)*8;
                const opacity=0.3+0.7*((50-i)/50);
                return (
                  <span key={kw.word} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:`${size}px`, color:"var(--text-2)", opacity, padding:"3px 9px", borderRadius:5, border:"1px solid var(--border)", background:"rgba(0,245,255,0.02)" }}>
                    {kw.word}<span style={{ color:"var(--cyan)",marginLeft:4,fontSize:"0.85em" }}>{kw.count}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
