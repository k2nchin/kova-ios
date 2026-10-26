// Desktop only: notices which known game is running and sets "Jugando a …".
import { invoke } from '@tauri-apps/api/core';
import { api } from './apiClient';
import type { UserActivity } from '../types';

const GAMES: Record<string, string> = {
  'valorant-win64-shipping.exe': 'Valorant',
  'league of legends.exe': 'League of Legends',
  'fortniteclient-win64-shipping.exe': 'Fortnite',
  'cs2.exe': 'Counter-Strike 2',
  'javaw.exe': 'Minecraft',
  'minecraft.windows.exe': 'Minecraft',
  'robloxplayerbeta.exe': 'Roblox',
  'gta5.exe': 'Grand Theft Auto V',
  'gta5_enhanced.exe': 'Grand Theft Auto V',
  'rocketleague.exe': 'Rocket League',
  'r5apex.exe': 'Apex Legends',
  'r5apex_dx12.exe': 'Apex Legends',
  'overwatch.exe': 'Overwatch 2',
  'dota2.exe': 'Dota 2',
  'cod.exe': 'Call of Duty',
  'eafc25.exe': 'EA SPORTS FC 25',
  'fc25.exe': 'EA SPORTS FC 25',
  'fc26.exe': 'EA SPORTS FC 26',
  'genshinimpact.exe': 'Genshin Impact',
  'zenlesszonezero.exe': 'Zenless Zone Zero',
  'starrail.exe': 'Honkai: Star Rail',
  'eldenring.exe': 'Elden Ring',
  'rustclient.exe': 'Rust',
  'pubg.exe': 'PUBG',
  'tslgame.exe': 'PUBG',
  'amongus.exe': 'Among Us',
  'terraria.exe': 'Terraria',
  'stardew valley.exe': 'Stardew Valley',
  'marvel-win64-shipping.exe': 'Marvel Rivals',
  'deadlock.exe': 'Deadlock',
  'helldivers2.exe': 'Helldivers 2',
  'cyberpunk2077.exe': 'Cyberpunk 2077',
  'bg3.exe': "Baldur's Gate 3",
  'spotify.exe': '',
};

const isDesktop = () => typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

/** Polls every minute; only touches the status it set itself, never a manual one. */
export function startGameDetection(onChange: (activity: UserActivity | null) => void, getCurrent: () => UserActivity | null) {
  if (!isDesktop()) return () => undefined;
  let autoName: string | null = null;
  let stopped = false;
  const tick = async () => {
    try {
      const running = await invoke<string[]>('running_processes');
      const game = running.map((name) => GAMES[name]).find(Boolean) || null;
      const current = getCurrent();
      const manual = current && current.name !== autoName;
      if (game && !manual) {
        // Re-sent each minute so the status doesn't expire while you play.
        const { activity } = await api.setMyActivity({ kind: 'playing', name: game });
        autoName = game;
        onChange(activity);
      } else if (!game && autoName && current?.name === autoName) {
        await api.setMyActivity({ clear: true });
        autoName = null;
        onChange(null);
      }
    } catch {
      // Detection is a nicety: ignore failures.
    }
  };
  void tick();
  const timer = window.setInterval(() => { if (!stopped) void tick(); }, 60_000);
  return () => { stopped = true; window.clearInterval(timer); };
}
