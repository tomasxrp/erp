import { supabase } from '../../../config/supabase';

export const inventoryService = {
  // Obtener todos los productos
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
      .order('name');

    if (error) throw error;

    return data.map(product => ({
      ...product,
      total_stock: product.product_stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0
    }));
  },

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
    // 1. Insertar el producto base
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
        min_stock_alert: productData.min_stock_alert
      }])
      .select()
      .single();

    if (error) throw error;

    // 2. Inicializar stock
    const warehouses = await this.getWarehouses();
    
    // Identificar bodega principal para asignar el stock inicial ahí
    const mainWarehouse = warehouses.find(w => w.is_main) || warehouses[0];

    const initialStocks = warehouses.map(w => ({
      product_id: product.id,
      warehouse_id: w.id,
      // Solo asignamos el stock inicial a la bodega principal, el resto en 0
      quantity: (w.id === mainWarehouse?.id) ? (productData.stock || 0) : 0,
      min_limit: productData.min_stock_alert || 5
    }));

    if (initialStocks.length > 0) {
      await supabase.from('product_stocks').insert(initialStocks);
    }

    return product;
  },

  // Actualizar Producto
  async updateProduct(id, updates) {
    // 1. Separamos el stock de los datos directos del producto
    const { stock, ...productFields } = updates;

    // 2. Actualizamos la tabla 'products' (Nombre, Precio, SKU, etc.)
    const { data, error } = await supabase
      .from('products')
      .update(productFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // 3. Actualizar Stock en Bodega Principal (CORRECCIÓN)
    // Si el formulario envió un valor de stock, actualizamos la tabla 'product_stocks'
    if (stock !== undefined && stock !== null) {
      const warehouses = await this.getWarehouses();
      const mainWarehouse = warehouses.find(w => w.is_main) || warehouses[0];

      if (mainWarehouse) {
        // Usamos upsert para crear o actualizar el registro de stock
        const { error: stockError } = await supabase
          .from('product_stocks')
          .upsert({
            product_id: id,
            warehouse_id: mainWarehouse.id,
            quantity: stock,
            // Actualizamos también la alerta si cambió en el producto
            min_limit: productFields.min_stock_alert || 5 
          }, { onConflict: 'product_id, warehouse_id' });

        if (stockError) throw stockError;
      }
    }

    return data;
  },

  // Eliminar Producto
  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};