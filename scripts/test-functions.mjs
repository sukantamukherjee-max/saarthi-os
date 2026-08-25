// Ad-hoc local test harness for netlify/functions/*, bypassing netlify-cli.
// Run with: node --env-file=.env scripts/test-functions.mjs
import { handler as fxRates } from '../netlify/functions/fx-rates.js';
import { handler as marketQuotes } from '../netlify/functions/market-quotes.js';
import { handler as narrateRecommendation } from '../netlify/functions/narrate-recommendation.js';

function log(name, result) {
  console.log(`\n=== ${name} ===`);
  console.log('status:', result.statusCode);
  console.log('body:', result.body?.slice(0, 800));
}

const fx = await fxRates();
log('fx-rates', fx);

const quotes = await marketQuotes({
  httpMethod: 'POST',
  body: JSON.stringify({
    symbols: [
      { symbol: 'AAPL', source: 'finnhub' },
      { symbol: 'bitcoin', source: 'coingecko' },
      { symbol: '120503', source: 'mfapi' }, // a real MFAPI scheme code (Nifty 50 index fund style)
    ],
  }),
});
log('market-quotes', quotes);

const narrated = await narrateRecommendation({
  httpMethod: 'POST',
  body: JSON.stringify({
    context: { retireAge: 52, retProb: '71%' },
    items: [
      { title: 'Top up the emergency reserve', body: 'Reserve held OMR 25,000 against a modelled requirement of OMR 14,000.', action: 'BUILD RESERVE', impact: '+5 health points', risk: 'Forced selling' },
    ],
  }),
});
log('narrate-recommendation (Gemini)', narrated);
