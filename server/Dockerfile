# Kova API as a long-lived process (Railway, Render, Fly…): REST + Socket.IO realtime.
# Build from this folder:  docker build -t kova-api server
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY *.mjs ./

# Only used without DATABASE_URL (SQLite) or without Supabase (local uploads).
# Mount a volume here if you rely on either; production should use Postgres + Supabase.
ENV KOVA_DATA_DIR=/app/data
RUN mkdir -p /app/data && chown node:node /app/data

# Run as the unprivileged user that ships with the image.
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/api/health" || exit 1
CMD ["node", "index.mjs"]
