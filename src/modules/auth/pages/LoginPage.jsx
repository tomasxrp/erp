import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // PASO 1: Intentar login
      console.log('🔐 Intentando login con:', formData.email);
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('❌ Error de autenticación:', authError);
        throw authError;
      }

      console.log('✅ Login exitoso:', data);

      // PASO 2: Verificar que el perfil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('⚠️ Perfil no encontrado:', profileError);
        setError('Tu cuenta está registrada pero el perfil no se creó correctamente. Contacta al administrador.');
        await supabase.auth.signOut();
        return;
      }

      console.log('✅ Perfil encontrado:', profile);

      // PASO 3: Navegar al dashboard
      navigate('/inventario');

    } catch (err) {
      console.error('🔴 Error completo:', err);
      
      // Mensajes de error más descriptivos
      if (err.message === 'Invalid login credentials') {
        setError('Email o contraseña incorrectos. Verifica tus datos.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Debes confirmar tu email antes de iniciar sesión. Revisa tu correo.');
      } else if (err.message.includes('User not found')) {
        setError('No existe una cuenta con ese email. ¿Quieres registrarte?');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
        Bienvenido de nuevo
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        ¿No tienes cuenta?{' '}
        <Link 
          to="/auth/register" 
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
        >
          Regístrate gratis
        </Link>
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-100 dark:border-red-800">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
              {/* Botón para ver logs en consola */}
              <button
                type="button"
                onClick={() => console.log('Revisa la consola del navegador (F12) para más detalles')}
                className="text-xs underline mt-1 opacity-70 hover:opacity-100"
              >
                Ver detalles técnicos en consola
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo Electrónico
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm transition-all"
                placeholder="juan@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

    </div>
  );
}