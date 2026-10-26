// Incoming webhooks: other apps post into a channel with a secret URL.
// Accepts Discord-style payloads ({ content, embeds }) so existing tools work as-is,
// plus a GitHub integration that turns GitHub events into readable messages.

export const webhooksSchema = `CREATE TABLE IF NOT EXISTS webhooks (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, signal_id TEXT NOT NULL, name TEXT NOT NULL, avatar TEXT NOT NULL DEFAULT '', token TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL);`;

const MAX_PER_SPACE = 15;
const RATE = new Map(); // webhookId -> { start, count }
const isTextChannel = (type) => type === 'text' || type === 'announcements';

const hookOut = (row, baseUrl, withSecret) => ({
  id: row.id,
  name: row.name,
  avatar: row.avatar,
  channelId: row.signal_id,
  createdAt: row.created_at,
  ...(withSecret ? { url: `${baseUrl}/api/hooks/${row.id}/${row.token}`, githubUrl: `${baseUrl}/api/hooks/${row.id}/${row.token}/github` } : {}),
});

/** Discord-style embed → plain Markdown lines. */
const embedText = (embed) => {
  if (!embed || typeof embed !== 'object') return '';
  const lines = [];
  if (embed.title) lines.push(`**${String(embed.title).slice(0, 256)}**${embed.url ? ` — ${String(embed.url).slice(0, 300)}` : ''}`);
  if (embed.description) lines.push(String(embed.description).slice(0, 2000));
  for (const field of Array.isArray(embed.fields) ? embed.fields.slice(0, 10) : []) lines.push(`**${String(field?.name || '').slice(0, 256)}:** ${String(field?.value || '').slice(0, 1024)}`);
  if (embed.footer?.text) lines.push(`_${String(embed.footer.text).slice(0, 200)}_`);
  return lines.join('\n');
};

/** GitHub event → message (null = ignore). */
export function githubMessage(event, payload) {
  const repo = payload?.repository?.full_name || 'repositorio';
  const who = payload?.sender?.login || 'alguien';
  switch (event) {
    case 'ping': return `🔗 GitHub conectado con **${repo}**.`;
    case 'push': {
      const commits = Array.isArray(payload.commits) ? payload.commits : [];
      if (!commits.length) return null;
      const branch = String(payload.ref || '').replace('refs/heads/', '');
      const list = commits.slice(0, 5).map((c) => `• \`${String(c.id || '').slice(0, 7)}\` ${String(c.message || '').split('\n')[0].slice(0, 100)} — ${c.author?.name || ''}`).join('\n');
      return `📦 **${who}** subió ${commits.length} commit${commits.length === 1 ? '' : 's'} a **${repo}** (${branch})\n${list}${commits.length > 5 ? `\n…y ${commits.length - 5} más` : ''}`;
    }
    case 'pull_request': {
      const pr = payload.pull_request || {};
      const verb = payload.action === 'closed' ? (pr.merged ? 'fusionó' : 'cerró') : payload.action === 'opened' ? 'abrió' : payload.action === 'reopened' ? 'reabrió' : null;
      return verb ? `🔀 **${who}** ${verb} la PR #${pr.number} en **${repo}**: ${pr.title}\n${pr.html_url || ''}` : null;
    }
    case 'issues': {
      const issue = payload.issue || {};
      const verb = payload.action === 'opened' ? 'abrió' : payload.action === 'closed' ? 'cerró' : payload.action === 'reopened' ? 'reabrió' : null;
      return verb ? `🐛 **${who}** ${verb} la incidencia #${issue.number} en **${repo}**: ${issue.title}\n${issue.html_url || ''}` : null;
    }
    case 'release': return payload.action === 'published' ? `🚀 Nueva versión de **${repo}**: **${payload.release?.name || payload.release?.tag_name}**\n${payload.release?.html_url || ''}` : null;
    case 'star': return payload.action === 'created' ? `⭐ **${who}** dio una estrella a **${repo}** (${payload.repository?.stargazers_count ?? '?'} en total)` : null;
    default: return null;
  }
}

/**
 *   GET    /api/servers/:id/webhooks                     (MANAGE_SERVER; includes secret URLs)
 *   POST   /api/servers/:id/webhooks   { name, channelId, avatar }
 *   DELETE /api/webhooks/:id
 *   POST   /api/hooks/:id/:token        { content, embeds }       public, secret in the URL
 *   POST   /api/hooks/:id/:token/github                           GitHub "application/json" webhooks
 */
