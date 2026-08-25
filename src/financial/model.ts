import type { Assumptions, AssetClass, CountryConfig, Holding } from './types';
import { DEMO_HOLDINGS } from './demoPortfolio';

/**
 * Financial calculation engine — direct port of the approved Claude Design
 * model. Pure logic, no React/UI. A single Model instance is created once
 * (see useModel) and reused across renders so its memo caches persist.
 */
export class Model {
  C: Record<string, CountryConfig> = {
    India: { ccy: 'INR', fx: 1 / 228.4, ug: 4, pg: 2, infl: 8, tiers: { Budget: 200000, Mainstream: 550000, Premium: 1200000 } },
    USA: { ccy: 'USD', fx: 0.3845, ug: 4, pg: 2, infl: 5, tiers: { Budget: 28000, Mainstream: 48000, Premium: 78000 } },
    Canada: { ccy: 'CAD', fx: 0.2780, ug: 4, pg: 2, infl: 5, tiers: { Budget: 32000, Mainstream: 45000, Premium: 62000 } },
    UK: { ccy: 'GBP', fx: 0.4920, ug: 3, pg: 1, infl: 5, tiers: { Budget: 26000, Mainstream: 38000, Premium: 52000 } },
    Europe: { ccy: 'EUR', fx: 0.4180, ug: 3, pg: 2, infl: 4.5, tiers: { Budget: 14000, Mainstream: 22000, Premium: 34000 } },
  };
  MT: Record<string, number> = { Basic: 800000, Moderate: 1800000, High: 3500000, Premium: 7000000 };
  ML: Record<string, number> = { 'West Bengal / Tier-2': 1, 'Major Tier-1 city': 1.35, 'Indian destination': 1.8 };
  KEYS: AssetClass[] = ['Indian Equity', 'US Equity', 'Crypto', 'Liquid Fund', 'Cash', 'Gold'];
  COL: Record<AssetClass, string> = { 'Indian Equity': '#1d3fbf', 'US Equity': '#5c78d2', Crypto: '#d95e08', 'Liquid Fund': '#f4933f', Cash: '#9aaeea', Gold: '#fbd3ab' };
  RISKW: Record<AssetClass, string> = { 'Indian Equity': 'High', 'US Equity': 'High', Crypto: 'Very high', 'Liquid Fund': 'Low', Cash: 'None', Gold: 'Moderate' };
  CCYW: Record<AssetClass, string> = { 'Indian Equity': 'INR', 'US Equity': 'USD', Crypto: 'USD', 'Liquid Fund': 'OMR', Cash: 'OMR', Gold: 'INR' };
  HOLD: Holding[] = DEMO_HOLDINGS;

  private _memo = new Map<string, any>();
  private _memo2 = new Map<string, any>();
  private _g: number | null = null;

  defaults(): Assumptions {
    return {
      currentAge: 42, retireAge: 52, planAge: 90, returnAge: 52,
      salary: 2500, salaryGrowth: 2, expenses: 1400, expenseGrowth: 4, contribution: 1000,
      indiaSpend: 100000, spendMode: 'Base',
      travelMode: 'Fixed', travelBudget: 100, travelPct: 12,
      healthBase: 60000, medInflation: 8, insurance: true,
      inflIndia: 6, inflOman: 2.5,
      fxOMRINR: 249.17, fxOMRUSD: 0.3845, fxDrift: 3.0, // fxOMRUSD is OMR per 1 USD (matches C.USA.fx's convention)
      rIN: 10, rUS: 7.5, rCR: 12, rLQ: 4, rCA: 0.5, rGO: 5,
      vIN: 18, vUS: 16, vCR: 65, vLQ: 1, vCA: 0.2, vGO: 14,
      daughterAge: 11, eduStartAge: 18, eduCountry: 'USA', eduPGCountry: 'USA', eduTier: 'Mainstream', eduPG: false, pgGap: 1,
      marriageAge: 27, marriageTier: 'Moderate', marriageLoc: 'West Bengal / Tier-2', marriageInfl: 7,
      jobRisk: 1.5, taxOn: 0,
    };
  }

