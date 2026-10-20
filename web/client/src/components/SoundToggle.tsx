import { Volume2, VolumeX } from 'lucide-react';
import { useSoundEffects } from '../lib/soundEffectsContext';

export function SoundToggle() {
  const { enabled, toggle } = useSoundEffects();
  return <button type="button" className="small-button sound-toggle" data-sfx="off"
    aria-label="効果音" aria-pressed={enabled} onClick={toggle}>
    {enabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
    効果音 {enabled ? 'オン' : 'オフ'}
  </button>;
}
