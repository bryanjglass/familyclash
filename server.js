#!/usr/bin/env node
/*
 * Family Clash — optional LAN server (zero dependencies).
 *
 * Serves the app and relays messages between a host (e.g. a tablet) and a
 * board (e.g. a netbook tab cast to the TV) on the same Wi-Fi, paired by a
 * short room code.
 *
 *   node server.js            # http://<your-ip>:8080
 *   PORT=3000 node server.js
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = Number(process.env.PORT) || 8080;
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
};

// room code -> { host: Set<res>, board: Set<res>, lastState, touched }
const rooms = new Map();
const validRoom = (s) => typeof s === 'string' && /^[A-Z0-9]{3,12}$/.test(s);

function getRoom(code) {
  let r = rooms.get(code);
  if (!r) {
    r = { host: new Set(), board: new Set(), lastState: null, touched: Date.now() };
    rooms.set(code, r);
  }
  r.touched = Date.now();
  return r;
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

const sse = (res, data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch (e) {
    return json(res, 400, { ok: false });
  }
  const p = url.pathname;

  if (p === '/api/ping') return json(res, 200, { ok: true, app: 'familyclash' });

  if (p === '/api/events' && req.method === 'GET') {
    const room = String(url.searchParams.get('room') || '').toUpperCase();
    const role = url.searchParams.get('role');
    if (!validRoom(room) || (role !== 'host' && role !== 'board')) return json(res, 400, { ok: false });
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 2000\n\n');
    const r = getRoom(room);
    r[role].add(res);
    if (role === 'board' && r.lastState) sse(res, r.lastState);
    const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 20000);
    req.on('close', () => {
      clearInterval(keepAlive);
      r[role].delete(res);
    });
    return;
  }

  if (p === '/api/send' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req, 2 * 1024 * 1024));
      const room = String(body.room || '').toUpperCase();
      if (!validRoom(room) || (body.to !== 'host' && body.to !== 'board') || !body.msg) throw new Error('bad');
      const r = getRoom(room);
      if (body.to === 'board' && body.msg.type === 'state') r.lastState = body.msg;
      r[body.to].forEach((c) => sse(c, body.msg));
      return json(res, 200, { ok: true });
    } catch (e) {
      return json(res, 400, { ok: false });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { ok: false });

  // Friendly short URLs for typing on a TV remote.
  if (p === '/board' || p === '/tv') {
    res.writeHead(302, { Location: '/board.html' + url.search });
    return res.end();
  }

  // Static files
  let rel;
  try {
    rel = decodeURIComponent(p);
  } catch (e) {
    return json(res, 400, { ok: false });
  }
  if (rel.endsWith('/')) rel += 'index.html';
  if (rel.split('/').some((seg) => seg.startsWith('.'))) return json(res, 404, { ok: false });
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep)) return json(res, 403, { ok: false });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

// Forget idle rooms after 12 hours.
setInterval(() => {
  const cutoff = Date.now() - 12 * 3600 * 1000;
  for (const [code, r] of rooms) {
    if (!r.host.size && !r.board.size && r.touched < cutoff) rooms.delete(code);
  }
}, 3600 * 1000).unref();

server.listen(PORT, '0.0.0.0', () => {
  const addrs = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) addrs.push(a.address);
  }
  console.log('\n  Family Clash is running!\n');
  console.log(`  On this computer:   http://localhost:${PORT}`);
  addrs.forEach((a) => console.log(`  On your Wi-Fi:      http://${a}:${PORT}   (board: http://${a}:${PORT}/board)`));
  console.log('\n  Open the host on your tablet, the board on the TV / laptop. Ctrl+C to stop.\n');
});
