import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#785600',
        'on-primary': '#ffffff',
        'primary-fixed': '#ffdea6',
        'primary-fixed-dim': '#f7bd48',
        'primary-container': '#986d00',
        secondary: '#5f5e5e',
        'on-secondary': '#ffffff',
        'secondary-container': '#e5e1e0',
        'on-surface': '#1a1c1b',
        surface: '#f9f9f7',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f4f4f2',
        'surface-container': '#eeeeec',
        'surface-container-high': '#e8e8e6',
        'surface-container-highest': '#e2e3e1',
        outline: '#817563',
        'outline-variant': '#d3c4af',
        'inverse-surface': '#2f3130',
        'inverse-on-surface': '#f0f1ef',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'accent-gold': '#B8860B',
        'scrim': '#000000',
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#1a1c1b',
            '--tw-prose-headings': '#1a1c1b',
            '--tw-prose-links': '#785600',
            '--tw-prose-bold': '#1a1c1b',
            '--tw-prose-counters': '#5f5e5e',
            '--tw-prose-bullets': '#817563',
            '--tw-prose-hr': '#d3c4af',
            '--tw-prose-quotes': '#785600',
            '--tw-prose-quote-borders': '#f7bd48',
            '--tw-prose-captions': '#5f5e5e',
            '--tw-prose-code': '#1a1c1b',
            '--tw-prose-pre-code': '#f4f4f2',
            '--tw-prose-pre-bg': '#2f3130',
            '--tw-prose-th-borders': '#d3c4af',
            '--tw-prose-td-borders': '#eeeeec',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
