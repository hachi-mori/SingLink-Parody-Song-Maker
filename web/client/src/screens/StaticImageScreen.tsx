import { AssetButton } from '../components/AssetButton';
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
        <div className="static-image-frame">
          <img src={imageSrc} alt={title} />
        </div>
        <AssetButton imageSrc="/assets/texture/assets/button/title.png" label="タイトルへ" onClick={onBack} />
      </section>
    </ScreenShell>
  );
}
