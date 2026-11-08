'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number.parseInt(process.env.API_PORT || '5174', 10);
const HOST = process.env.API_HOST || '127.0.0.1';
const MAX_BODY_BYTES = 12 * 1024;
const MAX_MESSAGE_LENGTH = 4000;
const blogsPath = path.join(__dirname, 'blogs.json');

let blogs = [];
try {
  blogs = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
  if (!Array.isArray(blogs)) throw new Error('Expected an array of blog posts');
  console.log(`[RMAA API] Loaded ${blogs.length} blog posts.`);
} catch (error) {
  console.error(`[RMAA API] Could not load ${blogsPath}:`, error.message);
  process.exit(1);
}

const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGINS || 'https://rmaa.pk,https://www.rmaa.pk')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
  }
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Request body too large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('Invalid JSON body');
    error.statusCode = 400;
    throw error;
  }
}

async function handleChatStart(req, res) {
  let body;
  try {
    body = await readJson(req);
  } catch (error) {
    return sendJson(res, error.statusCode || 400, { error: error.message });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return sendJson(res, 400, { error: 'Message required' });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return sendJson(res, 413, { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return sendJson(res, 503, { error: 'AI chat is not configured' });

  const model = process.env.REPLICATE_MODEL || 'deepseek-ai/deepseek-v3.1';
  const modelSegments = model.split('/');
  if (modelSegments.length !== 2 || modelSegments.some((segment) => !/^[A-Za-z0-9_.-]+$/.test(segment))) {
    return sendJson(res, 500, { error: 'AI model configuration is invalid' });
  }
  const modelPath = modelSegments.map(encodeURIComponent).join('/');
  try {
    const response = await fetch(`https://api.replicate.com/v1/models/${modelPath}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt: `You are Muhammad Ali proxy. Professional. User: ${message}\nAI:`,
          max_new_tokens: 150,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok || !data.id) {
      console.error('[RMAA API] Replicate create prediction failed:', response.status, data.error || data.detail || 'unknown error');
      return sendJson(res, 502, { error: 'AI provider could not start the request' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/ai_chat_logs`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ user_message: message, timestamp: new Date().toISOString() }),
        signal: AbortSignal.timeout(5000),
      }).catch((error) => console.error('[RMAA API] Supabase logging failed:', error.message));
    }

    return sendJson(res, 202, { status: 'pending', id: data.id });
  } catch (error) {
    console.error('[RMAA API] AI chat request failed:', error.message);
    return sendJson(res, 502, { error: 'AI provider request failed' });
  }
}

async function handleChatPoll(res, predictionId) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return sendJson(res, 503, { error: 'AI chat is not configured' });
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(predictionId)) {
    return sendJson(res, 400, { error: 'Invalid prediction ID' });
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(predictionId)}`, {
      headers: { Authorization: `Token ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok) return sendJson(res, 502, { error: 'AI provider could not retrieve the request' });
    if (data.status === 'succeeded') {
      const output = Array.isArray(data.output) ? data.output.join('') : String(data.output || '');
      return sendJson(res, 200, { reply: output });
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      return sendJson(res, 502, { error: 'AI generation failed' });
    }
    return sendJson(res, 200, { status: data.status || 'processing' });
  } catch (error) {
    console.error('[RMAA API] AI polling failed:', error.message);
    return sendJson(res, 502, { error: 'Failed to poll AI provider' });
  }
}

function pingGoogle(sitemapUrl) {
  const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  fetch(url, { signal: AbortSignal.timeout(5000) })
    .then((response) => console.log(`[RMAA API] Google sitemap ping returned ${response.status}.`))
    .catch((error) => console.warn('[RMAA API] Google sitemap ping failed:', error.message));
}

const server = http.createServer(async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS' && new URL(req.url, 'http://localhost').pathname.startsWith('/api/')) {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if ((pathname === '/api/healthz' || pathname === '/healthz') && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'healthy',
      service: 'rmaa-api',
      blogsCount: blogs.length,
      timestamp: new Date().toISOString(),
    });
  }

  if (pathname === '/api/blogs' && req.method === 'GET') {
    return sendJson(res, 200, blogs);
  }

  const blogMatch = pathname.match(/^\/api\/blogs\/([^/]+)$/);
  if (blogMatch && req.method === 'GET') {
    let slug;
    try {
      slug = decodeURIComponent(blogMatch[1]);
    } catch {
      return sendJson(res, 400, { error: 'Invalid blog slug' });
    }
    const post = blogs.find((blog) => blog.slug === slug);
    return post ? sendJson(res, 200, post) : sendJson(res, 404, { error: 'Blog post not found' });
  }

  if (pathname === '/api/ping-google' && ['GET', 'POST'].includes(req.method)) {
    const sitemapUrl = 'https://rmaa.pk/sitemap.xml';
    pingGoogle(sitemapUrl);
    return sendJson(res, 200, {
      status: 'dispatched',
      sitemap: sitemapUrl,
      articlesIndexed: blogs.length,
    });
  }

  if (pathname === '/api/chat' && req.method === 'POST') {
    return handleChatStart(req, res);
  }

  const chatMatch = pathname.match(/^\/api\/chat\/([^/]+)$/);
  if (chatMatch && req.method === 'GET') {
    return handleChatPoll(res, chatMatch[1]);
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[RMAA API] Listening on http://${HOST}:${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
