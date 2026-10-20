import { useCallback, useEffect, useState } from 'react';
import { api, money } from '../api';
import { Icon } from '../Layout';

export default function Reports() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('ytd-2026');
  const [advisor, setAdvisor] = useState('all');
  const [sunatStatus, setSunatStatus] = useState('all');
  const [searchVoucher, setSearchVoucher] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      period,
      advisor,
      sunat_status: sunatStatus,
    });
    api(`/reports/kpis?${params.toString()}`)
      .then(setKpis)
      .finally(() => setLoading(false));
  }, [period, advisor, sunatStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3200);
  };

  const handleSpotNotify = async (id: number, voucherCode: string) => {
    try {
      await api(`/reports/spot-notify/${id}`, { method: 'POST' });
      notify(`Constancia SPOT de ${voucherCode} conciliada con Banco de la Nación.`);
      load();
    } catch (e: any) {
      notify(e.message || 'No se pudo conciliar SPOT.');
    }
  };

  const downloadXmlCdr = (v: any) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${v.voucher_code}</ID>
  <IssueDate>${v.issue_date_label}</IssueDate>
  <InvoiceTypeCode listID="0101">01</InvoiceTypeCode>
  <DocumentCurrencyCode>PEN</DocumentCurrencyCode>
  <AccountingCustomerParty>
    <CustomerAssignedAccountID>${v.customer_ruc}</CustomerAssignedAccountID>
    <PartyName>${v.customer_name}</PartyName>
  </AccountingCustomerParty>
  <TaxTotal>
    <TaxAmount currencyID="PEN">${v.igv_pen.toFixed(2)}</TaxAmount>
  </TaxTotal>
  <LegalMonetaryTotal>
    <LineExtensionAmount currencyID="PEN">${v.subtotal_pen.toFixed(2)}</LineExtensionAmount>
    <PayableAmount currencyID="PEN">${v.total_pen.toFixed(2)}</PayableAmount>
  </LegalMonetaryTotal>
  <SUNAT_SPOT_Detraccion codigo="022" tasa="4.00%">${v.spot_pen.toFixed(2)}</SUNAT_SPOT_Detraccion>
  <SUNAT_CDR_Status>${v.sunat_status_label}</SUNAT_CDR_Status>
