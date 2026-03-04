import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, AlertCircle, CheckCircle, AlertTriangle, RotateCcw, Plus, Trash2 } from 'lucide-react';
import InfoTooltip from '../shared/InfoTooltip';
import { supabase } from '../../lib/supabase';

interface CompanyProfile {
  legal_status: string;
  tax_category: string;
  vat_mode: string;
  acre: boolean;
  versement_liberatoire: boolean;
}

interface Consumable {
  id: string;
  name: string;
  price: number;
  usesPerUnit: number;
}

interface ProfitabilityCalculatorProps {
  userId: string;
}

export default function ProfitabilityCalculator({ userId }: ProfitabilityCalculatorProps) {
  const [loading, setLoading] = useState(true);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  const [serviceName, setServiceName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [desiredHourlyRate, setDesiredHourlyRate] = useState<number>(30);
  const [currentPrice, setCurrentPrice] = useState<number>(60);

  const [consumables, setConsumables] = useState<Consumable[]>([
    { id: '1', name: 'Gel UV', price: 30, usesPerUnit: 20 }
  ]);

  const [directCosts, setDirectCosts] = useState<number>(0);
  const [additionalFixedCosts, setAdditionalFixedCosts] = useState<number>(0);

  useEffect(() => {
    loadCompanyProfile();
  }, [userId]);

  const loadCompanyProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('legal_status, tax_category, vat_mode, acre, versement_liberatoire')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCompanyProfile(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const addConsumable = () => {
    const newConsumable: Consumable = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      usesPerUnit: 1,
    };
    setConsumables([...consumables, newConsumable]);
  };

  const removeConsumable = (id: string) => {
    if (consumables.length > 1) {
      setConsumables(consumables.filter(c => c.id !== id));
    }
  };

  const updateConsumable = (id: string, field: keyof Consumable, value: string | number) => {
    setConsumables(consumables.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const calculateChargesRate = (): { urssafRate: number; vatRate: number } => {
    if (!companyProfile) return { urssafRate: 0, vatRate: 0 };

    let urssafRate = 0;
    let vatRate = 0;

    const { legal_status, tax_category, vat_mode, acre, versement_liberatoire } = companyProfile;

    if (legal_status === 'MICRO') {
      if (tax_category === 'MICRO_BNC') {
        urssafRate = acre ? 5.5 : 21.2;
      } else if (tax_category === 'MICRO_BIC_SERVICES') {
        if (acre) {
          urssafRate = 10.6;
        } else {
          urssafRate = versement_liberatoire ? 22.9 : 21.2;
        }
      } else if (tax_category === 'MICRO_BIC_SALES') {
        urssafRate = acre ? 3.2 : 12.3;
      } else {
        urssafRate = 21.2;
      }

      if (vat_mode === 'VAT_LIABLE') {
        vatRate = 20;
      }
    } else if (legal_status === 'EI') {
      urssafRate = 45;
      if (vat_mode === 'VAT_LIABLE') {
        vatRate = 20;
      }
    } else if (legal_status === 'SASU_EURL') {
      urssafRate = 82;
      if (vat_mode === 'VAT_LIABLE') {
        vatRate = 20;
      }
    }

    return { urssafRate, vatRate };
  };

  const calculateResults = () => {
    const { urssafRate, vatRate } = calculateChargesRate();

    const totalConsumableCost = consumables.reduce((sum, consumable) => {
      const costPerService = consumable.usesPerUnit > 0
        ? consumable.price / consumable.usesPerUnit
        : 0;
      return sum + costPerService;
    }, 0);

    const priceHT = vatRate > 0 ? currentPrice / (1 + vatRate / 100) : currentPrice;

    const urssafAmount = (priceHT * urssafRate) / 100;
    const vatAmount = vatRate > 0 ? (priceHT * vatRate) / 100 : 0;

    const totalCostPerService =
      totalConsumableCost +
      directCosts +
      urssafAmount +
      vatAmount +
      additionalFixedCosts;

    const margin = currentPrice - totalCostPerService;

    const durationHours = durationMinutes / 60;
    const actualHourlyRate = durationHours > 0 ? margin / durationHours : 0;

    const minProfitablePrice = totalCostPerService + (desiredHourlyRate * durationHours);

    let status: 'unprofitable' | 'limit' | 'profitable' = 'unprofitable';
    if (actualHourlyRate >= desiredHourlyRate) {
      status = 'profitable';
    } else if (actualHourlyRate >= desiredHourlyRate * 0.7) {
      status = 'limit';
    }

    return {
      totalConsumableCost,
      urssafAmount,
      urssafRate,
      vatAmount,
      vatRate,
      totalCostPerService,
      margin,
      actualHourlyRate,
      minProfitablePrice,
      status,
      priceHT,
    };
  };

  const handleReset = () => {
    setServiceName('');
    setDurationMinutes(120);
    setDesiredHourlyRate(30);
    setCurrentPrice(60);
    setConsumables([{ id: '1', name: 'Gel UV', price: 30, usesPerUnit: 20 }]);
    setDirectCosts(0);
    setAdditionalFixedCosts(0);
  };

  const results = calculateResults();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-belaya-500"></div>
      </div>
    );
  }

  if (!companyProfile) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Profil d'entreprise requis</h3>
            <p className="text-sm text-amber-800">
              Veuillez d'abord compléter votre profil d'entreprise pour utiliser le calculateur de rentabilité.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-belaya-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Calculator className="w-6 h-6 text-belaya-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Calculateur de rentabilité</h2>
            <p className="text-gray-700">
              Calculez automatiquement si vos prestations sont rentables en fonction de vos charges réelles.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-belaya-500" />
              Informations prestation
            </h3>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Nom de la prestation
                  <InfoTooltip content="Exemple : Pose complète gel, Remplissage vernis semi-permanent, etc." />
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Pose complète gel"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Durée de travail (minutes)
                  <InfoTooltip content="Incluez la préparation, le temps de pose et le nettoyage" />
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  min="0"
                  placeholder="120"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Taux horaire souhaité (€/h)
                  <InfoTooltip content="Votre objectif de rémunération nette par heure de travail" />
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={desiredHourlyRate}
                    onChange={(e) => setDesiredHourlyRate(Number(e.target.value))}
                    min="0"
                    step="0.5"
                    placeholder="30"
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€/h</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Prix actuel pratiqué (€)
                  <InfoTooltip content="Le prix que vous facturez actuellement à vos clientes" />
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(Number(e.target.value))}
                    min="0"
                    step="0.5"
                    placeholder="60"
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Consommables</h3>
              <button
                onClick={addConsumable}
                className="flex items-center gap-2 px-3 py-1.5 bg-belaya-50 text-belaya-primary rounded-lg hover:bg-belaya-100 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {consumables.map((consumable, index) => (
                <div key={consumable.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Consommable {index + 1}</span>
                    {consumables.length > 1 && (
                      <button
                        onClick={() => removeConsumable(consumable.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      Nom du produit
                      <InfoTooltip content="Exemple : Gel UV, Base coat, Top coat, etc." />
                    </label>
                    <input
                      type="text"
                      value={consumable.name}
                      onChange={(e) => updateConsumable(consumable.id, 'name', e.target.value)}
                      placeholder="Ex: Gel UV"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        Prix (€)
                        <InfoTooltip content="Prix d'achat du produit" />
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={consumable.price}
                          onChange={(e) => updateConsumable(consumable.id, 'price', Number(e.target.value))}
                          min="0"
                          step="0.5"
                          placeholder="30"
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        Utilisations
                        <InfoTooltip content="Nombre de prestations possibles avec ce produit" />
                      </label>
                      <input
                        type="number"
                        value={consumable.usesPerUnit}
                        onChange={(e) => updateConsumable(consumable.id, 'usesPerUnit', Number(e.target.value))}
                        min="1"
                        placeholder="20"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="text-xs font-medium text-blue-900">
                      Coût par prestation : <span className="font-bold">
                        {(consumable.usesPerUnit > 0 ? consumable.price / consumable.usesPerUnit : 0).toFixed(2)} €
                      </span>
                    </p>
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Total consommables par prestation
                </p>
                <p className="text-2xl font-bold text-blue-900">{results.totalConsumableCost.toFixed(2)} €</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Coûts supplémentaires (optionnel)</h3>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Coûts directs par prestation (€)
                  <InfoTooltip content="Capsules, décorations, strass, etc. à ajouter au coût consommable" />
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={directCosts}
                    onChange={(e) => setDirectCosts(Number(e.target.value))}
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Charges fixes supplémentaires (€)
                  <InfoTooltip content="Part du loyer, logiciel, assurance, etc. à imputer sur cette prestation (optionnel)" />
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={additionalFixedCosts}
                    onChange={(e) => setAdditionalFixedCosts(Number(e.target.value))}
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Charges automatiques</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Cotisations URSSAF</span>
                  <InfoTooltip content="Calculées automatiquement selon votre statut juridique et vos options fiscales" />
                </div>
                <span className="text-sm font-bold text-gray-900">{results.urssafRate}%</span>
              </div>

              {results.vatRate > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">TVA</span>
                    <InfoTooltip content="TVA à reverser à l'État (calculée sur le prix HT)" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">{results.vatRate}%</span>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">URSSAF sur cette prestation</span>
                    <span className="font-semibold text-gray-900">{results.urssafAmount.toFixed(2)} €</span>
                  </div>
                  {results.vatRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TVA sur cette prestation</span>
                      <span className="font-semibold text-gray-900">{results.vatAmount.toFixed(2)} €</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border-2 p-6 shadow-lg ${
            results.status === 'profitable' ? 'bg-green-50 border-belaya-300' :
            results.status === 'limit' ? 'bg-amber-50 border-amber-300' :
            'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {results.status === 'profitable' && <CheckCircle className="w-6 h-6 text-belaya-bright" />}
              {results.status === 'limit' && <AlertTriangle className="w-6 h-6 text-amber-600" />}
              {results.status === 'unprofitable' && <AlertCircle className="w-6 h-6 text-red-600" />}
              <h3 className={`text-lg font-bold ${
                results.status === 'profitable' ? 'text-green-900' :
                results.status === 'limit' ? 'text-amber-900' :
                'text-red-900'
              }`}>
                {results.status === 'profitable' && '🟢 Prestation Rentable'}
                {results.status === 'limit' && '🟡 Rentabilité Limite'}
                {results.status === 'unprofitable' && '🔴 Non Rentable'}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700">Prix minimum rentable</span>
                  <InfoTooltip content="Prix à facturer pour atteindre votre taux horaire souhaité après déduction de tous les coûts" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{results.minProfitablePrice.toFixed(2)} €</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700">Coût total par prestation</span>
                  <InfoTooltip content="Consommables + Coûts directs + Charges sociales + TVA + Charges fixes" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{results.totalCostPerService.toFixed(2)} €</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700">Marge par prestation</span>
                  <InfoTooltip content="Prix actuel - Coût total (ce qu'il vous reste réellement)" />
                </div>
                <p className={`text-2xl font-bold ${
                  results.margin >= 0 ? 'text-belaya-bright' : 'text-red-600'
                }`}>
                  {results.margin.toFixed(2)} €
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700">Taux horaire réel</span>
                  <InfoTooltip content="Marge divisée par le temps de travail (votre rémunération nette par heure)" />
                </div>
                <p className={`text-2xl font-bold ${
                  results.actualHourlyRate >= desiredHourlyRate ? 'text-belaya-bright' : 'text-red-600'
                }`}>
                  {results.actualHourlyRate.toFixed(2)} €/h
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Objectif : {desiredHourlyRate.toFixed(2)} €/h
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <RotateCcw className="w-5 h-5" />
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
