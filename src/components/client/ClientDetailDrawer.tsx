import { useState, useEffect, useRef } from 'react';
import { X, Pencil, Trash2, ArchiveRestore, Upload, Phone, Mail, Instagram, Calendar, Plus, Euro, TrendingUp, Award, Gift, Clock, Activity, Cake, ClipboardList, Send, Eye, ChevronDown, ChevronUp, Check, FileText, Loader, MailCheck, Download, AlertCircle, CheckCircle, Paperclip } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import { useAuth } from '../../contexts/AuthContext';
import { getClientTag } from '../../lib/clientTagHelpers';
import SupplementsDisplay from '../shared/SupplementsDisplay';
import BelayaLoader from '../shared/BelayaLoader';
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
  belaya_user_id: string | null;
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

interface QuestionnaireSubmission {
  id: string;
  questionnaire_id: string;
  service_id: string;
  status: 'sent' | 'pending' | 'completed';
  responses: Record<string, any>;
  sent_at: string;
  completed_at: string | null;
  questionnaire_title: string;
  questionnaire_fields: Array<{ id: string; label: string; type: string; required: boolean; options?: string[] }>;
  service_name: string;
}

interface QuoteRequest {
  id: string;
  service_id: string;
  service_name: string;
  preferred_date: string | null;
  preferred_time: string | null;
  client_phone: string;
  questionnaire_responses: Record<string, any>;
  questionnaire_fields: Array<{ id: string; label: string; type: string; required: boolean; options?: string[] }>;
  questionnaire_title: string | null;
  status: string;
  provider_notes: string | null;
  created_at: string;
}

interface AvailableQuestionnaire {
  id: string;
  title: string;
  service_id: string;
  service_name: string;
}

