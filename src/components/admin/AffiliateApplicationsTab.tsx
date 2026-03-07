import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, Users, Loader2, ExternalLink, Trash2, Pencil, X, AlertTriangle } from 'lucide-react';
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
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [editTarget, setEditTarget] = useState<Application | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', motivation: '' });

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
      const now = new Date().toISOString();

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
          level: 'recrue',
          program: 'belaya_affiliation',
          approved_at: now,
        });

      if (affiliateError) throw affiliateError;

      const { error: roleError } = await supabase
        .from('user_profiles')
        .update({ role: 'affiliate' })
        .eq('user_id', app.user_id);

      if (roleError) {
        console.warn('Could not update user role:', roleError);
      }

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setProcessingId(deleteTarget.id);
    try {
      const { error } = await supabase
        .from('affiliate_applications')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setApplications(prev => prev.filter(a => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast('success', 'Candidature supprimee');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur lors de la suppression');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setProcessingId(editTarget.id);
    try {
      const { error } = await supabase
        .from('affiliate_applications')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone || null,
          motivation: editForm.motivation,
        })
        .eq('id', editTarget.id);

      if (error) throw error;

      setApplications(prev => prev.map(a => {
        if (a.id !== editTarget.id) return a;
        return { ...a, ...editForm, phone: editForm.phone || null };
      }));
      setEditTarget(null);
      showToast('success', 'Candidature modifiee');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur lors de la modification');
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
          <h2 className="text-xl font-bold text-gray-900">Candidatures Affiliation</h2>
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
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {app.status === 'pending' && (
                        <>
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
                        </>
                      )}
                      <button
                        onClick={() => {
                          setEditTarget(app);
                          setEditForm({
                            full_name: app.full_name || '',
                            email: app.email || '',
                            phone: app.phone || '',
                            motivation: app.motivation || '',
                          });
                        }}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(app)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer cette candidature ?</h3>
              <p className="text-sm text-gray-600 mb-1">
                La candidature de <strong>{deleteTarget.full_name}</strong> sera supprimee.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                {deleteTarget.status === 'approved'
                  ? 'Le compte affilie existant ne sera pas affecte.'
                  : 'Cette action est irreversible.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={processingId === deleteTarget.id}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingId === deleteTarget.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Supprimer
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Modifier la candidature</h3>
              <button
                onClick={() => setEditTarget(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivation</label>
                <textarea
                  value={editForm.motivation}
                  onChange={(e) => setEditForm(f => ({ ...f, motivation: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditSave}
                disabled={processingId === editTarget.id}
                className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingId === editTarget.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Enregistrer
              </button>
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
