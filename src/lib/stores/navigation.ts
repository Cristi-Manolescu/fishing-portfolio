/**
 * Navigation Store - Desktop panel navigation
 * Manages active screen and transition direction
 */
import { writable, derived } from 'svelte/store';

export type ScreenId = 'home' | 'about' | 'sessions' | 'gallery' | 'contact';

export const SCREEN_ORDER: ScreenId[] = ['home', 'about', 'sessions', 'gallery', 'contact'];

interface NavigationState {
  current: ScreenId;
  previous: ScreenId | null;
  direction: 'left' | 'right' | 'none';
}

function createNavigationStore() {
  const { subscribe, set, update } = writable<NavigationState>({
    current: 'home',
    previous: null,
    direction: 'none',
  });

  return {
    subscribe,
    
    navigateTo(screenId: ScreenId) {
      update(state => {
        const currentIndex = SCREEN_ORDER.indexOf(state.current);
        const targetIndex = SCREEN_ORDER.indexOf(screenId);
        
        if (screenId === state.current) {
          return state;
        }
        
        return {
          current: screenId,
          previous: state.current,
          direction: targetIndex > currentIndex ? 'left' : 'right',
        };
      });
    },
    
    reset() {
      set({
        current: 'home',
        previous: null,
        direction: 'none',
      });
    }
  };
}

export const navigation = createNavigationStore();

// Derived stores for convenience
export const currentScreen = derived(navigation, $nav => $nav.current);
export const transitionDirection = derived(navigation, $nav => $nav.direction);
