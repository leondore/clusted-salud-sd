import { z, defineCollection } from 'astro:content';

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.string(),
    author: z.enum(['HUBHealth', 'CSSD']),
    blurb: z.string(),
    image: z.string(),
  }),
});

export const collections = {
  noticias: newsCollection,
};
