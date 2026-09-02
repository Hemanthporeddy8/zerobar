// Zerobar Multi-Theme Engine

export const THEMES = [
  {
    id: 'obsidian',
    name: 'Obsidian Gold',
    tagline: 'Deep cosmic dark with golden warmth',
    isDark: true,
    palette: {
      bg: '#090B14',
      card: '#121629',
      accent: '#FBBF24',
      text: '#F8FAFC'
    }
  },
  {
    id: 'newsprint',
    name: 'Vintage Newsprint',
    tagline: 'Classic broadsheet paper with rich dark ink',
    isDark: false,
    palette: {
      bg: '#F5F1E8',
      card: '#FFFFFF',
      accent: '#D97706',
      text: '#1C1917'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight OLED',
    tagline: 'True pitch black & high contrast white',
    isDark: true,
    palette: {
      bg: '#000000',
      card: '#0D0D0D',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    }
  },
  {
    id: 'slate',
    name: 'Nordic Slate',
    tagline: 'Cool graphite gray with arctic cyan signal',
    isDark: true,
    palette: {
      bg: '#0F131A',
      card: '#181E29',
      accent: '#38BDF8',
      text: '#F1F5F9'
    }
  },
  {
    id: 'emerald',
    name: 'Cyber Forest',
    tagline: 'Deep dark emerald with glowing mint signal',
    isDark: true,
    palette: {
      bg: '#060E0B',
      card: '#0D1A15',
      accent: '#10B981',
      text: '#ECFDF5'
    }
  },
  {
    id: 'terracotta',
    name: 'Warm Sunset',
    tagline: 'Roasted espresso charcoal & clay terracotta',
    isDark: true,
    palette: {
      bg: '#14100E',
      card: '#1F1916',
      accent: '#FB923C',
      text: '#FAF5F0'
    }
  }
];

export function getActiveTheme() {
  if (typeof window === 'undefined') return 'obsidian';
  try {
    return localStorage.getItem('zerobar_theme') || 'obsidian';
  } catch {
    return 'obsidian';
  }
}

export function applyTheme(themeId) {
  if (typeof window === 'undefined') return;
  try {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('zerobar_theme', themeId);
    window.dispatchEvent(new CustomEvent('zerobar_theme_changed', { detail: { themeId } }));
  } catch (e) {
    console.warn('Could not save theme:', e);
  }
}
