/**
 * Extensiones del servidor de desarrollo:
 * 1. Recuperación y cambio de contraseñas (/auth/password/*)
 * 2. Catálogo completo: CRUD productos, proveedores, ofertas y ensamblajes con clonación
 * 3. Importación Excel/CSV (/catalog/import)
 * 4. Visitas técnicas (/site-visits/*) y conversión a proforma
 * 5. Órdenes de trabajo (/work-orders/*) y comparativa cotizado vs real
 * 6. Reportes financieros dinámicos y KPIs SUNAT / SPOT Banco de la Nación
 */
import crypto from 'node:crypto';
import {
  makeRouter,
  nextId,
  byId,
  today,
  r2,
  E,
  requireFields,
  parseCsv,
  monthlyEvolution,
} from './dev-ext-util.mjs';
import {
  resolveProductCostPen,
  calculateAssemblyUnit,
} from './engine.mjs';

export function setupExtensions(state) {
  const router = makeRouter();
  const {
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
  } = state;

  // Colecciones adicionales en memoria
  const offers = (state.offers ||= [
    {
      id: 1,
      product_id: 1,
      supplier_id: 1,
      supplier_sku: 'DEL-DS2CD2183G2',
      currency: 'USD',
      unit_cost: 84.80,
      valid_until: '2026-12-31',
      is_preferred: 1,
      is_active: 1,
    },
    {
      id: 2,
      product_id: 1,
      supplier_id: 2,
      supplier_sku: 'TSEG-2183G2-4K',
      currency: 'USD',
      unit_cost: 88.50,
      valid_until: '2026-12-31',
      is_preferred: 0,
      is_active: 1,
    },
    {
      id: 3,
      product_id: 2,
      supplier_id: 3,
      supplier_sku: 'ING-USW-24-POE',
      currency: 'USD',
      unit_cost: 341.33,
      valid_until: '2026-12-31',
      is_preferred: 1,
      is_active: 1,
    },
    {
      id: 4,
      product_id: 3,
      supplier_id: 4,
      supplier_sku: 'ANX-PUC6ASD04BU',
      currency: 'USD',
      unit_cost: 180.00,
      valid_until: '2026-12-31',
      is_preferred: 1,
      is_active: 1,
    },
    {
      id: 5,
      product_id: 4,
      supplier_id: 2,
      supplier_sku: 'TSEG-SPEEDFACE-V5L',
      currency: 'USD',
      unit_cost: 250.67,
      valid_until: '2026-12-31',
      is_preferred: 1,
      is_active: 1,
    },
  ]);

  const passwordResets = (state.passwordResets ||= []);
  const siteVisits = (state.siteVisits ||= [
    {
      id: 1,
      project_id: 2,
      technician_id: 4,
      visit_date: `${today()}T09:00:00Z`,
      status: 'completada',
      general_observations: 'Casa residencial de 2 pisos, ductería EMT existente en primer piso.',
      risks_detected: 'Muro exterior frontal requiere broca copa para concreto armado.',
      items: [
        {
          id: 1,
          zone_name: 'Exterior Frontal',
          assembly_id: 1,
          quantity: 4,
          estimated_cable_meters: 160,
          notes: 'Cámaras bullet a 3.2m de altura',
        },
        {
          id: 2,
          zone_name: 'Sala y Jardín',
          assembly_id: 2,
          quantity: 2,
          estimated_cable_meters: 60,
          notes: 'Puntos Wi-Fi en cielo raso',
        },
      ],
      photos: [
        {
          id: 1,
          zone_name: 'Exterior Frontal',
          caption: 'Ubicación cámara 1 sobre ingreso principal',
          url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80',
        },
      ],
      created_at: today(),
    },
  ]);

  const workOrders = (state.workOrders ||= [
    {
      id: 1,
      quote_id: 1,
      code: 'OT-2026-0001',
      lead_technician_id: 4,
      status: 'finalizada',
      scheduled_start_date: '2026-06-18',
      scheduled_end_date: '2026-06-20',
      actual_start_date: '2026-06-18',
      actual_end_date: '2026-06-20',
      actual_materials_cost_pen: 3100.0,
      actual_travel_cost_pen: 100.0,
      closure_notes: 'Instalación entregada conforme con acta y pruebas de enlace.',
      logs: [
        {
          id: 1,
          user_id: 4,
          work_date: '2026-06-18',
          hours_worked: 7.0,
          activity_type: 'cabling',
          notes: 'Tendido de ductería y cable Cat6 en exteriores',
        },
        {
          id: 2,
          user_id: 4,
          work_date: '2026-06-19',
          hours_worked: 7.0,
          activity_type: 'mounting',
          notes: 'Montaje de domos, bullet y switch PoE',
        },
        {
          id: 3,
          user_id: 4,
          work_date: '2026-06-20',
          hours_worked: 3.5,
          activity_type: 'config',
          notes: 'Configuración de NVR, detección AcuSense y app móvil',
        },
      ],
      created_at: '2026-06-17',
    },
  ]);

  // Recalcular costo vigente del producto a partir de sus ofertas
  function syncProductCost(productId) {
    const p = byId(products, productId);
    if (!p) return;
    const prodOffers = offers.filter((o) => o.product_id === Number(productId) && o.is_active);
    try {
      p.cost_pen = resolveProductCostPen(prodOffers, settings.exchange_rate, today());
    } catch {
      // Si no hay ofertas vigentes mantiene el costo existente
    }
  }

  // -------------------------------------------------------------
  // 1. AUTENTICACIÓN: RECUPERACIÓN Y CAMBIO DE CONTRASEÑA
  // -------------------------------------------------------------
  router.on('POST', '/auth/password/forgot', null, async ({ body }) => {
    requireFields(body, ['email']);
    const u = users.find((x) => x.email.toLowerCase() === String(body.email).toLowerCase());
    const token = crypto.randomBytes(24).toString('hex');
    if (u) {
      passwordResets.push({
        token,
        user_id: u.id,
        expires_at: Date.now() + 3600000,
        used: false,
      });
      log(u, 'password_forgot_request', 'user', u.id);
    }
    return [
      200,
      {
        message: 'Si el correo está registrado, se envió el enlace de recuperación.',
        dev_token: u ? token : undefined,
      },
    ];
  });

  router.on('POST', '/auth/password/reset', null, async ({ body }) => {
    requireFields(body, ['token', 'new_password']);
    const reset = passwordResets.find(
      (r) => r.token === body.token && !r.used && r.expires_at > Date.now()
    );
    if (!reset) {
      throw E(422, 'TOKEN_INVALID', 'El enlace de recuperación es inválido o expiró.');
    }
    const u = byId(users, reset.user_id);
    if (!u) throw E(404, 'NOT_FOUND', 'Usuario no encontrado.');
    u.password = String(body.new_password);
    reset.used = true;
    log(u, 'password_reset_success', 'user', u.id);
    return [200, { message: 'Contraseña restablecida exitosamente.' }];
  });

  router.on('POST', '/auth/password/change', [], async ({ body, user }) => {
    requireFields(body, ['current_password', 'new_password']);
    const u = byId(users, user.id);
    if (!u || u.password !== body.current_password) {
      throw E(401, 'INVALID_PASSWORD', 'La contraseña actual es incorrecta.');
    }
    u.password = String(body.new_password);
    log(user, 'password_change', 'user', user.id);
    return [200, { message: 'Contraseña modificada correctamente.' }];
  });

  // -------------------------------------------------------------
  // 2. CATÁLOGO COMPLETO: PRODUCTOS, PROVEEDORES, OFERTAS Y ENSAMBLAJES
  // -------------------------------------------------------------
  router.on('PUT', '/products/:id', ['admin'], async ({ p, body, user }) => {
    const prod = byId(products, p.id);
    if (!prod) throw E(404, 'NOT_FOUND', 'Producto no encontrado.');
    Object.assign(prod, body);
    if (body.unit_cost_pen !== undefined) prod.cost_pen = Number(body.unit_cost_pen);
    log(user, 'update', 'product', prod.id);
    return [200, { ...prod, unit_cost_pen: prod.cost_pen }];
  });

  router.on('DELETE', '/products/:id', ['admin'], async ({ p, user }) => {
    const idx = products.findIndex((x) => x.id === Number(p.id));
    if (idx === -1) throw E(404, 'NOT_FOUND', 'Producto no encontrado.');
    const deleted = products.splice(idx, 1)[0];
    log(user, 'delete', 'product', deleted.id);
    return [200, { ok: true, deleted_id: deleted.id }];
  });

  // Ofertas por producto
  router.on('GET', '/products/:id/offers', ['gerencia', 'admin'], async ({ p }) => {
    const list = offers
      .filter((o) => o.product_id === Number(p.id))
      .map((o) => ({ ...o, supplier: byId(suppliers, o.supplier_id) }));
    return [200, list];
  });

  router.on('POST', '/products/:id/offers', ['admin'], async ({ p, body, user }) => {
    requireFields(body, ['supplier_id', 'currency', 'unit_cost']);
    const off = {
      id: nextId(offers),
      product_id: Number(p.id),
      supplier_id: Number(body.supplier_id),
      supplier_sku: body.supplier_sku || '',
      currency: body.currency,
      unit_cost: Number(body.unit_cost),
      valid_until: body.valid_until || null,
      is_preferred: body.is_preferred ? 1 : 0,
      is_active: 1,
    };
    if (off.is_preferred) {
      offers
        .filter((o) => o.product_id === off.product_id)
        .forEach((o) => (o.is_preferred = 0));
    }
    offers.push(off);
    syncProductCost(off.product_id);
    log(user, 'create', 'supplier_offer', off.id);
    return [201, off];
  });

  router.on('PUT', '/supplier-offers/:id', ['admin'], async ({ p, body, user }) => {
    const off = byId(offers, p.id);
    if (!off) throw E(404, 'NOT_FOUND', 'Oferta no encontrada.');
    if (body.is_preferred) {
      offers
        .filter((o) => o.product_id === off.product_id)
        .forEach((o) => (o.is_preferred = 0));
    }
    Object.assign(off, body);
    syncProductCost(off.product_id);
    log(user, 'update', 'supplier_offer', off.id);
    return [200, off];
  });

  router.on('DELETE', '/supplier-offers/:id', ['admin'], async ({ p, user }) => {
    const idx = offers.findIndex((x) => x.id === Number(p.id));
    if (idx === -1) throw E(404, 'NOT_FOUND', 'Oferta no encontrada.');
    const [deleted] = offers.splice(idx, 1);
    syncProductCost(deleted.product_id);
    log(user, 'delete', 'supplier_offer', deleted.id);
    return [200, { ok: true, deleted_id: deleted.id }];
  });

  // Proveedores
  router.on('PUT', '/suppliers/:id', ['admin'], async ({ p, body, user }) => {
    const sup = byId(suppliers, p.id);
    if (!sup) throw E(404, 'NOT_FOUND', 'Proveedor no encontrado.');
    Object.assign(sup, body);
    log(user, 'update', 'supplier', sup.id);
    return [200, sup];
  });

  router.on('DELETE', '/suppliers/:id', ['admin'], async ({ p, user }) => {
    const idx = suppliers.findIndex((x) => x.id === Number(p.id));
    if (idx === -1) throw E(404, 'NOT_FOUND', 'Proveedor no encontrado.');
    const [deleted] = suppliers.splice(idx, 1);
    log(user, 'delete', 'supplier', deleted.id);
    return [200, { ok: true, deleted_id: deleted.id }];
  });

  // Ensamblajes CRUD completo y clonación
  router.on('POST', '/assemblies', ['admin'], async ({ body, user }) => {
    requireFields(body, ['code', 'name', 'category']);
    const u = calculateAssemblyUnit(
      {
        components_cost_pen: Number(body.unit_cost_pen || 0),
        fixed_supplies_cost_pen: Number(body.fixed_supplies_cost_pen || 0),
        hours_cabling: Number(body.hours_cabling || 0),
        hours_mounting: Number(body.hours_mounting || 0),
        hours_config: Number(body.hours_config || 0),
        reference_cost_per_point: Number(body.reference_cost_per_point || 0),
      },
      1
    );
    const asm = {
      id: nextId(assemblies),
      code: body.code,
      name: body.name,
      category: body.category,
      unit: body.unit || 'PUNTO',
      unit_cost_pen: u.unit_cost_pen,
      hours_cabling: Number(body.hours_cabling || 0),
      hours_mounting: Number(body.hours_mounting || 0),
      hours_config: Number(body.hours_config || 0),
      reference_cost_per_point: Number(body.reference_cost_per_point || 0),
      components: body.components || [],
    };
    assemblies.push(asm);
    log(user, 'create', 'assembly', asm.id);
    return [201, asm];
  });

  router.on('PUT', '/assemblies/:id', ['admin'], async ({ p, body, user }) => {
    const asm = byId(assemblies, p.id);
    if (!asm) throw E(404, 'NOT_FOUND', 'Ensamblaje no encontrado.');
    Object.assign(asm, body);
    log(user, 'update', 'assembly', asm.id);
    return [200, asm];
  });

  router.on('DELETE', '/assemblies/:id', ['admin'], async ({ p, user }) => {
    const idx = assemblies.findIndex((x) => x.id === Number(p.id));
    if (idx === -1) throw E(404, 'NOT_FOUND', 'Ensamblaje no encontrado.');
    const [deleted] = assemblies.splice(idx, 1);
    log(user, 'delete', 'assembly', deleted.id);
    return [200, { ok: true, deleted_id: deleted.id }];
  });

  router.on('POST', '/assemblies/:id/clone', ['admin'], async ({ p, body, user }) => {
    const asm = byId(assemblies, p.id);
    if (!asm) throw E(404, 'NOT_FOUND', 'Ensamblaje original no encontrado.');
    const copy = {
      ...asm,
      id: nextId(assemblies),
      code: body.code || `${asm.code}-COPIA`,
      name: body.name || `${asm.name} (Copia)`,
    };
    assemblies.push(copy);
    log(user, 'clone', 'assembly', copy.id);
    return [201, copy];
  });

  // -------------------------------------------------------------
  // 3. IMPORTACIÓN EXCEL / CSV DE CATÁLOGO (3.19)
  // -------------------------------------------------------------
  router.on('POST', '/catalog/import', ['admin'], async ({ body, user }) => {
    const content = body.content || body.file_content || '';
    const mode = body.mode === 'commit' ? 'commit' : 'validate';
    if (!content.trim()) {
      throw E(422, 'EMPTY_FILE', 'El contenido del archivo CSV/Excel está vacío.');
    }
    const rows = parseCsv(content);
    if (rows.length < 2) {
      throw E(422, 'INVALID_FORMAT', 'El archivo debe tener al menos fila de cabecera y una fila de datos.');
    }
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const colIdx = {
      sku: header.indexOf('sku'),
      name: header.indexOf('name') !== -1 ? header.indexOf('name') : header.indexOf('nombre'),
      category: header.indexOf('category') !== -1 ? header.indexOf('category') : header.indexOf('categoria'),
      unit_cost: header.indexOf('unit_cost') !== -1 ? header.indexOf('unit_cost') : header.indexOf('costo'),
      currency: header.indexOf('currency') !== -1 ? header.indexOf('currency') : header.indexOf('moneda'),
      unit: header.indexOf('unit') !== -1 ? header.indexOf('unit') : header.indexOf('unidad'),
    };

    const errors = [];
    const validItems = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r.length === 0 || (r.length === 1 && !r[0].trim())) continue;
      const sku = (r[colIdx.sku] || '').trim();
      const name = (r[colIdx.name] || '').trim();
      const rawCost = (r[colIdx.unit_cost] || '').trim();
      const cost = Number(rawCost);
      const currency = (r[colIdx.currency] || 'PEN').trim().toUpperCase();

      if (!sku) errors.push({ row: i + 1, field: 'sku', message: 'El SKU es obligatorio.' });
      if (!name) errors.push({ row: i + 1, field: 'name', message: 'El nombre es obligatorio.' });
      if (isNaN(cost) || cost < 0 || rawCost === '') {
        errors.push({ row: i + 1, field: 'unit_cost', message: 'Costo inválido o no numérico.' });
      }
      if (!['PEN', 'USD'].includes(currency)) {
        errors.push({ row: i + 1, field: 'currency', message: 'Moneda inválida (use USD o PEN).' });
      }

      if (sku && name && !isNaN(cost) && cost >= 0 && ['PEN', 'USD'].includes(currency)) {
        const rate = Number(settings.exchange_rate.usd_to_pen_sell || 3.75);
        const costPen = currency === 'USD' ? r2(cost * rate) : cost;
        validItems.push({
          sku,
          name,
          category: (r[colIdx.category] || 'cctv').trim(),
          cost_pen: costPen,
          unit: (r[colIdx.unit] || 'UND').trim().toUpperCase(),
        });
      }
    }

    let rowsImported = 0;
    if (mode === 'commit' && validItems.length > 0) {
      for (const item of validItems) {
        const existing = products.find((p) => p.sku === item.sku);
        if (existing) {
          Object.assign(existing, item);
        } else {
          products.push({ id: nextId(products), ...item });
        }
        rowsImported++;
      }
      log(user, 'catalog_import', 'catalog', null, { imported: rowsImported });
    }

    return [
      200,
      {
        mode,
        rows_total: rows.length - 1,
        rows_imported: mode === 'commit' ? rowsImported : validItems.length,
        rows_rejected: errors.length,
        errors,
      },
    ];
  });

  // -------------------------------------------------------------
  // 4. VISITAS TÉCNICAS (Fase 2 Levantamiento)
  // -------------------------------------------------------------
  router.on('GET', '/site-visits', [], async ({ user }) => {
    let list = siteVisits;
    if (user.role === 'tecnico') {
      list = list.filter((v) => v.technician_id === user.id);
    }
    const hydrated = list.map((v) => ({
      ...v,
      project: byId(projects, v.project_id),
      technician: byId(users, v.technician_id),
    }));
    return [200, hydrated];
  });

  router.on('POST', '/site-visits', ['vendedor', 'gerencia', 'admin'], async ({ body, user }) => {
    requireFields(body, ['project_id', 'technician_id', 'visit_date']);
    const v = {
      id: nextId(siteVisits),
      project_id: Number(body.project_id),
      technician_id: Number(body.technician_id),
      visit_date: body.visit_date,
      status: 'programada',
      general_observations: body.general_observations || '',
      risks_detected: body.risks_detected || '',
      items: [],
      photos: [],
      created_at: today(),
    };
    siteVisits.push(v);
    log(user, 'create', 'site_visit', v.id);
    return [201, v];
  });

  router.on('GET', '/site-visits/:id', [], async ({ p }) => {
    const v = byId(siteVisits, p.id);
    if (!v) throw E(404, 'NOT_FOUND', 'Visita técnica no encontrada.');
    return [
      200,
      {
        ...v,
        project: byId(projects, v.project_id),
        technician: byId(users, v.technician_id),
      },
    ];
  });

  router.on('PUT', '/site-visits/:id', [], async ({ p, body, user }) => {
    const v = byId(siteVisits, p.id);
    if (!v) throw E(404, 'NOT_FOUND', 'Visita no encontrada.');
    Object.assign(v, body);
    log(user, 'update', 'site_visit', v.id);
    return [200, v];
  });

  router.on('POST', '/site-visits/:id/items', [], async ({ p, body, user }) => {
    const v = byId(siteVisits, p.id);
    if (!v) throw E(404, 'NOT_FOUND', 'Visita no encontrada.');
    const item = {
      id: nextId(v.items),
      zone_name: body.zone_name || 'Zona General',
      assembly_id: body.assembly_id ? Number(body.assembly_id) : null,
      quantity: Number(body.quantity || 1),
      estimated_cable_meters: Number(body.estimated_cable_meters || 0),
      notes: body.notes || '',
    };
    v.items.push(item);
    log(user, 'add_item', 'site_visit', v.id);
    return [201, item];
  });

  router.on('DELETE', '/site-visit-items/:id', [], async ({ p, user }) => {
    for (const v of siteVisits) {
      const idx = v.items.findIndex((x) => x.id === Number(p.id));
      if (idx !== -1) {
        v.items.splice(idx, 1);
        log(user, 'delete_item', 'site_visit', v.id);
        return [200, { ok: true }];
      }
    }
    throw E(404, 'NOT_FOUND', 'Ítem de visita no encontrado.');
  });

  router.on('POST', '/site-visits/:id/photos', [], async ({ p, body, user }) => {
    const v = byId(siteVisits, p.id);
    if (!v) throw E(404, 'NOT_FOUND', 'Visita no encontrada.');
    const photo = {
      id: nextId(v.photos),
      zone_name: body.zone_name || '',
      caption: body.caption || '',
      url: body.url || body.data_url || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80',
    };
    v.photos.push(photo);
    log(user, 'upload_photo', 'site_visit', v.id);
    return [201, photo];
  });

  // Convertir levantamiento técnico en proforma borrador
  router.on('POST', '/site-visits/:id/convert-to-quote', ['vendedor', 'gerencia', 'admin'], async ({ p, user }) => {
    const v = byId(siteVisits, p.id);
    if (!v) throw E(404, 'NOT_FOUND', 'Visita técnica no encontrada.');
    const proj = byId(projects, v.project_id);
    if (!proj) throw E(404, 'NOT_FOUND', 'Proyecto no encontrado.');

    const zoneNames = [...new Set(v.items.map((i) => i.zone_name))];
    const quoteZones = zoneNames.map((name, idx) => ({
      id: idx + 1,
      name,
      difficulty_factor: 1.0,
    }));

    const quoteLines = v.items
      .filter((i) => i.assembly_id)
      .map((i) => ({
        assembly_id: i.assembly_id,
        quantity: i.quantity,
        zone_name: i.zone_name,
      }));

    const baseQuote = {
      customer_id: proj.customer_id,
      project_id: proj.id,
      zones: quoteZones,
      lines: quoteLines,
      crew_technicians: 1,
      crew_assistants: 1,
      discount_pct: 0,
      notes_text: `Generada automáticamente a partir de Visita Técnica #${v.id}. ${v.general_observations}`,
    };

    const calc = compute(baseQuote);
    const newQuote = {
      id: nextId(quotes),
      code: `PRO-${new Date().getFullYear()}-${String(nextId(quotes)).padStart(4, '0')}`,
      version: 1,
      status: 'borrador',
      seller_id: user.id,
      currency: 'PEN',
      ...baseQuote,
      ...calc,
      created_at: today(),
    };
    quotes.push(newQuote);
    log(user, 'convert_visit_to_quote', 'quote', newQuote.id);
    return [201, quoteView(newQuote, user.role)];
  });

  // -------------------------------------------------------------
  // 5. ÓRDENES DE TRABAJO (OT) Y COMPARATIVA COTIZADO VS REAL
  // -------------------------------------------------------------
  router.on('GET', '/work-orders', [], async ({ user }) => {
    let list = workOrders;
    if (user.role === 'tecnico') {
      list = list.filter((w) => w.lead_technician_id === user.id);
    }
    const hydrated = list.map((w) => {
      const q = byId(quotes, w.quote_id);
      return {
        ...w,
        quote: q ? quoteView(q, user.role) : null,
        lead_technician: byId(users, w.lead_technician_id),
      };
    });
    return [200, hydrated];
  });

  router.on('POST', '/quotes/:id/work-order', ['gerencia', 'admin', 'vendedor'], async ({ p, body, user }) => {
    const q = byId(quotes, p.id);
    if (!q) throw E(404, 'NOT_FOUND', 'Proforma no encontrada.');
    if (!['aceptada', 'emitida', 'enviada'].includes(q.status)) {
      throw E(409, 'INVALID_STATE', 'Solo se genera OT para proformas aceptadas o emitidas.');
    }
    const existing = workOrders.find((w) => w.quote_id === q.id);
    if (existing) throw E(409, 'DUPLICATE_WO', `Ya existe la orden ${existing.code} para esta proforma.`);

    const wo = {
      id: nextId(workOrders),
      quote_id: q.id,
      code: `OT-${new Date().getFullYear()}-${String(nextId(workOrders)).padStart(4, '0')}`,
      lead_technician_id: Number(body.lead_technician_id || 4),
      status: 'pendiente',
      scheduled_start_date: body.scheduled_start_date || today(),
      scheduled_end_date: body.scheduled_end_date || today(),
      actual_start_date: null,
      actual_end_date: null,
      actual_materials_cost_pen: 0,
      actual_travel_cost_pen: 0,
      closure_notes: '',
      logs: [],
      created_at: today(),
    };
    workOrders.push(wo);
    log(user, 'create_work_order', 'work_order', wo.id);
    return [201, wo];
  });

  router.on('GET', '/work-orders/:id', [], async ({ p, user }) => {
    const w = byId(workOrders, p.id);
    if (!w) throw E(404, 'NOT_FOUND', 'Orden de trabajo no encontrada.');
    const q = byId(quotes, w.quote_id);
    return [
      200,
      {
        ...w,
        quote: q ? quoteView(q, user.role) : null,
        lead_technician: byId(users, w.lead_technician_id),
      },
    ];
  });

  router.on('PUT', '/work-orders/:id', [], async ({ p, body, user }) => {
    const w = byId(workOrders, p.id);
    if (!w) throw E(404, 'NOT_FOUND', 'Orden no encontrada.');
    Object.assign(w, body);
    log(user, 'update', 'work_order', w.id);
    return [200, w];
  });

  router.on('POST', '/work-orders/:id/logs', [], async ({ p, body, user }) => {
    const w = byId(workOrders, p.id);
    if (!w) throw E(404, 'NOT_FOUND', 'Orden no encontrada.');
    requireFields(body, ['hours_worked', 'activity_type']);
    const entry = {
      id: nextId(w.logs),
      user_id: user.id,
      user_name: user.full_name,
      work_date: body.work_date || today(),
      hours_worked: Number(body.hours_worked),
      activity_type: body.activity_type,
      notes: body.notes || '',
    };
    w.logs.push(entry);
    log(user, 'log_work', 'work_order', w.id);
    return [201, entry];
  });

  // Comparativa Financiera: Cotizado vs Real
  router.on('GET', '/work-orders/:id/comparison', ['gerencia', 'admin'], async ({ p }) => {
    const w = byId(workOrders, p.id);
    if (!w) throw E(404, 'NOT_FOUND', 'Orden no encontrada.');
    const q = byId(quotes, w.quote_id);
    if (!q) throw E(404, 'NOT_FOUND', 'Proforma ligada no encontrada.');

    const totalHoursWorked = r2(w.logs.reduce((s, l) => s + Number(l.hours_worked || 0), 0));
    const technicianDayRate = Number(settings.labor_params.technician_day_cost_pen || 140);
    const hourlyCost = technicianDayRate / Number(settings.labor_params.effective_hours_per_day || 7);
    const actualLaborCost = r2(totalHoursWorked * hourlyCost);
    const actualMaterialsCost = Number(w.actual_materials_cost_pen || 0);
    const actualTravelCost = Number(w.actual_travel_cost_pen || 0);
    const actualDirectCost = r2(actualMaterialsCost + actualLaborCost + actualTravelCost);
    const actualOverhead = r2(actualDirectCost * (Number(q.overhead_pct || 8) / 100));
    const actualTotalCost = r2(actualDirectCost + actualOverhead);
    const revenue = Number(q.taxable_base_pen || 0);
    const actualMarginPct = revenue > 0 ? r2(((revenue - actualTotalCost) / revenue) * 100) : 0;

    return [
      200,
      {
        work_order_code: w.code,
        quote_code: q.code,
        revenue_pen: revenue,
        quoted: {
          materials_cost_pen: q.materials_cost_pen,
          total_hours: q.total_hours,
          labor_cost_applied_pen: q.labor_cost_applied_pen,
          travel_cost_pen: q.travel_cost_pen,
          overhead_amount_pen: q.overhead_amount_pen,
          total_cost_pen: q.total_cost_pen,
          margin_pct: q.effective_margin_on_sale_pct,
        },
        actual: {
          materials_cost_pen: actualMaterialsCost,
          total_hours: totalHoursWorked,
          labor_cost_pen: actualLaborCost,
          travel_cost_pen: actualTravelCost,
          overhead_amount_pen: actualOverhead,
          total_cost_pen: actualTotalCost,
          margin_pct: actualMarginPct,
        },
        variance: {
          cost_diff_pen: r2(actualTotalCost - q.total_cost_pen),
          hours_diff: r2(totalHoursWorked - q.total_hours),
          margin_diff_pct: r2(actualMarginPct - q.effective_margin_on_sale_pct),
        },
      },
    ];
  });

  // -------------------------------------------------------------
  // 6. REPORTES Y KPIS DINÁMICOS SUNAT / SPOT BANCO DE LA NACIÓN (Pantalla 18)
  // -------------------------------------------------------------
  const sunatSettlements = (state.sunatSettlements ||= [
    {
      id: 1,
      voucher_code: 'F001-0004289',
      quote_code: 'PRO-2026-0891',
      customer_name: 'MINERA CHINALCO PERÚ S.A.',
      customer_ruc: '20512805419',
      issue_date_label: '14 Oct 2026',
      period: 'ytd-2026',
      advisor: 'Carlos Mendoza',
      subtotal_pen: 68500.00,
      igv_pen: 12330.00,
      spot_pen: 3233.20,
      total_pen: 80830.00,
      sunat_status: 'cdr_accepted',
      sunat_status_label: 'Aceptada CDR',
    },
    {
      id: 2,
      voucher_code: 'F001-0004290',
      quote_code: 'PRO-2026-0894',
      customer_name: 'ALMACENES CENTRALES HUACHIPA S.A.C.',
      customer_ruc: '20547896321',
      issue_date_label: '15 Oct 2026',
      period: 'ytd-2026',
      advisor: 'Ana Paredes',
      subtotal_pen: 34200.00,
      igv_pen: 6156.00,
      spot_pen: 1614.24,
      total_pen: 40356.00,
      sunat_status: 'cdr_accepted',
      sunat_status_label: 'Aceptada CDR',
    },
    {
      id: 3,
      voucher_code: 'F001-0004291',
      quote_code: 'PRO-2026-0898',
      customer_name: 'CLÍNICA SAN PABLO SURCO S.A.',
      customer_ruc: '20107463705',
      issue_date_label: '17 Oct 2026',
      period: 'q2-2026',
      advisor: 'Jorge Salas',
      subtotal_pen: 69830.50,
      igv_pen: 12569.49,
      spot_pen: 3296.00,
      total_pen: 82399.99,
      sunat_status: 'spot_pending',
      sunat_status_label: 'SPOT Pendiente BN',
    },
    {
      id: 4,
      voucher_code: 'F001-0004292',
      quote_code: 'PRO-2026-0902',
      customer_name: 'BANCO INTERBANK SEDE CORP.',
      customer_ruc: '20100053455',
      issue_date_label: '18 Oct 2026',
      period: 'jun2026',
      advisor: 'Roberto Sánchez',
      subtotal_pen: 112400.00,
      igv_pen: 20232.00,
      spot_pen: 5305.28,
      total_pen: 132632.00,
      sunat_status: 'cdr_accepted',
      sunat_status_label: 'Aceptada CDR',
    },
    {
      id: 5,
      voucher_code: 'F001-0004293',
      quote_code: 'PF-2026-0091',
      customer_name: 'SUPERMERCADOS PERUANOS S.A.',
      customer_ruc: '20100070970',
      issue_date_label: '29 May 2026',
      period: 'q2-2026',
      advisor: 'Carlos Mendoza',
      subtotal_pen: 29830.51,
      igv_pen: 5369.49,
      spot_pen: 1408.00,
      total_pen: 35200.00,
      sunat_status: 'cdr_accepted',
      sunat_status_label: 'Aceptada CDR',
    },
    {
      id: 6,
      voucher_code: 'F001-0004294',
      quote_code: 'PF-2026-0065',
      customer_name: 'CONCESIONARIO AUTOMOTRIZ SURQUILLO',
      customer_ruc: '20554433221',
      issue_date_label: '28 Abr 2026',
      period: 'q1-2026',
      advisor: 'Carlos Mendoza',
      subtotal_pen: 20593.22,
      igv_pen: 3706.78,
      spot_pen: 972.00,
      total_pen: 24300.00,
      sunat_status: 'pending_payment',
      sunat_status_label: 'Por Cobrar',
    },
  ]);

  const REPORT_PERIODS = {
    'ytd-2026': {
      period_label: 'Ejercicio 2026 (YTD)',
      total_revenue_pen: 1420850.00,
      revenue_delta_label: '+18.4% vs. Periodo anterior',
      executed_works_count: 48,
      profit_margin_pct: 33.6,
      target_margin_pct: 30,
      net_profit_pen: 477405.60,
      igv_debito_pen: 255753.00,
      igv_credito_pen: 141120.00,
      igv_saldo_neto_pen: 114633.00,
      spot_detraccion_pen: 56834.00,
      spot_conciliado_pct: 94.2,
      spot_pendiente_pen: 3296.00,
      total_materials_cost_pen: 614200.00,
      categories: [
        { name: 'CCTV & Seguridad IP', pct: 42, amount_pen: 596757, color: 'bg-primary' },
        { name: 'Fibra Óptica & Estructurado', pct: 31, amount_pen: 440463, color: 'bg-secondary-container' },
        { name: 'Control de Acceso & Torniquetes', pct: 15, amount_pen: 213127, color: 'bg-primary-container' },
        { name: 'Canalización & Bandejas EMT', pct: 12, amount_pen: 170503, color: 'bg-slate-400' },
      ],
    },
    'q2-2026': {
      period_label: 'Q2 2026 - Abr a Jun',
      total_revenue_pen: 473420.00,
      revenue_delta_label: '+22.1% vs. Q1 2026',
      executed_works_count: 18,
      profit_margin_pct: 32.8,
      target_margin_pct: 30,
      net_profit_pen: 155281.76,
      igv_debito_pen: 85215.60,
      igv_credito_pen: 48110.00,
      igv_saldo_neto_pen: 37105.60,
      spot_detraccion_pen: 18936.80,
      spot_conciliado_pct: 91.5,
      spot_pendiente_pen: 1610.00,
      total_materials_cost_pen: 205400.00,
      categories: [
        { name: 'CCTV & Seguridad IP', pct: 44, amount_pen: 208305, color: 'bg-primary' },
        { name: 'Fibra Óptica & Estructurado', pct: 29, amount_pen: 137292, color: 'bg-secondary-container' },
        { name: 'Control de Acceso & Torniquetes', pct: 16, amount_pen: 75747, color: 'bg-primary-container' },
        { name: 'Canalización & Bandejas EMT', pct: 11, amount_pen: 52076, color: 'bg-slate-400' },
      ],
    },
    'q1-2026': {
      period_label: 'Q1 2026 - Ene a Mar',
      total_revenue_pen: 387600.00,
      revenue_delta_label: '+14.2% vs. Q4 2025',
      executed_works_count: 15,
      profit_margin_pct: 31.4,
      target_margin_pct: 30,
      net_profit_pen: 121706.40,
      igv_debito_pen: 69768.00,
      igv_credito_pen: 39420.00,
      igv_saldo_neto_pen: 30348.00,
      spot_detraccion_pen: 15504.00,
      spot_conciliado_pct: 100.0,
      spot_pendiente_pen: 0.00,
      total_materials_cost_pen: 168900.00,
      categories: [
        { name: 'CCTV & Seguridad IP', pct: 40, amount_pen: 155040, color: 'bg-primary' },
        { name: 'Fibra Óptica & Estructurado', pct: 33, amount_pen: 127908, color: 'bg-secondary-container' },
        { name: 'Control de Acceso & Torniquetes', pct: 14, amount_pen: 54264, color: 'bg-primary-container' },
        { name: 'Canalización & Bandejas EMT', pct: 13, amount_pen: 50388, color: 'bg-slate-400' },
      ],
    },
    jun2026: {
      period_label: 'Mes en Curso (Junio 2026)',
      total_revenue_pen: 186420.00,
      revenue_delta_label: '+18.7% vs. Mayo 2026',
      executed_works_count: 8,
      profit_margin_pct: 34.2,
      target_margin_pct: 30,
      net_profit_pen: 63755.64,
      igv_debito_pen: 33555.60,
      igv_credito_pen: 18940.00,
      igv_saldo_neto_pen: 14615.60,
      spot_detraccion_pen: 7456.80,
      spot_conciliado_pct: 95.8,
      spot_pendiente_pen: 312.00,
      total_materials_cost_pen: 78400.00,
      categories: [
        { name: 'CCTV & Seguridad IP', pct: 46, amount_pen: 85753, color: 'bg-primary' },
        { name: 'Fibra Óptica & Estructurado', pct: 28, amount_pen: 52198, color: 'bg-secondary-container' },
        { name: 'Control de Acceso & Torniquetes', pct: 16, amount_pen: 29827, color: 'bg-primary-container' },
        { name: 'Canalización & Bandejas EMT', pct: 10, amount_pen: 18642, color: 'bg-slate-400' },
      ],
    },
  };

  router.on('GET', '/reports/kpis', ['gerencia', 'admin'], async ({ url }) => {
    const periodKey = url.searchParams.get('period') || 'ytd-2026';
    const advisorFilter = url.searchParams.get('advisor') || 'all';
    const sunatStatusFilter = url.searchParams.get('sunat_status') || 'all';

    const preset = REPORT_PERIODS[periodKey] || REPORT_PERIODS['ytd-2026'];

    const tenMonthEvolution = [
      { key: '2026-01', month: 'ENE', sales_k: 98, quoted: 98000, accepted: 54000, hardware_pct: 55, labor_pct: 30, sales_pct: 48 },
      { key: '2026-02', month: 'FEB', sales_k: 114, quoted: 114000, accepted: 64000, hardware_pct: 62, labor_pct: 35, sales_pct: 56 },
      { key: '2026-03', month: 'MAR', sales_k: 132, quoted: 132000, accepted: 78000, hardware_pct: 68, labor_pct: 38, sales_pct: 64 },
      { key: '2026-04', month: 'ABR', sales_k: 121, quoted: 121000, accepted: 70000, hardware_pct: 60, labor_pct: 34, sales_pct: 59 },
      { key: '2026-05', month: 'MAY', sales_k: 148, quoted: 148000, accepted: 86000, hardware_pct: 74, labor_pct: 42, sales_pct: 72 },
      { key: '2026-06', month: 'JUN', sales_k: 162, quoted: 162000, accepted: 96000, hardware_pct: 78, labor_pct: 45, sales_pct: 79 },
      { key: '2026-07', month: 'JUL', sales_k: 144, quoted: 144000, accepted: 84000, hardware_pct: 70, labor_pct: 40, sales_pct: 70 },
      { key: '2026-08', month: 'AGO', sales_k: 171, quoted: 171000, accepted: 102000, hardware_pct: 82, labor_pct: 46, sales_pct: 83 },
      { key: '2026-09', month: 'SEP', sales_k: 156, quoted: 156000, accepted: 91000, hardware_pct: 75, labor_pct: 42, sales_pct: 76 },
      { key: '2026-10', month: 'OCT', sales_k: 185, quoted: 185000, accepted: 112000, hardware_pct: 88, labor_pct: 52, sales_pct: 92, isCurrent: true },
    ];

    let settlements = sunatSettlements.slice();
    if (advisorFilter !== 'all') {
      settlements = settlements.filter((s) => s.advisor.toLowerCase().includes(advisorFilter.toLowerCase()));
    }
    if (sunatStatusFilter !== 'all') {
      settlements = settlements.filter((s) => s.sunat_status === sunatStatusFilter);
    }

    return [
      200,
      {
        period_key: periodKey,
        ...preset,
        evolution: tenMonthEvolution,
        settlements,
      },
    ];
  });

  router.on('POST', '/reports/spot-notify/:id', ['gerencia', 'admin'], async ({ p, user }) => {
    const item = byId(sunatSettlements, p.id);
    if (!item) throw E(404, 'NOT_FOUND', 'Comprobante no encontrado.');
    item.sunat_status = 'cdr_accepted';
    item.sunat_status_label = 'SPOT Conciliado BN';
    log(user, 'spot_conciliate', 'sunat_settlement', item.id);
    return [200, item];
  });

  return router;
}
