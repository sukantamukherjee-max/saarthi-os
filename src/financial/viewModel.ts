import type { ChangeEvent, CSSProperties } from 'react';
import type { Model } from './model';
import type { Assumptions, AssetClass } from './types';

export type Screen = 'overview' | 'portfolio' | 'retirement' | 'timeline' | 'education' | 'marriage' | 'risk' | 'recommendations' | 'assumptions' | 'upload';
export const SCREENS: Screen[] = ['overview', 'portfolio', 'retirement', 'timeline', 'education', 'marriage', 'risk', 'recommendations', 'assumptions', 'upload'];

export interface UIState {
  screen: Screen;
  navOpen: boolean;
  whatIf: boolean;
  viewport: 'desktop' | 'mobile';
  mode: 'Data' | 'Advisor' | 'Strong Advisor' | 'AI Advisor';
  openClass: AssetClass | null;
  uploads: Record<string, number>;
  night: boolean;
}

export interface ViewModelActions {
  goScreen: (s: Screen) => void;
  setUiPatch: (patch: Partial<UIState>) => void;
  setA: (patch: Partial<Assumptions>) => void;
  replaceA: (obj: Assumptions) => void;
  setBase: (obj: Assumptions) => void;
  toggleNight: () => void;
  resetAll: () => void;
  resetWhatIf: () => void;
  commitWhatIf: () => void;
}

