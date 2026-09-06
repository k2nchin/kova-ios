// Real Google OAuth 2.0 Client via Google Identity Services

export interface RealGoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export const DEFAULT_GOOGLE_CLIENT_ID =
  '928120465715-jg874jkh71jc5tu0qt8cqtaduhe4d8e1.apps.googleusercontent.com';

const STORAGE_KEY = 'kova.google_client_id';

export function getStoredGoogleClientId(): string {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage) return fromStorage.trim();
  } catch {}
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim();
}

export function saveGoogleClientId(clientId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, clientId.trim());
  } catch {}
}

export async function openExternalUrl(url: string): Promise<void> {
  try {
    const tauri = (window as unknown as { __TAURI__?: { core?: { invoke?: (cmd: string, args: Record<string, unknown>) => Promise<unknown> } } }).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke('open_external_url', { url });
      return;
    }
  } catch {}
  window.open(url, '_blank');
}


export function openRealGoogleSignIn(
  clientId: string,
  onSuccess: (user: RealGoogleUser) => void,
  onError: (err: string) => void
): void {
  const targetClientId = clientId || DEFAULT_GOOGLE_CLIENT_ID;
  const google = (window as unknown as { google?: any }).google;

  if (!google?.accounts?.oauth2) {
    // Direct OAuth popup fallback
    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      targetClientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent(
      'email profile openid'
    )}&prompt=select_account`;

    const width = 500;
    const height = 620;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const win = window.open(authUrl, 'GoogleSignIn', `width=${width},height=${height},left=${left},top=${top}`);
    if (!win || win.closed || typeof win.closed === 'undefined') {
      onError('El navegador bloqueó la ventana emergente de Google. Por favor permite las ventanas emergentes (popups).');
    }
    return;
  }

  try {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: targetClientId,
      scope: 'email profile openid',
      prompt: 'select_account',
      callback: async (response: { access_token?: string; error?: string }) => {
        if (response.error) {
          const errStr = String(response.error);
          if (errStr.includes('origin') || errStr.includes('client') || errStr.includes('unregistered')) {
            onError(
              'Origen no registrado en Google. Añade "http://localhost:1420" en Google Cloud Console > Credenciales > Orígenes autorizados.'
            );
          } else {
            onError(response.error);
          }
          return;
        }
        if (!response.access_token) {
          onError('No se recibió el token de acceso de Google.');
          return;
        }

        try {
          // Fetch real user info from Google's UserInfo endpoint
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });

          if (!res.ok) {
            throw new Error(`Google API error (${res.status})`);
          }

          const info = await res.json();
          const user: RealGoogleUser = {
            id: info.sub || `google_${Date.now()}`,
            name: info.name || info.given_name || 'Usuario de Google',
            email: info.email,
            picture: info.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          };
          onSuccess(user);
        } catch (fetchErr: unknown) {
          onError((fetchErr as Error).message || 'Error al obtener los datos de la cuenta de Google');
        }
      },
    });

    // Triggers the official Google OAuth popup window!
    tokenClient.requestAccessToken();
  } catch (err: unknown) {
    onError((err as Error).message || 'Error al iniciar Google OAuth');
  }
}
