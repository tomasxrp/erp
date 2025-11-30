import { useEffect, useState } from 'react';
import { X, Calendar, ShoppingBag, AlertCircle, Tag, StickyNote, Loader2 } from 'lucide-react';
import { crmService } from '../services/crmService';

export default function ClientDetailModal({ clientId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);
        const result = await crmService.getClientWithHistory(clientId);
        setData(result);
      } catch (err) {
        console.error("Error al cargar detalle:", err);
        setError(err.message || "No se pudo cargar la información del cliente.");
      } finally {
        setLoading(false);
      }
    }
    
    if (clientId) {
      fetchDetail();
    }
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 relative">
        
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose} 
            className="p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <X size={20} className="text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500">Cargando expediente...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error al cargar</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md bg-slate-50 dark:bg-slate-800 p-4 rounded-lg font-mono text-sm border border-slate-200 dark:border-slate-700">
              {error}
            </p>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="p-8 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                {data.name}
                <span className={`text-sm px-3 py-1 rounded-full border uppercase tracking-wider font-semibold ${
                  data.type === 'empresa' 
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' 
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                }`}>
                  {data.type}
                </span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-mono">
                {data.tax_id || 'Sin Identificación Fiscal'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-800/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <StickyNote size={100} className="text-amber-500" />
                    </div>
                    <h3 className="text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2 mb-3 text-lg">
                      <StickyNote size={20} /> Cosas Importantes
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed relative z-10">
                      {data.notes || "No hay notas registradas para este cliente."}
                    </p>
                    
                    {data.tags && data.tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                        {data.tags.map((tag, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Tag size={12} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Contacto</h3>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Email</p>
                    <p className="text-slate-900 dark:text-white font-medium truncate" title={data.email}>
                      {data.email || 'No registrado'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Teléfono</p>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {data.phone || 'No registrado'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                  <ShoppingBag className="text-blue-500" size={24} /> Historial de Compras
                </h3>

                {data.sales && data.sales.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-4">Fecha</th>
                          <th className="p-4">Boleta</th>
                          <th className="p-4">Detalle</th>
                          <th className="p-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {data.sales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                {new Date(sale.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                              {sale.receipt_number || 'N/A'}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                {sale.sale_items?.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-slate-700 dark:text-slate-300 max-w-xs text-xs">
                                    <span>{item.product_name}</span>
                                    <span className="text-slate-400 font-mono">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                              ${sale.total_amount?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                    <ShoppingBag size={48} className="mb-3 opacity-20" />
                    <p className="font-medium">Sin historial de compras</p>
                    <p className="text-sm opacity-70">Las ventas asociadas aparecerán aquí.</p>
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}