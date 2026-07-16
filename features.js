/* ============================================================
   D.P. Accounting Solutions — "WOW" feature layer (v1)
   - Scroll reveal
   - Hero count-up stats
   - "Φορολογικό Ραντάρ": live countdown to Greek tax deadlines
   No dependencies. Degrades gracefully + respects reduced motion.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal ---------- */
  (function () {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Hero count-up stats ---------- */
  (function () {
    var nums = document.querySelectorAll('.hero-stats .stat-num');
    if (!nums.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-target')) || 0;
      if (reduce) { el.textContent = target.toLocaleString('el-GR'); return; }
      var dur = 1400, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('el-GR');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Φορολογικό Ραντάρ ---------- */
  (function () {
    var ring = document.getElementById('rcRing');
    var listEl = document.getElementById('deadlineList');
    if (!ring && !listEl) return;

    var DAY = 86400000;
    function endOfDay(d) { d.setHours(23, 59, 59, 0); return d; }
    function lastDayOfMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

    // Indicative recurring Greek tax/business obligations.
    // Each returns the next future due-date (end of that day).
    var DEFS = [
      { name: 'ΦΠΑ — Περιοδική δήλωση', meta: 'Μηνιαία υποβολή & καταβολή', kind: 'monthlyLast' },
      { name: 'Παρακρατούμενοι φόροι', meta: 'Απόδοση παρακρατήσεων', kind: 'monthlyLast' },
      { name: 'ΑΠΔ / Εισφορές ΕΦΚΑ', meta: 'Μισθοδοσία προηγ. μήνα', kind: 'monthlyLast' },
      { name: 'VIES / Intrastat', meta: 'Ενδοκοινοτικές συναλλαγές', kind: 'monthlyDay', day: 26 },
      { name: 'Δήλωση φορολογίας εισοδήματος', meta: 'Φυσικά & νομικά πρόσωπα', kind: 'annual', month: 6, day: 30 },
      { name: 'ΕΝΦΙΑ — επόμενη δόση', meta: 'Φόρος ακίνητης περιουσίας', kind: 'monthlyLast', anchorMonths: [4, 5, 6, 7, 8, 9] }
    ];

    function nextDate(def, now) {
      var y = now.getFullYear(), m = now.getMonth();
      var d;
      if (def.kind === 'monthlyLast') {
        d = endOfDay(new Date(y, m, lastDayOfMonth(y, m)));
        if (d.getTime() < now.getTime()) d = endOfDay(new Date(y, m + 1, lastDayOfMonth(y, m + 1)));
        if (def.anchorMonths) {
          // advance to the next month in the allowed set
          while (def.anchorMonths.indexOf(d.getMonth()) === -1) {
            var ny = d.getFullYear(), nm = d.getMonth() + 1;
            d = endOfDay(new Date(ny, nm, lastDayOfMonth(ny, nm)));
          }
        }
        return d;
      }
      if (def.kind === 'monthlyDay') {
        d = endOfDay(new Date(y, m, Math.min(def.day, lastDayOfMonth(y, m))));
        if (d.getTime() < now.getTime()) d = endOfDay(new Date(y, m + 1, Math.min(def.day, lastDayOfMonth(y, m + 1))));
        return d;
      }
      if (def.kind === 'annual') {
        d = endOfDay(new Date(y, def.month - 1, def.day));
        if (d.getTime() < now.getTime()) d = endOfDay(new Date(y + 1, def.month - 1, def.day));
        return d;
      }
    }

    function urgency(days) { return days <= 7 ? 'urgent' : days <= 14 ? 'soon' : 'calm'; }
    var MONTHS = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
    var DOW = ['Κυρ', 'Δευ', 'Τρ', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
    function fmtDate(d) { return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

    // Fallback: compute next occurrences from the recurring rules above.
    function itemsFromDefs() {
      var now = new Date();
      return DEFS.map(function (def) { return { name: def.name, meta: def.meta, due: nextDate(def, now) }; })
        .sort(function (a, b) { return a.due - b.due; });
    }
    // Primary: concrete dated items from the auto-built JSON (data/deadlines.json).
    function itemsFromJson(data) {
      var floor = Date.now() - DAY;
      return ((data && data.items) || []).map(function (it) {
        var p = String(it.date || '').split('-');
        return { name: it.name, meta: it.meta || '', due: new Date(+p[0], (+p[1] || 1) - 1, (+p[2] || 1), 23, 59, 59) };
      }).filter(function (it) { return !isNaN(it.due.getTime()) && it.due.getTime() >= floor; })
        .sort(function (a, b) { return a.due - b.due; }).slice(0, 8);
    }

    function start(items) {
      if (!items || !items.length) return;
      var now = new Date();

    // ----- Render upcoming list -----
    if (listEl) {
      listEl.innerHTML = '';
      items.forEach(function (it) {
        var days = Math.ceil((it.due.getTime() - now.getTime()) / DAY);
        var u = urgency(days);
        var li = document.createElement('li');
        var when = days <= 0 ? 'σήμερα' : days === 1 ? 'αύριο' : 'σε ' + days + ' ημ.';
        li.innerHTML =
          '<span class="dl-dot ' + u + '" aria-hidden="true"></span>' +
          '<span class="dl-body"><span class="dl-name">' + it.name + '</span>' +
          '<span class="dl-meta">' + it.meta + ' • ' + fmtDate(it.due) + '</span></span>' +
          '<span class="dl-when ' + u + '">' + when + '</span>';
        listEl.appendChild(li);
      });
    }

    // ----- Headline (soonest) + live ring/countdown -----
    var soonest = items[0];
    if (!soonest) return;
    var ringWrap = document.getElementById('rcRingWrap');
    var prog = document.getElementById('rcProg');
    var elDays = document.getElementById('rcDays');
    var elTitle = document.getElementById('rcTitle');
    var elDate = document.getElementById('rcDate');
    var elCd = document.getElementById('rcCountdown');
    var elBadge = document.getElementById('rcBadge');
    var C = 552.92; // 2πr, r=88
    var WINDOW = 45; // days window that fills the ring

    if (elTitle) elTitle.textContent = soonest.name;
    if (elDate) elDate.textContent = soonest.meta + ' • ' + fmtDate(soonest.due);

    var lastVals = {};
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function setUnit(key, val) {
      if (!elCd) return;
      var box = elCd.querySelector('[data-u="' + key + '"] b');
      if (!box) return;
      var str = key === 'd' ? String(val) : pad(val);
      if (lastVals[key] !== str) {
        box.textContent = str;
        if (!reduce) { box.classList.remove('rc-flip'); void box.offsetWidth; box.classList.add('rc-flip'); }
        lastVals[key] = str;
      }
    }

    function tick() {
      var t = new Date();
      var diff = soonest.due.getTime() - t.getTime();
      if (diff < 0) diff = 0;
      var days = Math.floor(diff / DAY);
      var hrs = Math.floor((diff % DAY) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      var secs = Math.floor((diff % 60000) / 1000);

      if (elDays) elDays.textContent = days;
      setUnit('d', days); setUnit('h', hrs); setUnit('m', mins); setUnit('s', secs);

      var daysExact = diff / DAY;
      var u = urgency(Math.ceil(daysExact));
      if (ringWrap) ringWrap.className = 'radar-ring-wrap ' + u;
      if (elBadge) elBadge.textContent = u === 'urgent' ? 'Άμεση προθεσμία' : 'Επόμενη προθεσμία';

      if (prog) {
        var fill = Math.max(0.04, Math.min(1, 1 - daysExact / WINDOW));
        prog.style.strokeDashoffset = (C * (1 - fill)).toFixed(2);
      }
    }

      tick();
      if (!reduce) setInterval(tick, 1000);
    }

    // Load auto-updated data, fall back to rules on any failure (e.g. file://).
    if (typeof fetch === 'function') {
      fetch('data/deadlines.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (data) { var it = itemsFromJson(data); start(it.length ? it : itemsFromDefs()); })
        .catch(function () { start(itemsFromDefs()); });
    } else { start(itemsFromDefs()); }
  })();
})();
