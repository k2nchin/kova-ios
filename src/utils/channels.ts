import type { ChannelType } from '../types';

/** Voice rooms and stage channels both run as a live call. */
export const isVoiceLike = (type?: ChannelType | string) => type === 'voice' || type === 'stage';
