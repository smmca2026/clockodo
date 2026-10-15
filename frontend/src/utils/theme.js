import { useState, useEffect } from 'react';

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem('clockodo_appearance_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch (e) {}
  return 'system'; // Default is always System Theme as requested
}

export function resolveEffectiveTheme(choice) {
  if (choice === 'dark') return 'dark';
  if (choice === 'light') return 'light';
  // System theme: check OS/browser dark mode
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Fallback for modern SaaS aesthetic
}

export function applyTheme(choice) {
  const selectedChoice = choice || getSavedTheme();
  const effective = resolveEffectiveTheme(selectedChoice);
  
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.setAttribute('data-theme-choice', selectedChoice);
  }
  return effective;
}

export function setAppTheme(choice) {
  const safeChoice = (choice === 'dark' || choice === 'light') ? choice : 'system';
  try {
    localStorage.setItem('clockodo_appearance_theme', safeChoice);
  } catch (e) {}
  const effective = applyTheme(safeChoice);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('clockodo_theme_changed', { 
      detail: { choice: safeChoice, effective } 
    }));
  }
  return { choice: safeChoice, effective };
}

export function useTheme() {
  const [themeChoice, setThemeChoiceState] = useState(getSavedTheme);
  const [effectiveTheme, setEffectiveTheme] = useState(() => resolveEffectiveTheme(getSavedTheme()));

  useEffect(() => {
    // Initial application
    const eff = applyTheme(themeChoice);
    setEffectiveTheme(eff);

    // Listen to manual changes
    const handleThemeChange = (e) => {
      if (e.detail) {
        setThemeChoiceState(e.detail.choice);
        setEffectiveTheme(e.detail.effective);
      }
    };
    window.addEventListener('clockodo_theme_changed', handleThemeChange);

    // Listen to OS system theme changes if system theme is selected
    const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const current = getSavedTheme();
      if (current === 'system') {
        const updatedEff = applyTheme('system');
        setEffectiveTheme(updatedEff);
      }
    };
    if (media) {
      if (media.addEventListener) {
        media.addEventListener('change', handleMediaChange);
      } else if (media.addListener) {
        media.addListener(handleMediaChange);
      }
    }

    return () => {
      window.removeEventListener('clockodo_theme_changed', handleThemeChange);
      if (media) {
        if (media.removeEventListener) {
          media.removeEventListener('change', handleMediaChange);
        } else if (media.removeListener) {
          media.removeListener(handleMediaChange);
        }
      }
    };
  }, [themeChoice]);

  const changeTheme = (newChoice) => {
    const res = setAppTheme(newChoice);
    setThemeChoiceState(res.choice);
    setEffectiveTheme(res.effective);
  };

  return { 
    themeChoice, 
    effectiveTheme, 
    setTheme: changeTheme 
  };
}
