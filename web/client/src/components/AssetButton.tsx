import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useLanguage } from '../lib/i18n';

type AssetButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  imageSrc?: string;
  label: string;
  children?: ReactNode;
};

export function AssetButton({ imageSrc, label, children, className = '', ...props }: AssetButtonProps) {
  const { language } = useLanguage();
  return (
    <button className={`asset-button ${className}`} aria-label={label} {...props}>
      {imageSrc ? <img src={imageSrc} alt="" draggable={false} /> : null}
      {imageSrc && language === 'en' ? <span className="asset-button-caption">{label}</span> : null}
      {!imageSrc ? <span>{children ?? label}</span> : null}
    </button>
  );
}