  /* ---------- primitives ---------- */
  rng(seed: number) {
    let t = seed >>> 0;
    return () => {
      t = (t + 0x6D2B79F5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  gauss(rnd: () => number) {
    if (this._g != null) { const g = this._g; this._g = null; return g; }
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    const m = Math.sqrt(-2 * Math.log(u)), th = 2 * Math.PI * v;
    this._g = m * Math.sin(th);
    return m * Math.cos(th);
  }
  total() { return this.HOLD.reduce((s, x) => s + x.cur, 0); }
  invested() { return this.HOLD.reduce((s, x) => s + x.inv, 0); }
  byClass(c: AssetClass) { return this.HOLD.filter(x => x.c === c).reduce((s, x) => s + x.cur, 0); }
  /** Fingerprint of current holdings, so memoized results below invalidate when holdings change even if assumptions don't. */
  holdKey() { return this.HOLD.map(h => h.c + ':' + h.cur + ':' + h.inv).join('|'); }

  /**
   * Rule-based, per-holding call computed fresh from this holding's actual
   * weight and performance — replaces whatever recommendation/note an upload
   * happened to be saved with, so every holding reflects the current
   * portfolio instead of a static value stamped on at insert time.
   */
  recommend(h: Holding, total: number): { rec: Holding['rec']; why: string } {
    const classTotal = this.byClass(h.c);
    const wTotal = total ? h.cur / total : 0;
    const wClass = classTotal ? h.cur / classTotal : 0;
    const plPct = h.inv > 0 ? (h.cur - h.inv) / h.inv : null;

    if (wTotal >= 0.15) {
      return { rec: 'REDUCE', why: this.pc(wTotal, 1) + ' of total portfolio in a single holding — above a typical 15% single-position guideline.' };
    }
    if (plPct !== null && plPct <= -0.15) {
      return { rec: 'WATCH', why: 'Down ' + this.pc(-plPct, 1) + ' from cost basis — review before adding more.' };
    }
    if (h.c === 'Crypto' && classTotal > 0 && wTotal > 0 && wTotal < 0.01) {
      return { rec: 'WATCH', why: 'Sub-1% of total wealth with no stated thesis on file — a candidate to trim or consolidate.' };
    }
    if (classTotal > 0 && wClass >= 0.6) {
      return { rec: 'HOLD', why: 'Largest position within ' + h.c + ' at ' + this.pc(wClass) + ' of that sleeve — core holding, no action flagged.' };
    }
    return { rec: 'HOLD', why: 'Weight (' + this.pc(wTotal, 1) + ' of total) and performance are within normal range — no action flagged.' };
  }
  weights() { const t = this.total(); if (!t) return this.KEYS.map(() => 0); return this.KEYS.map(k => this.byClass(k) / t); }

  muSigma(a: Assumptions) {
    const w = this.weights();
    const r = [a.rIN, a.rUS, a.rCR, a.rLQ, a.rCA, a.rGO].map(x => x / 100);
    const v = [a.vIN, a.vUS, a.vCR, a.vLQ, a.vCA, a.vGO].map(x => x / 100);
    const C = [[1, .55, .35, 0, 0, .1], [.55, 1, .45, 0, 0, .05], [.35, .45, 1, 0, 0, .1], [0, 0, 0, 1, .2, 0], [0, 0, 0, .2, 1, 0], [.1, .05, .1, 0, 0, 1]];
    let mu = 0, va = 0;
    for (let i = 0; i < 6; i++) { mu += w[i] * r[i]; for (let j = 0; j < 6; j++) va += w[i] * w[j] * v[i] * v[j] * C[i][j]; }
    return { mu, sig: Math.sqrt(va) };
  }

  /**
   * Undergraduate and postgraduate can be in different countries (e.g. UG in
   * India, PG abroad) — eduCountry drives UG, eduPGCountry drives PG and
   * falls back to eduCountry when unset, so existing plans with a single
   * country (or eduPG off) are unaffected.
   */
  eduPlan(a: Assumptions) {
    // USA's OMR conversion rate is user-editable/live-refreshable (see Assumptions),
    // unlike the other countries' rates which stay fixed reference estimates.
    const cfgFor = (country: string) => country === 'USA' ? { ...this.C.USA, fx: a.fxOMRUSD } : this.C[country];
    const ugCountry = a.eduCountry;
    const pgCountry = a.eduPGCountry || a.eduCountry;
    const cUG = cfgFor(ugCountry);
    const cPG = cfgFor(pgCountry);
    const flows: Record<number, number> = {};
    const lines: any[] = [];
    const startIn = a.eduStartAge - a.daughterAge;
    const list: { k: number; kind: string; c: CountryConfig }[] = [];
    for (let k = 0; k < cUG.ug; k++) list.push({ k, kind: 'Undergraduate', c: cUG });
    if (a.eduPG) { for (let k = 0; k < cPG.pg; k++) list.push({ k: cUG.ug + a.pgGap + k, kind: 'Postgraduate', c: cPG }); }
    let tOMR = 0, tLocalUG = 0, tLocalPG = 0;
    list.forEach(y => {
      const yr = startIn + y.k;
      const ann = y.c.tiers[a.eduTier] * (y.kind === 'Postgraduate' ? 1.05 : 1);
      const infl = ann * Math.pow(1 + y.c.infl / 100, yr);
      const omr = infl * y.c.fx;
      const age = a.currentAge + yr;
      flows[age] = (flows[age] || 0) + omr;
      tOMR += omr;
      if (y.kind === 'Postgraduate') tLocalPG += infl; else tLocalUG += infl;
      lines.push({ age, dAge: a.daughterAge + yr, yr, kind: y.kind, ccy: y.c.ccy, local: infl, omr });
    });
    const ages = Object.keys(flows).map(Number);
    const sameCurrency = cUG.ccy === cPG.ccy;
    return {
      flows, lines, tOMR, tLocal: sameCurrency ? tLocalUG + tLocalPG : null,
      tLocalUG, tLocalPG, c: cUG, cPG, ugCountry, pgCountry, mixedCountries: ugCountry !== pgCountry,
      startIn, lastAge: ages.length ? Math.max(...ages) : null,
    };
  }
  marPlan(a: Assumptions) {
    const yr = a.marriageAge - a.daughterAge;
    const today = this.MT[a.marriageTier] * this.ML[a.marriageLoc];
    const then = today * Math.pow(1 + a.marriageInfl / 100, yr);
    const age = a.currentAge + yr;
    return { yr, today, then, age, flow: { age, omr: then / this.fxAt(a, yr) } };
  }
  fxAt(a: Assumptions, yr: number) { return a.fxOMRINR * Math.pow(1 + (a.fxDrift || 0) / 100, yr); }
  /** Breaks retSpend's total into its three day-to-day components, for display. */
  retSpendBreakdown(a: Assumptions, yr: number, age: number, inflAdj?: number) {
    const mult = { Conservative: .85, Base: 1, Comfortable: 1.25 }[a.spendMode];
    const inf = Math.max(0.5, a.inflIndia + (inflAdj || 0)) / 100;
    const inr = a.indiaSpend * 12 * mult * Math.pow(1 + inf, yr);
    const fx = this.fxAt(a, yr);
    const living = inr / fx;
    let travel: number;
    if (a.travelMode === 'Fixed') travel = a.travelBudget * 12 * Math.pow(1 + a.inflOman / 100, yr);
    else if (a.travelMode === 'Percent') travel = (inr / fx) * (a.travelPct / 100);
    else travel = (a.travelBudget * 12 + 2000) * Math.pow(1 + a.inflOman / 100, yr);
    const esc = 1 + Math.max(0, age - 60) * 0.025;
    const health = (a.healthBase * Math.pow(1 + a.medInflation / 100, yr) * esc * (a.insurance ? 0.6 : 1)) / fx;
    return { living, travel, health, total: living + travel + health };
  }
  retSpend(a: Assumptions, yr: number, age: number, inflAdj?: number) {
    return this.retSpendBreakdown(a, yr, age, inflAdj).total;
  }

  /**
   * Full-lifetime, per-asset-class path from today (currentAge) to planAge.
   * Each asset class compounds at its own assumed return (not the blended
   * mu), so the split shown is real — not a single number divided by
   * today's weights. Contributions (a.contribution) apply ONLY while
   * age < retireAge and stop completely at retirement — there is no flow
   * item for "annual contribution" after that age. New contributions flow into
   * the growth sleeve (Indian Equity/US Equity/Crypto) only, in proportion
   * to their weights, so Liquid Fund/Cash/Gold never appear inflated by
   * absorbing a share of new savings. Withdrawals (retirement spending,
   * education, marriage) still draw proportionally across the whole
   * portfolio — the
   * same constant-mix assumption the rest of the model already makes via
   * muSigma(). OMR is converted to INR (using the same drifting rate as
   * fxAt) from returnAge onward, since that's when spending actually
   * switches to INR per the Retirement page's own "before/after return"
   * framing.
   */
  lifetimeTimeline(a: Assumptions) {
    const GROWTH_KEYS: AssetClass[] = ['Indian Equity', 'US Equity', 'Crypto'];
    const FD_RATE = a.rLQ / 100; // same assumption as Liquid Fund — an Indian FD-style rate
    const edu = this.eduPlan(a);
    const mar = this.marPlan(a);
    const R = a.retireAge;
    const rates = [a.rIN, a.rUS, a.rCR, a.rLQ, a.rCA, a.rGO].map(x => x / 100);
    const byClass: Record<string, number> = {};
    this.KEYS.forEach(k => { byClass[k] = this.byClass(k); });
    let fdFromSale = 0; // proceeds of the return-to-India US Equity/Crypto liquidation — tracked separately from Liquid Fund
    let permanentlyDepleted = false;

    const rows: any[] = [];
    for (let age = a.currentAge; age <= a.planAge; age++) {
      const yr = age - a.currentAge;

      // One-time liquidation on return to India: US Equity and Crypto are sold
      // and the proceeds parked in a separate Indian FD-style bucket (same
      // 4%-class assumption as Liquid Fund, but tracked on its own line) rather
      // than remaining exposed to US stocks/crypto and future remittance tax.
      // No capital-gains tax or remittance cost is modelled on the sale itself
      // — none was specified.
      let liquidated = 0;
      if (!permanentlyDepleted && age === a.returnAge) {
        liquidated = byClass['US Equity'] + byClass['Crypto'];
        fdFromSale += liquidated;
        byClass['US Equity'] = 0;
        byClass['Crypto'] = 0;
      }

      let flow = 0, living = 0, travel = 0, health = 0, eduOut = 0, marOut = 0, contrib = 0;
      if (age < R) {
        contrib = a.contribution * 12 * Math.pow(1 + a.salaryGrowth / 100, yr);
        flow += contrib;
      } else {
        const b = this.retSpendBreakdown(a, yr, age, 0);
        living = b.living; travel = b.travel; health = b.health;
        flow -= b.total;
      }
      if (edu.flows[age]) { eduOut = edu.flows[age]; flow -= eduOut; }
      if (mar.flow.age === age) { marOut = mar.flow.omr; flow -= marOut; }

      const startByClass = { ...byClass };
      const startFd = fdFromSale;
      const startTotal = this.KEYS.reduce((s, k) => s + byClass[k], 0) + fdFromSale;

      if (permanentlyDepleted) {
        this.KEYS.forEach(k => { byClass[k] = 0; });
        fdFromSale = 0;
      } else {
        this.KEYS.forEach((k, i) => { byClass[k] = byClass[k] * (1 + rates[i]); });
        fdFromSale = fdFromSale * (1 + FD_RATE);
        // New contributions flow into growth investments (equity/crypto) only —
        // otherwise Liquid Fund/Cash/Gold/the FD sleeve would appear to grow
        // faster than their own assumed rate just from absorbing new savings.
        // Withdrawals (flow <= 0, i.e. retirement spending) draw proportionally
        // across the WHOLE portfolio including the FD sleeve, since that's what
        // funds retirement spending.
        const allocKeys = flow > 0 ? GROWTH_KEYS : this.KEYS;
        let allocPool = allocKeys.reduce((s, k) => s + byClass[k], 0);
        if (flow <= 0) allocPool += fdFromSale;
        if (allocPool > 0) {
          allocKeys.forEach(k => { byClass[k] += flow * (byClass[k] / allocPool); });
          if (flow <= 0) fdFromSale += flow * (fdFromSale / allocPool);
        } else if (flow > 0) {
          byClass['Liquid Fund'] += flow; // no growth-sleeve weight to allocate against yet — park new money in cash-like sleeve
        }
        const endTotalRaw = this.KEYS.reduce((s, k) => s + byClass[k], 0) + fdFromSale;
        if (endTotalRaw <= 0) { this.KEYS.forEach(k => { byClass[k] = 0; }); fdFromSale = 0; permanentlyDepleted = true; }
      }

      const endTotal = this.KEYS.reduce((s, k) => s + byClass[k], 0) + fdFromSale;
      const growth = endTotal - startTotal - flow;
      const fx = this.fxAt(a, yr);
      rows.push({
        age, yearsToRetire: R - age, phase: age < R ? 'Working' : 'Retired',
        contrib, living, travel, health, eduOut, marOut, liquidated,
        inflow: contrib, outflow: living + travel + health + eduOut + marOut,
        startTotal, endTotal, growth,
        byClassStart: startByClass, byClassEnd: { ...byClass },
        fdStart: startFd, fdEnd: fdFromSale,
        depleted: endTotal <= 0,
        inINR: age >= a.returnAge, fxRate: fx,
      });
    }
    return rows;
  }

  simPath(a: Assumptions, o: any) {
    const R = o.retireAge || a.retireAge;
    const from = o.fromAge || a.currentAge;
    const N = a.planAge - from + 1;
    const s = o.series ? new Float64Array(N) : null;
    const ms = o.ms;
    let corpus = o.corpus0 != null ? o.corpus0 : this.total();
    let dep: number | null = null, atR = 0, okEdu = true, okMar = true;
    for (let i = 0; i < N; i++) {
      const age = from + i, yr = age - a.currentAge;
      let flow = 0;
      if (age < R) flow += a.contribution * 12 * Math.pow(1 + a.salaryGrowth / 100, yr);
      else flow -= this.retSpend(a, yr, age, o.inflAdj);
      if (o.edu && o.edu[age]) flow -= o.edu[age];
      if (o.mar && o.mar.age === age) flow -= o.mar.omr;
      if (o.jl && yr >= o.jl.start && yr < o.jl.start + o.jl.years && age < R) {
        flow -= a.contribution * 12 * Math.pow(1 + a.salaryGrowth / 100, yr);
        flow -= a.expenses * 12 * Math.pow(1 + a.expenseGrowth / 100, yr) * (o.jl.emgCover || 0);
      }
      let r: number;
      if (o.rnd) { r = (age < R ? ms.mu : ms.mu - 0.012) + ms.sig * this.gauss(o.rnd); if (r < -0.9) r = -0.9; }
      else r = age < R ? ms.mu : ms.mu - 0.012;
      if (o.shockAge === age) r = o.shockMag;
      corpus = corpus * (1 + r) + flow;
      if (corpus < 0) { corpus = 0; if (dep === null) dep = age; }
      if (s) s[i] = corpus;
      if (age === R) atR = corpus;
      if (o.eduLast != null && age === o.eduLast && corpus < (o.eduFloor || 1)) okEdu = false;
      if (o.marAge != null && age === o.marAge && corpus <= 1) okMar = false;
    }
    return { s, dep, atR, final: corpus, okEdu, okMar, N, from };
  }

  mc(a: Assumptions, n: number, collect: boolean, opt?: any) {
    opt = opt || {};
    const ms = this.muSigma(a), edu = this.eduPlan(a), mar = this.marPlan(a);
    const rnd = this.rng(20260824);
    this._g = null;
    const R = opt.retireAge || a.retireAge;
    const N = a.planAge - a.currentAge + 1;
    let succ = 0, eok = 0, mok = 0;
    const atR = new Float64Array(n);
    const bands = collect ? Array.from({ length: N }, () => new Float64Array(n)) : null;
    for (let i = 0; i < n; i++) {
      const p = this.simPath(a, { ms, edu: edu.flows, mar: mar.flow, eduLast: edu.lastAge, eduFloor: opt.eduFloor, marAge: mar.age, rnd, inflAdj: this.gauss(rnd) * 1.1, retireAge: R, series: collect, corpus0: opt.corpus0, fromAge: opt.fromAge });
      if (p.dep === null) succ++;
      if (p.okEdu) eok++;
      if (p.okMar) mok++;
      atR[i] = p.atR;
      if (collect) for (let y = 0; y < N; y++) bands![y][i] = p.s![y];
    }
    const q = (arr: Float64Array, x: number) => arr[Math.min(arr.length - 1, Math.floor(x * arr.length))];
    const sorted = Float64Array.from(atR).sort();
    let band = null;
    if (collect) band = bands!.map((arr, y) => { const b = arr.sort(); return { age: a.currentAge + y, p10: q(b, .1), p50: q(b, .5), p90: q(b, .9) }; });
    return { n, succ: succ / n, edu: eok / n, mar: mok / n, dep: 1 - succ / n, atR: { p10: q(sorted, .1), p50: q(sorted, .5), p90: q(sorted, .9) }, band };
  }

  requiredCorpus(a: Assumptions, R: number) {
    let lo = 0, hi = 5e6;
    for (let i = 0; i < 15; i++) {
      const mid = (lo + hi) / 2;
      const m = this.mc(a, 220, false, { retireAge: R, corpus0: mid, fromAge: R });
      if (m.succ >= 0.9) hi = mid; else lo = mid;
    }
    return hi;
  }

  /* ---------- derive ---------- */
  core(a: Assumptions, mc10k: any, mc10kKey: string | null) {
    const k = JSON.stringify(a) + '|H:' + this.holdKey();
    if (this._memo.has(k)) return this._memo.get(k);
    const ms = this.muSigma(a), edu = this.eduPlan(a), mar = this.marPlan(a);
    const det = this.simPath(a, { ms, edu: edu.flows, mar: mar.flow, series: true });
    const req = this.requiredCorpus(a, a.retireAge);
    const eduFloor = 1;
    const mc = this.mc(a, 2200, true, { eduFloor });
    const viable: Record<string, number | null> = {};
    [.8, .9, .95].forEach(t => { viable[t] = null; });
    for (let R = 50; R <= 60; R++) {
      const m = this.mc(a, 500, false, { retireAge: R });
      [.8, .9, .95].forEach(t => { if (viable[t] === null && m.succ >= t) viable[t] = R; });
    }
    const emg = this.emergency(a);
    const risk = this.risk(a, ms);
    const gap = Math.max(0, req - mc.atR.p50);
    const yrsTo = Math.max(1, a.retireAge - a.currentAge);
    // As mu -> 0 the annuity growth factor's limit is yrsTo (saving flat amounts
    // with no growth for N years accumulates to N times the amount) — avoids 0/0
    // when there's no portfolio yet (all weights, and so mu, are exactly 0).
    const growthFactor = Math.abs(ms.mu) < 1e-9 ? yrsTo : (Math.pow(1 + ms.mu, yrsTo) - 1) / ms.mu;
    const reqSave = a.contribution * 12 + (gap > 0 ? gap / growthFactor : 0);
    const health = this.health(a, mc, emg, risk);
    const m10 = mc10kKey === k ? mc10k : null;
    const out = { ms, edu, mar, det, mc, req, viable, emg, risk, gap, reqSave, health, m10, eduFloor, key: k };
    if (this._memo.size > 24) this._memo.clear();
    this._memo.set(k, out);
    return out;
  }
  emergency(a: Assumptions) {
    const w = this.weights();
    let months = 6 + a.jobRisk + (w[2] > 0.15 ? 1.5 : 0) + 1;
    const rec = a.expenses * months;
    const cur = this.byClass('Cash') + this.byClass('Liquid Fund');
    return { months: Math.round(months * 10) / 10, rec, cur, gap: cur - rec };
  }
  risk(a: Assumptions, ms: { mu: number; sig: number }) {
    const w = this.weights(), t = this.total();
    // Concentration risk is about a single volatile bet dominating the plan —
    // a large Liquid Fund or Cash position is capital-stable, not a
    // concentration hazard the way a single large equity/crypto holding is.
    const volatileHold = this.HOLD.filter(x => x.c !== 'Liquid Fund' && x.c !== 'Cash');
    const maxHold = t && volatileHold.length ? Math.max(...volatileHold.map(x => x.cur)) / t : 0;
    const inr = t ? (this.byClass('Indian Equity') + this.byClass('Gold')) / t : 0;
    const liq = t ? (this.byClass('Cash') + this.byClass('Liquid Fund')) / t : 0;
    const emg = this.emergency(a);
    const d = [
      { label: 'Crypto exposure', v: Math.min(100, w[2] / 0.25 * 100), note: (w[2] * 100).toFixed(1) + '%' },
      { label: 'Single-asset', v: Math.min(100, maxHold / 0.15 * 100), note: (maxHold * 100).toFixed(1) + '%' },
      { label: 'Country mix', v: Math.min(100, Math.abs(inr - 0.4) / 0.4 * 100), note: (inr * 100).toFixed(0) + '% India' },
      { label: 'Currency', v: Math.min(100, (1 - inr) / 0.7 * 100), note: (100 - inr * 100).toFixed(0) + '% non-INR' },
      { label: 'Liquidity', v: Math.max(0, 100 - Math.min(100, emg.cur / emg.rec * 100)), note: (liq * 100).toFixed(0) + '% liquid' },
      { label: 'Volatility', v: Math.min(100, ms.sig / 0.25 * 100), note: (ms.sig * 100).toFixed(1) + '% p.a.' },
      { label: 'Drawdown', v: Math.min(100, ms.sig * 2.2 / 0.5 * 100), note: '-' + (ms.sig * 2.2 * 100).toFixed(0) + '% est.' },
      { label: 'Sequence risk', v: Math.min(100, (w[0] + w[1] + w[2]) * 100 * (1 - Math.min(1, (a.retireAge - a.currentAge) / 15))), note: (a.retireAge - a.currentAge) + ' yrs out' },
    ];
    const score = Math.round(d.reduce((s, x) => s + x.v, 0) / d.length);
    return { score, drivers: d, maxHold, inr, liq };
  }
  health(a: Assumptions, mc: any, emg: any, risk: any) {
    const w = this.weights();
    const hhi = w.reduce((s, x) => s + x * x, 0);
    const div = Math.max(0, Math.min(100, (1 - (hhi - 0.167) / 0.5) * 100));
    const sav = Math.min(100, ((a.salary - a.expenses) / a.salary) / 0.4 * 100);
    const parts = [
      { label: 'Retirement', v: mc.succ * 100, wt: .3 },
      { label: 'Liquidity', v: Math.min(100, emg.cur / emg.rec * 100), wt: .15 },
      { label: 'Diversification', v: div, wt: .15 },
      { label: 'Education', v: mc.edu * 100, wt: .15 },
      { label: 'Risk control', v: 100 - risk.score, wt: .15 },
      { label: 'Savings capacity', v: sav, wt: .1 },
    ];
    const score = Math.round(parts.reduce((s, p) => s + p.v * p.wt, 0));
    return { score, parts };
  }
  stress(a: Assumptions) {
    const k = 'S' + JSON.stringify(a) + '|H:' + this.holdKey();
    if (this._memo2.has(k)) return this._memo2.get(k);
    const t = this.total();
    const eq = (this.byClass('Indian Equity') + this.byClass('US Equity'));
    const cr = this.byClass('Crypto');
    const scen = [
      { label: 'Equity −30%', loss: eq * .3 },
      { label: 'Severe equity −45%', loss: eq * .45 },
      { label: 'Crypto −50%', loss: cr * .5 },
      { label: 'Crypto −70%', loss: cr * .7 },
      { label: 'Crypto −90%', loss: cr * .9 },
      { label: 'Equity −30% and crypto −70%', loss: eq * .3 + cr * .7 },
      { label: 'Global risk-off: equity −35%, crypto −80%, gold +10%', loss: eq * .35 + cr * .8 - this.byClass('Gold') * .1 },
    ].map(s => {
      const m = this.mc(a, 500, false, { corpus0: t - s.loss });
      return { ...s, prob: m.succ };
    });
    const R = a.retireAge;
    const seqDefs = [{ o: -5, l: '5 years before retirement' }, { o: 0, l: 'At retirement' }, { o: 1, l: '1 year after' }, { o: 2, l: '2 years after' }, { o: 3, l: '3 years after' }, { o: 5, l: '5 years after' }];
    const ms = this.muSigma(a), edu = this.eduPlan(a), mar = this.marPlan(a);
    const seq = seqDefs.map(s => {
      const age = R + s.o;
      const p = this.simPath(a, { ms, edu: edu.flows, mar: mar.flow, shockAge: age, shockMag: -0.35 });
      const m = this.mc(a, 400, false);
      return { label: s.l, corpus: p.final, atR: p.atR, prob: Math.max(0, m.succ - Math.max(0, 0.34 - Math.abs(s.o) * 0.045)) };
    });
    const jl = [6, 12, 24].map(mo => {
      const yrs = mo / 12;
      this.simPath(a, { ms, edu: edu.flows, mar: mar.flow, jl: { start: 3, years: Math.ceil(yrs), emgCover: 1 } });
      const emg = this.emergency(a);
      const need = a.expenses * mo;
      const fromEmg = Math.min(emg.cur, need);
      const m = this.mc(a, 400, false, { corpus0: this.total() - Math.max(0, need - fromEmg) });
      return { label: mo + ' months without salary', emg: fromEmg, port: Math.max(0, need - fromEmg), contrib: a.contribution * mo, prob: m.succ };
    });
    const out = { scen, seq, jl };
    if (this._memo2.size > 12) this._memo2.clear();
    this._memo2.set(k, out);
    return out;
  }

  /* ---------- format ---------- */
  n0(v: number) { return Math.round(v).toLocaleString('en-US'); }
  omr(v: number) { return 'OMR ' + this.n0(v); }
  omrK(v: number) { return Math.abs(v) >= 1e6 ? 'OMR ' + (v / 1e6).toFixed(2) + 'M' : 'OMR ' + this.n0(v); }
  inr(v: number) { const x = Math.abs(v); const s = v < 0 ? '−₹' : '₹'; const y = Math.abs(v); return x >= 1e7 ? s + (y / 1e7).toFixed(2) + ' Cr' : x >= 1e5 ? s + (y / 1e5).toFixed(1) + ' L' : s + this.n0(y); }
  oi(v: number, a: Assumptions) { return this.inr(v * a.fxOMRINR); }
  pc(v: number, d?: number) { return (v * 100).toFixed(d == null ? 0 : d) + '%'; }
  sign(v: number) { return (v >= 0 ? '+' : '−') + this.n0(Math.abs(v)); }
  tone(good: boolean) { return good ? 'color:var(--pw-pos)' : 'color:var(--pw-neg)'; }
  fill(v: number, color?: string) { return 'height:100%;width:' + Math.max(1, Math.min(100, v)) + '%;background:' + (color || 'var(--color-accent)') + ';transition:width .45s cubic-bezier(.2,.8,.3,1)'; }
}
