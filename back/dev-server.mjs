/**
 * Servidor de desarrollo (cero dependencias) que expone /api/v1 con el mismo motor
 * de cálculo y las mismas reglas de rol que el backend PHP. Datos en memoria.
 * Uso: node dev-server.mjs   (puerto 8080)
 */
import http from 'node:http';
import crypto from 'node:crypto';
import { calculateQuote, calculateAssemblyUnit, sanitizePayload, canSeeCosts } from './engine.mjs';

const PORT = Number(process.env.PORT || 8080);
const TODAY = () => new Date().toISOString().slice(0, 10);

// ---------------- Datos semilla ----------------
const users = [
  { id: 1, full_name: 'Administrador General', email: 'admin@empresa.pe', password: 'Secret123!', role: 'admin', is_active: 1 },
  { id: 2, full_name: 'Roberto Sánchez', email: 'gerencia@empresa.pe', password: 'Secret123!', role: 'gerencia', is_active: 1 },
  { id: 3, full_name: 'Carlos Mendoza', email: 'vendedor@empresa.pe', password: 'Secret123!', role: 'vendedor', is_active: 1 },
  { id: 4, full_name: 'Jorge Quispe', email: 'tecnico@empresa.pe', password: 'Secret123!', role: 'tecnico', is_active: 1 },
];
const attempts = {};
const settings = {
  labor_params: {
    technician_day_cost_pen: 140, assistant_day_cost_pen: 90, effective_hours_per_day: 7, buffer_pct: 15,
    default_travel_cost_per_day_pen: 40, default_overhead_pct: 8, default_margin_on_sale_pct: 30,
    min_margin_on_sale_pct: 20, seller_max_discount_pct: 5, tax_pct: 18, default_labor_method: 'max_ab', default_validity_days: 15,
  },
  crew_efficiency: { 1: 100, 2: 100, 3: 90, 4: 80 },
  exchange_rate: { rate_date: TODAY(), usd_to_pen_buy: 3.72, usd_to_pen_sell: 3.75, buffer_pct: 0 },
};
const difficulty = [
  { id: 1, code: 'NORMAL', name: 'Estándar / Normal', factor: 1.0 },
  { id: 2, code: 'ALTURA_MEDIA', name: 'Altura > 3.5m o canaleta nueva', factor: 1.15 },
  { id: 3, code: 'CONCRETO_EXT', name: 'Muro concreto / exterior complejo', factor: 1.25 },
  { id: 4, code: 'INDUSTRIAL_ALTA', name: 'Planta industrial / altura > 6m', factor: 1.5 },
];
const assemblies = [
  { id: 1, code: 'ASM-CAM-EXT', name: 'Punto de cámara IP Bullet 4MP exterior', category: 'cctv', unit: 'PUNTO', unit_cost_pen: 223.5, hours_cabling: 1, hours_mounting: 2, hours_config: 0.5, reference_cost_per_point: 70 },
  { id: 2, code: 'ASM-AP', name: 'Punto Access Point Wi-Fi 6', category: 'redes', unit: 'PUNTO', unit_cost_pen: 315, hours_cabling: 0.8, hours_mounting: 1.25, hours_config: 0.6, reference_cost_per_point: 55 },
  { id: 3, code: 'ASM-NVR', name: 'Grabador NVR 8 canales + HDD 2TB', category: 'cctv', unit: 'UND', unit_cost_pen: 680, hours_cabling: 0.2, hours_mounting: 0.5, hours_config: 1.5, reference_cost_per_point: 80 },
  { id: 4, code: 'ASM-SW8', name: 'Switch PoE+ 8 puertos en gabinete', category: 'redes', unit: 'UND', unit_cost_pen: 342, hours_cabling: 0.2, hours_mounting: 0.5, hours_config: 1, reference_cost_per_point: 55 },
  { id: 5, code: 'ASM-VP-CASA', name: 'Kit videoportero IP residencial', category: 'videoportero', unit: 'KIT', unit_cost_pen: 580, hours_cabling: 0.2, hours_mounting: 1, hours_config: 1, reference_cost_per_point: 90 },
  { id: 6, code: 'ASM-BIO-ACC', name: 'Punto Control de Acceso Biométrico Facial + Electroimán', category: 'accesos', unit: 'PUNTO', unit_cost_pen: 1120, hours_cabling: 1.2, hours_mounting: 2.5, hours_config: 1.0, reference_cost_per_point: 95 },
];
const products = [
  {
    id: 1,
    sku: 'HK-DS2CD2183G2',
    category: 'cctv',
    category_label: 'CCTV & Video',
    name: 'Cámara Domo IP 4K AcuSense IR30m IP67',
    brand: 'HIKVISION',
    unit: 'UND',
    cost_pen: 318.00,
    cost_usd: 84.80,
    list_price_pen: 485.00,
    list_price_usd: 129.33,
    final_price_pen: 572.30,
    margin_pct: 34.4,
    stock: 24,
    stock_unit: 'uds.',
    stock_status: 'in_stock',
    warehouse: 'Lima / Callao',
    lead_time: 'Entrega Inmediata (Almacén Lima)',
    description: 'Sensor CMOS 1/2.8" Escaneo Progresivo • Lente fijo 2.8mm • PoE 802.3af • Clasificación humana/vehicular IA • Compresión H.265+',
    certifications: ['Garantía 2 Años', 'IP67 Intemperie', 'IK10 Antivandálica'],
    supplier_name: 'DELTRON PERÚ S.A.',
    image_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80',
    compatible_kits: [
      { code: 'ASM-CAM-EXT', name: 'Kit CCTV Retail 8 Puntos', detail: 'Incluye 8x Domo 4K + NVR + PoE', price_pen: 4890.00 },
      { code: 'ASM-PERIM', name: 'Punto Perimetral PoE Industrial', detail: '1x Domo + Caja estanca + 45m Cat6A', price_pen: 780.00 },
    ],
  },
  {
    id: 2,
    sku: 'UB-USW-24-POE',
    category: 'redes',
    category_label: 'Redes & Fibra Óptica',
    name: 'Switch UniFi Gen2 24 Puertos Gigabit PoE+',
    brand: 'UBIQUITI',
    unit: 'UND',
    cost_pen: 1280.00,
    cost_usd: 341.33,
    list_price_pen: 1845.00,
    list_price_usd: 492.00,
    final_price_pen: 2177.10,
    margin_pct: 30.6,
    stock: 8,
    stock_unit: 'uds.',
    stock_status: 'in_stock',
    warehouse: 'Lima / Callao',
    lead_time: 'Entrega Inmediata (Almacén Lima)',
    description: '16 Puertos PoE+ IEEE 802.3at/af (95W total) • 2x SFP 1G • Pantalla táctil LCM 1.3" • Rackeable 1U silencioso sin ventilador',
    certifications: ['Garantía 1 Año', 'Rack 1U Metálico', 'PoE+ 95W Budget'],
    supplier_name: 'INGRAM MICRO PERÚ',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
    compatible_kits: [
      { code: 'ASM-SW8', name: 'Gabinete Comunicaciones 12UR', detail: 'Incluye Switch + Patch Panel + Ordenador', price_pen: 3250.00 },
    ],
  },
  {
    id: 3,
    sku: 'PAN-PUC6ASD04BU',
    category: 'redes',
    category_label: 'Redes & Fibra Óptica',
    name: 'Bobina Cable UTP Cat6A LSZH 305m Azul',
    brand: 'PANDUIT',
    unit: 'ROLLO',
    cost_pen: 675.00,
    cost_usd: 180.00,
    list_price_pen: 960.00,
    list_price_usd: 256.00,
    final_price_pen: 1132.80,
    margin_pct: 29.7,
    stock: 45,
    stock_unit: 'rollos',
    stock_status: 'in_stock',
    warehouse: 'Lima / Callao',
    lead_time: 'Entrega Inmediata (Almacén Surquillo)',
    description: 'Conductor Cobre Sólido 23 AWG • Chaqueta Libre de Halógenos (LSZH) IEC 60332-1 • Certificación 10GBASE-T hasta 100m',
    certifications: ['Garantía 25 Años', 'UL / ETL Verified', 'LSZH Ignífugo'],
    supplier_name: 'ANIXTER PERÚ S.A.C.',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
    compatible_kits: [
      { code: 'ASM-AP', name: 'Punto de Red Certificado Cat6A', detail: 'Tendido + Jack + Faceplate + Certificación Fluke', price_pen: 245.00 },
    ],
  },
  {
    id: 4,
    sku: 'ZK-SPEEDFACE-V5L',
    category: 'accesos',
    category_label: 'Control de Acceso',
    name: 'Terminal Control de Acceso Facial + Huella',
    brand: 'ZKTECO',
    unit: 'UND',
    cost_pen: 940.00,
    cost_usd: 250.67,
    list_price_pen: 1420.00,
    list_price_usd: 378.67,
    final_price_pen: 1675.60,
    margin_pct: 33.8,
    stock: 2,
    stock_unit: 'uds.',
    stock_status: 'critical',
    warehouse: 'Lima / Callao',
    lead_time: 'Stock Crítico (Reposición 5 días)',
    description: 'Pantalla táctil 5" • Reconocimiento facial luz visible anti-spoofing • Capacidad 6,000 rostros / 10,000 huellas • TCP/IP, Wiegand, RS485',
    certifications: ['Garantía 2 Años', 'Algoritmo Visible Light', 'Integración ZKBioSecurity'],
    supplier_name: 'TECNOSEG S.A.C.',
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80',
    compatible_kits: [
      { code: 'ASM-BIO-ACC', name: 'Esclusa Biométrica Corporativa', detail: 'Terminal Facial + Electroimán 600lbs + Botón No-Touch', price_pen: 2490.00 },
    ],
  },
  {
    id: 5,
    sku: 'EMT-CONDUIT-34',
    category: 'canalizacion',
    category_label: 'Canalización EMT/PVC',
    name: 'Tubería Metálica EMT 3/4" x 3m Galvanizada UL',
    brand: 'COLMENA',
    unit: 'TUBO',
    cost_pen: 24.50,
    cost_usd: 6.53,
    list_price_pen: 36.00,
    list_price_usd: 9.60,
    final_price_pen: 42.48,
    margin_pct: 31.9,
    stock: 180,
    stock_unit: 'tubos',
    stock_status: 'in_stock',
    warehouse: 'Lima / Callao',
    lead_time: 'Entrega Inmediata (Almacén Ate)',
    description: 'Acero galvanizado en caliente ANSI C80.3 • Alta protección mecánica y electromagnética para cableado estructurado e industrial',
    certifications: ['Certificación UL 797', 'ANSI C80.3', 'Galvanizado HDG'],
    supplier_name: 'FERREYROS INDUSTRIAL S.A.',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    compatible_kits: [
      { code: 'ASM-CAM-EXT', name: 'Tramo Canalización Industrial EMT 3m', detail: 'Tubería + 2 uniones + 3 abrazaderas + caja octogonal', price_pen: 68.00 },
    ],
  },
  {
    id: 6,
    sku: 'FLU-LIQ-KIT',
    category: 'herramientas',
    category_label: 'Herramientas & Consumibles',
    name: 'Kit Consumibles Fijación & Etiquetado Termocontraíble',
    brand: 'PANDUIT',
    unit: 'KIT',
    cost_pen: 118.00,
    cost_usd: 31.47,
    list_price_pen: 175.00,
    list_price_usd: 46.67,
    final_price_pen: 206.50,
    margin_pct: 32.6,
    stock: 32,
    stock_unit: 'kits',
    stock_status: 'in_stock',
    warehouse: 'Lima / Callao',
    lead_time: 'Entrega Inmediata (Almacén Lima)',
    description: 'Cintillos nylon UV 4.8x200mm + Tarugos Fischer SX8 + Cinta vulcanizante 3M 23 + Cartucho etiquetas termocontraíbles TIA-606-C',
    certifications: ['Norma TIA-606-C', 'Grado Industrial UV', 'RoHS Compliant'],
    supplier_name: 'DELTRON PERÚ S.A.',
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80',
    compatible_kits: [],
  },
];
const suppliers = [
  { id: 1, name: 'DELTRON PERÚ S.A.', ruc: '20212331377', contact_name: 'Ejecutivo Mayorista B2B', phone: '(01) 415-0101', email: 'ventas.corporativas@deltron.com.pe' },
  { id: 2, name: 'TECNOSEG S.A.C.', ruc: '20512345678', contact_name: 'Ana Ríos', phone: '998 221 334', email: 'arios@tecnoseg.pe' },
  { id: 3, name: 'INGRAM MICRO PERÚ', ruc: '20498765432', contact_name: 'Luis Vega', phone: '(01) 616-1200', email: 'peru.networking@ingrammicro.com' },
  { id: 4, name: 'ANIXTER PERÚ S.A.C.', ruc: '20384950617', contact_name: 'Claudia Morales', phone: '(01) 712-4400', email: 'cotizaciones.pe@wesco.com' },
];
const services = [
  { id: 1, code: 'MANT-SEM', name: 'Mantenimiento preventivo semestral', periodicity: 'semestral', unit_cost_pen: 120, reference_price_pen: 250 },
  { id: 2, code: 'MANT-ANU', name: 'Mantenimiento anual + limpieza', periodicity: 'anual', unit_cost_pen: 200, reference_price_pen: 420 },
];
const customers = [
  { id: 1, document_type: 'RUC', document_number: '20601234567', business_name: 'Inversiones Andina S.A.C.', contact_name: 'María Torres', phone: '999111222', email: 'compras@andina.pe', district: 'Surco' },
  { id: 2, document_type: 'DNI', document_number: '45678912', business_name: 'Luis Fernández Rojas', contact_name: 'Luis Fernández', phone: '988777666', email: 'lfernandez@mail.com', district: 'La Molina' },
  { id: 3, document_type: 'RUC', document_number: '20548912304', business_name: 'CORPORACIÓN LOGÍSTICA DEL PACÍFICO S.A.C.', contact_name: 'Ing. Roberto Valdivia (Jefe de Operaciones)', phone: '+51 998 452 110', email: 'rvaldivia@corplogistica.com.pe', district: 'Lurín' },
  { id: 4, document_type: 'RUC', document_number: '20556677881', business_name: 'Condominio Las Torres', contact_name: 'Junta de Propietarios', phone: '994 112 890', email: 'admin@condominiolastorres.pe', district: 'San Isidro' },
  { id: 5, document_type: 'RUC', document_number: '20112233445', business_name: 'Clínica San Rafael', contact_name: 'Dr. Ricardo Palma', phone: '(01) 225-8900', email: 'logistica@clinicasanrafael.pe', district: 'San Borja' },
];
const projects = [
  { id: 1, customer_id: 1, name: 'Sede Surco', property_type: 'oficina', floors: 2, installation_address: 'Av. Primavera 1200, Surco' },
  { id: 2, customer_id: 2, name: 'Casa 2 pisos La Molina', property_type: 'casa', floors: 2, installation_address: 'Calle Los Cedros 250, La Molina' },
  { id: 3, customer_id: 3, name: 'Implementación CCTV IP + Fibra Óptica Almacén Central Lurín', property_type: 'planta_industrial', floors: 3, installation_address: 'Av. Los Eucaliptos Mz. D Lt. 14 - Zona Industrial Lurín' },
];
const audit = [];
let quotes = [];
let seq = 0;
let approvals = [];

