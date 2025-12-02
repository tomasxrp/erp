import { supabase } from '../../../config/supabase';

// Helper de bodega
async function getCurrentUserWarehouse() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('profiles').select('warehouse_id').eq('id', user.id).single();
  return data?.warehouse_id;
}

export const projectsService = {
  // Obtener proyectos activos
  async getActiveProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients (name),
        project_materials (
          quantity,
          products (name, unit)
        )
      `)
      .eq('status', 'activo')
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Crear Proyecto (Usando la función RPC para descontar stock)
  async createProject(projectData, materials) {
    const warehouseId = await getCurrentUserWarehouse();
    
    // Llamada a la función SQL compleja
    const { error } = await supabase.rpc('create_project_with_stock', {
      p_project_data: projectData,
      p_materials: materials,
      p_warehouse_id: warehouseId
    });

    if (error) throw error;
    return true;
  },

  // Finalizar Proyecto (Devolver Stock)
  async finishProject(projectId) {
    const warehouseId = await getCurrentUserWarehouse();

    const { error } = await supabase.rpc('finish_project_and_return_stock', {
      p_project_id: projectId,
      p_warehouse_id: warehouseId
    });

    if (error) throw error;
    return true;
  }
};