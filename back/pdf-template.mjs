// =============================================================================
// GENERADOR CORPORATIVO DE PROFORMA A4 (HTML / PDF PRINT-READY) + PERFIL EMPRESA
// Incluye personalización completa de Logos (Principal, Firma y Marcas), Razón
// Social, RUC, Dirección, Teléfonos, Cuentas Bancarias CCI, Detracciones SPOT,
// Certificaciones y Ecosistema de Marcas de Redes y Cámaras al pie de página.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPANY_PROFILE_FILE = path.join(__dirname, 'company-profile.json');

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
    '24 meses de garantía comercial directa en equipamiento activo y cámaras IP por defectos de fábrica, 12 meses en mano de obra de instalación y hasta 15 años en cableado estructurado certificado. SLA de atención en sitio < 8 horas.',
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

let cachedCompanyProfile = null;

export function getCompanyProfile() {
  if (cachedCompanyProfile) return cachedCompanyProfile;
  try {
    if (fs.existsSync(COMPANY_PROFILE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(COMPANY_PROFILE_FILE, 'utf8'));
      cachedCompanyProfile = { ...DEFAULT_COMPANY_PROFILE, ...parsed };
      return cachedCompanyProfile;
    }
  } catch {
    // Fallback al perfil por defecto
  }
  cachedCompanyProfile = structuredClone(DEFAULT_COMPANY_PROFILE);
  return cachedCompanyProfile;
}

export function saveCompanyProfile(updates = {}) {
  const current = getCompanyProfile();
  cachedCompanyProfile = {
    ...current,
    ...updates,
  };
  try {
    fs.writeFileSync(COMPANY_PROFILE_FILE, JSON.stringify(cachedCompanyProfile, null, 2), 'utf8');
  } catch {
    // Continúa en memoria si el disco es de solo lectura
  }
  return cachedCompanyProfile;
}

export function resetCompanyProfile() {
  cachedCompanyProfile = structuredClone(DEFAULT_COMPANY_PROFILE);
  try {
    if (fs.existsSync(COMPANY_PROFILE_FILE)) fs.unlinkSync(COMPANY_PROFILE_FILE);
  } catch {
    // Ignorar error de borrado
  }
  return cachedCompanyProfile;
}

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

function convertirGrupo(n) {
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

export function numeroALetrasPen(monto) {
  const num = Math.max(0, Number(monto || 0));
  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);
  const centStr = String(centavos).padStart(2, '0');

  if (entero === 0) return `CERO CON ${centStr}/100 SOLES`;

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const resto = entero % 1000;

  const partes = [];
  if (millones === 1) partes.push('UN MILLÓN');
  else if (millones > 1) partes.push(`${convertirGrupo(millones)} MILLONES`);

  if (miles === 1) partes.push('MIL');
  else if (miles > 1) partes.push(`${convertirGrupo(miles)} MIL`);

  if (resto > 0) partes.push(convertirGrupo(resto));

  return `${partes.join(' ')} CON ${centStr}/100 SOLES`;
}