const byId = (arr, id) => arr.find((x) => x.id === Number(id));
const log = (user, action, entity, entity_id, extra) =>
  audit.unshift({ id: audit.length + 1, user: user?.full_name ?? 'sistema', action, entity_type: entity, entity_id, detail: extra ?? null, created_at: new Date().toISOString() });

function priceLines(inputLines, zones = []) {
  return (inputLines || []).map((l) => {
    const asm = l.assembly_id ? byId(assemblies, l.assembly_id) : null;
    const zone = zones.find((z) => String(z.id) === String(l.zone_id) || z.name === l.zone_name);
    const factor = zone ? Number(zone.difficulty_factor ?? 1) : Number(l.difficulty_multiplier ?? 1);
    if (asm) {
      const u = calculateAssemblyUnit({ components_cost_pen: asm.unit_cost_pen, fixed_supplies_cost_pen: 0, ...asm }, 1);
      return { ...u, code: asm.code, description: asm.name, unit: asm.unit, assembly_id: asm.id, quantity: Number(l.quantity || 1), zone_name: zone?.name ?? l.zone_name ?? '', difficulty_multiplier: factor,
        hours_cabling_unit: asm.hours_cabling, hours_mounting_unit: asm.hours_mounting, hours_config_unit: asm.hours_config, reference_labor_unit_pen: asm.reference_cost_per_point, unit_cost_pen: asm.unit_cost_pen };
    }
    const p = l.product_id ? byId(products, l.product_id) : null;
    return { code: p?.sku ?? l.code ?? 'ITEM', description: p?.name ?? l.description ?? 'Ítem', unit: p?.unit ?? 'UND', product_id: p?.id, quantity: Number(l.quantity || 1),
      unit_cost_pen: p?.cost_pen ?? Number(l.unit_cost_pen || 0), hours_cabling_unit: 0, hours_mounting_unit: 0, hours_config_unit: 0, reference_labor_unit_pen: 0, difficulty_multiplier: 1, zone_name: zone?.name ?? l.zone_name ?? '' };
  });
}

function compute(q) {
  const lines = priceLines(q.lines, q.zones);
  const calc = calculateQuote({
    lines, crew_technicians: q.crew_technicians ?? 1, crew_assistants: q.crew_assistants ?? 1,
    labor_method: q.labor_method ?? settings.labor_params.default_labor_method,
    overhead_pct: q.overhead_pct, target_margin_on_sale_pct: q.target_margin_on_sale_pct,
    discount_pct: q.discount_pct ?? 0, service_lines: q.service_lines ?? [],
    labor_params: settings.labor_params, crew_efficiencies: settings.crew_efficiency,
  });
  return calc;
}

const cal01 = [{ assembly_id: 1, quantity: 4 }, { assembly_id: 2, quantity: 2 }, { assembly_id: 3, quantity: 1 }, { assembly_id: 4, quantity: 1 }, { assembly_id: 5, quantity: 1 }];
seq = 91;
// Semilla completa multiproyecto y multimensual (Ene - Jun 2026) alineada a Pantallas 02 y 06
quotes.length = 0;
approvals.length = 0;

