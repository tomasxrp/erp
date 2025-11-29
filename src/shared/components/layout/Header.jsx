import { Bell, Search, User, Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from "../../hooks/useTheme";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    // CORRECCIÓN: Fondo con opacidad y soporte dark mode
    <header className="h-20 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300 backdrop-blur-md border-b bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
      
      {/* Botón menú móvil */}
      <button className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
        <Menu size={24} />
      </button>

      {/* Barra de búsqueda */}
      {/* CORRECCIÓN: El contenedor del input ahora es dark:bg-slate-800 */}
      <div className="hidden md:flex items-center rounded-full px-4 py-2.5 w-96 transition-colors bg-slate-100 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20">
        <Search size={18} className="text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Buscar productos, clientes..." 
          className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Acciones derecha */}
      <div className="flex items-center gap-3">
        {/* Toggle Theme */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
        </button>
        
        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:shadow-lg transition-shadow">
          <User size={20} />
        </div>
      </div>
    </header>
  );
}