# Kova · preparación para producción

## Estado actual

- Cliente web y escritorio: React 19 + TypeScript + Vite + Tauri 2.
- API cliente preparada en `src/services/apiClient.ts`.
- Socket en tiempo real preparado en `src/services/socketClient.ts`.
- La interfaz inicia sin datos de demostración para cuentas nuevas.
- La identidad visual oficial es monocromática: negro, grafito, plata y blanco.

## Orden de implementación recomendado

1. **API y base de datos**: usuarios, espacios, señales, mensajes, roles e invitaciones.
2. **Autenticación**: sesiones httpOnly, OAuth, recuperación de cuenta y verificación de correo.
3. **Tiempo real**: eventos de mensajes, presencia, typing, notificaciones y reconexión.
4. **Voz**: servidor WebRTC/mediasoup o LiveKit, tokens temporales y control de permisos.
5. **Archivos**: almacenamiento S3-compatible para avatares, banners y adjuntos.
6. **Moderación y seguridad**: rate limits, permisos, reportes, auditoría y bloqueo.
7. **Web oficial**: landing, documentación, legal, SEO, analítica y dominio.
8. **Calidad**: pruebas de flujos críticos en Chrome, WebView2, Android y resoluciones móviles.

## Variables necesarias para producción

```env
VITE_KOVA_API_URL=https://api.tudominio.com/api
VITE_KOVA_SOCKET_URL=https://api.tudominio.com
VITE_GOOGLE_CLIENT_ID=...
VITE_ALLOW_OFFLINE_AUTH=false
```

Las claves de base de datos, OAuth privado, firma de sesiones, almacenamiento y proveedor de voz deben existir únicamente en el backend.

## Criterio para publicar la beta

La beta estará lista cuando un usuario nuevo pueda registrarse, crear su primer espacio, crear señales, invitar a otra persona, conversar y entrar a voz sin depender de datos locales.
