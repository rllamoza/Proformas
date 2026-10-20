/**
 * Motor puro de cálculo y sanitización por rol (Espejo exacto de QuoteCalculator.php y RoleSanitizer.php).
 * Cumple RN-01 a RN-10, CAL-01 a CAL-24 y PER-01 a PER-16.
 */

export function roundMoney(amount) {
  const val = Number(amount) || 0;
  return Math.round((val + (val >= 0 ? 1e-9 : -1e-9)) * 100) / 100;
}

export function roundHours(hours) {
  const val = Number(hours) || 0;
  return Math.round((val + 1e-9) * 100) / 100;
}

/**
 * RN-04: Redondeo superior a múltiplos de 0.5 días.
 */
export function ceilHalfDay(rawDays) {
  const val = Number(rawDays) || 0;
  if (val <= 0) return 0.0;
  return Math.ceil(Math.round(val * 2 * 1e6) / 1e6) / 2.0;
}

/**
 * RN-01: Determina el costo unitario vigente en PEN de un producto a partir de sus ofertas.
 */
export function resolveProductCostPen(offers, exchangeRate, today = '2026-06-15') {
  const validOffers = (offers || []).filter((offer) => {
    const isActive = offer.is_active !== undefined ? Boolean(offer.is_active) : true;
    if (!isActive) return false;
    if (offer.valid_until && offer.valid_until < today) return false;
    return true;
  });

  if (validOffers.length === 0) {
    const err = new Error('OFFER_EXPIRED: El producto no posee ninguna oferta vigente.');
    err.code = 'OFFER_EXPIRED';
    throw err;
  }

  const sellRate = Number(exchangeRate?.usd_to_pen_sell ?? 3.75);
  const bufferPct = Number(exchangeRate?.buffer_pct ?? 0.0);
  const effectiveUsdRate = sellRate * (1 + bufferPct / 100);

  const preferred = validOffers.find((o) => Boolean(o.is_preferred));
  if (preferred) {
    const raw = Number(preferred.unit_cost);
    const pen = (preferred.currency || 'USD') === 'USD' ? raw * effectiveUsdRate : raw;
    return roundMoney(pen);
  }

  let minPen = null;
  for (const offer of validOffers) {
    const raw = Number(offer.unit_cost);
    const pen = (offer.currency || 'USD') === 'USD' ? raw * effectiveUsdRate : raw;
    const rounded = roundMoney(pen);
    if (minPen === null || rounded < minPen) {
      minPen = rounded;
    }
  }

  return minPen ?? 0.0;
}

/**
 * RN-02: El factor de dificultad multiplica hours_cabling y hours_mounting, pero NO hours_config.
 */
export function calculateAssemblyUnit(assembly, difficultyFactor = 1.0) {
  const df = Number(difficultyFactor) || 1.0;
  const unitMaterialsCost = roundMoney(
    Number(assembly.components_cost_pen || 0) + Number(assembly.fixed_supplies_cost_pen || 0)
  );
  const cabling = roundHours(Number(assembly.hours_cabling || 0) * df);
  const mounting = roundHours(Number(assembly.hours_mounting || 0) * df);
  const config = roundHours(Number(assembly.hours_config || 0));
  const totalHoursUnit = roundHours(cabling + mounting + config);

  return {
    unit_cost_pen: unitMaterialsCost,
    hours_cabling_unit: cabling,
    hours_mounting_unit: mounting,
    hours_config_unit: config,
    total_hours_unit: totalHoursUnit,
    reference_labor_unit_pen: roundMoney(Number(assembly.reference_cost_per_point || 0)),
  };
}

export function buildCrewComparison(totalHours, params, efficiencies) {
  const configs = [
    { crew_size: 2, technicians: 1, assistants: 1, label: '1 Técnico + 1 Ayudante' },
    { crew_size: 3, technicians: 1, assistants: 2, label: '1 Técnico + 2 Ayudantes' },
    { crew_size: 4, technicians: 2, assistants: 2, label: '2 Técnicos + 2 Ayudantes' },
  ];

  return configs.map((cfg) => {
    const eff = Number(efficiencies[cfg.crew_size] ?? 100.0);
    const cap = roundHours(cfg.crew_size * Number(params.effective_hours_per_day) * (eff / 100));
    const rawDays =
      totalHours > 0 && cap > 0
        ? (totalHours / cap) * (1 + Number(params.buffer_pct) / 100)
        : 0.0;
    const days = ceilHalfDay(rawDays);
    const dayCost = roundMoney(
      cfg.technicians * Number(params.technician_day_cost_pen) +
        cfg.assistants * Number(params.assistant_day_cost_pen)
    );
    const methodBCost = roundMoney(days * dayCost);

    return {
      crew_size: cfg.crew_size,
      label: cfg.label,
      technicians: cfg.technicians,
      assistants: cfg.assistants,
      efficiency_pct: eff,
      daily_capacity_hours: cap,
      estimated_days: days,
      daily_cost_pen: dayCost,
      labor_cost_method_b_pen: methodBCost,
    };
  });
}

