# Desplegar la API de Kova como proceso continuo

En Vercel la API funciona, pero sin tiempo real (el cliente consulta cada pocos
segundos). Para mensajes, presencia y "escribiendo…" en vivo, la API tiene que
correr como proceso continuo. La carpeta `server/` trae un `Dockerfile` que sirve
en cualquier plataforma que construya contenedores.

## 1. Crear el servicio

**Railway**
1. *New Project → Deploy from GitHub repo* y elige este repositorio.
2. En *Settings → Source*, pon **Root Directory** = `server`. Railway detecta el `Dockerfile`.
3. En *Settings → Networking*, genera un dominio público.

**Render**
1. *New → Web Service* con este repositorio.
2. **Root Directory** = `server`, **Runtime** = Docker.
3. **Health Check Path** = `/api/health`.

**Fly.io**
```bash
cd server
fly launch --no-deploy
fly deploy
```

La plataforma inyecta `PORT`; la API lo usa automáticamente.

## 2. Variables de entorno

| Variable | Obligatoria | Valor |
| :--- | :--- | :--- |
| `DATABASE_URL` | Sí | La misma URL de PostgreSQL que usa Vercel, para que ambos compartan datos. |
| `KOVA_ENCRYPTION_KEY` | Sí | La misma cadena larga y aleatoria que en Vercel. Si difieren, el 2FA falla. |
| `KOVA_SOCKET_ORIGINS` | Recomendada | Orígenes permitidos para el socket, separados por comas. Ej.: `https://kova-k2nchin.vercel.app,tauri://localhost,http://tauri.localhost` |
| `GEMINI_API_KEY` | Para Kova IA | Clave de Google AI Studio. |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Para la voz | Credenciales de LiveKit Cloud. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Para archivos | Proyecto de Supabase con el bucket público `kova-uploads`. |

Sin `SUPABASE_*`, los archivos se guardan en el disco del contenedor y **se pierden
en cada despliegue**. En producción usa Supabase.

## 3. Conectar la app

En Vercel (proyecto de la web) y en el `.env` del build de escritorio:

```
VITE_KOVA_SOCKET_URL=https://tu-api.up.railway.app
```

Opcionalmente, para que toda la API vaya al nuevo servicio:

```
VITE_KOVA_API_URL=https://tu-api.up.railway.app/api
```

Vuelve a desplegar la web (las variables `VITE_*` se leen al compilar).

## 4. Comprobar

```bash
curl https://tu-api.up.railway.app/api/health
```

Debe responder `{"ok":true,...}`. Al abrir Kova con sesión iniciada, en las
herramientas del navegador verás una conexión WebSocket a `/socket.io/`.
