import { useId, type ReactNode } from 'react';
import { Card } from './Card';

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const titleId = useId();
  return <section aria-labelledby={titleId}><Card style={{ padding: 24 }}>
    <h2 id={titleId} style={{ fontSize: '1.1rem', marginBottom: description ? 8 : 24 }}>{title}</h2>
    {description && <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: 24 }}>{description}</p>}
    {children}
  </Card></section>;
}