interface ClientDocument {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  file_type: string;
  notes: string | null;
  status: 'pending' | 'viewed' | 'returned';
  returned_file_url: string | null;
  returned_file_name: string | null;
  returned_at: string | null;
  created_at: string;
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
  const [loyaltySettings, setLoyaltySettings] = useState<{
    loyalty_enabled: boolean;
    loyalty_visits_required: number;
    loyalty_reward_description: string | null;
    loyalty_card_background_url: string | null;
  }>({
    loyalty_enabled: true,
    loyalty_visits_required: 10,
    loyalty_reward_description: null,
    loyalty_card_background_url: null,
  });
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
  const [activeTab, setActiveTab] = useState<'info' | 'gallery' | 'history' | 'appointments' | 'questionnaires'>('info');
  const [submissions, setSubmissions] = useState<QuestionnaireSubmission[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<AvailableQuestionnaire[]>([]);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingWelcome, setSendingWelcome] = useState(false);
  const [welcomeStatus, setWelcomeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docToast, setDocToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (clientId) {
      console.log('[ClientDetailDrawer] Loading data for client:', clientId);
      loadClient();
      loadRevenues();
      loadAppointments();
      loadStats();
      loadSubmissions();
      loadQuoteRequests();
    }
  }, [clientId]);

  useEffect(() => {
    if (user?.id) {
      loadLoyaltySettings();
    }
  }, [user?.id]);

  async function loadLoyaltySettings() {
    try {
      const { data } = await supabase
        .from('company_profiles')
        .select('loyalty_enabled, loyalty_visits_required, loyalty_reward_description, loyalty_card_background_url')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (data) {
        setLoyaltySettings({
          loyalty_enabled: data.loyalty_enabled ?? true,
          loyalty_visits_required: data.loyalty_visits_required ?? 10,
          loyalty_reward_description: data.loyalty_reward_description ?? null,
          loyalty_card_background_url: data.loyalty_card_background_url ?? null,
        });
      }
    } catch (err) {
      console.error('[ClientDetailDrawer] Error loading loyalty settings:', err);
    }
  }

  useEffect(() => {
    if (clientId && profile?.company_id) {
      loadClientDocuments();
    }
  }, [clientId, profile?.company_id]);

  useEffect(() => {
    if (!clientId || !profile?.company_id) return;

    const channel = supabase
      .channel(`client-docs-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_documents',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const updated = payload.new as ClientDocument;
          setClientDocuments((prev) =>
            prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
          );
          if (updated.status === 'returned') {
            setDocToast({ type: 'success', message: `Document "${updated.title}" retourne par la cliente !` });
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, profile?.company_id]);

  useEffect(() => {
    if (docToast) {
      const t = setTimeout(() => setDocToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [docToast]);

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

  async function loadSubmissions() {
    if (!user || !profile?.company_id) return;
    try {
      const { data } = await supabase
        .from('client_questionnaire_submissions')
        .select(`
          id, questionnaire_id, service_id, status, responses,
          sent_at, completed_at,
          service_questionnaires(title, fields),
          services(name)
        `)
        .eq('client_id', clientId)
        .eq('company_id', profile.company_id)
        .order('sent_at', { ascending: false });

      if (data) {
        setSubmissions(data.map((s: any) => ({
          id: s.id,
          questionnaire_id: s.questionnaire_id,
          service_id: s.service_id,
          status: s.status,
          responses: s.responses || {},
          sent_at: s.sent_at,
          completed_at: s.completed_at,
          questionnaire_title: s.service_questionnaires?.title || 'Questionnaire',
          questionnaire_fields: s.service_questionnaires?.fields || [],
          service_name: s.services?.name || 'Service',
        })));
      }
    } catch (error) {
      console.error('[ClientDetailDrawer] Error loading submissions:', error);
    }
  }

  async function loadQuoteRequests() {
    if (!user || !profile?.company_id) return;
    try {
      const clientData = await supabase
        .from('clients')
        .select('belaya_user_id')
        .eq('id', clientId)
        .maybeSingle();

      if (!clientData.data?.belaya_user_id) return;

      const { data } = await supabase
        .from('quote_requests')
        .select(`
          id, service_id, preferred_date, preferred_time,
          client_phone, questionnaire_responses, questionnaire_id,
          status, provider_notes, created_at,
          services(name),
          service_questionnaires(title, fields)
        `)
        .eq('client_user_id', clientData.data.belaya_user_id)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (data) {
        setQuoteRequests(data.map((q: any) => ({
          id: q.id,
          service_id: q.service_id,
          service_name: q.services?.name || 'Service',
          preferred_date: q.preferred_date,
          preferred_time: q.preferred_time,
          client_phone: q.client_phone || '',
          questionnaire_responses: q.questionnaire_responses || {},
          questionnaire_fields: q.service_questionnaires?.fields || [],
          questionnaire_title: q.service_questionnaires?.title || null,
          status: q.status,
          provider_notes: q.provider_notes,
          created_at: q.created_at,
        })));
      }
    } catch (error) {
      console.error('[ClientDetailDrawer] Error loading quote requests:', error);
    }
  }

  async function handleValidateQuote(quoteId: string) {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ status: 'validated', updated_at: new Date().toISOString() })
        .eq('id', quoteId);

      if (error) throw error;

      const quote = quoteRequests.find(q => q.id === quoteId);

      const clientData = await supabase
        .from('clients')
        .select('belaya_user_id')
        .eq('id', clientId)
        .maybeSingle();

      if (clientData.data?.belaya_user_id) {
        await supabase.from('client_notifications').insert({
          user_id: clientData.data.belaya_user_id,
          notification_type: 'info',
          title: 'Devis valide',
          message: `Votre devis pour "${quote?.service_name || 'Service'}" a ete valide. Votre prestataire vous contactera pour confirmer un rendez-vous.`,
        });
      }

      await loadQuoteRequests();
    } catch (error) {
      console.error('[ClientDetailDrawer] Error validating quote:', error);
    }
  }

  async function handleRejectQuote(quoteId: string) {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', quoteId);

      if (error) throw error;
      await loadQuoteRequests();
    } catch (error) {
      console.error('[ClientDetailDrawer] Error rejecting quote:', error);
    }
  }

  async function loadAvailableQuestionnaires() {
    if (!user) return;
    const { data } = await supabase
      .from('service_questionnaires')
      .select('id, title, service_id, services(name)')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (data) {
      const existingPairs = submissions.map(s => `${s.questionnaire_id}`);
      setAvailableQuestionnaires(
        data
          .filter((q: any) => !existingPairs.includes(q.id))
          .map((q: any) => ({
            id: q.id,
            title: q.title,
            service_id: q.service_id,
            service_name: q.services?.name || 'Service',
          }))
      );
    }
    setShowSendModal(true);
  }

  async function sendQuestionnaireManually(questionnaireId: string, svcId: string) {
    if (!user || !profile?.company_id) return;

    const { error } = await supabase
      .from('client_questionnaire_submissions')
      .insert({
        questionnaire_id: questionnaireId,
        client_id: clientId,
        service_id: svcId,
        company_id: profile.company_id,
        status: 'sent',
      });

    if (!error) {
      setShowSendModal(false);
      loadSubmissions();
    }
  }

  async function loadClientDocuments() {
    if (!profile?.company_id) return;
    setDocsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      if (!error && data) setClientDocuments(data);
    } catch (err) {
      console.error('[ClientDetailDrawer] Error loading client documents:', err);
    } finally {
      setDocsLoading(false);
    }
  }

  async function handleDocumentUpload() {
    if (!docUploadFile || !docTitle.trim() || !client || !user || !profile?.company_id) return;

    const maxSize = 20 * 1024 * 1024;
    if (docUploadFile.size > maxSize) {
      setDocToast({ type: 'error', message: 'Fichier trop grand. Maximum 20 MB' });
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(docUploadFile.type)) {
      setDocToast({ type: 'error', message: 'Format non supporte. Utilisez PDF, JPG, PNG ou WEBP' });
      return;
    }

    setUploadingDoc(true);
    try {
      const fileExt = docUploadFile.name.split('.').pop();
      const fileName = `${profile.company_id}/${clientId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, docUploadFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('client-documents')
        .getPublicUrl(fileName);

      const { data: inserted, error: insertError } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          company_id: profile.company_id,
          client_user_id: client.belaya_user_id || null,
          file_url: urlData.publicUrl,
          file_name: docUploadFile.name,
          file_type: docUploadFile.type,
          title: docTitle.trim(),
          notes: docNotes.trim() || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setClientDocuments((prev) => [inserted, ...prev]);

      if (client.email) {
        const { data: company } = await supabase
          .from('company_profiles')
          .select('company_name')
          .eq('id', profile.company_id)
          .maybeSingle();

        await supabase.functions.invoke('send-document-notification', {
          body: {
            clientEmail: client.email,
            clientFirstName: client.first_name,
            providerName: company?.company_name || 'Votre professionnel(le)',
            documentTitle: docTitle.trim(),
            clientAreaUrl: 'https://belaya.app',
          },
        });
      }

      setDocToast({ type: 'success', message: 'Document envoye avec succes !' });
      setShowUploadDocModal(false);
      setDocUploadFile(null);
      setDocTitle('');
      setDocNotes('');
    } catch (err: any) {
      console.error('[ClientDetailDrawer] Error uploading document:', err);
      setDocToast({ type: 'error', message: `Erreur: ${err.message || 'Erreur inconnue'}` });
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleDeleteDocument(docId: string) {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', docId);
      if (error) throw error;
      setClientDocuments((prev) => prev.filter((d) => d.id !== docId));
      setDocToast({ type: 'success', message: 'Document supprime' });
    } catch (err: any) {
      setDocToast({ type: 'error', message: `Erreur: ${err.message}` });
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

  async function handleResendWelcomeEmail() {
    if (!client?.email || !user) return;
    setSendingWelcome(true);
    setWelcomeStatus('idle');
    try {
      const { data: company } = await supabase
        .from('company_profiles')
        .select('company_name, booking_slug')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!company) {
        setWelcomeStatus('error');
        return;
      }

      const { data: result, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          clients: [{ email: client.email, firstName: client.first_name }],
          providerName: company.company_name || 'Votre professionnel(le)',
          bookingSlug: company.booking_slug || null,
        },
      });

      if (error || result?.failed > 0) {
        console.error('Resend welcome email error:', error || result);
        setWelcomeStatus('error');
      } else {
        setWelcomeStatus('success');
      }
    } catch (e) {
      console.error('Resend welcome email failed:', e);
      setWelcomeStatus('error');
    } finally {
      setSendingWelcome(false);
      setTimeout(() => setWelcomeStatus('idle'), 4000);
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
          <BelayaLoader variant="inline" />
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
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className={`p-2 rounded-lg transition-colors touch-manipulation ${
                client.is_archived
                  ? 'hover:bg-green-50 text-belaya-bright'
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
                    <Euro className="w-3 h-3 md:w-4 md:h-4 text-belaya-bright flex-shrink-0" />
                    <p className="text-[10px] md:text-xs text-belaya-bright font-medium truncate">Total dépensé</p>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-green-900 truncate">
                    {stats.totalSpent.toFixed(2)} €
                  </p>
                </div>
                <div className="bg-rose-50 rounded-lg md:rounded-xl p-2 md:p-3">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-rose-600 flex-shrink-0" />
                    <p className="text-[10px] md:text-xs text-rose-600 font-medium truncate">Dernier RDV</p>
                  </div>
                  <p className="text-sm md:text-lg font-bold text-rose-900 truncate">
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

          {loyaltySettings.loyalty_enabled && (
            (() => {
              const visitsRequired = loyaltySettings.loyalty_visits_required || 10;
              const completed = stats.completedAppointments;
              const rewardUnlocked = completed >= visitsRequired;
              const stamps = Array.from({ length: Math.min(visitsRequired, 10) }, (_, i) => i < completed);
              const extraStamps = visitsRequired > 10 ? visitsRequired - 10 : 0;
              return (
                <div
                  className="relative rounded-2xl overflow-hidden shadow-md"
                  style={{
                    background: loyaltySettings.loyalty_card_background_url
                      ? `url(${loyaltySettings.loyalty_card_background_url}) center/cover no-repeat`
                      : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    minHeight: '160px',
                  }}
                >
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="relative p-4 md:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                          Programme fidélité
                        </p>
                        <p className="text-white font-bold text-base leading-tight">
                          {loyaltySettings.loyalty_reward_description || 'Récompense offerte'}
                        </p>
                      </div>
                      {rewardUnlocked ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full shrink-0">
                          <Gift className="w-3 h-3" />
                          Débloqué !
                        </span>
                      ) : (
                        <Gift className="w-7 h-7 text-amber-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {stamps.map((filled, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                            filled
                              ? 'bg-amber-400 border-amber-400'
                              : 'border-white/40 bg-white/10'
                          }`}
                        >
                          {filled && <Award className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />}
                        </div>
                      ))}
                      {extraStamps > 0 && (
                        <span className="text-white/60 text-xs self-center ml-0.5">+{extraStamps}</span>
                      )}
                    </div>

                    <p className="text-white/60 text-xs">
                      {rewardUnlocked
                        ? `${completed} / ${visitsRequired} RDV — Récompense débloquée !`
                        : `${completed} / ${visitsRequired} RDV — encore ${visitsRequired - completed} pour la récompense`
                      }
                    </p>
                  </div>
                </div>
              );
            })()
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
              <button
                onClick={() => setActiveTab('questionnaires')}
                className={`px-3 md:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                  activeTab === 'questionnaires'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">Documents ({submissions.length + clientDocuments.length})</span>
                <span className="sm:hidden">Docs ({submissions.length + clientDocuments.length})</span>
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${client.email}`} className="text-sm md:text-base text-gray-900 hover:text-brand-600 transition-colors break-all flex-1">{client.email}</a>
                    <button
                      onClick={handleResendWelcomeEmail}
                      disabled={sendingWelcome}
                      title="Renvoyer l'email de bienvenue"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed border-brand-200 text-brand-700 hover:bg-brand-50 bg-white"
                    >
                      <span className={sendingWelcome ? 'hidden' : 'flex items-center gap-1.5'}>
                        <MailCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Renvoyer bienvenue</span>
                      </span>
                      <span className={sendingWelcome ? 'flex items-center gap-1.5' : 'hidden'}>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">Envoi...</span>
                      </span>
                    </button>
                  </div>
                  {welcomeStatus === 'success' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Email de bienvenue envoyé avec succes
                    </div>
                  )}
                  {welcomeStatus === 'error' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium">
                      <X className="w-3.5 h-3.5" />
                      Echec de l'envoi. Verifiez la configuration Resend.
                    </div>
                  )}
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

              {quoteRequests.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-brand-600" />
                    Demandes de devis ({quoteRequests.length})
                  </h3>
                  {quoteRequests.map((quote) => (
                    <div key={quote.id} className={`border rounded-xl overflow-hidden ${
                      quote.status === 'validated' ? 'border-green-200' : quote.status === 'rejected' ? 'border-red-200' : 'border-amber-200'
                    }`}>
                      <div
                        className={`flex items-center gap-3 p-3 cursor-pointer ${
                          quote.status === 'validated' ? 'bg-green-50' : quote.status === 'rejected' ? 'bg-red-50' : 'bg-amber-50'
                        }`}
                        onClick={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">{quote.service_name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              quote.status === 'validated' ? 'bg-green-200 text-green-800'
                              : quote.status === 'rejected' ? 'bg-red-200 text-red-800'
                              : 'bg-amber-200 text-amber-800'
                            }`}>
                              {quote.status === 'validated' ? 'Valide' : quote.status === 'rejected' ? 'Refuse' : 'En attente'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Recu le {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                            {quote.preferred_date && ` - Date souhaitee: ${new Date(quote.preferred_date).toLocaleDateString('fr-FR')}`}
                            {quote.preferred_time && ` a ${quote.preferred_time}`}
                          </p>
                        </div>
                        {expandedQuote === quote.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>

                      {expandedQuote === quote.id && (
                        <div className="p-4 border-t border-gray-100 space-y-3">
                          {quote.client_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <a href={`tel:${quote.client_phone}`} className="text-gray-900 hover:text-brand-600">{quote.client_phone}</a>
                            </div>
                          )}

                          {quote.questionnaire_title && quote.questionnaire_fields.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-brand-700">{quote.questionnaire_title}</p>
                              {quote.questionnaire_fields.map((field) => {
                                const response = quote.questionnaire_responses[field.id];
                                return (
                                  <div key={field.id} className="p-2.5 bg-white rounded-lg border border-gray-100">
                                    <p className="text-xs font-medium text-gray-600 mb-0.5">{field.label}</p>
                                    {response !== undefined && response !== null && response !== '' ? (
                                      Array.isArray(response) ? (
                                        <div className="flex flex-wrap gap-1">
                                          {response.map((val: string, i: number) => (
                                            <span key={i} className="px-2 py-0.5 bg-brand-100 text-brand-800 rounded text-xs">{val}</span>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-900">{String(response)}</p>
                                      )
                                    ) : (
                                      <p className="text-sm text-gray-400 italic">Non renseigne</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {quote.status === 'pending' && (
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => handleValidateQuote(quote.id)}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                Valider le devis
                              </button>
                              <button
                                onClick={() => handleRejectQuote(quote.id)}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
                              >
                                Refuser
                              </button>
                            </div>
                          )}

                          {quote.status === 'validated' && (
                            <div className="flex items-center gap-2 p-2 bg-green-100 rounded-lg">
                              <Check className="w-4 h-4 text-green-600" />
                              <p className="text-xs text-green-800 font-medium">Devis valide - le client a ete notifie</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div>
              {profile?.company_id ? (
                <ClientGallery clientId={clientId} companyId={profile.company_id} />
              ) : (
                <BelayaLoader variant="inline" />
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
                        <p className="text-lg font-bold text-belaya-bright">
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
                          ? 'bg-green-50 border-belaya-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className={`w-4 h-4 ${
                              isCancelled ? 'text-gray-500' : isPast ? 'text-belaya-bright' : 'text-blue-600'
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

          {activeTab === 'questionnaires' && (
            <div className="space-y-6">

              {/* Toast notification */}
              {docToast && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                  docToast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {docToast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {docToast.message}
                </div>
              )}

              {/* Questionnaires section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-brand-600" />
                    Questionnaires
                  </h3>
                  <button
                    onClick={loadAvailableQuestionnaires}
                    className="px-3 py-1.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Envoyer
                  </button>
                </div>

                {submissions.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucun questionnaire envoye</p>
                    <p className="text-xs text-gray-400 mt-1">Les questionnaires lies aux services seront envoyes automatiquement lors de la reservation</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div key={sub.id} className={`border rounded-xl overflow-hidden ${
                        sub.status === 'completed' ? 'border-green-200' : sub.status === 'pending' ? 'border-amber-200' : 'border-gray-200'
                      }`}>
                        <div
                          className={`flex items-center gap-3 p-3 cursor-pointer ${
                            sub.status === 'completed' ? 'bg-green-50' : sub.status === 'pending' ? 'bg-amber-50' : 'bg-gray-50'
                          }`}
                          onClick={() => setExpandedSubmission(expandedSubmission === sub.id ? null : sub.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">{sub.questionnaire_title}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                sub.status === 'completed' ? 'bg-green-200 text-green-800'
                                : sub.status === 'pending' ? 'bg-amber-200 text-amber-800'
                                : 'bg-gray-200 text-gray-700'
                              }`}>
                                {sub.status === 'completed' ? 'Complete' : sub.status === 'pending' ? 'En cours' : 'Envoye'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Service: {sub.service_name} - Envoye le {new Date(sub.sent_at).toLocaleDateString('fr-FR')}
                              {sub.completed_at && ` - Complete le ${new Date(sub.completed_at).toLocaleDateString('fr-FR')}`}
                            </p>
                          </div>
                          {expandedSubmission === sub.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>

                        {expandedSubmission === sub.id && sub.status === 'completed' && (
                          <div className="p-4 border-t border-gray-100 space-y-3">
                            {sub.questionnaire_fields.map((field) => {
                              const response = sub.responses[field.id];
                              return (
                                <div key={field.id} className="p-3 bg-white rounded-lg border border-gray-100">
                                  <p className="text-xs font-medium text-gray-600 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                  </p>
                                  {response !== undefined && response !== null && response !== '' ? (
                                    Array.isArray(response) ? (
                                      <div className="flex flex-wrap gap-1">
                                        {response.map((val: string, i: number) => (
                                          <span key={i} className="px-2 py-0.5 bg-brand-100 text-brand-800 rounded text-xs">{val}</span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-900">{String(response)}</p>
                                    )
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">Non renseigne</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {expandedSubmission === sub.id && sub.status !== 'completed' && (
                          <div className="p-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 text-center">
                              En attente de la reponse du client
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* File documents section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-brand-600" />
                    Fichiers partages
                  </h3>
                  <button
                    onClick={() => setShowUploadDocModal(true)}
                    className="px-3 py-1.5 text-xs font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    Ajouter un fichier
                  </button>
                </div>

                {docsLoading ? (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : clientDocuments.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucun fichier partage</p>
                    <p className="text-xs text-gray-400 mt-1">Envoyez des PDF ou images a signer/remplir</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={`border rounded-xl overflow-hidden ${
                          doc.status === 'returned'
                            ? 'border-green-200 bg-green-50'
                            : doc.status === 'viewed'
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-brand-200 bg-brand-50'
                        }`}
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              doc.status === 'returned' ? 'bg-green-100' : doc.status === 'viewed' ? 'bg-blue-100' : 'bg-brand-100'
                            }`}>
                              <FileText className={`w-4 h-4 ${
                                doc.status === 'returned' ? 'text-green-600' : doc.status === 'viewed' ? 'text-blue-600' : 'text-brand-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                  doc.status === 'returned'
                                    ? 'bg-green-200 text-green-800'
                                    : doc.status === 'viewed'
                                    ? 'bg-blue-200 text-blue-800'
                                    : 'bg-amber-200 text-amber-800'
                                }`}>
                                  {doc.status === 'returned' ? 'Retourne' : doc.status === 'viewed' ? 'Consulte' : 'En attente'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {doc.file_name} &bull; {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                              </p>
                              {doc.notes && (
                                <p className="text-xs text-gray-600 mt-1 italic">{doc.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              Telecharger
                            </a>
                            {doc.status === 'returned' && doc.returned_file_url && (
                              <a
                                href={doc.returned_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Voir le retour
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {doc.status === 'returned' && doc.returned_file_name && (
                            <div className="mt-2 flex items-center gap-2 p-2 bg-green-100 rounded-lg">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                              <p className="text-xs text-green-800 truncate">
                                Retourne : {doc.returned_file_name}
                                {doc.returned_at && ` le ${new Date(doc.returned_at).toLocaleDateString('fr-FR')}`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[70vh] flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Envoyer un questionnaire</h3>
              <button onClick={() => setShowSendModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {availableQuestionnaires.length === 0 ? (
                <div className="text-center py-6">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun questionnaire disponible</p>
                  <p className="text-xs text-gray-400 mt-1">Tous les questionnaires ont deja ete envoyes ou aucun n'a ete cree</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableQuestionnaires.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => sendQuestionnaireManually(q.id, q.service_id)}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-300 transition-all text-left flex items-center gap-3"
                    >
                      <div className="p-2 bg-brand-100 rounded-lg flex-shrink-0">
                        <ClipboardList className="w-4 h-4 text-brand-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{q.title}</p>
                        <p className="text-xs text-gray-500">Service: {q.service_name}</p>
                      </div>
                      <Send className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showUploadDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Partager un fichier</h3>
              <button
                onClick={() => {
                  setShowUploadDocModal(false);
                  setDocUploadFile(null);
                  setDocTitle('');
                  setDocNotes('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du document <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ex: Fiche sante, Contrat de soins..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fichier (PDF ou image) <span className="text-red-500">*</span></label>
                <input
                  ref={docFileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setDocUploadFile(f);
                  }}
                />
                {docUploadFile ? (
                  <div className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-200 rounded-lg">
                    <FileText className="w-5 h-5 text-brand-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{docUploadFile.name}</p>
                      <p className="text-xs text-gray-500">{(docUploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => setDocUploadFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => docFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-lg p-6 text-center transition-colors group"
                  >
                    <Upload className="w-8 h-8 text-gray-300 group-hover:text-brand-400 mx-auto mb-2 transition-colors" />
                    <p className="text-sm text-gray-500 group-hover:text-brand-600">Cliquer pour choisir un fichier</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, WEBP — max 20 MB</p>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note pour la cliente (optionnel)</label>
                <textarea
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Instructions ou informations supplementaires..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-none"
                />
              </div>

              {!client?.email && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Cette cliente n'a pas d'adresse email. Le document sera visible dans son espace client mais aucun email ne sera envoye.
                </div>
              )}

              <button
                onClick={handleDocumentUpload}
                disabled={!docUploadFile || !docTitle.trim() || uploadingDoc}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {uploadingDoc ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer le fichier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
