import { supabase } from '../../../config/supabase';

export const registrosService = {
  // Obtener todo el historial (Ventas y Cotizaciones)
  // RLS filtra automáticamente por la bodega del usuario
  async getRegistros() {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          product_name,
          quantity,
          unit_price,
          product_id,
          service_id
        )
      `)
      .order('created_at', { ascending: false }); // Lo más reciente primero
    
    if (error) throw error;
    return data;
  },

  // Eliminar un registro
  async deleteRegistro(id) {
    // 1. Primero borramos los items asociados (para evitar errores de llave foránea si no hay cascada)
    const { error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);

    if (itemsError) throw itemsError;

    // 2. Borramos la cabecera de la venta/cotización
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};