import { useState, useEffect, useCallback } from 'react';
import { crmService } from '../services/crmService';

// IMPORTANTE: Debe decir "export function" (exportación nombrada)
export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      // Si crmService falla o no existe, esto daría otro error, pero no de exportación.
      const data = await crmService.getClients();
      setClients(data || []);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, loading, refetch: fetchClients };
}