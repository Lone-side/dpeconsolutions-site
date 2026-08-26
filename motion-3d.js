/* D.P. Accounting Solutions — 3D Motion Layer
   Starfield με βάθος, 3D scroll reveals, pointer tilt, parallax, magnetic κουμπιά.
   Progressive enhancement: χωρίς JS ή με prefers-reduced-motion δεν αλλάζει τίποτα. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;

  const root = document.documentElement;
  root.classList.add('m3d');
  const fine = matchMedia('(pointer:fine)');
  const wide = matchMedia('(min-width: 781px)');
  const lerp = (a, b, t) => a + (b - a) * t;
  const cleanups = [];

  /* ---------------------------------------------------------------- */
  /* Scroll progress bar + hero parallax                               */
  /* ---------------------------------------------------------------- */
  const bar = document.createElement('div');
  bar.className = 'm3d-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  cleanups.push(() => bar.remove());

  const heroCopy = document.querySelector('.hero .hero-copy');
  const heroVisual = document.querySelector('.hero .hero-visual');
  const pageHeroInner = document.querySelector('.page-hero-inner');
  let scrollQueued = false;
  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const max = root.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      if (!wide.matches) return;
      const y = scrollY;
      if (heroCopy && y < 950) {
        heroCopy.style.transform = `translateY(${(y * 0.16).toFixed(1)}px)`;
        heroCopy.style.opacity = String(Math.max(0, 1 - y / 780));
        heroVisual.style.transform =
          `perspective(1200px) translateY(${(y * 0.06).toFixed(1)}px) rotateX(${Math.min(y * 0.011, 7).toFixed(2)}deg)`;
      }
      if (pageHeroInner && y < 720) {
        pageHeroInner.style.transform = `translateY(${(y * 0.18).toFixed(1)}px)`;
        pageHeroInner.style.opacity = String(Math.max(0, 1 - y / 920));
      }
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------- */
  /* Αυτόματα 3D reveals για στοιχεία χωρίς το υπάρχον .reveal σύστημα */
  /* ---------------------------------------------------------------- */
  const AUTO_REVEAL =
    '.section-head,.tool-card,.info-card,.article-card,.editorial-policy>div,' +
    '.cta-panel,.notice,.faq-list details,.quote,.data-table-wrap,.prose,' +
    '.card-grid>*,.blog-grid>*,.center-card,.legal-layout article section,.feature-list';
  const autoTagged = [];
  const perParent = new Map();
  document.querySelectorAll(AUTO_REVEAL).forEach(el => {
    if (el.classList.contains('reveal') || el.closest('.m3d-reveal')) return;
    el.classList.add('m3d-reveal');
    const i = perParent.get(el.parentElement) || 0;
    el.style.setProperty('--m3d-i', i);
    perParent.set(el.parentElement, i + 1);
    autoTagged.push(el);
  });
  if (autoTagged.length) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      // Ό,τι είναι ήδη πάνω από το viewport (π.χ. άφιξη μέσω anchor) εμφανίζεται αμέσως
      if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    }), { threshold: 0.1, rootMargin: '0px 0px -36px' });
    autoTagged.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------------- */
  /* Κοινός rAF βρόχος για tilt & magnetic                             */
  /* ---------------------------------------------------------------- */
  const jobs = new Set();
  let rafId = 0;
  const loop = () => {
    rafId = 0;
    jobs.forEach(job => { if (!job()) jobs.delete(job); });
    if (jobs.size) rafId = requestAnimationFrame(loop);
  };
  const kick = job => { jobs.add(job); if (!rafId) rafId = requestAnimationFrame(loop); };
  cleanups.push(() => { cancelAnimationFrame(rafId); jobs.clear(); });

  /* ---- Tilt cards με glare ---- */
  const TILT =
    '.system-stack article,.audience-grid article,.contact-form,.firm-portrait,' +
    '.tool-card,.info-card,.article-card,.editorial-policy>div,.cta-panel,.center-card,.quote';
  if (fine.matches) {
    document.querySelectorAll(TILT).forEach(el => {
      const s = { rx: 0, ry: 0, tz: 0, gl: 0, trx: 0, try: 0, ttz: 0, tgl: 0, hot: false };
      const job = () => {
        s.rx = lerp(s.rx, s.trx, 0.14);
        s.ry = lerp(s.ry, s.try, 0.14);
        s.tz = lerp(s.tz, s.ttz, 0.14);
        s.gl = lerp(s.gl, s.tgl, 0.12);
        el.style.setProperty('--m3d-rx', s.rx.toFixed(3) + 'deg');
        el.style.setProperty('--m3d-ry', s.ry.toFixed(3) + 'deg');
        el.style.setProperty('--m3d-tz', s.tz.toFixed(2) + 'px');
        el.style.setProperty('--m3d-glare', s.gl.toFixed(3));
        return s.hot || Math.abs(s.rx) + Math.abs(s.ry) + Math.abs(s.tz) > 0.05;
      };
      el.addEventListener('pointerenter', () => {
        if (reduce.matches) return;
        el.classList.add('m3d-tilt');
        s.hot = true;
        s.ttz = 12;
        s.tgl = 1;
        kick(job);
      });
      el.addEventListener('pointermove', e => {
        if (!s.hot) return;
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        // Ηπιότερη κλίση σε μεγάλα στοιχεία, καμία όταν ο χρήστης πληκτρολογεί μέσα
        const focused = el.matches(':focus-within');
        const maxY = r.width > 620 ? 3 : 7;
        const maxX = r.height > 420 ? 2.6 : 5.5;
        s.try = focused ? 0 : nx * maxY;
        s.trx = focused ? 0 : ny * -maxX;
        el.style.setProperty('--m3d-gx', ((nx + 0.5) * 100).toFixed(1) + '%');
        el.style.setProperty('--m3d-gy', ((ny + 0.5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        s.hot = false;
        s.trx = 0; s.try = 0; s.ttz = 0; s.tgl = 0;
        kick(job);
      });
    });

    /* ---- Magnetic κουμπιά ---- */
    document.querySelectorAll('.button,.nav-cta,.sub-nav-cta,.text-link').forEach(el => {
      const s = { x: 0, y: 0, tx: 0, ty: 0, hot: false };
      const job = () => {
        s.x = lerp(s.x, s.tx, 0.18);
        s.y = lerp(s.y, s.ty, 0.18);
        el.style.setProperty('--m3d-mx', s.x.toFixed(2) + 'px');
        el.style.setProperty('--m3d-my', s.y.toFixed(2) + 'px');
        return s.hot || Math.abs(s.x) + Math.abs(s.y) > 0.05;
      };
      el.addEventListener('pointerenter', () => {
        if (reduce.matches) return;
        el.classList.add('m3d-mag');
        s.hot = true;
        kick(job);
      });
      el.addEventListener('pointermove', e => {
        if (!s.hot) return;
        const r = el.getBoundingClientRect();
        s.tx = Math.max(-8, Math.min(8, (e.clientX - r.left - r.width / 2) * 0.16));
        s.ty = Math.max(-6, Math.min(6, (e.clientY - r.top - r.height / 2) * 0.22)) - 2;
      });
      el.addEventListener('pointerleave', () => {
        s.hot = false;
        s.tx = 0; s.ty = 0;
        kick(job);
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Starfield: σωματίδια με βάθος + γραμμές-αστερισμοί στα hero       */
  /* ---------------------------------------------------------------- */
  const makeStars = (host, density) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'm3d-stars';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    cleanups.push(() => canvas.remove());
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize);

    const N = Math.max(24, Math.min(110, Math.round((w * h) / 14000 * density)));
    const stars = Array.from({ length: N }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: 0.08 + Math.random() * 0.92,
      c: Math.random() < 0.82 ? '40,215,242' : '93,242,194',
      sp: 0.00035 + Math.random() * 0.0007
    }));

    let px = 0, py = 0, tpx = 0, tpy = 0;
    let glow = null, gx = 0, gy = 0, tgx = 0, tgy = 0;
    if (fine.matches) {
      glow = document.createElement('div');
      glow.className = 'm3d-glow';
      glow.setAttribute('aria-hidden', 'true');
      host.appendChild(glow);
      cleanups.push(() => glow.remove());
      host.addEventListener('pointermove', e => {
        const r = host.getBoundingClientRect();
        tpx = (e.clientX - r.left) / r.width - 0.5;
        tpy = (e.clientY - r.top) / r.height - 0.5;
        tgx = e.clientX - r.left;
        tgy = e.clientY - r.top;
        if (!glow.classList.contains('on')) { gx = tgx; gy = tgy; glow.classList.add('on'); }
      });
      host.addEventListener('pointerleave', () => glow.classList.remove('on'));
    }

    let raf = 0, inView = true;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      px = lerp(px, tpx, 0.04);
      py = lerp(py, tpy, 0.04);
      if (glow) {
        gx = lerp(gx, tgx, 0.08);
        gy = lerp(gy, tgy, 0.08);
        glow.style.transform = `translate(${(gx - 270).toFixed(1)}px,${(gy - 270).toFixed(1)}px)`;
      }
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5, cy = h * 0.45;
      const pts = [];
      for (const s of stars) {
        s.z -= s.sp;
        if (s.z <= 0.07) {
          s.z = 1;
          s.x = Math.random() * 2 - 1;
          s.y = Math.random() * 2 - 1;
        }
        const k = 0.55 / s.z;
        const x = cx + s.x * k * cx + px * 52 * (1 - s.z);
        const y = cy + s.y * k * cy + py * 52 * (1 - s.z);
        if (x < -24 || x > w + 24 || y < -24 || y > h + 24) continue;
        pts.push({ x, y, a: Math.min(1, (1 - s.z) * 1.5) * 0.75, r: (1 - s.z) * 2.3 + 0.4, c: s.c });
      }
      ctx.lineWidth = 1;
      const D = 96;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < D * D) {
            const t = (1 - Math.sqrt(d2) / D) * 0.2 * Math.min(pts[i].a, pts[j].a);
            ctx.strokeStyle = `rgba(40,215,242,${t.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c},${p.a.toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
    };
    const start = () => { if (!raf && inView && !document.hidden && !reduce.matches) raf = requestAnimationFrame(tick); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    new IntersectionObserver(entries => {
      inView = entries[entries.length - 1].isIntersecting;
      host.classList.toggle('m3d-idle', !inView);
      inView ? start() : stop();
    }).observe(host);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    cleanups.push(stop);
    start();
  };
  document.querySelectorAll('.hero,.page-hero').forEach(el => makeStars(el, 1));
  document.querySelectorAll('.technology-section,.contact-section').forEach(el => makeStars(el, 0.5));

  /* Αν ο χρήστης ενεργοποιήσει reduced motion εν ώρα πλοήγησης, όλα σβήνουν */
  reduce.addEventListener?.('change', e => {
    if (!e.matches) return;
    root.classList.remove('m3d');
    cleanups.forEach(fn => fn());
  });
})();
