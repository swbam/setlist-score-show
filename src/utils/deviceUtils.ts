
import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;

export function getViewportHeight() {
  if (typeof window !== 'undefined') {
    return window.innerHeight * 0.01;
  }
  return 0;
}

export function updateVHProperty() {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--vh', `${getViewportHeight()}px`);
  }
}

export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const touchQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    setIsTouch(touchQuery.matches);
    
    const updateTouch = (e: MediaQueryListEvent) => {
      setIsTouch(e.matches);
    };
    
    touchQuery.addEventListener('change', updateTouch);
    return () => touchQuery.removeEventListener('change', updateTouch);
  }, []);
  
  return isTouch;
}

// Fix for iOS Safari 100vh issue
export function setupMobileViewportFix() {
  if (typeof window !== 'undefined') {
    updateVHProperty();
    window.addEventListener('resize', updateVHProperty);
    window.addEventListener('orientationchange', updateVHProperty);
    
    return () => {
      window.removeEventListener('resize', updateVHProperty);
      window.removeEventListener('orientationchange', updateVHProperty);
    };
  }
  return () => {};
}
