import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
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

  const selectedList = clients.filter(c => selectedClients.has(c.client_id));
  const selectedHasPhone = selectedList.some(c => !!c.phone);
  const selectedHasEmail = selectedList.some(c => !!c.email);

  const filterButtons = [
    { key: 'all', label: 'Toutes' },
    { key: 'gentle', label: 'Douce' },
    { key: 'standard', label: 'Standard' },
    { key: 'strong', label: 'Forte' },
    { key: 'birthday', label: 'Anniversaire' },
    { key: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Clientes à contacter ({filteredClients.length})
          </h2>
          <div className="flex gap-1.5 flex-wrap">
            {filterButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterType === key
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {selectedClients.size > 0 && (
          <div className="flex items-center justify-between bg-pink-50 border border-pink-200 rounded-xl p-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-pink-900">
                {selectedClients.size} cliente{selectedClients.size > 1 ? 's' : ''} sélectionnée{selectedClients.size > 1 ? 's' : ''}
              </span>
              <span className="text-sm text-pink-700">
                CA potentiel: {selectedTotal.toFixed(0)} €
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSend('sms')}
                disabled={!selectedHasPhone}
                title={!selectedHasPhone ? 'Aucune cliente sélectionnée n\'a de numéro' : undefined}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </button>
              <button
                onClick={() => handleSend('email')}
                disabled={!selectedHasEmail}
                title={!selectedHasEmail ? 'Aucune cliente sélectionnée n\'a d\'email' : undefined}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300 accent-pink-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Dernier RDV
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Fréquence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Retard
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Type de relance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Panier moyen
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Canal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredClients.map((client) => (
              <tr
                key={client.client_id}
                className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedClients.has(client.client_id) ? 'bg-pink-50' : ''
                }`}
                onClick={() => toggleClient(client.client_id)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedClients.has(client.client_id)}
                    onChange={() => toggleClient(client.client_id)}
                    className="rounded border-gray-300 accent-pink-600"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {client.first_name} {client.last_name}
                  </div>
                  {client.days_until_birthday !== null && client.days_until_birthday <= 30 && (
                    <div className="text-xs text-pink-600 mt-0.5">
                      Anniversaire dans {client.days_until_birthday}j
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {client.last_appointment_date
                    ? new Date(client.last_appointment_date).toLocaleDateString('fr-FR')
                    : '-'}
                  <div className="text-xs text-gray-400">
                    il y a {client.days_since_last_visit}j
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {client.recommended_frequency_days
                    ? `${Math.round(client.recommended_frequency_days / 7)} sem.`
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
                  {getDefaultDiscount(client.reminder_type) > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      -{getDefaultDiscount(client.reminder_type)}%
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {client.average_basket.toFixed(0)} €
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {client.phone ? (
                      <MessageSquare className="w-4 h-4 text-rose-500" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-gray-300" />
                    )}
                    {client.email ? (
                      <Mail className="w-4 h-4 text-pink-500" />
                    ) : (
                      <Mail className="w-4 h-4 text-gray-300" />
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
