import { Calculator, Info } from 'lucide-react';
import InfoTooltip from '../shared/InfoTooltip';

interface TaxCalculatorProps {
  legalStatus: string;
  acre: boolean;
  vatMode: string;
  taxCategory: string;
  versementLiberatoire: boolean;
  monthRevenue: number;
  monthExpenses: number;
}

export default function TaxCalculator({
  legalStatus,
  acre,
  vatMode,
  taxCategory,
  versementLiberatoire,
  monthRevenue,
  monthExpenses,
}: TaxCalculatorProps) {
  const calculateCharges = () => {
    let urssafRate = 0;
    let vatRate = 0;
    let vatAmount = 0;
    let urssafAmount = 0;

    if (legalStatus === 'MICRO') {
      if (taxCategory === 'MICRO_BNC') {
        urssafRate = acre ? 5.5 : 21.2;
      } else if (taxCategory === 'MICRO_BIC_SERVICES') {
        if (acre) {
          urssafRate = 10.6;
        } else {
          urssafRate = versementLiberatoire ? 22.9 : 21.2;
        }
      } else if (taxCategory === 'MICRO_BIC_SALES') {
        urssafRate = acre ? 3.2 : 12.3;
      } else {
        urssafRate = 21.2;
      }

      urssafAmount = (monthRevenue * urssafRate) / 100;

      if (vatMode === 'VAT_LIABLE') {
        vatRate = 20;
        const revenueHT = monthRevenue / 1.2;
        vatAmount = revenueHT * 0.2;
      }
    } else if (legalStatus === 'EI') {
      const profit = monthRevenue - monthExpenses;
      urssafRate = 45;
      urssafAmount = (profit * urssafRate) / 100;

      if (vatMode === 'VAT_LIABLE') {
        vatRate = 20;
        const revenueHT = monthRevenue / 1.2;
        vatAmount = revenueHT * 0.2;
      }
    } else if (legalStatus === 'SASU_EURL') {
      urssafRate = 82;
      const salary = monthRevenue - monthExpenses;
      urssafAmount = (salary * urssafRate) / 100;

      if (vatMode === 'VAT_LIABLE') {
        vatRate = 20;
        const revenueHT = monthRevenue / 1.2;
        vatAmount = revenueHT * 0.2;
      }
    }

    return {
      urssafRate,
      urssafAmount,
      vatRate,
      vatAmount,
      totalDue: urssafAmount + vatAmount,
    };
  };

  const charges = calculateCharges();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
          <Calculator className="w-6 h-6 text-amber-600" />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Cotisations URSSAF</span>
              <InfoTooltip
                content={`Calculé selon votre statut, votre activité et vos options (ACRE, versement libératoire).`}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            Taux URSSAF appliqué : {charges.urssafRate}%
            {acre && ' (avec ACRE)'}
            {!acre && versementLiberatoire && legalStatus === 'MICRO' && taxCategory === 'MICRO_BIC_SERVICES' && ' (avec versement libératoire)'}
          </p>
          <p className="text-2xl font-bold text-gray-900">{charges.urssafAmount.toFixed(2)} €</p>
        </div>

        {vatMode === 'VAT_LIABLE' && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">TVA à reverser</span>
                <InfoTooltip content="TVA collectée à reverser à l'État (20% du CA HT)" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{charges.vatAmount.toFixed(2)} €</p>
          </div>
        )}
      </div>
    </div>
  );
}
