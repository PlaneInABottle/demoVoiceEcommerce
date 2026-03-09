const SCROLL_BOTTOM_THRESHOLD_PX = 16;

export function isScrolledNearBottom(element: Pick<HTMLDivElement, 'scrollHeight' | 'clientHeight' | 'scrollTop'>) {
  return Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) <= SCROLL_BOTTOM_THRESHOLD_PX;
}

export function scrollElementToBottom(element: Pick<HTMLDivElement, 'scrollHeight' | 'scrollTop'>) {
  element.scrollTop = element.scrollHeight;
}
