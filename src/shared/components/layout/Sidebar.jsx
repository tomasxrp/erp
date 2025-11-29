import { NavLink } from 'react-router-dom';
import { Users, Package, FileText, ShoppingCart, BarChart3, Box } from 'lucide-react';

const menuItems = [
  { path: '/inventario', label: 'Inventario', icon: Package },
  { path: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { path: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { path: '/trabajadores', label: 'Trabajadores', icon: Users },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    // CORRECCIÓN: bg-white dark:bg-slate-900 y border-slate-200 dark:border-slate-800
    <aside className="w-64 h-screen fixed left-0 top-0 hidden md:flex flex-col z-20 transition-colors duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      
      {/* Logo Area */}
      <div className="p-6 h-20 flex items-center border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Box className="text-white h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            ERP System
          </h1>
        </div>
      </div>
      
      {/* Menu Area */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <item.icon size={20} className={({isActive}) => isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-center shadow-lg">
          <p className="text-xs text-slate-400 mb-2">Plan Enterprise</p>
          <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-3/4"></div>
          </div>
        </div>
      </div>
    </aside>
  );
}