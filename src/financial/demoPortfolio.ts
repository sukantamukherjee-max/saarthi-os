import type { Holding } from './types';

/**
 * DEMO DATA — illustrative placeholders, not real holdings or market quotes.
 * Replace via the Upload screen once portfolio ingestion is wired to a real source.
 */
export const DEMO_HOLDINGS: Holding[] = [
  { n: 'Nifty 50 Index Fund', c: 'Indian Equity', q: '18,400 units', inv: 13200, cur: 18600, rec: 'HOLD', cf: 'High', why: 'Core index exposure, at target weight.', fresh: 'NAV 22 Aug', isDemo: true },
  { n: 'Parag Parikh Flexi Cap', c: 'Indian Equity', q: '9,120 units', inv: 10400, cur: 14200, rec: 'HOLD', cf: 'High', why: 'Diversified; low overlap with the index core.', fresh: 'NAV 22 Aug', isDemo: true },
  { n: 'HDFC Mid-Cap Opportunities', c: 'Indian Equity', q: '6,050 units', inv: 8100, cur: 11300, rec: 'REDUCE', cf: 'Medium', why: 'Mid-cap weight above policy band; trim on strength.', fresh: 'NAV 22 Aug', isDemo: true },
  { n: 'ICICI Pru Bluechip', c: 'Indian Equity', q: '7,400 units', inv: 7900, cur: 9700, rec: 'HOLD', cf: 'High', why: 'Large-cap ballast.', fresh: 'NAV 22 Aug', isDemo: true },
  { n: 'Direct equity basket', c: 'Indian Equity', q: '5 positions', inv: 6800, cur: 8200, rec: 'WATCH', cf: 'Low', why: 'Transaction history incomplete — XIRR unavailable.', fresh: 'Manual 24 Aug', isDemo: true },
  { n: 'Vanguard S&P 500 (VOO)', c: 'US Equity', q: '42 units', inv: 17600, cur: 24800, rec: 'HOLD', cf: 'High', why: 'Primary global equity sleeve.', fresh: 'Close 22 Aug', isDemo: true },
  { n: 'Invesco QQQ', c: 'US Equity', q: '26 units', inv: 9800, cur: 13900, rec: 'HOLD', cf: 'Medium', why: 'Overlaps VOO on the mega-caps; watch combined weight.', fresh: 'Close 22 Aug', isDemo: true },
  { n: 'Apple (AAPL)', c: 'US Equity', q: '28 units', inv: 5900, cur: 7600, rec: 'HOLD', cf: 'Medium', why: 'Single-stock weight within tolerance.', fresh: 'Close 22 Aug', isDemo: true },
  { n: 'Microsoft (MSFT)', c: 'US Equity', q: '19 units', inv: 5600, cur: 7700, rec: 'HOLD', cf: 'Medium', why: 'Single-stock weight within tolerance.', fresh: 'Close 22 Aug', isDemo: true },
  { n: 'Bitcoin', c: 'Crypto', q: '0.42 BTC', inv: 9800, cur: 22900, rec: 'REDUCE', cf: 'High', why: 'Largest single position in the book.', fresh: 'Manual 24 Aug', isDemo: true },
  { n: 'Ethereum', c: 'Crypto', q: '4.10 ETH', inv: 6200, cur: 9400, rec: 'HOLD', cf: 'Medium', why: 'Second crypto leg; sized below BTC.', fresh: 'Manual 24 Aug', isDemo: true },
  { n: 'Solana', c: 'Crypto', q: '60 SOL', inv: 3100, cur: 4200, rec: 'WATCH', cf: 'Low', why: 'Quantity unverified from screenshot.', fresh: 'Screenshot 19 Aug', isDemo: true },
  { n: 'Altcoin basket', c: 'Crypto', q: '6 tokens', inv: 2900, cur: 2500, rec: 'SELL', cf: 'Medium', why: 'Sub-1% positions, no thesis on file, high idiosyncratic risk.', fresh: 'Manual 24 Aug', isDemo: true },
  { n: 'Liquid fund', c: 'Liquid Fund', q: '~4.0% yield', inv: 20200, cur: 21000, rec: 'HOLD', cf: 'High', why: 'Emergency reserve core.', fresh: 'Stmt 21 Aug', isDemo: true },
  { n: 'Savings / cash', c: 'Cash', q: '—', inv: 4000, cur: 4000, rec: 'HOLD', cf: 'High', why: 'Immediate liquidity.', fresh: 'Stmt 24 Aug', isDemo: true },
  { n: 'Gold ETF', c: 'Gold', q: '—', inv: 4100, cur: 5420, rec: 'HOLD', cf: 'Medium', why: 'Small inflation hedge.', fresh: 'NAV 22 Aug', isDemo: true },
];
