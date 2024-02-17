/// <reference types="astro/client" />

interface Window {
  Alpine: import('alpinejs').Alpine;
}

declare module '@alpinejs/collapse';
