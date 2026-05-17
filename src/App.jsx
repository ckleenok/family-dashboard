import { useState, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, LabelList,
} from "recharts";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════ */
const C = {
  bg:      "#070b14",
  panel:   "#0c1120",
  card:    "#101827",
  border:  "#1a2540",
  dim:     "#141e30",
  ck:      "#38bdf8",
  ella:    "#f472b6",
  safe:    "#10b981",
  div:     "#f59e0b",
  growth:  "#8b5cf6",
  indiv:   "#ef4444",
  kr:      "#3b82f6",
  neut:    "#6366f1",
  us:      "#f97316",
  text:    "#e2e8f0",
  muted:   "#64748b",
  green:   "#10b981",
  red:     "#ef4444",
};

const CAT_COLOR = { 안전: C.safe, 배당: C.div, 성장ETF: C.growth, 개별주식: C.indiv };

/* ═══════════════════════════════════════════════════════════
   DATA — 자산 월별 현황
═══════════════════════════════════════════════════════════ */
const MONTHLY = [
  { date:"23.08", 순자산:1694, 목표:2005, 현금:22,  주식:17,  연금:266, 부채:947,  부동산:2336 },
  { date:"23.09", 순자산:1555, 목표:2010, 현금:155, 주식:23,  연금:243, 부채:1193, 부동산:2327 },
  { date:"23.10", 순자산:1576, 목표:2015, 현금:154, 주식:23,  연금:263, 부채:1192, 부동산:2327 },
  { date:"23.11", 순자산:1581, 목표:2020, 현금:158, 주식:25,  연금:262, 부채:1192, 부동산:2327 },
  { date:"23.12", 순자산:1597, 목표:2025, 현금:164, 주식:26,  연금:270, 부채:1191, 부동산:2327 },
  { date:"24.01", 순자산:1595, 목표:2030, 현금:154, 주식:37,  연금:266, 부채:1191, 부동산:2327 },
  { date:"24.02", 순자산:1611, 목표:2035, 현금:151, 주식:47,  연금:275, 부채:1190, 부동산:2327 },
  { date:"24.03", 순자산:1609, 목표:2040, 현금:147, 주식:57,  연금:267, 부채:1190, 부동산:2327 },
  { date:"24.04", 순자산:1618, 목표:2045, 현금:143, 주식:68,  연금:268, 부채:1189, 부동산:2327 },
  { date:"24.05", 순자산:1621, 목표:2050, 현금:143, 주식:70,  연금:269, 부채:1189, 부동산:2327 },
  { date:"24.06", 순자산:1728, 목표:2055, 현금:222, 주식:91,  연금:275, 부채:1188, 부동산:2327 },
  { date:"24.07", 순자산:1752, 목표:2060, 현금:173, 주식:99,  연금:240, 부채:1088, 부동산:2327 },
  { date:"24.08", 순자산:1762, 목표:2065, 현금:180, 주식:100, 연금:242, 부채:1087, 부동산:2327 },
  { date:"24.09", 순자산:1767, 목표:2071, 현금:185, 주식:100, 연금:242, 부채:1087, 부동산:2327 },
  { date:"24.10", 순자산:1792, 목표:2076, 현금:174, 주식:117, 연금:259, 부채:1086, 부동산:2327 },
  { date:"24.11", 순자산:1803, 목표:2081, 현금:187, 주식:118, 연금:256, 부채:1086, 부동산:2327 },
  { date:"24.12", 순자산:1824, 목표:2086, 현금:189, 주식:129, 연금:264, 부채:1085, 부동산:2327 },
  { date:"25.01", 순자산:1816, 목표:2091, 현금:176, 주식:140, 연금:257, 부채:1085, 부동산:2327 },
  { date:"25.02", 순자산:1871, 목표:1863, 현금:168, 주식:190, 연금:270, 부채:1084, 부동산:2327 },
  { date:"25.03", 순자산:1825, 목표:1872, 현금:159, 주식:210, 연금:262, 부채:1134, 부동산:2327 },
  { date:"25.04", 순자산:1786, 목표:1881, 현금:59,  주식:201, 연금:232, 부채:1033, 부동산:2327 },
  { date:"25.05", 순자산:1802, 목표:1891, 현금:25,  주식:208, 연금:250, 부채:1008, 부동산:2327 },
  { date:"25.06", 순자산:1846, 목표:1900, 현금:21,  주식:220, 연금:270, 부채:992,  부동산:2327 },
  { date:"25.07", 순자산:1870, 목표:1910, 현금:16,  주식:233, 연금:283, 부채:988,  부동산:2327 },
  { date:"25.08", 순자산:1886, 목표:1919, 현금:15,  주식:241, 연금:288, 부채:985,  부동산:2327 },
  { date:"25.09", 순자산:1895, 목표:1929, 현금:22,  주식:245, 연금:279, 부채:978,  부동산:2327 },
  { date:"25.10", 순자산:1935, 목표:1938, 현금:22,  주식:262, 연금:299, 부채:974,  부동산:2327 },
  { date:"25.11", 순자산:1937, 목표:1948, 현금:24,  주식:263, 연금:294, 부채:971,  부동산:2327 },
  { date:"25.12", 순자산:1945, 목표:1958, 현금:20,  주식:280, 연금:286, 부채:969,  부동산:2327 },
  { date:"26.01", 순자산:1987, 목표:1968, 현금:15,  주식:303, 연금:310, 부채:969,  부동산:2327 },
  { date:"26.02", 순자산:2017, 목표:1978, 현금:21,  주식:319, 연금:318, 부채:969,  부동산:2327 },
  { date:"26.03", 순자산:1992, 목표:1987, 현금:21,  주식:309, 연금:300, 부채:965,  부동산:2327 },
  { date:"26.04", 순자산:2026, 목표:1997, 현금:29,  주식:342, 연금:293, 부채:965,  부동산:2327 },
];

