import { useState } from 'react';
import { Package, Search, Plus, Filter, MapPin, Scan, Pencil, Trash2 } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import ProductForm from '../components/ProductForm';
import { inventoryService } from '../services/inventoryService';

export default function InventoryPage() {
  const { products, warehouses, loading, refetch } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    setFormLoading(true);
    try {
      if (editingProduct) {
        await inventoryService.updateProduct(editingProduct.id, formData);
      } else {
        await inventoryService.createProduct(formData);
      }
      await refetch();
      setIsModalOpen(false);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${name}"?\nEsta acción no se puede deshacer.`)) {
      try {
        await inventoryService.deleteProduct(id);
        await refetch();
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario Maestro</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            {products.length} productos en {warehouses.length} bodegas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Filter size={18} /> <span className="md:inline">Filtros</span>
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex-1 md:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus size={18} /> <span className="whitespace-nowrap">Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="text-slate-400 flex-shrink-0" size={20} />
        <input 
          type="text"
          placeholder="Buscar producto..."
          className="bg-transparent outline-none w-full text-slate-900 dark:text-white placeholder-slate-400"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla Responsiva (Scroll Horizontal) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">SKU / Código</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-center">Stock Total</th>
                <th className="px-6 py-4 text-right">Precio Venta</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">Cargando inventario...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No se encontraron productos.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-none">{product.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{product.unit || 'unid'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                      <div className="flex flex-col">
                        <span>{product.sku}</span>
                        {product.barcode && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Scan size={10} /> {product.barcode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-bold text-lg ${
                          product.total_stock <= (product.min_stock_alert || 5) 
                            ? 'text-red-500' 
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {product.total_stock}
                        </span>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                           <MapPin size={10} /> {warehouses.length > 1 ? 'Multi' : 'Central'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                      ${product.price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductForm
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveProduct}
          initialData={editingProduct}
          isEditing={!!editingProduct}
          loading={formLoading}
        />
      )}
    </div>
  );
}