import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Link as LinkIcon, Plus, CreditCard as Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Category = 'social_media' | 'salon' | 'service';

interface InspirationGroup {
  id: string;
  name: string;
  description: string | null;
  category: Category;
}

interface Photo {
  id: string;
  image_url: string;
  link_url: string | null;
  description: string | null;
  service_type: string | null;
  photo_order: number;
  created_at: string;
}

interface Props {
  group: InspirationGroup;
  category: Category;
  onClose: () => void;
  onUpdated: () => void;
}

interface PhotoFormData {
  link_url: string;
  description: string;
  service_type: string;
}

export default function GroupDetailModal({ group, category, onClose, onUpdated }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [photoFormsData, setPhotoFormsData] = useState<PhotoFormData[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [expandedPhotoIndex, setExpandedPhotoIndex] = useState<number | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editFormData, setEditFormData] = useState({
    link_url: '',
    description: '',
    service_type: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [group.id]);

  const loadPhotos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('company_inspirations')
      .select('*')
      .eq('group_id', group.id)
      .order('photo_order', { ascending: true });

    if (data) setPhotos(data);
    setLoading(false);
  };

  const handleFilesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      setSelectedFiles(e.dataTransfer.files);
      setPhotoFormsData(Array.from(e.dataTransfer.files).map(() => ({
        link_url: '',
        description: '',
        service_type: ''
      })));
      setExpandedPhotoIndex(e.dataTransfer.files.length === 1 ? 0 : null);
      setShowAddForm(true);
    }
  };

  const handleFilesSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setPhotoFormsData(Array.from(files).map(() => ({
        link_url: '',
        description: '',
        service_type: ''
      })));
      setExpandedPhotoIndex(files.length === 1 ? 0 : null);
      setShowAddForm(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      const nextOrder = photos.length > 0
        ? Math.max(...photos.map(p => p.photo_order)) + 1
        : 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.company_id}/${category}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('company-inspirations')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('company-inspirations')
          .getPublicUrl(fileName);

        const photoData = photoFormsData[i] || { link_url: '', description: '', service_type: '' };

        const { error: dbError } = await supabase
          .from('company_inspirations')
          .insert({
            company_id: profile.company_id,
            group_id: group.id,
            type: category,
            image_url: publicUrl,
            link_url: photoData.link_url.trim() || null,
            description: photoData.description.trim() || null,
            service_type: category === 'service' && photoData.service_type.trim()
              ? photoData.service_type.trim()
              : null,
            photo_order: nextOrder + i
          });

        if (dbError) throw dbError;
      }

      setShowAddForm(false);
      setSelectedFiles(null);
      setPhotoFormsData([]);
      setExpandedPhotoIndex(null);
      loadPhotos();
      onUpdated();
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      alert(error.message || 'Erreur lors de l\'ajout des photos');
    } finally {
      setUploading(false);
    }
  };

  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditFormData({
      link_url: photo.link_url || '',
      description: photo.description || '',
      service_type: photo.service_type || ''
    });
  };

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('company_inspirations')
        .update({
          link_url: editFormData.link_url.trim() || null,
          description: editFormData.description.trim() || null,
          service_type: category === 'service' && editFormData.service_type.trim()
            ? editFormData.service_type.trim()
            : null
        })
        .eq('id', editingPhoto.id);

      if (error) throw error;

      setEditingPhoto(null);
      setEditFormData({ link_url: '', description: '', service_type: '' });
      loadPhotos();
      onUpdated();
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm('Supprimer cette photo ?')) return;

    try {
      const fileName = photo.image_url.split('/company-inspirations/')[1];

      const { error: dbError } = await supabase
        .from('company_inspirations')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      if (fileName) {
        await supabase.storage
          .from('company-inspirations')
          .remove([fileName]);
      }

      loadPhotos();
      onUpdated();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getFieldPlaceholders = () => {
    switch (category) {
      case 'social_media':
        return {
          link: 'https://instagram.com/p/...',
          description: ''
        };
      case 'salon':
        return {
          link: 'Lien vers plus d\'infos...',
          description: 'Note sur cette photo...'
        };
      case 'service':
        return {
          link: 'Lien vers le tuto/inspiration...',
          description: 'Notes techniques...',
          service: 'Ex: Ongles, Cils, Coiffure...'
        };
    }
  };

  const placeholders = getFieldPlaceholders();
  const showLinkField = true;
  const showDescriptionField = category === 'salon' || category === 'service';
  const showServiceField = category === 'service';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-2xl md:rounded-xl w-full md:max-w-4xl md:max-h-[90vh] flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between p-5 md:p-7 lg:p-8 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate mb-2">{group.name}</h2>
            {group.description && (
              <p className="text-xs md:text-sm text-gray-600 line-clamp-2 leading-relaxed">{group.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-7 lg:p-8">
          {!showAddForm ? (
            <>
              <div className="mb-6 bg-belaya-50 border border-belaya-200 rounded-lg p-4 flex items-start gap-3">
                <LinkIcon className="w-5 h-5 text-belaya-deep flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    <span className="font-semibold">Fonctionnement type Pinterest :</span>
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                    <li>Chaque photo a son propre lien indépendant</li>
                    <li>Ajoute des liens vers Instagram, Pinterest, TikTok, sites web...</li>
                    <li>Les photos avec lien montrent l'icône <LinkIcon className="w-3.5 h-3.5 inline-block" /></li>
                    <li>Clique sur une photo pour ouvrir son lien</li>
                    <li>Modifie le lien à tout moment avec le bouton <Edit3 className="w-3.5 h-3.5 inline-block" /></li>
                  </ul>
                </div>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFilesDrop}
                className={`mb-8 border-2 border-dashed rounded-xl p-6 md:p-8 transition-all ${
                  dragOver
                    ? 'border-belaya-500 bg-belaya-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className={`w-10 h-10 md:w-12 md:h-12 mb-3 ${dragOver ? 'text-belaya-500' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700 mb-1 text-center">
                  Glisser-déposer ou cliquer pour ajouter des photos
                </span>
                <span className="text-xs text-gray-500 text-center">
                  Plusieurs photos possibles • PNG, JPG, GIF jusqu'à 10MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelect(e.target.files)}
                />
              </label>
            </div>
            </>
          ) : (
            <div className="mb-6 bg-gray-50 rounded-xl p-5 md:p-7 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base md:text-lg font-bold text-gray-900">
                  Ajouter {selectedFiles?.length} photo{(selectedFiles?.length || 0) > 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedFiles(null);
                    setPhotoFormsData([]);
                    setExpandedPhotoIndex(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedFiles && Array.from(selectedFiles).map((file, i) => {
                  const isExpanded = expandedPhotoIndex === i;
                  const hasLink = photoFormsData[i]?.link_url.trim();

                  return (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div
                        onClick={() => setExpandedPhotoIndex(isExpanded ? null : i)}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            Photo {i + 1}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {hasLink ? (
                              <span className="flex items-center gap-1 text-belaya-deep">
                                <LinkIcon className="w-3 h-3" />
                                Lien ajouté
                              </span>
                            ) : (
                              'Aucun lien'
                            )}
                          </p>
                        </div>
                        <div className="text-gray-400">
                          {isExpanded ? '▲' : '▼'}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 border-t border-gray-200 space-y-4 bg-gray-50">
                          {showLinkField && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lien individuel (optionnel)
                              </label>
                              <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="url"
                                  value={photoFormsData[i]?.link_url || ''}
                                  onChange={(e) => {
                                    const newForms = [...photoFormsData];
                                    newForms[i] = { ...newForms[i], link_url: e.target.value };
                                    setPhotoFormsData(newForms);
                                  }}
                                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                                  placeholder={placeholders.link}
                                />
                              </div>
                            </div>
                          )}

                          {showDescriptionField && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {category === 'salon' ? 'Note' : 'Description'} (optionnel)
                              </label>
                              <textarea
                                value={photoFormsData[i]?.description || ''}
                                onChange={(e) => {
                                  const newForms = [...photoFormsData];
                                  newForms[i] = { ...newForms[i], description: e.target.value };
                                  setPhotoFormsData(newForms);
                                }}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                                rows={2}
                                placeholder={placeholders.description}
                              />
                            </div>
                          )}

                          {showServiceField && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type de prestation
                              </label>
                              <input
                                type="text"
                                value={photoFormsData[i]?.service_type || ''}
                                onChange={(e) => {
                                  const newForms = [...photoFormsData];
                                  newForms[i] = { ...newForms[i], service_type: e.target.value };
                                  setPhotoFormsData(newForms);
                                }}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                                placeholder={placeholders.service}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedFiles(null);
                    setPhotoFormsData([]);
                    setExpandedPhotoIndex(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {uploading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-belaya-500 mx-auto"></div>
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <div
                    className={`aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 relative ${
                      photo.link_url ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (photo.link_url) {
                        window.open(photo.link_url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <img
                      src={photo.image_url}
                      alt=""
                      className={`w-full h-full object-cover transition-transform ${
                        photo.link_url ? 'group-hover:scale-105' : ''
                      }`}
                    />

                    {photo.link_url && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md">
                        <LinkIcon className="w-3 h-3 text-belaya-deep" />
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    {photo.link_url && (
                      <a
                        href={photo.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors mr-2 shadow-lg"
                        title="Ouvrir le lien"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LinkIcon className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPhoto(photo);
                      }}
                      className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors mr-2 shadow-lg"
                      title="Modifier"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo);
                      }}
                      className="p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {(photo.description || photo.service_type) && (
                    <div className="mt-2">
                      {photo.service_type && (
                        <span className="inline-block px-2 py-0.5 bg-belaya-100 text-belaya-deep text-xs rounded-full mb-1">
                          {photo.service_type}
                        </span>
                      )}
                      {photo.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{photo.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Plus className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-sm md:text-base font-medium">Aucune photo dans ce groupe</p>
              <p className="text-xs md:text-sm mt-1">Ajoute des photos pour commencer</p>
            </div>
          )}
        </div>
      </div>

      {editingPhoto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Modifier la photo</h3>
                <button
                  onClick={() => {
                    setEditingPhoto(null);
                    setEditFormData({ link_url: '', description: '', service_type: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={editingPhoto.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {showLinkField && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lien individuel (optionnel)
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={editFormData.link_url}
                      onChange={(e) => setEditFormData({ ...editFormData, link_url: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                      placeholder={placeholders.link}
                    />
                  </div>
                </div>
              )}

              {showDescriptionField && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {category === 'salon' ? 'Note' : 'Description'} (optionnel)
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                    rows={2}
                    placeholder={placeholders.description}
                  />
                </div>
              )}

              {showServiceField && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de prestation
                  </label>
                  <input
                    type="text"
                    value={editFormData.service_type}
                    onChange={(e) => setEditFormData({ ...editFormData, service_type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                    placeholder={placeholders.service}
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setEditingPhoto(null);
                  setEditFormData({ link_url: '', description: '', service_type: '' });
                }}
                disabled={updating}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdatePhoto}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {updating ? 'Mise à jour...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