export async function handleWebhookRoutes({ db, req, res, requestPath, session, send, readBody, can, deliverMessage, hostedImageUrl, crypto }) {
  const manage = requestPath.match(/^\/api\/servers\/([^/]+)\/webhooks$/);
  const remove = requestPath.match(/^\/api\/webhooks\/([^/]+)$/);
  const incoming = requestPath.match(/^\/api\/hooks\/([^/]+)\/([^/]+?)(\/github)?$/);
  if (!manage && !remove && !incoming) return false;
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  const baseUrl = String(process.env.PUBLIC_API_URL || `${proto}://${req.headers.host}`).replace(/\/api\/?$/, '').replace(/\/$/, '');

  if (incoming) {
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const hook = await db.prepare('SELECT * FROM webhooks WHERE id = ?').get(decodeURIComponent(incoming[1]));
    const token = decodeURIComponent(incoming[2]);
    const valid = hook && hook.token.length === token.length && crypto.timingSafeEqual(Buffer.from(hook.token), Buffer.from(token));
    if (!valid) { send(res, 404, { message: 'Webhook desconocido.' }); return true; }
    const now = Date.now();
    const bucket = RATE.get(hook.id);
    if (!bucket || now - bucket.start > 60_000) RATE.set(hook.id, { start: now, count: 1 });
    else if (++bucket.count > 30) { send(res, 429, { message: 'Demasiados mensajes: máximo 30 por minuto.' }); return true; }
    const body = await readBody(req);
    let content;
    if (incoming[3]) {
      content = githubMessage(String(req.headers['x-github-event'] || ''), body);
      if (!content) { send(res, 204, {}); return true; }
    } else {
      content = [String(body.content || '').trim(), ...(Array.isArray(body.embeds) ? body.embeds.slice(0, 5).map(embedText) : [])].filter(Boolean).join('\n\n');
      if (!content) { send(res, 400, { message: 'El mensaje está vacío.' }); return true; }
    }
    const message = await deliverMessage({ channelId: hook.signal_id, spaceId: hook.space_id, authorId: hook.id, content: content.slice(0, 10_000) });
    send(res, 200, { id: message.id });
    return true;
  }

  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }

  if (remove) {
    if (req.method !== 'DELETE') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const hook = await db.prepare('SELECT * FROM webhooks WHERE id = ?').get(decodeURIComponent(remove[1]));
    if (!hook || !await can(db, hook.space_id, session.user_id, 'MANAGE_SERVER')) { send(res, 404, { message: 'No encontramos ese webhook.' }); return true; }
    await db.prepare('DELETE FROM webhooks WHERE id = ?').run(hook.id);
    send(res, 200, { ok: true });
    return true;
  }

  const spaceId = decodeURIComponent(manage[1]);
  if (!await can(db, spaceId, session.user_id, 'MANAGE_SERVER')) { send(res, 403, { message: 'Necesitas el permiso Gestionar espacio.' }); return true; }
  if (req.method === 'GET') {
    const rows = await db.prepare('SELECT * FROM webhooks WHERE space_id = ? ORDER BY created_at').all(spaceId);
    send(res, 200, rows.map((row) => hookOut(row, baseUrl, true)));
    return true;
  }
  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const body = await readBody(req);
  const name = String(body.name || '').trim().slice(0, 40) || 'Webhook';
  const channel = await db.prepare('SELECT id, type FROM signals WHERE id = ? AND space_id = ?').get(String(body.channelId || ''), spaceId);
  if (!channel || !isTextChannel(channel.type)) { send(res, 400, { message: 'Elige un canal de texto del espacio.' }); return true; }
  const count = await db.prepare('SELECT COUNT(*) AS n FROM webhooks WHERE space_id = ?').get(spaceId);
  if (Number(count?.n || 0) >= MAX_PER_SPACE) { send(res, 400, { message: `Máximo ${MAX_PER_SPACE} webhooks por espacio.` }); return true; }
  const id = `wh_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();
  const avatar = hostedImageUrl(body.avatar);
  // Messages need an author row: the webhook gets its own (login-less) user.
  await db.prepare('INSERT INTO users (id, username, display_name, email, avatar, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, `webhook_${id.slice(3, 11)}`, name, `${id}@webhooks.kova.invalid`, avatar, '!', now);
  await db.prepare('INSERT INTO webhooks (id, space_id, signal_id, name, avatar, token, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, spaceId, channel.id, name, avatar, crypto.randomBytes(24).toString('base64url'), session.user_id, now);
  send(res, 201, hookOut(await db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id), baseUrl, true));
  return true;
}
