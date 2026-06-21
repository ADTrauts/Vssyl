export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_SETTINGS_KEY = 'appearance.theme';

export function resolveIsDark(theme: ThemePreference): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyThemeToDocument(theme: ThemePreference): boolean {
  if (typeof document === 'undefined') return false;
  const isDark = resolveIsDark(theme);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.setProperty('--theme-update', Date.now().toString());
  return isDark;
}

export function readLocalTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'system';
}

export function persistThemeLocally(theme: ThemePreference): boolean {
  const isDark = applyThemeToDocument(theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme, isDark } }));
  return isDark;
}

export async function persistThemeToServer(
  token: string,
  theme: ThemePreference
): Promise<void> {
  await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ key: THEME_SETTINGS_KEY, value: theme }),
  });
}

export async function hydrateThemeFromServer(token: string): Promise<ThemePreference | null> {
  try {
    const res = await fetch('/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { settings?: Record<string, string> };
    const serverTheme = data.settings?.[THEME_SETTINGS_KEY];
    if (serverTheme === 'light' || serverTheme === 'dark' || serverTheme === 'system') {
      persistThemeLocally(serverTheme);
      return serverTheme;
    }
    return null;
  } catch {
    return null;
  }
}

export async function changeTheme(
  token: string | undefined,
  theme: ThemePreference
): Promise<void> {
  persistThemeLocally(theme);
  if (token) {
    await persistThemeToServer(token, theme).catch(() => undefined);
  }
}
