import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, canSeeCosts, money } from '../api';
import { useAuth } from '../auth';
import { Icon } from '../Layout';
import { CorporateProformaDocument } from '../components/CorporateProformaDocument';

const STEPS = [
  { step: 'Paso 1', title: 'Cliente y Proyecto', icon: 'domain' },
  { step: 'Paso 2', title: 'Zonas y Equipos', icon: 'videocam' },
  { step: 'Paso 3', title: 'Servicios y M.O.', icon: 'engineering' },
  { step: 'Paso 4', title: 'Resumen y Cierre', icon: 'receipt_long' },
];

export default function QuoteWizard() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [step, setStep] = useState(0);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [calc, setCalc] = useState<any>(null);

  // Step 1 State
  const [customerId, setCustomerId] = useState<number | ''>(3);
  const [docType, setDocType] = useState<'RUC' | 'DNI'>('RUC');
  const [docNumber, setDocNumber] = useState('20548912304');
  const [businessName, setBusinessName] = useState('CORPORACIÓN LOGÍSTICA DEL PACÍFICO S.A.C.');
  const [sunatStatus, setSunatStatus] = useState('HABIDO / ACTIVO');
  const [contactName, setContactName] = useState('Ing. Roberto Valdivia (Jefe de Operaciones)');
  const [contactPhone, setContactPhone] = useState('+51 998 452 110');
  const [contactEmail, setContactEmail] = useState('rvaldivia@corplogistica.com.pe');

  const [project, setProject] = useState({
    name: 'Implementación CCTV IP + Fibra Óptica Almacén Central Lurín',
    property_type: 'planta_industrial',
    specialty: 'CCTV IP + Cableado Estructurado',
    floors: 2,
    installation_address: 'Av. Los Eucaliptos Mz. D Lt. 14 - Zona Industrial Lurín',
    district: 'Lurín (Zona Sur - Flete Nivel 2)',
    access_notes: 'Trabajos en altura 6m (Requiere SCTR y Tijera Eléctrica)',
  });

  // Step 2 State
  const [zones, setZones] = useState<any[]>([
    { id: 1, name: 'Zona 1: Perímetro y Accesos', difficulty_factor: 1.15 },
    { id: 2, name: 'Zona 2: Nave de Almacén', difficulty_factor: 1.25 },
    { id: 3, name: 'Zona 3: Admin & Sala TI', difficulty_factor: 1.0 },
  ]);
  const [activeZoneName, setActiveZoneName] = useState('Zona 1: Perímetro y Accesos');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [lines, setLines] = useState<any[]>([
    { assembly_id: 1, quantity: 4, zone_name: 'Zona 1: Perímetro y Accesos' },
    { assembly_id: 2, quantity: 2, zone_name: 'Zona 2: Nave de Almacén' },
    { assembly_id: 3, quantity: 1, zone_name: 'Zona 3: Admin & Sala TI' },
    { assembly_id: 4, quantity: 1, zone_name: 'Zona 3: Admin & Sala TI' },
  ]);

  // Step 3 State
  const [crew, setCrew] = useState({ crew_technicians: 1, crew_assistants: 1 });
  const [shiftType, setShiftType] = useState<'diurno' | 'nocturno' | 'finde'>('diurno');
  const [method, setMethod] = useState('max_ab');
  const [discount, setDiscount] = useState(0);
  const [svc, setSvc] = useState<any[]>([]);
  const [logisticsItems, setLogisticsItems] = useState([
    { id: 'transporte', name: 'Transporte y Combustible', detail: 'Camioneta Técnica • Lima Metropolitana', amount: 350, checked: true },
    { id: 'alimentacion', name: 'Alimentación en Obra', detail: 'Menú Ejecutivo • Personal de Campo', amount: 480, checked: true },
    { id: 'sctr', name: 'Seguro SCTR Salud y Pensión', detail: 'Póliza Riesgo Alto + Examen Médico', amount: 320, checked: true },
    { id: 'andamios', name: 'Alquiler Andamios / EPPs Altura', detail: '2 Cuerpos Normados + Líneas de Vida', amount: 250, checked: false },
  ]);

  // Step 4 State
  const [conditions, setConditions] = useState({
    includes_text: 'Equipos homologados, materiales de fijación, mano de obra certificada, configuración y pruebas.',
    excludes_text: 'Obras civiles mayores, suministro eléctrico 220V estabilizado y trámites municipales.',
    payment_terms_text: '50% adelanto a la firma de la Orden de Compra, 50% contra acta de conformidad técnica.',
    warranty_text: '24 meses en equipamiento electrónico por defecto de fábrica y 12 meses en instalación.',
    validity_days: '15 Días Calendario',
    currency_label: 'Soles (S/ PEN)',
  });

  useEffect(() => {
    Promise.all([
      api('/customers'),
      api('/assemblies'),
      api('/products'),
      api('/services'),
      api('/settings'),
    ]).then(([cList, aList, pList, sList, stData]) => {
      setCustomers(cList);
      setAssemblies(aList);
      setProducts(pList);
      setServices(sList);
      setSettings(stData);
    });

    if (id) {
      api(`/quotes/${id}`).then((q) => {
        setCustomerId(q.customer_id);
        if (q.customer) {
          setDocType((q.customer.document_type as any) || 'RUC');
          setDocNumber(q.customer.document_number || '');
          setBusinessName(q.customer.business_name || '');
          setContactName(q.customer.contact_name || contactName);
          setContactPhone(q.customer.phone || contactPhone);
          setContactEmail(q.customer.email || contactEmail);
        }
        if (q.project) {
          setProject((prev) => ({ ...prev, ...q.project }));
        } else if (q.project_title) {
          setProject((prev) => ({ ...prev, name: q.project_title }));
        }
        if (q.zones?.length) {
          setZones(q.zones);
          setActiveZoneName(q.zones[0].name);
        }
        if (q.lines?.length) setLines(q.lines);
        if (q.crew_technicians !== undefined) {
          setCrew({
            crew_technicians: q.crew_technicians ?? 1,
            crew_assistants: q.crew_assistants ?? 1,
          });
        }
        if (q.labor_method) setMethod(q.labor_method);
        if (q.discount_pct !== undefined) setDiscount(q.discount_pct);
        if (q.service_lines) setSvc(q.service_lines);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3200);
  };

  const payload = useMemo(
    () => ({
      customer_id: customerId || 1,
      project,
      zones,
      lines,
      ...crew,
      labor_method: method,
      discount_pct: discount,
      service_lines: svc,
      ...conditions,
    }),
    [customerId, project, zones, lines, crew, method, discount, svc, conditions]
  );

  // Cálculo en vivo contra el motor del backend
  useEffect(() => {
    const t = setTimeout(() => {
      api('/quotes/preview-calculation', { method: 'POST', body: payload })
        .then(setCalc)
        .catch((e) => setErr(e.message));
    }, 180);
    return () => clearTimeout(t);
  }, [payload]);

  if (!user) return null;
  const costs = canSeeCosts(user.role);
  const params = settings?.labor_params;
  const overLimit = params && discount > params.seller_max_discount_pct && !costs;

  const handleSelectCustomer = (cId: number) => {
    setCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setDocType((found.document_type as any) || 'RUC');
      setDocNumber(found.document_number || '');
      setBusinessName(found.business_name || '');
      setContactName(found.contact_name || 'Contacto Comercial');
      setContactPhone(found.phone || '+51 999 111 222');
      setContactEmail(found.email || 'compras@empresa.pe');
    }
  };

  const handleLookupSunat = async () => {
    try {
      const r = await api(`/customers/lookup?document=${encodeURIComponent(docNumber)}`);
      setBusinessName(r.business_name);
      if (r.fiscal_address) {
        setProject((prev) => ({
          ...prev,
          installation_address: prev.installation_address || r.fiscal_address,
        }));
      }
      setSunatStatus(r.sunat_status || 'HABIDO / ACTIVO');
      notify(`RUC/DNI ${docNumber} validado en padrón SUNAT.`);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const addAssemblyLine = (asmId: number) => {
    const a = assemblies.find((x) => x.id === asmId);
    if (!a) return;
    setLines([
      ...lines,
      {
        assembly_id: a.id,
        quantity: 1,
        zone_name: activeZoneName || zones[0]?.name || 'Zona General',
      },
    ]);
    notify(`Kit "${a.name}" asignado a ${activeZoneName}.`);
  };

  const addProductLine = (prodId: number) => {
    const p = products.find((x) => x.id === prodId);
    if (!p) return;
    setLines([
      ...lines,
      {
        product_id: p.id,
        code: p.sku,
        description: p.name,
        unit: p.unit || 'UND',
        unit_cost_pen: p.unit_cost_pen ?? p.cost_pen ?? 318,
        quantity: 1,
        zone_name: activeZoneName || zones[0]?.name || 'Zona General',
      },
    ]);
    notify(`Equipo "${p.sku}" asignado a ${activeZoneName}.`);
  };

  const setLine = (i: number, patch: any) =>
    setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const save = async (after?: 'detail' | 'issue') => {
    setErr('');
    try {
      let targetCustomerId = customerId;
      if (!targetCustomerId || !customers.some((c) => c.id === Number(targetCustomerId))) {
        const existingByDoc = customers.find((c) => c.document_number === docNumber);
        if (existingByDoc) {
          targetCustomerId = existingByDoc.id;
        } else {
          const createdCust = await api('/customers', {
            method: 'POST',
            body: {
              document_type: docType,
              document_number: docNumber,
              business_name: businessName,
              contact_name: contactName,
              phone: contactPhone,
              email: contactEmail,
            },
          });
          targetCustomerId = createdCust.id;
        }
      }

      const proj = await api('/projects', {
        method: 'POST',
        body: { ...project, customer_id: targetCustomerId },
      });

      const body = {
        ...payload,
        customer_id: targetCustomerId,
        project_id: proj.id,
        project_title: project.name,
      };

      const q = id
        ? await api(`/quotes/${id}`, { method: 'PUT', body })
        : await api('/quotes', { method: 'POST', body });

      if (after === 'issue') {
        try {
          if (q.requires_approval && !costs) {
            await api(`/quotes/${q.id}/request-approval`, { method: 'POST' });
          } else {
            await api(`/quotes/${q.id}/issue`, { method: 'POST' });
          }
        } catch {
          // continúa al detalle
        }
        nav(`/proformas/${q.id}`);
      } else if (after === 'detail') {
        nav(`/proformas/${q.id}`);
      } else {
        notify(`Borrador ${q.code} guardado correctamente.`);
      }
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const canNext =
    step === 0
      ? Boolean(businessName.trim() && project.name.trim())
      : step === 1
      ? lines.length > 0
      : true;

  const spotDetraccionPen = Math.round((calc?.total_with_tax_pen || 0) * 0.04 * 100) / 100;

  return (
    <div className="space-y-6 pb-8">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#10294d] px-5 py-3.5 text-xs font-bold text-white shadow-xl"
          style={{ boxShadow: '-4px -4px 10px rgba(255,255,255,0.6), 6px 6px 16px rgba(16,41,77,0.45)' }}
        >
          <Icon n="check_circle" className="text-[#ff752b] text-[18px]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header Bar (Screens 08..14) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/proformas"
            className="w-9 h-9 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-primary hover:text-secondary transition-all active:scale-95"
            style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
            title="Volver a Proformas"
          >
            <Icon n="arrow_back" className="text-[18px]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-primary tracking-tight">
                {id ? `Editar Proforma #${id}` : 'Nueva Proforma'}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E5EBF2] text-secondary"
                style={{ boxShadow: 'inset 2px 2px 5px #c5cdd6, inset -2px -2px 5px #ffffff' }}
              >
                BORRADOR #PRO-2026-0092
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              Cotización Técnica Multiproyecto • Tipo de Cambio SUNAT: S/{' '}
              {Number(settings?.exchange_rate?.usd_to_pen_sell || 3.75).toFixed(3)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => save()}
            className="px-4 py-2 rounded-xl bg-[#E5EBF2] text-xs font-bold text-primary hover:text-secondary flex items-center gap-2 transition-all active:scale-95"
            style={{ boxShadow: '-4px -4px 8px #ffffff, 4px 4px 8px #c5cdd6' }}
          >
            <Icon n="save" className="text-[16px]" />
            <span>Guardar Borrador</span>
          </button>
        </div>
      </div>

      {/* 4-Step Neumorphic Stepper Header (Screens 08, 10, 12, 14) */}
      <section
        className="bg-[#E5EBF2] rounded-2xl p-4"
        style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, idx) => {
            const isCurrent = step === idx;
            const isDone = idx < step;
            return (
              <button
                key={s.title}
                type="button"
                onClick={() => setStep(idx)}
                className={`flex items-center gap-3.5 p-3 rounded-xl bg-[#E5EBF2] text-left transition-all ${
                  isCurrent
                    ? 'border-l-4 border-[#ff752b]'
                    : isDone
                    ? 'opacity-90 hover:opacity-100'
                    : 'opacity-70 hover:opacity-95'
                }`}
                style={
                  isCurrent || isDone
                    ? { boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }
                    : { boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }
                }
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                    isCurrent
                      ? 'bg-gradient-to-br from-[#ff752b] to-[#b13e00] text-white shadow-md'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#E5EBF2] text-on-surface-variant'
                  }`}
                >
                  <Icon n={isDone ? 'check' : s.icon} className="text-[20px]" />
                </div>
                <div className="min-w-0">
                  <span
                    className={`block text-[10px] font-extrabold uppercase tracking-widest ${
                      isCurrent
                        ? 'text-secondary'
                        : isDone
                        ? 'text-emerald-700'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {s.step} {isDone ? '• Completado' : isCurrent ? '• En Curso' : ''}
                  </span>
                  <span className="block text-sm font-bold text-primary truncate">{s.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {err && (
        <div
          className="rounded-xl bg-[#E5EBF2] p-3 text-xs font-bold text-error flex items-center justify-between"
          style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
        >
          <span>{err}</span>
          <button type="button" onClick={() => setErr('')}>
            <Icon n="close" className="text-[16px]" />
          </button>
        </div>
      )}

      {/* =====================================================================
          PASO 1: CLIENTE Y PROYECTO (Screen 08)
         ===================================================================== */}
      {step === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel (5 cols): Datos del Cliente */}
          <section
            className="lg:col-span-5 bg-[#E5EBF2] rounded-2xl p-6 space-y-5"
            style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-primary"
                  style={{ boxShadow: 'inset 2px 2px 5px #c5cdd6, inset -2px -2px 5px #ffffff' }}
                >
                  <Icon n="business_center" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-primary">Datos del Cliente</h2>
                  <p className="text-xs text-on-surface-variant">
                    Validación Tributaria SUNAT / RENIEC
                  </p>
                </div>
              </div>

              {/* Segmented Toggle: RUC / DNI */}
              <div
                className="flex items-center p-1 rounded-xl bg-[#E5EBF2]"
                style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
              >
                <button
                  type="button"
                  onClick={() => setDocType('RUC')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    docType === 'RUC'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Empresa (RUC)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('DNI')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    docType === 'DNI'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Natural (DNI)
                </button>
              </div>
            </div>

            {/* Quick Customer Selector from DB */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Cargar Cliente Registrado en Cartera
              </label>
              <div
                className="rounded-xl bg-[#E5EBF2] px-3 py-2"
                style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
              >
                <select
                  value={customerId}
                  onChange={(e) => handleSelectCustomer(Number(e.target.value))}
                  className="w-full bg-transparent border-none text-xs font-bold text-primary focus:outline-none cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name} ({c.document_type}: {c.document_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RUC / DNI Search Field + SUNAT Button */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Número de {docType} ({docType === 'RUC' ? '11 dígitos' : '8 dígitos'}) *
              </label>
              <div className="flex gap-2.5">
                <div
                  className="flex-1 flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="badge" className="text-on-surface-variant text-[18px] mr-2.5" />
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength={docType === 'RUC' ? 11 : 8}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-primary focus:outline-none tracking-wide"
                  />
                  <Icon n="verified" className="text-emerald-600 text-[18px]" />
                </div>
                <button
                  type="button"
                  onClick={handleLookupSunat}
                  className="px-4 py-2.5 rounded-xl bg-[#E5EBF2] text-xs font-bold text-primary hover:text-secondary flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                  style={{ boxShadow: '-4px -4px 8px #ffffff, 4px 4px 8px #c5cdd6' }}
                >
                  <Icon n="cloud_sync" className="text-[18px] text-secondary" />
                  <span>Consultar</span>
                </button>
              </div>
            </div>

            {/* Razón Social */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Razón Social / Nombre Fiscal *
                </label>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  {sunatStatus}
                </span>
              </div>
              <div
                className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
              >
                <Icon n="apartment" className="text-on-surface-variant text-[18px] mr-2.5" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Contacto Técnico / Comercial *
              </label>
              <div
                className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
              >
                <Icon n="person" className="text-on-surface-variant text-[18px] mr-2.5" />
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Teléfono / WhatsApp
                </label>
                <div
                  className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="call" className="text-on-surface-variant text-[18px] mr-2" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Correo Electrónico
                </label>
                <div
                  className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="mail" className="text-on-surface-variant text-[18px] mr-2" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Right Panel (7 cols): Alcance del Proyecto y Ubicación */}
          <section
            className="lg:col-span-7 bg-[#E5EBF2] rounded-2xl p-6 space-y-5"
            style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-secondary"
                  style={{ boxShadow: 'inset 2px 2px 5px #c5cdd6, inset -2px -2px 5px #ffffff' }}
                >
                  <Icon n="architecture" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-primary">
                    Alcance del Proyecto y Ubicación
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Parámetros operativos, sede de instalación y condiciones comerciales
                  </p>
                </div>
              </div>
              <span
                className="px-3 py-1 rounded-xl text-xs font-bold text-primary bg-[#E5EBF2] flex items-center gap-1.5"
                style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }}
              >
                <Icon n="location_on" className="text-secondary text-[16px]" />
                Lima Metropolitana
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-12">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Nombre del Proyecto / Referencia de Obra *
                </label>
                <div
                  className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="folder_special" className="text-secondary text-[18px] mr-2.5" />
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) => setProject({ ...project, name: e.target.value })}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Tipo de Instalación (Especialidad) *
                </label>
                <div
                  className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="settings_input_component" className="text-primary text-[18px] mr-2.5" />
                  <select
                    value={project.specialty}
                    onChange={(e) => setProject({ ...project, specialty: e.target.value })}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-primary focus:outline-none cursor-pointer"
                  >
                    <option>CCTV IP + Cableado Estructurado</option>
                    <option>Videovigilancia IP (CCTV Hikvision / Dahua)</option>
                    <option>Fibra Óptica Planta Externa / Interna</option>
                    <option>Control de Acceso Biométrico e Intrusión</option>
                    <option>Detección de Incendios y Tableros Eléctricos</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Tipo de Inmueble y Niveles
                </label>
                <div className="flex gap-2">
                  <div
                    className="flex-1 flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                    style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                  >
                    <select
                      value={project.property_type}
                      onChange={(e) => setProject({ ...project, property_type: e.target.value })}
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-primary focus:outline-none cursor-pointer"
                    >
                      <option value="planta_industrial">Planta Industrial / Almacén</option>
                      <option value="edificio">Edificio Corporativo</option>
                      <option value="oficina">Oficina Comercial</option>
                      <option value="local_comercial">Retail / Local Comercial</option>
                      <option value="casa">Residencia / Condominio</option>
                    </select>
                  </div>
                  <div
                    className="w-24 flex items-center bg-[#E5EBF2] rounded-xl px-3 py-2.5"
                    style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                  >
                    <input
                      type="number"
                      min={1}
                      value={project.floors}
                      onChange={(e) => setProject({ ...project, floors: Number(e.target.value) })}
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-primary text-center focus:outline-none"
                    />
                    <span className="text-[10px] font-bold text-muted ml-1">Pisos</span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Dirección Exacta de Obra / Sede de Instalación *
                </label>
                <div
                  className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="pin_drop" className="text-on-surface-variant text-[18px] mr-2.5" />
                  <input
                    type="text"
                    value={project.installation_address}
                    onChange={(e) =>
                      setProject({ ...project, installation_address: e.target.value })
                    }
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Distrito / Zona Logística
                </label>
                <div
                  className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="map" className="text-on-surface-variant text-[18px] mr-2" />
                  <select
                    value={project.district}
                    onChange={(e) => setProject({ ...project, district: e.target.value })}
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface focus:outline-none cursor-pointer"
                  >
                    <option>Lurín (Zona Sur - Flete Nivel 2)</option>
                    <option>Ate / Santa Anita (Zona Este)</option>
                    <option>Callao / Ventanilla (Zona Puerto)</option>
                    <option>San Isidro / Miraflores / Surco (Zona Centro)</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Condiciones de Acceso (Alturas / EPP)
                </label>
                <div
                  className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="Precision_manufacturing" className="text-on-surface-variant text-[18px] mr-2" />
                  <input
                    type="text"
                    value={project.access_notes}
                    onChange={(e) => setProject({ ...project, access_notes: e.target.value })}
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Commercial Conditions Sub-panel */}
            <div className="pt-3 border-t border-outline-variant/25">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
                <Icon n="gavel" className="text-secondary text-[16px]" />
                Condiciones Comerciales de la Proforma
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5">
                    Moneda de Cotización
                  </label>
                  <div
                    className="flex items-center bg-[#E5EBF2] rounded-xl px-3 py-2"
                    style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                  >
                    <Icon n="currency_exchange" className="text-primary text-[16px] mr-2" />
                    <span className="text-xs font-bold text-primary">Soles (S/ PEN)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5">
                    Validez de la Oferta
                  </label>
                  <div
                    className="flex items-center bg-[#E5EBF2] rounded-xl px-3 py-2"
                    style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                  >
                    <Icon n="event_available" className="text-secondary text-[16px] mr-2" />
                    <span className="text-xs font-bold text-primary">15 Días Calendario</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5">
                    Forma de Pago
                  </label>
                  <div
                    className="flex items-center bg-[#E5EBF2] rounded-xl px-3 py-2"
                    style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                  >
                    <Icon n="account_balance_wallet" className="text-emerald-700 text-[16px] mr-2" />
                    <span className="text-xs font-bold text-primary">50% Adelanto / 50% Conf.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          PASO 2: ZONAS Y EQUIPOS (Screen 10)
         ===================================================================== */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel (4 cols): Zonas de Montaje + Consolidado */}
          <div className="lg:col-span-4 space-y-5">
            <div
              className="bg-[#E5EBF2] rounded-2xl p-5 space-y-4"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-primary flex items-center gap-2">
                    <Icon n="layers" className="text-secondary" />
                    Zonas de Montaje
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Agrupación física y factor de dificultad
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newName = `Zona ${zones.length + 1}: Sector Adicional`;
                    setZones([
                      ...zones,
                      { id: zones.length + 1, name: newName, difficulty_factor: 1.0 },
                    ]);
                    setActiveZoneName(newName);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#E5EBF2] text-xs font-bold text-primary hover:text-secondary flex items-center gap-1"
                  style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }}
                >
                  <Icon n="add" className="text-[16px]" />
                  <span>Nueva Zona</span>
                </button>
              </div>

              <div className="space-y-3">
                {zones.map((z, idx) => {
                  const isSelected = activeZoneName === z.name;
                  const zoneCount = lines.filter((l) => l.zone_name === z.name).length;
                  return (
                    <div
                      key={z.id}
                      onClick={() => setActiveZoneName(z.name)}
                      className={`p-3.5 rounded-xl bg-[#E5EBF2] cursor-pointer transition-all ${
                        isSelected ? 'border-l-4 border-secondary' : ''
                      }`}
                      style={
                        isSelected
                          ? { boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }
                          : { boxShadow: '-4px -4px 8px #ffffff, 4px 4px 8px #c5cdd6' }
                      }
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <input
                          type="text"
                          value={z.name}
                          onChange={(e) => {
                            const updated = e.target.value;
                            setZones(
                              zones.map((item, k) => (k === idx ? { ...item, name: updated } : item))
                            );
                            if (isSelected) setActiveZoneName(updated);
                          }}
                          className="bg-transparent border-none text-xs font-extrabold text-primary focus:outline-none w-full"
                        />
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shrink-0">
                          {zoneCount} ítems
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-on-surface-variant font-medium">Dificultad:</span>
                        <select
                          value={z.difficulty_factor}
                          onChange={(e) =>
                            setZones(
                              zones.map((item, k) =>
                                k === idx
                                  ? { ...item, difficulty_factor: Number(e.target.value) }
                                  : item
                              )
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent border-none text-[11px] font-bold text-secondary focus:outline-none cursor-pointer"
                        >
                          <option value={1.0}>Estándar / Normal (×1.00)</option>
                          <option value={1.15}>Altura &gt; 3.5m / Canaleta (×1.15)</option>
                          <option value={1.25}>Muro Concreto / Exterior (×1.25)</option>
                          <option value={1.5}>Planta Industrial &gt; 6m (×1.50)</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consolidado de Hardware Card (Screen 10) */}
            <div
              className="bg-[#E5EBF2] rounded-2xl p-5 space-y-3 border-l-4 border-primary"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Icon n="inventory_2" className="text-secondary text-[16px]" />
                Consolidado de Hardware y Kits
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Partidas Configuradas:</span>
                  <b className="text-primary">{lines.length} líneas</b>
                </div>
                {costs && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Costo Materiales (PEN):</span>
                    <b className="text-primary">{money(calc?.materials_cost_pen)}</b>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Horas Técnicas Estimadas:</span>
                  <b className="text-secondary">{calc?.total_hours ?? 0} hrs</b>
                </div>
                <div className="flex justify-between pt-2 border-t border-outline-variant/25 text-sm">
                  <span className="font-bold text-primary">Venta Proyectada c/IGV:</span>
                  <b className="font-extrabold text-primary">{money(calc?.total_with_tax_pen)}</b>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel (8 cols): Catálogo y Asignación Directa */}
          <div
            className="lg:col-span-8 bg-[#E5EBF2] rounded-2xl p-6 space-y-5"
            style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/25 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-primary">
                  Catálogo de Kits y Asignación Directa
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Asignando actualmente a: <b className="text-secondary">{activeZoneName}</b>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addAssemblyLine(Number(e.target.value));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#E5EBF2] text-xs font-bold text-primary cursor-pointer focus:outline-none"
                  style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }}
                >
                  <option value="">+ Importar Kit / Ensamblaje…</option>
                  {assemblies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addProductLine(Number(e.target.value));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#E5EBF2] text-xs font-bold text-secondary cursor-pointer focus:outline-none"
                  style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }}
                >
                  <option value="">+ Equipo Individual…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Assigned Items */}
            <div
              className="flex items-center gap-2 rounded-xl bg-[#E5EBF2] px-3.5 py-2"
              style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
            >
              <Icon n="search" className="text-on-surface-variant text-[18px]" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Filtrar partidas asignadas por código, cámara, switch, cableado o zona…"
                className="w-full bg-transparent border-none text-xs font-medium text-primary focus:outline-none"
              />
            </div>

            {/* Assigned Items Table */}
            <div
              className="overflow-x-auto rounded-2xl bg-[#E5EBF2] p-1"
              style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/25 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3 px-3">Código / Partida Técnica</th>
                    <th className="py-3 px-3">Zona Asignada</th>
                    <th className="py-3 px-3 text-center">Cant.</th>
                    <th className="py-3 px-3 text-right">P. Unit. Venta</th>
                    <th className="py-3 px-3 text-right">Subtotal Venta</th>
                    <th className="py-3 px-3 text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {lines.map((l, i) => {
                    const asm = assemblies.find((x) => x.id === l.assembly_id);
                    const prod = products.find((x) => x.id === l.product_id);
                    const calcLine = calc?.lines?.[i];
                    const code = asm?.code || prod?.sku || l.code || 'ITEM';
                    const name = asm?.name || prod?.name || l.description || 'Partida';
                    if (
                      catalogSearch &&
                      !code.toLowerCase().includes(catalogSearch.toLowerCase()) &&
                      !name.toLowerCase().includes(catalogSearch.toLowerCase())
                    ) {
                      return null;
                    }
                    return (
                      <tr key={i} className="hover:bg-white/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-secondary text-[11px]">
                            {code}
                          </div>
                          <div className="font-bold text-primary">{name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={l.zone_name || zones[0]?.name}
                            onChange={(e) => setLine(i, { zone_name: e.target.value })}
                            className="rounded-lg bg-[#E5EBF2] px-2 py-1 text-[11px] font-bold text-primary focus:outline-none"
                            style={{ boxShadow: '-2px -2px 4px #ffffff, 2px 2px 4px #c5cdd6' }}
                          >
                            {zones.map((z) => (
                              <option key={z.id} value={z.name}>
                                {z.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setLine(i, { quantity: Math.max(1, Number(l.quantity || 1) - 1) })
                              }
                              className="w-6 h-6 rounded-lg bg-[#E5EBF2] font-bold text-primary"
                              style={{ boxShadow: '-2px -2px 4px #ffffff, 2px 2px 4px #c5cdd6' }}
                            >
                              -
                            </button>
                            <span className="w-7 text-center font-extrabold text-primary">
                              {l.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setLine(i, { quantity: Number(l.quantity || 1) + 1 })
                              }
                              className="w-6 h-6 rounded-lg bg-[#E5EBF2] font-bold text-primary"
                              style={{ boxShadow: '-2px -2px 4px #ffffff, 2px 2px 4px #c5cdd6' }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-on-surface tabular-nums">
                          {money(calcLine?.unit_price_pen)}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-primary tabular-nums">
                          {money(calcLine?.line_sale_subtotal_pen)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setLines(lines.filter((_, k) => k !== i))}
                            className="w-7 h-7 rounded-lg bg-[#E5EBF2] text-error inline-flex items-center justify-center hover:scale-105"
                            style={{ boxShadow: '-2px -2px 4px #ffffff, 2px 2px 4px #c5cdd6' }}
                          >
                            <Icon n="delete" className="text-[15px]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PASO 3: SERVICIOS Y MANO DE OBRA (Screen 12)
         ===================================================================== */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): Cuadrilla Técnica + Viáticos */}
          <div className="lg:col-span-5 space-y-6">
            <div
              className="bg-[#E5EBF2] rounded-2xl p-6 space-y-5"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-secondary"
                    style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                  >
                    <Icon n="groups" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-primary">Cuadrilla Técnica</h2>
                    <p className="text-xs text-on-surface-variant">
                      Dimensionamiento de personal y turnos
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary text-white">
                  Tarifa Lima 2026
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-primary mb-2">
                    Técnicos Líderes (S/ 140/d)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCrew({
                          ...crew,
                          crew_technicians: Math.max(1, crew.crew_technicians - 1),
                        })
                      }
                      className="w-10 h-10 rounded-xl bg-[#E5EBF2] font-bold text-primary"
                      style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }}
                    >
                      -
                    </button>
                    <div
                      className="flex-1 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center font-extrabold text-primary"
                      style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                    >
                      {crew.crew_technicians}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCrew({ ...crew, crew_technicians: crew.crew_technicians + 1 })
                      }
                      className="w-10 h-10 rounded-xl bg-[#E5EBF2] font-bold text-primary"
                      style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary mb-2">
                    Ayudantes Técnicos (S/ 90/d)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCrew({
                          ...crew,
                          crew_assistants: Math.max(0, crew.crew_assistants - 1),
                        })
                      }
                      className="w-10 h-10 rounded-xl bg-[#E5EBF2] font-bold text-primary"
                      style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }}
                    >
                      -
                    </button>
                    <div
                      className="flex-1 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center font-extrabold text-primary"
                      style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                    >
                      {crew.crew_assistants}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCrew({ ...crew, crew_assistants: crew.crew_assistants + 1 })
                      }
                      className="w-10 h-10 rounded-xl bg-[#E5EBF2] font-bold text-primary"
                      style={{ boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Shift / Complexity Selector */}
              <div>
                <label className="block text-xs font-bold text-primary mb-2">
                  Turno y Condición Horaria
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { key: 'diurno', label: 'Diurno Estándar', sub: 'Factor 1.0x', icon: 'wb_sunny' },
                      { key: 'nocturno', label: 'Horario Nocturno', sub: 'Recargo +35%', icon: 'dark_mode' },
                      { key: 'finde', label: 'Fin Semana', sub: 'Recargo +50%', icon: 'event_busy' },
                    ] as const
                  ).map((sh) => {
                    const active = shiftType === sh.key;
                    return (
                      <button
                        key={sh.key}
                        type="button"
                        onClick={() => setShiftType(sh.key)}
                        className={`p-2.5 rounded-xl bg-[#E5EBF2] flex flex-col items-center gap-1 ${
                          active ? 'border border-secondary/30 text-secondary' : 'text-on-surface-variant'
                        }`}
                        style={
                          active
                            ? { boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }
                            : { boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }
                        }
                      >
                        <Icon n={sh.icon} className="text-lg" />
                        <span className="text-[11px] font-bold text-primary">{sh.label}</span>
                        <span className="text-[10px]">{sh.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Viáticos y Logística de Campo Card (Screen 12) */}
            <div
              className="bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-primary"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="local_shipping" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-primary">
                    Viáticos y Logística de Campo
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Movilidad, SCTR, EPPs y facilidades operativas
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {logisticsItems.map((item, idx) => (
                  <label
                    key={item.id}
                    onClick={() =>
                      setLogisticsItems(
                        logisticsItems.map((x, k) =>
                          k === idx ? { ...x, checked: !x.checked } : x
                        )
                      )
                    }
                    className="flex items-center justify-between p-3 rounded-xl bg-[#E5EBF2] cursor-pointer"
                    style={
                      item.checked
                        ? { boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }
                        : { boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c5cdd6' }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-white ${
                          item.checked ? 'bg-secondary-container' : 'bg-slate-300'
                        }`}
                      >
                        {item.checked && <Icon n="check" className="text-sm" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-primary block">{item.name}</span>
                        <span className="text-[10px] text-on-surface-variant">{item.detail}</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-primary">
                      {money(item.amount)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Comparador de Métodos RN-03 + Mantenimiento */}
          <div className="lg:col-span-7 space-y-6">
            <div
              className="bg-[#E5EBF2] rounded-2xl p-6 space-y-5"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-primary">
                    Partidas de Mano de Obra y Comparador RN-03
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Cálculo automático de horas de cableado, montaje y configuración
                  </p>
                </div>
                {costs && (
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-[#E5EBF2] text-xs font-bold text-secondary focus:outline-none"
                    style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                  >
                    <option value="max_ab">Regla RN-03: Máximo Conservador max(A, B)</option>
                    <option value="method_a">Método A: Por Punto Instalado</option>
                    <option value="method_b">Método B: Por Jornada de Cuadrilla</option>
                  </select>
                )}
              </div>

              {/* Hours Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className="p-3.5 rounded-xl bg-[#E5EBF2]"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                    Tendido / Cableado
                  </span>
                  <span className="text-lg font-extrabold text-primary">
                    {calc?.total_hours_cabling ?? 0} hrs
                  </span>
                </div>
                <div
                  className="p-3.5 rounded-xl bg-[#E5EBF2]"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                    Montaje Físico
                  </span>
                  <span className="text-lg font-extrabold text-primary">
                    {calc?.total_hours_mounting ?? 0} hrs
                  </span>
                </div>
                <div
                  className="p-3.5 rounded-xl bg-[#E5EBF2]"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                    Configuración
                  </span>
                  <span className="text-lg font-extrabold text-primary">
                    {calc?.total_hours_config ?? 0} hrs
                  </span>
                </div>
                <div
                  className="p-3.5 rounded-xl bg-[#E5EBF2]"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <span className="text-[10px] font-bold uppercase text-secondary block">
                    Plazo Estimado
                  </span>
                  <span className="text-lg font-extrabold text-secondary">
                    {calc?.estimated_days ?? 2.5} días
                  </span>
                </div>
              </div>

              {/* Comparador de Cuadrillas Table */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary mb-2.5">
                  Simulador de Eficiencia por Tamaño de Cuadrilla (RN-02)
                </h3>
                <div
                  className="overflow-x-auto rounded-xl bg-[#E5EBF2] p-1"
                  style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                >
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant/25 text-[10px] font-extrabold uppercase text-on-surface-variant">
                        <th className="py-2.5 px-3">Configuración</th>
                        <th className="py-2.5 px-3">Eficiencia</th>
                        <th className="py-2.5 px-3">Capacidad Diaria</th>
                        <th className="py-2.5 px-3">Plazo Obra</th>
                        {costs && <th className="py-2.5 px-3 text-right">Costo M.O. (B)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {calc?.crew_comparison?.map((c: any) => (
                        <tr key={c.crew_size} className="hover:bg-white/30">
                          <td className="py-2.5 px-3 font-bold text-primary">{c.label}</td>
                          <td className="py-2.5 px-3 font-semibold text-secondary">
                            {c.efficiency_pct}%
                          </td>
                          <td className="py-2.5 px-3">{c.daily_capacity_hours} h/día</td>
                          <td className="py-2.5 px-3 font-extrabold text-primary">
                            {c.estimated_days} días
                          </td>
                          {costs && (
                            <td className="py-2.5 px-3 text-right font-bold text-primary">
                              {money(c.labor_cost_method_b_pen)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commercial Discount & Maintenance Services */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/25">
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
                    Descuento Comercial (%) {params && !costs && `(Máx. autónomo ${params.seller_max_discount_pct}%)`}
                  </label>
                  <div
                    className="flex items-center bg-[#E5EBF2] rounded-xl px-3.5 py-2.5"
                    style={{ boxShadow: 'inset 3px 3px 6px #c5cdd6, inset -3px -3px 6px #ffffff' }}
                  >
                    <Icon n="percent" className="text-secondary text-[18px] mr-2" />
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full bg-transparent border-none text-sm font-extrabold text-primary focus:outline-none"
                    />
                  </div>
                  {overLimit && (
                    <p className="text-[11px] font-bold text-secondary mt-1">
                      Supera el 5% autónomo: pasará a cola de aprobación gerencial.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
                    Servicios Recurrentes Opcionales
                  </label>
                  <div className="space-y-1.5">
                    {services.map((s) => {
                      const on = svc.find((x) => x.service_id === s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#E5EBF2] text-xs cursor-pointer"
                          style={{ boxShadow: 'inset 2px 2px 5px #c5cdd6, inset -2px -2px 5px #ffffff' }}
                        >
                          <span className="font-semibold text-primary flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={!!on}
                              onChange={(e) =>
                                setSvc(
                                  e.target.checked
                                    ? [
                                        ...svc,
                                        {
                                          service_id: s.id,
                                          name: s.name,
                                          quantity: 1,
                                          unit_cost_pen: s.unit_cost_pen ?? 0,
                                          unit_price_pen: s.reference_price_pen,
                                          is_included_in_quote_total: false,
                                        },
                                      ]
                                    : svc.filter((x) => x.service_id !== s.id)
                                )
                              }
                            />
                            {s.name}
                          </span>
                          <b className="text-secondary">{money(s.reference_price_pen)}</b>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PASO 4: RESUMEN, RENTABILIDAD Y CIERRE (Screen 14)
         ===================================================================== */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Resumen Consolidado + Liquidación Fiscal SUNAT */}
          <div className="lg:col-span-8 space-y-6">
            <div
              className="bg-[#E5EBF2] rounded-2xl p-6 space-y-5"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <div className="flex items-center justify-between border-b border-outline-variant/25 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-primary">
                    Resumen Consolidado de Partidas y Liquidación Fiscal
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Cliente: <b className="text-primary">{businessName}</b> • Obra:{' '}
                    <b className="text-primary">{project.name}</b>
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  IGV 18% + SPOT 4%
                </span>
              </div>

              {/* Financial Settlement Box (Screen 14) */}
              <div
                className="rounded-2xl bg-[#E5EBF2] p-5 space-y-3"
                style={{ boxShadow: 'inset 3px 3px 7px #c5cdd6, inset -3px -3px 7px #ffffff' }}
              >
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">
                    Valor de Venta Bruto (Antes de Descuento):
                  </span>
                  <span className="font-bold text-primary">
                    {money(calc?.sale_value_before_discount_pen)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">
                    Descuento Comercial Otorgado ({discount}%):
                  </span>
                  <span className="font-bold text-secondary">
                    - {money(calc?.discount_amount_pen)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-outline-variant/25">
                  <span className="font-bold text-primary">
                    Subtotal Neto / Base Imponible (Sin IGV):
                  </span>
                  <span className="font-extrabold text-primary">
                    {money(calc?.taxable_base_pen)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">
                    Impuesto General a las Ventas — I.G.V. (18% SUNAT):
                  </span>
                  <span className="font-bold text-primary">{money(calc?.tax_amount_pen)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-outline-variant/30">
                  <span className="text-sm font-extrabold uppercase tracking-wider text-primary">
                    Importe Total de la Propuesta (PEN):
                  </span>
                  <span className="text-2xl font-extrabold text-primary tabular-nums">
                    {money(calc?.total_with_tax_pen)}
                  </span>
                </div>
              </div>

              {/* SUNAT SPOT Detracción Notice (Screen 14) */}
              <div
                className="p-4 rounded-xl bg-[#E5EBF2] border-l-4 border-secondary flex items-start gap-3"
                style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #c5cdd6' }}
              >
                <Icon n="account_balance" className="text-secondary text-[20px] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-extrabold text-primary block">
                    Operación Sujeta al SPOT — Detracción SUNAT 4.0% (Código 022)
                  </span>
                  <span className="text-on-surface-variant">
                    Retención estimada en Cuenta Banco de la Nación:{' '}
                    <b className="text-secondary">{money(spotDetraccionPen)}</b> • Neto a depositar en
                    cuentas comerciales:{' '}
                    <b className="text-primary">
                      {money((calc?.total_with_tax_pen || 0) - spotDetraccionPen)}
                    </b>
                  </span>
                </div>
              </div>

              {/* Terms & Conditions Editors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {(
                  [
                    ['includes_text', 'Alcance que Incluye'],
                    ['excludes_text', 'Exclusiones Técnicas'],
                    ['payment_terms_text', 'Condiciones de Pago'],
                    ['warranty_text', 'Garantía y SLA Postventa'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5">
                      {label}
                    </label>
                    <textarea
                      rows={2}
                      value={conditions[key]}
                      onChange={(e) => setConditions({ ...conditions, [key]: e.target.value })}
                      className="w-full rounded-xl bg-[#E5EBF2] p-3 text-xs font-medium text-primary focus:outline-none"
                      style={{ boxShadow: 'inset 2px 2px 5px #c5cdd6, inset -2px -2px 5px #ffffff' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Aprobación, Rentabilidad y Emisión */}
          <div className="lg:col-span-4 space-y-5">
            {costs && (
              <div
                className="bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
                style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary">
                    Auditoría de Costos (Gerencia)
                  </h3>
                  <Icon n="analytics" className="text-secondary" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Costo Equipos y Materiales:</span>
                    <b className="text-primary">{money(calc?.materials_cost_pen)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Costo Mano de Obra Aplicada:</span>
                    <b className="text-primary">{money(calc?.labor_cost_applied_pen)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Viáticos Base:</span>
                    <b className="text-primary">{money(calc?.travel_cost_pen)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Gastos Generales ({calc?.overhead_pct ?? 8}%):</span>
                    <b className="text-primary">{money(calc?.overhead_amount_pen)}</b>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-300/50">
                    <span className="font-bold text-primary">Costo Total de Obra:</span>
                    <b className="font-extrabold text-primary">{money(calc?.total_cost_pen)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-primary">Margen Efectivo sobre Venta:</span>
                    <b className="font-extrabold text-emerald-700">
                      {calc?.effective_margin_on_sale_pct ?? 30}%
                    </b>
                  </div>
                </div>
              </div>
            )}

            <div
              className="bg-[#E5EBF2] rounded-2xl p-6 space-y-4"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary">
                Emisión y Exportación
              </h3>
              <p className="text-xs text-on-surface-variant">
                {calc?.requires_approval
                  ? 'Esta proforma requiere visto bueno de Gerencia por condiciones especiales.'
                  : 'La proforma cumple los parámetros corporativos de rentabilidad y está lista para emitirse.'}
              </p>

              <button
                type="button"
                onClick={() => save('issue')}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#ff752b] to-[#b13e00] text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ boxShadow: '-4px -4px 10px #ffffff, 4px 4px 12px rgba(177, 62, 0, 0.35)' }}
              >
                <Icon n="send" className="text-[18px]" />
                <span>
                  {calc?.requires_approval && !costs
                    ? 'Guardar y Solicitar Aprobación'
                    : 'Emitir Proforma Oficial'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPdfModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-[#041533] text-white text-xs font-extrabold hover:bg-[#102447] flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Icon n="picture_as_pdf" className="text-[#ff6b1a] text-[18px]" />
                <span>Vista Previa Proforma Corporativa A4 (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => save('detail')}
                className="w-full py-3 px-4 rounded-xl bg-[#E5EBF2] text-xs font-extrabold text-primary hover:text-secondary flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #c5cdd6' }}
              >
                <Icon n="visibility" className="text-[18px]" />
                <span>Guardar e Ir a Hoja Detallada</span>
              </button>
            </div>

            {/* Miniatura Interactiva del Documento PDF Corporativo A4 */}
            <div
              onClick={() => setPdfModalOpen(true)}
              className="bg-[#E5EBF2] rounded-2xl p-5 space-y-3 cursor-pointer group"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon n="picture_as_pdf" className="text-secondary text-[20px]" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    Modelo Corporativo A4 + Marcas
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold">
                  Formato SUNAT A4
                </span>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-300 shadow-inner space-y-2.5 group-hover:border-secondary transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#041533] text-white font-black text-[10px] flex items-center justify-center">
                      PE
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-[#041533] leading-none">
                        PRECISION SYSTEMS S.A.C.
                      </div>
                      <div className="text-[9px] text-slate-500">RUC 20601234567 · Lima, Perú</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-extrabold text-secondary">PROFORMA</div>
                    <div className="text-[10px] font-black text-[#041533]">PF-2026-BORR</div>
                  </div>
                </div>

                <div className="text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="font-bold text-[#041533] truncate">{businessName}</div>
                  <div className="text-slate-500 truncate">
                    {docType}: {docNumber} · {project.name}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-black text-[#041533] pt-1 border-t border-slate-200">
                  <span>TOTAL GENERAL CON IGV:</span>
                  <span className="text-secondary">{money(calc?.total_with_tax_pen)}</span>
                </div>

                {/* Pie de Marcas en Miniatura */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-[8px] font-extrabold uppercase text-slate-400 mb-1">
                    Partners de Redes y Cámaras en Pie de Página:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      'HIKVISION',
                      'DAHUA',
                      'AXIS',
                      'CISCO',
                      'UBIQUITI',
                      'MIKROTIK',
                      'PANDUIT',
                      'COMMSCOPE',
                    ].map((brand) => (
                      <span
                        key={brand}
                        className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[8px] font-black text-[#041533]"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-primary group-hover:text-secondary">
                <span>Clic para ampliar hoja A4 completa</span>
                <Icon n="zoom_in" className="text-[16px]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa Proforma Corporativa A4 en Pantalla Completa */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="bg-[#041533] text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl print:hidden">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-orange-500/20 border border-orange-400 text-orange-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Vista Previa Corporativa A4
                </span>
                <span className="text-sm font-bold">
                  {businessName} — {project.name}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff752b] to-[#b13e00] text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Icon n="print" className="text-[16px]" />
                  Imprimir / Guardar en PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPdfModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Icon n="close" className="text-[16px]" />
                  Cerrar
                </button>
              </div>
            </div>

            <CorporateProformaDocument
              quote={{
                code: id ? `PF-2026-000${id}` : 'PF-2026-BORR',
                version: 1,
                status: 'borrador',
                issue_date: new Date().toISOString().slice(0, 10),
                valid_until: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
                exchange_rate_sell: settings?.exchange_rate?.usd_to_pen_sell || 3.742,
                customer: {
                  business_name: businessName,
                  document_type: docType,
                  document_number: docNumber,
                  contact_name: contactName,
                  phone: contactPhone,
                  email: contactEmail,
                  fiscal_address: `${project.installation_address} — ${project.district}`,
                },
                project: {
                  name: project.name,
                  subtitle: project.specialty,
                  installation_address: project.installation_address,
                  floors: project.floors,
                },
                seller_name: user?.full_name || 'Ing. Carlos Mendoza Rojas',
                crews_label: `${crew.crew_technicians} Técnico(s) + ${crew.crew_assistants} Asistente(s)`,
                estimated_days: calc?.estimated_days || 4.0,
                total_hours: calc?.total_hours || 32.0,
                lines: calc?.lines || [],
                discount_pct: discount,
                discount_amount_pen: calc?.discount_amount_pen || 0,
                gross_before_discount_pen: calc?.sale_value_before_discount_pen || 0,
                taxable_base_pen: calc?.taxable_base_pen || 0,
                tax_amount_pen: calc?.tax_amount_pen || 0,
                total_with_tax_pen: calc?.total_with_tax_pen || 0,
                warranty_text: conditions.warranty_text,
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom Wizard Navigation Bar */}
      <div
        className="bg-[#E5EBF2] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
        style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #c5cdd6' }}
      >
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep(Math.max(0, step - 1))}
          className="px-5 py-2.5 rounded-xl bg-[#E5EBF2] text-xs font-bold text-primary disabled:opacity-40 flex items-center gap-2 transition-all active:scale-95"
          style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #c5cdd6' }}
        >
          <Icon n="arrow_back" className="text-[16px]" />
          <span>Paso Anterior</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
              Total Proforma (Inc. IGV)
            </span>
            <span className="text-base font-extrabold text-primary">
              {money(calc?.total_with_tax_pen)}
            </span>
          </div>

          {step < 3 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff752b] to-[#b13e00] text-white text-xs font-extrabold flex items-center gap-2 disabled:opacity-40 transition-all active:scale-95"
              style={{ boxShadow: '-4px -4px 10px #ffffff, 4px 4px 12px rgba(177, 62, 0, 0.35)' }}
            >
              <span>Continuar al {STEPS[step + 1].step}</span>
              <Icon n="arrow_forward" className="text-[16px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => save('detail')}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold flex items-center gap-2 transition-all active:scale-95"
            >
              <Icon n="check_circle" className="text-[16px]" />
              <span>Finalizar y Revisar Proforma</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
