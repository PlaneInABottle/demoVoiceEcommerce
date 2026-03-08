import { llm } from '@livekit/agents';
import { z } from 'zod';

import { loadProductCatalog, searchProducts } from '../catalog.js';

export function createSearchProductsTool() {
  return llm.tool({
    description:
      'Search the static demo catalog for products that match a shopper request and optional budget.',
    parameters: z.object({
      query: z.string().min(1).describe('The shopper request or product need to search for'),
      maxPrice: z
        .number()
        .nullable()
        .describe('Optional maximum budget in USD. Use null when the shopper did not give a budget'),
    }),
    execute: async ({ query, maxPrice }) => {
      const catalog = await loadProductCatalog();
      const matches = searchProducts(catalog, query, 5).filter((product) =>
        maxPrice === null ? true : product.price <= maxPrice,
      );

      console.info(
        `[worker] tool:search_products query="${query}" maxPrice=${maxPrice ?? 'none'} matches=${matches.length}`,
      );

      return matches.map((product) => ({
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        summary: product.summary,
      }));
    },
  });
}
