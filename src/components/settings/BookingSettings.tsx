import { Clock, Bell, CreditCard } from 'lucide-react';
import InfoTooltip from '../shared/InfoTooltip';
import PaymentProviderSetup from './PaymentProviderSetup';

interface BookingSettingsData {
  default_appointment_duration: number;
  advance_booking_hours: number;
  buffer_time_minutes: number;
  max_bookings_per_day: number | null;
  auto_accept_bookings: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  welcome_message: string;
  booking_instructions: string;
  cancellation_policy: string;
  deposit_required: boolean;
  deposit_amount: number | null;
  deposit_fee_payer: 'provider' | 'client';
}

interface BookingSettingsProps {
  settings: BookingSettingsData;
  onChange: (settings: BookingSettingsData) => void;
}

export default function BookingSettings({ settings, onChange }: BookingSettingsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-belaya-primary" />
          Paramètres de réservation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée par défaut des rendez-vous (minutes)
              <InfoTooltip content="Durée standard d'un rendez-vous si non spécifiée" />
            </label>
            <input
              type="number"
              min="15"
              max="480"
              step="15"
              value={settings.default_appointment_duration}
              onChange={(e) => onChange({ ...settings, default_appointment_duration: parseInt(e.target.value) || 60 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Délai minimum de réservation (heures)
              <InfoTooltip content="Temps minimum avant le RDV pour pouvoir réserver" />
            </label>
            <input
              type="number"
              min="0"
              max="168"
              value={settings.advance_booking_hours}
              onChange={(e) => onChange({ ...settings, advance_booking_hours: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temps de pause entre RDV (minutes)
              <InfoTooltip content="Temps de battement entre deux rendez-vous consécutifs" />
            </label>
            <input
              type="number"
              min="0"
              max="60"
              step="5"
              value={settings.buffer_time_minutes}
              onChange={(e) => onChange({ ...settings, buffer_time_minutes: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre max de réservations/jour
              <InfoTooltip content="Laissez vide pour illimité" />
            </label>
            <input
              type="number"
              min="1"
              placeholder="Illimité"
              value={settings.max_bookings_per_day || ''}
              onChange={(e) => onChange({ ...settings, max_bookings_per_day: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-belaya-primary" />
          Notifications et automatisation
        </h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={settings.auto_accept_bookings}
              onChange={(e) => onChange({ ...settings, auto_accept_bookings: e.target.checked })}
              className="w-4 h-4 text-belaya-500 focus:ring-belaya-primary rounded mt-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Accepter automatiquement les réservations</span>
                <InfoTooltip content="Les réservations seront confirmées automatiquement sans validation manuelle" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Si désactivé, vous devrez valider chaque réservation manuellement
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={settings.email_notifications}
              onChange={(e) => onChange({ ...settings, email_notifications: e.target.checked })}
              className="w-4 h-4 text-belaya-500 focus:ring-belaya-primary rounded mt-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Notifications par email</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recevoir un email à chaque nouvelle réservation
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={settings.sms_notifications}
              onChange={(e) => onChange({ ...settings, sms_notifications: e.target.checked })}
              className="w-4 h-4 text-belaya-500 focus:ring-belaya-primary rounded mt-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Notifications par SMS</span>
                <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded font-medium">Premium</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recevoir un SMS à chaque nouvelle réservation
              </p>
            </div>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-belaya-primary" />
          Acompte
        </h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={settings.deposit_required}
              onChange={(e) => onChange({ ...settings, deposit_required: e.target.checked })}
              className="w-4 h-4 text-belaya-500 focus:ring-belaya-primary rounded mt-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Demander un acompte</span>
                <InfoTooltip content="Demander un acompte lors de la réservation pour sécuriser le RDV" />
                <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded font-medium">Premium</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sécurisez vos rendez-vous avec un acompte à la réservation
              </p>
            </div>
          </label>

          {settings.deposit_required && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de l'acompte (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.deposit_amount || ''}
                  onChange={(e) => onChange({ ...settings, deposit_amount: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  placeholder="Ex: 20.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Qui paie les frais de transaction (1,5%) ?
                  <InfoTooltip content="Frais de la plateforme Belaya sur chaque acompte. Vous pouvez choisir de les absorber ou de les facturer au client." />
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="deposit_fee_payer"
                      checked={settings.deposit_fee_payer === 'provider'}
                      onChange={() => onChange({ ...settings, deposit_fee_payer: 'provider' })}
                      className="w-4 h-4 text-belaya-500 focus:ring-belaya-primary mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Je prends en charge les frais</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Les 1,5% sont déduits de votre paiement. Le client paie uniquement l'acompte.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="deposit_fee_payer"
                      checked={settings.deposit_fee_payer === 'client'}
                      onChange={() => onChange({ ...settings, deposit_fee_payer: 'client' })}
                      className="w-4 h-4 text-belaya-500 focus:ring-belaya-primary mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Le client paie les frais</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Le client paie l'acompte + 1,5% de frais de transaction.
                        {settings.deposit_amount ? (
                          <span className="block mt-1 text-gray-700 font-medium">
                            Exemple : {settings.deposit_amount.toFixed(2)} € + {(settings.deposit_amount * 0.015).toFixed(2)} € de frais = {(settings.deposit_amount * 1.015).toFixed(2)} € total
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {settings.deposit_required && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-belaya-primary" />
            Paiement en ligne
          </h3>
          <PaymentProviderSetup depositRequired={settings.deposit_required} />
        </div>
      )}
    </div>
  );
}
