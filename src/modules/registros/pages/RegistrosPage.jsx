import { useState, useEffect } from 'react';
import { Search, FileText, Trash2, Download, Eye, Calendar, User } from 'lucide-react';
import { useRegistros } from '../hooks/useRegistros';
import { registrosService } from '../services/registrosService';
import { supabase } from '../../../config/supabase';
import { generateDocumentPDF } from '../../../shared/utils/pdfGenerator';

export default function RegistrosPage() {
  const { registros, loading, refetch } = useRegistros();
  const [searchTerm, setSearchTerm] = useState('');
  const [companySettings, setCompanySettings] = useState({});

  // Cargar configuración de la empresa para poder regenerar PDFs
  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('warehouse_id').eq('id', user.id).single();
      if (profile?.warehouse_id) {
        const { data } = await supabase.from('company_settings').select('*').eq('warehouse_id', profile.warehouse_id).single();
        if (data) setCompanySettings(data);
      }
    }
    loadSettings();
  }, []);

  // Función para regenerar el PDF
  const handleDownloadPDF = async (registro) => {
    try {
      // Reconstruimos el objeto con la estructura que espera el generador
      // Si era cotización manual, usamos el número manual guardado, sino el automático
      const saleForPdf = {
        ...registro,
        // Aseguramos compatibilidad si guardaste "quote_number_manual" en el JSON del cliente o similar
        // (Asumiendo que modificaste el PDF generator como vimos antes)
      };

      await generateDocumentPDF(saleForPdf, companySettings, registro.sale_items);
    } catch (error) {
      alert("Error al generar PDF: " + error.message);
    }
  };

  const handleDelete = async (id, type, number) => {
    if (window.confirm(`¿Estás seguro de eliminar la ${type} Nº ${number}?\nEsta acción es irreversible.`)) {
      try {
        await registrosService.deleteRegistro(id);
        await refetch();
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  // Filtrado
  const filteredRegistros = registros.filter(r => 
    r.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.client_snapshot?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Historial de Operaciones</h1>
          <p className="text-slate-500 dark:text-slate-400">Registro de ventas, facturas y cotizaciones.</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar por número, cliente o tipo..."
          className="bg-transparent outline-none w-full text-slate-900 dark:text-white placeholder-slate-400"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Fecha / Hora</th>
                <th className="px-6 py-4">Documento</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Resumen Items</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Cargando historial...</td></tr>
              ) : filteredRegistros.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No se encontraron registros.</td></tr>
              ) : (
                filteredRegistros.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(reg.created_at).toLocaleDateString()} 
                        <span className="text-xs opacity-70">{new Date(reg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`font-bold uppercase text-xs w-fit px-2 py-0.5 rounded border ${
                          reg.type === 'cotizacion' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                            : reg.type === 'factura'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {reg.type}
                        </span>
                        <span className="font-mono text-sm mt-1 text-slate-600 dark:text-slate-300">
                          #{reg.receipt_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <User size={14} className="text-slate-400" />
                        <span className="font-medium truncate max-w-[150px]" title={reg.client_snapshot?.name}>
                          {reg.client_snapshot?.name || 'Cliente General'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 ml-6">
                        {reg.client_snapshot?.tax_id || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {reg.sale_items?.slice(0, 2).map((item, i) => (
                          <div key={i} className="text-xs text-slate-600 dark:text-slate-400 flex justify-between">
                            <span className="truncate">{item.product_name}</span>
                            <span className="font-mono ml-2">x{item.quantity}</span>
                          </div>
                        ))}
                        {reg.sale_items?.length > 2 && (
                          <span className="text-xs text-slate-400 italic">
                            + {reg.sale_items.length - 2} ítems más...
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                      ${reg.total_amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleDownloadPDF(reg)}
                          title="Descargar PDF"
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(reg.id, reg.type, reg.receipt_number)}
                          title="Eliminar Registro"
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}