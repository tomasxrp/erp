import { NavLink } from 'react-router-dom';
import { Users, Package, FileText, ShoppingCart, BarChart3, Box, Briefcase, X , Settings, Wrench } from 'lucide-react';
import { useAuth } from '../../../store/AuthContext'; // <--- IMPORTAR

export default function Sidebar({ isOpen, onClose }) {
  const { profile } = useAuth(); // <--- OBTENER PERFIL

  // Función para verificar si mostramos el ítem
  const canView = (allowedRoles) => {
    if (!profile?.role) return false;
    if (allowedRoles.length === 0) return true; // Público para todos
    const userRoles = Array.isArray(profile.role) ? profile.role : [profile.role];
    return userRoles.some(r => allowedRoles.includes(r));
  };

  // Definir menú con sus permisos
  const menuItems = [
    { path: '/inventario', label: 'Inventario', icon: Package, roles: ['admin', 'vendedor','bodeguero'] },
    { path: '/servicios', label: 'Servicios', icon: Wrench, roles: ['admin', 'vendedor','bodeguero'] },
    { path: '/ventas', label: 'Ventas', icon: ShoppingCart, roles: ['admin', 'vendedor'] },
    { path: '/proyectos', label: 'Proyectos Activos', icon: Briefcase, roles: ['admin', 'bodeguero', 'vendedor'] },
    { path: '/crm', label: 'Clientes / CRM', icon: Briefcase, roles: ['admin', 'vendedor'] },
    { path: '/registros', label: 'Historial / Registros', icon: FileText, roles: ['admin', 'vendedor'] },
    { path: '/trabajadores', label: 'Trabajadores', icon: Users, roles: [] }, // [] = Todos
    { path: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['admin'] },
    { path: '/configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] }
  ];

  // Filtrar ítems visibles
  const visibleItems = menuItems.filter(item => canView(item.roles));

  return (
    <>
      {/* ... (El overlay y header del sidebar se mantienen igual) ... */}
      <div 
        className={`fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Area (Igual que antes) */}
        <div className="p-6 h-20 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Box className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              ERP System
            </h1>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>
        
        {/* Menu Area (Usamos visibleItems) */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        
      </aside>
    </>
  );
}