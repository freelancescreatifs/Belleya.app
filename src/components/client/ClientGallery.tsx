import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserCategories } from '../../lib/categoryHelpers';
import InfoTooltip from '../shared/InfoTooltip';

interface ClientGalleryProps {
  clientId: string;
  companyId: string;
}

interface MediaItem {
  id: string;
  url: string;
  photo_url?: string;
  created_at: string;
  uploaded_by: string | null;
  service_category?: string | null;
  service_name?: string | null;
  caption?: string | null;
}

interface Service {
  id: string;
  name: string;
  service_type: string;
  category: string;
  photo_url: string | null;
}

interface PendingFile {
  file: File;
  preview: string;
}

export default function ClientGallery({ clientId, companyId: propCompanyId }: ClientGalleryProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inspirations' | 'results'>('inspirations');
  const [inspirations, setInspirations] = useState<MediaItem[]>([]);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(propCompanyId);
  const [userCategories, setUserCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCompanyId();
    loadMedia();
    loadServices();
    loadUserCategories();
  }, [clientId]);

  const loadUserCategories = async () => {
    if (!user) return;
    const cats = await fetchUserCategories(user.id);
    if (cats.length > 0) {
      setUserCategories(cats.map(c => c.name));
    } else {
      const { data } = await supabase
        .from('services')
        .select('category')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (data) {
        setUserCategories([...new Set(data.map(s => s.category).filter(Boolean))].sort());
      }
    }
  };

  const loadCompanyId = async () => {
    if (!user) return;

    if (propCompanyId) {
      setCompanyId(propCompanyId);
      return;
    }

    const { data } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setCompanyId(data.id);
    }
  };

  const loadServices = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('services')
      .select('id, name, service_type, category, photo_url')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (data) {
      setServices(data);
    }
  };

  const loadMedia = async () => {
    const { data: inspirationsData } = await supabase
      .from('client_inspirations')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    const { data: resultsData } = await supabase
      .from('client_results_photos')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (inspirationsData) setInspirations(inspirationsData);
    if (resultsData) {
      const normalizedResults = resultsData.map(r => ({
        ...r,
        url: r.photo_url || r.url
      }));
      setResults(normalizedResults);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;

    if (!companyId) {
      alert('Erreur: Company ID non défini. Veuillez rafraîchir la page.');
      return;
    }

    if (activeTab === 'results') {
      const previews: PendingFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const preview = URL.createObjectURL(file);
        previews.push({ file, preview });
      }
      setPendingFiles(previews);
      setShowUploadModal(true);
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${clientId}/${activeTab}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('client-media')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Upload échoué: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('client-media')
          .getPublicUrl(fileName);

        await supabase
          .from('client_inspirations')
          .insert({
            client_id: clientId,
            url: publicUrl,
            uploaded_by: user.id,
            company_id: companyId,
          });
      }

      await loadMedia();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'upload des médias');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!user) return;

    if (!companyId) {
      alert('Erreur: Company ID non défini. Veuillez rafraîchir la page.');
      return;
    }

    if (!selectedCategory) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }

    if (!selectedServiceId) {
      alert('Veuillez sélectionner un service');
      return;
    }

    setUploading(true);

    try {
      for (const pendingFile of pendingFiles) {
        const fileExt = pendingFile.file.name.split('.').pop();
        const fileName = `${clientId}/results/${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('client-media')
          .upload(fileName, pendingFile.file);

        if (uploadError) {
          throw new Error(`Upload échoué: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('client-media')
          .getPublicUrl(fileName);

        await supabase
          .from('client_results_photos')
          .insert({
            client_id: clientId,
            photo_url: publicUrl,
            uploaded_by: user.id,
            company_id: companyId,
            service_id: selectedServiceId,
            service_name: selectedCategory,
            caption: uploadCaption || null,
            show_in_gallery: true,
          });

        URL.revokeObjectURL(pendingFile.preview);
      }

      await loadMedia();
      setShowUploadModal(false);
      setPendingFiles([]);
      setSelectedServiceId('');
      setSelectedCategory('');
      setUploadCaption('');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'upload des médias');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
    setPendingFiles([]);
    setShowUploadModal(false);
    setSelectedServiceId('');
    setSelectedCategory('');
    setUploadCaption('');
  };

  const handleDelete = async (mediaId: string, url: string) => {
    if (!confirm('Supprimer cette image ?')) return;

    try {
      const fileName = url.split('/client-media/')[1];

      const table = activeTab === 'inspirations' ? 'client_inspirations' : 'client_results_photos';

      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      if (fileName) {
        await supabase.storage
          .from('client-media')
          .remove([fileName]);
      }

      await loadMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const currentMedia = activeTab === 'inspirations' ? inspirations : results;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2">
      <div className="flex gap-2 mb-3 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('inspirations')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'inspirations'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Ses Inspirations
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'results'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Ses résultats
          </button>
          <InfoTooltip
            content={
              <div className="text-sm">
                <p className="font-bold mb-1">Important</p>
                <p>Ses photos seront publiées sur le reseau Belaya.app pour que d'autres clientes puissent les consulter.</p>
                <p className="mt-2">Avant de poster les photos, veillez à ce que la cliente soit d'accord et pensez à cacher son visage.</p>
              </div>
            }
          />
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-3 border-2 border-dashed rounded-xl p-4 transition-all ${
          dragOver
            ? 'border-brand-500 bg-brand-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className={`w-12 h-12 mb-3 ${dragOver ? 'text-brand-500' : 'text-gray-400'}`} />
          <span className="text-sm font-medium text-gray-700 mb-1">
            {uploading ? 'Upload en cours...' : 'Glisser-déposer ou cliquer pour ajouter des photos'}
          </span>
          <span className="text-xs text-gray-500">
            PNG, JPG, GIF jusqu'à 10MB
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      {currentMedia.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {currentMedia.map((media) => (
            <div key={media.id} className="relative group aspect-square rounded overflow-hidden bg-gray-100">
              <img
                src={media.url}
                alt="Client media"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDelete(media.id, media.url)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">
            {activeTab === 'inspirations'
              ? 'Aucune inspiration ajoutée'
              : 'Aucune photo de résultat ajoutée'}
          </p>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Ajouter des photos de résultats</h3>
              <button
                onClick={handleCancelUpload}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {pendingFiles.map((pf, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={pf.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedServiceId('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {userCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service associé <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                  disabled={!selectedCategory}
                >
                  <option value="">Sélectionner un service</option>
                  {services
                    .filter(s => s.category === selectedCategory)
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  rows={3}
                  placeholder="Décrivez le résultat, les techniques utilisées..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Ces photos seront automatiquement publiées dans :</p>
                    <ul className="mt-2 space-y-1 ml-4 list-disc">
                      <li>Feed "Pour toi" (visible par toutes les clientes)</li>
                      <li>Section "Suivis" (pour vos abonnées)</li>
                      <li>Votre profil public - Galerie</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
              <button
                onClick={handleCancelUpload}
                disabled={uploading}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading || !selectedCategory || !selectedServiceId}
                className="px-6 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                {uploading ? 'Publication en cours...' : `Publier ${pendingFiles.length} photo${pendingFiles.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
