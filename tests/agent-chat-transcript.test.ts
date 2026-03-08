import assert from 'node:assert/strict';
import test from 'node:test';

import { isScrolledNearBottom, scrollElementToBottom } from '@/components/agents-ui/agent-chat-transcript';

test('isScrolledNearBottom returns true when the user is at the bottom', () => {
  assert.equal(
    isScrolledNearBottom({
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 300,
    }),
    true,
  );
});

test('isScrolledNearBottom returns true when the user is within the bottom threshold', () => {
  assert.equal(
    isScrolledNearBottom({
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 286,
    }),
    true,
  );
});

test('isScrolledNearBottom returns false when the user scrolls away from the bottom', () => {
  assert.equal(
    isScrolledNearBottom({
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 260,
    }),
    false,
  );
});

test('scrollElementToBottom updates only the container scrollTop', () => {
  const element = {
    scrollHeight: 500,
    scrollTop: 120,
  };

  scrollElementToBottom(element);

  assert.equal(element.scrollTop, 500);
});
