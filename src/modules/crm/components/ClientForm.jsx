import { useState } from 'react';
import { X, Save, Building2, User, Loader2 } from 'lucide-react';
import { crmService } from '../services/crmService';

export default function ClientForm({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'empresa',
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    notes: '', // Cosas importantes
    tags: ''   // Ingresados como texto separado por comas
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convertir tags de texto a array
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      await crmService.createClient({
        ...formData,
        tags: tagsArray
      });
      onSuccess();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nuevo Cliente</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tipo de Cliente */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'empresa'})}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                formData.type === 'empresa' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
            >
              <Building2 size={24} /> <span className="font-medium">Empresa</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'persona'})}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                formData.type === 'persona' 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-300'
              }`}
            >
              <User size={24} /> <span className="font-medium">Persona</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre / Razón Social</label>
              <input 
                type="text" required
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">RUT / DNI</label>
              <input 
                type="text"
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.tax_id}
                onChange={e => setFormData({...formData, tax_id: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input 
                type="email"
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
              <input 
                type="text"
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cosas Importantes (Notas)</label>
            <textarea 
              className="w-full mt-1 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              rows={3}
              placeholder="Ej: Solo contactar por las mañanas. Cliente prefiere facturación anticipada."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Etiquetas (Separadas por comas)</label>
            <input 
              type="text"
              placeholder="VIP, Moroso, Santiago, Nuevo"
              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}