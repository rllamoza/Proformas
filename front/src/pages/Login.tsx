import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api } from '../api';
import { Icon } from '../Layout';

const QUICK = [
  { label: 'Vendedor', email: 'vendedor@empresa.pe' },
  { label: 'Técnico', email: 'tecnico@empresa.pe' },
  { label: 'Gerencia', email: 'gerencia@empresa.pe' },
  { label: 'Administrador', email: 'admin@empresa.pe' },
];

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('vendedor@empresa.pe');
  const [password, setPassword] = useState('Secret123!');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      nav('/');
    } catch (x: any) {
      setError(x.message || 'Error de autenticación.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    try {
      const res = await api('/auth/password/forgot', {
        method: 'POST',
        body: { email: forgotEmail },
      });
      setForgotMsg(res.message);
      if (res.dev_token) setResetToken(res.dev_token);
    } catch (e: any) {
      setForgotMsg(e.message);
    }
  };

  const handleReset = async () => {
    try {
      await api('/auth/password/reset', {
        method: 'POST',
        body: { token: resetToken, new_password: newPassword },
      });
      setForgotMsg('¡Contraseña restablecida con éxito! Ahora puede iniciar sesión.');
      setTimeout(() => setForgotModal(false), 2000);
    } catch (e: any) {
      setForgotMsg(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#E5EBF2] flex flex-col justify-between p-4 sm:p-6 selection:bg-secondary-container/20">
      <main className="w-full flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto relative">
          {/* Main Extruded Neumorphic Card (01_login_desktop) */}
          <div
            className="w-full bg-[#E5EBF2] p-6 sm:p-10 rounded-[28px] transition-all duration-300"
            style={{ boxShadow: '-14px -14px 28px #ffffff, 14px 14px 28px #cbd5e1' }}
          >
            {/* Header: Neumorphic Dual-Icon Badge & System Branding */}
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="relative w-20 h-20 rounded-full bg-[#E5EBF2] flex items-center justify-center mb-4"
                style={{ boxShadow: '-6px -6px 14px #ffffff, 6px 6px 14px #cbd5e1' }}
              >
                <div
                  className="w-14 h-14 rounded-full bg-[#E5EBF2] flex items-center justify-center relative"
                  style={{ boxShadow: 'inset -2px -2px 5px #ffffff, inset 2px 2px 5px #cbd5e1' }}
                >
                  <Icon n="router" className="text-primary text-[24px] absolute -translate-x-1.5 -translate-y-1" />
                  <Icon n="videocam" className="text-secondary-container text-[20px] absolute translate-x-2 translate-y-1.5" />
                </div>
                <span
                  className="absolute top-1 right-1 w-3.5 h-3.5 bg-secondary-container rounded-full ring-2 ring-[#E5EBF2]"
                  style={{ boxShadow: '0 0 8px rgba(255, 117, 43, 0.7)' }}
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                Proformas Instalaciones
              </h1>
              <p className="text-sm font-medium text-on-surface-variant mt-1">
                Sistema de Cotización y Gestión Técnica Especializada
              </p>
            </div>

            {/* Authentication Form */}
            <form onSubmit={submit} className="space-y-4">
              {/* Field 1: Correo */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center justify-between">
                  <span>Correo Institucional</span>
                  <span className="text-[11px] font-normal text-muted lowercase">@empresa.pe</span>
                </label>
                <div
                  className="relative flex items-center rounded-xl bg-[#E5EBF2] focus-within:ring-2 focus-within:ring-secondary-container/40"
                  style={{ boxShadow: 'inset 4px 4px 8px #cbd5e1, inset -4px -4px 8px #ffffff' }}
                >
                  <div className="pl-3.5 text-muted pointer-events-none">
                    <Icon n="alternate_email" className="text-[20px]" />
                  </div>
                  <input
                    className="w-full bg-transparent px-3 py-3 text-sm font-medium text-ink focus:outline-none"
                    type="email"
                    placeholder="nombre@empresa.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Field 2: Contraseña */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-primary">
                  Contraseña
                </label>
                <div
                  className="relative flex items-center rounded-xl bg-[#E5EBF2] focus-within:ring-2 focus-within:ring-secondary-container/40"
                  style={{ boxShadow: 'inset 4px 4px 8px #cbd5e1, inset -4px -4px 8px #ffffff' }}
                >
                  <div className="pl-3.5 text-muted pointer-events-none">
                    <Icon n="lock" className="text-[20px]" />
                  </div>
                  <input
                    className="w-full bg-transparent px-3 py-3 text-sm font-medium text-ink focus:outline-none"
                    type={show ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label="Mostrar contraseña"
                    className="mr-2 p-2 rounded-lg text-muted hover:text-primary transition-all active:scale-95"
                    style={{ boxShadow: '-2px -2px 5px #ffffff, 2px 2px 5px #cbd5e1' }}
                    onClick={() => setShow(!show)}
                  >
                    <Icon n={show ? 'visibility_off' : 'visibility'} className="text-[18px]" />
                  </button>
                </div>
              </div>

              {/* Utility Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center cursor-pointer select-none space-x-2">
                  <input type="checkbox" defaultChecked className="rounded accent-secondary-container" />
                  <span className="text-xs font-medium text-on-surface-variant">Recordar sesión</span>
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-secondary hover:text-secondary-container transition-colors underline decoration-secondary-container/40"
                  onClick={() => {
                    setForgotModal(true);
                    setForgotEmail(email);
                    setForgotMsg('');
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Error Box */}
              {error && (
                <div
                  className="p-3 bg-[#E5EBF2] rounded-xl flex items-center space-x-3"
                  style={{ boxShadow: 'inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff' }}
                >
                  <Icon n="error" className="text-error text-[20px]" />
                  <p className="text-xs font-semibold text-error">{error}</p>
                </div>
              )}

              {/* Main Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F26B21] to-[#ff752b] text-white font-bold text-base flex items-center justify-center space-x-2 transition-all duration-150 hover:brightness-105 active:translate-y-0.5 disabled:opacity-50"
                  style={{ boxShadow: '-5px -5px 12px rgba(255, 255, 255, 0.8), 5px 5px 16px rgba(242, 107, 33, 0.45)' }}
                >
                  <span>{busy ? 'Verificando credenciales…' : 'Ingresar al sistema'}</span>
                  <Icon n="arrow_forward" className="text-[20px]" />
                </button>
              </div>
            </form>

            {/* Role Demo Quick Switcher */}
            <div className="mt-8 pt-4 border-t border-slate-300/60">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted text-center mb-2.5">
                Acceso Demostrativo Rápido por Rol
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q.email}
                    type="button"
                    className="py-2 px-2.5 rounded-xl text-xs font-bold text-primary transition-all duration-150 hover:text-secondary active:scale-95 text-center truncate"
                    style={{ boxShadow: '-3px -3px 7px #ffffff, 3px 3px 7px #cbd5e1' }}
                    onClick={() => {
                      setEmail(q.email);
                      setPassword('Secret123!');
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-md bg-[#E5EBF2] p-6 rounded-2xl"
            style={{ boxShadow: '-10px -10px 24px #ffffff, 10px 10px 24px #cbd5e1' }}
          >
            <h3 className="text-lg font-bold text-primary mb-2">Restablecer Contraseña</h3>
            <p className="text-xs text-muted mb-4">
              Ingrese su correo institucional para generar el enlace o token de recuperación.
            </p>
            <input
              className="w-full px-3 py-2.5 rounded-xl bg-[#E5EBF2] text-sm font-medium mb-3 focus:outline-none"
              style={{ boxShadow: 'inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff' }}
              placeholder="nombre@empresa.pe"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            {forgotMsg && (
              <p className="text-xs font-semibold text-secondary-container mb-3">{forgotMsg}</p>
            )}
            {resetToken ? (
              <div className="space-y-3">
                <input
                  type="password"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#E5EBF2] text-sm font-medium focus:outline-none"
                  style={{ boxShadow: 'inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff' }}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm"
                  onClick={handleReset}
                >
                  Guardar nueva contraseña
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted"
                  onClick={() => setForgotModal(false)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-secondary-container text-white text-xs font-bold"
                  onClick={handleForgot}
                >
                  Solicitar Token
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
