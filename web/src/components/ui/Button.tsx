import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'glass';
type Size = 'sm' | 'md' | 'lg';

type Common = {
  variant?: Variant;
  size?: Size;
  /** Trailing icon; nudges right on hover. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'>;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export type ButtonProps = AsLink | AsButton;

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary',
  glass: 'btn-glass',
};

export function buttonClasses({ variant = 'primary', size = 'md', className }: Pick<Common, 'variant' | 'size' | 'className'> = {}) {
  return cn(
    'group relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium whitespace-nowrap select-none',
    'transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    SIZE[size],
    VARIANT[variant],
    className,
  );
}

/**
 * Pill button. With `href` it renders a next/link, otherwise a <button type="button">.
 * Press/hover feedback is CSS only, so this works in server components.
 */
export function Button(props: ButtonProps) {
  const { variant, size, icon, className, children, ...rest } = props;
  const classes = buttonClasses({ variant, size, className });
  const inner = (
    <>
      <span aria-hidden className="btn-sheen" />
      <span className="relative">{children}</span>
      {icon && (
        <span aria-hidden className="relative inline-flex transition-transform duration-200 group-hover:translate-x-0.5">
          {icon}
        </span>
      )}
    </>
  );

  if (rest.href !== undefined) {
    const { href, ...anchor } = rest as AsLink;
    return (
      <Link href={href} className={classes} {...anchor}>
        {inner}
      </Link>
    );
  }
  const { type = 'button', ...button } = rest as AsButton;
  return (
    <button type={type} className={classes} {...button}>
      {inner}
    </button>
  );
}