/* ═══════════════════════════════════════════════════════════
   DATA — 주식 포트폴리오
═══════════════════════════════════════════════════════════ */
const CK_PORT = [
  { cat:"안전",    name:"현금",                       region:"KR",   amount:800  },
  { cat:"안전",    name:"ACE KRX금현물",               region:"중립", amount:5440 },
  { cat:"배당",    name:"KODEX 금융고배당TOP10 커버드콜", region:"KR",   amount:1033 },
  { cat:"배당",    name:"RISE 200위클리커버드콜",        region:"KR",   amount:1278 },
  { cat:"배당",    name:"TIGER 미국배당다우존스",        region:"US",   amount:3215 },
  { cat:"성장ETF", name:"KODEX 미국S&P500유틸리티",     region:"US",   amount:745  },
  { cat:"성장ETF", name:"TIGER 미국필라델피아반도체나스닥",region:"US",  amount:774  },
  { cat:"성장ETF", name:"KODEX 미국S&P500",            region:"US",   amount:2996 },
  { cat:"성장ETF", name:"KODEX 미국나스닥100",          region:"US",   amount:4868 },
  { cat:"성장ETF", name:"TIGER 미국테크TOP10 INDXX",    region:"US",   amount:1425 },
  { cat:"개별주식", name:"한국가스공사",                 region:"KR",   amount:184  },
  { cat:"개별주식", name:"포스코인터내셔널",             region:"KR",   amount:71   },
  { cat:"개별주식", name:"HD현대중공업",                 region:"KR",   amount:201  },
  { cat:"개별주식", name:"PLUS K방산",                  region:"KR",   amount:296  },
  { cat:"개별주식", name:"삼성전자",                    region:"중립", amount:284  },
  { cat:"개별주식", name:"두산에너빌리티",               region:"중립", amount:319  },
  { cat:"개별주식", name:"TIGER 일본엔선물",             region:"중립", amount:57   },
  { cat:"개별주식", name:"MSTR",                       region:"US",   amount:134  },
  { cat:"개별주식", name:"MSFT",                       region:"US",   amount:7    },
  { cat:"개별주식", name:"TESLA",                      region:"US",   amount:71   },
  { cat:"개별주식", name:"GOOG",                       region:"US",   amount:35   },
];

const ELLA_PORT = [
  { cat:"안전",    name:"현금",                        region:"KR",   amount:20   },
  { cat:"안전",    name:"TIGER KOFR 금리액티브",        region:"KR",   amount:384  },
  { cat:"안전",    name:"KODEX 미국 10년국채선물",       region:"US",   amount:971  },
  { cat:"안전",    name:"KODEX200 미국채혼합",           region:"US",   amount:46   },
  { cat:"안전",    name:"ACE KRX금현물",                region:"중립", amount:1939 },
  { cat:"배당",    name:"RISE 200위클리커버드콜",        region:"KR",   amount:1716 },
  { cat:"배당",    name:"TIGER 미국배당다우존스",        region:"US",   amount:128  },
  { cat:"성장ETF", name:"KIWOOM 200TR",                region:"KR",   amount:804  },
  { cat:"성장ETF", name:"KODEX 미국S&P500",            region:"US",   amount:1430 },
  { cat:"성장ETF", name:"KODEX 미국나스닥100",          region:"US",   amount:192  },
  { cat:"개별주식", name:"MSTR",                       region:"US",   amount:1    },
  { cat:"개별주식", name:"MSFT",                       region:"US",   amount:1    },
  { cat:"개별주식", name:"TESLA",                      region:"US",   amount:1    },
  { cat:"개별주식", name:"GOOG",                       region:"US",   amount:1    },
];

