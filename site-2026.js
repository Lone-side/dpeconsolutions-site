(() => {
  'use strict';
  const root = document.documentElement;
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');
  const topbar = document.getElementById('topbar');
  const themeToggle = document.getElementById('themeToggle');
  const scene = document.getElementById('ledgerScene');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  navToggle?.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    siteNav.classList.toggle('open', !open);
  });

  siteNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navToggle?.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('open');
  }));

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      topbar?.classList.toggle('scrolled', scrollY > 24);
      ticking = false;
    });
    ticking = true;
  }, { passive: true });

  const storedTheme = localStorage.getItem('dp-theme');
  if (storedTheme === 'light') root.dataset.theme = 'light';
  themeToggle?.addEventListener('click', () => {
    const light = root.dataset.theme !== 'light';
    root.dataset.theme = light ? 'light' : 'dark';
    localStorage.setItem('dp-theme', light ? 'light' : 'dark');
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  if (scene && !reduceMotion && matchMedia('(pointer:fine)').matches) {
    const visual = scene.closest('.hero-visual');
    visual.addEventListener('pointermove', event => {
      const box = visual.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      scene.style.setProperty('--pointer-x', `${x * 9}deg`);
      scene.style.setProperty('--pointer-y', `${y * -7}deg`);
    });
    visual.addEventListener('pointerleave', () => {
      scene.style.setProperty('--pointer-x', '0deg');
      scene.style.setProperty('--pointer-y', '0deg');
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }));

  const form = document.querySelector('.contact-form');
  form?.addEventListener('submit', event => {
    const submit = form.querySelector('.form-submit');
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }
    submit.disabled = true;
    submit.innerHTML = 'Αποστολή…';
  });

})();
