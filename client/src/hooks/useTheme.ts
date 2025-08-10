import { useEffect, useState } from "react";

type Theme = 'light' | 'dark' | 'navy';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.remove('navy');
    if (theme === 'dark') root.classList.add('dark');
    if (theme === 'navy') root.classList.add('navy');
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const cycle = () => {
    setTheme((t) => (t === 'light' ? 'dark' : t === 'dark' ? 'navy' : 'light'));
  };

  return { theme, setTheme, cycle };
}
