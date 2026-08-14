(() => {
  'use strict';
  const toggle = document.querySelector('.sub-nav-toggle');
  const nav = document.querySelector('.sub-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('[data-current-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  const vatRate = document.getElementById('vatRate');
  const vatNet = document.getElementById('vatNet');
  const vatGross = document.getElementById('vatGross');
  const result = document.getElementById('vatResults');
  const resNet = document.getElementById('vatResNet');
  const resVat = document.getElementById('vatResVat');
  const resGross = document.getElementById('vatResGross');
  const resRate = document.getElementById('vatResRate');
  const money = value => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(value);
  const showVat = (net, rate) => {
    if (![net, rate].every(Number.isFinite) || net < 0 || rate < 0) return;
    const vat = net * rate;
    if (resNet) resNet.textContent = money(net);
    if (resVat) resVat.textContent = money(vat);
    if (resGross) resGross.textContent = money(net + vat);
    if (resRate) resRate.textContent = String(Math.round(rate * 100));
    if (result) result.style.display = 'block';
  };
  document.getElementById('vatCalcNet')?.addEventListener('click', () => {
    showVat(Number.parseFloat(vatNet?.value), Number.parseFloat(vatRate?.value));
  });
  document.getElementById('vatCalcGross')?.addEventListener('click', () => {
    const gross = Number.parseFloat(vatGross?.value);
    const rate = Number.parseFloat(vatRate?.value);
    if (Number.isFinite(gross) && gross >= 0 && Number.isFinite(rate)) showVat(gross / (1 + rate), rate);
  });

  const filters = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-category]');
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach(card => { card.hidden = filter !== 'all' && card.dataset.category !== filter; });
  }));
})();
