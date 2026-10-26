// Message translation with Kova IA, in batches and cached per (message, language):
// a message already translated to a language never costs another AI call.

export const translateSchema = `CREATE TABLE IF NOT EXISTS message_translations (message_id TEXT NOT NULL, lang TEXT NOT NULL, text TEXT NOT NULL, same INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, PRIMARY KEY(message_id, lang));`;

export const LANGUAGES = {
  es: 'español', en: 'inglés', pt: 'portugués', fr: 'francés', de: 'alemán', it: 'italiano',
  ja: 'japonés', ko: 'coreano', zh: 'chino', ru: 'ruso', ar: 'árabe', hi: 'hindi', tr: 'turco', pl: 'polaco', nl: 'neerlandés',
};

/** Reads a JSON array out of a model answer (it may wrap it in ``` fences). */
const parseJsonArray = (text) => {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
};

/**
 *   POST /api/translate  { lang, messageIds: string[] (≤ 20) }
 *   → { [messageId]: { text, same } }   `same` = it was already in that language
 */
export async function handleTranslateRoutes({ db, req, res, requestPath, session, send, readBody, canAccessSpace, askKovaAI, AiError }) {
  if (requestPath !== '/api/translate') return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const body = await readBody(req);
  const lang = String(body.lang || '').toLowerCase();
  if (!LANGUAGES[lang]) { send(res, 400, { message: 'Idioma no disponible.' }); return true; }
  const ids = [...new Set((Array.isArray(body.messageIds) ? body.messageIds : []).map(String))].slice(0, 20);
  if (!ids.length) { send(res, 400, { message: 'No hay mensajes para traducir.' }); return true; }

  // Only messages from spaces you belong to.
  const placeholders = ids.map(() => '?').join(',');
  const rows = await db.prepare(`SELECT m.id, m.content, s.space_id FROM messages m JOIN signals s ON s.id = m.signal_id WHERE m.id IN (${placeholders})`).all(...ids);
  const allowed = [];
  const spaceAccess = new Map();
  for (const row of rows) {
    if (!spaceAccess.has(row.space_id)) spaceAccess.set(row.space_id, await canAccessSpace(row.space_id, session.user_id));
    if (spaceAccess.get(row.space_id) && String(row.content || '').trim()) allowed.push(row);
  }

  const result = {};
  const cached = allowed.length ? await db.prepare(`SELECT message_id, text, same FROM message_translations WHERE lang = ? AND message_id IN (${allowed.map(() => '?').join(',')})`).all(lang, ...allowed.map((row) => row.id)) : [];
  for (const row of cached) result[row.message_id] = { text: row.text, same: Boolean(Number(row.same)) };
  const missing = allowed.filter((row) => !result[row.id]);

  if (missing.length) {
    const items = missing.map((row) => ({ id: row.id, text: String(row.content).slice(0, 1500) }));
    const prompt = `Traduce cada texto al ${LANGUAGES[lang]}. Mantén el tono, los emojis, las menciones (@nombre), los enlaces y el formato Markdown. No traduzcas nombres propios ni código.
Si un texto YA está en ${LANGUAGES[lang]}, devuélvelo igual con "same": true.
Responde SOLO con un array JSON: [{"id": "...", "text": "...", "same": false}, ...] con los mismos ids.

${JSON.stringify(items)}`;
    let answer;
    try {
      answer = (await askKovaAI(session.user_id, { prompt })).text;
    } catch (error) {
      if (error instanceof AiError) { send(res, error.status, { message: error.message, code: error.code }); return true; }
      throw error;
    }
    const parsed = parseJsonArray(answer) || [];
    const now = new Date().toISOString();
    for (const item of parsed) {
      const source = missing.find((row) => row.id === String(item?.id));
      if (!source || typeof item.text !== 'string') continue;
      const same = Boolean(item.same) || item.text.trim() === String(source.content).trim();
      result[source.id] = { text: item.text, same };
      await db.prepare('INSERT INTO message_translations (message_id, lang, text, same, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (message_id, lang) DO NOTHING')
        .run(source.id, lang, item.text.slice(0, 6000), same ? 1 : 0, now);
    }
  }
  send(res, 200, result);
  return true;
}
