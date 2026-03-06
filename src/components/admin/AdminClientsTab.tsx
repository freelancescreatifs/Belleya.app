import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Search, Download, TrendingUp, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<ClientSubTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('admin_get_all_provider_clients');
      if (rpcError) {
        console.error('RPC error, falling back to direct query:', rpcError);
        await loadClientsFallback();
        return;
      }
      if (!data || data.length === 0) {
        console.warn('RPC returned 0 results, trying fallback');
        await loadClientsFallback();
        return;
      }
      setClients(data);
    } catch (err: any) {
      console.error('Error loading provider clients:', err);
      await loadClientsFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadClientsFallback = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          created_at,
          belaya_user_id,
          is_archived,
          is_vip,
          is_fidele,
          company_id,
          company_profiles!clients_company_id_fkey (
            company_name
          )
        `)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('Fallback query error:', clientsError);
        setError(`Erreur: ${clientsError.message}`);
        setClients([]);
        return;
      }

      const mapped: ProviderClient[] = (clientsData || []).map((c: any) => ({
        client_id: c.id,
        client_first_name: c.first_name || '',
        client_last_name: c.last_name || '',
        client_email: c.email,
        client_phone: c.phone,
        client_created_at: c.created_at,
        provider_company_name: c.company_profiles?.company_name || null,
        provider_email: null,
        is_converted: !!c.belaya_user_id,
        belaya_user_id: c.belaya_user_id,
        belaya_registered_at: null,
        is_archived: c.is_archived || false,
        is_vip: c.is_vip || false,
        is_fidele: c.is_fidele || false,
      }));

      setClients(mapped);
      if (mapped.length === 0) {
        setError('Aucun client trouve dans la base de donnees.');
      }
    } catch (err: any) {
      console.error('Fallback error:', err);
      setError(`Erreur: ${err.message || 'Impossible de charger les clients'}`);
      setClients([]);
    }
  };

  const filtered = clients.filter(c => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query ||
      (c.client_email && c.client_email.toLowerCase().includes(query)) ||
      (c.client_first_name && c.client_first_name.toLowerCase().includes(query)) ||
      (c.client_last_name && c.client_last_name.toLowerCase().includes(query)) ||
      (c.provider_company_name && c.provider_company_name.toLowerCase().includes(query)) ||
      (c.provider_email && c.provider_email.toLowerCase().includes(query));

    const matchesTab =
      subTab === 'all' ||
      (subTab === 'converted' && c.is_converted) ||
      (subTab === 'non_converted' && !c.is_converted);

    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedClients = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, subTab]);

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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Probleme de chargement</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={loadClients}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Reessayer
          </button>
        </div>
      )}

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
          onClick={loadClients}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>

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
              {paginatedClients.map((client) => (
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
                    {client.client_phone || '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div>
                      <p className="font-medium text-gray-800">{client.provider_company_name || '\u2014'}</p>
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
                      <span className="text-gray-400">\u2014</span>
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
        {filtered.length === 0 && !error && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucun client trouve</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {filtered.length} client(s) au total - page {currentPage}/{Math.max(totalPages, 1)}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Precedent
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page: number;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = currentPage - 3 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-[#E51E8F] text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
