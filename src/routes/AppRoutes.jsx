import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../store/AuthContext';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute'; // <--- IMPORTAR

import MainLayout from '../shared/components/layout/MainLayout';
import AuthLayout from '../modules/auth/layouts/AuthLayout';

import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';

import TrabajadoresPage from '../modules/trabajadores/pages/TrabajadoresPage';
import InventarioPage from '../modules/inventario/pages/InventarioPage';
import NewSalePage from '../modules/ventas/pages/NewSalePage';
import ReportesPage from '../modules/reportes/pages/ReportesPage';
import ClientsPage from '../modules/crm/pages/ClientsPage';
import ConfigPage from '../modules/configuracion/pages/ConfigPage';
import ServicesPage from '../modules/servicios/pages/ServicesPage';
import RegistrosPage from '../modules/registros/pages/RegistrosPage';
import ProyectosPage from '../modules/proyectos/pages/ProyectosPage';

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
        <Route path="/" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
        }>
          {/* Redirección inicial segura (Trabajadores es accesible por todos) */}
          <Route index element={<Navigate to="/trabajadores" replace />} />
          
          {/* === RUTAS ADMINISTRADOR & VENDEDOR === */}
          <Route path="inventario/*" element={
            <RoleRoute allowedRoles={['admin', 'vendedor', 'bodeguero']}>
              <InventarioPage />
            </RoleRoute>
          } />

          <Route path="proyectos" element={
              <RoleRoute allowedRoles={['admin', 'bodeguero', 'vendedor']}>
                  <ProyectosPage />
              </RoleRoute>
          } />
          
          <Route path="servicios" element={
            <RoleRoute allowedRoles={['admin', 'vendedor','bodeguero']}>
              <ServicesPage />
            </RoleRoute>
          } />
          
          <Route path="ventas" element={
            <RoleRoute allowedRoles={['admin', 'vendedor']}>
              <NewSalePage />
            </RoleRoute>
          } />
          
          <Route path="crm" element={
            <RoleRoute allowedRoles={['admin', 'vendedor']}>
              <ClientsPage />
            </RoleRoute>
          } />
          
          <Route path="registros" element={
            <RoleRoute allowedRoles={['admin', 'vendedor']}>
              <RegistrosPage />
            </RoleRoute>
          } />
          
          {/* === RUTAS TODOS (Públicas internas) === */}
          <Route path="trabajadores/*" element={
            <RoleRoute allowedRoles={[]}> {/* Array vacío = Todos */}
              <TrabajadoresPage />
            </RoleRoute>
          } />

          {/* === RUTAS SOLO ADMINISTRADOR === */}
          <Route path="reportes/*" element={
            <RoleRoute allowedRoles={['admin']}>
              <ReportesPage />
            </RoleRoute>
          } />
          
          <Route path="configuracion" element={
            <RoleRoute allowedRoles={['admin']}>
              <ConfigPage />
            </RoleRoute>
          } />
          
        </Route>

        <Route path="*" element={<Navigate to="/auth/login" />} />
      </Routes>
    </AuthProvider>
  );
}