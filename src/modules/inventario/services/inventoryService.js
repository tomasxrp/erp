import { supabase } from '../../../config/supabase';

// Helper: Obtener warehouse_id del usuario actual
async function getCurrentUserWarehouse() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('warehouse_id')
    .eq('id', user.id)
    .single();

  if (error || !profile?.warehouse_id) {
    throw new Error('No se pudo obtener la bodega del usuario');
  }

  return profile.warehouse_id;
}

export const inventoryService = {
  // Obtener productos (SOLO ACTIVOS)
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_stocks (
          quantity,
          warehouse_id,
          warehouses (name)
        )
      `)
      .eq('active', true) // <--- CAMBIO CLAVE: Solo traer los no eliminados
      .order('name');

    if (error) throw error;

    return data.map(product => ({
      ...product,
      total_stock: product.product_stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0
    }));
  },

  // Obtener bodegas
  async getWarehouses() {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('active', true)
      .order('is_main', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Crear Producto
  async createProduct(productData) {
    const warehouse_id = await getCurrentUserWarehouse();

    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        sku: productData.sku,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        cost_price: productData.cost_price,
        unit: productData.unit,
        category: productData.category,
        barcode: productData.barcode,
        min_stock_alert: productData.min_stock_alert,
        warehouse_id: warehouse_id,
        active: true // Aseguramos que nazca activo
      }])
      .select()
      .single();

    if (error) throw error;

    // Inicializar stock
    const { error: stockError } = await supabase
      .from('product_stocks')
      .insert([{
        product_id: product.id,
        warehouse_id: warehouse_id,
        quantity: productData.stock || 0,
        min_limit: productData.min_stock_alert || 5
      }]);

    if (stockError) throw stockError;

    return product;
  },

  // Actualizar Producto
  async updateProduct(id, updates) {
    const { stock, ...productFields } = updates;

    const { data, error } = await supabase
      .from('products')
      .update(productFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    if (stock !== undefined && stock !== null) {
      const warehouse_id = await getCurrentUserWarehouse();

      const { error: stockError } = await supabase
        .from('product_stocks')
        .upsert({
          product_id: id,
          warehouse_id: warehouse_id,
          quantity: stock,
          min_limit: productFields.min_stock_alert || 5 
        }, { 
          onConflict: 'product_id,warehouse_id'
        });

      if (stockError) throw stockError;
    }

    return data;
  },

  // Eliminar Producto (AHORA ES SOFT DELETE)
  async deleteProduct(id) {
    // En lugar de .delete(), hacemos .update()
    const { error } = await supabase
      .from('products')
      .update({ active: false }) // <--- CAMBIO CLAVE: "Apagar" el producto
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};