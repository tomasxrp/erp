import { useState, useEffect } from 'react';
import { X, Save, Loader2, Package, Scan, DollarSign, Layers } from 'lucide-react';

export default function ProductForm({ onClose, onSubmit, initialData, isEditing, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    unit: 'unid',
    price: 0,
    cost_price: 0,
    min_stock_alert: 5,
    stock: 0,
    description: ''
  });

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        barcode: initialData.barcode || '',
        category: initialData.category || '',
        unit: initialData.unit || 'unid',
        price: initialData.price || 0,
        cost_price: initialData.cost_price || 0,
        min_stock_alert: initialData.min_stock_alert || 5,
        stock: initialData.total_stock || 0,
        description: initialData.description || ''
      });
    }
  }, [isEditing, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl border-t sm:border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] sm:max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          
          {/* Identificación */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <div className="relative">
                  <Package className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text" required
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej: Monitor LED"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cód. Barras</label>
                <div className="relative">
                  <Scan className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Precios y Detalles */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Detalles</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Costo</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">$</span>
                  <input
                    type="number" min="0"
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Venta</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidad</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                >
                  <option value="unid">Unidad</option>
                  <option value="kg">Kilos</option>
                  <option value="mt">Metros</option>
                  <option value="lt">Litros</option>
                  <option value="caja">Caja</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isEditing ? 'Stock' : 'Inicial'}
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="number" min="0"
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${isEditing ? 'opacity-75' : ''}`}
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mínimo</label>
                <input
                  type="number" min="0"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.min_stock_alert}
                  onChange={(e) => setFormData({...formData, min_stock_alert: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span className="hidden sm:inline">{isEditing ? 'Actualizar' : 'Guardar'}</span>
              <span className="sm:hidden">Guardar</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}