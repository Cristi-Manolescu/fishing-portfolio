/**
 * Theme Store - Section-based theming
 * Each section has its own accent color and background
 */
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface ThemeConfig {
  id: string;
  accent: string;
  themeColor: string;
  bgImage: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  home: {
    id: 'home',
    accent: '#ff6701',
    themeColor: '#1a3a4a',
    bgImage: '/assets/bg/acasa.jpg',
  },
  about: {
    id: 'about',
    accent: '#367101',
    themeColor: '#2d4a2d',
    bgImage: '/assets/bg/despre.jpg',
  },
  sessions: {
    id: 'sessions',
    accent: '#efac45',
    themeColor: '#3d3528',
    bgImage: '/assets/bg/partide.jpg',
  },
  gallery: {
    id: 'gallery',
    accent: '#6b1c10',
    themeColor: '#4a3528',
    bgImage: '/assets/bg/galerie.jpg',
  },
  contact: {
    id: 'contact',
    accent: '#3891fb',
    themeColor: '#2d3540',
    bgImage: '/assets/bg/contact.jpg',
  },
};

// Current active theme ID
export const currentThemeId = writable<string>('home');

// Derived full theme object
export const currentTheme = derived(currentThemeId, ($id) => THEMES[$id] ?? THEMES.home);

// Apply theme to CSS custom properties
export function applyTheme(themeId: string): void {
  if (!browser) return;
  
  const theme = THEMES[themeId] ?? THEMES.home;
  const root = document.documentElement;
  
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-theme', theme.themeColor);
  
  currentThemeId.set(themeId);
}

// Get mobile-aware background path
export function getBackgroundPath(themeId: string, isMobile: boolean): string {
  const theme = THEMES[themeId] ?? THEMES.home;
  if (isMobile) {
    // Mobile backgrounds are in /assets/bg-m/
    return theme.bgImage.replace('/assets/bg/', '/assets/bg-m/');
  }
  return theme.bgImage;
}