/* SPY/QQQ/SCHD/GLD 추이 (철규 ISA, 만원) */
const INDEX_HIST = [
  { date:"25.9.22",  SPY:2689, QQQ:2551, SCHD:2914, GLD:4939 },
  { date:"25.11.3",  SPY:2907, QQQ:2917, SCHD:3624, GLD:6008 },
  { date:"25.11.25", SPY:4224, QQQ:3513, SCHD:3768, GLD:6080 },
  { date:"25.12.22", SPY:6873, QQQ:5854, SCHD:3820, GLD:8022 },
  { date:"26.1.10",  SPY:4524, QQQ:4613, SCHD:3233, GLD:6969 },
  { date:"26.1.27",  SPY:6873, QQQ:7509, SCHD:3361, GLD:8022 },
  { date:"26.2.10",  SPY:5196, QQQ:5038, SCHD:3433, GLD:8244 },
  { date:"26.2.25",  SPY:5171, QQQ:4832, SCHD:3262, GLD:7793 },
  { date:"26.3.12",  SPY:5277, QQQ:5341, SCHD:3270, GLD:7922 },
  { date:"26.4.16",  SPY:5918, QQQ:6431, SCHD:3289, GLD:7730 },
  { date:"26.4.27",  SPY:5754, QQQ:6554, SCHD:3633, GLD:7800 },
  { date:"26.5.11",  SPY:5542, QQQ:7248, SCHD:3343, GLD:7972 },
];

const ISA_TARGETS = [
  { name:"KOFR금리/금현물",    target:5233, current:1935 },
  { name:"미국10년국채선물",   target:2616, current:660  },
  { name:"예금/CMA",           target:1151, current:1548 },
  { name:"SCHD/타미당",        target:2382, current:2789 },
  { name:"고배당/커버드콜",    target:1985, current:1523 },
  { name:"200커버드콜(한국)",  target:2912, current:3599 },
  { name:"KODEX 나스닥100",    target:1588, current:1748 },
  { name:"KODEX S&P500",       target:1985, current:2512 },
  { name:"나스닥 커버드콜",    target:1324, current:736  },
  { name:"S&P500 커버드콜",    target:1324, current:776  },
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
const sumPort = (arr) => arr.reduce((s,d) => s + d.amount, 0);
const groupCat = (port) =>
  ["안전","배당","성장ETF","개별주식"].map(cat => ({
    cat, amount: sumPort(port.filter(d=>d.cat===cat))
  }));
const groupReg = (port) =>
  [["KR","한국",C.kr],["중립","중립",C.neut],["US","미국",C.us]].map(([key,label,color])=>({
    name:label, color,
    amount: sumPort(port.filter(d=>d.region===key))
  }));

// 만원 단위 (주식 포트폴리오): 10000만 = 1억
const fmt = (v) => v >= 10000 ? `${(v/10000).toFixed(2)}억` : `${v.toLocaleString()}만`;

// 백만원 단위 (자산현황): 100백만 = 1억
const fmtM  = (v) => v >= 100000 ? `${(v/100000).toFixed(2)}조` : v >= 100 ? `${(v/100).toFixed(1)}억` : `${v}백만`;
// delta 표시용 (백만원): 부호 + 억/만 단위
const fmtD  = (v) => {
  const a = Math.abs(v);
  const s = v >= 0 ? "▲ " : "▼ ";
  return s + (a >= 100 ? `${(a/100).toFixed(1)}억` : `${a.toLocaleString()}백만`);
};
// YAxis tick용 (백만원): 축약
const fmtAxis = (v) => v >= 10000 ? `${(v/10000).toFixed(0)}조` : v >= 100 ? `${(v/100).toFixed(0)}억` : `${v}백만`;
// YAxis tick용 (만원)
const fmtAxisM = (v) => v >= 10000 ? `${(v/10000).toFixed(1)}억` : `${v.toLocaleString()}만`;

// 툴팁: 백만원 → 억 변환
const Tip = ({ active, payload, label, unit="M" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:12 }}>
      <div style={{ color:C.ck, fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color:p.color, marginBottom:2 }}>
          {p.name}: {unit==="M" ? fmtM(p.value) : unit==="만" ? `${p.value?.toLocaleString()}만` : `${p.value?.toLocaleString()}${unit}`}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */

/* ── 패널 래퍼 ── */
const Panel = ({ children, col, style={} }) => (
  <div style={{
    background:C.panel, border:`1px solid ${C.border}`, borderRadius:12,
    padding:"18px 20px", gridColumn: col ? `span ${col}` : undefined, ...style
  }}>
    {children}
  </div>
);

/* ── 섹션 타이틀 ── */
const PTitle = ({ label, sub }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</div>}
  </div>
);

