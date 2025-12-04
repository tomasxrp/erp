import { useState, useEffect } from 'react';
import { Plus, Calendar, CheckCircle, ShoppingCart, Trash2, Package, Search, X, Loader2, Save, Building2, Truck, FileText } from 'lucide-react';
import { purchasingService } from '../services/purchasingService';
import { inventoryService } from '../../inventario/services/inventoryService';
import Toast from '../../../shared/components/ui/Toast';
import ConfirmationModal from '../../../shared/components/ui/ConfirmationModal';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [providers, setProviders] = useState([]);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [confirmReceive, setConfirmReceive] = useState(null);

  // Formulario Nueva Orden
  const [newOrder, setNewOrder] = useState({ provider_id: '', expected_delivery_date: '', notes: '' });
  const [cart, setCart] = useState([]); 
  const [prodSearch, setProdSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [o, p, prod] = await Promise.all([
        purchasingService.getOrders(),
        purchasingService.getProviders(),
        inventoryService.getProducts()
      ]);
      setOrders(o || []);
      setProviders(p || []);
      setProducts(prod || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  // --- LÓGICA CARRITO DE COMPRA ---
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item));
    } else {
      setCart([...cart, { ...product, quantity: 1, cost_price: product.cost_price || 0 }]);
    }
  };

  const updateCartItem = (id, field, value) => {
    setCart(cart.map(item => item.id === id ? { ...item, [field]: parseFloat(value) || 0 } : item));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const totalOrder = cart.reduce((acc, item) => acc + (item.cost_price * item.quantity), 0);

  // --- ACCIONES ---
  const handleCreate = async () => {
    if (!newOrder.provider_id || cart.length === 0) return setToast({message: 'Selecciona proveedor y productos', type:'error'});
    setSaving(true);
    try {
      await purchasingService.createOrder({ ...newOrder, total_amount: totalOrder }, cart);
      setToast({ message: 'Orden de compra generada', type: 'success' });
      setIsModalOpen(false);
      setCart([]); setNewOrder({ provider_id: '', expected_delivery_date: '', notes: '' });
      loadData();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleReceive = async () => {
    if (!confirmReceive) return;
    try {
      await purchasingService.receiveOrder(confirmReceive);
      setToast({ message: 'Stock actualizado correctamente', type: 'success' });
      loadData();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
    finally { setConfirmReceive(null); }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()));

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <ConfirmationModal isOpen={!!confirmReceive} onClose={() => setConfirmReceive(null)} onConfirm={handleReceive} 
        title="¿Recibir Mercadería?" message="Al confirmar, el sistema aumentará automáticamente el stock en tu inventario y actualizará los costos unitarios." confirmText="Sí, Actualizar Stock" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes de Compra</h1>
          <p className="text-slate-500 dark:text-slate-400">Control de abastecimiento y reposición de stock.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all font-medium">
          <Plus size={20} /> Nueva Orden
        </button>
      </div>

      {/* Grid de Órdenes */}
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <ShoppingCart className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500">No hay órdenes de compra registradas.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${order.status === 'recibida' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pl-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-bold text-slate-400 text-sm">#{order.order_number}</span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{order.providers?.name || 'Proveedor Eliminado'}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border ${
                      order.status === 'recibida' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      <Calendar size={14} className="text-blue-500"/> {new Date(order.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      <Package size={14} className="text-purple-500"/> {order.purchase_order_items.length} ítems
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      Total: ${order.total_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {order.status === 'pendiente' && (
                  <button 
                    onClick={() => setConfirmReceive(order.id)} 
                    className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle size={16} /> Recibir Mercadería
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL NUEVA ORDEN (Split View Mejorado) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            
            {/* LADO IZQUIERDO: CATÁLOGO */}
            <div className="w-full md:w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="text-blue-600" size={20}/> Catálogo de Productos
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                  <input type="text" placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all"
                    value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {filteredProducts.map(prod => (
                  <div key={prod.id} onClick={() => addToCart(prod)} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{prod.name}</p>
                        <p className="text-xs text-slate-500">{prod.sku}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110">
                        <Plus size={16} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Costo ref: <span className="font-mono text-slate-600 dark:text-slate-300">${prod.cost_price?.toLocaleString()}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* LADO DERECHO: DETALLE ORDEN (UI MEJORADA) */}
            <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-slate-900">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                <div>
                  <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <FileText className="text-emerald-600" size={24}/> Resumen de Orden
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Completa los datos del proveedor</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Datos Generales (UI Mejorada) */}
                <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Información del Proveedor</h3>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block ml-1">Seleccionar Proveedor</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
                        <select 
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer shadow-sm transition-all"
                          value={newOrder.provider_id} 
                          onChange={e => setNewOrder({...newOrder, provider_id: e.target.value})}
                        >
                          <option value="">-- Selecciona un proveedor --</option>
                          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block ml-1">Fecha de Entrega Estimada</label>
                      <div className="relative">
                        <Truck className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                          type="date" 
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all text-slate-600 dark:text-slate-300"
                          value={newOrder.expected_delivery_date} 
                          onChange={e => setNewOrder({...newOrder, expected_delivery_date: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Lista de Ítems */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <ShoppingCart size={16} className="text-slate-400"/> Ítems ({cart.length})
                    </h3>
                    <span className="text-xs text-slate-400">Ajusta cantidad y costo</span>
                  </div>
                  
                  {cart.length === 0 ? (
                    <div className="py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <Package className="mx-auto h-10 w-10 text-slate-300 mb-2 opacity-50" />
                      <p className="text-slate-400 text-sm">Selecciona productos a la izquierda para agregarlos.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="group flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-300 transition-colors">
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate dark:text-white text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                              <span className="text-[10px] text-slate-400 px-1 font-bold">Cant.</span>
                              <input 
                                type="number" min="1" 
                                className="w-12 text-center bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-white" 
                                value={item.quantity} 
                                onChange={e => updateCartItem(item.id, 'quantity', e.target.value)} 
                              />
                            </div>

                            <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                              <span className="text-[10px] text-slate-400 px-1 font-bold">$</span>
                              <input 
                                type="number" min="0" 
                                className="w-20 text-right bg-transparent outline-none text-sm font-mono text-slate-700 dark:text-white" 
                                value={item.cost_price} 
                                onChange={e => updateCartItem(item.id, 'cost_price', e.target.value)} 
                              />
                            </div>

                            <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-1">
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Total y Botón */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 backdrop-blur-sm sticky bottom-0">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Estimado</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">${totalOrder.toLocaleString()}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <CheckCircle size={20} />
                  </div>
                </div>
                <button 
                  onClick={handleCreate} 
                  disabled={saving || cart.length === 0 || !newOrder.provider_id} 
                  className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                  Generar Orden de Compra
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}