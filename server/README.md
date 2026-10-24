# Kova API

The API is served by the Vercel functions in `api/` and implemented in `server/index.mjs`.
Local development uses SQLite in `server/data/kova.sqlite`; never commit that database.
Vercel requires `DATABASE_URL` and deliberately refuses to start without it rather than
silently placing production account data in ephemeral `/tmp` storage.

## Production configuration

Set these values in the Vercel project settings for Production, Preview, and Development
as appropriate:

- `DATABASE_URL`: PostgreSQL connection string (for example, the Supabase pooler URI).
- `DATABASE_SSL`: optional; leave unset to require TLS, set to `false` only for a trusted local database.
- `PUBLIC_APP_URL`: optional public base URL used to build server-invite links.
- `VITE_KOVA_API_URL`: optional API base for desktop/mobile builds; the production site is the default.
- `VITE_KOVA_SOCKET_URL`: optional external Socket.IO gateway. Without it, the client uses REST polling.

Keep credentials in Vercel environment settings or a local ignored `.env.local`; never
put them in source code, `vercel.json`, screenshots, or a committed `.env` file.

## Database setup

Run `npm run db:migrate` from this directory after defining `DATABASE_URL`. The API
also creates/migrates its tables at startup, so keep the migration in sync with
`server/index.mjs` when changing the schema.

## Current service boundary

The API persists accounts, sessions, spaces, categories, channels, server invites,
channel messages/reactions, friend requests, friendships, blocks, reports, and direct
messages. Voice media still requires a separately hosted WebRTC/SFU service and its
credentials; a browser microphone preview alone is not a call between users.
