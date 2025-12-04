import { supabase } from '../../../config/supabase';

export const reportesService = {
  async getDashboardData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // 1. Obtener Bodega
    const { data: profile } = await supabase.from('profiles').select('warehouse_id').eq('id', user.id).single();
    if (!profile?.warehouse_id) throw new Error('Sin bodega');
    const warehouseId = profile.warehouse_id;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); 
    sixMonthsAgo.setDate(1); 

    // 2. CARGA DE DATOS MASIVA
    const [salesData, purchasesData, payrollsData, inventoryData, clientsData] = await Promise.all([
      // A. Ventas
      supabase.from('sales')
        .select(`id, total_amount, created_at, sale_items(product_name, quantity, unit_price, product_id)`)
        .eq('warehouse_id', warehouseId)
        .neq('type', 'cotizacion')
        .gte('created_at', sixMonthsAgo.toISOString()),

      // B. Compras
      supabase.from('purchase_orders')
        .select('total_amount, created_at')
        .eq('warehouse_id', warehouseId)
        .eq('status', 'recibida')
        .gte('created_at', sixMonthsAgo.toISOString()),

      // C. Nóminas
      supabase.from('payrolls')
        .select('total_pay, period_date')
        .eq('warehouse_id', warehouseId)
        .gte('period_date', sixMonthsAgo.toISOString()),

      // D. Inventario Actual (CORREGIDO: Solo productos activos)
      supabase.from('products')
        .select('id, name, price, cost_price, category, min_stock_alert, product_stocks!inner(quantity)')
        .eq('warehouse_id', warehouseId)
        .eq('active', true), // <--- FILTRO CLAVE: Ignorar productos eliminados
        
      // E. Clientes
      supabase.from('sales')
        .select('client_snapshot, total_amount, created_at')
        .eq('warehouse_id', warehouseId)
        .neq('type', 'cotizacion')
    ]);

    const sales = salesData.data || [];
    const purchases = purchasesData.data || [];
    const payrolls = payrollsData.data || [];
    const products = inventoryData.data || []; // Ahora esta lista viene limpia
    const salesForClients = clientsData.data || [];

    // --- PROCESAMIENTO DE DATOS ---

    // 1. Mapa Financiero
    const monthsMap = new Map();
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
        const d = new Date(sixMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const sortKey = d.toISOString().slice(0, 7); 
        const displayLabel = d.toLocaleString('es-CL', { month: 'short' }).toUpperCase();
        
        monthsMap.set(sortKey, { 
            sortKey, 
            name: displayLabel, 
            ingresos: 0, 
            egresos: 0, 
            gastosNomina: 0,
            gastosCompras: 0,
            utilidad: 0 
        });
    }

    sales.forEach(s => {
        const k = s.created_at.slice(0, 7);
        if (monthsMap.has(k)) {
            const m = monthsMap.get(k);
            m.ingresos += s.total_amount;
            m.utilidad += s.total_amount;
        }
    });

    purchases.forEach(p => {
        const k = p.created_at.slice(0, 7);
        if (monthsMap.has(k)) {
            const m = monthsMap.get(k);
            m.egresos += p.total_amount;
            m.gastosCompras += p.total_amount;
            m.utilidad -= p.total_amount;
        }
    });

    payrolls.forEach(p => {
        const k = p.period_date.slice(0, 7);
        if (monthsMap.has(k)) {
            const m = monthsMap.get(k);
            m.egresos += p.total_pay;
            m.gastosNomina += p.total_pay;
            m.utilidad -= p.total_pay;
        }
    });

    const trendData = Array.from(monthsMap.values()).sort((a,b) => a.sortKey.localeCompare(b.sortKey));

    // 2. Crecimiento
    const currentMonthKey = today.toISOString().slice(0, 7);
    const lastMonthDate = new Date(today);
    lastMonthDate.setMonth(today.getMonth() - 1);
    const lastMonthKey = lastMonthDate.toISOString().slice(0, 7);

    const currentStats = monthsMap.get(currentMonthKey) || { ingresos: 0, egresos: 0, utilidad: 0 };
    const lastStats = monthsMap.get(lastMonthKey) || { ingresos: 0, egresos: 0, utilidad: 0 };

    const calculateGrowth = (current, last) => {
        if (last === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - last) / last) * 100);
    };

    const kpis = {
        ingresos: currentStats.ingresos,
        growthIngresos: calculateGrowth(currentStats.ingresos, lastStats.ingresos),
        egresos: currentStats.egresos,
        growthEgresos: calculateGrowth(currentStats.egresos, lastStats.egresos),
        utilidad: currentStats.utilidad,
        margen: currentStats.ingresos > 0 ? Math.round((currentStats.utilidad / currentStats.ingresos) * 100) : 0,
        transacciones: sales.filter(s => s.created_at.startsWith(currentMonthKey)).length
    };

    // 3. Inventario (Ahora solo procesará los activos)
    let stockValue = 0;
    let lowStockItems = [];
    const categoryStats = {};

    products.forEach(p => {
        const qty = p.product_stocks[0]?.quantity || 0;
        const val = qty * p.cost_price;
        stockValue += val;

        if (qty <= (p.min_stock_alert || 5)) {
            lowStockItems.push({ 
                name: p.name, 
                qty, 
                min: p.min_stock_alert || 5,
                category: p.category 
            });
        }

        const cat = p.category || 'Sin Categoría';
        if (!categoryStats[cat]) categoryStats[cat] = 0;
        categoryStats[cat] += val;
    });

    const inventoryDistribution = Object.entries(categoryStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // 4. Últimas Ventas
    const recentSales = sales
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(s => ({
            id: s.id,
            date: new Date(s.created_at).toLocaleDateString(),
            total: s.total_amount,
            items: s.sale_items.length
        }));

    return {
        kpis: { ...kpis, stockValue, lowStockCount: lowStockItems.length },
        trendData,
        inventoryDistribution,
        lowStockItems: lowStockItems.sort((a, b) => a.qty - b.qty).slice(0, 5),
        recentSales,
        expenseStructure: [
            { name: 'Proveedores', value: currentStats.gastosCompras },
            { name: 'Nómina', value: currentStats.gastosNomina }
        ].filter(i => i.value > 0)
    };
  }
};