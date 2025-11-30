import { useState } from 'react';
import { UserPlus, Search, Building2, User, Phone, Mail, Tag } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import ClientForm from '../components/ClientForm'; // Lo crearemos en el paso 5
import ClientDetailModal from '../components/ClientDetailModal'; // Lo crearemos en el paso 6

export default function ClientsPage() {
  const { clients, loading, refetch } = useClients();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null); // Para ver el detalle
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado simple en frontend
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tax_id?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Directorio de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona empresas y contactos personales.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <UserPlus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nombre o RUT/DNI..."
          className="bg-transparent outline-none w-full text-slate-900 dark:text-white placeholder-slate-400"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div 
            key={client.id}
            onClick={() => setSelectedClient(client)} // Al hacer click abre el detalle
            className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl font-bold
                  ${client.type === 'empresa' ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                >
                  {client.type === 'empresa' ? <Building2 size={24} /> : <User size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{client.name}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {client.tax_id || 'Sin ID'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} /> {client.phone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} /> {client.email}
                </div>
              )}
            </div>

            {/* Tags / Notas importantes */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 flex-wrap">
              {client.tags?.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-md border border-amber-100 dark:border-amber-800">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modales */}
      {isFormOpen && (
        <ClientForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => { setIsFormOpen(false); refetch(); }} 
        />
      )}

      {selectedClient && (
        <ClientDetailModal 
          clientId={selectedClient.id} 
          onClose={() => setSelectedClient(null)} 
        />
      )}
    </div>
  );
}