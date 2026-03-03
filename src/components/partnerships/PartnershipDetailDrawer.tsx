import { X, TrendingUp, Link as LinkIcon, Calendar, FileText, Activity, Plus, Trash2, CheckCircle, AlertTriangle, Sparkles, Info } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import InfoTooltip from '../shared/InfoTooltip';

interface Partnership {
  id: string;
  company_name: string;
  logo_url: string | null;
  partnership_type: 'affiliation' | 'recommandation' | 'sponsoring' | 'formation';
  commission_rate: number;
  compensation_mode: 'percentage' | 'fixed' | 'recurring';
  affiliate_link: string | null;
  promo_code: string | null;
  status: 'active' | 'pending' | 'completed';
  start_date: string | null;
  end_date: string | null;
  conditions: string | null;
  is_default: boolean;
  is_client_support_involved: boolean;
  last_action: string | null;
  next_action: string | null;
  promotion_frequency: string | null;
  notes: string | null;
}

interface PartnershipSale {
  id: string;
  sale_date: string;
  sale_amount: number;
  commission_earned: number;
  payment_status: 'pending' | 'paid';
  notes: string | null;
}

interface PartnershipDetailDrawerProps {
  partnership: Partnership;
  sales: PartnershipSale[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function PartnershipDetailDrawer({ partnership, sales, onClose, onUpdate }: PartnershipDetailDrawerProps) {
  const { user } = useAuth();
  const [showAddSale, setShowAddSale] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saleForm, setSaleForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    sale_amount: '' as string | number,
    commission_earned: '' as string | number,
    notes: ''
  });

