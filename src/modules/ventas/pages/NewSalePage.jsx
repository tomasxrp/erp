import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ShoppingCart, UserPlus, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { inventoryService } from '../../inventario/services/inventoryService';
import { crmService } from '../../crm/services/crmService';
import { generateDocumentPDF } from '../../../shared/utils/pdfGenerator';
import ClientForm from '../../crm/components/ClientForm';

export default function NewSalePage() {
  // Estados de Datos
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [companySettings, setCompanySettings] = useState({});
  
  // Estados de la Venta
  const [docType, setDocType] = useState('boleta'); // boleta, factura, cotizacion
  const [selectedClient, setSelectedClient] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [p, c, s] = await Promise.all([
        inventoryService.getProducts(),
        crmService.getClients(),
        supabase.from('company_settings').select('*').single()
      ]);
      setProducts(p);
      setClients(c || []); // Aseguramos array aunque venga null
      if (s.data) setCompanySettings(s.data);
    } catch (e) { 
      console.error("Error cargando datos:", e); 
    } finally { 
      setLoading(false); 
    }
  }

  // Lógica del Carrito
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.total_stock) return alert("No hay más stock disponible");
      setCart(cart.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item));
    } else {
      if (product.total_stock < 1) return alert("Sin stock");
      setCart([...cart, { ...product, quantity: 1, unit_price: product.price }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  // Cálculos (Chile: IVA 19%)
  const calculateTotals = () => {
    const total = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    let net = total;
    let tax = 0;

    if (docType === 'factura') {
      // En factura, asumimos que los precios de lista son BRUTOS (con IVA) y desglosamos
      net = Math.round(total / 1.19);
      tax = total - net;
    } 
    // Para boleta y cotización, el total es directo y el IVA es interno (o no aplica visualmente)
    
    return { net, tax, total };
  };

  // Guardar Venta
  const handleCheckout = async () => {
    if (cart.length === 0) return alert("El carrito está vacío");
    if (!selectedClient && docType === 'factura') return alert("La factura requiere seleccionar un cliente registrado");
    
    setProcessing(true);
    const { net, tax, total } = calculateTotals();
    const receiptNumber = Date.now().toString().slice(-6); // Simulación de folio simple

    try {
      // 1. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Guardar Cabecera de Venta
      const { data: sale, error } = await supabase.from('sales').insert([{
        user_id: user?.id,
        client_id: selectedClient?.id || null,
        client_snapshot: selectedClient || { name: 'Cliente General' }, // Guardamos snapshot
        total_amount: total,
        net_amount: net,
        tax_amount: tax,
        type: docType,
        receipt_number: receiptNumber,
        status: 'completada' // Columna que agregamos recientemente
      }]).select().single();

      if (error) throw error;

      // 3. Guardar Items de Venta
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));
      
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // 4. Descontar Stock (Lógica simple para MVP: Bodega Principal)
      // Nota: Si quieres un descuento multi-bodega real, necesitarías iterar 'product_stocks'
      if (docType !== 'cotizacion') {
        // Aquí podrías implementar la lógica de descuento de stock si lo deseas
      }

      // 5. Generar PDF (Con Await para esperar la imagen)
      await generateDocumentPDF(sale, companySettings, saleItems);

      alert(`¡${docType.charAt(0).toUpperCase() + docType.slice(1)} generada correctamente!`);
      
      // Limpiar estado
      setCart([]);
      setSelectedClient(null);

    } catch (e) {
      console.error(e);
      alert("Error al procesar venta: " + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6">
      
      {/* IZQUIERDA: Catálogo de Productos */}
      <div className="flex-1 flex flex-col gap-4 min-h-0"> {/* min-h-0 es clave para scroll en flex */}
        
        {/* Barra de búsqueda */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex gap-4 shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50"
              placeholder="Buscar productos por nombre o SKU..."
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid Productos (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} 
                onClick={() => addToCart(product)}
                className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-40"
              >
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{product.sku}</p>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                    ${product.price.toLocaleString()}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    product.total_stock > 5 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                      : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                  }`}>
                    {product.total_stock} {product.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DERECHA: Panel de Venta (Carrito) */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col shrink-0 lg:h-full h-auto">
        
        {/* Header Carrito */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
            <ShoppingCart size={20} className="text-blue-600" /> Nueva Venta
          </h2>
        </div>

        {/* Configuración (Tipo y Cliente) */}
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
              <option value="">Cliente General / Mostrador</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.tax_id || 'Sin ID'})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
              <ShoppingCart size={48} className="stroke-1" />
              <p className="text-sm">Agrega productos del catálogo</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex-1 mr-2 overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.quantity} x ${item.unit_price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    ${(item.unit_price * item.quantity).toLocaleString()}
                  </span>
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Totales */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-b-2xl border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="space-y-2 mb-4 text-sm">
            {docType === 'factura' && (
              <>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Neto</span>
                  <span>${calculateTotals().net.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>IVA (19%)</span>
                  <span>${calculateTotals().tax.toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
              </>
            )}
            <div className="flex justify-between text-xl font-extrabold text-slate-900 dark:text-white">
              <span>Total</span>
              <span>${calculateTotals().total.toLocaleString()}</span>
            </div>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {processing ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
            {processing ? 'Generando...' : `Emitir ${docType.charAt(0).toUpperCase() + docType.slice(1)}`}
          </button>
        </div>

      </div>

      {/* Modal Nuevo Cliente Rápido */}
      {showClientForm && (
        <ClientForm 
          onClose={() => setShowClientForm(false)} 
          onSuccess={() => {
            setShowClientForm(false);
            loadData(); // Recargar clientes
          }} 
        />
      )}
    </div>
  );
}