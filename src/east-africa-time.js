/* Live East Africa Time clock. The explicit IANA timezone keeps the
   footer correct regardless of the visitor's device timezone. */
const EAT_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Dar_es_Salaam',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function formatEastAfricaTime(date = new Date()) {
  return `${EAT_FORMATTER.format(date)} EAT`;
}

export function initEastAfricaClock(root = document) {
  const clock = root.querySelector('[data-eat-time]');
  if (!clock) return () => {};

  const update = () => {
    const now = new Date();
    clock.textContent = formatEastAfricaTime(now);
    clock.setAttribute('datetime', now.toISOString());
  };

  update();
  const timer = setInterval(update, 1_000);
  return () => clearInterval(timer);
}
