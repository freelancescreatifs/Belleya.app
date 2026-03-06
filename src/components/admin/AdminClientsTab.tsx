import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Search, Download, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProviderClient {
  client_id: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_created_at: string;
  provider_company_name: string | null;
  provider_email: string | null;
  is_converted: boolean;
  belaya_user_id: string | null;
  belaya_registered_at: string | null;
  is_archived: boolean;
  is_vip: boolean;
  is_fidele: boolean;
}

type ClientSubTab = 'all' | 'converted' | 'non_converted';

export default function AdminClientsTab() {
  const [clients, setClients] = useState<ProviderClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<ClientSubTab>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_all_provider_clients');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading provider clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter(c => {
    const matchesSearch =
      (c.client_email && c.client_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.client_first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.provider_company_name && c.provider_company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.provider_email && c.provider_email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab =
      subTab === 'all' ||
      (subTab === 'converted' && c.is_converted) ||
      (subTab === 'non_converted' && !c.is_converted);

    return matchesSearch && matchesTab;
  });

  const totalClients = clients.length;
  const convertedCount = clients.filter(c => c.is_converted).length;
  const nonConvertedCount = clients.filter(c => !c.is_converted).length;
  const conversionRate = totalClients > 0 ? ((convertedCount / totalClients) * 100).toFixed(1) : '0';
  const nonConvertedWithEmail = clients.filter(c => !c.is_converted && c.client_email).length;
  const vipCount = clients.filter(c => c.is_vip).length;
  const fideleCount = clients.filter(c => c.is_fidele).length;

  const exportToCSV = () => {
    if (filtered.length === 0) return;

    const rows = filtered.map(c => ({
      Nom: `${c.client_first_name} ${c.client_last_name}`,
      Email: c.client_email || '',
      Telephone: c.client_phone || '',
      Prestataire: c.provider_company_name || '',
      Email_Prestataire: c.provider_email || '',
      Converti: c.is_converted ? 'Oui' : 'Non',
      Date_Ajout: new Date(c.client_created_at).toLocaleDateString('fr-FR'),
      Date_Inscription_Belaya: c.belaya_registered_at ? new Date(c.belaya_registered_at).toLocaleDateString('fr-FR') : '',
      VIP: c.is_vip ? 'Oui' : 'Non',
      Fidele: c.is_fidele ? 'Oui' : 'Non',
    }));

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => {
        const value = row[h as keyof typeof row];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clients_prestataires_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-gray-600">Total clients</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-gray-600">Convertis</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{convertedCount}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-medium text-gray-600">Non convertis</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{nonConvertedCount}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-medium text-gray-600">Taux conversion</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{conversionRate}%</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-medium text-gray-600">Convertibles</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{nonConvertedWithEmail}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Non convertis avec email</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-pink-600" />
            <span className="text-xs font-medium text-gray-600">VIP / Fideles</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{vipCount} / {fideleCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {([
            { key: 'all', label: 'Tous', count: totalClients },
            { key: 'converted', label: 'Convertis', count: convertedCount },
            { key: 'non_converted', label: 'Non convertis', count: nonConvertedCount },
          ] as { key: ClientSubTab; label: string; count: number }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                subTab === tab.key
                  ? 'bg-[#E51E8F] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, prestataire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Telephone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prestataire</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ajout</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Inscription Belaya</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((client) => (
                <tr key={client.client_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {client.is_converted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="w-3 h-3" />
                        Converti
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <UserX className="w-3 h-3" />
                        Non converti
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {client.client_first_name} {client.client_last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {client.client_email || <span className="text-gray-400 italic">Aucun</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {client.client_phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div>
                      <p className="font-medium text-gray-800">{client.provider_company_name || '—'}</p>
                      <p className="text-xs text-gray-500">{client.provider_email || ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(client.client_created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {client.belaya_registered_at ? (
                      <span className="text-green-700 font-medium">
                        {new Date(client.belaya_registered_at).toLocaleDateString('fr-FR')}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {client.is_vip && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700">VIP</span>
                      )}
                      {client.is_fidele && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Fidele</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucun client trouve</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-right">{filtered.length} client(s) affiche(s)</p>
    </div>
  );
}
