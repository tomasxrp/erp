import { Card } from '@/shared/components/ui/Card'
import { Users, Package, FileText, TrendingUp } from 'lucide-react'

export const DashboardPage = () => {
  const stats = [
    { label: 'Trabajadores', value: '0', icon: Users, color: 'bg-blue-500' },
    { label: 'Productos', value: '0', icon: Package, color: 'bg-green-500' },
    { label: 'Cotizaciones', value: '0', icon: FileText, color: 'bg-purple-500' },
    { label: 'Ventas del Mes', value: '$0', icon: TrendingUp, color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Bienvenido al ERP
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Este es tu panel de control principal. Desde aquí podrás gestionar todos los aspectos de tu negocio.
        </p>
      </Card>
    </div>
  )
}