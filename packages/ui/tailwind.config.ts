import type { Config } from 'tailwindcss'
import sharedConfig from '@setlist/config/tailwind.config'

const config: Config = {
  ...sharedConfig,
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    ...sharedConfig.theme,
    extend: {
      ...sharedConfig.theme?.extend,
      colors: {
        ...sharedConfig.theme?.extend?.colors,
        // Teal gradient theme colors
        primary: {
          DEFAULT: 'hsl(173, 80%, 40%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        accent: {
          DEFAULT: 'hsl(172, 66%, 50%)',
          foreground: 'hsl(0, 0%, 9%)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
        'gradient-hover': 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
        'gradient-active': 'linear-gradient(135deg, #134e4a 0%, #0c4a6e 100%)',
      },
    },
  },
}

export default config