import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";

/* ============================================================
   CONSTANTS
   ============================================================ */
const FX = { OMR_INR: 230, USD_INR: 83.5 };
const LIQUID_RATE = 0.04;
const CURR_AGE = 42;
const EDU_YEARS = 7;
const RETIRE_AGES = [50, 52, 53, 55];
const POST_RETIRE_RETURN = 0.07;

const COLORS = {
  bg: "#070B12", card: "#0C1422", border: "#192536", controlBg: "#09101A", tabBg: "#080D16",
  blue: "#3B82F6", green: "#22C55E", amber: "#F59E0B", red: "#EF4444", teal: "#14B8A6", purple: "#A78BFA",
  darkGreen: "#15803D", darkRed: "#B91C1C",
  lightGreen: "#DCFCE7", lightRed: "#FEE2E2", lightAmber: "#FEF3C7", lightBlue: "#EFF6FF",
  text: "#E2E8F0", textSec: "#94A3B8", textMuted: "#334155",
};

const cr = v => `₹${(v / 1e7).toFixed(2)}Cr`;
const lac = v => `₹${(v / 1e5).toFixed(1)}L`;
const fmt = v => {
  if (v == null || isNaN(v)) return "₹0";
  const neg = v < 0;
  const av = Math.abs(v);
  const s = av >= 1e7 ? cr(av) : lac(av);
  return neg ? "-" + s : s;
};
const pct = v => `${(v * 100).toFixed(1)}%`;
const usd = v => `$${Math.round(v).toLocaleString("en-US")}`;
const omrFmt = v => `OMR ${Math.round(v).toLocaleString("en-US")}`;
const num = v => Math.round(v).toLocaleString("en-IN");

/* ============================================================
   DEFAULT PORTFOLIO
   ============================================================ */
const DEFAULT_HOLDINGS = [
  { id: 1, name: "KIRLOSKAR OIL ENG", ticker: "KIRLOSKAR", exchange: "NSE", currency: "INR", qty: 100, avgBuy: 5846, assetClass: "India Equity" },
  { id: 2, name: "BAJAJ FINANCE", ticker: "BAJFINANCE", exchange: "NSE", currency: "INR", qty: 20, avgBuy: 49928.9, assetClass: "India Equity" },
  { id: 3, name: "RAYMOND LIFESTYLE", ticker: "RAYMOND", exchange: "NSE", currency: "INR", qty: 100, avgBuy: 14304.3, assetClass: "India Equity" },
  { id: 4, name: "POLYCAB INDIA", ticker: "POLYCAB", exchange: "NSE", currency: "INR", qty: 5, avgBuy: 78695, assetClass: "India Equity" },
  { id: 5, name: "EID PARRY INDIA", ticker: "EIDPARRY", exchange: "NSE", currency: "INR", qty: 100, avgBuy: 8623.85, assetClass: "India Equity" },
  { id: 6, name: "FEDBANK FINANCIAL", ticker: "FEDFINA", exchange: "NSE", currency: "INR", qty: 600, avgBuy: 895.8, assetClass: "India Equity" },
  { id: 7, name: "TIPS MUSIC", ticker: "TIPS", exchange: "NSE", currency: "INR", qty: 50, avgBuy: 7481.96, assetClass: "India Equity" },
  { id: 8, name: "UJJIVAN SFB", ticker: "UJJIVANSFB", exchange: "NSE", currency: "INR", qty: 3000, avgBuy: 150.1, assetClass: "India Equity" },
  { id: 9, name: "VARUN BEVERAGES", ticker: "VBL", exchange: "NSE", currency: "INR", qty: 300, avgBuy: 2147.15, assetClass: "India Equity" },
  { id: 10, name: "MAS FINANCIAL", ticker: "MASFIN", exchange: "NSE", currency: "INR", qty: 100, avgBuy: 7577, assetClass: "India Equity" },
  { id: 11, name: "HOME FIRST FIN", ticker: "HOMEFIRST", exchange: "NSE", currency: "INR", qty: 50, avgBuy: 7996.24, assetClass: "India Equity" },
  { id: 12, name: "SONA BLW PREC", ticker: "SONACOMS", exchange: "NSE", currency: "INR", qty: 200, avgBuy: 1793.22, assetClass: "India Equity" },
  { id: 13, name: "AAVAS FINANCIERS", ticker: "AAVAS", exchange: "NSE", currency: "INR", qty: 15, avgBuy: 28670.6, assetClass: "India Equity" },
  { id: 14, name: "CMS INFO SYSTEMS", ticker: "CMSINFO", exchange: "NSE", currency: "INR", qty: 150, avgBuy: 3725.63, assetClass: "India Equity" },
  { id: 15, name: "METRO BRANDS", ticker: "METROBRAND", exchange: "NSE", currency: "INR", qty: 100, avgBuy: 4981.84, assetClass: "India Equity" },
  { id: 16, name: "Palantir", ticker: "PLTR", exchange: "NYSE", currency: "USD", qty: 394, avgBuy: 7.53, assetClass: "US Equity" },
  { id: 17, name: "Tesla", ticker: "TSLA", exchange: "NASDAQ", currency: "USD", qty: 60, avgBuy: 200.75, assetClass: "US Equity" },
  { id: 18, name: "Invesco QQQ", ticker: "QQQ", exchange: "NASDAQ", currency: "USD", qty: 26, avgBuy: 493.58, assetClass: "US Equity" },
  { id: 19, name: "First Trust CIBR", ticker: "CIBR", exchange: "NASDAQ", currency: "USD", qty: 185, avgBuy: 34.68, assetClass: "US Equity" },
  { id: 20, name: "Global X BOTZ", ticker: "BOTZ", exchange: "NASDAQ", currency: "USD", qty: 205, avgBuy: 31.3, assetClass: "US Equity" },
  { id: 21, name: "Super Micro", ticker: "SMCI", exchange: "NASDAQ", currency: "USD", qty: 15, avgBuy: 100.01, assetClass: "US Equity" },
  { id: 22, name: "Bitcoin", ticker: "BTC", exchange: "Binance", currency: "OMR", qty: 0.6524, avgBuy: 9497.6, assetClass: "Crypto" },
  { id: 23, name: "Ethereum", ticker: "ETH", exchange: "Binance", currency: "OMR", qty: 3.1046, avgBuy: 836.27, assetClass: "Crypto" },
  { id: 24, name: "OMR Liquid Fund", ticker: "CASH", exchange: "—", currency: "OMR", qty: 1, avgBuy: 25000, assetClass: "Liquid Fund", isLiquidFund: true, fixedReturn: 0.04 },
];

const ASSET_CLASSES = ["India Equity", "US Equity", "Crypto", "Liquid Fund"];
const DEFAULT_TARGETS = { "India Equity": 40, "US Equity": 35, "Crypto": 10, "Liquid Fund": 15 };

/* ============================================================
   LIVE PRICE FETCHING
   ============================================================ */
const YAHOO_SUFFIX = { NSE: ".NS", BSE: ".BO", NASDAQ: "", NYSE: "", Binance: "-USD" };

