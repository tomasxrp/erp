import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    // CORRECCIÓN: Agregado 'dark:bg-slate-950'
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      <Sidebar />
      
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Header />
        
        {/* Contenedor del contenido de las páginas */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}