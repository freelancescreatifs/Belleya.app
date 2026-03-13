import { useEffect, useState } from 'react';
import { Plus, Package, AlertTriangle, Pencil, X, DollarSign, ShoppingCart, Boxes, TrendingUp, Trash2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BelayaLoader from '../components/shared/BelayaLoader';
import InfoTooltip from '../components/shared/InfoTooltip';
import ImportStockModal from '../components/stock/ImportStockModal';

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minimum_quantity: number;
  unit_price: number;
  status: string;
  supplier_link: string | null;
}

type StockFilter = 'all' | 'sufficient' | 'to_restock';

export default function Stock() {
  const { user } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [filter, setFilter] = useState<StockFilter>('all');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    minimum_quantity: '',
    unit_price: '',
    supplier_link: '',
  });

  useEffect(() => {
    loadItems();
  }, [user]);

  const loadItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const quantity = parseFloat(formData.quantity);
      const minQuantity = parseFloat(formData.minimum_quantity);
      let status = 'sufficient';

      if (quantity === 0) {
        status = 'out';
      } else if (quantity <= minQuantity) {
        status = 'low';
      }

      const { error } = await supabase.from('stock_items').insert({
        user_id: user!.id,
        name: formData.name,
        category: formData.category,
        quantity,
        minimum_quantity: minQuantity,
        unit_price: parseFloat(formData.unit_price),
        supplier_link: formData.supplier_link || null,
        status,
      });

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        name: '',
        category: '',
        quantity: '',
        minimum_quantity: '',
        unit_price: '',
        supplier_link: '',
      });
      loadItems();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const quantity = parseFloat(formData.quantity);
      const minQuantity = parseFloat(formData.minimum_quantity);
      let status = 'sufficient';

      if (quantity === 0) {
        status = 'out';
      } else if (quantity <= minQuantity) {
        status = 'low';
      }

      const { error } = await supabase
        .from('stock_items')
        .update({
          name: formData.name,
          category: formData.category,
          quantity,
          minimum_quantity: minQuantity,
          unit_price: parseFloat(formData.unit_price),
          supplier_link: formData.supplier_link || null,
          status,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        quantity: '',
        minimum_quantity: '',
        unit_price: '',
        supplier_link: '',
      });
      loadItems();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const openEditModal = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      minimum_quantity: item.minimum_quantity.toString(),
      unit_price: item.unit_price.toString(),
      supplier_link: item.supplier_link || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteItem = async (item: StockItem) => {
    if (!confirm(`Supprimer "${item.name}" ?\n\nCette action est irréversible.`)) return;

    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const lowStockItems = items.filter((item) => item.status === 'low' || item.status === 'out');

  const stockValue = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const restockingCost = items.reduce((sum, item) => {
    const quantityToRestock = Math.max(0, item.minimum_quantity - item.quantity);
    return sum + quantityToRestock * item.unit_price;
  }, 0);

  const itemsToOrder = items.filter((item) => item.quantity < item.minimum_quantity).length;

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = items.filter((item) => {
    if (filter === 'sufficient') return item.status === 'sufficient';
    if (filter === 'to_restock') return item.status === 'low' || item.status === 'out';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sufficient':
        return 'bg-green-100 text-green-700';
      case 'low':
        return 'bg-orange-100 text-orange-700';
      case 'out':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sufficient':
        return 'Suffisant';
      case 'low':
        return 'Faible';
      case 'out':
        return 'Épuisé';
      default:
        return status;
    }
  };

  if (loading) {
    return <BelayaLoader variant="section" />;
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion du stock</h1>
          <p className="text-gray-600">Suivez vos consommables et matériels</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-belaya-500 text-belaya-500 rounded-lg hover:bg-belaya-50 transition-all shadow-sm"
          >
            <Upload className="w-5 h-5" />
            Importer
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-belaya-primary to-[#f06bb4] text-white rounded-lg hover:from-belaya-deep hover:to-belaya-primary transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Nouvel article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Valeur du stock</p>
          <p className="text-2xl font-bold text-gray-900">{stockValue.toFixed(2)} €</p>
        </div>

        {itemsToOrder > 0 && (
          <div
            onClick={() => setFilter('to_restock')}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Coût du réassort</p>
            <p className="text-2xl font-bold text-gray-900">{restockingCost.toFixed(2)} €</p>
          </div>
        )}

        <div
          onClick={() => setFilter('to_restock')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Articles à commander</p>
          <p className="text-2xl font-bold text-gray-900">{itemsToOrder}</p>
        </div>

        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Boxes className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Unités en stock</p>
          <p className="text-2xl font-bold text-gray-900">{totalUnits.toFixed(0)}</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-belaya-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tous les articles ({items.length})
        </button>
        <button
          onClick={() => setFilter('sufficient')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'sufficient'
              ? 'bg-belaya-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Stock suffisant ({items.filter(i => i.status === 'sufficient').length})
        </button>
        <button
          onClick={() => setFilter('to_restock')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'to_restock'
              ? 'bg-belaya-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          À commander ({lowStockItems.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative"
          >
            <div className="absolute top-4 right-4 flex items-center gap-1">
              <button
                onClick={() => openEditModal(item)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteItem(item)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start justify-between mb-4 pr-20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {getStatusLabel(item.status)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantité</span>
                <span className="font-medium text-gray-900">{item.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Minimum requis</span>
                <span className="font-medium text-gray-900">{item.minimum_quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Prix unitaire</span>
                <span className="font-medium text-gray-900">{item.unit_price.toFixed(2)} €</span>
              </div>
            </div>

            {item.supplier_link && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                  href={item.supplier_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-belaya-primary hover:text-belaya-deep font-medium"
                >
                  Voir fournisseur →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nouvel article</h2>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'article</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  placeholder="Ex: Gels, Vernis, Capsules..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Quantité
                    <InfoTooltip content="Quantité actuellement en stock." />
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.quantity}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                      }
                      if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                        value = value.replace(/^0+/, '');
                      }
                      setFormData({ ...formData, quantity: value });
                    }}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Quantité minimum
                    <InfoTooltip content="Seuil minimum recommandé. En dessous de ce seuil, l'article est considéré comme à commander." />
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.minimum_quantity}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                      }
                      if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                        value = value.replace(/^0+/, '');
                      }
                      setFormData({ ...formData, minimum_quantity: value });
                    }}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.unit_price}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = value.split('.');
                    if (parts.length > 2) {
                      value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                      value = value.replace(/^0+/, '');
                    }
                    setFormData({ ...formData, unit_price: value });
                  }}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien fournisseur</label>
                <input
                  type="url"
                  value={formData.supplier_link}
                  onChange={(e) => setFormData({ ...formData, supplier_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  placeholder="https://"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Modifier l'article</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'article</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  placeholder="Ex: Gels, Vernis, Capsules..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Quantité
                    <InfoTooltip content="Quantité actuellement en stock." />
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.quantity}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                      }
                      if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                        value = value.replace(/^0+/, '');
                      }
                      setFormData({ ...formData, quantity: value });
                    }}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Quantité minimum
                    <InfoTooltip content="Seuil minimum recommandé. En dessous de ce seuil, l'article est considéré comme à commander." />
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.minimum_quantity}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                      }
                      if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                        value = value.replace(/^0+/, '');
                      }
                      setFormData({ ...formData, minimum_quantity: value });
                    }}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.unit_price}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = value.split('.');
                    if (parts.length > 2) {
                      value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                      value = value.replace(/^0+/, '');
                    }
                    setFormData({ ...formData, unit_price: value });
                  }}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien fournisseur</label>
                <input
                  type="url"
                  value={formData.supplier_link}
                  onChange={(e) => setFormData({ ...formData, supplier_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  placeholder="https://"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportStockModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={loadItems}
        />
      )}
    </div>
  );
}
