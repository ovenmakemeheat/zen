import {defineCollection} from 'astro:content';
import {glob} from 'astro/loaders';
import {z} from 'astro/zod';
const positive = z.number().int().positive();
export const collections = { lessons: defineCollection({loader:glob({pattern:'*.md',base:'./content'}), schema:z.object({
  id:positive,title:z.string(),subtitle:z.string(),
  subject:z.object({code:z.string().min(1),title:z.string().min(1)}),
  tags:z.array(z.string().min(1)).default([]),
  source:z.string().regex(/^[\w.-]+\.pdf$/).optional(),
  seekTraces:z.array(z.object({label:z.string(),stops:z.array(z.number().int().nonnegative()).min(2)})).min(1).optional(),
  sections:z.array(z.object({title:z.string(),start:positive,end:positive})),
  lab:z.object({title:z.string(),reference:positive,nodes:z.array(z.string()).min(1),frames:z.array(z.object({focus:z.number().int().nonnegative(),states:z.array(z.string()),caption:z.string()})).min(1)}),
  quiz:z.array(z.object({prompt:z.string(),choices:z.array(z.string()).min(2),answer:z.number().int().nonnegative(),explanation:z.string(),slide:positive})).min(1)
})}) };
