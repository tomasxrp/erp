import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, Calendar, CheckCircle } from 'lucide-react';
import { useReportes } from '../hooks/useReportes';

// Paleta de Colores Profesional
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function ReportesPage() {
  const { data, loading } = useReportes();

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-slate-500 font-medium animate-pulse">Procesando datos de la empresa...</p>
    </div>
  );

  if (!data) return <div className="p-8 text-center">No hay datos disponibles.</div>;

  const { kpis, trendData, inventoryDistribution, lowStockItems, recentSales, expenseStructure } = data;

  // Componente Auxiliar para Tarjetas de KPI
  const KPICard = ({ title, amount, icon: Icon, trend, color, subtext }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
        <Icon size={60} />
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-end gap-3 mb-1">
        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{amount}</h3>
        {trend !== undefined && (
          <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full mb-1 ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} className="mr-1"/> : <ArrowDownRight size={12} className="mr-1"/>}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtext}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. HEADER EJECUTIVO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-900/10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="text-blue-400" /> Reporte Gerencial
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Visión integral del rendimiento y salud del negocio.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mb-1">Periodo Actual</p>
          <p className="text-xl font-bold">{new Date().toLocaleString('es-CL', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* 2. SECCIÓN FINANCIERA (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Ingresos Totales" 
          amount={`$${kpis.ingresos.toLocaleString()}`} 
          icon={DollarSign} 
          trend={kpis.growthIngresos} 
          color="text-emerald-500" 
          subtext="Ventas brutas del mes"
        />
        <KPICard 
          title="Utilidad Neta" 
          amount={`$${kpis.utilidad.toLocaleString()}`} 
          icon={Wallet} 
          color="text-blue-500" 
          subtext={`Margen Operativo: ${kpis.margen}%`}
        />
        <KPICard 
          title="Gastos Operativos" 
          amount={`$${kpis.egresos.toLocaleString()}`} 
          icon={TrendingDown} 
          trend={kpis.growthEgresos} 
          color="text-red-500" 
          subtext="Compras + Nómina"
        />
        <KPICard 
          title="Patrimonio en Stock" 
          amount={`$${kpis.stockValue.toLocaleString()}`} 
          icon={Package} 
          color="text-amber-500" 
          subtext={`${kpis.lowStockCount} productos críticos`}
        />
      </div>

      {/* 3. ANÁLISIS DE TENDENCIAS (Gráfico Principal) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600"/> Evolución Financiera
            </h3>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ingresos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Gastos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Utilidad</span>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
                <Bar dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} stackId="b" />
                <Line type="monotone" dataKey="utilidad" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estructura de Gastos (Donut) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Desglose de Gastos</h3>
          <p className="text-xs text-slate-500 mb-6">Distribución de egresos del mes actual.</p>
          
          <div className="flex-1 min-h-[200px] relative">
            {expenseStructure.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseStructure}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseStructure.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#f59e0b'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sin gastos registrados este mes.</div>
            )}
            {/* Total al centro */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <span className="text-xs font-bold text-slate-400 mt-8">Gastos</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SECCIÓN INVENTARIO Y OPERACIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Distribución de Inventario (Solución al desborde) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Valorización por Categoría</h3>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">Top Categorías</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Gráfico a la izquierda */}
            <div className="h-64 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                  >
                    {inventoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Leyenda Personalizada con Scroll a la derecha */}
            <div className="w-full md:w-1/2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-400 uppercase font-bold sticky top-0 bg-white dark:bg-slate-900 pb-2">
                  <tr>
                    <th className="text-left py-2">Categoría</th>
                    <th className="text-right py-2">Valor</th>
                    <th className="text-right py-2">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inventoryDistribution.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.name}</span>
                      </td>
                      <td className="text-right font-mono text-slate-600 dark:text-slate-400">${(item.value/1000).toFixed(0)}k</td>
                      <td className="text-right text-xs text-slate-400">
                        {Math.round((item.value / kpis.stockValue) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alertas de Stock Crítico */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20}/> Stock Crítico
          </h3>
          
          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 custom-scrollbar pr-1">
            {lowStockItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <CheckCircle size={32} className="text-emerald-400 mb-2"/>
                Inventario saludable
              </div>
            ) : (
              lowStockItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-bold text-red-600">{item.qty}</span>
                    <span className="text-[10px] text-red-400 font-medium">Mín: {item.min}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. TABLA DE ÚLTIMOS MOVIMIENTOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Transacciones Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">ID Transacción</th>
                <th className="px-6 py-4 text-center">Ítems</th>
                <th className="px-6 py-4 text-right">Monto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                    <Calendar size={14}/> {sale.date}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300 text-xs">
                    {sale.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                      {sale.items}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                    ${sale.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estilo para Scrollbar personalizado */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
      `}</style>
    </div>
  );
}