</Invoice>`;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CDR_${v.voucher_code}_${v.customer_ruc}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Archivo UBL 2.1 XML/CDR descargado: ${v.voucher_code}`);
  };

  const exportPle14 = () => {
    if (!kpis?.settlements) return;
    const headers = [
      'Periodo',
      'CUO',
      'Serie_Numero',
      'Cotizacion_Ref',
      'Fecha_Emision',
      'RUC_Cliente',
      'Razon_Social',
      'Base_Imponible_PEN',
      'IGV_18_PEN',
      'Detraccion_SPOT_4_PEN',
      'Importe_Total_PEN',
      'Estado_CDR_SUNAT',
    ];
    const rows = kpis.settlements.map((s: any, idx: number) => [
      '20261000',
      `M00${idx + 1}`,
      s.voucher_code,
      s.quote_code,
      s.issue_date_label,
      s.customer_ruc,
      `"${s.customer_name}"`,
      s.subtotal_pen.toFixed(2),
      s.igv_pen.toFixed(2),
      s.spot_pen.toFixed(2),
      s.total_pen.toFixed(2),
      `"${s.sunat_status_label}"`,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LE2060123456720261000140100001111_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Registro de Ventas PLE 14.1 / SIRE exportado exitosamente.');
  };

  if (loading && !kpis) {
    return <p className="text-muted font-medium">Cargando reportes financieros SUNAT…</p>;
  }
  if (!kpis) return null;

  const filteredSettlements = (kpis.settlements || []).filter((s: any) => {
    if (!searchVoucher.trim()) return true;
    const q = searchVoucher.toLowerCase();
    return (
      s.voucher_code.toLowerCase().includes(q) ||
      s.quote_code.toLowerCase().includes(q) ||
      s.customer_name.toLowerCase().includes(q) ||
      s.customer_ruc.includes(q)
    );
  });

  const leadCategory = kpis.categories?.[0] || { pct: 42, name: 'CCTV IP' };

  return (
    <div className="space-y-6 pb-8">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#10294d] px-5 py-3.5 text-xs font-bold text-white shadow-xl"
          style={{ boxShadow: '-4px -4px 10px rgba(255,255,255,0.6), 6px 6px 16px rgba(16,41,77,0.45)' }}
        >
          <Icon n="verified" className="text-[#ff752b] text-[18px]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Filter Workspace Bar (Screen 18) */}
      <section
        className="bg-[#E5EBF2] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
        style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 ml-1">
              Periodo Fiscal
            </label>
            <div
              className="flex items-center bg-[#E5EBF2] rounded-xl px-3 py-2 text-xs font-semibold text-primary"
              style={{ boxShadow: 'inset -3px -3px 7px #ffffff, inset 3px 3px 7px #cbd5e1' }}
            >
              <Icon n="calendar_month" className="text-secondary text-[16px] mr-2" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent border-none p-0 pr-5 text-xs font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="ytd-2026">Ejercicio 2026 (YTD)</option>
                <option value="q2-2026">Q2 2026 - Abr a Jun</option>
                <option value="q1-2026">Q1 2026 - Ene a Mar</option>
                <option value="jun2026">Mes en Curso (Junio)</option>
              </select>
            </div>
          </div>

          {/* Advisor Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 ml-1">
              Asesor Técnico-Comercial
            </label>
            <div
              className="flex items-center bg-[#E5EBF2] rounded-xl px-3 py-2 text-xs font-semibold text-primary"
              style={{ boxShadow: 'inset -3px -3px 7px #ffffff, inset 3px 3px 7px #cbd5e1' }}
            >
              <Icon n="person_search" className="text-primary text-[16px] mr-2" />
              <select
                value={advisor}
                onChange={(e) => setAdvisor(e.target.value)}
                className="bg-transparent border-none p-0 pr-5 text-xs font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Asesores (8)</option>
                <option value="Roberto">Ing. Roberto Sánchez</option>
                <option value="Carlos">Ing. Carlos Mendoza</option>
                <option value="Ana">Ing. Ana Paredes</option>
                <option value="Jorge">Téc. Jorge Salas</option>
              </select>
            </div>
          </div>

          {/* SUNAT Status Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 ml-1">
              Estado Tributario
            </label>
            <div
              className="flex items-center bg-[#E5EBF2] rounded-xl px-3 py-2 text-xs font-semibold text-primary"
              style={{ boxShadow: 'inset -3px -3px 7px #ffffff, inset 3px 3px 7px #cbd5e1' }}
            >
              <Icon n="account_balance" className="text-emerald-700 text-[16px] mr-2" />
              <select
                value={sunatStatus}
                onChange={(e) => setSunatStatus(e.target.value)}
                className="bg-transparent border-none p-0 pr-5 text-xs font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Estados SUNAT</option>
                <option value="cdr_accepted">Facturadas y Aceptadas CDR</option>
                <option value="pending_payment">Por Cobrar (30/60 días)</option>
                <option value="spot_pending">Detracciones Pendientes (SPOT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            type="button"
            onClick={exportPle14}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E5EBF2] text-xs font-bold text-primary hover:text-secondary transition-all active:scale-95"
            style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
          >
            <Icon n="table_view" className="text-[18px] text-emerald-700" />
            <span>PLE 14.1 / Excel SUNAT</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#ff752b] to-[#b13e00] text-white text-xs font-bold transition-all active:scale-95"
            style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
          >
            <Icon n="picture_as_pdf" className="text-[18px]" />
            <span>Descargar P&amp;L (PDF)</span>
          </button>
        </div>
      </section>

      {/* 4 Financial KPI Cards (Screen 18) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Ventas Netas Totales */}
        <div
          className="bg-[#E5EBF2] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
          style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Ventas Netas Totales
              </span>
              <h3 className="text-2xl font-extrabold text-primary mt-1 tracking-tight tabular-nums">
                {money(kpis.total_revenue_pen)}
              </h3>
            </div>
            <div
              className="w-10 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-primary"
              style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
            >
              <Icon n="payments" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-outline-variant/20">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800">
              <Icon n="trending_up" className="text-[14px]" />
              {kpis.revenue_delta_label || '+18.4% vs. Periodo anterior'}
            </span>
            <span className="text-[11px] font-semibold text-on-surface-variant">
              {kpis.executed_works_count || 48} Obras • Base Imponible
            </span>
          </div>
        </div>

        {/* KPI 2: Margen Bruto Ponderado */}
        <div
          className="bg-[#E5EBF2] rounded-2xl p-5 flex flex-col justify-between"
          style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Margen Bruto Ponderado
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-extrabold text-primary tracking-tight">
                  {kpis.profit_margin_pct}%
                </h3>
                <span className="text-xs font-bold text-secondary">
                  Meta: {kpis.target_margin_pct || 30}%
                </span>
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-secondary"
              style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
            >
              <Icon n="donut_large" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className="w-full h-2.5 bg-[#E5EBF2] rounded-full p-0.5 overflow-hidden"
              style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
            >
              <div
                className="h-full bg-gradient-to-r from-[#041533] to-[#ff752b] rounded-full"
                style={{ width: `${Math.min(100, kpis.profit_margin_pct * 2.2)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant mt-2">
              <span>Utilidad Estimada:</span>
              <span className="font-bold text-primary">{money(kpis.net_profit_pen)}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: IGV Débito Fiscal (18%) */}
        <div
          className="bg-[#E5EBF2] rounded-2xl p-5 flex flex-col justify-between"
          style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                IGV Débito Fiscal (18%)
              </span>
              <h3 className="text-2xl font-extrabold text-primary mt-1 tracking-tight tabular-nums">
                {money(kpis.igv_debito_pen)}
              </h3>
            </div>
            <div
              className="w-10 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-primary"
              style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
            >
              <Icon n="receipt_long" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1 pt-2 border-t border-outline-variant/20 text-[11px]">
            <div className="flex justify-between text-on-surface-variant font-medium">
              <span>Crédito Fiscal Compras:</span>
              <span className="font-bold text-emerald-700">- {money(kpis.igv_credito_pen)}</span>
            </div>
            <div className="flex justify-between text-primary font-extrabold">
              <span>Saldo Neto SUNAT:</span>
              <span>{money(kpis.igv_saldo_neto_pen)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: SPOT Banco de la Nación (4%) */}
        <div
          className="bg-[#E5EBF2] rounded-2xl p-5 flex flex-col justify-between"
          style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                SPOT Banco Nación (4%)
              </span>
              <h3 className="text-2xl font-extrabold text-secondary mt-1 tracking-tight tabular-nums">
                {money(kpis.spot_detraccion_pen)}
              </h3>
            </div>
            <div
              className="w-10 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-secondary"
              style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
            >
              <Icon n="account_balance_wallet" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-outline-variant/20">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-900">
              <Icon n="verified" className="text-[14px]" />
              {kpis.spot_conciliado_pct}% Conciliado
            </span>
            <span className="text-[11px] font-bold text-error">
              Pend: {money(kpis.spot_pendiente_pen)}
            </span>
          </div>
        </div>
      </section>

      {/* Main Analytical Bento: 8 Cols Evolution Chart + 4 Cols Specialty Donut (Screen 18) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 10-Month Combo Bar Chart (8 cols) */}
        <div
          className="lg:col-span-8 bg-[#E5EBF2] rounded-2xl p-6 flex flex-col justify-between"
          style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-extrabold text-primary">
                Evolución de Facturación y Costos de Instalación
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Comparativa Mensual (Ene - Oct 2026) • Expresado en Soles (PEN)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                <span className="text-on-surface">Ventas (Facturado)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-secondary-container inline-block" />
                <span className="text-on-surface">Equipos / Hardware</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" />
                <span className="text-on-surface">Mano de Obra (Cuadrillas)</span>
              </div>
            </div>
          </div>

          {/* Inset Chart Stage */}
          <div
            className="bg-[#E5EBF2] rounded-2xl p-5 pt-8 pb-4 relative h-64 flex flex-col justify-end"
            style={{ boxShadow: 'inset -4px -4px 9px #ffffff, inset 4px 4px 9px #cbd5e1' }}
          >
            {/* Horizontal Reference Guidelines */}
            <div className="absolute inset-x-5 top-6 bottom-10 flex flex-col justify-between pointer-events-none">
              {['S/ 200k', 'S/ 150k', 'S/ 100k', 'S/ 50k', 'S/ 0'].map((lbl) => (
                <div
                  key={lbl}
                  className="border-b border-outline-variant/20 w-full flex justify-between items-center"
                >
                  <span className="text-[10px] font-bold text-on-surface-variant/70 -mt-4">
                    {lbl}
                  </span>
                </div>
              ))}
            </div>

            {/* 10 Monthly Bar Groups */}
            <div className="relative z-10 grid grid-cols-10 gap-2 sm:gap-3 items-end h-44 pl-10 pt-2">
              {kpis.evolution.map((e: any) => (
                <div
                  key={e.key}
                  className="flex flex-col items-center gap-1.5 h-full justify-end group relative"
                >
                  {e.isCurrent && (
                    <div
                      className="absolute -top-6 bg-[#E5EBF2] px-2 py-0.5 rounded text-[9px] font-extrabold text-secondary whitespace-nowrap"
                      style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                    >
                      S/ {e.sales_k}k
                    </div>
                  )}
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                    <div
                      className="w-2 sm:w-2.5 bg-primary rounded-t-sm transition-all group-hover:brightness-125"
                      style={{ height: `${e.sales_pct || 60}%` }}
                      title={`Ventas ${e.month}: S/ ${e.sales_k}k`}
                    />
                    <div
                      className="w-2 sm:w-2.5 bg-secondary-container rounded-t-sm transition-all"
                      style={{ height: `${e.hardware_pct || 45}%` }}
                      title={`Hardware ${e.month}`}
                    />
                    <div
                      className="w-2 sm:w-2.5 bg-slate-400 rounded-t-sm transition-all"
                      style={{ height: `${e.labor_pct || 25}%` }}
                      title={`Mano de Obra ${e.month}`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      e.isCurrent ? 'font-extrabold text-secondary' : 'text-on-surface-variant'
                    }`}
                  >
                    {e.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Summary Strip */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-medium">Costo Total Materiales:</span>
                <span className="font-extrabold text-primary">
                  {money(kpis.total_materials_cost_pen || 614200)}
                </span>
              </div>
              <span className="text-outline-variant">|</span>
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-medium">
                  Ratio Mano de Obra / Venta:
                </span>
                <span className="font-extrabold text-emerald-700">18.4% (Óptimo)</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
              <Icon n="bolt" className="text-[14px]" />
              Octubre proyecta récord de facturación trimestral
            </span>
          </div>
        </div>

        {/* Right: Specialty Distribution Donut & Breakdown (4 cols) */}
        <div
          className="lg:col-span-4 bg-[#E5EBF2] rounded-2xl p-6 flex flex-col justify-between"
          style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
        >
          <div>
            <h2 className="text-base font-extrabold text-primary">Distribución por Especialidad</h2>
            <p className="text-xs text-on-surface-variant font-medium">
              Participación sobre Ventas Netas ({kpis.period_label})
            </p>
          </div>

          {/* SVG Donut Chart inside Neumorphic Ring */}
          <div className="my-5 flex items-center justify-center">
            <div
              className="w-44 h-44 rounded-full bg-[#E5EBF2] p-3 flex items-center justify-center relative"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#dce3ea" strokeWidth="3.8" />
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.915"
                  stroke="#041533"
                  strokeDasharray="42 58"
                  strokeDashoffset="0"
                  strokeWidth="3.8"
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.915"
                  stroke="#ff752b"
                  strokeDasharray="31 69"
                  strokeDashoffset="-42"
                  strokeWidth="3.8"
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.915"
                  stroke="#10294d"
                  strokeDasharray="15 85"
                  strokeDashoffset="-73"
                  strokeWidth="3.8"
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.915"
                  stroke="#64748b"
                  strokeDasharray="12 88"
                  strokeDashoffset="-88"
                  strokeWidth="3.8"
                />
              </svg>
              <div
                className="absolute inset-6 rounded-full bg-[#E5EBF2] flex flex-col items-center justify-center text-center"
                style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
              >
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Líder
                </span>
                <span className="text-lg font-extrabold text-primary">{leadCategory.pct}%</span>
                <span className="text-[10px] font-bold text-secondary">CCTV IP</span>
              </div>
            </div>
          </div>

          {/* Specialty Legend Breakdown */}
          <div className="space-y-2.5">
            {kpis.categories.map((c: any) => (
              <div
                key={c.name}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#E5EBF2]"
                style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${c.color || 'bg-primary'}`} />
                  <span className="font-bold text-primary">{c.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-primary">
                    S/ {Number(c.amount_pen || 0).toLocaleString('es-PE')}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-bold ml-1">
                    ({c.pct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Tax & Project Settlement Table (Liquidación Fiscal SUNAT - Screen 18) */}
      <section
        className="bg-[#E5EBF2] rounded-2xl p-6"
        style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-extrabold text-primary">
              Liquidación Fiscal SUNAT por Proforma Adjudicada
            </h2>
            <p className="text-xs text-on-surface-variant font-medium">
              Detalle de Comprobantes Electrónicos (Serie F001), IGV 18% y Detracciones SPOT (Código
              022 - 4%)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="bg-[#E5EBF2] rounded-xl px-3 py-1.5 flex items-center gap-2"
              style={{ boxShadow: 'inset -3px -3px 7px #ffffff, inset 3px 3px 7px #cbd5e1' }}
            >
              <Icon n="search" className="text-on-surface-variant text-[16px]" />
              <input
                type="text"
                value={searchVoucher}
                onChange={(e) => setSearchVoucher(e.target.value)}
                placeholder="Buscar RUC, Razón Social o Serie F001-..."
                className="bg-transparent border-none text-xs font-medium text-primary placeholder:text-on-surface-variant/70 focus:outline-none w-56"
              />
            </div>
            <button
              type="button"
              onClick={exportPle14}
              className="px-3 py-1.5 rounded-xl bg-[#E5EBF2] text-xs font-bold text-primary hover:text-secondary transition-all"
              style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
            >
              Exportar PLE 14.1
            </button>
          </div>
        </div>

        <div
          className="overflow-x-auto rounded-xl bg-[#E5EBF2] p-1"
          style={{ boxShadow: 'inset -4px -4px 9px #ffffff, inset 4px 4px 9px #cbd5e1' }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3.5 px-4">N° Comprobante</th>
                <th className="py-3.5 px-4">Cliente / RUC</th>
                <th className="py-3.5 px-4">Fecha Emisión</th>
                <th className="py-3.5 px-4 text-right">Subtotal (S/)</th>
                <th className="py-3.5 px-4 text-right">IGV 18% (S/)</th>
                <th className="py-3.5 px-4 text-right">SPOT 4% (S/)</th>
                <th className="py-3.5 px-4 text-right">Total Factura</th>
                <th className="py-3.5 px-4 text-center">Estado SUNAT</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-xs">
              {filteredSettlements.map((s: any) => {
                const isSpotPending = s.sunat_status === 'spot_pending';
                const isPaymentPending = s.sunat_status === 'pending_payment';
                return (
                  <tr key={s.id} className="hover:bg-white/30 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-primary">
                      <div className="flex flex-col">
                        <span>{s.voucher_code}</span>
                        <span className="text-[10px] font-semibold text-secondary">
                          Ref: {s.quote_code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-on-surface">{s.customer_name}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        RUC: {s.customer_ruc}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant font-semibold">
                      {s.issue_date_label}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-on-surface tabular-nums">
                      {s.subtotal_pen.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-on-surface-variant tabular-nums">
                      {s.igv_pen.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold tabular-nums ${
                        isSpotPending ? 'text-error' : 'text-secondary'
                      }`}
                    >
                      {s.spot_pen.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-primary tabular-nums">
                      {money(s.total_pen)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isSpotPending
                            ? 'bg-amber-500/15 text-amber-900'
                            : isPaymentPending
                            ? 'bg-blue-500/15 text-blue-900'
                            : 'bg-emerald-500/15 text-emerald-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSpotPending
                              ? 'bg-amber-600'
                              : isPaymentPending
                              ? 'bg-blue-600'
                              : 'bg-emerald-600'
                          }`}
                        />
                        {s.sunat_status_label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedVoucher(s)}
                          className="w-7 h-7 rounded-lg bg-[#E5EBF2] flex items-center justify-center text-primary hover:text-secondary transition-all active:scale-95"
                          style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                          title="Ver Liquidación de Obra"
                        >
                          <Icon n="visibility" className="text-[15px]" />
                        </button>
                        {isSpotPending ? (
                          <button
                            type="button"
                            onClick={() => handleSpotNotify(s.id, s.voucher_code)}
                            className="w-7 h-7 rounded-lg bg-[#E5EBF2] flex items-center justify-center text-secondary hover:text-primary transition-all active:scale-95"
                            style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                            title="Conciliar Depósito SPOT Banco de la Nación"
                          >
                            <Icon n="notifications_active" className="text-[15px]" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => downloadXmlCdr(s)}
                            className="w-7 h-7 rounded-lg bg-[#E5EBF2] flex items-center justify-center text-primary hover:text-secondary transition-all active:scale-95"
                            style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                            title="Descargar XML / CDR"
                          >
                            <Icon n="download" className="text-[15px]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Operational Footer Insights Well (Screen 18) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          className="bg-[#E5EBF2] rounded-2xl p-4 flex items-center gap-4"
          style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
        >
          <div
            className="w-11 h-11 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-emerald-700 shrink-0"
            style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
          >
            <Icon n="verified_user" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-primary">Certificado Digital SUNAT</h4>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Vigente hasta Dic 2027 • OSE Nubefact
            </p>
          </div>
        </div>

        <div
          className="bg-[#E5EBF2] rounded-2xl p-4 flex items-center gap-4"
          style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
        >
          <div
            className="w-11 h-11 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-primary shrink-0"
            style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
          >
            <Icon n="sync_saved_locally" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-primary">Última Sincronización SIRE</h4>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Hoy, 08:30 AM • 0 inconsistencias
            </p>
          </div>
        </div>

        <div
          className="bg-[#E5EBF2] rounded-2xl p-4 flex items-center gap-4"
          style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
        >
          <div
            className="w-11 h-11 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-secondary shrink-0"
            style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
          >
            <Icon n="savings" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-primary">Cuenta SPOT Banco Nación</h4>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Cta. Cte. N° 00-068-412590 Activa
            </p>
          </div>
        </div>
      </section>

      {/* Modal de Detalle de Comprobante Electrónico SUNAT */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-2xl bg-[#E5EBF2] p-6 space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #94a3b8' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Comprobante Electrónico UBL 2.1
                </span>
                <h3 className="text-lg font-extrabold text-primary">
                  Factura {selectedVoucher.voucher_code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="text-muted hover:text-primary"
              >
                <Icon n="close" />
              </button>
            </div>
            <div
              className="rounded-xl bg-[#E5EBF2] p-4 space-y-2 text-xs"
              style={{ boxShadow: 'inset -3px -3px 7px #ffffff, inset 3px 3px 7px #cbd5e1' }}
            >
              <div className="flex justify-between">
                <span className="text-muted">Razón Social:</span>
                <b className="text-primary">{selectedVoucher.customer_name}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">RUC:</span>
                <b className="font-mono text-primary">{selectedVoucher.customer_ruc}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Proforma Vinculada:</span>
                <b className="text-secondary">{selectedVoucher.quote_code}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Asesor Responsable:</span>
                <b className="text-primary">{selectedVoucher.advisor}</b>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-300/50">
                <span className="text-muted">Base Imponible:</span>
                <b className="text-primary">{money(selectedVoucher.subtotal_pen)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">IGV (18%):</span>
                <b className="text-primary">{money(selectedVoucher.igv_pen)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Detracción SPOT (4% Cód. 022):</span>
                <b className="text-secondary">{money(selectedVoucher.spot_pen)}</b>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-300/50 text-sm">
                <span className="font-extrabold text-primary">Total Factura:</span>
                <b className="font-extrabold text-primary">{money(selectedVoucher.total_pen)}</b>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => downloadXmlCdr(selectedVoucher)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-primary bg-[#E5EBF2]"
                style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
              >
                Descargar XML / CDR
              </button>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
