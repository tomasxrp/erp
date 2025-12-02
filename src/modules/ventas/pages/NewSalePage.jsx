import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ShoppingCart, UserPlus, FileText, Loader2, Minus, Package, Wrench } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { inventoryService } from '../../inventario/services/inventoryService';
import { servicesService } from '../../servicios/services/servicesService';
import { crmService } from '../../crm/services/crmService';
import { generateDocumentPDF } from '../../../shared/utils/pdfGenerator';
import ClientForm from '../../crm/components/ClientForm';
import Toast from '../../../shared/components/ui/Toast';

export default function NewSalePage() {
  // Estados de Datos
  const [allItems, setAllItems] = useState([]); // Productos + Servicios mezclados
  const [clients, setClients] = useState([]);
  const [companySettings, setCompanySettings] = useState({});
  
  // Estados de la Venta
  const [docType, setDocType] = useState('boleta'); // boleta, factura, cotizacion
  const [selectedClient, setSelectedClient] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Función Helper para notificaciones
  const showToast = (msg, type = 'error') => {
    setToast({ message: msg, type });
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('warehouse_id')
        .eq('id', user.id)
        .single();

      // Cargamos Productos, Servicios y Clientes en paralelo
      const [prods, servs, cli, settings] = await Promise.all([
        inventoryService.getProducts(),
        servicesService.getServices(),
        crmService.getClients(),
        supabase.from('company_settings').select('*').eq('warehouse_id', profile.warehouse_id).single()
      ]);
      
      // Unificamos la lista añadiendo un campo "itemType" para diferenciar
      const taggedProducts = (prods || []).map(p => ({ ...p, itemType: 'product' }));
      const taggedServices = (servs || []).map(s => ({ ...s, itemType: 'service', total_stock: Infinity })); // Servicios tienen stock infinito lógico
      
      setAllItems([...taggedProducts, ...taggedServices]);
      setClients(cli || []);
      if (settings.data) setCompanySettings(settings.data);

    } catch (e) { 
      console.error("Error cargando datos:", e); 
      showToast("Error al cargar datos del sistema", 'error');
    } finally { 
      setLoading(false); 
    }
  }

  // Agregar al Carrito
  const addToCart = (item) => {
    const existing = cart.find(cartItem => cartItem.id === item.id);
    if (existing) {
      handleUpdateQuantity(item.id, 1);
    } else {
      // Validación de Stock inicial (Solo para productos y si no es cotización)
      if (item.itemType === 'product' && docType !== 'cotizacion' && item.total_stock < 1) {
        return showToast("Sin stock disponible para este producto", 'error');
      }
      setCart([...cart, { ...item, quantity: 1, unit_price: item.price }]);
    }
  };

  // Actualizar Cantidad (+/-)
  const handleUpdateQuantity = (id, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        
        // 1. Validar Stock Máximo (Solo si es Producto y NO es cotización)
        if (delta > 0 && item.itemType === 'product' && docType !== 'cotizacion' && newQuantity > item.total_stock) {
          showToast(`Stock insuficiente. Solo quedan ${item.total_stock} unidades.`, 'error');
          return item;
        }

        // 2. Validar Mínimo 1
        if (newQuantity < 1) return item;

        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  // Cálculo de Totales (Siempre calculamos IVA)
  const calculateTotals = () => {
    const total = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    
    // Asumimos precios brutos (IVA incluido)
    const net = Math.round(total / 1.19);
    const tax = total - net;
    
    return { net, tax, total };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast("El carrito está vacío", 'info');
    if (!selectedClient && (docType === 'factura' || docType === 'cotizacion')) {
        return showToast("Debes seleccionar un cliente para este documento.", 'error');
    }
    
    setProcessing(true);
    const { net, tax, total } = calculateTotals();
    const receiptNumber = Date.now().toString().slice(-6);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data: profile } = await supabase.from('profiles').select('warehouse_id').eq('id', user.id).single();
      if (!profile?.warehouse_id) throw new Error('No se pudo obtener la bodega del usuario');

      // 1. Guardar Cabecera Venta
      const { data: sale, error } = await supabase.from('sales').insert([{
        user_id: user.id,
        client_id: selectedClient?.id || null,
        client_snapshot: selectedClient || { name: 'Cliente General' },
        total_amount: total,
        net_amount: net,
        tax_amount: tax,
        type: docType,
        receipt_number: receiptNumber,
        status: 'completada',
        warehouse_id: profile.warehouse_id
      }]).select().single();

      if (error) throw error;

      // 2. Guardar Items (Mapeando product_id O service_id)
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

      // 3. Descontar Stock (SOLO PRODUCTOS y si NO es cotización)
      if (docType !== 'cotizacion') {
        for (const item of cart) {
          if (item.itemType === 'product') { 
            try {
              await supabase.rpc('decrement_stock', {
                p_product_id: item.id,
                p_warehouse_id: profile.warehouse_id,
                p_quantity: item.quantity
              });
            } catch (stockError) {
              console.warn('Error al descontar stock:', stockError);
            }
          }
        }
      }

      // 4. Generar PDF
      const saleForPdf = { ...sale, quote_number_manual: quoteNumber };
      await generateDocumentPDF(saleForPdf, companySettings, saleItemsToInsert);

      showToast(`¡${docType.charAt(0).toUpperCase() + docType.slice(1)} generada correctamente!`, 'success');
      
      setCart([]);
      setSelectedClient(null);
      setQuoteNumber('');
      await loadData(); // Recargar para actualizar stock visualmente

    } catch (e) {
      console.error('Error en venta:', e);
      showToast("Error al procesar: " + e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Filtrado Unificado
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
      
      {/* Sistema de Notificaciones */}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      {/* IZQUIERDA: Catálogo Unificado */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex gap-4 shrink-0">
          <div className="flex-1 relative">
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
                {/* Icono de Fondo Decorativo */}
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                   {item.itemType === 'service' 
                     ? <Wrench size={100} className="text-blue-600" /> 
                     : <Package size={100} className="text-emerald-600" />
                   }
                </div>

                <div>
                  <div className="flex items-start justify-between mb-1">
                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.itemType === 'service' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                     }`}>
                        {item.itemType === 'service' ? 'Servicio' : 'Producto'}
                     </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-sm leading-snug">
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.total_stock > 5 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                        : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                    }`}>
                        {item.total_stock} {item.unit}
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

      {/* DERECHA: Carrito de Compras */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col shrink-0 lg:h-full h-auto">
        
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
            <ShoppingCart size={20} className="text-blue-600" /> Nueva Venta
          </h2>
        </div>

        <div className="p-4 space-y-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {/* Selector Tipo */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {['boleta', 'factura', 'cotizacion'].map(type => (
              <button
                key={type}
                onClick={() => setDocType(type)}
                className={`flex-1 py-1.5 text-xs sm:text-sm capitalize rounded-md font-medium transition-all ${
                  docType === type 
                  ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Selector Cliente */}
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

          {/* Input Cotización Manual */}
          {docType === 'cotizacion' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold uppercase text-slate-500">N° Cotización (Opcional)</label>
              <div className="relative mt-1">
                 <FileText className="absolute left-3 top-2.5 text-slate-400" size={16} />
                 <input
                   type="text"
                   className="w-full pl-9 pr-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 placeholder-slate-400"
                   placeholder="Ej: COT-2025-001"
                   value={quoteNumber}
                   onChange={e => setQuoteNumber(e.target.value)}
                 />
              </div>
            </div>
          )}
        </div>

        {/* Lista Items con Botones +/- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
              <ShoppingCart size={48} className="stroke-1" />
              <p className="text-sm">Agrega productos o servicios</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                     {item.itemType === 'service' ? <Wrench size={14} className="text-blue-500" /> : <Package size={14} className="text-emerald-500" />}
                     <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[130px]">{item.name}</p>
                   </div>
                   <p className="font-bold text-sm text-slate-900 dark:text-white">
                    ${(item.unit_price * item.quantity).toLocaleString()}
                   </p>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1">
                      <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 transition-colors"><Minus size={14} /></button>
                      <span className="text-xs font-bold w-4 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 transition-colors"><Plus size={14} /></button>
                   </div>
                   <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Totales y Botón */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-b-2xl border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-xl font-extrabold text-slate-900 dark:text-white">
              <span>Total</span>
              <span>${calculateTotals().total.toLocaleString()}</span>
            </div>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className={`w-full py-3.5 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]
              ${docType === 'cotizacion' 
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`
            }
          >
            {processing ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
            {processing ? 'Generando...' : `Emitir ${docType.charAt(0).toUpperCase() + docType.slice(1)}`}
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