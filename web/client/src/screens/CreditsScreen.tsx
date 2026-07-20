import { ScreenShell } from '../components/ScreenShell';
import { assetUrl } from '../lib/assets';
import { creditLinks, englishCreditSections } from '../lib/credits';
import { useLanguage } from '../lib/i18n';

export function CreditsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();

  return (
    <ScreenShell>
      <section className="credits-screen">
        <header className="credits-header">
          <div>
            <p>People and tools behind SingLink</p>
            <h1>{t('creditsTitle')}</h1>
          </div>
          <button className="small-button" onClick={onBack}>{t('backToTitle')}</button>
        </header>

        <div className="credits-grid">
          {englishCreditSections.map(({ label, title, body }) => (
            <article className="credit-card" key={label}>
              <span className="credit-label">{label}</span>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </div>

        <footer className="credit-footer">
          <p>The MIT License applies to the original code and documentation only. Other materials remain under their own terms.</p>
          <nav aria-label="License and attribution links">
            {creditLinks.map((link) => (
              <a
                key={link.label}
                href={'local' in link ? assetUrl(link.href) : link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </footer>
      </section>
    </ScreenShell>
  );
}
