export interface Assumptions {
  currentAge: number; retireAge: number; planAge: number; returnAge: number;
  salary: number; salaryGrowth: number; expenses: number; expenseGrowth: number; contribution: number;
  indiaSpend: number; spendMode: 'Conservative' | 'Base' | 'Comfortable';
  travelMode: 'Fixed' | 'Percent' | 'Lifestyle'; travelBudget: number; travelPct: number;
  healthBase: number; medInflation: number; insurance: boolean;
  inflIndia: number; inflOman: number;
  fxOMRINR: number; fxDrift: number;
  rIN: number; rUS: number; rCR: number; rLQ: number; rCA: number; rGO: number;
  vIN: number; vUS: number; vCR: number; vLQ: number; vCA: number; vGO: number;
  daughterAge: number; eduStartAge: number; eduCountry: string; eduTier: 'Budget' | 'Mainstream' | 'Premium'; eduPG: boolean; pgGap: number;
  marriageAge: number; marriageTier: 'Basic' | 'Moderate' | 'High' | 'Premium'; marriageLoc: string; marriageInfl: number;
  jobRisk: number; taxOn: number;
}

export type AssetClass = 'Indian Equity' | 'US Equity' | 'Crypto' | 'Liquid Fund' | 'Cash' | 'Gold';

export interface Holding {
  n: string; c: AssetClass; q: string; inv: number; cur: number;
  rec: 'BUY' | 'SELL' | 'HOLD' | 'REDUCE' | 'WATCH'; cf: 'High' | 'Medium' | 'Low'; why: string; fresh: string;
  /** true once this holding is backed by a live/manual market quote rather than the bundled demo snapshot */
  isDemo?: boolean;
}

export interface CountryConfig {
  ccy: string; fx: number; ug: number; pg: number; infl: number;
  tiers: { Budget: number; Mainstream: number; Premium: number };
}
