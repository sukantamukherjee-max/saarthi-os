// Saarthi — General Audience Retirement Planning App
// Built on retirement_dashboard.jsx baseline
// Zero hardcoded personal values — all from wizard inputs

import React, { useState, useEffect, useMemo, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const LIQUID_RATE = 0.04;
const EQUITY_SIGMA = 0.10;
const INFL_SIGMA = 0.015;

const CURRENCIES = ["INR", "OMR", "USD", "GBP", "CAD", "AUD", "EUR"];
const DEFAULT_FX = { INR:1, OMR:230, USD:83.5, GBP:105, CAD:61, AUD:54, EUR:88 };

const ASSET_TYPES = [
  { id:"indian_equity",  label:"Indian Equity / Stocks" },
  { id:"indian_bank",    label:"Indian Bank / FD / Savings" },
  { id:"overseas_stock", label:"Overseas Stocks" },
  { id:"overseas_bank",  label:"Overseas Bank / Savings" },
  { id:"crypto",         label:"Crypto" },
  { id:"liquid_fund",    label:"Liquid / Debt Funds" },
  { id:"real_estate",    label:"Real Estate / Land" },
  { id:"gold",           label:"Gold / Jewellery" },
  { id:"ppf_epf_nps",    label:"PPF / EPF / NPS" },
  { id:"fd",             label:"Fixed Deposits" },
  { id:"other",          label:"Other Assets" },
];

const EDU_DESTS = [
  { label:"India (Tier 1)", cost:1500000 },
  { label:"India (Tier 2)", cost:800000 },
  { label:"USA",            cost:5000000 },
  { label:"UK",             cost:4000000 },
  { label:"Canada",         cost:3500000 },
  { label:"Australia",      cost:3500000 },
  { label:"Singapore",      cost:4000000 },
  { label:"Other Overseas", cost:3000000 },
];

const WITHDRAWAL_RULES = [
  { id:"4pct",    label:"4% Rule",     rate:0.04 },
  { id:"3_5pct",  label:"3.5% Rule",   rate:0.035 },
  { id:"dynamic", label:"Dynamic (3.8%)", rate:0.038 },
  { id:"bucket",  label:"Bucket (25x)", rate:0.04 },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app:    { minHeight:"100vh", background:"#070B12", color:"#E2E8F0", fontFamily:"'Inter',sans-serif", fontSize:14 },
  card:   { background:"#0C1422", borderRadius:12, border:"1px solid #1E2D4A", padding:20, marginBottom:16 },
  h1:     { fontSize:28, fontWeight:700, color:"#F8FAFC", margin:0 },
  h2:     { fontSize:20, fontWeight:600, color:"#F8FAFC", margin:"0 0 16px" },
  h3:     { fontSize:16, fontWeight:600, color:"#CBD5E1", margin:"0 0 12px" },
  label:  { display:"block", fontSize:12, color:"#94A3B8", marginBottom:4, fontWeight:500 },
  input:  { width:"100%", background:"#0F1927", border:"1px solid #1E3A5F", borderRadius:8,
            color:"#E2E8F0", padding:"8px 12px", fontSize:14, boxSizing:"border-box" },
  select: { width:"100%", background:"#0F1927", border:"1px solid #1E3A5F", borderRadius:8,
            color:"#E2E8F0", padding:"8px 12px", fontSize:14, boxSizing:"border-box" },
  btn:    { padding:"10px 24px", borderRadius:8, border:"none", cursor:"pointer",
            fontSize:14, fontWeight:600, transition:"opacity 0.2s" },
  btnPrimary: { background:"#3B82F6", color:"#fff" },
  btnSecondary: { background:"#1E2D4A", color:"#94A3B8" },
  btnGreen: { background:"#22C55E", color:"#fff" },
  btnSmall: { padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer",
              fontSize:12, fontWeight:600 },
  row:    { display:"flex", gap:12, alignItems:"flex-start" },
  col:    { flex:1 },
  grid2:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  grid3:  { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 },
  chip:   { display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11,
            fontWeight:600, marginRight:6 },
  blue:   "#3B82F6", green:"#22C55E", amber:"#F59E0B", red:"#EF4444",
  teal:   "#14B8A6", purple:"#A78BFA",
  divider:{ borderTop:"1px solid #1E2D4A", margin:"16px 0" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v, dec=0) => isNaN(v) ? "0" : Number(v).toLocaleString("en-IN", { maximumFractionDigits:dec });
const fmtCr = v => { const cr = v/1e7; return cr>=1 ? `₹${fmt(cr,2)} Cr` : `₹${fmt(v/1e5,2)} L`; };

function convertToINR(val, currency, FX) {
  const rate = FX[currency] ?? 1;
  return (parseFloat(val)||0) * rate;
}

function calcEMI(principal, annualRate, tenureYears) {
  if (!principal || !annualRate || !tenureYears) return 0;
  const r = annualRate / 12 / 100;
  const n = tenureYears * 12;
  if (r === 0) return principal / n;
  return principal * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
}

// ─── Financial Model (adapted from baseline) ──────────────────────────────────
function project(totalINR, liquidINR, ret, sipMonthly, years) {
  let eq = totalINR - liquidINR;
  let liq = liquidINR;
  for (let i=0; i<years; i++) {
    eq  = eq*(1+ret) + sipMonthly*12;
    liq = liq*(1+LIQUID_RATE);
  }
  return { total:eq+liq, equity:eq, liquid:liq };
}

function needCorpus(monthlyExp, rule) {
  const rates = { "4pct":0.04, "3_5pct":0.035, "dynamic":0.038, "bucket":0.04 };
  return (monthlyExp*12) / (rates[rule]||0.04);
}

function runMC(totalINR, liquidINR, sipMonthly, years, retYears, monthlyExp, n=1000) {
  let success=0, trails=[];
  for (let t=0; t<n; t++) {
    let eq=totalINR-liquidINR, liq=liquidINR, ok=true;
    // Accumulation
    for (let i=0; i<years; i++) {
      const u1=Math.random(),u2=Math.random();
      const ret = 0.12 + EQUITY_SIGMA*Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
      eq = eq*(1+ret) + sipMonthly*12;
      liq = liq*(1+LIQUID_RATE);
    }
    // Distribution
    let corpus = eq+liq;
    for (let i=0; i<retYears; i++) {
      const u1=Math.random(),u2=Math.random();
      const infl = 0.06 + INFL_SIGMA*Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
      corpus -= monthlyExp*12*(1+infl);
      corpus *= 1.07;
      if (corpus<0) { ok=false; break; }
    }
    if (ok) success++;
    trails.push(corpus);
  }
  trails.sort((a,b)=>a-b);
  return {
    successRate: success/n,
    p10: trails[Math.floor(n*0.10)],
    p50: trails[Math.floor(n*0.50)],
    p90: trails[Math.floor(n*0.90)],
    trails,
  };
}

function calcChildGoals(children, yearsToRetire, inflationRate=0.08) {
  return children.map(c => {
    const goals = [];
    const yearsToEdu = Math.max(0, 18 - (c.age||0));
    if (c.planEducation) {
      const futureCost = (c.eduCostToday||1500000) * Math.pow(1+inflationRate, yearsToEdu);
      const funded = convertToINR(c.eduFundAvailable||0, "INR", DEFAULT_FX);
      goals.push({ type:"Education", years:yearsToEdu, cost:futureCost, funded, gap:Math.max(0,futureCost-funded) });
    }
    if (c.planMarriage) {
      const mrgAge = c.gender==="Daughter" ? (c.marriageAge||25) : (c.marriageAge||28);
      const yearsToMrg = Math.max(0, mrgAge - (c.age||0));
      const mrgCost = (c.marriageBudget||3000000) * Math.pow(1+(c.marriageInflation||0.08), yearsToMrg);
      const mrgFunded = c.mrgFundAvailable||0;
      goals.push({ type:"Marriage", years:yearsToMrg, cost:mrgCost, funded:mrgFunded, gap:Math.max(0,mrgCost-mrgFunded) });
    }
    return { ...c, goals };
  });
}

// ─── SVG Components ───────────────────────────────────────────────────────────
function Gauge({ value, max=100, color="#3B82F6", size=140, label }) {
  const pct = Math.min(1, (value||0)/max);
  const angle = pct * 180 - 90;
  const r = 50, cx=70, cy=75;
  const toXY = (deg, rr) => ({
    x: cx + rr*Math.cos(deg*Math.PI/180),
    y: cy + rr*Math.sin(deg*Math.PI/180),
  });
  const start = toXY(-180, r), end = toXY(angle-90, r);
  const largeArc = pct > 0.5 ? 1 : 0;
  return (
    <svg width={size} height={size*0.6} viewBox="0 0 140 80">
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#1E2D4A" strokeWidth={10}/>
      {pct>0 && <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
        fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"/>}
      <text x={cx} y={cy-8} textAnchor="middle" fill="#F8FAFC" fontSize={18} fontWeight={700}>
        {Math.round(value)}%
      </text>
      {label && <text x={cx} y={cy+8} textAnchor="middle" fill="#94A3B8" fontSize={10}>{label}</text>}
    </svg>
  );
}

function Bar({ data, height=160, colors }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d=>Math.abs(d.value)));
  const w = 100/data.length;
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      {data.map((d,i) => {
        const h = max>0 ? (Math.abs(d.value)/max)*(height-20) : 0;
        const color = colors?.[i] || (d.value>=0 ? S.green : S.red);
        return (
          <g key={i}>
            <rect x={i*w+w*0.1} y={height-20-h} width={w*0.8} height={h} fill={color} rx={2}/>
            <text x={i*w+w/2} y={height-4} textAnchor="middle" fill="#94A3B8" fontSize={7}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function FanChart({ trails=[], years, height=160 }) {
  if (!trails.length || !years) return null;
  const sorted = [...trails].sort((a,b)=>a-b);
  const n = sorted.length;
  const p10 = sorted[Math.floor(n*0.1)], p90=sorted[Math.floor(n*0.9)];
  const maxV = p90*1.1, pts=20;
  const xs = Array.from({length:pts},(_,i)=>(i/(pts-1))*100);
  const ys = Array.from({length:pts},(_,i)=>{
    const frac = i/(pts-1);
    return height - (frac * (p90/maxV)) * (height-10);
  });
  return (
    <svg width="100%" height={height}>
      <polygon points={xs.map((x,i)=>`${x},${ys[i]}`).join(" ")+" "+
        xs.slice().reverse().map((x,i)=>`${x},${height-(i/(pts-1))*(p10/maxV)*(height-10)}`).join(" ")}
        fill={S.blue} opacity={0.15}/>
      <polyline points={xs.map((x,i)=>`${x},${ys[i]}`).join(" ")} fill="none" stroke={S.blue} strokeWidth={1.5}/>
      <text x={98} y={ys[pts-1]} textAnchor="end" fill={S.blue} fontSize={9}>{fmtCr(p90)}</text>
      <text x={98} y={height-(p10/maxV)*(height-10)} textAnchor="end" fill={S.amber} fontSize={9}>{fmtCr(p10)}</text>
    </svg>
  );
}

// ─── Wizard Progress Bar ──────────────────────────────────────────────────────
function WizardProgress({ step, total=6 }) {
  const steps = ["Profile","Income","Family","Portfolio","Housing","Retirement"];
  return (
    <div style={{ padding:"20px 24px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        {steps.map((s,i) => (
          <div key={i} style={{ textAlign:"center", flex:1 }}>
            <div style={{
              width:28, height:28, borderRadius:"50%", margin:"0 auto 4px",
              background: i+1<step ? S.green : i+1===step ? S.blue : "#1E2D4A",
              border: `2px solid ${i+1<=step ? (i+1<step?S.green:S.blue) : "#1E2D4A"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:700, color:"#fff",
            }}>{i+1<step ? "✓" : i+1}</div>
            <div style={{ fontSize:10, color: i+1===step ? S.blue : "#64748B" }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ height:4, background:"#1E2D4A", borderRadius:2, marginBottom:24 }}>
        <div style={{ height:"100%", width:`${((step-1)/5)*100}%`, background:S.blue, borderRadius:2, transition:"width 0.3s" }}/>
      </div>
    </div>
  );
}

// ─── Field Helpers ────────────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={S.label}>{label}</label>
      {children}
      {hint && <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>{hint}</div>}
    </div>
  );
}

function CurrencyAmount({ label, value, currency, onValue, onCurrency, FX, hint }) {
  return (
    <Field label={label} hint={hint}>
      <div style={{ display:"flex", gap:8 }}>
        <select style={{ ...S.select, width:90 }} value={currency} onChange={e=>onCurrency(e.target.value)}>
          {CURRENCIES.map(c=><option key={c}>{c}</option>)}
        </select>
        <input type="number" style={S.input} value={value} onChange={e=>onValue(e.target.value)} placeholder="0"/>
      </div>
      {currency!=="INR" && value>0 && (
        <div style={{ fontSize:11, color:S.teal, marginTop:3 }}>
          ≈ ₹{fmt(convertToINR(value, currency, FX))} INR
        </div>
      )}
    </Field>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIZARD STEPS
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1 — Personal Profile
function Step1({ inp, set }) {
  const upd = (k,v) => set(p=>({...p,[k]:v}));
  return (
    <div>
      <h2 style={S.h2}>👤 Personal Profile</h2>
      <div style={S.grid2}>
        <Field label="Your Name">
          <input style={S.input} value={inp.name} onChange={e=>upd("name",e.target.value)} placeholder="e.g. Rajesh Kumar"/>
        </Field>
        <Field label="Current Age">
          <select style={S.select} value={inp.currentAge} onChange={e=>upd("currentAge",+e.target.value)}>
            {Array.from({length:50},(_,i)=>i+20).map(a=><option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Current Country">
          <select style={S.select} value={inp.currentCountry} onChange={e=>upd("currentCountry",e.target.value)}>
            {["India","Oman","UAE","USA","UK","Canada","Australia","Singapore","Other"].map(c=><option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Retire In">
          <select style={S.select} value={inp.retireCountry} onChange={e=>upd("retireCountry",e.target.value)}>
            {["India","Oman","UAE","USA","UK","Canada","Australia","Singapore","Other"].map(c=><option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Target Retirement Age">
          <select style={S.select} value={inp.retireAge} onChange={e=>upd("retireAge",+e.target.value)}>
            {Array.from({length:25},(_,i)=>i+40).map(a=><option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Life Expectancy">
          <select style={S.select} value={inp.lifeExp} onChange={e=>upd("lifeExp",+e.target.value)}>
            {[75,80,85,90,95,100].map(a=><option key={a}>{a}</option>)}
          </select>
        </Field>
      </div>
      <div style={S.divider}/>
      <h3 style={S.h3}>Spouse (optional)</h3>
      <div style={S.grid2}>
        <Field label="Are you married?">
          <select style={S.select} value={inp.married?"yes":"no"} onChange={e=>upd("married",e.target.value==="yes")}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
        {inp.married && <>
          <Field label="Spouse Name">
            <input style={S.input} value={inp.spouseName||""} onChange={e=>upd("spouseName",e.target.value)} placeholder="Spouse name"/>
          </Field>
          <Field label="Spouse Age">
            <select style={S.select} value={inp.spouseAge||35} onChange={e=>upd("spouseAge",+e.target.value)}>
              {Array.from({length:50},(_,i)=>i+20).map(a=><option key={a}>{a}</option>)}
            </select>
          </Field>
        </>}
      </div>
    </div>
  );
}

// Step 2 — Income & Savings
function Step2({ inp, set }) {
  const upd = (k,v) => set(p=>({...p,[k]:v}));
  return (
    <div>
      <h2 style={S.h2}>💰 Income & Savings</h2>
      <div style={S.grid2}>
        <CurrencyAmount label="Monthly Take-home Income"
          value={inp.incomeMonthly} currency={inp.incomeCurrency}
          onValue={v=>upd("incomeMonthly",+v)} onCurrency={v=>upd("incomeCurrency",v)}
          FX={inp.FX} hint="After tax, in hand"/>
        <CurrencyAmount label="Monthly Expenses"
          value={inp.expensesMonthly} currency={inp.expensesCurrency||"INR"}
          onValue={v=>upd("expensesMonthly",+v)} onCurrency={v=>upd("expensesCurrency",v)}
          FX={inp.FX}/>
        <CurrencyAmount label="Monthly SIP / Investment"
          value={inp.sipMonthly} currency={inp.sipCurrency||"INR"}
          onValue={v=>upd("sipMonthly",+v)} onCurrency={v=>upd("sipCurrency",v)}
          FX={inp.FX} hint="Total monthly amount going into investments"/>
        <Field label="Annual Salary Growth">
          <select style={S.select} value={inp.salaryGrowth} onChange={e=>upd("salaryGrowth",+e.target.value)}>
            {[0.03,0.05,0.07,0.08,0.10,0.12].map(r=><option key={r} value={r}>{(r*100).toFixed(0)}% p.a.</option>)}
          </select>
        </Field>
        <Field label="Annual SIP Step-up">
          <select style={S.select} value={inp.sipStepUp} onChange={e=>upd("sipStepUp",+e.target.value)}>
            {[0,0.05,0.10,0.15,0.20].map(r=><option key={r} value={r}>{r===0?"No step-up":`${(r*100).toFixed(0)}% p.a.`}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ ...S.card, marginTop:8 }}>
        <div style={{ fontSize:12, color:S.amber }}>💡 Currency Tip</div>
        <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>
          If you earn in OMR/USD, select the right currency above. All values will be converted to INR at live rates.
          Click 🔄 on the dashboard to update exchange rates.
        </div>
      </div>
    </div>
  );
}

// Step 3 — Family Goals (Children)
function Step3({ inp, set }) {
  const upd = (k,v) => set(p=>({...p,[k]:v}));

  const setChildCount = (n) => {
    const existing = inp.children||[];
    const updated = Array.from({length:n}, (_,i) => existing[i] || {
      name:"", age:5, gender:"Son",
      planEducation:true, eduDest:"India (Tier 1)", eduLevel:"Under-grad", eduCostToday:1500000, eduFundAvailable:0,
      planMarriage:true, marriageAge:28, marriageBudget:3000000, marriageInflation:0.08, mrgFundAvailable:0,
    });
    upd("children", updated);
  };

  const updChild = (i, k, v) => {
    const ch = [...inp.children];
    ch[i] = { ...ch[i], [k]:v };
    // Gender-aware marriage age default
    if (k==="gender") ch[i].marriageAge = v==="Daughter" ? 25 : 28;
    upd("children", ch);
  };

  const n = inp.children?.length||0;

  return (
    <div>
      <h2 style={S.h2}>👨‍👩‍👧‍👦 Family Goals</h2>
      <Field label="Number of Children">
        <select style={{ ...S.select, maxWidth:200 }} value={n} onChange={e=>setChildCount(+e.target.value)}>
          {[0,1,2,3,4].map(i=><option key={i}>{i}</option>)}
        </select>
      </Field>

      {(inp.children||[]).map((c,i) => (
        <div key={i} style={{ ...S.card, borderColor:"#1E3A5F" }}>
          <h3 style={{ ...S.h3, color:S.blue }}>Child {i+1}</h3>
          {/* Basic info row */}
          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            <div style={{ flex:2 }}>
              <label style={S.label}>Name</label>
              <input style={S.input} value={c.name} onChange={e=>updChild(i,"name",e.target.value)} placeholder={`Child ${i+1}`}/>
            </div>
            <div style={{ flex:1 }}>
              <label style={S.label}>Current Age</label>
              <select style={S.select} value={c.age} onChange={e=>updChild(i,"age",+e.target.value)}>
                {Array.from({length:21},(_,j)=>j).map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={S.label}>Gender</label>
              <select style={S.select} value={c.gender} onChange={e=>updChild(i,"gender",e.target.value)}>
                <option>Son</option>
                <option>Daughter</option>
              </select>
            </div>
          </div>

          {/* Education */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <input type="checkbox" checked={c.planEducation} onChange={e=>updChild(i,"planEducation",e.target.checked)} id={`edu${i}`}/>
            <label htmlFor={`edu${i}`} style={{ color:"#CBD5E1", fontSize:13, cursor:"pointer" }}>Plan Education Fund</label>
          </div>
          {c.planEducation && (
            <div style={{ ...S.grid2, marginBottom:12, paddingLeft:24 }}>
              <Field label="Education Destination">
                <select style={S.select} value={c.eduDest} onChange={e=>{
                  const dest = EDU_DESTS.find(d=>d.label===e.target.value);
                  updChild(i,"eduDest",e.target.value);
                  if (dest) updChild(i,"eduCostToday",dest.cost);
                }}>
                  {EDU_DESTS.map(d=><option key={d.label}>{d.label}</option>)}
                </select>
              </Field>
              <Field label="Education Cost Today (₹)" hint={`In ${18-(c.age||0)} years`}>
                <input type="number" style={S.input} value={c.eduCostToday} onChange={e=>updChild(i,"eduCostToday",+e.target.value)}/>
              </Field>
              <Field label="Education Fund Already Set Aside (₹)">
                <input type="number" style={S.input} value={c.eduFundAvailable||0} onChange={e=>updChild(i,"eduFundAvailable",+e.target.value)}/>
              </Field>
            </div>
          )}

          {/* Marriage */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <input type="checkbox" checked={c.planMarriage} onChange={e=>updChild(i,"planMarriage",e.target.checked)} id={`mrg${i}`}/>
            <label htmlFor={`mrg${i}`} style={{ color:"#CBD5E1", fontSize:13, cursor:"pointer" }}>Plan Marriage Fund</label>
          </div>
          {c.planMarriage && (
            <div style={{ ...S.grid2, paddingLeft:24 }}>
              <Field label={`${c.gender==="Daughter"?"Daughter's":"Son's"} Marriage Age`}>
                <select style={S.select} value={c.marriageAge||28} onChange={e=>updChild(i,"marriageAge",+e.target.value)}>
                  {Array.from({length:16},(_,j)=>j+20).map(a=><option key={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Marriage Budget Today (₹)">
                <input type="number" style={S.input} value={c.marriageBudget||3000000} onChange={e=>updChild(i,"marriageBudget",+e.target.value)}/>
              </Field>
              <Field label="Marriage Inflation Rate">
                <select style={S.select} value={c.marriageInflation||0.08} onChange={e=>updChild(i,"marriageInflation",+e.target.value)}>
                  {[0.06,0.07,0.08,0.09,0.10].map(r=><option key={r} value={r}>{(r*100).toFixed(0)}%</option>)}
                </select>
              </Field>
              <Field label="Marriage Fund Already Set Aside (₹)">
                <input type="number" style={S.input} value={c.mrgFundAvailable||0} onChange={e=>updChild(i,"mrgFundAvailable",+e.target.value)}/>
              </Field>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Step 4 — Portfolio
function Step4({ inp, set }) {
  const upd = (k,v) => set(p=>({...p,[k]:v}));

  const toggleAssetType = (id) => {
    const existing = inp.assets||[];
    const idx = existing.findIndex(a=>a.type===id);
    if (idx>=0) upd("assets", existing.filter(a=>a.type!==id));
    else {
      const label = ASSET_TYPES.find(t=>t.id===id)?.label||id;
      upd("assets", [...existing, { type:id, label, value:0, currency:"INR" }]);
    }
  };

  const updAsset = (idx, k, v) => {
    const assets = [...(inp.assets||[])];
    assets[idx] = { ...assets[idx], [k]:v };
    upd("assets", assets);
  };

  const isLiquid = (type) => ["liquid_fund","indian_bank","overseas_bank","fd"].includes(type);

  return (
    <div>
      <h2 style={S.h2}>📊 Your Portfolio</h2>

      <Field label="How would you like to enter your portfolio?">
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:4 }}>
          {[
            { id:"simple", label:"💰 Simple (total per category)", desc:"Just enter one total per asset class" },
            { id:"detailed", label:"📋 Detailed (per holding)", desc:"Enter individual stocks / holdings" },
          ].map(m=>(
            <div key={m.id} onClick={()=>upd("portfolioMode",m.id)}
              style={{ flex:1, minWidth:180, padding:12, borderRadius:8, cursor:"pointer",
                border:`2px solid ${inp.portfolioMode===m.id ? S.blue : "#1E2D4A"}`,
                background: inp.portfolioMode===m.id ? "#0A1628" : "transparent" }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{m.label}</div>
              <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Field>

      <div style={S.divider}/>
      <h3 style={S.h3}>Select Asset Categories</h3>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
        {ASSET_TYPES.map(t => {
          const active = (inp.assets||[]).some(a=>a.type===t.id);
          return (
            <div key={t.id} onClick={()=>toggleAssetType(t.id)}
              style={{ padding:"6px 14px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                background: active ? S.blue : "#1E2D4A", color: active ? "#fff" : "#94A3B8",
                border:`1px solid ${active?S.blue:"#1E2D4A"}` }}>
              {t.label}
            </div>
          );
        })}
      </div>

      {(inp.assets||[]).length > 0 && (
        <div>
          <h3 style={S.h3}>Enter Values</h3>
          {(inp.assets||[]).map((a,idx)=>(
            <div key={a.type} style={{ ...S.card, padding:12, marginBottom:8 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:8, color: isLiquid(a.type)?S.teal:S.blue }}>
                {isLiquid(a.type)?"💧":"📈"} {a.label}
                {isLiquid(a.type) && <span style={{ fontSize:10, color:S.teal, marginLeft:8 }}>(counts as liquid at 4% return)</span>}
              </div>

              {inp.portfolioMode==="simple" ? (
                <div style={{ display:"flex", gap:8 }}>
                  <select style={{ ...S.select, width:90 }} value={a.currency} onChange={e=>updAsset(idx,"currency",e.target.value)}>
                    {CURRENCIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <input type="number" style={S.input} value={a.value||""} placeholder="Current market value"
                    onChange={e=>updAsset(idx,"value",+e.target.value)}/>
                </div>
              ) : (
                <DetailedAssetEntry asset={a} idx={idx} updAsset={updAsset} FX={inp.FX}/>
              )}

              {a.currency!=="INR" && (a.value||0)>0 && (
                <div style={{ fontSize:11, color:S.teal, marginTop:4 }}>
                  ≈ ₹{fmt(convertToINR(a.value, a.currency, inp.FX))} INR
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FX Rates */}
      <div style={{ ...S.card, marginTop:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <h3 style={{ ...S.h3, margin:0 }}>Exchange Rates (INR per 1 unit)</h3>
          <FXRefreshButton FX={inp.FX} onUpdate={fx=>upd("FX",fx)}/>
        </div>
        <div style={S.grid3}>
          {["OMR","USD","GBP","CAD","AUD","EUR"].map(c=>(
            <div key={c} style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ color:"#94A3B8", fontSize:12, minWidth:30 }}>{c}</span>
              <input type="number" style={{ ...S.input, flex:1 }} value={inp.FX[c]||0}
                onChange={e=>upd("FX",{...inp.FX,[c]:+e.target.value})}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailedAssetEntry({ asset, idx, updAsset, FX }) {
  const holdings = asset.holdings||[];
  const addHolding = () => {
    updAsset(idx, "holdings", [...holdings, { name:"", qty:0, price:0, currency:"INR" }]);
  };
  const updH = (hi, k, v) => {
    const h=[...holdings]; h[hi]={...h[hi],[k]:v}; updAsset(idx,"holdings",h);
  };
  const total = holdings.reduce((s,h)=>s+convertToINR((h.qty||0)*(h.price||0), h.currency||"INR", FX),0);
  useEffect(()=>{ updAsset(idx,"value",total); },[total]);

  return (
    <div>
      {holdings.map((h,hi)=>(
        <div key={hi} style={{ display:"flex", gap:6, marginBottom:6 }}>
          <input style={{ ...S.input, flex:2 }} placeholder="Name / Ticker" value={h.name}
            onChange={e=>updH(hi,"name",e.target.value)}/>
          <input type="number" style={{ ...S.input, flex:1 }} placeholder="Qty" value={h.qty||""}
            onChange={e=>updH(hi,"qty",+e.target.value)}/>
          <input type="number" style={{ ...S.input, flex:1 }} placeholder="Price" value={h.price||""}
            onChange={e=>updH(hi,"price",+e.target.value)}/>
          <select style={{ ...S.select, width:80 }} value={h.currency||"INR"} onChange={e=>updH(hi,"currency",e.target.value)}>
            {CURRENCIES.map(c=><option key={c}>{c}</option>)}
          </select>
          <button style={{ ...S.btnSmall, background:S.red, color:"#fff" }}
            onClick={()=>updAsset(idx,"holdings",holdings.filter((_,j)=>j!==hi))}>✕</button>
        </div>
      ))}
      <button style={{ ...S.btnSmall, background:"#1E2D4A", color:"#94A3B8", marginTop:4 }} onClick={addHolding}>+ Add Holding</button>
      {holdings.length>0 && <div style={{ fontSize:12, color:S.teal, marginTop:6 }}>Total: ₹{fmt(total)}</div>}
    </div>
  );
}

function FXRefreshButton({ FX, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const refresh = async () => {
    setLoading(true); setErr("");
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/INR");
      const data = await res.json();
      const r = data.rates;
      const newFX = {
        INR:1,
        OMR: r.INR/r.OMR,
        USD: r.INR/r.USD,
        GBP: r.INR/r.GBP,
        CAD: r.INR/r.CAD,
        AUD: r.INR/r.AUD,
        EUR: r.INR/r.EUR,
      };
      onUpdate(newFX);
    } catch(e) { setErr("Failed. Using manual rates."); }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      {err && <span style={{ fontSize:11, color:S.red }}>{err}</span>}
      <button style={{ ...S.btnSmall, background:S.teal, color:"#fff" }} onClick={refresh} disabled={loading}>
        {loading?"⏳":"🔄"} Live Rates
      </button>
    </div>
  );
}

// Step 5 — Housing
function Step5({ inp, set }) {
  const upd = (k,v) => set(p=>({...p,[k]:v}));
  const updH = (k,v) => set(p=>({...p,housing:{...p.housing,[k]:v}}));
  const h = inp.housing;

  const loanAmt = h.budget * (1 - (h.downPaymentPct||20)/100);
  const emi = h.hasLoan ? calcEMI(loanAmt, h.interestRate||8.5, h.tenure||20) : 0;

  return (
    <div>
      <h2 style={S.h2}>🏠 Housing</h2>
      <Field label="Do you already own your primary residence?">
        <div style={{ display:"flex", gap:12 }}>
          {[{v:true,l:"✅ Yes, I own my home"},{v:false,l:"🔍 No, planning to buy"}].map(opt=>(
            <div key={String(opt.v)} onClick={()=>updH("owned",opt.v)}
              style={{ flex:1, padding:12, borderRadius:8, cursor:"pointer", textAlign:"center",
                border:`2px solid ${h.owned===opt.v ? S.blue : "#1E2D4A"}`,
                background: h.owned===opt.v ? "#0A1628" : "transparent", fontSize:13, fontWeight:600 }}>
              {opt.l}
            </div>
          ))}
        </div>
      </Field>

      {!h.owned && (
        <div>
          <div style={S.grid2}>
            <CurrencyAmount label="Target Home Budget"
              value={h.budget||0} currency={h.currency||"INR"}
              onValue={v=>updH("budget",+v)} onCurrency={v=>updH("currency",v)}
              FX={inp.FX} hint="All-in cost of the property"/>
            <Field label="Target Year to Buy" hint={`In ${h.targetYears||5} years`}>
              <select style={S.select} value={h.targetYears||5} onChange={e=>updH("targetYears",+e.target.value)}>
                {Array.from({length:20},(_,i)=>i+1).map(y=><option key={y}>{y}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, margin:"12px 0" }}>
            <input type="checkbox" checked={h.hasLoan||false} onChange={e=>updH("hasLoan",e.target.checked)} id="loanChk"/>
            <label htmlFor="loanChk" style={{ color:"#CBD5E1", fontSize:13, cursor:"pointer" }}>
              Planning to take a home loan?
            </label>
          </div>

          {h.hasLoan && (
            <div style={{ ...S.card, borderColor:"#1E3A5F" }}>
              <h3 style={S.h3}>Loan Details</h3>
              <div style={S.grid3}>
                <Field label="Down Payment %" hint={`₹${fmt(convertToINR(h.budget||0,h.currency||"INR",inp.FX)*(h.downPaymentPct||20)/100)}`}>
                  <select style={S.select} value={h.downPaymentPct||20} onChange={e=>updH("downPaymentPct",+e.target.value)}>
                    {[10,15,20,25,30,40].map(p=><option key={p}>{p}%</option>)}
                  </select>
                </Field>
                <Field label="Loan Tenure (Years)">
                  <select style={S.select} value={h.tenure||20} onChange={e=>updH("tenure",+e.target.value)}>
                    {[10,15,20,25,30].map(y=><option key={y}>{y}</option>)}
                  </select>
                </Field>
                <Field label="Interest Rate (% p.a.)">
                  <select style={S.select} value={h.interestRate||8.5} onChange={e=>updH("interestRate",+e.target.value)}>
                    {[7.0,7.5,8.0,8.5,9.0,9.5,10.0].map(r=><option key={r} value={r}>{r}%</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ ...S.card, background:"#0A1628", marginTop:0 }}>
                <div style={{ display:"flex", gap:24 }}>
                  <div><div style={S.label}>Loan Amount</div><div style={{ color:S.amber, fontWeight:700 }}>₹{fmt(loanAmt)}</div></div>
                  <div><div style={S.label}>Monthly EMI</div><div style={{ color:S.red, fontWeight:700, fontSize:18 }}>₹{fmt(emi)}</div></div>
                  <div><div style={S.label}>Total Outflow</div><div style={{ color:"#CBD5E1", fontWeight:700 }}>₹{fmt(emi*h.tenure*12)}</div></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {h.owned && (
        <div style={{ ...S.card, background:"#0A2010", borderColor:"#1A4020" }}>
          <div style={{ color:S.green, fontWeight:600 }}>✅ Great! No housing goal to plan.</div>
          <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>
            Your home is not counted as a liquid investment asset unless you plan to sell it.
            If your home value is significant, you may add it under "Real Estate / Land" in the Portfolio step.
          </div>
        </div>
      )}
    </div>
  );
}

// Step 6 — Retirement Plan
function Step6({ inp, set }) {
  const upd = (k,v) => set(p=>({...p,[k]:v}));
  const updE = (k,v) => set(p=>({...p,retireExpenses:{...p.retireExpenses,[k]:v}}));
  const e = inp.retireExpenses||{};

  return (
    <div>
      <h2 style={S.h2}>🎯 Retirement Plan</h2>
      <div style={S.grid2}>
        <Field label="Expected Monthly Expenses in Retirement" hint="At today's value">
          <div style={{ display:"flex", gap:8 }}>
            <select style={{ ...S.select, width:90 }} value={inp.retireExpCurrency||"INR"}
              onChange={e=>upd("retireExpCurrency",e.target.value)}>
              {CURRENCIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <input type="number" style={S.input} value={inp.retireExpMonthly||""} placeholder="e.g. 100000"
              onChange={e=>upd("retireExpMonthly",+e.target.value)}/>
          </div>
        </Field>
        <Field label="Withdrawal Strategy">
          <select style={S.select} value={inp.withdrawalRule||"4pct"} onChange={e=>upd("withdrawalRule",e.target.value)}>
            {WITHDRAWAL_RULES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Expected Inflation (Annual)">
          <select style={S.select} value={inp.inflationRate||0.06} onChange={e=>upd("inflationRate",+e.target.value)}>
            {[0.04,0.05,0.06,0.07,0.08].map(r=><option key={r} value={r}>{(r*100).toFixed(0)}%</option>)}
          </select>
        </Field>
        <Field label="Expected Portfolio Return (Annual)">
          <select style={S.select} value={inp.expectedReturn||0.12} onChange={e=>upd("expectedReturn",+e.target.value)}>
            {[0.08,0.10,0.11,0.12,0.13,0.14].map(r=><option key={r} value={r}>{(r*100).toFixed(0)}%</option>)}
          </select>
        </Field>
      </div>
      <div style={S.divider}/>
      <h3 style={S.h3}>Retirement Expense Breakdown (Optional)</h3>
      <div style={S.grid2}>
        <Field label="Annual Travel Budget">
          <input type="number" style={S.input} value={inp.travelAnnual||0}
            onChange={e=>upd("travelAnnual",+e.target.value)} placeholder="e.g. 200000"/>
        </Field>
        <Field label="Annual Healthcare Budget">
          <input type="number" style={S.input} value={inp.healthcareAnnual||0}
            onChange={e=>upd("healthcareAnnual",+e.target.value)} placeholder="e.g. 120000"/>
        </Field>
        <Field label="Annual Other Expenses">
          <input type="number" style={S.input} value={inp.otherAnnual||0}
            onChange={e=>upd("otherAnnual",+e.target.value)} placeholder="e.g. 60000"/>
        </Field>
      </div>
      <div style={S.divider}/>
      <div style={{ ...S.card, background:"#0A1020" }}>
        <h3 style={{ ...S.h3, color:S.teal }}>Quick Summary</h3>
        <div style={S.grid3}>
          <div><div style={S.label}>Years to Retire</div>
            <div style={{ fontSize:18, fontWeight:700, color:S.blue }}>{(inp.retireAge||52)-(inp.currentAge||35)}</div></div>
          <div><div style={S.label}>Retirement Duration</div>
            <div style={{ fontSize:18, fontWeight:700, color:S.purple }}>{(inp.lifeExp||85)-(inp.retireAge||52)} yrs</div></div>
          <div><div style={S.label}>Monthly Retirement Exp.</div>
            <div style={{ fontSize:18, fontWeight:700, color:S.amber }}>
              {inp.retireExpCurrency!=="INR"?inp.retireExpCurrency+"":" "}₹{fmt(inp.retireExpMonthly||0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD TABS
// ═══════════════════════════════════════════════════════════════════════════════

function useCalcs(inp) {
  return useMemo(() => {
    const FX = inp.FX || DEFAULT_FX;
    const years = Math.max(1, (inp.retireAge||52) - (inp.currentAge||35));
    const retYears = Math.max(1, (inp.lifeExp||85) - (inp.retireAge||52));
    const ret = inp.expectedReturn || 0.12;
    const infl = inp.inflationRate || 0.06;
    const sipMonthly = convertToINR(inp.sipMonthly||0, inp.sipCurrency||"INR", FX);
    const monthlyExpToday = convertToINR(inp.retireExpMonthly||0, inp.retireExpCurrency||"INR", FX);
    const monthlyExpFuture = monthlyExpToday * Math.pow(1+infl, years);

    // Portfolio totals
    const assets = inp.assets||[];
    const liquidTypes = ["liquid_fund","indian_bank","overseas_bank","fd","ppf_epf_nps"];
    let totalINR = 0, liquidINR = 0;
    const assetBreakdown = assets.map(a => {
      const val = convertToINR(a.value||0, a.currency||"INR", FX);
      totalINR += val;
      if (liquidTypes.includes(a.type)) liquidINR += val;
      return { ...a, valueINR:val };
    });

    // Housing EMI impact
    const h = inp.housing||{};
    const housingBudgetINR = !h.owned ? convertToINR(h.budget||0, h.currency||"INR", FX) : 0;
    const loanAmt = housingBudgetINR * (1-(h.downPaymentPct||20)/100);
    const emiMonthly = (!h.owned && h.hasLoan) ? calcEMI(loanAmt, h.interestRate||8.5, h.tenure||20) : 0;
    const effectiveSIP = Math.max(0, sipMonthly - emiMonthly);

    // Children goals
    const childrenWithGoals = calcChildGoals(inp.children||[], years, infl);
    const totalChildGoals = childrenWithGoals.reduce((s,c)=>s+c.goals.reduce((gs,g)=>gs+g.gap,0),0);

    // Corpus projections
    const proj = project(totalINR, liquidINR, ret, effectiveSIP, years);
    const corpusNeeded = needCorpus(monthlyExpFuture, inp.withdrawalRule||"4pct") + totalChildGoals + housingBudgetINR;
    const surplus = proj.total - corpusNeeded;
    const corpusAdequacy = corpusNeeded>0 ? Math.min(1, proj.total/corpusNeeded) : 1;

    // Monte Carlo
    const mc = runMC(totalINR, liquidINR, effectiveSIP, years, retYears, monthlyExpFuture, 800);

    // Readiness score
    const score = Math.min(35,corpusAdequacy*35)
      + Math.min(20,years*1.5)
      + (surplus>0?20:0)
      + Math.min(15,mc.successRate*15)
      + Math.min(10,(sipMonthly/50000)*10);

    // Year-by-year cashflow
    const cashflow = [];
    let runEq = totalINR - liquidINR, runLiq = liquidINR;
    for (let yr=0; yr<=years+10; yr++) {
      const age = (inp.currentAge||35) + yr;
      const isRetired = age >= (inp.retireAge||52);
      if (!isRetired) {
        runEq = runEq*(1+ret) + effectiveSIP*12;
        runLiq = runLiq*(1+LIQUID_RATE);
      } else {
        const spend = monthlyExpFuture*Math.pow(1+infl,yr-years);
        runEq = runEq*(1+ret) - spend*12*0.7;
        runLiq = runLiq*(1+LIQUID_RATE) - spend*12*0.3;
      }
      cashflow.push({ age, year:new Date().getFullYear()+yr, total:Math.max(0,runEq+runLiq), equity:runEq, liquid:runLiq, isRetired });
    }

    return {
      years, retYears, ret, infl, sipMonthly, effectiveSIP,
      monthlyExpToday, monthlyExpFuture,
      totalINR, liquidINR, assetBreakdown,
      housingBudgetINR, emiMonthly,
      childrenWithGoals, totalChildGoals,
      proj, corpusNeeded, surplus, corpusAdequacy,
      mc, score, cashflow,
    };
  }, [inp]);
}

// Tab: Executive Summary
function ExecTab({ inp, c }) {
  const scoreColor = c.score>=70?S.green:c.score>=50?S.amber:S.red;
  return (
    <div>
      <div style={{ display:"flex", gap:16, marginBottom:16 }}>
        <div style={{ ...S.card, flex:1, textAlign:"center" }}>
          <Gauge value={c.score} max={100} color={scoreColor} label="Readiness Score"/>
          <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>Overall Retirement Readiness</div>
        </div>
        <div style={{ flex:3 }}>
          <div style={S.grid2}>
            {[
              { label:"Current Portfolio", val:fmtCr(c.totalINR), color:S.blue },
              { label:"Projected at Retirement", val:fmtCr(c.proj.total), color:S.teal },
              { label:"Corpus Required", val:fmtCr(c.corpusNeeded), color:S.amber },
              { label:"Surplus / (Shortfall)", val:fmtCr(Math.abs(c.surplus)), color:c.surplus>=0?S.green:S.red },
            ].map(item=>(
              <div key={item.label} style={{ ...S.card, textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#94A3B8" }}>{item.label}</div>
                <div style={{ fontSize:20, fontWeight:700, color:item.color, marginTop:4 }}>{item.val}</div>
                {item.label.includes("Surplus") && <div style={{ fontSize:10, color:c.surplus>=0?S.green:S.red }}>{c.surplus>=0?"✅ On Track":"⚠️ Shortfall"}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.grid3}>
        <div style={S.card}>
          <div style={{ fontSize:12, color:"#94A3B8" }}>Years to Retire</div>
          <div style={{ fontSize:24, fontWeight:700, color:S.blue }}>{c.years}</div>
          <div style={{ fontSize:11, color:"#64748B" }}>Age {inp.currentAge} → {inp.retireAge}</div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:12, color:"#94A3B8" }}>Monte Carlo Success Rate</div>
          <div style={{ fontSize:24, fontWeight:700, color:c.mc.successRate>=0.8?S.green:c.mc.successRate>=0.6?S.amber:S.red }}>
            {(c.mc.successRate*100).toFixed(0)}%
          </div>
          <div style={{ fontSize:11, color:"#64748B" }}>of 800 simulations</div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:12, color:"#94A3B8" }}>Monthly SIP (effective)</div>
          <div style={{ fontSize:24, fontWeight:700, color:S.purple }}>₹{fmt(c.effectiveSIP)}</div>
          {c.emiMonthly>0 && <div style={{ fontSize:11, color:S.red }}>−₹{fmt(c.emiMonthly)} EMI</div>}
        </div>
      </div>

      {/* Key Insights */}
      <div style={S.card}>
        <h3 style={S.h3}>Key Insights</h3>
        {[
          c.score>=80 && { icon:"🎉", color:S.green, msg:`You're well on track for retirement at ${inp.retireAge}!` },
          c.score<50 && { icon:"⚠️", color:S.red, msg:`Significant gap. Consider increasing SIP or delaying retirement by 2–3 years.` },
          c.emiMonthly>0 && { icon:"🏠", color:S.amber, msg:`Home loan EMI of ₹${fmt(c.emiMonthly)}/mo reduces effective SIP. Clear loan by ${(inp.currentAge||35)+(inp.housing?.tenure||20)}.` },
          c.totalChildGoals>0 && { icon:"🎓", color:S.teal, msg:`Children's education + marriage goals: ${fmtCr(c.totalChildGoals)} total.` },
        ].filter(Boolean).map((ins,i)=>(
          <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid #0F1927" }}>
            <span style={{ fontSize:16 }}>{ins.icon}</span>
            <span style={{ color:ins.color, fontSize:13 }}>{ins.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab: Portfolio
function PortfolioTab({ inp, c }) {
  const total = c.totalINR;
  return (
    <div>
      <h2 style={S.h2}>Portfolio Breakdown</h2>
      <div style={S.grid2}>
        <div style={S.card}>
          <h3 style={S.h3}>Asset Allocation</h3>
          {c.assetBreakdown.map((a,i)=>{
            const pct = total>0 ? (a.valueINR/total*100) : 0;
            const isLiq = ["liquid_fund","indian_bank","overseas_bank","fd","ppf_epf_nps"].includes(a.type);
            return (
              <div key={a.type} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                  <span style={{ color: isLiq?S.teal:S.blue }}>{isLiq?"💧":"📈"} {a.label}</span>
                  <span style={{ color:"#F8FAFC", fontWeight:600 }}>{fmtCr(a.valueINR)} ({pct.toFixed(1)}%)</span>
                </div>
                <div style={{ height:6, background:"#0F1927", borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:isLiq?S.teal:S.blue, borderRadius:3 }}/>
                </div>
              </div>
            );
          })}
          <div style={{ ...S.divider, margin:"12px 0" }}/>
          <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700 }}>
            <span>Total Portfolio</span><span style={{ color:S.blue }}>{fmtCr(total)}</span>
          </div>
        </div>

        <div style={S.card}>
          <h3 style={S.h3}>Two-Sleeve Summary</h3>
          <div style={{ marginBottom:16 }}>
            {[
              { label:"Equity Sleeve", val:c.totalINR-c.liquidINR, color:S.blue, desc:`${inp.expectedReturn*100||12}% return` },
              { label:"Liquid Sleeve", val:c.liquidINR, color:S.teal, desc:"4% return (stable)" },
            ].map(s=>(
              <div key={s.label} style={{ ...S.card, marginBottom:8, background:"#0A1020" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ color:s.color, fontWeight:600 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:"#64748B" }}>{s.desc}</div>
                  </div>
                  <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{fmtCr(s.val)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, color:"#64748B" }}>
            Projected at Retirement (age {inp.retireAge}):
            <span style={{ color:S.teal, fontWeight:700, marginLeft:8 }}>{fmtCr(c.proj.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab: Monte Carlo
function MCTab({ inp, c }) {
  const mc = c.mc;
  const color = mc.successRate>=0.8?S.green:mc.successRate>=0.6?S.amber:S.red;
  const hist = useMemo(()=>{
    const bins = 20;
    const validTrails = mc.trails.filter(v=>isFinite(v));
    if (!validTrails.length) return [];
    const min=Math.min(...validTrails), max=Math.max(...validTrails);
    const bw = (max-min)/bins||1;
    const counts = Array(bins).fill(0);
    validTrails.forEach(v=>{ const b=Math.min(bins-1,Math.floor((v-min)/bw)); counts[b]++; });
    return counts.map((count,i)=>({ label:fmtCr(min+i*bw), value:count }));
  },[mc.trails]);

  return (
    <div>
      <h2 style={S.h2}>Monte Carlo Simulation</h2>
      <div style={S.grid2}>
        <div style={{ ...S.card, textAlign:"center" }}>
          <Gauge value={mc.successRate*100} max={100} color={color} label="Success Rate"/>
          <div style={{ fontSize:13, color:"#94A3B8", marginTop:8 }}>Probability of not running out of money</div>
        </div>
        <div style={S.card}>
          <h3 style={S.h3}>Corpus Distribution (at Retirement)</h3>
          {[
            { label:"Pessimistic (P10)", val:mc.p10, color:S.red },
            { label:"Median (P50)", val:mc.p50, color:S.amber },
            { label:"Optimistic (P90)", val:mc.p90, color:S.green },
          ].map(p=>(
            <div key={p.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #0F1927" }}>
              <span style={{ fontSize:12, color:"#94A3B8" }}>{p.label}</span>
              <span style={{ color:p.color, fontWeight:700 }}>{fmtCr(p.val)}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <h3 style={S.h3}>Outcome Distribution</h3>
        <div style={{ height:160 }}>
          <Bar data={hist} height={160}/>
        </div>
        <div style={{ fontSize:11, color:"#64748B", marginTop:8 }}>
          Based on 800 simulations with σ={EQUITY_SIGMA*100}% equity return and σ={INFL_SIGMA*100}% inflation variance
        </div>
      </div>
    </div>
  );
}

// Tab: Children Goals
function ChildrenTab({ inp, c }) {
  if (!inp.children?.length) {
    return <div style={{ ...S.card, textAlign:"center", color:"#64748B" }}>No children added</div>;
  }
  return (
    <div>
      <h2 style={S.h2}>Children's Goals</h2>
      {c.childrenWithGoals.map((ch,i)=>(
        <div key={i} style={S.card}>
          <h3 style={{ ...S.h3, color: ch.gender==="Daughter"?S.purple:S.blue }}>
            {ch.gender==="Daughter"?"👧":"👦"} {ch.name||`Child ${i+1}`} (Age {ch.age})
          </h3>
          {ch.goals.map((g,j)=>(
            <div key={j} style={{ ...S.card, background:"#0A1020", marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:600, color:g.type==="Education"?S.teal:S.amber }}>
                    {g.type==="Education"?"🎓":"💍"} {g.type} in {g.years} years
                  </div>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>
                    Today's cost: ₹{fmt(g.type==="Education"?ch.eduCostToday:ch.marriageBudget)}
                    → Future: <span style={{ color:S.amber }}>{fmtCr(g.cost)}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:"#94A3B8" }}>Gap</div>
                  <div style={{ fontSize:18, fontWeight:700, color:g.gap>0?S.red:S.green }}>
                    {g.gap>0?fmtCr(g.gap):"Funded ✓"}
                  </div>
                </div>
              </div>
              {g.gap>0 && (
                <div style={{ marginTop:8, padding:"8px 12px", background:"#0F1927", borderRadius:6 }}>
                  <span style={{ fontSize:12, color:"#94A3B8" }}>SIP needed to cover gap: </span>
                  <span style={{ color:S.amber, fontWeight:700 }}>
                    ₹{fmt(g.gap * 0.12/12 / (Math.pow(1.01,g.years*12)-1))}/mo
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      <div style={{ ...S.card, background:"#0A0D15" }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontWeight:600 }}>Total Children Goal Corpus Needed</span>
          <span style={{ color:S.amber, fontWeight:700, fontSize:16 }}>{fmtCr(c.totalChildGoals)}</span>
        </div>
      </div>
    </div>
  );
}

// Tab: Housing
function HousingTab({ inp, c }) {
  const h = inp.housing||{};
  if (h.owned) {
    return (
      <div style={{ ...S.card, textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:8 }}>🏠</div>
        <div style={{ fontSize:18, fontWeight:700, color:S.green }}>Home Owned</div>
        <div style={{ fontSize:13, color:"#94A3B8", marginTop:4 }}>No housing goal to plan for retirement</div>
      </div>
    );
  }
  const loanAmt = c.housingBudgetINR*(1-(h.downPaymentPct||20)/100);
  return (
    <div>
      <h2 style={S.h2}>Housing Goal</h2>
      <div style={S.grid2}>
        <div style={S.card}>
          <h3 style={S.h3}>Goal Summary</h3>
          {[
            { label:"Target Budget", val:`₹${fmt(c.housingBudgetINR)}` },
            { label:"Target Year", val:`${new Date().getFullYear()+(h.targetYears||5)} (in ${h.targetYears||5} yrs)` },
            { label:"Down Payment", val:`₹${fmt(c.housingBudgetINR*(h.downPaymentPct||20)/100)} (${h.downPaymentPct||20}%)` },
          ].map(r=>(
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #0F1927" }}>
              <span style={{ fontSize:12, color:"#94A3B8" }}>{r.label}</span>
              <span style={{ fontWeight:600 }}>{r.val}</span>
            </div>
          ))}
        </div>
        {h.hasLoan && (
          <div style={S.card}>
            <h3 style={S.h3}>Loan Details</h3>
            {[
              { label:"Loan Amount", val:`₹${fmt(loanAmt)}`, color:S.amber },
              { label:"Monthly EMI", val:`₹${fmt(c.emiMonthly)}`, color:S.red },
              { label:"Tenure", val:`${h.tenure||20} years @ ${h.interestRate||8.5}%` },
              { label:"Total Interest", val:`₹${fmt(c.emiMonthly*(h.tenure||20)*12 - loanAmt)}` },
            ].map(r=>(
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #0F1927" }}>
                <span style={{ fontSize:12, color:"#94A3B8" }}>{r.label}</span>
                <span style={{ fontWeight:600, color:r.color||"#F8FAFC" }}>{r.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Tab: Cashflow
function CashflowTab({ inp, c }) {
  const shown = c.cashflow.filter((_,i)=>i%2===0).slice(0,20);
  return (
    <div>
      <h2 style={S.h2}>Year-by-Year Cashflow</h2>
      <div style={{ ...S.card, padding:0, overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#0A1020" }}>
              {["Age","Year","Total Corpus","Equity","Liquid","Phase"].map(h=>(
                <th key={h} style={{ padding:"10px 12px", textAlign:"right", color:"#64748B", fontWeight:600, borderBottom:"1px solid #1E2D4A" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row,i)=>(
              <tr key={i} style={{ background: row.isRetired?"#0A0D10":i%2===0?"#0C1422":"transparent",
                borderBottom:"1px solid #0F1927" }}>
                <td style={{ padding:"8px 12px", color: row.isRetired?S.amber:S.blue, fontWeight:600, textAlign:"right" }}>{row.age}</td>
                <td style={{ padding:"8px 12px", color:"#64748B", textAlign:"right" }}>{row.year}</td>
                <td style={{ padding:"8px 12px", textAlign:"right", fontWeight:700, color:row.total>0?S.green:S.red }}>{fmtCr(row.total)}</td>
                <td style={{ padding:"8px 12px", textAlign:"right", color:S.blue }}>{fmtCr(Math.max(0,row.equity))}</td>
                <td style={{ padding:"8px 12px", textAlign:"right", color:S.teal }}>{fmtCr(Math.max(0,row.liquid))}</td>
                <td style={{ padding:"8px 12px", textAlign:"right" }}>
                  <span style={{ ...S.chip, background:row.isRetired?"#1A1000":S.blue+"22", color:row.isRetired?S.amber:S.blue }}>
                    {row.isRetired?"🌴 Retired":"💼 Working"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tab: Scenarios
function ScenariosTab({ inp, c }) {
  const scenarios = [
    { label:"Base Case",         ret:inp.expectedReturn||0.12, sip:c.effectiveSIP,   infl:inp.inflationRate||0.06, color:S.blue },
    { label:"Early Retire (−3)", ret:inp.expectedReturn||0.12, sip:c.effectiveSIP,   infl:inp.inflationRate||0.06, earlyYears:-3, color:S.amber },
    { label:"High Inflation",    ret:inp.expectedReturn||0.12, sip:c.effectiveSIP,   infl:0.08, color:S.red },
    { label:"Low Returns",       ret:0.09, sip:c.effectiveSIP,   infl:inp.inflationRate||0.06, color:S.red },
    { label:"Boost SIP 50%",     ret:inp.expectedReturn||0.12, sip:c.effectiveSIP*1.5,infl:inp.inflationRate||0.06, color:S.green },
    { label:"High Returns (14%)",ret:0.14, sip:c.effectiveSIP,   infl:inp.inflationRate||0.06, color:S.green },
  ].map(sc=>{
    const yrs = c.years + (sc.earlyYears||0);
    const monthlyExpFuture = c.monthlyExpToday * Math.pow(1+(sc.infl||0.06), yrs);
    const p = project(c.totalINR, c.liquidINR, sc.ret, sc.sip, yrs);
    const need = needCorpus(monthlyExpFuture, inp.withdrawalRule||"4pct") + c.totalChildGoals + c.housingBudgetINR;
    return { ...sc, corpus:p.total, needed:need, ok:p.total>=need };
  });

  return (
    <div>
      <h2 style={S.h2}>Scenarios</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {scenarios.map((sc,i)=>(
          <div key={i} style={{ ...S.card, borderColor:sc.ok?"#1A4020":"#3A1010" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <span style={{ fontWeight:700, color:sc.color }}>{sc.label}</span>
                <span style={{ fontSize:11, color:"#64748B", marginLeft:12 }}>
                  ret={((sc.ret)*100).toFixed(0)}% infl={((sc.infl||0.06)*100).toFixed(0)}%
                  {sc.earlyYears?" • retire 3yr early":""}
                  {sc.sip!==c.effectiveSIP?` • SIP ₹${fmt(sc.sip)}/mo`:""}
                </span>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:sc.ok?S.green:S.red, fontWeight:700, fontSize:16 }}>{fmtCr(sc.corpus)}</div>
                <div style={{ fontSize:11, color:"#64748B" }}>need {fmtCr(sc.needed)}</div>
              </div>
            </div>
            <div style={{ height:6, background:"#0F1927", borderRadius:3, marginTop:8 }}>
              <div style={{ height:"100%", width:`${Math.min(100,sc.corpus/sc.needed*100)}%`,
                background:sc.ok?S.green:S.red, borderRadius:3 }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab: Optimize
function OptimizeTab({ inp, c }) {
  return (
    <div>
      <h2 style={S.h2}>Optimization Recommendations</h2>
      {[
        {
          show: c.surplus < 0,
          icon:"📈", title:"Increase Monthly SIP",
          body:`You have a corpus shortfall of ${fmtCr(Math.abs(c.surplus))}.
            Increasing SIP by ₹${fmt(Math.abs(c.surplus)/((Math.pow(1.01,c.years*12)-1)/0.01))}/mo could bridge the gap.`,
          color:S.amber,
        },
        {
          show: c.mc.successRate < 0.75,
          icon:"⏳", title:"Consider Delaying Retirement 2–3 Years",
          body:`Your Monte Carlo success rate is ${(c.mc.successRate*100).toFixed(0)}%.
            Working 2–3 extra years can significantly improve corpus and reduce withdrawal period.`,
          color:S.red,
        },
        {
          show: c.liquidINR / c.totalINR < 0.1,
          icon:"💧", title:"Build Emergency / Liquid Buffer",
          body:`Only ${(c.liquidINR/c.totalINR*100).toFixed(1)}% of portfolio is liquid.
            Aim for at least 10–15% in liquid/debt funds for stability.`,
          color:S.teal,
        },
        {
          show: c.emiMonthly > c.sipMonthly * 0.4,
          icon:"🏠", title:"Home Loan EMI is High",
          body:`Your EMI of ₹${fmt(c.emiMonthly)} is ${(c.emiMonthly/c.sipMonthly*100).toFixed(0)}% of your SIP.
            Prepaying the loan can free up cash flow significantly.`,
          color:S.red,
        },
        {
          show: c.score >= 80,
          icon:"🎉", title:"You're on Track!",
          body:`Readiness score ${c.score.toFixed(0)}/100. Keep maintaining your SIP discipline and review annually.`,
          color:S.green,
        },
      ].filter(r=>r.show).map((r,i)=>(
        <div key={i} style={{ ...S.card, borderLeft:`4px solid ${r.color}` }}>
          <div style={{ display:"flex", gap:12 }}>
            <span style={{ fontSize:24 }}>{r.icon}</span>
            <div>
              <div style={{ fontWeight:700, color:r.color, marginBottom:6 }}>{r.title}</div>
              <div style={{ fontSize:13, color:"#94A3B8", lineHeight:1.5 }}>{r.body}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Tab: Settings (edit inputs after wizard)
function SettingsTab({ inp, set, onRedo }) {
  return (
    <div>
      <h2 style={S.h2}>Settings</h2>
      <div style={S.card}>
        <h3 style={S.h3}>Quick Adjustments</h3>
        <div style={S.grid2}>
          <Field label={`Retirement Age (current: ${inp.retireAge})`}>
            <select style={S.select} value={inp.retireAge} onChange={e=>set(p=>({...p,retireAge:+e.target.value}))}>
              {Array.from({length:25},(_,i)=>i+40).map(a=><option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label={`Monthly SIP: ₹${fmt(inp.sipMonthly)}`}>
            <input type="range" min={0} max={500000} step={5000} value={inp.sipMonthly||0}
              onChange={e=>set(p=>({...p,sipMonthly:+e.target.value}))}
              style={{ width:"100%", marginTop:8 }}/>
            <div style={{ textAlign:"center", color:S.blue, fontWeight:700 }}>₹{fmt(inp.sipMonthly||0)}/mo</div>
          </Field>
          <Field label="Expected Return">
            <select style={S.select} value={inp.expectedReturn||0.12} onChange={e=>set(p=>({...p,expectedReturn:+e.target.value}))}>
              {[0.08,0.10,0.11,0.12,0.13,0.14].map(r=><option key={r} value={r}>{(r*100).toFixed(0)}%</option>)}
            </select>
          </Field>
          <Field label="Inflation Rate">
            <select style={S.select} value={inp.inflationRate||0.06} onChange={e=>set(p=>({...p,inflationRate:+e.target.value}))}>
              {[0.04,0.05,0.06,0.07,0.08].map(r=><option key={r} value={r}>{(r*100).toFixed(0)}%</option>)}
            </select>
          </Field>
        </div>
      </div>
      <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onRedo}>
        🔄 Redo Wizard (re-enter all inputs)
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function Saarthi() {
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDone, setWizardDone] = useState(false);
  const [activeTab, setActiveTab] = useState("exec");
  const [errors, setErrors] = useState([]);

  const [inp, setInp] = useState({
    name:"", currentAge:35, retireCountry:"India", currentCountry:"India",
    retireAge:52, lifeExp:85, married:false, spouseName:"", spouseAge:35,
    incomeMonthly:0, incomeCurrency:"INR",
    expensesMonthly:0, expensesCurrency:"INR",
    sipMonthly:0, sipCurrency:"INR",
    salaryGrowth:0.05, sipStepUp:0.10,
    FX:{ ...DEFAULT_FX },
    children:[],
    portfolioMode:"simple",
    assets:[],
    housing:{ owned:true, budget:0, currency:"INR", targetYears:5,
              hasLoan:false, downPaymentPct:20, tenure:20, interestRate:8.5 },
    retireExpMonthly:100000, retireExpCurrency:"INR",
    travelAnnual:200000, healthcareAnnual:120000, otherAnnual:60000,
    withdrawalRule:"4pct", inflationRate:0.06, expectedReturn:0.12,
  });

  const calcs = useCalcs(inp);

  const validate = (step) => {
    const errs = [];
    if (step===1 && !inp.name) errs.push("Please enter your name");
    if (step===2 && !inp.incomeMonthly) errs.push("Please enter monthly income");
    if (step===6 && !inp.retireExpMonthly) errs.push("Please enter expected retirement expenses");
    setErrors(errs);
    return errs.length===0;
  };

  const next = () => {
    if (!validate(wizardStep)) return;
    if (wizardStep===6) { setWizardDone(true); return; }
    setWizardStep(s=>Math.min(6,s+1));
    setErrors([]);
  };
  const prev = () => { setWizardStep(s=>Math.max(1,s-1)); setErrors([]); };

  const TABS = [
    { id:"exec",     label:"📊 Summary" },
    { id:"portfolio",label:"💼 Portfolio" },
    { id:"mc",       label:"🎲 Monte Carlo" },
    { id:"children", label:"👨‍👩‍👧 Children" },
    { id:"housing",  label:"🏠 Housing" },
    { id:"cashflow", label:"📅 Cashflow" },
    { id:"scenarios",label:"🔮 Scenarios" },
    { id:"optimize", label:"⚡ Optimize" },
    { id:"settings", label:"⚙️ Settings" },
  ];

  if (!wizardDone) {
    return (
      <div style={S.app}>
        <div style={{ maxWidth:760, margin:"0 auto", padding:24 }}>
          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🪔</div>
            <h1 style={S.h1}>Saarthi</h1>
            <p style={{ color:"#64748B", margin:"8px 0 0" }}>Your Personal Retirement Planning Guide</p>
          </div>

          <WizardProgress step={wizardStep}/>

          <div style={S.card}>
            {wizardStep===1 && <Step1 inp={inp} set={setInp}/>}
            {wizardStep===2 && <Step2 inp={inp} set={setInp}/>}
            {wizardStep===3 && <Step3 inp={inp} set={setInp}/>}
            {wizardStep===4 && <Step4 inp={inp} set={setInp}/>}
            {wizardStep===5 && <Step5 inp={inp} set={setInp}/>}
            {wizardStep===6 && <Step6 inp={inp} set={setInp}/>}
          </div>

          {errors.length>0 && (
            <div style={{ background:"#1A0808", border:"1px solid #3A1010", borderRadius:8, padding:12, marginBottom:12 }}>
              {errors.map((e,i)=><div key={i} style={{ color:S.red, fontSize:13 }}>⚠️ {e}</div>)}
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <button style={{ ...S.btn, ...S.btnSecondary, opacity:wizardStep===1?0.4:1 }}
              onClick={prev} disabled={wizardStep===1}>← Back</button>
            <button style={{ ...S.btn, ...(wizardStep===6?S.btnGreen:S.btnPrimary) }} onClick={next}>
              {wizardStep===6?"🚀 View My Plan →":"Next →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div style={S.app}>
      {/* Top bar */}
      <div style={{ background:"#0C1422", borderBottom:"1px solid #1E2D4A", padding:"12px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:24 }}>🪔</span>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Saarthi — {inp.name}'s Retirement Plan</div>
            <div style={{ fontSize:11, color:"#64748B" }}>Retire at {inp.retireAge} · Life to {inp.lifeExp} · {calcs.years} years to go</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ textAlign:"center", padding:"4px 16px", background:"#0A1020", borderRadius:8 }}>
            <div style={{ fontSize:10, color:"#64748B" }}>Readiness</div>
            <div style={{ fontSize:18, fontWeight:700,
              color:calcs.score>=70?S.green:calcs.score>=50?S.amber:S.red }}>{calcs.score.toFixed(0)}%</div>
          </div>
          <div style={{ textAlign:"center", padding:"4px 16px", background:"#0A1020", borderRadius:8 }}>
            <div style={{ fontSize:10, color:"#64748B" }}>Corpus</div>
            <div style={{ fontSize:14, fontWeight:700, color:S.blue }}>{fmtCr(calcs.proj.total)}</div>
          </div>
          <div style={{ textAlign:"center", padding:"4px 16px", background:"#0A1020", borderRadius:8 }}>
            <div style={{ fontSize:10, color:"#64748B" }}>MC Rate</div>
            <div style={{ fontSize:14, fontWeight:700, color:calcs.mc.successRate>=0.8?S.green:S.amber }}>
              {(calcs.mc.successRate*100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", overflowX:"auto", background:"#0C1422", borderBottom:"1px solid #1E2D4A", padding:"0 16px" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ padding:"12px 16px", border:"none", cursor:"pointer", background:"transparent",
              color:activeTab===t.id?"#F8FAFC":"#64748B",
              borderBottom:`2px solid ${activeTab===t.id?S.blue:"transparent"}`,
              fontWeight:activeTab===t.id?700:400, fontSize:13, whiteSpace:"nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:24 }}>
        {activeTab==="exec"      && <ExecTab inp={inp} c={calcs}/>}
        {activeTab==="portfolio" && <PortfolioTab inp={inp} c={calcs}/>}
        {activeTab==="mc"        && <MCTab inp={inp} c={calcs}/>}
        {activeTab==="children"  && <ChildrenTab inp={inp} c={calcs}/>}
        {activeTab==="housing"   && <HousingTab inp={inp} c={calcs}/>}
        {activeTab==="cashflow"  && <CashflowTab inp={inp} c={calcs}/>}
        {activeTab==="scenarios" && <ScenariosTab inp={inp} c={calcs}/>}
        {activeTab==="optimize"  && <OptimizeTab inp={inp} c={calcs}/>}
        {activeTab==="settings"  && <SettingsTab inp={inp} set={setInp} onRedo={()=>{setWizardDone(false);setWizardStep(1);}}/>}
      </div>
    </div>
  );
}
