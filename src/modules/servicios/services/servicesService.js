import { supabase } from '../../../config/supabase';

// Helper para obtener la bodega del usuario actual
async function getCurrentUserWarehouse() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('warehouse_id')
    .eq('id', user.id)
    .single();

  if (!profile?.warehouse_id) throw new Error('No tienes bodega asignada');
  return profile.warehouse_id;
}

export const servicesService = {
  // Obtener Servicios
  async getServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Crear Servicio
  async createService(serviceData) {
    const warehouse_id = await getCurrentUserWarehouse();

    const { data, error } = await supabase
      .from('services')
      .insert([{
        ...serviceData,
        warehouse_id: warehouse_id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar Servicio
  async updateService(id, updates) {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar Servicio (Borrado lógico o físico)
  async deleteService(id) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};