quotes.push(
  // ==================== JUNIO 2026 (jun2026) ====================
  {
    id: 1, code: 'PF-2026-0001', version: 1, status: 'aceptada', period: 'jun2026', customer_id: 1, project_id: 1, seller_id: 3, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 4797.70, direct_labor_pen: 480.00, overhead_amount_pen: 422.22,
    profit_margin_amount_pen: 1673.74, taxable_base_pen: 5926.11, tax_amount_pen: 1066.70, igv_amount_pen: 1066.70,
    total_with_tax_pen: 6992.81, effective_margin_on_sale_pct: 28.25,
    materials_cost_pen: 3126.00, labor_cost_applied_pen: 615.00, travel_cost_pen: 100.00, total_cost_pen: 4148.28, total_hours: 25.4,
    estimated_days: 2.5, crews_label: '1 Cuadrilla', category_icon: 'wifi',
    project_title: 'Red Mesh Wi-Fi 6 (Casa 2 pisos)', project_subtitle: '8 puntos UTP Cat6 + 3 Nodos',
    issue_date: '2026-06-04', valid_until: '2026-06-19', created_at: '2026-06-04', relative_date: 'Hoy', issue_sublabel: 'Hace 2 días', requires_approval: false,
    customer: { id: 1, business_name: 'Familia Quispe', subtitle: 'Residencial - Surco', document_type: 'DNI', document_number: '10293847' },
    seller_name: 'Carlos Mendoza', seller_initials: 'CM',
  },
  {
    id: 2, code: 'PF-2026-0002', version: 1, status: 'enviada', period: 'jun2026', customer_id: 4, project_id: 2, seller_id: 2, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 19500.00, direct_labor_pen: 1800.00, overhead_amount_pen: 1704.00,
    profit_margin_amount_pen: 6750.00, taxable_base_pen: 24110.17, tax_amount_pen: 4339.83, igv_amount_pen: 4339.83,
    total_with_tax_pen: 28450.00, effective_margin_on_sale_pct: 28.00,
    materials_cost_pen: 14200.00, labor_cost_applied_pen: 1800.00, travel_cost_pen: 350.00, total_cost_pen: 17359.32, total_hours: 52.0,
    estimated_days: 5.0, crews_label: '2 Cuadrillas', category_icon: 'videocam',
    project_title: 'CCTV IP 16 Cámaras Exteriores', project_subtitle: 'NVR 32ch + PoE + Poste',
    issue_date: '2026-06-03', valid_until: '2026-06-18', created_at: '2026-06-03', relative_date: 'Ayer', issue_sublabel: 'Vence en 12d', requires_approval: false,
    customer: { id: 4, business_name: 'Condominio Las Torres', subtitle: 'Junta Propietarios - San Isidro', document_type: 'RUC', document_number: '20556677881' },
    seller_name: 'Ana Paredes', seller_initials: 'AP',
  },
  {
    id: 3, code: 'PF-2026-0003', version: 1, status: 'borrador', period: 'jun2026', customer_id: 1, project_id: 1, seller_id: 4, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 9800.00, direct_labor_pen: 850.00, overhead_amount_pen: 852.00,
    profit_margin_amount_pen: 3370.00, taxable_base_pen: 12033.90, tax_amount_pen: 2166.10, igv_amount_pen: 2166.10,
    total_with_tax_pen: 14200.00, effective_margin_on_sale_pct: 28.00,
    materials_cost_pen: 6950.00, labor_cost_applied_pen: 850.00, travel_cost_pen: 210.00, total_cost_pen: 8664.41, total_hours: 31.0,
    estimated_days: 3.0, crews_label: '1 Cuadrilla', category_icon: 'edit_note',
    project_title: 'Control de Acceso Biométrico', project_subtitle: '4 Torniquetes + Lectores QR',
    issue_date: '2026-06-02', valid_until: '2026-06-17', created_at: '2026-06-02', relative_date: '02 Jun', issue_sublabel: 'Editado ayer', requires_approval: false,
    customer: { id: 3, business_name: 'Edificio Panorama', subtitle: 'Corporativo - Miraflores', document_type: 'RUC', document_number: '20443322119' },
    seller_name: 'Jorge Salas', seller_initials: 'JS',
  },
  {
    id: 4, code: 'PF-2026-0004', version: 1, status: 'en_aprobacion', period: 'jun2026', customer_id: 5, project_id: 2, seller_id: 2, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 29500.00, direct_labor_pen: 2600.00, overhead_amount_pen: 2568.00,
    profit_margin_amount_pen: 10100.00, taxable_base_pen: 36271.19, tax_amount_pen: 6528.81, igv_amount_pen: 6528.81,
    total_with_tax_pen: 42800.00, effective_margin_on_sale_pct: 22.10,
    materials_cost_pen: 21800.00, labor_cost_applied_pen: 2600.00, travel_cost_pen: 560.00, total_cost_pen: 28255.25, total_hours: 84.0,
    estimated_days: 8.0, crews_label: '2 Cuadrillas', category_icon: 'settings_ethernet',
    project_title: 'Cableado Estructurado Cat6A (48 pts)', project_subtitle: '2 Gabinetes 42RU + Certificación',
    issue_date: '2026-06-01', valid_until: '2026-06-16', created_at: '2026-06-01', relative_date: '01 Jun', issue_sublabel: 'Margen 22.1%', requires_approval: true,
    customer: { id: 5, business_name: 'Clínica San Rafael', subtitle: 'Salud - San Borja', document_type: 'RUC', document_number: '20112233445' },
    seller_name: 'Ana Paredes', seller_initials: 'AP',
  },
  {
    id: 5, code: 'PF-2026-0005', version: 1, status: 'rechazada', period: 'jun2026', customer_id: 1, project_id: 1, seller_id: 3, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 12600.00, direct_labor_pen: 1100.00, overhead_amount_pen: 1096.00,
    profit_margin_amount_pen: 4350.00, taxable_base_pen: 15542.37, tax_amount_pen: 2797.63, igv_amount_pen: 2797.63,
    total_with_tax_pen: 18340.00, effective_margin_on_sale_pct: 27.99,
    materials_cost_pen: 9100.00, labor_cost_applied_pen: 1100.00, travel_cost_pen: 280.00, total_cost_pen: 11192.00, total_hours: 38.0,
    estimated_days: 4.0, crews_label: '1 Cuadrilla', category_icon: 'fence',
    project_title: 'Cerco Eléctrico Perimetral 240m', project_subtitle: 'Energizador + 8 Zonas Alarma',
    issue_date: '2026-06-01', valid_until: '2026-06-15', created_at: '2026-06-01', relative_date: '01 Jun', issue_sublabel: 'Cerrado', requires_approval: false,
    customer: { id: 5, business_name: 'Almacenes del Sur', subtitle: 'Logística - Villa El Salvador', document_type: 'RUC', document_number: '20334455667' },
    seller_name: 'Carlos Mendoza', seller_initials: 'CM',
  },
  {
    id: 6, code: 'PF-2026-0006', version: 1, status: 'en_aprobacion', period: 'jun2026', customer_id: 1, project_id: 1, seller_id: 4, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 16100.00, direct_labor_pen: 1400.00, overhead_amount_pen: 1400.00,
    profit_margin_amount_pen: 3698.31, taxable_base_pen: 18983.05, tax_amount_pen: 3416.95, igv_amount_pen: 3416.95,
    total_with_tax_pen: 22400.00, effective_margin_on_sale_pct: 16.50,
    materials_cost_pen: 12900.00, labor_cost_applied_pen: 1400.00, travel_cost_pen: 380.00, total_cost_pen: 15850.85, total_hours: 56.0,
    estimated_days: 5.5, crews_label: '2 Cuadrillas', category_icon: 'badge',
    project_title: 'Videoportero IP Multifamiliar', project_subtitle: '42 Monitores 7" + Placa Calle',
    issue_date: '2026-06-04', valid_until: '2026-06-19', created_at: '2026-06-04', relative_date: 'Hoy', issue_sublabel: 'Margen 16.5%', requires_approval: true,
    customer: { id: 6, business_name: 'Edificio Mirador', subtitle: 'Inmobiliaria - Magdalena', document_type: 'RUC', document_number: '20778899001' },
    seller_name: 'Jorge Salas', seller_initials: 'JS',
  },
  {
    id: 7, code: 'PF-2026-0007', version: 1, status: 'en_aprobacion', period: 'jun2026', customer_id: 2, project_id: 2, seller_id: 2, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 12,
    subtotal_direct_pen: 22000.00, direct_labor_pen: 2100.00, overhead_amount_pen: 1928.00,
    profit_margin_amount_pen: 7500.00, taxable_base_pen: 26694.92, tax_amount_pen: 4805.08, igv_amount_pen: 4805.08,
    total_with_tax_pen: 31500.00, effective_margin_on_sale_pct: 22.00,
    materials_cost_pen: 16800.00, labor_cost_applied_pen: 2100.00, travel_cost_pen: 450.00, total_cost_pen: 20822.03, total_hours: 68.0,
    estimated_days: 6.5, crews_label: '2 Cuadrillas', category_icon: 'router',
    project_title: 'Cobertura Wi-Fi Campus + Fibra', project_subtitle: '18 APs Outdoor + Enlace OM4',
    issue_date: '2026-06-04', valid_until: '2026-06-19', created_at: '2026-06-04', relative_date: 'Hoy', issue_sublabel: 'Dcto. 12.0%', requires_approval: true,
    customer: { id: 7, business_name: 'Colegio Los Cedros', subtitle: 'Educación - La Molina', document_type: 'RUC', document_number: '20998877665' },
    seller_name: 'Ana Paredes', seller_initials: 'AP',
  },
  {
    id: 8, code: 'PF-2026-0008', version: 1, status: 'en_aprobacion', period: 'jun2026', customer_id: 1, project_id: 1, seller_id: 3, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 6500.00, direct_labor_pen: 1200.00, overhead_amount_pen: 616.00,
    profit_margin_amount_pen: 2400.00, taxable_base_pen: 8347.46, tax_amount_pen: 1502.54, igv_amount_pen: 1502.54,
    total_with_tax_pen: 9850.00, effective_margin_on_sale_pct: 24.36,
    materials_cost_pen: 4500.00, labor_cost_applied_pen: 1200.00, travel_cost_pen: 160.00, total_cost_pen: 6314.00, total_hours: 21.0,
    estimated_days: 2.0, crews_label: '1 Cuadrilla', category_icon: 'lan',
    project_title: 'Domótica e Intrusión Perimetral', project_subtitle: '12 Cámaras AcuSense + Cerco',
    issue_date: '2026-06-04', valid_until: '2026-06-19', created_at: '2026-06-04', relative_date: 'Hoy', issue_sublabel: 'Desv. M.O.', requires_approval: true,
    customer: { id: 8, business_name: 'Residencia La Molina', subtitle: 'Residencial - La Molina', document_type: 'DNI', document_number: '09876543' },
    seller_name: 'Carlos Mendoza', seller_initials: 'CM',
  },

  // ==================== MAYO 2026 (may2026) ====================
  {
    id: 9, code: 'PF-2026-0091', version: 1, status: 'aceptada', period: 'may2026', customer_id: 1, project_id: 1, seller_id: 3, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 24500.00, direct_labor_pen: 2200.00, overhead_amount_pen: 2136.00,
    profit_margin_amount_pen: 8400.00, taxable_base_pen: 29830.51, tax_amount_pen: 5369.49, igv_amount_pen: 5369.49,
    total_with_tax_pen: 35200.00, effective_margin_on_sale_pct: 28.15,
    materials_cost_pen: 17200.00, labor_cost_applied_pen: 2200.00, travel_cost_pen: 420.00, total_cost_pen: 21433.64, total_hours: 62.0,
    estimated_days: 6.0, crews_label: '2 Cuadrillas', category_icon: 'videocam',
    project_title: 'Modernización CCTV IP Tienda Higuereta', project_subtitle: '32 Domos 4K + Analítica Retail',
    issue_date: '2026-05-29', valid_until: '2026-06-13', created_at: '2026-05-29', relative_date: '29 May', issue_sublabel: 'Facturada', requires_approval: false,
    customer: { id: 9, business_name: 'Supermercados Peruanos S.A.', subtitle: 'Retail - Surco', document_type: 'RUC', document_number: '20100070970' },
    seller_name: 'Carlos Mendoza', seller_initials: 'CM',
  },
  {
    id: 10, code: 'PF-2026-0090', version: 1, status: 'aceptada', period: 'may2026', customer_id: 2, project_id: 2, seller_id: 2, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 2,
    subtotal_direct_pen: 13200.00, direct_labor_pen: 1200.00, overhead_amount_pen: 1152.00,
    profit_margin_amount_pen: 4500.00, taxable_base_pen: 16016.95, tax_amount_pen: 2883.05, igv_amount_pen: 2883.05,
    total_with_tax_pen: 18900.00, effective_margin_on_sale_pct: 28.09,
    materials_cost_pen: 9400.00, labor_cost_applied_pen: 1200.00, travel_cost_pen: 250.00, total_cost_pen: 11517.80, total_hours: 35.0,
    estimated_days: 3.5, crews_label: '1 Cuadrilla', category_icon: 'wifi',
    project_title: 'Red Wi-Fi 6 Roaming Pisos 3 al 7', project_subtitle: '14 Access Points UniFi Pro',
    issue_date: '2026-05-24', valid_until: '2026-06-08', created_at: '2026-05-24', relative_date: '24 May', issue_sublabel: 'En ejecución', requires_approval: false,
    customer: { id: 10, business_name: 'Hotel Costa del Sol Miraflores', subtitle: 'Hotelería - Miraflores', document_type: 'RUC', document_number: '20304050601' },
    seller_name: 'Ana Paredes', seller_initials: 'AP',
  },
  {
    id: 11, code: 'PF-2026-0089', version: 1, status: 'enviada', period: 'may2026', customer_id: 1, project_id: 1, seller_id: 4, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 31000.00, direct_labor_pen: 2800.00, overhead_amount_pen: 2704.00,
    profit_margin_amount_pen: 10600.00, taxable_base_pen: 37796.61, tax_amount_pen: 6803.39, igv_amount_pen: 6803.39,
    total_with_tax_pen: 44600.00, effective_margin_on_sale_pct: 28.04,
    materials_cost_pen: 22100.00, labor_cost_applied_pen: 2800.00, travel_cost_pen: 540.00, total_cost_pen: 27198.40, total_hours: 78.0,
    estimated_days: 7.5, crews_label: '2 Cuadrillas', category_icon: 'settings_ethernet',
    project_title: 'Backbone Fibra Óptica OM4 + Gabinetes', project_subtitle: '64 Puntos Cat6A Panduit',
    issue_date: '2026-05-19', valid_until: '2026-06-03', created_at: '2026-05-19', relative_date: '19 May', issue_sublabel: 'Por expirar', requires_approval: false,
    customer: { id: 11, business_name: 'Centro Empresarial San Isidro', subtitle: 'Corporativo - San Isidro', document_type: 'RUC', document_number: '20506070809' },
    seller_name: 'Jorge Salas', seller_initials: 'JS',
  },
  {
    id: 12, code: 'PF-2026-0088', version: 1, status: 'aceptada', period: 'may2026', customer_id: 2, project_id: 2, seller_id: 3, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 8900.00, direct_labor_pen: 800.00, overhead_amount_pen: 776.00,
    profit_margin_amount_pen: 3050.00, taxable_base_pen: 10805.08, tax_amount_pen: 1944.92, igv_amount_pen: 1944.92,
    total_with_tax_pen: 12750.00, effective_margin_on_sale_pct: 28.22,
    materials_cost_pen: 6200.00, labor_cost_applied_pen: 800.00, travel_cost_pen: 180.00, total_cost_pen: 7755.08, total_hours: 24.0,
    estimated_days: 2.5, crews_label: '1 Cuadrilla', category_icon: 'badge',
    project_title: 'Control de Acceso Esclusas Laboratorio', project_subtitle: '3 Lectores Faciales ZKTeco',
    issue_date: '2026-05-14', valid_until: '2026-05-29', created_at: '2026-05-14', relative_date: '14 May', issue_sublabel: 'Entregada', requires_approval: false,
    customer: { id: 12, business_name: 'Laboratorios ROE Surco', subtitle: 'Salud - Surco', document_type: 'RUC', document_number: '20141516178' },
    seller_name: 'Carlos Mendoza', seller_initials: 'CM',
  },
  {
    id: 13, code: 'PF-2026-0087', version: 1, status: 'en_aprobacion', period: 'may2026', customer_id: 1, project_id: 1, seller_id: 2, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 9,
    subtotal_direct_pen: 19200.00, direct_labor_pen: 1750.00, overhead_amount_pen: 1676.00,
    profit_margin_amount_pen: 5100.00, taxable_base_pen: 22966.10, tax_amount_pen: 4133.90, igv_amount_pen: 4133.90,
    total_with_tax_pen: 27100.00, effective_margin_on_sale_pct: 17.80,
    materials_cost_pen: 15400.00, labor_cost_applied_pen: 1750.00, travel_cost_pen: 360.00, total_cost_pen: 18878.14, total_hours: 48.0,
    estimated_days: 5.0, crews_label: '2 Cuadrillas', category_icon: 'router',
    project_title: 'Renovación Switches PoE+ Aulas Híbridas', project_subtitle: '8 Switches 24p + Cableado',
    issue_date: '2026-05-11', valid_until: '2026-05-26', created_at: '2026-05-11', relative_date: '11 May', issue_sublabel: 'Margen 17.8%', requires_approval: true,
    customer: { id: 13, business_name: 'Universidad Pacífico - Pabellón B', subtitle: 'Educación - Jesús María', document_type: 'RUC', document_number: '20109876543' },
    seller_name: 'Ana Paredes', seller_initials: 'AP',
  },
  {
    id: 14, code: 'PF-2026-0086', version: 1, status: 'en_aprobacion', period: 'may2026', customer_id: 2, project_id: 2, seller_id: 4, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 10,
    subtotal_direct_pen: 12800.00, direct_labor_pen: 1150.00, overhead_amount_pen: 1116.00,
    profit_margin_amount_pen: 3900.00, taxable_base_pen: 15635.59, tax_amount_pen: 2814.41, igv_amount_pen: 2814.41,
    total_with_tax_pen: 18450.00, effective_margin_on_sale_pct: 21.50,
    materials_cost_pen: 9800.00, labor_cost_applied_pen: 1150.00, travel_cost_pen: 280.00, total_cost_pen: 12273.94, total_hours: 36.0,
    estimated_days: 4.0, crews_label: '1 Cuadrilla', category_icon: 'videocam',
    project_title: 'Cámaras Térmicas & Perímetro Industrial', project_subtitle: '10 Cámaras IP67 + Canalización EMT',
    issue_date: '2026-05-06', valid_until: '2026-05-21', created_at: '2026-05-06', relative_date: '06 May', issue_sublabel: 'Dcto. 10.0%', requires_approval: true,
    customer: { id: 14, business_name: 'Planta Textil Ate Vitarte', subtitle: 'Industrial - Ate', document_type: 'RUC', document_number: '20609080701' },
    seller_name: 'Jorge Salas', seller_initials: 'JS',
  },

  // ==================== ABRIL 2026 (abr2026) ====================
  {
    id: 15, code: 'PF-2026-0065', version: 1, status: 'aceptada', period: 'abr2026', customer_id: 1, project_id: 1, seller_id: 3, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 16800.00, direct_labor_pen: 1500.00, overhead_amount_pen: 1464.00,
    profit_margin_amount_pen: 5800.00, taxable_base_pen: 20593.22, tax_amount_pen: 3706.78, igv_amount_pen: 3706.78,
    total_with_tax_pen: 24300.00, effective_margin_on_sale_pct: 28.16,
    materials_cost_pen: 11900.00, labor_cost_applied_pen: 1500.00, travel_cost_pen: 320.00, total_cost_pen: 14793.22, total_hours: 44.0,
    estimated_days: 4.5, crews_label: '1 Cuadrilla', category_icon: 'videocam',
    project_title: 'CCTV Showroom & Taller Automotriz', project_subtitle: '24 Cámaras Domo + NVR 4K',
    issue_date: '2026-04-28', valid_until: '2026-05-13', created_at: '2026-04-28', relative_date: '28 Abr', issue_sublabel: 'Liquidada', requires_approval: false,
    customer: { id: 15, business_name: 'Concesionario Automotriz Surquillo', subtitle: 'Comercial - Surquillo', document_type: 'RUC', document_number: '20554433221' },
    seller_name: 'Carlos Mendoza', seller_initials: 'CM',
  },
  {
    id: 16, code: 'PF-2026-0064', version: 1, status: 'enviada', period: 'abr2026', customer_id: 2, project_id: 2, seller_id: 2, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 21500.00, direct_labor_pen: 1950.00, overhead_amount_pen: 1876.00,
    profit_margin_amount_pen: 7300.00, taxable_base_pen: 26355.93, tax_amount_pen: 4744.07, igv_amount_pen: 4744.07,
    total_with_tax_pen: 31100.00, effective_margin_on_sale_pct: 27.70,
    materials_cost_pen: 15300.00, labor_cost_applied_pen: 1950.00, travel_cost_pen: 400.00, total_cost_pen: 19055.93, total_hours: 54.0,
    estimated_days: 5.5, crews_label: '2 Cuadrillas', category_icon: 'wifi',
    project_title: 'Cobertura Wi-Fi 6 Pabellón Secundaria', project_subtitle: '22 Access Points + PoE+',
    issue_date: '2026-04-22', valid_until: '2026-05-07', created_at: '2026-04-22', relative_date: '22 Abr', issue_sublabel: 'Vencida', requires_approval: false,
    customer: { id: 16, business_name: 'Colegio Markham Monterrico', subtitle: 'Educación - Surco', document_type: 'RUC', document_number: '20113355779' },
    seller_name: 'Ana Paredes', seller_initials: 'AP',
  },
  {
    id: 17, code: 'PF-2026-0063', version: 1, status: 'aceptada', period: 'abr2026', customer_id: 1, project_id: 1, seller_id: 4, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 11200.00, direct_labor_pen: 980.00, overhead_amount_pen: 974.40,
    profit_margin_amount_pen: 3850.00, taxable_base_pen: 13728.81, tax_amount_pen: 2471.19, igv_amount_pen: 2471.19,
    total_with_tax_pen: 16200.00, effective_margin_on_sale_pct: 28.04,
    materials_cost_pen: 7900.00, labor_cost_applied_pen: 980.00, travel_cost_pen: 240.00, total_cost_pen: 9878.81, total_hours: 29.0,
    estimated_days: 3.0, crews_label: '1 Cuadrilla', category_icon: 'badge',
    project_title: 'Biometría y Bóveda Documentaria', project_subtitle: '6 Puertas + Registro Asistencia',
    issue_date: '2026-04-17', valid_until: '2026-05-02', created_at: '2026-04-17', relative_date: '17 Abr', issue_sublabel: 'Liquidada', requires_approval: false,
    customer: { id: 17, business_name: 'Notaría Gálvez - San Borja', subtitle: 'Legal - San Borja', document_type: 'RUC', document_number: '20446688002' },
    seller_name: 'Jorge Salas', seller_initials: 'JS',
  },
  {
    id: 18, code: 'PF-2026-0062', version: 1, status: 'rechazada', period: 'abr2026', customer_id: 2, project_id: 2, seller_id: 3, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 0,
    subtotal_direct_pen: 7800.00, direct_labor_pen: 700.00, overhead_amount_pen: 680.00,
    profit_margin_amount_pen: 2650.00, taxable_base_pen: 9533.90, tax_amount_pen: 1716.10, igv_amount_pen: 1716.10,
    total_with_tax_pen: 11250.00, effective_margin_on_sale_pct: 27.80,
    materials_cost_pen: 5400.00, labor_cost_applied_pen: 700.00, travel_cost_pen: 160.00, total_cost_pen: 6883.90, total_hours: 20.0,
    estimated_days: 2.0, crews_label: '1 Cuadrilla', category_icon: 'videocam',
    project_title: 'Cámaras IP Cocina y Salón Principal', project_subtitle: '8 Domos Audio Bidireccional',
    issue_date: '2026-04-11', valid_until: '2026-04-26', created_at: '2026-04-11', relative_date: '11 Abr', issue_sublabel: 'Cerrado', requires_approval: false,
    customer: { id: 18, business_name: 'Restaurante La Mar Miraflores', subtitle: 'Gastronomía - Miraflores', document_type: 'RUC', document_number: '20224466880' },
    seller_name: 'Carlos Mendoza', seller_initials: 'CM',
  },
  {
    id: 19, code: 'PF-2026-0061', version: 1, status: 'en_aprobacion', period: 'abr2026', customer_id: 1, project_id: 1, seller_id: 3, currency: 'PEN',
    lines: cal01, zones: [], discount_pct: 8,
    subtotal_direct_pen: 26400.00, direct_labor_pen: 2400.00, overhead_amount_pen: 2304.00,
    profit_margin_amount_pen: 6200.00, taxable_base_pen: 31694.92, tax_amount_pen: 5705.08, igv_amount_pen: 5705.08,
    total_with_tax_pen: 37400.00, effective_margin_on_sale_pct: 17.20,
    materials_cost_pen: 21400.00, labor_cost_applied_pen: 2400.00, travel_cost_pen: 480.00, total_cost_pen: 26243.39, total_hours: 68.0,
    estimated_days: 6.5, crews_label: '2 Cuadrillas', category_icon: 'settings_ethernet',
    project_title: 'Anillo Fibra Óptica Patio Contenedores', project_subtitle: 'Tendido Subterráneo 480m + 4 Nodos',
    issue_date: '2026-04-05', valid_until: '2026-04-20', created_at: '2026-04-05', relative_date: '05 Abr', issue_sublabel: 'Licitación', requires_approval: true,
    customer: { id: 19, business_name: 'Terminal Logístico Callao S.A.C.', subtitle: 'Portuario - Callao', document_type: 'RUC', document_number: '20887766554' },
    seller_name: 'Carlos Mendoza', seller_initials: 'CM',
  }
);

