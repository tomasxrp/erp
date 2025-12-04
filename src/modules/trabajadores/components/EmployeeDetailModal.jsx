import { useState, useEffect } from 'react';
import { X, Save, FileText, Plus, Printer, DollarSign, Calendar, User, Briefcase, Phone } from 'lucide-react';
import { trabajadorService } from '../services/trabajadorService';
import { supabase } from '../../../config/supabase';
import { generatePayrollPDF } from '../../../shared/utils/pdfGenerator';
import Toast from '../../../shared/components/ui/Toast';

export default function EmployeeDetailModal({ workerId, onClose }) {
  const [activeTab, setActiveTab] = useState('info'); // 'info' o 'nomina'
  const [employee, setEmployee] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState({});
  const [toast, setToast] = useState({ message: '', type: '' });

  // Estados Formulario Nómina Nueva
  const [isPayrollFormOpen, setIsPayrollFormOpen] = useState(false);
  const [newPayroll, setNewPayroll] = useState({
    period_date: new Date().toISOString().slice(0, 7), // YYYY-MM
    base_salary: 0,
    bonuses: [],
    deductions: []
  });
  const [tempItem, setTempItem] = useState({ concept: '', amount: '' });

  // Estados Formulario Detalles
  const [detailsForm, setDetailsForm] = useState({
    rut: '', address: '', phone: '', job_title: '', base_salary: 0, hire_date: ''
  });

  useEffect(() => {
    if (workerId) loadData();
  }, [workerId]);

  async function loadData() {
    try {
      setLoading(true);
      // 1. Cargar Empleado + Detalles
      const data = await trabajadorService.getEmployeeFullDetails(workerId);
      setEmployee(data);
      
      // Rellenar formulario
      if (data) {
        // --- CORRECCIÓN AQUÍ: Detección inteligente de formato (Array u Objeto) ---
        let d = {};
        if (Array.isArray(data.employee_details)) {
            // Si es array, tomamos el primero (o vacío si no hay)
            d = data.employee_details[0] || {};
        } else if (data.employee_details && typeof data.employee_details === 'object') {
            // Si es objeto directo, lo usamos
            d = data.employee_details;
        }
        
        setDetailsForm({
          rut: d.rut || '',
          address: d.address || '',
          job_title: d.job_title || '',
          base_salary: d.base_salary || 0,
          hire_date: d.hire_date || '',
          phone: data.phone || '' // El teléfono viene del perfil principal
        });
        
        // Pre-llenar sueldo base para nómina
        setNewPayroll(prev => ({ ...prev, base_salary: d.base_salary || 0 }));
      }

      // 2. Cargar Historial de Nóminas
      const pays = await trabajadorService.getEmployeePayrolls(workerId);
      setPayrolls(pays || []);

      // 3. Cargar Datos Empresa
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('warehouse_id').eq('id', user.id).single();
      if (profile?.warehouse_id) {
        const { data: company } = await supabase.from('company_settings').select('*').eq('warehouse_id', profile.warehouse_id).single();
        setCompanySettings(company || {});
      }

    } catch (e) {
      console.error(e);
      setToast({ message: 'Error cargando datos del empleado', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // --- LOGICA FICHA ---
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    try {
      // 1. Separar datos
      const { phone, ...restDetails } = detailsForm;

      // 2. Sanitizar datos
      const cleanDetails = {
        id: workerId,
        rut: restDetails.rut,
        address: restDetails.address,
        job_title: restDetails.job_title,
        base_salary: restDetails.base_salary === '' ? 0 : parseFloat(restDetails.base_salary),
        hire_date: restDetails.hire_date === '' ? null : restDetails.hire_date,
      };

      // 3. Guardar en paralelo
      const promises = [
        trabajadorService.upsertEmployeeDetails(cleanDetails)
      ];

      if (phone !== employee.phone) {
        promises.push(trabajadorService.updateTrabajador(workerId, { phone }));
      }

      await Promise.all(promises);

      setToast({ message: 'Ficha actualizada correctamente', type: 'success' });
      loadData(); // Recargar para ver cambios
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error al guardar: ' + err.message, type: 'error' });
    }
  };

  // --- LOGICA NÓMINA ---
  const handleAddPayrollItem = (type) => {
    if (!tempItem.concept || !tempItem.amount) return;
    const item = { concept: tempItem.concept, amount: parseInt(tempItem.amount) };
    
    setNewPayroll(prev => ({
      ...prev,
      [type === 'bonus' ? 'bonuses' : 'deductions']: [...prev[type === 'bonus' ? 'bonuses' : 'deductions'], item]
    }));
    setTempItem({ concept: '', amount: '' });
  };

  const handleCreatePayroll = async () => {
    const totalBonuses = newPayroll.bonuses.reduce((sum, b) => sum + b.amount, 0);
    const totalDeductions = newPayroll.deductions.reduce((sum, d) => sum + d.amount, 0);
    const total = parseInt(newPayroll.base_salary) + totalBonuses - totalDeductions;

    try {
      await trabajadorService.createPayroll({
        employee_id: workerId,
        period_date: newPayroll.period_date + '-01',
        base_salary: newPayroll.base_salary,
        bonuses: newPayroll.bonuses,
        deductions: newPayroll.deductions,
        total_pay: total
      });
      setToast({ message: 'Nómina generada con éxito', type: 'success' });
      setIsPayrollFormOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      setToast({ message: 'Error al crear nómina: ' + e.message, type: 'error' });
    }
  };

  const printPayroll = (payroll) => {
    generatePayrollPDF(payroll, employee, companySettings);
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-2xl font-bold text-slate-500 border border-slate-200 dark:border-slate-600">
              {employee.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{employee.full_name}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Briefcase size={14} />
                <span>{detailsForm.job_title || 'Sin cargo definido'}</span>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'info' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Ficha Personal
                </button>
                <button 
                  onClick={() => setActiveTab('nomina')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'nomina' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Nóminas y Pagos
                </button>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* TAB 1: FICHA PERSONAL */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveDetails} className="space-y-6 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><User size={12} /> RUT / DNI</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    value={detailsForm.rut} onChange={e => setDetailsForm({...detailsForm, rut: e.target.value})} placeholder="12.345.678-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Briefcase size={12} /> Cargo</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    value={detailsForm.job_title} onChange={e => setDetailsForm({...detailsForm, job_title: e.target.value})} placeholder="Ej: Vendedor Senior" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><DollarSign size={12} /> Sueldo Base Pactado</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono" 
                    value={detailsForm.base_salary} onChange={e => setDetailsForm({...detailsForm, base_salary: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={12} /> Fecha Ingreso</label>
                  <input type="date" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    value={detailsForm.hire_date} onChange={e => setDetailsForm({...detailsForm, hire_date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Phone size={12} /> Teléfono</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    value={detailsForm.phone} onChange={e => setDetailsForm({...detailsForm, phone: e.target.value})} />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dirección Particular</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    value={detailsForm.address} onChange={e => setDetailsForm({...detailsForm, address: e.target.value})} placeholder="Calle, Número, Comuna..." />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2 font-medium transition-all active:scale-95">
                  <Save size={18} /> Guardar Ficha
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: NÓMINAS */}
          {activeTab === 'nomina' && (
            <div className="space-y-6">
              {!isPayrollFormOpen ? (
                <>
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-200">Historial de Pagos</h3>
                        <p className="text-xs text-slate-500">Liquidaciones generadas</p>
                    </div>
                    <button onClick={() => setIsPayrollFormOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all">
                      <Plus size={18} /> Nueva Liquidación
                    </button>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
                        <tr>
                          <th className="p-4">Periodo</th>
                          <th className="p-4 text-right">Base</th>
                          <th className="p-4 text-right">Bonos</th>
                          <th className="p-4 text-right">Descuentos</th>
                          <th className="p-4 text-right font-bold">Líquido Pago</th>
                          <th className="p-4 text-center">Imprimir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {payrolls.map(pay => {
                          const totalBonos = pay.bonuses?.reduce((a,b)=>a+b.amount,0) || 0;
                          const totalDesc = pay.deductions?.reduce((a,b)=>a+b.amount,0) || 0;
                          return (
                            <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{pay.period_date.slice(0,7)}</td>
                              <td className="p-4 text-right text-slate-600 dark:text-slate-400">${parseInt(pay.base_salary).toLocaleString()}</td>
                              <td className="p-4 text-right text-emerald-600">+${totalBonos.toLocaleString()}</td>
                              <td className="p-4 text-right text-red-500">-${totalDesc.toLocaleString()}</td>
                              <td className="p-4 text-right font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/50">${pay.total_pay.toLocaleString()}</td>
                              <td className="p-4 flex justify-center">
                                <button onClick={() => printPayroll(pay)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Descargar PDF">
                                  <Printer size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {payrolls.length === 0 && (
                          <tr><td colSpan="6" className="p-10 text-center text-slate-400 italic">No hay nóminas registradas para este empleado.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-right-4">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Generar Nueva Liquidación</h3>
                    <button onClick={() => setIsPayrollFormOpen(false)} className="text-slate-400 hover:text-slate-600">Cancelar</button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500">Periodo (Mes)</label>
                      <input type="month" className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                        value={newPayroll.period_date} onChange={e => setNewPayroll({...newPayroll, period_date: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500">Sueldo Base</label>
                      <input type="number" className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                        value={newPayroll.base_salary} onChange={e => setNewPayroll({...newPayroll, base_salary: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bonos */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                      <h4 className="font-bold text-emerald-600 mb-3 text-sm flex items-center gap-2"><Plus size={16}/> Bonos / Asignaciones</h4>
                      <div className="flex gap-2 mb-3">
                        <input type="text" placeholder="Concepto (ej: Bono Metas)" className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-transparent" id="bonusConcept" />
                        <input type="number" placeholder="$" className="w-24 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-transparent" id="bonusAmount" />
                        <button type="button" onClick={() => {
                           const c = document.getElementById('bonusConcept').value;
                           const a = document.getElementById('bonusAmount').value;
                           if(c && a) {
                             setNewPayroll(p => ({...p, bonuses: [...p.bonuses, {concept: c, amount: parseInt(a)}]}));
                             document.getElementById('bonusConcept').value = '';
                             document.getElementById('bonusAmount').value = '';
                           }
                        }} className="bg-emerald-100 text-emerald-700 p-2 rounded hover:bg-emerald-200"><Plus size={16}/></button>
                      </div>
                      <ul className="text-sm space-y-2">
                        {newPayroll.bonuses.map((b, i) => (
                          <li key={i} className="flex justify-between bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded">
                            <span className="text-slate-700 dark:text-slate-300">{b.concept}</span>
                            <span className="font-mono font-medium text-emerald-600">+${b.amount.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Descuentos */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">
                      <h4 className="font-bold text-red-600 mb-3 text-sm flex items-center gap-2"><MinusIcon size={16}/> Descuentos</h4>
                      <div className="flex gap-2 mb-3">
                        <input type="text" placeholder="Concepto (ej: Anticipo)" className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-transparent" id="descConcept" />
                        <input type="number" placeholder="$" className="w-24 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-transparent" id="descAmount" />
                        <button type="button" onClick={() => {
                           const c = document.getElementById('descConcept').value;
                           const a = document.getElementById('descAmount').value;
                           if(c && a) {
                             setNewPayroll(p => ({...p, deductions: [...p.deductions, {concept: c, amount: parseInt(a)}]}));
                             document.getElementById('descConcept').value = '';
                             document.getElementById('descAmount').value = '';
                           }
                        }} className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200"><Plus size={16}/></button>
                      </div>
                      <ul className="text-sm space-y-2">
                        {newPayroll.deductions.map((d, i) => (
                          <li key={i} className="flex justify-between bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded">
                            <span className="text-slate-700 dark:text-slate-300">{d.concept}</span>
                            <span className="font-mono font-medium text-red-500">-${d.amount.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={handleCreatePayroll} className="px-8 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2">
                      <Save size={18} /> Guardar y Generar Liquidación
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Icono auxiliar para descuentos
const MinusIcon = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);