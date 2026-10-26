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
    const userText = body.contents?.[0]?.parts?.[0]?.text || '';
    fakeGemini.calls = (fakeGemini.calls || 0) + 1;
    // Translation requests: echo every item back "translated".
    if (userText.includes('moderador automático')) {
      const verdict = /phishing-falso/.test(userText) ? 'scam' : 'ok';
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: verdict }] } }] }));
      return;
    }
    if (userText.includes('Traduce cada texto')) {
      const items = JSON.parse(userText.slice(userText.lastIndexOf('[')));
      const out = items.map((item) => ({ id: item.id, text: `[trad] ${item.text}`, same: item.text.startsWith('ya ') }));
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(out) + '\n```' }] } }] }));
      return;
    }
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
      KOVA_AUTH_RATE_LIMIT: '1000',
      KOVA_JOBS_INTERVAL_MS: '300',
      KOVA_SCHEDULE_MIN_AHEAD_MS: '0',
      KOVA_OFFLINE_TESTS: '1',
      KOVA_DISABLE_PUSH: '1',
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

test('espacios: incluyen a sus miembros sin exponer correos', async () => {
  const owner = await register('miembros');
  const guest = await register('invitado');
  const space = await createSpace(owner, guest);
  const listed = (await call('GET', '/servers', undefined, guest.token)).body.find((s) => s.id === space.id);
  assert.deepEqual(listed.members.map((m) => m.id).sort(), [owner.id, guest.id].sort());
  assert.ok(listed.members.every((m) => !('email' in m)), 'no se envían correos de otros miembros');
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

test('perfiles: apodo por espacio, color, sonido de entrada e invitaciones de miembros', async () => {
  const owner = await register('dueno');
  const guest = await register('apodo');
  const outsider = await register('fuera');
  const space = await createSpace(owner, guest);

  // Any member can invite; strangers can't.
  assert.equal((await call('POST', `/servers/${space.id}/invites`, {}, guest.token)).status, 201);
  assert.equal((await call('POST', `/servers/${space.id}/invites`, {}, outsider.token)).status, 403);

  assert.equal((await call('PUT', `/servers/${space.id}/nickname`, { nickname: 'Capi' }, outsider.token)).status, 403);
  const set = await call('PUT', `/servers/${space.id}/nickname`, { nickname: '  Capi   del grupo ' }, guest.token);
  assert.equal(set.body.nickname, 'Capi del grupo');
  const listed = (await call('GET', '/servers', undefined, owner.token)).body.find((s) => s.id === space.id);
  assert.equal(listed.members.find((m) => m.id === guest.id).nickname, 'Capi del grupo');
  await call('PUT', `/servers/${space.id}/nickname`, { nickname: '' }, guest.token);
  const cleared = (await call('GET', '/servers', undefined, owner.token)).body.find((s) => s.id === space.id);
  assert.equal(cleared.members.find((m) => m.id === guest.id).nickname, '');

  assert.equal((await call('PATCH', '/users/me', { accentColor: 'rojo' }, guest.token)).status, 400);
  assert.equal((await call('PATCH', '/users/me', { joinSound: 'data:audio/mp3;base64,AAAA' }, guest.token)).status, 400);
  const profile = await call('PATCH', '/users/me', { accentColor: '#C0FFEE', joinSound: 'https://cdn.example.com/hola.mp3' }, guest.token);
  assert.equal(profile.body.accentColor, '#c0ffee');
  assert.equal(profile.body.joinSound, 'https://cdn.example.com/hola.mp3');
});

test('verificado: solo la cuenta configurada y sus espacios', async () => {
  const normal = await register('normal');
  const listed = (await call('GET', '/auth/me', undefined, normal.token)).body;
  assert.equal(listed.verified, false);
  const vip = await call('POST', '/auth/register', { username: 'vip', email: 'InfoKenchinVFX@gmail.com', password: 'password123', displayName: 'Vip' });
  assert.equal(vip.body.user.verified, true);
  const space = await createSpace({ token: vip.body.token }, normal);
  const seen = (await call('GET', '/servers', undefined, normal.token)).body.find((s) => s.id === space.id);
  assert.equal(seen.verified, true);
  assert.equal(seen.members.find((m) => m.id === vip.body.user.id).verified, true);
  const loner = await register('solo');
  const other = await createSpace(loner);
  assert.equal(other.verified, false);
});

test('roles y permisos: se guardan en el servidor y se aplican', async () => {
  const owner = await register('jefa');
  const mod = await register('mod');
  const guest = await register('visita');
  const space = await createSpace(owner, mod, guest);
  const get = async (who) => (await call('GET', '/servers', undefined, who.token)).body.find((s) => s.id === space.id);

  // Defaults exist and the owner carries the owner role.
  const initial = await get(guest);
  assert.ok(initial.roles.some((r) => r.name === '@everyone'));
  assert.ok(initial.members.find((m) => m.id === owner.id).roles.includes(`role_owner_${space.id}`));

  // A plain member can't create channels or roles.
  assert.equal((await call('POST', '/channels', { serverId: space.id, name: 'nope' }, guest.token)).status, 403);
  assert.equal((await call('POST', `/servers/${space.id}/roles`, { name: 'x' }, guest.token)).status, 403);

  // Owner creates a role with MANAGE_CHANNELS and gives it to mod.
  const role = await call('POST', `/servers/${space.id}/roles`, { name: 'Canales', color: '#ABCDEF', permissions: ['MANAGE_CHANNELS', 'INVENTADO'] }, owner.token);
  assert.equal(role.status, 201);
  assert.deepEqual(role.body.permissions, ['MANAGE_CHANNELS']);
  assert.equal((await call('PUT', `/servers/${space.id}/members/${mod.id}/roles/${role.body.id}`, {}, owner.token)).status, 200);
  assert.ok((await get(guest)).members.find((m) => m.id === mod.id).roles.includes(role.body.id), 'persistido para todos');

  const created = await call('POST', '/channels', { serverId: space.id, name: 'nuevo', type: 'raro' }, mod.token);
  assert.equal(created.status, 201);
  assert.equal(created.body.type, 'text', 'tipos desconocidos pasan a texto');
  assert.equal((await call('DELETE', `/channels/${created.body.id}`, undefined, mod.token)).status, 200);

  // Only the owner can hand out ADMINISTRATOR; the owner role is untouchable.
  assert.equal((await call('PATCH', `/servers/${space.id}/roles/${role.body.id}`, { permissions: ['ADMINISTRATOR'] }, owner.token)).status, 200);
  assert.equal((await call('PATCH', `/servers/${space.id}/roles/role_owner_${space.id}`, { name: 'yo' }, owner.token)).status, 403);

  // Kick: members can't kick; the owner can; the kicked person loses access.
  assert.equal((await call('DELETE', `/servers/${space.id}/members/${mod.id}`, undefined, guest.token)).status, 403);
  assert.equal((await call('DELETE', `/servers/${space.id}/members/${guest.id}`, undefined, owner.token)).status, 200);
  assert.equal(await get(guest), undefined);
  // Ban: banned people can't come back with a new invite.
  const invite = await call('POST', `/servers/${space.id}/invites`, {}, owner.token);
  assert.equal((await call('POST', '/servers/join', { inviteCode: invite.body.code }, guest.token)).status, 200, 'expulsar no veta');
  assert.equal((await call('DELETE', `/servers/${space.id}/members/${guest.id}?ban=1`, undefined, owner.token)).status, 200);
  assert.equal((await call('POST', '/servers/join', { inviteCode: invite.body.code }, guest.token)).status, 403);

  // Leave: a member may leave, the owner may not.
  assert.equal((await call('DELETE', `/servers/${space.id}/members/${mod.id}`, undefined, mod.token)).status, 200);
  assert.equal((await call('DELETE', `/servers/${space.id}/members/${owner.id}`, undefined, owner.token)).status, 403);

  // Joining returns the full space, members included.
  const fresh = await register('nueva');
  const joined = await call('POST', '/servers/join', { inviteCode: invite.body.code }, fresh.token);
  assert.ok(joined.body.members.some((m) => m.id === owner.id));
  assert.ok(Array.isArray(joined.body.roles) && joined.body.roles.length >= 3);
});

test('amistad: enviar por nombre, aceptar, eliminar y volver a pedir', async () => {
  const a = await register('amiga');
  const b = await register('amigo');
  const meB = (await call('GET', '/auth/me', undefined, b.token)).body;
  const sent = await call('POST', '/friends/requests', { identity: `@${meB.username}` }, a.token);
  assert.equal(sent.status, 201, JSON.stringify(sent.body));
  const incoming = (await call('GET', '/friends', undefined, b.token)).body.incoming;
  assert.equal(incoming.length, 1);
  assert.equal((await call('POST', `/friends/requests/${incoming[0].id}/accept`, undefined, b.token)).status, 200);
  assert.ok((await call('GET', '/friends', undefined, a.token)).body.friends.some((f) => f.id === b.id));

  // Removing and asking again works (the old accepted request doesn't block it).
  assert.equal((await call('DELETE', `/friends/${a.id}`, undefined, b.token)).status, 200);
  assert.equal((await call('POST', '/friends/requests', { userId: b.id }, a.token)).status, 201);
  // Asking back accepts it straight away.
  const back = await call('POST', '/friends/requests', { userId: a.id }, b.token);
  assert.equal(back.body.accepted, true);
  assert.ok((await call('GET', '/friends', undefined, b.token)).body.friends.some((f) => f.id === a.id));
});

test('mensajes: fijar solo con permiso y respuestas con cita', async () => {
  const owner = await register('fija');
  const guest = await register('lee');
  const space = await createSpace(owner, guest);
  const channel = space.channels.find((c) => c.type !== 'voice');
  const first = await call('POST', `/channels/${channel.id}/messages`, { content: 'Primer mensaje del canal' }, guest.token);
  const reply = await call('POST', `/channels/${channel.id}/messages`, { content: 'Respuesta', replyToId: first.body.id }, owner.token);
  assert.equal(reply.body.replyTo.content, 'Primer mensaje del canal');

  assert.equal((await call('PUT', `/messages/${first.body.id}/pin`, undefined, guest.token)).status, 403, 'sin MANAGE_MESSAGES no se fija');
  assert.equal((await call('PUT', `/messages/${first.body.id}/pin`, undefined, owner.token)).status, 200);
  await call('PUT', `/messages/${first.body.id}`, { content: 'Primer mensaje editado' }, guest.token);

  const history = (await call('GET', `/channels/${channel.id}/messages`, undefined, guest.token)).body;
  const pinned = history.find((m) => m.id === first.body.id);
  assert.equal(pinned.pinned, true, 'el fijado se guarda para todos');
  assert.equal(pinned.edited, true);
  assert.equal(history.find((m) => m.id === reply.body.id).replyTo.authorName.length > 0, true);
});

test('no leídos, menciones, búsqueda e historial paginado', async () => {
  const owner = await register('lectora');
  const guest = await register('escritor');
  const space = await createSpace(owner, guest);
  const channel = space.channels.find((c) => c.type !== 'voice');
  const ownerName = (await call('GET', '/auth/me', undefined, owner.token)).body.username;

  await call('PUT', `/channels/${channel.id}/read`, undefined, owner.token);
  await new Promise((resolve) => setTimeout(resolve, 15));
  await call('POST', `/channels/${channel.id}/messages`, { content: 'hola a todos' }, guest.token);
  await call('POST', `/channels/${channel.id}/messages`, { content: `oye @${ownerName} mira esto 50% gratis` }, guest.token);
  await call('POST', `/channels/${channel.id}/messages`, { content: 'mi propio mensaje' }, owner.token);

  const unread = (await call('GET', '/unread', undefined, owner.token)).body[channel.id];
  assert.deepEqual(unread, { unread: 2, mentions: 1 }, 'los propios no cuentan');
  await call('PUT', `/channels/${channel.id}/read`, undefined, owner.token);
  assert.equal((await call('GET', '/unread', undefined, owner.token)).body[channel.id], undefined);

  // Search: literal %, author filter, outsiders blocked.
  const found = (await call('GET', `/servers/${space.id}/search?q=${encodeURIComponent('50%')}`, undefined, owner.token)).body;
  assert.equal(found.length, 1);
  assert.equal(found[0].channelName, channel.name);
  assert.equal((await call('GET', `/servers/${space.id}/search?author=${guest.id}`, undefined, owner.token)).body.length, 2);
  const stranger = await register('ajeno');
  assert.equal((await call('GET', `/servers/${space.id}/search?q=hola`, undefined, stranger.token)).status, 404);

  // History pages back with ?before=
  for (let i = 0; i < 5; i += 1) await call('POST', `/channels/${channel.id}/messages`, { content: `relleno ${i}` }, guest.token);
  const latest = (await call('GET', `/channels/${channel.id}/messages?limit=3`, undefined, owner.token)).body;
  assert.equal(latest.length, 3);
  const older = (await call('GET', `/channels/${channel.id}/messages?limit=50&before=${latest[0].id}`, undefined, owner.token)).body;
  assert.equal(older.length, 5);
  assert.ok(older.every((m) => !latest.some((l) => l.id === m.id)));
});

test('voz: ocupación de salas solo para miembros y salir avisa', async () => {
  const owner = await register('salas');
  const stranger = await register('fuera2');
  const space = await createSpace(owner);
  assert.equal((await call('GET', `/servers/${space.id}/voice`, undefined, stranger.token)).status, 404);
  const occupancy = await call('GET', `/servers/${space.id}/voice`, undefined, owner.token);
  assert.equal(occupancy.status, 200);
  assert.deepEqual(occupancy.body, {}, 'sin LiveKit accesible: nadie');
  const voice = space.channels.find((c) => c.type === 'voice');
  assert.equal((await call('POST', '/voice/left', { channelId: voice.id }, owner.token)).status, 200);
});

test('bloquear: corta la amistad, frena solicitudes y lista los bloqueados', async () => {
  const a = await register('bloquea');
  const b = await register('bloqueado');
  await call('POST', '/friends/requests', { userId: b.id }, a.token);
  const incoming = (await call('GET', '/friends', undefined, b.token)).body.incoming;
  await call('POST', `/friends/requests/${incoming[0].id}/accept`, undefined, b.token);
  assert.equal((await call('POST', '/safety/blocks', { userId: b.id }, a.token)).status, 201);
  assert.equal((await call('GET', '/friends', undefined, a.token)).body.friends.length, 0, 'ya no son amigos');
  assert.equal((await call('POST', '/friends/requests', { userId: a.id }, b.token)).status, 403);
  const list = (await call('GET', '/safety/blocks', undefined, a.token)).body;
  assert.equal(list.users[0].id, b.id);
  assert.ok(list.users[0].displayName);
  assert.equal((await call('DELETE', `/safety/blocks/${b.id}`, undefined, a.token)).status, 200);
  assert.equal((await call('GET', '/safety/blocks', undefined, a.token)).body.users.length, 0);
});

test('hilos y notas: guardados y visibles para el espacio', async () => {
  const owner = await register('hilos');
  const guest = await register('notas');
  const space = await createSpace(owner, guest);
  const channel = space.channels.find((c) => c.type !== 'voice');
  const parent = (await call('POST', `/channels/${channel.id}/messages`, { content: 'Tema del hilo' }, owner.token)).body;
  const reply = await call('POST', `/messages/${parent.id}/thread`, { content: 'Primera respuesta' }, guest.token);
  assert.equal(reply.status, 201);
  assert.equal(reply.body.threadCount, 1);
  const thread = (await call('GET', `/messages/${parent.id}/thread`, undefined, owner.token)).body;
  assert.equal(thread[0].content, 'Primera respuesta');
  const history = (await call('GET', `/channels/${channel.id}/messages`, undefined, owner.token)).body;
  assert.equal(history.find((m) => m.id === parent.id).threadCount, 1);

  const note = (await call('POST', `/channels/${channel.id}/notes`, { title: 'Normas', content: 'Respeto', tags: ['guía'] }, owner.token)).body;
  await call('PATCH', `/notes/${note.id}`, { content: 'Respeto y buen humor' }, guest.token);
  const notes = (await call('GET', `/channels/${channel.id}/notes`, undefined, guest.token)).body;
  assert.equal(notes[0].content, 'Respeto y buen humor', 'cualquier miembro puede editar');
  assert.equal((await call('DELETE', `/notes/${note.id}`, undefined, guest.token)).status, 403, 'borrar: autor o moderador');
  assert.equal((await call('DELETE', `/notes/${note.id}`, undefined, owner.token)).status, 200);
});

test('¿qué me perdí?: resumen con IA solo para miembros', async () => {
  const owner = await register('resumen');
  const stranger = await register('curioso');
  const space = await createSpace(owner);
  const channel = space.channels.find((c) => c.type !== 'voice');
  assert.equal((await call('POST', `/channels/${channel.id}/catchup`, { count: 10 }, owner.token)).status, 400, 'sin mensajes no hay resumen');
  for (const text of ['Quedamos el viernes', 'Yo llevo la pizza', 'Perfecto']) await call('POST', `/channels/${channel.id}/messages`, { content: text }, owner.token);
  assert.equal((await call('POST', `/channels/${channel.id}/catchup`, { count: 10 }, stranger.token)).status, 404);
  const summary = await call('POST', `/channels/${channel.id}/catchup`, { count: 10 }, owner.token);
  assert.equal(summary.status, 200);
  assert.equal(summary.body.count, 3);
  assert.ok(summary.body.summary.length > 0);
});

test('mensajes guardados: personales y solo de espacios accesibles', async () => {
  const owner = await register('guarda');
  const guest = await register('guardado');
  const space = await createSpace(owner, guest);
  const channel = space.channels.find((c) => c.type !== 'voice');
  const message = (await call('POST', `/channels/${channel.id}/messages`, { content: 'Link importante' }, owner.token)).body;
  assert.equal((await call('PUT', `/messages/${message.id}/save`, undefined, guest.token)).status, 200);
  let saved = (await call('GET', '/saved', undefined, guest.token)).body;
  assert.equal(saved.length, 1);
  assert.equal(saved[0].channelName, channel.name);
  assert.equal((await call('GET', '/saved', undefined, owner.token)).body.length, 0, 'es personal');
  // Leaving the space hides it.
  await call('DELETE', `/servers/${space.id}/members/${guest.id}`, undefined, guest.token);
  saved = (await call('GET', '/saved', undefined, guest.token)).body;
  assert.equal(saved.length, 0);
});

test('mensajes programados y recordatorios: se envían a su hora', async () => {
  const owner = await register('programa');
  const space = await createSpace(owner);
  const channel = space.channels.find((c) => c.type !== 'voice');
  const soon = new Date(Date.now() + 600).toISOString();
  assert.equal((await call('POST', `/channels/${channel.id}/scheduled`, { content: 'hola', sendAt: '2000-01-01T00:00:00Z' }, owner.token)).status, 400, 'no al pasado');
  const scheduled = await call('POST', `/channels/${channel.id}/scheduled`, { content: 'Mensaje programado', sendAt: soon }, owner.token);
  assert.equal(scheduled.status, 201);
  const cancel = await call('POST', `/channels/${channel.id}/scheduled`, { content: 'Este se cancela', sendAt: new Date(Date.now() + 60_000).toISOString() }, owner.token);
  assert.equal((await call('GET', '/scheduled', undefined, owner.token)).body.length, 2);
  await call('DELETE', `/scheduled/${cancel.body.id}`, undefined, owner.token);

  const message = (await call('POST', `/channels/${channel.id}/messages`, { content: 'Revisar el presupuesto' }, owner.token)).body;
  assert.equal((await call('POST', '/reminders', { messageId: message.id, remindAt: soon }, owner.token)).status, 201);

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const history = (await call('GET', `/channels/${channel.id}/messages`, undefined, owner.token)).body;
  assert.ok(history.some((m) => m.content === 'Mensaje programado'), 'se publicó solo');
  assert.ok(!history.some((m) => m.content === 'Este se cancela'));
  assert.equal((await call('GET', '/scheduled', undefined, owner.token)).body.length, 0);
  const due = (await call('GET', '/reminders?due=1', undefined, owner.token)).body;
  assert.equal(due.length, 1);
  assert.equal(due[0].note, 'Revisar el presupuesto');
  assert.equal((await call('GET', '/reminders?due=1', undefined, owner.token)).body.length, 0, 'se muestra una vez');
});

test('traducción: por lotes, con caché y solo de mensajes accesibles', async () => {
  const owner = await register('traduce');
  const stranger = await register('ajeno3');
  const space = await createSpace(owner);
  const channel = space.channels.find((c) => c.type !== 'voice');
  const a = (await call('POST', `/channels/${channel.id}/messages`, { content: 'hello team' }, owner.token)).body;
  const b = (await call('POST', `/channels/${channel.id}/messages`, { content: 'ya está en español' }, owner.token)).body;
  assert.equal((await call('POST', '/translate', { lang: 'xx', messageIds: [a.id] }, owner.token)).status, 400);
  const first = (await call('POST', '/translate', { lang: 'es', messageIds: [a.id, b.id] }, owner.token)).body;
  assert.equal(first[a.id].text, '[trad] hello team');
  assert.equal(first[b.id].same, true);
  const callsBefore = fakeGemini.calls;
  const again = (await call('POST', '/translate', { lang: 'es', messageIds: [a.id] }, owner.token)).body;
  assert.equal(again[a.id].text, '[trad] hello team');
  assert.equal(fakeGemini.calls, callsBefore, 'la segunda vez sale de la caché');
  assert.deepEqual((await call('POST', '/translate', { lang: 'es', messageIds: [a.id] }, stranger.token)).body, {}, 'ajenos: nada');
});

test('notas de llamada: transcribir tu voz y resumen publicado en la sala', async () => {
  const owner = await register('llamada');
  const stranger = await register('ajeno4');
  const space = await createSpace(owner);
  const voice = space.channels.find((c) => c.type === 'voice');
  const text = space.channels.find((c) => c.type !== 'voice');
  assert.equal((await call('POST', `/voice/${text.id}/transcribe`, { audio: 'AAAA' }, owner.token)).status, 404, 'solo salas de voz');
  assert.equal((await call('POST', `/voice/${voice.id}/transcribe`, { audio: 'AAAA' }, stranger.token)).status, 404);
  assert.equal((await call('POST', `/voice/${voice.id}/summary`, {}, owner.token)).status, 400, 'sin transcripción no hay resumen');
  const clip = await call('POST', `/voice/${voice.id}/transcribe`, { audio: Buffer.from('audio falso').toString('base64'), mimeType: 'audio/webm;codecs=opus' }, owner.token);
  assert.equal(clip.status, 200);
  assert.ok(clip.body.text.length > 0);
  const summary = await call('POST', `/voice/${voice.id}/summary`, {}, owner.token);
  assert.equal(summary.status, 200);
  const roomChat = (await call('GET', `/channels/${voice.id}/messages`, undefined, owner.token)).body;
  assert.ok(roomChat.some((m) => m.id === summary.body.messageId && m.content.startsWith('📝 **Resumen de la llamada**')));
});

test('AutoMod con IA: frena estafas y spam antes de publicarse', async () => {
  const owner = await register('automod');
  const member = await register('miembro9');
  const space = await createSpace(owner, member);
  const text = space.channels.find((c) => c.type !== 'voice');
  const post = (who, content) => call('POST', `/channels/${text.id}/messages`, { content }, who.token);
  assert.equal((await post(member, 'free nitro aquí https://x.example')).status, 201, 'apagado por defecto');
  assert.equal((await call('PATCH', `/spaces/${space.id}/automod`, { enabled: true }, member.token)).status, 403);
  assert.equal((await call('PATCH', `/spaces/${space.id}/automod`, { enabled: true }, owner.token)).body.enabled, true);
  const scam = await post(member, 'free nitro aquí https://x.example');
  assert.equal(scam.status, 422);
  assert.equal(scam.body.code, 'AUTOMOD_BLOCKED');
  assert.equal((await post(member, 'mira https://phishing-falso.example/login')).status, 422, 'la IA detecta el enlace');
  assert.equal((await post(member, 'mira este clip https://youtube.com/watch?v=1')).status, 201);
  assert.equal((await post(member, 'hola')).status, 201);
  assert.equal((await post(member, 'hola')).status, 201);
  assert.equal((await post(member, 'hola')).status, 422, 'repetido 3 veces');
  assert.equal((await post(owner, 'free nitro https://x.example')).status, 201, 'los moderadores no pasan por AutoMod');
  const log = (await call('GET', `/spaces/${space.id}/automod`, undefined, owner.token)).body.log;
  assert.equal(log.length, 3);
});

test('eventos: calendario del espacio con "me interesa"', async () => {
  const owner = await register('eventos');
  const member = await register('miembro10');
  const stranger = await register('ajeno5');
  const space = await createSpace(owner, member);
  const startsAt = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
  assert.equal((await call('POST', `/spaces/${space.id}/events`, { title: 'Torneo', startsAt }, member.token)).status, 403);
  assert.equal((await call('POST', `/spaces/${space.id}/events`, { title: 'Pasado', startsAt: '2020-01-01T00:00:00Z' }, owner.token)).status, 400);
  const created = await call('POST', `/spaces/${space.id}/events`, { title: 'Torneo', description: 'Final', startsAt }, owner.token);
  assert.equal(created.status, 201);
  assert.equal(created.body.interested, 1);
  assert.equal((await call('GET', `/spaces/${space.id}/events`, undefined, stranger.token)).status, 404);
  const rsvp = await call('POST', `/events/${created.body.id}/rsvp`, { interested: true }, member.token);
  assert.equal(rsvp.body.interested, 2);
  assert.equal(rsvp.body.meInterested, true);
  assert.equal((await call('DELETE', `/events/${created.body.id}`, undefined, member.token)).status, 403);
  assert.equal((await call('DELETE', `/events/${created.body.id}`, undefined, owner.token)).status, 200);
  assert.equal((await call('GET', `/spaces/${space.id}/events`, undefined, member.token)).body.length, 0);
});

test('escuchar juntos: cola compartida y posición sincronizada', async () => {
  const owner = await register('musica');
  const member = await register('miembro11');
  const stranger = await register('ajeno6');
  const space = await createSpace(owner, member);
  const voice = space.channels.find((c) => c.type === 'voice');
  const music = (who, data) => call('POST', `/voice/${voice.id}/music`, data, who.token);
  assert.equal((await music(stranger, { action: 'add', url: 'https://youtu.be/dQw4w9WgXcQ' })).status, 404);
  assert.equal((await music(owner, { action: 'add', url: 'https://example.com/pagina' })).status, 400);
  const first = await music(owner, { action: 'add', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  assert.equal(first.status, 200);
  assert.equal(first.body.current.kind, 'youtube');
  assert.equal(first.body.current.ref, 'dQw4w9WgXcQ');
  assert.equal(first.body.playing, true);
  const queued = await music(member, { action: 'add', url: 'https://cdn.example.com/cancion.mp3' });
  assert.equal(queued.body.queue.length, 1);
  assert.equal(queued.body.queue[0].kind, 'audio');
  const paused = await music(member, { action: 'pause' });
  assert.equal(paused.body.playing, false);
  assert.ok(paused.body.offsetMs >= 0);
  const skipped = await music(owner, { action: 'skip' });
  assert.equal(skipped.body.current.kind, 'audio');
  assert.equal(skipped.body.queue.length, 0);
  assert.equal((await call('GET', `/voice/${voice.id}/music`, undefined, member.token)).body.current.title, 'cancion.mp3');
  assert.equal((await music(owner, { action: 'stop' })).body.current, null);
});

test('notificaciones push: clave pública y suscripción por dispositivo', async () => {
  const user = await register('push');
  const key = await call('GET', '/push/key');
  assert.equal(key.status, 200);
  assert.ok(key.body.publicKey.length > 40);
  assert.equal((await call('GET', '/push/key')).body.publicKey, key.body.publicKey, 'la clave es estable');
  const sub = { endpoint: 'https://push.example.com/abc', keys: { p256dh: 'BPk', auth: 'xyz' } };
  assert.equal((await call('POST', '/push/subscribe', sub)).status, 401);
  assert.equal((await call('POST', '/push/subscribe', { endpoint: 'http://inseguro' }, user.token)).status, 400);
  assert.equal((await call('POST', '/push/subscribe', sub, user.token)).status, 200);
  assert.equal((await call('POST', '/push/unsubscribe', { endpoint: sub.endpoint }, user.token)).status, 200);
});

test('permisos por canal: privados y de solo lectura', async () => {
  const owner = await register('permcanal');
  const vip = await register('vip1');
  const normal = await register('normal1');
  const space = await createSpace(owner, vip, normal);
  const text = space.channels.find((c) => c.type !== 'voice');
  const role = (await call('POST', `/servers/${space.id}/roles`, { name: 'VIP', permissions: [] }, owner.token)).body;
  await call('PUT', `/servers/${space.id}/members/${vip.id}/roles/${role.id}`, {}, owner.token);
  const channelsOf = async (who) => (await call('GET', '/servers', undefined, who.token)).body.find((s) => s.id === space.id).channels;

  assert.equal((await call('PUT', `/channels/${text.id}/access`, { private: true, viewRoles: [role.id] }, normal.token)).status, 403);
  const set = await call('PUT', `/channels/${text.id}/access`, { private: true, viewRoles: [role.id, 'inventado'] }, owner.token);
  assert.deepEqual(set.body.viewRoles, [role.id]);
  assert.ok(!(await channelsOf(normal)).some((c) => c.id === text.id), 'oculto para quien no tiene el rol');
  assert.ok((await channelsOf(vip)).find((c) => c.id === text.id).private);
  assert.equal((await call('GET', `/channels/${text.id}/messages`, undefined, normal.token)).status, 404);
  assert.equal((await call('POST', `/channels/${text.id}/messages`, { content: 'hola' }, normal.token)).status, 404);
  assert.equal((await call('POST', `/channels/${text.id}/messages`, { content: 'hola vip' }, vip.token)).status, 201);
  const found = (await call('GET', `/servers/${space.id}/search?q=vip`, undefined, normal.token)).body;
  assert.equal(found.length, 0, 'la búsqueda no filtra contenido privado');

  await call('PUT', `/channels/${text.id}/access`, { readOnly: true, sendRoles: [role.id] }, owner.token);
  const visible = (await channelsOf(normal)).find((c) => c.id === text.id);
  assert.equal(visible.readOnly, true);
  assert.equal(visible.canSend, false);
  assert.equal((await call('POST', `/channels/${text.id}/messages`, { content: 'no puedo' }, normal.token)).status, 403);
  assert.equal((await call('POST', `/channels/${text.id}/messages`, { content: 'anuncio' }, vip.token)).status, 201);
  assert.equal((await call('POST', `/channels/${text.id}/messages`, { content: 'dueño' }, owner.token)).status, 201);
});

test('emojis y stickers propios del espacio', async () => {
  const owner = await register('emojis');
  const member = await register('miembro12');
  const space = await createSpace(owner, member);
  const img = 'https://cdn.example.com/kova.png';
  assert.equal((await call('POST', `/servers/${space.id}/expressions`, { name: 'kova', url: img }, member.token)).status, 403);
  assert.equal((await call('POST', `/servers/${space.id}/expressions`, { name: 'k', url: img }, owner.token)).status, 400);
  assert.equal((await call('POST', `/servers/${space.id}/expressions`, { name: 'kova', url: 'javascript:alert(1)' }, owner.token)).status, 400);
  const emoji = await call('POST', `/servers/${space.id}/expressions`, { name: 'Kova Fuego', url: img }, owner.token);
  assert.equal(emoji.status, 201);
  assert.equal(emoji.body.name, 'kova_fuego');
  assert.equal((await call('POST', `/servers/${space.id}/expressions`, { name: 'kova_fuego', url: img }, owner.token)).status, 409);
  const sticker = await call('POST', `/servers/${space.id}/expressions`, { kind: 'sticker', name: 'kova_fuego', url: img }, owner.token);
  assert.equal(sticker.status, 201, 'un sticker puede llamarse igual que un emoji');
  const payload = (await call('GET', '/servers', undefined, member.token)).body.find((s) => s.id === space.id);
  assert.equal(payload.expressions.length, 2);
  assert.equal((await call('DELETE', `/expressions/${emoji.body.id}`, undefined, member.token)).status, 404);
  assert.equal((await call('DELETE', `/expressions/${emoji.body.id}`, undefined, owner.token)).status, 200);
});

test('encuestas: votar, cambiar el voto y cerrar', async () => {
  const owner = await register('encuesta');
  const member = await register('miembro13');
  const space = await createSpace(owner, member);
  const text = space.channels.find((c) => c.type !== 'voice');
  assert.equal((await call('POST', `/channels/${text.id}/polls`, { question: '¿Qué juego?', options: ['A'] }, member.token)).status, 400);
  const created = await call('POST', `/channels/${text.id}/polls`, { question: '¿Qué juego?', options: ['Valorant', 'Minecraft', 'Valorant'] }, member.token);
  assert.equal(created.status, 201);
  assert.equal(created.body.poll.options.length, 2, 'opciones repetidas fuera');
  const pollId = created.body.poll.id;
  const msgs = (await call('GET', `/channels/${text.id}/messages`, undefined, owner.token)).body;
  assert.ok(msgs.some((m) => m.content.startsWith(`[poll:${pollId}]`)));
  const v1 = await call('POST', `/polls/${pollId}/vote`, { optionIds: ['o1', 'o2'] }, owner.token);
  assert.deepEqual(v1.body.myVotes, ['o1'], 'una sola opción si no es múltiple');
  await call('POST', `/polls/${pollId}/vote`, { optionIds: ['o2'] }, member.token);
  const v2 = await call('POST', `/polls/${pollId}/vote`, { optionIds: ['o2'] }, owner.token);
  assert.equal(v2.body.options[1].votes, 2);
  assert.equal(v2.body.voters, 2);
  const stranger = await register('ajeno7');
  assert.equal((await call('GET', `/polls/${pollId}`, undefined, stranger.token)).status, 404);
  assert.equal((await call('POST', `/polls/${pollId}/close`, {}, member.token)).status, 200, 'quien la creó puede cerrarla');
  assert.equal((await call('POST', `/polls/${pollId}/vote`, { optionIds: ['o1'] }, owner.token)).status, 400);
});

test('foros: publicaciones con título, etiquetas y respuestas en hilo', async () => {
  const owner = await register('foro');
  const member = await register('miembro14');
  const space = await createSpace(owner, member);
  const forum = (await call('POST', '/channels', { serverId: space.id, name: 'ayuda', type: 'forum' }, owner.token)).body;
  assert.equal(forum.type, 'forum');
  assert.equal((await call('PUT', `/channels/${forum.id}/forum-tags`, { tags: ['Bug', 'Idea'] }, member.token)).status, 403);
  assert.deepEqual((await call('PUT', `/channels/${forum.id}/forum-tags`, { tags: ['Bug', 'Idea', 'Bug'] }, owner.token)).body.tags, ['Bug', 'Idea']);
  assert.equal((await call('POST', `/channels/${forum.id}/posts`, { title: '', content: 'x' }, member.token)).status, 400);
  const post = await call('POST', `/channels/${forum.id}/posts`, { title: 'No carga el chat', content: 'Pasos…', tags: ['Bug', 'Inventada'] }, member.token);
  assert.equal(post.status, 201);
  assert.deepEqual(post.body.tags, ['Bug']);
  await call('POST', `/channels/${forum.id}/posts`, { title: 'Modo oscuro', content: '¿Más?', tags: ['Idea'] }, owner.token);
  await call('POST', `/messages/${post.body.id}/thread`, { content: 'A mí también' }, owner.token);
  const list = (await call('GET', `/channels/${forum.id}/posts`, undefined, member.token)).body;
  assert.equal(list.posts.length, 2);
  assert.equal(list.posts.find((p) => p.id === post.body.id).replies, 1);
  assert.equal((await call('GET', `/channels/${forum.id}/posts?tag=Idea`, undefined, member.token)).body.posts.length, 1);
  const text = space.channels.find((c) => c.type !== 'voice');
  assert.equal((await call('GET', `/channels/${text.id}/posts`, undefined, member.token)).status, 404, 'solo en canales de foro');
});
