import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../store/AuthContext';
import PrivateRoute from './PrivateRoute';

import MainLayout from '../shared/components/layout/MainLayout';
import AuthLayout from '../modules/auth/layouts/AuthLayout';

import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';

// Páginas Módulos
import TrabajadoresPage from '../modules/trabajadores/pages/TrabajadoresPage';
import InventarioPage from '../modules/inventario/pages/InventarioPage';
import CotizacionesPage from '../modules/cotizaciones/pages/CotizacionesPage';
import VentasPage from '../modules/ventas/pages/VentasPage';
import ReportesPage from '../modules/reportes/pages/ReportesPage';
import ClientsPage from '../modules/crm/pages/ClientsPage';

export default function AppRoutes() {
  return (
    // Envolvemos todo en AuthProvider
    <AuthProvider>
      <Routes>
        {/* Rutas Públicas (Auth) */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route index element={<Navigate to="/auth/login" />} />
        </Route>

        {/* Rutas Privadas (Dashboard) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/inventario" replace />} />
          <Route path="trabajadores/*" element={<TrabajadoresPage />} />
          <Route path="inventario/*" element={<InventarioPage />} />
          <Route path="cotizaciones/*" element={<CotizacionesPage />} />
          <Route path="ventas/*" element={<VentasPage />} />
          <Route path="reportes/*" element={<ReportesPage />} />
          <Route path="crm" element={<ClientsPage />} />
          
        </Route>

        <Route path="*" element={<Navigate to="/auth/login" />} />
      </Routes>
    </AuthProvider>
  );
}