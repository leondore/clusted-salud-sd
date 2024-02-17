import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Raleway Variable', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: '#0f718c',
        secondary: {
          DEFAULT: '#53c3dd',
          hover: '#65c9e0',
          light: '#73d1e7',
        },
        accent: '#f15b5a',
      },
    },
  },
  plugins: [],
} satisfies Config;
