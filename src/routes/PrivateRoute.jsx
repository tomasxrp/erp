import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PrivateRoute({ children }) {
  // Como usamos el hook useAuth, ya tenemos acceso al estado global
  const { user, loading } = useAuth(); // Nota: user viene del context, no necesitamos pasarlo como prop

  // Si authContext está cargando (verificando sesión), mostramos un spinner
  if (loading && !user) {
     // Aquí podríamos acceder al loading state del context si lo expusiéramos
     // Pero por simplicidad, asumimos que si user es null podría estar cargando inicialmente
     // Una mejor implementación es exponer 'loading' desde AuthContext (ya lo agregué arriba)
     return (
       <div className="h-screen w-full flex items-center justify-center bg-gray-50">
         <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
       </div>
     );
  }

  // Si terminó de cargar y no hay usuario, redirect
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Si hay usuario, renderizar el contenido protegido
  return children;
}