import { Outlet } from 'react-router-dom';
import { Box } from 'lucide-react';

export default function AuthLayout() {
  return (
    // CAMBIO AQUÍ: Agregamos dark:bg-slate-900
    <div className="min-h-screen flex bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* Lado Izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 justify-center items-center relative overflow-hidden">
         {/* ... (el resto del código del gradiente igual) ... */}
         <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 z-0" />
         <div className="z-10 text-center px-10">
            {/* ... contenido ... */}
             <div className="mb-6 flex justify-center">
                <div className="h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                  <Box className="text-white h-10 w-10" />
                </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">ERP System</h2>
         </div>
      </div>

      {/* Lado Derecho (Formulario) */}
      {/* CAMBIO AQUÍ: Agregamos dark:bg-slate-900 */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:px-24 bg-white dark:bg-slate-900">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <Outlet />
        </div>
      </div>
    </div>
  );
}