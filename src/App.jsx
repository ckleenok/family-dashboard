import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1HM_Jxv6zQzr-O5Spt06uq2HTyX1yFTVju2jzVjneL5M/export?format=csv&gid=462380555";
const PORTFOLIO_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1HM_Jxv6zQzr-O5Spt06uq2HTyX1yFTVju2jzVjneL5M/export?format=csv&gid=172728277";

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

function inputDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function rowsToRecords(rows) {
  const headers = rows[0].map((header) => header.trim());
  const fields = [
    "현금성자산",
    "주식",
    "연희 토스 주식",
    "연희 미래 ISA/연금",
    "철규 미래 ISA",
    "철규 토스 주식",
    "카카오 주식",
    "미래 연금저축",
    "미래IRP",
    "가용자산 합",
    "가용자산 증감",
    "나이키주식",
    "미래 퇴직연금",
    "불가용자산",
    "부동산",
    "자산합계",
    "부채합계",
    "순자산합계",
    "목표순자산",
    "순자산-목표순자산",
  ];
  const indexes = Object.fromEntries(fields.map((name) => [name, headers.lastIndexOf(name)]));
  if (headers[15]?.trim() === "연희 토스 주식") indexes["연희 토스 주식"] = 15;
  if (headers[16]?.trim() === "연희 미래 ISA/연금") indexes["연희 미래 ISA/연금"] = 16;
  if (headers[18]?.trim() === "철규 미래 ISA") indexes["철규 미래 ISA"] = 18;
  if (headers[19]?.trim() === "철규 토스 주식") indexes["철규 토스 주식"] = 19;
  if (headers[20]?.trim() === "카카오 주식") indexes["카카오 주식"] = 20;
  if (headers[21]?.trim() === "미래 연금저축") indexes["미래 연금저축"] = 21;
  if (headers[22]?.trim() === "미래IRP") indexes["미래IRP"] = 22;
  if (headers[26]?.trim() === "나이키주식") indexes["나이키주식"] = 26;
  if (headers[27]?.trim() === "미래 퇴직연금") indexes["미래 퇴직연금"] = 27;
  if (headers[32]?.trim() === "자산 합계" || headers[32]?.trim() === "자산합계") indexes["자산합계"] = 32;
  if (headers[39]?.trim() === "목표순자산") indexes["목표순자산"] = 39;

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

function parseManwon(raw) {
  const cleaned = String(raw ?? "")
    .replace(/[₩,%]/g, "")
    .replaceAll(",", "")
    .trim();
  if (!cleaned || cleaned === "-") return 0;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function normalizeSheetDate(raw) {
  const parts = String(raw ?? "")
    .replaceAll(" ", "")
    .replace(/\.$/, "")
    .split(".")
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3) return "";
  return `${String(parts[0]).padStart(2, "0")}.${String(parts[1]).padStart(2, "0")}.${String(parts[2]).padStart(2, "0")}`;
}

function parsePortfolioRows(rows) {
  const regions = [
    { key: "한국", nameIndex: 3, ckIndex: 4, ellaIndex: 5, color: C.blue },
    { key: "중립", nameIndex: 6, ckIndex: 7, ellaIndex: 8, color: C.violet },
    { key: "미국", nameIndex: 9, ckIndex: 10, ellaIndex: 11, color: C.orange },
  ];
  const holdings = [];
  let category = "";

  rows.slice(2).forEach((row) => {
    if (row[1]?.trim()) category = row[1].trim();
    const subCategory = row[2]?.trim() || category;
    const isSummary = subCategory === "합계" || subCategory === "총합" || subCategory === "비중";
    if (!category || isSummary) return;

    regions.forEach((region) => {
      const name = row[region.nameIndex]?.trim();
      const ck = parseManwon(row[region.ckIndex]);
      const ella = parseManwon(row[region.ellaIndex]);
      if (!name || (!ck && !ella)) return;
      holdings.push({
        category,
        subCategory,
        region: region.key,
        color: region.color,
        name,
        ck,
        ella,
        amount: ck + ella,
      });
    });
  });

  const history = rows
    .slice(1)
    .filter((row) => row[16]?.trim())
    .map((row) => ({
      date: normalizeSheetDate(row[16]),
      SPY: parseManwon(row[17]),
      QQQ: parseManwon(row[18]),
      SCHD: parseManwon(row[19]),
      GLD: parseManwon(row[20]),
      "현금/채권": parseManwon(row[21]),
      SPY비중: parseManwon(row[22]),
      QQQ비중: parseManwon(row[23]),
      SCHD비중: parseManwon(row[24]),
      GLD비중: parseManwon(row[25]),
      현금채권비중: parseManwon(row[26]),
    }))
    .filter((row) => row.date);

  return { holdings, history };
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

function manwonToWon(value) {
  return (value || 0) * 10000;
}

function compactManwon(value) {
  return compactWon(manwonToWon(value));
}

function axisWon(value) {
  return `${Math.round(value / 100000000)}억`;
}

function axisWonFine(value) {
  if (!value) return "0";
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(value % 100000000 === 0 ? 0 : 1)}억`;
  }
  return `${Math.round(value / 10000000)}천만`;
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

function dateInputStyle(color) {
  return {
    height: 38,
    width: "100%",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    background: "#0a101c",
    color: C.text,
    colorScheme: "dark",
    font: "inherit",
    fontSize: 13,
    padding: "0 12px",
    outlineColor: color,
  };
}

function quickButtonStyle(active, color) {
  return {
    height: 30,
    border: `1px solid ${active ? color : C.border}`,
    borderRadius: 8,
    background: active ? `${color}18` : "transparent",
    color: active ? color : C.muted,
    font: "inherit",
    fontSize: 12,
    fontWeight: active ? 800 : 650,
    padding: "0 10px",
    cursor: "pointer",
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

function ChangePill({ value, inverse = false, label = "전월 대비" }) {
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
      {value > 0 ? "+" : ""}{money(value)} {label}
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

function AssetBars({ latest, items: customItems }) {
  const items = (customItems || [
    { name: "현금성", value: latest["현금성자산"], color: C.green },
    { name: "주식", value: latest["주식"], color: C.blue },
    { name: "불가용", value: latest["불가용자산"], color: C.orange },
    { name: "부동산", value: latest["부동산"], color: C.violet },
  ]).filter((item) => Number.isFinite(item.value) && item.value > 0);
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
    연희토스주식: record["연희 토스 주식"],
    연희미래ISA연금: record["연희 미래 ISA/연금"],
    철규미래ISA: record["철규 미래 ISA"],
    철규토스주식: record["철규 토스 주식"],
    카카오주식: record["카카오 주식"],
    미래연금저축: record["미래 연금저축"],
    미래IRP: record["미래IRP"],
    나이키주식: record["나이키주식"],
    미래퇴직연금: record["미래 퇴직연금"],
    주식: record["주식"],
    현금성: record["현금성자산"],
  }));
}

function AssetOverview({ records }) {
  const minDate = inputDate(records[0].date);
  const maxDate = inputDate(records.at(-1).date);
  const quickRanges = [3, 6, 9, 12, 18, 24];
  const [startDate, setStartDate] = useState(minDate);
  const [endDate, setEndDate] = useState(maxDate);
  const safeStartDate = startDate > endDate ? endDate : startDate;
  const safeEndDate = endDate < safeStartDate ? safeStartDate : endDate;
  const selectedRecords = records.filter((record) => {
    const current = inputDate(record.date);
    return current >= safeStartDate && current <= safeEndDate;
  });
  const latest = selectedRecords.at(-1);
  const periodStart = selectedRecords[0] || latest;
  const data = chartRows(selectedRecords);
  const goalRate = latest["목표순자산"] ? latest["순자산합계"] / latest["목표순자산"] : 0;
  const netChartMax = Math.max(
    1100000000,
    Math.ceil(Math.max(...data.flatMap((item) => [item.순자산 || 0, item.목표 || 0])) / 100000000) * 100000000
  );
  const selectedLabel = selectedRecords.length
    ? `${formatDate(periodStart.date)} - ${formatDate(latest.date)} · ${selectedRecords.length}개 기록`
    : "선택한 기간에 기록이 없습니다";
  const activeQuickRange = quickRanges.find((months) => {
    const quickStart = inputDate(addMonths(records.at(-1).date, -months));
    const boundedStart = quickStart < minDate ? minDate : quickStart;
    return safeStartDate === boundedStart && safeEndDate === maxDate;
  });
  const applyQuickRange = (months) => {
    const quickStart = inputDate(addMonths(records.at(-1).date, -months));
    setStartDate(quickStart < minDate ? minDate : quickStart);
    setEndDate(maxDate);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(420px, 520px) minmax(360px, 1fr)", gap: 16, alignItems: "stretch" }}>
        <Panel accent={C.blue} style={{ padding: "14px 16px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.25 }}>기간 선택</h2>
              <div style={{ marginTop: 4, color: C.muted, fontSize: 12 }}>{selectedLabel}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(180px, 1fr))", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>시작일</span>
                <input
                  aria-label="자산현황 시작 날짜"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={safeStartDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setStartDate(value);
                    if (value > endDate) setEndDate(value);
                  }}
                  style={dateInputStyle(C.blue)}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>종료일</span>
                <input
                  aria-label="자산현황 종료 날짜"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={safeEndDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setEndDate(value);
                    if (value < startDate) setStartDate(value);
                  }}
                  style={dateInputStyle(C.pink)}
                />
              </label>
            </div>
          </div>
        </Panel>

        <Panel accent={C.green} style={{ padding: "14px 16px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.25 }}>빠른 선택</h2>
              <div style={{ marginTop: 4, color: C.muted, fontSize: 12 }}>최신 기록 기준으로 기간을 바로 적용</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignContent: "start" }}>
              {quickRanges.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => applyQuickRange(months)}
                  style={quickButtonStyle(activeQuickRange === months, C.blue)}
                >
                  지난 {months}개월
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setStartDate(minDate);
                  setEndDate(maxDate);
                }}
                style={quickButtonStyle(safeStartDate === minDate && safeEndDate === maxDate, C.green)}
              >
                전체
              </button>
            </div>
          </div>
        </Panel>
      </div>

      <div className="stat-grid">
        <StatCard label="가족 순자산" value={compactWon(latest["순자산합계"])} color={C.green} sub={<ChangePill value={latest["순자산합계"] - periodStart["순자산합계"]} label="선택기간 변화" />} />
        <StatCard label="목표 대비" value={compactWon(latest["순자산-목표순자산"])} color={C.blue} sub={`목표 ${compactWon(latest["목표순자산"])} · 달성 ${percent(goalRate)}`} />
        <StatCard label="가용자산" value={compactWon(latest["가용자산 합"])} color={C.pink} sub={<ChangePill value={latest["가용자산 합"] - periodStart["가용자산 합"]} label="선택기간 변화" />} />
        <StatCard label="부채" value={compactWon(latest["부채합계"])} color={C.orange} sub={<ChangePill inverse value={latest["부채합계"] - periodStart["부채합계"]} label="선택기간 변화" />} />
      </div>

      <div className="main-grid">
        <Panel>
          <PanelTitle title="순자산 추이" sub={selectedLabel} />
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={data} margin={{ top: 4, right: 14, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" interval={3} tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis domain={[1000000000, netChartMax]} tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={axisWon} tickLine={false} width={54} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="순자산" name="순자산" stroke={C.blue} fill="url(#netFill)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="목표" name="목표 순자산" stroke={C.pink} strokeWidth={3} strokeDasharray="6 4" dot={false} />
            </ComposedChart>
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
        <Panel accent={C.orange}>
          <PanelTitle title="자산 합계 추이" sub="AG 컬럼 기준" />
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis
                domain={[
                  (dataMin) => Math.max(0, Math.floor(dataMin / 100000000) * 100000000),
                  (dataMax) => Math.ceil(dataMax / 100000000) * 100000000,
                ]}
                tick={{ fill: C.muted, fontSize: 11 }}
                tickFormatter={axisWon}
                tickLine={false}
                width={54}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="자산" name="자산 합계" stroke={C.orange} strokeWidth={2.8} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel accent={C.orange}>
          <PanelTitle title="나이키주식 · 미래 퇴직연금 추이" sub="선택기간 기준" />
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={axisWon} tickLine={false} width={54} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="나이키주식" name="나이키주식" stroke={C.orange} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="미래퇴직연금" name="미래 퇴직연금" stroke={C.violet} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel accent={C.green}>
          <PanelTitle title="가용자산 월 증감" sub="선택기간 기준" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={axisWon} tickLine={false} width={54} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="증감" name="가용자산 증감" radius={[4, 4, 0, 0]}>
                {data.map((item) => (
                  <Cell key={item.date} fill={(item.증감 || 0) >= 0 ? C.green : C.pink} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelTitle title="선택기간 기록" sub="최근 7개 스냅샷" />
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
                {selectedRecords.slice(-7).reverse().map((record) => (
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
  const stockDetailItems = [
    { name: "연희 토스 주식", value: latest["연희 토스 주식"], color: C.pink },
    { name: "연희 미래 ISA/연금", value: latest["연희 미래 ISA/연금"], color: C.violet },
    { name: "철규 미래 ISA", value: latest["철규 미래 ISA"], color: C.blue },
    { name: "철규 토스 주식", value: latest["철규 토스 주식"], color: C.green },
    { name: "카카오 주식", value: latest["카카오 주식"], color: C.orange },
    { name: "미래 연금저축", value: latest["미래 연금저축"], color: "#f59e0b" },
    { name: "미래IRP", value: latest["미래IRP"], color: C.muted },
  ]
    .filter((item) => Number.isFinite(item.value) && item.value > 0)
    .sort((a, b) => b.value - a.value);
  const stockDetailTotal = stockDetailItems.reduce((sum, item) => sum + item.value, 0);
  const ellaStockTotal = (latest["연희 토스 주식"] || 0) + (latest["연희 미래 ISA/연금"] || 0);
  const ckStockTotal = stockDetailTotal - ellaStockTotal;
  const stockDetailMax = Math.max(
    10000000,
    ...data.flatMap((item) => [
      item.연희토스주식 || 0,
      item.연희미래ISA연금 || 0,
      item.철규미래ISA || 0,
      item.철규토스주식 || 0,
      item.카카오주식 || 0,
      item.미래연금저축 || 0,
      item.미래IRP || 0,
    ])
  );
  const stockDetailTickStep = stockDetailMax > 80000000 ? 25000000 : 10000000;
  const stockDetailAxisMax = Math.ceil(stockDetailMax / stockDetailTickStep) * stockDetailTickStep;
  const stockDetailTicks = Array.from(
    { length: Math.floor(stockDetailAxisMax / stockDetailTickStep) + 1 },
    (_, index) => index * stockDetailTickStep
  );

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

      <div className="lower-grid">
        <Panel accent={C.blue}>
          <PanelTitle title="주식 세부 구성" sub={`P/Q/S/T/U/V/W 합계 ${compactWon(stockDetailTotal)}`} />
          <AssetBars
            latest={{ 자산합계: stockDetailTotal }}
            items={stockDetailItems}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
            {[
              { label: "연희 주식", value: ellaStockTotal, color: C.pink },
              { label: "철규/기타 주식", value: ckStockTotal, color: C.blue },
            ].map((item) => (
              <div key={item.label} style={{ borderTop: `2px solid ${item.color}`, paddingTop: 10 }}>
                <div style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>{item.label}</div>
                <div style={{ color: item.color, fontSize: 22, fontWeight: 900, marginTop: 6 }}>{compactWon(item.value)}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>세부 구성의 {percent(item.value / stockDetailTotal)}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel accent={C.pink}>
          <PanelTitle title="주식 세부 항목 추이" sub="P/Q/S/T/U/V/W 컬럼 기준" />
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={data} margin={{ top: 4, right: 14, bottom: 0, left: 8 }} barGap={2} barCategoryGap="18%">
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" interval={3} tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis
                domain={[0, stockDetailAxisMax]}
                ticks={stockDetailTicks}
                tick={{ fill: C.muted, fontSize: 11 }}
                tickFormatter={axisWonFine}
                tickLine={false}
                width={58}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke={C.muted} strokeOpacity={0.8} />
              <Bar dataKey="연희토스주식" name="연희 토스" fill={C.pink} radius={[3, 3, 0, 0]} />
              <Bar dataKey="연희미래ISA연금" name="연희 미래 ISA/연금" fill={C.violet} radius={[3, 3, 0, 0]} />
              <Bar dataKey="철규미래ISA" name="철규 미래 ISA" fill={C.blue} radius={[3, 3, 0, 0]} />
              <Bar dataKey="철규토스주식" name="철규 토스" fill={C.green} radius={[3, 3, 0, 0]} />
              <Bar dataKey="카카오주식" name="카카오 주식" fill={C.orange} radius={[3, 3, 0, 0]} />
              <Bar dataKey="미래연금저축" name="미래 연금저축" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="미래IRP" name="미래IRP" fill={C.muted} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function UnifiedView({ records, portfolio }) {
  const latest = records.at(-1);
  const previous = records.at(-2) || latest;
  const total = latest["자산합계"] || 0;
  const ckTotal = portfolio.holdings.reduce((sum, item) => sum + item.ck, 0);
  const ellaTotal = portfolio.holdings.reduce((sum, item) => sum + item.ella, 0);
  const portfolioTotal = ckTotal + ellaTotal;

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
          <PanelTitle title="포트폴리오 소유자 구분" sub={`총 ${compactManwon(portfolioTotal)}`} />
          <PortfolioBars
            rows={[
              { name: "철규", amount: ckTotal, color: C.blue },
              { name: "연희", amount: ellaTotal, color: C.pink },
            ]}
            total={portfolioTotal}
          />
        </Panel>
      </div>
    </div>
  );
}

function sumBy(items, key) {
  return items.reduce((acc, item) => {
    const group = item[key] || "기타";
    acc[group] = (acc[group] || 0) + item.amount;
    return acc;
  }, {});
}

function groupedRows(items, key, palette) {
  return Object.entries(sumBy(items, key))
    .map(([name, amount], index) => ({ name, amount, color: palette[index % palette.length] }))
    .sort((a, b) => b.amount - a.amount);
}

function ownerCategoryRows(holdings) {
  const groups = {};
  holdings.forEach((item) => {
    if (!groups[item.category]) groups[item.category] = { category: item.category, 철규: 0, 연희: 0 };
    groups[item.category].철규 += item.ck;
    groups[item.category].연희 += item.ella;
  });
  return Object.values(groups).sort((a, b) => b.철규 + b.연희 - (a.철규 + a.연희));
}

function ownerRegionRows(holdings) {
  return ["철규", "연희"].map((owner) => {
    const row = { owner };
    holdings.forEach((item) => {
      row[item.region] = (row[item.region] || 0) + (owner === "철규" ? item.ck : item.ella);
    });
    return row;
  });
}

function PortfolioBars({ rows, total }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((row) => {
        const ratio = total ? row.amount / total : 0;
        return (
          <div key={row.name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: row.color, fontWeight: 800 }}>{row.name}</span>
              <span style={{ color: C.muted }}>{compactManwon(row.amount)} · {percent(ratio)}</span>
            </div>
            <div style={{ height: 5, background: C.dim, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${ratio * 100}%`, height: "100%", background: row.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PortfolioView({ portfolio }) {
  const { holdings, history } = portfolio;
  const total = holdings.reduce((sum, item) => sum + item.amount, 0);
  const ckTotal = holdings.reduce((sum, item) => sum + item.ck, 0);
  const ellaTotal = holdings.reduce((sum, item) => sum + item.ella, 0);
  const topHoldings = [...holdings].sort((a, b) => b.amount - a.amount).slice(0, 10);
  const categoryRows = groupedRows(holdings, "category", [C.green, C.orange, C.violet, C.pink, C.blue]);
  const regionRows = groupedRows(holdings, "region", [C.blue, C.violet, C.orange]);
  const byOwnerCategory = ownerCategoryRows(holdings);
  const byOwnerRegion = ownerRegionRows(holdings);
  const latestHistory = history.at(-1);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="three-grid">
        <StatCard label="포트폴리오 총액" value={compactManwon(total)} color={C.green} sub={`${holdings.length}개 보유 항목`} />
        <StatCard label="철규 보유" value={compactManwon(ckTotal)} color={C.blue} sub={`전체의 ${percent(ckTotal / total)}`} />
        <StatCard label="연희 보유" value={compactManwon(ellaTotal)} color={C.pink} sub={`전체의 ${percent(ellaTotal / total)}`} />
      </div>

      <div className="lower-grid">
        <Panel accent={C.green}>
          <PanelTitle title="카테고리별 포트폴리오" sub="금액 및 비중" />
          <PortfolioBars rows={categoryRows} total={total} />
        </Panel>
        <Panel accent={C.orange}>
          <PanelTitle title="지역별 포트폴리오" sub="한국 · 중립 · 미국" />
          <PortfolioBars rows={regionRows} total={total} />
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel accent={C.blue}>
          <PanelTitle title="철규/연희 카테고리별 보유" sub="소유자별 금액 분리" />
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={byOwnerCategory} margin={{ top: 8, right: 14, bottom: 0, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="category" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={(value) => compactManwon(value)} tickLine={false} width={60} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
                      <div style={{ color: C.blue, fontWeight: 800, marginBottom: 6 }}>{label}</div>
                      {payload.map((item) => (
                        <div key={item.dataKey} style={{ color: item.color, marginTop: 3 }}>
                          {item.dataKey}: {compactManwon(item.value)}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="철규" stackId="owner" fill={C.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="연희" stackId="owner" fill={C.pink} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel accent={C.pink}>
          <PanelTitle title="철규/연희 지역별 보유" sub="한국 · 중립 · 미국" />
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={byOwnerRegion} margin={{ top: 8, right: 14, bottom: 0, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="owner" tick={{ fill: C.muted, fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={(value) => compactManwon(value)} tickLine={false} width={60} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
                      <div style={{ color: C.pink, fontWeight: 800, marginBottom: 6 }}>{label}</div>
                      {payload.map((item) => (
                        <div key={item.dataKey} style={{ color: item.color, marginTop: 3 }}>
                          {item.dataKey}: {compactManwon(item.value)}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="한국" stackId="region" fill={C.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="중립" stackId="region" fill={C.violet} radius={[4, 4, 0, 0]} />
              <Bar dataKey="미국" stackId="region" fill={C.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel accent={C.violet}>
          <PanelTitle title="SPY · QQQ · SCHD · GLD 금액 추이" sub={latestHistory ? `최신 기록 ${latestHistory.date}` : "시계열 데이터"} />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history} margin={{ top: 4, right: 14, bottom: 0, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={(value) => compactManwon(value)} tickLine={false} width={60} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
                      <div style={{ color: C.blue, fontWeight: 800, marginBottom: 6 }}>{label}</div>
                      {payload.map((item) => (
                        <div key={item.dataKey} style={{ color: item.color, marginTop: 3 }}>
                          {item.dataKey}: {compactManwon(item.value)}
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="SPY" stroke={C.blue} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="QQQ" stroke={C.violet} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="SCHD" stroke={C.green} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="GLD" stroke={C.orange} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="현금/채권" stroke={C.muted} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel accent={C.pink}>
          <PanelTitle title="각 티커 비중 변화" sub="포트폴리오 내 비중 %" />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history} margin={{ top: 4, right: 14, bottom: 0, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={(value) => `${value}%`} tickLine={false} width={50} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
                      <div style={{ color: C.pink, fontWeight: 800, marginBottom: 6 }}>{label}</div>
                      {payload.map((item) => (
                        <div key={item.dataKey} style={{ color: item.color, marginTop: 3 }}>
                          {String(item.dataKey).replace("비중", "")}: {(item.value || 0).toFixed(2)}%
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => String(value).replace("비중", "")} />
              <Line type="monotone" dataKey="SPY비중" stroke={C.blue} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="QQQ비중" stroke={C.violet} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="SCHD비중" stroke={C.green} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="GLD비중" stroke={C.orange} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="현금채권비중" stroke={C.muted} strokeWidth={2} dot={{ r: 3 }} name="현금/채권비중" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel>
        <PanelTitle title="상위 보유 종목" sub="철규 + 연희 합산 기준" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 720 }}>
            <thead>
              <tr style={{ color: C.muted }}>
                {["종목", "카테고리", "지역", "철규", "연희", "합계", "비중"].map((head) => (
                  <th key={head} style={{ textAlign: head === "종목" ? "left" : "right", padding: "10px 8px", borderBottom: `1px solid ${C.border}` }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topHoldings.map((item) => (
                <tr key={`${item.region}-${item.name}`}>
                  <td style={td("left")}>{item.name}</td>
                  <td style={td()}>{item.subCategory}</td>
                  <td style={{ ...td(), color: item.color }}>{item.region}</td>
                  <td style={td()}>{compactManwon(item.ck)}</td>
                  <td style={td()}>{compactManwon(item.ella)}</td>
                  <td style={td()}>{compactManwon(item.amount)}</td>
                  <td style={td()}>{percent(item.amount / total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

const NAV = [
  { key: "asset", label: "자산현황", color: C.green },
  { key: "stock", label: "주식현황", color: C.violet },
  { key: "portfolio", label: "포트폴리오", color: C.orange },
  { key: "unified", label: "통합뷰", color: C.blue },
];

export default function App() {
  const [page, setPage] = useState(() => {
    const key = window.location.hash.replace("#", "");
    return NAV.some((item) => item.key === key) ? key : "unified";
  });
  const [records, setRecords] = useState([]);
  const [portfolio, setPortfolio] = useState({ holdings: [], history: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(SHEET_CSV_URL, { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error(`자산 시트 CSV 응답 오류: ${response.status}`);
        return response.text();
      }),
      fetch(PORTFOLIO_CSV_URL, { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error(`포트폴리오 시트 CSV 응답 오류: ${response.status}`);
        return response.text();
      }),
    ])
      .then(([assetText, portfolioText]) => {
        setRecords(rowsToRecords(parseCsv(assetText)));
        setPortfolio(parsePortfolioRows(parseCsv(portfolioText)));
      })
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
              onClick={() => {
                setPage(item.key);
                window.history.replaceState(null, "", `#${item.key}`);
              }}
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
        {!error && records.length > 0 && page === "portfolio" && <PortfolioView portfolio={portfolio} />}
        {!error && records.length > 0 && page === "unified" && <UnifiedView records={records} portfolio={portfolio} />}
        <div style={{ marginTop: 24, color: C.muted, fontSize: 10, textAlign: "right" }}>
          데이터 출처: Google Sheets · 금액 단위: 원
        </div>
      </main>
    </div>
  );
}
