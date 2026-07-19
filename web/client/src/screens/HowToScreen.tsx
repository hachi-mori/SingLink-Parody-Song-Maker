import { ScreenShell } from '../components/ScreenShell';
import { useLanguage } from '../lib/i18n';

export function HowToScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const steps = [
    ['1', t('howToStepChooseTitle'), t('howToStepChooseBody')],
    ['2', t('howToStepAnswerTitle'), t('howToStepAnswerBody')],
    ['3', t('howToStepListenTitle'), t('howToStepListenBody')],
    ['4', t('howToStepFollowTitle'), t('howToStepFollowBody')]
  ] as const;

  return (
    <ScreenShell>
      <section className="howto-screen">
        <header className="howto-header">
          <div>
            <p>{t('howToEyebrow')}</p>
            <h1>{t('howToTitle')}</h1>
          </div>
          <button className="small-button" onClick={onBack}>{t('backToTitle')}</button>
        </header>
        <ol className="howto-steps">
          {steps.map(([number, title, body]) => (
            <li key={number}>
              <span className="howto-step-number" aria-hidden="true">{number}</span>
              <div>
                <h2>{title}</h2>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </ScreenShell>
  );
}
