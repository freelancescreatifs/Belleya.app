import { useState, useRef } from 'react';
import { X, Upload, Video, Instagram, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createVideoReviewSubmission, uploadRewardVideo } from '../../lib/rewardsHelpers';
import { useToast } from '../../hooks/useToast';

interface MissionTwoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MissionTwoModal({ onClose, onSuccess }: MissionTwoModalProps) {
  const { companyProfile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    video_url: '',
    instagram_handle: '',
    consent_commercial: false
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        showToast('error', 'La vidéo ne doit pas dépasser 100 MB');
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyProfile?.id) {
      showToast('error', 'Profil non trouvé');
      return;
    }

    if (!formData.consent_commercial) {
      showToast('error', 'Vous devez accepter les conditions d\'utilisation');
      return;
    }

    if (uploadMode === 'file' && !videoFile) {
      showToast('error', 'Veuillez télécharger une vidéo');
      return;
    }

    if (uploadMode === 'url' && !formData.video_url) {
      showToast('error', 'Veuillez fournir le lien de la vidéo');
      return;
    }

    setUploading(true);

    try {
      let videoStorageUrl: string | undefined;
      let videoUrl: string | undefined;

      if (uploadMode === 'file' && videoFile) {
        videoStorageUrl = await uploadRewardVideo(companyProfile.user_id, videoFile);
      } else {
        videoUrl = formData.video_url;
      }

      await createVideoReviewSubmission(companyProfile.id, {
        video_url: videoUrl,
        video_storage_url: videoStorageUrl,
        consent_commercial: formData.consent_commercial,
        instagram_handle: formData.instagram_handle || undefined
      });

      showToast('success', 'Vidéo soumise avec succès ! Notre équipe va la vérifier sous 48h.');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting video:', error);
      showToast('error', error.message || 'Erreur lors de la soumission');
    } finally {
      setUploading(false);
    }
  };

  const isValid =
    formData.consent_commercial &&
    (uploadMode === 'file' ? videoFile !== null : formData.video_url !== '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Mission #2 - Vidéo Avis</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800">
                <strong>Instructions :</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>Creez une video avis sur Belaya.app (format Reel/Story recommande)</li>
                  <li>Mentionnez @belaya.app dans votre publication</li>
                  <li>Partagez votre expérience authentique avec l'application</li>
                  <li>Téléchargez votre vidéo ou fournissez le lien Instagram</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Video className="w-4 h-4 inline mr-1" />
              Comment souhaitez-vous partager votre vidéo ?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  uploadMode === 'file'
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-rose-600" />
                <p className="text-sm font-medium text-gray-900">Télécharger</p>
                <p className="text-xs text-gray-500">Fichier vidéo</p>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  uploadMode === 'url'
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Instagram className="w-6 h-6 mx-auto mb-2 text-rose-600" />
                <p className="text-sm font-medium text-gray-900">Lien Instagram</p>
                <p className="text-xs text-gray-500">URL du post</p>
              </button>
            </div>
          </div>

          {uploadMode === 'file' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre vidéo *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Format : MP4, MOV, maximum 100 MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-rose-500 transition-colors"
              >
                {videoFile ? (
                  <div className="text-center">
                    <Video className="w-8 h-8 mx-auto text-rose-600 mb-2" />
                    <p className="text-sm text-gray-900 font-medium">{videoFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-rose-600 mt-2">Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Cliquez pour télécharger une vidéo</p>
                    <p className="text-xs text-gray-400">MP4, MOV jusqu'à 100 MB</p>
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Instagram className="w-4 h-4 inline mr-1" />
                Lien de votre vidéo Instagram *
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                required={uploadMode === 'url'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Instagram className="w-4 h-4 inline mr-1" />
              Votre pseudo Instagram (optionnel)
            </label>
            <input
              type="text"
              value={formData.instagram_handle}
              onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
              placeholder="@votre_pseudo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consent_commercial}
                onChange={(e) => setFormData({ ...formData, consent_commercial: e.target.checked })}
                className="mt-1 w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-yellow-700" />
                  <span className="text-sm font-medium text-yellow-900">
                    Consentement requis *
                  </span>
                </div>
                <p className="text-sm text-yellow-800">
                  J'autorise Belaya.app a reutiliser cette vidéo à des fins commerciales et/ou sur la landing page.
                  Cette autorisation est nécessaire pour valider la mission et recevoir le mois gratuit.
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid || uploading}
              className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Envoi en cours...' : 'Soumettre ma vidéo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
