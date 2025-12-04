import { supabase } from '../../../config/supabase';

// Helper
const getWarehouse = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('profiles').select('warehouse_id').eq('id', user.id).single();
  return data?.warehouse_id;
};

export const purchasingService = {
  // --- PROVEEDORES ---
  async getProviders() {
    const { data, error } = await supabase.from('providers').select('*').order('name');
    if (error) throw error;
    return data;
  },

  async createProvider(provider) {
    const warehouse_id = await getWarehouse();
    const { error } = await supabase.from('providers').insert([{ ...provider, warehouse_id }]);
    if (error) throw error;
  },

  async deleteProvider(id) {
    const { error } = await supabase.from('providers').delete().eq('id', id);
    if (error) throw error;
  },

  // --- ÓRDENES ---
  async getOrders() {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        providers (name),
        purchase_order_items (
          quantity, unit_cost,
          products (name, sku)
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createOrder(orderHeader, items) {
    const warehouse_id = await getWarehouse();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Crear Cabecera
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert([{
        ...orderHeader,
        user_id: user.id,
        warehouse_id,
        status: 'pendiente'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Crear Items
    const itemsData = items.map(i => ({
      purchase_order_id: order.id,
      product_id: i.id,
      quantity: i.quantity,
      unit_cost: i.cost_price
    }));

    const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsData);
    if (itemsError) throw itemsError;

    return order;
  },

  // --- RECEPCIÓN ---
  async receiveOrder(orderId) {
    const warehouse_id = await getWarehouse();
    const { error } = await supabase.rpc('receive_purchase_order', {
      p_order_id: orderId,
      p_warehouse_id: warehouse_id
    });
    if (error) throw error;
  }
};