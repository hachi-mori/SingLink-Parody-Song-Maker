import type { ReactNode } from 'react';

type ScreenShellProps = {
  background?: string;
  fit?: 'cover' | 'contain';
  dim?: boolean;
  children: ReactNode;
};

export function ScreenShell({ background, fit = 'cover', dim = false, children }: ScreenShellProps) {
  return (
    <main className="screen-shell">
      {background ? <img className={`screen-bg screen-bg--${fit}`} src={background} alt="" aria-hidden="true" /> : null}
      {dim ? <div className="screen-dim" /> : null}
      <div className="screen-content">{children}</div>
    </main>
  );
}
