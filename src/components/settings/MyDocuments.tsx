import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserDocument {
  id: string;
  category: 'administrative' | 'personal' | 'training' | 'other';
  file_path: string;
  file_name: string;
  notes?: string;
  uploaded_at: string;
}

const CATEGORIES = [
  { value: 'administrative', label: 'Documents administratifs' },
  { value: 'personal', label: 'Documents personnels' },
  { value: 'training', label: 'Documents de formation' },
  { value: 'other', label: 'Autres' },
] as const;

export default function MyDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    category: 'administrative' as UserDocument['category'],
    file: null as File | null,
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  async function loadDocuments() {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!uploadForm.file || !user) return;

    setUploading(true);
    try {
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${user.id}/documents/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('user_documents')
        .insert({
          user_id: user.id,
          category: uploadForm.category,
          file_path: urlData.publicUrl,
          file_name: uploadForm.file.name,
          notes: uploadForm.notes || null,
        });

      if (insertError) throw insertError;

      setShowUploadModal(false);
      setUploadForm({
        category: 'administrative',
        file: null,
        notes: '',
      });
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: UserDocument) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const filePath = doc.file_path.split('/service-photos/')[1];
      if (filePath) {
        await supabase.storage.from('service-photos').remove([filePath]);
      }

      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Erreur lors de la suppression');
    }
  }

  const documentsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    docs: documents.filter(d => d.category === cat.value),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes documents</h2>
          <p className="text-gray-600 mt-1">Centralisez vos fichiers réutilisables</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors"
        >
          <Upload className="w-4 h-4" />
          Ajouter un document
        </button>
      </div>

      <div className="space-y-6">
        {documentsByCategory.map(({ value, label, docs }) => (
          <div key={value} className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {label} ({docs.length})
            </h3>

            {docs.length > 0 ? (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doc.file_name}</p>
                        {doc.notes && (
                          <p className="text-xs text-gray-500 mt-1">{doc.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(doc.uploaded_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.file_path}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">Aucun document dans cette catégorie</p>
            )}
          </div>
        ))}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Ajouter un document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as UserDocument['category'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier *
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF, images, Word acceptés. Max 10 Mo.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent resize-none"
                  placeholder="Description ou notes sur ce document..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadForm.file || uploading}
                  className="flex-1 px-4 py-2 bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Upload...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
