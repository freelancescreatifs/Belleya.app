import { useState, useEffect } from 'react';
import { X, Edit, Trash2, ArchiveRestore, Upload, Phone, Mail, Instagram, Calendar, Plus, Euro, TrendingUp, Award, Gift, Clock, Activity, Cake } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getClientTag } from '../../lib/clientTagHelpers';
import SupplementsDisplay from '../shared/SupplementsDisplay';
import ClientGallery from './ClientGallery';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  instagram_handle: string | null;
  status: 'regular' | 'vip' | 'at_risk';
  skin_type: string | null;
  nail_type: string | null;
  notes: string | null;
  photo_url: string | null;
  birth_date: string | null;
  loyalty_points: number;
  is_archived: boolean;
  created_at: string;
}

interface Revenue {
  id: string;
  date: string;
  amount: number;
  revenue_type: string;
  payment_method: string;
  service_name: string | null;
  notes: string | null;
  supplements?: Array<{
    id: string;
    name: string;
    price: number;
    duration_minutes?: number;
  }>;
}

interface ClientStats {
  clientSince: string | null;
  lastAppointment: string | null;
  nextAppointment: string | null;
  totalSpent: number;
  totalVisits: number;
  totalAppointments: number;
  completedAppointments: number;
  averageFrequencyDays: number | null;
  clientStatus: 'new' | 'active' | 'loyal' | 'at_risk' | 'inactive';
}

interface Appointment {
  id: string;
  start_at: string;
  end_at: string;
  title: string;
  status: string;
  notes: string | null;
}

interface RevenueBreakdown {
  service_name: string;
  total: number;
  count: number;
}

interface ClientDetailDrawerProps {
  clientId: string;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
  onEdit?: (client: Client) => void;
  onAddRevenue?: (clientId: string) => void;
  onAddAppointment?: (clientId: string) => void;
}

