import { useEffect, RefObject } from 'react';

const EASE_SCAN = 'cubic-bezier(.45,0,.25,1)';
const EASE_OUT = 'cubic-bezier(.2,.7,.2,1)';

export function useScanReveal(rootRef: RefObject<HTMLElement>, isActive: boolean, activationKey: number) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !isActive) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const anims: Animation[] = [];
    const content = root.querySelector<HTMLElement>('[data-scan-content]');
    const line = root.querySelector<HTMLElement>('[data-scan-line]');
    const lock = root.querySelector<HTMLElement>('[data-scan-lock]');
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-scan-target]'));
    const sharpen = Array.from(root.querySelectorAll<HTMLElement>('[data-scan-target],[data-scan-sharpen]'));
    const late = Array.from(root.querySelectorAll<HTMLElement>('[data-scan-late]'))
      .sort((a, b) => Number(a.dataset.scanLate) - Number(b.dataset.scanLate));

    // 1. Red scan line reveal on content
    if (content) {
      anims.push(
        content.animate(
          [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
          { duration: 1200, easing: EASE_SCAN, fill: 'backwards' }
        )
      );
    }

    // 2. Red laser line sweep
    if (line) {
      anims.push(
        line.animate(
          [{ top: '0%', opacity: 1 }, { top: '85%', opacity: 1, offset: 0.85 }, { top: '100%', opacity: 0 }],
          { duration: 1200, easing: EASE_SCAN, fill: 'both' }
        )
      );
    }

    // Accurate calculation of target bounds across all target elements
    const updateLockBox = () => {
      if (!lock || targets.length === 0 || !root) return;
      const r = root.getBoundingClientRect();
      let minLeft = Infinity;
      let minTop = Infinity;
      let maxRight = -Infinity;
      let maxBottom = -Infinity;

      targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          minLeft = Math.min(minLeft, rect.left);
          minTop = Math.min(minTop, rect.top);
          maxRight = Math.max(maxRight, rect.right);
          maxBottom = Math.max(maxBottom, rect.bottom);
        }
      });

      if (!isFinite(minLeft) || !isFinite(maxRight)) return;

      const pad = window.innerWidth < 768 ? 12 : 16;
      const targetLeft = minLeft - r.left;
      const targetTop = minTop - r.top;
      const targetRight = maxRight - r.left;
      const targetBottom = maxBottom - r.top;
      const rootWidth = r.width;
      const rootHeight = r.height;

      const left = Math.max(12, targetLeft - pad);
      const top = Math.max(40, targetTop - pad);
      const rightEdge = Math.min(rootWidth - 12, targetRight + pad);
      const bottomEdge = Math.min(rootHeight - 12, targetBottom + pad);

      const width = Math.max(0, rightEdge - left);
      const height = Math.max(0, bottomEdge - top);

      lock.style.left = `${Math.round(left)}px`;
      lock.style.top = `${Math.round(top)}px`;
      lock.style.width = `${Math.round(width)}px`;
      lock.style.height = `${Math.round(height)}px`;
    };

    // 3. Initial positioning in requestAnimationFrame
    let raf = requestAnimationFrame(() => {
      updateLockBox();
    });

    // 4. Exact positioning at 900ms when entrance transforms settle and focus lock fires
    const lockTimer = setTimeout(() => {
      updateLockBox();
      if (lock) {
        anims.push(
          lock.animate(
            [
              { transform: 'scale(1.35)', opacity: 0 },
              { transform: 'scale(1)', opacity: 1, offset: 0.4 },
              { opacity: 0.2, offset: 0.55 },
              { opacity: 1, offset: 0.65 },
              { opacity: 0.2, offset: 0.75 },
              { opacity: 1, offset: 0.85 },
              { opacity: 1, offset: 0.92 },
              { opacity: 0 },
            ],
            { duration: 2600, easing: EASE_OUT, fill: 'both' }
          )
        );
      }
    }, 900);

    // 5. Sharpen target images
    sharpen.forEach((el) => {
      const base = getComputedStyle(el).filter;
      const pre = base === 'none' ? '' : base + ' ';
      anims.push(
        el.animate(
          [{ filter: pre + 'blur(10px)', opacity: 0.3 }, { filter: base === 'none' ? 'blur(0px)' : base, opacity: 1 }],
          { duration: 900, delay: 1100, easing: EASE_OUT, fill: 'backwards' }
        )
      );
    });

    // 6. Staggered reveal for spec cards, buttons and badges
    late.forEach((el, i) => {
      const n = Number(el.dataset.scanLate);
      const isChip = el.dataset.scanChip === 'true';
      anims.push(
        el.animate(
          [{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }],
          { duration: 600, delay: isChip ? 1900 + i * 30 : 1200 + n * 80, easing: EASE_OUT, fill: 'backwards' }
        )
      );
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(lockTimer);
      anims.forEach((a) => a.cancel());
    };
  }, [isActive, activationKey]);
}