/* ── 포트폴리오 카테고리 파이 ── */
const CatPie = ({ port, color }) => {
  const cats = groupCat(port).filter(d=>d.amount>0);
  const total = sumPort(port);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <ResponsiveContainer width="50%" height={150}>
        <PieChart>
          <Pie data={cats} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
            paddingAngle={3} dataKey="amount">
            {cats.map(d => <Cell key={d.cat} fill={CAT_COLOR[d.cat]} />)}
          </Pie>
          <Tooltip formatter={v=>`${v.toLocaleString()}만`} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ flex:1 }}>
        {cats.map(d => (
          <div key={d.cat} style={{ marginBottom:7 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
              <span style={{ color:CAT_COLOR[d.cat], fontWeight:600 }}>{d.cat}</span>
              <span style={{ color:C.muted }}>{((d.amount/total)*100).toFixed(1)}%</span>
            </div>
            <div style={{ height:3, background:C.border, borderRadius:2, overflow:"hidden" }}>
              <div style={{ width:`${(d.amount/total)*100}%`, height:"100%", background:CAT_COLOR[d.cat] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── TOP 종목 리스트 ── */
const TopList = ({ port, n=6 }) => {
  const total = sumPort(port);
  const top = [...port].filter(d=>d.amount>0).sort((a,b)=>b.amount-a.amount).slice(0,n);
  return (
    <div>
      {top.map((h, i) => {
        const pct = (h.amount/total*100).toFixed(1);
        const rc = h.region==="KR" ? C.kr : h.region==="중립" ? C.neut : C.us;
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0",
            borderBottom:`1px solid ${C.dim}` }}>
            <span style={{ fontSize:10, color:C.muted, minWidth:18 }}>#{i+1}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:C.text }}>{h.name}</span>
                <span style={{ fontSize:11, fontWeight:700, color:CAT_COLOR[h.cat] }}>{h.amount.toLocaleString()}만</span>
              </div>
              <div style={{ height:2, background:C.border, borderRadius:1, marginTop:3, overflow:"hidden" }}>
                <div style={{ width:`${Math.min(pct*2.5,100)}%`, height:"100%", background:CAT_COLOR[h.cat] }} />
              </div>
            </div>
            <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4,
              background:`${rc}22`, color:rc, minWidth:24, textAlign:"center" }}>
              {h.region==="KR"?"한국":h.region==="중립"?"중립":"미국"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ── 지역 비중 바 ── */
const RegionBar = ({ port }) => {
  const regs = groupReg(port);
  const total = sumPort(port);
  return (
    <div style={{ display:"flex", gap:4, height:14, borderRadius:4, overflow:"hidden", marginBottom:8 }}>
      {regs.map(r => (
        <div key={r.name} style={{ flex: r.amount, background: r.color }} title={`${r.name}: ${r.amount.toLocaleString()}만`} />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PAGE — 자산 현황
═══════════════════════════════════════════════════════════ */
const PageWealth = () => {
  const [tab, setTab] = useState("전체 추이");
  const latest = MONTHLY[MONTHLY.length-1];
  const prev   = MONTHLY[MONTHLY.length-2];
  const delta  = (k) => latest[k] - prev[k];
  const 목표달성 = ((latest.순자산 / latest.목표) * 100).toFixed(1);

  const monthlyDelta = useMemo(() =>
    MONTHLY.slice(1).map((d,i) => ({ date:d.date, 증감: d.순자산 - MONTHLY[i].순자산 })), []);

  const TABS = ["전체 추이","자산 구성","월별 증감"];

  return (
    <div>
      {/* stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"순자산",      val:latest.순자산, delta:delta("순자산"), color:C.green  },
          { label:"목표 달성률", pct:목표달성,                              color:C.ck     },
          { label:"주식자산",    val:latest.주식,   delta:delta("주식"),   color:C.growth },
          { label:"현금성자산",  val:latest.현금,   delta:delta("현금"),   color:C.div    },
        ].map((s,i) => (
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`,
            borderTop:`2px solid ${s.color}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>{s.label}</div>
            {s.val !== undefined ? (
              <>
                <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{fmtM(s.val)}</div>
                <div style={{ fontSize:11, marginTop:3, color: s.delta>=0 ? C.green : C.red }}>
                  {fmtD(s.delta)}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.pct}%</div>
                <div style={{ marginTop:8, height:4, background:C.border, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${Math.min(parseFloat(s.pct),100)}%`, height:"100%", background:s.color, borderRadius:4 }} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {TABS.map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"6px 16px", borderRadius:8, border:"1px solid",
            borderColor: tab===t ? C.ck : C.border,
            background:  tab===t ? `${C.ck}18` : "transparent",
            color:       tab===t ? C.ck  : C.muted,
            fontSize:13, fontWeight: tab===t ? 700 : 400, cursor:"pointer",
          }}>{t}</button>
        ))}
      </div>

      {tab === "전체 추이" && (
        <div style={{ display:"grid", gap:16 }}>
          <Panel>
            <PTitle label="순자산 vs 목표 추이" sub="단위: 백만원" />
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={MONTHLY} margin={{ top:4, right:8, bottom:0, left:8 }}>
                <defs>
                  <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ck} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={C.ck} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} tickLine={false} interval={3} />
                <YAxis tick={{fill:C.muted,fontSize:10}} tickLine={false} width={50} tickFormatter={fmtAxis} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{fontSize:12}} />
                <Area type="monotone" dataKey="순자산" stroke={C.green} fill="url(#gN)" strokeWidth={2} dot={false} name="순자산" />
                <Area type="monotone" dataKey="목표"   stroke={C.ck}    fill="url(#gT)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="목표순자산" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
          <Panel>
            <PTitle label="주식 · 현금 · 연금 추이" sub="단위: 백만원" />
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={MONTHLY} margin={{ top:4, right:8, bottom:0, left:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} tickLine={false} interval={3} />
                <YAxis tick={{fill:C.muted,fontSize:10}} tickLine={false} width={50} tickFormatter={fmtAxis} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{fontSize:12}} />
                <Line type="monotone" dataKey="주식" stroke={C.growth} strokeWidth={2} dot={false} name="주식" />
                <Line type="monotone" dataKey="현금" stroke={C.div}    strokeWidth={2} dot={false} name="현금성" />
                <Line type="monotone" dataKey="연금" stroke={C.ck}     strokeWidth={2} dot={false} name="연금" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {tab === "자산 구성" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Panel>
            <PTitle label="최근 자산 구성" sub="2026년 4월 기준" />
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={[
                  {name:"현금성",value:latest.현금, color:C.green},
                  {name:"주식",  value:latest.주식, color:C.ck},
                  {name:"연금",  value:latest.연금, color:C.growth},
                  {name:"부채",  value:latest.부채, color:C.red},
                ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {[C.green,C.ck,C.growth,C.red].map((c,i)=><Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip formatter={v=>`${v.toLocaleString()}백만`} />
                <Legend wrapperStyle={{fontSize:12}} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
          <Panel>
            <PTitle label="항목별 상세" />
            {[
              {label:"부동산",  val:latest.부동산, max:2327, color:C.div},
              {label:"부채",    val:latest.부채,   max:1200, color:C.red},
              {label:"연금",    val:latest.연금,   max:350,  color:C.growth},
              {label:"주식",    val:latest.주식,   max:350,  color:C.ck},
              {label:"현금성",  val:latest.현금,   max:250,  color:C.green},
            ].map(item => (
              <div key={item.label} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                  <span style={{ color:C.muted }}>{item.label}</span>
                  <span style={{ fontWeight:600, color:item.color }}>{fmtM(item.val)}</span>
                </div>
                <div style={{ height:5, background:C.border, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${Math.min((item.val/item.max)*100,100)}%`, height:"100%", background:item.color }} />
                </div>
              </div>
            ))}
          </Panel>
          <Panel col={2}>
            <PTitle label="부채 감소 추이" sub="부채가 줄수록 순자산↑" />
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={MONTHLY} margin={{ top:4, right:8, bottom:0, left:8 }}>
                <defs>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.red} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} tickLine={false} interval={3} />
                <YAxis tick={{fill:C.muted,fontSize:10}} tickLine={false} width={50} tickFormatter={fmtAxis} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="부채" stroke={C.red} fill="url(#gD)" strokeWidth={2} dot={false} name="부채" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {tab === "월별 증감" && (
        <Panel>
          <PTitle label="월별 순자산 증감" sub="양수 = 증가 / 음수 = 감소 (단위: 백만원)" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyDelta} margin={{ top:4, right:8, bottom:0, left:8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} tickLine={false} interval={2} />
              <YAxis tick={{fill:C.muted,fontSize:10}} tickLine={false} width={50} tickFormatter={fmtAxis} />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={0} stroke={C.muted} strokeDasharray="3 3" />
              <Bar dataKey="증감" name="월간증감" radius={[3,3,0,0]}>
                {monthlyDelta.map((d,i) => <Cell key={i} fill={d.증감>=0 ? C.green : C.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:20,
            paddingTop:16, borderTop:`1px solid ${C.border}` }}>
            {[
              {label:"평균 월 증가", val: Math.round(monthlyDelta.reduce((s,d)=>s+d.증감,0)/monthlyDelta.length)},
              {label:"최대 증가",    val: Math.max(...monthlyDelta.map(d=>d.증감))},
              {label:"최대 감소",    val: Math.min(...monthlyDelta.map(d=>d.증감))},
              {label:"증가 달 수",   str: monthlyDelta.filter(d=>d.증감>0).length+"개월"},
            ].map((s,i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:18, fontWeight:700,
                  color: s.str ? C.ck : s.val>=0 ? C.green : C.red }}>
                  {s.str || fmtM(Math.abs(s.val))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PAGE — 주식 현황
═══════════════════════════════════════════════════════════ */
const PageStock = () => {
  const [who,  setWho]  = useState("ck");
  const [tab,  setTab]  = useState("포트폴리오");
  const port  = who === "ck" ? CK_PORT : ELLA_PORT;
  const total = sumPort(port);
  const pcol  = who === "ck" ? C.ck : C.ella;
  const cats  = groupCat(port);
  const regs  = groupReg(port);

  const radarD = cats.map(d=>({ subject:d.cat, val: Math.round((d.amount/total)*100) }));

  const TABS = ["포트폴리오","지수 추이","ISA 목표"];

  return (
    <div>
      {/* person toggle */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["ck","철규",C.ck],["ella","연희",C.ella]].map(([key,lbl,col])=>(
          <button key={key} onClick={()=>setWho(key)} style={{
            padding:"6px 18px", borderRadius:20, border:"1px solid",
            borderColor: who===key ? col : C.border,
            background:  who===key ? `${col}22` : "transparent",
            color:       who===key ? col : C.muted,
            fontSize:13, fontWeight: who===key ? 700 : 400, cursor:"pointer",
          }}>{lbl}</button>
        ))}
      </div>

      {/* stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        {[
          {label:"총 포트폴리오", val:fmt(total),                                    color:pcol},
          ...cats.map(d=>({label:d.cat, val:fmt(d.amount),
            sub:`${total>0?((d.amount/total)*100).toFixed(1):0}%`, color:CAT_COLOR[d.cat]}))
        ].map((s,i) => (
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`,
            borderTop:`2px solid ${s.color}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:5 }}>{s.label}</div>
            <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.val}</div>
            {s.sub && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"6px 16px", borderRadius:8, border:"1px solid",
            borderColor: tab===t ? pcol : C.border,
            background:  tab===t ? `${pcol}18` : "transparent",
            color:       tab===t ? pcol : C.muted,
            fontSize:13, fontWeight: tab===t ? 700 : 400, cursor:"pointer",
          }}>{t}</button>
        ))}
      </div>

      {tab === "포트폴리오" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Panel>
            <PTitle label="카테고리 비중" />
            <CatPie port={port} color={pcol} />
          </Panel>
          <Panel>
            <PTitle label="지역 비중" />
            <RegionBar port={port} />
            <div style={{ display:"flex", gap:12, marginBottom:14 }}>
              {regs.map(r=>(
                <span key={r.name} style={{ fontSize:11, color:r.color }}>
                  {r.name} {total>0?((r.amount/total)*100).toFixed(1):0}% ({r.amount.toLocaleString()}만)
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={regs} layout="vertical" margin={{left:0,right:40}}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:12}} tickLine={false} width={30} />
                <Tooltip content={<Tip unit="만" />} />
                <Bar dataKey="amount" name="금액" radius={[0,4,4,0]}>
                  {regs.map((r,i)=><Cell key={i} fill={r.color} />)}
                  <LabelList dataKey="amount" position="right"
                    formatter={v=>`${v.toLocaleString()}만`}
                    style={{fill:C.muted,fontSize:10}} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel col={2}>
            <PTitle label="상위 보유 종목 TOP8" />
            <TopList port={port} n={8} />
          </Panel>
          <Panel col={2}>
            <PTitle label="포트폴리오 레이더" sub="카테고리별 비중(%)" />
            <ResponsiveContainer width="100%" height={190}>
              <RadarChart data={radarD} cx="50%" cy="50%" outerRadius={72}>
                <PolarGrid stroke={C.border} />
                <PolarAngleAxis dataKey="subject" tick={{fill:C.muted,fontSize:12}} />
                <Radar dataKey="val" stroke={pcol} fill={pcol} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {tab === "지수 추이" && (
        <div style={{ display:"grid", gap:16 }}>
          <Panel>
            <PTitle label="SPY / QQQ / SCHD / GLD 추이" sub="철규 ISA · 단위 만원 · 2025.9~2026.5" />
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={INDEX_HIST} margin={{top:4,right:8,bottom:0,left:8}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} tickLine={false} />
                <YAxis tick={{fill:C.muted,fontSize:10}} tickLine={false} width={55} tickFormatter={fmtAxisM} />
                <Tooltip content={<Tip unit="만" />} />
                <Legend wrapperStyle={{fontSize:12}} />
                <Line type="monotone" dataKey="SPY"  stroke="#22d3ee" strokeWidth={2} dot={{r:3}} />
                <Line type="monotone" dataKey="QQQ"  stroke="#a78bfa" strokeWidth={2} dot={{r:3}} />
                <Line type="monotone" dataKey="SCHD" stroke="#34d399" strokeWidth={2} dot={{r:3}} />
                <Line type="monotone" dataKey="GLD"  stroke="#fbbf24" strokeWidth={2} dot={{r:3}} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
          <Panel>
            <PTitle label="최신 비중 (26.5.11)" />
            {[
              {name:"GLD",    val:7972, pct:30.93, color:"#fbbf24"},
              {name:"QQQ",    val:7248, pct:28.12, color:"#a78bfa"},
              {name:"SPY",    val:5542, pct:21.50, color:"#22d3ee"},
              {name:"SCHD",   val:3343, pct:12.97, color:"#34d399"},
              {name:"현금/채권",val:1672,pct:6.49,  color:C.muted},
            ].map(item=>(
              <div key={item.name} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                  <span style={{color:item.color,fontWeight:600}}>{item.name}</span>
                  <span style={{color:C.muted}}>{item.val.toLocaleString()}만 ({item.pct}%)</span>
                </div>
                <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${item.pct}%`,height:"100%",background:item.color,borderRadius:3}} />
                </div>
              </div>
            ))}
          </Panel>
        </div>
      )}

      {tab === "ISA 목표" && (
        <Panel>
          <PTitle label="ISA 목표 달성률" sub="연희 ISA · 현재 vs 목표 (단위: 만원)" />
          {ISA_TARGETS.map(item=>{
            const pct = Math.round((item.current/item.target)*100);
            const col = pct>=100 ? C.green : pct>=70 ? C.div : C.red;
            return (
              <div key={item.name} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:12,color:C.text}}>{item.name}</span>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.muted}}>
                      {item.current.toLocaleString()} / {item.target.toLocaleString()}만
                    </span>
                    <span style={{fontSize:12,fontWeight:700,color:col,
                      padding:"1px 7px",borderRadius:10,background:`${col}18`}}>{pct}%</span>
                  </div>
                </div>
                <div style={{height:6,background:C.dim,borderRadius:4,overflow:"hidden"}}>
                  <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:col,borderRadius:4}} />
                </div>
              </div>
            );
          })}
          <div style={{marginTop:20,paddingTop:14,borderTop:`1px solid ${C.border}`,display:"flex",gap:28}}>
            {[
              {label:"목표 초과",   count:ISA_TARGETS.filter(d=>d.current>=d.target).length,         color:C.green},
              {label:"70% 이상",    count:ISA_TARGETS.filter(d=>d.current/d.target>=0.7&&d.current<d.target).length, color:C.div},
              {label:"70% 미만",    count:ISA_TARGETS.filter(d=>d.current/d.target<0.7).length,      color:C.red},
            ].map(s=>(
              <div key={s.label} style={{textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.count}개</div>
                <div style={{fontSize:11,color:C.muted}}>{s.label}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PAGE — 통합뷰
═══════════════════════════════════════════════════════════ */
const PageUnified = () => {
  const latest = MONTHLY[MONTHLY.length-1];
  const ckTotal = sumPort(CK_PORT);
  const elTotal = sumPort(ELLA_PORT);

  /* 철규+연희 주식 합산 카테고리 */
  const bothPort = [...CK_PORT, ...ELLA_PORT];
  const bothCats = groupCat(bothPort);
  const bothTotal = sumPort(bothPort);

  /* 비교 레이더 */
  const ckCats   = groupCat(CK_PORT);
  const ellaCats = groupCat(ELLA_PORT);
  const radarBoth = ["안전","배당","성장ETF","개별주식"].map(cat=>({
    subject: cat,
    철규:   Math.round((ckCats.find(d=>d.cat===cat)?.amount||0)/ckTotal*100),
    연희:   Math.round((ellaCats.find(d=>d.cat===cat)?.amount||0)/elTotal*100),
  }));

  /* 철규 vs 연희 주식 비교 */
  const compareData = ["안전","배당","성장ETF","개별주식"].map(cat=>({
    cat,
    철규: ckCats.find(d=>d.cat===cat)?.amount||0,
    연희: ellaCats.find(d=>d.cat===cat)?.amount||0,
  }));

  return (
    <div style={{ display:"grid", gap:16 }}>

      {/* ── 상단: 순자산 vs 주식 포트 요약 ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          {label:"가족 순자산",    val:fmtM(latest.순자산),  sub:`목표 ${fmtM(latest.목표)} · 달성 ${((latest.순자산/latest.목표)*100).toFixed(1)}%`, color:C.green},
          {label:"철규 포트폴리오",val:fmt(ckTotal),          sub:`${CK_PORT.filter(d=>d.amount>0).length}개 종목`, color:C.ck},
          {label:"연희 포트폴리오",val:fmt(elTotal),          sub:`${ELLA_PORT.filter(d=>d.amount>0).length}개 종목`, color:C.ella},
        ].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,
            borderTop:`2px solid ${s.color}`,borderRadius:10,padding:"16px 18px"}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:3}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 철규 vs 연희 나란히 ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {[["철규",CK_PORT,C.ck],["연희",ELLA_PORT,C.ella]].map(([name,port,col])=>(
          <Panel key={name} style={{ borderTop:`2px solid ${col}` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div>
                <span style={{fontSize:14,fontWeight:800,color:col}}>{name}</span>
                <span style={{fontSize:11,color:C.muted,marginLeft:8}}>{fmt(sumPort(port))}</span>
              </div>
            </div>
            <RegionBar port={port} />
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {groupReg(port).map(r=>(
                <span key={r.name} style={{fontSize:10,color:r.color}}>
                  {r.name} {sumPort(port)>0?((r.amount/sumPort(port))*100).toFixed(1):0}%
                </span>
              ))}
            </div>
            <TopList port={port} n={5} />
          </Panel>
        ))}
      </div>

      {/* ── 카테고리 비교 바 ── */}
      <Panel>
        <PTitle label="철규 vs 연희 — 카테고리별 금액 비교" sub="단위: 만원" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={compareData} margin={{top:4,right:20,bottom:0,left:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="cat" tick={{fill:C.muted,fontSize:12}} tickLine={false} />
            <YAxis tick={{fill:C.muted,fontSize:10}} tickLine={false} width={55} tickFormatter={fmtAxisM} />
            <Tooltip content={<Tip unit="만" />} />
            <Legend wrapperStyle={{fontSize:12}} />
            <Bar dataKey="철규" fill={C.ck}   radius={[3,3,0,0]} name="철규" />
            <Bar dataKey="연희" fill={C.ella}  radius={[3,3,0,0]} name="연희" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {/* ── 비교 레이더 + 통합 파이 나란히 ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Panel>
          <PTitle label="포트폴리오 구성 비교 (비중 %)" />
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarBoth} cx="50%" cy="50%" outerRadius={80}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="subject" tick={{fill:C.muted,fontSize:12}} />
              <Radar dataKey="철규" stroke={C.ck}   fill={C.ck}   fillOpacity={0.18} name="철규" />
              <Radar dataKey="연희" stroke={C.ella}  fill={C.ella}  fillOpacity={0.18} name="연희" />
              <Legend wrapperStyle={{fontSize:12}} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <PTitle label="가족 통합 포트폴리오" sub={`총 ${fmt(bothTotal)}`} />
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <ResponsiveContainer width="45%" height={170}>
            <PieChart>
              <Pie data={bothCats.filter(d=>d.amount>0)} cx="50%" cy="50%"
                innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="amount">
                {bothCats.map(d=><Cell key={d.cat} fill={CAT_COLOR[d.cat]} />)}
              </Pie>
              <Tooltip formatter={v=>`${v.toLocaleString()}만`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{flex:1}}>
            {bothCats.filter(d=>d.amount>0).map(d=>(
              <div key={d.cat} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                  <span style={{color:CAT_COLOR[d.cat],fontWeight:600}}>{d.cat}</span>
                  <span style={{color:C.muted}}>{d.amount.toLocaleString()}만 · {((d.amount/bothTotal)*100).toFixed(1)}%</span>
                </div>
                <div style={{height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
                  <div style={{width:`${(d.amount/bothTotal)*100}%`,height:"100%",background:CAT_COLOR[d.cat]}} />
                </div>
              </div>
            ))}
          </div>
        </div>
        </Panel>
      </div>{/* end 레이더+파이 row */}

      {/* ── 순자산 장기 추이 미니 ── */}
      <Panel>
        <PTitle label="순자산 장기 추이" sub="2023.08 → 2026.04 (단위: 백만원)" />
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={MONTHLY} margin={{top:4,right:8,bottom:0,left:8}}>
            <defs>
              <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.green} stopOpacity={0.25} />
                <stop offset="100%" stopColor={C.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} tickLine={false} interval={4} />
            <YAxis tick={{fill:C.muted,fontSize:10}} tickLine={false} width={50} tickFormatter={fmtAxis} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="순자산" stroke={C.green} fill="url(#gU)" strokeWidth={2} dot={false} name="순자산" />
            <Area type="monotone" dataKey="목표" stroke={C.ck} fill="none" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="목표" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
const NAV = [
  { key:"wealth", label:"자산현황",  emoji:"🏠" },
  { key:"stock",  label:"주식현황",  emoji:"📈" },
  { key:"unified",label:"통합뷰",    emoji:"👨‍👩‍👧‍👦" },
];

export default function App() {
  const [page, setPage] = useState("unified");

  return (
    <div style={{
      minHeight:"100vh",
      background:C.bg,
      color:C.text,
      fontFamily:"'Pretendard','Noto Sans KR',sans-serif",
    }}>
      {/* ── 글로벌 헤더 + 네비 ── */}
      <div style={{
        position:"sticky", top:0, zIndex:100,
        background:`${C.bg}ee`, backdropFilter:"blur(12px)",
        borderBottom:`1px solid ${C.border}`,
        padding:"0 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        height:56,
      }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
          <span style={{
            fontSize:17, fontWeight:900, letterSpacing:"-0.5px",
            background:`linear-gradient(90deg,${C.ck},${C.ella})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>가족 자산 대시보드</span>
          <span style={{fontSize:11,color:C.muted}}>2026.04 기준</span>
        </div>
        <nav style={{ display:"flex", gap:4 }}>
          {NAV.map(n=>(
            <button key={n.key} onClick={()=>setPage(n.key)} style={{
              padding:"6px 18px", borderRadius:8, border:"1px solid",
              borderColor: page===n.key
                ? (n.key==="wealth" ? C.green : n.key==="stock" ? C.growth : C.ck)
                : C.border,
              background: page===n.key
                ? `${n.key==="wealth"?C.green:n.key==="stock"?C.growth:C.ck}18`
                : "transparent",
              color: page===n.key
                ? (n.key==="wealth" ? C.green : n.key==="stock" ? C.growth : C.ck)
                : C.muted,
              fontSize:13, fontWeight: page===n.key ? 700 : 400, cursor:"pointer",
            }}>{n.emoji} {n.label}</button>
          ))}
        </nav>
      </div>

      {/* ── 콘텐츠 ── */}
      <div style={{ padding:"22px 24px 40px" }}>
        {page === "wealth"  && <PageWealth  />}
        {page === "stock"   && <PageStock   />}
        {page === "unified" && <PageUnified />}
        <div style={{marginTop:24,fontSize:10,color:C.muted,textAlign:"right"}}>
          데이터 출처: Google Sheets · 자산 단위 백만원(자산현황) / 만원(주식현황)
        </div>
      </div>
    </div>
  );
}
