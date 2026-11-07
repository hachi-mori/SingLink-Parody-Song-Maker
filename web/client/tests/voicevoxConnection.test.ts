import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkVoicevox } from '../src/lib/api';

const baseUrl = 'http://localhost:50021';
const query = vi.fn();
const fetchVersion = vi.fn<(url: string, options?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  vi.stubGlobal('window', { location: { hostname: 'hachi-mori.github.io' } });
  vi.stubGlobal('navigator', { permissions: { query } });
  vi.stubGlobal('fetch', fetchVersion);
  query.mockReset().mockResolvedValue({ state: 'prompt' });
  fetchVersion.mockReset().mockImplementation(async () => Response.json('0.25.1'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('explicit VOICEVOX connection on GitHub Pages', () => {
  it.each(['prompt', 'granted'])('checks /version once when permission is %s', async state => {
    query.mockResolvedValue({ state });
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: true, version: '0.25.1' });
    expect(query).toHaveBeenCalledExactlyOnceWith({ name: 'loopback-network' });
    expect(fetchVersion).toHaveBeenCalledExactlyOnceWith(`${baseUrl}/version`, expect.objectContaining({ cache: 'no-store' }));
  });

  it('reports a previously denied permission without fetching and rechecks on a later click', async () => {
    query.mockResolvedValueOnce({ state: 'denied' }).mockResolvedValue({ state: 'granted' });
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: false, failure: 'permissionDenied' });
    expect(fetchVersion).not.toHaveBeenCalled();
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: true });
    expect(fetchVersion).toHaveBeenCalledTimes(1);
  });

  it('detects denial at the prompt without retrying the request', async () => {
    query.mockResolvedValueOnce({ state: 'prompt' }).mockResolvedValue({ state: 'denied' });
    fetchVersion.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: false, failure: 'permissionDenied' });
    expect(fetchVersion).toHaveBeenCalledTimes(1);
  });

  it('can connect when Permissions API is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: true });
    expect(fetchVersion).toHaveBeenCalledTimes(1);
  });

  it('can connect when the browser does not recognize loopback-network', async () => {
    query.mockRejectedValue(new TypeError('Unsupported permission name'));
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: true });
    expect(query).toHaveBeenCalledExactlyOnceWith({ name: 'loopback-network' });
    expect(fetchVersion).toHaveBeenCalledTimes(1);
  });

  it('distinguishes HTTP errors, invalid responses and ambiguous network errors', async () => {
    fetchVersion
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response('<html>wrong server</html>'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: false, failure: 'httpError', httpStatus: 403 });
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: false, failure: 'invalidResponse' });
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: false, failure: 'networkError' });
    expect(fetchVersion).toHaveBeenCalledTimes(3);
  });

  it('reports a timeout when the version request does not respond', async () => {
    vi.useFakeTimers();
    query.mockResolvedValue({ state: 'granted' });
    fetchVersion.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      const signal = options?.signal;
      signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));
    const pending = checkVoicevox(baseUrl, 'original335');
    await vi.advanceTimersByTimeAsync(5_000);
    await expect(pending).resolves.toMatchObject({ ok: false, failure: 'timeout' });
    expect(fetchVersion).toHaveBeenCalledTimes(1);
  });

  it('rejects an external URL for imported materials before querying permission or fetching', async () => {
    await expect(checkVoicevox('https://external.invalid', 'browserImport')).resolves.toMatchObject({ ok: false, failure: 'invalidUrl' });
    expect(query).not.toHaveBeenCalled();
    expect(fetchVersion).not.toHaveBeenCalled();
  });

  it('keeps the Fastify path independent of browser loopback permissions', async () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    query.mockResolvedValue({ state: 'denied' });
    fetchVersion.mockResolvedValue(Response.json({ ok: true, version: '0.25.1', baseUrl, message: 'OK' }));
    await expect(checkVoicevox(baseUrl, 'original335')).resolves.toMatchObject({ ok: true });
    expect(query).not.toHaveBeenCalled();
    expect(fetchVersion).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('/api/voicevox/version?'), expect.anything());
  });
});