approvals.push(
  // Junio 2026 (3 casos)
  {
    id: 1, quote_id: 6, period: 'jun2026', requested_by: 4,
    requested_reason: 'Motivo: Margen bajo el mínimo',
    detail_reason: 'Margen propuesto 16.5% vs meta corporativa mín. 20.0% (-3.5% delta).',
    action_label: 'Aprobar Margen',
    icon: 'warning',
    status: 'pendiente',
    created_at: '2026-06-04'
  },
  {
    id: 2, quote_id: 7, period: 'jun2026', requested_by: 2,
    requested_reason: 'Motivo: Descuento comercial excedido',
    detail_reason: 'Descuento de 12.0% solicitado por cliente corporativo (tope asesor: 5.0%).',
    action_label: 'Aprobar Descuento',
    icon: 'percent',
    status: 'pendiente',
    created_at: '2026-06-04'
  },
  {
    id: 3, quote_id: 8, period: 'jun2026', requested_by: 3,
    requested_reason: 'Motivo: Desviación M.O. > 15%',
    detail_reason: 'Discrepancia entre método por punto vs cuadrilla técnica por día (+18.2% costo cuadrilla).',
    action_label: 'Aprobar M.O.',
    icon: 'construction',
    status: 'pendiente',
    created_at: '2026-06-04'
  },
  // Mayo 2026 (2 casos)
  {
    id: 4, quote_id: 13, period: 'may2026', requested_by: 2,
    requested_reason: 'Motivo: Margen bajo el mínimo',
    detail_reason: 'Margen propuesto 17.8% en proyecto educativo vs mínimo requerido 20.0%.',
    action_label: 'Aprobar Margen',
    icon: 'warning',
    status: 'pendiente',
    created_at: '2026-05-11'
  },
  {
    id: 5, quote_id: 14, period: 'may2026', requested_by: 4,
    requested_reason: 'Motivo: Descuento comercial excedido',
    detail_reason: 'Descuento especial de 10.0% por renovación de planta industrial (tope: 5.0%).',
    action_label: 'Aprobar Descuento',
    icon: 'percent',
    status: 'pendiente',
    created_at: '2026-05-06'
  },
  // Abril 2026 (1 caso)
  {
    id: 6, quote_id: 19, period: 'abr2026', requested_by: 3,
    requested_reason: 'Motivo: Margen y Descuento Especial',
    detail_reason: 'Margen 17.2% con descuento corporativo de 8.0% en licitación portuaria Callao.',
    action_label: 'Aprobar Licitación',
    icon: 'gavel',
    status: 'pendiente',
    created_at: '2026-04-05'
  }
);

