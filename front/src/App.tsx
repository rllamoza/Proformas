import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Layout } from './Layout';
import { Role } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Quotes from './pages/Quotes';
import QuoteDetail from './pages/QuoteDetail';
import QuoteWizard from './pages/QuoteWizard';
import SiteVisits from './pages/SiteVisits';
import WorkOrders from './pages/WorkOrders';
import Catalog from './pages/Catalog';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

function Guard({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E5EBF2] grid place-items-center text-primary font-bold">
        Cargando sistema de proformas…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const S: Role[] = ['vendedor', 'gerencia', 'admin'];
  const G: Role[] = ['gerencia', 'admin'];
  const T: Role[] = ['tecnico', 'vendedor', 'gerencia', 'admin'];

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="proformas"
          element={
            <Guard roles={S}>
              <Quotes />
            </Guard>
          }
        />
        <Route
          path="proformas/nueva"
          element={
            <Guard roles={S}>
              <QuoteWizard />
            </Guard>
          }
        />
        <Route
          path="proformas/:id/editar"
          element={
            <Guard roles={S}>
              <QuoteWizard />
            </Guard>
          }
        />
        <Route
          path="proformas/:id"
          element={
            <Guard roles={S}>
              <QuoteDetail />
            </Guard>
          }
        />
        <Route
          path="visitas"
          element={
            <Guard roles={T}>
              <SiteVisits />
            </Guard>
          }
        />
        <Route
          path="ordenes"
          element={
            <Guard roles={T}>
              <WorkOrders />
            </Guard>
          }
        />
        <Route path="catalogo" element={<Catalog />} />
        <Route
          path="reportes"
          element={
            <Guard roles={G}>
              <Reports />
            </Guard>
          }
        />
        <Route
          path="parametros"
          element={
            <Guard roles={G}>
              <Settings />
            </Guard>
          }
        />
        <Route
          path="admin"
          element={
            <Guard roles={['admin']}>
              <Admin />
            </Guard>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
