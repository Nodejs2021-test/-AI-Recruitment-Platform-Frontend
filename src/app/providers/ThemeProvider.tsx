import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider.js';
import { useLocation } from 'react-router-dom';
import { hexToHslSpace } from '@/utils/theme.js';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode, themeSettings } = useAuth();
  const location = useLocation();

  useEffect(() => {
    let appliedMode = themeMode;
    let customApplied = false;

    if (themeSettings) {
      const isDashboard = location.pathname.startsWith('/hr-dashboard') || location.pathname.startsWith('/applicant-details');
      const applyTo = themeSettings.applyTo || 'BOTH';

      const shouldApply = 
        applyTo === 'BOTH' ||
        (applyTo === 'PORTAL' && !isDashboard) ||
        (applyTo === 'DASHBOARD' && isDashboard);

      if (shouldApply && themeMode === (themeSettings.mode || 'dark')) {
        customApplied = true;
        appliedMode = themeSettings.mode || 'dark';

        const mappings: Record<string, string> = {
          '--primary': themeSettings.primaryColor,
          '--secondary': themeSettings.secondaryColor,
          '--background': themeSettings.backgroundColor,
          '--foreground': themeSettings.textColor,
          '--card': themeSettings.cardColor,
          '--card-foreground': themeSettings.textColor,
          '--popover': themeSettings.cardColor,
          '--popover-foreground': themeSettings.textColor,
          '--destructive': themeSettings.errorColor,
          '--border': themeSettings.secondaryColor,
          '--ring': themeSettings.primaryColor,
        };

        Object.entries(mappings).forEach(([variable, hex]) => {
          if (hex) {
            try {
              const hslSpace = hexToHslSpace(hex);
              document.documentElement.style.setProperty(variable, hslSpace);
            } catch (e) {
              console.error(`Failed to apply color ${hex} to ${variable}`, e);
            }
          }
        });
      }
    }

    if (!customApplied) {
      // Clear custom properties so index.css defaults are used
      const variablesToClear = [
        '--primary', '--secondary', '--background', '--foreground',
        '--card', '--card-foreground', '--popover', '--popover-foreground',
        '--destructive', '--border', '--ring'
      ];
      variablesToClear.forEach(v => document.documentElement.style.removeProperty(v));
    }

    // Apply the active mode (dark/light)
    if (appliedMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode, themeSettings, location.pathname]);

  return <>{children}</>;
};
