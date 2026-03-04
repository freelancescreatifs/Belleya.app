import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Instagram, Video, Image as ImageIcon, Clock, AlertCircle } from 'lucide-react';
import {
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  type RewardSubmission
} from '../../lib/rewardsHelpers';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';

interface SubmissionWithProvider extends RewardSubmission {
  provider?: {
    company_name: string;
    user_id: string;
    email?: string;
  };
}

export default function RewardsValidation() {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<SubmissionWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithProvider | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setLoading(true);
    try {
      const data = await getAllSubmissions();

      const enrichedData = await Promise.all(
        data.map(async (submission) => {
          const { data: companyData } = await supabase
            .from('company_profiles')
            .select('company_name, user_id')
            .eq('id', submission.provider_id)
            .maybeSingle();

          let email = '';
          if (companyData?.user_id) {
            const { data: viewData } = await supabase
              .from('admin_users_view')
              .select('email')
              .eq('user_id', companyData.user_id)
              .maybeSingle();

            email = viewData?.email || '';
          }

          return {
            ...submission,
            provider: {
              company_name: companyData?.company_name || 'Unknown',
              user_id: companyData?.user_id || '',
              email
            }
          };
        })
      );

      setSubmissions(enrichedData);
    } catch (error) {
      console.error('Error loading submissions:', error);
      showToast('error', 'Erreur lors du chargement des soumissions');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(submissionId: string) {
    setProcessing(true);
    try {
      await approveSubmission(submissionId);
      showToast('success', 'Soumission approuvée avec succès');
      await loadSubmissions();
      setShowDetailModal(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Error approving submission:', error);
      showToast('error', 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(submissionId: string) {
    if (!rejectReason.trim()) {
      showToast('error', 'Veuillez indiquer une raison de refus');
      return;
    }

    setProcessing(true);
    try {
      await rejectSubmission(submissionId, rejectReason);
      showToast('success', 'Soumission refusée');
      await loadSubmissions();
      setShowDetailModal(false);
      setSelectedSubmission(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting submission:', error);
      showToast('error', 'Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  }

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Validation des Avis</h2>
          <p className="text-gray-600 mt-1">
            {pendingCount} soumission{pendingCount > 1 ? 's' : ''} en attente
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approuvés
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Refusés
          </button>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune soumission à afficher</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    submission.mission_type === 'follow_comment'
                      ? 'bg-pink-100'
                      : 'bg-rose-100'
                  }`}>
                    {submission.mission_type === 'follow_comment' ? (
                      <Instagram className={`w-6 h-6 ${
                        submission.mission_type === 'follow_comment'
                          ? 'text-pink-600'
                          : 'text-rose-600'
                      }`} />
                    ) : (
                      <Video className={`w-6 h-6 ${
                        submission.mission_type === 'follow_comment'
                          ? 'text-pink-600'
                          : 'text-rose-600'
                      }`} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {submission.provider?.company_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {submission.mission_type === 'follow_comment'
                        ? 'Mission #1 - Follow + Commentaire'
                        : 'Mission #2 - Vidéo Avis'}
                    </p>
                    {submission.instagram_handle && (
                      <p className="text-sm text-gray-500">
                        {submission.instagram_handle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    submission.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : submission.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {submission.status === 'pending' ? 'En attente' :
                     submission.status === 'approved' ? 'Approuvé' : 'Refusé'}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowDetailModal(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Date :</strong>{' '}
                  {new Date(submission.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {submission.provider?.email && (
                  <p>
                    <strong>Email :</strong> {submission.provider.email}
                  </p>
                )}
              </div>

              {submission.status === 'pending' && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleApprove(submission.id)}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approuver
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowDetailModal(true);
                    }}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSubmission(null);
            setRejectReason('');
          }}
          onApprove={() => handleApprove(selectedSubmission.id)}
          onReject={() => handleReject(selectedSubmission.id)}
          rejectReason={rejectReason}
          onRejectReasonChange={setRejectReason}
          processing={processing}
        />
      )}
    </div>
  );
}

interface SubmissionDetailModalProps {
  submission: SubmissionWithProvider;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  rejectReason: string;
  onRejectReasonChange: (reason: string) => void;
  processing: boolean;
}

function SubmissionDetailModal({
  submission,
  onClose,
  onApprove,
  onReject,
  rejectReason,
  onRejectReasonChange,
  processing
}: SubmissionDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Détails de la soumission
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Informations</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>Provider:</strong> {submission.provider?.company_name}</p>
              <p><strong>Email:</strong> {submission.provider?.email}</p>
              <p><strong>Type:</strong> {submission.mission_type === 'follow_comment' ? 'Mission #1' : 'Mission #2'}</p>
              <p><strong>Instagram:</strong> {submission.instagram_handle || '-'}</p>
              <p><strong>Date:</strong> {new Date(submission.created_at).toLocaleString('fr-FR')}</p>
            </div>
          </div>

          {submission.mission_type === 'follow_comment' && (
            <>
              {submission.proof_image_url && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Capture d'écran
                  </h3>
                  <img
                    src={submission.proof_image_url}
                    alt="Proof"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {submission.comment_text && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Commentaire ({submission.comment_text.length} caractères)
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                    {submission.comment_text}
                  </div>
                </div>
              )}

              {submission.comment_post_url && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Lien du post</h3>
                  <a
                    href={submission.comment_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:underline text-sm"
                  >
                    {submission.comment_post_url}
                  </a>
                </div>
              )}
            </>
          )}

          {submission.mission_type === 'video_review' && (
            <>
              {(submission.video_url || submission.video_storage_url) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Vidéo
                  </h3>
                  {submission.video_storage_url ? (
                    <video
                      src={submission.video_storage_url}
                      controls
                      className="w-full rounded-lg border border-gray-200"
                    />
                  ) : (
                    <a
                      href={submission.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline text-sm"
                    >
                      {submission.video_url}
                    </a>
                  )}
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Consentement commercial</h3>
                <p className={`text-sm ${submission.consent_commercial ? 'text-green-600' : 'text-red-600'}`}>
                  {submission.consent_commercial ? '✓ Accordé' : '✗ Non accordé'}
                </p>
              </div>
            </>
          )}

          {submission.status === 'pending' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Raison du refus (si applicable)</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => onRejectReasonChange(e.target.value)}
                placeholder="Expliquez pourquoi cette soumission est refusée..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          )}

          {submission.status === 'rejected' && submission.admin_note && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Raison du refus</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {submission.admin_note}
              </div>
            </div>
          )}

          {submission.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={onApprove}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                Approuver
              </button>
              <button
                onClick={onReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
              >
                <XCircle className="w-5 h-5" />
                Refuser
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
