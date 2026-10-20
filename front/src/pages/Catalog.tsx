import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, canSeeCosts, money } from '../api';
import { useAuth } from '../auth';
import { Icon } from '../Layout';

const CATEGORIES = [
  { key: 'all', label: 'Todas las categorías (148)', icon: 'apps' },
  { key: 'cctv', label: 'CCTV & Video (42)', icon: 'videocam' },
  { key: 'redes', label: 'Redes & Fibra Óptica (36)', icon: 'router' },
  { key: 'accesos', label: 'Control de Acceso (24)', icon: 'lock_open' },
  { key: 'canalizacion', label: 'Canalización EMT/PVC (28)', icon: 'plumbing' },
  { key: 'herramientas', label: 'Herramientas & Consumibles (18)', icon: 'handyman' },
];

export default function Catalog() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'products' | 'assemblies' | 'suppliers'>(
    searchParams.get('tab') === 'ensamblajes' ? 'assemblies' : 'products'
  );

  useEffect(() => {
    if (searchParams.get('tab') === 'ensamblajes') {
      setTab('assemblies');
    } else if (!searchParams.get('tab')) {
      setTab('products');
    }
  }, [searchParams]);

  const [products, setProducts] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productOffers, setProductOffers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Modales
  const [modalType, setModalType] = useState<
    'product' | 'assembly' | 'supplier' | 'offer' | 'import' | null
  >(null);
  const [form, setForm] = useState<any>({});
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const costs = canSeeCosts(user?.role);
  const isAdmin = user?.role === 'admin' || user?.role === 'gerencia';

  const loadData = async () => {
    try {
      const [p, a, s] = await Promise.all([
        api('/products'),
        api('/assemblies'),
        costs ? api('/suppliers').catch(() => []) : Promise.resolve([]),
      ]);
      setProducts(p);
      setAssemblies(a);
      setSuppliers(s);
      if (p.length > 0) {
        const current = selectedProduct ? p.find((x: any) => x.id === selectedProduct.id) || p[0] : p[0];
        selectProduct(current);
      }
    } catch (e: any) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectProduct = async (prod: any) => {
    setSelectedProduct(prod);
    if (costs && prod?.id) {
      try {
        const off = await api(`/products/${prod.id}/offers`);
        setProductOffers(off);
      } catch {
        setProductOffers([]);
      }
    }
  };

  const notify = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3200);
  };

  // Guardar Producto
  const saveProduct = async () => {
    try {
      if (form.id) {
        await api(`/products/${form.id}`, { method: 'PUT', body: form });
        notify('Parámetros del equipo actualizados.');
      } else {
        await api('/products', { method: 'POST', body: form });
        notify('Nuevo equipo registrado en el catálogo.');
      }
      setModalType(null);
      loadData();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  // Guardar Ensamblaje
  const saveAssembly = async () => {
    try {
      if (form.id) {
        await api(`/assemblies/${form.id}`, { method: 'PUT', body: form });
        notify('Ensamblaje actualizado.');
      } else {
        await api('/assemblies', { method: 'POST', body: form });
        notify('Ensamblaje creado.');
      }
      setModalType(null);
      loadData();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  // Clonar Ensamblaje
  const cloneAssembly = async (asm: any) => {
    try {
      await api(`/assemblies/${asm.id}/clone`, {
        method: 'POST',
        body: { code: `${asm.code}-CLON`, name: `${asm.name} (Clon)` },
      });
      notify('Kit / Ensamblaje clonado con éxito.');
      loadData();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  // Guardar Proveedor
  const saveSupplier = async () => {
    try {
      if (form.id) {
        await api(`/suppliers/${form.id}`, { method: 'PUT', body: form });
        notify('Proveedor actualizado.');
      } else {
        await api('/suppliers', { method: 'POST', body: form });
        notify('Proveedor creado.');
      }
      setModalType(null);
      loadData();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  // Guardar Oferta de Proveedor
  const saveOffer = async () => {
    try {
      await api(`/products/${selectedProduct.id}/offers`, { method: 'POST', body: form });
      notify('Oferta mayorista registrada.');
      setModalType(null);
      selectProduct(selectedProduct);
      loadData();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  // Importar CSV
  const handleImport = async (mode: 'validate' | 'commit') => {
    try {
      const res = await api('/catalog/import', {
        method: 'POST',
        body: { content: importText, mode },
      });
      setImportResult(res);
      if (mode === 'commit') {
        notify(`¡Se importaron ${res.rows_imported} equipos exitosamente!`);
        loadData();
      }
    } catch (e: any) {
      setErr(e.message);
    }
  };

  // Eliminar elemento
  const deleteItem = async (type: 'products' | 'assemblies' | 'suppliers', id: number) => {
    if (!confirm('¿Está seguro de eliminar este registro del catálogo?')) return;
    try {
      await api(`/${type}/${id}`, { method: 'DELETE' });
      notify('Registro eliminado.');
      loadData();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchText =
      !search ||
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStock =
      stockFilter === 'all' ||
      (stockFilter === 'critical' ? p.stock_status === 'critical' : p.stock_status !== 'critical');
    return matchText && matchCat && matchStock;
  });

  const filteredAssemblies = assemblies.filter(
    (a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  );

  // Compute display values for any product
  const getProductMetrics = (p: any) => {
    const costPen = Number(p.unit_cost_pen ?? p.cost_pen ?? 318.0);
    const costUsd = Number(p.cost_usd ?? costPen / 3.75);
    const listPen = Number(p.list_price_pen ?? Math.round((costPen / 0.68) * 100) / 100);
    const listUsd = Number(p.list_price_usd ?? listPen / 3.75);
    const finalPen = Number(p.final_price_pen ?? Math.round(listPen * 1.18 * 100) / 100);
    const marginPct = Number(
      p.margin_pct ?? Math.round(((listPen - costPen) / listPen) * 1000) / 10
    );
    return { costPen, costUsd, listPen, listUsd, finalPen, marginPct };
  };

  return (
    <div className="space-y-6 pb-8">
      {msg && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#10294d] px-5 py-3.5 text-xs font-bold text-white shadow-xl"
          style={{ boxShadow: '-4px -4px 10px rgba(255,255,255,0.6), 6px 6px 16px rgba(16,41,77,0.45)' }}
        >
          <Icon n="check_circle" className="text-[#ff752b] text-[18px]" />
          <span>{msg}</span>
        </div>
      )}
      {err && (
        <div
          className="p-3 bg-[#E5EBF2] rounded-xl text-xs font-bold text-error flex items-center justify-between gap-2"
          style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
        >
          <div className="flex items-center gap-2">
            <Icon n="error" className="text-error" />
            <span>{err}</span>
          </div>
          <button type="button" onClick={() => setErr('')} className="text-muted hover:text-primary">
            <Icon n="close" className="text-[16px]" />
          </button>
        </div>
      )}

      {/* Header & Primary Action Card (Screen 16) */}
      <div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#E5EBF2] p-6 rounded-2xl"
        style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl bg-[#E5EBF2] flex items-center justify-center text-primary shrink-0"
            style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
          >
            <Icon n="inventory_2" className="text-2xl text-secondary" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
                Catálogo Técnico de Equipos y Materiales
              </h2>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold bg-[#E5EBF2] text-secondary"
                style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
              >
                148 SKUs Activos
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Precios sincronizados en Soles (PEN) según T.C. referencial y listas mayoristas de
              Lima.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end lg:self-center">
          <button
            type="button"
            onClick={() => {
              setImportText(
                'sku,name,category,unit_cost,currency,unit\nHK-DS2CD2183G2,Cámara Domo IP 4K AcuSense IR30m IP67,cctv,84.80,USD,UND\nUB-USW-24-POE,Switch UniFi Gen2 24 Puertos Gigabit PoE+,redes,341.33,USD,UND'
              );
              setImportResult(null);
              setModalType('import');
            }}
            className="px-4 py-2.5 rounded-xl bg-[#E5EBF2] text-xs font-bold text-primary hover:text-secondary transition-all flex items-center gap-2 active:scale-95"
            style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
          >
            <Icon n="upload_file" className="text-base" />
            <span>Importar Excel / ERP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (tab === 'assemblies') {
                setForm({
                  code: 'ASM-NUEVO',
                  name: '',
                  category: 'cctv',
                  unit: 'PUNTO',
                  hours_cabling: 1,
                  hours_mounting: 2,
                  hours_config: 0.5,
                  reference_cost_per_point: 70,
                  unit_cost_pen: 220,
                });
                setModalType('assembly');
              } else if (tab === 'suppliers') {
                setForm({ name: '', ruc: '', contact_name: '', phone: '', email: '' });
                setModalType('supplier');
              } else {
                setForm({
                  sku: 'HK-NUEVO-SKU',
                  name: '',
                  category: 'cctv',
                  brand: 'HIKVISION',
                  unit: 'UND',
                  unit_cost_pen: 318,
                  stock: 15,
                  description: '',
                });
                setModalType('product');
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff752b] to-[#b13e00] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
            style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
          >
            <Icon n="add" className="text-lg" />
            <span>
              {tab === 'assemblies'
                ? 'Nuevo Kit / Ensamblaje'
                : tab === 'suppliers'
                ? 'Nuevo Mayorista'
                : 'Nuevo Equipo o Kit'}
            </span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar (Screen 16) */}
      <div
        className="bg-[#E5EBF2] p-5 rounded-2xl space-y-4"
        style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Concave Search Input */}
          <div
            className="w-full md:w-1/2 rounded-xl px-4 py-3 flex items-center gap-3 bg-[#E5EBF2] focus-within:ring-2 focus-within:ring-secondary-container"
            style={{ boxShadow: 'inset -4px -4px 9px #ffffff, inset 4px 4px 9px #cbd5e1' }}
          >
            <Icon n="search" className="text-on-surface-variant text-[20px]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código SKU, marca (Hikvision, Ubiquiti, Panduit), modelo o especificación..."
              className="w-full bg-transparent border-none focus:outline-none text-xs sm:text-sm font-medium text-on-surface placeholder:text-on-surface-variant/70"
            />
            <span
              className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-[#E5EBF2] text-on-surface-variant"
              style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
            >
              Ctrl + K
            </span>
          </div>

          {/* Right Controls: Stock Filter + Tab Switcher */}
          <div className="w-full md:w-auto flex flex-wrap items-center gap-3 justify-end">
            <div
              className="rounded-xl px-3.5 py-2.5 flex items-center gap-2 bg-[#E5EBF2]"
              style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-transparent border-none p-0 text-xs font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="all">En Stock Local (Lima / Callao)</option>
                <option value="in_stock">Disponibilidad Inmediata</option>
                <option value="critical">Stock Crítico (&le; 3 uds.)</option>
              </select>
            </div>

            <div
              className="flex items-center gap-1 rounded-xl p-1 bg-[#E5EBF2]"
              style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
            >
              <button
                type="button"
                onClick={() => setTab('products')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'products'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Equipos
              </button>
              <button
                type="button"
                onClick={() => setTab('assemblies')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'assemblies'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Ensamblajes ({assemblies.length})
              </button>
              {costs && (
                <button
                  type="button"
                  onClick={() => setTab('suppliers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tab === 'suppliers'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Mayoristas ({suppliers.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Pills (Screen 16) */}
        {tab === 'products' && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
            {CATEGORIES.map((c) => {
              const active = categoryFilter === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategoryFilter(c.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-[#E5EBF2] text-secondary border border-secondary-container/30'
                      : 'bg-[#E5EBF2] text-on-surface-variant hover:text-primary'
                  }`}
                  style={
                    active
                      ? { boxShadow: 'inset -4px -4px 9px #ffffff, inset 4px 4px 9px #cbd5e1' }
                      : { boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }
                  }
                >
                  <Icon n={c.icon} className="text-sm" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Split: Asymmetric 60% / 40% Grid (Screen 16) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Product Cards / Assemblies / Suppliers */}
        <div className="lg:col-span-7 space-y-4">
          {tab === 'products' && (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Mostrando {filteredProducts.length} de 148 equipos homologados
                </p>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span>Ordenar por:</span>
                  <span className="font-bold text-primary">Mayor Rotación</span>
                </div>
              </div>

              {filteredProducts.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                const m = getProductMetrics(p);
                const isCritical = p.stock_status === 'critical' || Number(p.stock) <= 3;
                return (
                  <article
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    className={`bg-[#E5EBF2] p-4 rounded-2xl transition-all cursor-pointer relative overflow-hidden ${
                      isSelected ? 'ring-2 ring-secondary-container/60' : 'hover:scale-[1.005]'
                    }`}
                    style={
                      isSelected
                        ? { boxShadow: 'inset -4px -4px 9px #ffffff, inset 4px 4px 9px #cbd5e1' }
                        : { boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }
                    }
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container rounded-r-full" />
                    )}

                    <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center ${isSelected ? 'pl-2' : ''}`}>
                      {/* Thumbnail Container */}
                      <div
                        className="w-24 h-24 rounded-xl bg-[#E5EBF2] p-2 flex items-center justify-center shrink-0 relative overflow-hidden"
                        style={{ boxShadow: isSelected ? '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' : 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Icon n="videocam" className="text-primary text-[32px]" />
                        )}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-primary text-white">
                          {p.certifications?.[1]?.split(' ')[0] || 'PRO'}
                        </span>
                      </div>

                      {/* Info Block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-primary-container/10 text-primary'
                            }`}
                          >
                            {p.brand || 'HOMOLOGADO'}
                          </span>
                          <span className="text-xs font-mono font-bold text-on-surface-variant">
                            SKU: {p.sku}
                          </span>
                          <span
                            className={`ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E5EBF2] ${
                              isCritical ? 'text-secondary' : 'text-emerald-700'
                            }`}
                            style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCritical ? 'bg-secondary-container animate-ping' : 'bg-emerald-500'
                              }`}
                            />
                            Stock: {p.stock ?? 24} {p.stock_unit || 'uds.'}
                            {isCritical ? ' (Crítico)' : ''}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-primary truncate">{p.name}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                          {p.description || 'Equipo homologado para instalaciones técnicas y proyectos corporativos.'}
                        </p>

                        {/* Pricing & Margin Row */}
                        <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="block text-[10px] font-bold uppercase text-on-surface-variant">
                                Venta Lista (S/.)
                              </span>
                              <span className="text-base font-extrabold text-primary">
                                {money(m.listPen)}
                              </span>
                              <span className="text-[11px] text-on-surface-variant font-medium ml-1">
                                ($ {m.listUsd.toFixed(2)})
                              </span>
                            </div>

                            {costs && (
                              <>
                                <div className="h-6 w-px bg-outline-variant/30" />
                                <div>
                                  <span className="block text-[10px] font-bold uppercase text-on-surface-variant">
                                    Costo (S/.)
                                  </span>
                                  <span className="text-sm font-bold text-on-surface-variant">
                                    {money(m.costPen)}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {costs && (
                              <span
                                className="px-2.5 py-1 rounded-lg bg-[#E5EBF2] text-xs font-extrabold text-secondary"
                                style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
                              >
                                Margen: +{m.marginPct.toFixed(1)}%
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectProduct(p);
                              }}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-secondary-container text-white'
                                  : 'bg-[#E5EBF2] text-primary hover:text-secondary'
                              }`}
                              style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                              title="Ver Ficha Técnica"
                            >
                              <Icon n={isSelected ? 'arrow_forward_ios' : 'add_shopping_cart'} className="text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </>
          )}

          {tab === 'assemblies' &&
            filteredAssemblies.map((a) => (
              <div
                key={a.id}
                className="p-5 rounded-2xl bg-[#E5EBF2] transition-all"
                style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-primary text-white text-[10px] font-bold font-mono">
                        {a.code}
                      </span>
                      <span className="text-xs font-bold uppercase text-secondary">{a.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-primary mt-1.5">{a.name}</h3>
                  </div>
                  {costs && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-muted block">
                        Costo Materiales S/
                      </span>
                      <span className="text-base font-extrabold text-secondary">
                        {money(a.unit_cost_pen)}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className="grid grid-cols-3 gap-2 mt-3 p-3 rounded-xl bg-[#E5EBF2] text-xs text-primary"
                  style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
                >
                  <span>
                    Cableado: <b>{a.hours_cabling}h</b>
                  </span>
                  <span>
                    Montaje: <b>{a.hours_mounting}h</b>
                  </span>
                  <span>
                    Configuración: <b>{a.hours_config}h</b>
                  </span>
                </div>
                {isAdmin && (
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-primary bg-[#E5EBF2] hover:text-secondary"
                      style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                      onClick={() => cloneAssembly(a)}
                    >
                      Clonar Kit
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-secondary bg-[#E5EBF2]"
                      style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                      onClick={() => {
                        setForm(a);
                        setModalType('assembly');
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-error bg-[#E5EBF2]"
                      style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                      onClick={() => deleteItem('assemblies', a.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}

          {tab === 'suppliers' &&
            suppliers.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-[#E5EBF2]"
                style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-primary"
                      style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
                    >
                      <Icon n="local_shipping" className="text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-primary">{s.name}</h3>
                      <p className="text-xs font-mono text-muted mt-0.5">RUC: {s.ruc || '20212331377'}</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Contacto: <b className="text-primary">{s.contact_name || 'Ejecutivo B2B'}</b> · {s.phone || '(01) 415-0101'}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-[#E5EBF2]"
                        style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                        onClick={() => {
                          setForm(s);
                          setModalType('supplier');
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-error bg-[#E5EBF2]"
                        style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                        onClick={() => deleteItem('suppliers', s.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* RIGHT COLUMN (5 cols): Sticky Technical & Commercial Sheet (Screen 16) */}
        <aside className="lg:col-span-5 lg:sticky lg:top-20">
          {selectedProduct ? (
            (() => {
              const m = getProductMetrics(selectedProduct);
              const certs: string[] = selectedProduct.certifications || [
                'Garantía 2 Años',
                'IP67 Intemperie',
                'IK10 Antivandálica',
              ];
              const kits: any[] = selectedProduct.compatible_kits || [
                {
                  code: 'ASM-CAM-EXT',
                  name: 'Kit CCTV Retail 8 Puntos',
                  detail: 'Incluye 8x Domo 4K + NVR + PoE',
                  price_pen: 4890.0,
                },
              ];
              return (
                <div
                  className="bg-[#E5EBF2] rounded-3xl p-6 space-y-5 border border-white/40"
                  style={{ boxShadow: '-10px -10px 22px #ffffff, 10px 10px 22px #cbd5e1' }}
                >
                  {/* Panel Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-outline-variant/25 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-primary text-white text-[10px] font-extrabold tracking-wider uppercase">
                          Ficha de Equipo Homologado
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary">
                          {selectedProduct.sku}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-primary mt-1.5 leading-snug">
                        {selectedProduct.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="w-9 h-9 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-on-surface-variant hover:text-primary"
                        style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                        title="Imprimir Ficha Técnica"
                      >
                        <Icon n="print" className="text-base" />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => deleteItem('products', selectedProduct.id)}
                          className="w-9 h-9 rounded-xl bg-[#E5EBF2] flex items-center justify-center text-on-surface-variant hover:text-error"
                          style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                          title="Eliminar Equipo"
                        >
                          <Icon n="delete" className="text-base" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Product Visual Showcase */}
                  <div
                    className="bg-[#E5EBF2] rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5"
                    style={{ boxShadow: 'inset -4px -4px 9px #ffffff, inset 4px 4px 9px #cbd5e1' }}
                  >
                    <div
                      className="w-32 h-32 rounded-2xl bg-[#E5EBF2] p-2 flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
                    >
                      {selectedProduct.image_url ? (
                        <img
                          src={selectedProduct.image_url}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Icon n="videocam" className="text-primary text-[48px]" />
                      )}
                    </div>
                    <div className="space-y-2.5 flex-1 w-full">
                      <div className="flex flex-wrap gap-1.5">
                        {certs.map((c, idx) => (
                          <span
                            key={c}
                            className={`px-2.5 py-1 rounded-lg bg-[#E5EBF2] text-[10px] font-bold flex items-center gap-1 ${
                              idx === 0
                                ? 'text-primary'
                                : idx === 1
                                ? 'text-emerald-700'
                                : 'text-secondary'
                            }`}
                            style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                          >
                            <Icon
                              n={idx === 0 ? 'verified' : idx === 1 ? 'water_drop' : 'shield'}
                              className="text-xs"
                            />
                            {c}
                          </span>
                        ))}
                      </div>
                      <div className="pt-1">
                        <p className="text-[11px] font-bold uppercase text-on-surface-variant">
                          Disponibilidad Logística
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                            <Icon n="check_circle" className="text-sm" />
                            {selectedProduct.lead_time || 'Entrega Inmediata (Almacén Lima)'}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            {selectedProduct.stock ?? 24} {selectedProduct.stock_unit || 'uds.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Commercial Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                      <Icon n="payments" className="text-sm text-secondary" />
                      Estructura de Costos y Rentabilidad
                    </h4>

                    {costs && (
                      <div className="grid grid-cols-3 gap-3">
                        <div
                          className="bg-[#E5EBF2] p-3 rounded-xl"
                          style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
                        >
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                            Costo Mayorista
                          </span>
                          <p className="text-sm font-extrabold text-primary mt-1">
                            $ {m.costUsd.toFixed(2)}
                          </p>
                          <span className="text-[10px] text-on-surface-variant">Sin IGV (USD)</span>
                        </div>
                        <div
                          className="bg-[#E5EBF2] p-3 rounded-xl"
                          style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
                        >
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                            Costo Soles
                          </span>
                          <p className="text-sm font-extrabold text-primary mt-1">
                            {money(m.costPen)}
                          </p>
                          <span className="text-[10px] text-on-surface-variant">T.C. S/ 3.75</span>
                        </div>
                        <div
                          className="bg-[#E5EBF2] p-3 rounded-xl"
                          style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
                        >
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                            Margen Aplicado
                          </span>
                          <p className="text-sm font-extrabold text-secondary mt-1">
                            +{m.marginPct.toFixed(1)}%
                          </p>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            +{money(m.listPen - m.costPen)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Highlighted Price Box */}
                    <div
                      className="bg-[#E5EBF2] p-4 rounded-2xl flex items-center justify-between"
                      style={{ boxShadow: 'inset -4px -4px 9px #ffffff, inset 4px 4px 9px #cbd5e1' }}
                    >
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-secondary block">
                          Precio Venta Lista (Sin IGV)
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-2xl font-extrabold text-primary">
                            {money(m.listPen)}
                          </span>
                          <span className="text-xs font-bold text-on-surface-variant">
                            ($ {m.listUsd.toFixed(2)} USD)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-on-surface-variant block">
                          Precio Final c/ IGV (18%)
                        </span>
                        <span className="text-base font-extrabold text-emerald-700">
                          {money(m.finalPen)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compatible Kits / Ensamblajes */}
                  {kits.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                        <Icon n="category" className="text-sm text-primary" />
                        Incluido en Kits de Instalación (Ensamblajes)
                      </h4>
                      <div className="space-y-2">
                        {kits.map((k: any, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => setTab('assemblies')}
                            className="p-3 rounded-xl bg-[#E5EBF2] flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all"
                            style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon n="layers" className="text-secondary text-lg" />
                              <div>
                                <p className="text-xs font-bold text-primary">{k.name}</p>
                                <p className="text-[11px] text-on-surface-variant">{k.detail}</p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-primary">
                              {money(k.price_pen)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supplier & Offers Info */}
                  <div
                    className="p-3.5 rounded-xl bg-[#E5EBF2] space-y-2.5"
                    style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon n="local_shipping" className="text-primary text-lg" />
                        <div>
                          <p className="text-xs font-bold text-primary">
                            Mayorista: {selectedProduct.supplier_name || 'DELTRON PERÚ S.A.'}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            Sincronizado hoy • Almacén {selectedProduct.warehouse || 'Lima / Callao'}
                          </p>
                        </div>
                      </div>
                      {costs && isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm({
                              supplier_id: suppliers[0]?.id || 1,
                              currency: 'USD',
                              unit_cost: m.costUsd,
                              supplier_sku: `MAY-${selectedProduct.sku}`,
                              is_preferred: true,
                            });
                            setModalType('offer');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#E5EBF2] text-[11px] font-bold text-secondary hover:underline"
                          style={{ boxShadow: '-2px -2px 4px #ffffff, 2px 2px 4px #cbd5e1' }}
                        >
                          + Oferta
                        </button>
                      )}
                    </div>

                    {costs && productOffers.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-300/40">
                        {productOffers.map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-white/40"
                          >
                            <span className="font-semibold text-primary">
                              {o.supplier?.name || 'Mayorista'} ({o.supplier_sku})
                            </span>
                            <span className="font-extrabold text-primary">
                              {o.currency} {Number(o.unit_cost || 0).toFixed(2)}{' '}
                              {o.is_preferred ? (
                                <b className="text-secondary ml-1">★ Pref.</b>
                              ) : null}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons (Screen 16) */}
                  <div className="pt-2 flex items-center gap-3">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            ...selectedProduct,
                            unit_cost_pen: m.costPen,
                          });
                          setModalType('product');
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-[#E5EBF2] text-xs font-extrabold text-primary hover:text-secondary transition-all flex items-center justify-center gap-2 active:scale-95"
                        style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
                      >
                        <Icon n="edit" className="text-base" />
                        <span>Editar Parámetros</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => nav('/proformas/nueva')}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff752b] to-[#b13e00] text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 active:scale-95"
                      style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
                    >
                      <Icon n="post_add" className="text-base" />
                      <span>Insertar en Cotización</span>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div
              className="p-8 rounded-2xl bg-[#E5EBF2] text-center text-muted text-sm font-medium"
              style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
            >
              Seleccione un equipo para inspeccionar su ficha técnica homologada.
            </div>
          )}
        </aside>
      </div>

      {/* MODAL: Importación CSV */}
      {modalType === 'import' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-2xl bg-[#E5EBF2] p-6 rounded-2xl space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #94a3b8' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">
                Importar Catálogo por CSV / Excel (ERP Lima)
              </h3>
              <button onClick={() => setModalType(null)} className="text-muted hover:text-primary">
                <Icon n="close" />
              </button>
            </div>
            <p className="text-xs text-muted">
              Pegue el contenido CSV con las columnas:{' '}
              <code>sku, name, category, unit_cost, currency, unit</code>
            </p>
            <textarea
              className="w-full h-44 p-3 rounded-xl bg-[#E5EBF2] text-xs font-mono focus:outline-none"
              style={{ boxShadow: 'inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff' }}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            {importResult && (
              <div
                className="p-3 rounded-xl bg-[#E5EBF2] text-xs space-y-1"
                style={{ boxShadow: 'inset -2px -2px 4px #ffffff, inset 2px 2px 4px #cbd5e1' }}
              >
                <p className="font-bold text-primary">
                  Filas analizadas: {importResult.rows_total} | Válidas:{' '}
                  {importResult.rows_imported} | Rechazadas: {importResult.rows_rejected}
                </p>
                {importResult.errors?.map((eItem: any, idx: number) => (
                  <p key={idx} className="text-error font-semibold">
                    Fila {eItem.row} ({eItem.field}): {eItem.message}
                  </p>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-bold text-primary"
                style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                onClick={() => handleImport('validate')}
              >
                Validar Sin Guardar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-secondary-container text-white text-xs font-bold"
                onClick={() => handleImport('commit')}
              >
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear/Editar Producto */}
      {modalType === 'product' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-md bg-[#E5EBF2] p-6 rounded-2xl space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #94a3b8' }}
          >
            <h3 className="text-lg font-bold text-primary">
              {form.id ? 'Editar Parámetros de Equipo' : 'Nuevo Equipo Homologado'}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-muted block mb-1">SKU</label>
                  <input
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.sku || ''}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">Marca</label>
                  <input
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.brand || ''}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">Nombre Técnico</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-muted block mb-1">Categoría</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    value={form.category || 'cctv'}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="cctv">CCTV & Video</option>
                    <option value="redes">Redes & Fibra</option>
                    <option value="accesos">Control Acceso</option>
                    <option value="canalizacion">Canalización</option>
                    <option value="herramientas">Consumibles</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">Unidad</label>
                  <input
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.unit || 'UND'}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">Stock Lima</label>
                  <input
                    type="number"
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.stock ?? 10}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">Costo Unitario (PEN)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  value={form.unit_cost_pen ?? 0}
                  onChange={(e) => setForm({ ...form, unit_cost_pen: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">Especificaciones Técnicas</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-xs focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted"
                onClick={() => setModalType(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                onClick={saveProduct}
              >
                Guardar Equipo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear/Editar Ensamblaje */}
      {modalType === 'assembly' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-md bg-[#E5EBF2] p-6 rounded-2xl space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #94a3b8' }}
          >
            <h3 className="text-lg font-bold text-primary">
              {form.id ? 'Editar Kit / Ensamblaje' : 'Nuevo Kit de Instalación'}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-muted block mb-1">Código</label>
                  <input
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.code || ''}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">Categoría</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    value={form.category || 'cctv'}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="cctv">CCTV</option>
                    <option value="redes">Redes</option>
                    <option value="accesos">Accesos</option>
                    <option value="videoportero">Videoportero</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">Nombre del Kit</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-muted block mb-1">H. Cableado</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.hours_cabling ?? 1}
                    onChange={(e) => setForm({ ...form, hours_cabling: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">H. Montaje</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.hours_mounting ?? 2}
                    onChange={(e) => setForm({ ...form, hours_mounting: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">H. Config</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.hours_config ?? 0.5}
                    onChange={(e) => setForm({ ...form, hours_config: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-muted block mb-1">Costo Materiales S/</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.unit_cost_pen ?? 200}
                    onChange={(e) => setForm({ ...form, unit_cost_pen: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">Tarifa M.O. Punto S/</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.reference_cost_per_point ?? 70}
                    onChange={(e) =>
                      setForm({ ...form, reference_cost_per_point: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted"
                onClick={() => setModalType(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                onClick={saveAssembly}
              >
                Guardar Kit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear/Editar Proveedor */}
      {modalType === 'supplier' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-md bg-[#E5EBF2] p-6 rounded-2xl space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #94a3b8' }}
          >
            <h3 className="text-lg font-bold text-primary">
              {form.id ? 'Editar Mayorista' : 'Nuevo Mayorista'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted block mb-1">Razón Social</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">RUC (11 dígitos)</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  value={form.ruc || ''}
                  onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">Ejecutivo de Cuenta</label>
                <input
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                  value={form.contact_name || ''}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted"
                onClick={() => setModalType(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                onClick={saveSupplier}
              >
                Guardar Mayorista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Oferta de Proveedor */}
      {modalType === 'offer' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-md bg-[#E5EBF2] p-6 rounded-2xl space-y-4"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #94a3b8' }}
          >
            <h3 className="text-lg font-bold text-primary">Agregar Oferta Mayorista</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted block mb-1">Proveedor Mayorista</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: Number(e.target.value) })}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-muted block mb-1">Moneda</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PEN">PEN (S/)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">Costo Neto</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 rounded-xl bg-[#E5EBF2] text-sm focus:outline-none"
                    style={{ boxShadow: 'inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff' }}
                    value={form.unit_cost}
                    onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-primary mt-2">
                  <input
                    type="checkbox"
                    checked={form.is_preferred}
                    onChange={(e) => setForm({ ...form, is_preferred: e.target.checked })}
                  />
                  <span>Marcar como oferta preferida (RN-01)</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted"
                onClick={() => setModalType(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-secondary-container text-white text-xs font-bold"
                onClick={saveOffer}
              >
                Guardar Oferta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
