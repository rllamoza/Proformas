import { canSeeCosts, money, Role } from '../api';

const Row = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
  <div className={`flex justify-between py-1.5 text-sm ${strong ? 'border-t border-slate-300 pt-3 text-base font-extrabold text-primary' : ''}`}>
    <span className={strong ? '' : 'text-muted'}>{k}</span><span className="font-semibold">{v}</span>
  </div>
);

/** Resumen económico filtrado por rol: costos y margen solo para gerencia/admin. */
export function Summary({ calc, role }: { calc: any; role: Role }) {
  const costs = canSeeCosts(role);
  return (
    <div className="neu p-5">
      <h2 className="mb-3 font-bold text-primary">Resumen económico</h2>
      {costs && (<>
        <Row k="Materiales" v={money(calc.materials_cost_pen)} />
        <Row k="Mano de obra (A / B)" v={`${money(calc.labor_cost_method_a_pen)} / ${money(calc.labor_cost_method_b_pen)}`} />
        <Row k="Mano de obra aplicada" v={money(calc.labor_cost_applied_pen)} />
        <Row k="Viáticos" v={money(calc.travel_cost_pen)} />
        <Row k={`Gastos generales (${calc.overhead_pct}%)`} v={money(calc.overhead_amount_pen)} />
        <Row k="Costo total" v={money(calc.total_cost_pen)} strong />
        <div className="my-3 h-px bg-slate-300" />
      </>)}
      <Row k="Jornadas estimadas" v={`${calc.estimated_days ?? 0} días`} />
      <Row k="Valor de venta" v={money(calc.sale_value_before_discount_pen)} />
      <Row k={`Descuento (${calc.discount_pct ?? 0}%)`} v={`- ${money(calc.discount_amount_pen)}`} />
      <Row k="Base imponible" v={money(calc.taxable_base_pen)} />
      <Row k={`IGV (${calc.tax_pct ?? 18}%)`} v={money(calc.tax_amount_pen)} />
      <Row k="TOTAL" v={money(calc.total_with_tax_pen)} strong />
      {costs && <Row k="Margen efectivo" v={`${calc.effective_margin_on_sale_pct}%`} />}
      {(calc.alerts ?? []).map((a: any) => (
        <p key={a.code} className={`mt-3 rounded-xl p-3 text-xs font-medium ${a.level === 'danger' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{a.message}</p>
      ))}
      {calc.requires_approval && <p className="mt-3 text-xs font-bold text-secondary">Requiere aprobación de Gerencia</p>}
    </div>
  );
}
