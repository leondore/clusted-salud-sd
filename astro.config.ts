import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import alpinejs from '@astrojs/alpinejs';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  integrations: [
    tailwind(),
    alpinejs({
      entrypoint: '/src/alpine',
    }),
  ],
  adapter: vercel(),
});