// ---------------- Servicio Público de Tipo de Cambio (Lima, Perú) ----------------
let liveExchangeRateCache = {
  fetched_at: 0,
  source: 'SUNAT / SBS Perú (e-api.net.pe)',
  location: 'Lima, Perú (America/Lima)',
  rate_date: TODAY(),
  usd_to_pen_buy: 3.720,
  usd_to_pen_sell: 3.750,
  sunat_official: 3.750,
};

async function fetchPeruLiveExchangeRate(force = false) {
  const now = Date.now();
  if (!force && liveExchangeRateCache.fetched_at && now - liveExchangeRateCache.fetched_at < 300000) {
    return liveExchangeRateCache;
  }
  try {
    // 1. Fuente primaria: API pública de Tipo de Cambio SUNAT Perú (free.e-api.net.pe)
    const res = await fetch('https://free.e-api.net.pe/tipo-cambio/today.json', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.venta || data.sunat)) {
        const buy = Number(data.compra || data.sunat || 3.72);
        const sell = Number(data.venta || data.sunat || 3.75);
        liveExchangeRateCache = {
          fetched_at: now,
          source: 'SUNAT Oficial Perú (free.e-api.net.pe)',
          location: 'Lima, Perú',
          rate_date: data.fecha || TODAY(),
          usd_to_pen_buy: Number(buy.toFixed(3)),
          usd_to_pen_sell: Number(sell.toFixed(3)),
          sunat_official: Number((data.sunat || sell).toFixed(3)),
        };
        settings.exchange_rate.usd_to_pen_buy = liveExchangeRateCache.usd_to_pen_buy;
        settings.exchange_rate.usd_to_pen_sell = liveExchangeRateCache.usd_to_pen_sell;
        settings.exchange_rate.rate_date = liveExchangeRateCache.rate_date;
        return liveExchangeRateCache;
      }
    }
  } catch {
    // Continúa al fallback público internacional
  }

  try {
    // 2. Fallback público: Open Exchange Rates API (USD -> PEN en vivo)
    const res2 = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
    });
    if (res2.ok) {
      const data2 = await res2.json();
      const pen = Number(data2?.rates?.PEN);
      if (pen > 0) {
        const buy = Number((pen - 0.008).toFixed(3));
        const sell = Number((pen + 0.008).toFixed(3));
        liveExchangeRateCache = {
          fetched_at: now,
          source: 'Mercado Cambiario Lima (open.er-api.com PEN)',
          location: 'Lima, Perú',
          rate_date: TODAY(),
          usd_to_pen_buy: buy,
          usd_to_pen_sell: sell,
          sunat_official: Number(pen.toFixed(3)),
        };
        settings.exchange_rate.usd_to_pen_buy = buy;
        settings.exchange_rate.usd_to_pen_sell = sell;
        settings.exchange_rate.rate_date = TODAY();
        return liveExchangeRateCache;
      }
    }
  } catch {
    // Conserva último valor en caché
  }
  return liveExchangeRateCache;
}

