import { supabase } from '../../../config/supabase';

export const trabajadorService = {
  // Obtener lista de trabajadores
  async getTrabajadores() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // CREACIÓN REAL DE USUARIO (Con efecto secundario de cambio de sesión)
  async createTrabajador(userData) {
    // 1. Registro en Supabase Auth
    // Al hacer esto, el cliente de Supabase cambia la sesión al nuevo usuario inmediatamente.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name, // Esto lo captura el Trigger SQL para crear la fila en profiles
        },
      },
    });

    if (authError) throw authError;

    // 2. Actualizar datos adicionales (Rol y Teléfono)
    // Como ahora estamos logueados como el nuevo usuario, la política RLS "Editar propio perfil"
    // nos permite actualizar estos campos de nuestro propio perfil recién creado.
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: userData.role,
          phone: userData.phone
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error("Error actualizando perfil extra:", profileError);
        // No lanzamos error aquí para no bloquear el flujo, el usuario ya se creó
      }
    }

    return authData;
  },

  async updateTrabajador(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};