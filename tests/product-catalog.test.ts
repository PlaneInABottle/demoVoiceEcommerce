import test from 'node:test';
import assert from 'node:assert/strict';

import { getProductBySlug, loadProductCatalog, normalizeCatalogQuery, searchProducts } from '../agent/catalog.js';

test('normalizeCatalogQuery trims and lowercases freeform input', () => {
  assert.equal(normalizeCatalogQuery('  Noise Cancelling  '), 'noise cancelling');
});

test('loadProductCatalog reads the shared root catalog file', async () => {
  const products = await loadProductCatalog();

  assert.ok(products.length >= 6);
  assert.ok(
    products.every(
      (product) =>
        product.id &&
        product.slug &&
        product.name &&
        product.shippingSummary &&
        product.supportPolicy,
    ),
  );
});

test('getProductBySlug finds an exact catalog entry', async () => {
  const products = await loadProductCatalog();
  const product = getProductBySlug(products, 'quietcore-200');

  assert.ok(product);
  assert.equal(product?.name, 'QuietCore 200 Headphones');
});

test('searchProducts ranks deterministic matches ahead of weaker matches', async () => {
  const products = await loadProductCatalog();
  const results = searchProducts(products, 'travel');

  assert.equal(results[0]?.slug, 'travel-gan-100');
  assert.ok(results.some((product) => product.slug === 'quietcore-200'));
});

test('searchProducts returns no matches for blank input', async () => {
  const products = await loadProductCatalog();

  assert.deepEqual(searchProducts(products, '   '), []);
});

test('searchProducts includes grounded shipping text in matching fields', async () => {
  const products = await loadProductCatalog();
  const results = searchProducts(products, 'overnight shipping');

  assert.equal(results[0]?.slug, 'travel-gan-100');
});
