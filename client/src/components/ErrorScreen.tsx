import type { ReactNode } from 'react';
import Icon, { type IconName } from './Icon.tsx';

export default function ErrorScreen({ icon, title, text, children }: { icon: IconName; title: string; text: string; children: ReactNode }) {
  return (
    <main className="center-page">
      <div className="panel error-card">
        <div className="error-icon">
          <Icon name={icon} size={36} />
        </div>
        <h1>{title}</h1>
        <p className="muted">{text}</p>
        <div className="actions">{children}</div>
      </div>
    </main>
  );
}
