'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { getTextColor } from '@/src/lib/theme';

type BackToTopProps = {
  accentColor: string;
};

export function BackToTop({ accentColor }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition hover:scale-105"
      style={{ backgroundColor: accentColor, color: getTextColor(accentColor) }}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
