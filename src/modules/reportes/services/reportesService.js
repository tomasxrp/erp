import { supabase } from '../../../config/supabase';

// ¡ESTA LÍNEA ES LA CLAVE! Debe decir "export const reportesService"
export const reportesService = {
  async getDashboardData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // 1. Obtener ID de Bodega
    const { data: profile } = await supabase
      .from('profiles')
      .select('warehouse_id')
      .eq('id', user.id)
      .single();
    
    if (!profile?.warehouse_id) throw new Error('Sin bodega asignada');
    const warehouseId = profile.warehouse_id;

    // 2. Cargar Ventas (Boletas y Facturas) de los últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: sales } = await supabase
      .from('sales')
      .select('id, total_amount, created_at, type')
      .eq('warehouse_id', warehouseId)
      .neq('type', 'cotizacion') // Solo ventas reales
      .gte('created_at', sixMonthsAgo.toISOString());

    // 3. Cargar Items de Venta (Para ranking de productos)
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('product_name, quantity, unit_price') 
      .in('sale_id', sales.map(s => s.id));

    // 4. Cargar Inventario (Para valorización)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, current_stock: product_stocks(quantity)')
      .eq('warehouse_id', warehouseId);

    // --- PROCESAMIENTO DE DATOS ---

    // A. Ventas por Mes
    const salesByMonth = sales.reduce((acc, sale) => {
      const month = new Date(sale.created_at).toLocaleString('es-CL', { month: 'short' });
      const existing = acc.find(item => item.name === month);
      if (existing) {
        existing.total += sale.total_amount;
      } else {
        acc.push({ name: month, total: sale.total_amount });
      }
      return acc;
    }, []);

    // B. Ranking Productos
    const topProducts = saleItems.reduce((acc, item) => {
      if (!acc[item.product_name]) {
        acc[item.product_name] = 0;
      }
      acc[item.product_name] += item.quantity;
      return acc;
    }, {});
    
    const topProductsArray = Object.entries(topProducts)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // C. KPIs Generales
    const currentMonth = new Date().getMonth();
    
    const totalVentasMes = sales
      .filter(s => new Date(s.created_at).getMonth() === currentMonth)
      .reduce((sum, s) => sum + s.total_amount, 0);

    const cantidadVentasMes = sales
      .filter(s => new Date(s.created_at).getMonth() === currentMonth)
      .length;

    const valorInventario = products.reduce((sum, p) => {
      const stock = p.current_stock?.[0]?.quantity || 0;
      return sum + (stock * p.price);
    }, 0);

    return {
      salesByMonth,
      topProductsArray,
      kpis: {
        ventasMes: totalVentasMes,
        transaccionesMes: cantidadVentasMes,
        valorInventario,
        totalProductos: products.length
      }
    };
  }
};