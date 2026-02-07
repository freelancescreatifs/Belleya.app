import { useState } from 'react';
import { MoreVertical, Trash2, Edit2, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import GroupDetailModal from './GroupDetailModal';

type Category = 'social_media' | 'salon' | 'service';

interface InspirationGroup {
  id: string;
  name: string;
  description: string | null;
  category: Category;
  display_order: number;
  photo_count?: number;
  cover_photo?: string;
  created_at: string;
}

interface Props {
  group: InspirationGroup;
  category: Category;
  onDeleted: () => void;
  onPhotosUpdated: () => void;
}

export default function InspirationGroupCard({ group, category, onDeleted, onPhotosUpdated }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Supprimer le groupe "${group.name}" et toutes ses photos ?`)) return;

    setDeleting(true);
    try {
      const { data: photos } = await supabase
        .from('company_inspirations')
        .select('image_url')
        .eq('group_id', group.id);

      if (photos && photos.length > 0) {
        const filePaths = photos
          .map(p => p.image_url.split('/company-inspirations/')[1])
          .filter(Boolean);

        if (filePaths.length > 0) {
          await supabase.storage
            .from('company-inspirations')
            .remove(filePaths);
        }
      }

      const { error } = await supabase
        .from('inspiration_groups')
        .delete()
        .eq('id', group.id);

      if (error) throw error;

      onDeleted();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <>
      <div
        className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          {group.cover_photo ? (
            <img
              src={group.cover_photo}
              alt={group.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FolderOpen className="w-12 h-12 md:w-16 md:h-16 text-gray-300" />
            </div>
          )}

          {group.photo_count !== undefined && group.photo_count > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {group.photo_count}
            </div>
          )}
        </div>

        <div className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">
                {group.name}
              </h3>
              {group.description && (
                <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                  {group.description}
                </p>
              )}
            </div>

            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetail(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Ouvrir
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      disabled={deleting}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <GroupDetailModal
          group={group}
          category={category}
          onClose={() => setShowDetail(false)}
          onUpdated={onPhotosUpdated}
        />
      )}
    </>
  );
}
