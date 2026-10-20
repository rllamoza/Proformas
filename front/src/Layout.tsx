import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { api, Role, User } from './api';
import { DEFAULT_COMPANY_PROFILE } from './components/CorporateProformaDocument';

export const Icon = ({
  n,
  className = '',
  style,
}: {
  n: string;
  className?: string;
  style?: CSSProperties;
}) => (
  <span className={`material-symbols-outlined ${className}`} style={style}>
    {n}
  </span>
);

interface NavItem {
  to: string;
  icon: string;
  label: string;
  roles: Role[];
}

const NAV: NavItem[] = [
  { to: '/', icon: 'dashboard', label: 'Inicio', roles: ['vendedor', 'tecnico', 'gerencia', 'admin'] },
  { to: '/proformas', icon: 'request_quote', label: 'Proformas', roles: ['vendedor', 'gerencia', 'admin'] },
  { to: '/visitas', icon: 'group', label: 'Clientes', roles: ['vendedor', 'tecnico', 'gerencia', 'admin'] },
  { to: '/catalogo', icon: 'inventory_2', label: 'Catálogo', roles: ['vendedor', 'tecnico', 'gerencia', 'admin'] },
  { to: '/catalogo?tab=ensamblajes', icon: 'precision_manufacturing', label: 'Ensamblajes', roles: ['vendedor', 'tecnico', 'gerencia', 'admin'] },
  { to: '/ordenes', icon: 'build_circle', label: 'Servicios', roles: ['tecnico', 'gerencia', 'admin', 'vendedor'] },
  { to: '/parametros', icon: 'tune', label: 'Parámetros', roles: ['gerencia', 'admin'] },
  { to: '/reportes', icon: 'bar_chart', label: 'Reportes', roles: ['gerencia', 'admin'] },
];

export interface ExchangeRateInfo {
  source: string;
  location: string;
  rate_date: string;
  usd_to_pen_buy: number;
  usd_to_pen_sell: number;
  sunat_official: number;
}

