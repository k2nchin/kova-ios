// Activities inside a voice room: games everyone in the call sees live.
// The server holds the game (so nobody can cheat by editing their client) and
// broadcasts each change. Trivia answers are only revealed when the round ends.

export const activitiesSchema = `CREATE TABLE IF NOT EXISTS voice_activities (signal_id TEXT PRIMARY KEY, kind TEXT NOT NULL, state TEXT NOT NULL, host_id TEXT NOT NULL, updated_at TEXT NOT NULL);`;

const TRIVIA = [
  { q: '¿Cuál es el planeta más grande del sistema solar?', o: ['Saturno', 'Júpiter', 'Neptuno', 'La Tierra'], a: 1 },
  { q: '¿En qué año llegó el ser humano a la Luna?', o: ['1965', '1969', '1972', '1975'], a: 1 },
  { q: '¿Qué videojuego popularizó la frase «The cake is a lie»?', o: ['Half-Life', 'Portal', 'Minecraft', 'Halo'], a: 1 },
  { q: '¿Cuántos jugadores tiene un equipo de fútbol en el campo?', o: ['9', '10', '11', '12'], a: 2 },
  { q: '¿Qué lenguaje se ejecuta de forma nativa en los navegadores?', o: ['Python', 'JavaScript', 'Java', 'C#'], a: 1 },
  { q: '¿Cuál es el océano más grande?', o: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'], a: 3 },
  { q: '¿Qué personaje es el protagonista de The Legend of Zelda?', o: ['Zelda', 'Link', 'Ganon', 'Epona'], a: 1 },
  { q: '¿Cuál es el elemento químico con símbolo O?', o: ['Oro', 'Osmio', 'Oxígeno', 'Oganesón'], a: 2 },
  { q: '¿Cuántos lados tiene un hexágono?', o: ['5', '6', '7', '8'], a: 1 },
  { q: '¿Quién pintó «La noche estrellada»?', o: ['Picasso', 'Dalí', 'Van Gogh', 'Monet'], a: 2 },
  { q: '¿Qué país ganó el Mundial de fútbol de 2010?', o: ['Alemania', 'España', 'Países Bajos', 'Brasil'], a: 1 },
  { q: '¿Cuál es la capital de Japón?', o: ['Osaka', 'Kioto', 'Tokio', 'Hiroshima'], a: 2 },
  { q: '¿En qué juego se construye con bloques y se lucha contra creepers?', o: ['Terraria', 'Roblox', 'Minecraft', 'Fortnite'], a: 2 },
  { q: '¿Qué instrumento tiene 88 teclas?', o: ['Órgano', 'Piano', 'Acordeón', 'Sintetizador'], a: 1 },
  { q: '¿Cuál es el animal terrestre más rápido?', o: ['León', 'Guepardo', 'Caballo', 'Antílope'], a: 1 },
  { q: '¿Cuántos bits tiene un byte?', o: ['4', '8', '16', '32'], a: 1 },
  { q: '¿Qué gas absorben las plantas para la fotosíntesis?', o: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Helio'], a: 2 },
  { q: '¿Qué saga tiene a Master Chief como protagonista?', o: ['Halo', 'Destiny', 'Gears of War', 'Doom'], a: 0 },
  { q: '¿Cuál es el río más largo del mundo (según la mayoría de fuentes)?', o: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi'], a: 1 },
  { q: '¿Cuántos minutos tiene un día?', o: ['1240', '1440', '1640', '1000'], a: 1 },
];
const TRIVIA_ROUNDS = 5;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

const shuffle = (list) => { const copy = [...list]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };

/** What clients may see: the correct trivia answer stays hidden until the reveal. */
function publicState(row) {
  if (!row) return null;
  const state = JSON.parse(row.state);
  const base = { kind: row.kind, hostId: row.host_id, updatedAt: row.updated_at };
  if (row.kind === 'tictactoe') return { ...base, ...state };
  const question = TRIVIA[state.order[state.round]];
  return {
    ...base,
    round: state.round,
    rounds: state.order.length,
    phase: state.phase,
    question: question ? { text: question.q, options: question.o } : null,
    correct: state.phase !== 'question' && question ? question.a : undefined,
    answered: Object.keys(state.answers),
    answers: state.phase !== 'question' ? state.answers : undefined,
    scores: state.scores,
    names: state.names,
  };
}

const winnerOf = (board) => {
  for (const [a, b, c] of LINES) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? 'draw' : null;
};

/**
 *   GET  /api/voice/:id/activity
 *   POST /api/voice/:id/activity   { action: 'start', kind: 'tictactoe' | 'trivia' } | { action: 'stop' }
 *        tictactoe: { action: 'join' } | { action: 'move', cell } | { action: 'rematch' }
 *        trivia:    { action: 'answer', option } | { action: 'reveal' } | { action: 'next' }   (reveal/next: host)
 */
export async function handleActivityRoutes({ db, req, res, requestPath, session, send, readBody, canAccessSpace, spaceAudience, emitToUsers }) {
  const match = requestPath.match(/^\/api\/voice\/([^/]+)\/activity$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const channel = await db.prepare('SELECT id, space_id, type FROM signals WHERE id = ?').get(decodeURIComponent(match[1]));
  if (!channel || !['voice', 'stage'].includes(channel.type) || !await canAccessSpace(channel.space_id, session.user_id)) { send(res, 404, { message: 'No encontramos esa sala de voz.' }); return true; }
  const load = () => db.prepare('SELECT * FROM voice_activities WHERE signal_id = ?').get(channel.id);
  if (req.method === 'GET') { send(res, 200, publicState(await load())); return true; }
  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }

  const body = await readBody(req);
  const me = session.user_id;
  const user = await db.prepare('SELECT display_name, username FROM users WHERE id = ?').get(me);
  const myName = user?.display_name || user?.username || 'Alguien';
  const row = await load();
  const fail = (message) => { send(res, 400, { message }); return true; };
  let next = null; // { kind, state, host }

  if (body.action === 'start') {
    if (body.kind === 'tictactoe') next = { kind: 'tictactoe', host: me, state: { players: [me, null], names: { [me]: myName }, board: Array(9).fill(null), turn: 0, winner: null } };
    else if (body.kind === 'trivia') next = { kind: 'trivia', host: me, state: { order: shuffle(TRIVIA.map((_, i) => i)).slice(0, TRIVIA_ROUNDS), round: 0, phase: 'question', answers: {}, scores: {}, names: { [me]: myName } } };
    else return fail('Actividad desconocida.');
  } else if (body.action === 'stop') {
    if (row && row.host_id !== me) return fail('Solo quien empezó la actividad puede terminarla.');
    await db.prepare('DELETE FROM voice_activities WHERE signal_id = ?').run(channel.id);
    await emitToUsers(await spaceAudience(db, channel.space_id), 'voice:activity', { channelId: channel.id, activity: null });
    send(res, 200, null);
    return true;
  } else {
    if (!row) return fail('No hay ninguna actividad en marcha.');
    const state = JSON.parse(row.state);
    next = { kind: row.kind, host: row.host_id, state };
    if (row.kind === 'tictactoe') {
      if (body.action === 'join') {
        if (state.players[1]) return fail('La partida ya tiene dos jugadores.');
        if (state.players[0] === me) return fail('Ya estás jugando.');
        state.players[1] = me;
        state.names[me] = myName;
      } else if (body.action === 'move') {
        const cell = Number(body.cell);
        if (!state.players[1]) return fail('Falta un rival: que alguien se una.');
        if (state.winner) return fail('La partida ya terminó.');
        if (state.players[state.turn] !== me) return fail('No es tu turno.');
        if (!Number.isInteger(cell) || cell < 0 || cell > 8 || state.board[cell]) return fail('Casilla no válida.');
        state.board[cell] = state.turn === 0 ? 'X' : 'O';
        state.winner = winnerOf(state.board);
        state.turn = 1 - state.turn;
      } else if (body.action === 'rematch') {
        if (!state.players.includes(me)) return fail('Solo los jugadores pueden pedir la revancha.');
        state.players = [state.players[1], state.players[0]]; // the other one starts
        state.board = Array(9).fill(null);
        state.turn = 0;
        state.winner = null;
      } else return fail('Acción no válida.');
    } else {
      const question = TRIVIA[state.order[state.round]];
      if (body.action === 'answer') {
        if (state.phase !== 'question') return fail('Espera a la siguiente pregunta.');
        const option = Number(body.option);
        if (!Number.isInteger(option) || option < 0 || option >= question.o.length) return fail('Respuesta no válida.');
        if (state.answers[me] !== undefined) return fail('Ya respondiste.');
        state.answers[me] = option;
        state.names[me] = myName;
      } else if (body.action === 'reveal' || body.action === 'next') {
        if (row.host_id !== me) return fail('Solo quien presenta la trivia controla las rondas.');
        if (body.action === 'reveal' && state.phase === 'question') {
          state.phase = 'reveal';
          for (const [userId, option] of Object.entries(state.answers)) if (option === question.a) state.scores[userId] = (state.scores[userId] || 0) + 100;
        } else if (body.action === 'next' && state.phase === 'reveal') {
          if (state.round + 1 >= state.order.length) state.phase = 'done';
          else { state.round += 1; state.phase = 'question'; state.answers = {}; }
        } else return fail('Ahora no se puede hacer eso.');
      } else return fail('Acción no válida.');
    }
  }

  const now = new Date().toISOString();
  await db.prepare('DELETE FROM voice_activities WHERE signal_id = ?').run(channel.id);
  await db.prepare('INSERT INTO voice_activities (signal_id, kind, state, host_id, updated_at) VALUES (?, ?, ?, ?, ?)').run(channel.id, next.kind, JSON.stringify(next.state), next.host, now);
  const activity = publicState(await load());
  await emitToUsers(await spaceAudience(db, channel.space_id), 'voice:activity', { channelId: channel.id, activity });
  send(res, 200, activity);
  return true;
}
