import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, Users, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../shared/ToastContainer';

interface Application {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  audience: string | null;
  motivation: string;
  experience_level: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function AffiliateApplicationsTab() {
  const { toasts, showToast, dismissToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (app: Application) => {
    setProcessingId(app.id);
    try {
      const { error: updateError } = await supabase
        .from('affiliate_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', app.id);

      if (updateError) throw updateError;

      const refCode = generateRefCode(app.full_name || app.email);

      const { error: affiliateError } = await supabase
        .from('affiliates')
        .insert({
          user_id: app.user_id,
          ref_code: refCode,
          full_name: app.full_name,
          email: app.email,
          commission_rate: 0.10,
          base_commission_rate: 0.10,
          status: 'active',
          is_active: true,
          level: 'recrue'
        });

      if (affiliateError) throw affiliateError;

      showToast('success', `Candidature de ${app.full_name} acceptee`);
      await loadApplications();
    } catch (err: any) {
      console.error('Error approving application:', err);
      showToast('error', err.message || 'Erreur lors de la validation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (app: Application) => {
    setProcessingId(app.id);
    try {
      const { error } = await supabase
        .from('affiliate_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', app.id);

      if (error) throw error;

      showToast('success', `Candidature de ${app.full_name} refusee`);
      await loadApplications();
    } catch (err: any) {
      console.error('Error rejecting application:', err);
      showToast('error', err.message || 'Erreur lors du refus');
    } finally {
      setProcessingId(null);
    }
  };

  const generateRefCode = (name: string): string => {
    const cleanName = name
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 6)
      .toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleanName || 'REF'}-${random}`;
  };

  const filtered = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = !search ||
      app.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      app.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Demandes d'affiliation</h2>
          <p className="text-sm text-gray-500">
            {pendingCount > 0
              ? `${pendingCount} candidature${pendingCount > 1 ? 's' : ''} en attente`
              : 'Aucune candidature en attente'}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'pending', label: 'En attente' },
          { key: 'approved', label: 'Acceptees' },
          { key: 'rejected', label: 'Refusees' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
            {key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-white/30 px-1.5 py-0.5 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucune candidature trouvee</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      app.status === 'pending' ? 'bg-amber-100' :
                      app.status === 'approved' ? 'bg-emerald-100' :
                      'bg-red-100'
                    }`}>
                      {app.status === 'pending' ? <Clock className="w-5 h-5 text-amber-600" /> :
                       app.status === 'approved' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                       <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{app.full_name}</p>
                      <p className="text-sm text-gray-500 truncate">{app.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {new Date(app.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    {app.status === 'pending' && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApprove(app)}
                          disabled={processingId === app.id}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {processingId === app.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : 'Accepter'}
                        </button>
                        <button
                          onClick={() => handleReject(app)}
                          disabled={processingId === app.id}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {expandedId === app.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {app.phone && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase mb-1">Telephone</p>
                        <p className="text-gray-900">{app.phone}</p>
                      </div>
                    )}
                    {app.instagram_url && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase mb-1">Instagram</p>
                        <a href={app.instagram_url.startsWith('http') ? app.instagram_url : `https://instagram.com/${app.instagram_url.replace('@', '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-brand-600 hover:underline flex items-center gap-1">
                          {app.instagram_url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {app.tiktok_url && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase mb-1">TikTok</p>
                        <p className="text-gray-900">{app.tiktok_url}</p>
                      </div>
                    )}
                    {app.linkedin_url && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase mb-1">LinkedIn</p>
                        <a href={app.linkedin_url.startsWith('http') ? app.linkedin_url : `https://linkedin.com/in/${app.linkedin_url}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-brand-600 hover:underline flex items-center gap-1">
                          {app.linkedin_url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {app.audience && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase mb-1">Audience</p>
                        <p className="text-gray-900">{app.audience}</p>
                      </div>
                    )}
                    {app.experience_level && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase mb-1">Niveau</p>
                        <p className="text-gray-900 capitalize">{app.experience_level}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-500 text-xs uppercase mb-1">Motivation</p>
                    <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3">{app.motivation}</p>
                  </div>
                  {app.reviewed_at && (
                    <p className="text-xs text-gray-400 mt-3">
                      Examinee le {new Date(app.reviewed_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
