import { useEffect, useState } from 'react';
import { api, canSeeCosts, money } from '../api';
import { useAuth } from '../auth';
import { PageTitle, Icon } from '../Layout';

export default function WorkOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [modalLog, setModalLog] = useState(false);
  const [logForm, setLogForm] = useState<any>({
    hours_worked: 7,
    activity_type: 'mounting',
    notes: '',
  });

  const costs = canSeeCosts(user?.role);

  const load = async () => {
    try {
      const data = await api('/work-orders');
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        selectOrder(data[0]);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectOrder = async (wo: any) => {
    setSelectedOrder(wo);
    if (costs) {
      try {
        const comp = await api(`/work-orders/${wo.id}/comparison`);
        setComparison(comp);
      } catch {
        setComparison(null);
      }
    }
  };

  const notify = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3000);
  };

  const addLog = async () => {
    try {
      await api(`/work-orders/${selectedOrder.id}/logs`, { method: 'POST', body: logForm });
      setModalLog(false);
      setLogForm({ hours_worked: 7, activity_type: 'mounting', notes: '' });
      notify('Horas y avance registrado.');
      const updated = await api(`/work-orders/${selectedOrder.id}`);
      selectOrder(updated);
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const updated = await api(`/work-orders/${selectedOrder.id}`, {
        method: 'PUT',
        body: { status },
      });
      notify(`Estado de orden actualizado a ${status}.`);
      selectOrder(updated);
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  if (loading) return <p className="text-muted">Cargando órdenes de trabajo…</p>;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Órdenes de Trabajo y Ejecución en Campo"
        sub="Control de actividades técnicas, registro de HH y liquidación final contra cotización"
      >
        {selectedOrder && (
          <div className="flex gap-2">
            {selectedOrder.status === 'pendiente' && (
              <button
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                onClick={() => updateStatus('en_ejecucion')}
              >
                Iniciar Trabajos
              </button>
            )}
            {selectedOrder.status === 'en_ejecucion' && (
              <button
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
                onClick={() => updateStatus('finalizada')}
              >
                Finalizar Obra
              </button>
            )}
            <button
              className="px-4 py-2 rounded-xl bg-secondary-container text-white text-xs font-bold flex items-center gap-1.5"
              onClick={() => setModalLog(true)}
            >
              <Icon n="schedule" className="text-[16px]" />
              Registrar Jornada HH
            </button>
          </div>
        )}
      </PageTitle>

      {msg && (
        <div
          className="p-3 bg-[#E5EBF2] rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2"
          style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
        >
          <Icon n="check_circle" className="text-emerald-700" />
          {msg}
        </div>
      )}
      {err && (
        <div
          className="p-3 bg-[#E5EBF2] rounded-xl text-xs font-bold text-error flex items-center gap-2"
          style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
        >
          <Icon n="error" className="text-error" />
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column (5 cols): Orders list */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted block px-1">
            Órdenes Asignadas
          </span>
          {orders.map((wo) => {
            const isSelected = selectedOrder?.id === wo.id;
            return (
              <div
                key={wo.id}
                onClick={() => selectOrder(wo)}
                className={`p-5 rounded-2xl bg-[#E5EBF2] cursor-pointer transition-all ${
                  isSelected
                    ? 'shadow-[inset_-4px_-4px_9px_#ffffff,inset_4px_4px_9px_#cbd5e1] ring-2 ring-secondary-container/50'
                    : 'shadow-[-6px_-6px_14px_#ffffff,6px_6px_14px_#cbd5e1] hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold">
                      {wo.code}
                    </span>
                    <h3 className="text-base font-bold text-primary mt-1">
                      {wo.quote?.project?.name || `Proforma ${wo.quote?.code}`}
                    </h3>
                    <p className="text-xs text-muted font-medium">
                      Cliente: {wo.quote?.customer?.business_name}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                      wo.status === 'finalizada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : wo.status === 'en_ejecucion'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {wo.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-300/40 text-xs text-muted">
                  <span>Técnico Líder: <b>{wo.lead_technician?.full_name}</b></span>
                  <span>Jornadas: <b>{wo.logs?.length || 0}</b></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column (7 cols): Work order execution details & comparison */}
        <div className="lg:col-span-7 space-y-5">
          {selectedOrder ? (
            <div
              className="p-6 rounded-2xl bg-[#E5EBF2] space-y-5"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                    Control Operativo de Obra
                  </span>
                  <h2 className="text-xl font-extrabold text-primary mt-1">
                    {selectedOrder.code} — {selectedOrder.quote?.project?.name}
                  </h2>
                  <p className="text-xs text-muted">
                    Proforma Original: <b>{selectedOrder.quote?.code} v{selectedOrder.quote?.version}</b>
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-surface text-secondary font-bold text-xs shadow-neu-xs">
                  {selectedOrder.status.toUpperCase()}
                </span>
              </div>

              {/* Logs of actual work */}
              <div>
                <h3 className="text-sm font-bold text-primary mb-2">Bitácora de Horas de Campo</h3>
                <div className="space-y-2">
                  {selectedOrder.logs?.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#E5EBF2] flex items-center justify-between text-xs"
                      style={{ boxShadow: 'inset -2px -2px 4px #ffffff, inset 2px 2px 4px #cbd5e1' }}
                    >
                      <div>
                        <p className="font-bold text-primary">
                          {log.work_date} • Actividad:{' '}
                          <span className="capitalize text-secondary">{log.activity_type}</span>
                        </p>
                        <p className="text-[11px] text-muted">{log.notes || 'Sin observaciones'}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-primary-container text-white font-bold text-xs">
                        {log.hours_worked} HH
                      </span>
                    </div>
                  ))}
                  {(!selectedOrder.logs || selectedOrder.logs.length === 0) && (
                    <p className="text-xs text-muted text-center py-3">
                      No hay jornadas registradas para esta orden aún.
                    </p>
                  )}
                </div>
              </div>

              {/* Financial Comparison: Quoted vs Actual (Gerencia / Admin only) */}
              {costs && comparison && (
                <div
                  className="p-5 rounded-2xl bg-[#E5EBF2] space-y-3"
                  style={{ boxShadow: '-4px -4px 10px #ffffff, 4px 4px 10px #cbd5e1' }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-primary">
                      Liquidación Financiera: Cotizado vs Real
                    </h3>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        comparison.variance.margin_diff_pct >= 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      Variación Margen: {comparison.variance.margin_diff_pct > 0 ? '+' : ''}
                      {comparison.variance.margin_diff_pct}%
                    </span>
                  </div>

                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase font-bold text-muted border-b border-slate-300/60">
                      <tr>
                        <th className="py-2">Concepto</th>
                        <th className="text-right">Cotizado</th>
                        <th className="text-right">Real de Obra</th>
                        <th className="text-right">Desviación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300/40">
                      <tr>
                        <td className="py-2">Costo Materiales</td>
                        <td className="text-right">{money(comparison.quoted.materials_cost_pen)}</td>
                        <td className="text-right">{money(comparison.actual.materials_cost_pen)}</td>
                        <td className="text-right font-semibold">
                          {money(
                            comparison.actual.materials_cost_pen -
                              comparison.quoted.materials_cost_pen
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">Horas Hombre (HH)</td>
                        <td className="text-right">{comparison.quoted.total_hours} h</td>
                        <td className="text-right">{comparison.actual.total_hours} h</td>
                        <td className="text-right font-semibold">
                          {comparison.variance.hours_diff > 0 ? '+' : ''}
                          {comparison.variance.hours_diff} h
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">Mano de Obra (S/)</td>
                        <td className="text-right">{money(comparison.quoted.labor_cost_applied_pen)}</td>
                        <td className="text-right">{money(comparison.actual.labor_cost_pen)}</td>
                        <td className="text-right font-semibold">
                          {money(
                            comparison.actual.labor_cost_pen -
                              comparison.quoted.labor_cost_applied_pen
                          )}
                        </td>
                      </tr>
                      <tr className="font-bold text-primary">
                        <td className="py-2">Costo Total Proyecto</td>
                        <td className="text-right">{money(comparison.quoted.total_cost_pen)}</td>
                        <td className="text-right">{money(comparison.actual.total_cost_pen)}</td>
                        <td
                          className={`text-right ${
                            comparison.variance.cost_diff_pen <= 0
                              ? 'text-emerald-700'
                              : 'text-error'
                          }`}
                        >
                          {comparison.variance.cost_diff_pen > 0 ? '+' : ''}
                          {money(comparison.variance.cost_diff_pen)}
                        </td>
                      </tr>
                      <tr className="font-bold text-secondary">
                        <td className="py-2">Margen Efectivo %</td>
                        <td className="text-right">{comparison.quoted.margin_pct}%</td>
                        <td className="text-right">{comparison.actual.margin_pct}%</td>
                        <td className="text-right">{comparison.variance.margin_diff_pct}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* MODAL: Registrar Jornada HH */}
      {modalLog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-md bg-[#E5EBF2] p-6 rounded-2xl space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #cbd5e1' }}
          >
            <h3 className="text-lg font-bold text-primary">Registrar Jornada de Trabajo</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-muted block mb-1">Horas Trabajadas</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={logForm.hours_worked}
                    onChange={(e) =>
                      setLogForm({ ...logForm, hours_worked: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">Tipo de Tarea</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    value={logForm.activity_type}
                    onChange={(e) => setLogForm({ ...logForm, activity_type: e.target.value })}
                  >
                    <option value="cabling">Tendido y Cableado</option>
                    <option value="mounting">Montaje y Fijación</option>
                    <option value="config">Configuración & Pruebas</option>
                    <option value="support">Soporte y Cierre</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">Actividad Realizada</label>
                <textarea
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  placeholder="Detalle de puntos terminados o incidencias de campo"
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted"
                onClick={() => setModalLog(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                onClick={addLog}
              >
                Guardar Horas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
