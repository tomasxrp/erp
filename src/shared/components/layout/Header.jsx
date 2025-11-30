import { Bell, Search, Moon, Sun, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../../store/AuthContext';

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    const confirm = window.confirm("¿Estás seguro que deseas cerrar sesión?");
    if (confirm) {
      await signOut();
    }
  };

  const userName = user?.user_metadata?.full_name || 'Usuario';
  const userEmail = user?.email || 'Sin correo';

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 transition-colors duration-300 backdrop-blur-md border-b bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
      
      {/* Lado Izquierdo: Menú Móvil y Buscador */}
      <div className="flex items-center gap-4">
        {/* Botón menú móvil */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Barra de búsqueda (Oculta en móviles muy pequeños, visible en tablets+) */}
        <div className="hidden md:flex items-center rounded-full px-4 py-2.5 w-64 lg:w-96 transition-colors bg-slate-100 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20">
          <Search size={18} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Lado Derecho: Acciones y Perfil */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Botones de Sistema */}
        <div className="flex items-center gap-1 md:gap-2 border-r border-slate-200 dark:border-slate-700 pr-2 md:pr-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="hidden sm:block p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>
        </div>
        
        {/* Perfil */}
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden lg:block text-right leading-tight">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
              {userName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
              {userEmail}
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-md">
               <img 
                 src={`https://ui-avatars.com/api/?name=${userName}&background=random&color=fff`} 
                 alt="Avatar" 
                 className="h-full w-full rounded-full bg-slate-900 object-cover"
               />
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}