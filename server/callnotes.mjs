// Call notes: people who opt in send short clips of THEIR OWN microphone; Kova IA
// transcribes them (the audio is not stored) and can summarise the call.

export const callNotesSchema = `CREATE TABLE IF NOT EXISTS call_transcripts (id TEXT PRIMARY KEY, signal_id TEXT NOT NULL, user_id TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL);`;

const CALL_WINDOW_MS = 4 * 60 * 60 * 1000;

/**
 *   POST /api/voice/:id/notes        { active }            tell the room you started/stopped notes
 *   POST /api/voice/:id/transcribe   { audio, mimeType }   transcribe a clip of your own voice
 *   POST /api/voice/:id/summary      { since? }            summary posted to the room chat
 */
export async function handleCallNotesRoutes({ db, req, res, requestPath, session, send, readBody, canAccessSpace, transcribeAudio, askKovaAI, AiError, deliverMessage, spaceAudience, emitToUsers, crypto }) {
  const match = requestPath.match(/^\/api\/voice\/([^/]+)\/(notes|transcribe|summary)$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const channelId = decodeURIComponent(match[1]);
  const action = match[2];
  const channel = await db.prepare('SELECT id, space_id, type, name FROM signals WHERE id = ?').get(channelId);
  if (!channel || (channel.type !== 'voice' && channel.type !== 'stage') || !await canAccessSpace(channel.space_id, session.user_id)) { send(res, 404, { message: 'No encontramos esa sala de voz.' }); return true; }
  const body = await readBody(req);
  const aiFail = (error) => {
    if (error instanceof AiError) { send(res, error.status, { message: error.message, code: error.code }); return true; }
    throw error;
  };

  if (action === 'notes') {
    const audience = await spaceAudience(db, channel.space_id);
    await emitToUsers(audience, 'voice:notes', { channelId, userId: session.user_id, active: Boolean(body.active) });
    send(res, 200, { ok: true });
    return true;
  }

  if (action === 'transcribe') {
    let text;
    try { text = await transcribeAudio(session.user_id, { audio: body.audio, mimeType: body.mimeType }); } catch (error) { return aiFail(error); }
    if (text) {
      await db.prepare('INSERT INTO call_transcripts (id, signal_id, user_id, text, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(`tr_${crypto.randomUUID()}`, channelId, session.user_id, text.slice(0, 8000), new Date().toISOString());
    }
    send(res, 200, { text });
    return true;
  }

  // summary
  const since = Date.parse(String(body.since || '')) || Date.now() - CALL_WINDOW_MS;
  const rows = await db.prepare('SELECT t.text, t.created_at, u.display_name, u.username FROM call_transcripts t JOIN users u ON u.id = t.user_id WHERE t.signal_id = ? AND t.created_at >= ? ORDER BY t.created_at')
    .all(channelId, new Date(Math.max(since, Date.now() - CALL_WINDOW_MS)).toISOString());
  if (!rows.length) { send(res, 400, { message: 'Todavía no hay nada transcrito. Activa "Notas de la llamada" y habla un rato.' }); return true; }
  let transcript = rows.map((row) => `${row.display_name || row.username}: ${row.text}`).join('\n');
  if (transcript.length > 10_000) transcript = transcript.slice(-10_000);
  const prompt = `Resume esta llamada de voz de la sala "${channel.name}" en español, en Markdown y breve:
**En resumen:** una o dos frases.
**Temas:** viñetas.
**Decisiones:** viñetas (omite si no hubo).
**Tareas:** viñetas con quién hace qué (omite si no hubo).
Solo participaron con transcripción quienes activaron las notas; no inventes nada.

<transcripcion>
${transcript}
</transcripcion>`;
  let summary;
  try { summary = (await askKovaAI(session.user_id, { prompt })).text; } catch (error) { return aiFail(error); }
  const speakers = [...new Set(rows.map((row) => row.display_name || row.username))];
  const message = await deliverMessage({
    channelId,
    spaceId: channel.space_id,
    authorId: session.user_id,
    content: `📝 **Resumen de la llamada** (Kova IA · notas de ${speakers.join(', ')})\n\n${summary}`.slice(0, 9500),
  });
  send(res, 200, { summary, messageId: message.id, lines: rows.length });
  return true;
}
