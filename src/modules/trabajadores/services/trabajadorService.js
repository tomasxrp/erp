import { supabase } from '../../../config/supabase';

// Helper para obtener bodega del admin actual
async function getMyWarehouseId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data } = await supabase
    .from('profiles')
    .select('warehouse_id')
    .eq('id', user.id)
    .single();
    
  return data?.warehouse_id;
}





export const trabajadorService = {
  // Obtener lista de trabajadores (Solo de mi bodega)
  async getTrabajadores() {
    // Gracias al RLS y get_my_warehouse_id(), esto ya filtra solo tus empleados
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
  
  async updateWorkerRoles(id, newRolesArray) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRolesArray }) // Enviamos el array ej: ['admin', 'vendedor']
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Crear Trabajador (CON HERENCIA DE BODEGA)
  async createTrabajador(userData) {
    // 1. Obtener mi ID de bodega para pasárselo al nuevo empleado
    const myWarehouseId = await getMyWarehouseId();
    if (!myWarehouseId) throw new Error("No se pudo identificar tu bodega.");

    // 2. Registrar usuario pasando el warehouse_id en los metadatos
    // IMPORTANTE: Esto cerrará la sesión actual del administrador en el navegador
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role || 'vendedor',
          warehouse_id: myWarehouseId // <--- ESTO ACTIVA LA HERENCIA EN SQL
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // Eliminar trabajador (Opcional, pero útil)
  async deleteTrabajador(id) {
    // Nota: Supabase Auth no permite borrar usuarios desde el cliente fácilmente.
    // Esto solo borraría el perfil, pero el usuario Auth seguiría existiendo.
    // Para borrar completamente se requiere una Edge Function (Backend).
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  }
};