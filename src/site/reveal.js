/* ================================================================
   Motion system.

   Deliberately dependency-free: IntersectionObserver for reveals and
   one rAF-throttled scroll listener for parallax. No scroll library,
   so native scrolling, anchors, history and keyboard navigation keep
   working exactly as the browser intends.

   Every effect here is a no-op under prefers-reduced-motion.
   ================================================================ */

import { prefersReducedMotion, clamp } from '../utils.js';

/* ── Reveal on scroll ────────────────────────────────────────── */
export function initReveals(root = document) {
  const targets = root.querySelectorAll('[data-reveal]');
  if (!targets.length) return () => {};

  /* Reduced motion (or no IO support): show everything immediately. */
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-revealed'));
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-revealed');
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  );

  targets.forEach((el) => {
    /* Elements already on screen at load reveal on the next frame so
       the transition still plays rather than snapping in. */
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      requestAnimationFrame(() => el.classList.add('is-revealed'));
    } else {
      io.observe(el);
    }
  });

  return () => io.disconnect();
}

/* ── Parallax ──────────────────────────────────────────────────
   Elements opt in with data-parallax="<speed>"; speed is a
   multiplier on how far the element travels as its section
   crosses the viewport. */
export function initParallax() {
  const items = Array.from(document.querySelectorAll('[data-parallax]'));
  if (!items.length || prefersReducedMotion()) return () => {};

  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;

    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;

      const speed = parseFloat(el.dataset.parallax) || 0.1;
      /* -1 (below viewport) → 1 (above viewport) */
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const shift = clamp(progress * speed * -100, -120, 120);

      el.style.setProperty('--parallax-y', `${shift.toFixed(2)}px`);
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

/* ── Fixed nav state ───────────────────────────────────────────
   The bar blends into the hero, then gains a backdrop once the
   hero is behind us. */
export function initNavScroll() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return () => {};

  let ticking = false;

  function update() {
    ticking = false;
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  return () => window.removeEventListener('scroll', onScroll);
}

/* ── Pointer-follow on large surfaces (desktop, fine pointer only) */
export function initPointerTilt(root = document) {
  if (prefersReducedMotion()) return () => {};
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};

  const cleanups = [];

  root.querySelectorAll('[data-tilt]').forEach((el) => {
    const strength = parseFloat(el.dataset.tilt) || 6;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--tilt-x', `${(-py * strength).toFixed(2)}px`);
      el.style.setProperty('--tilt-y', `${(px * strength).toFixed(2)}px`);
    }

    function onLeave() {
      el.style.setProperty('--tilt-x', '0px');
      el.style.setProperty('--tilt-y', '0px');
    }

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/* ── Running footer marquee ───────────────────────────────────
   The track is duplicated in markup; this only moves the offset and
   pauses on hover / when off-screen. */
export function initMarquee() {
  const root = document.querySelector('[data-marquee]');
  if (!root) return () => {};

  if (prefersReducedMotion()) {
    root.classList.add('is-static');
    return () => {};
  }

  const track = root.querySelector('[data-marquee-track]');
  if (!track) return () => {};

  let offset = 0;
  let speed = 0.35;
  let raf = null;

  /* Measure one copy of the content so the loop point is exact. */
  const halfWidth = () => track.scrollWidth / 2;

  function step() {
    offset -= speed;
    if (offset <= -halfWidth()) offset += halfWidth();
    track.style.transform = `translate3d(${offset.toFixed(2)}px,0,0)`;
    raf = requestAnimationFrame(step);
  }

  function start() { if (raf === null) raf = requestAnimationFrame(step); }
  function stop() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }
  /* Track length changes on resize, so restart from a valid offset. */
  function onResize() { stop(); offset = 0; start(); }

  /* Only animate while visible — no render loop off-screen. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 }
    );
    io.observe(root);
  } else {
    start();
  }

  root.addEventListener('pointerenter', stop);
  root.addEventListener('pointerleave', start);
  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    stop();
    io?.disconnect();
    root.removeEventListener('pointerenter', stop);
    root.removeEventListener('pointerleave', start);
    window.removeEventListener('resize', onResize);
  };
}
