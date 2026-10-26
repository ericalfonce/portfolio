import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatEastAfricaTime, initEastAfricaClock } from './east-africa-time.js';

afterEach(() => vi.useRealTimers());

describe('East Africa Time footer clock', () => {
  it('formats time in UTC+3 regardless of the host timezone', () => {
    expect(formatEastAfricaTime(new Date('2026-01-01T00:00:00.000Z'))).toBe('03:00:00 EAT');
  });

  it('renders immediately and updates every second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    document.body.innerHTML = '<time data-eat-time></time>';

    const stop = initEastAfricaClock();
    const clock = document.querySelector('[data-eat-time]');
    expect(clock.textContent).toBe('15:00:00 EAT');

    vi.advanceTimersByTime(1_000);
    expect(clock.textContent).toBe('15:00:01 EAT');
    expect(clock.getAttribute('datetime')).toBe('2026-01-01T12:00:01.000Z');
    stop();
  });
});
