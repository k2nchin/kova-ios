// Integration tests for the Kova API. Each run starts the real server on a free
// port with a throwaway SQLite database. Run with: npm --prefix server test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { totpForTesting } from '../twoFactor.mjs';

const serverDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kova-api-test-'));
const port = 4300 + Math.floor(Math.random() * 500);
const base = `http://localhost:${port}/api`;
let serverProcess;
let fakeGemini;
let geminiPort;

const call = async (method, route, body, token) => {
  const res = await fetch(base + route, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

let userCounter = 0;
const register = async (name = 'user') => {
  userCounter += 1;
  const username = `${name}${userCounter}`;
  const email = `${username}@test.kova`;
  const res = await call('POST', '/auth/register', { username, email, password: 'password123', displayName: name });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return { token: res.body.token, id: res.body.user.id, email };
};

const createSpace = async (owner, ...members) => {
  await call('POST', '/servers', { name: `Espacio ${crypto.randomUUID().slice(0, 6)}`, channels: [{ name: 'general' }, { name: 'Sala', type: 'voice' }] }, owner.token);
  const spaces = (await call('GET', '/servers', undefined, owner.token)).body;
  const space = spaces[spaces.length - 1];
  for (const member of members) {
    const invite = await call('POST', `/servers/${space.id}/invites`, {}, owner.token);
    await call('POST', '/servers/join', { inviteCode: invite.body.code }, member.token);
  }
  return space;
};

before(async () => {
  fakeGemini = http.createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: `system=${body.systemInstruction.parts[0].text.startsWith('Eres Kova IA')}` }] } }] }));
  });
  await new Promise((resolve) => fakeGemini.listen(0, resolve));
  geminiPort = fakeGemini.address().port;

  serverProcess = spawn(process.execPath, ['index.mjs'], {
    cwd: serverDir,
    env: {
      ...process.env,
      VERCEL: '',
      DATABASE_URL: '',
      KOVA_API_PORT: String(port),
      KOVA_DATA_DIR: dataDir,
      KOVA_ENCRYPTION_KEY: 'test-encryption-key',
      GEMINI_API_KEY: 'test-gemini-key',
      GEMINI_API_BASE: `http://localhost:${geminiPort}`,
      KOVA_REALTIME_SECRET: 'relay-test-secret',
      LIVEKIT_URL: 'wss://test.livekit.invalid',
      LIVEKIT_API_KEY: 'APItest',
      LIVEKIT_API_SECRET: 'livekit-test-secret-with-enough-length',
      SUPABASE_URL: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('El servidor no arrancó a tiempo')), 15_000);
    serverProcess.stdout.on('data', (chunk) => {
      if (String(chunk).includes('listening')) { clearTimeout(timer); resolve(); }
    });
    serverProcess.on('exit', (code) => reject(new Error(`El servidor terminó con código ${code}`)));
  });
});

after(async () => {
  fakeGemini?.close();
  if (serverProcess && serverProcess.exitCode === null) {
    const exited = new Promise((resolve) => serverProcess.once('exit', resolve));
    serverProcess.kill();
    await exited;
  }
  // Windows may keep the SQLite file locked for a moment after the process exits.
  fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});

test('login: bloquea la cuenta tras 5 contraseñas incorrectas', async () => {
  const user = await register('lock');
  for (let i = 0; i < 5; i += 1) await call('POST', '/auth/login', { email: user.email, password: 'incorrecta' });
  const res = await call('POST', '/auth/login', { email: user.email, password: 'password123' });
  assert.equal(res.status, 429);
  assert.equal(res.body.code, 'LOGIN_LOCKED');
});

test('2FA: activar, exigir código, códigos de respaldo de un solo uso y desactivar', async () => {
  const user = await register('totp');
  const other = (await call('POST', '/auth/login', { email: user.email, password: 'password123' })).body.token;
  const setup = await call('POST', '/auth/2fa/setup', {}, user.token);
  assert.match(setup.body.secret, /^[A-Z2-7]{32}$/);
  assert.equal((await call('POST', '/auth/2fa/enable', { code: '000000' }, user.token)).status, 400);
  const enabled = await call('POST', '/auth/2fa/enable', { code: totpForTesting(setup.body.secret) }, user.token);
  assert.equal(enabled.body.backupCodes.length, 10);
  assert.equal((await call('GET', '/auth/me', undefined, other)).status, 401, 'las demás sesiones se cierran');

  const login = await call('POST', '/auth/login', { email: user.email, password: 'password123' });
  assert.equal(login.body.twoFactorRequired, true);
  assert.equal(login.body.token, undefined);
  const replay = await call('POST', '/auth/2fa/login', { challenge: login.body.challenge, code: totpForTesting(setup.body.secret) });
  assert.equal(replay.status, 401, 'un código TOTP no se puede reutilizar');
  const withBackup = await call('POST', '/auth/2fa/login', { challenge: login.body.challenge, code: enabled.body.backupCodes[0] });
  assert.equal(withBackup.status, 200);
  assert.equal(withBackup.body.backupCodesRemaining, 9);

  const again = await call('POST', '/auth/login', { email: user.email, password: 'password123' });
  assert.equal((await call('POST', '/auth/2fa/login', { challenge: again.body.challenge, code: enabled.body.backupCodes[0] })).status, 401);
  assert.equal((await call('POST', '/auth/2fa/disable', { code: enabled.body.backupCodes[1] }, user.token)).status, 200);
});

