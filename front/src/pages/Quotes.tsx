import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, canSeeCosts, money } from '../api';
import { useAuth } from '../auth';
import { Icon } from '../Layout';

const STATUS_BADGE: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  aceptada: {
    label: 'Aceptada',
    bg: 'bg-[#d1fae5]',
    text: 'text-[#065f46]',
    border: 'border-[#6ee7b7]',
    dot: 'bg-[#059669]',
  },
  enviada: {
    label: 'Enviada',
    bg: 'bg-[#dbeafe]',
    text: 'text-[#1e40af]',
    border: 'border-[#93c5fd]',
    dot: 'bg-[#2563eb]',
  },
  emitida: {
    label: 'Emitida',
    bg: 'bg-[#dbeafe]',
    text: 'text-[#1e40af]',
    border: 'border-[#93c5fd]',
    dot: 'bg-[#2563eb]',
  },
  borrador: {
    label: 'Borrador',
    bg: 'bg-[#e2e8f0]',
    text: 'text-[#334155]',
    border: 'border-[#cbd5e1]',
    dot: 'bg-[#64748b]',
  },
  en_aprobacion: {
    label: 'En aprobación',
    bg: 'bg-[#fef3c7]',
    text: 'text-[#92400e]',
    border: 'border-[#fcd34d]',
    dot: 'bg-[#d97706] animate-pulse',
  },
  rechazada: {
    label: 'Rechazada',
    bg: 'bg-[#fee2e2]',
    text: 'text-[#991b1b]',
    border: 'border-[#fca5a5]',
    dot: 'bg-[#dc2626]',
  },
};

const PERIOD_KPI_PRESETS: Record<
  string,
  {
    total_label: string;
    total_badge: string;
    period_tag: string;
    active_label: string;
    pipeline_pen: number;
    approved_title: string;
    approved_label: string;
    approved_rate: string;
    projected_pen: number;
    critical_label: string;
    expired_count: number;
    expiring_count: number;
    avg_margin_pct: number;
  }
> = {
  jun2026: {
    total_label: '42 registradas',
    total_badge: '+8 este mes',
    period_tag: 'Periodo 2026-I',
    active_label: '14 activas',
    pipeline_pen: 112450.0,
    approved_title: 'Aprobadas (Jun 2026)',
    approved_label: '18 cerradas',
    approved_rate: '(42.8%)',
    projected_pen: 146800.0,
    critical_label: '5 casos críticos',
    expired_count: 2,
    expiring_count: 3,
    avg_margin_pct: 32.4,
  },
  may2026: {
    total_label: '34 registradas',
    total_badge: '+6 en mayo',
    period_tag: 'Cierre Mayo 2026',
    active_label: '9 activas',
    pipeline_pen: 89200.0,
    approved_title: 'Aprobadas (May 2026)',
    approved_label: '15 cerradas',
    approved_rate: '(44.1%)',
    projected_pen: 128400.0,
    critical_label: '3 casos críticos',
    expired_count: 1,
    expiring_count: 2,
    avg_margin_pct: 31.1,
  },
  abr2026: {
    total_label: '28 registradas',
    total_badge: '+5 en abril',
    period_tag: 'Cierre Abril 2026',
    active_label: '6 activas',
    pipeline_pen: 68500.0,
    approved_title: 'Aprobadas (Abr 2026)',
    approved_label: '11 cerradas',
    approved_rate: '(39.3%)',
    projected_pen: 94200.0,
    critical_label: '2 casos críticos',
    expired_count: 1,
    expiring_count: 1,
    avg_margin_pct: 29.8,
  },
  'q2-2026': {
    total_label: '64 registradas',
    total_badge: '+20 en Q2',
    period_tag: 'Trimestre Q2 2026',
    active_label: '29 activas',
    pipeline_pen: 270150.0,
    approved_title: 'Aprobadas (Q2 2026)',
    approved_label: '44 cerradas',
    approved_rate: '(41.9%)',
    projected_pen: 369400.0,
    critical_label: '6 casos críticos',
    expired_count: 2,
    expiring_count: 4,
    avg_margin_pct: 31.6,
  },
  all: {
    total_label: '117 registradas',
    total_badge: '+24 este mes',
    period_tag: 'Histórico 2026',
    active_label: '29 activas',
    pipeline_pen: 270150.0,
    approved_title: 'Aprobadas (2026)',
    approved_label: '52 cerradas',
    approved_rate: '(44.4%)',
    projected_pen: 448900.0,
    critical_label: '5 casos críticos',
    expired_count: 2,
    expiring_count: 3,
    avg_margin_pct: 32.4,
  },
};

