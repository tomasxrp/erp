import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';

export function useInventory() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prods, wars] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getWarehouses()
      ]);
      setProducts(prods);
      setWarehouses(wars);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, warehouses, loading, refetch: fetchData };
}