const SPECIALTY_TEMPLATES = {
  videocam: [
    {
      code: 'HIK-DS2CD2187G2',
      brand: 'HIKVISION',
      category: 'CÁMARAS IP & CCTV',
      description: 'Cámara IP Domo/Bullet 4K ColorVu AcuSense IP67 IK10 PoE Integrado',
      specs: 'Lente 2.8mm, WDR 130dB, Analítica IA humana/vehicular, carcasa metálica antivandálica',
      zone_name: 'Zona A: Perímetro & Accesos',
      unit: 'UND',
      qty: 8,
      weight: 0.34,
    },
    {
      code: 'HIK-DS7616NI-K2',
      brand: 'HIKVISION',
      category: 'GRABACIÓN NVR',
      description: 'Grabador NVR 16/32 Canales 4K Ultra HD H.265+ + 2 Bahías SATA RAID',
      specs: 'Incluye 2x Disco Duro Western Digital Purple Surveillance 8TB 24/7 instalados',
      zone_name: 'Zona B: Cuarto de Comunicaciones',
      unit: 'EQP',
      qty: 1,
      weight: 0.21,
    },
    {
      code: 'CIS-CBS250-24P',
      brand: 'CISCO',
      category: 'SWITCHING POE+',
      description: 'Switch Administrable Gigabit L2/L3 24 Puertos PoE+ (370W) + 4 SFP',
      specs: 'VLANs segmentadas de seguridad, QoS de video en tiempo real y protección sobretensión',
      zone_name: 'Zona B: Cuarto de Comunicaciones',
      unit: 'UND',
      qty: 1,
      weight: 0.16,
    },
    {
      code: 'PAN-CAT6A-LSZH',
      brand: 'PANDUIT',
      category: 'CABLEADO & CANALIZACIÓN',
      description: 'Puntos de Red UTP Cat. 6A LSZH Cobre Puro + Tubería Conduit EMT/PVC Pesado',
      specs: 'Incluye Jack RJ45 TX6A, Patch Panel 24p, organizador horizontal y etiquetado TIA-606-C',
      zone_name: 'Zona A: Tendido Troncal',
      unit: 'PTO',
      qty: 8,
      weight: 0.17,
    },
    {
      code: 'SRV-ING-CCTV',
      brand: 'FLUKE / PRO',
      category: 'INGENIERÍA & M.O.',
      description: 'Servicio de Instalación, Montaje en Altura, Configuración NVR/VMS y Certificación',
      specs: 'Cuadrilla técnica certificada con SCTR, enfoque de lentes, analítica perimetral y dossier',
      zone_name: 'General de Obra',
      unit: 'GLB',
      qty: 1,
      weight: 0.12,
    },
  ],
  wifi: [
    {
      code: 'UBI-U6-PRO-ENT',
      brand: 'UBIQUITI',
      category: 'WI-FI 6 EMPRESARIAL',
      description: 'Access Point Empresarial UniFi U6-Pro Dual-Band Wi-Fi 6 (AX5400) MU-MIMO 4x4',
      specs: 'Capacidad 300+ clientes concurrentes, Seamless Roaming 802.11k/v/r, PoE+ 802.3at',
      zone_name: 'Zona A: Niveles Operativos',
      unit: 'UND',
      qty: 6,
      weight: 0.36,
    },
    {
      code: 'MIK-CCR2004-16G',
      brand: 'MIKROTIK',
      category: 'ROUTING & CORE',
      description: 'Router Cloud Core MikroTik + Controladora UniFi OS & Balanceo Dual-WAN Failover',
      specs: 'Gestión centralizada de ancho de banda, portal cautivo corporativo y firewall L7',
      zone_name: 'Zona B: Gabinete Principal',
      unit: 'EQP',
      qty: 1,
      weight: 0.19,
    },
    {
      code: 'UBI-USW-PRO-24P',
      brand: 'UBIQUITI',
      category: 'SWITCHING POE+',
      description: 'Switch Administrable L2/L3 PoE+ 400W con Uplinks SFP+ 10Gbps en Rack 19"',
      specs: 'Alimentación PoE inteligente por puerto con reinicio automático Watchdog',
      zone_name: 'Zona B: Gabinete Principal',
      unit: 'UND',
      qty: 1,
      weight: 0.18,
    },
    {
      code: 'COM-CAT6-LSZH',
      brand: 'COMMSCOPE',
      category: 'CABLEADO ESTRUCTURADO',
      description: 'Puntos de Red Cat. 6 LSZH 100% Cobre + Patch Cords Certificados de Fábrica',
      specs: 'Canalización oculta estética, cajas de pase herméticas y rotulado termocontraíble',
      zone_name: 'Zona A: Niveles Operativos',
      unit: 'PTO',
      qty: 8,
      weight: 0.15,
    },
    {
      code: 'SRV-SITE-WIFI',
      brand: 'FLUKE / PRO',
      category: 'INGENIERÍA & M.O.',
      description: 'Estudio de Mapa de Calor RF (Site Survey), Montaje, Configuración VLANs y Pruebas',
      specs: 'Optimización de canales DFS, ajuste de potencia TX y entrega de memoria descriptiva',
      zone_name: 'General de Obra',
      unit: 'GLB',
      qty: 1,
      weight: 0.12,
    },
  ],
  settings_ethernet: [
    {
      code: 'PAN-TX6A-10G',
      brand: 'PANDUIT',
      category: 'CABLEADO CAT6A 10G',
      description: 'Punto de Red Certificado Cat. 6A 10GbE F/UTP LSZH Libre de Halógenos (Cobre Puro)',
      specs: 'Incluye cable Panduit 23AWG, Jack Mini-Com TX6A, Faceplate y Patch Cord 7ft certificado',
      zone_name: 'Zona A: Piso Técnico / Oficinas',
      unit: 'PTO',
      qty: 24,
      weight: 0.38,
    },
    {
      code: 'COM-FO-OM4-12H',
      brand: 'COMMSCOPE',
      category: 'FIBRA ÓPTICA TRONCAL',
      description: 'Tendido de Enlace Troncal de Fibra Óptica Multimodo OM4 12 Hilos Armado + ODF LC',
      specs: 'Incluye bandeja ODF 24 puertos LC Duplex, pigtails, manguitos y fusión por arco eléctrico',
      zone_name: 'Zona B: Backbone Vertical',
      unit: 'GLB',
      qty: 1,
      weight: 0.22,
    },
    {
      code: 'DIX-RACK-42RU',
      brand: 'PANDUIT / DIXON',
      category: 'GABINETES & RACKS',
      description: 'Gabinete de Piso Autosoportado 42RU 800x1000mm Puerta Microperforada + PDU',
      specs: 'Incluye 2 PDUs rackeables con protección térmica, bandeja de ventilación cuádruple y barra tierra',
      zone_name: 'Zona C: Data Center Principal',
      unit: 'UND',
      qty: 1,
      weight: 0.16,
    },
    {
      code: 'CIS-C9200L-48P',
      brand: 'CISCO',
      category: 'NETWORKING CORE',
      description: 'Switch Empresarial Cisco Catalyst 48 Puertos Gigabit PoE+ + Módulos Transceiver SFP+',
      specs: 'Conmutación de alta velocidad con enlaces ascendentes 10G en fibra óptica',
      zone_name: 'Zona C: Data Center Principal',
      unit: 'UND',
      qty: 1,
      weight: 0.13,
    },
    {
      code: 'FLU-DSX8000-CERT',
      brand: 'FLUKE NETWORKS',
      category: 'CERTIFICACIÓN & M.O.',
      description: 'Mano de Obra Especializada, Peinado de Gabinete y Certificación Fluke DSX-8000 / OTDR',
      specs: 'Entrega de reportes PDF originales Fluke por cada enlace bajo estándar ANSI/TIA-568.2-D',
      zone_name: 'General de Obra',
      unit: 'GLB',
      qty: 1,
      weight: 0.11,
    },
  ],
  badge: [
    {
      code: 'HIK-DSK1T673DX',
      brand: 'HIKVISION',
      category: 'CONTROL DE ACCESO IA',
      description: 'Terminal Biométrica de Reconocimiento Facial Deep-Learning + Lector QR y Mifare',
      specs: 'Pantalla táctil 7" IPS, detección de rostro vivo anti-spoofing, capacidad 50,000 usuarios',
      zone_name: 'Zona A: Recepción & Esclusas',
      unit: 'UND',
      qty: 4,
      weight: 0.35,
    },
    {
      code: 'DAH-ASD1200E',
      brand: 'DAHUA',
      category: 'CERRAJERÍA ELECTROMAGNÉTICA',
      description: 'Kit de Bloqueo Electromagnético 600 Lbs con Sensor de Estado + Botón No-Touch IR',
      specs: 'Incluye soporte Z/L en aluminio anodizado, brazo hidráulico y destrabe de emergencia INDECI',
      zone_name: 'Zona A: Puertas Controladas',
      unit: 'KIT',
      qty: 4,
      weight: 0.25,
    },
    {
      code: 'UBI-POE-SW16',
      brand: 'UBIQUITI',
      category: 'CONECTIVIDAD & RESPALDO',
      description: 'Switch PoE Administrable 16 Puertos + Fuente de Poder Ininterrumpida UPS Online 1KVA',
      specs: 'Autonomía de respaldo ante corte eléctrico y comunicación TCP/IP encriptada',
      zone_name: 'Zona B: Cuarto de Control',
      unit: 'EQP',
      qty: 1,
      weight: 0.24,
    },
    {
      code: 'SRV-ING-ACCESO',
      brand: 'HIKVISION / PRO',
      category: 'INSTALACIÓN & SOFTWARE',
      description: 'Instalación Electromecánica, Integración con Alarma Contra Incendio y Software HikCentral',
      specs: 'Configuración de horarios, niveles de acceso, reportes de asistencia y capacitación',
      zone_name: 'General de Obra',
      unit: 'GLB',
      qty: 1,
      weight: 0.16,
    },
  ],
};

