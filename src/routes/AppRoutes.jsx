import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../store/AuthContext';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';

import MainLayout from '../shared/components/layout/MainLayout';
import AuthLayout from '../modules/auth/layouts/AuthLayout';

import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';

import TrabajadoresPage from '../modules/trabajadores/pages/TrabajadoresPage';
import InventarioPage from '../modules/inventario/pages/InventarioPage';
import NewSalePage from '../modules/ventas/pages/NewSalePage';
import CotizacionPage from '../modules/cotizaciones/pages/CotizacionPage';
import RegistrosPage from '../modules/registros/pages/RegistrosPage';
import ReportesPage from '../modules/reportes/pages/ReportesPage';
import ClientsPage from '../modules/crm/pages/ClientsPage';
import ConfigPage from '../modules/configuracion/pages/ConfigPage';
import ServicesPage from '../modules/servicios/pages/ServicesPage';
import ProyectosPage from '../modules/proyectos/pages/ProyectosPage';
import ProvidersPage from '../modules/compras/pages/ProvidersPage';
import PurchaseOrdersPage from '../modules/compras/pages/PurchaseOrdersPage';

export default function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route index element={<Navigate to="/auth/login" />} />
        </Route>

        {/* Rutas Privadas */}
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
          <Route path="servicios" element={<ServicesPage />} />
          <Route path="ventas" element={<NewSalePage />} />
          <Route path="cotizaciones" element={<CotizacionPage />} />
          <Route path="proyectos" element={<ProyectosPage />} />
          <Route path="registros" element={<RegistrosPage />} />
          <Route path="crm" element={<ClientsPage />} />

          <Route path="compras/proveedores" element={
            <RoleRoute allowedRoles={['admin', 'bodeguero']}>
              <ProvidersPage />
            </RoleRoute>
          } />
          <Route path="compras/ordenes" element={
            <RoleRoute allowedRoles={['admin', 'bodeguero']}>
              <PurchaseOrdersPage />
            </RoleRoute>
          } />

          <Route path="reportes/*" element={<ReportesPage />} />
          <Route path="configuracion" element={<ConfigPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/auth/login" />} />
      </Routes>
    </AuthProvider>
  );
}