import type { ElementType, ReactNode } from 'react';
import { cn } from './cn';

const WIDTH = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
} as const;

export function Container({
  as: Tag = 'div',
  size = 'default',
  className,
  children,
}: {
  as?: ElementType;
  size?: keyof typeof WIDTH;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', WIDTH[size], className)}>{children}</Tag>;
}
