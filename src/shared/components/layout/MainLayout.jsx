import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Pasamos el estado y la función de cierre al Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen w-full transition-all duration-300">
        {/* Pasamos la función de apertura al Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Contenedor del contenido */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}