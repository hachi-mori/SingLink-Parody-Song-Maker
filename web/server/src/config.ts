import { normalizeLocalVoicevoxBaseUrl, parseAllowedLocalOrigins } from './security';

export type ServerConfig = {
  host: string;
  port: number;
  voicevoxBaseUrl: string;
  allowedOrigins: string[];
};

export function getConfig(): ServerConfig {
  const host = process.env.SINGLINK_HOST ?? '127.0.0.1';
  const voicevoxBaseUrl = normalizeLocalVoicevoxBaseUrl(
    process.env.VOICEVOX_BASE_URL ?? 'http://localhost:50021'
  );

  if (!voicevoxBaseUrl) {
    throw new Error('VOICEVOX_BASE_URL must be a loopback http://localhost:50021 URL');
  }

  return {
    host,
    port: Number.parseInt(process.env.SINGLINK_PORT ?? '5174', 10),
    voicevoxBaseUrl,
    allowedOrigins: parseAllowedLocalOrigins(process.env.SINGLINK_CLIENT_ORIGINS)
  };
}
