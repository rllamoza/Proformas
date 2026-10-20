/**
 * Utilidades compartidas del servidor de desarrollo: router con control de roles,
 * parser CSV, evolución mensual real y helpers numéricos.
 */
import { sanitizePayload } from './engine.mjs';

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const today = () => new Date().toISOString().slice(0, 10);
export const nextId = (arr) => arr.reduce((mx, x) => Math.max(mx, x.id), 0) + 1;
export const r2 = (n) => Math.round(((Number(n) || 0) + 1e-9) * 100) / 100;
export const byId = (arr, id) => arr.find((x) => x.id === Number(id));
export const E = (status, code, message) => Object.assign(new Error(message), { status, code });

export function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');
  if (missing.length) throw E(422, 'VALIDATION_ERROR', `Campos obligatorios: ${missing.join(', ')}`);
}

/** Router declarativo. roles: null = público, [] = cualquier sesión, [...] = roles permitidos. */
export function makeRouter() {
  const routes = [];
  const on = (method, pattern, roles, fn) =>
    routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>\\d+)') + '$'), roles, fn });

  async function handle({ path, m, body, user, need, send, err, url, res }) {
    for (const r of routes) {
      if (r.method !== m) continue;
      const mt = path.match(r.re);
      if (!mt) continue;
      if (r.roles && !need(...r.roles)) return true;
      try {
        const [status, data] = await r.fn({ p: mt.groups || {}, body, user, url });
        // Toda respuesta pasa por el filtro de campos sensibles según rol.
        send(res, status, { data: user ? sanitizePayload(data, user.role) : data });
      } catch (e) {
        if (e.status) err(res, e.status, e.code, e.message);
        else throw e;
      }
      return true;
    }
    return false;
  }
  return { on, handle };
}

/** Parser CSV con soporte de comillas y detección de separador (, o ;). */
export function parseCsv(text) {
  const clean = String(text).replace(/^\uFEFF/, '');
  const first = clean.split(/\r?\n/)[0] || '';
  const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** Evolución de los últimos N meses calculada a partir de las proformas reales. */
export function monthlyEvolution(quotes, months = 6) {
  const now = new Date();
  const rows = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const inMonth = quotes.filter((q) => String(q.issue_date || q.created_at || '').startsWith(key));
    const acc = inMonth.filter((q) => q.status === 'aceptada');
    const sum = (arr, f) => r2(arr.reduce((s, q) => s + (Number(q[f]) || 0), 0));
    rows.push({
      key,
      month: MONTHS[d.getMonth()],
      count: inMonth.length,
      accepted_count: acc.length,
      quoted: sum(inMonth, 'total_with_tax_pen'),
      accepted: sum(acc, 'total_with_tax_pen'),
      revenue: sum(acc, 'taxable_base_pen'),
      materials: sum(acc, 'materials_cost_pen'),
      labor: sum(acc, 'labor_cost_applied_pen'),
      cost: sum(acc, 'total_cost_pen'),
    });
  }
  return rows;
}
