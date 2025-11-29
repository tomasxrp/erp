import { Plus, Filter, Download } from 'lucide-react';

export default function InventarioPage() {
  return (
    <div className="space-y-6">
      {/* Header de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario de Bodega</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona el stock y movimientos de productos.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Filter size={18} /> Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-600/30 transition-all">
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Productos', value: '1,234', color: 'blue' },
          { label: 'Valor Inventario', value: '$45.2M', color: 'emerald' },
          { label: 'Stock Bajo', value: '12', color: 'red' },
          { label: 'Categorías', value: '8', color: 'purple' },
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
            <h3 className={`text-3xl font-bold mt-2 text-${stat.color}-600 dark:text-${stat.color}-400`}>
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Lista (Placeholder visual) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Productos Recientes</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Ver todo</button>
        </div>
        
        {/* Tabla simulada */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Producto</th>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Precio</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0"></div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">Item Ejemplo {i}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">SKU-00{i}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">Electrónica</td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">45</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">$29,990</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}