  const effectiveCommissionRate = partnership.is_default && partnership.is_client_support_involved
    ? 30
    : partnership.commission_rate;

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.commission_earned, 0);
  const totalSales = sales.length;
  const totalCA = sales.reduce((sum, sale) => sum + sale.sale_amount, 0);
  const avgSale = totalSales > 0 ? totalCA / totalSales : 0;

  const conversionRate = 0;

  const monthlyRevenues = sales.reduce((acc, sale) => {
    const month = sale.sale_date.substring(0, 7);
    acc[month] = (acc[month] || 0) + sale.commission_earned;
    return acc;
  }, {} as Record<string, number>);

  const avgMonthlyRevenue = Object.keys(monthlyRevenues).length > 0
    ? Object.values(monthlyRevenues).reduce((sum, v) => sum + v, 0) / Object.keys(monthlyRevenues).length
    : 0;

  const handleToggleClientSupport = async () => {
    if (!partnership.is_default) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('partnerships')
        .update({ is_client_support_involved: !partnership.is_client_support_involved })
        .eq('id', partnership.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating partnership:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSale = async () => {
    const saleAmount = Number(saleForm.sale_amount) || 0;
    const commissionEarned = Number(saleForm.commission_earned) || 0;
    if (!user || saleAmount <= 0) return;

    try {
      const { error } = await supabase
        .from('partnership_sales')
        .insert({
          partnership_id: partnership.id,
          user_id: user.id,
          sale_date: saleForm.sale_date,
          sale_amount: saleAmount,
          commission_earned: commissionEarned || (saleAmount * effectiveCommissionRate / 100),
          notes: saleForm.notes || null
        });

      if (error) throw error;

      setSaleForm({
        sale_date: new Date().toISOString().split('T')[0],
        sale_amount: '',
        commission_earned: '',
        notes: ''
      });
      setShowAddSale(false);
      onUpdate();
    } catch (error) {
      console.error('Error adding sale:', error);
      alert('Erreur lors de l\'ajout de la vente');
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('Supprimer cette vente ?')) return;

    try {
      const { error } = await supabase
        .from('partnership_sales')
        .delete()
        .eq('id', saleId);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleToggleSaleStatus = async (sale: PartnershipSale) => {
    try {
      const { error } = await supabase
        .from('partnership_sales')
        .update({ payment_status: sale.payment_status === 'paid' ? 'pending' : 'paid' })
        .eq('id', sale.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating sale:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const getAlerts = () => {
    const alerts = [];

    if (partnership.status === 'active' && !partnership.last_action) {
      alerts.push({
        type: 'warning',
        message: 'Partenariat actif mais jamais promu'
      });
    }

    if (totalSales === 0 && partnership.status === 'active') {
      alerts.push({
        type: 'info',
        message: 'Aucune vente enregistrée pour ce partenariat'
      });
    }

    return alerts;
  };

  const alerts = getAlerts();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      <div className="absolute right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {partnership.logo_url ? (
              <img src={partnership.logo_url} alt={partnership.company_name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-belaya-primary">{partnership.company_name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {partnership.company_name}
                {partnership.is_default && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Officiel
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500">Détails du partenariat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    alert.type === 'warning'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                    <p className={`text-sm font-medium ${
                      alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-belaya-500" />
              Données clés
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Commission
                  {partnership.is_default && (
                    <InfoTooltip content="Commission mensuelle sur chaque vente HT générée" />
                  )}
                </span>
                <span className="text-sm font-bold text-gray-900">{effectiveCommissionRate} %</span>
              </div>

              {partnership.is_default && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Service client impliqué
                    <InfoTooltip content="Commission majorée à 30% pour implication service client" />
                  </span>
                  <button
                    onClick={handleToggleClientSupport}
                    disabled={isUpdating}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      partnership.is_client_support_involved ? 'bg-belaya-vivid' : 'bg-gray-300'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        partnership.is_client_support_involved ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {partnership.affiliate_link && (
                <div className="py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700 block mb-2">Lien affilié</span>
                  <a
                    href={partnership.affiliate_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 break-all"
                  >
                    <LinkIcon className="w-4 h-4 flex-shrink-0" />
                    {partnership.affiliate_link}
                  </a>
                </div>
              )}

              {partnership.promo_code && (
                <div className="py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700 block mb-2">Code promo</span>
                  <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded border border-gray-200">
                    {partnership.promo_code}
                  </code>
                </div>
              )}

              {(partnership.start_date || partnership.end_date) && (
                <div className="py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700 block mb-2">Période</span>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="w-4 h-4" />
                    {partnership.start_date && new Date(partnership.start_date).toLocaleDateString('fr-FR')}
                    {partnership.end_date && ` → ${new Date(partnership.end_date).toLocaleDateString('fr-FR')}`}
                  </div>
                </div>
              )}

              {partnership.conditions && (
                <div className="py-3">
                  <span className="text-sm font-medium text-gray-700 block mb-2">Conditions</span>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{partnership.conditions}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-belaya-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-belaya-bright" />
              Performance
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700 mb-1">Ventes générées</p>
                <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-1">CA généré</p>
                <p className="text-2xl font-bold text-gray-900">{totalCA.toFixed(0)} €</p>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-1">Commission gagnée</p>
                <p className="text-2xl font-bold text-belaya-bright">{totalRevenue.toFixed(2)} €</p>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-1">Vente moyenne</p>
                <p className="text-2xl font-bold text-gray-900">{avgSale.toFixed(0)} €</p>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-1">Conversion</p>
                <p className="text-2xl font-bold text-gray-900">{conversionRate} %</p>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-1">Revenus mensuels moy.</p>
                <p className="text-2xl font-bold text-gray-900">{avgMonthlyRevenue.toFixed(0)} €</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-belaya-500" />
              Suivi & actions
            </h3>

            <div className="space-y-4">
              {partnership.last_action && (
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-1">Dernière action</span>
                  <p className="text-sm text-gray-600">{partnership.last_action}</p>
                </div>
              )}

              {partnership.next_action && (
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-1">Prochaine action</span>
                  <p className="text-sm text-gray-600">{partnership.next_action}</p>
                </div>
              )}

              {partnership.promotion_frequency && (
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-1">Fréquence de mise en avant</span>
                  <p className="text-sm text-gray-600">{partnership.promotion_frequency}</p>
                </div>
              )}

              {partnership.notes && (
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-1">Notes internes</span>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{partnership.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-belaya-500" />
                Ventes ({sales.length})
              </h3>
              <button
                onClick={() => setShowAddSale(!showAddSale)}
                className="flex items-center gap-2 px-3 py-1.5 bg-belaya-50 text-belaya-primary rounded-lg hover:bg-belaya-100 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {showAddSale && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Nouvelle vente</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Date</label>
                    <input
                      type="date"
                      value={saleForm.sale_date}
                      onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Montant vente HT (€)</label>
                    <input
                      type="number"
                      value={saleForm.sale_amount}
                      onChange={(e) => setSaleForm({ ...saleForm, sale_amount: e.target.value === '' ? '' : Number(e.target.value) })}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Commission gagnée (€)
                      <span className="text-xs text-gray-500 ml-2">
                        Auto: {((Number(saleForm.sale_amount) || 0) * effectiveCommissionRate / 100).toFixed(2)} €
                      </span>
                    </label>
                    <input
                      type="number"
                      value={saleForm.commission_earned}
                      onChange={(e) => setSaleForm({ ...saleForm, commission_earned: e.target.value === '' ? '' : Number(e.target.value) })}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      step="0.01"
                      placeholder={((Number(saleForm.sale_amount) || 0) * effectiveCommissionRate / 100).toFixed(2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Notes (optionnel)</label>
                    <textarea
                      value={saleForm.notes}
                      onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSale}
                      className="flex-1 px-4 py-2 bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors text-sm font-medium"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setShowAddSale(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {sales.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune vente enregistrée</p>
            ) : (
              <div className="space-y-2">
                {sales.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(sale.sale_date).toLocaleDateString('fr-FR')}
                        </span>
                        <button
                          onClick={() => handleToggleSaleStatus(sale)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sale.payment_status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {sale.payment_status === 'paid' ? 'Payé' : 'En attente'}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>Vente: {sale.sale_amount.toFixed(2)} €</span>
                        <span className="font-semibold text-belaya-bright">
                          Commission: {sale.commission_earned.toFixed(2)} €
                        </span>
                      </div>
                      {sale.notes && (
                        <p className="text-xs text-gray-500 mt-1">{sale.notes}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
