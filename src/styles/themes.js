// src/styles/themes.js
export const themes = {
  // Light theme - primary theme for productivity
  light: {
    name: 'Light',
    type: 'light',
    colors: {
      // Primary colors - Material Design Blue
      primary: '#4285f4',
      primaryDark: '#3367d6',
      primaryLight: '#5a95f5',
      
      // Background colors
      background: '#ffffff',
      surface: '#f8f9fa',
      card: '#ffffff',
      
      // Text colors
      text: '#1f2937',
      textSecondary: '#6b7280',
      textTertiary: '#9ca3af',
      
      // Border and divider colors
      border: '#e5e7eb',
      divider: '#f3f4f6',
      
      // Status colors
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      // Study-specific colors
      focus: '#4285f4',
      break: '#10b981',
      productive: '#059669',
      distracted: '#f59e0b',
      
      // Environment status colors
      optimal: '#10b981',
      good: '#3b82f6',
      poor: '#f59e0b',
      critical: '#ef4444',
      
      // Input colors
      placeholder: '#9ca3af',
      inputBackground: '#f9fafb',
      inputBorder: '#d1d5db',
      inputFocus: '#4285f4',
    },
  },

  // Dark theme - for low-light studying
  dark: {
    name: 'Dark',
    type: 'dark',
    colors: {
      // Primary colors
      primary: '#5a95f5',
      primaryDark: '#4285f4',
      primaryLight: '#7dabf8',
      
      // Background colors
      background: '#111827',
      surface: '#1f2937',
      card: '#374151',
      
      // Text colors
      text: '#f9fafb',
      textSecondary: '#d1d5db',
      textTertiary: '#9ca3af',
      
      // Border and divider colors
      border: '#4b5563',
      divider: '#374151',
      
      // Status colors
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      
      // Study-specific colors
      focus: '#5a95f5',
      break: '#34d399',
      productive: '#10b981',
      distracted: '#fbbf24',
      
      // Environment status colors
      optimal: '#34d399',
      good: '#60a5fa',
      poor: '#fbbf24',
      critical: '#f87171',
      
      // Input colors
      placeholder: '#6b7280',
      inputBackground: '#374151',
      inputBorder: '#4b5563',
      inputFocus: '#5a95f5',
    },
  },

  // Focus theme - minimal distractions
  focus: {
    name: 'Focus',
    type: 'light',
    colors: {
      // Minimal color palette
      primary: '#6366f1',
      primaryDark: '#4f46e5',
      primaryLight: '#818cf8',
      
      // Neutral backgrounds
      background: '#fafafa',
      surface: '#f5f5f5',
      card: '#ffffff',
      
      // Subtle text colors
      text: '#374151',
      textSecondary: '#6b7280',
      textTertiary: '#9ca3af',
      
      // Minimal borders
      border: '#e5e7eb',
      divider: '#f3f4f6',
      
      // Essential status colors only
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7',
      
      // Study colors
      focus: '#6366f1',
      break: '#059669',
      productive: '#047857',
      distracted: '#d97706',
      
      // Environment colors
      optimal: '#059669',
      good: '#0284c7',
      poor: '#d97706',
      critical: '#dc2626',
      
      // Input colors
      placeholder: '#9ca3af',
      inputBackground: '#ffffff',
      inputBorder: '#d1d5db',
      inputFocus: '#6366f1',
    },
  },
};

// Default theme
export const defaultTheme = themes.light;

// Helper function to get theme by name
export const getTheme = (themeName) => {
  return themes[themeName] || defaultTheme;
};