// Disparar sincronización inicial al levantar el servidor
fetchPeruLiveExchangeRate().catch(() => {});

// ---------------- Utilidades HTTP ----------------
const sessions = new Map();
const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
const err = (res, status, code, message) => send(res, status, { error: { code, message, details: {} } });
const readBody = (req) => new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => { try { r(d ? JSON.parse(d) : {}); } catch { r({}); } }); });
const cookieOf = (req, name) => (req.headers.cookie || '').split(';').map((s) => s.trim().split('=')).find(([k]) => k === name)?.[1];
const publicUser = (u) => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role, is_active: u.is_active, phone: u.phone || '999 888 777', zone: u.zone || 'Lima Metropolitana' });

import {
  enrichQuoteForDocument,
  getCompanyProfile,
  renderCorporateQuotePdfHtml,
  resetCompanyProfile,
  saveCompanyProfile,
} from './pdf-template.mjs';

function quoteView(q, role) {
  if (!q) return null;
  const customer = q.customer || byId(customers, q.customer_id);
  const project = q.project || byId(projects, q.project_id);
  const seller = byId(users, q.seller_id);
  const baseView = {
    ...q,
    customer,
    project,
    seller_name: q.seller_name || seller?.full_name || 'Ing. Carlos Mendoza',
  };
  const enriched = enrichQuoteForDocument(baseView, {
    exchangeRate: liveExchangeRateCache,
  });
  return sanitizePayload(enriched, role || 'vendedor');
}

// Configuración de métricas por periodo (Junio, Mayo, Abril, Segundo Trimestre Q2)
const PERIOD_DATASETS = {
  jun2026: {
    period_key: 'jun2026',
    period_label: 'Junio 2026 (Mes Actual)',
    context_date_label: 'Miércoles, 04 de Junio de 2026',
    quotes_count: 24,
    quotes_delta_pct: '+12%',
    quotes_compare_label: 'vs. 21 en mayo',
    total_quoted_pen: 186420.00,
    quoted_delta_pct: '+18.4%',
    total_accepted_pen: 70839.60,
    conversion_rate_pct: 38.0,
    conversion_target_pct: 35,
    average_margin_pct: 29.4,
    margin_gap_label: '+9.4% gap',
    margin_status_label: 'Óptimo',
    active_quotes: 14,
    monthly_goal_pen: 60000,
    seller_quoted_pen: 48250.00,
    seller_goal_pct: 80.4,
    selected_month_code: 'Jun',
  },
  may2026: {
    period_key: 'may2026',
    period_label: 'Mayo 2026 (Cierre Mensual)',
    context_date_label: 'Domingo, 31 de Mayo de 2026',
    quotes_count: 21,
    quotes_delta_pct: '+10.5%',
    quotes_compare_label: 'vs. 19 en abril',
    total_quoted_pen: 157000.00,
    quoted_delta_pct: '+20.8%',
    total_accepted_pen: 64370.00,
    conversion_rate_pct: 41.0,
    conversion_target_pct: 35,
    average_margin_pct: 27.8,
    margin_gap_label: '+7.8% gap',
    margin_status_label: 'Saludable',
    active_quotes: 9,
    monthly_goal_pen: 60000,
    seller_quoted_pen: 54100.00,
    seller_goal_pct: 90.2,
    selected_month_code: 'May',
  },
  abr2026: {
    period_key: 'abr2026',
    period_label: 'Abril 2026 (Cierre Mensual)',
    context_date_label: 'Jueves, 30 de Abril de 2026',
    quotes_count: 19,
    quotes_delta_pct: '-9.5%',
    quotes_compare_label: 'vs. 21 en marzo',
    total_quoted_pen: 130000.00,
    quoted_delta_pct: '-12.2%',
    total_accepted_pen: 44460.00,
    conversion_rate_pct: 34.2,
    conversion_target_pct: 35,
    average_margin_pct: 26.1,
    margin_gap_label: '+6.1% gap',
    margin_status_label: 'En Meta',
    active_quotes: 6,
    monthly_goal_pen: 60000,
    seller_quoted_pen: 39800.00,
    seller_goal_pct: 66.3,
    selected_month_code: 'Abr',
  },
  'q2-2026': {
    period_key: 'q2-2026',
    period_label: 'Segundo Trimestre 2026 (Abr - Jun)',
    context_date_label: 'Consolidado Q2 · Abr - Jun 2026',
    quotes_count: 64,
    quotes_delta_pct: '+20.7%',
    quotes_compare_label: 'vs. 53 en Q1 2026',
    total_quoted_pen: 473420.00,
    quoted_delta_pct: '+33.4%',
    total_accepted_pen: 179669.60,
    conversion_rate_pct: 37.9,
    conversion_target_pct: 35,
    average_margin_pct: 28.1,
    margin_gap_label: '+8.1% gap',
    margin_status_label: 'Sobresaliente',
    active_quotes: 29,
    monthly_goal_pen: 180000,
    seller_quoted_pen: 142150.00,
    seller_goal_pct: 79.0,
    selected_month_code: 'Q2',
  },
};

function dashboard(user, periodKey = 'jun2026') {
  const ds = PERIOD_DATASETS[periodKey] || PERIOD_DATASETS.jun2026;

  // Filtrar proformas según el periodo seleccionado
  let periodQuotes =
    periodKey === 'q2-2026'
      ? quotes.filter((q) => ['jun2026', 'may2026', 'abr2026'].includes(q.period))
      : quotes.filter((q) => (q.period || 'jun2026') === periodKey);

  if (user.role === 'vendedor') {
    const sellerFiltered = periodQuotes.filter((q) => q.seller_id === user.id);
    if (sellerFiltered.length > 0) periodQuotes = sellerFiltered;
  }

  const baseEvolution = [
    { month: 'Ene', quoted: 92000, accepted: 38000, count: 14 },
    { month: 'Feb', quoted: 115000, accepted: 46000, count: 18 },
    { month: 'Mar', quoted: 148000, accepted: 61000, count: 21 },
    { month: 'Abr', quoted: 130000, accepted: 44460, count: 19 },
    { month: 'May', quoted: 157000, accepted: 64370, count: 21 },
    { month: 'Jun', quoted: 186420, accepted: 70840, count: 24 },
  ].map((item) => ({
    ...item,
    isPeak: item.month === 'Jun',
    isSelected:
      ds.selected_month_code === 'Q2'
        ? ['Abr', 'May', 'Jun'].includes(item.month)
        : item.month === ds.selected_month_code,
  }));

  const out = {
    ...ds,
    exchange_rate: liveExchangeRateCache,
    recent_quotes: periodQuotes.slice(0, 6).map((q) => quoteView(q, user.role)),
    evolution: baseEvolution,
    semestral_summary: {
      total_pen: 828420.00,
      total_quotes: 117,
      q2_pen: 473420.00,
      q2_quotes: 64,
    },
  };

  if (canSeeCosts(user.role)) {
    const periodApprovals = approvals.filter((a) => {
      if (a.status !== 'pendiente') return false;
      if (periodKey === 'q2-2026') return true;
      return (a.period || 'jun2026') === periodKey;
    });
    out.pending_approvals = periodApprovals.map((a) => {
      const q = byId(quotes, a.quote_id);
      return { ...a, quote: quoteView(q, user.role) };
    });
  }
  return out;
}

import { setupExtensions } from './dev-extensions.mjs';

const extensionsRouter = setupExtensions({
  users,
  products,
  suppliers,
  assemblies,
  quotes,
  customers,
  projects,
  settings,
  log,
  compute,
  quoteView,
});