async function fetchPrice(holding) {
  if (holding.isLiquidFund) return null;
  const suffix = YAHOO_SUFFIX[holding.exchange] ?? "";
  const yTicker = holding.ticker + suffix;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yTicker}?interval=1d&range=1d`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const meta = json.chart.result[0].meta;
    return {
      price: meta.regularMarketPrice,
      prevClose: meta.chartPreviousClose,
      currency: meta.currency,
      marketState: meta.marketState,
      fetchedAt: Date.now(),
      status: "LIVE",
    };
  } catch {
    return { price: null, status: "ERROR", fetchedAt: Date.now() };
  }
}

/* ============================================================
   EDUCATION + STRESS SCENARIOS
   ============================================================ */
const EDU_OPTIONS = {
  India: { flag: "🇮🇳", cost: 2300000, note: "UG + PG standard" },
  USA: { flag: "🇺🇸", cost: 25000000, note: "Tuition + living 4yr" },
  UK: { flag: "🇬🇧", cost: 18000000, note: "Tuition + living 3yr" },
  Canada: { flag: "🇨🇦", cost: 14000000, note: "Tuition + living 4yr" },
  Australia: { flag: "🇦🇺", cost: 16000000, note: "Tuition + living 4yr" },
  Europe: { flag: "🇪🇺", cost: 10000000, note: "Tuition + living" },
};

const STRESS_SCENARIOS = [
  { id: "crash30", label: "Market Crash −30%", type: "equity", v: -0.30 },
  { id: "crypto60", label: "Crypto Crash −60%", type: "crypto", v: -0.60 },
  { id: "us25", label: "US Equity −25%", type: "us", v: -0.25 },
  { id: "india20", label: "India Mkt −20%", type: "india", v: -0.20 },
  { id: "inf3", label: "Inflation Shock +3%", type: "inf", v: 0.03 },
  { id: "medical", label: "Medical Emergency", type: "lump", v: -2500000 },
  { id: "eduabroad", label: "Education Abroad", type: "lump", v: -20000000 },
  { id: "early2", label: "Retire 2 Yrs Early", type: "years", v: -2 },
];

/* ============================================================
   PURE MATH HELPERS
   ============================================================ */
// NOTE: liquid sleeve compounds at (1+LIQUID_RATE) annually — a fixed 4% *growth* rate,
// not a multiplier applied directly to the balance.
function projectCorpus(ret, sipAnnual, years, equityStart, liquidStart) {
  let equity = equityStart, liquid = liquidStart;
  for (let i = 0; i < years; i++) {
    equity = equity * (1 + ret) + sipAnnual;
    liquid = liquid * (1 + LIQUID_RATE);
  }
  return { total: equity + liquid, equity, liquid };
}

function normalRandom(mean, sd) {
  const u = Math.max(1e-10, Math.random());
  const v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function requiredSIP(targetTotal, ret, years, equityStart, liquidAtEnd) {
  const requiredEquityFV = Math.max(0, targetTotal - liquidAtEnd);
  const fvEquityStart = equityStart * Math.pow(1 + ret, years);
  const annuityFactor = ret === 0 ? years : (Math.pow(1 + ret, years) - 1) / ret;
  if (annuityFactor <= 0) return 0;
  const sipAnnual = (requiredEquityFV - fvEquityStart) / annuityFactor;
  return Math.max(0, sipAnnual);
}

/* ============================================================
   REUSABLE SVG / UI COMPONENTS
   ============================================================ */
function Gauge({ score, size = 110 }) {
  const r = 38, cx = 50, cy = 54, circ = Math.PI * r;
  const col = score >= 75 ? COLORS.green : score >= 50 ? COLORS.amber : COLORS.red;
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 100 65">
      <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#111B27" strokeWidth="8" />
      <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={col}
        strokeWidth="8" strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.min(score, 100) / 100)} strokeLinecap="round" />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={col} fontSize="17" fontWeight="700">{score}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#334155" fontSize="7">/100</text>
    </svg>
  );
}

function ProgressBar({ val, max = 1, color = COLORS.blue, height = 5 }) {
  const w = Math.min(100, Math.max(0, (val / max) * 100));
  return (
    <div style={{ height, background: "#111B27", borderRadius: 3, overflow: "hidden", marginTop: 4 }}>
      <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
    </div>
  );
}

function Badge({ color, text }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: color + "22", color, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

function FanChart({ mc }) {
  if (!mc) return null;
  const W = 320, H = 130, PD = 28;
  const vals = [mc.worst, mc.p10, mc.p50, mc.p90, mc.best];
  const lo = mc.worst * 0.85, hi = mc.best * 1.1;
  const sy = v => H - PD - ((v - lo) / (hi - lo)) * (H - PD * 1.8);
  const pts = vals.map((v, i) => ({ x: PD + i * ((W - PD * 2) / 4), y: sy(v) }));
  const colors = ["#EF4444", "#F59E0B", "#22C55E", "#F59E0B", "#3B82F6"];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <polygon points={pts.map(p => `${p.x},${p.y}`).join(" ")} fill="#3B82F614" />
      {pts.map((p, i) => i > 0 && (
        <line key={i} x1={pts[i - 1].x} y1={pts[i - 1].y} x2={p.x} y2={p.y}
          stroke={colors[i]} strokeWidth="2" strokeDasharray={i === 2 ? "" : "4,3"} />
      ))}
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={colors[i]} />)}
      {["Worst", "P10", "Median", "P90", "Best"].map((l, i) => (
        <text key={i} x={pts[i].x} y={H - 4} textAnchor="middle" fontSize="8" fill="#334155">{l}</text>
      ))}
      {vals.map((v, i) => (
        <text key={i} x={pts[i].x} y={pts[i].y - 8} textAnchor="middle" fontSize="8" fill="#94A3B8">{fmt(v)}</text>
      ))}
    </svg>
  );
}

function Histogram({ mc }) {
  if (!mc) return null;
  const bins = 22, lo = mc.worst, hi = mc.best, step = (hi - lo) / bins || 1;
  const counts = Array(bins).fill(0);
  mc.hist.forEach(v => { counts[Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / step)))]++; });
  const mx = Math.max(...counts, 1);
  return (
    <svg width="100%" viewBox="0 0 300 72">
      {counts.map((c, i) => {
        const h = (c / mx) * 55, col = i < bins * 0.3 ? "#EF4444" : i < bins * 0.6 ? "#F59E0B" : "#22C55E";
        return <rect key={i} x={i * (300 / bins)} y={60 - h} width={300 / bins - 1} height={h} fill={col} opacity="0.85" rx="1" />;
      })}
      <text x="0" y="70" fontSize="7" fill="#334155">{fmt(lo)}</text>
      <text x="150" y="70" textAnchor="middle" fontSize="7" fill="#334155">{fmt((lo + hi) / 2)}</text>
      <text x="300" y="70" textAnchor="end" fontSize="7" fill="#334155">{fmt(hi)}</text>
    </svg>
  );
}

function TrajectoryChart({ ret, sip, retireAge, equityStart, liquidStart, totalPortfolioINR }) {
  const W = 500, H = 150, PL = 44, PT = 12, PB = 28;
  const pts = Array.from({ length: 14 }, (_, i) => ({
    age: CURR_AGE + i + 1,
    val: projectCorpus(ret, sip, i + 1, equityStart, liquidStart).total,
  }));
  const maxV = pts[pts.length - 1].val * 1.08;
  const minV = totalPortfolioINR * 0.95;
  const sx = age => PL + ((age - CURR_AGE - 1) / 12) * (W - PL - 10);
  const sy = v => PT + (H - PT - PB) * (1 - (v - minV) / (maxV - minV || 1));
  const line = pts.map(p => `${sx(p.age)},${sy(p.val)}`).join(" ");
  const gridC = [3, 5, 7, 9, 11, 13, 15].filter(c => c * 1e7 > minV && c * 1e7 < maxV * 1.05);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {gridC.map(c => (
        <g key={c}>
          <line x1={PL} y1={sy(c * 1e7)} x2={W - 5} y2={sy(c * 1e7)} stroke="#0F1A27" strokeWidth="0.8" strokeDasharray="3,2" />
          <text x={PL - 4} y={sy(c * 1e7) + 3} textAnchor="end" fontSize="7" fill="#1E3048">₹{c}Cr</text>
        </g>
      ))}
      <polygon points={`${sx(CURR_AGE + 1)},${sy(minV)} ${line} ${sx(CURR_AGE + 13)},${sy(minV)}`} fill="#3B82F60D" />
      <polyline points={line} fill="none" stroke="#3B82F6" strokeWidth="2.2" />
      {RETIRE_AGES.map(age => {
        if (age < CURR_AGE + 1 || age > CURR_AGE + 13) return null;
        const val = projectCorpus(ret, sip, age - CURR_AGE, equityStart, liquidStart).total;
        const x = sx(age), y = sy(val), sel = age === retireAge;
        return (
          <g key={age}>
            <line x1={x} y1={PT} x2={x} y2={H - PB} stroke={sel ? "#3B82F650" : "#0F1A27"} strokeWidth={sel ? 1.5 : 1} strokeDasharray="2,3" />
            <circle cx={x} cy={y} r={sel ? 5 : 3.5} fill={sel ? "#3B82F6" : "#1E3A5F"} stroke={sel ? "#93C5FD" : ""} strokeWidth="1.5" />
            <text x={x} y={y - 10} textAnchor="middle" fontSize="8" fill={sel ? "#93C5FD" : "#64748B"} fontWeight={sel ? 700 : 400}>{fmt(val)}</text>
            <text x={x} y={H - 14} textAnchor="middle" fontSize="8" fill={sel ? "#3B82F6" : "#334155"} fontWeight={sel ? 700 : 400}>Ag{age}</text>
          </g>
        );
      })}
    </svg>
  );
}

function MultiTrajectoryChart({ ret, sip, equityStart, liquidStart, selectedAge }) {
  const W = 500, H = 170, PL = 46, PT = 12, PB = 20;
  const colorsByAge = { 50: "#3B82F6", 52: "#22C55E", 53: "#F59E0B", 55: "#A78BFA" };
  const maxYears = Math.max(...RETIRE_AGES) - CURR_AGE;
  const series = RETIRE_AGES.map(age => {
    const years = age - CURR_AGE;
    return { age, pts: Array.from({ length: years }, (_, i) => projectCorpus(ret, sip, i + 1, equityStart, liquidStart).total) };
  });
  const maxV = Math.max(...series.map(s => s.pts[s.pts.length - 1] || 0)) * 1.05;
  const sx = i => PL + (i / maxYears) * (W - PL - 10);
  const sy = v => PT + (H - PT - PB) * (1 - v / (maxV || 1));
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {[2, 4, 6, 8, 10].map(c => (
        <g key={c}>
          <line x1={PL} y1={sy(c * 1e7)} x2={W - 5} y2={sy(c * 1e7)} stroke="#0F1A27" strokeWidth="0.8" strokeDasharray="3,2" />
          <text x={PL - 4} y={sy(c * 1e7) + 3} textAnchor="end" fontSize="7" fill="#1E3048">₹{c}Cr</text>
        </g>
      ))}
      {series.map(s => (
        <polyline key={s.age} points={s.pts.map((v, i) => `${sx(i + 1)},${sy(v)}`).join(" ")}
          fill="none" stroke={colorsByAge[s.age]} strokeWidth={s.age === selectedAge ? 3 : 1.6} opacity={s.age === selectedAge ? 1 : 0.65} />
      ))}
      {series.map(s => (
        <text key={s.age} x={sx(s.pts.length) + 3} y={sy(s.pts[s.pts.length - 1])} fontSize="8" fill={colorsByAge[s.age]} fontWeight="700">Age {s.age}</text>
      ))}
    </svg>
  );
}

function EducationTimeline({ retireAge, lifeExp, eduOverlap }) {
  const W = 560, H = 70;
  const start = CURR_AGE, end = lifeExp;
  const sx = age => 20 + ((age - start) / (end - start)) * (W - 40);
  const college = CURR_AGE + EDU_YEARS;
  const markers = [
    { age: CURR_AGE, label: "Now" },
    { age: college, label: "College" },
    { age: retireAge, label: "Retire" },
    { age: lifeExp, label: "Life End" },
  ];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <line x1={20} y1={40} x2={W - 20} y2={40} stroke="#192536" strokeWidth="3" />
      {eduOverlap > 0 && (
        <g>
          <rect x={sx(Math.max(start, college))} y={32} width={sx(Math.min(end, college + eduOverlap)) - sx(Math.max(start, college))} height={16} fill="#EF444433" />
          <text x={sx(college)} y={22} fontSize="8" fill="#EF4444">⚠ overlap ({eduOverlap.toFixed(0)}y)</text>
        </g>
      )}
      {markers.map((m, i) => (
        <g key={i}>
          <circle cx={sx(m.age)} cy={40} r="5" fill={COLORS.blue} />
          <text x={sx(m.age)} y={56} textAnchor="middle" fontSize="8" fill="#94A3B8">{m.label}</text>
          <text x={sx(m.age)} y={68} textAnchor="middle" fontSize="8" fill="#334155">Age {m.age}</text>
        </g>
      ))}
    </svg>
  );
}

function GlidePath({ years }) {
  const W = 400, H = 90, PL = 30, PT = 10, PB = 18;
  const n = Math.max(1, years);
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return { equity: 90 - t * 40, liquid: 10 + t * 40 };
  });
  const sx = i => PL + (i / n) * (W - PL - 10);
  const sy = v => PT + (H - PT - PB) * (1 - v / 100);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts.map((p, i) => `${sx(i)},${sy(p.equity)}`).join(" ")} fill="none" stroke={COLORS.blue} strokeWidth="2" />
      <polyline points={pts.map((p, i) => `${sx(i)},${sy(p.liquid)}`).join(" ")} fill="none" stroke={COLORS.teal} strokeWidth="2" />
      <text x={PL} y={H - 4} fontSize="7" fill="#334155">Today</text>
      <text x={W - 10} y={H - 4} textAnchor="end" fontSize="7" fill="#334155">Retirement</text>
      <text x={sx(0) + 4} y={sy(pts[0].equity) - 4} fontSize="8" fill={COLORS.blue}>Equity {pts[0].equity.toFixed(0)}%</text>
      <text x={sx(n) - 4} y={sy(pts[n].equity) - 6} textAnchor="end" fontSize="8" fill={COLORS.blue}>{pts[n].equity.toFixed(0)}%</text>
      <text x={sx(0) + 4} y={sy(pts[0].liquid) + 12} fontSize="8" fill={COLORS.teal}>Liquid {pts[0].liquid.toFixed(0)}%</text>
      <text x={sx(n) - 4} y={sy(pts[n].liquid) + 12} textAnchor="end" fontSize="8" fill={COLORS.teal}>{pts[n].liquid.toFixed(0)}%</text>
    </svg>
  );
}

/* ============================================================
   SMALL SHARED UI ATOMS
   ============================================================ */
function Card({ children, className = "", style = {}, ...rest }) {
  return (
    <div className={`rounded-[10px] border ${className}`}
      style={{ background: COLORS.card, borderColor: COLORS.border, padding: "12px 14px", ...style }} {...rest}>
      {children}
    </div>
  );
}

function KPI({ label, value, sub, color = COLORS.text }) {
  return (
    <Card className="flex flex-col gap-1 min-w-0">
      <div className="text-[10px] uppercase tracking-wide" style={{ color: COLORS.textSec }}>{label}</div>
      <div className="text-lg font-bold truncate" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px]" style={{ color: COLORS.textMuted }}>{sub}</div>}
    </Card>
  );
}

function SectionTitle({ children }) {
  return <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.textSec }}>{children}</div>;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Dashboard() {
  /* ---------- Portfolio state ---------- */
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [prices, setPrices] = useState({});
  const [manualPrices, setManualPrices] = useState({});
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const [fetching, setFetching] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [rowEditId, setRowEditId] = useState(null);
  const [rowDraft, setRowDraft] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState({ name: "", ticker: "", exchange: "NSE", currency: "INR", qty: "", avgBuy: "", assetClass: "India Equity" });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortKey, setSortKey] = useState("inrValue");
  const [sortDir, setSortDir] = useState("desc");
  const [filterClass, setFilterClass] = useState("All");
  const [history, setHistory] = useState([]);
  const [dupWarning, setDupWarning] = useState("");
  const [priceOverrideId, setPriceOverrideId] = useState(null);
  const [assetTargets, setAssetTargets] = useState(DEFAULT_TARGETS);
  const fileInputRef = useRef(null);

  /* ---------- Global control state ---------- */
  const [retireAge, setRetireAge] = useState(52);
  const [inflation, setInflation] = useState(0.06);
  const [returns, setReturns] = useState(0.10);
  const [lifeExp, setLifeExp] = useState(85);
  const [withdrawal, setWithdrawal] = useState("4pct");
  const [eduKey, setEduKey] = useState("India");
  const [monthlyExp, setMonthlyExp] = useState(100000);
  const [sipMonthly, setSipMonthly] = useState(230000);
  const [salGrowth, setSalGrowth] = useState(0.05);
  const [mcSims, setMcSims] = useState(1000);
  const [mcResult, setMcResult] = useState(null);
  const [mcRunning, setMcRunning] = useState(false);
  const [stressActive, setStressActive] = useState(new Set());
  const [activeTab, setActiveTab] = useState("exec");

  /* ============================================================
     PRICE / VALUE HELPERS
     ============================================================ */
  const getCurrentPrice = useCallback((h) => {
    if (manualPrices[h.id] !== undefined) return Number(manualPrices[h.id]);
    if (h.isLiquidFund) return h.avgBuy;
    const p = prices[h.id];
    if (p && p.price) return h.exchange === "Binance" ? (p.price * FX.USD_INR) / FX.OMR_INR : p.price;
    return h.avgBuy;
  }, [manualPrices, prices]);

  const getPriceStatus = useCallback((h) => {
    if (manualPrices[h.id] !== undefined) return "MANUAL";
    if (h.isLiquidFund) return "FIXED";
    if (fetchingIds.has(h.id)) return "FETCHING";
    const p = prices[h.id];
    if (!p) return "STALE";
    if (p.status === "ERROR" || !p.price) return "ERROR";
    return "LIVE";
  }, [manualPrices, prices, fetchingIds]);

  const getINRValue = useCallback((h) => {
    const v = h.qty * getCurrentPrice(h);
    if (h.currency === "INR") return v;
    if (h.currency === "USD") return v * FX.USD_INR;
    if (h.currency === "OMR") return v * FX.OMR_INR;
    return v;
  }, [getCurrentPrice]);

  const getInvestedINR = useCallback((h) => {
    const v = h.qty * h.avgBuy;
    if (h.currency === "INR") return v;
    if (h.currency === "USD") return v * FX.USD_INR;
    if (h.currency === "OMR") return v * FX.OMR_INR;
    return v;
  }, []);

  const getDayChangeINR = useCallback((h) => {
    const p = prices[h.id];
    if (!p || !p.price || !p.prevClose || manualPrices[h.id] !== undefined) return 0;
    const diff = p.price - p.prevClose;
    const v = h.qty * diff;
    if (h.currency === "INR") return v;
    if (h.currency === "USD") return v * FX.USD_INR;
    if (h.currency === "OMR") return v * FX.OMR_INR;
    return v;
  }, [prices, manualPrices]);

  const totalPortfolioINR = useMemo(() => holdings.reduce((s, h) => s + getINRValue(h), 0), [holdings, getINRValue]);
  const totalInvestedINR = useMemo(() => holdings.reduce((s, h) => s + getInvestedINR(h), 0), [holdings, getInvestedINR]);
  const totalPnLINR = totalPortfolioINR - totalInvestedINR;
  const dayGainINR = useMemo(() => holdings.reduce((s, h) => s + getDayChangeINR(h), 0), [holdings, getDayChangeINR]);
  const liquidINR = useMemo(() => holdings.filter(h => h.isLiquidFund).reduce((s, h) => s + getINRValue(h), 0), [holdings, getINRValue]);
  const equityINR = totalPortfolioINR - liquidINR;

  const project = useCallback((ret, sipAnnual, years) => projectCorpus(ret, sipAnnual, years, equityINR, liquidINR), [equityINR, liquidINR]);

  /* ============================================================
     CRUD OPERATIONS
     ============================================================ */
  function pushHistory() { setHistory(prev => [holdings, ...prev].slice(0, 10)); }
  function undo() {
    if (!history.length) return;
    setHoldings(history[0]);
    setHistory(prev => prev.slice(1));
  }

  function validateDraft(d) {
    const e = [];
    if (!d.name?.trim()) e.push("Name required");
    if (!d.ticker?.trim()) e.push("Ticker required");
    if (!d.qty || isNaN(d.qty) || Number(d.qty) <= 0) e.push("Qty must be > 0");
    if (!d.avgBuy || isNaN(d.avgBuy) || Number(d.avgBuy) <= 0) e.push("Avg buy must be > 0");
    return e;
  }

  function resetNewDraft() {
    setNewDraft({ name: "", ticker: "", exchange: "NSE", currency: "INR", qty: "", avgBuy: "", assetClass: "India Equity" });
    setDupWarning("");
  }

  function commitAdd() {
    const errors = validateDraft(newDraft);
    if (errors.length) return;
    const dup = holdings.some(h => h.ticker.toUpperCase() === newDraft.ticker.trim().toUpperCase());
    const h = { ...newDraft, id: Date.now(), qty: Number(newDraft.qty), avgBuy: Number(newDraft.avgBuy) };
    pushHistory();
    setHoldings(prev => [...prev, h]);
    setAddingNew(false);
    resetNewDraft();
    if (!h.isLiquidFund) refreshSingle(h);
    if (dup) setDupWarning(`You already hold ${h.ticker}. Added anyway.`);
  }

  function startInlineEdit(id, field, value) { setEditingId(id); setEditDraft({ field, value }); }
  function commitInlineEdit() {
    if (editingId == null) return;
    pushHistory();
    setHoldings(prev => prev.map(h => h.id === editingId
      ? { ...h, [editDraft.field]: isNaN(editDraft.value) || editDraft.value === "" ? editDraft.value : Number(editDraft.value) }
      : h));
    setEditingId(null); setEditDraft({});
  }
  function cancelInlineEdit() { setEditingId(null); setEditDraft({}); }

  function startRowEdit(h) { setRowEditId(h.id); setRowDraft({ ...h }); }
  function commitRowEdit() {
    const errors = validateDraft(rowDraft);
    if (errors.length) return;
    pushHistory();
    setHoldings(prev => prev.map(h => h.id === rowEditId ? { ...rowDraft, qty: Number(rowDraft.qty), avgBuy: Number(rowDraft.avgBuy) } : h));
    setRowEditId(null); setRowDraft({});
  }
  function cancelRowEdit() { setRowEditId(null); setRowDraft({}); }

  function confirmDelete() {
    pushHistory();
    setHoldings(prev => prev.filter(h => h.id !== deleteConfirmId));
    setPrices(prev => { const n = { ...prev }; delete n[deleteConfirmId]; return n; });
    setManualPrices(prev => { const n = { ...prev }; delete n[deleteConfirmId]; return n; });
    setDeleteConfirmId(null);
  }

  function bulkDelete() {
    pushHistory();
    setHoldings(prev => prev.filter(h => !selectedIds.has(h.id)));
    setSelectedIds(new Set());
  }

  function setManualPriceVal(id, value) {
    if (value === "" || value === null) {
      setManualPrices(prev => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      setManualPrices(prev => ({ ...prev, [id]: Number(value) }));
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  /* ---------- Price refresh ---------- */
  async function refreshSingle(h) {
    setFetchingIds(prev => new Set(prev).add(h.id));
    const res = await fetchPrice(h);
    setPrices(prev => ({ ...prev, [h.id]: res }));
    setFetchingIds(prev => { const n = new Set(prev); n.delete(h.id); return n; });
  }

  async function refreshAll() {
    setFetching(true);
    await Promise.all(holdings.filter(h => !h.isLiquidFund).map(h => refreshSingle(h)));
    setLastRefresh(Date.now());
    setFetching(false);
  }

  useEffect(() => { refreshAll(); /* eslint-disable-next-line */ }, []);

  /* ---------- CSV import/export ---------- */
  function exportCSV() {
    const headers = ["Name", "Ticker", "Exchange", "Currency", "Qty", "AvgBuy", "AssetClass", "CurrentPrice", "INRValue", "InvestedINR", "PnLINR", "PnLPct", "PortfolioPct"];
    const rows = holdings.map(h => {
      const cp = getCurrentPrice(h), iv = getINRValue(h), inv = getInvestedINR(h);
      return [h.name, h.ticker, h.exchange, h.currency, h.qty, h.avgBuy, h.assetClass,
        cp.toFixed(2), iv.toFixed(0), inv.toFixed(0), (iv - inv).toFixed(0),
        (inv ? ((iv - inv) / inv * 100).toFixed(1) : "0.0") + "%",
        (totalPortfolioINR ? (iv / totalPortfolioINR * 100).toFixed(1) : "0.0") + "%"];
    });
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csvContent], { type: "text/csv" })),
      download: "portfolio.csv",
    });
    a.click(); URL.revokeObjectURL(a.href);
  }

  function importCSV(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const lines = e.target.result.split("\n").slice(1).filter(l => l.trim());
      const imported = lines.map((l, i) => {
        const [name, ticker, exchange, currency, qty, avgBuy, assetClass] = l.split(",");
        return {
          id: Date.now() + i, name: name?.trim(), ticker: ticker?.trim(),
          exchange: exchange?.trim(), currency: currency?.trim(),
          qty: Number(qty), avgBuy: Number(avgBuy), assetClass: assetClass?.trim() || "Other",
        };
      }).filter(h => h.name && h.ticker && h.qty > 0 && h.avgBuy > 0);
      pushHistory();
      setHoldings(imported);
      setTimeout(refreshAll, 100);
    };
    reader.readAsText(file);
  }

  /* ============================================================
     RETIREMENT / PLANNING DERIVED VALUES
     ============================================================ */
  const yearsAccum = retireAge - CURR_AGE;
  const yearsRetire = lifeExp - retireAge;
  const sipAnnual = sipMonthly * 12;

  const projected = useMemo(() => project(returns, sipAnnual, yearsAccum), [project, returns, sipAnnual, yearsAccum]);
  const expAtRetire = useMemo(() => monthlyExp * Math.pow(1 + inflation, yearsAccum), [monthlyExp, inflation, yearsAccum]);
  const wdRate = { "3.5pct": 0.035, "4pct": 0.04, "dynamic": 0.038, "bucket": 0.04 }[withdrawal];
  const reqCorpus = useMemo(() => (expAtRetire * 12) / wdRate, [expAtRetire, wdRate]);
  const surplus = projected.total - reqCorpus;
  const safeWd = (projected.total * wdRate) / 12;

  const readiness = useMemo(() => Math.min(100, Math.max(0, Math.round(
    Math.min(40, (projected.total / reqCorpus) * 40) +
    Math.min(20, yearsAccum * 1.5) +
    (surplus > 0 ? 25 : 0) +
    Math.min(15, (sipMonthly / 50000) * 3)
  ))), [projected, reqCorpus, yearsAccum, surplus, sipMonthly]);

  const scenarios = useMemo(() => RETIRE_AGES.map(age => {
    const y = age - CURR_AGE;
    const p = project(returns, sipAnnual, y);
    const exp = monthlyExp * Math.pow(1 + inflation, y);
    const req = (exp * 12) / wdRate;
    const surp = p.total - req;
    const score = Math.min(100, Math.max(0, Math.round(
      Math.min(40, (p.total / req) * 40) + Math.min(20, y * 1.5) + (surp > 0 ? 25 : 0) + 15
    )));
    return { age, y, corpus: p.total, liquid: p.liquid, exp, req, surp, score };
  }), [project, returns, sipAnnual, inflation, wdRate, monthlyExp]);

  /* ---------- Education ---------- */
  const eduData = EDU_OPTIONS[eduKey];
  const eduInflated = useMemo(() => eduData.cost * Math.pow(1.08, EDU_YEARS), [eduKey]);
  const eduLiqGrown = useMemo(() => liquidINR * Math.pow(1 + LIQUID_RATE, EDU_YEARS), [liquidINR]);
  const eduRatio = eduInflated > 0 ? Math.min(1, eduLiqGrown / eduInflated) : 1;
  const eduGap = Math.max(0, eduInflated - eduLiqGrown);
  const eduSIP = useMemo(() => {
    const r = 0.12 / 12, n = EDU_YEARS * 12;
    return (eduInflated * r) / (Math.pow(1 + r, n) - 1);
  }, [eduInflated]);
  const eduOverlap = Math.max(0, (EDU_YEARS + 4) - yearsAccum);

  /* ---------- Monte Carlo ---------- */
  function runMonteCarlo(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const randRet = normalRandom(returns, 0.10);
      const randInf = normalRandom(inflation, 0.015);
      let equity = equityINR, liquid = liquidINR;
      for (let y = 0; y < yearsAccum; y++) {
        equity = equity * (1 + randRet) + sipAnnual;
        liquid = liquid * (1 + LIQUID_RATE);
      }
      const corpus = equity + liquid;
      const annualExp = monthlyExp * 12 * Math.pow(1 + randInf, yearsAccum);
      const required = annualExp / wdRate;
      results.push({ corpus, required, success: corpus >= required });
    }
    const corpora = results.map(r => r.corpus).sort((a, b) => a - b);
    return {
      rate: results.filter(r => r.success).length / n,
      p10: corpora[Math.floor(n * 0.10)], p25: corpora[Math.floor(n * 0.25)],
      p50: corpora[Math.floor(n * 0.50)], p75: corpora[Math.floor(n * 0.75)],
      p90: corpora[Math.floor(n * 0.90)], best: corpora[n - 1], worst: corpora[0],
      hist: corpora,
    };
  }

  useEffect(() => {
    setMcRunning(true);
    const t = setTimeout(() => { setMcResult(runMonteCarlo(mcSims)); setMcRunning(false); }, 50);
    return () => clearTimeout(t);
    /* eslint-disable-next-line */
  }, [retireAge, inflation, returns, lifeExp, withdrawal, sipMonthly, monthlyExp, totalPortfolioINR, mcSims]);

  function quickMCRate(age, n = 200) {
    const y = age - CURR_AGE;
    let successes = 0;
    for (let i = 0; i < n; i++) {
      const randRet = normalRandom(returns, 0.10);
      const randInf = normalRandom(inflation, 0.015);
      let equity = equityINR, liquid = liquidINR;
      for (let k = 0; k < y; k++) { equity = equity * (1 + randRet) + sipAnnual; liquid = liquid * (1 + LIQUID_RATE); }
      const corpus = equity + liquid;
      const req = (monthlyExp * 12 * Math.pow(1 + randInf, y)) / wdRate;
      if (corpus >= req) successes++;
    }
    return successes / n;
  }
  const perAgeSuccess = useMemo(() => RETIRE_AGES.map(age => ({ age, rate: quickMCRate(age, 200) })),
    /* eslint-disable-next-line */ [retireAge, inflation, returns, sipMonthly, monthlyExp, equityINR, liquidINR, wdRate]);

  /* ---------- Stress test ---------- */
  function computeStress(scenarioIds) {
    const list = STRESS_SCENARIOS.filter(s => scenarioIds.has(s.id));
    let adjTotal = totalPortfolioINR;
    let adjYears = yearsAccum;
    const indiaVal = holdings.filter(h => h.assetClass === "India Equity").reduce((s, h) => s + getINRValue(h), 0);
    const usVal = holdings.filter(h => h.assetClass === "US Equity").reduce((s, h) => s + getINRValue(h), 0);
    const cryptoVal = holdings.filter(h => h.assetClass === "Crypto").reduce((s, h) => s + getINRValue(h), 0);
    list.forEach(scenario => {
      if (scenario.type === "equity") adjTotal -= (indiaVal + usVal) * Math.abs(scenario.v);
      if (scenario.type === "crypto") adjTotal -= cryptoVal * Math.abs(scenario.v);
      if (scenario.type === "us") adjTotal -= usVal * Math.abs(scenario.v);
      if (scenario.type === "india") adjTotal -= indiaVal * Math.abs(scenario.v);
      if (scenario.type === "lump") adjTotal = Math.max(0, adjTotal + scenario.v);
      if (scenario.type === "years") adjYears = Math.max(1, adjYears + scenario.v);
    });
    const infShock = list.some(s => s.type === "inf") ? 0.03 : 0;
    const adjLiquid = Math.min(liquidINR, adjTotal);
    const adjEquity = adjTotal - adjLiquid;
    let equity = adjEquity, liquid = adjLiquid;
    for (let y = 0; y < adjYears; y++) { equity = equity * (1 + returns) + sipAnnual; liquid = liquid * (1 + LIQUID_RATE); }
    const stressedCorpus = equity + liquid;
    const stressedExp = monthlyExp * Math.pow(1 + inflation + infShock, adjYears);
    const stressedReq = (stressedExp * 12) / wdRate;
    return { corpus: stressedCorpus, delta: stressedCorpus - projected.total, ok: stressedCorpus >= stressedReq, req: stressedReq };
  }

  function toggleStress(id) {
    setStressActive(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  /* ---------- Keyboard shortcuts ---------- */
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      if (e.key === "Escape") {
        setEditingId(null); setRowEditId(null); setAddingNew(false); setDeleteConfirmId(null); setPriceOverrideId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    /* eslint-disable-next-line */
  }, [history, holdings]);

  /* ============================================================
     PORTFOLIO TABLE — sorting / filtering
     ============================================================ */
  const enriched = useMemo(() => holdings.map(h => {
    const cp = getCurrentPrice(h), iv = getINRValue(h), inv = getInvestedINR(h);
    const dayChg = getDayChangeINR(h);
    const p = prices[h.id];
    const dayPct = p && p.price && p.prevClose ? ((p.price - p.prevClose) / p.prevClose) * 100 : 0;
    return {
      ...h, currentPrice: cp, inrValue: iv, invested: inv, pnl: iv - inv,
      pnlPct: inv ? ((iv - inv) / inv) * 100 : 0, dayChg, dayPct,
      portPct: totalPortfolioINR ? (iv / totalPortfolioINR) * 100 : 0,
      status: getPriceStatus(h),
    };
  }), [holdings, getCurrentPrice, getINRValue, getInvestedINR, getDayChangeINR, prices, totalPortfolioINR, getPriceStatus]);

  const filtered = useMemo(() => filterClass === "All" ? enriched : enriched.filter(h => h.assetClass === filterClass), [enriched, filterClass]);
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const usTotal = holdings.filter(h => h.assetClass === "US Equity").reduce((s, h) => s + getINRValue(h), 0);
  const pltrPct = usTotal ? (holdings.filter(h => h.ticker === "PLTR").reduce((s, h) => s + getINRValue(h), 0) / usTotal) * 100 : 0;

  const classTotals = useMemo(() => {
    const map = {};
    ASSET_CLASSES.forEach(c => { map[c] = holdings.filter(h => h.assetClass === c).reduce((s, h) => s + getINRValue(h), 0); });
    return map;
  }, [holdings, getINRValue]);

  const currencyExposure = useMemo(() => {
    const map = { INR: 0, USD: 0, OMR: 0 };
    holdings.forEach(h => { map[h.currency] = (map[h.currency] || 0) + getINRValue(h); });
    return map;
  }, [holdings, getINRValue]);

  /* ============================================================
     OPTIMIZER — required SIP / actions
     ============================================================ */
  const optimizerScenarios = useMemo(() => RETIRE_AGES.map(age => {
    const y = age - CURR_AGE;
    const p = project(returns, sipAnnual, y);
    const liquidAtEnd = projectCorpus(returns, 0, y, 0, liquidINR).liquid;
    const exp = monthlyExp * Math.pow(1 + inflation, y);
    const req = (exp * 12) / wdRate;
    const reqSipAnnual = requiredSIP(req, returns, y, equityINR, liquidAtEnd);
    return { age, y, corpus: p.total, req, reqSipMonthly: reqSipAnnual / 12, onTrack: p.total >= req };
  }), [project, returns, sipAnnual, monthlyExp, inflation, wdRate, equityINR, liquidINR]);

  const returnSensitivity = useMemo(() => [0.08, 0.10, 0.12].map(r => ({
    r, corpus: project(r, sipAnnual, yearsAccum).total,
  })), [project, sipAnnual, yearsAccum]);

  const wdComparison = useMemo(() => [
    { key: "3.5pct", label: "3.5% Rule", rate: 0.035 },
    { key: "4pct", label: "4% Rule", rate: 0.04 },
    { key: "dynamic", label: "Dynamic 3.8%", rate: 0.038 },
    { key: "bucket", label: "Bucket 25×", rate: 0.04 },
  ].map(o => {
    const req = (expAtRetire * 12) / o.rate;
    return { ...o, req, surplus: projected.total - req };
  }), [expAtRetire, projected]);

  const cryptoINR = classTotals["Crypto"] || 0;
  const cryptoPctOfTotal = totalPortfolioINR ? (cryptoINR / totalPortfolioINR) * 100 : 0;

  const topActions = useMemo(() => {
    const actions = [];
    if (surplus < 0) {
      const y = yearsAccum;
      const annuityFactor = returns === 0 ? y : (Math.pow(1 + returns, y) - 1) / returns;
      const extraSipAnnual = annuityFactor > 0 ? (-surplus / annuityFactor) : 0;
      actions.push({ text: `Increase SIP by ₹${Math.round(extraSipAnnual / 12 / 1000)}K/mo to close the ${fmt(-surplus)} deficit`, impact: "Critical", delta: -surplus });
    }
    if (eduGap > 0) {
      actions.push({ text: `Start dedicated education SIP of ₹${Math.round(eduSIP / 1000)}K/mo for ${eduData.note} in ${eduKey}`, impact: "High", delta: -eduGap });
    }
    if (pltrPct > 15) {
      actions.push({ text: `Trim PLTR — currently ${pltrPct.toFixed(1)}% of US equity book (concentration risk)`, impact: "High", delta: 0 });
    }
    if (cryptoPctOfTotal > 10) {
      actions.push({ text: `Reduce crypto exposure — ${cryptoPctOfTotal.toFixed(1)}% of portfolio, consider trimming toward 5-8%`, impact: "Medium", delta: 0 });
    }
    if (eduOverlap > 0) {
      actions.push({ text: `Education (age ${CURR_AGE + EDU_YEARS}) overlaps retirement drawdown by ~${eduOverlap.toFixed(0)} yrs — sequence funding separately`, impact: "Medium", delta: 0 });
    }
    if (readiness < 70) {
      actions.push({ text: `Readiness score is ${readiness}/100 — consider delaying retirement by 1-2 years or raising SIP`, impact: "High", delta: 0 });
    }
    actions.push({ text: "Ensure health insurance cover of at least ₹50L before retirement (employer cover ends)", impact: "High", delta: 0 });
    actions.push({ text: "Maximize NPS contribution for additional tax-efficient retirement corpus", impact: "Medium", delta: 0 });
    actions.push({ text: `Redeploy idle liquid fund balance (${fmt(liquidINR)}) — ensure it is earning at least ${pct(LIQUID_RATE)}`, impact: "Medium", delta: 0 });
    actions.push({ text: "Review beneficiary nominations and estate/will documentation annually", impact: "Low", delta: 0 });
    actions.push({ text: "Rebalance equity sleeve annually against target asset allocation", impact: "Low", delta: 0 });
    return actions.slice(0, 10);
  }, [surplus, yearsAccum, returns, eduGap, eduSIP, eduData, eduKey, pltrPct, cryptoPctOfTotal, eduOverlap, readiness, liquidINR]);

  /* ---------- Cash flow ---------- */
  const salaryMonthlyINR = 2500 * FX.OMR_INR;
  const expenseMonthlyINR = 1400 * FX.OMR_INR;
  const bufferINR = 100 * FX.OMR_INR;
  const savingsRate = salaryMonthlyINR ? ((expenseMonthlyINR + sipMonthly) / salaryMonthlyINR) * 100 : 0;

  const salaryAtAge = useMemo(() => RETIRE_AGES.map(age => ({
    age, income: salaryMonthlyINR * Math.pow(1 + salGrowth, age - CURR_AGE),
  })), [salGrowth, salaryMonthlyINR]);

  const sipSensitivity = useMemo(() => [100000, 150000, 200000, 230000, 300000, 400000, 500000].map(sip => ({
    sip, corpus: project(returns, sip * 12, yearsAccum).total, current: sip === 230000,
  })), [project, returns, yearsAccum]);

  const fiMilestones = useMemo(() => {
    function findAge(targetCorpus) {
      for (let age = CURR_AGE + 1; age <= 70; age++) {
        if (project(returns, sipAnnual, age - CURR_AGE).total >= targetCorpus) return age;
      }
      return null;
    }
    return [
      { key: "Coast FI", target: reqCorpus, age: findAge(reqCorpus * 0.55) },
      { key: "Lean FIRE", target: 35000000, age: findAge(35000000) },
      { key: "Full FIRE", target: 60000000, age: findAge(60000000) },
      { key: "Fat FIRE", target: 100000000, age: findAge(100000000) },
    ];
  }, [project, sipAnnual, reqCorpus]);

  const cashFlowYears = useMemo(() => Array.from({ length: 13 }, (_, i) => {
    const age = CURR_AGE + i + 1;
    const income = salaryMonthlyINR * 12 * Math.pow(1 + salGrowth, i + 1);
    const expense = expenseMonthlyINR * 12 * Math.pow(1 + inflation, i + 1);
    const sip = sipAnnual;
    return { age, income, expense, sip, surplus: income - expense - sip };
  }), [salaryMonthlyINR, salGrowth, expenseMonthlyINR, inflation, sipAnnual]);

  /* ---------- FIRE type ---------- */
  const fireType = retireAge <= 50 ? "Lean FIRE" : retireAge <= 53 ? "Full FIRE" : "Fat FIRE";

  /* ============================================================
     RENDER HELPERS — TABS
     ============================================================ */
  function fmtStatusColor(status) {
    return { LIVE: COLORS.green, MANUAL: COLORS.blue, STALE: COLORS.amber, ERROR: COLORS.red, FIXED: COLORS.purple, FETCHING: COLORS.textSec }[status] || COLORS.textSec;
  }

  function renderExec() {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Total Portfolio Today" value={fmt(totalPortfolioINR)} sub="INR + USD + OMR live" />
          <KPI label="Projected Corpus" value={fmt(projected.total)} sub={`Age ${retireAge} | ${(returns * 100).toFixed(0)}% equity + 4% liquid`} />
          <KPI label="Required Corpus" value={fmt(reqCorpus)} sub={`${withdrawal} | life to ${lifeExp}`} />
          <KPI label={surplus >= 0 ? "Surplus" : "Deficit"} value={fmt(Math.abs(surplus))} color={surplus >= 0 ? COLORS.green : COLORS.red} sub="Projected − Required" />
          <KPI label="Monthly Income Need" value={fmt(expAtRetire)} sub={`₹${(monthlyExp / 1000).toFixed(0)}K inflated`} />
          <KPI label="Safe Withdrawal/mo" value={fmt(safeWd)} color={safeWd >= expAtRetire ? COLORS.green : COLORS.amber} />
          <KPI label="MC Success %" value={mcResult ? pct(mcResult.rate) : "…"} color={mcResult ? (mcResult.rate >= 0.8 ? COLORS.green : mcResult.rate >= 0.65 ? COLORS.amber : COLORS.red) : COLORS.textSec} />
          <Card className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: COLORS.textSec }}>Readiness Score</div>
              <div className="text-[10px]" style={{ color: COLORS.textMuted }}>Formula-driven</div>
            </div>
            <Gauge score={readiness} size={80} />
          </Card>
        </div>

        <Card>
          <SectionTitle>Net Worth Trajectory</SectionTitle>
          <TrajectoryChart ret={returns} sip={sipAnnual} retireAge={retireAge} equityStart={equityINR} liquidStart={liquidINR} totalPortfolioINR={totalPortfolioINR} />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <SectionTitle>FIRE Readiness</SectionTitle>
            <div className="flex flex-col gap-2 text-sm">
              {[
                { label: "Lean FIRE (₹3.5Cr)", ok: projected.total >= 35000000 },
                { label: "Full FIRE (₹6Cr)", ok: projected.total >= 60000000 },
                { label: "Fat FIRE (₹10Cr+)", ok: projected.total >= 100000000 },
                { label: "Coast FIRE", ok: true, note: "~age 47" },
              ].map((r, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span style={{ color: COLORS.text }}>{r.label}</span>
                  <Badge color={r.ok ? COLORS.green : COLORS.amber} text={r.ok ? "Achievable" : "Stretch"} />
                </div>
              ))}
              <div className="mt-2"><Badge color={COLORS.blue} text={`Current type: ${fireType}`} /></div>
            </div>
          </Card>
          <Card>
            <SectionTitle>Education Impact ({eduData.flag} {eduKey})</SectionTitle>
            <div className="flex flex-col gap-1 text-xs" style={{ color: COLORS.textSec }}>
              <div className="flex justify-between"><span>Cost today</span><span style={{ color: COLORS.text }}>{fmt(eduData.cost)}</span></div>
              <div className="flex justify-between"><span>Inflated at entry</span><span style={{ color: COLORS.text }}>{fmt(eduInflated)}</span></div>
              <div className="flex justify-between"><span>Liquid at college</span><span style={{ color: COLORS.text }}>{fmt(eduLiqGrown)}</span></div>
              <div className="flex justify-between"><span>Funding ratio</span><span style={{ color: COLORS.text }}>{pct(eduRatio)}</span></div>
              <ProgressBar val={eduRatio} color={eduRatio >= 1 ? COLORS.green : eduRatio >= 0.7 ? COLORS.amber : COLORS.red} />
              <div className="flex justify-between mt-1"><span>Gap</span><span style={{ color: eduGap > 0 ? COLORS.red : COLORS.green }}>{eduGap > 0 ? fmt(eduGap) : "None"}</span></div>
              <div className="flex justify-between"><span>SIP needed</span><span style={{ color: COLORS.text }}>₹{Math.round(eduSIP / 1000)}K/mo</span></div>
              <Badge color={eduRatio >= 1 ? COLORS.green : eduRatio >= 0.7 ? COLORS.amber : COLORS.red}
                text={eduRatio >= 1 ? "✅ FULLY FUNDED" : eduRatio >= 0.7 ? "⚠ PARTIALLY FUNDED" : "❌ FUNDING GAP"} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <SectionTitle>Top 5 Risks</SectionTitle>
            <div className="flex flex-col gap-2">
              {[
                pltrPct > 15 ? `PLTR concentration ${pltrPct.toFixed(0)}% of US book` : "US equity concentration within limits",
                cryptoPctOfTotal > 10 ? `Crypto ${cryptoPctOfTotal.toFixed(1)}% of portfolio — high volatility` : "Crypto allocation modest",
                surplus < 0 ? `Corpus deficit of ${fmt(-surplus)} at target retirement` : "Sequence-of-returns risk near retirement",
                eduGap > 0 ? `Education funding gap of ${fmt(eduGap)}` : "Inflation eroding fixed liquid-fund returns",
                eduOverlap > 0 ? `Education/retirement overlap of ${eduOverlap.toFixed(0)} yrs` : "Longevity risk beyond age " + lifeExp,
              ].map((r, i) => <div key={i}><Badge color={COLORS.red} text={r} /></div>)}
            </div>
          </Card>
          <Card>
            <SectionTitle>Top 5 Opportunities</SectionTitle>
            <div className="flex flex-col gap-2">
              {[
                "Compound India equity SIP over remaining accumulation years",
                liquidINR > 0 ? `Redeploy ${fmt(liquidINR)} liquid fund into higher-yield sleeve` : "Build liquid fund buffer",
                "US equity + crypto provide natural currency diversification",
                "NPS + Sukanya Samriddhi offer tax-efficient long-horizon compounding",
                readiness >= 75 ? "Readiness strong — consider earlier retirement age" : "Raising SIP modestly closes most of the gap",
              ].map((r, i) => <div key={i}><Badge color={COLORS.green} text={r} /></div>)}
            </div>
          </Card>
        </div>

        <Card>
          <SectionTitle>10-Year Action Plan</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { y: "Now", d: `Track portfolio (${fmt(totalPortfolioINR)}) and confirm SIP of ₹${(sipMonthly / 1000).toFixed(0)}K/mo` },
              { y: "2026 Q4", d: "Review asset allocation vs targets and rebalance" },
              { y: "2027", d: `Reassess education plan for ${eduKey} (target ${fmt(eduInflated)})` },
              { y: "2028", d: "Maximize NPS + Sukanya Samriddhi contributions" },
              { y: "2029", d: "Mid-course check against required corpus " + fmt(reqCorpus) },
              { y: "2030", d: "Increase health insurance cover ahead of retirement" },
              { y: "2031", d: "Begin glide path — shift equity toward liquid sleeve" },
              { y: "2032", d: `Confirm readiness score (currently ${readiness}/100) trending up` },
              { y: "2033+", d: `Target retirement at age ${retireAge} with corpus ${fmt(projected.total)}` },
              { y: "Ongoing", d: "Annual estate planning and beneficiary review" },
            ].map((it, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="text-xs font-bold" style={{ color: COLORS.blue }}>{it.y}</div>
                <div className="text-[11px]" style={{ color: COLORS.textSec }}>{it.d}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function renderPortfolio() {
    const liveCount = enriched.filter(h => h.status === "LIVE").length;
    const staleCount = enriched.filter(h => h.status === "STALE" || h.status === "ERROR").length;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={refreshAll} disabled={fetching} className="px-3 py-1.5 rounded text-xs font-bold" style={{ background: COLORS.blue + "22", color: COLORS.blue }}>
            {fetching ? "⏳ REFRESHING…" : "🔄 REFRESH ALL"}
          </button>
          <button onClick={() => setAddingNew(v => !v)} className="px-3 py-1.5 rounded text-xs font-bold" style={{ background: COLORS.green + "22", color: COLORS.green }}>➕ ADD HOLDING</button>
          <button onClick={exportCSV} className="px-3 py-1.5 rounded text-xs font-bold" style={{ background: COLORS.teal + "22", color: COLORS.teal }}>⬇ CSV</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded text-xs font-bold" style={{ background: COLORS.purple + "22", color: COLORS.purple }}>⬆ IMPORT</button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => importCSV(e.target.files[0])} />
          <button onClick={undo} disabled={!history.length} className="px-3 py-1.5 rounded text-xs font-bold" style={{ background: COLORS.amber + "22", color: COLORS.amber }}>↩ UNDO</button>
          <span className="text-[11px] ml-auto" style={{ color: COLORS.textSec }}>
            {lastRefresh ? `Last refreshed: ${Math.round((Date.now() - lastRefresh) / 60000)} min ago` : "Not refreshed yet"} • {liveCount}/{enriched.length} LIVE • {staleCount} STALE/ERROR
          </span>
        </div>

        {(fetching === false && lastRefresh && staleCount === enriched.length && enriched.length > 0) && (
          <div className="text-xs rounded px-3 py-2" style={{ background: COLORS.lightAmber + "18", color: COLORS.amber }}>
            ⚠ Live prices unavailable — calculations use cost prices as fallback. Manual overrides recommended.
          </div>
        )}
        {dupWarning && <div className="text-xs rounded px-3 py-2" style={{ background: COLORS.lightAmber + "18", color: COLORS.amber }}>⚠ {dupWarning}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Portfolio Total (INR)" value={fmt(totalPortfolioINR)} />
          <KPI label="Total Invested (INR)" value={fmt(totalInvestedINR)} />
          <KPI label="Total P&L (INR)" value={fmt(totalPnLINR)} color={totalPnLINR >= 0 ? COLORS.green : COLORS.red} />
          <KPI label="Day Gain/Loss (INR)" value={fmt(dayGainINR)} color={dayGainINR >= 0 ? COLORS.green : COLORS.red} />
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", ...ASSET_CLASSES].map(c => (
            <button key={c} onClick={() => setFilterClass(c)} className="px-2.5 py-1 rounded text-[11px] font-semibold"
              style={{ background: filterClass === c ? COLORS.blue : "#111B27", color: filterClass === c ? "#fff" : COLORS.textSec }}>{c}</button>
          ))}
          {selectedIds.size > 0 && (
            <button onClick={bulkDelete} className="px-2.5 py-1 rounded text-[11px] font-semibold ml-auto" style={{ background: COLORS.red + "22", color: COLORS.red }}>
              🗑 Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>

        {holdings.length === 0 ? (
          <Card><div className="text-center text-sm" style={{ color: COLORS.textSec }}>No holdings yet. Click ➕ to add your first holding.</div></Card>
        ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ color: COLORS.text }}>
            <thead>
              <tr style={{ color: COLORS.textSec }}>
                <th className="p-1"></th>
                <th className="p-1 text-left">#</th>
                {[["name", "Name"], ["ticker", "Ticker"]].map(([k, l]) => (
                  <th key={k} className="p-1 text-left cursor-pointer" onClick={() => toggleSort(k)}>{l}{sortKey === k ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</th>
                ))}
                <th className="p-1 text-left">Exch</th>
                <th className="p-1 text-right cursor-pointer" onClick={() => toggleSort("qty")}>Qty</th>
                <th className="p-1 text-right cursor-pointer" onClick={() => toggleSort("avgBuy")}>Avg Buy</th>
                <th className="p-1 text-right">Live Price</th>
                <th className="p-1 text-left">Status</th>
                <th className="p-1 text-right cursor-pointer" onClick={() => toggleSort("inrValue")}>INR Value</th>
                <th className="p-1 text-right">Invested</th>
                <th className="p-1 text-right cursor-pointer" onClick={() => toggleSort("pnl")}>P&L</th>
                <th className="p-1 text-right">P&L%</th>
                <th className="p-1 text-right">Day%</th>
                <th className="p-1 text-right">Port%</th>
                <th className="p-1 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((h, i) => {
                const isEditingRow = rowEditId === h.id;
                if (isEditingRow) {
                  return (
                    <tr key={h.id} style={{ background: "#0F1A2A" }}>
                      <td colSpan={16} className="p-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <input className="bg-[#111B27] px-2 py-1 rounded w-32" value={rowDraft.name} onChange={e => setRowDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name" />
                          <input className="bg-[#111B27] px-2 py-1 rounded w-24" value={rowDraft.ticker} onChange={e => setRowDraft(d => ({ ...d, ticker: e.target.value }))} placeholder="Ticker" />
                          <select className="bg-[#111B27] px-2 py-1 rounded" value={rowDraft.exchange} onChange={e => setRowDraft(d => ({ ...d, exchange: e.target.value }))}>
                            {Object.keys(YAHOO_SUFFIX).map(x => <option key={x} value={x}>{x}</option>)}
                          </select>
                          <select className="bg-[#111B27] px-2 py-1 rounded" value={rowDraft.currency} onChange={e => setRowDraft(d => ({ ...d, currency: e.target.value }))}>
                            {["INR", "USD", "OMR"].map(x => <option key={x} value={x}>{x}</option>)}
                          </select>
                          <input type="number" className="bg-[#111B27] px-2 py-1 rounded w-20" value={rowDraft.qty} onChange={e => setRowDraft(d => ({ ...d, qty: e.target.value }))} placeholder="Qty" />
                          <input type="number" className="bg-[#111B27] px-2 py-1 rounded w-24" value={rowDraft.avgBuy} onChange={e => setRowDraft(d => ({ ...d, avgBuy: e.target.value }))} placeholder="Avg Buy" />
                          <select className="bg-[#111B27] px-2 py-1 rounded" value={rowDraft.assetClass} onChange={e => setRowDraft(d => ({ ...d, assetClass: e.target.value }))}>
                            {ASSET_CLASSES.map(x => <option key={x} value={x}>{x}</option>)}
                          </select>
                          <button onClick={commitRowEdit} className="px-2 py-1 rounded font-bold" style={{ background: COLORS.green + "22", color: COLORS.green }}>✅ Save</button>
                          <button onClick={cancelRowEdit} className="px-2 py-1 rounded font-bold" style={{ background: COLORS.red + "22", color: COLORS.red }}>✖ Cancel</button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={h.id} className="border-t" style={{ borderColor: "#141F2E", borderLeft: h.ticker === "PLTR" && pltrPct > 15 ? `3px solid ${COLORS.amber}` : "none" }}>
                    <td className="p-1"><input type="checkbox" checked={selectedIds.has(h.id)} onChange={() => toggleSelect(h.id)} /></td>
                    <td className="p-1">{i + 1}</td>
                    <td className="p-1 cursor-pointer" onClick={() => startInlineEdit(h.id, "name", h.name)}>
                      {editingId === h.id && editDraft.field === "name" ? (
                        <input autoFocus className="bg-[#111B27] px-1 rounded w-full" value={editDraft.value}
                          onChange={e => setEditDraft(d => ({ ...d, value: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") commitInlineEdit(); if (e.key === "Escape") cancelInlineEdit(); }}
                          onBlur={commitInlineEdit} />
                      ) : (<>{h.name}{h.ticker === "PLTR" && pltrPct > 15 && <span className="ml-1"><Badge color={COLORS.amber} text="⚠ Concentrated" /></span>}</>)}
                    </td>
                    <td className="p-1 cursor-pointer" onClick={() => startInlineEdit(h.id, "ticker", h.ticker)}>
                      {editingId === h.id && editDraft.field === "ticker" ? (
                        <input autoFocus className="bg-[#111B27] px-1 rounded w-full" value={editDraft.value}
                          onChange={e => setEditDraft(d => ({ ...d, value: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") commitInlineEdit(); if (e.key === "Escape") cancelInlineEdit(); }}
                          onBlur={commitInlineEdit} />
                      ) : h.ticker}
                    </td>
                    <td className="p-1" style={{ color: COLORS.textSec }}>{h.exchange}</td>
                    <td className="p-1 text-right cursor-pointer" onClick={() => startInlineEdit(h.id, "qty", h.qty)}>
                      {editingId === h.id && editDraft.field === "qty" ? (
                        <input autoFocus type="number" className="bg-[#111B27] px-1 rounded w-16 text-right" value={editDraft.value}
                          onChange={e => setEditDraft(d => ({ ...d, value: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") commitInlineEdit(); if (e.key === "Escape") cancelInlineEdit(); }}
                          onBlur={commitInlineEdit} />
                      ) : h.qty}
                    </td>
                    <td className="p-1 text-right cursor-pointer" onClick={() => startInlineEdit(h.id, "avgBuy", h.avgBuy)}>
                      {editingId === h.id && editDraft.field === "avgBuy" ? (
                        <input autoFocus type="number" className="bg-[#111B27] px-1 rounded w-20 text-right" value={editDraft.value}
                          onChange={e => setEditDraft(d => ({ ...d, value: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") commitInlineEdit(); if (e.key === "Escape") cancelInlineEdit(); }}
                          onBlur={commitInlineEdit} />
                      ) : h.avgBuy.toFixed(2)}
                    </td>
                    <td className="p-1 text-right cursor-pointer" style={{ border: h.status === "ERROR" ? `1px solid ${COLORS.red}` : "none" }} onClick={() => setPriceOverrideId(h.id)}>
                      {priceOverrideId === h.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input autoFocus type="number" className="bg-[#111B27] px-1 rounded w-20 text-right"
                            defaultValue={manualPrices[h.id] ?? h.currentPrice}
                            onKeyDown={e => { if (e.key === "Enter") { setManualPriceVal(h.id, e.target.value); setPriceOverrideId(null); } if (e.key === "Escape") setPriceOverrideId(null); }}
                            onBlur={e => { setManualPriceVal(h.id, e.target.value); setPriceOverrideId(null); }} />
                          {manualPrices[h.id] !== undefined && <span className="cursor-pointer" style={{ color: COLORS.red }} onClick={(e) => { e.stopPropagation(); setManualPriceVal(h.id, ""); }}>✖</span>}
                        </div>
                      ) : h.currentPrice.toFixed(2)}
                    </td>
                    <td className="p-1"><Badge color={fmtStatusColor(h.status)} text={h.status === "FETCHING" ? "⟳" : h.status} /></td>
                    <td className="p-1 text-right font-semibold">{fmt(h.inrValue)}</td>
                    <td className="p-1 text-right" style={{ color: COLORS.textSec }}>{fmt(h.invested)}</td>
                    <td className="p-1 text-right" style={{ background: h.pnl >= 0 ? COLORS.lightGreen + "10" : COLORS.lightRed + "10", color: h.pnl >= 0 ? COLORS.green : COLORS.red }}>{fmt(h.pnl)}</td>
                    <td className="p-1 text-right" style={{ color: h.pnlPct >= 0 ? COLORS.green : COLORS.red }}>{h.pnlPct.toFixed(1)}%</td>
                    <td className="p-1 text-right" style={{ color: h.dayPct >= 0 ? COLORS.green : COLORS.red }}>{h.dayPct.toFixed(1)}%</td>
                    <td className="p-1 text-right" style={{ color: COLORS.textSec }}>{h.portPct.toFixed(1)}%</td>
                    <td className="p-1 text-center">
                      {deleteConfirmId === h.id ? (
                        <span className="flex gap-1 justify-center">
                          <button onClick={confirmDelete} style={{ color: COLORS.green }}>✅</button>
                          <button onClick={() => setDeleteConfirmId(null)} style={{ color: COLORS.red }}>✖</button>
                        </span>
                      ) : (
                        <span className="flex gap-2 justify-center">
                          <button onClick={() => startRowEdit(h)}>✏</button>
                          <button onClick={() => setDeleteConfirmId(h.id)}>🗑</button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {addingNew && (
                <tr style={{ background: "#0F1A2A" }}>
                  <td colSpan={16} className="p-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <input className="bg-[#111B27] px-2 py-1 rounded w-32" placeholder="Name" value={newDraft.name} onChange={e => setNewDraft(d => ({ ...d, name: e.target.value }))} />
                      <input className="bg-[#111B27] px-2 py-1 rounded w-24" placeholder="Ticker" value={newDraft.ticker} onChange={e => setNewDraft(d => ({ ...d, ticker: e.target.value }))} />
                      <select className="bg-[#111B27] px-2 py-1 rounded" value={newDraft.exchange} onChange={e => setNewDraft(d => ({ ...d, exchange: e.target.value }))}>
                        {Object.keys(YAHOO_SUFFIX).map(x => <option key={x} value={x}>{x}</option>)}
                      </select>
                      <select className="bg-[#111B27] px-2 py-1 rounded" value={newDraft.currency} onChange={e => setNewDraft(d => ({ ...d, currency: e.target.value }))}>
                        {["INR", "USD", "OMR"].map(x => <option key={x} value={x}>{x}</option>)}
                      </select>
                      <input type="number" className="bg-[#111B27] px-2 py-1 rounded w-20" placeholder="Qty" value={newDraft.qty} onChange={e => setNewDraft(d => ({ ...d, qty: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") commitAdd(); if (e.key === "Escape") setAddingNew(false); }} />
                      <input type="number" className="bg-[#111B27] px-2 py-1 rounded w-24" placeholder="Avg Buy" value={newDraft.avgBuy} onChange={e => setNewDraft(d => ({ ...d, avgBuy: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") commitAdd(); if (e.key === "Escape") setAddingNew(false); }} />
                      <select className="bg-[#111B27] px-2 py-1 rounded" value={newDraft.assetClass} onChange={e => setNewDraft(d => ({ ...d, assetClass: e.target.value }))}>
                        {ASSET_CLASSES.map(x => <option key={x} value={x}>{x}</option>)}
                      </select>
                      <button onClick={commitAdd} className="px-2 py-1 rounded font-bold" style={{ background: COLORS.green + "22", color: COLORS.green }}>✅ Add</button>
                      <button onClick={() => { setAddingNew(false); resetNewDraft(); }} className="px-2 py-1 rounded font-bold" style={{ background: COLORS.red + "22", color: COLORS.red }}>✖ Cancel</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <SectionTitle>Asset Allocation — Current vs Target</SectionTitle>
            <div className="flex flex-col gap-3">
              {ASSET_CLASSES.map(c => {
                const curPct = totalPortfolioINR ? (classTotals[c] / totalPortfolioINR) * 100 : 0;
                const target = assetTargets[c];
                const diff = curPct - target;
                const signal = Math.abs(diff) < 3 ? "◆ HOLD" : diff > 0 ? "▼ TRIM" : "▲ BUY";
                const signalColor = signal === "◆ HOLD" ? COLORS.textSec : signal === "▼ TRIM" ? COLORS.red : COLORS.green;
                return (
                  <div key={c}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>{c}</span>
                      <span className="flex items-center gap-2">
                        <span style={{ color: COLORS.textSec }}>{curPct.toFixed(1)}% / target</span>
                        <input type="number" className="bg-[#111B27] w-12 px-1 rounded text-right" value={target}
                          onChange={e => setAssetTargets(t => ({ ...t, [c]: Number(e.target.value) }))} />%
                        <Badge color={signalColor} text={signal} />
                      </span>
                    </div>
                    <ProgressBar val={curPct} max={100} color={COLORS.blue} />
                  </div>
                );
              })}
            </div>
            <div className="mt-3"><SectionTitle>Glide Path (equity → liquid as retirement nears)</SectionTitle><GlidePath years={yearsAccum} /></div>
          </Card>
          <div className="flex flex-col gap-3">
            <Card>
              <SectionTitle>Concentration Alerts</SectionTitle>
              <div className="flex flex-col gap-1">
                {enriched.filter(h => h.portPct > 15).length === 0 && <div className="text-[11px]" style={{ color: COLORS.textSec }}>No concentration alerts.</div>}
                {enriched.filter(h => h.portPct > 15).sort((a, b) => b.portPct - a.portPct).map(h => (
                  <div key={h.id} className="flex justify-between text-[11px]">
                    <span>{h.name} ({h.portPct.toFixed(1)}%)</span>
                    <Badge color={h.portPct > 25 ? COLORS.red : COLORS.amber} text={h.portPct > 25 ? "CRITICAL" : "HIGH"} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle>Currency Exposure</SectionTitle>
              {["INR", "USD", "OMR"].map(cur => (
                <div key={cur} className="mb-2">
                  <div className="flex justify-between text-[11px]"><span>{cur}</span><span>{totalPortfolioINR ? ((currencyExposure[cur] || 0) / totalPortfolioINR * 100).toFixed(1) : "0.0"}%</span></div>
                  <ProgressBar val={currencyExposure[cur] || 0} max={totalPortfolioINR || 1} color={cur === "INR" ? COLORS.blue : cur === "USD" ? COLORS.teal : COLORS.purple} />
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function renderScenarios() {
    const barData = scenarios.map(s => ({ age: `Age ${s.age}`, Projected: Math.round(s.corpus / 1e5) / 10, Required: Math.round(s.req / 1e5) / 10 }));
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {scenarios.map(s => (
            <Card key={s.age} className={retireAge === s.age ? "ring-2" : ""} style={{ borderColor: retireAge === s.age ? COLORS.blue : COLORS.border }}>
              <div className="flex justify-between items-start">
                <div className="text-sm font-bold">Age {s.age}</div>
                <Gauge score={s.score} size={64} />
              </div>
              <div className="text-[11px] flex flex-col gap-1 mt-1" style={{ color: COLORS.textSec }}>
                <div>Years to retire: {s.y}</div>
                <div>Projected: <span style={{ color: COLORS.text }}>{fmt(s.corpus)}</span></div>
                <div>Required: <span style={{ color: COLORS.text }}>{fmt(s.req)}</span></div>
                <div>{s.surp >= 0 ? "Surplus" : "Deficit"}: <span style={{ color: s.surp >= 0 ? COLORS.green : COLORS.red }}>{fmt(Math.abs(s.surp))}</span></div>
                <div>Monthly exp: {fmt(s.exp)}</div>
                <div>Safe wd/mo: {fmt(s.corpus * 0.04 / 12)}</div>
                <div>Liquid at retire: {fmt(s.liquid)}</div>
                <Badge color={COLORS.blue} text={s.age <= 50 ? "Lean FIRE" : s.age <= 53 ? "Full FIRE" : "Fat FIRE"} />
              </div>
              <button onClick={() => setRetireAge(s.age)} className="mt-2 w-full py-1 rounded text-xs font-bold"
                style={{ background: retireAge === s.age ? COLORS.blue : "#111B27", color: retireAge === s.age ? "#fff" : COLORS.textSec }}>
                {retireAge === s.age ? "Selected" : "Select"}
              </button>
            </Card>
          ))}
        </div>

        <Card>
          <SectionTitle>Corpus vs Required (₹L)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#141F2E" />
              <XAxis dataKey="age" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0C1422", border: "1px solid #192536", fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Projected" fill={COLORS.blue} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Required" fill="none" stroke={COLORS.amber} strokeWidth={2} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Trajectory Comparison — All Retirement Ages</SectionTitle>
          <MultiTrajectoryChart ret={returns} sip={sipAnnual} equityStart={equityINR} liquidStart={liquidINR} selectedAge={retireAge} />
        </Card>
      </div>
    );
  }

  function renderMonteCarlo() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { setMcRunning(true); setTimeout(() => { setMcResult(runMonteCarlo(mcSims)); setMcRunning(false); }, 50); }}
            disabled={mcRunning} className="px-3 py-1.5 rounded text-xs font-bold" style={{ background: COLORS.blue + "22", color: COLORS.blue }}>
            {mcRunning ? "⏳ Running…" : "▶ RUN"}
          </button>
          <select className="bg-[#111B27] px-2 py-1 rounded text-xs" value={mcSims} onChange={e => setMcSims(Number(e.target.value))}>
            {[500, 1000, 2000, 5000].map(n => <option key={n} value={n}>{n.toLocaleString()}</option>)}
          </select>
          <span className="text-[11px]" style={{ color: COLORS.textSec }}>
            {mcRunning ? "Running…" : mcResult ? `${pct(mcResult.rate)} success • ${mcSims.toLocaleString()} sims` : "—"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <KPI label="Success %" value={mcResult ? pct(mcResult.rate) : "…"} color={mcResult && mcResult.rate >= 0.8 ? COLORS.green : mcResult && mcResult.rate >= 0.65 ? COLORS.amber : COLORS.red} />
          <KPI label="Median Corpus" value={mcResult ? fmt(mcResult.p50) : "…"} />
          <KPI label="P10" value={mcResult ? fmt(mcResult.p10) : "…"} />
          <KPI label="P90" value={mcResult ? fmt(mcResult.p90) : "…"} />
          <KPI label="Best" value={mcResult ? fmt(mcResult.best) : "…"} color={COLORS.green} />
          <KPI label="Worst" value={mcResult ? fmt(mcResult.worst) : "…"} color={COLORS.red} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card><SectionTitle>Fan Chart</SectionTitle><FanChart mc={mcResult} /></Card>
          <Card><SectionTitle>Distribution</SectionTitle><Histogram mc={mcResult} /></Card>
        </div>

        <Card>
          <SectionTitle>Per-Age Success Probability (200-sim estimate)</SectionTitle>
          <div className="flex flex-col gap-3">
            {perAgeSuccess.map(r => (
              <div key={r.age}>
                <div className="flex justify-between text-[11px]"><span>Age {r.age}</span><span>{pct(r.rate)}</span></div>
                <ProgressBar val={r.rate} max={1} color={r.rate >= 0.8 ? COLORS.green : r.rate >= 0.65 ? COLORS.amber : COLORS.red} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Random Variables</SectionTitle>
          <ul className="text-[11px] list-disc list-inside flex flex-col gap-1" style={{ color: COLORS.textSec }}>
            <li>India/US equity returns: μ = {(returns * 100).toFixed(0)}%, σ = 10%</li>
            <li>Liquid fund: fixed 4% (deterministic)</li>
            <li>Inflation: μ = {(inflation * 100).toFixed(0)}%, σ = 1.5%</li>
            <li>SIP: constant ₹{(sipMonthly / 1000).toFixed(0)}K/mo (deterministic)</li>
            <li>Sequence-of-returns risk captured via independently randomized annual return draws</li>
          </ul>
        </Card>
      </div>
    );
  }

  function renderEducation() {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {Object.entries(EDU_OPTIONS).map(([key, d]) => (
            <Card key={key} className="cursor-pointer text-center" onClick={() => setEduKey(key)}
              style={{ borderColor: eduKey === key ? COLORS.blue : COLORS.border, background: eduKey === key ? "#0F1A2E" : COLORS.card }}>
              <div className="text-2xl">{d.flag}</div>
              <div className="text-xs font-bold mt-1">{key}</div>
              <div className="text-[11px]" style={{ color: COLORS.textSec }}>{fmt(d.cost)}</div>
            </Card>
          ))}
        </div>

        <Card>
          <SectionTitle>Calculation — {eduData.flag} {eduKey}</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
            <div><div style={{ color: COLORS.textSec }}>Cost today</div><div className="font-bold">{fmt(eduData.cost)}</div></div>
            <div><div style={{ color: COLORS.textSec }}>Education inflation</div><div className="font-bold">8.0%</div></div>
            <div><div style={{ color: COLORS.textSec }}>Years until college</div><div className="font-bold">{EDU_YEARS}</div></div>
            <div><div style={{ color: COLORS.textSec }}>Inflated cost at entry</div><div className="font-bold">{fmt(eduInflated)}</div></div>
            <div><div style={{ color: COLORS.textSec }}>Liquid fund today</div><div className="font-bold">{fmt(liquidINR)}</div></div>
            <div><div style={{ color: COLORS.textSec }}>Liquid at college start</div><div className="font-bold">{fmt(eduLiqGrown)}</div></div>
            <div><div style={{ color: COLORS.textSec }}>Gap</div><div className="font-bold" style={{ color: eduGap > 0 ? COLORS.red : COLORS.green }}>{eduGap > 0 ? fmt(eduGap) : "None — Fully Funded"}</div></div>
            <div><div style={{ color: COLORS.textSec }}>SIP needed (12% return)</div><div className="font-bold">₹{Math.round(eduSIP / 1000)}K/mo</div></div>
          </div>
          <div className="mt-2"><div className="text-[11px]" style={{ color: COLORS.textSec }}>Funding ratio: {pct(eduRatio)}</div><ProgressBar val={eduRatio} color={eduRatio >= 1 ? COLORS.green : eduRatio >= 0.7 ? COLORS.amber : COLORS.red} height={7} /></div>
          <div className="mt-3 py-2 rounded text-center font-bold text-sm" style={{ background: (eduRatio >= 1 ? COLORS.green : eduRatio >= 0.7 ? COLORS.amber : COLORS.red) + "22", color: eduRatio >= 1 ? COLORS.green : eduRatio >= 0.7 ? COLORS.amber : COLORS.red }}>
            {eduRatio >= 1 ? "✅ FULLY FUNDED" : eduRatio >= 0.7 ? "⚠ PARTIALLY FUNDED" : "❌ FUNDING GAP"}
          </div>
        </Card>

        <Card>
          <SectionTitle>Timeline</SectionTitle>
          <EducationTimeline retireAge={retireAge} lifeExp={lifeExp} eduOverlap={eduOverlap} />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card>
            <div className="text-xs font-bold mb-1">Option A: Liquid Fund</div>
            <div className="text-[11px]" style={{ color: COLORS.textSec }}>Funding: {pct(eduRatio)}</div>
            <div className="text-[11px]" style={{ color: COLORS.textSec }}>Projected at college: {fmt(eduLiqGrown)}</div>
          </Card>
          <Card>
            <div className="text-xs font-bold mb-1">Option B: Dedicated SIP</div>
            <div className="text-[11px]" style={{ color: COLORS.textSec }}>₹{Math.round(eduSIP / 1000)}K/mo needed at 12% return</div>
          </Card>
          <Card>
            <div className="text-xs font-bold mb-1">Option C: US Equity Hedge</div>
            <div className="text-[11px]" style={{ color: COLORS.textSec }}>{eduKey !== "India" ? "Natural currency hedge for abroad education — USD holdings appreciate if INR weakens" : "Less relevant for India-based education"}</div>
          </Card>
          <Card>
            <div className="text-xs font-bold mb-1">Option D: Sukanya Samriddhi</div>
            <div className="text-[11px]" style={{ color: COLORS.textSec }}>8.2% guaranteed, tax-free, max ₹1.5L/yr contribution</div>
          </Card>
        </div>
      </div>
    );
  }

  function renderCashFlow() {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <SectionTitle>Monthly Flow Summary</SectionTitle>
          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between"><span>Salary</span><span>{omrFmt(2500)} | {fmt(salaryMonthlyINR)}/mo</span></div>
            <div className="flex justify-between"><span>Expenses</span><span>{omrFmt(1400)} | {fmt(expenseMonthlyINR)}/mo</span></div>
            <div className="flex justify-between"><span>SIP</span><span>{omrFmt(sipMonthly / FX.OMR_INR)} | ₹{(sipMonthly / 1000).toFixed(0)}K/mo</span></div>
            <div className="flex justify-between"><span>Buffer</span><span>{omrFmt(100)} | {fmt(bufferINR)}</span></div>
            <div className="flex justify-between font-bold"><span>Savings Rate</span><span>{savingsRate.toFixed(1)}%</span></div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Salary Growth Assumption</SectionTitle>
          <div className="flex gap-2 mb-3">
            {[["0.03", "3% Conservative"], ["0.05", "5% Base"], ["0.08", "8% Aggressive"]].map(([v, l]) => (
              <button key={v} onClick={() => setSalGrowth(Number(v))} className="px-2.5 py-1 rounded text-[11px] font-semibold"
                style={{ background: salGrowth === Number(v) ? COLORS.blue : "#111B27", color: salGrowth === Number(v) ? "#fff" : COLORS.textSec }}>{l}</button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            {salaryAtAge.map(s => (
              <div key={s.age}><div style={{ color: COLORS.textSec }}>Age {s.age}</div><div className="font-bold">{fmt(s.income)}/mo</div></div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>SIP Sensitivity — Projected Corpus at Age {retireAge}</SectionTitle>
          <table className="w-full text-[11px]">
            <thead><tr style={{ color: COLORS.textSec }}><th className="text-left p-1">Monthly SIP</th><th className="text-right p-1">Projected Corpus</th></tr></thead>
            <tbody>
              {sipSensitivity.map(s => (
                <tr key={s.sip} style={{ background: s.current ? "#0F1A2E" : "transparent" }}>
                  <td className="p-1">₹{(s.sip / 1000).toFixed(0)}K {s.current && <Badge color={COLORS.blue} text="Current" />}</td>
                  <td className="p-1 text-right font-bold">{fmt(s.corpus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fiMilestones.map(m => (
            <Card key={m.key}>
              <div className="text-xs font-bold">{m.key}</div>
              <div className="text-[11px]" style={{ color: COLORS.textSec }}>~Age {m.age ?? "70+"}</div>
              <div className="text-[11px]" style={{ color: COLORS.textSec }}>Target: {fmt(m.target)}</div>
            </Card>
          ))}
        </div>

        <Card>
          <SectionTitle>Annual Cash Flow Projection</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cashFlowYears.map(y => ({ age: `Age ${y.age}`, Income: Math.round(y.income / 1e5) / 10, Expense: Math.round(y.expense / 1e5) / 10, SIP: Math.round(y.sip / 1e5) / 10, Surplus: Math.round(y.surplus / 1e5) / 10 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#141F2E" />
              <XAxis dataKey="age" stroke="#94A3B8" fontSize={10} />
              <YAxis stroke="#94A3B8" fontSize={10} />
              <Tooltip contentStyle={{ background: "#0C1422", border: "1px solid #192536", fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Income" fill={COLORS.green} radius={[2, 2, 0, 0]} />
              <Bar dataKey="Expense" fill={COLORS.red} radius={[2, 2, 0, 0]} />
              <Bar dataKey="SIP" fill={COLORS.blue} radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="Surplus" stroke={COLORS.amber} strokeWidth={2} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  }

  function renderStressTest() {
    const combined = computeStress(stressActive);
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STRESS_SCENARIOS.map(s => {
            const r = computeStress(new Set([s.id]));
            const active = stressActive.has(s.id);
            return (
              <Card key={s.id} className="cursor-pointer" onClick={() => toggleStress(s.id)}
                style={{ borderColor: active ? COLORS.blue : COLORS.border, background: active ? "#0F1A2E" : COLORS.card }}>
                <div className="text-xs font-bold">{s.label}</div>
                <div className="text-[11px] mt-1" style={{ color: r.delta < 0 ? COLORS.red : COLORS.green }}>Δ {fmt(r.delta)}</div>
                <div className="text-[11px]" style={{ color: COLORS.textSec }}>Post-stress: {fmt(r.corpus)}</div>
                <div className="mt-1"><Badge color={r.ok ? COLORS.green : COLORS.red} text={r.ok ? "PASS" : "FAIL"} /></div>
              </Card>
            );
          })}
        </div>

        {stressActive.size > 0 && (
          <Card>
            <SectionTitle>{stressActive.size > 1 ? "Combined Stress Impact" : "Scenario Detail"}</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px] mb-3">
              <div><div style={{ color: COLORS.textSec }}>Normal Corpus</div><div className="font-bold">{fmt(projected.total)}</div></div>
              <div><div style={{ color: COLORS.textSec }}>Stressed Corpus</div><div className="font-bold" style={{ color: combined.ok ? COLORS.text : COLORS.red }}>{fmt(combined.corpus)}</div></div>
              <div><div style={{ color: COLORS.textSec }}>Required Corpus</div><div className="font-bold">{fmt(combined.req)}</div></div>
              <div><div style={{ color: COLORS.textSec }}>Delta</div><div className="font-bold" style={{ color: combined.delta < 0 ? COLORS.red : COLORS.green }}>{fmt(combined.delta)} ({(combined.delta / projected.total * 100).toFixed(1)}%)</div></div>
              <div><div style={{ color: COLORS.textSec }}>Status</div><Badge color={combined.ok ? COLORS.green : COLORS.red} text={combined.ok ? "PASS" : "FAIL"} /></div>
            </div>
            <div className="text-[11px]" style={{ color: COLORS.textSec }}>
              {combined.ok ? "Plan remains resilient under this stress combination." : "Consider raising SIP, delaying retirement, or rebuilding a larger liquid buffer to absorb this scenario."}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[{ name: "Normal", val: Math.round(projected.total / 1e5) / 10 }, { name: "Stressed", val: Math.round(combined.corpus / 1e5) / 10 }, { name: "Required", val: Math.round(combined.req / 1e5) / 10 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#141F2E" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0C1422", border: "1px solid #192536", fontSize: 11 }} />
                <Bar dataKey="val" radius={[3, 3, 0, 0]}>
                  <Cell fill={COLORS.blue} /><Cell fill={combined.ok ? COLORS.green : COLORS.red} /><Cell fill={COLORS.amber} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    );
  }

  function renderOptimizer() {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <SectionTitle>Required SIP by Retirement Age</SectionTitle>
          <table className="w-full text-[11px]">
            <thead><tr style={{ color: COLORS.textSec }}><th className="text-left p-1">Age</th><th className="text-right p-1">Required SIP/mo</th><th className="text-right p-1">Current SIP/mo</th><th className="text-right p-1">Status</th></tr></thead>
            <tbody>
              {optimizerScenarios.map(o => {
                const gap = o.reqSipMonthly - sipMonthly;
                return (
                  <tr key={o.age}>
                    <td className="p-1">{o.age}</td>
                    <td className="p-1 text-right">₹{Math.round(o.reqSipMonthly / 1000)}K</td>
                    <td className="p-1 text-right">₹{(sipMonthly / 1000).toFixed(0)}K</td>
                    <td className="p-1 text-right"><Badge color={gap <= 0 ? COLORS.green : COLORS.amber} text={gap <= 0 ? "On Track" : `+₹${Math.round(gap / 1000)}K more`} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Return Sensitivity</SectionTitle>
          <div className="flex flex-col gap-2">
            {returnSensitivity.map(r => (
              <div key={r.r}>
                <div className="flex justify-between text-[11px]"><span>{(r.r * 100).toFixed(0)}% return {r.r === returns && <Badge color={COLORS.blue} text="Current" />}</span><span className="font-bold">{fmt(r.corpus)}</span></div>
                <ProgressBar val={r.corpus} max={Math.max(...returnSensitivity.map(x => x.corpus))} color={r.r === returns ? COLORS.blue : COLORS.textMuted} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Withdrawal Strategy Comparison</SectionTitle>
          <table className="w-full text-[11px]">
            <thead><tr style={{ color: COLORS.textSec }}><th className="text-left p-1">Strategy</th><th className="text-right p-1">Required Corpus</th><th className="text-right p-1">Surplus/Deficit</th></tr></thead>
            <tbody>
              {wdComparison.map(w => (
                <tr key={w.key} style={{ background: withdrawal === w.key ? "#0F1A2E" : "transparent" }}>
                  <td className="p-1">{w.label} {withdrawal === w.key && <Badge color={COLORS.blue} text="Current" />}</td>
                  <td className="p-1 text-right">{fmt(w.req)}</td>
                  <td className="p-1 text-right" style={{ color: w.surplus >= 0 ? COLORS.green : COLORS.red }}>{fmt(w.surplus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Optimal Retirement Age Score</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={scenarios.map(s => ({ age: `Age ${s.age}`, score: s.score }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#141F2E" />
              <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
              <YAxis type="category" dataKey="age" stroke="#94A3B8" fontSize={11} width={60} />
              <Tooltip contentStyle={{ background: "#0C1422", border: "1px solid #192536", fontSize: 11 }} />
              <Bar dataKey="score" radius={[0, 3, 3, 0]}>
                {scenarios.map((s, i) => <Cell key={i} fill={s.score >= 75 ? COLORS.green : s.score >= 50 ? COLORS.amber : COLORS.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Top 10 Actions Ranked by Impact</SectionTitle>
          <div className="flex flex-col gap-2">
            {topActions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ background: "#111B27", color: COLORS.textSec }}>{i + 1}</span>
                <span className="flex-1" style={{ color: COLORS.text }}>{a.text}</span>
                <Badge color={a.impact === "Critical" ? COLORS.red : a.impact === "High" ? COLORS.amber : a.impact === "Medium" ? COLORS.blue : COLORS.textSec} text={a.impact} />
                {a.delta !== 0 && <Badge color={a.delta < 0 ? COLORS.red : COLORS.green} text={fmt(a.delta)} />}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const yearPlanRows = useMemo(() => {
    const rows = [];
    let corpus = totalPortfolioINR;
    const eduAge = CURR_AGE + EDU_YEARS;
    let totalSIP = 0, totalWithdrawal = 0;
    for (let age = CURR_AGE; age <= lifeExp; age++) {
      const startCorpus = corpus;
      let phase, sip = 0, ret, growth, eduCol = "", draw = 0;
      if (age < retireAge) {
        phase = "Accumulation"; sip = sipAnnual; ret = returns;
        growth = startCorpus * ret;
        corpus = startCorpus + growth + sip;
      } else if (age === retireAge) {
        phase = "◆ RETIREMENT"; ret = returns;
        growth = startCorpus * ret;
        corpus = startCorpus + growth;
      } else {
        phase = "Retirement"; ret = POST_RETIRE_RETURN;
        draw = expAtRetire * 12 * Math.pow(1 + inflation, age - retireAge - 1);
        growth = startCorpus * ret;
        corpus = startCorpus + growth - draw;
        totalWithdrawal += draw;
      }
      if (age === eduAge) {
        eduCol = "🎓 Education";
        corpus -= eduInflated;
      }
      totalSIP += sip;
      rows.push({ year: 2026 + (age - CURR_AGE), age, phase, startCorpus, sip, ret, growth, eduCol, draw, endCorpus: corpus, depleted: corpus < 0 });
    }
    return { rows, totalSIP, totalWithdrawal, finalCorpus: corpus };
  }, [totalPortfolioINR, retireAge, lifeExp, sipAnnual, returns, expAtRetire, inflation, eduInflated]);

  function renderYearPlan() {
    return (
      <Card className="overflow-x-auto">
        <SectionTitle>Year-by-Year Projection</SectionTitle>
        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          <table className="w-full text-[11px]">
            <thead style={{ position: "sticky", top: 0, background: COLORS.card, zIndex: 1 }}>
              <tr style={{ color: COLORS.textSec }}>
                <th className="p-1 text-left">Year</th><th className="p-1 text-left">Age</th><th className="p-1 text-left">Phase</th>
                <th className="p-1 text-right">Starting Corpus</th><th className="p-1 text-right">Annual SIP</th><th className="p-1 text-right">Return%</th>
                <th className="p-1 text-right">Growth</th><th className="p-1 text-left">Education</th><th className="p-1 text-right">Retirement Draw</th>
                <th className="p-1 text-right">Ending Corpus</th>
              </tr>
            </thead>
            <tbody>
              {yearPlanRows.rows.map(r => (
                <tr key={r.age} style={{ background: r.depleted ? COLORS.red + "22" : r.phase === "◆ RETIREMENT" ? "#0F1A2E" : "transparent" }}>
                  <td className="p-1">{r.year}</td><td className="p-1">{r.age}</td>
                  <td className="p-1 font-semibold" style={{ color: r.phase === "◆ RETIREMENT" ? COLORS.blue : COLORS.text }}>{r.phase}</td>
                  <td className="p-1 text-right">{fmt(r.startCorpus)}</td>
                  <td className="p-1 text-right">{r.sip ? fmt(r.sip) : "—"}</td>
                  <td className="p-1 text-right">{(r.ret * 100).toFixed(1)}%</td>
                  <td className="p-1 text-right" style={{ color: r.growth >= 0 ? COLORS.green : COLORS.red }}>{fmt(r.growth)}</td>
                  <td className="p-1" style={{ color: COLORS.amber }}>{r.eduCol}</td>
                  <td className="p-1 text-right">{r.draw ? fmt(r.draw) : "—"}</td>
                  <td className="p-1 text-right font-bold" style={{ color: r.depleted ? COLORS.red : COLORS.text }}>{fmt(r.endCorpus)}{r.depleted ? " ⚠ Depleted" : ""}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t" style={{ borderColor: COLORS.border }}>
                <td className="p-1" colSpan={4}>Totals</td>
                <td className="p-1 text-right">{fmt(yearPlanRows.totalSIP)}</td>
                <td className="p-1" colSpan={3}></td>
                <td className="p-1 text-right">{fmt(yearPlanRows.totalWithdrawal)}</td>
                <td className="p-1 text-right">{fmt(yearPlanRows.finalCorpus)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    );
  }

  /* ============================================================
     TAB DEFINITIONS
     ============================================================ */
  const TABS = [
    { key: "exec", label: "Executive", render: renderExec },
    { key: "portfolio", label: "Portfolio", render: renderPortfolio },
    { key: "scenarios", label: "Scenarios", render: renderScenarios },
    { key: "mc", label: "Monte Carlo", render: renderMonteCarlo },
    { key: "edu", label: "Education", render: renderEducation },
    { key: "cash", label: "Cash Flow", render: renderCashFlow },
    { key: "stress", label: "Stress Test", render: renderStressTest },
    { key: "opt", label: "Optimizer", render: renderOptimizer },
    { key: "year", label: "Year Plan", render: renderYearPlan },
  ];

  /* ============================================================
     HEADER STATUS PILLS
     ============================================================ */
  const onTrack = surplus > 0;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'DM Sans','Inter','Segoe UI',sans-serif", color: COLORS.text }} className="pb-10">
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#0B1220,#0F1A2E)", borderBottom: `1px solid ${COLORS.border}` }} className="px-4 py-3 sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold flex items-center gap-2">⬡ RETIREMENT INTELLIGENCE PLATFORM</div>
            <div className="text-[10px]" style={{ color: COLORS.textSec }}>Live data · Muscat → India · Age {CURR_AGE} → FI</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge color={COLORS.blue} text={`Age${retireAge}`} />
            <Badge color={COLORS.teal} text={`${(returns * 100).toFixed(0)}%ret`} />
            <Badge color={COLORS.amber} text={`${(inflation * 100).toFixed(0)}%inf`} />
            <Badge color={COLORS.purple} text={`Life${lifeExp}`} />
            <Badge color={onTrack ? COLORS.green : COLORS.red} text={onTrack ? "✓ On Track" : "⚠ Review"} />
            <Badge color={COLORS.blue} text={fmt(projected.total) + " proj"} />
          </div>
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div style={{ background: COLORS.controlBg, borderBottom: `1px solid ${COLORS.border}` }} className="px-4 py-3 sticky top-[52px] z-10 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] mr-1" style={{ color: COLORS.textSec }}>Retire Age</span>
            {RETIRE_AGES.map(a => (
              <button key={a} onClick={() => setRetireAge(a)} className="px-2 py-1 rounded text-[11px] font-bold"
                style={{ background: retireAge === a ? COLORS.blue : "#111B27", color: retireAge === a ? "#fff" : COLORS.textSec }}>{a}</button>
            ))}
          </div>
          <select className="bg-[#111B27] px-2 py-1 rounded text-[11px]" value={inflation} onChange={e => setInflation(Number(e.target.value))}>
            <option value={0.05}>Optimistic 5%</option><option value={0.06}>Base 6%</option><option value={0.07}>Conservative 7%</option>
          </select>
          <select className="bg-[#111B27] px-2 py-1 rounded text-[11px]" value={returns} onChange={e => setReturns(Number(e.target.value))}>
            <option value={0.08}>Conservative 8%</option><option value={0.10}>Base 10%</option><option value={0.12}>Aggressive 12%</option>
          </select>
          <select className="bg-[#111B27] px-2 py-1 rounded text-[11px]" value={lifeExp} onChange={e => setLifeExp(Number(e.target.value))}>
            <option value={80}>Age 80</option><option value={85}>Age 85</option><option value={90}>Age 90</option><option value={95}>Age 95</option>
          </select>
          <select className="bg-[#111B27] px-2 py-1 rounded text-[11px]" value={withdrawal} onChange={e => setWithdrawal(e.target.value)}>
            <option value="3.5pct">3.5% Rule</option><option value="4pct">4% Rule</option><option value="dynamic">Dynamic 3.8%</option><option value="bucket">Bucket 25×</option>
          </select>
          <select className="bg-[#111B27] px-2 py-1 rounded text-[11px]" value={eduKey} onChange={e => setEduKey(e.target.value)}>
            {Object.entries(EDU_OPTIONS).map(([k, d]) => <option key={k} value={k}>{d.flag} {k}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-0.5 min-w-[220px]">
            <span className="text-[10px]" style={{ color: COLORS.textSec }}>Retire Expense: <b style={{ color: COLORS.text }}>₹{(monthlyExp / 1000).toFixed(0)}K/mo</b></span>
            <input type="range" min={50000} max={300000} step={5000} value={monthlyExp} onChange={e => setMonthlyExp(Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-[220px]">
            <span className="text-[10px]" style={{ color: COLORS.textSec }}>Monthly SIP: <b style={{ color: COLORS.text }}>₹{(sipMonthly / 1000).toFixed(0)}K/mo</b></span>
            <input type="range" min={50000} max={500000} step={5000} value={sipMonthly} onChange={e => setSipMonthly(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ background: COLORS.tabBg, borderBottom: `1px solid ${COLORS.border}` }} className="px-2 flex gap-1 overflow-x-auto sticky top-[112px] z-10">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className="px-3 py-2 text-[12px] font-semibold whitespace-nowrap"
            style={{ color: activeTab === t.key ? COLORS.blue : COLORS.textSec, borderBottom: activeTab === t.key ? `2px solid ${COLORS.blue}` : "2px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="p-4">
        {TABS.find(t => t.key === activeTab)?.render()}
      </div>
    </div>
  );
}
