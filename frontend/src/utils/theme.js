import { useState, useEffect } from 'react';

export function getSavedTheme() {
  return 'light';
}

export function resolveEffectiveTheme() {
  return 'light';
}

export function applyTheme() {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-theme-choice', 'light');
    try {
      localStorage.setItem('clockodo_appearance_theme', 'light');
    } catch (e) {}
  }
  return 'light';
}

export function setAppTheme() {
  return { choice: 'light', effective: 'light' };
}

export function useTheme() {
  useEffect(() => {
    applyTheme();
  }, []);

  return { 
    themeChoice: 'light', 
    effectiveTheme: 'light', 
    setTheme: () => {} 
  };
}

