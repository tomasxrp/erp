import { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, Clock, User, CheckCircle, Package, ExternalLink } from 'lucide-react';
import ProjectForm from '../components/ProjectForm';
import { projectsService } from '../services/projectsService';
import Toast from '../../../shared/components/ui/Toast';
import ConfirmationModal from '../../../shared/components/ui/ConfirmationModal'; // <--- IMPORTAR

export default function ProyectosPage() {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Estado para el modal de confirmación
  const [projectToFinish, setProjectToFinish] = useState(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsService.getActiveProjects();
      setProjects(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (projectData, materials) => {
    try {
      await projectsService.createProject(projectData, materials);
      setToast({ message: 'Proyecto creado y stock reservado', type: 'success' });
      setIsModalOpen(false);
      loadProjects();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  // 1. Solicitud de finalizar (Abre el modal)
  const requestFinish = (id) => {
    setProjectToFinish(id);
  };

  // 2. Ejecución real (Llamada al servicio)
  const executeFinish = async () => {
    if (!projectToFinish) return;
    
    try {
      await projectsService.finishProject(projectToFinish);
      setToast({ message: 'Trabajo completado. Stock devuelto al inventario.', type: 'success' });
      loadProjects();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setProjectToFinish(null); // Cerrar modal y limpiar selección
    }
  };

  return (
    <div className="space-y-6 relative">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      {/* Modal de Confirmación Personalizado */}
      <ConfirmationModal
        isOpen={!!projectToFinish}
        onClose={() => setProjectToFinish(null)}
        onConfirm={executeFinish}
        title="¿Finalizar Trabajo?"
        message="Al finalizar, se devolverán automáticamente los materiales al inventario y el proyecto se eliminará de la lista de activos."
        confirmText="Sí, Finalizar y Devolver"
        cancelText="Cancelar"
        isDanger={false} // Usamos azul (false) porque es una acción positiva, o true si prefieres rojo por eliminar
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Proyectos Activos</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestión de trabajos en terreno y materiales asignados.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
          <Plus size={18} /> Nuevo Trabajo
        </button>
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-slate-500">No hay trabajos activos en este momento.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
            
            {/* Status Strip */}
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>

            <div className="flex justify-between items-start mb-4 pl-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate pr-2">{project.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <User size={12} /> {project.clients?.name || 'Sin Cliente'}
                </p>
              </div>
              <span className="shrink-0 px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold rounded uppercase">
                En Progreso
              </span>
            </div>

            <div className="space-y-3 pl-2 flex-1">
              <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                  <Calendar size={14} className="text-blue-500" /> {project.start_date}
                </span>
                <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                  <Clock size={14} className="text-orange-500" /> {project.arrival_time?.slice(0,5)}
                </span>
              </div>

              {project.location_url && (
                <a href={project.location_url} target="_blank" rel="noreferrer" 
                   className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg cursor-pointer transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  <MapPin size={16} /> 
                  <span className="truncate">Ver ubicación en mapa</span>
                  <ExternalLink size={12} />
                </a>
              )}

              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p className="font-bold text-xs uppercase mb-1 text-slate-400">Equipo:</p>
                <div className="flex flex-wrap gap-1">
                  {project.assigned_workers?.map((w, i) => (
                    <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{w}</span>
                  ))}
                </div>
              </div>

              {project.project_materials?.length > 0 && (
                <div className="mt-2">
                  <p className="font-bold text-xs uppercase mb-1 text-slate-400 flex items-center gap-1">
                    <Package size={12} /> Materiales reservados:
                  </p>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                    {project.project_materials.slice(0, 3).map((m, i) => (
                      <li key={i}>{m.quantity} {m.products?.unit} - {m.products?.name}</li>
                    ))}
                    {project.project_materials.length > 3 && <li className="text-[10px] italic">... y más</li>}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 pl-2">
              <button 
                onClick={() => requestFinish(project.id)} // CAMBIO: Llama a requestFinish
                className="w-full py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-colors flex justify-center items-center gap-2 shadow-sm hover:shadow"
              >
                <CheckCircle size={16} /> Finalizar Trabajo
              </button>
            </div>

          </div>
        ))}
      </div>

      {isModalOpen && <ProjectForm onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />}
    </div>
  );
}