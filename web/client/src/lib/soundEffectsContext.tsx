import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { SoundEffectsPlayer, type SoundEffect } from './soundEffects';

const storageKey = 'singlink:sound-effects';
type SoundSettings = { enabled: boolean; toggle: () => void; play: (name: SoundEffect) => void };
const SoundContext = createContext<SoundSettings>({ enabled: true, toggle: () => {}, play: () => {} });
export const useSoundEffects = () => useContext(SoundContext);

function readEnabled() {
  try { return localStorage.getItem(storageKey) !== 'off'; } catch { return true; }
}

function buttonAt(target: EventTarget | null) {
  return target instanceof Element ? target.closest('button') : null;
}

export function SoundEffectsProvider({ children }: PropsWithChildren) {
  const [enabled, setEnabled] = useState(readEnabled);
  const [player] = useState(() => {
    const value = new SoundEffectsPlayer();
    value.setEnabled(readEnabled());
    return value;
  });
  useEffect(() => {
    player.preload();
    return () => player.dispose();
  }, [player]);

  const toggle = () => {
    const next = !enabled;
    player.setEnabled(next);
    setEnabled(next);
    try { localStorage.setItem(storageKey, next ? 'on' : 'off'); } catch { /* Storage is optional. */ }
    if (next) {
      player.unlock();
      void player.play('button');
    }
  };
  return (
    <SoundContext.Provider value={{ enabled, toggle, play: (name) => { void player.play(name); } }}>
      <div className="sound-effects-root"
        onPointerDownCapture={() => player.unlock()}
        onKeyDownCapture={(event) => {
          if (event.repeat && (event.key === 'Enter' || event.key === ' ') && buttonAt(event.target)) {
            event.preventDefault();
            return;
          }
          player.unlock();
        }}
        onClickCapture={(event) => {
          const button = buttonAt(event.target);
          if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true'
            || button.closest('[inert]') || button.dataset.sfx === 'off') return;
          player.unlock();
          void player.play('button');
        }}>
        {children}
      </div>
    </SoundContext.Provider>
  );
}
