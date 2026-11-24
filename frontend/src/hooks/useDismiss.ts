import { useEffect, useEffectEvent } from 'react';
import type { RefObject } from 'react';

/**
 * Calls `onDismiss` when the user presses Escape or interacts outside
 * `containerRef` while `open` is true. The document listeners are a genuine
 * external subscription, which is why this uses an effect.
 */
export function useDismiss(
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: (reason: 'escape' | 'outside') => void,
): void {
  const dismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const container = containerRef.current;
      if (container && event.target instanceof Node && !container.contains(event.target)) {
        dismiss('outside');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss('escape');
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, open]);
}
