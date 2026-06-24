import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../config/supabase';
import { Save, Building2, Loader2, MapPin, Mail, Phone, FileText, CheckCircle, Briefcase, CreditCard, UploadCloud, Trash2, MessageSquare } from 'lucide-react';

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    company_name: '',
    rut: '',
    activity: '',
    address: '',
    email: '',
    phone: '',
    logo_url: '',
    quote_conditions: '',
    quote_payment_info: ''
  });

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles').select('warehouse_id').eq('id', user.id).single();
      if (!profile?.warehouse_id) return;

      const { data } = await supabase
        .from('company_settings').select('*').eq('warehouse_id', profile.warehouse_id).single();

      if (data) setFormData({
        company_name: data.company_name || '',
        rut: data.rut || '',
        activity: data.activity || '',
        address: data.address || '',
        email: data.email || '',
        phone: data.phone || '',
        logo_url: data.logo_url || '',
        quote_conditions: data.quote_conditions || '',
        quote_payment_info: data.quote_payment_info || ''
      });
    } catch (e) {
      console.log('Sin configuración guardada aún.');
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { alert('La imagen es muy pesada. Máximo 2MB.'); return; }
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir imagen.');
    } finally {
      setUploading(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setShowSuccess(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('warehouse_id').eq('id', user.id).single();
      if (!profile?.warehouse_id) throw new Error('No tienes una bodega asignada.');

      const { data: existing } = await supabase
        .from('company_settings').select('id').eq('warehouse_id', profile.warehouse_id).single();

      const payload = { ...formData, warehouse_id: profile.warehouse_id };

      if (existing) {
        await supabase.from('company_settings').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('company_settings').insert([payload]);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Error al guardar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-blue-600" size={32} /> Identidad Corporativa
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Configura los datos fiscales, logo e información para tus documentos.
          </p>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-medium animate-in slide-in-from-top-2">
            <CheckCircle size={18} /> Configuración guardada correctamente
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Datos Fiscales */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
              <div className="space-y-6 relative z-10">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                  Datos Fiscales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Razón Social</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input type="text" required className={inputClass} value={formData.company_name}
                        onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">RUT</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input type="text" required className={inputClass} value={formData.rut}
                        onChange={e => setFormData({ ...formData, rut: e.target.value })} />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Giro / Actividad</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input type="text" required className={inputClass} value={formData.activity}
                        onChange={e => setFormData({ ...formData, activity: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                  Ubicación y Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección Comercial</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input type="text" className={inputClass} value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Contacto</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input type="email" className={inputClass} value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input type="text" className={inputClass} value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Adicional para Cotizaciones */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-900/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />
              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-3 border-b border-amber-100 dark:border-amber-900/30 pb-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg mt-0.5">
                    <MessageSquare size={18} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Información Adicional para Cotizaciones
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Estos textos aparecerán como texto fijo al pie de todas tus cotizaciones. Se pueden editar manualmente en cada cotización.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Condiciones Predeterminadas
                    </label>
                    <textarea
                      rows={3}
                      className="w-full p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-sm"
                      placeholder="Ej: Validez de la oferta: 15 días hábiles. Precios en pesos chilenos con IVA incluido. Sujeto a disponibilidad de stock."
                      value={formData.quote_conditions}
                      onChange={e => setFormData({ ...formData, quote_conditions: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Información Adicional Predeterminada (Datos de Transferencia, etc.)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-sm"
                      placeholder="Ej: Datos de Transferencia: Banco Estado, Cuenta Corriente N° 123456789, a nombre de Mi Empresa SpA, contacto@empresa.cl"
                      value={formData.quote_payment_info}
                      onChange={e => setFormData({ ...formData, quote_payment_info: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all font-bold flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>

        {/* Columna: Logo + Preview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Logo Corporativo</h3>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-40 h-40 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-all group relative overflow-hidden"
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={32} />
              ) : formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-4" />
              ) : (
                <>
                  <UploadCloud size={32} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs mt-2 font-medium">Subir Imagen</span>
                </>
              )}
            </div>
            {formData.logo_url && (
              <button
                onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                className="mt-4 text-red-500 hover:text-red-700 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <Trash2 size={14} /> Eliminar Logo
              </button>
            )}
            <p className="text-xs text-slate-400 mt-2">PNG, JPG. Máx 2MB.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-slate-400" /> Vista Previa
            </h3>
            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-inner text-xs font-mono text-slate-600">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 overflow-hidden">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} className="w-full h-full object-contain" alt="Preview" />
                  ) : (
                    <span className="text-[10px] text-slate-300">SIN LOGO</span>
                  )}
                </div>
                <div className="border border-red-500 p-1 text-center w-28 opacity-80">
                  <p className="font-bold text-red-500 scale-75">R.U.T.: {formData.rut}</p>
                  <p className="font-bold text-red-500 text-[8px]">COTIZACIÓN</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-black">{formData.company_name || 'MI EMPRESA'}</p>
                <p>{formData.address}</p>
                <p>{formData.email}</p>
              </div>
              {formData.quote_conditions && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Condiciones:</p>
                  <p className="text-[9px] text-slate-500 line-clamp-2">{formData.quote_conditions}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}