import { useState, useEffect, useCallback } from 'react';
import { servicesService } from '../services/servicesService';

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await servicesService.getServices();
      setServices(data || []);
    } catch (error) {
      console.error("Error cargando servicios:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, refetch: fetchServices };
}