import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { LanguageProvider } from './lib/i18n';
import { SoundEffectsProvider } from './lib/soundEffectsContext';

createRoot(document.getElementById('root') as HTMLElement).render(
  <SoundEffectsProvider><LanguageProvider><App /></LanguageProvider></SoundEffectsProvider>
);
