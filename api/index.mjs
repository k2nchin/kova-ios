// Single entry point for the whole API on Vercel: vercel.json rewrites every
// /api/* request here, and the server routes by the original path.
export { handler as default } from '../server/index.mjs';