export function calculateQuote(input = {}) {
  const params = {
    technician_day_cost_pen: 140.0,
    assistant_day_cost_pen: 90.0,
    effective_hours_per_day: 7.0,
    buffer_pct: 15.0,
    default_travel_cost_per_day_pen: 40.0,
    default_overhead_pct: 8.0,
    default_margin_on_sale_pct: 30.0,
    min_margin_on_sale_pct: 20.0,
    seller_max_discount_pct: 5.0,
    tax_pct: 18.0,
    ...(input.labor_params || {}),
  };

  const efficiencies = input.crew_efficiencies || {
    1: 100.0,
    2: 100.0,
    3: 90.0,
    4: 80.0,
  };

  const targetMarginPct = Number(
    input.target_margin_on_sale_pct ?? params.default_margin_on_sale_pct
  );
  if (targetMarginPct >= 100.0 || targetMarginPct < 0.0) {
    const err = new Error(
      'INVALID_TARGET_MARGIN: El margen objetivo debe ser menor a 100% y mayor o igual a 0%.'
    );
    err.code = 'INVALID_TARGET_MARGIN';
    throw err;
  }

  const overheadPct = Number(input.overhead_pct ?? params.default_overhead_pct);
  const discountPct = Number(input.discount_pct ?? 0.0);
  const taxPct = Number(input.tax_pct ?? params.tax_pct);
  const laborMethod = input.labor_method || 'max_ab';

  const crewTechs = Math.max(0, parseInt(input.crew_technicians ?? 1, 10));
  const crewAssts = Math.max(0, parseInt(input.crew_assistants ?? 1, 10));
  const crewSize = Math.max(1, crewTechs + crewAssts);
  const crewEffPct = Number(efficiencies[crewSize] ?? (crewSize > 4 ? 75.0 : 100.0));

  let materialsCostPen = 0.0;
  let totalHoursCabling = 0.0;
  let totalHoursMounting = 0.0;
  let totalHoursConfig = 0.0;
  let laborMethodAPen = 0.0;
  const calculatedLines = [];

  for (const line of input.lines || []) {
    const qty = Number(line.quantity ?? 1.0);
    const unitCost = Number(line.unit_cost_pen ?? 0.0);
    const diff = Number(line.difficulty_multiplier ?? 1.0);
    const alreadyMultiplied = Boolean(line.already_multiplied);

    const hCablingUnit = alreadyMultiplied
      ? Number(line.hours_cabling_unit ?? 0.0)
      : roundHours(Number(line.hours_cabling_unit ?? 0.0) * diff);
    const hMountingUnit = alreadyMultiplied
      ? Number(line.hours_mounting_unit ?? 0.0)
      : roundHours(Number(line.hours_mounting_unit ?? 0.0) * diff);
    const hConfigUnit = roundHours(Number(line.hours_config_unit ?? 0.0));

    const lineMaterials = roundMoney(qty * unitCost);
    const lineCabling = roundHours(qty * hCablingUnit);
    const lineMounting = roundHours(qty * hMountingUnit);
    const lineConfig = roundHours(qty * hConfigUnit);
    const lineHours = roundHours(lineCabling + lineMounting + lineConfig);
    const refLaborUnit = Number(line.reference_labor_unit_pen ?? 0.0);
    const lineMethodA = roundMoney(qty * refLaborUnit);

    materialsCostPen = roundMoney(materialsCostPen + lineMaterials);
    totalHoursCabling = roundHours(totalHoursCabling + lineCabling);
    totalHoursMounting = roundHours(totalHoursMounting + lineMounting);
    totalHoursConfig = roundHours(totalHoursConfig + lineConfig);
    laborMethodAPen = roundMoney(laborMethodAPen + lineMethodA);

    calculatedLines.push({
      ...line,
      quantity: qty,
      unit_cost_pen: roundMoney(unitCost),
      hours_cabling_unit: hCablingUnit,
      hours_mounting_unit: hMountingUnit,
      hours_config_unit: hConfigUnit,
      reference_labor_unit_pen: roundMoney(refLaborUnit),
      difficulty_multiplier: diff,
      line_materials_cost_pen: lineMaterials,
      line_total_hours: lineHours,
      line_method_a_pen: lineMethodA,
    });
  }

  const totalHours = roundHours(totalHoursCabling + totalHoursMounting + totalHoursConfig);

  const dailyCapacityHours = roundHours(
    crewSize * Number(params.effective_hours_per_day) * (crewEffPct / 100)
  );

  const rawDaysWithBuffer =
    totalHours > 0 && dailyCapacityHours > 0
      ? (totalHours / dailyCapacityHours) * (1 + Number(params.buffer_pct) / 100)
      : 0.0;

  const estimatedDays = ceilHalfDay(rawDaysWithBuffer);

  const dailyCrewCostPen = roundMoney(
    crewTechs * Number(params.technician_day_cost_pen) +
      crewAssts * Number(params.assistant_day_cost_pen)
  );

  const laborMethodBPen = roundMoney(estimatedDays * dailyCrewCostPen);

  let laborAppliedPen;
  if (laborMethod === 'method_a') {
    laborAppliedPen = laborMethodAPen;
  } else if (laborMethod === 'method_b') {
    laborAppliedPen = laborMethodBPen;
  } else {
    laborAppliedPen = Math.max(laborMethodAPen, laborMethodBPen);
  }

  const travelCostPen = roundMoney(estimatedDays * Number(params.default_travel_cost_per_day_pen));
  const directCostPen = roundMoney(materialsCostPen + laborAppliedPen + travelCostPen);
  const overheadAmountPen = roundMoney(directCostPen * (overheadPct / 100));
  const totalCostPen = roundMoney(directCostPen + overheadAmountPen);

  let saleValueBeforeDiscountPen =
    totalCostPen > 0 ? roundMoney(totalCostPen / (1 - targetMarginPct / 100)) : 0.0;

  let includedServicesSalePen = 0.0;
  let includedServicesCostPen = 0.0;
  let informativeServicesSalePen = 0.0;

  for (const srv of input.service_lines || []) {
    const srvQty = Number(srv.quantity ?? 1);
    const srvPrice = roundMoney(srvQty * Number(srv.unit_price_pen ?? 0));
    const srvCost = roundMoney(srvQty * Number(srv.unit_cost_pen ?? 0));
    if (srv.is_included_in_quote_total) {
      includedServicesSalePen = roundMoney(includedServicesSalePen + srvPrice);
      includedServicesCostPen = roundMoney(includedServicesCostPen + srvCost);
    } else {
      informativeServicesSalePen = roundMoney(informativeServicesSalePen + srvPrice);
    }
  }

  saleValueBeforeDiscountPen = roundMoney(saleValueBeforeDiscountPen + includedServicesSalePen);
  const effectiveTotalCostPen = roundMoney(totalCostPen + includedServicesCostPen);

  const discountAmountPen = roundMoney(saleValueBeforeDiscountPen * (discountPct / 100));
  const taxableBasePen = roundMoney(saleValueBeforeDiscountPen - discountAmountPen);
  const taxAmountPen = roundMoney(taxableBasePen * (taxPct / 100));
  const totalWithTaxPen = roundMoney(taxableBasePen + taxAmountPen);

  const effectiveMarginPct =
    taxableBasePen > 0
      ? roundMoney(((taxableBasePen - effectiveTotalCostPen) / taxableBasePen) * 100)
      : 0.0;

  // Prorrateo de precios de venta por línea sin exponer costos
  const factorPrice = materialsCostPen > 0 ? taxableBasePen / materialsCostPen : 1.0;
  let accumulatedSale = 0;
  calculatedLines.forEach((cLine, idx) => {
    const qty = Math.max(0.01, Number(cLine.quantity || 1));
    let lineSale = roundMoney(cLine.line_materials_cost_pen * factorPrice);
    if (idx === calculatedLines.length - 1 && calculatedLines.length > 0 && includedServicesSalePen === 0) {
      lineSale = roundMoney(taxableBasePen - accumulatedSale);
    }
    accumulatedSale = roundMoney(accumulatedSale + lineSale);
    cLine.unit_price_pen = roundMoney(lineSale / qty);
    cLine.line_sale_subtotal_pen = lineSale;
  });

  const crewComparison = buildCrewComparison(totalHours, params, efficiencies);

  const alerts = [];
  let requiresApproval = false;

  if (discountPct > Number(params.seller_max_discount_pct)) {
    requiresApproval = true;
    alerts.push({
      code: 'DISCOUNT_ABOVE_LIMIT',
      level: 'warning',
      message: `El descuento solicitado (${discountPct.toFixed(2)}%) supera el límite autónomo del vendedor (${Number(params.seller_max_discount_pct).toFixed(2)}%). Requiere aprobación de Gerencia.`,
    });
  }

  if (taxableBasePen > 0 && effectiveMarginPct < Number(params.min_margin_on_sale_pct)) {
    requiresApproval = true;
    alerts.push({
      code: 'MARGIN_BELOW_MIN',
      level: 'danger',
      message: `El margen efectivo (${effectiveMarginPct.toFixed(2)}%) es inferior al margen mínimo permitido (${Number(params.min_margin_on_sale_pct).toFixed(2)}%). Requiere aprobación de Gerencia.`,
    });
  }

  return {
    crew_technicians: crewTechs,
    crew_assistants: crewAssts,
    crew_size: crewSize,
    crew_efficiency_pct: crewEffPct,
    daily_capacity_hours: dailyCapacityHours,
    daily_crew_cost_pen: dailyCrewCostPen,
    labor_method: laborMethod,
    total_hours_cabling: totalHoursCabling,
    total_hours_mounting: totalHoursMounting,
    total_hours_config: totalHoursConfig,
    total_hours: totalHours,
    estimated_days: estimatedDays,
    materials_cost_pen: materialsCostPen,
    labor_cost_method_a_pen: laborMethodAPen,
    labor_cost_method_b_pen: laborMethodBPen,
    labor_cost_applied_pen: laborAppliedPen,
    travel_cost_pen: travelCostPen,
    direct_cost_pen: directCostPen,
    overhead_pct: overheadPct,
    overhead_amount_pen: overheadAmountPen,
    total_cost_pen: effectiveTotalCostPen,
    target_margin_on_sale_pct: targetMarginPct,
    sale_value_before_discount_pen: saleValueBeforeDiscountPen,
    discount_pct: discountPct,
    discount_amount_pen: discountAmountPen,
    taxable_base_pen: taxableBasePen,
    tax_pct: taxPct,
    tax_amount_pen: taxAmountPen,
    total_with_tax_pen: totalWithTaxPen,
    effective_margin_on_sale_pct: effectiveMarginPct,
    informative_services_sale_pen: informativeServicesSalePen,
    requires_approval: requiresApproval,
    alerts,
    crew_comparison: crewComparison,
    lines: calculatedLines,
  };
}

