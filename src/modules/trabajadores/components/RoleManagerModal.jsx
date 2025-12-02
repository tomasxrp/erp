import { useState } from 'react';
import { X, Save, Shield, Check, Loader2 } from 'lucide-react';
import Toast from '../../../shared/components/ui/Toast'; // <--- IMPORTAR

const AVAILABLE_ROLES = [
  { id: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'vendedor', label: 'Vendedor', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'bodeguero', label: 'Bodeguero', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'contador', label: 'Contador', color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

export default function RoleManagerModal({ worker, onClose, onSave }) {
  const initialRoles = Array.isArray(worker.role) ? worker.role : [worker.role];
  const [selectedRoles, setSelectedRoles] = useState(initialRoles);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' }); // Estado para el Toast

  const toggleRole = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      // CAMBIO AQUÍ: Usar Toast en vez de alert
      if (selectedRoles.length === 1) {
        setToast({ message: "El usuario debe conservar al menos un rol.", type: 'error' });
        return;
      }
      setSelectedRoles(prev => prev.filter(r => r !== roleId));
    } else {
      setSelectedRoles(prev => [...prev, roleId]);
    }
  };

  // ... handleSave se mantiene igual ...
  const handleSave = async () => {
    setSaving(true);
    await onSave(worker.id, selectedRoles);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Renderizar Toast si existe mensaje */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
         {/* ... El resto del modal (Header, Lista, Footer) sigue exactamente igual ... */}
         <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
            {/* ... */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gestionar Roles</h2>
              <p className="text-sm text-slate-500">{worker.full_name}</p>
            </div>
            <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
         </div>

         <div className="p-5 space-y-3">
            {/* ... lógica de roles ... */}
            {AVAILABLE_ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role.id);
                return (
                  <div key={role.id} onClick={() => toggleRole(role.id)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-slate-50 dark:bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${role.color}`}><Shield size={16} /></div>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{role.label}</span>
                     </div>
                     <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                     </div>
                  </div>
                );
            })}
         </div>

         <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar
            </button>
         </div>
      </div>
    </div>
  );
}