import React from 'react';
import { Icon } from '../Layout';
import { money } from '../api';

const UNIDADES = [
  '',
  'UN',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
  'VEINTE',
];

const DECENAS = [
  '',
  'DIEZ',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
];

const CENTENAS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function convertirGrupo(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  let out = '';
  const c = Math.floor(n / 100);
  const r = n % 100;
  if (c > 0) out += CENTENAS[c] + ' ';
  if (r > 0) {
    if (r <= 20) {
      out += UNIDADES[r];
    } else if (r < 30) {
      out += 'VEINTI' + UNIDADES[r - 20];
    } else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      out += DECENAS[d] + (u > 0 ? ' Y ' + UNIDADES[u] : '');
    }
  }
  return out.trim();
}

export function numeroALetrasPen(monto?: number): string {
  const num = Math.max(0, Number(monto || 0));
  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);
  const centStr = String(centavos).padStart(2, '0');

  if (entero === 0) return `CERO CON ${centStr}/100 SOLES`;

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const resto = entero % 1000;

  const partes: string[] = [];
  if (millones === 1) partes.push('UN MILLÓN');
  else if (millones > 1) partes.push(`${convertirGrupo(millones)} MILLONES`);

  if (miles === 1) partes.push('MIL');
  else if (miles > 1) partes.push(`${convertirGrupo(miles)} MIL`);

  if (resto > 0) partes.push(convertirGrupo(resto));

  return `${partes.join(' ')} CON ${centStr}/100 SOLES`;
}

