import React from 'react';
import { KovaLanding } from './KovaLanding';

interface LandingPageProps {
  onEnterApp: (mode?: 'login' | 'register') => void;
  inviteCode?: string | null;
}

/**
 * Public landing entry. The cinematic journey lives in components/landing/.
 * Routing, invitation handling and entry points stay exactly as before.
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, inviteCode }) => (
  <KovaLanding onEnterApp={onEnterApp} inviteCode={inviteCode} />
);
