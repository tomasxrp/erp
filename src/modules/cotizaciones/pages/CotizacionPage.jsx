import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileText, UserPlus, Loader2, Minus, Package, Wrench, ClipboardList } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { inventoryService } from '../../inventario/services/inventoryService';
import { servicesService } from '../../servicios/services/servicesService';
import { crmService } from '../../crm/services/crmService';
import { generateDocumentPDF } from '../../../shared/utils/pdfGenerator';
import ClientForm from '../../crm/components/ClientForm';
import Toast from '../../../shared/components/ui/Toast';

export default function CotizacionPage() {
  const [allItems, setAllItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [companySettings, setCompanySettings] = useState({});

  const [selectedClient, setSelectedClient] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [conditions, setConditions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (msg, type = 'error') => setToast({ message: msg, type });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles').select('warehouse_id').eq('id', user.id).single();

      const [prods, servs, cli, settings] = await Promise.all([
        inventoryService.getProducts(),
        servicesService.getServices(),
        crmService.getClients(),
        supabase.from('company_settings').select('*').eq('warehouse_id', profile.warehouse_id).single()
      ]);

      const taggedProducts = (prods || []).map(p => ({ ...p, itemType: 'product' }));
      const taggedServices = (servs || []).map(s => ({ ...s, itemType: 'service', total_stock: Infinity }));

      setAllItems([...taggedProducts, ...taggedServices]);
      setClients(cli || []);
      if (settings.data) {
        setCompanySettings(settings.data);
        // Pre-cargar condiciones e información adicional desde config si existen
        if (settings.data.quote_conditions) setConditions(settings.data.quote_conditions);
        if (settings.data.quote_payment_info) setAdditionalInfo(settings.data.quote_payment_info);
      }
    } catch (e) {
      console.error('Error cargando datos:', e);
      showToast('Error al cargar datos del sistema', 'error');
    } finally {
      setLoading(false);
    }
  }

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      handleUpdateQuantity(item.id, 1);
    } else {
      setCart([...cart, { ...item, quantity: 1, unit_price: item.price }]);
    }
  };

  const handleUpdateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

  const calculateTotals = () => {
    const total = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    const net = Math.round(total / 1.19);
    const tax = total - net;
    return { net, tax, total };
  };
  const handleCheckout = async () => {
    if (cart.length === 0) return showToast('El carrito está vacío', 'info');
    if (!selectedClient) {
      return showToast('Debes seleccionar un cliente para generar la cotización.', 'error');
    }
    if (!conditions || conditions.trim() === '') {
      return showToast('Debes ingresar las condiciones de la cotización.', 'error');
    }
    if (!paymentMethod || paymentMethod.trim() === '') {
      return showToast('Debes ingresar la forma / método de pago.', 'error');
    }

    setProcessing(true);
    const { net, tax, total } = calculateTotals();
    const receiptNumber = quoteNumber || ('COT-' + Date.now().toString().slice(-6));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data: profile } = await supabase
        .from('profiles').select('warehouse_id').eq('id', user.id).single();
      if (!profile?.warehouse_id) throw new Error('No se pudo obtener la bodega');

      const { data: sale, error } = await supabase.from('sales').insert([{
        user_id: user.id,
        client_id: selectedClient?.id || null,
        client_snapshot: selectedClient || { name: 'Cliente General' },
        total_amount: total,
        net_amount: net,
        tax_amount: tax,
        type: 'cotizacion',
        receipt_number: receiptNumber,
        status: 'completada',
        warehouse_id: profile.warehouse_id
      }]).select().single();

      if (error) throw error;

      const saleItemsToInsert = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.itemType === 'product' ? item.id : null,
        service_id: item.itemType === 'service' ? item.id : null,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsToInsert);
      if (itemsError) throw itemsError;

      // Generar PDF con condiciones y método de pago personalizados
      const saleForPdf = {
        ...sale,
        quote_number_manual: quoteNumber,
        quote_conditions: conditions,
        quote_payment_method: paymentMethod,
        quote_additional_info: additionalInfo
      };
      await generateDocumentPDF(saleForPdf, companySettings, saleItemsToInsert);

      showToast('¡Cotización generada correctamente!', 'success');
      setCart([]);
      setSelectedClient(null);
      setQuoteNumber('');
      setPaymentMethod(''); // Limpiar forma de pago manual

    } catch (e) {
      console.error('Error generando cotización:', e);
      showToast('Error al procesar: ' + e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 relative">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      {/* IZQUIERDA: Catálogo */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50"
              placeholder="Buscar productos o servicios..."
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className={`group p-4 rounded-xl border hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-40 relative overflow-hidden
                  ${item.itemType === 'service'
                    ? 'bg-blue-50/50 dark:bg-slate-900 border-blue-200 dark:border-blue-900/30 hover:border-blue-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
              >
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  {item.itemType === 'service'
                    ? <Wrench size={100} className="text-blue-600" />
                    : <Package size={100} className="text-emerald-600" />
                  }
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.itemType === 'service'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                    {item.itemType === 'service' ? 'Servicio' : 'Producto'}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-sm leading-snug mt-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    {item.itemType === 'product' ? item.sku : item.category}
                  </p>
                </div>
                <div className="flex justify-between items-end mt-2 z-10">
                  <span className="font-bold text-slate-900 dark:text-white text-lg">
                    ${item.price.toLocaleString()}
                  </span>
                  {item.itemType === 'product' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-850">
                      {item.unit}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                      {item.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DERECHA: Panel Cotización */}
      <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col shrink-0 lg:h-full overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
            <ClipboardList size={20} className="text-blue-600" /> Nueva Cotización
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">El stock no se descuenta en cotizaciones</p>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Sección: Datos */}
          <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">

            {/* Cliente */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-bold uppercase text-slate-500">Cliente</label>
                <button onClick={() => setShowClientForm(true)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline font-medium">
                  <UserPlus size={12} /> Nuevo Cliente
                </button>
              </div>
              <select
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                onChange={e => setSelectedClient(clients.find(c => c.id === e.target.value))}
                value={selectedClient?.id || ''}
              >
                <option value="">Seleccionar Cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.tax_id || 'Sin ID'})</option>
                ))}
              </select>
            </div>

            {/* Número de cotización */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">N° Cotización (Opcional)</label>
              <div className="relative mt-1">
                <FileText className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400"
                  placeholder="Ej: COT-2025-001"
                  value={quoteNumber}
                  onChange={e => setQuoteNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sección: Ítems del carrito */}
          <div className="p-4 space-y-2 border-b border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase text-slate-500">Ítems ({cart.length})</label>

            {cart.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 opacity-60">
                <ClipboardList size={36} className="stroke-1 mb-2" />
                <p className="text-sm">Agrega productos o servicios</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {item.itemType === 'service' ? <Wrench size={13} className="text-blue-500" /> : <Package size={13} className="text-emerald-500" />}
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[140px]">{item.name}</p>
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      ${(item.unit_price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1">
                      <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><Minus size={12} /></button>
                      <span className="text-xs font-bold w-4 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><Plus size={12} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sección: Condiciones personalizadas */}
          <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Condiciones de la Cotización
              </label>
              <textarea
                rows={2}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400 resize-none"
                placeholder="Ej: Validez de la oferta: 15 días. Precios sujetos a cambio sin previo aviso."
                value={conditions}
                onChange={e => setConditions(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Forma / Método de Pago
              </label>
              <input
                type="text"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400"
                placeholder="Ej: Transferencia, Efectivo, 30 días, etc."
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Información Adicional (Datos de Transferencia, etc.)
              </label>
              <textarea
                rows={3}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400 resize-none"
                placeholder="Ej: Datos de Transferencia: Banco Estado, Cuenta Corriente N° 123456789, a nombre de..."
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer: Totales y botón */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-b-2xl border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex justify-between items-center text-xl font-extrabold text-slate-900 dark:text-white mb-3">
            <span>Total</span>
            <span>${calculateTotals().total.toLocaleString()}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className="w-full py-3.5 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
          >
            {processing ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
            {processing ? 'Generando...' : 'Emitir Cotización'}
          </button>
        </div>
      </div>

      {showClientForm && (
        <ClientForm
          onClose={() => setShowClientForm(false)}
          onSuccess={() => { setShowClientForm(false); loadData(); }}
        />
      )}
    </div>
  );
}