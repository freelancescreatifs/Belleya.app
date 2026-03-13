import { useState, useEffect } from 'react';
import { Mail, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BelayaLoader from '../shared/BelayaLoader';

interface MarketingSend {
  id: string;
  client_id: string;
  channel: 'sms' | 'email';
  subject: string | null;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked';
  sent_at: string | null;
  created_at: string;
  clients: {
    first_name: string;
    last_name: string;
  };
}

interface MarketingHistoryProps {
  userId: string;
}

export default function MarketingHistory({ userId }: MarketingHistoryProps) {
  const [sends, setSends] = useState<MarketingSend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_sends')
        .select(`
          *,
          clients (
            first_name,
            last_name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setSends(data || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-belaya-bright" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'clicked':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      sent: 'Envoyé',
      delivered: 'Délivré',
      failed: 'Échec',
      clicked: 'Cliqué'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      sent: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      clicked: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <BelayaLoader variant="inline" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Historique des envois ({sends.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Canal
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Sujet / Aperçu
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sends.map((send) => (
              <tr key={send.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(send.created_at).toLocaleDateString('fr-FR')}
                  <div className="text-xs text-gray-500">
                    {new Date(send.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {send.clients.first_name} {send.clients.last_name}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {send.channel === 'sms' ? (
                    <div className="flex items-center gap-2 text-belaya-bright">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">SMS</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-md">
                    {send.subject && (
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        {send.subject}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 truncate">
                      {send.content.substring(0, 80)}
                      {send.content.length > 80 ? '...' : ''}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(send.status)}
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        send.status
                      )}`}
                    >
                      {getStatusLabel(send.status)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sends.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun envoi pour le moment
          </div>
        )}
      </div>
    </div>
  );
}
