import type { CSSProperties, ReactNode } from 'react';
import { hash } from './Avatar.tsx';

/** Ebru sırtlı kart arkası. Desen yalnızca kimliğe (seed) göre kayar/döner; oy değeri sızdırmaz. */
export default function CardBack({ seed, className, children }: { seed: string; className?: string; children?: ReactNode }) {
  const h = hash(seed);
  const style = {
    '--ebru-x': `${(h % 31) - 15}%`,
    '--ebru-y': `${((h >>> 5) % 31) - 15}%`,
    '--ebru-rot': `${((h >>> 10) % 4) * 90}deg`,
    '--ebru-flip': (h >>> 12) % 2 ? -1 : 1,
  } as CSSProperties;
  return (
    <span className={`card-back${className ? ` ${className}` : ''}`} style={style}>
      <span className="ebru" />
      {children}
    </span>
  );
}
