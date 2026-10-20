import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { PageTitle } from '../Layout';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [log, setLog] = useState<any[]>([]);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'vendedor' });
  const load = useCallback(() => { api('/users').then(setUsers); api('/audit-log').then(setLog); }, []);
  useEffect(load, [load]);
  const add = async () => { await api('/users', { method: 'POST', body: form }); setForm({ full_name: '', email: '', role: 'vendedor' }); load(); };
  const toggle = async (u: any) => { await api(`/users/${u.id}`, { method: 'PATCH', body: { is_active: u.is_active ? 0 : 1 } }); load(); };
  return (
    <>
      <PageTitle title="Administración" sub="Usuarios y bitácora de auditoría" />
      <div className="neu mb-6 p-6">
        <h2 className="mb-3 font-bold text-primary">Usuarios</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-4">
          <input className="input" placeholder="Nombre" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input className="input" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{['vendedor', 'tecnico', 'gerencia', 'admin'].map((r) => <option key={r}>{r}</option>)}</select>
          <button className="btn-primary" disabled={!form.full_name || !form.email} onClick={add}>Crear</button>
        </div>
        <table className="w-full text-left text-sm"><tbody>
          {users.map((u) => (<tr key={u.id} className="border-t border-slate-300/60"><td className="py-2 font-semibold">{u.full_name}</td><td>{u.email}</td><td className="capitalize">{u.role}</td>
            <td className="text-right"><button className="btn-soft !px-3 !py-1" onClick={() => toggle(u)}>{u.is_active ? 'Desactivar' : 'Activar'}</button></td></tr>))}
        </tbody></table>
      </div>
      <div className="neu overflow-x-auto p-6">
        <h2 className="mb-3 font-bold text-primary">Bitácora de auditoría</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted"><tr><th className="py-2">Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th></tr></thead>
          <tbody>{log.map((l) => (<tr key={l.id} className="border-t border-slate-300/60"><td className="py-2">{new Date(l.created_at).toLocaleString('es-PE')}</td><td>{l.user}</td><td>{l.action}</td><td>{l.entity_type} #{l.entity_id}</td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