function formatIssueDate(iso?: string) {
  if (!iso) return '04 Jun 2026';
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const mIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
  return `${parts[2]} ${months[mIdx]} ${parts[0]}`;
}

function getInitials(name?: string) {
  if (!name) return 'AS';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export default function Quotes() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [period, setPeriod] = useState('jun2026');
  const [seller, setSeller] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [ratiosModal, setRatiosModal] = useState(false);
  const [toast, setToast] = useState('');

  const costs = canSeeCosts(user?.role);

  useEffect(() => {
    const st = searchParams.get('status');
    if (st !== null) setStatus(st);
  }, [searchParams]);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (period) params.set('period', period);
    if (seller && seller !== 'all') params.set('seller', seller);
    if (customerFilter && customerFilter !== 'all') params.set('customer', customerFilter);
    api(`/quotes?${params.toString()}`).then(setList);
  }, [q, status, period, seller, customerFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3200);
  };

  const act = async (id: number, a: string, body?: any) => {
    try {
      const r = await api(`/quotes/${id}/${a}`, { method: 'POST', body });
      setOpenMenuId(null);
      if (a === 'new-version' || a === 'duplicate') {
        notify(`Proforma duplicada como ${r.code}`);
        nav(`/proformas/${r.id}`);
      } else {
        notify('Estado de proforma actualizado.');
        load();
      }
    } catch (e: any) {
      notify(e.message || 'No se pudo completar la acción.');
    }
  };

  const exportCsv = () => {
    const headers = ['Codigo', 'Cliente', 'Documento', 'Proyecto', 'Total_PEN', 'Plazo_Dias', 'Estado', 'Asesor', 'Fecha_Emision'];
    const rows = list.map((item) => [
      item.code,
      `"${(item.customer?.business_name || '').replace(/"/g, '""')}"`,
      item.customer?.document_number || '',
      `"${(item.project_title || item.project?.name || '').replace(/"/g, '""')}"`,
      (item.total_with_tax_pen || 0).toFixed(2),
      item.estimated_days || 2.5,
      item.status,
      `"${item.seller_name || ''}"`,
      item.issue_date || '',
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Proformas_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Reporte Excel (CSV) descargado correctamente.');
  };

  const uniqueCustomers = useMemo(() => {
    const names = new Set<string>();
    list.forEach((item) => {
      if (item.customer?.business_name) names.add(item.customer.business_name);
    });
    return Array.from(names);
  }, [list]);

  const kpi = PERIOD_KPI_PRESETS[period] || PERIOD_KPI_PRESETS.jun2026;

  return (
    <div className="space-y-6 pb-8">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#10294d] px-5 py-3.5 text-xs font-bold text-white shadow-xl"
          style={{ boxShadow: '-4px -4px 10px rgba(255,255,255,0.6), 6px 6px 16px rgba(16,41,77,0.45)' }}
        >
          <Icon n="check_circle" className="text-[#ff752b] text-[18px]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Page Header & Action Bar (Screen 06) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary mb-1">
            <span>Módulo Comercial</span>
            <span>•</span>
            <span>Cotizaciones Técnicas</span>
          </div>
          <h2 className="text-2xl font-extrabold text-primary tracking-tight">
            Proformas y Cotizaciones
          </h2>
          <p className="text-sm text-on-surface-variant">
            Gestión integral de propuestas técnicas de seguridad electrónica, redes y energía.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportCsv}
            className="bg-[#E5EBF2] px-4 py-2.5 rounded-xl font-semibold text-sm text-primary flex items-center gap-2 hover:text-secondary transition-all active:scale-95"
            style={{ boxShadow: '-4px -4px 8px #ffffff, 4px 4px 8px #c3ccd6' }}
          >
            <Icon n="download" className="text-[18px]" />
            <span>Exportar Excel</span>
          </button>
          <Link
            to="/proformas/nueva"
            className="bg-gradient-to-br from-[#ff752b] to-[#b13e00] text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            style={{ boxShadow: '-4px -4px 10px #ffffff, 4px 4px 12px rgba(177, 62, 0, 0.35)' }}
          >
            <Icon n="add_circle" className="text-[20px]" />
            <span>Nueva Proforma</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Summary Cards (Screen 06) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div
          className="bg-[#E5EBF2] p-5 rounded-2xl flex items-start justify-between"
          style={{ boxShadow: '-6px -6px 12px #ffffff, 6px 6px 12px #c3ccd6' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Total Proformas
            </p>
            <h3 className="text-2xl font-extrabold text-primary">{kpi.total_label}</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] bg-[#d1fae5] px-2 py-0.5 rounded-full">
                <Icon n="trending_up" className="text-[14px]" />
                {kpi.total_badge}
              </span>
              <span className="text-xs text-on-surface-variant">{kpi.period_tag}</span>
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-primary"
            style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
          >
            <Icon n="folder_Copy" />
          </div>
        </div>

        {/* Card 2 */}
        <div
          className="bg-[#E5EBF2] p-5 rounded-2xl flex items-start justify-between"
          style={{ boxShadow: '-6px -6px 12px #ffffff, 6px 6px 12px #c3ccd6' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Enviadas / En Gestión
            </p>
            <h3 className="text-2xl font-extrabold text-primary">{kpi.active_label}</h3>
            <p className="mt-2 text-xs font-semibold text-on-surface-variant">
              Monto en pipeline:{' '}
              <span className="text-primary font-bold">{money(kpi.pipeline_pen)}</span>
            </p>
          </div>
          <div
            className="w-11 h-11 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-[#1e40af]"
            style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
          >
            <Icon n="forward_to_inbox" />
          </div>
        </div>

        {/* Card 3 */}
        <div
          className="bg-[#E5EBF2] p-5 rounded-2xl flex items-start justify-between"
          style={{ boxShadow: '-6px -6px 12px #ffffff, 6px 6px 12px #c3ccd6' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              {kpi.approved_title}
            </p>
            <h3 className="text-2xl font-extrabold text-[#065f46]">
              {kpi.approved_label}{' '}
              <span className="text-sm font-bold text-[#059669]">{kpi.approved_rate}</span>
            </h3>
            <p className="mt-2 text-xs font-semibold text-on-surface-variant">
              Facturación proy.:{' '}
              <span className="text-primary font-bold">{money(kpi.projected_pen)}</span>
            </p>
          </div>
          <div
            className="w-11 h-11 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-[#059669]"
            style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
          >
            <Icon n="verified" />
          </div>
        </div>

        {/* Card 4 */}
        <div
          className="bg-[#E5EBF2] p-5 rounded-2xl flex items-start justify-between"
          style={{ boxShadow: '-6px -6px 12px #ffffff, 6px 6px 12px #c3ccd6' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Atención Requerida
            </p>
            <h3 className="text-2xl font-extrabold text-secondary">{kpi.critical_label}</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-bold text-[#991b1b] bg-[#fee2e2] px-2 py-0.5 rounded-md">
                {kpi.expired_count} Vencidas
              </span>
              <span className="text-xs font-bold text-[#92400e] bg-[#fef3c7] px-2 py-0.5 rounded-md">
                {kpi.expiring_count} por expirar
              </span>
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-secondary"
            style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
          >
            <Icon n="warning" />
          </div>
        </div>
      </div>

      {/* Search & Multi-Filter Toolbar (Screen 06) */}
      <div
        className="bg-[#E5EBF2] p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4"
        style={{ boxShadow: '-6px -6px 12px #ffffff, 6px 6px 12px #c3ccd6' }}
      >
        {/* Inset Search Bar */}
        <div
          className="flex-1 bg-[#E5EBF2] rounded-xl px-4 py-2.5 flex items-center gap-3"
          style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
        >
          <Icon n="search" className="text-on-surface-variant text-[20px]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por N° proforma (PF-2026-...), cliente, RUC/DNI o proyecto..."
            className="bg-transparent border-none focus:outline-none text-sm text-on-surface placeholder:text-on-surface-variant/70 w-full font-medium"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="text-on-surface-variant hover:text-primary"
            >
              <Icon n="close" className="text-[16px]" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Estado Filter */}
          <div
            className="bg-[#E5EBF2] rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-primary"
            style={{ boxShadow: '-4px -4px 8px #ffffff, 4px 4px 8px #c3ccd6' }}
          >
            <Icon n="filter_list" className="text-[16px] text-secondary" />
            <span className="text-on-surface-variant">Estado:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent border-none p-0 pr-4 text-xs font-bold text-primary focus:outline-none cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="en_aprobacion">En aprobación</option>
              <option value="enviada">Enviada</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>

          {/* Cliente Filter */}
          <div
            className="bg-[#E5EBF2] rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-primary"
            style={{ boxShadow: '-4px -4px 8px #ffffff, 4px 4px 8px #c3ccd6' }}
          >
            <Icon n="domain" className="text-[16px] text-primary" />
            <span className="text-on-surface-variant">Cliente:</span>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-transparent border-none p-0 pr-4 text-xs font-bold text-primary focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">Todos los clientes</option>
              {uniqueCustomers.map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>
          </div>

          {/* Asesor Filter */}
          <div
            className="bg-[#E5EBF2] rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-primary"
            style={{ boxShadow: '-4px -4px 8px #ffffff, 4px 4px 8px #c3ccd6' }}
          >
            <Icon n="badge" className="text-[16px] text-primary" />
            <span className="text-on-surface-variant">Asesor:</span>
            <select
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="bg-transparent border-none p-0 pr-4 text-xs font-bold text-primary focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los asesores</option>
              <option value="Carlos Mendoza">Carlos Mendoza</option>
              <option value="Ana Paredes">Ana Paredes</option>
              <option value="Jorge Salas">Jorge Salas</option>
            </select>
          </div>

          {/* Date Range / Period */}
          <div
            className="bg-[#E5EBF2] rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-primary"
            style={{ boxShadow: '-4px -4px 8px #ffffff, 4px 4px 8px #c3ccd6' }}
          >
            <Icon n="calendar_month" className="text-[16px] text-secondary" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none p-0 pr-2 text-xs font-bold text-primary focus:outline-none cursor-pointer"
            >
              <option value="jun2026">Este mes (Jun 2026)</option>
              <option value="may2026">Mayo 2026</option>
              <option value="abr2026">Abril 2026</option>
              <option value="q2-2026">Trimestre Q2 2026</option>
              <option value="all">Todos los meses</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={() => {
              setQ('');
              setStatus('');
              setSeller('all');
              setCustomerFilter('all');
              setPeriod('jun2026');
            }}
            className="bg-[#E5EBF2] p-2 rounded-xl text-on-surface-variant hover:text-secondary transition-all active:scale-95"
            style={{ boxShadow: '-4px -4px 8px #ffffff, 4px 4px 8px #c3ccd6' }}
            title="Limpiar filtros"
          >
            <Icon n="restart_alt" className="text-[18px]" />
          </button>
        </div>
      </div>

      {/* Main Quotes Table Container (Screen 06) */}
      <div
        className="bg-[#E5EBF2] rounded-2xl overflow-hidden"
        style={{ boxShadow: '-6px -6px 12px #ffffff, 6px 6px 12px #c3ccd6' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#10294d] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-4 px-5">N° Proforma</th>
                <th className="py-4 px-4">Cliente</th>
                <th className="py-4 px-4">Proyecto / Alcance</th>
                <th className="py-4 px-4 text-right">Total (S/)</th>
                <th className="py-4 px-4 text-center">Plazo</th>
                <th className="py-4 px-4 text-center">Estado</th>
                <th className="py-4 px-4">Asesor</th>
                <th className="py-4 px-4">Emisión</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {list.map((item) => {
                const badge = STATUS_BADGE[item.status] || STATUS_BADGE.borrador;
                const isHighlight = item.status === 'en_aprobacion';
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors group ${
                      isHighlight
                        ? 'bg-[#fef3c7]/20 hover:bg-[#fef3c7]/40'
                        : 'hover:bg-surface-container-low/70'
                    }`}
                  >
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg bg-[#E5EBF2] flex items-center justify-center ${
                            isHighlight ? 'text-[#d97706]' : 'text-primary'
                          }`}
                          style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
                        >
                          <Icon n={item.category_icon || 'router'} className="text-[16px]" />
                        </div>
                        <div>
                          <Link
                            to={`/proformas/${item.id}`}
                            className="font-extrabold text-primary tracking-tight hover:text-secondary transition-colors"
                          >
                            {item.code}
                          </Link>
                          {item.version > 1 && (
                            <span className="ml-1.5 text-[10px] font-bold text-secondary">
                              v{item.version}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-on-surface">
                        {item.customer?.business_name || 'Cliente'}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        {item.customer?.subtitle ||
                          (item.customer?.document_type
                            ? `${item.customer.document_type}: ${item.customer.document_number}`
                            : 'Lima Metropolitana')}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-primary">
                        {item.project_title || item.project?.name || 'Instalación Técnica Especializada'}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        {item.project_subtitle || 'Equipamiento + Mano de Obra'}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="font-extrabold text-primary text-base tabular-nums">
                        {money(item.total_with_tax_pen)}
                      </div>
                      <div className="text-[10px] font-semibold text-on-surface-variant">
                        Inc. IGV 18%
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1 bg-[#E5EBF2] px-2.5 py-1 rounded-lg text-xs font-bold text-primary"
                        style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
                      >
                        <Icon n="schedule" className="text-[14px] text-secondary" />
                        {Number(item.estimated_days || 2.5).toFixed(1)} días
                      </span>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">
                        {item.crews_label || '1 Cuadrilla'}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-container text-white text-[10px] font-bold flex items-center justify-center">
                          {item.seller_initials || getInitials(item.seller_name)}
                        </div>
                        <span className="text-xs font-semibold text-on-surface">
                          {item.seller_name || 'Carlos Mendoza'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-on-surface">
                        {formatIssueDate(item.issue_date)}
                      </div>
                      <div
                        className={`text-[10px] font-semibold ${
                          item.issue_sublabel?.includes('Margen') ||
                          item.issue_sublabel?.includes('Dcto') ||
                          item.issue_sublabel?.includes('Desv')
                            ? 'text-[#d97706]'
                            : item.issue_sublabel?.includes('Vence')
                            ? 'text-secondary'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {item.issue_sublabel || item.relative_date || 'Reciente'}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap relative">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/proformas/${item.id}`}
                          className="w-8 h-8 rounded-lg bg-[#E5EBF2] flex items-center justify-center text-primary hover:text-secondary transition-all active:scale-95"
                          style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #c3ccd6' }}
                          title="Ver detalle"
                        >
                          <Icon n="visibility" className="text-[16px]" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => act(item.id, 'duplicate')}
                          className="w-8 h-8 rounded-lg bg-[#E5EBF2] flex items-center justify-center text-primary hover:text-secondary transition-all active:scale-95"
                          style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #c3ccd6' }}
                          title="Duplicar proforma"
                        >
                          <Icon n="content_copy" className="text-[16px]" />
                        </button>
                        <a
                          href={`/api/v1/quotes/${item.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-lg bg-[#E5EBF2] flex items-center justify-center text-secondary hover:text-primary transition-all active:scale-95"
                          style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #c3ccd6' }}
                          title="Descargar PDF"
                        >
                          <Icon n="picture_as_pdf" className="text-[16px]" />
                        </a>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(openMenuId === item.id ? null : item.id)
                            }
                            className="w-8 h-8 rounded-lg bg-[#E5EBF2] flex items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-95"
                            style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #c3ccd6' }}
                            title="Más opciones"
                          >
                            <Icon n="more_vert" className="text-[16px]" />
                          </button>

                          {openMenuId === item.id && (
                            <div
                              className="absolute right-0 mt-2 w-48 rounded-xl bg-[#E5EBF2] p-2 z-30 text-left space-y-1 border border-white/60"
                              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 16px #94a3b8' }}
                            >
                              <Link
                                to={`/proformas/${item.id}`}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-primary hover:bg-white/50"
                              >
                                <Icon n="open_in_new" className="text-[15px]" />
                                Abrir Hoja Técnica
                              </Link>
                              {item.status === 'borrador' && (
                                <Link
                                  to={`/proformas/${item.id}/editar`}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-primary hover:bg-white/50"
                                >
                                  <Icon n="edit" className="text-[15px]" />
                                  Editar en Wizard
                                </Link>
                              )}
                              {item.status === 'en_aprobacion' && costs && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    act(item.id, 'approve', {
                                      comment: 'Aprobado desde listado comercial',
                                    })
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Icon n="check_circle" className="text-[15px]" />
                                  Aprobar Proforma
                                </button>
                              )}
                              {item.status === 'emitida' && (
                                <button
                                  type="button"
                                  onClick={() => act(item.id, 'mark-sent')}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-50"
                                >
                                  <Icon n="send" className="text-[15px]" />
                                  Marcar Enviada
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => act(item.id, 'new-version')}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-secondary hover:bg-white/50"
                              >
                                <Icon n="history" className="text-[15px]" />
                                Crear Nueva Versión
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm font-semibold text-muted">
                    No se encontraron proformas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination (Screen 06) */}
        <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-on-surface-variant">
            Mostrando <span className="font-bold text-primary">1</span> a{' '}
            <span className="font-bold text-primary">{list.length}</span> de{' '}
            <span className="font-bold text-primary">{kpi.total_label.split(' ')[0]}</span>{' '}
            proformas registradas
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-on-surface-variant opacity-60"
              style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c3ccd6' }}
            >
              <Icon n="chevron_left" className="text-[18px]" />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-xs font-extrabold text-secondary border border-secondary/20"
              style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => setPeriod('may2026')}
              className="w-9 h-9 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-xs font-bold text-primary hover:text-secondary"
              style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c3ccd6' }}
              title="Ver página Mayo 2026"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => setPeriod('abr2026')}
              className="w-9 h-9 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-xs font-bold text-primary hover:text-secondary"
              style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c3ccd6' }}
              title="Ver página Abril 2026"
            >
              3
            </button>
            <span className="text-xs font-bold text-on-surface-variant px-1">...</span>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className="w-9 h-9 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-xs font-bold text-primary hover:text-secondary"
              style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c3ccd6' }}
              title="Ver todas"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className="w-9 h-9 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-primary hover:text-secondary"
              style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c3ccd6' }}
            >
              <Icon n="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Contextual Insights Bar (Screen 06) */}
      <div
        className="bg-[#E5EBF2] p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-secondary"
        style={{ boxShadow: '-6px -6px 12px #ffffff, 6px 6px 12px #c3ccd6' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-secondary shrink-0"
            style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
          >
            <Icon n="tips_and_updates" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Cálculo Automático de Rendimiento Técnico
            </h4>
            <p className="text-xs text-on-surface-variant">
              El plazo estimado en días considera eficiencia de cuadrilla (85%) y factor de holgura
              (15%). Las proformas con descuento &gt; 5% o margen &lt; 20% pasan automáticamente a{' '}
              <span className="font-bold text-[#92400e]">En aprobación</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {costs && (
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-on-surface-variant">
                Margen Técnico Promedio
              </div>
              <div className="text-sm font-extrabold text-[#059669]">{kpi.avg_margin_pct}%</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setRatiosModal(true)}
            className="bg-[#E5EBF2] px-3.5 py-2 rounded-xl text-xs font-bold text-primary hover:text-secondary transition-all active:scale-95"
            style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c3ccd6' }}
          >
            Ver Ratios
          </button>
        </div>
      </div>

      {/* Modal de Ratios Técnicos RN-02 / RN-03 */}
      {ratiosModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-lg rounded-2xl bg-[#E5EBF2] p-6 space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #94a3b8' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-primary">
                Ratios de Rendimiento Técnico y Reglas RN-02 / RN-03
              </h3>
              <button
                type="button"
                onClick={() => setRatiosModal(false)}
                className="text-muted hover:text-primary"
              >
                <Icon n="close" />
              </button>
            </div>
            <div
              className="rounded-xl bg-[#E5EBF2] p-4 space-y-2.5 text-xs"
              style={{ boxShadow: 'inset 3px 3px 6px #c3ccd6, inset -3px -3px 6px #ffffff' }}
            >
              <div className="flex justify-between">
                <span className="text-muted">Jornada Efectiva Estándar:</span>
                <b className="text-primary">7.0 horas / día</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Factor de Holgura e Imprevistos:</span>
                <b className="text-primary">+15.0%</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Redondeo de Plazo de Obra:</span>
                <b className="text-primary">Múltiplo superior de 0.5 días</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Método de Mano de Obra Activo:</span>
                <b className="text-secondary">Máximo Conservador max(Método A, Método B)</b>
              </div>
              {costs && (
                <>
                  <div className="flex justify-between pt-2 border-t border-slate-300/50">
                    <span className="text-muted">Meta Corporativa de Margen sobre Venta:</span>
                    <b className="text-emerald-700">30.0% (Mín. 20.0%)</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Margen Ponderado Periodo Actual:</span>
                    <b className="text-emerald-700">{kpi.avg_margin_pct}%</b>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              {costs && (
                <Link
                  to="/parametros"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-secondary bg-[#E5EBF2]"
                  style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c3ccd6' }}
                >
                  Configurar Parámetros
                </Link>
              )}
              <button
                type="button"
                onClick={() => setRatiosModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
