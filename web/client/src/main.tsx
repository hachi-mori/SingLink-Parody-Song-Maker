import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { LanguageProvider } from './lib/i18n';

createRoot(document.getElementById('root') as HTMLElement).render(<LanguageProvider><App /></LanguageProvider>);
