import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { api, canSeeCosts } from '../api';
import { useAuth } from '../auth';
import { ExchangeRateInfo, Icon } from '../Layout';

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const outletCtx = useOutletContext<{ tc?: ExchangeRateInfo; fetchLiveTc?: (force?: boolean) => void } | null>();

  const [d, setD] = useState<any>(null);
  const [period, setPeriod] = useState<'jun2026' | 'may2026' | 'abr2026' | 'q2-2026'>('jun2026');
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [reject, setReject] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Vendedor interactive states
  const [vFilter, setVFilter] = useState<'all' | 'expiring' | 'draft' | 'approved'>('all');
  const [vSearch, setVSearch] = useState('');
  const [calcBase, setCalcBase] = useState<number>(10000);
  const [calcDesc, setCalcDesc] = useState<number>(5);

  const load = useCallback(
    async (selectedPeriod = period) => {
      setLoadingPeriod(true);
      try {
        const res = await api(`/dashboard?period=${encodeURIComponent(selectedPeriod)}`);
        setD(res);
      } catch {
        // Ignore error
      } finally {
        setLoadingPeriod(false);
      }
    },
    [period]
  );

  useEffect(() => {
    load(period);
  }, [period, load]);

  if (!d || !user) {
    return (
      <div className="p-8 text-sm font-medium text-on-surface-variant flex items-center gap-2">
        <Icon n="progress_activity" className="animate-spin text-secondary" />
        Cargando panel operativo…
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handlePeriodChange = (newPeriod: 'jun2026' | 'may2026' | 'abr2026' | 'q2-2026') => {
    setPeriod(newPeriod);
    const labels: Record<string, string> = {
      jun2026: 'Junio 2026 (Mes Actual)',
      may2026: 'Mayo 2026',
      abr2026: 'Abril 2026',
      'q2-2026': 'Segundo Trimestre (Q2 2026)',
    };
    showToast(`Datos actualizados al periodo: ${labels[newPeriod] || newPeriod}`);
  };

  const handleBarClick = (monthCode: string) => {
    if (monthCode === 'Jun') handlePeriodChange('jun2026');
    else if (monthCode === 'May') handlePeriodChange('may2026');
    else if (monthCode === 'Abr') handlePeriodChange('abr2026');
    else handlePeriodChange('q2-2026');
  };

  const decide = async (id: number, act: 'approve' | 'reject', customComment?: string) => {
    await api(`/quotes/${id}/${act}`, {
      method: 'POST',
      body: { comment: customComment ?? comment },
    });
    setReject(null);
    setComment('');
    showToast(act === 'approve' ? 'Proforma aprobada exitosamente' : 'Proforma observada / rechazada');
    load(period);
  };

  const exportCloseReport = () => {
    const csvRows = [
      ['Periodo', 'Codigo', 'Cliente', 'Responsable Ventas', 'Monto Total PEN (IGV)', 'Estado', 'Fecha'],
      ...(d.recent_quotes || []).map((q: any) => [
        d.period_label || period,
        q.code,
        q.customer?.business_name || '',
        q.seller_name || 'Carlos Mendoza',
        Number(q.total_with_tax_pen || 0).toFixed(2),
        q.status,
        q.issue_date || '2026-06-04',
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cierre_Gerencial_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Reporte de cierre (${d.period_label || period}) exportado en CSV`);
  };

  const isGerencia = canSeeCosts(user.role);
  const liveTcSell = outletCtx?.tc?.usd_to_pen_sell ?? d.exchange_rate?.usd_to_pen_sell ?? 3.75;
  const liveTcBuy = outletCtx?.tc?.usd_to_pen_buy ?? d.exchange_rate?.usd_to_pen_buy ?? 3.72;
  const liveTcSource = outletCtx?.tc?.source ?? d.exchange_rate?.source ?? 'SUNAT Oficial Perú';

  const initials = (name?: string) => {
    if (!name) return 'CM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatPen = (n: number) =>
    Number(n || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'aceptada':
      case 'aprobada':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface text-emerald-700 text-[11px] font-bold shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_5px_rgba(16,185,129,0.25)] border border-emerald-500/20">
            Aprobada
          </span>
        );
      case 'enviada':
      case 'emitida':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface text-sky-800 text-[11px] font-bold shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_5px_rgba(2,132,199,0.25)] border border-sky-500/20">
            Enviada
          </span>
        );
      case 'borrador':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface text-slate-600 text-[11px] font-bold shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_5px_rgba(100,116,139,0.25)] border border-slate-400/20">
            Borrador
          </span>
        );
      case 'en_aprobacion':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface text-amber-800 text-[11px] font-bold shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_5px_rgba(217,119,6,0.3)] border border-amber-500/25">
            En revisión
          </span>
        );
      case 'rechazada':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface text-error text-[11px] font-bold shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_5px_rgba(186,26,26,0.25)] border border-error/20">
            Rechazada
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface text-slate-600 text-[11px] font-bold">
            {status}
          </span>
        );
    }
  };

  // ==================== VISTA TECNICO ====================
  if (user.role === 'tecnico') {
    return (
      <div className="flex flex-col w-full gap-6 pb-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary" />
              <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                Operaciones de Campo · Lima, Perú
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Hola, {user.full_name} · Panel Técnico
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Gestión de visitas técnicas, relevamiento de materiales y ejecución de órdenes de trabajo (sin exposición de costos ni márgenes).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/visitas"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface text-primary text-xs font-bold shadow-[-4px_-4px_9px_rgba(255,255,255,0.85),4px_4px_9px_rgba(148,163,184,0.35)]"
            >
              <Icon n="assignment_turned_in" className="text-[18px]" />
              Visitas Técnicas
            </Link>
            <Link
              to="/ordenes"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-[-4px_-4px_10px_rgba(255,255,255,0.6),4px_4px_12px_rgba(27,42,73,0.45)]"
            >
              <Icon n="engineering" className="text-[18px]" />
              Órdenes de Trabajo
            </Link>
          </div>
        </header>
      </div>
    );
  }

  // ==================== VISTA VENDEDOR (Screen 04) ====================
  if (!isGerencia) {
    const finalSimulatedPrice = calcBase * (1 - calcDesc / 100);
    const theoreticalCost = calcBase * 0.63;
    const simulatedMargin =
      finalSimulatedPrice > 0 ? ((finalSimulatedPrice - theoreticalCost) / finalSimulatedPrice) * 100 : 0;
    const isViable = simulatedMargin >= 30;
    const sellerGoalPct = d.seller_goal_pct ?? 80.4;
    const sellerQuotedPen = d.seller_quoted_pen ?? 48250;
    const sellerGoalTotal = d.monthly_goal_pen ?? 60000;

    return (
      <div className="flex flex-col w-full gap-6 pb-10">
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-lg flex items-center gap-2">
            <Icon n="check_circle" className="text-secondary-container text-[18px]" />
            <span>{toast}</span>
          </div>
        )}

        {/* Bloque de Bienvenida & Panel de Metas */}
        <section className="w-full rounded-2xl bg-surface p-6 shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center text-primary shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),4px_4px_10px_rgba(148,163,184,0.35)]">
                <Icon n="badge" className="text-[32px] text-primary-container" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(16,185,129,0.4)]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] text-primary tracking-tight font-bold">
                  ¡Hola de nuevo, {user.full_name}!
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.9),inset_1px_1px_3px_rgba(16,185,129,0.25)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Jornada Activa
                </span>
              </div>
              <p className="text-sm text-on-surface-variant truncate">
                Asesor Comercial Senior · <span className="font-semibold text-primary">Zona Lima y Callao</span> · Redes, CCTV &amp; Seguridad Electrónica
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-on-surface-variant text-[11px] font-semibold">
                <span className="flex items-center gap-1">
                  <Icon n="calendar_today" className="text-[15px]" /> {d.context_date_label}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1 text-secondary font-semibold">
                  <Icon n="verified_user" className="text-[15px]" /> TC SUNAT Lima: S/ {liveTcSell.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Mes + Termómetro de Meta Comercial & Botón CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-low shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.8),inset_3px_3px_7px_rgba(148,163,184,0.4)]">
              <Icon n="tune" className="text-secondary text-[18px]" />
              <select
                aria-label="Seleccionar periodo vendedor"
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value as any)}
                className="bg-transparent border-0 text-xs text-primary font-bold focus:outline-none cursor-pointer"
              >
                <option value="jun2026">Junio 2026 (Mes Actual)</option>
                <option value="may2026">Mayo 2026</option>
                <option value="abr2026">Abril 2026</option>
                <option value="q2-2026">Segundo Trimestre (Q2)</option>
              </select>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-background shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.85),inset_3px_3px_7px_rgba(148,163,184,0.38)] flex flex-col min-w-[240px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Meta ({d.selected_month_code})
                </span>
                <span className="text-base text-secondary font-bold">{sellerGoalPct}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-container-highest shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(148,163,184,0.4)] overflow-hidden p-0.5 mb-1.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-secondary-container to-secondary transition-all duration-700"
                  style={{ width: `${Math.min(100, sellerGoalPct)}%` }}
                />
              </div>
              <div className="flex justify-between items-baseline text-xs text-on-surface-variant">
                <span>
                  S/ {formatPen(sellerQuotedPen)} <span className="text-[10px]">/ {Math.round(sellerGoalTotal / 1000)}k</span>
                </span>
                <span className="text-primary font-semibold">
                  Faltan S/ {formatPen(Math.max(0, sellerGoalTotal - sellerQuotedPen))}
                </span>
              </div>
            </div>

            <Link
              to="/proformas/nueva"
              className="group relative px-5 py-3.5 rounded-xl bg-secondary-container text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-[-4px_-4px_12px_rgba(255,255,255,0.9),4px_4px_14px_rgba(242,107,33,0.45)] hover:brightness-105 transition-all"
            >
              <Icon n="add_circle" className="text-[20px] transition-transform group-hover:rotate-90" />
              <span>Nueva Proforma</span>
            </Link>
          </div>
        </section>

        {/* 4 Tarjetas KPIs Vendedor */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="rounded-2xl bg-surface p-4 shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Monto Cotizado ({d.selected_month_code})
                </span>
                <span className="text-2xl text-primary font-bold mt-1 block">
                  S/ {formatPen(sellerQuotedPen)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary-container shadow-[-3px_-3px_7px_rgba(255,255,255,0.9),3px_3px_7px_rgba(148,163,184,0.35)]">
                <Icon n="payments" className="text-[22px]" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-surface-container-high/60">
              <div className="flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                <Icon n="trending_up" className="text-[16px]" />
                <span>{d.quoted_delta_pct || '+18.4%'}</span>
                <span className="text-on-surface-variant font-normal">{d.quotes_compare_label}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Proformas en Gestión
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl text-primary font-bold">{d.active_quotes}</span>
                  <span className="text-sm text-on-surface-variant">activas</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-secondary shadow-[-3px_-3px_7px_rgba(255,255,255,0.9),3px_3px_7px_rgba(148,163,184,0.35)]">
                <Icon n="pending_actions" className="text-[22px]" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-surface-container-high/60">
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-semibold flex items-center gap-1">
                <Icon n="alarm" className="text-[13px]" /> Seguimiento activo
              </span>
              <span className="text-xs text-on-surface-variant">Prioridad alta</span>
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Efectividad de Cierre
                </span>
                <span className="text-2xl text-primary font-bold mt-1 block">
                  {Number(d.conversion_rate_pct ?? 38).toFixed(1)}%
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary shadow-[-3px_-3px_7px_rgba(255,255,255,0.9),3px_3px_7px_rgba(148,163,184,0.35)]">
                <Icon n="handshake" className="text-[22px]" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-surface-container-high/60">
              <span className="text-xs text-on-surface-variant">
                Total periodo: <strong className="text-primary font-semibold">{d.quotes_count} emitidas</strong>
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Comisión Proyectada
                </span>
                <span className="text-2xl text-secondary font-bold mt-1 block">
                  S/ {formatPen(sellerQuotedPen * 0.06)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-secondary shadow-[-3px_-3px_7px_rgba(255,255,255,0.9),3px_3px_7px_rgba(148,163,184,0.35)]">
                <Icon n="savings" className="text-[22px]" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-surface-container-high/60">
              <span className="text-xs text-on-surface-variant">3.0% neto s/ adjudicaciones</span>
              <Link to="/proformas" className="text-[11px] text-primary font-semibold underline hover:text-secondary">
                Ver cartera
              </Link>
            </div>
          </div>
        </section>

        {/* Cuerpo Principal Vendedor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="rounded-2xl bg-surface p-6 shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(148,163,184,0.35)]">
                    <Icon n="inventory" className="text-[20px]" />
                  </div>
                  <div>
                    <h2 className="text-lg text-primary font-bold leading-tight">
                      Bandeja de Proformas ({d.period_label})
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Cotizaciones técnicas registradas en el periodo seleccionado
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Icon
                      n="search"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
                    />
                    <input
                      value={vSearch}
                      onChange={(e) => setVSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 rounded-xl bg-background text-xs text-on-surface placeholder:text-outline shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.85),inset_3px_3px_7px_rgba(148,163,184,0.4)] focus:outline-none"
                      placeholder="Buscar por cliente o código..."
                      type="text"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4 p-1 rounded-xl bg-surface-container-low shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.9),inset_3px_3px_7px_rgba(148,163,184,0.4)] w-fit">
                {[
                  { k: 'all', l: 'Todas' },
                  { k: 'expiring', l: 'En Revisión' },
                  { k: 'draft', l: 'Borradores' },
                  { k: 'approved', l: 'Aprobadas' },
                ].map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setVFilter(t.k as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      vFilter === t.k
                        ? 'text-primary bg-background shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(148,163,184,0.3)]'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {t.l}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {(d.recent_quotes || [])
                  .filter((q: any) => {
                    if (vFilter === 'expiring' && q.status !== 'en_aprobacion') return false;
                    if (vFilter === 'draft' && q.status !== 'borrador') return false;
                    if (vFilter === 'approved' && q.status !== 'aceptada') return false;
                    if (vSearch.trim()) {
                      const s = vSearch.toLowerCase();
                      return (
                        q.code.toLowerCase().includes(s) ||
                        (q.customer?.business_name || '').toLowerCase().includes(s)
                      );
                    }
                    return true;
                  })
                  .map((q: any) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-background shadow-[-4px_-4px_10px_rgba(255,255,255,0.85),4px_4px_10px_rgba(148,163,184,0.35)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(148,163,184,0.35)]">
                          <Icon n="videocam" className="text-[20px]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-primary text-sm">{q.code}</span>
                            {renderStatusPill(q.status)}
                          </div>
                          <h3 className="text-sm font-semibold text-on-surface">
                            {q.customer?.business_name}
                          </h3>
                          <p className="text-xs text-on-surface-variant">
                            Fecha de emisión: {q.issue_date} · Válida hasta: {q.valid_until}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-on-surface-variant block font-bold">
                            Total Inc. IGV
                          </span>
                          <span className="text-base font-bold text-secondary">
                            S/ {formatPen(q.total_with_tax_pen)}
                          </span>
                        </div>
                        <Link
                          to={`/proformas/${q.id}`}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-neu-xs hover:bg-primary-container"
                        >
                          Ver Detalle
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha Vendedor: Simulador de Descuento */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-2xl bg-surface p-6 shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(148,163,184,0.35)]">
                  <Icon n="calculate" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="text-base text-primary font-bold">Simulador de Descuento</h3>
                  <span className="text-[11px] text-on-surface-variant font-semibold">
                    Política Tope Asesor: 5.0%
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-on-surface-variant font-semibold">
                  Monto Base de Proforma (Soles)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs">
                    S/
                  </span>
                  <input
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-background font-bold text-primary shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.85),inset_3px_3px_7px_rgba(148,163,184,0.4)] focus:outline-none"
                    type="number"
                    value={calcBase}
                    onChange={(e) => setCalcBase(Number(e.target.value) || 0)}
                  />
                </div>
                <label className="text-[11px] text-on-surface-variant font-semibold mt-1">
                  Descuento Comercial a Evaluar
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 8].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setCalcDesc(pct)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        calcDesc === pct
                          ? 'bg-secondary-container text-white shadow-neu-xs'
                          : 'bg-surface-container text-primary shadow-[-2px_-2px_5px_rgba(255,255,255,0.8),2px_2px_5px_rgba(148,163,184,0.3)]'
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.85),inset_3px_3px_7px_rgba(148,163,184,0.38)] flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">Estado de Política:</span>
                  <span className={`font-bold ${isViable && calcDesc <= 5 ? 'text-emerald-700' : 'text-error'}`}>
                    {calcDesc <= 5 ? 'Aprobación Directa' : 'Requiere VoBo Gerencia'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">Nuevo Total Cliente:</span>
                  <span className="text-base text-primary font-bold">
                    S/ {formatPen(finalSimulatedPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== VISTA GERENCIA · PIXEL-PERFECT SCREEN 02 + DYNAMIC PERIODS ====================
  const pendingCount = (d.pending_approvals || []).length;
  const evolution = d.evolution || [
    { month: 'Ene', quoted: 92000, count: 14 },
    { month: 'Feb', quoted: 115000, count: 18 },
    { month: 'Mar', quoted: 148000, count: 21 },
    { month: 'Abr', quoted: 130000, count: 19 },
    { month: 'May', quoted: 157000, count: 21 },
    { month: 'Jun', quoted: 186420, count: 24, isPeak: true },
  ];

  // Heights proportional to Screen 02 (80px, 105px, 130px, 118px, 145px, 168px)
  const barHeights = [80, 105, 130, 118, 145, 168];
  const isNegativeDelta = String(d.quotes_delta_pct || '').startsWith('-');
  const isNegativeQuotedDelta = String(d.quoted_delta_pct || '').startsWith('-');

  return (
    <div className={`flex flex-col w-full gap-6 pb-10 transition-opacity duration-200 ${loadingPeriod ? 'opacity-70' : 'opacity-100'}`}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-lg flex items-center gap-2">
          <Icon n="check_circle" className="text-secondary-container text-[18px]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header / Context Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary shadow-[-1px_-1px_3px_rgba(255,255,255,0.8),1px_1px_4px_rgba(162,63,0,0.4)]" />
            <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
              Vista de Gerencia · Perú
            </span>
          </div>
          <h1 className="text-2xl sm:text-[30px] sm:leading-[38px] font-semibold text-primary tracking-tight">
            Panel Gerencial · Resumen Operativo y Financiero
          </h1>
          <p className="text-sm text-on-surface-variant flex flex-wrap items-center gap-1.5 mt-0.5">
            <Icon n="calendar_today" className="text-[18px]" />
            <span>{d.context_date_label || 'Miércoles, 04 de Junio de 2026'}</span>
            <span className="text-outline-variant mx-1">·</span>
            <span
              onClick={() => outletCtx?.fetchLiveTc?.(true)}
              title={`Fuente: ${liveTcSource} · Compra: S/ ${liveTcBuy.toFixed(3)} · Venta: S/ ${liveTcSell.toFixed(3)}`}
              className="text-[13px] text-primary font-semibold cursor-pointer hover:text-secondary transition-colors"
            >
              Tasa de Cambio SUNAT (Lima): S/ {liveTcSell.toFixed(3)}
            </span>
          </p>
        </div>

        {/* Right Controls: Period Selector & Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {/* Period Selector Well */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.8),inset_3px_3px_7px_rgba(148,163,184,0.4)]">
            <Icon n="tune" className="text-secondary text-[18px]" />
            <select
              aria-label="Seleccionar periodo"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as any)}
              className="bg-transparent border-0 text-[13px] text-primary font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="jun2026">Junio 2026 (Mes Actual)</option>
              <option value="may2026">Mayo 2026</option>
              <option value="abr2026">Abril 2026</option>
              <option value="q2-2026">Segundo Trimestre (Q2)</option>
            </select>
          </div>

          {/* Quick Action: Export / Report */}
          <button
            onClick={exportCloseReport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface text-primary text-[13px] font-medium shadow-[-4px_-4px_9px_rgba(255,255,255,0.85),4px_4px_9px_rgba(148,163,184,0.35)] hover:shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),2px_2px_6px_rgba(148,163,184,0.45)] active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] transition-all"
            type="button"
          >
            <Icon n="download" className="text-[18px]" />
            <span>Exportar Cierre</span>
          </button>

          {/* Primary Action: Nueva Proforma */}
          <button
            onClick={() => nav('/proformas/nueva')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-[13px] font-medium shadow-[-4px_-4px_10px_rgba(255,255,255,0.6),4px_4px_12px_rgba(27,42,73,0.45)] hover:shadow-[-2px_-2px_6px_rgba(255,255,255,0.8),2px_2px_8px_rgba(27,42,73,0.55)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.1)] transition-all"
            type="button"
          >
            <Icon n="add_circle" className="text-[18px]" />
            <span>Nueva Proforma</span>
          </button>
        </div>
      </header>

      {/* Top KPI Grid: 4 Extruded Neumorphic Cards */}
      <section aria-label="Indicadores Clave" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Proformas del Mes */}
        <div className="flex flex-col justify-between p-4 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              {period === 'q2-2026' ? 'Proformas del Trimestre' : 'Proformas del Mes'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(148,163,184,0.35)]">
              <Icon n="assignment" className="text-[20px]" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-[36px] leading-[44px] font-bold text-primary tracking-tight tabular-nums">
              {d.quotes_count ?? 24}
            </span>
            <span className="text-[13px] font-medium text-on-surface-variant">emitidas</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-surface-container text-[11px] text-primary font-bold shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(148,163,184,0.35)]">
              <Icon
                n={isNegativeDelta ? 'trending_down' : 'trending_up'}
                className={`text-[14px] ${isNegativeDelta ? 'text-error' : 'text-secondary'}`}
              />{' '}
              {d.quotes_delta_pct || '+12%'}
            </span>
            <span className="text-xs text-on-surface-variant">{d.quotes_compare_label || 'vs. 21 en mayo'}</span>
          </div>
        </div>

        {/* Card 2: Monto Cotizado (PEN) */}
        <div className="flex flex-col justify-between p-4 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Monto Cotizado (PEN)
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(148,163,184,0.35)]">
              <Icon n="payments" className="text-[20px]" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-[18px] font-bold text-secondary">S/</span>
            <span className="text-[24px] leading-[32px] text-primary font-bold tracking-tight tabular-nums">
              {formatPen(d.total_quoted_pen ?? 186420)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-surface-container text-[11px] text-primary font-bold shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(148,163,184,0.35)]">
              <Icon
                n={isNegativeQuotedDelta ? 'trending_down' : 'trending_up'}
                className={`text-[14px] ${isNegativeQuotedDelta ? 'text-error' : 'text-secondary'}`}
              />{' '}
              {d.quoted_delta_pct || '+18.4%'}
            </span>
            <span className="text-xs text-on-surface-variant">Inc. IGV 18%</span>
          </div>
        </div>

        {/* Card 3: Tasa de Cierre Efectiva */}
        <div className="flex flex-col justify-between p-4 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Tasa de Cierre Efectiva
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(148,163,184,0.35)]">
              <Icon n="speed" className="text-[20px]" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-[36px] leading-[44px] font-bold text-primary tracking-tight tabular-nums">
              {Number(d.conversion_rate_pct ?? 38).toFixed(1)}%
            </span>
            <span className="text-[13px] font-medium text-on-surface-variant">aceptadas</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="w-24 h-2.5 rounded-full bg-surface-container-low shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(148,163,184,0.4)] overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, d.conversion_rate_pct ?? 38)}%` }}
              />
            </div>
            <span className="text-xs text-on-surface-variant">Obj. min: {d.conversion_target_pct ?? 35}%</span>
          </div>
        </div>

        {/* Card 4: Margen Operativo Prom. */}
        <div className="flex flex-col justify-between p-4 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Margen Operativo Prom.
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(148,163,184,0.35)]">
              <Icon n="analytics" className="text-[20px]" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-[36px] leading-[44px] font-bold text-primary tracking-tight tabular-nums">
              {Number(d.average_margin_pct ?? 29.4).toFixed(1)}%
            </span>
            <span className="text-[13px] text-secondary font-semibold">
              {d.margin_gap_label || '+9.4% gap'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
              <Icon n="verified" className="text-[16px] text-primary" />
              <span>Meta mínima: 20.0%</span>
            </span>
            <span className="text-[11px] font-bold text-primary">{d.margin_status_label || 'Óptimo'}</span>
          </div>
        </div>
      </section>

      {/* Middle Section: Asymmetric Grid 7:5 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 COLS): Visual Chart & Recent Quotes */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Chart Card: Neumorphic Bar Elevation (Jan - Jun 2026) */}
          <div className="p-6 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                  Comportamiento Semestral · {d.period_label}
                </span>
                <h2 className="text-[20px] sm:text-[22px] leading-[28px] text-primary font-bold">
                  Evolución de proformas cotizadas (Ene - Jun 2026)
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary-container" /> Regular
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-secondary-container" /> Mes Seleccionado / Pico
                </span>
              </div>
            </div>

            {/* Inline Neumorphic Bar Chart */}
            <div className="w-full pt-2 pb-1">
              <div className="relative w-full h-56 flex items-end justify-between px-4 pt-4 bg-surface-container-low rounded-xl shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.85),inset_3px_3px_7px_rgba(148,163,184,0.38)]">
                {/* Horizontal Guide Trenches */}
                <div className="absolute inset-x-4 top-1/4 h-px bg-slate-300/40 pointer-events-none" />
                <div className="absolute inset-x-4 top-2/4 h-px bg-slate-300/40 pointer-events-none" />
                <div className="absolute inset-x-4 top-3/4 h-px bg-slate-300/40 pointer-events-none" />

                {evolution.map((item: any, idx: number) => {
                  const isPeak = item.isPeak || idx === evolution.length - 1;
                  const isSelected = Boolean(item.isSelected);
                  const highlight = isSelected;
                  const kVal = Math.round((item.quoted || 0) / 1000);
                  const pfCount = item.count ?? [14, 18, 21, 19, 21, 24][idx] ?? 18;
                  const barHeight = barHeights[idx] || 110;

                  return (
                    <div
                      key={item.month}
                      onClick={() => handleBarClick(item.month)}
                      title={`Clic para cargar datos de ${item.month} 2026`}
                      className="flex flex-col items-center gap-1 z-10 w-1/6 relative cursor-pointer group"
                    >
                      {isPeak && (
                        <div className="absolute -top-6 px-2 py-0.5 rounded-full bg-secondary-container text-on-primary text-[11px] font-bold shadow-[-2px_-2px_5px_rgba(255,255,255,0.8),2px_2px_6px_rgba(162,63,0,0.3)]">
                          Pico
                        </div>
                      )}
                      {!isPeak && isSelected && (
                        <div className="absolute -top-6 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold shadow-neu-xs">
                          Activo
                        </div>
                      )}
                      <span
                        className={`text-[11px] tabular-nums ${
                          highlight ? 'text-secondary font-bold' : 'text-on-surface-variant font-semibold'
                        }`}
                      >
                        S/ {kVal}k
                      </span>
                      <div
                        className={`w-9 sm:w-10 rounded-t-lg transition-all duration-300 group-hover:brightness-110 ${
                          highlight
                            ? 'bg-secondary-container shadow-[-3px_-3px_8px_rgba(255,255,255,0.85),3px_3px_10px_rgba(242,107,33,0.45)] ring-2 ring-secondary/30'
                            : 'bg-primary-container shadow-[-3px_-3px_6px_rgba(255,255,255,0.7),3px_3px_8px_rgba(27,42,73,0.3)] opacity-85 group-hover:opacity-100'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      />
                      <span
                        className={`text-[13px] mt-1 ${
                          highlight ? 'text-secondary font-bold' : 'text-primary font-semibold'
                        }`}
                      >
                        {item.month}
                      </span>
                      <span
                        className={`text-xs -mt-1 pb-1 tabular-nums ${
                          highlight ? 'text-secondary font-semibold' : 'text-on-surface-variant'
                        }`}
                      >
                        {pfCount} pf
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footnote Metric */}
            <div className="flex flex-wrap items-center justify-between pt-3 px-1 text-xs text-on-surface-variant gap-2">
              <span>
                * Acumulado H1 2026:{' '}
                <strong className="text-primary font-semibold tabular-nums">
                  {d.semestral_summary?.total_quotes ?? 117} Proformas
                </strong>{' '}
                registradas (Periodo actual:{' '}
                <strong className="text-secondary font-bold">{d.quotes_count} pf</strong>)
              </span>
              <span className="text-primary font-semibold tabular-nums">
                Total Semestre: S/ {formatPen(d.semestral_summary?.total_pen ?? 828420)}
              </span>
            </div>
          </div>

          {/* Recent Quotes Table Card */}
          <div className="p-6 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                  Actividad del Periodo · {d.period_label}
                </span>
                <h2 className="text-[20px] sm:text-[22px] leading-[28px] text-primary font-bold">
                  Proformas recientes
                </h2>
              </div>
              <button
                onClick={() => nav('/proformas')}
                className="px-4 py-1.5 rounded-xl bg-surface text-primary text-[13px] font-semibold shadow-[-3px_-3px_7px_rgba(255,255,255,0.9),3px_3px_7px_rgba(148,163,184,0.35)] hover:shadow-[-1px_-1px_4px_rgba(255,255,255,0.9),1px_1px_4px_rgba(148,163,184,0.45)] active:shadow-[inset_2px_2px_4px_rgba(148,163,184,0.4)] transition-all"
                type="button"
              >
                Ver todas ({d.quotes_count ?? 24})
              </button>
            </div>

            {/* Table Outer / Responsive Wrapper */}
            <div className="overflow-x-auto w-full">
              <div className="min-w-[620px] flex flex-col gap-2">
                {/* Table Header Row (Subtly recessed) */}
                <div className="grid grid-cols-12 px-4 py-2.5 rounded-xl bg-surface-container-low shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.8),inset_2px_2px_5px_rgba(148,163,184,0.3)] text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  <span className="col-span-3">Código / Cliente</span>
                  <span className="col-span-3">Responsable Ventas</span>
                  <span className="col-span-3 text-right">Monto Total (IGV)</span>
                  <span className="col-span-2 text-center">Estado</span>
                  <span className="col-span-1 text-right">Fecha</span>
                </div>

                {(d.recent_quotes || []).slice(0, 5).map((q: any) => (
                  <div
                    key={q.id}
                    onClick={() => nav(`/proformas/${q.id}`)}
                    className="cursor-pointer grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-surface shadow-[-3px_-3px_7px_rgba(255,255,255,0.9),3px_3px_7px_rgba(148,163,184,0.25)] hover:shadow-[-4px_-4px_9px_rgba(255,255,255,0.95),4px_4px_9px_rgba(148,163,184,0.4)] transition-all"
                  >
                    <div className="col-span-3 flex flex-col min-w-0 pr-2">
                      <span className="text-[13px] font-bold text-primary truncate">{q.code}</span>
                      <span className="text-xs text-on-surface-variant truncate">
                        {q.customer?.business_name || 'Cliente'}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-1.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-surface-container text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                        {initials(q.seller_name)}
                      </span>
                      <span className="text-sm text-on-surface truncate">
                        {q.seller_name || 'Carlos Mendoza'}
                      </span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-base font-bold text-primary tabular-nums">
                        S/ {formatPen(q.total_with_tax_pen)}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-center">{renderStatusPill(q.status)}</div>
                    <div className="col-span-1 text-right text-xs text-on-surface-variant">
                      {q.relative_date || q.issue_date || 'Hoy'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): Gerential Approvals Queue */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Panel Header Container */}
          <div className="p-4 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-primary flex items-center justify-center shadow-[-2px_-2px_5px_rgba(255,255,255,0.8),2px_2px_6px_rgba(162,63,0,0.4)]">
                  <Icon n="gavel" className="text-[20px]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                    Autorizaciones Pendientes ({d.selected_month_code})
                  </span>
                  <h2 className="text-[18px] leading-[24px] text-primary font-bold">
                    Requieren aprobación
                  </h2>
                </div>
              </div>
              {/* Counter Badge Sunken */}
              <div className="px-3 py-1 rounded-full bg-surface-container-low shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(148,163,184,0.4)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-[13px] font-bold text-secondary tabular-nums">
                  {pendingCount} {pendingCount === 1 ? 'caso' : 'casos'}
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Cards Queue */}
          <div className="flex flex-col gap-4">
            {pendingCount === 0 && (
              <div className="p-6 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] text-center text-sm text-on-surface-variant">
                Todas las autorizaciones gerenciales de este periodo han sido procesadas.
              </div>
            )}

            {(d.pending_approvals || []).map((a: any) => {
              const q = a.quote || {};
              const reasonTitle =
                a.requested_reason === 'DISCOUNT_ABOVE_LIMIT'
                  ? 'Motivo: Descuento comercial excedido'
                  : a.requested_reason || 'Motivo: Margen bajo el mínimo';
              const detailText =
                a.detail_reason ||
                `Margen propuesto ${q.effective_margin_on_sale_pct ?? 16.5}% vs meta corporativa mín. 20.0%.`;
              const btnLabel = a.action_label || 'Aprobar Caso';
              const iconName = a.icon || 'warning';

              return (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-surface shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] flex flex-col gap-3 relative"
                >
                  {/* Top Row info */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                        {q.code}
                      </span>
                      <h3 className="text-base font-bold text-primary">
                        {q.customer?.business_name || 'Cliente Corporativo'}
                      </h3>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Icon n="person" className="text-[15px]" />
                        Solicitado por {q.seller_name || 'Jorge Salas'} (Ventas)
                      </p>
                    </div>
                    {/* Totalizer Well */}
                    <div className="px-3 py-1.5 rounded-xl bg-surface-container-low shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.8),inset_2px_2px_5px_rgba(148,163,184,0.4)] text-right">
                      <span className="text-[11px] text-on-surface-variant block leading-tight font-semibold">
                        Total
                      </span>
                      <span className="text-base font-bold text-primary tabular-nums">
                        S/ {formatPen(q.total_with_tax_pen)}
                      </span>
                    </div>
                  </div>

                  {/* Reason Alert Box (Neumorphic Inset Well) */}
                  <div className="p-3 rounded-xl bg-surface-container-low shadow-[inset_-3px_-3px_6px_rgba(255,255,255,0.85),inset_3px_3px_6px_rgba(148,163,184,0.35)] flex items-start gap-2">
                    <Icon n={iconName} className="text-secondary text-[20px] shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">
                        {reasonTitle}
                      </span>
                      <span className="text-xs text-on-surface mt-0.5">{detailText}</span>
                    </div>
                  </div>

                  {/* Actions Dual Buttons */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      onClick={() => nav(`/proformas/${q.id}`)}
                      className="flex-1 py-2 px-3 rounded-xl bg-surface text-primary text-[13px] font-semibold text-center shadow-[-3px_-3px_7px_rgba(255,255,255,0.85),3px_3px_7px_rgba(148,163,184,0.35)] hover:shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(148,163,184,0.45)] active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] transition-all"
                      type="button"
                    >
                      Revisar Detalle
                    </button>
                    <button
                      onClick={() => decide(q.id, 'approve', 'Aprobado desde Panel Gerencial')}
                      className="flex-1 py-2 px-3 rounded-xl bg-secondary-container text-on-primary text-[13px] font-bold text-center shadow-[-3px_-3px_8px_rgba(255,255,255,0.8),3px_3px_10px_rgba(162,63,0,0.35)] hover:shadow-[-2px_-2px_6px_rgba(255,255,255,0.85),2px_2px_8px_rgba(162,63,0,0.45)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.15)] transition-all"
                      type="button"
                    >
                      {btnLabel}
                    </button>
                    <button
                      onClick={() => setReject(q)}
                      title="Observar o rechazar caso"
                      className="py-2 px-2.5 rounded-xl bg-surface text-error text-xs font-bold shadow-[-3px_-3px_7px_rgba(255,255,255,0.85),3px_3px_7px_rgba(148,163,184,0.35)] hover:bg-error-container/40 transition-all"
                      type="button"
                    >
                      <Icon n="close" className="text-[16px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal de Rechazo / Observación */}
      {reject && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="rounded-2xl bg-surface w-full max-w-md p-6 shadow-[-8px_-8px_20px_rgba(255,255,255,0.9),8px_8px_20px_rgba(148,163,184,0.5)]">
            <h3 className="mb-1 text-lg font-bold text-primary">Observar / Rechazar {reject.code}</h3>
            <p className="mb-3 text-xs text-on-surface-variant">
              Cliente: {reject.customer?.business_name} · Indique el motivo para el asesor comercial:
            </p>
            <textarea
              className="w-full rounded-xl bg-surface-container-low p-3 text-sm shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.85),inset_3px_3px_7px_rgba(148,163,184,0.4)] outline-none mb-4"
              rows={3}
              placeholder="Ej. Ajustar margen mínimo a 20% o reducir descuento al 5%..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex justify-end gap-2.5">
              <button
                className="px-4 py-2 rounded-xl bg-surface text-primary text-xs font-semibold shadow-neu-xs"
                onClick={() => setReject(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-error text-white text-xs font-bold shadow-neu-xs disabled:opacity-50"
                disabled={!comment.trim()}
                onClick={() => decide(reject.id, 'reject')}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
