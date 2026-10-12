import { useEffect } from 'react';

// Reference counter to handle stacked or simultaneous modals cleanly
let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalPaddingRight = '';

/**
 * useBodyScrollLock
 * Prevents backdrop and window background scrolling when a modal or drawer is active.
 *
 * @param {boolean} isLocked - Whether the scroll lock is active.
 */
export function useBodyScrollLock(isLocked = true) {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return;

    if (lockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      // Compensate for scrollbar removal to prevent layout shift
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('body-scroll-locked');
      document.documentElement.classList.add('body-scroll-locked');
    }

    lockCount += 1;

    // Intercept scroll wheel events outside interactive modal dialogs
    const handleWheel = (e) => {
      const isInsideDialog = e.target.closest('[role="dialog"], [data-modal-dialog]');
      if (!isInsideDialog) {
        e.preventDefault();
      }
    };

    // Intercept touch movement outside interactive modal dialogs
    const handleTouchMove = (e) => {
      const isInsideDialog = e.target.closest('[role="dialog"], [data-modal-dialog]');
      if (!isInsideDialog) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);

      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalBodyOverflow || '';
        document.documentElement.style.overflow = originalHtmlOverflow || '';
        document.body.style.paddingRight = originalPaddingRight || '';
        document.body.classList.remove('body-scroll-locked');
        document.documentElement.classList.remove('body-scroll-locked');
      }
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
