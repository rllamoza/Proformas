export type Role = 'vendedor' | 'tecnico' | 'gerencia' | 'admin';

export interface User { id: number; full_name: string; email: string; role: Role }

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: opts.method ?? 'GET',
    credentials: 'include',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.error?.code ?? 'ERROR', json?.error?.message ?? 'Error inesperado', res.status);
  return json.data as T;
}

export const money = (n: number | undefined | null) =>
  `S/ ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const canSeeCosts = (r?: Role) => r === 'gerencia' || r === 'admin';

export const STATUS_STYLE: Record<string, string> = {
  borrador: 'bg-slate-200 text-slate-700',
  en_aprobacion: 'bg-amber-100 text-amber-800',
  emitida: 'bg-blue-100 text-blue-800',
  enviada: 'bg-indigo-100 text-indigo-800',
  aceptada: 'bg-emerald-100 text-emerald-800',
  rechazada: 'bg-red-100 text-red-800',
  vencida: 'bg-orange-100 text-orange-800',
  anulada: 'bg-slate-300 text-slate-600',
};
