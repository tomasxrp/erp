import { useState, useEffect, useCallback } from 'react';
import { registrosService } from '../services/registrosService';

export function useRegistros() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistros = useCallback(async () => {
    try {
      setLoading(true);
      const data = await registrosService.getRegistros();
      setRegistros(data || []);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  return { registros, loading, refetch: fetchRegistros };
}