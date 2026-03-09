import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { ShellHeader } from '@/components/demo-ui/shell-header';

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

const agentPanePath = new URL('../components/demo-ui/agent-pane.tsx', import.meta.url);
const globalsCssPath = new URL('../app/globals.css', import.meta.url);
const layoutPath = new URL('../app/layout.tsx', import.meta.url);
const productSidebarPath = new URL('../components/product-sidebar.tsx', import.meta.url);
const demoShellPath = new URL('../components/demo-shell.tsx', import.meta.url);
const buttonPath = new URL('../components/ui/button.tsx', import.meta.url);
const inputPath = new URL('../components/ui/input.tsx', import.meta.url);

test('ShellHeader uses final-state dark workspace copy', () => {
  const tree = ShellHeader({ appName: 'DemoVoice', roomName: 'room-123' });
  const text = collectText(tree);

  assert.match(text, /Dark voice workspace/);
  assert.doesNotMatch(text, /Dark refactor preview/);
});

test('agent pane source uses the official aura visualizer', () => {
  const source = readFileSync(agentPanePath, 'utf8');

  assert.match(source, /AgentAudioVisualizerAura/);
  assert.match(source, /Official Agents UI audio visualizer/);
  assert.doesNotMatch(source, /Premium presence surface/);
  assert.doesNotMatch(source, /Dark-tuned reactive visual fallback/);
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

test('root layout skip link targets the main landmark with visible focus', () => {
  const source = readFileSync(layoutPath, 'utf8');
  const demoShellSource = readFileSync(demoShellPath, 'utf8');
  const css = readFileSync(globalsCssPath, 'utf8');

  assert.match(source, /href="#main-content"/);
  assert.match(demoShellSource, /<main/);
  assert.match(demoShellSource, /id="main-content"/);
  assert.match(demoShellSource, /tabIndex=\{-1\}/);
  assert.match(css, /#main-content:focus,/);
  assert.match(css, /#main-content:focus-visible,/);
  assert.match(css, /#main-content:target \{/);
  assert.doesNotMatch(css, /#main-content:focus\s*\{\s*outline: none;/);
});

test('shared button and input primitives avoid transition-all', () => {
  const buttonSource = readFileSync(buttonPath, 'utf8');
  const inputSource = readFileSync(inputPath, 'utf8');

  assert.doesNotMatch(buttonSource, /transition-all/);
  assert.doesNotMatch(inputSource, /transition-all/);
});