export function enrichQuoteForDocument(rawQuote, ctx = {}) {
  if (!rawQuote) return null;
  const q = { ...rawQuote };
  const company = ctx.companyProfile || getCompanyProfile();
  const tc = Number(ctx.exchangeRate?.usd_to_pen_sell || ctx.exchangeRate?.sunat_official || 3.742);

  const customer = q.customer || {};
  const project = q.project || {};

  const taxableBase = Number(q.taxable_base_pen || q.subtotal_direct_pen || 10000);
  const discountPct = Number(q.discount_pct || 0);
  const grossBeforeDiscount =
    discountPct > 0 && discountPct < 100
      ? Number((taxableBase / (1 - discountPct / 100)).toFixed(2))
      : Number(q.sale_value_before_discount_pen || taxableBase);
  const discountAmount = Number((grossBeforeDiscount - taxableBase).toFixed(2));
  const igvAmount = Number((q.tax_amount_pen ?? q.igv_amount_pen ?? taxableBase * 0.18).toFixed(2));
  const totalWithTax = Number((q.total_with_tax_pen ?? taxableBase + igvAmount).toFixed(2));
  const totalUsd = Number((totalWithTax / tc).toFixed(2));

  const existingLines = Array.isArray(q.lines) ? q.lines : [];
  const hasPricedLines =
    existingLines.length > 0 &&
    existingLines.every((l) => l.description && Number(l.line_sale_subtotal_pen || 0) > 0);

  let enrichedLines = [];
  if (hasPricedLines) {
    enrichedLines = existingLines.map((l, idx) => {
      const qty = Math.max(1, Number(l.quantity || 1));
      const sub = Number(l.line_sale_subtotal_pen || 0);
      const unitPrice = Number(l.unit_price_pen || (sub / qty).toFixed(2));
      return {
        item: String(idx + 1).padStart(2, '0'),
        code: l.code || `PART-${String(idx + 1).padStart(3, '0')}`,
        brand: l.brand || inferBrandFromText(l.code, l.description),
        category: l.category || 'EQUIPAMIENTO & INSTALACIÓN',
        description: l.description || 'Partida técnica homologada',
        specs:
          l.specs ||
          'Suministro, montaje certificado, pruebas de operatividad y garantía oficial en Perú',
        zone_name: l.zone_name || 'Zona Principal de Obra',
        unit: l.unit || 'PTO',
        quantity: qty,
        unit_price_pen: unitPrice,
        line_sale_subtotal_pen: sub,
      };
    });
  } else {
    const templateKey = SPECIALTY_TEMPLATES[q.category_icon]
      ? q.category_icon
      : (q.project_title || '').toLowerCase().includes('wifi') ||
          (q.project_title || '').toLowerCase().includes('wi-fi')
        ? 'wifi'
        : (q.project_title || '').toLowerCase().includes('fibra') ||
            (q.project_title || '').toLowerCase().includes('cableado') ||
            (q.project_title || '').toLowerCase().includes('cat6')
          ? 'settings_ethernet'
          : (q.project_title || '').toLowerCase().includes('acceso') ||
              (q.project_title || '').toLowerCase().includes('biom') ||
              (q.project_title || '').toLowerCase().includes('portero')
            ? 'badge'
            : 'videocam';

    const tpl = SPECIALTY_TEMPLATES[templateKey];
    let runningSum = 0;
    enrichedLines = tpl.map((item, idx) => {
      const isLast = idx === tpl.length - 1;
      const lineTotal = isLast
        ? Number((grossBeforeDiscount - runningSum).toFixed(2))
        : Number((grossBeforeDiscount * item.weight).toFixed(2));
      runningSum = Number((runningSum + lineTotal).toFixed(2));
      const unitPrice = Number((lineTotal / item.qty).toFixed(2));
      return {
        item: String(idx + 1).padStart(2, '0'),
        code: item.code,
        brand: item.brand,
        category: item.category,
        description: item.description,
        specs: item.specs,
        zone_name: item.zone_name,
        unit: item.unit,
        quantity: item.qty,
        unit_price_pen: unitPrice,
        line_sale_subtotal_pen: lineTotal,
      };
    });
  }

  const chapterHardwarePen = Number((taxableBase * 0.785).toFixed(2));
  const chapterLaborPen = Number((taxableBase * 0.18).toFixed(2));
  const chapterLogisticsPen = Number((taxableBase - chapterHardwarePen - chapterLaborPen).toFixed(2));

  const detraccionPct = Number(company.spot_pct || 4.0);
  const detraccionPen = Number((totalWithTax * (detraccionPct / 100)).toFixed(2));
  const netPayableBankPen = Number((totalWithTax - detraccionPen).toFixed(2));

  const milestone1Pen = Number((totalWithTax * 0.5).toFixed(2));
  const milestone2Pen = Number((totalWithTax * 0.3).toFixed(2));
  const milestone3Pen = Number((totalWithTax - milestone1Pen - milestone2Pen).toFixed(2));

  const issueDate = q.issue_date || q.created_at || '2026-06-04';
  const validUntil = q.valid_until || '2026-06-19';

  return {
    ...q,
    company_profile: company,
    code: q.code || 'PF-2026-0001',
    version: q.version || 1,
    status: q.status || 'emitida',
    issue_date: issueDate,
    valid_until: validUntil,
    exchange_rate_sell: tc,
    customer: {
      business_name: customer.business_name || 'CORPORACIÓN LOGÍSTICA DEL PACÍFICO S.A.C.',
      document_type: customer.document_type || 'RUC',
      document_number: customer.document_number || '20548912304',
      contact_name: customer.contact_name || 'Jefatura de Operaciones e Infraestructura TI',
      phone: customer.phone || '(01) 614-9200 / +51 998 452 110',
      email: customer.email || 'logistica.compras@corporacioncliente.com.pe',
      fiscal_address:
        customer.fiscal_address ||
        `${customer.subtitle ? customer.subtitle + ' — ' : ''}Lima Metropolitana, Perú`,
      district: customer.district || 'Lima Metropolitana',
    },
    project: {
      name: q.project_title || project.name || 'Implementación de Infraestructura de Redes y CCTV IP',
      subtitle: q.project_subtitle || 'Suministro, Instalación Certificada y Puesta en Marcha',
      installation_address:
        project.installation_address ||
        `${customer.subtitle || 'Sede Principal Operativa'} — Lima, Perú`,
      property_type: (project.property_type || 'Corporativo / Industrial').toUpperCase(),
      floors: project.floors || 3,
    },
    seller_name: q.seller_name || 'Ing. Carlos Mendoza Rojas',
    seller_role: 'Ingeniero Senior de Costos & Proyectos B2B',
    seller_email: company.email || 'cmendoza@instalacionespe.com.pe',
    seller_phone: company.whatsapp || '+51 994 812 300',
    crews_label: q.crews_label || '2 Cuadrillas Certificadas N2',
    estimated_days: q.estimated_days || 4.0,
    total_hours: q.total_hours || 38.0,
    lines: enrichedLines,
    chapters: {
      hardware_pen: chapterHardwarePen,
      hardware_pct: 78.5,
      labor_pen: chapterLaborPen,
      labor_pct: 18.0,
      logistics_pen: chapterLogisticsPen,
      logistics_pct: 3.5,
    },
    gross_before_discount_pen: grossBeforeDiscount,
    discount_pct: discountPct,
    discount_amount_pen: discountAmount,
    taxable_base_pen: taxableBase,
    tax_amount_pen: igvAmount,
    total_with_tax_pen: totalWithTax,
    total_usd_equivalent: totalUsd,
    amount_in_words: numeroALetrasPen(totalWithTax),
    detraccion_pct: detraccionPct,
    detraccion_pen: detraccionPen,
    net_payable_pen: netPayableBankPen,
    milestones: [
      {
        step: '01',
        label: 'Adelanto Comercial (50%)',
        trigger: 'A la recepción de la Orden de Compra para acopio de equipos',
        amount_pen: milestone1Pen,
      },
      {
        step: '02',
        label: 'Avance Físico de Obra (30%)',
        trigger: 'Contra avance del 80% en tendido de red, montaje y canalización',
        amount_pen: milestone2Pen,
      },
      {
        step: '03',
        label: 'Liquidación y Dossier Final (20%)',
        trigger: 'Contra entrega de Certificación Fluke, Protocolos y Acta de Conformidad',
        amount_pen: milestone3Pen,
      },
    ],
    includes_text:
      q.includes_text ||
      'Suministro de equipos originales nuevos en caja sellada, tubería y accesorios de fijación, mano de obra con seguro SCTR Salud/Pensión vigente, peinado de gabinete, etiquetado termocontraíble bajo norma ANSI/TIA-606-C, pruebas de certificación y capacitación de operación.',
    excludes_text:
      q.excludes_text ||
      'Obras civiles mayores, rotura o resane de losas de concreto armado, suministro de energía eléctrica estabilizada 220V en tableros generales o licencias de terceros no especificadas en las partidas.',
    warranty_text: q.warranty_text || company.default_warranty_text,
    digital_hash: `SHA256:${Buffer.from(`${q.code || 'PF'}-${totalWithTax}`).toString('hex').slice(0, 24).toUpperCase()}`,
  };
}

