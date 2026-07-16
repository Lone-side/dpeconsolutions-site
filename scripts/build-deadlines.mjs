#!/usr/bin/env node
/*
 * Builds data/deadlines.json for the "Φορολογικό Ραντάρ".
 * - Generates concrete dates for the recurring Greek tax/business obligations
 *   (rule-based) over a rolling window, so the site never goes stale.
 * - Merges any manually curated special/annual dates from data/overrides.json.
 * Run daily by .github/workflows/deadlines.yml (and on demand: `node scripts/build-deadlines.mjs`).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WINDOW_DAYS = 180;

// Recurring, rule-based obligations. These are stable month-to-month.
const RULES = [
  { name: 'ΦΠΑ — Περιοδική δήλωση', meta: 'Μηνιαία υποβολή & καταβολή', kind: 'monthlyLast', category: 'vat' },
  { name: 'Παρακρατούμενοι φόροι', meta: 'Απόδοση παρακρατήσεων', kind: 'monthlyLast', category: 'withholding' },
  { name: 'ΑΠΔ / Εισφορές ΕΦΚΑ', meta: 'Μισθοδοσία προηγ. μήνα', kind: 'monthlyLast', category: 'payroll' },
  { name: 'VIES / Intrastat', meta: 'Ενδοκοινοτικές συναλλαγές', kind: 'monthlyDay', day: 26, category: 'other' }
];

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const lastDay = (y, m) => new Date(y, m + 1, 0).getDate();

function occurrences(rule, start, end) {
  const out = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    const y = cur.getFullYear(), m = cur.getMonth();
    let day = null;
    if (rule.kind === 'monthlyLast') day = lastDay(y, m);
    else if (rule.kind === 'monthlyDay') day = Math.min(rule.day, lastDay(y, m));
    if (day != null) {
      const d = new Date(y, m, day, 23, 59, 59);
      if (d >= start && d <= end) out.push({ date: iso(y, m, day), name: rule.name, meta: rule.meta, category: rule.category });
    }
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

function loadOverrides() {
  const p = join(ROOT, 'data', 'overrides.json');
  if (!existsSync(p)) return [];
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    return Array.isArray(j.items) ? j.items : [];
  } catch (e) {
    console.error('overrides.json parse error:', e.message);
    return [];
  }
}

const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
const end = new Date(start.getTime() + WINDOW_DAYS * 86400000);

let items = [];
for (const r of RULES) items.push(...occurrences(r, start, end));

// Merge overrides that fall inside the window.
for (const o of loadOverrides()) {
  if (!o || !o.date || !o.name) continue;
  const d = new Date(o.date + 'T23:59:59');
  if (isNaN(d.getTime()) || d < start || d > end) continue;
  items.push({ date: o.date, name: o.name, meta: o.meta || '', category: o.category || 'other' });
}

// Sort ascending, de-dupe by date+name.
const seen = new Set();
items = items
  .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  .filter((it) => { const k = it.date + '|' + it.name; if (seen.has(k)) return false; seen.add(k); return true; });

const payload = {
  generated: now.toISOString(),
  source: 'auto: recurring rules + data/overrides.json',
  note: 'Ενδεικτικές ημερομηνίες. Οι έκτακτες/ετήσιες μπαίνουν από data/overrides.json.',
  items
};

writeFileSync(join(ROOT, 'data', 'deadlines.json'), JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Wrote data/deadlines.json with ${items.length} items (window ${WINDOW_DAYS}d).`);
