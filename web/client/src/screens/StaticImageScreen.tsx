import { ScreenShell } from '../components/ScreenShell';

type StaticImageScreenProps = {
  title: string;
  imageSrc: string;
  onBack: () => void;
};

export function StaticImageScreen({ title, imageSrc, onBack }: StaticImageScreenProps) {
  return (
    <ScreenShell background="/assets/texture/assets/result_background.png" fit="cover">
      <section className="static-image-screen">
        <header className="static-image-header">
          <h1>{title}</h1>
          <button className="small-button" onClick={onBack}>タイトルへ</button>
        </header>
        <div className="static-image-frame">
          <img src={imageSrc} alt={title} />
        </div>
      </section>
    </ScreenShell>
  );
}
