export default function ReportesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Reportes Generales</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white h-64 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
          <span className="text-gray-400">Gráfico de Ventas</span>
        </div>
        <div className="bg-white h-64 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
          <span className="text-gray-400">Distribución de Inventario</span>
        </div>
      </div>
    </div>
  );
}