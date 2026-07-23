import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './utils.js';

gsap.registerPlugin(ScrollTrigger);

export function initScroll() {
  if (prefersReducedMotion()) {
    document.querySelectorAll('.reveal-up').forEach((el) => el.classList.add('revealed'));
    document.querySelectorAll('.site-skill-bar-fill').forEach((el) => {
      el.style.width = `${el.dataset.pct}%`;
    });
    return;
  }

  const lenis = new Lenis({ smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('.reveal-up').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.8, delay: (i % 6) * 0.05, ease: 'power3.out' });
        el.classList.add('revealed');
      },
    });
  });

  document.querySelectorAll('.site-skill-bar-fill').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => {
        gsap.to(el, { width: `${el.dataset.pct}%`, duration: 1, ease: 'power2.out' });
      },
    });
  });
}
