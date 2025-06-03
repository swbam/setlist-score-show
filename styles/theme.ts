export const theme = {
  colors: {
    // Teal gradient colors
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6', // Primary teal
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    cyan: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4', // Primary cyan
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
    // Gradient definitions
    gradients: {
      primary: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
      hover: 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
      active: 'linear-gradient(135deg, #134e4a 0%, #0c4a6e 100%)',
      text: 'linear-gradient(135deg, #5eead4 0%, #67e8f9 100%)',
    },
  },
  animations: {
    // Animation durations
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    // Easing functions
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  shadows: {
    teal: {
      sm: '0 1px 2px 0 rgba(20, 184, 166, 0.05)',
      DEFAULT: '0 1px 3px 0 rgba(20, 184, 166, 0.1), 0 1px 2px 0 rgba(20, 184, 166, 0.06)',
      md: '0 4px 6px -1px rgba(20, 184, 166, 0.1), 0 2px 4px -1px rgba(20, 184, 166, 0.06)',
      lg: '0 10px 15px -3px rgba(20, 184, 166, 0.1), 0 4px 6px -2px rgba(20, 184, 166, 0.05)',
      xl: '0 20px 25px -5px rgba(20, 184, 166, 0.1), 0 10px 10px -5px rgba(20, 184, 166, 0.04)',
    },
  },
}

// CSS-in-JS utilities
export const gradientText = {
  background: theme.colors.gradients.text,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

export const gradientBackground = {
  background: theme.colors.gradients.primary,
  transition: `background ${theme.animations.duration.normal} ${theme.animations.easing.default}`,
  '&:hover': {
    background: theme.colors.gradients.hover,
  },
  '&:active': {
    background: theme.colors.gradients.active,
  },
}

export const glowEffect = {
  boxShadow: `0 0 20px rgba(20, 184, 166, 0.3), 0 0 40px rgba(6, 182, 212, 0.2)`,
}

export const cardHover = {
  transition: `all ${theme.animations.duration.normal} ${theme.animations.easing.default}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows.teal.xl,
  },
}