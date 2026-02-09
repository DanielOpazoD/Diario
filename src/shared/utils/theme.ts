export type ThemeMode = 'light' | 'dark';

export const normalizeThemeValue = (value: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
};

export const resolveTheme = (storedTheme: string | null): ThemeMode => {
  const normalized = normalizeThemeValue(storedTheme);
  if (normalized === 'dark' || normalized === 'light') {
    return normalized;
  }
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyThemeClass = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
