/**
 * Scroll Store - Reactive scroll position tracking
 * Useful for scroll-driven animations and effects
 */
import { readable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface ScrollState {
  y: number;
  direction: 'up' | 'down' | 'none';
  velocity: number;
  atTop: boolean;
  atBottom: boolean;
}

function createScrollStore() {
  let lastY = 0;
  let lastTime = 0;

  const getScrollState = (): ScrollState => {
    if (!browser) {
      return { y: 0, direction: 'none', velocity: 0, atTop: true, atBottom: false };
    }
    
    const y = window.scrollY;
    const now = performance.now();
    const deltaY = y - lastY;
    const deltaTime = now - lastTime;
    const velocity = deltaTime > 0 ? Math.abs(deltaY) / deltaTime : 0;
    
    const direction = deltaY > 0 ? 'down' : deltaY < 0 ? 'up' : 'none';
    const atTop = y <= 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const atBottom = y >= maxScroll - 1;
    
    lastY = y;
    lastTime = now;
    
    return { y, direction, velocity, atTop, atBottom };
  };

  return readable<ScrollState>(getScrollState(), (set) => {
    if (!browser) return;

    let rafId: number | null = null;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      
      rafId = requestAnimationFrame(() => {
        set(getScrollState());
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  });
}

export const scroll = createScrollStore();

// Derived stores for common checks
export const scrollY = derived(scroll, ($s) => $s.y);
export const scrollDirection = derived(scroll, ($s) => $s.direction);
export const isScrollingDown = derived(scroll, ($s) => $s.direction === 'down');
export const isScrollingUp = derived(scroll, ($s) => $s.direction === 'up');
export const isAtTop = derived(scroll, ($s) => $s.atTop);
export const isAtBottom = derived(scroll, ($s) => $s.atBottom);

// Normalized scroll progress (0 to 1)
export const scrollProgress = derived(scroll, ($s) => {
  if (!browser) return 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return maxScroll > 0 ? $s.y / maxScroll : 0;
});
