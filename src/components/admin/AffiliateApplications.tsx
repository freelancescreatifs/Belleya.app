import { useState, useEffect } from 'react';
import {
  Users,
  Check,
  X,
  Eye,
  Instagram,
  Search,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface Application {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  instagram_url: string | null;
  experience_level: string;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

const levelLabels: Record<string, string> = {
  debutant: 'Debutant',
  intermediaire: 'Intermediaire',
  confirme: 'Confirme',
};

export default function AffiliateApplications() {
  const { user } = useAuth();
  const toast = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
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
    if (!user) return;
    setProcessing(app.id);

    try {
      const { data, error } = await supabase.rpc('approve_affiliate_application', {
        p_application_id: app.id,
        p_admin_id: user.id,
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Echec de l\'approbation');

      toast.success('Candidature approuvee avec succes');
      await loadApplications();
      setSelectedApp(null);
    } catch (err: any) {
      console.error('Approve error:', err);
      toast.error('Erreur: ' + (err.message || 'Impossible d\'approuver'));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (app: Application) => {
    if (!user) return;
    setProcessing(app.id);

    try {
      const { data, error } = await supabase.rpc('reject_affiliate_application', {
        p_application_id: app.id,
        p_admin_id: user.id,
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Echec du refus');

      toast.success('Candidature refusee');
      await loadApplications();
      setSelectedApp(null);
    } catch (err: any) {
      console.error('Reject error:', err);
      toast.error('Erreur: ' + (err.message || 'Impossible de refuser'));
    } finally {
      setProcessing(null);
    }
  };

  const filtered = applications.filter(app => {
    if (filter !== 'all' && app.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return app.full_name.toLowerCase().includes(q) || app.email.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En attente', count: applications.filter(a => a.status === 'pending').length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Approuvees', count: applications.filter(a => a.status === 'approved').length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Refusees', count: applications.filter(a => a.status === 'rejected').length, color: 'bg-red-50 text-red-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{s.count}</div>
            <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${s.color}`}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-[#E51E8F] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f === 'pending' ? `En attente (${pendingCount})` : f === 'approved' ? 'Approuvees' : f === 'rejected' ? 'Refusees' : 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Instagram</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Niveau</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucune candidature trouvee</p>
                  </td>
                </tr>
              ) : (
                filtered.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{app.full_name}</p>
                        <p className="text-xs text-gray-500">{app.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {app.instagram_url ? (
                        <a
                          href={app.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          Profil
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-600">{levelLabels[app.experience_level] || app.experience_level}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {new Date(app.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AppStatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Voir details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(app)}
                              disabled={processing === app.id}
                              className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Approuver"
                            >
                              {processing === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleReject(app)}
                              disabled={processing === app.id}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Refuser"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Detail de la candidature</h3>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-900">{selectedApp.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedApp.email}</p>
                </div>
                <AppStatusBadge status={selectedApp.status} />
              </div>

              {selectedApp.instagram_url && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Instagram</p>
                  <a
                    href={selectedApp.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700"
                  >
                    <Instagram className="w-4 h-4" />
                    {selectedApp.instagram_url}
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Niveau d'experience</p>
                <p className="text-sm text-gray-900">{levelLabels[selectedApp.experience_level] || selectedApp.experience_level}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Motivation</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">{selectedApp.motivation}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Date de candidature</p>
                <p className="text-sm text-gray-900">
                  {new Date(selectedApp.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              {selectedApp.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedApp)}
                    disabled={processing === selectedApp.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {processing === selectedApp.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approuver
                  </button>
                  <button
                    onClick={() => handleReject(selectedApp)}
                    disabled={processing === selectedApp.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Refuser
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvee',
    rejected: 'Refusee',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}
