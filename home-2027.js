/* D.P. Accounting Solutions — Home 2027
   Ζωντανό «τερματικό» ροής εργασιών στο τεχνολογικό section. */
(() => {
  'use strict';
  const body = document.getElementById('termBody');
  if (!body) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* Σενάριο ροής: [κείμενο, χρώμα κατάληξης] — καθαρά ενδεικτική απεικόνιση */
  const SCRIPT = [
    ['<span class="t-dim">$</span> dp-flow start <span class="t-dim">--period=τρέχουσα</span>', null],
    ['▸ λήψη παραστατικών από πελάτη', 'ok'],
    ['▸ ταξινόμηση &amp; έλεγχος πληρότητας', 'ok'],
    ['▸ καταχώριση στο ERP', 'ok'],
    ['▸ χαρακτηρισμός εγγραφών', 'ok'],
    ['▸ διαβίβαση στο myDATA', 'validated'],
    ['▸ συμφωνία ΦΠΑ περιόδου', 'ok'],
    ['▸ έλεγχος προθεσμιών επόμενου μήνα', 'ok'],
    ['<span class="t-gold">✦ ροή ολοκληρώθηκε — η εικόνα σας είναι ενημερωμένη</span>', null],
  ];
  const suffix = kind =>
    kind === 'ok' ? ' <span class="t-dim">…</span> <span class="t-ok">OK</span>'
    : kind === 'validated' ? ' <span class="t-dim">…</span> <span class="t-ok">ΕΠΙΚΥΡΩΘΗΚΕ</span>'
    : '';

  /* Χωρίς κίνηση: στατική πλήρης λίστα */
  if (reduce.matches) {
    body.innerHTML = SCRIPT.map(([t, k]) => `<span class="term-line">${t}${suffix(k)}</span>`).join('');
    return;
  }

  let idx = 0, timer = 0, running = false;
  const caret = '<span class="term-caret"></span>';

  const step = () => {
    if (!running) return;
    if (idx >= SCRIPT.length) {
      /* Μικρή παύση με όλα ορατά, μετά επανεκκίνηση του βρόχου */
      timer = setTimeout(() => { body.innerHTML = ''; idx = 0; step(); }, 5200);
      return;
    }
    const [text, kind] = SCRIPT[idx];
    const line = document.createElement('span');
    line.className = 'term-line';
    body.querySelector('.term-caret')?.remove();
    line.innerHTML = text + (kind ? ' <span class="t-dim">…</span>' : '') + caret;
    body.appendChild(line);
    idx += 1;
    if (kind) {
      timer = setTimeout(() => {
        if (!running) return;
        line.innerHTML = text + suffix(kind) + caret;
        timer = setTimeout(step, 260 + Math.random() * 340);
      }, 420 + Math.random() * 520);
    } else {
      timer = setTimeout(step, 620);
    }
  };

  const start = () => { if (!running) { running = true; step(); } };
  const stop = () => { running = false; clearTimeout(timer); };

  /* Τρέχει μόνο όσο το τερματικό είναι ορατό */
  new IntersectionObserver(entries => {
    entries[entries.length - 1].isIntersecting && !document.hidden ? start() : stop();
  }, { threshold: 0.25 }).observe(body);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  reduce.addEventListener?.('change', e => {
    if (!e.matches) return;
    stop();
    body.innerHTML = SCRIPT.map(([t, k]) => `<span class="term-line">${t}${suffix(k)}</span>`).join('');
  });
})();
