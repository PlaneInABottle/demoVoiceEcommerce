import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { RefactorShellHeader } from '@/components/refactor-ui/refactor-shell-header';

function collectText(node: unknown): string {
  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join('');
  }

  if (node && typeof node === 'object' && 'props' in node) {
    return collectText((node as { props?: { children?: unknown } }).props?.children);
  }

  return '';
}

const agentPanePath = new URL('../components/refactor-ui/refactor-agent-pane.tsx', import.meta.url);
const globalsCssPath = new URL('../app/globals.css', import.meta.url);
const layoutPath = new URL('../app/layout.tsx', import.meta.url);
const productSidebarPath = new URL('../components/product-sidebar.tsx', import.meta.url);

test('RefactorShellHeader uses final-state dark workspace copy', () => {
  const tree = RefactorShellHeader({ appName: 'DemoVoice', roomName: 'room-123' });
  const text = collectText(tree);

  assert.match(text, /Dark voice workspace/);
  assert.doesNotMatch(text, /Dark refactor preview/);
});

test('refactor agent pane source is dark-only', () => {
  const source = readFileSync(agentPanePath, 'utf8');

  assert.doesNotMatch(source, /useTheme/);
  assert.doesNotMatch(source, /useState/);
  assert.doesNotMatch(source, /useEffect/);
  assert.doesNotMatch(source, /resolvedTheme/);
  assert.doesNotMatch(source, /mounted/);
  assert.doesNotMatch(source, /Light-tuned/);
  assert.match(source, /Dark-tuned reactive visual fallback/);
});

test('legacy product sidebar file and styles are removed', () => {
  assert.equal(existsSync(productSidebarPath), false);

  const css = readFileSync(globalsCssPath, 'utf8');

  assert.doesNotMatch(css, /sidebar-panel/);
  assert.doesNotMatch(css, /product-card/);
  assert.doesNotMatch(css, /panel__header/);
  assert.doesNotMatch(css, /helper-copy/);
});

test('root layout is dark-only without next-themes plumbing', () => {
  const source = readFileSync(layoutPath, 'utf8');

  assert.match(source, /export const viewport/);
  assert.match(source, /colorScheme: 'dark'/);
  assert.match(source, /themeColor: 'oklch\(0\.14 0\.03 258\)'/);
  assert.match(source, /<html lang="en" className="dark">/);
  assert.doesNotMatch(source, /ThemeProvider/);
  assert.doesNotMatch(source, /suppressHydrationWarning/);
});

test('globals css keeps a single canonical dark palette', () => {
  const css = readFileSync(globalsCssPath, 'utf8');

  assert.match(css, /:root\s*\{/);
  assert.match(css, /color-scheme: dark/);
  assert.doesNotMatch(css, /\.dark\s*\{/);
});
