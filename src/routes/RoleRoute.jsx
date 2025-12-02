import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RoleRoute({ children, allowedRoles = [] }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  // Si no hay perfil cargado, mandar a login
  if (!profile) return <Navigate to="/auth/login" replace />;

  // Si la ruta es pública (array vacío), dejar pasar a todos los autenticados
  if (allowedRoles.length === 0) return children;

  // Verificar si el usuario tiene AL MENOS UNO de los roles permitidos
  // (Manejamos profile.role como array, aunque venga como string por seguridad)
  const userRoles = Array.isArray(profile.role) ? profile.role : [profile.role];
  const hasAccess = userRoles.some(role => allowedRoles.includes(role));

  if (!hasAccess) {
    // Si no tiene permiso, mostramos pantalla de acceso denegado
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <span className="text-4xl">🚫</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2">No tienes permisos para ver esta sección.</p>
        <p className="text-xs text-slate-400 mt-4">Roles requeridos: {allowedRoles.join(', ')}</p>
      </div>
    );
  }

  return children;
}