function inferBrandFromText(code = '', desc = '') {
  const txt = `${code} ${desc}`.toUpperCase();
  if (txt.includes('HIK')) return 'HIKVISION';
  if (txt.includes('DAH')) return 'DAHUA';
  if (txt.includes('UBI') || txt.includes('UNIFI') || txt.includes('WI-FI') || txt.includes('WIFI'))
    return 'UBIQUITI';
  if (txt.includes('PAN') || txt.includes('CAT6')) return 'PANDUIT';
  if (txt.includes('CIS')) return 'CISCO';
  if (txt.includes('MIK')) return 'MIKROTIK';
  if (txt.includes('COM') || txt.includes('OM4') || txt.includes('FIBRA')) return 'COMMSCOPE';
  if (txt.includes('FLU')) return 'FLUKE';
  return 'HIKVISION / PANDUIT';
}

function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function renderCorporateQuotePdfHtml(rawQuote, ctx = {}) {
  const q = enrichQuoteForDocument(rawQuote, ctx);
  const c = q.company_profile || getCompanyProfile();
  const autoPrint = Boolean(ctx.autoPrint);

  const primaryColor = c.primary_color || '#041533';
  const accentColor = c.accent_color || '#ff6b1a';

  const statusMap = {
    aceptada: { label: 'ACEPTADA / APROBADA', bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    emitida: { label: 'OFICIAL EMITIDA', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    enviada: { label: 'ENVIADA AL CLIENTE', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
    en_aprobacion: { label: 'EN REVISIÓN GERENCIAL', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    borrador: { label: 'PROPUESTA PRELIMINAR', bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' },
    rechazada: { label: 'OBSERVADA / CERRADA', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  };
  const st = statusMap[q.status] || statusMap.emitida;

  const linesRowsHtml = q.lines
    .map(
      (l) => `
      <tr>
        <td class="col-item">${esc(l.item)}</td>
        <td class="col-sku">
          <div class="sku-code">${esc(l.code)}</div>
          <span class="brand-pill">${esc(l.brand)}</span>
        </td>
        <td class="col-desc">
          <div class="desc-title">${esc(l.description)}</div>
          <div class="desc-specs">${esc(l.specs)}</div>
        </td>
        <td class="col-zone">
          <span class="zone-tag">${esc(l.zone_name)}</span>
        </td>
        <td class="col-unit">${esc(l.unit)}</td>
        <td class="col-qty">${esc(l.quantity)}</td>
        <td class="col-price">S/ ${fmtMoney(l.unit_price_pen)}</td>
        <td class="col-total">S/ ${fmtMoney(l.line_sale_subtotal_pen)}</td>
      </tr>`
    )
    .join('');

  const milestonesHtml = q.milestones
    .map(
      (m) => `
      <div class="milestone-row">
        <div class="milestone-left">
          <span class="milestone-step">${esc(m.step)}</span>
          <div>
            <div class="milestone-title">${esc(m.label)}</div>
            <div class="milestone-sub">${esc(m.trigger)}</div>
          </div>
        </div>
        <div class="milestone-amount">S/ ${fmtMoney(m.amount_pen)}</div>
      </div>`
    )
    .join('');

  const certPillsHtml = (c.certifications || [])
    .map((cert) => `<span class="cert-pill">${esc(cert)}</span>`)
    .join('');

  const bankRowsHtml = (c.bank_accounts || [])
    .map(
      (b) => `
      <tr>
        <td><strong>${esc(b.bank)}</strong></td>
        <td>${esc(b.currency)}</td>
        <td>${esc(b.account_number)}</td>
        <td>${esc(b.cci)}</td>
      </tr>`
    )
    .join('');

  const cameraBrandsHtml = (c.camera_brands || [])
    .map((b) => {
      const logoImg = b.logo_url
        ? `<img src="${esc(b.logo_url)}" alt="${esc(b.name)}" style="height:16px;max-width:70px;object-fit:contain;margin-bottom:2px;" />`
        : `<div><span style="color:${esc(b.prefixColor || b.accent || '#d9232e')};font-weight:900;">${esc(b.prefix || b.name)}</span>${
            b.suffix
              ? `<span style="color:${esc(b.suffixColor || primaryColor)};font-weight:900;margin-left:-1px;">${esc(b.suffix)}</span>`
              : ''
          }</div>`;
      return `
      <div class="partner-logo-chip" style="border-left:3px solid ${esc(b.accent || '#d9232e')};">
        <div>
          ${logoImg}
          <span class="chip-sub">${esc(b.sub)}</span>
        </div>
      </div>`;
    })
    .join('');

  const networkBrandsHtml = (c.network_brands || [])
    .map((b) => {
      const logoImg = b.logo_url
        ? `<img src="${esc(b.logo_url)}" alt="${esc(b.name)}" style="height:16px;max-width:70px;object-fit:contain;margin-bottom:2px;" />`
        : `<div style="color:${esc(b.color || b.accent || primaryColor)};font-weight:900;">${esc(b.name)}</div>`;
      return `
      <div class="partner-logo-chip" style="border-left:3px solid ${esc(b.accent || '#049fd9')};">
        <div>
          ${logoImg}
          <span class="chip-sub">${esc(b.sub)}</span>
        </div>
      </div>`;
    })
    .join('');

  const logoBoxHtml = c.logo_url
    ? `<div class="brand-logo-custom">
         <img src="${esc(c.logo_url)}" alt="${esc(c.business_name)}" style="max-width:100%;max-height:100%;object-fit:contain;" />
       </div>`
    : `<div class="brand-logo-box">
         <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${esc(accentColor)}" stroke-width="2.2">
           <circle cx="12" cy="12" r="3"/>
           <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
         </svg>
         <span style="font-size:7px;font-weight:900;letter-spacing:0.1em;margin-top:2px;">${esc(c.short_code || 'INST-PE')}</span>
       </div>`;

  const signatureImgHtml = c.signature_url
    ? `<img src="${esc(c.signature_url)}" alt="Firma" style="height:28px;max-width:110px;object-fit:contain;margin:0 auto 2px;display:block;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proforma Corporativa ${esc(q.code)} - ${esc(q.customer.business_name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: ${esc(primaryColor)};
      --navy-mid: #102447;
      --navy-soft: #1b3564;
      --orange: ${esc(accentColor)};
      --orange-dark: #b13e00;
      --slate-bg: #f4f7fb;
      --slate-border: #d8e0ec;
      --text-main: #0f172a;
      --text-muted: #475569;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #cfd8e3;
      color: var(--text-main);
      font-size: 11px;
      line-height: 1.42;
      padding: 68px 16px 40px;
    }

    .pdf-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 54px;
      background: linear-gradient(90deg, var(--navy) 0%, #102447 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      box-shadow: 0 4px 20px rgba(4, 21, 51, 0.35);
      z-index: 9999;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toolbar-badge {
      background: rgba(255, 107, 26, 0.2);
      border: 1px solid var(--orange);
      color: #ffb595;
      font-weight: 800;
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .toolbar-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-toolbar {
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .btn-print {
      background: linear-gradient(135deg, var(--orange) 0%, #c2410c 100%);
      color: #ffffff;
      box-shadow: 0 3px 10px rgba(255, 117, 43, 0.4);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.22);
    }

    .a4-sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 6px;
      box-shadow: 0 18px 45px rgba(4, 21, 51, 0.28);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .top-accent-bar {
      height: 8px;
      width: 100%;
      background: linear-gradient(90deg, var(--navy) 0%, #102447 68%, var(--orange) 68%, #b13e00 100%);
    }

    .sheet-body {
      padding: 20px 26px 14px;
      flex: 1;
    }

    .corp-header {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 18px;
      padding-bottom: 14px;
      border-bottom: 2px solid var(--navy);
    }

    .brand-col {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      flex: 1;
    }

    .brand-logo-box {
      width: 58px;
      height: 58px;
      border-radius: 12px;
      background: linear-gradient(145deg, var(--navy) 0%, #162d59 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(4, 21, 51, 0.22);
      border-bottom: 3px solid var(--orange);
      flex-shrink: 0;
    }

    .brand-logo-custom {
      width: 72px;
      height: 58px;
      border-radius: 10px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-bottom: 3px solid var(--orange);
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-info h1 {
      font-size: 16px;
      font-weight: 900;
      color: var(--navy);
      letter-spacing: -0.02em;
      line-height: 1.15;
    }

    .brand-info .brand-tagline {
      font-size: 9.5px;
      font-weight: 800;
      color: var(--orange);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 2px;
    }

    .brand-meta {
      margin-top: 5px;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.45;
    }

    .cert-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 6px;
    }

    .cert-pill {
      font-size: 8.5px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: #f1f5f9;
      color: var(--navy);
      border: 1px solid #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .folio-box {
      width: 245px;
      border: 2px solid var(--navy);
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .folio-top {
      background: var(--navy);
      color: #ffffff;
      text-align: center;
      padding: 6px 10px;
    }

    .folio-ruc {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #ffb595;
    }

    .folio-doc-type {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.05em;
      margin-top: 1px;
    }

    .folio-mid {
      padding: 8px 12px;
      text-align: center;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .folio-code {
      font-size: 16px;
      font-weight: 900;
      color: var(--navy);
      letter-spacing: -0.01em;
    }

    .folio-status {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.05em;
      border: 1px solid;
    }

    .folio-dates {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #ffffff;
      font-size: 9px;
    }

    .folio-date-cell {
      padding: 5px 8px;
      text-align: center;
      border-right: 1px solid #e2e8f0;
    }

    .folio-date-cell:last-child {
      border-right: none;
    }

    .folio-date-label {
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5px;
      display: block;
    }

    .folio-date-val {
      color: var(--navy);
      font-weight: 800;
      font-size: 9.5px;
    }

    .dossier-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 12px;
    }

    .info-card {
      border: 1px solid var(--slate-border);
      border-radius: 8px;
      background: #f8fafc;
      overflow: hidden;
    }

    .info-card-header {
      background: linear-gradient(90deg, var(--navy) 0%, #1b3564 100%);
      color: #ffffff;
      padding: 5px 10px;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .info-card-header span.sub-tag {
      background: rgba(255, 255, 255, 0.16);
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 8px;
      color: #ffd8c2;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }

    .info-table td {
      padding: 4px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }

    .info-table tr:last-child td {
      border-bottom: none;
    }

    .info-label {
      width: 102px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      font-size: 8.5px;
    }

    .info-val {
      font-weight: 600;
      color: #0f172a;
    }

    .info-val strong {
      font-weight: 800;
      color: var(--navy);
    }

    .chapters-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 12px;
    }

    .chapter-box {
      border: 1px solid #cbd5e1;
      border-left: 4px solid var(--navy);
      border-radius: 7px;
      padding: 7px 10px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .chapter-box.ch-2 {
      border-left-color: var(--orange);
    }

    .chapter-box.ch-3 {
      border-left-color: #059669;
    }

    .ch-title {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.03em;
    }

    .ch-desc {
      font-size: 8px;
      color: #64748b;
      margin-top: 1px;
    }

    .ch-amount {
      text-align: right;
    }

    .ch-amount .pen {
      font-size: 11.5px;
      font-weight: 900;
      color: var(--navy);
      display: block;
    }

    .ch-amount .pct {
      font-size: 8px;
      font-weight: 700;
      color: #c2410c;
    }

    .items-section {
      margin-top: 12px;
    }

    .section-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .section-bar h2 {
      font-size: 10.5px;
      font-weight: 900;
      color: var(--navy);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-bar span {
      font-size: 8.5px;
      font-weight: 700;
      color: #475569;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }

    .items-table thead th {
      background: var(--navy);
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 7px 7px;
      text-align: left;
      border-right: 1px solid rgba(255, 255, 255, 0.12);
    }

    .items-table tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }

    .items-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    .items-table td {
      padding: 6.5px 7px;
      vertical-align: top;
      font-size: 9.5px;
    }

    .col-item {
      width: 28px;
      text-align: center;
      font-weight: 800;
      color: #64748b;
    }

    .col-sku {
      width: 106px;
    }

    .sku-code {
      font-weight: 800;
      color: var(--navy);
      font-size: 9px;
      font-family: 'Consolas', 'Courier New', monospace;
    }

    .brand-pill {
      display: inline-block;
      margin-top: 2px;
      padding: 1px 5px;
      border-radius: 3px;
      background: #fff1e6;
      color: #b13e00;
      border: 1px solid #ffd0b5;
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .desc-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 9.8px;
      line-height: 1.28;
    }

    .desc-specs {
      font-size: 8.3px;
      color: #475569;
      margin-top: 2px;
      line-height: 1.3;
    }

    .col-zone {
      width: 112px;
    }

    .zone-tag {
      display: inline-block;
      font-size: 8px;
      font-weight: 700;
      background: #e2e8f0;
      color: #1e293b;
      padding: 2px 6px;
      border-radius: 4px;
      line-height: 1.25;
    }

    .col-unit {
      width: 38px;
      text-align: center;
      font-weight: 700;
      color: #475569;
    }

    .col-qty {
      width: 40px;
      text-align: center;
      font-weight: 800;
      color: var(--navy);
    }

    .col-price {
      width: 78px;
      text-align: right;
      font-weight: 600;
      color: #334155;
      white-space: nowrap;
    }

    .col-total {
      width: 86px;
      text-align: right;
      font-weight: 800;
      color: var(--navy);
      white-space: nowrap;
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: 1.22fr 0.98fr;
      gap: 14px;
      margin-top: 12px;
      align-items: start;
    }

    .left-conditions {
      display: flex;
      flex-direction: column;
      gap: 9px;
    }

    .sub-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      padding: 8px 10px;
    }

    .sub-card-title {
      font-size: 9px;
      font-weight: 900;
      color: var(--navy);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .milestone-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3.5px 0;
      border-bottom: 1px dashed #e2e8f0;
    }

    .milestone-row:last-child {
      border-bottom: none;
    }

    .milestone-left {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .milestone-step {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      background: var(--navy);
      color: #ffffff;
      font-size: 8px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .milestone-title {
      font-size: 9px;
      font-weight: 800;
      color: var(--navy);
    }

    .milestone-sub {
      font-size: 7.8px;
      color: #64748b;
    }

    .milestone-amount {
      font-size: 9.5px;
      font-weight: 800;
      color: #b13e00;
      white-space: nowrap;
    }

    .bank-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.3px;
    }

    .bank-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      text-align: left;
      padding: 3.5px 6px;
      border-bottom: 1px solid #cbd5e1;
      text-transform: uppercase;
    }

    .bank-table td {
      padding: 3.5px 6px;
      border-bottom: 1px solid #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }

    .spot-banner {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-left: 3.5px solid var(--orange);
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 8.3px;
      color: #431407;
      line-height: 1.35;
    }

    .right-financials {
      display: flex;
      flex-direction: column;
      gap: 9px;
    }

    .totals-card {
      border: 1.5px solid var(--navy);
      border-radius: 9px;
      overflow: hidden;
      background: #ffffff;
    }

    .totals-header {
      background: var(--navy);
      color: #ffffff;
      padding: 6px 12px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      justify-content: space-between;
    }

    .totals-body {
      padding: 8px 12px;
    }

    .tot-row {
      display: flex;
      justify-content: space-between;
      padding: 3.5px 0;
      font-size: 9.5px;
      color: #334155;
    }

    .tot-row.discount {
      color: #c2410c;
      font-weight: 700;
    }

    .tot-row.net {
      border-top: 1px solid #cbd5e1;
      padding-top: 5px;
      margin-top: 2px;
      font-weight: 800;
      color: var(--navy);
    }

    .tot-grand-box {
      background: linear-gradient(135deg, var(--navy) 0%, #162d59 100%);
      color: #ffffff;
      padding: 9px 12px;
      border-radius: 7px;
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tot-grand-label {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #ffb595;
    }

    .tot-grand-sub {
      font-size: 8px;
      color: #cbd5e1;
      margin-top: 1px;
    }

    .tot-grand-val {
      font-size: 16.5px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .amount-words {
      margin-top: 6px;
      padding: 5px 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      font-size: 8px;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
    }

    .qr-signatures-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .qr-row {
      display: flex;
      align-items: center;
      gap: 9px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }

    .qr-box {
      width: 48px;
      height: 48px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px;
      flex-shrink: 0;
    }

    .qr-meta {
      font-size: 7.8px;
      color: #475569;
      line-height: 1.35;
    }

    .qr-meta strong {
      color: var(--navy);
      font-size: 8.3px;
    }

    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding-top: 10px;
      align-items: end;
    }

    .sig-box {
      text-align: center;
      border-top: 1.5px solid var(--navy);
      padding-top: 4px;
    }

    .sig-name {
      font-size: 8.5px;
      font-weight: 800;
      color: var(--navy);
    }

    .sig-role {
      font-size: 7.5px;
      color: #64748b;
    }

    .brands-footer {
      background: #f8fafc;
      border-top: 2px solid var(--navy);
      padding: 10px 26px 12px;
      margin-top: auto;
    }

    .brands-footer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 7px;
    }

    .brands-footer-title {
      font-size: 8.5px;
      font-weight: 900;
      color: var(--navy);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brands-footer-title::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: var(--orange);
    }

    .brands-footer-sub {
      font-size: 7.8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .brands-ecosystem-grid {
      display: grid;
      grid-template-columns: 1fr 1.15fr;
      gap: 10px;
    }

    .brand-group {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 6px 9px;
    }

    .brand-group-label {
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #475569;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-logos-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }

    .partner-logo-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 7px;
      border-radius: 5px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-weight: 900;
      font-size: 9px;
      letter-spacing: 0.02em;
    }

    .partner-logo-chip .chip-sub {
      font-size: 6.5px;
      font-weight: 700;
      opacity: 0.75;
      text-transform: uppercase;
      display: block;
      line-height: 1;
    }

    .legal-bottom-bar {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 7.8px;
      color: #475569;
      font-weight: 600;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .a4-sheet {
        width: 210mm !important;
        min-height: 297mm !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>

  <div class="pdf-toolbar no-print">
    <div class="toolbar-left">
      <span class="toolbar-badge">Formato Corporativo A4 · SUNAT</span>
      <span class="toolbar-title">${esc(q.code)} (v${esc(q.version)}) — ${esc(q.customer.business_name)}</span>
    </div>
    <div class="toolbar-actions">
      <button type="button" class="btn-toolbar btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Imprimir / Guardar en PDF (A4)
      </button>
      <button type="button" class="btn-toolbar btn-secondary" onclick="window.close()">
        Cerrar Vista
      </button>
    </div>
  </div>

  <div class="a4-sheet">
    <div class="top-accent-bar"></div>

    <div class="sheet-body">
      <header class="corp-header">
        <div class="brand-col">
          ${logoBoxHtml}
          <div class="brand-info">
            <h1>${esc(c.business_name)}</h1>
            <div class="brand-tagline">${esc(c.tagline)}</div>
            <div class="brand-meta">
              <strong>Sede Central:</strong> ${esc(c.fiscal_address)}<br/>
              <strong>Central B2B:</strong> ${esc(c.phone)} · WhatsApp Corp: ${esc(c.whatsapp)} · <strong>Web:</strong> ${esc(c.website)}
            </div>
            <div class="cert-pills">
              ${certPillsHtml}
            </div>
          </div>
        </div>

        <div class="folio-box">
          <div class="folio-top">
            <div class="folio-ruc">R.U.C. N° ${esc(c.ruc)}</div>
            <div class="folio-doc-type">PROFORMA COMERCIAL</div>
          </div>
          <div class="folio-mid">
            <div class="folio-code">${esc(q.code)} <span style="font-size:11px;color:#64748b;">v${esc(q.version)}.0</span></div>
            <span class="folio-status" style="background:${st.bg};color:${st.color};border-color:${st.border};">
              ${esc(st.label)}
            </span>
          </div>
          <div class="folio-dates">
            <div class="folio-date-cell">
              <span class="folio-date-label">Emisión</span>
              <span class="folio-date-val">${esc(q.issue_date)}</span>
            </div>
            <div class="folio-date-cell">
              <span class="folio-date-label">Válida Hasta</span>
              <span class="folio-date-val">${esc(q.valid_until)}</span>
            </div>
          </div>
        </div>
      </header>

      <section class="dossier-grid">
        <div class="info-card">
          <div class="info-card-header">
            <span>I. Datos del Cliente &amp; Receptor Fiscal</span>
            <span class="sub-tag">SUNAT HABIDO</span>
          </div>
          <table class="info-table">
            <tr>
              <td class="info-label">Razón Social:</td>
              <td class="info-val"><strong>${esc(q.customer.business_name)}</strong></td>
            </tr>
            <tr>
              <td class="info-label">${esc(q.customer.document_type)} / Registro:</td>
              <td class="info-val"><strong>${esc(q.customer.document_number)}</strong> · Moneda: <strong>SOLES (PEN S/)</strong></td>
            </tr>
            <tr>
              <td class="info-label">Atención A:</td>
              <td class="info-val">${esc(q.customer.contact_name)}</td>
            </tr>
            <tr>
              <td class="info-label">Contacto:</td>
              <td class="info-val">${esc(q.customer.phone)} · ${esc(q.customer.email)}</td>
            </tr>
            <tr>
              <td class="info-label">Dirección Fiscal:</td>
              <td class="info-val">${esc(q.customer.fiscal_address)}</td>
            </tr>
          </table>
        </div>

        <div class="info-card">
          <div class="info-card-header">
            <span>II. Expediente Técnico de Obra &amp; Ejecución</span>
            <span class="sub-tag">T.C. S/ ${esc(q.exchange_rate_sell.toFixed(3))}</span>
          </div>
          <table class="info-table">
            <tr>
              <td class="info-label">Proyecto / Obra:</td>
              <td class="info-val"><strong>${esc(q.project.name)}</strong></td>
            </tr>
            <tr>
              <td class="info-label">Alcance Base:</td>
              <td class="info-val">${esc(q.project.subtitle)}</td>
            </tr>
            <tr>
              <td class="info-label">Sede Instalación:</td>
              <td class="info-val">${esc(q.project.installation_address)} (${esc(q.project.floors)} Niveles)</td>
            </tr>
            <tr>
              <td class="info-label">Plazo &amp; Cuadrilla:</td>
              <td class="info-val"><strong>${esc(q.estimated_days)} Días Hábiles</strong> (${esc(q.total_hours)} H-H) · ${esc(q.crews_label)}</td>
            </tr>
            <tr>
              <td class="info-label">Ing. Responsable:</td>
              <td class="info-val"><strong>${esc(q.seller_name)}</strong> · ${esc(c.email)}</td>
            </tr>
          </table>
        </div>
      </section>

      <section class="chapters-strip">
        <div class="chapter-box ch-1">
          <div>
            <div class="ch-title">Cap. 01 · Equipamiento &amp; Materiales</div>
            <div class="ch-desc">Hardware activo, cámaras IP y cableado</div>
          </div>
          <div class="ch-amount">
            <span class="pen">S/ ${fmtMoney(q.chapters.hardware_pen)}</span>
            <span class="pct">${q.chapters.hardware_pct}% del Valor Neto</span>
          </div>
        </div>
        <div class="chapter-box ch-2">
          <div>
            <div class="ch-title">Cap. 02 · Ingeniería &amp; Mano de Obra</div>
            <div class="ch-desc">Instalación, fusión FO y certificación</div>
          </div>
          <div class="ch-amount">
            <span class="pen">S/ ${fmtMoney(q.chapters.labor_pen)}</span>
            <span class="pct">${q.chapters.labor_pct}% del Valor Neto</span>
          </div>
        </div>
        <div class="chapter-box ch-3">
          <div>
            <div class="ch-title">Cap. 03 · Logística, Altura &amp; SCTR</div>
            <div class="ch-desc">Movilización, andamios y seguros ley</div>
          </div>
          <div class="ch-amount">
            <span class="pen">S/ ${fmtMoney(q.chapters.logistics_pen)}</span>
            <span class="pct">${q.chapters.logistics_pct}% del Valor Neto</span>
          </div>
        </div>
      </section>

      <section class="items-section">
        <div class="section-bar">
          <h2>III. Desglose Técnico-Económico de Suministros, Equipos e Instalación</h2>
          <span>Precios Unitarios expresados en Soles (PEN) antes de I.G.V.</span>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th class="col-item">Ítem</th>
              <th class="col-sku">Código / Marca</th>
              <th>Descripción Técnica y Especificaciones del Suministro / Servicio</th>
              <th class="col-zone">Zona / Sector</th>
              <th class="col-unit">Und.</th>
              <th class="col-qty">Cant.</th>
              <th class="col-price">V. Unitario</th>
              <th class="col-total">Subtotal (S/)</th>
            </tr>
          </thead>
          <tbody>
            ${linesRowsHtml}
          </tbody>
        </table>
      </section>

      <section class="bottom-grid">
        <div class="left-conditions">
          <div class="sub-card">
            <div class="sub-card-title">
              <span>IV. Cronograma de Facturación e Hitos de Pago</span>
              <span style="color:#c2410c;">Validez: 15 Días Calendario</span>
            </div>
            ${milestonesHtml}
          </div>

          <div class="sub-card">
            <div class="sub-card-title">
              <span>V. Cuentas Bancarias Corporativas &amp; CCI (${esc(c.business_name)})</span>
              <span style="color:#059669;">RUC ${esc(c.ruc)}</span>
            </div>
            <table class="bank-table">
              <thead>
                <tr>
                  <th>Entidad Financiera</th>
                  <th>Moneda / Tipo</th>
                  <th>N° Cuenta Corriente</th>
                  <th>Código Interbancario (CCI)</th>
                </tr>
              </thead>
              <tbody>
                ${bankRowsHtml}
                <tr>
                  <td><strong>${esc(c.spot_bank_name)}</strong></td>
                  <td>Detracciones SPOT</td>
                  <td><strong>${esc(c.spot_account_number)}</strong></td>
                  <td>${esc(c.spot_code_label)} (${q.detraccion_pct}%)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="spot-banner">
            <strong>NOTA TRIBUTARIA SUNAT (SPOT - DETRACCIÓN ${q.detraccion_pct}%):</strong>
            Operación afecta al Sistema de Detracciones. Depósito en Cta. ${esc(c.spot_bank_name)} N° <strong>${esc(c.spot_account_number)}</strong> por
            <strong>S/ ${fmtMoney(q.detraccion_pen)}</strong> y abono neto en cuentas comerciales por <strong>S/ ${fmtMoney(q.net_payable_pen)}</strong>.<br/>
            <strong>GARANTÍA TÉCNICA &amp; ALCANCE:</strong> ${esc(q.warranty_text)}
          </div>
        </div>

        <div class="right-financials">
          <div class="totals-card">
            <div class="totals-header">
              <span>Liquidación Económica SUNAT</span>
              <span>Moneda: PEN (S/)</span>
            </div>
            <div class="totals-body">
              <div class="tot-row">
                <span>Valor de Venta Bruto (Sin IGV):</span>
                <strong>S/ ${fmtMoney(q.gross_before_discount_pen)}</strong>
              </div>
              ${
                q.discount_pct > 0
                  ? `<div class="tot-row discount">
                      <span>Descuento Corporativo Otorgado (-${q.discount_pct}%):</span>
                      <span>- S/ ${fmtMoney(q.discount_amount_pen)}</span>
                    </div>`
                  : ''
              }
              <div class="tot-row net">
                <span>BASE IMPONIBLE NETA (VALOR VENTA):</span>
                <span>S/ ${fmtMoney(q.taxable_base_pen)}</span>
              </div>
              <div class="tot-row">
                <span>Impuesto General a las Ventas — I.G.V. (18.00%):</span>
                <strong>S/ ${fmtMoney(q.tax_amount_pen)}</strong>
              </div>

              <div class="tot-grand-box">
                <div>
                  <div class="tot-grand-label">Importe Total de la Propuesta</div>
                  <div class="tot-grand-sub">Equivalente Ref.: USD $ ${fmtMoney(q.total_usd_equivalent)}</div>
                </div>
                <div class="tot-grand-val">S/ ${fmtMoney(q.total_with_tax_pen)}</div>
              </div>

              <div class="amount-words">
                SON: ${esc(q.amount_in_words)}
              </div>
            </div>
          </div>

          <div class="qr-signatures-card">
            <div class="qr-row">
              <div class="qr-box">
                <svg viewBox="0 0 36 36" width="100%" height="100%" fill="${esc(primaryColor)}">
                  <rect x="2" y="2" width="10" height="10" fill="none" stroke="${esc(primaryColor)}" stroke-width="2"/>
                  <rect x="5" y="5" width="4" height="4"/>
                  <rect x="24" y="2" width="10" height="10" fill="none" stroke="${esc(primaryColor)}" stroke-width="2"/>
                  <rect x="27" y="5" width="4" height="4"/>
                  <rect x="2" y="24" width="10" height="10" fill="none" stroke="${esc(primaryColor)}" stroke-width="2"/>
                  <rect x="5" y="27" width="4" height="4"/>
                  <rect x="15" y="4" width="3" height="3"/><rect x="19" y="8" width="3" height="3"/>
                  <rect x="14" y="14" width="4" height="4"/><rect x="20" y="16" width="3" height="3"/>
                  <rect x="4" y="16" width="4" height="3"/><rect x="10" y="19" width="3" height="3"/>
                  <rect x="26" y="16" width="6" height="3"/><rect x="16" y="24" width="4" height="4"/>
                  <rect x="23" y="23" width="4" height="4"/><rect x="29" y="28" width="5" height="5"/>
                  <rect x="22" y="30" width="4" height="4"/>
                </svg>
              </div>
              <div class="qr-meta">
                <strong>VALIDACIÓN DIGITAL &amp; TRAZABILIDAD</strong><br/>
                Expediente: <strong>${esc(q.code)}</strong> · Rev: v${esc(q.version)}.0<br/>
                ${esc(q.digital_hash)}<br/>
                ${esc(c.sunat_badge)}
              </div>
            </div>

            <div class="sig-grid">
              <div style="text-align:center;">
                ${signatureImgHtml}
                <div class="sig-box">
                  <div class="sig-name">${esc(q.seller_name)}</div>
                  <div class="sig-role">Ing. de Costos &amp; Proyectos · ${esc(c.short_code)}</div>
                </div>
              </div>
              <div style="text-align:center;">
                <div class="sig-box">
                  <div class="sig-name">ACEPTACIÓN DEL CLIENTE</div>
                  <div class="sig-role">Firma, Sello, RUC y N° Orden de Compra</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="brands-footer">
      <div class="brands-footer-header">
        <div class="brands-footer-title">
          ${esc(c.footer_title)}
        </div>
        <div class="brands-footer-sub">${esc(c.footer_subtitle)}</div>
      </div>

      <div class="brands-ecosystem-grid">
        <div class="brand-group">
          <div class="brand-group-label">
            <span>Cámaras IP, CCTV Analítico &amp; Seguridad Electrónica</span>
            <span style="color:#b13e00;">NDAA / ONVIF Profile S/G/T</span>
          </div>
          <div class="brand-logos-row">
            ${cameraBrandsHtml}
          </div>
        </div>

        <div class="brand-group">
          <div class="brand-group-label">
            <span>Redes Empresariales, Wi-Fi 6/7, Fibra Óptica &amp; Cableado Estructurado</span>
            <span style="color:${esc(primaryColor)};">ANSI/TIA-568.2-D</span>
          </div>
          <div class="brand-logos-row">
            ${networkBrandsHtml}
          </div>
        </div>
      </div>

      <div class="legal-bottom-bar">
        <span>${esc(c.business_name)} · RUC ${esc(c.ruc)} · ${esc(c.fiscal_address)}</span>
        <span>${esc(c.document_control_code)} · Página 1 de 1</span>
      </div>
    </footer>
  </div>

  ${
    autoPrint
      ? `<script>window.addEventListener('load', () => { setTimeout(() => window.print(), 350); });</script>`
      : ''
  }
</body>
</html>`;
}
