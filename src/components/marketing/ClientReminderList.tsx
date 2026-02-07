import { useState } from 'react';
import { Mail, MessageSquare, Check } from 'lucide-react';
import {
  ClientReminder,
  getReminderLabel,
  getReminderColor,
  getDefaultDiscount
} from '../../lib/marketingHelpers';

interface ClientReminderListProps {
  clients: ClientReminder[];
  onSendReminders: (selectedClients: ClientReminder[], channel: 'sms' | 'email') => void;
}

export default function ClientReminderList({
  clients,
  onSendReminders
}: ClientReminderListProps) {
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');

  const filteredClients = filterType === 'all'
    ? clients
    : clients.filter(c => c.reminder_type === filterType);

  const toggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const toggleAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.client_id)));
    }
  };

  const handleSend = (channel: 'sms' | 'email') => {
    const selected = clients.filter(c => selectedClients.has(c.client_id));
    onSendReminders(selected, channel);
  };

  const selectedTotal = Array.from(selectedClients)
    .reduce((sum, clientId) => {
      const client = clients.find(c => c.client_id === clientId);
      return sum + (client?.average_basket || 0);
    }, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Clientes à contacter ({filteredClients.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterType('gentle')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filterType === 'gentle'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Douce
            </button>
            <button
              onClick={() => setFilterType('standard')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filterType === 'standard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setFilterType('strong')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filterType === 'strong'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Forte
            </button>
            <button
              onClick={() => setFilterType('birthday')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filterType === 'birthday'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Anniversaire
            </button>
          </div>
        </div>

        {selectedClients.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedClients.size} cliente{selectedClients.size > 1 ? 's' : ''} sélectionnée{selectedClients.size > 1 ? 's' : ''}
              </span>
              <span className="text-sm text-blue-700">
                CA potentiel: {selectedTotal.toFixed(0)} €
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSend('sms')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Envoyer par SMS
              </button>
              <button
                onClick={() => handleSend('email')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Mail className="w-4 h-4" />
                Envoyer par Email
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Dernier RDV
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Fréquence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Retard
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Type de relance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Panier moyen
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Canal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr
                key={client.client_id}
                className={`hover:bg-gray-50 ${
                  selectedClients.has(client.client_id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedClients.has(client.client_id)}
                    onChange={() => toggleClient(client.client_id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {client.first_name} {client.last_name}
                  </div>
                  {client.days_until_birthday !== null && client.days_until_birthday <= 30 && (
                    <div className="text-xs text-belleya-primary">
                      🎂 Anniversaire dans {client.days_until_birthday}j
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {client.last_appointment_date
                    ? new Date(client.last_appointment_date).toLocaleDateString('fr-FR')
                    : '-'}
                  <div className="text-xs text-gray-500">
                    il y a {client.days_since_last_visit}j
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {client.recommended_frequency_days
                    ? `${Math.round(client.recommended_frequency_days / 7)} sem. (${client.recommended_frequency_days}j)`
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  {client.days_late > 0 ? (
                    <span className="text-sm font-medium text-orange-600">
                      +{client.days_late}j
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getReminderColor(
                      client.reminder_type
                    )}`}
                  >
                    {getReminderLabel(client.reminder_type)}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    -{getDefaultDiscount(client.reminder_type)}%
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {client.average_basket.toFixed(0)} €
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {client.phone && (
                      <MessageSquare className="w-4 h-4 text-green-600" />
                    )}
                    {client.email && (
                      <Mail className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucune cliente à relancer pour le moment
          </div>
        )}
      </div>
    </div>
  );
}
