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

  // ⚠️ IMPORTANTE: Este método SOLO funciona con la Admin API (Service Role Key)
  // NO puedes crear usuarios desde el frontend sin que se cierre la sesión actual
  // 
  // OPCIONES:
  // 1. Crear un Edge Function en Supabase (Recomendado)
  // 2. Usar un backend intermedio
  // 3. Aceptar que el admin se desloguee temporalmente
  //
  // Por ahora, dejamos el método original con ADVERTENCIA clara al usuario
  async createTrabajador(userData) {
    // Este método va a cerrar la sesión del usuario actual
    // porque signUp() automáticamente loguea al nuevo usuario
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
        },
      },
    });

    if (authError) throw authError;

    // Actualizar datos adicionales
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: userData.role,
          phone: userData.phone
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error("Error actualizando perfil:", profileError);
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

// ==========================================
// SOLUCIÓN ALTERNATIVA: Edge Function
// ==========================================
// Crea un Edge Function en Supabase para crear usuarios sin afectar la sesión
// 
// Pasos:
// 1. Ve a Edge Functions en tu Dashboard de Supabase
// 2. Crea una función llamada "create-user"
// 3. Usa este código:
//
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
//
// serve(async (req) => {
//   const supabaseAdmin = createClient(
//     Deno.env.get('SUPABASE_URL') ?? '',
//     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//   )
//
//   const { email, password, full_name, role, phone } = await req.json()
//
//   const { data, error } = await supabaseAdmin.auth.admin.createUser({
//     email,
//     password,
//     email_confirm: true,
//     user_metadata: { full_name }
//   })
//
//   if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
//
//   // Actualizar perfil
//   await supabaseAdmin.from('profiles').update({ role, phone }).eq('id', data.user.id)
//
//   return new Response(JSON.stringify({ user: data.user }), { status: 200 })
// })
//
// Luego, en tu frontend:
// const { data } = await supabase.functions.invoke('create-user', {
//   body: { email, password, full_name, role, phone }
// })