import { useState } from 'react';
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import UpgradeOverlay from '../components/shared/UpgradeOverlay';

export default function Profitability() {
  const { canAccess } = useSubscription();
  const hasAccess = canAccess('profitability');
  const [formData, setFormData] = useState({
    serviceName: '',
    materialCost: '',
    consumablesCost: '',
    durationMinutes: '',
    desiredHourlyRate: '',
    estimatedCharges: '',
    currentPrice: '',
  });

  const [result, setResult] = useState<{
    totalCost: number;
    minimumPrice: number;
    isProfitable: boolean;
    profitMargin: number;
  } | null>(null);

  const calculateProfitability = (e: React.FormEvent) => {
    e.preventDefault();

    const materialCost = parseFloat(formData.materialCost) || 0;
    const consumablesCost = parseFloat(formData.consumablesCost) || 0;
    const durationHours = (parseFloat(formData.durationMinutes) || 0) / 60;
    const hourlyRate = parseFloat(formData.desiredHourlyRate) || 0;
    const charges = parseFloat(formData.estimatedCharges) || 0;
    const currentPrice = parseFloat(formData.currentPrice) || 0;

    const laborCost = durationHours * hourlyRate;
    const totalCost = materialCost + consumablesCost + laborCost + charges;
    const minimumPrice = totalCost * 1.2;
    const isProfitable = currentPrice >= minimumPrice;
    const profitMargin = currentPrice > 0 ? ((currentPrice - totalCost) / currentPrice) * 100 : 0;

    setResult({
      totalCost,
      minimumPrice,
      isProfitable,
      profitMargin,
    });
  };

  const content = (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calculateur de rentabilité</h1>
        <p className="text-gray-600">
          Analysez la rentabilité de vos prestations et optimisez vos tarifs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-belaya-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Analyse de prestation</h2>
          </div>

          <form onSubmit={calculateProfitability} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la prestation
              </label>
              <input
                type="text"
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                placeholder="Ex: Pose complète gel"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coût matériel
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.materialCost}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = value.split('.');
                    if (parts.length > 2) {
                      value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                      value = value.replace(/^0+/, '');
                    }
                    setFormData({ ...formData, materialCost: value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coût consommables
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.consumablesCost}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = value.split('.');
                    if (parts.length > 2) {
                      value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                      value = value.replace(/^0+/, '');
                    }
                    setFormData({ ...formData, consumablesCost: value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée de travail (minutes)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.durationMinutes}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.startsWith('0') && value.length > 1) {
                    setFormData({ ...formData, durationMinutes: value.replace(/^0+/, '') });
                  } else {
                    setFormData({ ...formData, durationMinutes: value });
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                placeholder="120"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux horaire souhaité
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.desiredHourlyRate}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = value.split('.');
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                  }
                  if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                    value = value.replace(/^0+/, '');
                  }
                  setFormData({ ...formData, desiredHourlyRate: value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                placeholder="30"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Charges estimées par prestation
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.estimatedCharges}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = value.split('.');
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                  }
                  if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                    value = value.replace(/^0+/, '');
                  }
                  setFormData({ ...formData, estimatedCharges: value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                placeholder="5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix actuel pratiqué
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.currentPrice}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = value.split('.');
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                  }
                  if (value.startsWith('0') && value.length > 1 && !value.startsWith('0.')) {
                    value = value.replace(/^0+/, '');
                  }
                  setFormData({ ...formData, currentPrice: value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                placeholder="60"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg font-medium"
            >
              Calculer la rentabilité
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Résultats</h2>
          </div>

          {result ? (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-xl border-2 ${
                  result.isProfitable
                    ? 'bg-green-50 border-belaya-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.isProfitable ? (
                    <div className="w-8 h-8 bg-belaya-vivid rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <p
                    className={`font-semibold ${
                      result.isProfitable ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.isProfitable ? 'Prestation rentable' : 'Prestation non rentable'}
                  </p>
                </div>
                <p
                  className={`text-sm ${
                    result.isProfitable ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {result.isProfitable
                    ? 'Votre tarif couvre vos coûts et génère une marge bénéficiaire.'
                    : 'Votre tarif est trop bas et ne couvre pas suffisamment vos coûts.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Coût total</p>
                  <p className="text-2xl font-bold text-gray-900">{result.totalCost.toFixed(2)} €</p>
                </div>

                <div className="p-4 bg-belaya-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Prix minimum recommandé</p>
                  <p className="text-2xl font-bold text-belaya-primary">
                    {result.minimumPrice.toFixed(2)} €
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Inclut une marge de sécurité de 20%
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Marge bénéficiaire</p>
                  <p
                    className={`text-2xl font-bold ${
                      result.profitMargin > 0 ? 'text-blue-600' : 'text-red-600'
                    }`}
                  >
                    {result.profitMargin.toFixed(1)} %
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">
                  Conseils pour protéger votre métier
                </h3>
                <ul className="space-y-1 text-sm text-amber-800">
                  <li>• Ne bradez pas vos prix, valorisez votre savoir-faire</li>
                  <li>• Communiquez sur la qualité de vos produits et services</li>
                  <li>• Éduquez vos clientes sur la valeur de votre travail</li>
                  <li>• Investissez dans votre formation continue</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calculator className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">
                Remplissez le formulaire pour calculer la rentabilité de votre prestation
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-belaya-100">
        <h3 className="font-semibold text-gray-900 mb-3">
          Comprendre le calcul de rentabilité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900 mb-1">Coût total</p>
            <p>Matériel + Consommables + Temps de travail + Charges</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Prix minimum</p>
            <p>Coût total + 20% de marge de sécurité</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Marge bénéficiaire</p>
            <p>Différence entre le prix pratiqué et le coût total</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Taux horaire</p>
            <p>Rémunération souhaitée par heure de travail effectif</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!hasAccess) {
    return (
      <UpgradeOverlay requiredPlan="studio">
        {content}
      </UpgradeOverlay>
    );
  }

  return content;
}
