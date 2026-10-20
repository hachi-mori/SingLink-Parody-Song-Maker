import { describe, expect, it, vi } from 'vitest';
import { SoundEffectsPlayer, soundEffects } from '../src/lib/soundEffects';

function setup(options: { decode?: () => Promise<AudioBuffer>; fetchAudio?: () => Promise<ArrayBuffer> } = {}) {
  let now = 0;
  const sources: Array<{ start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }> = [];
  const gains: Array<{ gain: { value: number }; connect: ReturnType<typeof vi.fn> }> = [];
  const context = {
    state: 'running',
    destination: {},
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    decodeAudioData: vi.fn(options.decode ?? (async () => ({ duration: 0.32 } as AudioBuffer))),
    createGain: () => {
      const node = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
      gains.push(node);
      return node;
    },
    createBufferSource: () => {
      const node = { buffer: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null };
      sources.push(node);
      return node;
    }
  };
  const fetchAudio = vi.fn(options.fetchAudio ?? (async () => new ArrayBuffer(8)));
  const player = new SoundEffectsPlayer({
    createContext: () => context as unknown as AudioContext,
    fetchAudio,
    now: () => now
  });
  return { player, sources, gains, context, fetchAudio, setTime: (value: number) => { now = value; } };
}

describe('sound effects', () => {
  it('preloads only three local files and never plays before a gesture', async () => {
    const { player, sources, fetchAudio } = setup();
    player.preload();
    player.preload();
    await player.play('button');
    expect(sources).toHaveLength(0);
    expect(fetchAudio).toHaveBeenCalledTimes(3);
    expect(fetchAudio.mock.calls.map(([url]) => url)).toEqual(
      Object.values(soundEffects).map(({ file }) => `/assets/sfx/${file}`)
    );
  });

  it('gives accepted feedback priority, stops a click, and suppresses rapid clicks', async () => {
    const { player, sources, setTime, gains } = setup();
    player.unlock();
    await player.play('button');
    await player.play('button');
    expect(sources).toHaveLength(1);
    await player.play('correct');
    expect(sources).toHaveLength(2);
    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(gains[2].gain.value).toBe(soundEffects.correct.gain);
    await player.play('button');
    await player.play('correct');
    expect(sources).toHaveLength(2);
    setTime(500);
    await player.play('button');
    expect(sources).toHaveLength(3);
  });

  it('allows the first gesture sound after an asynchronous context resume', async () => {
    const { player, context, sources } = setup();
    context.state = 'suspended';
    let finishResume!: () => void;
    context.resume.mockImplementation(() => new Promise<void>((resolve) => {
      finishResume = () => { context.state = 'running'; resolve(); };
    }));
    player.unlock();
    const pending = player.play('button');
    expect(sources).toHaveLength(0);
    finishResume();
    await pending;
    expect(sources).toHaveLength(1);
  });

  it('cancels a pending sound when muted and stops active effects immediately', async () => {
    let resolveDecode!: (value: AudioBuffer) => void;
    const decoded = new Promise<AudioBuffer>((resolve) => { resolveDecode = resolve; });
    const { player, sources, setTime, gains } = setup({ decode: () => decoded });
    player.unlock();
    const pending = player.play('button');
    player.setEnabled(false);
    resolveDecode({ duration: 0.1 } as AudioBuffer);
    await pending;
    expect(sources).toHaveLength(0);
    player.setEnabled(true);
    setTime(500);
    await player.play('button');
    expect(sources).toHaveLength(1);
    player.setEnabled(false);
    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(gains[0].gain.value).toBe(0);
    setTime(1000);
    await player.play('correct');
    expect(sources).toHaveLength(1);
  });

  it('drops late decoding instead of playing stale feedback', async () => {
    let resolveDecode!: (value: AudioBuffer) => void;
    const decoded = new Promise<AudioBuffer>((resolve) => { resolveDecode = resolve; });
    const { player, sources, setTime } = setup({ decode: () => decoded });
    player.unlock();
    const pending = player.play('incorrect');
    setTime(1000);
    resolveDecode({ duration: 0.2 } as AudioBuffer);
    await pending;
    expect(sources).toHaveLength(0);
  });

  it('tolerates missing assets, unavailable audio devices, and denied resume', async () => {
    const missing = setup({ fetchAudio: async () => { throw new Error('404'); } });
    missing.player.preload();
    missing.player.unlock();
    await expect(missing.player.play('incorrect')).resolves.toBeUndefined();
    expect(missing.sources).toHaveLength(0);
    const unavailable = new SoundEffectsPlayer({
      createContext: () => { throw new Error('device'); },
      fetchAudio: async () => new ArrayBuffer(1),
      now: () => 0
    });
    expect(() => unavailable.unlock()).not.toThrow();
    await expect(unavailable.play('correct')).resolves.toBeUndefined();
    const suspended = setup();
    suspended.context.state = 'suspended';
    suspended.context.resume.mockRejectedValue(new Error('autoplay'));
    suspended.player.unlock();
    await expect(suspended.player.play('button')).resolves.toBeUndefined();
    expect(suspended.sources).toHaveLength(0);
  });
});
