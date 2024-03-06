import { z, defineCollection } from 'astro:content';

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    author: z.enum(['HUBHealth', 'CSSD']),
    blurb: z.string(),
    image: z.string(),
    link: z.string().url().optional(),
  }),
});

export const collections = {
  noticias: newsCollection,
};
