// TheSet brand colors based on design examples
export const colors = {
  // Primary brand color - bright teal/green
  primary: {
    DEFAULT: '#00FF88',
    hover: '#00E67A',
    light: '#33FF9F',
    dark: '#00CC6F',
    muted: 'rgba(0, 255, 136, 0.1)',
    subtle: 'rgba(0, 255, 136, 0.05)'
  },
  
  // Backgrounds
  background: {
    primary: '#000000',
    secondary: '#0A0A0A',
    tertiary: '#111111',
    card: '#161616',
    hover: '#1A1A1A',
    elevated: '#1F1F1F'
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1A1',
    tertiary: '#666666',
    muted: '#4A4A4A',
    inverse: '#000000'
  },
  
  // Borders
  border: {
    DEFAULT: '#2A2A2A',
    light: '#333333',
    dark: '#1A1A1A',
    focus: '#00FF88'
  },
  
  // Status colors
  status: {
    success: '#00FF88',
    error: '#FF4444',
    warning: '#FFB800',
    info: '#00B8FF'
  }
};

// Tailwind color classes
export const colorClasses = {
  // Backgrounds
  bgPrimary: 'bg-black',
  bgSecondary: 'bg-gray-950',
  bgTertiary: 'bg-gray-900',
  bgCard: 'bg-gray-900/50',
  bgHover: 'hover:bg-gray-800/50',
  
  // Text
  textPrimary: 'text-white',
  textSecondary: 'text-gray-400',
  textTertiary: 'text-gray-500',
  textMuted: 'text-gray-600',
  
  // Brand colors
  brandText: 'text-[#00FF88]',
  brandBg: 'bg-[#00FF88]',
  brandBorder: 'border-[#00FF88]',
  brandHover: 'hover:text-[#00FF88]',
  brandBgHover: 'hover:bg-[#00FF88]',
  
  // Gradients
  brandGradient: 'bg-gradient-to-r from-[#00FF88] to-[#00E67A]',
  darkGradient: 'bg-gradient-to-b from-black to-gray-900',
  cardGradient: 'bg-gradient-to-b from-gray-900/50 to-black/50'
};