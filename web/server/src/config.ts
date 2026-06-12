export type ServerConfig = {
  host: string;
  port: number;
  voicevoxBaseUrl: string;
};

export function getConfig(): ServerConfig {
  return {
    host: process.env.SINGLINK_HOST ?? '127.0.0.1',
    port: Number.parseInt(process.env.SINGLINK_PORT ?? '5174', 10),
    voicevoxBaseUrl: process.env.VOICEVOX_BASE_URL ?? 'http://localhost:50021'
  };
}
