import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { MarketingDebugInfo } from '../../lib/marketingHelpers';

interface MarketingDebugProps {
  debugInfo: MarketingDebugInfo;
}

export default function MarketingDebug({ debugInfo }: MarketingDebugProps) {
  const [expanded, setExpanded] = useState(false);

  // Protection contre missing_data undefined
  if (!debugInfo || !debugInfo.missing_data) {
    return null;
  }

  const hasMissingData =
    debugInfo.missing_data.no_last_appointment.length > 0 ||
    debugInfo.missing_data.no_frequency.length > 0 ||
    debugInfo.missing_data.no_birth_date.length > 0;

  if (!hasMissingData && debugInfo.clients_remindable > 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <h3 className="font-medium text-blue-900">
              Pourquoi certaines clientes n'apparaissent pas ?
            </h3>
            <p className="text-sm text-blue-700">
              {debugInfo.total_clients} clientes • {debugInfo.clients_remindable} relançables
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Statistiques détaillées</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total clientes</div>
                <div className="text-lg font-semibold text-gray-900">
                  {debugInfo.total_clients}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Avec dernier RDV</div>
                <div className="text-lg font-semibold text-gray-900">
                  {debugInfo.clients_with_last_appointment}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Avec fréquence</div>
                <div className="text-lg font-semibold text-gray-900">
                  {debugInfo.clients_with_frequency}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Avec anniversaire</div>
                <div className="text-lg font-semibold text-gray-900">
                  {debugInfo.clients_with_birth_date}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Relançables</div>
                <div className="text-lg font-semibold text-belleya-bright">
                  {debugInfo.clients_remindable}
                </div>
              </div>
              <div>
                <div className="text-gray-600">En retard</div>
                <div className="text-lg font-semibold text-orange-600">
                  {debugInfo.clients_late}
                </div>
              </div>
            </div>
          </div>

          {hasMissingData && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Données manquantes
              </h4>

              {debugInfo.missing_data?.no_last_appointment && debugInfo.missing_data.no_last_appointment.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-orange-800 mb-1">
                    Clientes sans dernier RDV ({debugInfo.missing_data.no_last_appointment.length})
                  </div>
                  <div className="text-sm text-gray-600">
                    {debugInfo.missing_data.no_last_appointment.slice(0, 5).join(', ')}
                    {debugInfo.missing_data.no_last_appointment.length > 5 &&
                      ` et ${debugInfo.missing_data.no_last_appointment.length - 5} autres...`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ces clientes n'apparaissent pas car aucun rendez-vous n'a été enregistré.
                  </div>
                </div>
              )}

              {debugInfo.missing_data?.no_frequency && debugInfo.missing_data.no_frequency.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-yellow-800 mb-1">
                    Clientes sans fréquence recommandée ({debugInfo.missing_data.no_frequency.length})
                  </div>
                  <div className="text-sm text-gray-600">
                    {debugInfo.missing_data.no_frequency.slice(0, 5).join(', ')}
                    {debugInfo.missing_data.no_frequency.length > 5 &&
                      ` et ${debugInfo.missing_data.no_frequency.length - 5} autres...`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Pour calculer le retard précisément, renseignez la fréquence recommandée dans la fiche cliente.
                  </div>
                </div>
              )}

              {debugInfo.missing_data?.no_birth_date && debugInfo.missing_data.no_birth_date.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    Clientes sans date anniversaire ({debugInfo.missing_data.no_birth_date.length})
                  </div>
                  <div className="text-sm text-gray-600">
                    {debugInfo.missing_data.no_birth_date.slice(0, 5).join(', ')}
                    {debugInfo.missing_data.no_birth_date.length > 5 &&
                      ` et ${debugInfo.missing_data.no_birth_date.length - 5} autres...`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ces clientes ne recevront pas d'offre anniversaire.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
