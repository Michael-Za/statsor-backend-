import React from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { Palette, Moon, Waves, Trees, Settings } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const themeOptions: ThemeOption[] = [
  {
    value: 'midnight',
    label: 'Midnight',
    description: 'Deep purple tones for comfortable night viewing',
    icon: Moon,
    colors: {
      primary: '#0f0f23',
      secondary: '#1a1a3a',
      accent: '#8b5cf6',
    },
  },
  {
    value: 'dark',
    label: 'Classic Dark',
    description: 'Pure dark theme with blue accents',
    icon: Palette,
    colors: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      accent: '#3b82f6',
    },
  },
  {
    value: 'ocean',
    label: 'Ocean Depths',
    description: 'Calming blue tones inspired by deep waters',
    icon: Waves,
    colors: {
      primary: '#0c1821',
      secondary: '#1e3a5f',
      accent: '#06b6d4',
    },
  },
  {
    value: 'forest',
    label: 'Forest Night',
    description: 'Natural green tones for reduced eye strain',
    icon: Trees,
    colors: {
      primary: '#0f1419',
      secondary: '#1a2e1a',
      accent: '#10b981',
    },
  },
];

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, animationsEnabled, setAnimationsEnabled } = useTheme();
  const currentTheme = themeOptions.find(t => t.value === theme) || themeOptions[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="glass-button hover-glow focus-glow animate-fade-in"
        >
          <CurrentIcon className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{currentTheme.label}</span>
          <Settings className="h-3 w-3 ml-2 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="glass-card border-glow animate-slide-in-up w-64"
      >
        <DropdownMenuLabel className="gradient-text-subtle">
          Choose Your Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`
                cursor-pointer hover-lift focus-glow p-3 rounded-lg
                ${isSelected ? 'bg-primary/10 border border-primary/20' : ''}
              `}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className="flex-shrink-0">
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium text-sm ${
                      isSelected ? 'text-primary gradient-text-primary' : 'text-foreground'
                    }`}>
                      {option.label}
                    </h4>
                    
                    <div className="flex space-x-1 ml-2">
                      {Object.values(option.colors).map((color, index) => (
                        <div
                          key={index}
                          className="w-3 h-3 rounded-full border border-white/20 animate-soft-pulse"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuCheckboxItem
          checked={animationsEnabled}
          onCheckedChange={setAnimationsEnabled}
          className="hover-glow focus-glow"
        >
          <div className="flex items-center space-x-2">
            <div className="animate-gentle-float">
              ✨
            </div>
            <div>
              <div className="font-medium text-sm">Smooth Animations</div>
              <div className="text-xs text-muted-foreground">
                Enable eye-friendly transitions and effects
              </div>
            </div>
          </div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;