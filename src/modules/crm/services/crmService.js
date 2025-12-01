import { supabase } from '../../../config/supabase';

export const crmService = {
  // Obtener lista general de clientes (SOLO DE MI BODEGA)
  async getClients() {
    // RLS automáticamente filtra por warehouse_id del usuario
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Obtener UN cliente con su HISTORIAL DE COMPRAS
  async getClientWithHistory(id) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        sales (
          id,
          created_at,
          total_amount,
          receipt_number,
          status,
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

  // Crear cliente (AUTOMÁTICAMENTE SE ASIGNA A LA BODEGA DEL USUARIO)
  async createClient(clientData) {
    // PASO 1: Obtener el warehouse_id del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // PASO 2: Obtener el perfil del usuario para obtener su warehouse_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('warehouse_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('No se pudo obtener información del usuario');
    }

    if (!profile.warehouse_id) {
      throw new Error('Tu usuario no tiene una bodega asignada. Contacta al administrador.');
    }

    // PASO 3: Crear el cliente con warehouse_id del usuario
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        ...clientData,
        warehouse_id: profile.warehouse_id // ✅ Asignar bodega del usuario
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Cliente creado en bodega:', profile.warehouse_id);
    
    return data;
  },

  // Actualizar cliente
  async updateClient(id, updates) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar cliente
  async deleteClient(id) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};