export function Layout() {
  const { user, logout, setUserState } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Top-right menus & modals
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'password' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Live Exchange Rate state (Lima, Perú)
  const [tc, setTc] = useState<ExchangeRateInfo>({
    source: 'SUNAT Oficial Perú (free.e-api.net.pe)',
    location: 'Lima, Perú',
    rate_date: new Date().toISOString().slice(0, 10),
    usd_to_pen_buy: 3.72,
    usd_to_pen_sell: 3.75,
    sunat_official: 3.75,
  });
  const [syncingTc, setSyncingTc] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(DEFAULT_COMPANY_PROFILE);

  const refreshCompanyProfile = async () => {
    try {
      const data = await api<any>('/company-profile');
      if (data && data.business_name) setCompanyProfile(data);
    } catch {
      // Fallback
    }
  };

  // Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Autorización requerida: PF-2026-0006',
      desc: 'Edificio Mirador · Margen propuesto 16.5% bajo el mínimo.',
      time: 'Hace 10 min',
      unread: true,
      link: '/proformas/6',
      icon: 'gavel',
    },
    {
      id: 2,
      title: 'Descuento excedido: PF-2026-0007',
      desc: 'Colegio Los Cedros · Descuento solicitado 12.0% (tope 5%).',
      time: 'Hace 25 min',
      unread: true,
      link: '/proformas/7',
      icon: 'percent',
    },
    {
      id: 3,
      title: 'Tipo de Cambio SUNAT sincronizado',
      desc: 'Actualizado automáticamente desde servicio público Lima, Perú.',
      time: 'Hoy',
      unread: false,
      link: '/parametros',
      icon: 'currency_exchange',
    },
  ]);

  // Profile & password forms
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '999 888 777',
    zone: 'Lima Metropolitana',
  });
  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [modalError, setModalError] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Load Live Exchange Rate on mount
  const fetchLiveTc = async (force = false) => {
    setSyncingTc(true);
    try {
      const data = await api<ExchangeRateInfo>(
        `/exchange-rate/live${force ? '?refresh=1' : ''}`,
        force ? { method: 'POST' } : undefined
      );
      if (data && data.usd_to_pen_sell) {
        setTc(data);
        if (force) {
          notify(
            `TC Lima Perú actualizado: Compra S/ ${data.usd_to_pen_buy.toFixed(3)} · Venta S/ ${data.usd_to_pen_sell.toFixed(3)}`
          );
        }
      }
    } catch {
      // Fallback
    } finally {
      setSyncingTc(false);
    }
  };

  useEffect(() => {
    fetchLiveTc(false);
    refreshCompanyProfile();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = NAV.filter((i) => user && i.roles.includes(user.role));

  const roleTitle = (r?: string) => {
    switch (r) {
      case 'gerencia':
        return 'Gerencia General';
      case 'admin':
        return 'Administrador';
      case 'vendedor':
        return 'Asesor Comercial';
      case 'tecnico':
        return 'Jefe Técnico';
      default:
        return 'Usuario';
    }
  };

  const openProfileModal = () => {
    setProfileForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: (user as any)?.phone || '999 888 777',
      zone: (user as any)?.zone || 'Lima Metropolitana',
    });
    setModalError('');
    setUserMenuOpen(false);
    setActiveModal('profile');
  };

  const openPasswordModal = () => {
    setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    setModalError('');
    setUserMenuOpen(false);
    setActiveModal('password');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    try {
      const updated = await api<User>('/auth/profile', {
        method: 'PUT',
        body: profileForm,
      });
      setUserState(updated);
      setActiveModal(null);
      notify('Perfil de usuario actualizado correctamente');
    } catch (err: any) {
      setModalError(err.message || 'No se pudo actualizar el perfil.');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (pwdForm.new_password.length < 6) {
      setModalError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      setModalError('La confirmación de contraseña no coincide.');
      return;
    }
    try {
      await api('/auth/password/change', {
        method: 'POST',
        body: {
          current_password: pwdForm.current_password,
          new_password: pwdForm.new_password,
        },
      });
      setActiveModal(null);
      notify('Contraseña actualizada exitosamente');
    } catch (err: any) {
      setModalError(err.message || 'Contraseña actual incorrecta.');
    }
  };

  const handleSwitchRole = async (role: Role) => {
    try {
      const switched = await api<User>('/auth/switch-role', {
        method: 'POST',
        body: { role },
      });
      setUserState(switched);
      setUserMenuOpen(false);
      notify(`Vista cambiada a: ${roleTitle(switched.role)} (${switched.full_name})`);
      nav('/');
    } catch (err: any) {
      notify(err.message || 'Error al cambiar de rol');
    }
  };

  const isNavItemActive = (to: string) => {
    const full = location.pathname + location.search;
    if (to === '/') return location.pathname === '/';
    if (to === '/catalogo?tab=ensamblajes') return full === '/catalogo?tab=ensamblajes';
    if (to === '/catalogo') return location.pathname === '/catalogo' && location.search !== '?tab=ensamblajes';
    return location.pathname.startsWith(to);
  };

  const link = (i: NavItem) => {
    const active = isNavItemActive(i.to);
    return (
      <NavLink
        key={i.to}
        to={i.to}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
          active
            ? 'shadow-[inset_-4px_-4px_8px_rgba(255,255,255,0.9),inset_4px_4px_8px_rgba(148,163,184,0.5)] bg-surface-container-low text-primary font-bold'
            : 'text-on-surface-variant hover:text-on-surface shadow-[-4px_-4px_9px_rgba(255,255,255,0.85),4px_4px_9px_rgba(148,163,184,0.35)] hover:shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),2px_2px_6px_rgba(148,163,184,0.45)]'
        }`}
      >
        <Icon n={i.icon} className="text-[20px]" />
        <span>{i.label}</span>
      </NavLink>
    );
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-lg flex items-center gap-2">
          <Icon n="check_circle" className="text-secondary-container text-[18px]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sidebar Desktop - 248px */}
      <aside
        className={`${
          open ? 'flex' : 'hidden'
        } fixed left-0 top-0 bottom-0 h-full w-[248px] bg-background z-50 flex-col justify-between py-6 px-4 shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)] lg:flex`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo Brand Header (Personalizable desde Parámetros > Identidad Corporativa) */}
          <div
            onClick={() => nav('/parametros')}
            title={`${companyProfile?.business_name || 'PRECISION SYSTEMS S.A.C.'} · RUC ${companyProfile?.ruc || '20601234567'} (Clic para personalizar logos y datos)`}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-background shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),4px_4px_10px_rgba(148,163,184,0.35)] cursor-pointer hover:ring-1 hover:ring-secondary/40 transition-all"
          >
            {companyProfile?.logo_url ? (
              <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                <img
                  src={companyProfile.logo_url}
                  alt={companyProfile.trade_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-lg text-on-primary flex items-center justify-center shadow-[-2px_-2px_6px_rgba(255,255,255,0.6),2px_2px_6px_rgba(27,42,73,0.4)] shrink-0"
                style={{ backgroundColor: companyProfile?.primary_color || '#1b2a49' }}
              >
                <Icon n="router" className="text-[20px]" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[16px] font-extrabold text-primary tracking-tight leading-none truncate">
                {companyProfile?.trade_name || 'PROFORMAS'}
              </span>
              <span
                className="text-[10px] tracking-widest uppercase font-bold mt-0.5 truncate"
                style={{ color: companyProfile?.accent_color || '#a23f00' }}
              >
                {companyProfile?.trade_subtitle || 'Instalaciones PE'}
              </span>
            </div>
            <div className="ml-auto text-on-surface-variant flex items-center shrink-0">
              <Icon n="videocam" className="text-[18px]" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2.5">{items.map((i) => link(i))}</nav>
        </div>

        {/* Footer Support & Session Box */}
        <div className="flex flex-col gap-2">
          <div className="px-3 py-2 rounded-xl bg-background shadow-[inset_-3px_-3px_7px_rgba(255,255,255,0.8),inset_3px_3px_7px_rgba(148,163,184,0.4)] flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface-variant">Soporte Técnico</span>
            <Icon n="help_center" className="text-secondary text-[18px]" />
          </div>

          <button
            onClick={async () => {
              await logout();
              nav('/login');
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-on-surface-variant hover:text-primary shadow-[-2px_-2px_6px_rgba(255,255,255,0.85),2px_2px_6px_rgba(148,163,184,0.35)] active:shadow-[inset_2px_2px_4px_rgba(148,163,184,0.4)] transition-all"
          >
            <Icon n="logout" className="text-[15px]" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main shell offset */}
      <div className="lg:pl-[248px]">
        {/* Top Header */}
        <header className="fixed top-0 left-0 lg:left-[248px] right-0 h-16 bg-background/90 backdrop-blur-md z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-[0_4px_12px_rgba(148,163,184,0.18)]">
          {/* Left SUNAT Live Exchange Rate & Tax indicators */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(148,163,184,0.35)] text-primary"
              onClick={() => setOpen(!open)}
            >
              <Icon n={open ? 'close' : 'menu'} className="text-[20px]" />
            </button>

            <button
              type="button"
              onClick={() => fetchLiveTc(true)}
              title={`Fuente: ${tc.source} (${tc.location}) · Compra: S/ ${tc.usd_to_pen_buy.toFixed(3)} | Venta: S/ ${tc.usd_to_pen_sell.toFixed(3)} · Clic para actualizar en tiempo real`}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.8),inset_2px_2px_5px_rgba(148,163,184,0.4)] hover:ring-1 hover:ring-secondary/40 transition-all cursor-pointer"
            >
              <Icon
                n="currency_exchange"
                className={`text-secondary text-[18px] ${syncingTc ? 'animate-spin' : ''}`}
              />
              <span className="text-xs font-medium text-on-surface-variant">TC SUNAT:</span>
              <span className="text-sm text-primary font-bold tabular-nums">
                S/ {tc.usd_to_pen_sell.toFixed(3)}
              </span>
              <span className="hidden md:inline-block text-[10px] text-emerald-700 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                Lima · Vivo
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low shadow-[-2px_-2px_5px_rgba(255,255,255,0.8),2px_2px_5px_rgba(148,163,184,0.3)]">
              <span className="text-xs font-medium text-on-surface-variant">IGV Activo:</span>
              <span className="text-xs text-primary font-bold">18.00%</span>
            </div>
          </div>

          {/* Right User profile & Notifications */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                aria-label="Notificaciones"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserMenuOpen(false);
                }}
                className="relative w-10 h-10 rounded-full bg-background flex items-center justify-center text-on-surface-variant hover:text-primary shadow-[-3px_-3px_7px_rgba(255,255,255,0.9),3px_3px_7px_rgba(148,163,184,0.4)] active:shadow-[inset_2px_2px_4px_rgba(148,163,184,0.45),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] transition-all"
                type="button"
              >
                <Icon n="notifications" className="text-[20px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-background animate-pulse" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-surface p-4 shadow-[-8px_-8px_20px_rgba(255,255,255,0.95),8px_8px_24px_rgba(148,163,184,0.55)] border border-white/60 z-50">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-300/60">
                    <div className="flex items-center gap-1.5">
                      <Icon n="notifications_active" className="text-secondary text-[18px]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Centro de Notificaciones
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
                      }
                      className="text-[11px] font-semibold text-secondary hover:underline"
                    >
                      Marcar leídas
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNotifications((prev) =>
                            prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
                          );
                          setNotifOpen(false);
                          nav(n.link);
                        }}
                        className={`cursor-pointer p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                          n.unread
                            ? 'bg-surface-container-low shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.85),inset_2px_2px_5px_rgba(148,163,184,0.35)]'
                            : 'hover:bg-surface-container/50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-secondary shrink-0 shadow-neu-xs mt-0.5">
                          <Icon n={n.icon} className="text-[17px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-primary truncate">{n.title}</p>
                            {n.unread && <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />}
                          </div>
                          <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5">
                            {n.desc}
                          </p>
                          <span className="text-[10px] text-muted font-medium mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive User Menu in Top-Right Corner */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotifOpen(false);
                }}
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2.5 pl-3 pr-1.5 py-1 rounded-full bg-background shadow-[-4px_-4px_9px_rgba(255,255,255,0.9),4px_4px_9px_rgba(148,163,184,0.35)] hover:shadow-[-2px_-2px_6px_rgba(255,255,255,0.95),2px_2px_6px_rgba(148,163,184,0.45)] active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] transition-all cursor-pointer"
              >
                <div className="hidden sm:flex flex-col text-right pr-0.5">
                  <span className="text-xs text-primary font-bold leading-tight truncate max-w-[150px]">
                    {user?.full_name || 'Carlos Mendoza'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant leading-none mt-0.5">
                    {roleTitle(user?.role)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-[-2px_-2px_5px_rgba(255,255,255,0.6),2px_2px_5px_rgba(27,42,73,0.45)]">
                  <Icon n="person" className="text-[18px]" />
                </div>
                <Icon
                  n={userMenuOpen ? 'expand_less' : 'expand_more'}
                  className="text-[18px] text-on-surface-variant mr-0.5"
                />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-surface p-4 shadow-[-8px_-8px_20px_rgba(255,255,255,0.95),8px_8px_24px_rgba(148,163,184,0.55)] border border-white/60 z-50 flex flex-col gap-3">
                  {/* User Identity Header */}
                  <div className="p-3 rounded-xl bg-surface-container-low shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.85),inset_2px_2px_5px_rgba(148,163,184,0.35)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {(user?.full_name || 'CM').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-primary truncate">{user?.full_name}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-secondary-container/15 text-secondary text-[10px] font-bold uppercase">
                        {roleTitle(user?.role)}
                      </span>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={openProfileModal}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-surface-container-low transition-all text-left"
                    >
                      <Icon n="badge" className="text-[18px] text-secondary" />
                      <span>Mi Perfil y Datos de Contacto</span>
                    </button>

                    <button
                      type="button"
                      onClick={openPasswordModal}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-surface-container-low transition-all text-left"
                    >
                      <Icon n="lock_reset" className="text-[18px] text-secondary" />
                      <span>Cambiar Contraseña</span>
                    </button>

                    {(user?.role === 'admin' || user?.role === 'gerencia') && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          nav('/parametros');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-surface-container-low transition-all text-left"
                      >
                        <Icon n="currency_exchange" className="text-[18px] text-secondary" />
                        <span>Parámetros SUNAT y Tipo de Cambio</span>
                      </button>
                    )}

                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          nav('/admin');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-surface-container-low transition-all text-left"
                      >
                        <Icon n="admin_panel_settings" className="text-[18px] text-secondary" />
                        <span>Gestión de Usuarios y Auditoría</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Role Switcher for Demo / Testing */}
                  <div className="pt-2 border-t border-slate-300/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5 px-1">
                      Cambiar Vista Rápida (Demo Roles)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { r: 'gerencia', l: 'Gerencia' },
                          { r: 'admin', l: 'Admin' },
                          { r: 'vendedor', l: 'Vendedor' },
                          { r: 'tecnico', l: 'Técnico' },
                        ] as { r: Role; l: string }[]
                      ).map((item) => (
                        <button
                          key={item.r}
                          type="button"
                          onClick={() => handleSwitchRole(item.r)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                            user?.role === item.r
                              ? 'bg-primary text-white shadow-neu-xs'
                              : 'bg-surface-container text-primary hover:text-secondary'
                          }`}
                        >
                          <Icon
                            n={user?.role === item.r ? 'check_circle' : 'switch_account'}
                            className="text-[14px]"
                          />
                          <span>{item.l}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-2 border-t border-slate-300/60">
                    <button
                      type="button"
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                        nav('/login');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-error-container/60 text-on-error-container hover:bg-error hover:text-white text-xs font-bold transition-all"
                    >
                      <Icon n="logout" className="text-[16px]" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative pt-20 w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12 bg-background">
          <Outlet context={{ tc, fetchLiveTc, companyProfile, refreshCompanyProfile }} />
        </main>
      </div>

      {/* Modal: Editar Perfil */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl bg-surface w-full max-w-md p-6 shadow-[-8px_-8px_20px_rgba(255,255,255,0.9),8px_8px_20px_rgba(148,163,184,0.5)] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-secondary-container text-white flex items-center justify-center">
                  <Icon n="badge" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary">Mi Perfil de Usuario</h3>
                  <p className="text-xs text-on-surface-variant">{roleTitle(user?.role)} · Perú</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-on-surface-variant hover:text-primary"
              >
                <Icon n="close" className="text-[20px]" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
                {modalError}
              </div>
            )}

            <div>
              <label className="label">Nombre Completo</label>
              <input
                className="input"
                required
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Correo Corporativo</label>
              <input
                type="email"
                className="input"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Teléfono / WhatsApp</label>
                <input
                  className="input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Sede / Zona Asignada</label>
                <input
                  className="input"
                  value={profileForm.zone}
                  onChange={(e) => setProfileForm({ ...profileForm, zone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-surface text-primary text-xs font-semibold shadow-neu-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-neu-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Cambiar Contraseña */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSavePassword}
            className="rounded-2xl bg-surface w-full max-w-md p-6 shadow-[-8px_-8px_20px_rgba(255,255,255,0.9),8px_8px_20px_rgba(148,163,184,0.5)] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center">
                  <Icon n="lock_reset" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary">Actualizar Contraseña</h3>
                  <p className="text-xs text-on-surface-variant">Seguridad de cuenta corporativa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-on-surface-variant hover:text-primary"
              >
                <Icon n="close" className="text-[20px]" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
                {modalError}
              </div>
            )}

            <div>
              <label className="label">Contraseña Actual</label>
              <input
                type="password"
                className="input"
                required
                placeholder="Ingrese su contraseña actual (Ej: Secret123!)"
                value={pwdForm.current_password}
                onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Nueva Contraseña</label>
              <input
                type="password"
                className="input"
                required
                placeholder="Mínimo 6 caracteres"
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                className="input"
                required
                placeholder="Repita la nueva contraseña"
                value={pwdForm.confirm_password}
                onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-surface text-primary text-xs font-semibold shadow-neu-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-secondary-container text-white text-xs font-bold shadow-neu-xs"
              >
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around bg-background p-2 py-2.5 lg:hidden shadow-[0_-4px_16px_rgba(148,163,184,0.35)]">
        {items.slice(0, 5).map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === '/' || i.to === '/proformas'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-secondary scale-105' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            <Icon n={i.icon} className="text-[20px]" />
            <span>{i.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export const PageTitle = ({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">{title}</h1>
      {sub && <p className="text-sm font-medium text-on-surface-variant mt-1">{sub}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </div>
);

export const Stat = ({
  label,
  value,
  icon,
  sublabel,
  tone = 'text-primary',
}: {
  label: string;
  value: string;
  icon: string;
  sublabel?: string;
  tone?: string;
}) => (
  <div className="rounded-2xl bg-surface p-5 flex flex-col justify-between transition-all duration-200 shadow-[-6px_-6px_14px_rgba(255,255,255,0.85),6px_6px_14px_rgba(148,163,184,0.45)]">
    <div className="flex items-start justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low text-primary shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(148,163,184,0.35)]">
        <Icon n={icon} className="text-secondary text-[20px]" />
      </div>
    </div>
    <div className="my-2">
      <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${tone}`}>{value}</p>
    </div>
    {sublabel && (
      <div className="pt-1 text-xs text-on-surface-variant flex items-center gap-1 font-medium border-t border-slate-300/40">
        {sublabel}
      </div>
    )}
  </div>
);
