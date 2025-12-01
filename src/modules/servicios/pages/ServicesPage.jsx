import { useState } from 'react';
import { Wrench, Search, Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { useServices } from '../hooks/useServices';
import ServiceForm from '../components/ServiceForm';
import { servicesService } from '../services/servicesService';

export default function ServicesPage() {
  const { services, loading, refetch } = useServices();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleSaveService = async (formData) => {
    setFormLoading(true);
    try {
      if (editingService) {
        await servicesService.updateService(editingService.id, formData);
      } else {
        await servicesService.createService(formData);
      }
      await refetch();
      setIsModalOpen(false);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Eliminar servicio "${name}"?`)) {
      try {
        await servicesService.deleteService(id);
        await refetch();
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Catálogo de Servicios</h1>
          <p className="text-slate-500 dark:text-slate-400">{services.length} servicios registrados.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus size={18} /> Nuevo Servicio
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="text-slate-400 flex-shrink-0" size={20} />
        <input 
          type="text"
          placeholder="Buscar servicios..."
          className="bg-transparent outline-none w-full text-slate-900 dark:text-white placeholder-slate-400"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Servicio</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Unidad</th>
                <th className="px-6 py-4 text-right">Costo Est.</th>
                <th className="px-6 py-4 text-right">Precio Venta</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Cargando...</td></tr>
              ) : filteredServices.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No hay servicios registrados.</td></tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500">
                          <Wrench size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{service.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {service.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {service.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">{service.unit}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">
                      ${service.estimated_cost?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                      ${service.price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenEdit(service)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(service.id, service.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ServiceForm
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveService}
          initialData={editingService}
          isEditing={!!editingService}
          loading={formLoading}
        />
      )}
    </div>
  );
}