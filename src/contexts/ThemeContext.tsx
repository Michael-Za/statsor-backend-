import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'midnight';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isHighContrast: boolean;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('midnight');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  useEffect(() => {
    // Lock theme to midnight (white theme) to disable theme switching
    const root = window.document.documentElement;
    
    // Remove all theme classes and force midnight theme
    root.classList.remove('light', 'dark', 'midnight', 'ocean', 'forest', 'high-contrast');
    root.classList.add('midnight');
    
    // Theme configurations - locked to midnight with HSL values for proper white theme
    const themeConfigs = {
      midnight: {
        bgPrimary: '0 0% 100%', // White
        bgSecondary: '0 0% 98%', // Very light gray
        bgTertiary: '0 0% 95%', // Light gray
        textPrimary: '222.2 84% 4.9%', // Dark text
        textSecondary: '215 20.2% 40.1%', // Medium text
        textMuted: '215 20.2% 65.1%', // Muted text
        borderPrimary: '217.2 32.6% 85.5%', // Light border
        borderSecondary: '217.2 32.6% 90.5%', // Lighter border
        accentPrimary: '217.2 91.2% 59.8%', // Blue accent
        accentSecondary: '217.2 91.2% 59.8%', // Blue accent
        metaColor: '#ffffff'
      }
    };
    
    const config = themeConfigs.midnight;
    
    // Apply theme colors
    root.style.setProperty('--bg-primary', config.bgPrimary);
    root.style.setProperty('--bg-secondary', config.bgSecondary);
    root.style.setProperty('--bg-tertiary', config.bgTertiary);
    root.style.setProperty('--text-primary', config.textPrimary);
    root.style.setProperty('--text-secondary', config.textSecondary);
    root.style.setProperty('--text-muted', config.textMuted);
    root.style.setProperty('--border-primary', config.borderPrimary);
    root.style.setProperty('--border-secondary', config.borderSecondary);
    root.style.setProperty('--accent-primary', config.accentPrimary);
    root.style.setProperty('--accent-secondary', config.accentSecondary);
    
    // Enhanced shadows and gradients for white theme
    root.style.setProperty('--shadow-soft', `0 4px 6px -1px hsl(${config.textPrimary} / 0.1)`);
    root.style.setProperty('--shadow-medium', `0 10px 15px -3px hsl(${config.textPrimary} / 0.15)`);
    root.style.setProperty('--shadow-strong', `0 25px 50px -12px hsl(${config.textPrimary} / 0.25)`);
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${config.bgPrimary}) 0%, hsl(${config.bgSecondary}) 50%, hsl(${config.bgTertiary}) 100%)`);
    root.style.setProperty('--gradient-accent', `linear-gradient(135deg, hsl(${config.accentPrimary}) 0%, hsl(${config.accentSecondary}) 100%)`);
    root.style.setProperty('--gradient-glow', `radial-gradient(circle at center, hsl(${config.accentPrimary} / 0.2) 0%, transparent 70%)`);
    
    // Animation preferences
    root.style.setProperty('--animation-duration', animationsEnabled ? '0.3s' : '0s');
    root.style.setProperty('--animation-timing', 'cubic-bezier(0.4, 0, 0.2, 1)');
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', config.metaColor);
    }
  }, [animationsEnabled]);

  // Disable theme toggle by making it a no-op
  const toggleTheme = () => {
    // Do nothing - theme switching is disabled
  };

  const isHighContrast = false;

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isHighContrast,
    animationsEnabled,
    setAnimationsEnabled,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};