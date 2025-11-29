import { useState } from 'react';
import { UserPlus, Mail, Phone, Loader2, Shield, User, LogOut } from 'lucide-react'; // Agregué LogOut
import { useTrabajadores } from '../hooks/useTrabajadores';
import TrabajadorForm from '../components/TrabajadorForm';
import { trabajadorService } from '../services/trabajadorService';

export default function TrabajadoresPage() {
  const { trabajadores, loading, error, refetch } = useTrabajadores();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreateUser = async (formData) => {
    // Advertencia de UX
    const confirmacion = window.confirm(
      "ATENCIÓN: Al crear un nuevo usuario desde aquí, tu sesión actual se cerrará y entrarás automáticamente como el nuevo usuario.\n\n¿Deseas continuar?"
    );

    if (!confirmacion) return;

    setSaving(true);
    try {
      await trabajadorService.createTrabajador(formData);
      setIsModalOpen(false);
      
      // No necesitamos refetch, porque la página se recargará o cambiará de contexto
      // al cambiar el usuario autenticado.
      window.location.reload(); 
      
    } catch (err) {
      alert("Error al crear usuario: " + err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" /></div>;
  if (error) return <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Equipo de Trabajo</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {trabajadores.length} {trabajadores.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
        >
          <UserPlus size={18} /> Agregar Usuario
        </button>
      </div>

      {isModalOpen && (
        <TrabajadorForm 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleCreateUser}
          loading={saving}
        />
      )}

      {trabajadores.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="mx-auto h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No hay trabajadores aún</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
            Agrega nuevos usuarios con el botón superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trabajadores.map((worker) => (
            <div key={worker.id} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${worker.full_name}&background=random&color=fff`} 
                    alt={worker.full_name}
                    className="h-14 w-14 rounded-full ring-4 ring-slate-50 dark:ring-slate-800"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{worker.full_name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield size={14} className="text-indigo-500" />
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium capitalize">
                        {worker.role}
                      </p>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Activo
                </span>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                  <Mail size={16} className="text-slate-400" /> 
                  <span className="truncate">{worker.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                  <Phone size={16} className="text-slate-400" /> 
                  <span>{worker.phone || 'Sin teléfono'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}