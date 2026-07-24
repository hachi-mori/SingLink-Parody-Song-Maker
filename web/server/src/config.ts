import path from 'node:path';
import { isLoopbackHost, normalizeLocalVoicevoxBaseUrl, parseAllowedLocalOrigins } from './security';

export type ServerConfig = {
  host: string;
  port: number;
  voicevoxBaseUrl: string;
  localBook: {
    enabled: boolean;
    dataRoot?: string;
    allowedOrigins: string[];
  };
};

export function getConfig(): ServerConfig {
  const host = process.env.SINGLINK_HOST ?? '127.0.0.1';
  const localBookRequested = process.env.SINGLINK_ENABLE_LOCAL_BOOK_DATA === '1';
  const configuredDataRoot = process.env.SINGLINK_LOCAL_BOOK_DATA_ROOT;
  const dataRoot = configuredDataRoot && path.isAbsolute(configuredDataRoot)
    ? path.resolve(configuredDataRoot)
    : undefined;
  const voicevoxBaseUrl = normalizeLocalVoicevoxBaseUrl(
    process.env.VOICEVOX_BASE_URL ?? 'http://localhost:50021'
  );

  if (!voicevoxBaseUrl) {
    throw new Error('VOICEVOX_BASE_URL must be a loopback http://localhost:50021 URL');
  }
  if (localBookRequested && !isLoopbackHost(host)) {
    throw new Error('SINGLINK_HOST must be a loopback host when local book data is enabled');
  }

  return {
    host,
    port: Number.parseInt(process.env.SINGLINK_PORT ?? '5174', 10),
    voicevoxBaseUrl,
    localBook: {
      enabled: localBookRequested && Boolean(dataRoot),
      dataRoot,
      allowedOrigins: parseAllowedLocalOrigins(process.env.SINGLINK_CLIENT_ORIGINS)
    }
  };
}
