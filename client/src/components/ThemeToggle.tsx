import { useEffect, useState } from 'react';
import { currentTheme, setTheme } from '../theme.ts';
import Icon from './Icon.tsx';

export default function ThemeToggle() {
  const [theme, setLocal] = useState(currentTheme);

  // Kullanıcı seçim yapmadıysa sistem teması değişince ikon da güncellensin.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setLocal(currentTheme());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'Koyu temaya geç' : 'Açık temaya geç';
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => {
        setTheme(next);
        setLocal(next);
      }}
    >
      <span className="theme-icon" key={theme}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
      </span>
    </button>
  );
}
