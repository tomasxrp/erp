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
  // 1. Obtener lista de trabajadores
  async getTrabajadores() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // 2. Crear Trabajador (Con herencia de bodega)
  async createTrabajador(userData) {
    const myWarehouseId = await getMyWarehouseId();
    if (!myWarehouseId) throw new Error("No se pudo identificar tu bodega.");

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role || 'vendedor',
          warehouse_id: myWarehouseId
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // 3. Actualizar Trabajador (Genérico: Teléfono, Nombre, etc.) - ESTA FALTABA
  async updateTrabajador(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 4. Actualizar Roles (Admin Panel)
  async updateWorkerRoles(id, newRolesArray) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRolesArray })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 5. Eliminar trabajador
  async deleteTrabajador(id) {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  },

  // --- MÓDULO RRHH (NUEVO) ---

  // 6. Obtener detalle completo (Perfil + Datos Laborales)
  async getEmployeeFullDetails(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        employee_details (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 7. Guardar/Actualizar Ficha Laboral
  async upsertEmployeeDetails(details) {
    const warehouse_id = await getMyWarehouseId();
    
    const { data, error } = await supabase
      .from('employee_details')
      .upsert({ 
        ...details,
        warehouse_id 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 8. Obtener Nóminas
  async getEmployeePayrolls(employeeId) {
    const { data, error } = await supabase
      .from('payrolls')
      .select('*')
      .eq('employee_id', employeeId)
      .order('period_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // 9. Crear Nómina
  async createPayroll(payrollData) {
    const warehouse_id = await getMyWarehouseId();
    
    const { data, error } = await supabase
      .from('payrolls')
      .insert([{
        ...payrollData,
        warehouse_id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  // 10. Eliminar Nómina
  async deletePayroll(id) {
    const { error } = await supabase.from('payrolls').delete().eq('id', id);
    if (error) throw error;
  }
};