export const DEFAULT_COMPANY_PROFILE = {
  business_name: 'PRECISION SYSTEMS INSTALACIONES S.A.C.',
  trade_name: 'PROFORMAS',
  trade_subtitle: 'Instalaciones PE',
  short_code: 'INST-PE',
  tagline: 'Ingeniería de Redes, Fibra Óptica, CCTV IP & Seguridad Electrónica Corporativa',
  ruc: '20601234567',
  sunat_badge: 'Homologado SUNAT UBL 2.1',
  fiscal_address: 'Av. Javier Prado Este 4520, Of. 802, Santiago de Surco — Lima, Perú',
  phone: '(01) 715-8400',
  whatsapp: '+51 998 452 110',
  email: 'ingenieria@instalacionespe.com.pe',
  website: 'www.instalacionespe.com.pe',
  logo_url: '',
  signature_url: '',
  primary_color: '#041533',
  accent_color: '#ff6b1a',
  document_control_code:
    'Formato Corporativo Homologado FO-COM-042 Rev. 04 · Sistema Integrado de Gestión ISO 9001',
  certifications: [
    'ISO 9001:2015',
    'ANSI/TIA-568.2-D',
    'CNE-Utilización / INDECI',
    'Personal con SCTR Vigente',
  ],
  bank_accounts: [
    {
      bank: 'BCP Banco de Crédito',
      currency: 'Soles (PEN S/)',
      account_number: '194-2489102-0-45',
      cci: '002-19400248910204591',
    },
    {
      bank: 'BCP Banco de Crédito',
      currency: 'Dólares (USD $)',
      account_number: '194-2489108-1-52',
      cci: '002-19400248910815298',
    },
    {
      bank: 'BBVA Perú',
      currency: 'Soles (PEN S/)',
      account_number: '0011-0342-0100048291',
      cci: '011-342-000100048291-75',
    },
  ],
  spot_bank_name: 'Banco de la Nación',
  spot_account_number: '00-019-382910',
  spot_code_label: 'Cód. 022 / 037 SUNAT',
  spot_pct: 4.0,
  default_warranty_text:
    '24 meses de garantía comercial en equipamiento activo y cámaras IP, 12 meses en mano de obra de instalación y hasta 15 años en cableado estructurado certificado.',
  footer_title:
    'Ecosistema de Marcas Homologadas · Partners Oficiales de Redes, Fibra Óptica y Cámaras de Seguridad IP',
  footer_subtitle: 'Equipamiento 100% Original con Garantía Oficial de Fábrica en Perú',
  camera_brands: [
    {
      name: 'HIKVISION',
      sub: 'Platinum Partner',
      accent: '#d9232e',
      prefix: 'HIK',
      suffix: 'VISION',
      prefixColor: '#d9232e',
      suffixColor: '#041533',
      logo_url: '',
    },
    {
      name: 'DAHUA',
      sub: 'Technology',
      accent: '#005bac',
      prefix: 'a',
      suffix: 'hua',
      prefixColor: '#e60012',
      suffixColor: '#041533',
      logo_url: '',
    },
    {
      name: 'AXIS',
      sub: 'Communications',
      accent: '#ffcc00',
      prefix: 'AXIS',
      suffix: '',
      prefixColor: '#041533',
      suffixColor: '#041533',
      logo_url: '',
    },
    {
      name: 'HANWHA',
      sub: 'Wisenet Vision',
      accent: '#f37321',
      prefix: 'HANWHA',
      suffix: '',
      prefixColor: '#f37321',
      suffixColor: '#041533',
      logo_url: '',
    },
    {
      name: 'UNV',
      sub: 'Uniview IP',
      accent: '#0066b3',
      prefix: 'UNV',
      suffix: '',
      prefixColor: '#0066b3',
      suffixColor: '#041533',
      logo_url: '',
    },
    {
      name: 'EZVIZ',
      sub: 'Smart Security',
      accent: '#ff6b1a',
      prefix: 'EZVIZ',
      suffix: '',
      prefixColor: '#041533',
      suffixColor: '#041533',
      logo_url: '',
    },
  ],
  network_brands: [
    {
      name: 'CISCO',
      sub: 'Enterprise Partner',
      accent: '#049fd9',
      color: '#049fd9',
      logo_url: '',
    },
    {
      name: 'UBIQUITI',
      sub: 'UniFi Enterprise',
      accent: '#0559c9',
      color: '#0559c9',
      logo_url: '',
    },
    {
      name: 'MikroTik',
      sub: 'Certified Routing',
      accent: '#293239',
      color: '#293239',
      logo_url: '',
    },
    {
      name: 'PANDUIT',
      sub: 'NetKey / TX6A',
      accent: '#0085ad',
      color: '#004f6e',
      logo_url: '',
    },
    {
      name: 'COMMSCOPE',
      sub: 'AMP / Systimax',
      accent: '#0072ce',
      color: '#0072ce',
      logo_url: '',
    },
    {
      name: 'ARUBA',
      sub: 'HPE Networking',
      accent: '#ff8300',
      color: '#ff8300',
      logo_url: '',
    },
    {
      name: 'OMADA',
      sub: 'TP-Link Business',
      accent: '#4acbd6',
      color: '#041533',
      logo_url: '',
    },
    {
      name: 'FLUKE',
      sub: 'Networks Cert.',
      accent: '#ffc20e',
      color: '#041533',
      logo_url: '',
    },
  ],
};

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  aceptada: {
    label: 'ACEPTADA / APROBADA',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-400',
  },
  emitida: {
    label: 'OFICIAL EMITIDA',
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-400',
  },
  enviada: {
    label: 'ENVIADA AL CLIENTE',
    bg: 'bg-sky-100',
    text: 'text-sky-900',
    border: 'border-sky-400',
  },
  en_aprobacion: {
    label: 'EN REVISIÓN GERENCIAL',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-400',
  },
  borrador: {
    label: 'PROPUESTA PRELIMINAR',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
  },
  rechazada: {
    label: 'OBSERVADA / CERRADA',
    bg: 'bg-red-100',
    text: 'text-red-900',
    border: 'border-red-300',
  },
};

interface CorporateProformaProps {
  quote: any;
  company?: any;
  compact?: boolean;
}

