# Kova · Cliente móvil (Android & iOS)

Guía de configuración y estado de la app móvil construida con Tauri v2.

## Estado actual

- **Android**: proyecto nativo generado en `src-tauri/gen/android` (gitignored). Se
  compila con `npm run mobile:android:build`. El APK/AAB se genera en
  `src-tauri/gen/android/app/build/outputs/`.
- **iOS**: requiere macOS + Xcode. El scaffolding se genera con `tauri ios init`
  (solo macOS) y no puede ejecutarse en Windows/CI de Linux.

## Permisos nativos (Android)

Añadidos en `src-tauri/gen/android/app/src/main/AndroidManifest.xml`:

- `INTERNET`
- `RECORD_AUDIO` (voz / WebRTC)
- `MODIFY_AUDIO_SETTINGS`
- `POST_NOTIFICATIONS` (Android 13+)
- `CAMERA` (videollamada / compartir)

> `src-tauri/gen/` está ignorado por git (`$SRC/src-tauri/gen/`). Tras un
> `git clone` limpio hay que volver a ejecutar `npx tauri android init` y
> re-aplicar estos permisos. La de micrófono/notificaciones se solicita en
> tiempo de ejecución desde `src/services/notificationService.ts` y el WebView.

## Safe areas y edge-to-edge

- `index.html` usa `viewport-fit=cover`.
- `MainActivity.kt` habilita `enableEdgeToEdge()`.
- `src/index.css` aplica `env(safe-area-inset-*)` a la titlebar y a la barra
  inferior (`kova-mobile-tabbar`).

## Navegación móvil

- `src/hooks/useIsMobile.ts` detecta viewports < 768px.
- `src/components/Shell/MobileTabBar.tsx` aporta la barra inferior (Inicio,
  Mensajes, Miembros, Buscar, Ajustes).
- `src/components/Workspace/WorkspaceContainer.tsx` colapsa el panel lateral en
  modo drawer sobre pantallas estrechas.

## Inicializar iOS (requiere macOS)

```bash
# En un Mac con Xcode instalado
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
npx tauri ios init
npm run mobile:ios:dev
```

- `developmentTeam` se define en `tauri.conf.json > bundle > iOS` o vía la
  variable `APPLE_DEVELOPMENT_TEAM`.
- El esquema `kova://auth` (deep-link OAuth) se configura en
  `tauri.conf.json > plugins > deep-link`; en iOS debe quedar asociado al
  bundle identifier definido en `identifier`.

## Deep link / OAuth móvil

- `tauri.conf.json > plugins > deep-link > mobile` registra el host `auth`.
- Para OAuth real se debe registrar el redirect URI `kova://auth` como URI
  autorizada en Google Cloud Console y en los `CFBundleURLTypes` de iOS.