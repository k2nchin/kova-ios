# Contrato inicial de Kova API

## Respuestas

Todas las respuestas de error siguen `{ "message": string, "code"?: string }`.

## Rutas principales

| Método | Ruta | Requiere sesión | Resultado |
|---|---|---:|---|
| POST | `/auth/register` | No | `{ user, token }` |
| POST | `/auth/login` | No | `{ user, token }` |
| GET | `/auth/me` | Sí | `user` |
| GET | `/servers` | Sí | `Server[]` |
| POST | `/servers` | Sí | `Server` |
| POST | `/servers/:id/join` | Sí | `ServerMember` |
| POST | `/channels` | Sí | `Channel` |
| GET | `/channels/:id/messages?limit=50` | Sí | `Message[]` |
| POST | `/channels/:id/messages` | Sí | `Message` |
| POST | `/messages/:id/reactions` | Sí | `Message` |

## Eventos en tiempo real

- `message:created`
- `message:updated`
- `message:deleted`
- `presence:changed`
- `channel:typing`
- `voice:participants`

Cada evento debe incluir `spaceId` y `channelId` cuando corresponda.
