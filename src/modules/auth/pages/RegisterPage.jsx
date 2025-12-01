import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    password: '' 
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('📝 Iniciando registro para:', formData.email);

      // Validación básica
      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // PASO 1: Registrar usuario en Auth
      // Esto disparará el Trigger en la base de datos que crea Bodega y Perfil automáticamente
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (signUpError) {
        console.error('❌ Error en signUp:', signUpError);
        throw signUpError;
      }

      console.log('✅ Usuario creado en Auth. Esperando confirmación de DB...');

      // PASO 2: Verificación (Polling)
      // Esperamos a que la base de datos termine de crear el perfil y la bodega
      let profile = null;
      let attempts = 0;
      
      // Intentamos verificar 5 veces (1 intento por segundo)
      while (!profile && attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 seg
        
        // Buscamos el perfil Y verificamos que tenga bodega asignada
        const { data: foundProfile } = await supabase
          .from('profiles')
          .select('*, warehouses(*)') 
          .eq('id', data.user.id)
          .single();
          
        if (foundProfile) {
          profile = foundProfile;
        }
        attempts++;
      }

      if (!profile) {
        // Si después de 5 segundos no aparece, avisamos pero no bloqueamos (podría ser solo lag)
        console.warn("El perfil tardó en aparecer, pero el usuario está creado.");
      } else {
        console.log('✅ Perfil y Bodega confirmados:', profile);
      }

      // PASO 3: Éxito
      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/inventario');
      }, 2000);

    } catch (err) {
      console.error('🔴 Error en registro:', err);
      
      // Mensajes de error específicos
      if (err.message.includes('already registered')) {
        setError('Este email ya está registrado. ¿Quieres iniciar sesión?');
      } else if (err.message.includes('invalid email')) {
        setError('El formato del email no es válido.');
      } else if (err.message.includes('Password should be')) {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError(err.message || 'Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
        Crea tu cuenta
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        ¿Ya tienes cuenta?{' '}
        <Link 
          to="/auth/login" 
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
        >
          Inicia sesión
        </Link>
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleRegister}>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-100 dark:border-red-800">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg flex items-center gap-2 text-sm border border-green-100 dark:border-green-800">
            <CheckCircle size={16} />
            <p>¡Cuenta creada exitosamente! Ingresando...</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre Completo
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                autoComplete="name"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                placeholder="Juan Pérez"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
          </div>

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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm"
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
                minLength={6}
                autoComplete="new-password"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Usa al menos 6 caracteres
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : success ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            'Registrarse'
          )}
        </button>
      </form>
    </div>
  );
}