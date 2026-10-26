import { assetUrl } from './assets';

export const soundEffects = {
  button: { file: 'click_004.ogg', gain: 0.17 },
  correct: { file: 'confirmation_003.ogg', gain: 0.115 },
  incorrect: { file: 'error_001.ogg', gain: 0.178 }
} as const;
export type SoundEffect = keyof typeof soundEffects;

type SoundEnvironment = {
  createContext: () => AudioContext;
  fetchAudio: (url: string) => Promise<ArrayBuffer>;
  now: () => number;
};

const browserEnvironment: SoundEnvironment = {
  createContext: () => new AudioContext(),
  fetchAudio: async (url) => {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) throw new Error('Sound unavailable');
    return response.arrayBuffer();
  },
  now: () => performance.now()
};

// This context and gain belong only to effects. Singing keeps its own player.
export class SoundEffectsPlayer {
  private context?: AudioContext;
  private output?: GainNode;
  private resumeReady = Promise.resolve();
  private files = new Map<SoundEffect, Promise<ArrayBuffer | undefined>>();
  private buffers = new Map<SoundEffect, Promise<AudioBuffer | undefined>>();
  private active = new Set<AudioBufferSourceNode>();
  private enabled = true;
  private generation = 0;
  private lastRequest = -Infinity;
  private feedbackUntil = -Infinity;
  private lastFeedback?: SoundEffect;

  constructor(private environment: SoundEnvironment = browserEnvironment) {}

  preload() {
    for (const name of Object.keys(soundEffects) as SoundEffect[]) this.load(name);
  }

  private load(name: SoundEffect) {
    let promise = this.files.get(name);
    if (!promise) {
      promise = this.environment.fetchAudio(assetUrl(`assets/sfx/${soundEffects[name].file}`))
        .catch(() => undefined);
      this.files.set(name, promise);
      // A later gesture can retry a transient network failure.
      void promise.then((data) => { if (!data) this.files.delete(name); });
    }
    return promise;
  }

  // Called synchronously from a pointer/key gesture to satisfy autoplay policy.
  unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        this.context = this.environment.createContext();
        this.output = this.context.createGain();
        this.output.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') this.resumeReady = this.context.resume().catch(() => {});
      for (const name of Object.keys(soundEffects) as SoundEffect[]) void this.decode(name);
    } catch {
      // Sound is optional; unavailable audio must never block a question.
    }
  }

  private decode(name: SoundEffect) {
    let promise = this.buffers.get(name);
    if (!promise && this.context) {
      const context = this.context;
      promise = this.load(name).then((data) => data ? context.decodeAudioData(data.slice(0)) : undefined)
        .catch(() => undefined);
      this.buffers.set(name, promise);
      void promise.then((buffer) => { if (!buffer) this.buffers.delete(name); });
    }
    return promise;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.generation++;
    if (this.output) this.output.gain.value = enabled ? 1 : 0;
    if (!enabled) this.stopActive();
  }

  private stopActive() {
    for (const source of this.active) {
      try { source.stop(); } catch { /* Already ended. */ }
      source.disconnect();
    }
    this.active.clear();
  }

  async play(name: SoundEffect): Promise<void> {
    try {
      const requestedAt = this.environment.now();
      if (!this.enabled || !this.context || !this.output) return;
      if (name === 'button' && (requestedAt < this.feedbackUntil || requestedAt - this.lastRequest < 100)) return;
      if (name !== 'button' && name === this.lastFeedback && requestedAt < this.feedbackUntil) return;
      this.lastRequest = requestedAt;
      if (name !== 'button') {
        // A newly accepted opposite answer supersedes the previous feedback,
        // including while its audio is still decoding or cannot be played.
        this.lastFeedback = name;
        this.feedbackUntil = requestedAt + 400;
        this.stopActive();
      }
      const generation = ++this.generation;
      await this.resumeReady;
      const buffer = await this.decode(name);
      if (!buffer || generation !== this.generation || !this.enabled
        || this.environment.now() - requestedAt > 250 || this.context.state !== 'running') return;
      this.stopActive();
      const source = this.context.createBufferSource();
      const level = this.context.createGain();
      source.buffer = buffer;
      level.gain.value = soundEffects[name].gain;
      source.connect(level);
      level.connect(this.output);
      source.onended = () => {
        this.active.delete(source);
        source.disconnect();
        level.disconnect();
      };
      this.active.add(source);
      if (name !== 'button') this.feedbackUntil = this.environment.now() + buffer.duration * 1000;
      source.start();
    } catch {
      // Fetch/decode/autoplay/device failures leave the game usable.
    }
  }

  dispose() {
    this.setEnabled(false);
    if (this.context) void this.context.close().catch(() => {});
  }
}
