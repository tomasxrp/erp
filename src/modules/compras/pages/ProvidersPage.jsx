import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Phone, Mail, Trash2, MapPin, X, Save, Loader2, User, CreditCard, Globe } from 'lucide-react';
import { purchasingService } from '../services/purchasingService';
import Toast from '../../../shared/components/ui/Toast';

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado del formulario
  const [formData, setFormData] = useState({ 
    name: '', 
    rut: '', 
    contact_name: '', 
    email: '', 
    phone: '', 
    address: '' 
  });
  
  const [toast, setToast] = useState({ message: '', type: '' });
  const [saving, setSaving] = useState(false);

  const loadProviders = async () => {
    try {
      const data = await purchasingService.getProviders();
      setProviders(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadProviders(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await purchasingService.createProvider(formData);
      setToast({ message: 'Proveedor registrado exitosamente', type: 'success' });
      setIsModalOpen(false);
      setFormData({ name: '', rut: '', contact_name: '', email: '', phone: '', address: '' });
      loadProviders();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este proveedor?')) {
      await purchasingService.deleteProvider(id);
      loadProviders();
    }
  };

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.rut?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 relative">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Directorio de Proveedores</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona tus socios estratégicos y contactos de abastecimiento.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 font-medium"
        >
          <Plus size={20} /> Nuevo Proveedor
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, empresa o RUT..." 
          className="bg-transparent outline-none w-full text-slate-900 dark:text-white placeholder-slate-400"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid de Proveedores */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500">No se encontraron proveedores.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map(prov => (
            <div key={prov.id} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 dark:from-blue-900/10 to-transparent rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate max-w-[180px]" title={prov.name}>{prov.name}</h3>
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {prov.rut || 'Sin ID'}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleDelete(prov.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                  <div className="bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-sm">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Contacto</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-sm truncate w-full">
                      {prov.contact_name || 'No registrado'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 px-1">
                  {prov.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={14} className="text-blue-500" /> {prov.phone}
                    </div>
                  )}
                  {prov.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={14} className="text-orange-500" /> <span className="truncate">{prov.email}</span>
                    </div>
                  )}
                  {prov.address && (
                    <div className="flex items-center gap-3">
                      <MapPin size={14} className="text-red-500" /> <span className="truncate">{prov.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL NUEVO PROVEEDOR (UI MEJORADA) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="text-blue-600" size={24}/> Nuevo Proveedor
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Registra los datos de la empresa y contacto.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <X size={20}/>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              
              {/* Sección Empresa */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Globe size={14} /> Datos de la Empresa
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Razón Social <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="text" required 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" 
                        placeholder="Ej: Importadora Global SpA" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">RUT / Tax ID</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" 
                        placeholder="Ej: 76.123.456-K" 
                        value={formData.rut} 
                        onChange={e => setFormData({...formData, rut: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Sección Contacto */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User size={14} /> Información de Contacto
                </h3>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de Contacto</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" 
                      placeholder="Ej: Juan Pérez (Gerente Ventas)" 
                      value={formData.contact_name} 
                      onChange={e => setFormData({...formData, contact_name: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" 
                        placeholder="contacto@empresa.com" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" 
                        placeholder="+56 9..." 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección Física</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" 
                      placeholder="Calle, Número, Ciudad, País" 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

            </form>

            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={saving} 
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Guardar Proveedor
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}