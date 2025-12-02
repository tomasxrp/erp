import { useState, useEffect } from 'react';
import { X, Save, Loader2, MapPin, User, Calendar, Clock, Briefcase, Plus, Trash2, HardHat, Package, AlertCircle } from 'lucide-react';
import { inventoryService } from '../../inventario/services/inventoryService';
import { crmService } from '../../crm/services/crmService';
import { trabajadorService } from '../../trabajadores/services/trabajadorService';

export default function ProjectForm({ onClose, onSubmit }) {
  // Estados para catálogos
  const [clients, setClients] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    start_date: '',
    arrival_time: '',
    location_url: '',
    assigned_workers: []
  });

  // Estado para materiales seleccionados
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [currentMaterialId, setCurrentMaterialId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, w, p] = await Promise.all([
          crmService.getClients(),
          trabajadorService.getTrabajadores(),
          inventoryService.getProducts()
        ]);
        setClients(c || []);
        setWorkers(w || []);
        // Filtramos solo productos con stock positivo
        setProducts((p || []).filter(prod => prod.total_stock > 0));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleWorker = (name) => {
    setFormData(prev => {
      const exists = prev.assigned_workers.includes(name);
      return {
        ...prev,
        assigned_workers: exists 
          ? prev.assigned_workers.filter(w => w !== name)
          : [...prev.assigned_workers, name]
      };
    });
  };

  const addMaterial = () => {
    if (!currentMaterialId) return;
    const product = products.find(p => p.id === currentMaterialId);
    
    if (currentQty > product.total_stock) {
      return alert(`Stock insuficiente. Solo hay ${product.total_stock} disponibles.`);
    }

    if (selectedMaterials.find(m => m.id === currentMaterialId)) {
      return alert("Este material ya está en la lista.");
    }

    setSelectedMaterials([...selectedMaterials, { ...product, quantity: currentQty }]);
    setCurrentMaterialId('');
    setCurrentQty(1);
  };

  const removeMaterial = (id) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.assigned_workers.length === 0) return alert("Debes asignar al menos un trabajador.");
    onSubmit(formData, selectedMaterials);
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="text-blue-600" size={24} /> Nuevo Proyecto
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Planifica el trabajo, asigna equipo y reserva materiales.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* SECCIÓN 1: Detalles Generales */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              Información del Trabajo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Proyecto</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" 
                  placeholder="Ej: Instalación Eléctrica Casa Central"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cliente / Contratante</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <select 
                    required 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    value={formData.client_id} 
                    onChange={e => setFormData({...formData, client_id: e.target.value})}
                  >
                    <option value="">Seleccionar Cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ubicación (Link Maps)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="url" 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400" 
                    placeholder="https://maps.google.com/..."
                    value={formData.location_url} 
                    onChange={e => setFormData({...formData, location_url: e.target.value})} 
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripción / Tareas</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none placeholder:text-slate-400" 
                  placeholder="Detalla qué se debe hacer en este trabajo..."
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Planificación y Equipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Fechas */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Calendar size={16} /> Planificación
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha Inicio</label>
                  <input 
                    required type="date" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.start_date} 
                    onChange={e => setFormData({...formData, start_date: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hora Llegada</label>
                  <input 
                    required type="time" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.arrival_time} 
                    onChange={e => setFormData({...formData, arrival_time: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Equipo */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <HardHat size={16} /> Equipo Asignado
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[100px]">
                <div className="flex flex-wrap gap-2">
                  {workers.length > 0 ? workers.map(w => {
                    const isSelected = formData.assigned_workers.includes(w.full_name);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleWorker(w.full_name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300'}`} />
                        {w.full_name}
                      </button>
                    )
                  }) : <p className="text-slate-400 text-sm">No hay trabajadores registrados.</p>}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Materiales */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Package size={16} /> Reserva de Materiales
              </h3>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-800 flex items-center gap-1">
                <AlertCircle size={12} /> Se descontará del stock
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              {/* Selector */}
              <div className="flex flex-col sm:flex-row gap-3">
                <select 
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={currentMaterialId} 
                  onChange={e => setCurrentMaterialId(e.target.value)}
                >
                  <option value="">Seleccionar Material del Inventario...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Disp: {p.total_stock} {p.unit})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input 
                    type="number" min="1" 
                    className="w-24 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Cant."
                    value={currentQty} 
                    onChange={e => setCurrentQty(parseInt(e.target.value) || 1)} 
                  />
                  <button 
                    type="button" 
                    onClick={addMaterial} 
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Lista */}
              {selectedMaterials.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3 text-center">Cantidad</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedMaterials.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{item.name}</td>
                          <td className="px-4 py-3 text-center bg-slate-50/50 dark:bg-slate-800/50 font-mono text-slate-600 dark:text-slate-400">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              type="button" 
                              onClick={() => removeMaterial(item.id)} 
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <Package className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-sm text-slate-400">No se han asignado materiales.</p>
                </div>
              )}
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
            Crear Proyecto
          </button>
        </div>

      </div>
    </div>
  );
}