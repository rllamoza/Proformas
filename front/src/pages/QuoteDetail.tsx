import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, canSeeCosts, STATUS_STYLE } from '../api';
import { useAuth } from '../auth';
import { Icon } from '../Layout';
import { Summary } from '../components/Summary';
import { CorporateProformaDocument } from '../components/CorporateProformaDocument';

export default function QuoteDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [q, setQ] = useState<any>(null);
  const [err, setErr] = useState('');
  const [showCostPanel, setShowCostPanel] = useState(false);

  const load = useCallback(() => {
    api(`/quotes/${id}`).then(setQ);
  }, [id]);

  useEffect(load, [load]);

  if (!q || !user) return <p className="text-muted p-6">Cargando proforma corporativa…</p>;

  const act = async (a: string, body?: unknown) => {
    setErr('');
    try {
      setQ(await api(`/quotes/${id}/${a}`, { method: 'POST', body }));
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const openPdf = (autoPrint = false) => {
    const suffix = autoPrint ? '?print=1' : '';
    window.open(`/api/v1/quotes/${id}/pdf${suffix}`, '_blank');
  };

  const openExcel = () => window.open(`/api/v1/quotes/${id}/excel`, '_blank');
  const mgr = canSeeCosts(user.role);

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera de Control y Acciones Operativas */}
      <div
        className="bg-[#E5EBF2] rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden"
        style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <Link to="/proformas" className="hover:text-secondary flex items-center gap-1">
              <Icon n="arrow_back" className="text-[15px]" />
              Proformas Comerciales
            </Link>
            <span>/</span>
            <span className="text-primary font-extrabold">{q.code}</span>
            <span className={`badge ${STATUS_STYLE[q.status]} ml-1`}>{q.status}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
            {q.customer?.business_name} —{' '}
            <span className="text-secondary">{q.project?.name || q.project_title}</span>
          </h1>
        </div>

        {/* Botonera de Acciones y Exportación PDF Corporativo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {q.status === 'borrador' && (
            <Link
              className="px-3.5 py-2 rounded-xl bg-[#E5EBF2] text-xs font-extrabold text-primary hover:text-secondary flex items-center gap-1.5"
              style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #c5cdd6' }}
              to={`/proformas/${q.id}/editar`}
            >
              <Icon n="edit" className="text-[16px]" />
              Editar Proforma
            </Link>
          )}
          {q.status === 'borrador' && !q.requires_approval && (
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-extrabold flex items-center gap-1.5"
              onClick={() => act('issue')}
            >
              <Icon n="verified" className="text-[16px]" />
              Emitir Oficialmente
            </button>
          )}
          {q.status === 'borrador' && q.requires_approval && !q.approved && (
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-extrabold flex items-center gap-1.5"
              onClick={() => act('request-approval')}
            >
              <Icon n="gavel" className="text-[16px]" />
              Solicitar Aprobación
            </button>
          )}
          {q.status === 'borrador' && q.requires_approval && q.approved && (
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-extrabold flex items-center gap-1.5"
              onClick={() => act('issue')}
            >
              <Icon n="verified" className="text-[16px]" />
              Emitir Proforma
            </button>
          )}
          {q.status === 'en_aprobacion' && mgr && (
            <>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5"
                onClick={() => act('approve', {})}
              >
                <Icon n="check_circle" className="text-[16px]" />
                Aprobar Proforma
              </button>
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-red-100 text-red-800 text-xs font-extrabold flex items-center gap-1.5"
                onClick={() => act('reject', { comment: 'Observada por Gerencia' })}
              >
                <Icon n="cancel" className="text-[16px]" />
                Rechazar
              </button>
            </>
          )}
          {q.status === 'emitida' && (
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-extrabold flex items-center gap-1.5"
              onClick={() => act('mark-sent')}
            >
              <Icon n="send" className="text-[16px]" />
              Marcar Enviada
            </button>
          )}
          {q.status === 'enviada' && (
            <>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5"
                onClick={() => act('customer-response', { accepted: true })}
              >
                <Icon n="thumb_up" className="text-[16px]" />
                Cliente Aceptó
              </button>
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-red-100 text-red-800 text-xs font-extrabold flex items-center gap-1.5"
                onClick={() => act('customer-response', { accepted: false })}
              >
                <Icon n="thumb_down" className="text-[16px]" />
                Cliente Rechazó
              </button>
            </>
          )}
          {!['borrador', 'en_aprobacion'].includes(q.status) && (
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-[#E5EBF2] text-xs font-extrabold text-primary hover:text-secondary flex items-center gap-1.5"
              style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #c5cdd6' }}
              onClick={() => act('new-version')}
            >
              <Icon n="history" className="text-[16px]" />
              Nueva Versión
            </button>
          )}

          {mgr && (
            <button
              type="button"
              onClick={() => setShowCostPanel(!showCostPanel)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                showCostPanel ? 'bg-primary text-white' : 'bg-[#E5EBF2] text-primary hover:text-secondary'
              }`}
              style={
                showCostPanel
                  ? undefined
                  : { boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #c5cdd6' }
              }
            >
              <Icon n="analytics" className="text-[16px]" />
              {showCostPanel ? 'Ocultar Costeo Interno' : 'Auditoría de Costos'}
            </button>
          )}

          {mgr && (
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-[#E5EBF2] text-xs font-extrabold text-primary hover:text-secondary flex items-center gap-1.5"
              style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #c5cdd6' }}
              onClick={openExcel}
            >
              <Icon n="table_view" className="text-[16px]" />
              Excel Costeo
            </button>
          )}

          <button
            type="button"
            onClick={() => openPdf(false)}
            className="px-4 py-2 rounded-xl bg-[#E5EBF2] text-xs font-extrabold text-primary hover:text-secondary flex items-center gap-1.5"
            style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #c5cdd6' }}
          >
            <Icon n="open_in_new" className="text-secondary text-[16px]" />
            Ver PDF A4
          </button>

          <button
            type="button"
            onClick={() => openPdf(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff752b] to-[#b13e00] text-white text-xs font-extrabold flex items-center gap-2 transition-all active:scale-95"
            style={{ boxShadow: '-4px -4px 10px #ffffff, 4px 4px 12px rgba(177, 62, 0, 0.35)' }}
          >
            <Icon n="picture_as_pdf" className="text-[18px]" />
            Imprimir / Descargar PDF A4
          </button>
        </div>
      </div>

      {err && (
        <p className="rounded-xl bg-red-100 p-3 text-sm font-medium text-red-800 print:hidden">
          {err}
        </p>
      )}

      {/* Panel de Auditoría de Costos Interno (Opcional para Gerencia/Admin) */}
      {mgr && showCostPanel && (
        <div className="print:hidden">
          <Summary calc={q} role={user.role} />
        </div>
      )}

      {/* Documento Corporativo A4 con Marcas de Redes y Cámaras al Pie de Página */}
      <div className="max-w-5xl mx-auto">
        <CorporateProformaDocument quote={q} />
      </div>
    </div>
  );
}
