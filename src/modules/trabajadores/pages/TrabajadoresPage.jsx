import { useState } from 'react';
import { UserPlus, Mail, Phone, Loader2, Shield, User, Settings } from 'lucide-react';
import { useTrabajadores } from '../hooks/useTrabajadores';
import TrabajadorForm from '../components/TrabajadorForm';
import RoleManagerModal from '../components/RoleManagerModal'; // <--- IMPORTAR
import { trabajadorService } from '../services/trabajadorService';
import { useAuth } from '../../../store/AuthContext'; // Para saber si SOY admin

export default function TrabajadoresPage() {
  const { trabajadores, loading, error, refetch } = useTrabajadores();
  const { user } = useAuth(); // Usuario logueado
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [roleModalWorker, setRoleModalWorker] = useState(null); // Trabajador seleccionado para editar
  const [saving, setSaving] = useState(false);

  // Crear Usuario
  const handleCreateUser = async (formData) => {
    const confirmacion = window.confirm(
      "ATENCIÓN: Al crear un nuevo usuario, tu sesión se cerrará.\n¿Deseas continuar?"
    );
    if (!confirmacion) return;

    setSaving(true);
    try {
      await trabajadorService.createTrabajador(formData);
      setIsFormOpen(false);
      window.location.reload(); 
    } catch (err) {
      alert("Error: " + err.message);
      setSaving(false);
    }
  };

  // Guardar Roles (Admin Panel)
  const handleUpdateRoles = async (id, newRoles) => {
    try {
      await trabajadorService.updateWorkerRoles(id, newRoles);
      await refetch(); // Recargar lista para ver cambios
    } catch (err) {
      alert("Error al actualizar roles: " + err.message);
    }
  };

  // Helper para verificar si SOY admin (buscamos mi perfil en la lista cargada)
  const myProfile = trabajadores.find(t => t.id === user?.id);
  const isAdmin = myProfile?.role?.includes('admin');

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Equipo de Trabajo</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {trabajadores.length} usuarios activos
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
          >
            <UserPlus size={18} /> Agregar Usuario
          </button>
        )}
      </div>

      {isFormOpen && (
        <TrabajadorForm 
          onClose={() => setIsFormOpen(false)} 
          onSubmit={handleCreateUser}
          loading={saving}
        />
      )}

      {/* Modal de Roles */}
      {roleModalWorker && (
        <RoleManagerModal 
          worker={roleModalWorker}
          onClose={() => setRoleModalWorker(null)}
          onSave={handleUpdateRoles}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trabajadores.map((worker) => {
          // Normalizamos roles a array por seguridad
          const roles = Array.isArray(worker.role) ? worker.role : [worker.role];
          
          return (
            <div key={worker.id} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all relative">
              
              {/* Botón Admin Panel (Solo visible si soy admin) */}
              {isAdmin && (
                <button 
                  onClick={() => setRoleModalWorker(worker)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Gestionar Roles"
                >
                  <Settings size={18} />
                </button>
              )}

              <div className="flex items-start gap-4">
                <img 
                  src={`https://ui-avatars.com/api/?name=${worker.full_name}&background=random&color=fff`} 
                  alt={worker.full_name}
                  className="h-14 w-14 rounded-full ring-4 ring-slate-50 dark:ring-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{worker.full_name}</h3>
                  
                  {/* Badges de Roles */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {roles.map(role => (
                      <span key={role} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border
                        ${role === 'admin' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' : 
                          role === 'bodeguero' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900' :
                          'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900'
                        }
                      `}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
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
          );
        })}
      </div>
    </div>
  );
}