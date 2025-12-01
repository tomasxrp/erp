import { useState, useEffect } from 'react';
import { X, Save, Loader2, Wrench, DollarSign, Layers, FileText } from 'lucide-react';

export default function ServiceForm({ onClose, onSubmit, initialData, isEditing, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'hora', // Default para servicios
    price: 0,
    estimated_cost: 0,
    description: ''
  });

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        unit: initialData.unit || 'hora',
        price: initialData.price || 0,
        estimated_cost: initialData.estimated_cost || 0,
        description: initialData.description || ''
      });
    }
  }, [isEditing, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Servicio</label>
            <div className="relative">
              <Wrench className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="text" required
                placeholder="Ej: Instalación Eléctrica Básica"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
              <input
                type="text"
                placeholder="Ej: Electricidad"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidad de Cobro</label>
              <select
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
              >
                <option value="hora">Por Hora</option>
                <option value="visita">Por Visita</option>
                <option value="proyecto">Por Proyecto (Global)</option>
                <option value="mt2">Por Metro Cuadrado</option>
                <option value="ml">Por Metro Lineal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Costo Estimado</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400">$</span>
                <input
                  type="number" min="0"
                  className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({...formData, estimated_cost: parseFloat(e.target.value) || 0})}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Materiales + Mano de Obra</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Venta</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-emerald-500" />
                <input
                  type="number" min="0" required
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción / Alcance</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <textarea
                rows="3"
                placeholder="Detalla qué incluye este servicio (ej: Incluye cableado y enchufes hasta 10mts...)"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/20">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isEditing ? 'Actualizar' : 'Guardar Servicio'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}