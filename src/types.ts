export interface GemFile {
    uri: string;
    name: string;
    mimeType: string;
}

export interface Gem {
    id: string;
    name: string;
    instructions: string;
    files: GemFile[];
}

export type SocialPlatform = 'twitter' | 'facebook';

export interface SocialAccount {
    id: string;
    platform: SocialPlatform;
    name: string;

    phoneNumberId?: never;
    recipientId?: never;
    // Twitter specific (placeholder for now, could be API keys override)
    // apiKey?: string;
}

export interface ScheduledJob {
    id: string;
    gemId: string;
    type: 'interval' | 'daily';
    intervalMinutes?: number;
    dailyTimes?: string[]; // Format "HH:mm", supports multiple
    dailyTime?: string; // Legacy support
    timezone?: string; // Default "America/New_York"
    lastRun?: number;
    active: boolean;
}
