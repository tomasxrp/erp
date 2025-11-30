import { supabase } from '../../../config/supabase';

export const crmService = {
  // Obtener lista general de clientes
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Obtener UN cliente con su HISTORIAL DE COMPRAS
  async getClientWithHistory(id) {
    // CORRECCIÓN: Se eliminó el campo 'status' de la consulta a 'sales'
    // ya que esa columna no existe en tu tabla de ventas actual.
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        sales (
          id,
          created_at,
          total_amount,
          receipt_number,
          sale_items (
            product_name,
            quantity,
            unit_price
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Crear cliente
  async createClient(clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};