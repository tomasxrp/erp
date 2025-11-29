import { useState, useEffect, useCallback } from 'react';
import { trabajadorService } from '../services/trabajadorService';

export function useTrabajadores() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrabajadores = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trabajadorService.getTrabajadores();
      setTrabajadores(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los trabajadores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrabajadores();
  }, [fetchTrabajadores]);

  return { 
    trabajadores, 
    loading, 
    error, 
    refetch: fetchTrabajadores 
  };
}