export default function ClientDetailDrawer({
  clientId,
  onClose,
  onDeleted,
  onUpdated,
  onEdit,
  onAddRevenue,
  onAddAppointment,
}: ClientDetailDrawerProps) {
  const { user, profile } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    clientSince: null,
    lastAppointment: null,
    nextAppointment: null,
    totalSpent: 0,
    totalVisits: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    averageFrequencyDays: null,
    clientStatus: 'new',
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'gallery' | 'history' | 'appointments'>('info');

  useEffect(() => {
    if (clientId) {
      console.log('[ClientDetailDrawer] Loading data for client:', clientId);
      loadClient();
      loadRevenues();
      loadAppointments();
      loadStats();
    }
  }, [clientId]);

  async function loadClient() {
    if (!user) return;

    try {
      console.log('[ClientDetailDrawer] Loading client with ID:', clientId);
      console.log('[ClientDetailDrawer] Current user ID:', user.id);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (error) {
        console.error('[ClientDetailDrawer] Error loading client:', error);
        throw error;
      }

      if (!data) {
        console.error('[ClientDetailDrawer] Client not found or access denied. Client ID:', clientId);
      } else {
        console.log('[ClientDetailDrawer] Client loaded successfully:', data);
      }

      setClient(data);
    } catch (error) {
      console.error('[ClientDetailDrawer] Exception while loading client:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRevenues() {
    if (!user) return;

    try {
      const [revenuesRes, supplementsRes] = await Promise.all([
        supabase
          .from('revenues')
          .select('*')
          .eq('client_id', clientId)
          .order('date', { ascending: false }),
        supabase
          .from('revenue_supplements')
          .select('revenue_id, supplement_id, price_at_time, supplement_name, duration_minutes')
          .order('created_at')
      ]);

      if (revenuesRes.error) throw revenuesRes.error;

      const supplementsData = supplementsRes.data || [];
      const supplementsByRevenue = supplementsData.reduce((acc, supp: any) => {
        if (!acc[supp.revenue_id]) {
          acc[supp.revenue_id] = [];
        }
        acc[supp.revenue_id].push({
          id: supp.supplement_id,
          name: supp.supplement_name || '',
          price: supp.price_at_time,
          duration_minutes: supp.duration_minutes || 0
        });
        return acc;
      }, {} as Record<string, any[]>);

      const revenuesWithSupplements = (revenuesRes.data || []).map(revenue => ({
        ...revenue,
        supplements: supplementsByRevenue[revenue.id] || []
      }));

      console.log('[ClientDetailDrawer] Revenues loaded:', revenuesWithSupplements?.length || 0, 'items');
      setRevenues(revenuesWithSupplements);

      const breakdown = (revenuesWithSupplements || []).reduce((acc, rev) => {
        const serviceName = rev.service_name || 'Non spécifié';
        const existing = acc.find(item => item.service_name === serviceName);
        if (existing) {
          existing.total += Number(rev.amount);
          existing.count += 1;
        } else {
          acc.push({
            service_name: serviceName,
            total: Number(rev.amount),
            count: 1,
          });
        }
        return acc;
      }, [] as RevenueBreakdown[]);

      breakdown.sort((a, b) => b.total - a.total);
      setRevenueBreakdown(breakdown);
    } catch (error) {
      console.error('Error loading revenues:', error);
    }
  }

  async function loadAppointments() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, start_at, end_at, title, status, notes')
        .eq('client_id', clientId)
        .order('start_at', { ascending: false });

      if (error) throw error;
      console.log('[ClientDetailDrawer] Appointments loaded:', data?.length || 0, 'items');
      setAppointments(data || []);
    } catch (error) {
      console.error('[ClientDetailDrawer] Error loading appointments:', error);
    }
  }

  async function loadStats() {
    if (!user) return;

    try {
      const { data: revenueData } = await supabase
        .from('revenues')
        .select('date, amount')
        .eq('client_id', clientId)
        .order('date', { ascending: true });

      const totalSpent = revenueData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const totalVisits = revenueData?.length || 0;
      const clientSince = revenueData?.[0]?.date || null;

      const now = new Date().toISOString();

      const { data: allAppointments } = await supabase
        .from('events')
        .select('start_at, status')
        .eq('client_id', clientId)
        .order('start_at', { ascending: true });

      const validAppointments = allAppointments?.filter(a => a.status !== 'cancelled') || [];
      const totalAppointments = validAppointments.length;
      const completedAppointments = validAppointments.filter(a => new Date(a.start_at) < new Date()).length;

      const { data: pastAppointments } = await supabase
        .from('events')
        .select('start_at')
        .eq('client_id', clientId)
        .lt('start_at', now)
        .neq('status', 'cancelled')
        .order('start_at', { ascending: false })
        .limit(1);

      const { data: futureAppointments } = await supabase
        .from('events')
        .select('start_at')
        .eq('client_id', clientId)
        .gt('start_at', now)
        .neq('status', 'cancelled')
        .order('start_at', { ascending: true })
        .limit(1);

      const lastAppointment = pastAppointments?.[0]?.start_at || null;
      const nextAppointment = futureAppointments?.[0]?.start_at || null;

      let averageFrequencyDays: number | null = null;
      if (completedAppointments >= 2) {
        const completedDates = validAppointments
          .filter(a => new Date(a.start_at) < new Date())
          .map(a => new Date(a.start_at).getTime());

        if (completedDates.length >= 2) {
          const intervals: number[] = [];
          for (let i = 1; i < completedDates.length; i++) {
            intervals.push((completedDates[i] - completedDates[i - 1]) / (1000 * 60 * 60 * 24));
          }
          averageFrequencyDays = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
        }
      }

      const daysSinceCreation = clientSince
        ? Math.floor((new Date().getTime() - new Date(clientSince).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let clientStatus: 'new' | 'active' | 'loyal' | 'at_risk' | 'inactive' = 'new';

      if (completedAppointments >= 10) {
        clientStatus = 'loyal';
      } else if (completedAppointments >= 2) {
        clientStatus = 'loyal';
      } else if (completedAppointments === 1 && daysSinceCreation >= 30) {
        clientStatus = 'active';
      } else {
        clientStatus = 'new';
      }

      const calculatedStats = {
        clientSince,
        lastAppointment,
        nextAppointment,
        totalSpent,
        totalVisits,
        totalAppointments,
        completedAppointments,
        averageFrequencyDays,
        clientStatus,
      };

      console.log('[ClientDetailDrawer] Stats calculated:', calculatedStats);
      setStats(calculatedStats);
    } catch (error) {
      console.error('[ClientDetailDrawer] Error loading stats:', error);
    }
  }

  async function handleDelete() {
    if (!client) return;

    const isArchiving = !client.is_archived;
    const message = isArchiving
      ? `Archiver ${client.first_name} ${client.last_name} ?\n\nVous pourrez la retrouver dans le filtre "Archivées".`
      : `Désarchiver ${client.first_name} ${client.last_name} ?\n\nElle réapparaîtra dans votre liste de clientes actives.`;

    if (!confirm(message)) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_archived: isArchiving })
        .eq('id', client.id);

      if (error) throw error;
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Error updating client archive status:', error);
      alert('Erreur lors de la mise à jour');
    }
  }

  async function handlePhotoUpload(file: File) {
    if (!client || !user) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('La photo est trop grande. Taille maximum: 5 MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez JPG, PNG ou WEBP');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/clients/${client.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(fileName);

      const newPhotoUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('clients')
        .update({ photo_url: newPhotoUrl })
        .eq('id', client.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setClient({ ...client, photo_url: newPhotoUrl });
      alert('Photo mise à jour avec succès');
      onUpdated();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(`Erreur lors de l'upload: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setUploading(false);
    }
  }

  const computedClientTag = getClientTag({
    appointmentCount: stats.completedAppointments,
    createdAt: stats.clientSince || new Date().toISOString()
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-red-600">Cliente introuvable</div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }


  console.log('[ClientDetailDrawer] Rendering with:', {
    client: client.first_name + ' ' + client.last_name,
    revenues: revenues.length,
    appointments: appointments.length,
    stats,
    activeTab,
    hasOnAddRevenue: !!onAddRevenue,
    hasOnAddAppointment: !!onAddAppointment,
    showLoyaltyProgram: stats.clientStatus === 'loyal' || stats.completedAppointments >= 3,
    companyId: profile?.company_id,
    showGallery: !!profile?.company_id,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
              {client.first_name} {client.last_name}
            </h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${computedClientTag.class} mt-1`}>
              {computedClientTag.label}
            </span>
          </div>
          <div className="flex gap-1 md:gap-2 flex-shrink-0 ml-2">
            <button
              onClick={() => onEdit && client && onEdit(client)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              title="Modifier"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className={`p-2 rounded-lg transition-colors touch-manipulation ${
                client.is_archived
                  ? 'hover:bg-green-50 text-belleya-bright'
                  : 'hover:bg-orange-50 text-orange-600'
              }`}
              title={client.is_archived ? 'Désarchiver' : 'Archiver'}
            >
              {client.is_archived ? (
                <ArchiveRestore className="w-5 h-5" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative">
                {client.photo_url ? (
                  <img
                    src={client.photo_url}
                    alt={`${client.first_name} ${client.last_name}`}
                    className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-300">
                    <span className="text-3xl md:text-4xl text-gray-400">
                      {client.first_name[0]}{client.last_name[0]}
                    </span>
                  </div>
                )}
                <label className={`absolute bottom-0 right-0 p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-colors touch-manipulation ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="bg-blue-50 rounded-lg md:rounded-xl p-2 md:p-3">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
                    <p className="text-[10px] md:text-xs text-blue-600 font-medium truncate">Cliente depuis</p>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-blue-900 truncate">
                    {stats.clientSince ? new Date(stats.clientSince).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg md:rounded-xl p-2 md:p-3">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <Euro className="w-3 h-3 md:w-4 md:h-4 text-belleya-bright flex-shrink-0" />
                    <p className="text-[10px] md:text-xs text-belleya-bright font-medium truncate">Total dépensé</p>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-green-900 truncate">
                    {stats.totalSpent.toFixed(2)} €
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg md:rounded-xl p-2 md:p-3">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-purple-600 flex-shrink-0" />
                    <p className="text-[10px] md:text-xs text-purple-600 font-medium truncate">Dernier RDV</p>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-purple-900 truncate">
                    {stats.lastAppointment ? new Date(stats.lastAppointment).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg md:rounded-xl p-2 md:p-3">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-orange-600 flex-shrink-0" />
                    <p className="text-[10px] md:text-xs text-orange-600 font-medium truncate">Prochain RDV</p>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-orange-900 truncate">
                    {stats.nextAppointment ? new Date(stats.nextAppointment).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="bg-gray-50 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.completedAppointments}</p>
                  <p className="text-[10px] md:text-xs text-gray-600">RDV réalisés</p>
                </div>
                <div className="bg-gray-50 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
                  <p className="text-lg md:text-2xl font-bold text-gray-900">
                    {stats.averageFrequencyDays ? `${stats.averageFrequencyDays}j` : '—'}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-600">Fréquence moy.</p>
                </div>
                <div className="bg-gray-50 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{client?.loyalty_points || 0}</p>
                  <p className="text-[10px] md:text-xs text-gray-600">Points fidélité</p>
                </div>
              </div>
            </div>
          </div>

          {(stats.clientStatus === 'loyal' || stats.completedAppointments >= 3) && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-bold text-yellow-900">Programme de fidélité</h3>
                </div>
                {stats.clientStatus === 'loyal' && (
                  <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    Cliente fidèle
                  </span>
                )}
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-700">Progression vers récompense</span>
                  <span className="font-bold text-yellow-900">{stats.completedAppointments} / 10 RDV</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.completedAppointments / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-yellow-700">
                {10 - stats.completedAppointments > 0
                  ? `Plus que ${10 - stats.completedAppointments} RDV pour débloquer une récompense !`
                  : 'Récompense débloquée ! 🎉'}
              </p>
            </div>
          )}

          <div className="flex gap-2 md:gap-3">
            {onAddRevenue && (
              <button
                onClick={() => onAddRevenue(client.id)}
                className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm md:text-base touch-manipulation"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Ajouter une recette</span>
                <span className="sm:hidden">Recette</span>
              </button>
            )}
            {onAddAppointment && (
              <button
                onClick={() => onAddAppointment(client.id)}
                className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base touch-manipulation"
              >
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Prendre RDV</span>
                <span className="sm:hidden">RDV</span>
              </button>
            )}
          </div>

          <div className="border-b border-gray-200 -mx-4 md:mx-0">
            <div className="flex gap-2 md:gap-4 px-4 md:px-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-3 md:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                  activeTab === 'info'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Informations
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-3 md:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                  activeTab === 'gallery'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Galerie
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 md:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                  activeTab === 'history'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">Recettes ({revenues.length})</span>
                <span className="sm:hidden">€ ({revenues.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-3 md:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                  activeTab === 'appointments'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">Rendez-vous ({appointments.length})</span>
                <span className="sm:hidden">RDV ({appointments.length})</span>
              </button>
            </div>
          </div>

          {activeTab === 'info' && (
            <div className="space-y-3 md:space-y-4">
              {client.phone && (
                <div className="flex items-center gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${client.phone}`} className="text-sm md:text-base text-gray-900 hover:text-brand-600 transition-colors">{client.phone}</a>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${client.email}`} className="text-sm md:text-base text-gray-900 hover:text-brand-600 transition-colors break-all">{client.email}</a>
                </div>
              )}
              {client.instagram_handle && (
                <div className="flex items-center gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                  <Instagram className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  <a href={`https://instagram.com/${client.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="text-sm md:text-base text-gray-900 hover:text-brand-600 transition-colors">@{client.instagram_handle}</a>
                </div>
              )}
              {client.birth_date && (
                <div className="flex items-start gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                  <Cake className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm md:text-base text-gray-900 block">{new Date(client.birth_date).toLocaleDateString('fr-FR')}</span>
                    <span className="text-xs md:text-sm text-gray-500 block">
                      {new Date().getFullYear() - new Date(client.birth_date).getFullYear()} ans
                    </span>
                  </div>
                </div>
              )}
              {client.nail_type && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Type d'ongles</p>
                  <p className="text-sm md:text-base text-gray-900 capitalize">{client.nail_type}</p>
                </div>
              )}
              {client.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Notes</p>
                  <p className="text-sm md:text-base text-gray-900 whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div>
              {profile?.company_id ? (
                <ClientGallery clientId={clientId} companyId={profile.company_id} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Chargement...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {revenueBreakdown.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Dépenses par prestation
                  </h3>
                  <div className="space-y-2">
                    {revenueBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">{item.service_name}</p>
                          <p className="text-xs text-blue-600">{item.count} fois</p>
                        </div>
                        <p className="text-sm font-bold text-blue-900">{item.total.toFixed(2)} €</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">Historique des recettes</h3>
                {revenues.length > 0 ? (
                  revenues.map((revenue) => (
                    <div
                      key={revenue.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {revenue.service_name || 'Service non spécifié'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(revenue.date).toLocaleDateString('fr-FR')} • {revenue.payment_method}
                        </p>
                        {revenue.supplements && revenue.supplements.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <SupplementsDisplay
                              supplements={revenue.supplements}
                              serviceType="prestation"
                            />
                          </div>
                        )}
                        {revenue.notes && (
                          <p className="text-sm text-gray-500 mt-1">{revenue.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-belleya-bright">
                          {Number(revenue.amount).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Aucune recette enregistrée pour cette cliente
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Historique des rendez-vous</h3>
              {appointments.length > 0 ? (
                appointments.map((apt) => {
                  const isPast = new Date(apt.start_at) < new Date();
                  const isCancelled = apt.status === 'cancelled';

                  return (
                    <div
                      key={apt.id}
                      className={`p-4 rounded-lg border-2 ${
                        isCancelled
                          ? 'bg-gray-50 border-gray-300'
                          : isPast
                          ? 'bg-green-50 border-belleya-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className={`w-4 h-4 ${
                              isCancelled ? 'text-gray-500' : isPast ? 'text-belleya-bright' : 'text-blue-600'
                            }`} />
                            <p className={`font-medium ${
                              isCancelled ? 'text-gray-600 line-through' : 'text-gray-900'
                            }`}>
                              {apt.title}
                            </p>
                          </div>
                          <p className={`text-sm ${isCancelled ? 'text-gray-500' : 'text-gray-600'}`}>
                            {new Date(apt.start_at).toLocaleDateString('fr-FR')} à{' '}
                            {new Date(apt.start_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {apt.notes && (
                            <p className="text-sm text-gray-500 mt-1">{apt.notes}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isCancelled
                            ? 'bg-gray-200 text-gray-700'
                            : isPast
                            ? 'bg-green-200 text-green-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}>
                          {isCancelled ? 'Annulé' : isPast ? 'Terminé' : 'À venir'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Aucun rendez-vous enregistré pour cette cliente
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
