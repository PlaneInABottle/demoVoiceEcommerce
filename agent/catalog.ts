import { readFile } from 'node:fs/promises';
import { z } from 'zod';

import { getProductCatalogPath } from './runtime-paths.js';

export type ProductCatalogItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  summary: string;
  tags: string[];
  features: string[];
  supportPolicy: string;
};

let productCatalogCache: ProductCatalogItem[] | null = null;
const productCatalogItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)),
  features: z.array(z.string().min(1)),
  supportPolicy: z.string().min(1),
});
const productCatalogSchema = z.array(productCatalogItemSchema);

export function normalizeCatalogQuery(query: string) {
  return query.trim().toLowerCase();
}

export async function loadProductCatalog() {
  if (productCatalogCache) {
    return productCatalogCache;
  }

  const fileContents = await readFile(getProductCatalogPath(), 'utf8');
  const parsedCatalog = productCatalogSchema.parse(JSON.parse(fileContents));
  productCatalogCache = parsedCatalog;
  return parsedCatalog;
}

function scoreProductMatch(product: ProductCatalogItem, normalizedQuery: string) {
  if (!normalizedQuery) {
    return 0;
  }

  const haystacks = [
    product.name,
    product.summary,
    product.category,
    ...product.tags,
    ...product.features,
  ].map((value) => value.toLowerCase());

  return haystacks.reduce((score, value) => {
    if (value === normalizedQuery) {
      return score + 5;
    }

    if (value.includes(normalizedQuery)) {
      return score + 2;
    }

    return score;
  }, 0);
}

export function getProductBySlug(products: ProductCatalogItem[], slug: string) {
  const normalizedSlug = normalizeCatalogQuery(slug);
  return products.find((product) => product.slug.toLowerCase() === normalizedSlug);
}

export function searchProducts(
  products: ProductCatalogItem[],
  query: string,
  limit = 3,
) {
  const normalizedQuery = normalizeCatalogQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  return [...products]
    .map((product) => ({
      product,
      score: scoreProductMatch(product, normalizedQuery),
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.product.price - right.product.price;
    })
    .slice(0, limit)
    .map((result) => result.product);
}
