import { useState, useRef } from 'react';
import { X, Upload, Instagram, MessageSquare, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createFollowCommentSubmission, uploadProofImage } from '../../lib/rewardsHelpers';
import { useToast } from '../../hooks/useToast';

interface MissionOneModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MissionOneModal({ onClose, onSuccess }: MissionOneModalProps) {
  const { companyProfile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    instagram_handle: '',
    comment_text: '',
    comment_post_url: ''
  });
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'L\'image ne doit pas dépasser 5 MB');
        return;
      }
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyProfile?.id) {
      showToast('error', 'Profil non trouvé');
      return;
    }

    if (!proofImage) {
      showToast('error', 'Veuillez télécharger une capture d\'écran');
      return;
    }

    if (formData.comment_text.length < 100) {
      showToast('error', 'Le commentaire doit contenir au moins 100 caractères');
      return;
    }

    if (!formData.instagram_handle.startsWith('@')) {
      showToast('error', 'Le pseudo Instagram doit commencer par @');
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await uploadProofImage(companyProfile.user_id, proofImage);

      await createFollowCommentSubmission(companyProfile.id, {
        instagram_handle: formData.instagram_handle,
        proof_image_url: imageUrl,
        comment_text: formData.comment_text,
        comment_post_url: formData.comment_post_url || undefined
      });

      showToast('success', 'Mission soumise avec succès ! Notre équipe va la vérifier sous 48h.');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting mission:', error);
      showToast('error', error.message || 'Erreur lors de la soumission');
    } finally {
      setUploading(false);
    }
  };

  const isValid =
    formData.instagram_handle.startsWith('@') &&
    formData.comment_text.length >= 100 &&
    proofImage !== null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Mission #1 - Follow + Commentaire</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Instructions :</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>Abonnez-vous à <a href="https://www.instagram.com/belaya.app/" target="_blank" rel="noopener noreferrer" className="underline">@belaya.app</a></li>
                  <li>Laissez un commentaire détaillé (minimum 100 caractères) sur un de nos posts</li>
                  <li>Faites une capture d'écran montrant votre abonnement et votre photo de profil</li>
                  <li>Remplissez le formulaire ci-dessous</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Instagram className="w-4 h-4 inline mr-1" />
              Votre pseudo Instagram *
            </label>
            <input
              type="text"
              value={formData.instagram_handle}
              onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
              placeholder="@votre_pseudo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Votre commentaire *
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({formData.comment_text.length}/100 caractères minimum)
              </span>
            </label>
            <textarea
              value={formData.comment_text}
              onChange={(e) => setFormData({ ...formData, comment_text: e.target.value })}
              placeholder="Écrivez ici le commentaire que vous avez laissé sur Instagram..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
            {formData.comment_text.length > 0 && formData.comment_text.length < 100 && (
              <p className="text-xs text-red-600 mt-1">
                Encore {100 - formData.comment_text.length} caractères requis
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              Lien du post commenté (optionnel)
            </label>
            <input
              type="url"
              value={formData.comment_post_url}
              onChange={(e) => setFormData({ ...formData, comment_post_url: e.target.value })}
              placeholder="https://www.instagram.com/p/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              Capture d'écran de preuve *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              La capture doit montrer : votre abonnement à @belaya.app + votre photo de profil visible
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-pink-500 transition-colors"
            >
              {previewUrl ? (
                <div className="space-y-2">
                  <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded" />
                  <p className="text-sm text-gray-600">Cliquez pour changer</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Cliquez pour télécharger une image</p>
                  <p className="text-xs text-gray-400">PNG, JPG jusqu'à 5 MB</p>
                </div>
              )}
            </button>
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
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Envoi en cours...' : 'Soumettre ma preuve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
