import type { ReactNode } from 'react';

type ScreenShellProps = {
  background?: string;
  fit?: 'cover' | 'contain';
  dim?: boolean;
  centered?: boolean;
  children: ReactNode;
};

export function ScreenShell({ background, fit = 'cover', dim = false, centered = false, children }: ScreenShellProps) {
  return (
    <main className="screen-shell">
      {background ? <img className={`screen-bg screen-bg--${fit}`} src={background} alt="" aria-hidden="true" /> : null}
      {dim ? <div className="screen-dim" /> : null}
      <div className={centered ? 'screen-content screen-content--centered' : 'screen-content'}>{children}</div>
    </main>
  );
}
