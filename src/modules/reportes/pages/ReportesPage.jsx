import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Package, DollarSign, ShoppingBag, Activity, Calendar } from 'lucide-react';
import { useReportes } from '../hooks/useReportes';

// Colores del tema (Azul Corporativo y variantes)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportesPage() {
  const { data, loading } = useReportes();

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando inteligencia de negocios...</div>;
  if (!data) return <div className="p-8 text-center text-slate-500">No hay datos suficientes para generar reportes.</div>;

  const { kpis, salesByMonth, topProductsArray } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header: Resumen Ejecutivo */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="text-blue-600" /> Reportes & Toma de Decisiones
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Resumen en tiempo real del rendimiento de tu empresa.</p>
      </div>

      {/* 2. Tarjetas de KPIs (Indicadores Clave) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Ventas del Mes */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <DollarSign size={14} /> Ventas este Mes
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              ${kpis.ventasMes.toLocaleString()}
            </h3>
            <span className="text-xs font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full mt-2 inline-block">
              Ingresos Brutos
            </span>
          </div>
        </div>

        {/* KPI: Transacciones */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <ShoppingBag size={14} /> Transacciones
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              {kpis.transaccionesMes}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Operaciones cerradas (Boletas/Facturas)</p>
          </div>
        </div>

        {/* KPI: Valor Inventario */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Package size={14} /> Valor en Inventario
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              ${kpis.valorInventario.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Capital inmovilizado en productos</p>
          </div>
        </div>

        {/* KPI: Productos Activos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <TrendingUp size={14} /> Catálogo Activo
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              {kpis.totalProductos}
            </h3>
            <p className="text-xs text-slate-400 mt-1">SKUs registrados en sistema</p>
          </div>
        </div>
      </div>

      {/* 3. Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRÁFICO 1: Tendencia de Ventas (Area Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Calendar className="text-blue-500" size={20} /> Evolución de Ventas (Últimos 6 meses)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value/1000}k`} 
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVentas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: Top Productos (Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top 5 Más Vendidos</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsArray} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{fontSize: 11, fill: '#64748b'}} 
                  interval={0}
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                  {topProductsArray.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">Unidades vendidas históricas</p>
          </div>
        </div>

      </div>
    </div>
  );
}