import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { applyParodyLyrics, buildResultDisplayLyrics, convertVVProjToScoreJSON } from '../../shared/src/vvproj';
import type { SynthesisErrorResponse, SynthesisRequest } from '../../shared/src/types';
import { getConfig } from './config';
import { assetsDir } from './paths';
import { getSongDetail, listSongs, resolveSong } from './songRepository';
import { getVoicevoxVersion, synthesizeSongScore } from './voicevox';

const config = getConfig();
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info'
  },
  bodyLimit: 1024 * 1024 * 10
});

const synthesisSchema = z.object({
  songId: z.string().min(1),
  solvedTasks: z.array(z.object({
    phrase: z.string(),
    syllables: z.array(z.string()),
    userInput: z.string(),
    userSyllables: z.array(z.string()),
    restPadding: z.boolean().optional(),
    score: z.number().optional(),
    rhymeMatchPercent: z.number().optional(),
    matchesCount: z.number().optional(),
    isCorrect: z.boolean().optional()
  })),
  fullLyrics: z.string(),
  voicevoxBaseUrl: z.string().optional()
});

const previewSchema = synthesisSchema.pick({
  songId: true,
  solvedTasks: true
});

await app.register(cors, {
  origin: true
});

await fs.mkdir(assetsDir, { recursive: true });
await app.register(fastifyStatic, {
  root: assetsDir,
  prefix: '/assets/',
  decorateReply: false
});

app.get('/api/health', async () => {
  return {
    ok: true,
    name: 'singlink-web-server',
    voicevoxBaseUrl: config.voicevoxBaseUrl
  };
});

app.get('/api/voicevox/version', async (request) => {
  const query = request.query as { baseUrl?: string };
  const baseUrl = query.baseUrl ?? config.voicevoxBaseUrl;
  try {
    const version = await getVoicevoxVersion(baseUrl);
    return {
      ok: true,
      version,
      baseUrl,
      message: `VOICEVOX: OK (${version})`
    };
  } catch (error) {
    return {
      ok: false,
      baseUrl,
      message: 'VOICEVOX に接続できませんでした。VOICEVOX を起動してから再確認してください。',
      detail: error instanceof Error ? error.message : String(error)
    };
  }
});

app.get('/api/songs', async () => {
  return listSongs();
});

app.get('/api/songs/:songId', async (request, reply) => {
  const params = request.params as { songId: string };
  const detail = await getSongDetail(params.songId);
  if (!detail) {
    return reply.code(404).send({ ok: false, message: '曲が見つかりません' });
  }
  return detail;
});

app.post('/api/parody/preview', async (request, reply) => {
  const parsed = previewSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, message: 'プレビュー入力が不正です', detail: parsed.error.message });
  }

  const resolved = await resolveSong(parsed.data.songId);
  if (!resolved) {
    return reply.code(404).send({ ok: false, message: '曲が見つかりません' });
  }

  if (resolved.info.mode === 'onomatopoeiaQuiz') {
    return { lyrics: '' };
  }

  return {
    lyrics: buildResultDisplayLyrics(resolved.vvproj, parsed.data.solvedTasks)
  };
});

app.post('/api/synthesis', async (request, reply) => {
  const parsed = synthesisSchema.safeParse(request.body);
  if (!parsed.success) {
    const body: SynthesisErrorResponse = {
      ok: false,
      message: '合成リクエストが不正です',
      detail: parsed.error.message
    };
    return reply.code(400).send(body);
  }

  const body: SynthesisRequest = parsed.data;
  const resolved = await resolveSong(body.songId);
  if (!resolved) {
    return reply.code(404).send({ ok: false, message: '曲が見つかりません' } satisfies SynthesisErrorResponse);
  }

  try {
    const modified = applyParodyLyrics(resolved.vvproj, body.solvedTasks);
    const score = convertVVProjToScoreJSON(modified, 0);
    const wav = await synthesizeSongScore(score, body.voicevoxBaseUrl ?? config.voicevoxBaseUrl, body.solvedTasks, resolved.info.title);
    const encodedTitle = encodeURIComponent(resolved.info.title);
    return reply
      .header('Content-Type', 'audio/wav')
      .header('Content-Disposition', `attachment; filename*=UTF-8''singlink_${encodedTitle}.wav`)
      .send(wav);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      ok: false,
      message: '歌声合成に失敗しました。VOICEVOX の起動状態と曲データを確認してください。',
      detail: error instanceof Error ? error.message : String(error)
    } satisfies SynthesisErrorResponse);
  }
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
