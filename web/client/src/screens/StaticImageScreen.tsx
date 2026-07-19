import { ScreenShell } from '../components/ScreenShell';
import { useLanguage } from '../lib/i18n';

type StaticImageScreenProps = {
  title: string;
  imageSrc?: string;
  description?: string;
  onBack: () => void;
};

export function StaticImageScreen({ title, description, imageSrc, onBack }: StaticImageScreenProps) {
  const { t } = useLanguage();
  return (
    <ScreenShell>
      <section className="static-image-screen">
        <header className="static-image-header">
          <h1>{title}</h1>
          <button className="small-button" onClick={onBack}>{t('backToTitle')}</button>
        </header>
        {description ? <section className="static-image-description"><p>{description}</p>{imageSrc ? <small>{t('japaneseReference')}</small> : null}</section> : null}
        {imageSrc ? <div className="static-image-frame">
          <img src={imageSrc} alt={title} />
        </div> : null}
      </section>
    </ScreenShell>
  );
}