export function buildViewModel(
  model: Model,
  ui: UIState,
  a: Assumptions,
  base: Assumptions,
  mc10k: any,
  mc10kKey: string | null,
  actions: ViewModelActions,
  demoBanner: boolean
) {
  const st = ui;
  const m = model.core(a, mc10k, mc10kKey);
  const eff = m.m10 || m.mc;
  const simNote = (m.m10 ? '10,000' : m.mc.n.toLocaleString('en-US')) + ' simulations' + (m.m10 ? '' : ' · refining');
  const total = model.total(), invested = model.invested();
  const gainPct = invested ? (total - invested) / invested : 0;
  const scr = st.screen;

  const go: Record<string, () => void> = {};
  SCREENS.forEach(s => { go[s] = () => actions.goScreen(s); });
  const act: Record<string, boolean> = {}; Object.keys(go).forEach(s => act[s] = scr === s);
  const is: Record<string, boolean> = {}; Object.keys(go).forEach(s => is[s] = scr === s);

  // Evenly spaced by position in the list, not by actual age value — ages like
  // 42/50/52/55/60/90 are unevenly gapped in real years, but as tick labels
  // under a slider they should read as a uniform row, not bunch up visually.
  const tl = (ages: number[], lo: number, hi: number, cur: number) => ages.map((g, i) => ({
    age: g,
    style: 'position:absolute;left:' + (i / (ages.length - 1) * 100) + '%;transform:translateX(-50%);font-size:11px;font-variant-numeric:tabular-nums;' + (g === cur ? 'color:var(--color-accent);font-weight:600' : 'opacity:.45'),
  }));

  /* overview */
  const hw = m.health.parts.slice().sort((x: any, y: any) => x.v - y.v)[0];
  const statusWord = eff.succ >= .9 && m.emg.gap >= 0 && m.risk.score < 55 ? 'on track' : eff.succ >= .75 ? 'partially on track' : 'off track';
  const ov: any = {
    status: 'You are currently ' + statusWord + '. Retirement at ' + a.retireAge + ' carries a ' + model.pc(eff.succ) + ' success probability, but ' + (m.risk.drivers[0].v > 70 ? 'concentration risk and ' : '') + (m.emg.gap < 0 ? 'a thin emergency reserve' : 'the education funding spike') + ' are the binding constraints.',
    simNote,
    wealth: model.omr(total), wealthINR: model.oi(total, a), gain: model.sign(total - invested) + ' OMR (' + model.pc(gainPct, 1) + ')',
    retProb: model.pc(eff.succ), retAge: a.retireAge, viable: m.viable[.9] || 'beyond 60',
    eduProb: model.pc(eff.edu), eduLine: a.eduCountry + ' · ' + a.eduTier + ' · starts age ' + a.eduStartAge, eduTotal: model.omrK(m.edu.tOMR),
    emgCur: model.omr(m.emg.cur), emgRec: model.omr(m.emg.rec), emgMonths: m.emg.months,
    emgGap: (m.emg.gap >= 0 ? 'Surplus ' : 'Short ') + model.omr(Math.abs(m.emg.gap)), emgToneCss: model.tone(m.emg.gap >= 0),
    health: m.health.score, healthWord: m.health.score >= 80 ? 'Strong' : m.health.score >= 65 ? 'Sound, with gaps' : 'Needs attention', healthWeak: hw.label,
    bars: m.health.parts.map((p: any) => ({ label: p.label, val: Math.round(p.v), fill: model.fill(p.v) })),
    req: model.omrK(m.req), reqINR: model.oi(m.req, a), proj: model.omrK(eff.atR.p50), projINR: model.oi(eff.atR.p50, a),
    timeline: tl([42, 50, 52, 55, 60, 90], 42, 90, a.retireAge),
    retNote: m.gap > 0 ? 'Median projection falls ' + model.omrK(m.gap) + ' short of the required corpus at age ' + a.retireAge + '. Required annual investment rises to ' + model.omr(m.reqSave) + '.' : 'Median projection clears the required corpus at age ' + a.retireAge + ' with ' + model.omrK(eff.atR.p50 - m.req) + ' of headroom.',
    attention: [] as any[], actions: [] as any[],
  };
  const atts: any[] = [];
  if (m.risk.drivers[0].v > 70) atts.push({ title: 'Crypto concentration', tag: 'Risk', body: 'Crypto is ' + m.risk.drivers[0].note + ' of investable wealth, and Bitcoin alone is ' + model.pc(m.risk.maxHold, 1) + '. A 70% crypto drawdown removes ' + model.omrK(model.byClass('Crypto') * .7) + ' from the plan.' });
  if (m.emg.gap < 0) atts.push({ title: 'Emergency reserve below target', tag: 'Liquidity', body: 'Recommended ' + model.omr(m.emg.rec) + ' (' + m.emg.months + ' months); you hold ' + model.omr(m.emg.cur) + '.' });
  atts.push({ title: 'Education funding spike', tag: 'Goal', body: a.eduCountry + ' ' + a.eduTier + ' costs ' + model.omrK(m.edu.tOMR) + ' across ' + m.edu.lines.length + ' years starting when you are ' + (a.currentAge + m.edu.startIn) + ' — the single largest outflow before retirement.' });
  if (m.gap > 0) atts.push({ title: 'Retirement funding gap', tag: 'Retirement', body: 'Median corpus is ' + model.omrK(m.gap) + ' short at age ' + a.retireAge + '.' });
  atts.push({ title: 'Contribution pattern is irregular', tag: 'Data', body: 'Averaging OMR ' + model.n0(a.contribution) + '/month in lump sums. Forecasts use the annual average, not a fixed SIP.' });
  ov.attention = atts.slice(0, 3).map((x, i) => ({ ...x, n: String(i + 1).padStart(2, '0'), tagStyle: 'font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:2px 9px;border-radius:999px;background:var(--pw-o);color:#fff' }));
  const smallCryptoOMR = total ? model.HOLD.filter(x => x.c === 'Crypto' && x.cur / total < 0.01).reduce((s, x) => s + x.cur, 0) : 0;
  const actionLines: string[] = [
    (m.emg.gap < 0 ? 'Add ' + model.omr(-m.emg.gap) + ' to the liquid reserve before any new equity purchase.' : 'Hold the reserve at ' + model.omr(m.emg.cur) + '; it covers ' + m.emg.months + ' months.'),
  ];
  if (smallCryptoOMR > 0) actionLines.push('Trim the altcoin basket (' + model.omr(smallCryptoOMR) + ') — sub-1% positions with no thesis on file.');
  actionLines.push(
    'Open an education bucket and earmark ' + model.omrK(m.edu.tOMR / Math.max(1, m.edu.startIn)) + '/year for the next ' + m.edu.startIn + ' years.',
    'Continue the ' + model.omr(a.contribution) + '/month average pace; it is the assumption the whole plan rests on.',
    'Revisit the retirement target at age 45, once ' + (45 - a.currentAge) + ' more years of actual contributions are on record.',
  );
  ov.actions = actionLines.map((t, i) => ({ n: String(i + 1), text: t }));

  /* portfolio */
  const w = model.weights();
  const CIRC = 2 * Math.PI * 70;
  let off = 0;
  const segs = model.KEYS.map((k, i) => { const len = w[i] * CIRC; const s = { color: model.COL[k], dash: len.toFixed(2) + ' ' + (CIRC - len).toFixed(2), offset: (-off).toFixed(2), onClick: () => actions.setUiPatch({ openClass: k }) }; off += len; return s; });
  const classes = model.KEYS.map((k, i) => {
    const cur = model.byClass(k), inv = model.HOLD.filter(x => x.c === k).reduce((s, x) => s + x.inv, 0);
    return { name: k, swatch: 'display:block;width:10px;height:10px;border-radius:2px;background:' + model.COL[k], cur: model.omr(cur), pl: model.sign(cur - inv), plCss: model.tone(cur >= inv), w: model.pc(w[i], 1), risk: model.RISKW[k], ccy: model.CCYW[k], onClick: () => actions.setUiPatch({ openClass: k }) };
  });
  let detail: any = null;
  if (st.openClass) {
    const k = st.openClass, i = model.KEYS.indexOf(k);
    const cur = model.byClass(k), inv = model.HOLD.filter(x => x.c === k).reduce((s, x) => s + x.inv, 0);
    const vols: Record<string, number> = { 'Indian Equity': a.vIN, 'US Equity': a.vUS, Crypto: a.vCR, 'Liquid Fund': a.vLQ, Cash: a.vCA, Gold: a.vGO };
    detail = { name: k, inv: model.omr(inv), cur: model.omr(cur), pl: model.sign(cur - inv) + ' (' + model.pc((cur - inv) / inv, 1) + ')', plCss: model.tone(cur >= inv), w: model.pc(w[i], 1), vol: vols[k] + '% p.a.', ccy: model.CCYW[k], note: k === 'Crypto' ? 'No allocation cap is imposed on this sleeve. At ' + model.pc(w[i], 1) + ' it is the second-largest driver of plan volatility; stress tests run at −50%, −70% and −90%.' : k === 'US Equity' ? 'VOO and QQQ overlap heavily on the mega-caps. Effective single-name concentration is higher than the line items suggest.' : k === 'Liquid Fund' ? 'Yielding approximately 4%. This sleeve plus cash forms the emergency reserve; after your return to India it should shift to INR savings.' : 'Weight is inside the policy band implied by your assumptions.' };
  }
  const rows = model.HOLD.map(x => {
    const { rec, why } = model.recommend(x, total);
    return {
      id: x.id, isDemo: !!x.isDemo, ticker: x.ticker ?? null,
      n: x.n, c: x.c, q: x.q, invRaw: x.inv, curRaw: x.cur, fresh: x.fresh, cur: model.omr(x.cur), pl: model.sign(x.cur - x.inv), plCss: model.tone(x.cur >= x.inv), w: model.pc(x.cur / total, 1), risk: model.RISKW[x.c], rec, conf: x.cf, why,
      recStyle: 'font-size:10px;letter-spacing:.07em;padding:2px 9px;border-radius:999px;text-transform:uppercase;' + (rec === 'SELL' || rec === 'REDUCE' ? 'border:1px solid var(--pw-neg);color:var(--pw-neg)' : rec === 'BUY' ? 'border:1px solid var(--pw-pos);color:var(--pw-pos)' : rec === 'WATCH' ? 'border:1px dashed var(--color-divider);opacity:.75' : 'border:1px solid var(--color-divider);opacity:.75'),
    };
  });
  const pf = {
    segs, classes, detail, rows, total: model.omr(total), totalINR: model.oi(total, a),
    perf: [
      { label: 'Absolute return', note: 'Current value vs cost basis · FACT', value: model.pc(gainPct, 1), css: model.tone(true) },
      { label: 'Unrealised gain', note: 'Across ' + model.HOLD.length + ' holdings', value: model.omr(total - invested), css: model.tone(true) },
      { label: 'XIRR', note: 'Transaction history missing for 6 holdings', value: 'Not calculated', css: 'opacity:.55;font-style:italic' },
      { label: 'Time-weighted return', note: 'Requires dated cash flows', value: 'Not calculated', css: 'opacity:.55;font-style:italic' },
      { label: 'Real return after inflation', note: 'Needs a holding-period start date', value: 'Not calculated', css: 'opacity:.55;font-style:italic' },
    ],
    bench: [{ name: 'Nifty 50' }, { name: 'Nifty 500' }, { name: 'S&P 500' }, { name: 'Nasdaq 100' }, { name: 'Crypto benchmark' }, { name: 'Custom allocation benchmark' }].map(b => ({ name: b.name, value: 'Data unavailable — manual input required' })),
  };

  /* retirement */
  const band = eff.band || m.mc.band;
  const maxY = Math.max(Math.max(...band.map((b: any) => b.p50)) * 2.4, m.req * 1.25);
  const X = (i: number) => (i / (band.length - 1)) * 900;
  const Y = (v: number) => Math.max(0, 220 - (v / maxY) * 220);
  const p50 = 'M' + band.map((b: any, i: number) => X(i).toFixed(1) + ' ' + Y(b.p50).toFixed(1)).join(' L');
  const bandPath = 'M' + band.map((b: any, i: number) => X(i).toFixed(1) + ' ' + Y(b.p90).toFixed(1)).join(' L') + ' L' + band.slice().reverse().map((b: any, i: number) => X(band.length - 1 - i).toFixed(1) + ' ' + Y(b.p10).toFixed(1)).join(' L') + ' Z';
  const stressData = (scr === 'risk' || scr === 'retirement') ? model.stress(a) : null;
  const rt: any = {
    currentAge: a.currentAge, planAge: a.planAge, retAge: a.retireAge, returnAge: a.returnAge, simNote,
    prob: model.pc(eff.succ), req: model.omrK(m.req), reqINR: model.oi(m.req, a), proj: model.omrK(eff.atR.p50), projINR: model.oi(eff.atR.p50, a),
    reqSave: model.omr(m.reqSave), curSave: model.omr(a.contribution * 12),
    timeline: tl([42, 50, 52, 55, 60, 90], 42, 90, a.retireAge),
    thresholds: [{ pct: '80%', age: m.viable[.8] || 'Beyond 60' }, { pct: '90%', age: m.viable[.9] || 'Beyond 60' }, { pct: '95%', age: m.viable[.95] || 'Beyond 60' }],
    band: bandPath, p50, reqLine: 'M0 ' + Y(m.req).toFixed(1) + ' L900 ' + Y(m.req).toFixed(1), retX: X(a.retireAge - a.currentAge).toFixed(1),
    ticks: [42, 52, 60, 70, 80, 90].map(g => ({ x: X(g - a.currentAge).toFixed(1), label: g })),
    spendConservative: a.spendMode === 'Conservative', spendBase: a.spendMode === 'Base', spendComfortable: a.spendMode === 'Comfortable',
    travelFixed: a.travelMode === 'Fixed', travelPercent: a.travelMode === 'Percent', travelLifestyle: a.travelMode === 'Lifestyle',
    shockLabel: '−35%',
    emgRec: model.omr(m.emg.rec), emgCur: model.omr(m.emg.cur), emgMonths: m.emg.months, emgGap: (m.emg.gap >= 0 ? '+' : '−') + model.n0(Math.abs(m.emg.gap)), emgCss: model.tone(m.emg.gap >= 0),
    emgDrivers: [
      { label: 'Base cover', value: '6.0 months' },
      { label: 'Job risk premium', value: '+' + a.jobRisk.toFixed(1) + ' months' },
      { label: 'Portfolio volatility premium', value: (w[2] > .15 ? '+1.5' : '+0.0') + ' months' },
      { label: 'Healthcare buffer', value: '+1.0 month' },
    ],
    returnRows: [
      { label: 'Before return', value: 'Income, expenses and savings in OMR' },
      { label: 'After return', value: 'Expenses and withdrawals in INR' },
      { label: 'Suggested INR-linked allocation', value: model.pc(Math.min(.65, .35 + Math.max(0, (a.currentAge + 10 - a.returnAge)) * .02), 0) },
      { label: 'Tax model after return', value: a.taxOn ? 'India resident' : 'Off — enable in Assumptions' },
    ],
  };
  const spendMult = { Conservative: .85, Base: 1, Comfortable: 1.25 }[a.spendMode];
  const yrsR = a.retireAge - a.currentAge;
  const todaySpend = a.indiaSpend * 12 * spendMult;
  rt.spendRows = [
    { label: 'India living cost today', value: model.inr(todaySpend / 12) + '/month' },
    { label: 'Annual, today’s money', value: model.inr(todaySpend) },
    { label: 'Inflated to age ' + a.retireAge + ' (' + a.inflIndia + '%)', value: model.inr(todaySpend * Math.pow(1 + a.inflIndia / 100, yrsR)) },
    { label: 'First-year withdrawal, all in', value: model.omr(model.retSpend(a, yrsR, a.retireAge, 0)) },
    { label: 'Required corpus at ' + a.retireAge, value: model.omrK(m.req) },
  ];
  const trav0 = a.travelMode === 'Fixed' ? a.travelBudget * 12 : a.travelMode === 'Percent' ? (todaySpend / a.fxOMRINR) * a.travelPct / 100 : a.travelBudget * 12 + 2000;
  rt.thRows = [
    { label: 'Desired travel lifestyle', tag: 'ASSUMPTION', value: model.omr(3500) + '/yr' },
    { label: 'Already inside monthly expenses', tag: 'FACT', value: model.omr(2000) + '/yr' },
    { label: 'Incremental travel budget', tag: 'ASSUMPTION', value: model.omr(trav0) + '/yr' },
    { label: 'Healthcare after retirement, today’s money', tag: 'ESTIMATE', value: model.inr(a.healthBase * (a.insurance ? .6 : 1)) + '/yr' },
    { label: 'Healthcare at age 75 (' + a.medInflation + '% + age escalation)', tag: 'ESTIMATE', value: model.inr(a.healthBase * (a.insurance ? .6 : 1) * Math.pow(1 + a.medInflation / 100, 75 - a.currentAge) * (1 + 15 * .025)) + '/yr' },
  ];
  rt.seq = stressData ? stressData.seq.map((s: any) => ({ label: s.label, corpus: model.omrK(s.corpus), prob: model.pc(s.prob), css: model.tone(s.prob >= .8) })) : [];

  /* lifetime timeline — full path from today, per-asset-class, INR after return to India */
  const ddRaw = (scr === 'timeline') ? model.lifetimeTimeline(a) : [];
  const depletedRow = ddRaw.find((r: any) => r.depleted);
  const val = (v: number, r: any) => (r.inINR ? model.inr(v * r.fxRate) : model.omr(v));
  const dd = {
    spendConservative: a.spendMode === 'Conservative', spendBase: a.spendMode === 'Base', spendComfortable: a.spendMode === 'Comfortable',
    currentAge: a.currentAge, retAge: a.retireAge, returnAge: a.returnAge, planAge: a.planAge,
    depleteAge: depletedRow ? depletedRow.age : null,
    maxInflow: Math.max(1, ...ddRaw.map((r: any) => r.inflow)),
    maxOutflow: Math.max(1, ...ddRaw.map((r: any) => r.outflow)),
    ledger: ddRaw.map((r: any) => ({
      age: r.age, phase: r.phase, justReturned: r.age === a.returnAge,
      inflow: r.inflow, outflow: r.outflow,
      inflowStr: r.inflow > 0 ? val(r.inflow, r) : null,
      outflowStr: r.outflow > 0 ? val(r.outflow, r) : null,
    })),
    rows: ddRaw.map((r: any) => ({
      age: r.age, phase: r.phase, ccy: r.inINR ? 'INR' : 'OMR',
      start: val(r.startTotal, r), end: val(r.endTotal, r),
      growth: model.sign(r.inINR ? r.growth * r.fxRate : r.growth), growthCss: model.tone(r.growth >= 0),
      contrib: r.contrib > 0 ? val(r.contrib, r) : null,
      living: r.living > 0 ? val(r.living, r) : null, travel: r.travel > 0 ? val(r.travel, r) : null, health: r.health > 0 ? val(r.health, r) : null,
      edu: r.eduOut > 0 ? val(r.eduOut, r) : null, mar: r.marOut > 0 ? val(r.marOut, r) : null,
      outflow: r.outflow > 0 ? val(r.outflow, r) : null,
      byClass: model.KEYS.map(k => ({ key: k, value: r.byClassEnd[k] > 0 ? val(r.byClassEnd[k], r) : '—', color: model.COL[k] })),
      fd: r.fdEnd > 0 ? val(r.fdEnd, r) : '—',
      liquidatedNote: r.liquidated > 0 ? 'US Equity + Crypto liquidated: ' + val(r.liquidated, r) + ' → FD' : null,
      depleted: r.depleted,
    })),
    chart: ddRaw.map((r: any) => ({
      age: r.age,
      'Indian Equity': Math.round(r.byClassEnd['Indian Equity']), 'US Equity': Math.round(r.byClassEnd['US Equity']),
      Crypto: Math.round(r.byClassEnd['Crypto']), 'Liquid Fund': Math.round(r.byClassEnd['Liquid Fund']),
      Cash: Math.round(r.byClassEnd['Cash']), Gold: Math.round(r.byClassEnd['Gold']),
      'FD (US/Crypto sale)': Math.round(r.fdEnd),
      outflow: Math.round(r.outflow),
    })),
  };

  /* education */
  const c = m.edu.c;
  const brkPct: [string, number][] = a.eduCountry === 'India'
    ? [['Tuition & fees', .62], ['Hostel / accommodation', .16], ['Food', .09], ['Books & materials', .03], ['Laptop & equipment', .02], ['Local transport', .03], ['Personal expenses', .03], ['Emergency allowance', .02]]
    : [['Tuition & fees', .55], ['Accommodation', .20], ['Food', .09], ['Health insurance', .03], ['Visa & compliance', .01], ['Flights', .04], ['Local transport', .02], ['Books & materials', .015], ['Laptop & equipment', .01], ['Personal expenses', .02], ['Emergency allowance', .015]];
  const annual = c.tiers[a.eduTier];
  const pgCountry = a.eduPGCountry || a.eduCountry;
  const ed: any = {
    dAge: a.daughterAge, startAge: a.eduStartAge, startsIn: m.edu.startIn, parentAge: a.currentAge + m.edu.startIn,
    country: a.eduCountry, pgCountry, tier: a.eduTier, ccy: c.ccy, pgCcy: m.edu.cPG.ccy, pg: a.eduPG, mixedCountries: m.edu.mixedCountries,
    tierBudget: a.eduTier === 'Budget', tierMainstream: a.eduTier === 'Mainstream', tierPremium: a.eduTier === 'Premium',
    countries: Object.keys(model.C).map(k => {
      const cc = model.C[k];
      const alt = model.eduPlan({ ...a, eduCountry: k });
      return { name: k, years: cc.ug + ' yrs UG' + (a.eduPG ? ' + ' + model.C[pgCountry].pg + ' PG' : ''), annual: cc.ccy + ' ' + model.n0(cc.tiers[a.eduTier]), total: model.omrK(alt.tOMR), totalINR: model.inr(alt.tOMR * a.fxOMRINR), onClick: () => actions.setA({ eduCountry: k }), style: 'padding:14px 16px;border:1px solid ' + (k === a.eduCountry ? 'var(--color-accent)' : 'var(--color-divider)') + ';border-radius:var(--radius-md);cursor:pointer;background:' + (k === a.eduCountry ? 'var(--color-accent-100)' : 'transparent') };
    }),
    // Only meaningful once Postgraduate is switched on — lets PG happen in a
    // different country than undergraduate (e.g. UG in India, PG abroad).
    pgCountries: Object.keys(model.C).map(k => {
      const cc = model.C[k];
      const alt = model.eduPlan({ ...a, eduPGCountry: k });
      return { name: k, years: cc.pg + ' yrs PG', annual: cc.ccy + ' ' + model.n0(cc.tiers[a.eduTier]), total: model.omrK(alt.tOMR), totalINR: model.inr(alt.tOMR * a.fxOMRINR), onClick: () => actions.setA({ eduPGCountry: k }), style: 'padding:14px 16px;border:1px solid ' + (k === pgCountry ? 'var(--color-accent)' : 'var(--color-divider)') + ';border-radius:var(--radius-md);cursor:pointer;background:' + (k === pgCountry ? 'var(--color-accent-100)' : 'transparent') };
    }),
    breakdown: brkPct.map(b => ({ name: b[0], local: model.n0(annual * b[1]), omr: model.n0(annual * b[1] * c.fx), inr: model.n0(annual * b[1] * c.fx * a.fxOMRINR) })),
    lines: m.edu.lines.map((l: any) => ({ when: 'you are ' + l.age, kind: l.kind, dAge: l.dAge, local: l.ccy + ' ' + model.n0(l.local), omr: model.omr(l.omr) })),
    total: model.omrK(m.edu.tOMR), totalINR: model.inr(m.edu.tOMR * a.fxOMRINR),
    totalLocal: m.edu.tLocal != null ? c.ccy + ' ' + model.n0(m.edu.tLocal) : c.ccy + ' ' + model.n0(m.edu.tLocalUG) + ' (UG) + ' + m.edu.cPG.ccy + ' ' + model.n0(m.edu.tLocalPG) + ' (PG)',
    fxRisk: model.omrK(m.edu.tOMR * 0.10),
  };
  const scenDefs = [
    { kicker: 'Dream', name: 'Fully fund the chosen path', body: 'Meet the ' + a.eduCountry + ' ' + a.eduTier + ' cost in full from portfolio and future savings, with no reduction in tier or duration.', A: { ...a } },
    { kicker: 'Retirement protected', name: 'Retirement first', body: 'Cap the education draw so retirement probability stays at or above your 90% threshold. Tier steps down where required.', A: { ...a, eduTier: (a.eduTier === 'Premium' ? 'Mainstream' : 'Budget') as Assumptions['eduTier'] } },
    { kicker: 'Optimized', name: 'Best combination', body: 'India undergraduate, overseas postgraduate. Cuts the overseas exposure to two years while keeping the international credential.', A: { ...a, eduCountry: 'India', eduPGCountry: a.eduCountry !== 'India' ? a.eduCountry : 'USA', eduPG: true } },
  ];
  ed.scenarios = scenDefs.map(s => {
    const alt = model.eduPlan(s.A);
    const mm = model.mc(s.A, 500, false);
    let va: number | null = null; for (let R = 50; R <= 60 && va === null; R++) { if (model.mc(s.A, 300, false, { retireAge: R }).succ >= .9) va = R; }
    return { kicker: s.kicker, name: s.name, body: s.body, cost: model.omrK(alt.tOMR), prob: model.pc(mm.succ), css: model.tone(mm.succ >= .9), ageImpact: va ? (va === a.retireAge ? 'no change' : (va > a.retireAge ? '+' : '−') + Math.abs(va - a.retireAge) + ' yrs (age ' + va + ')') : 'beyond 60' };
  });

  /* marriage */
  const mp = m.mar;
  const mrReq = mp.flow.omr / Math.pow(1 + m.ms.mu, mp.yr);
  const mrAlt = model.mc({ ...a, marriageTier: 'Basic' }, 400, false);
  const mr = {
    age: a.marriageAge, years: mp.yr, parentAge: mp.age,
    tBasic: a.marriageTier === 'Basic', tModerate: a.marriageTier === 'Moderate', tHigh: a.marriageTier === 'High', tPremium: a.marriageTier === 'Premium',
    lWB: a.marriageLoc === 'West Bengal / Tier-2', lT1: a.marriageLoc === 'Major Tier-1 city', lDest: a.marriageLoc === 'Indian destination',
    rows: [
      { label: 'Cost in today’s money', note: a.marriageTier + ' · ' + a.marriageLoc, value: model.inr(mp.today), sub: model.omr(mp.today / a.fxOMRINR) },
      { label: 'Expected cost at marriage', note: 'Inflated at ' + a.marriageInfl + '% for ' + mp.yr + ' years', value: model.inr(mp.then), sub: model.omr(mp.flow.omr) },
      { label: 'Corpus needed today', note: 'Discounted at the portfolio return', value: model.omr(mrReq), sub: model.inr(mrReq * a.fxOMRINR) },
      { label: 'Funding gap', note: 'Against a dedicated marriage bucket of zero', value: model.omr(mrReq), sub: 'No bucket funded yet', css: model.tone(false) },
      { label: 'Retirement probability impact', note: 'Versus dropping to the Basic tier', value: model.pc(eff.succ) + ' → ' + model.pc(mrAlt.succ), sub: 'Lowest-priority goal in your hierarchy' },
    ],
    sources: [
      { label: 'Basic wedding, Tier-2 India', value: model.inr(model.MT.Basic), src: 'ESTIMATE · published 2026 market ranges · widely variable' },
      { label: 'Moderate wedding, Tier-2 India', value: model.inr(model.MT.Moderate), src: 'ESTIMATE · published 2026 market ranges' },
      { label: 'High', value: model.inr(model.MT.High), src: 'ESTIMATE · published 2026 market ranges' },
      { label: 'Premium / luxury', value: model.inr(model.MT.Premium), src: 'ESTIMATE · published 2026 market ranges' },
      { label: 'Tier-1 city multiplier', value: '×1.35', src: 'ASSUMPTION · editable' },
      { label: 'Indian destination multiplier', value: '×1.80', src: 'ASSUMPTION · editable' },
      { label: 'Wedding-cost inflation', value: a.marriageInfl + '%', src: 'ASSUMPTION · above general CPI' },
    ],
  };

  /* risk */
  // Matches model.risk()'s maxHold: concentration risk only counts volatile
  // holdings — a large Liquid Fund/Cash position isn't a concentration bet.
  const volatileHold = model.HOLD.filter(x => x.c !== 'Liquid Fund' && x.c !== 'Cash');
  const largestHolding = volatileHold.length ? volatileHold.reduce((a, b) => (b.cur > a.cur ? b : a)) : null;
  const cryptoHoldings = model.HOLD.filter(x => x.c === 'Crypto').slice().sort((a, b) => b.cur - a.cur);
  const rk = {
    score: m.risk.score, word: m.risk.score >= 70 ? 'Elevated' : m.risk.score >= 50 ? 'Moderate' : 'Contained',
    drivers: m.risk.drivers.map((d: any) => ({ label: d.label, val: d.note, fill: model.fill(d.v, d.v > 70 ? 'var(--pw-o)' : 'var(--color-accent)') })),
    expo: [
      { label: 'Largest single asset', note: largestHolding ? largestHolding.n : '—', value: model.pc(m.risk.maxHold, 1), css: m.risk.maxHold > .12 ? model.tone(false) : '' },
      { label: 'Crypto sleeve', note: 'No cap imposed; measured, not limited', value: model.pc(w[2], 1), css: w[2] > .18 ? model.tone(false) : '' },
      { label: 'India exposure', note: 'Indian equity + gold', value: model.pc(m.risk.inr, 1), css: '' },
      { label: 'Non-INR exposure', note: 'Against future INR liabilities', value: model.pc(1 - m.risk.inr, 1), css: '' },
      { label: 'Liquid assets', note: 'Cash + liquid fund', value: model.pc(m.risk.liq, 1), css: '' },
      { label: 'Portfolio volatility', note: 'Weighted, with correlations', value: model.pc(m.ms.sig, 1), css: '' },
      { label: 'Expected drawdown', note: 'Approximately 2.2 sigma', value: '−' + model.pc(m.ms.sig * 2.2), css: model.tone(false) },
    ],
    stress: stressData ? stressData.scen.map((s: any) => ({ label: s.label, hit: '−' + model.omrK(s.loss), prob: model.pc(s.prob), css: model.tone(s.prob >= .8) })) : [],
    crypto: [
      { label: 'Total crypto', note: cryptoHoldings.length ? cryptoHoldings.map(x => x.n).join(', ') : 'No crypto holdings currently.', value: model.omr(model.byClass('Crypto')) + ' · ' + model.pc(w[2], 1) },
      ...cryptoHoldings.map((x, i) => ({ label: x.n, note: model.recommend(x, total).why, value: model.pc(total ? x.cur / total : 0, 1), css: i === 0 && total ? (x.cur / total > 0.12 ? model.tone(false) : '') : '' })),
      { label: 'Assumed volatility', note: 'Editable in Assumptions', value: a.vCR + '% p.a.' },
    ],
    jobloss: stressData ? stressData.jl.map((j: any) => ({ label: j.label, emg: model.omr(j.emg), port: model.omr(j.port), contrib: model.omr(j.contrib), prob: model.pc(j.prob), css: model.tone(j.prob >= .8) })) : [],
  };

  /* recommendations */
  const mode = st.mode;
  // 'AI Advisor' uses the Advisor-tier phrasing as its instant, always-available
  // fallback — RecommendationsPage overlays the AI-narrated prose once it arrives.
  const phrase = (data: string, adv: string, strong: string) => mode === 'Data' ? data : mode === 'Strong Advisor' ? strong : adv;
  const mkStyle = (act2: string) => 'font-size:10px;letter-spacing:.07em;padding:2px 9px;border-radius:999px;text-transform:uppercase;' + (['SELL', 'REDUCE', 'DELAY RETIREMENT'].includes(act2) ? 'border:1px solid var(--pw-neg);color:var(--pw-neg)' : ['BUY', 'INCREASE SAVINGS', 'BUILD RESERVE', 'PROTECT GOAL'].includes(act2) ? 'border:1px solid var(--pw-pos);color:var(--pw-pos)' : 'border:1px solid var(--color-divider);opacity:.8');
  const hasBroadUS500 = model.HOLD.some(h => /\bvoo\b|s&p\s?500/i.test(h.n));
  const hasBroadUSNasdaq = model.HOLD.some(h => /\bqqq\b|nasdaq\s?100/i.test(h.n));
  const lowConfHoldings = model.HOLD.filter(h => h.cf === 'Low');
  const recs: Record<string, any[]> = {
    'Do now': [
      m.emg.gap < 0 && { action: 'BUILD RESERVE', conf: 'High', title: 'Top up the emergency reserve by ' + model.omr(-m.emg.gap), body: phrase('Reserve held ' + model.omr(m.emg.cur) + ' against a modelled requirement of ' + model.omr(m.emg.rec) + ' (' + m.emg.months + ' months).', 'Direct the next two lump sums to the liquid fund before any new equity purchase.', 'Stop equity buying until the reserve is whole. With crypto at ' + model.pc(w[2], 1) + ', a forced sale in a drawdown is the single most expensive mistake available to you.'), impact: '+' + Math.round((1 - Math.min(1, m.emg.cur / m.emg.rec)) * 15) + ' health points', risk: 'Forced selling', fresh: 'From holdings, 24 Aug' },
      smallCryptoOMR > 0 && { action: 'SELL', conf: 'Medium', title: 'Exit the sub-1% crypto positions', body: phrase(cryptoHoldings.filter(h => total && h.cur / total < 0.01).length + ' position(s), each under 1% of wealth, combined ' + model.omr(smallCryptoOMR) + '. No transaction history on file.', 'Positions this small cannot move the plan but carry full idiosyncratic risk. Close them and fold the proceeds into the reserve.', 'Close them this month. They add measurable tail risk and zero expected contribution to any goal you have stated.'), impact: model.omr(smallCryptoOMR) + ' released', risk: 'Total loss of the sleeve', fresh: 'Manual, 24 Aug' },
      m.risk.drivers[0].v > 70 && cryptoHoldings.length > 0 && { action: 'REDUCE', conf: 'High', title: 'Trim ' + cryptoHoldings[0].n + ' toward a deliberate weight', body: phrase(cryptoHoldings[0].n + ' is ' + model.pc(total ? cryptoHoldings[0].cur / total : 0, 1) + ' of investable wealth; total crypto is ' + model.pc(w[2], 1) + '.', 'You have set no cap, which is legitimate. But a −70% crypto move removes ' + model.omrK(model.byClass('Crypto') * .7) + ' and pushes earliest viable retirement out.', 'Take the position down to a weight you would still hold after a −70% month. Anything you would not hold through that drawdown is a weight you have not actually chosen.'), impact: 'Risk score −' + Math.round(m.risk.drivers[0].v * .12), risk: 'Sequence risk near retirement', fresh: 'Manual, 24 Aug' },
    ].filter(Boolean),
    Consider: [
      { action: 'PROTECT GOAL', conf: 'Medium', title: 'Open a dedicated education bucket', body: phrase(a.eduCountry + ' ' + a.eduTier + ' totals ' + model.omrK(m.edu.tOMR) + ' across ' + m.edu.lines.length + ' years from age ' + (a.currentAge + m.edu.startIn) + '.', 'A virtual bucket funded at ' + model.omrK(m.edu.tOMR / Math.max(1, m.edu.startIn)) + '/year de-risks the largest pre-retirement outflow without changing any account.', 'Ring-fence it now. Education has the shortest runway of any goal you hold and no room to be deferred.'), impact: 'Education probability ' + model.pc(eff.edu), risk: 'Mid-plan liquidation', fresh: 'Model, 24 Aug' },
      hasBroadUS500 && hasBroadUSNasdaq && { action: 'REBALANCE', conf: 'Medium', title: 'Reduce the S&P 500 / Nasdaq 100 overlap', body: phrase('A Nasdaq 100 holding duplicates much of the mega-cap weight already inside your S&P 500 holding.', 'Consolidating into one broad US sleeve keeps the exposure and cuts the hidden single-name concentration.', 'Collapse one into the other. You are paying for concentration you did not choose.'), impact: 'Effective names +', risk: 'Hidden concentration', fresh: 'Close, 22 Aug' },
      (() => {
        const reqMonthly = m.reqSave / 12;
        // A savings-rate fix is only real advice if it fits inside actual income —
        // otherwise the model is printing a number nobody could act on.
        const feasible = reqMonthly <= a.salary;
        if (m.gap <= 0) {
          return { action: 'INCREASE SAVINGS', conf: 'Low', title: 'Current pace is sufficient', body: phrase('Modelled requirement ' + model.omr(m.reqSave) + '/year against ' + model.omr(a.contribution * 12) + ' today.', 'The median path already clears the required corpus; no increase is needed on current assumptions.', 'Hold the pace and resist lifestyle creep — this is the assumption the plan rests on.'), impact: 'Maintains ' + model.pc(eff.succ), risk: 'Delayed retirement', fresh: 'Model, 24 Aug' };
        }
        if (feasible) {
          return { action: 'INCREASE SAVINGS', conf: 'High', title: 'Lift the average contribution to ' + model.omr(reqMonthly) + '/month', body: phrase('Modelled requirement ' + model.omr(m.reqSave) + '/year against ' + model.omr(a.contribution * 12) + ' today.', 'This closes the median gap of ' + model.omrK(m.gap) + ' by age ' + a.retireAge + '.', 'Raise the pace or move the retirement date. Those are the only two levers that close this.'), impact: 'Closes ' + model.omrK(m.gap), risk: 'Delayed retirement', fresh: 'Model, 24 Aug' };
        }
        return { action: 'DELAY RETIREMENT', conf: 'Low', title: 'Saving alone can’t close this gap', body: phrase('Closing the ' + model.omrK(m.gap) + ' median gap by age ' + a.retireAge + ' would need ' + model.omr(reqMonthly) + '/month — above your ' + model.omr(a.salary) + '/month salary.', 'Even saving your entire salary would not close this by age ' + a.retireAge + '. The gap has to be closed by retiring later, cutting portfolio risk, or accepting a lower success probability instead.', 'This stopped being a savings-rate problem. See the retirement-age options below — that is the lever that actually works from here.'), impact: 'Unaffordable at current income', risk: 'Plan relies on an infeasible savings rate', fresh: 'Model, 24 Aug' };
      })(),
    ].filter(Boolean),
    Watch: [
      lowConfHoldings.length > 0 && { action: 'WATCH', conf: 'Low', title: lowConfHoldings.length + ' holding' + (lowConfHoldings.length > 1 ? 's' : '') + ' await verification', body: phrase(lowConfHoldings.map(h => h.n).join(', ') + ' ' + (lowConfHoldings.length > 1 ? 'have' : 'has') + ' low-confidence data on file.', 'No strong recommendation is issued on ' + (lowConfHoldings.length > 1 ? 'these' : 'this') + ' until you confirm the underlying values.', 'Confirm them. Advice on unverified quantities is guesswork wearing a suit.'), impact: model.pc(total ? lowConfHoldings.reduce((s, h) => s + h.cur, 0) / total : 0, 1) + ' of wealth', risk: 'Wrong basis for advice', fresh: 'Upload, 24 Aug' },
      { action: 'WATCH', conf: 'Medium', title: 'Currency mix against future INR liabilities', body: phrase(model.pc(1 - m.risk.inr, 1) + ' of wealth sits outside INR while retirement spending, education and marriage are largely INR or INR-adjacent.', 'Begin tilting toward INR-linked assets as the return-to-India age of ' + a.returnAge + ' approaches.', 'Set a glide path now: every year past age 50, move a defined slice into INR-linked assets rather than deciding under pressure.'), impact: 'FX sensitivity', risk: 'Adverse FX at drawdown', fresh: 'FX manual, 24 Aug' },
    ].filter(Boolean),
    'Long term': [
      { action: 'HOLD', conf: 'High', title: 'Keep contributions irregular but measured', body: phrase('Average ' + model.omr(a.contribution) + '/month, deployed as lump sums rather than a fixed SIP.', 'The model uses the annual average, so the pattern is fine — what matters is that the annual total is actually met.', 'Record every lump sum. The average is the only input holding this forecast together, and it is currently unaudited.'), impact: model.omr(a.contribution * 12) + '/yr', risk: 'Silent under-saving', fresh: 'Stated, 24 Aug' },
      { action: 'DELAY RETIREMENT', conf: m.viable[.95] && (m.viable[.95] as number) > a.retireAge ? 'Medium' : 'Low', title: 'Age ' + (m.viable[.95] || '60+') + ' reaches the 95% threshold', body: phrase('Earliest viable ages: ' + (m.viable[.8] || '60+') + ' at 80%, ' + (m.viable[.9] || '60+') + ' at 90%, ' + (m.viable[.95] || '60+') + ' at 95%.', 'If certainty matters more than the date, the extra years are the cheapest way to buy it.', 'Pick your threshold deliberately. A 90% plan and a 95% plan are different lives, not different spreadsheets.'), impact: 'Probability +' + model.pc(.95 - eff.succ > 0 ? .95 - eff.succ : 0), risk: 'Over-working for false precision', fresh: 'Model, 24 Aug' },
      { action: 'HOLD', conf: 'High', title: 'Land at Durgapur stays outside the plan', body: phrase('Approximately ₹30 lakh, illiquid.', 'No appreciation, rent or development proceeds are modelled. It is upside, not a funding source.', 'Do not let it justify a thinner reserve. Illiquid upside pays no school fees.'), impact: 'Excluded', risk: 'Overstated capacity', fresh: 'Stated, 24 Aug' },
    ],
  };
  const rc = {
    mData: mode === 'Data', mAdvisor: mode === 'Advisor', mStrong: mode === 'Strong Advisor', mAI: mode === 'AI Advisor',
    groups: Object.keys(recs).map(g => ({ name: g, note: ({ 'Do now': 'this month', Consider: 'this quarter', Watch: 'monitor, no action yet', 'Long term': 'structural' } as Record<string, string>)[g], items: recs[g].map(r => ({ ...r, actionStyle: mkStyle(r.action) })) })),
    withheld: 'No BUY recommendation is issued for any individual security. Live prices, benchmark levels and FX are manual inputs on this snapshot, and issuing a buy on stale data would breach the model’s own data rule.',
    aiContext: { retireAge: a.retireAge, retProb: model.pc(eff.succ), healthScore: m.health.score, riskScore: m.risk.score },
  };

  /* assumptions */
  const mk = (key: keyof Assumptions, label: string, unit: string, step: number, source: string, live?: 'OMR_INR' | 'OMR_USD') => ({ key, label, unit, step, source, value: a[key], live, onChange: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ [key]: parseFloat(e.target.value) || 0 } as Partial<Assumptions>) });
  const asGroups = { groups: [
    { name: 'Personal', items: [mk('currentAge', 'Current age', 'yrs', 1, 'FACT · stated'), mk('daughterAge', 'Daughter’s age', 'yrs', 1, 'FACT · stated'), mk('planAge', 'Planning age', 'yrs', 1, 'ASSUMPTION · 80–100 range')] },
    { name: 'Income', items: [mk('salary', 'Monthly salary', 'OMR', 50, 'FACT · stated'), mk('salaryGrowth', 'Salary growth', '%', .5, 'ASSUMPTION · below Oman CPI'), mk('contribution', 'Average monthly investment', 'OMR', 50, 'FACT · irregular lump sums, annual average used')] },
    { name: 'Expenses', items: [mk('expenses', 'Monthly expenses', 'OMR', 50, 'FACT · stated'), mk('expenseGrowth', 'Expense growth', '%', .5, 'ASSUMPTION'), mk('indiaSpend', 'India living cost, today', 'INR/mo', 5000, 'FACT · excludes travel and healthcare')] },
    { name: 'Inflation', items: [mk('inflIndia', 'India CPI', '%', .25, 'ASSUMPTION · long-run'), mk('inflOman', 'Oman CPI', '%', .25, 'ASSUMPTION · long-run'), mk('medInflation', 'Medical inflation', '%', .5, 'ESTIMATE · runs above CPI'), mk('marriageInfl', 'Wedding cost inflation', '%', .5, 'ESTIMATE')] },
    { name: 'Investment returns', items: [mk('rIN', 'Indian equity', '%', .25, 'ASSUMPTION · forward-looking, nominal'), mk('rUS', 'US equity', '%', .25, 'ASSUMPTION · forward-looking, USD'), mk('rCR', 'Crypto', '%', .5, 'ASSUMPTION · highly uncertain'), mk('rLQ', 'Liquid fund', '%', .25, 'FACT · approximately 4% today'), mk('rGO', 'Gold', '%', .25, 'ASSUMPTION')] },
    { name: 'Volatility', items: [mk('vIN', 'Indian equity', '%', 1, 'ESTIMATE · long-run'), mk('vUS', 'US equity', '%', 1, 'ESTIMATE · long-run'), mk('vCR', 'Crypto', '%', 5, 'ESTIMATE · long-run'), mk('vGO', 'Gold', '%', 1, 'ESTIMATE')] },
    { name: 'Education', items: [mk('eduStartAge', 'Undergraduate start age', 'yrs', 1, 'ASSUMPTION · 17–22'), mk('pgGap', 'Gap before postgraduate', 'yrs', 1, 'ASSUMPTION')] },
    { name: 'Marriage', items: [mk('marriageAge', 'Marriage age', 'yrs', 1, 'ASSUMPTION · 25–30')] },
    { name: 'Healthcare', items: [mk('healthBase', 'Healthcare cost after retirement (today’s INR)', 'INR/yr', 5000, 'ESTIMATE · applies from retirement age onward, not before')] },
    { name: 'Currency', items: [
      mk('fxOMRINR', 'OMR / INR today', 'rate', .1, 'MANUAL OVERRIDE · refresh from live rate, or type your own', 'OMR_INR'),
      mk('fxOMRUSD', 'OMR / USD today', 'rate', .001, 'MANUAL OVERRIDE · used for USA education costs; refresh from live rate', 'OMR_USD'),
      mk('fxDrift', 'INR depreciation vs OMR', '%/yr', .25, 'ASSUMPTION · purchasing-power drift; without it, Indian inflation is counted twice'),
    ] },
    { name: 'Retirement', items: [mk('retireAge', 'Target retirement age', 'yrs', 1, 'ASSUMPTION · 50–60'), mk('returnAge', 'Return to India age', 'yrs', 1, 'ASSUMPTION · independent of retirement'), mk('jobRisk', 'Job-risk months added to reserve', 'mo', .5, 'ASSUMPTION')] },
    { name: 'Tax', items: [mk('taxOn', 'Tax modelling (1 = on)', '0/1', 1, 'ASSUMPTION · rules not hardcoded; effective dates required before use')] },
  ] };

  /* upload */
  const zones = [
    { key: 'IN', name: 'Indian portfolio', hint: 'CAS statement, broker Excel, CSV' },
    { key: 'US', name: 'US portfolio', hint: 'Broker CSV, PDF statement' },
    { key: 'CR', name: 'Crypto', hint: 'Exchange CSV or wallet screenshot' },
  ].map(z => ({ ...z, status: (st.uploads[z.key] || 0) ? st.uploads[z.key] + ' file(s) staged' : 'Drop or choose files', onChange: (e: ChangeEvent<HTMLInputElement>) => { const n = e.target.files ? e.target.files.length : 0; actions.setUiPatch({ uploads: { ...st.uploads, [z.key]: n } }); } }));
  const up = {
    zones,
    steps: [
      { n: 1, label: 'Extract', note: 'Read holdings, quantities, prices, currency', state: 'Ready' },
      { n: 2, label: 'Validate', note: 'Cross-check totals and valuation dates', state: 'Ready' },
      { n: 3, label: 'Identify missing fields', note: 'Ticker, currency, quantity, cost basis', state: 'Ready' },
      { n: 4, label: 'Flag uncertain values', note: 'Anything below the confidence floor', state: '2 flagged' },
      { n: 5, label: 'Ask for clarification', note: 'Only where the difference is material', state: 'Awaiting you' },
      { n: 6, label: 'Merge into portfolio', note: 'Verified holdings only', state: 'Blocked' },
    ],
  };

  /* what if */
  const bm = model.core(base, null, null);
  const beff = bm.m10 || bm.mc;
  const dP = eff.succ - beff.succ, dR = m.req - bm.req;
  const bv = bm.viable[.9], cv = m.viable[.9];
  const slider = (key: keyof Assumptions, label: string, min: number, max: number, step: number, fmt: (v: any) => string) => ({ label, min, max, step, raw: a[key], value: fmt(a[key]), onChange: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ [key]: parseFloat(e.target.value) } as Partial<Assumptions>) });
  const wi = {
    prob: model.pc(eff.succ) + (Math.abs(dP) > .002 ? ' (' + (dP >= 0 ? '+' : '−') + model.pc(Math.abs(dP)) + ')' : ''),
    probCss: Math.abs(dP) < .002 ? '' : model.tone(dP > 0),
    req: model.omrK(m.req) + (Math.abs(dR) > 500 ? ' (' + (dR >= 0 ? '+' : '−') + model.omrK(Math.abs(dR)).replace('OMR ', '') + ')' : ''),
    reqCss: Math.abs(dR) < 500 ? '' : model.tone(dR < 0),
    viable: (cv || '60+') + (cv !== bv ? ' (was ' + (bv || '60+') + ')' : ''),
    viableCss: cv === bv ? '' : model.tone((cv || 61) < (bv || 61)),
    sliders: [
      slider('retireAge', 'Retirement age', 50, 60, 1, v => v),
      slider('contribution', 'Monthly investment', 200, 3000, 50, v => model.omr(v)),
      slider('salaryGrowth', 'Salary growth', 0, 8, .5, v => v + '%'),
      slider('inflIndia', 'India inflation', 3, 10, .25, v => v + '%'),
      slider('rIN', 'Indian equity return', 4, 15, .25, v => v + '%'),
      slider('rCR', 'Crypto return', -10, 30, 1, v => v + '%'),
      slider('indiaSpend', 'India monthly spend', 40000, 250000, 5000, v => model.inr(v)),
      slider('eduStartAge', 'Education start age', 17, 22, 1, v => 'age ' + v),
      slider('marriageAge', 'Marriage age', 25, 30, 1, v => 'age ' + v),
      slider('travelBudget', 'Travel budget', 0, 400, 25, v => model.omr(v) + '/mo'),
      slider('returnAge', 'Return to India', 50, 60, 1, v => 'age ' + v),
    ],
  };

  const h = {
    go, toggleNav: () => actions.setUiPatch({ navOpen: !st.navOpen }),
    closeNav: () => actions.setUiPatch({ navOpen: false }),
    toggleWhatIf: () => actions.setUiPatch({ whatIf: !st.whatIf }),
    closeWhatIf: () => actions.setUiPatch({ whatIf: false }),
    toggleViewport: () => actions.setUiPatch({ viewport: st.viewport === 'desktop' ? 'mobile' : 'desktop' }),
    toggleNight: actions.toggleNight,
    closeClass: () => actions.setUiPatch({ openClass: null }),
    retireAge: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ retireAge: +e.target.value }),
    returnAge: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ returnAge: +e.target.value }),
    eduStart: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ eduStartAge: +e.target.value }),
    eduTier: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ eduTier: e.target.value as Assumptions['eduTier'] }),
    eduPG: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ eduPG: e.target.checked }),
    marriageAge: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ marriageAge: +e.target.value }),
    marTier: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ marriageTier: e.target.value as Assumptions['marriageTier'] }),
    marLoc: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ marriageLoc: e.target.value }),
    spendMode: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ spendMode: e.target.value as Assumptions['spendMode'] }),
    travelMode: (e: ChangeEvent<HTMLInputElement>) => actions.setA({ travelMode: e.target.value as Assumptions['travelMode'] }),
    mode: (e: ChangeEvent<HTMLInputElement>) => actions.setUiPatch({ mode: e.target.value as UIState['mode'] }),
    resetAll: actions.resetAll,
    resetWhatIf: actions.resetWhatIf,
    commitWhatIf: actions.commitWhatIf,
    setAssumption: (key: keyof Assumptions, value: number) => actions.setA({ [key]: value } as Partial<Assumptions>),
  };

  return {
    night: !!st.night, day: !st.night, nightLabel: st.night ? 'Day' : 'Night',
    is, act, h, ov, pf, rt, dd, ed, mr, rk, rc, as: asGroups, up, wi,
    navOpen: st.navOpen, whatIf: st.whatIf,
    navLabel: ({ overview: 'Overview', portfolio: 'Portfolio', retirement: 'Retirement', timeline: 'Timeline', education: 'Education', marriage: 'Marriage', risk: 'Risk', recommendations: 'Recommendations', assumptions: 'Assumptions', upload: 'Upload' } as Record<string, string>)[scr],
    demoBanner,
    stageStyle: st.viewport === 'mobile'
      ? { width: '412px', margin: '24px auto', border: '1px solid var(--color-divider)', borderRadius: '22px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', background: 'var(--color-bg)' } as CSSProperties
      : { width: '100%' } as CSSProperties,
  };
}
