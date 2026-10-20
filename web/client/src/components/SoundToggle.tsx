import { Volume2, VolumeX } from 'lucide-react';
import { useSoundEffects } from '../lib/soundEffectsContext';

export function SoundToggle() {
  const { enabled, toggle } = useSoundEffects();
  return <button type="button" className="sound-toggle" data-sfx="off"
    aria-label="効果音" aria-pressed={enabled}
    title={enabled ? '効果音をオフにする' : '効果音をオンにする'} onClick={toggle}>
    {enabled ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
  </button>;
}
