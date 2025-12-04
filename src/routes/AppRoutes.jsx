import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../store/AuthContext';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute'; // Asegúrate de tener este componente

import MainLayout from '../shared/components/layout/MainLayout';
import AuthLayout from '../modules/auth/layouts/AuthLayout';

import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';

// Páginas de Módulos
import TrabajadoresPage from '../modules/trabajadores/pages/TrabajadoresPage';
import InventarioPage from '../modules/inventario/pages/InventarioPage';
import NewSalePage from '../modules/ventas/pages/NewSalePage';
import RegistrosPage from '../modules/registros/pages/RegistrosPage'; // Usamos Registros en vez de Cotizaciones
import ReportesPage from '../modules/reportes/pages/ReportesPage';
import ClientsPage from '../modules/crm/pages/ClientsPage';
import ConfigPage from '../modules/configuracion/pages/ConfigPage';
import ServicesPage from '../modules/servicios/pages/ServicesPage';
import ProyectosPage from '../modules/proyectos/pages/ProyectosPage';

// Páginas de Compras (NUEVAS)
import ProvidersPage from '../modules/compras/pages/ProvidersPage';
import PurchaseOrdersPage from '../modules/compras/pages/PurchaseOrdersPage';

export default function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas Públicas (Auth) */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route index element={<Navigate to="/auth/login" />} />
        </Route>

        {/* Rutas Privadas (Dashboard) - TODO ESTO TIENE SIDEBAR */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout /> 
            </PrivateRoute>
          }
        >
          {/* Redirección inicial */}
          <Route index element={<Navigate to="/inventario" replace />} />
          
          {/* Módulos Generales */}
          <Route path="trabajadores/*" element={<TrabajadoresPage />} />
          <Route path="inventario/*" element={<InventarioPage />} />
          <Route path="servicios" element={<ServicesPage />} />
          <Route path="ventas" element={<NewSalePage />} />
          <Route path="proyectos" element={<ProyectosPage />} />
          <Route path="registros" element={<RegistrosPage />} />
          <Route path="crm" element={<ClientsPage />} />
          
          {/* --- AQUÍ ESTÁ LA CORRECCIÓN: Rutas de Compras DENTRO del Layout --- */}
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

          {/* Módulos Administrativos */}
          <Route path="reportes/*" element={<ReportesPage />} />
          <Route path="configuracion" element={<ConfigPage />} />
          
        </Route>

        {/* Ruta 404 / Catch-all */}
        <Route path="*" element={<Navigate to="/auth/login" />} />
      </Routes>
    </AuthProvider>
  );
}