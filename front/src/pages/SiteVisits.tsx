import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { PageTitle, Icon } from '../Layout';

export default function SiteVisits() {
  const [visits, setVisits] = useState<any[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [modalItem, setModalItem] = useState(false);
  const [modalPhoto, setModalPhoto] = useState(false);
  const [itemForm, setItemForm] = useState<any>({ zone_name: '', quantity: 1, notes: '' });
  const [photoForm, setPhotoForm] = useState<any>({ zone_name: '', caption: '', url: '' });
  const [assemblies, setAssemblies] = useState<any[]>([]);

  const nav = useNavigate();

  const load = async () => {
    try {
      const [v, a] = await Promise.all([api('/site-visits'), api('/assemblies')]);
      setVisits(v);
      setAssemblies(a);
      if (v.length > 0 && !selectedVisit) {
        setSelectedVisit(v[0]);
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

  const notify = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3000);
  };

  const addItem = async () => {
    try {
      await api(`/site-visits/${selectedVisit.id}/items`, { method: 'POST', body: itemForm });
      setModalItem(false);
      setItemForm({ zone_name: '', quantity: 1, notes: '' });
      notify('Ítem de levantamiento agregado.');
      const updated = await api(`/site-visits/${selectedVisit.id}`);
      setSelectedVisit(updated);
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const addPhoto = async () => {
    try {
      await api(`/site-visits/${selectedVisit.id}/photos`, { method: 'POST', body: photoForm });
      setModalPhoto(false);
      setPhotoForm({ zone_name: '', caption: '', url: '' });
      notify('Fotografía técnica registrada.');
      const updated = await api(`/site-visits/${selectedVisit.id}`);
      setSelectedVisit(updated);
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const convertToQuote = async () => {
    try {
      const q = await api(`/site-visits/${selectedVisit.id}/convert-to-quote`, { method: 'POST' });
      notify(`¡Proforma ${q.code} generada exitosamente desde la visita!`);
      setTimeout(() => nav(`/proformas/${q.id}`), 1000);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  if (loading) return <p className="text-muted">Cargando visitas técnicas…</p>;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Levantamiento y Visitas Técnicas"
        sub="Inspecciones de campo, relevamiento de canalizaciones y fotos de pre-instalación"
      >
        {selectedVisit && (
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-container text-white text-xs font-bold transition-all active:scale-95 shadow-neu-accent"
            onClick={convertToQuote}
          >
            <Icon n="receipt_long" className="text-[18px]" />
            Generar Proforma desde Visita
          </button>
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
        {/* Left column (5 cols): Visits list */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted block px-1">
            Visitas Programadas y Completadas
          </span>
          {visits.map((v) => {
            const isSelected = selectedVisit?.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVisit(v)}
                className={`p-5 rounded-2xl bg-[#E5EBF2] cursor-pointer transition-all ${
                  isSelected
                    ? 'shadow-[inset_-4px_-4px_9px_#ffffff,inset_4px_4px_9px_#cbd5e1] ring-2 ring-secondary-container/50'
                    : 'shadow-[-6px_-6px_14px_#ffffff,6px_6px_14px_#cbd5e1] hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold">
                      VISITA #{v.id}
                    </span>
                    <h3 className="text-base font-bold text-primary mt-1">
                      {v.project?.name || 'Proyecto'}
                    </h3>
                    <p className="text-xs text-muted mt-0.5 font-medium">
                      {v.project?.installation_address}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                      v.status === 'completada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-300/40 text-xs text-muted">
                  <span>Técnico: <b>{v.technician?.full_name}</b></span>
                  <span>Ítems: <b>{v.items?.length || 0}</b></span>
                  <span>Fotos: <b>{v.photos?.length || 0}</b></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column (7 cols): Selected visit details */}
        <div className="lg:col-span-7 space-y-5">
          {selectedVisit ? (
            <div
              className="p-6 rounded-2xl bg-[#E5EBF2] space-y-5"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                    Detalle de Inspección Técnica
                  </span>
                  <h2 className="text-xl font-extrabold text-primary mt-1">
                    {selectedVisit.project?.name}
                  </h2>
                  <p className="text-xs text-muted">{selectedVisit.project?.installation_address}</p>
                </div>
                <button
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary flex items-center gap-1"
                  style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                  onClick={() => setModalItem(true)}
                >
                  <Icon n="add" className="text-[16px]" />
                  Agregar Punto
                </button>
              </div>

              {/* Observations & Risks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className="p-3.5 rounded-xl bg-[#E5EBF2] text-xs space-y-1"
                  style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
                >
                  <span className="font-bold text-primary block">Observaciones Generales</span>
                  <p className="text-on-surface-variant">
                    {selectedVisit.general_observations || 'Sin observaciones.'}
                  </p>
                </div>
                <div
                  className="p-3.5 rounded-xl bg-[#E5EBF2] text-xs space-y-1"
                  style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
                >
                  <span className="font-bold text-error block">Riesgos y Dificultades</span>
                  <p className="text-on-surface-variant">
                    {selectedVisit.risks_detected || 'Sin riesgos especiales.'}
                  </p>
                </div>
              </div>

              {/* Relevamiento Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-primary">Equipos y Puntos Relevados</h3>
                  <span className="text-xs text-muted font-semibold">
                    {selectedVisit.items?.length || 0} ítems
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedVisit.items?.map((item: any) => {
                    const asm = assemblies.find((a) => a.id === item.assembly_id);
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-[#E5EBF2] flex items-center justify-between text-xs"
                        style={{ boxShadow: 'inset -2px -2px 4px #ffffff, inset 2px 2px 4px #cbd5e1' }}
                      >
                        <div>
                          <p className="font-bold text-primary">
                            {item.zone_name} • {asm?.name || 'Punto Técnico'}
                          </p>
                          <p className="text-[11px] text-muted">
                            Cable est.: <b>{item.estimated_cable_meters}m</b> • {item.notes}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-primary text-white font-bold text-xs">
                          {item.quantity} {asm?.unit || 'PUNTO'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Photos Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-primary">Fotografías del Sitio</h3>
                  <button
                    className="text-xs font-bold text-secondary hover:underline"
                    onClick={() => setModalPhoto(true)}
                  >
                    + Adjuntar Foto
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedVisit.photos?.map((ph: any) => (
                    <div
                      key={ph.id}
                      className="rounded-xl overflow-hidden bg-white/40 p-1.5"
                      style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                    >
                      <img
                        src={ph.url}
                        alt={ph.caption}
                        className="w-full h-24 object-cover rounded-lg mb-1"
                      />
                      <p className="text-[10px] font-bold text-primary truncate">{ph.zone_name}</p>
                      <p className="text-[10px] text-muted truncate">{ph.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* MODAL: Agregar Ítem */}
      {modalItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-md bg-[#E5EBF2] p-6 rounded-2xl space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #cbd5e1' }}
          >
            <h3 className="text-lg font-bold text-primary">Agregar Punto de Levantamiento</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted block mb-1">Zona del Inmueble</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  placeholder="Ej. Fachada Principal, Almacén Central"
                  value={itemForm.zone_name}
                  onChange={(e) => setItemForm({ ...itemForm, zone_name: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">Ensamblaje / Kit</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  value={itemForm.assembly_id}
                  onChange={(e) => setItemForm({ ...itemForm, assembly_id: Number(e.target.value) })}
                >
                  <option value="">Seleccione…</option>
                  {assemblies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-muted block mb-1">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">Metros Cable Est.</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={itemForm.estimated_cable_meters}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, estimated_cable_meters: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">Notas de Montaje</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  placeholder="Detalles de canaleta, altura o perforación"
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted"
                onClick={() => setModalItem(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                onClick={addItem}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Adjuntar Foto */}
      {modalPhoto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-md bg-[#E5EBF2] p-6 rounded-2xl space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #cbd5e1' }}
          >
            <h3 className="text-lg font-bold text-primary">Adjuntar Fotografía Técnica</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted block mb-1">Zona</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  placeholder="Ej. Ingreso vehicular"
                  value={photoForm.zone_name}
                  onChange={(e) => setPhotoForm({ ...photoForm, zone_name: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">Descripción / Leyenda</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  placeholder="Detalle del punto de fijación o tablero"
                  value={photoForm.caption}
                  onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">URL de Imagen</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  placeholder="https://..."
                  value={photoForm.url}
                  onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted"
                onClick={() => setModalPhoto(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-secondary-container text-white text-xs font-bold"
                onClick={addPhoto}
              >
                Guardar Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
