import type { ReactNode } from 'react';
import clsx from 'clsx';

type SectionWrapperProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  background?: string;
  style?: React.CSSProperties;
};

export function SectionWrapper({
  children,
  className,
  id,
  background,
  style,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={clsx('py-20 md:py-24', className)}
      style={{ background, ...style }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
