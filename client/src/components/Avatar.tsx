import { AVATAR_COLORS } from '../../../shared/constants.ts';

export function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

export default function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initial = [...name.trim()][0]?.toLocaleUpperCase('tr') ?? '?';
  const bg = AVATAR_COLORS[hash(name.toLocaleLowerCase('tr')) % AVATAR_COLORS.length];
  return (
    <span className="avatar" style={{ background: bg, width: size, height: size }} aria-hidden="true">
      {initial}
    </span>
  );
}
