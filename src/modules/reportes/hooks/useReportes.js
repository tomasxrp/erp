import { useState, useEffect } from 'react';
import { reportesService } from '../services/reportesService';

// ¡IMPORTANTE: Debe decir "export function" para que funcione el import { useReportes }!
export function useReportes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const stats = await reportesService.getDashboardData();
        setData(stats);
      } catch (error) {
        console.error("Error en reportes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { data, loading };
}