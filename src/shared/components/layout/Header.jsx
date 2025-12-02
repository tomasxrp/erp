import { useState } from 'react'; // <--- Importar useState
import { Bell, Search, Moon, Sun, Menu, LogOut } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../../store/AuthContext';
import ConfirmationModal from '../ui/ConfirmationModal'; // <--- IMPORTAR EL MODAL

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  
  // Estado para controlar el modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = async () => {
    await signOut();
  };

  const userName = user?.user_metadata?.full_name || 'Usuario';
  const userEmail = user?.email || 'Sin correo';

  return (
    <>
      <header className="h-20 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 transition-colors duration-300 backdrop-blur-md border-b bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
        
        {/* ... (El código del lado izquierdo y buscador sigue igual) ... */}
        <div className="flex items-center gap-4">
           <button onClick={onMenuClick} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
             <Menu size={24} />
           </button>
           {/* ... Buscador ... */}
        </div>

        {/* Lado Derecho */}
        <div className="flex items-center gap-2 md:gap-4">
          
          <div className="flex items-center gap-1 md:gap-2 border-r border-slate-200 dark:border-slate-700 pr-2 md:pr-4">
            <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {/* ... Bell ... */}
          </div>
          
          {/* Perfil */}
          <div className="flex items-center gap-3 pl-2">
            <div className="hidden lg:block text-right leading-tight">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{userName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">{userEmail}</p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-md">
                 <img src={`https://ui-avatars.com/api/?name=${userName}&background=random&color=fff`} alt="Avatar" className="h-full w-full rounded-full bg-slate-900 object-cover"/>
              </div>

              {/* CAMBIO AQUÍ: Al hacer click, abrimos el modal en vez de window.confirm */}
              <button 
                onClick={() => setShowLogoutModal(true)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Renderizamos el componente Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="¿Cerrar Sesión?"
        message="Estás a punto de salir del sistema. Tendrás que ingresar tus credenciales nuevamente para acceder."
        confirmText="Sí, Cerrar Sesión"
        cancelText="Volver"
        isDanger={true}
      />
    </>
  );
}