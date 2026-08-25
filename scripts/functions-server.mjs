// Minimal local stand-in for Netlify Functions, used only in dev because
// netlify-cli currently has a compatibility issue with this Node version.
// Routes GET/POST http://localhost:9999/.netlify/functions/<name> to the
// matching handler in netlify/functions/<name>.js — same files Netlify
// itself will run in production, so behavior matches deployment.
import { createServer } from 'node:http';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const functionsDir = path.join(__dirname, '..', 'netlify', 'functions');
const PORT = 9999;

const files = (await readdir(functionsDir)).filter((f) => f.endsWith('.js'));
const handlers = new Map();
for (const file of files) {
  const name = file.replace(/\.js$/, '');
  const mod = await import(pathToFileURL(path.join(functionsDir, file)).href);
  if (typeof mod.handler === 'function') handlers.set(name, mod.handler);
}
console.log('Loaded functions:', [...handlers.keys()].join(', '));

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const name = url.pathname.replace(/^\/\.netlify\/functions\//, '');
  const handler = handlers.get(name);
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `no function named "${name}"` }));
    return;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');
  try {
    const result = await handler({
      httpMethod: req.method,
      headers: req.headers,
      body,
      queryStringParameters: Object.fromEntries(url.searchParams),
    });
    res.writeHead(result.statusCode || 200, { 'Content-Type': 'application/json', ...(result.headers || {}) });
    res.end(result.body ?? '');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e?.message || e) }));
  }
}).listen(PORT, () => console.log(`Functions dev server on http://localhost:${PORT}`));