export const CorporateProformaDocument: React.FC<CorporateProformaProps> = ({ quote, company }) => {
  if (!quote) return null;

  const c = {
    ...DEFAULT_COMPANY_PROFILE,
    ...(quote.company_profile || {}),
    ...(company || {}),
  };

  const primaryColor = c.primary_color || '#041533';
  const accentColor = c.accent_color || '#ff6b1a';

  const tc = Number(quote.exchange_rate_sell || 3.742);
  const taxableBase = Number(quote.taxable_base_pen || 0);
  const discountPct = Number(quote.discount_pct || 0);
  const grossBeforeDiscount =
    Number(quote.gross_before_discount_pen) ||
    (discountPct > 0 && discountPct < 100
      ? Number((taxableBase / (1 - discountPct / 100)).toFixed(2))
      : taxableBase);
  const discountAmount = Number(
    quote.discount_amount_pen ?? Math.max(0, grossBeforeDiscount - taxableBase)
  );
  const igvAmount = Number(quote.tax_amount_pen ?? quote.igv_amount_pen ?? taxableBase * 0.18);
  const totalWithTax = Number(quote.total_with_tax_pen ?? taxableBase + igvAmount);
  const totalUsd = Number((totalWithTax / tc).toFixed(2));

  const detraccionPct = Number(c.spot_pct ?? quote.detraccion_pct ?? 4.0);
  const detraccionPen = Number((totalWithTax * (detraccionPct / 100)).toFixed(2));
  const netPayablePen = Number((totalWithTax - detraccionPen).toFixed(2));

  const chapters = quote.chapters || {
    hardware_pen: Number((taxableBase * 0.785).toFixed(2)),
    hardware_pct: 78.5,
    labor_pen: Number((taxableBase * 0.18).toFixed(2)),
    labor_pct: 18.0,
    logistics_pen: Number((taxableBase * 0.035).toFixed(2)),
    logistics_pct: 3.5,
  };

  const milestones = quote.milestones || [
    {
      step: '01',
      label: 'Adelanto Comercial (50%)',
      trigger: 'A la recepción de la Orden de Compra para acopio de equipos',
      amount_pen: totalWithTax * 0.5,
    },
    {
      step: '02',
      label: 'Avance Físico de Obra (30%)',
      trigger: 'Contra avance del 80% en tendido de red, montaje y canalización',
      amount_pen: totalWithTax * 0.3,
    },
    {
      step: '03',
      label: 'Liquidación y Dossier Final (20%)',
      trigger: 'Contra entrega de Certificación Fluke, Protocolos y Acta de Conformidad',
      amount_pen: totalWithTax * 0.2,
    },
  ];

  const st = STATUS_BADGE[quote.status] || STATUS_BADGE.emitida;
  const amountWords = quote.amount_in_words || numeroALetrasPen(totalWithTax);

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl border border-slate-300/80 overflow-hidden text-slate-900 print:shadow-none print:border-none print:rounded-none">
      {/* Cinta Superior Bicolor Corporativa */}
      <div
        className="h-2.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${primaryColor} 0%, #102447 68%, ${accentColor} 68%, #b13e00 100%)`,
        }}
      />

      <div className="p-6 sm:p-8 space-y-6">
        {/* 1. CABECERA CORPORATIVA EMISOR + RECUADRO FISCAL DE PROFORMA */}
        <header
          className="flex flex-col lg:flex-row items-start lg:items-stretch justify-between gap-6 pb-5 border-b-2"
          style={{ borderBottomColor: primaryColor }}
        >
          {/* Bloque Emisor */}
          <div className="flex items-start gap-4 flex-1">
            {c.logo_url ? (
              <div
                className="w-20 h-16 rounded-2xl bg-white border border-slate-300 border-b-4 p-1.5 flex items-center justify-center shrink-0 shadow-sm"
                style={{ borderBottomColor: accentColor }}
              >
                <img
                  src={c.logo_url}
                  alt={c.business_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 border-b-4 shadow-lg"
                style={{
                  background: `linear-gradient(145deg, ${primaryColor} 0%, #162d59 100%)`,
                  borderBottomColor: accentColor,
                }}
              >
                <Icon
                  n="precision_manufacturing"
                  className="text-[28px]"
                  style={{ color: accentColor }}
                />
                <span className="text-[9px] font-black tracking-widest mt-0.5">
                  {c.short_code || 'INST-PE'}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className="text-lg sm:text-xl font-black tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {c.business_name}
                </h1>
                {c.sunat_badge && (
                  <span className="px-2 py-0.5 rounded bg-orange-50 text-[#b13e00] border border-orange-200 text-[10px] font-extrabold uppercase tracking-wider">
                    {c.sunat_badge}
                  </span>
                )}
              </div>
              <p
                className="text-xs font-extrabold uppercase tracking-wider"
                style={{ color: accentColor }}
              >
                {c.tagline}
              </p>
              <div className="text-xs text-slate-600 leading-relaxed pt-0.5">
                <span className="font-bold text-slate-800">Sede Central:</span> {c.fiscal_address}
                <br />
                <span className="font-bold text-slate-800">Central B2B:</span> {c.phone} ·{' '}
                <span className="font-bold text-slate-800">WhatsApp Ing.:</span> {c.whatsapp} ·{' '}
                <span className="font-bold text-slate-800">Web:</span> {c.website}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {(c.certifications || []).map((cert: string) => (
                  <span
                    key={cert}
                    className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: primaryColor }}
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recuadro Fiscal Derecha */}
          <div
            className="w-full lg:w-72 border-2 rounded-xl overflow-hidden flex flex-col justify-between shrink-0 bg-white shadow-sm"
            style={{ borderColor: primaryColor }}
          >
            <div
              className="text-white text-center py-2 px-3"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="text-[11px] font-extrabold tracking-widest text-[#ffb595]">
                R.U.C. N° {c.ruc}
              </div>
              <div className="text-sm font-black tracking-wider mt-0.5">PROFORMA COMERCIAL</div>
            </div>

            <div className="py-3 px-4 text-center bg-slate-50 border-b border-slate-200">
              <div
                className="text-lg font-black tracking-tight"
                style={{ color: primaryColor }}
              >
                {quote.code || 'PF-2026-0001'}{' '}
                <span className="text-xs font-bold text-slate-500">v{quote.version || 1}.0</span>
              </div>
              <span
                className={`inline-block mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${st.bg} ${st.text} ${st.border}`}
              >
                {st.label}
              </span>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200 bg-white text-center text-xs">
              <div className="py-2 px-2">
                <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                  Fecha Emisión
                </span>
                <span className="font-extrabold" style={{ color: primaryColor }}>
                  {quote.issue_date || '2026-06-04'}
                </span>
              </div>
              <div className="py-2 px-2">
                <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                  Válida Hasta
                </span>
                <span className="font-extrabold" style={{ color: accentColor }}>
                  {quote.valid_until || '2026-06-19'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 2. FICHA INTEGRAL DE CLIENTE Y EXPEDIENTE DE OBRA */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tarjeta Cliente */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/70">
            <div
              className="px-3.5 py-2 text-white flex items-center justify-between text-xs font-extrabold uppercase tracking-wider"
              style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, #1b3564 100%)` }}
            >
              <span className="flex items-center gap-1.5">
                <Icon n="domain" className="text-[16px]" style={{ color: accentColor }} />
                I. Datos del Cliente &amp; Receptor Fiscal
              </span>
              <span className="px-2 py-0.5 rounded bg-white/15 text-[#ffd8c2] text-[10px]">
                SUNAT ACTIVO / HABIDO
              </span>
            </div>
            <div className="p-3.5 divide-y divide-slate-200/80 text-xs">
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  Razón Social:
                </span>
                <span className="font-black text-right" style={{ color: primaryColor }}>
                  {quote.customer?.business_name || 'CORPORACIÓN CLIENTE S.A.C.'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  {quote.customer?.document_type || 'RUC'} / Moneda:
                </span>
                <span className="font-bold text-slate-800 text-right">
                  <b style={{ color: primaryColor }}>
                    {quote.customer?.document_number || '20548912304'}
                  </b>{' '}
                  · SOLES (PEN S/)
                </span>
              </div>
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  Atención A:
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {quote.customer?.contact_name || 'Jefatura de Operaciones e Infraestructura TI'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  Contacto Directo:
                </span>
                <span className="font-medium text-slate-700 text-right">
                  {quote.customer?.phone || '(01) 614-9200'} ·{' '}
                  {quote.customer?.email || 'logistica@cliente.com.pe'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  Dirección Fiscal:
                </span>
                <span className="font-medium text-slate-700 text-right">
                  {quote.customer?.fiscal_address || 'Lima Metropolitana, Perú'}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta Proyecto e Ingeniería */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/70">
            <div
              className="px-3.5 py-2 text-white flex items-center justify-between text-xs font-extrabold uppercase tracking-wider"
              style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, #1b3564 100%)` }}
            >
              <span className="flex items-center gap-1.5">
                <Icon n="engineering" className="text-[16px]" style={{ color: accentColor }} />
                II. Expediente Técnico de Obra &amp; Ejecución
              </span>
              <span className="px-2 py-0.5 rounded bg-white/15 text-[#ffd8c2] text-[10px]">
                T.C. SUNAT S/ {tc.toFixed(3)}
              </span>
            </div>
            <div className="p-3.5 divide-y divide-slate-200/80 text-xs">
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  Proyecto / Obra:
                </span>
                <span className="font-black text-right" style={{ color: primaryColor }}>
                  {quote.project?.name || quote.project_title || 'Proyecto Técnico Especializado'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  Alcance Técnico:
                </span>
                <span className="font-semibold text-right" style={{ color: accentColor }}>
                  {quote.project?.subtitle ||
                    quote.project_subtitle ||
                    'Suministro, Instalación Certificada y Puesta en Marcha'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  Sede Instalación:
                </span>
                <span className="font-medium text-slate-800 text-right">
                  {quote.project?.installation_address || 'Lima Metropolitana, Perú'} (
                  {quote.project?.floors || 2} Niveles)
                </span>
              </div>
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  Plazo &amp; Cuadrilla:
                </span>
                <span className="font-bold text-right" style={{ color: primaryColor }}>
                  {quote.estimated_days || 4.0} Días Hábiles ({quote.total_hours || 32} H-H) ·{' '}
                  {quote.crews_label || '1 Cuadrilla Certificada'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">
                  Ing. Responsable:
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {quote.seller_name || 'Ing. Carlos Mendoza Rojas'} · {c.email}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. RESUMEN EJECUTIVO POR CAPÍTULOS DE INGENIERÍA */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div
            className="border border-slate-300 border-l-4 rounded-xl p-3.5 bg-white flex items-center justify-between shadow-sm"
            style={{ borderLeftColor: primaryColor }}
          >
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Cap. 01 · Equipamiento &amp; Materiales
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Hardware activo, cámaras IP y cableado
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black" style={{ color: primaryColor }}>
                {money(chapters.hardware_pen)}
              </div>
              <div className="text-[10px] font-extrabold" style={{ color: accentColor }}>
                {chapters.hardware_pct}% del Valor Neto
              </div>
            </div>
          </div>

          <div
            className="border border-slate-300 border-l-4 rounded-xl p-3.5 bg-white flex items-center justify-between shadow-sm"
            style={{ borderLeftColor: accentColor }}
          >
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Cap. 02 · Ingeniería &amp; Mano de Obra
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Tendido, fusión FO y certificación Fluke
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black" style={{ color: primaryColor }}>
                {money(chapters.labor_pen)}
              </div>
              <div className="text-[10px] font-extrabold" style={{ color: accentColor }}>
                {chapters.labor_pct}% del Valor Neto
              </div>
            </div>
          </div>

          <div className="border border-slate-300 border-l-4 border-l-emerald-600 rounded-xl p-3.5 bg-white flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Cap. 03 · Logística, Altura &amp; SCTR
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Movilización, andamios y seguros de ley
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black" style={{ color: primaryColor }}>
                {money(chapters.logistics_pen)}
              </div>
              <div className="text-[10px] font-extrabold text-emerald-700">
                {chapters.logistics_pct}% del Valor Neto
              </div>
            </div>
          </div>
        </section>

        {/* 4. TABLA DETALLADA DE PARTIDAS TÉCNICAS */}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: primaryColor }}
            >
              <Icon n="Format_list_numbered" className="text-[18px]" style={{ color: accentColor }} />
              III. Desglose Técnico-Económico de Suministros, Equipos e Instalación
            </h2>
            <span className="text-[11px] font-semibold text-slate-500">
              Valores expresados en Soles (PEN S/) antes de I.G.V.
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className="text-white text-[10px] font-extrabold uppercase tracking-wider"
                  style={{ backgroundColor: primaryColor }}
                >
                  <th className="py-2.5 px-3 text-center w-10">Ítem</th>
                  <th className="py-2.5 px-3 w-36">Código / Marca</th>
                  <th className="py-2.5 px-3">
                    Descripción Técnica y Especificaciones del Suministro / Servicio
                  </th>
                  <th className="py-2.5 px-3 w-36">Zona / Sector</th>
                  <th className="py-2.5 px-2 text-center w-14">Und.</th>
                  <th className="py-2.5 px-2 text-center w-14">Cant.</th>
                  <th className="py-2.5 px-3 text-right w-28">V. Unitario</th>
                  <th className="py-2.5 px-3 text-right w-32">Subtotal (S/)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(quote.lines || []).map((l: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                    <td className="py-3 px-3 text-center font-black text-slate-400">
                      {l.item || String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-3">
                      <div
                        className="font-mono font-extrabold text-[11px]"
                        style={{ color: primaryColor }}
                      >
                        {l.code || `PART-0${idx + 1}`}
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-orange-50 text-[#b13e00] border border-orange-200 text-[9px] font-extrabold uppercase tracking-wider">
                        {l.brand || 'HIKVISION / PANDUIT'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-xs">{l.description}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {l.specs ||
                          'Suministro de equipamiento original, montaje certificado, configuración lógica y garantía oficial en Perú.'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-1 rounded bg-slate-200/80 text-slate-800 text-[10px] font-bold">
                        {l.zone_name || 'Zona Principal'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-600">
                      {l.unit || 'PTO'}
                    </td>
                    <td
                      className="py-3 px-2 text-center font-black"
                      style={{ color: primaryColor }}
                    >
                      {l.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700 tabular-nums">
                      {money(l.unit_price_pen)}
                    </td>
                    <td
                      className="py-3 px-3 text-right font-black tabular-nums"
                      style={{ color: primaryColor }}
                    >
                      {money(l.line_sale_subtotal_pen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. CONDICIONES COMERCIALES, BANCOS Y LIQUIDACIÓN FISCAL SUNAT */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Izquierda (7 Cols): Hitos de Pago + Cuentas Bancarias + SPOT + Garantías */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Cronograma de Hitos */}
            <div className="border border-slate-300 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3
                  className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: primaryColor }}
                >
                  <Icon n="payments" className="text-[16px]" style={{ color: accentColor }} />
                  IV. Cronograma de Facturación e Hitos de Pago
                </h3>
                <span className="text-[10px] font-extrabold uppercase" style={{ color: accentColor }}>
                  Validez Oferta: 15 Días Calendario
                </span>
              </div>
              <div className="divide-y divide-slate-200/70">
                {milestones.map((m: any) => (
                  <div
                    key={m.step}
                    className="py-1.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded text-white text-[10px] font-black flex items-center justify-center shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {m.step}
                      </span>
                      <div>
                        <div className="font-extrabold text-xs" style={{ color: primaryColor }}>
                          {m.label}
                        </div>
                        <div className="text-[10px] text-slate-500">{m.trigger}</div>
                      </div>
                    </div>
                    <span
                      className="font-black tabular-nums shrink-0"
                      style={{ color: accentColor }}
                    >
                      {money(m.amount_pen)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cuentas Bancarias Corporativas */}
            <div className="border border-slate-300 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3
                  className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: primaryColor }}
                >
                  <Icon
                    n="account_balance"
                    className="text-[16px]"
                    style={{ color: primaryColor }}
                  />
                  V. Cuentas Bancarias Corporativas &amp; CCI ({c.business_name})
                </h3>
                <span className="text-[10px] font-extrabold text-emerald-700">RUC {c.ruc}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[9.5px] border-b border-slate-300">
                      <th className="py-1.5 px-2">Banco</th>
                      <th className="py-1.5 px-2">Moneda</th>
                      <th className="py-1.5 px-2">Cuenta Corriente</th>
                      <th className="py-1.5 px-2">Código Interbancario (CCI)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800">
                    {(c.bank_accounts || []).map((b: any, i: number) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2 font-extrabold" style={{ color: primaryColor }}>
                          {b.bank}
                        </td>
                        <td className="py-1.5 px-2">{b.currency}</td>
                        <td className="py-1.5 px-2 font-mono font-bold">{b.account_number}</td>
                        <td className="py-1.5 px-2 font-mono">{b.cci}</td>
                      </tr>
                    ))}
                    <tr className="bg-orange-50/60">
                      <td className="py-1.5 px-2 font-extrabold text-[#b13e00]">
                        {c.spot_bank_name}
                      </td>
                      <td className="py-1.5 px-2 font-bold text-[#b13e00]">Detracciones SPOT</td>
                      <td
                        className="py-1.5 px-2 font-mono font-black"
                        style={{ color: primaryColor }}
                      >
                        {c.spot_account_number}
                      </td>
                      <td className="py-1.5 px-2 font-bold text-slate-700">
                        {c.spot_code_label} ({detraccionPct}%)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nota de Detracción SPOT y Garantías */}
            <div
              className="rounded-xl bg-orange-50/70 border border-orange-200 border-l-4 p-3 text-[11px] text-slate-700 leading-relaxed space-y-1"
              style={{ borderLeftColor: accentColor }}
            >
              <div>
                <strong className="font-extrabold" style={{ color: primaryColor }}>
                  OPERACIÓN SUJETA AL SPOT — DETRACCIÓN SUNAT ({detraccionPct}%):
                </strong>{' '}
                Retención aplicable de <b className="text-[#b13e00]">{money(detraccionPen)}</b> en
                Cta. {c.spot_bank_name} N°{' '}
                <b style={{ color: primaryColor }}>{c.spot_account_number}</b> y abono neto en
                cuentas comerciales por <b style={{ color: primaryColor }}>{money(netPayablePen)}</b>
                .
              </div>
              <div>
                <strong className="font-extrabold" style={{ color: primaryColor }}>
                  GARANTÍA OFICIAL &amp; SLA POSTVENTA:
                </strong>{' '}
                {quote.warranty_text || c.default_warranty_text}
              </div>
            </div>
          </div>

          {/* Derecha (5 Cols): Liquidación Fiscal + QR + Firmas */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Cuadro de Liquidación Económica */}
            <div
              className="border-2 rounded-xl overflow-hidden bg-white shadow-sm"
              style={{ borderColor: primaryColor }}
            >
              <div
                className="text-white px-4 py-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Liquidación Económica SUNAT</span>
                <span className="text-[#ffb595]">Moneda: PEN (S/)</span>
              </div>

              <div className="p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Valor de Venta Bruto (Sin IGV):</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {money(grossBeforeDiscount)}
                  </span>
                </div>

                {discountPct > 0 && (
                  <div className="flex justify-between text-[#c2410c] font-bold">
                    <span>Descuento Corporativo Otorgado (-{discountPct}%):</span>
                    <span className="tabular-nums">- {money(discountAmount)}</span>
                  </div>
                )}

                <div
                  className="flex justify-between pt-2 border-t border-slate-300 font-extrabold"
                  style={{ color: primaryColor }}
                >
                  <span>BASE IMPONIBLE NETA (VALOR VENTA):</span>
                  <span className="tabular-nums">{money(taxableBase)}</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Impuesto General a las Ventas — I.G.V. (18.00%):</span>
                  <span className="font-bold text-slate-900 tabular-nums">{money(igvAmount)}</span>
                </div>

                <div
                  className="mt-2 p-3.5 rounded-xl text-white flex items-center justify-between"
                  style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #162d59 100%)` }}
                >
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#ffb595]">
                      Importe Total Propuesta
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Equiv. Ref: USD ${' '}
                      {totalUsd.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums">
                    {money(totalWithTax)}
                  </div>
                </div>

                <div
                  className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-extrabold uppercase tracking-wide"
                  style={{ color: primaryColor }}
                >
                  SON: {amountWords}
                </div>
              </div>
            </div>

            {/* Bloque QR de Validación y Firmas Autorizadas */}
            <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50 space-y-3">
              <div className="flex items-center gap-3 pb-2.5 border-b border-slate-200">
                <div className="w-14 h-14 rounded-lg bg-white border border-slate-300 p-1.5 shrink-0 flex items-center justify-center">
                  <svg
                    viewBox="0 0 36 36"
                    className="w-full h-full"
                    style={{ fill: primaryColor }}
                  >
                    <rect
                      x="2"
                      y="2"
                      width="10"
                      height="10"
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth="2.2"
                    />
                    <rect x="5" y="5" width="4" height="4" />
                    <rect
                      x="24"
                      y="2"
                      width="10"
                      height="10"
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth="2.2"
                    />
                    <rect x="27" y="5" width="4" height="4" />
                    <rect
                      x="2"
                      y="24"
                      width="10"
                      height="10"
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth="2.2"
                    />
                    <rect x="5" y="27" width="4" height="4" />
                    <rect x="15" y="4" width="3" height="3" />
                    <rect x="19" y="8" width="3" height="3" />
                    <rect x="14" y="14" width="4" height="4" />
                    <rect x="20" y="16" width="3" height="3" />
                    <rect x="4" y="16" width="4" height="3" />
                    <rect x="10" y="19" width="3" height="3" />
                    <rect x="26" y="16" width="6" height="3" />
                    <rect x="16" y="24" width="4" height="4" />
                    <rect x="23" y="23" width="4" height="4" />
                    <rect x="29" y="28" width="5" height="5" />
                  </svg>
                </div>
                <div className="text-[10px] text-slate-600 leading-snug">
                  <strong className="font-black block" style={{ color: primaryColor }}>
                    VALIDACIÓN DIGITAL &amp; TRAZABILIDAD SUNAT
                  </strong>
                  Expediente:{' '}
                  <b style={{ color: primaryColor }}>{quote.code || 'PF-2026-0001'}</b> · Rev. v
                  {quote.version || 1}.0
                  <br />
                  <span className="font-mono text-[9.5px] text-slate-500">
                    {quote.digital_hash || 'SHA256:9F8A4D2C71E0B3A8'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 items-end">
                <div className="text-center">
                  {c.signature_url && (
                    <img
                      src={c.signature_url}
                      alt="Firma Autorizada"
                      className="h-9 max-w-[130px] object-contain mx-auto mb-1"
                    />
                  )}
                  <div className="border-t-2 pt-1.5" style={{ borderTopColor: primaryColor }}>
                    <div className="text-[10.5px] font-black" style={{ color: primaryColor }}>
                      {quote.seller_name || 'Ing. Carlos Mendoza'}
                    </div>
                    <div className="text-[9.5px] text-slate-500">
                      Ing. Costos &amp; Proyectos · {c.short_code}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 pt-1.5" style={{ borderTopColor: primaryColor }}>
                    <div className="text-[10.5px] font-black" style={{ color: primaryColor }}>
                      ACEPTACIÓN DEL CLIENTE
                    </div>
                    <div className="text-[9.5px] text-slate-500">
                      Firma, Sello, RUC y N° O/C
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================================
          6. PIE DE PÁGINA CORPORATIVO: MARCAS DE REDES Y CÁMARAS HOMOLOGADAS
         ===================================================================== */}
      <footer
        className="bg-slate-100 border-t-2 px-6 sm:px-8 py-4 space-y-3"
        style={{ borderTopColor: primaryColor }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider"
            style={{ color: primaryColor }}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ backgroundColor: accentColor }}
            />
            <span>{c.footer_title}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {c.footer_subtitle}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Grupo 1: Cámaras de Seguridad & Videovigilancia IP */}
          <div className="lg:col-span-5 bg-white border border-slate-300 rounded-xl p-3 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1" style={{ color: primaryColor }}>
                <Icon n="videocam" className="text-[14px]" style={{ color: accentColor }} />
                Cámaras IP, CCTV Analítico &amp; NVR
              </span>
              <span className="text-[#b13e00]">ONVIF / NDAA</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(c.camera_brands || []).map((b: any, idx: number) => (
                <div
                  key={`${b.name}-${idx}`}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-center"
                  style={{ borderLeftWidth: '3.5px', borderLeftColor: b.accent || '#d9232e' }}
                >
                  {b.logo_url ? (
                    <img
                      src={b.logo_url}
                      alt={b.name}
                      className="h-4 max-w-[72px] object-contain mb-0.5"
                    />
                  ) : (
                    <div className="text-xs font-black tracking-tight leading-none">
                      <span style={{ color: b.prefixColor || b.accent || '#d9232e' }}>
                        {b.prefix || b.name}
                      </span>
                      {b.suffix && (
                        <span style={{ color: b.suffixColor || primaryColor }}>{b.suffix}</span>
                      )}
                    </div>
                  )}
                  <span className="text-[8px] font-bold uppercase text-slate-400 mt-0.5 leading-none">
                    {b.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Grupo 2: Redes Empresariales, Wi-Fi 6/7 & Cableado Estructurado */}
          <div className="lg:col-span-7 bg-white border border-slate-300 rounded-xl p-3 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1" style={{ color: primaryColor }}>
                <Icon n="router" className="text-[#049fd9] text-[14px]" />
                Redes Empresariales, Wi-Fi 6/7, Fibra Óptica &amp; Cableado Estructurado
              </span>
              <span style={{ color: primaryColor }}>ANSI/TIA-568.2-D</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(c.network_brands || []).map((b: any, idx: number) => (
                <div
                  key={`${b.name}-${idx}`}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-center"
                  style={{ borderLeftWidth: '3.5px', borderLeftColor: b.accent || '#049fd9' }}
                >
                  {b.logo_url ? (
                    <img
                      src={b.logo_url}
                      alt={b.name}
                      className="h-4 max-w-[72px] object-contain mb-0.5"
                    />
                  ) : (
                    <div
                      className="text-xs font-black tracking-tight leading-none"
                      style={{ color: b.color || b.accent || primaryColor }}
                    >
                      {b.name}
                    </div>
                  )}
                  <span className="text-[8px] font-bold uppercase text-slate-400 mt-0.5 leading-none">
                    {b.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barra Legal Final de Pie de Página */}
        <div className="pt-2 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-semibold text-slate-500">
          <span>
            {c.business_name} · RUC {c.ruc} · {c.fiscal_address}
          </span>
          <span>{c.document_control_code} · Página 1 de 1</span>
        </div>
      </footer>
    </div>
  );
};