const FORBIDDEN_QUOTE_FIELDS = new Set([
  'materials_cost_pen',
  'labor_cost_method_a_pen',
  'labor_cost_method_b_pen',
  'labor_cost_applied_pen',
  'travel_cost_pen',
  'direct_cost_pen',
  'overhead_pct',
  'overhead_amount_pen',
  'total_cost_pen',
  'target_margin_on_sale_pct',
  'effective_margin_on_sale_pct',
  'daily_crew_cost_pen',
  'unit_cost_pen',
  'line_materials_cost_pen',
  'line_method_a_pen',
  'reference_labor_unit_pen',
  'reference_cost_per_point',
  'fixed_supplies_cost_pen',
  'components_cost_pen',
  'supplies_cost_pen',
]);

export function canSeeCosts(role) {
  return role === 'gerencia' || role === 'admin';
}

export function sanitizePayload(data, role) {
  if (canSeeCosts(role)) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item, role));
  }
  if (data !== null && typeof data === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(data)) {
      if (FORBIDDEN_QUOTE_FIELDS.has(k)) {
        continue;
      }
      if (k === 'crew_comparison' && Array.isArray(v)) {
        out[k] = v.map(({ daily_cost_pen, labor_cost_method_b_pen, ...rest }) => rest);
        continue;
      }
      out[k] = sanitizePayload(v, role);
    }
    return out;
  }
  return data;
}
