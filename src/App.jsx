import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1HM_Jxv6zQzr-O5Spt06uq2HTyX1yFTVju2jzVjneL5M/export?format=csv&gid=462380555";

const C = {
  bg: "#070b14",
  panel: "#0f1726",
  card: "#111a2a",
  border: "#22304a",
  dim: "#18243a",
  text: "#f7fbff",
  muted: "#8190ad",
  green: "#00d2a3",
  blue: "#43baff",
  pink: "#ff5aa5",
  orange: "#ff8a16",
  violet: "#7b61ff",
  red: "#ef4444",
};

const MIX_COLORS = [C.green, C.blue, C.orange, C.violet];
const GRID = { stroke: C.border, strokeDasharray: "3 3" };

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function parseNumber(raw) {
  const cleaned = String(raw ?? "")
    .replaceAll(",", "")
    .replace(/\s/g, "")
    .replace(/[₩원]/g, "");
  if (!cleaned || cleaned === "-" || cleaned.startsWith("#")) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function parseDate(raw) {
  const [year, month, day] = String(raw).trim().split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function rowsToRecords(rows) {
  const headers = rows[0].map((header) => header.trim());
  const fields = [
    "현금성자산",
    "주식",
    "가용자산 합",
    "가용자산 증감",
    "불가용자산",
    "부동산",
    "자산합계",
    "부채합계",
    "순자산합계",
    "목표순자산",
    "순자산-목표순자산",
  ];
  const indexes = Object.fromEntries(fields.map((name) => [name, headers.lastIndexOf(name)]));

  return rows
    .slice(1)
    .map((row) => {
      const record = { date: parseDate(row[0]), rawDate: row[0] };
      for (const [name, index] of Object.entries(indexes)) {
        record[name] = index >= 0 ? parseNumber(row[index]) : null;
      }
      return record;
    })
    .filter((record) => record.date instanceof Date && !Number.isNaN(record.date.getTime()))
    .sort((a, b) => a.date - b.date);
}

const won = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

function money(value) {
  return `${won.format(Math.round(value || 0))}원`;
}

function compactWon(value) {
  const abs = Math.abs(value || 0);
  if (abs >= 1000000000000) return `${(value / 1000000000000).toFixed(2)}조`;
  if (abs >= 100000000) return `${(value / 100000000).toFixed(abs >= 1000000000 ? 1 : 2)}억`;
  if (abs >= 10000) return `${Math.round(value / 10000).toLocaleString("ko-KR")}만`;
  return won.format(Math.round(value || 0));
}

function axisWon(value) {
  return `${Math.round(value / 100000000)}억`;
}

function percent(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

function td(textAlign = "right") {
  return {
    color: C.text,
    textAlign,
    padding: "10px 8px",
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: "nowrap",
  };
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: "10px 12px",
      color: C.text,
      fontSize: 12,
    }}>
      <div style={{ color: C.blue, fontWeight: 800, marginBottom: 6 }}>{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ color: item.color, marginTop: 3 }}>
          {item.name || item.dataKey}: {money(item.value)}
        </div>
      ))}
    </div>
  );
}

function Panel({ children, accent = C.blue, style }) {
  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 20,
      ...style,
    }}>
      <div style={{ position: "absolute", inset: "0 0 auto", height: 2, background: accent }} />
      {children}
    </section>
  );
}

function PanelTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.25 }}>{title}</h2>
      {sub && <div style={{ marginTop: 4, color: C.muted, fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function ChangePill({ value, inverse = false }) {
  const good = value === 0 ? null : (value > 0) !== inverse;
  const color = good === null ? C.muted : good ? C.green : C.pink;
  return (
    <span style={{
      display: "inline-flex",
      width: "fit-content",
      marginTop: 8,
      padding: "5px 8px",
      borderRadius: 999,
      background: "#172236",
      color,
      fontSize: 12,
      fontWeight: 800,
    }}>
      {value > 0 ? "+" : ""}{money(value)} 전월 대비
    </span>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <Panel accent={color} style={{ padding: "18px 20px", minHeight: 112 }}>
      <div style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>{label}</div>
      <div style={{ color, fontSize: 28, lineHeight: 1.1, fontWeight: 900, marginTop: 10 }}>
        {value}
      </div>
      {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>{sub}</div>}
    </Panel>
  );
}

function AssetBars({ latest }) {
  const items = [
    { name: "현금성", value: latest["현금성자산"], color: C.green },
    { name: "주식", value: latest["주식"], color: C.blue },
    { name: "불가용", value: latest["불가용자산"], color: C.orange },
    { name: "부동산", value: latest["부동산"], color: C.violet },
  ].filter((item) => Number.isFinite(item.value) && item.value > 0);
  const total = latest["자산합계"] || items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item) => {
        const ratio = total ? item.value / total : 0;
        return (
          <div key={item.name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: item.color, fontWeight: 800 }}>{item.name}</span>
              <span style={{ color: C.muted }}>{compactWon(item.value)} · {percent(ratio)}</span>
            </div>
            <div style={{ height: 5, background: C.dim, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${ratio * 100}%`, height: "100%", background: item.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function chartRows(records) {
  return records.map((record) => ({
    date: `${record.date.getFullYear().toString().slice(2)}.${String(record.date.getMonth() + 1).padStart(2, "0")}`,
    순자산: record["순자산합계"],
    목표: record["목표순자산"],
    자산: record["자산합계"],
    부채: record["부채합계"],
    가용자산: record["가용자산 합"],
    증감: record["가용자산 증감"],
    주식: record["주식"],
    현금성: record["현금성자산"],
  }));
}

function AssetOverview({ records }) {
  const latest = records.at(-1);
  const previous = records.at(-2) || latest;
  const data = chartRows(records);
  const goalRate = latest["목표순자산"] ? latest["순자산합계"] / latest["목표순자산"] : 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="stat-grid">
        <StatCard label="가족 순자산" value={compactWon(latest["순자산합계"])} color={C.green} sub={<ChangePill value={latest["순자산합계"] - previous["순자산합계"]} />} />
        <StatCard label="목표 대비" value={compactWon(latest["순자산-목표순자산"])} color={C.blue} sub={`목표 ${compactWon(latest["목표순자산"])} · 달성 ${percent(goalRate)}`} />
        <StatCard label="가용자산" value={compactWon(latest["가용자산 합"])} color={C.pink} sub={<ChangePill value={latest["가용자산 합"] - previous["가용자산 합"]} />} />
        <StatCard label="부채" value={compactWon(latest["부채합계"])} color={C.orange} sub={<ChangePill inverse value={latest["부채합계"] - previous["부채합계"]} />} />
      </div>

      <div className="main-grid">
        <Panel>
          <PanelTitle title="순자산 추이" sub={`${formatDate(records[0].date)} - ${formatDate(latest.date)}`} />
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={data} margin={{ top: 4, right: 14, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" interval={3} tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={axisWon} tickLine={false} width={54} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="순자산" name="순자산" stroke={C.blue} fill="url(#netFill)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="목표" name="목표" stroke={C.pink} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel accent={C.violet}>
          <PanelTitle title="최신 자산 구성" sub={`${formatDate(latest.date)} 기준`} />
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={[
                  { name: "현금성", value: latest["현금성자산"] },
                  { name: "주식", value: latest["주식"] },
                  { name: "불가용", value: latest["불가용자산"] },
                  { name: "부동산", value: latest["부동산"] },
                ]}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
              >
                {MIX_COLORS.map((color) => <Cell key={color} fill={color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <AssetBars latest={latest} />
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel accent={C.green}>
          <PanelTitle title="가용자산 월 증감" sub="최근 12개 기록" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data.slice(-12)} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={axisWon} tickLine={false} width={54} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="증감" name="가용자산 증감" radius={[4, 4, 0, 0]}>
                {data.slice(-12).map((item) => (
                  <Cell key={item.date} fill={(item.증감 || 0) >= 0 ? C.green : C.pink} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelTitle title="최근 기록" sub="월별 스냅샷" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 620 }}>
              <thead>
                <tr style={{ color: C.muted }}>
                  {["날짜", "순자산", "목표", "차이", "가용자산", "부채"].map((head) => (
                    <th key={head} style={{ textAlign: head === "날짜" ? "left" : "right", padding: "10px 8px", borderBottom: `1px solid ${C.border}` }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(-7).reverse().map((record) => (
                  <tr key={record.rawDate}>
                    <td style={td("left")}>{formatDate(record.date)}</td>
                    <td style={td()}>{compactWon(record["순자산합계"])}</td>
                    <td style={td()}>{compactWon(record["목표순자산"])}</td>
                    <td style={td()}>{compactWon(record["순자산-목표순자산"])}</td>
                    <td style={td()}>{compactWon(record["가용자산 합"])}</td>
                    <td style={td()}>{compactWon(record["부채합계"])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StockOverview({ records }) {
  const latest = records.at(-1);
  const previous = records.at(-2) || latest;
  const data = chartRows(records);
  const stockRatio = latest["자산합계"] ? latest["주식"] / latest["자산합계"] : 0;
  const liquidRatio = latest["가용자산 합"] ? latest["주식"] / latest["가용자산 합"] : 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="three-grid">
        <StatCard label="주식 평가액" value={compactWon(latest["주식"])} color={C.violet} sub={<ChangePill value={latest["주식"] - previous["주식"]} />} />
        <StatCard label="전체 자산 내 비중" value={percent(stockRatio)} color={C.blue} sub={`자산합계 ${compactWon(latest["자산합계"])}`} />
        <StatCard label="가용자산 내 비중" value={percent(liquidRatio)} color={C.pink} sub={`가용자산 ${compactWon(latest["가용자산 합"])}`} />
      </div>

      <Panel accent={C.violet}>
        <PanelTitle title="주식 · 현금성 자산 추이" sub="월별 스냅샷 기준" />
        <ResponsiveContainer width="100%" height={330}>
          <LineChart data={data} margin={{ top: 4, right: 14, bottom: 0, left: 8 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="date" interval={3} tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={axisWon} tickLine={false} width={54} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="주식" stroke={C.violet} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="현금성" stroke={C.green} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="가용자산" stroke={C.blue} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function UnifiedView({ records }) {
  const latest = records.at(-1);
  const previous = records.at(-2) || latest;
  const mix = [
    { name: "현금성", value: latest["현금성자산"], color: C.green },
    { name: "주식", value: latest["주식"], color: C.blue },
    { name: "불가용", value: latest["불가용자산"], color: C.orange },
    { name: "부동산", value: latest["부동산"], color: C.violet },
  ];
  const total = latest["자산합계"] || 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="three-grid">
        <StatCard label="가족 순자산" value={compactWon(latest["순자산합계"])} color={C.green} sub={`목표 달성 ${percent(latest["순자산합계"] / latest["목표순자산"])}`} />
        <StatCard label="투자/주식 자산" value={compactWon(latest["주식"])} color={C.blue} sub={<ChangePill value={latest["주식"] - previous["주식"]} />} />
        <StatCard label="현금성 자산" value={compactWon(latest["현금성자산"])} color={C.pink} sub={`전체 자산의 ${percent(latest["현금성자산"] / total)}`} />
      </div>

      <div className="lower-grid">
        <Panel>
          <PanelTitle title="통합 자산 구성" sub={`총 ${compactWon(total)}`} />
          <AssetBars latest={latest} />
        </Panel>
        <Panel accent={C.pink}>
          <PanelTitle title="자산 비중" sub={`${formatDate(latest.date)} 기준`} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mix} layout="vertical" margin={{ top: 4, right: 26, bottom: 0, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={axisWon} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 12 }} tickLine={false} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="금액" radius={[0, 4, 4, 0]}>
                {mix.map((item) => <Cell key={item.name} fill={item.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <AssetOverview records={records} />
    </div>
  );
}

const NAV = [
  { key: "asset", label: "자산현황", color: C.green },
  { key: "stock", label: "주식현황", color: C.violet },
  { key: "unified", label: "통합뷰", color: C.blue },
];

export default function App() {
  const [page, setPage] = useState("unified");
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(SHEET_CSV_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Google Sheets CSV 응답 오류: ${response.status}`);
        return response.text();
      })
      .then((text) => setRecords(rowsToRecords(parseCsv(text))))
      .catch((err) => setError(err.message));
  }, []);

  const latest = records.at(-1);
  const subtitle = useMemo(() => {
    if (!latest) return "데이터 로딩 중";
    return `${formatDate(latest.date)} 기준 · Google Sheets 연동`;
  }, [latest]);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
        button { font: inherit; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .three-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .main-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.75fr); gap: 16px; }
        .lower-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
        @media (max-width: 980px) {
          header { height: auto !important; align-items: flex-start !important; flex-direction: column; padding: 14px 16px !important; }
          main { padding: 16px !important; }
          .stat-grid, .three-grid, .main-grid, .lower-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: 58,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        background: `${C.bg}ee`,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 900,
            background: `linear-gradient(90deg, ${C.blue}, ${C.green}, ${C.pink})`,
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}>
            가족 자산 대시보드
          </h1>
          <span style={{ color: C.muted, fontSize: 11 }}>{subtitle}</span>
        </div>
        <nav style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPage(item.key)}
              style={{
                height: 32,
                padding: "0 16px",
                borderRadius: 8,
                border: `1px solid ${page === item.key ? item.color : C.border}`,
                background: page === item.key ? `${item.color}18` : "transparent",
                color: page === item.key ? item.color : C.muted,
                fontSize: 13,
                fontWeight: page === item.key ? 800 : 600,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding: "22px 24px 42px" }}>
        {error && <Panel accent={C.red}><PanelTitle title="데이터 로드 실패" sub={error} /></Panel>}
        {!error && !records.length && <Panel><PanelTitle title="데이터 로딩 중" sub="Google Sheets CSV를 불러오고 있습니다." /></Panel>}
        {!error && records.length > 0 && page === "asset" && <AssetOverview records={records} />}
        {!error && records.length > 0 && page === "stock" && <StockOverview records={records} />}
        {!error && records.length > 0 && page === "unified" && <UnifiedView records={records} />}
        <div style={{ marginTop: 24, color: C.muted, fontSize: 10, textAlign: "right" }}>
          데이터 출처: Google Sheets · 금액 단위: 원
        </div>
      </main>
    </div>
  );
}
