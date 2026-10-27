import type { ReactNode } from 'react';
import { cn } from './cn';
import { SectionBadge } from './SectionBadge';

/** Badge + chrome h2 + muted lead. Pass `id` and point the section's aria-labelledby at it. */
export function SectionHeading({
  badge,
  title,
  lead,
  id,
  align = 'left',
  as: Tag = 'h2',
  className,
}: {
  badge?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  className?: string;
}) {
  const center = align === 'center';
  return (
    <div className={cn('flex flex-col gap-4', center ? 'items-center text-center' : 'items-start', className)}>
      {badge && <SectionBadge>{badge}</SectionBadge>}
      <Tag
        id={id}
        className={cn(
          'chrome-text max-w-3xl font-semibold tracking-tight text-balance',
          Tag === 'h1' ? 'text-4xl leading-[1.05] sm:text-6xl' : 'text-3xl leading-[1.1] sm:text-5xl',
        )}
      >
        {title}
      </Tag>
      {lead && <p className={cn('max-w-2xl text-base text-muted sm:text-lg', center && 'mx-auto')}>{lead}</p>}
    </div>
  );
}