// ---------------- Router ----------------
async function handle(req, res) {
  const origin = req.headers.origin || 'http://localhost:5173';
  const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-CSRF-Token' };
  const origWrite = res.writeHead.bind(res);
  res.writeHead = (s, h = {}) => origWrite(s, { ...cors, ...h });
  if (req.method === 'OPTIONS') return send(res, 204);

  const url = new URL(req.url, 'http://x');
  const path = url.pathname.replace(/^\/api\/v1/, '');
  const m = req.method;
  const body = ['POST', 'PUT', 'PATCH'].includes(m) ? await readBody(req) : {};
  const sid = cookieOf(req, 'PROFORMA_SESSID');
  const user = sid ? sessions.get(sid) : null;
  const need = (...roles) => {
    if (!user) { err(res, 401, 'UNAUTHENTICATED', 'Sesión no iniciada.'); return false; }
    if (roles.length && !roles.includes(user.role)) { err(res, 403, 'FORBIDDEN', 'No tiene permiso para esta acción.'); return false; }
    return true;
  };

  // Delegar primero en extensiones
  const handled = await extensionsRouter.handle({ path, m, body, user, need, send, err, url, res });
  if (handled) return;

  if (path === '/health') return send(res, 200, { data: { status: 'ok', service: 'proformas-dev-server' } });

  // ---- Auth
  if (path === '/auth/login' && m === 'POST') {
    const key = String(body.email || '').toLowerCase();
    const u = users.find((x) => x.email === key);
    const a = (attempts[key] ||= { n: 0, until: 0 });
    if (a.until > Date.now()) return err(res, 423, 'ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente por intentos fallidos.');
    if (!u || !u.is_active || u.password !== body.password) {
      if (++a.n >= 5) { a.until = Date.now() + 15 * 60000; a.n = 0; }
      return err(res, 401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
    }
    a.n = 0;
    const token = crypto.randomUUID();
    sessions.set(token, u);
    log(u, 'login', 'user', u.id);
    return send(res, 200, { data: publicUser(u) }, { 'Set-Cookie': `PROFORMA_SESSID=${token}; Path=/; HttpOnly; SameSite=Lax` });
  }
  if (path === '/auth/logout' && m === 'POST') { sessions.delete(sid); return send(res, 200, { data: { ok: true } }, { 'Set-Cookie': 'PROFORMA_SESSID=; Path=/; Max-Age=0' }); }
  if (path === '/auth/me' && m === 'GET') return need() && send(res, 200, { data: publicUser(user) });
  if (path === '/auth/profile' && m === 'PUT') {
    if (!need()) return;
    if (body.full_name) user.full_name = String(body.full_name).trim();
    if (body.email) user.email = String(body.email).trim().toLowerCase();
    if (body.phone !== undefined) user.phone = String(body.phone).trim();
    if (body.zone !== undefined) user.zone = String(body.zone).trim();
    log(user, 'update_profile', 'user', user.id);
    return send(res, 200, { data: publicUser(user) });
  }
  if (path === '/auth/switch-role' && m === 'POST') {
    if (!need()) return;
    const targetRole = String(body.role || '').toLowerCase();
    const targetUser = users.find((x) => x.role === targetRole && x.is_active);
    if (!targetUser) return err(res, 404, 'USER_NOT_FOUND', 'Rol no encontrado.');
    sessions.set(sid, targetUser);
    log(targetUser, 'switch_role', 'user', targetUser.id);
    return send(res, 200, { data: publicUser(targetUser) });
  }

  // ---- Servicio público de Tipo de Cambio en vivo para Lima, Perú
  if (path === '/exchange-rate/live' && (m === 'GET' || m === 'POST')) {
    const force = m === 'POST' || url.searchParams.get('refresh') === '1';
    const rate = await fetchPeruLiveExchangeRate(force);
    return send(res, 200, { data: rate });
  }

  // ---- Dashboard (soporta ?period=jun2026 | may2026 | abr2026 | q2-2026)
  if (path === '/dashboard' && m === 'GET') {
    if (!need()) return;
    const period = url.searchParams.get('period') || 'jun2026';
    await fetchPeruLiveExchangeRate(false);
    return send(res, 200, { data: dashboard(user, period) });
  }

  // ---- Settings / referencias / Identidad Corporativa
  if (path === '/company-profile' && m === 'GET') {
    return send(res, 200, { data: getCompanyProfile() });
  }
  if (path === '/settings' && m === 'GET') {
    return (
      need() &&
      send(res, 200, {
        data: {
          ...settings,
          exchange_rate: { ...settings.exchange_rate, ...liveExchangeRateCache },
          difficulty_factors: difficulty,
          company_profile: getCompanyProfile(),
        },
      })
    );
  }
  if (path === '/settings/company-profile' && m === 'PUT') {
    if (!need('gerencia', 'admin')) return;
    const updated = saveCompanyProfile(body);
    log(user, 'update', 'company_profile', 1);
    return send(res, 200, { data: updated });
  }
  if (path === '/settings/company-profile/reset' && m === 'POST') {
    if (!need('gerencia', 'admin')) return;
    const restored = resetCompanyProfile();
    log(user, 'reset', 'company_profile', 1);
    return send(res, 200, { data: restored });
  }
  if (path === '/settings/labor-params' && m === 'PUT') { if (!need('gerencia', 'admin')) return; Object.assign(settings.labor_params, body); log(user, 'update', 'labor_params', 1); return send(res, 200, { data: settings.labor_params }); }
  if (path === '/settings/exchange-rate' && m === 'PUT') {
    if (!need('gerencia', 'admin')) return;
    settings.exchange_rate = { ...settings.exchange_rate, ...body, rate_date: TODAY() };
    liveExchangeRateCache = {
      ...liveExchangeRateCache,
      usd_to_pen_buy: Number(settings.exchange_rate.usd_to_pen_buy || liveExchangeRateCache.usd_to_pen_buy),
      usd_to_pen_sell: Number(settings.exchange_rate.usd_to_pen_sell || liveExchangeRateCache.usd_to_pen_sell),
      sunat_official: Number(settings.exchange_rate.usd_to_pen_sell || liveExchangeRateCache.sunat_official),
      rate_date: settings.exchange_rate.rate_date,
    };
    log(user, 'update', 'exchange_rate', 1);
    return send(res, 200, { data: settings.exchange_rate });
  }

  // ---- Clientes y proyectos
  if (path === '/customers' && m === 'GET') {
    if (!need('vendedor', 'gerencia', 'admin')) return;
    const q = (url.searchParams.get('q') || '').toLowerCase();
    return send(res, 200, { data: customers.filter((c) => !q || c.business_name.toLowerCase().includes(q) || c.document_number.includes(q)) });
  }
  if (path === '/customers' && m === 'POST') {
    if (!need('vendedor', 'gerencia', 'admin')) return;
    if (customers.some((c) => c.document_number === body.document_number)) return err(res, 409, 'DUPLICATE_CUSTOMER', 'Ya existe un cliente con ese documento.');
    const c = { id: customers.length + 1, ...body }; customers.push(c); log(user, 'create', 'customer', c.id); return send(res, 201, { data: c });
  }
  if (path === '/customers/lookup' && m === 'GET') {
    if (!need()) return;
    const doc = (url.searchParams.get('document') || '').trim();
    const known = {
      '20548912304': {
        document_number: '20548912304',
        business_name: 'CORPORACIÓN LOGÍSTICA DEL PACÍFICO S.A.C.',
        fiscal_address: 'Av. Los Eucaliptos Mz. D Lt. 14 - Zona Industrial Lurín, Lima',
        sunat_status: 'HABIDO / ACTIVO',
      },
      '20100070970': {
        document_number: '20100070970',
        business_name: 'SUPERMERCADOS PERUANOS SOCIEDAD ANÓNIMA',
        fiscal_address: 'Calle Morelli Nro. 181 Int. P-2, San Borja, Lima',
        sunat_status: 'HABIDO / ACTIVO',
      },
      '20556677881': {
        document_number: '20556677881',
        business_name: 'JUNTA DE PROPIETARIOS CONDOMINIO LAS TORRES',
        fiscal_address: 'Av. Javier Prado Oeste 1450, San Isidro, Lima',
        sunat_status: 'HABIDO / ACTIVO',
      },
    };
    if (known[doc]) return send(res, 200, { data: known[doc] });
    return send(res, 200, {
      data: {
        document_number: doc,
        business_name: doc.length === 11 ? `CORPORACIÓN INDUSTRIAL ${doc.slice(-4)} S.A.C.` : `Ciudadano DNI ${doc}`,
        fiscal_address: 'Lima Metropolitana, Perú',
        sunat_status: 'HABIDO / ACTIVO',
      },
    });
  }
  if (path === '/projects' && m === 'POST') { if (!need('vendedor', 'gerencia', 'admin')) return; const p = { id: projects.length + 1, ...body }; projects.push(p); return send(res, 201, { data: p }); }

  // ---- Catálogo
  if (path === '/assemblies' && m === 'GET') {
    if (!need()) return;
    return send(res, 200, { data: sanitizePayload(assemblies, user.role) });
  }
  if (path === '/products' && m === 'GET') { if (!need()) return; return send(res, 200, { data: sanitizePayload(products.map(({ cost_pen, ...p }) => ({ ...p, unit_cost_pen: cost_pen })), user.role) }); }
  if (path === '/suppliers' && m === 'GET') return need('gerencia', 'admin') && send(res, 200, { data: suppliers });
  if (path === '/services' && m === 'GET') return need() && send(res, 200, { data: sanitizePayload(services, user.role) });
  if (path === '/products' && m === 'POST') { if (!need('admin')) return; const { unit_cost_pen, ...r } = body; const p = { id: products.length + 1, ...r, cost_pen: Number(unit_cost_pen || 0) }; products.push(p); log(user, 'create', 'product', p.id); return send(res, 201, { data: p }); }
  if (path === '/suppliers' && m === 'POST') { if (!need('admin')) return; const s = { id: suppliers.length + 1, ...body }; suppliers.push(s); log(user, 'create', 'supplier', s.id); return send(res, 201, { data: s }); }

  // ---- Cálculo en vivo
  if (path === '/quotes/preview-calculation' && m === 'POST') {
    if (!need('vendedor', 'gerencia', 'admin')) return;
    try { return send(res, 200, { data: sanitizePayload(compute(body), user.role) }); }
    catch (e) { return err(res, 422, e.code || 'VALIDATION_ERROR', e.message); }
  }

  // ---- Proformas
  if (path === '/quotes' && m === 'GET') {
    if (!need()) return;
    let list = user.role === 'vendedor' ? quotes.filter((q) => q.seller_id === user.id) : quotes.slice();
    const st = url.searchParams.get('status');
    const s = (url.searchParams.get('q') || '').toLowerCase().trim();
    const period = url.searchParams.get('period');
    const seller = url.searchParams.get('seller');
    const customerFilter = url.searchParams.get('customer');

    if (st) list = list.filter((q) => q.status === st);
    if (period && period !== 'all') {
      if (period === 'q2-2026') {
        list = list.filter((q) => ['jun2026', 'may2026', 'abr2026'].includes(q.period || 'jun2026'));
      } else {
        list = list.filter((q) => (q.period || 'jun2026') === period);
      }
    }
    if (seller && seller !== 'all') {
      list = list.filter((q) => (q.seller_name || '').toLowerCase() === seller.toLowerCase());
    }
    if (customerFilter && customerFilter !== 'all') {
      list = list.filter((q) => {
        const cName = q.customer?.business_name || byId(customers, q.customer_id)?.business_name || '';
        return cName.toLowerCase() === customerFilter.toLowerCase();
      });
    }
    if (s) {
      list = list.filter((q) => {
        const cName = q.customer?.business_name || byId(customers, q.customer_id)?.business_name || '';
        const cDoc = q.customer?.document_number || byId(customers, q.customer_id)?.document_number || '';
        const pTitle = q.project_title || byId(projects, q.project_id)?.name || '';
        return (
          q.code.toLowerCase().includes(s) ||
          cName.toLowerCase().includes(s) ||
          cDoc.toLowerCase().includes(s) ||
          pTitle.toLowerCase().includes(s)
        );
      });
    }
    return send(res, 200, { data: list.map((q) => quoteView(q, user.role)) });
  }
  if (path === '/quotes' && m === 'POST') {
    if (!need('vendedor', 'gerencia', 'admin')) return;
    const calc = compute(body);
    const cust = byId(customers, body.customer_id);
    const proj = byId(projects, body.project_id) || body.project;
    const q = {
      id: quotes.reduce((mx, x) => Math.max(mx, x.id), 0) + 1,
      code: `PF-${new Date().getFullYear()}-${String(++seq).padStart(4, '0')}`,
      version: 1,
      status: 'borrador',
      period: 'jun2026',
      seller_id: user.id,
      seller_name: user.full_name,
      currency: 'PEN',
      project_title: proj?.name || body.project_title || 'Proyecto Técnico Especializado',
      project_subtitle: `${(body.lines || []).length} partidas configuradas`,
      category_icon: 'router',
      crews_label: `${Math.max(1, Number(body.crew_technicians || 1))} Cuadrilla`,
      ...body,
      ...calc,
      customer: cust || { id: body.customer_id, business_name: 'Cliente Corporativo' },
      issue_date: TODAY(),
      created_at: TODAY(),
      relative_date: 'Hoy',
      issue_sublabel: 'Recién creado',
    };
    quotes.unshift(q);
    log(user, 'create', 'quote', q.id);
    return send(res, 201, { data: quoteView(q, user.role) });
  }
  const mq = path.match(/^\/quotes\/(\d+)(?:\/([a-z-]+))?$/);
  if (mq) {
    const q = byId(quotes, mq[1]); const act = mq[2];
    if (!q) return err(res, 404, 'NOT_FOUND', 'Proforma no encontrada.');
    if (act === 'pdf' && m === 'GET') {
      const v = quoteView(q, user?.role || 'vendedor');
      const html = renderCorporateQuotePdfHtml(v, {
        exchangeRate: liveExchangeRateCache,
        autoPrint: url.searchParams.get('print') === '1',
      });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    if (!need()) return;
    if (user.role === 'vendedor' && q.seller_id !== user.id) return err(res, 403, 'FORBIDDEN', 'No es su proforma.');
    if (!act && m === 'GET') return send(res, 200, { data: quoteView(q, user.role) });
    if (user.role === 'tecnico') return err(res, 403, 'FORBIDDEN', 'No tiene permiso.');
    if (!act && m === 'PUT') {
      if (q.status !== 'borrador') return err(res, 409, 'QUOTE_IMMUTABLE', 'La proforma ya no es editable. Cree una nueva versión.');
      Object.assign(q, body, compute({ ...q, ...body })); log(user, 'update', 'quote', q.id); return send(res, 200, { data: quoteView(q, user.role) });
    }
    if (act === 'request-approval' && m === 'POST') {
      if (!q.requires_approval) return err(res, 422, 'INVALID_STATE', 'La proforma no requiere aprobación.');
      q.status = 'en_aprobacion'; approvals.push({ id: approvals.length + 1, quote_id: q.id, period: q.period || 'jun2026', requested_by: user.id, requested_reason: q.alerts?.[0]?.code ?? 'Motivo: Revisión Comercial', detail_reason: q.alerts?.[0]?.message ?? 'Solicitud de aprobación enviada por el asesor.', action_label: 'Aprobar Proforma', icon: 'verified', status: 'pendiente', created_at: TODAY() });
      log(user, 'request_approval', 'quote', q.id); return send(res, 200, { data: quoteView(q, user.role) });
    }
    if (act === 'approve' || act === 'reject') {
      if (!['gerencia', 'admin'].includes(user.role)) return err(res, 403, 'FORBIDDEN', 'Solo Gerencia puede decidir.');
      const ap = approvals.find((a) => a.quote_id === q.id && a.status === 'pendiente');
      if (ap) { ap.status = act === 'approve' ? 'aprobada' : 'rechazada'; ap.decision_comment = body.comment; }
      q.status = act === 'approve' ? 'emitida' : 'rechazada'; q.approved = act === 'approve'; log(user, act, 'quote', q.id, body.comment);
      return send(res, 200, { data: quoteView(q, user.role) });
    }
    if (act === 'issue' && m === 'POST') {
      if (!['borrador', 'en_aprobacion'].includes(q.status)) return err(res, 409, 'INVALID_STATE_TRANSITION', 'Solo se emite desde borrador.');
      if (q.requires_approval && !q.approved && !['gerencia', 'admin'].includes(user.role)) return err(res, 403, 'APPROVAL_REQUIRED', 'La proforma requiere aprobación de Gerencia.');
      q.status = 'emitida'; q.issue_date = TODAY(); q.valid_until = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10); log(user, 'issue', 'quote', q.id);
      return send(res, 200, { data: quoteView(q, user.role) });
    }
    if (act === 'mark-sent' && m === 'POST') { if (q.status !== 'emitida') return err(res, 409, 'INVALID_STATE_TRANSITION', 'Solo una proforma emitida puede enviarse.'); q.status = 'enviada'; log(user, 'send', 'quote', q.id); return send(res, 200, { data: quoteView(q, user.role) }); }
    if (act === 'customer-response' && m === 'POST') { if (q.status !== 'enviada') return err(res, 409, 'INVALID_STATE_TRANSITION', 'Solo una proforma enviada admite respuesta.'); q.status = body.accepted ? 'aceptada' : 'rechazada'; log(user, 'customer_response', 'quote', q.id); return send(res, 200, { data: quoteView(q, user.role) }); }
    if ((act === 'new-version' || act === 'duplicate') && m === 'POST') {
      const nextQuoteId = quotes.reduce((mx, x) => Math.max(mx, x.id), 0) + 1;
      const copy = { ...q, id: nextQuoteId, status: 'borrador', period: 'jun2026', approved: false, created_at: TODAY(), issue_date: TODAY(), relative_date: 'Hoy', issue_sublabel: 'Clonada hoy' };
      if (act === 'new-version') { copy.version = q.version + 1; copy.parent_quote_id = q.id; } else { copy.code = `PF-${new Date().getFullYear()}-${String(++seq).padStart(4, '0')}`; copy.version = 1; }
      quotes.unshift(copy); log(user, act, 'quote', copy.id); return send(res, 201, { data: quoteView(copy, user.role) });
    }
    if (act === 'excel' && m === 'GET') {
      if (!canSeeCosts(user.role)) return err(res, 403, 'FORBIDDEN', 'Solo Gerencia/Admin pueden exportar la hoja de costeo.');
      const csv = `Concepto,Monto\nMateriales,${q.materials_cost_pen}\nMano de obra,${q.labor_cost_applied_pen}\nViáticos,${q.travel_cost_pen}\nCosto total,${q.total_cost_pen}\nBase imponible,${q.taxable_base_pen}\nTotal con IGV,${q.total_with_tax_pen}\nMargen %,${q.effective_margin_on_sale_pct}\n`;
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${q.code}.csv"` }); return res.end('\uFEFF' + csv);
    }
  }

  // ---- Reportes, usuarios y auditoría
  if (path === '/reports/financial' && m === 'GET') {
    if (!need('gerencia', 'admin')) return;
    const acc = quotes.filter((q) => q.status === 'aceptada');
    const tot = (f) => Math.round(acc.reduce((s, q) => s + q[f], 0) * 100) / 100;
    return send(res, 200, { data: { revenue_pen: tot('taxable_base_pen'), cost_pen: tot('total_cost_pen'), tax_pen: tot('tax_amount_pen'), margin_pen: Math.round((tot('taxable_base_pen') - tot('total_cost_pen')) * 100) / 100,
      by_month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map((mo, i) => ({ month: mo, revenue: 12000 + i * 4500, cost: 8400 + i * 3200 })), quotes: acc.map((q) => quoteView(q, user.role)) } });
  }
  if (path === '/users' && m === 'GET') return need('admin') && send(res, 200, { data: users.map(publicUser) });
  if (path === '/users' && m === 'POST') { if (!need('admin')) return; const u = { id: users.length + 1, is_active: 1, password: 'Cambiar123!', ...body }; users.push(u); log(user, 'create', 'user', u.id); return send(res, 201, { data: publicUser(u) }); }
  const mu = path.match(/^\/users\/(\d+)$/);
  if (mu && m === 'PATCH') { if (!need('admin')) return; const u = byId(users, mu[1]); if (!u) return err(res, 404, 'NOT_FOUND', 'Usuario no encontrado.'); Object.assign(u, body); log(user, 'update', 'user', u.id); return send(res, 200, { data: publicUser(u) }); }
  if (path === '/audit-log' && m === 'GET') return need('admin') && send(res, 200, { data: audit.slice(0, 200) });

  return err(res, 404, 'NOT_FOUND', `Ruta no encontrada: ${path}`);
}

http.createServer((req, res) => handle(req, res).catch((e) => err(res, 500, 'INTERNAL_ERROR', e.message))).listen(PORT, () =>
  console.log(`API de desarrollo en http://localhost:${PORT}/api/v1  (usuarios: admin|gerencia|vendedor|tecnico @empresa.pe / Secret123!)`));
