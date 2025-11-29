import { ShoppingCart, Calendar, CreditCard } from 'lucide-react';

export default function VentasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Punto de Venta</h1>
          <p className="text-slate-500 dark:text-slate-400">Registra ventas y emite boletas.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-orange-500/30 transition-all font-medium">
          <ShoppingCart size={18} /> Nueva Venta
        </button>
      </div>

      {/* Grid principal de contenido (ejemplo layout ventas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Historial */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Últimas Transacciones</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">Venta #00123{i}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> Hoy, 14:30
                    </span>
                  </div>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">$15.990</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Resumen Rápido */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
            <p className="text-slate-400 text-sm mb-1">Ventas de Hoy</p>
            <h2 className="text-4xl font-bold mb-4">$450.000</h2>
            <div className="flex gap-2">
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">+12% vs ayer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}