test('subidas: valida tipo y tamaño y sirve el archivo con cabeceras seguras', async () => {
  const user = await register('upload');
  assert.equal((await call('POST', '/uploads', { kind: 'attachment', fileName: 'x.svg', contentType: 'image/svg+xml', size: 10 }, user.token)).status, 415);
  assert.equal((await call('POST', '/uploads', { kind: 'sound', fileName: 's.mp3', contentType: 'audio/mpeg', size: 3e6 }, user.token)).status, 413);
  const ticket = await call('POST', '/uploads', { kind: 'avatar', fileName: '../../foto.png', contentType: 'image/png', size: 5 }, user.token);
  assert.equal(ticket.status, 200);
  assert.equal((await fetch(ticket.body.uploadUrl, { method: 'PUT', headers: ticket.body.headers, body: 'hello' })).status, 200);
  assert.equal((await fetch(ticket.body.uploadUrl, { method: 'PUT', headers: ticket.body.headers, body: 'x' })).status, 404, 'ticket de un solo uso');
  const file = await fetch(ticket.body.publicUrl);
  assert.equal(await file.text(), 'hello');
  assert.equal(file.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(`${base}/files/..%2F..%2Fkova.sqlite`)).status, 404);
});

test('perfil: se guarda en el servidor y rechaza data: URLs', async () => {
  const user = await register('perfil');
  const saved = await call('PATCH', '/users/me', { displayName: 'Nuevo', bio: 'hola', customStatus: 'aquí' }, user.token);
  assert.equal(saved.body.displayName, 'Nuevo');
  assert.equal((await call('GET', '/auth/me', undefined, user.token)).body.bio, 'hola');
  assert.equal((await call('PATCH', '/users/me', { avatar: 'data:image/png;base64,AA' }, user.token)).status, 400);
});

test('historias y bots: solo los ve quien comparte espacio', async () => {
  const owner = await register('owner');
  const member = await register('member');
  const stranger = await register('stranger');
  const space = await createSpace(owner, member);

  const story = await call('POST', '/stories', { text: 'hola' }, owner.token);
  assert.ok((await call('GET', '/stories', undefined, member.token)).body.some((s) => s.id === story.body.id));
  assert.ok(!(await call('GET', '/stories', undefined, stranger.token)).body.some((s) => s.id === story.body.id));
  assert.equal((await call('DELETE', `/stories/${story.body.id}`, undefined, member.token)).status, 403);

  const bot = await call('POST', '/bots', { serverId: space.id, bot: { name: 'Robo', avatar: 'javascript:alert(1)' } }, owner.token);
  assert.equal(bot.body.avatar, '');
  assert.ok((await call('GET', '/bots', undefined, member.token)).body.some((b) => b.id === bot.body.id));
  assert.equal((await call('POST', '/bots', { serverId: space.id, bot: { name: 'X' } }, stranger.token)).status, 404);
});

test('voz: token de LiveKit firmado solo para canales de voz accesibles', async () => {
  const owner = await register('voz');
  const stranger = await register('voz-ext');
  const space = await createSpace(owner);
  const voice = space.channels.find((c) => c.type === 'voice');
  const text = space.channels.find((c) => c.type !== 'voice');
  assert.equal((await call('POST', '/voice/token', { channelId: text.id }, owner.token)).status, 400);
  assert.equal((await call('POST', '/voice/token', { channelId: voice.id }, stranger.token)).status, 404);
  const res = await call('POST', '/voice/token', { channelId: voice.id }, owner.token);
  const [header, payload, signature] = res.body.token.split('.');
  const expected = crypto.createHmac('sha256', 'livekit-test-secret-with-enough-length').update(`${header}.${payload}`).digest('base64url');
  assert.equal(signature, expected);
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  assert.equal(claims.video.room, `kova_${voice.id}`);
  assert.equal(claims.sub, owner.id);
});

test('relé de tiempo real: solo con el secreto y solo eventos permitidos', async () => {
  const relay = (body, secret) => fetch(`${base}/realtime/emit`, { method: 'POST', headers: { 'content-type': 'application/json', ...(secret ? { 'x-kova-realtime-secret': secret } : {}) }, body: JSON.stringify(body) });
  assert.equal((await relay({ channelId: 'c', event: 'message:created', payload: {} })).status, 401);
  assert.equal((await relay({ channelId: 'c', event: 'message:created', payload: {} }, 'otro-secreto-xxxx')).status, 401);
  assert.equal((await relay({ channelId: 'c', event: 'presence:changed', payload: {} }, 'relay-test-secret')).status, 400);
  assert.equal((await relay({ channelId: 'c', event: 'message:created', payload: {} }, 'relay-test-secret')).status, 200);
});

test('Kova IA: exige sesión y usa las instrucciones del servidor', async () => {
  const user = await register('ia');
  assert.equal((await call('POST', '/ai/chat', { prompt: 'hola' })).status, 401);
  assert.equal((await call('POST', '/ai/chat', { prompt: ' ' }, user.token)).status, 400);
  const res = await call('POST', '/ai/chat', { prompt: 'hola' }, user.token);
  assert.equal(res.body.text, 'system=true');
});
