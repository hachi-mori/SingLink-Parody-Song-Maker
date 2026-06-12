import type { ButtonHTMLAttributes, ReactNode } from 'react';

type AssetButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  imageSrc?: string;
  label: string;
  children?: ReactNode;
};

export function AssetButton({ imageSrc, label, children, className = '', ...props }: AssetButtonProps) {
  return (
    <button className={`asset-button ${className}`} aria-label={label} {...props}>
      {imageSrc ? <img src={imageSrc} alt="" draggable={false} /> : null}
      {!imageSrc ? <span>{children ?? label}</span> : null}
    </button>
  );
}
