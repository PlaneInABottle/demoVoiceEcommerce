import { llm } from '@livekit/agents';
import { z } from 'zod';

import { getProductBySlug, loadProductCatalog } from '../catalog.js';

export function createGetProductDetailsTool() {
  return llm.tool({
    description:
      'Get full product details, key features, shipping summary, and support policy for a specific catalog slug.',
    parameters: z.object({
      slug: z.string().min(1).describe('The product slug returned by the product search tool'),
    }),
    execute: async ({ slug }) => {
      const catalog = await loadProductCatalog();
      const product = getProductBySlug(catalog, slug);
      console.info(`[worker] tool:get_product_details slug="${slug}" found=${Boolean(product)}`);

      if (!product) {
        return {
          found: false,
          message: `No product found for slug "${slug}".`,
        };
      }

      return {
        found: true,
        product,
      };
    },
  });
}
