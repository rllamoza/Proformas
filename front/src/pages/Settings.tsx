import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api';
import { ExchangeRateInfo, Icon } from '../Layout';
import {
  CorporateProformaDocument,
  DEFAULT_COMPANY_PROFILE,
} from '../components/CorporateProformaDocument';

const LABELS: Record<string, string> = {
  technician_day_cost_pen: 'Costo día técnico (S/)',
  assistant_day_cost_pen: 'Costo día ayudante (S/)',
  effective_hours_per_day: 'Horas efectivas/día',
  buffer_pct: 'Colchón de tiempo (%)',
  default_travel_cost_per_day_pen: 'Viáticos/día (S/)',
  default_overhead_pct: 'Gastos generales (%)',
  default_margin_on_sale_pct: 'Margen objetivo (%)',
  min_margin_on_sale_pct: 'Margen mínimo (%)',
  seller_max_discount_pct: 'Descuento máx. vendedor (%)',
  tax_pct: 'IGV (%)',
};

type SettingsTab = 'corporate' | 'banks' | 'brands' | 'params';

export default function Settings() {
  const outletCtx = useOutletContext<{
    tc?: ExchangeRateInfo;
    fetchLiveTc?: (force?: boolean) => void;
    companyProfile?: any;
    refreshCompanyProfile?: () => Promise<void>;
  } | null>();

  const [activeTab, setActiveTab] = useState<SettingsTab>('corporate');
  const [p, setP] = useState<any>(null);
  const [fx, setFx] = useState<any>(null);
  const [company, setCompany] = useState<any>(DEFAULT_COMPANY_PROFILE);
  const [newCert, setNewCert] = useState('');
  const [msg, setMsg] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadSettings = () => {
    api('/settings').then((s) => {
      setP(s.labor_params);
      setFx(s.exchange_rate);
      if (s.company_profile) {
        setCompany({ ...DEFAULT_COMPANY_PROFILE, ...s.company_profile });
      }
    });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (!p || !fx) return <p className="text-muted p-6">Cargando configuración corporativa…</p>;

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      const saved = await api('/settings/company-profile', {
        method: 'PUT',
        body: company,
      });
      setCompany(saved);
      await outletCtx?.refreshCompanyProfile?.();
      flash('Identidad corporativa, logos, RUC, bancos y marcas guardados en todo el sistema');
    } catch (e: any) {
      flash(e.message || 'Error al guardar los datos de la empresa');
    } finally {
      setSavingCompany(false);
    }
  };

  const handleResetCompany = async () => {
    if (!window.confirm('¿Restaurar todos los datos, logos y marcas a los valores por defecto?')) {
      return;
    }
    const restored = await api('/settings/company-profile/reset', { method: 'POST' });
    setCompany(restored);
    await outletCtx?.refreshCompanyProfile?.();
    flash('Valores corporativos restaurados al estándar original');
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onResult: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onResult(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const lookupCompanyRuc = async () => {
    const ruc = String(company.ruc || '').trim();
    if (ruc.length < 8) return;
    try {
      const res = await api<any>(`/customers/lookup?document=${encodeURIComponent(ruc)}`);
      if (res?.business_name) {
        setCompany((prev: any) => ({
          ...prev,
          business_name: res.business_name,
          fiscal_address: res.fiscal_address || prev.fiscal_address,
        }));
        flash(`Datos SUNAT cargados para RUC ${ruc}: ${res.business_name}`);
      }
    } catch {
      // Ignorar fallo de consulta
    }
  };

  const syncLiveSunat = async () => {
    setSyncing(true);
    try {
      const live = await api<ExchangeRateInfo>('/exchange-rate/live?refresh=1', {
        method: 'POST',
      });
      setFx((prev: any) => ({
        ...prev,
        usd_to_pen_buy: live.usd_to_pen_buy,
        usd_to_pen_sell: live.usd_to_pen_sell,
        source: live.source,
        rate_date: live.rate_date,
      }));
      outletCtx?.fetchLiveTc?.(false);
      flash(
        `Sincronizado con ${live.source} (Lima): Compra S/ ${live.usd_to_pen_buy.toFixed(3)} · Venta S/ ${live.usd_to_pen_sell.toFixed(3)}`
      );
    } catch (e: any) {
      flash(e.message || 'No se pudo consultar el servicio público');
    } finally {
      setSyncing(false);
    }
  };

  // Proforma de muestra para la Vista Previa en Vivo
  const samplePreviewQuote = {
    code: 'PF-2026-0001',
    version: 1,
    status: 'emitida',
    issue_date: new Date().toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    exchange_rate_sell: fx?.usd_to_pen_sell || 3.742,
    company_profile: company,
    customer: {
      business_name: 'CORPORACIÓN LOGÍSTICA DEL PACÍFICO S.A.C.',
      document_type: 'RUC',
      document_number: '20548912304',
      contact_name: 'Ing. Roberto Valdivia (Jefe de Operaciones TI)',
      phone: '+51 998 452 110',
      email: 'rvaldivia@corplogistica.com.pe',
      fiscal_address: 'Av. Los Eucaliptos Mz. D Lt. 14 - Zona Industrial Lurín, Lima',
    },
    project: {
      name: 'Implementación CCTV IP 4K + Troncal Fibra Óptica OM4',
      subtitle: '16 Cámaras IP AcuSense + Gabinete 42RU + Certificación Fluke',
      installation_address: 'Sede Almacén Central Lurín',
      floors: 3,
    },
    seller_name: 'Ing. Carlos Mendoza Rojas',
    crews_label: '2 Cuadrillas Certificadas N2',
    estimated_days: 5.0,
    total_hours: 52.0,
    lines: [
      {
        item: '01',
        code: 'HIK-DS2CD2187G2',
        brand: 'HIKVISION',
        description: 'Cámara IP Domo/Bullet 4K ColorVu AcuSense IP67 IK10 PoE Integrado',
        specs: 'Lente 2.8mm, WDR 130dB, Analítica IA humana/vehicular',
        zone_name: 'Zona A: Perímetro',
        unit: 'UND',
        quantity: 16,
        unit_price_pen: 685.0,
        line_sale_subtotal_pen: 10960.0,
      },
      {
        item: '02',
        code: 'UBI-USW-PRO-24P',
        brand: 'UBIQUITI',
        description: 'Switch Administrable L2/L3 24 Puertos PoE+ (400W) + Uplinks 10G SFP+',
        specs: 'Alimentación PoE inteligente y segmentación VLAN de seguridad',
        zone_name: 'Zona B: Data Center',
        unit: 'UND',
        quantity: 2,
        unit_price_pen: 2450.0,
        line_sale_subtotal_pen: 4900.0,
      },
      {
        item: '03',
        code: 'PAN-CAT6A-LSZH',
        brand: 'PANDUIT',
        description: 'Puntos de Red Certificados Cat. 6A LSZH Cobre Puro + Canalización EMT',
        specs: 'Incluye Jack RJ45 TX6A, Patch Panel, organizador y certificación Fluke',
        zone_name: 'Zona A: Tendido Troncal',
        unit: 'PTO',
        quantity: 16,
        unit_price_pen: 390.64,
        line_sale_subtotal_pen: 6250.17,
      },
      {
        item: '04',
        code: 'SRV-ING-INST',
        brand: 'FLUKE / PRO',
        description: 'Servicio de Ingeniería, Instalación en Altura, Fusión FO y Puesta en Marcha',
        specs: 'Cuadrilla técnica certificada con SCTR Salud/Pensión y entrega de Dossier',
        zone_name: 'General de Obra',
        unit: 'GLB',
        quantity: 1,
        unit_price_pen: 2000.0,
        line_sale_subtotal_pen: 2000.0,
      },
    ],
    gross_before_discount_pen: 24110.17,
    discount_pct: 0,
    discount_amount_pen: 0,
    taxable_base_pen: 24110.17,
    tax_amount_pen: 4339.83,
    total_with_tax_pen: 28450.0,
    warranty_text: company.default_warranty_text,
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera Principal con Botones de Guardado Rápido y Vista Previa Proforma A4 */}
      <div
        className="bg-[#E5EBF2] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-extrabold uppercase tracking-wider">
              Personalización Corporativa Total
            </span>
            <span className="text-xs font-bold text-on-surface-variant">
              RUC Activo: <b className="text-primary">{company.ruc}</b>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-1">
            Identidad de la Empresa, Logos, RUC y Parámetros
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Personaliza el logotipo, razón social, RUC, dirección, teléfonos, cuentas bancarias CCI
            y las marcas de redes/cámaras del PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#041533] text-white text-xs font-extrabold flex items-center gap-2 hover:bg-[#102447] transition-all active:scale-95"
          >
            <Icon n="visibility" className="text-[#ff6b1a] text-[18px]" />
            <span>Vista Previa Proforma PDF</span>
          </button>

          <button
            type="button"
            onClick={handleResetCompany}
            className="px-3.5 py-2.5 rounded-xl bg-[#E5EBF2] text-xs font-bold text-on-surface-variant hover:text-primary flex items-center gap-1.5"
            style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #c5cdd6' }}
          >
            <Icon n="restart_alt" className="text-[17px]" />
            <span>Restaurar</span>
          </button>

          <button
            type="button"
            disabled={savingCompany}
            onClick={handleSaveCompany}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff752b] to-[#b13e00] text-white text-xs font-extrabold flex items-center gap-2 transition-all active:scale-95"
            style={{ boxShadow: '-4px -4px 10px #ffffff, 4px 4px 12px rgba(177, 62, 0, 0.35)' }}
          >
            <Icon n="save" className="text-[18px]" />
            <span>{savingCompany ? 'Guardando…' : 'Guardar Cambios de Empresa'}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl bg-emerald-100 border border-emerald-300 p-3.5 text-sm font-bold text-emerald-900 flex items-center gap-2">
          <Icon n="check_circle" className="text-emerald-700 text-[20px]" />
          <span>{msg}</span>
        </div>
      )}

      {/* Barra de Pestañas Neumórfica */}
      <div
        className="bg-[#E5EBF2] p-2 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
        style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
      >
        {(
          [
            {
              id: 'corporate',
              label: '1. Empresa, Logos y RUC',
              icon: 'domain',
            },
            {
              id: 'banks',
              label: '2. Bancos CCI & Detracción',
              icon: 'account_balance',
            },
            {
              id: 'brands',
              label: '3. Marcas Redes y Cámaras',
              icon: 'verified',
            },
            {
              id: 'params',
              label: '4. Costeo M.O. & TC SUNAT',
              icon: 'tune',
            },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                active
                  ? 'bg-primary text-white shadow-md'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <Icon n={tab.icon} className="text-[18px]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          PESTAÑA 1: IDENTIDAD CORPORATIVA, LOGOS, RUC Y DATOS DE LA EMPRESA
         ===================================================================== */}
      {activeTab === 'corporate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda (5 cols): Logos, Firma Digital y Colores */}
          <div className="lg:col-span-5 space-y-6">
            {/* Logo Principal de la Empresa */}
            <div
              className="bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-primary flex items-center gap-2">
                    <Icon n="image" className="text-secondary" />
                    Logotipo Oficial de la Empresa
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Se muestra en el menú lateral, en la vista de proforma y en el PDF A4.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-300">
                {company.logo_url ? (
                  <div className="w-24 h-20 rounded-xl border border-slate-200 p-2 flex items-center justify-center bg-white shrink-0">
                    <img
                      src={company.logo_url}
                      alt="Logo Empresa"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 border-b-4 shadow-md"
                    style={{
                      backgroundColor: company.primary_color || '#041533',
                      borderBottomColor: company.accent_color || '#ff6b1a',
                    }}
                  >
                    <Icon
                      n="precision_manufacturing"
                      className="text-[30px]"
                      style={{ color: company.accent_color || '#ff6b1a' }}
                    />
                    <span className="text-[10px] font-black tracking-widest mt-1">
                      {company.short_code || 'INST-PE'}
                    </span>
                  </div>
                )}

                <div className="space-y-2 flex-1 min-w-0">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-extrabold hover:opacity-95">
                    <Icon n="upload_file" className="text-[16px]" />
                    <span>Subir Imagen de Logo (PNG / SVG / JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageUpload(e, (dataUrl) =>
                          setCompany({ ...company, logo_url: dataUrl })
                        )
                      }
                    />
                  </label>

                  {company.logo_url && (
                    <button
                      type="button"
                      onClick={() => setCompany({ ...company, logo_url: '' })}
                      className="block text-xs font-bold text-red-700 hover:underline"
                    >
                      Quitar imagen y usar sello vectorial ({company.short_code})
                    </button>
                  )}

                  <input
                    type="text"
                    placeholder="O pega la URL directa de tu logo (https://...)"
                    value={company.logo_url?.startsWith('data:') ? '' : company.logo_url || ''}
                    onChange={(e) => setCompany({ ...company, logo_url: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-primary"
                  />
                </div>
              </div>

              {/* Firma / Sello Digital para el PDF */}
              <div className="pt-3 border-t border-slate-300/60 space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Icon n="draw" className="text-secondary text-[16px]" />
                  Firma y Sello Digital Autorizado (Bloque de Firma PDF)
                </h3>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-white border border-slate-300">
                  <div className="w-28 h-14 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                    {company.signature_url ? (
                      <img
                        src={company.signature_url}
                        alt="Firma"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Sin imagen firma</span>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E5EBF2] text-primary text-xs font-bold hover:text-secondary">
                      <Icon n="upload" className="text-[15px]" />
                      <span>Subir Firma / Sello PNG</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (dataUrl) =>
                            setCompany({ ...company, signature_url: dataUrl })
                          )
                        }
                      />
                    </label>
                    {company.signature_url && (
                      <button
                        type="button"
                        onClick={() => setCompany({ ...company, signature_url: '' })}
                        className="block text-[11px] font-bold text-red-700 hover:underline"
                      >
                        Eliminar firma gráfica
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Colores Corporativos del Documento PDF */}
              <div className="pt-3 border-t border-slate-300/60 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5">
                    Color Corporativo Principal
                  </label>
                  <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-slate-300">
                    <input
                      type="color"
                      value={company.primary_color || '#041533'}
                      onChange={(e) => setCompany({ ...company, primary_color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={company.primary_color || '#041533'}
                      onChange={(e) => setCompany({ ...company, primary_color: e.target.value })}
                      className="w-full text-xs font-mono font-bold text-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5">
                    Color Acento / Destacado
                  </label>
                  <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-slate-300">
                    <input
                      type="color"
                      value={company.accent_color || '#ff6b1a'}
                      onChange={(e) => setCompany({ ...company, accent_color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={company.accent_color || '#ff6b1a'}
                      onChange={(e) => setCompany({ ...company, accent_color: e.target.value })}
                      className="w-full text-xs font-mono font-bold text-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Certificaciones Homologadas */}
            <div
              className="bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
                <Icon n="workspace_premium" className="text-secondary" />
                Sellos y Certificaciones en Cabecera PDF
              </h3>

              <div className="flex flex-wrap gap-2">
                {(company.certifications || []).map((cert: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-primary"
                  >
                    <span>{cert}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCompany({
                          ...company,
                          certifications: company.certifications.filter(
                            (_: string, i: number) => i !== idx
                          ),
                        })
                      }
                      className="text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Homologación SGS / ISO 27001"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCert.trim()) return;
                    setCompany({
                      ...company,
                      certifications: [...(company.certifications || []), newCert.trim()],
                    });
                    setNewCert('');
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-extrabold"
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Columna Derecha (7 cols): Datos Fiscales, RUC, Dirección y Contacto */}
          <div
            className="lg:col-span-7 bg-[#E5EBF2] rounded-2xl p-6 space-y-5"
            style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
          >
            <div className="flex items-center justify-between border-b border-slate-300/60 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-primary flex items-center gap-2">
                  <Icon n="business" className="text-secondary" />
                  Datos Fiscales, RUC y Contacto Corporativo
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Información oficial del emisor que aparece en el encabezado y pie de todas las
                  proformas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* RUC con autocompletado SUNAT */}
              <div className="sm:col-span-5">
                <label className="label">Número de R.U.C. de la Empresa *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={11}
                    value={company.ruc}
                    onChange={(e) => setCompany({ ...company, ruc: e.target.value })}
                    className="input font-mono font-bold"
                    placeholder="20601234567"
                  />
                  <button
                    type="button"
                    onClick={lookupCompanyRuc}
                    title="Consultar RUC en padrón SUNAT"
                    className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold shrink-0 flex items-center gap-1"
                  >
                    <Icon n="search" className="text-[16px]" />
                    SUNAT
                  </button>
                </div>
              </div>

              {/* Razón Social */}
              <div className="sm:col-span-7">
                <label className="label">Razón Social Oficial (Facturación / Proforma) *</label>
                <input
                  type="text"
                  value={company.business_name}
                  onChange={(e) => setCompany({ ...company, business_name: e.target.value })}
                  className="input font-bold"
                  placeholder="PRECISION SYSTEMS INSTALACIONES S.A.C."
                />
              </div>

              {/* Nombre Comercial Corto (Sidebar) */}
              <div className="sm:col-span-4">
                <label className="label">Nombre Comercial (Menú Lateral)</label>
                <input
                  type="text"
                  value={company.trade_name}
                  onChange={(e) => setCompany({ ...company, trade_name: e.target.value })}
                  className="input font-bold"
                  placeholder="PROFORMAS"
                />
              </div>

              {/* Subtítulo Comercial (Sidebar) */}
              <div className="sm:col-span-4">
                <label className="label">Subtítulo Comercial</label>
                <input
                  type="text"
                  value={company.trade_subtitle}
                  onChange={(e) => setCompany({ ...company, trade_subtitle: e.target.value })}
                  className="input"
                  placeholder="Instalaciones PE"
                />
              </div>

              {/* Sigla / Código Corto */}
              <div className="sm:col-span-4">
                <label className="label">Sigla de Sello / Ícono</label>
                <input
                  type="text"
                  maxLength={10}
                  value={company.short_code}
                  onChange={(e) => setCompany({ ...company, short_code: e.target.value })}
                  className="input font-mono font-bold"
                  placeholder="INST-PE"
                />
              </div>

              {/* Giro / Especialidad */}
              <div className="sm:col-span-8">
                <label className="label">Giro Comercial / Especialidad Técnica (Tagline)</label>
                <input
                  type="text"
                  value={company.tagline}
                  onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                  className="input"
                />
              </div>

              {/* Badge SUNAT */}
              <div className="sm:col-span-4">
                <label className="label">Distintivo Facturación SUNAT</label>
                <input
                  type="text"
                  value={company.sunat_badge}
                  onChange={(e) => setCompany({ ...company, sunat_badge: e.target.value })}
                  className="input"
                />
              </div>

              {/* Dirección Fiscal */}
              <div className="sm:col-span-12">
                <label className="label">Dirección Fiscal / Sede Central Operativa *</label>
                <input
                  type="text"
                  value={company.fiscal_address}
                  onChange={(e) => setCompany({ ...company, fiscal_address: e.target.value })}
                  className="input"
                />
              </div>

              {/* Teléfono Central */}
              <div className="sm:col-span-4">
                <label className="label">Teléfono Central / PBX</label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="input"
                />
              </div>

              {/* WhatsApp Corporativo */}
              <div className="sm:col-span-4">
                <label className="label">WhatsApp Corporativo / B2B</label>
                <input
                  type="text"
                  value={company.whatsapp}
                  onChange={(e) => setCompany({ ...company, whatsapp: e.target.value })}
                  className="input"
                />
              </div>

              {/* Sitio Web */}
              <div className="sm:col-span-4">
                <label className="label">Sitio Web Oficial</label>
                <input
                  type="text"
                  value={company.website}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  className="input"
                />
              </div>

              {/* Email Corporativo */}
              <div className="sm:col-span-6">
                <label className="label">Correo Electrónico Comercial / Ingeniería</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="input"
                />
              </div>

              {/* Código de Control Documental */}
              <div className="sm:col-span-6">
                <label className="label">Código de Control Documental ISO (Pie PDF)</label>
                <input
                  type="text"
                  value={company.document_control_code}
                  onChange={(e) =>
                    setCompany({ ...company, document_control_code: e.target.value })
                  }
                  className="input"
                />
              </div>

              {/* Garantía por defecto */}
              <div className="sm:col-span-12">
                <label className="label">Texto Estándar de Garantía Oficial y SLA Postventa</label>
                <textarea
                  rows={2}
                  value={company.default_warranty_text}
                  onChange={(e) =>
                    setCompany({ ...company, default_warranty_text: e.target.value })
                  }
                  className="input"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-300/60 flex justify-end">
              <button
                type="button"
                onClick={handleSaveCompany}
                className="btn-primary flex items-center gap-2"
              >
                <Icon n="save" className="text-[18px]" />
                <span>Guardar Datos de la Empresa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 2: CUENTAS BANCARIAS CORPORATIVAS, CCI & DETRACCIÓN SPOT
         ===================================================================== */}
      {activeTab === 'banks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cuentas Comerciales (8 cols) */}
          <div
            className="lg:col-span-8 bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
            style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/60 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-primary flex items-center gap-2">
                  <Icon n="account_balance" className="text-secondary" />
                  Cuentas Bancarias Comerciales y CCI ({company.business_name})
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Estas cuentas aparecen en la Sección V de todas las proformas emitidas.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCompany({
                    ...company,
                    bank_accounts: [
                      ...(company.bank_accounts || []),
                      {
                        bank: 'Interbank',
                        currency: 'Soles (PEN S/)',
                        account_number: '200-3001928371',
                        cci: '003-200-003001928371-32',
                      },
                    ],
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-extrabold flex items-center gap-1"
              >
                <Icon n="add" className="text-[16px]" />
                <span>Agregar Cuenta Bancaria</span>
              </button>
            </div>

            <div className="space-y-3">
              {(company.bank_accounts || []).map((acc: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-slate-300 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Entidad Bancaria
                    </label>
                    <input
                      type="text"
                      value={acc.bank}
                      onChange={(e) => {
                        const next = [...company.bank_accounts];
                        next[idx] = { ...next[idx], bank: e.target.value };
                        setCompany({ ...company, bank_accounts: next });
                      }}
                      className="input text-xs font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Moneda
                    </label>
                    <input
                      type="text"
                      value={acc.currency}
                      onChange={(e) => {
                        const next = [...company.bank_accounts];
                        next[idx] = { ...next[idx], currency: e.target.value };
                        setCompany({ ...company, bank_accounts: next });
                      }}
                      className="input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      N° Cuenta Corriente
                    </label>
                    <input
                      type="text"
                      value={acc.account_number}
                      onChange={(e) => {
                        const next = [...company.bank_accounts];
                        next[idx] = { ...next[idx], account_number: e.target.value };
                        setCompany({ ...company, bank_accounts: next });
                      }}
                      className="input text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Código Interbancario (CCI)
                    </label>
                    <input
                      type="text"
                      value={acc.cci}
                      onChange={(e) => {
                        const next = [...company.bank_accounts];
                        next[idx] = { ...next[idx], cci: e.target.value };
                        setCompany({ ...company, bank_accounts: next });
                      }}
                      className="input text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setCompany({
                          ...company,
                          bank_accounts: company.bank_accounts.filter(
                            (_: any, i: number) => i !== idx
                          ),
                        })
                      }
                      className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                      title="Eliminar cuenta"
                    >
                      <Icon n="delete" className="text-[18px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cuenta de Detracciones SUNAT SPOT (4 cols) */}
          <div
            className="lg:col-span-4 bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
            style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
          >
            <h2 className="text-base font-extrabold text-primary flex items-center gap-2">
              <Icon n="gavel" className="text-secondary" />
              Cuenta de Detracciones SUNAT (SPOT)
            </h2>
            <p className="text-xs text-on-surface-variant">
              Configura la cuenta del Banco de la Nación y el porcentaje de retención SPOT aplicable
              en las proformas.
            </p>

            <div className="space-y-3">
              <div>
                <label className="label">Entidad Recaudadora SPOT</label>
                <input
                  type="text"
                  value={company.spot_bank_name}
                  onChange={(e) => setCompany({ ...company, spot_bank_name: e.target.value })}
                  className="input font-bold"
                />
              </div>
              <div>
                <label className="label">N° Cuenta de Detracciones</label>
                <input
                  type="text"
                  value={company.spot_account_number}
                  onChange={(e) => setCompany({ ...company, spot_account_number: e.target.value })}
                  className="input font-mono font-bold"
                />
              </div>
              <div>
                <label className="label">Código de Bien / Servicio SUNAT</label>
                <input
                  type="text"
                  value={company.spot_code_label}
                  onChange={(e) => setCompany({ ...company, spot_code_label: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Porcentaje de Detracción SPOT (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={company.spot_pct}
                  onChange={(e) => setCompany({ ...company, spot_pct: Number(e.target.value) })}
                  className="input font-bold"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveCompany}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Icon n="save" className="text-[18px]" />
              <span>Guardar Cuentas y SPOT</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 3: MARCAS Y LOGOS DE REDES Y CÁMARAS (PIE DE PÁGINA PDF)
         ===================================================================== */}
      {activeTab === 'brands' && (
        <div className="space-y-6">
          {/* Títulos del Pie de Página */}
          <div
            className="bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
            style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
          >
            <h2 className="text-base font-extrabold text-primary flex items-center gap-2">
              <Icon n="verified" className="text-secondary" />
              Encabezado del Pie de Página de Marcas Homologadas (PDF A4)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Título Principal del Pie de Marcas</label>
                <input
                  type="text"
                  value={company.footer_title}
                  onChange={(e) => setCompany({ ...company, footer_title: e.target.value })}
                  className="input font-bold"
                />
              </div>
              <div>
                <label className="label">Subtítulo de Garantía de Marcas</label>
                <input
                  type="text"
                  value={company.footer_subtitle}
                  onChange={(e) => setCompany({ ...company, footer_subtitle: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Grupo 1: Marcas de Cámaras de Seguridad y CCTV */}
            <div
              className="bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <div className="flex items-center justify-between border-b border-slate-300/60 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Icon n="videocam" className="text-secondary" />
                    Marcas de Cámaras IP &amp; Videovigilancia
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Puedes personalizar el nombre, subtítulo, color o subir el logo PNG/SVG de cada
                    marca.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCompany({
                      ...company,
                      camera_brands: [
                        ...(company.camera_brands || []),
                        {
                          name: 'NUEVA MARCA',
                          prefix: 'NUEVA',
                          suffix: 'MARCA',
                          sub: 'Authorized Partner',
                          accent: '#d9232e',
                          prefixColor: '#d9232e',
                          suffixColor: '#041533',
                          logo_url: '',
                        },
                      ],
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-extrabold"
                >
                  + Agregar Marca
                </button>
              </div>

              <div className="space-y-3">
                {(company.camera_brands || []).map((b: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ borderLeftWidth: '4px', borderLeftColor: b.accent || '#d9232e' }}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                      <div>
                        <label className="block text-[9.5px] font-bold uppercase text-slate-400">
                          Marca / Nombre
                        </label>
                        <input
                          type="text"
                          value={b.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = [...company.camera_brands];
                            next[idx] = { ...next[idx], name: val, prefix: val, suffix: '' };
                            setCompany({ ...company, camera_brands: next });
                          }}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-black text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold uppercase text-slate-400">
                          Categoría / Partner
                        </label>
                        <input
                          type="text"
                          value={b.sub}
                          onChange={(e) => {
                            const next = [...company.camera_brands];
                            next[idx] = { ...next[idx], sub: e.target.value };
                            setCompany({ ...company, camera_brands: next });
                          }}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div>
                          <label className="block text-[9.5px] font-bold uppercase text-slate-400">
                            Color
                          </label>
                          <input
                            type="color"
                            value={b.accent || '#d9232e'}
                            onChange={(e) => {
                              const next = [...company.camera_brands];
                              next[idx] = {
                                ...next[idx],
                                accent: e.target.value,
                                prefixColor: e.target.value,
                              };
                              setCompany({ ...company, camera_brands: next });
                            }}
                            className="w-7 h-7 rounded cursor-pointer border-0"
                          />
                        </div>

                        <label className="cursor-pointer px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-primary flex items-center gap-1">
                          <Icon n="upload" className="text-[14px]" />
                          <span>{b.logo_url ? 'Cambiar Logo' : 'Logo PNG'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e, (dataUrl) => {
                                const next = [...company.camera_brands];
                                next[idx] = { ...next[idx], logo_url: dataUrl };
                                setCompany({ ...company, camera_brands: next });
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {b.logo_url && (
                        <img
                          src={b.logo_url}
                          alt={b.name}
                          className="h-6 max-w-[60px] object-contain border border-slate-200 rounded p-0.5"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setCompany({
                            ...company,
                            camera_brands: company.camera_brands.filter(
                              (_: any, i: number) => i !== idx
                            ),
                          })
                        }
                        className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                        title="Quitar marca"
                      >
                        <Icon n="delete" className="text-[16px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grupo 2: Marcas de Redes, Wi-Fi y Cableado Estructurado */}
            <div
              className="bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <div className="flex items-center justify-between border-b border-slate-300/60 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Icon n="router" className="text-secondary" />
                    Marcas de Redes, Wi-Fi &amp; Cableado Estructurado
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Personaliza las marcas de networking y fibra óptica del pie de página PDF.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCompany({
                      ...company,
                      network_brands: [
                        ...(company.network_brands || []),
                        {
                          name: 'FORTINET',
                          sub: 'Security Fabric',
                          accent: '#ee3124',
                          color: '#ee3124',
                          logo_url: '',
                        },
                      ],
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-extrabold"
                >
                  + Agregar Marca
                </button>
              </div>

              <div className="space-y-3">
                {(company.network_brands || []).map((b: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ borderLeftWidth: '4px', borderLeftColor: b.accent || '#049fd9' }}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                      <div>
                        <label className="block text-[9.5px] font-bold uppercase text-slate-400">
                          Marca de Red
                        </label>
                        <input
                          type="text"
                          value={b.name}
                          onChange={(e) => {
                            const next = [...company.network_brands];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setCompany({ ...company, network_brands: next });
                          }}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-black text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold uppercase text-slate-400">
                          Subtítulo / Línea
                        </label>
                        <input
                          type="text"
                          value={b.sub}
                          onChange={(e) => {
                            const next = [...company.network_brands];
                            next[idx] = { ...next[idx], sub: e.target.value };
                            setCompany({ ...company, network_brands: next });
                          }}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div>
                          <label className="block text-[9.5px] font-bold uppercase text-slate-400">
                            Color
                          </label>
                          <input
                            type="color"
                            value={b.accent || '#049fd9'}
                            onChange={(e) => {
                              const next = [...company.network_brands];
                              next[idx] = {
                                ...next[idx],
                                accent: e.target.value,
                                color: e.target.value,
                              };
                              setCompany({ ...company, network_brands: next });
                            }}
                            className="w-7 h-7 rounded cursor-pointer border-0"
                          />
                        </div>

                        <label className="cursor-pointer px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-primary flex items-center gap-1">
                          <Icon n="upload" className="text-[14px]" />
                          <span>{b.logo_url ? 'Cambiar Logo' : 'Logo PNG'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(e, (dataUrl) => {
                                const next = [...company.network_brands];
                                next[idx] = { ...next[idx], logo_url: dataUrl };
                                setCompany({ ...company, network_brands: next });
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {b.logo_url && (
                        <img
                          src={b.logo_url}
                          alt={b.name}
                          className="h-6 max-w-[60px] object-contain border border-slate-200 rounded p-0.5"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setCompany({
                            ...company,
                            network_brands: company.network_brands.filter(
                              (_: any, i: number) => i !== idx
                            ),
                          })
                        }
                        className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                        title="Quitar marca"
                      >
                        <Icon n="delete" className="text-[16px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 4: PARÁMETROS DE COSTEO M.O. Y TIPO DE CAMBIO SUNAT
         ===================================================================== */}
      {activeTab === 'params' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="neu p-6 lg:col-span-2">
            <h2 className="mb-4 font-bold text-primary text-lg">
              Parámetros de costeo de ingeniería y márgenes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.keys(LABELS).map((k) => (
                <div key={k}>
                  <label className="label">{LABELS[k]}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={p[k]}
                    onChange={(e) => setP({ ...p, [k]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
            <button
              className="btn-primary mt-5"
              onClick={async () => {
                await api('/settings/labor-params', { method: 'PUT', body: p });
                flash('Parámetros de costeo guardados correctamente');
              }}
            >
              Guardar Parámetros de Costeo
            </button>
          </div>

          <div className="neu p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-primary text-lg">Tipo de cambio USD→PEN</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[11px] font-bold">
                  Lima, Perú
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-4">
                Fuente activa:{' '}
                <strong className="text-primary">
                  {fx.source || 'SUNAT Oficial Perú (e-api.net.pe)'}
                </strong>{' '}
                ({fx.rate_date})
              </p>

              {(['usd_to_pen_buy', 'usd_to_pen_sell', 'buffer_pct'] as const).map((k) => (
                <div key={k} className="mb-3">
                  <label className="label">
                    {
                      {
                        usd_to_pen_buy: 'TC Compra (S/)',
                        usd_to_pen_sell: 'TC Venta Oficial (S/)',
                        buffer_pct: 'Colchón cambiario (%)',
                      }[k]
                    }
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    className="input"
                    value={fx[k]}
                    onChange={(e) => setFx({ ...fx, [k]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 mt-4">
              <button
                type="button"
                disabled={syncing}
                onClick={syncLiveSunat}
                className="btn-soft w-full flex items-center justify-center gap-2 text-secondary font-bold"
              >
                <Icon n="sync" className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Consultando SUNAT Lima…' : 'Sincronizar TC Público (Lima)'}</span>
              </button>

              <button
                className="btn-primary w-full"
                onClick={async () => {
                  await api('/settings/exchange-rate', { method: 'PUT', body: fx });
                  outletCtx?.fetchLiveTc?.(false);
                  flash('Tipo de cambio actualizado manualmente');
                }}
              >
                Guardar Tipo de Cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa Proforma A4 en Vivo con los Datos de la Empresa */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="bg-[#041533] text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl print:hidden">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-orange-500/20 border border-orange-400 text-orange-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Vista Previa en Vivo
                </span>
                <span className="text-sm font-bold">
                  {company.business_name} · RUC {company.ruc}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveCompany}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Icon n="save" className="text-[16px]" />
                  Guardar Identidad
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff752b] to-[#b13e00] text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Icon n="print" className="text-[16px]" />
                  Imprimir / Guardar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Icon n="close" className="text-[16px]" />
                  Cerrar
                </button>
              </div>
            </div>

            <CorporateProformaDocument quote={samplePreviewQuote} company={company} />
          </div>
        </div>
      )}
    </div>
  );
}
