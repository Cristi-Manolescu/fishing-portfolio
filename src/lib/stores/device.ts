/**
 * Device Store - Reactive device/viewport detection
 * Updates automatically on resize and orientation change
 */
import { readable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Detect if this is a mobile DEVICE (not just narrow viewport)
 * Uses screen size + user agent - doesn't change on rotation
 * Calculated once at load time
 */
function detectMobileDevice(): boolean {
  if (!browser) return false;
  
  // Check user agent first (most reliable)
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  if (mobileUA) return true;
  
  // Fallback: check screen size (not viewport - screen doesn't change on rotate)
  // Use the smaller dimension to handle both orientations
  const screenMin = Math.min(window.screen.width, window.screen.height);
  return screenMin < BREAKPOINTS.md;
}

// Static device type - doesn't change on rotation
export const isDeviceMobile = detectMobileDevice();

interface Viewport {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

function createViewportStore() {
  const getViewport = (): Viewport => {
    if (!browser) {
      return { width: 375, height: 667, orientation: 'portrait' };
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  };

  return readable<Viewport>(getViewport(), (set) => {
    if (!browser) return;

    let rafId: number | null = null;
    
    const handleResize = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        set(getViewport());
        rafId = null;
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  });
}

export const viewport = createViewportStore();

// Derived stores for common checks
export const isMobile = derived(viewport, ($vp) => $vp.width < BREAKPOINTS.md);
export const isTablet = derived(viewport, ($vp) => $vp.width >= BREAKPOINTS.md && $vp.width < BREAKPOINTS.lg);
export const isDesktop = derived(viewport, ($vp) => $vp.width >= BREAKPOINTS.lg);
export const isLandscape = derived(viewport, ($vp) => $vp.orientation === 'landscape');
export const isPortrait = derived(viewport, ($vp) => $vp.orientation === 'portrait');

// Touch device detection (doesn't change, so just a constant)
export const isTouchDevice = browser 
  ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 
  : false;
