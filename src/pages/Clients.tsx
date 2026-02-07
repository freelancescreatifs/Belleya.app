import { useEffect, useState, useRef } from 'react';
import { Plus, Search, User, Phone, Mail, Instagram, Star, Pencil, X, Calendar, Scissors, Trash2, Archive, ArchiveRestore, TrendingUp, Users, AlertCircle, DollarSign, UserPlus, Info, Upload, Loader2, Edit, XCircle, PackageX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ClientDetailDrawer from '../components/client/ClientDetailDrawer';
import ClientForm from '../components/client/ClientForm';
import InfoTooltip from '../components/shared/InfoTooltip';
import CreateAppointmentModal from '../components/client/CreateAppointmentModal';
import CreateRevenueModal from '../components/client/CreateRevenueModal';
import ImportClientsModal from '../components/client/ImportClientsModal';
import { getClientTag } from '../lib/clientTagHelpers';
import { clientsCache, type ClientMinimal } from '../lib/clientsCache';

interface Client extends ClientMinimal {
  status?: 'regular' | 'vip' | 'at_risk';
  skin_type?: string | null;
  nail_type?: string | null;
  hair_type?: string | null;
  scalp_type?: string | null;
  lash_type?: string | null;
  brow_type?: string | null;
  skin_conditions?: string[] | null;
  birth_date?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  banned?: boolean;
  banned_at?: string | null;
  updated_at: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  duration: number;
}

interface ClientService {
  id: string;
  service_name: string;
  service_category: string;
  price: number;
  performed_at: string;
  notes: string | null;
}

type ClientFilter = 'all' | 'new' | 'loyal' | 'archived' | 'banned';

interface GlobalStats {
  activeClients: number;
  newClients: number;
  loyalClients: number;
  atRiskClients: number;
  averageBasket: number;
}

const PAGE_SIZE = 30;

export default function Clients() {
  const { user, profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientFilter, setClientFilter] = useState<ClientFilter>('all');
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    activeClients: 0,
    newClients: 0,
    loyalClients: 0,
    atRiskClients: 0,
    averageBasket: 0,
  });
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [clientToArchive, setClientToArchive] = useState<Client | null>(null);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [clientForAppointment, setClientForAppointment] = useState<Client | null>(null);
  const [showCreateRevenueModal, setShowCreateRevenueModal] = useState(false);
  const [clientForRevenue, setClientForRevenue] = useState<Client | null>(null);
  const [totalClientsCount, setTotalClientsCount] = useState(0);
  const [showBanModal, setShowBanModal] = useState(false);
  const [clientToBan, setClientToBan] = useState<Client | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadClients();
    loadServices();
  }, [user, clientFilter]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        searchClients(searchTerm);
      }, 250);
    } else if (searchTerm.length === 0) {
      setIsSearching(false);
      loadClients();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const loadTotalCount = async () => {
    if (!user || !profile?.company_id) return;

    try {
      const { count: totalCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('is_archived', false)
        .eq('banned', false);

      setTotalClientsCount(totalCount || 0);
    } catch (error) {
      console.error('Error loading total count:', error);
    }
  };

  const loadClients = async () => {
    if (!user || !profile?.company_id) return;

    const startTime = performance.now();
    setLoading(true);
    setOffset(0);
    setCursor(null);

    loadTotalCount();

    const cached = clientsCache.get(clientFilter, '', 0);
    if (cached) {
      setClients(cached.data as Client[]);
      setHasMore(cached.hasMore);
      setCursor(cached.data[cached.data.length - 1]?.updated_at || null);
      setOffset(PAGE_SIZE);
      setLoading(false);

      const endTime = performance.now();
      console.log('[Clientes] source=cache', {
        page: 0,
        limit: PAGE_SIZE,
        returned: cached.data.length,
        tookMs: Math.round(endTime - startTime)
      });

      loadGlobalStats();
      return;
    }

    try {

      let query = supabase
        .from('clients')
        .select('id, first_name, last_name, phone, email, instagram_handle, created_at, updated_at, is_archived, banned', { count: 'exact' })
        .eq('company_id', profile.company_id);

      if (clientFilter === 'archived') {
        query = query.eq('is_archived', true).eq('banned', false);
      } else if (clientFilter === 'banned') {
        query = query.eq('banned', true);
      } else {
        query = query.eq('is_archived', false).eq('banned', false);
      }

      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      let clientsData: ClientMinimal[] = data || [];

      if (clientsData.length > 0) {
        const clientIds = clientsData.map(c => c.id);
        const { data: eventsData } = await supabase
          .from('events')
          .select('client_id')
          .in('client_id', clientIds)
          .neq('status', 'cancelled');

        const appointmentCounts = new Map<string, number>();
        eventsData?.forEach(event => {
          if (event.client_id) {
            appointmentCounts.set(
              event.client_id,
              (appointmentCounts.get(event.client_id) || 0) + 1
            );
          }
        });

        clientsData.forEach(client => {
          client.appointmentCount = appointmentCounts.get(client.id) || 0;
        });
      }

      // Apply advanced filters for 'new' and 'loyal' segments
      if (clientFilter === 'new' || clientFilter === 'loyal') {
        clientsData = applyAdvancedFilters(clientsData as Client[], clientFilter) as ClientMinimal[];
      }

      const hasMoreResults = (count || 0) > PAGE_SIZE;
      const lastCursor = clientsData[clientsData.length - 1]?.updated_at || null;

      clientsCache.set(clientFilter, '', 0, clientsData, hasMoreResults);

      setClients(clientsData as Client[]);
      setHasMore(hasMoreResults);
      setCursor(lastCursor);
      setOffset(PAGE_SIZE);

      const endTime = performance.now();
      console.log('[Clientes] source=server', {
        page: 0,
        limit: PAGE_SIZE,
        returned: clientsData.length,
        tookMs: Math.round(endTime - startTime)
      });

      await loadGlobalStats();
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreClients = async () => {
    if (!user || !profile?.company_id || loadingMore || !hasMore || isSearching || !cursor) return;

    const startTime = performance.now();
    setLoadingMore(true);

    const cached = clientsCache.get(clientFilter, '', offset);
    if (cached) {
      setClients(prev => [...prev, ...(cached.data as Client[])]);
      setHasMore(cached.hasMore);
      setCursor(cached.data[cached.data.length - 1]?.updated_at || null);
      setOffset(prev => prev + PAGE_SIZE);
      setLoadingMore(false);

      const endTime = performance.now();
      console.log('[Clientes] source=cache', {
        page: offset / PAGE_SIZE,
        limit: PAGE_SIZE,
        returned: cached.data.length,
        tookMs: Math.round(endTime - startTime)
      });
      return;
    }

    try {
      let query = supabase
        .from('clients')
        .select('id, first_name, last_name, phone, email, instagram_handle, created_at, updated_at, is_archived, banned', { count: 'exact' })
        .eq('company_id', profile.company_id);

      if (clientFilter === 'archived') {
        query = query.eq('is_archived', true).eq('banned', false);
      } else if (clientFilter === 'banned') {
        query = query.eq('banned', true);
      } else {
        query = query.eq('is_archived', false).eq('banned', false);
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .lt('updated_at', cursor)
        .limit(PAGE_SIZE);

      if (error) throw error;

      let clientsData: ClientMinimal[] = data || [];

      if (clientsData.length > 0) {
        const clientIds = clientsData.map(c => c.id);
        const { data: eventsData } = await supabase
          .from('events')
          .select('client_id')
          .in('client_id', clientIds)
          .neq('status', 'cancelled');

        const appointmentCounts = new Map<string, number>();
        eventsData?.forEach(event => {
          if (event.client_id) {
            appointmentCounts.set(
              event.client_id,
              (appointmentCounts.get(event.client_id) || 0) + 1
            );
          }
        });

        clientsData.forEach(client => {
          client.appointmentCount = appointmentCounts.get(client.id) || 0;
        });
      }

      // Apply advanced filters for 'new' and 'loyal' segments
      if (clientFilter === 'new' || clientFilter === 'loyal') {
        clientsData = applyAdvancedFilters(clientsData as Client[], clientFilter) as ClientMinimal[];
      }

      const hasMoreResults = clientsData.length === PAGE_SIZE;
      const lastCursor = clientsData[clientsData.length - 1]?.updated_at || null;

      clientsCache.set(clientFilter, '', offset, clientsData, hasMoreResults);

      setClients(prev => [...prev, ...(clientsData as Client[])]);
      setHasMore(hasMoreResults);
      setCursor(lastCursor);
      setOffset(prev => prev + PAGE_SIZE);

      const endTime = performance.now();
      console.log('[Clientes] source=server', {
        page: offset / PAGE_SIZE,
        limit: PAGE_SIZE,
        returned: clientsData.length,
        tookMs: Math.round(endTime - startTime)
      });
    } catch (error) {
      console.error('Error loading more clients:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const searchClients = async (query: string) => {
    if (!user || !profile?.company_id) return;

    const startTime = performance.now();
    setLoading(true);

    const cached = clientsCache.get(clientFilter, query, 0);
    if (cached) {
      setClients(cached.data as Client[]);
      setHasMore(false);
      setCursor(null);
      setLoading(false);
      setIsSearching(false);

      const endTime = performance.now();
      console.log('[Clientes] search source=cache', {
        query,
        limit: PAGE_SIZE,
        returned: cached.data.length,
        tookMs: Math.round(endTime - startTime)
      });
      return;
    }

    try {
      let clientQuery = supabase
        .from('clients')
        .select('id, first_name, last_name, phone, email, instagram_handle, created_at, updated_at, is_archived, banned')
        .eq('company_id', profile.company_id);

      if (clientFilter === 'archived') {
        clientQuery = clientQuery.eq('is_archived', true).eq('banned', false);
      } else if (clientFilter === 'banned') {
        clientQuery = clientQuery.eq('banned', true);
      } else {
        clientQuery = clientQuery.eq('is_archived', false).eq('banned', false);
      }

      const { data, error } = await clientQuery
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      let clientsData: ClientMinimal[] = data || [];

      if (clientsData.length > 0) {
        const clientIds = clientsData.map(c => c.id);
        const { data: eventsData } = await supabase
          .from('events')
          .select('client_id')
          .in('client_id', clientIds)
          .neq('status', 'cancelled');

        const appointmentCounts = new Map<string, number>();
        eventsData?.forEach(event => {
          if (event.client_id) {
            appointmentCounts.set(
              event.client_id,
              (appointmentCounts.get(event.client_id) || 0) + 1
            );
          }
        });

        clientsData.forEach(client => {
          client.appointmentCount = appointmentCounts.get(client.id) || 0;
        });
      }

      // Apply advanced filters for 'new' and 'loyal' segments
      if (clientFilter === 'new' || clientFilter === 'loyal') {
        clientsData = applyAdvancedFilters(clientsData as Client[], clientFilter) as ClientMinimal[];
      }

      clientsCache.set(clientFilter, query, 0, clientsData, false);

      setClients(clientsData as Client[]);
      setHasMore(false);
      setCursor(null);

      const endTime = performance.now();
      console.log('[Clientes] search source=server', {
        query,
        limit: PAGE_SIZE,
        returned: clientsData.length,
        tookMs: Math.round(endTime - startTime)
      });
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const applyAdvancedFilters = (clientsList: Client[], filter: ClientFilter): Client[] => {
    if (clientsList.length === 0) return clientsList;

    return clientsList.filter(client => {
      const appointmentCount = client.appointmentCount || 0;

      if (filter === 'new') {
        return appointmentCount === 0;
      }

      if (filter === 'loyal') {
        return appointmentCount >= 2;
      }

      return true;
    });
  };

  const loadGlobalStats = async () => {
    if (!user || !profile?.company_id) return;

    try {
      const now = new Date();
      const fortyFiveDaysAgo = new Date(now);
      fortyFiveDaysAgo.setDate(now.getDate() - 45);
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const { data: allClients } = await supabase
        .from('clients')
        .select('id, created_at')
        .eq('company_id', profile.company_id)
        .eq('is_archived', false)
        .eq('banned', false);

      const clientIds = allClients?.map(c => c.id) || [];

      if (clientIds.length === 0) {
        setGlobalStats({
          activeClients: 0,
          newClients: 0,
          loyalClients: 0,
          atRiskClients: 0,
          averageBasket: 0,
        });
        return;
      }

      const { data: appointments } = await supabase
        .from('events')
        .select('client_id, start_at, status')
        .in('client_id', clientIds)
        .neq('status', 'cancelled');

      const { data: revenues } = await supabase
        .from('revenues')
        .select('client_id, amount, date')
        .in('client_id', clientIds);

      const clientAppointments = new Map<string, Date[]>();
      appointments?.forEach(apt => {
        const date = new Date(apt.start_at);
        if (!clientAppointments.has(apt.client_id)) {
          clientAppointments.set(apt.client_id, []);
        }
        clientAppointments.get(apt.client_id)?.push(date);
      });

      const clientRevenues = new Map<string, { total: number; dates: Date[] }>();
      revenues?.forEach(rev => {
        if (!clientRevenues.has(rev.client_id)) {
          clientRevenues.set(rev.client_id, { total: 0, dates: [] });
        }
        const clientRev = clientRevenues.get(rev.client_id)!;
        clientRev.total += Number(rev.amount);
        clientRev.dates.push(new Date(rev.date));
      });

      let activeClients = 0;
      let newClients = 0;
      let loyalClients = 0;
      let atRiskClients = 0;
      let totalRevenue = 0;
      let clientsWithRevenue = 0;

      allClients?.forEach(client => {
        const apts = clientAppointments.get(client.id) || [];
        const revData = clientRevenues.get(client.id);
        const revDates = revData?.dates || [];

        const allDates = [...apts, ...revDates].filter(d => d < now);
        allDates.sort((a, b) => b.getTime() - a.getTime());

        const lastDate = allDates[0];
        const firstDate = allDates[allDates.length - 1];

        if (lastDate) {
          if (lastDate >= fortyFiveDaysAgo) {
            activeClients++;
          } else if (lastDate < fortyFiveDaysAgo && lastDate >= ninetyDaysAgo) {
            atRiskClients++;
          }
        }

        if (firstDate && firstDate >= thirtyDaysAgo) {
          newClients++;
        }

        // Loyal clients: based on number of appointments (>= 2)
        const appointmentCount = apts.length;
        if (appointmentCount >= 2) {
          loyalClients++;
        }

        if (revData && revData.total > 0) {
          totalRevenue += revData.total;
          clientsWithRevenue++;
        }
      });

      const averageBasket = clientsWithRevenue > 0 ? totalRevenue / clientsWithRevenue : 0;

      setGlobalStats({
        activeClients,
        newClients,
        loyalClients,
        atRiskClients,
        averageBasket,
      });
    } catch (error) {
      console.error('Error loading global stats:', error);
    }
  };

  const loadServices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, category, duration')
        .eq('user_id', user.id)
        .in('status', ['active', 'hidden'])
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const openClientDetails = (client: Client) => {
    console.log('Opening client details for:', client.first_name, client.last_name, client.id);
    setSelectedClientId(client.id);
  };

  const handleArchiveClient = async () => {
    if (!clientToArchive) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_archived: !clientToArchive.is_archived })
        .eq('id', clientToArchive.id);

      if (error) throw error;

      clientsCache.invalidate();
      setShowArchiveModal(false);
      setClientToArchive(null);
      loadClients();
    } catch (error) {
      console.error('Error archiving/unarchiving client:', error);
      alert('Erreur lors de l\'opération');
    }
  };

  const handleBanClient = async () => {
    if (!clientToBan) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          banned: true,
          banned_at: new Date().toISOString()
        })
        .eq('id', clientToBan.id);

      if (error) throw error;

      clientsCache.invalidate();
      setShowBanModal(false);
      setClientToBan(null);
      loadClients();
    } catch (error) {
      console.error('Error banning client:', error);
      alert('Erreur lors du bannissement');
    }
  };

  const handleAddClient = async (formData: any, customData: Record<string, string>) => {
    try {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user!.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          email: formData.email || null,
          instagram_handle: formData.instagram_handle || null,
          birth_date: formData.birth_date || null,
          notes: formData.notes || null,
          nail_type: formData.nail_type || null,
          skin_type: formData.skin_type || null,
          hair_type: formData.hair_type || null,
          scalp_type: formData.scalp_type || null,
          lash_type: formData.lash_type || null,
          brow_type: formData.brow_type || null,
          skin_conditions: formData.skin_conditions || [],
          is_fidele: formData.is_fidele || false,
          is_vip: formData.is_vip || false,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      if (newClient && Object.keys(customData).length > 0) {
        const customDataInserts = Object.entries(customData).map(([fieldId, value]) => ({
          client_id: newClient.id,
          field_id: fieldId,
          field_value: value,
        }));

        const { error: customDataError } = await supabase
          .from('client_custom_data')
          .insert(customDataInserts);

        if (customDataError) throw customDataError;
      }

      clientsCache.invalidate();
      loadClients();
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  const handleEditClient = async (formData: any, customData: Record<string, string>) => {
    if (!editingClient) return;

    try {
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          email: formData.email || null,
          instagram_handle: formData.instagram_handle || null,
          birth_date: formData.birth_date || null,
          notes: formData.notes || null,
          nail_type: formData.nail_type || null,
          skin_type: formData.skin_type || null,
          hair_type: formData.hair_type || null,
          scalp_type: formData.scalp_type || null,
          lash_type: formData.lash_type || null,
          brow_type: formData.brow_type || null,
          skin_conditions: formData.skin_conditions || [],
          is_fidele: formData.is_fidele || false,
          is_vip: formData.is_vip || false,
        })
        .eq('id', editingClient.id);

      if (clientError) throw clientError;

      await supabase
        .from('client_custom_data')
        .delete()
        .eq('client_id', editingClient.id);

      if (Object.keys(customData).length > 0) {
        const customDataInserts = Object.entries(customData).map(([fieldId, value]) => ({
          client_id: editingClient.id,
          field_id: fieldId,
          field_value: value,
        }));

        const { error: customDataError } = await supabase
          .from('client_custom_data')
          .insert(customDataInserts);

        if (customDataError) throw customDataError;
      }

      clientsCache.invalidate();
      setEditingClient(null);
      loadClients();
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const getClientTagBadge = (client: Client) => {
    const tag = getClientTag({
      appointmentCount: client.appointmentCount || 0,
      createdAt: client.created_at
    });

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tag.class}`}>
        {tag.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gestion des clientes</h1>
          <p className="text-sm sm:text-base text-gray-600">Gérez vos clientes et leur historique</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border-2 border-belleya-primary text-belleya-primary rounded-lg hover:bg-belleya-50 transition-all shadow-sm text-sm sm:text-base"
          >
            <Upload className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden sm:inline">Importer</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-belleya-primary to-[#f06bb4] text-white rounded-lg hover:from-belleya-deep hover:to-belleya-primary transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden sm:inline">Nouvelle cliente</span>
            <span className="sm:hidden">Nouvelle</span>
          </button>
        </div>
      </div>

      <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-full">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-6 h-6 text-belleya-primary" />
            <InfoTooltip content="Total des clientes actives (non archivées, non bannies)" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalClientsCount}</p>
          <p className="text-sm font-medium text-gray-700">Total clientes</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <UserPlus className="w-6 h-6 text-green-500" />
            <InfoTooltip content="Nouvelles clientes inscrites dans les 30 derniers jours" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{globalStats.newClients}</p>
          <p className="text-sm font-medium text-gray-700">Nouvelles clientes</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <Star className="w-6 h-6 text-yellow-500" />
            <InfoTooltip content="Clientes ayant effectué au moins 2 rendez-vous" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{globalStats.loyalClients}</p>
          <p className="text-sm font-medium text-gray-700">Clientes fidèles</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-6 h-6 text-blue-500" />
            <InfoTooltip content="Montant moyen dépensé par cliente" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{globalStats.averageBasket.toFixed(0)} €</p>
          <p className="text-sm font-medium text-gray-700">Panier moyen</p>
        </div>
      </div>

      <div className="mb-6 w-full max-w-full overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible scrollbar-hide">
          <button
            onClick={() => setClientFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              clientFilter === 'all'
                ? 'bg-[#E51E8F] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setClientFilter('new')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              clientFilter === 'new'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Nouvelles
          </button>
          <button
            onClick={() => setClientFilter('loyal')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              clientFilter === 'loyal'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Fidèles
          </button>
          <button
            onClick={() => setClientFilter('archived')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              clientFilter === 'archived'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Archive className="w-4 h-4 inline mr-1" />
            Archivées
          </button>
          <button
            onClick={() => setClientFilter('banned')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              clientFilter === 'banned'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <XCircle className="w-4 h-4 inline mr-1" />
            Bannies
          </button>
        </div>

        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div
            key={client.id}
            onClick={() => openClientDetails(client)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative cursor-pointer"
          >
            <div className="absolute top-4 right-4 flex gap-1">
              {clientFilter !== 'archived' && clientFilter !== 'banned' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setClientToBan(client);
                      setShowBanModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Banir"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setClientToArchive(client);
                      setShowArchiveModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Archiver"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </>
              )}
              {clientFilter === 'archived' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setClientToArchive(client);
                    setShowArchiveModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Désarchiver"
                >
                  <ArchiveRestore className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-start justify-between mb-4 pr-10">
              <div className="flex items-center gap-3">
                {client.photo_url ? (
                  <img
                    src={client.photo_url}
                    alt={`${client.first_name} ${client.last_name}`}
                    className="w-12 h-12 object-cover rounded-full border-2 border-belleya-100"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-belleya-100 to-belleya-50 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-belleya-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {client.first_name} {client.last_name}
                  </h3>
                  {getClientTagBadge(client)}
                </div>
              </div>
              {(client.appointmentCount || 0) >= 10 && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
            </div>

            <div className="space-y-2">
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </div>
              )}
              {client.instagram_handle && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Instagram className="w-4 h-4" />
                  @{client.instagram_handle}
                </div>
              )}
            </div>

            {client.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 line-clamp-2">{client.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && !isSearching && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMoreClients}
            disabled={loadingMore}
            className="px-6 py-3 bg-white border-2 border-belleya-primary text-belleya-primary rounded-lg hover:bg-belleya-50 transition-all shadow-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Chargement...
              </>
            ) : (
              'Charger plus'
            )}
          </button>
        </div>
      )}

      {showAddModal && (
        <ClientForm
          isEdit={false}
          onSubmit={handleAddClient}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && editingClient && (
        <ClientForm
          isEdit={true}
          clientId={editingClient.id}
          initialData={{
            first_name: editingClient.first_name,
            last_name: editingClient.last_name,
            phone: editingClient.phone || '',
            email: editingClient.email || '',
            instagram_handle: editingClient.instagram_handle || '',
            birth_date: editingClient.birth_date || '',
            notes: editingClient.notes || '',
            nail_type: editingClient.nail_type || '',
            skin_type: editingClient.skin_type || '',
            hair_type: editingClient.hair_type || '',
            scalp_type: editingClient.scalp_type || '',
            lash_type: editingClient.lash_type || '',
            brow_type: editingClient.brow_type || '',
            skin_conditions: editingClient.skin_conditions || [],
            is_fidele: editingClient.is_fidele || false,
            is_vip: editingClient.is_vip || false,
          }}
          onSubmit={handleEditClient}
          onClose={() => {
            setShowEditModal(false);
            setEditingClient(null);
          }}
        />
      )}

      {selectedClientId && (
        <ClientDetailDrawer
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
          onDeleted={() => {
            setSelectedClientId(null);
            loadClients();
          }}
          onUpdated={loadClients}
          onEdit={(client) => {
            setSelectedClientId(null);
            setEditingClient(client);
            setShowEditModal(true);
          }}
          onAddRevenue={(clientId) => {
            const client = clients.find(c => c.id === clientId);
            if (client) {
              setClientForRevenue(client);
              setShowCreateRevenueModal(true);
            }
          }}
          onAddAppointment={(clientId) => {
            const client = clients.find(c => c.id === clientId);
            if (client) {
              setClientForAppointment(client);
              setShowCreateAppointmentModal(true);
            }
          }}
        />
      )}

      {showCreateAppointmentModal && clientForAppointment && (
        <CreateAppointmentModal
          clientId={clientForAppointment.id}
          clientName={`${clientForAppointment.first_name} ${clientForAppointment.last_name}`}
          onClose={() => {
            setShowCreateAppointmentModal(false);
            setClientForAppointment(null);
          }}
          onCreated={() => {
            loadClients();
            if (selectedClientId) {
              setSelectedClientId(null);
              setTimeout(() => setSelectedClientId(clientForAppointment.id), 100);
            }
          }}
        />
      )}

      {showCreateRevenueModal && clientForRevenue && (
        <CreateRevenueModal
          clientId={clientForRevenue.id}
          clientName={`${clientForRevenue.first_name} ${clientForRevenue.last_name}`}
          onClose={() => {
            setShowCreateRevenueModal(false);
            setClientForRevenue(null);
          }}
          onCreated={() => {
            loadClients();
            if (selectedClientId) {
              setSelectedClientId(null);
              setTimeout(() => setSelectedClientId(clientForRevenue.id), 100);
            }
          }}
        />
      )}

      {showArchiveModal && clientToArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                clientToArchive.is_archived ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {clientToArchive.is_archived ? (
                  <ArchiveRestore className="w-6 h-6 text-green-600" />
                ) : (
                  <Archive className="w-6 h-6 text-orange-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {clientToArchive.is_archived ? 'Désarchiver cette cliente ?' : 'Archiver cette cliente ?'}
                </h3>
                <p className="text-sm text-gray-600">
                  {clientToArchive.first_name} {clientToArchive.last_name}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              {clientToArchive.is_archived
                ? 'Cette cliente sera restaurée et apparaîtra à nouveau dans la liste active.'
                : 'Vous pourrez la retrouver dans le filtre "Archivées". Les données ne seront pas supprimées.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setClientToArchive(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleArchiveClient}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  clientToArchive.is_archived
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {clientToArchive.is_archived ? 'Désarchiver' : 'Archiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBanModal && clientToBan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Banir cette cliente ?
                </h3>
                <p className="text-sm text-gray-600">
                  {clientToBan.first_name} {clientToBan.last_name}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Cette cliente sera bannie et n'apparaîtra plus dans les listes actives.
              Vous pourrez la retrouver dans le filtre "Bannies".
              Les données historiques seront conservées.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setClientToBan(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleBanClient}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Banir
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportClientsModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={loadClients}
        />
      )}
    </div>
  );
}
