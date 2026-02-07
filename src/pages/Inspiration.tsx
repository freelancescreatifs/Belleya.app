import { useState, useEffect } from 'react';
import { Plus, Sparkles, Palette, Scissors, FolderPlus, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import InspirationGroupCard from '../components/inspiration/InspirationGroupCard';
import CreateGroupModal from '../components/inspiration/CreateGroupModal';
import AddPhotoModal from '../components/inspiration/AddPhotoModal';

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

export default function Inspiration() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Category>('social_media');
  const [groups, setGroups] = useState<InspirationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<InspirationGroup | null>(null);

  useEffect(() => {
    loadCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      loadGroups();
    }
  }, [activeTab, companyId]);

  const loadCompanyId = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (data?.company_id) {
      setCompanyId(data.company_id);
    }
  };

  const loadGroups = async () => {
    if (!companyId) return;

    setLoading(true);

    const { data: groupsData } = await supabase
      .from('inspiration_groups')
      .select(`
        *,
        company_inspirations(count)
      `)
      .eq('company_id', companyId)
      .eq('category', activeTab)
      .order('display_order', { ascending: true });

    if (groupsData) {
      const groupsWithPhotos = await Promise.all(
        groupsData.map(async (group: any) => {
          const { data: photos } = await supabase
            .from('company_inspirations')
            .select('image_url')
            .eq('group_id', group.id)
            .order('photo_order', { ascending: true })
            .limit(1);

          return {
            ...group,
            photo_count: group.company_inspirations?.[0]?.count || 0,
            cover_photo: photos?.[0]?.image_url || null
          };
        })
      );

      setGroups(groupsWithPhotos);
    }

    setLoading(false);
  };

  const handleGroupCreated = () => {
    setShowCreateGroup(false);
    loadGroups();
  };

  const handleGroupDeleted = () => {
    loadGroups();
  };

  const handlePhotosUpdated = () => {
    setShowAddPhoto(false);
    setSelectedGroup(null);
    loadGroups();
  };

  const getTabIcon = (tab: Category) => {
    switch (tab) {
      case 'social_media':
        return <Sparkles className="w-5 h-5" />;
      case 'salon':
        return <Palette className="w-5 h-5" />;
      case 'service':
        return <Scissors className="w-5 h-5" />;
    }
  };

  const getTabTitle = (tab: Category) => {
    switch (tab) {
      case 'social_media':
        return 'Réseaux Sociaux';
      case 'salon':
        return 'Mon Salon';
      case 'service':
        return 'Par Prestation';
    }
  };

  const getTabDescription = (tab: Category) => {
    switch (tab) {
      case 'social_media':
        return 'Moodboards pour ton contenu Instagram, TikTok, Pinterest';
      case 'salon':
        return 'Portfolio de ton salon : ambiance, réalisations, identité visuelle';
      case 'service':
        return 'Inspirations classées par type de prestation';
    }
  };

  const getEmptyStateText = (tab: Category) => {
    switch (tab) {
      case 'social_media':
        return 'Crée ton premier groupe (ex: "Idées Reels", "Feed inspiration")';
      case 'salon':
        return 'Crée ton premier groupe (ex: "Réalisations", "Ambiance salon")';
      case 'service':
        return 'Crée ton premier groupe (ex: "Ongles", "Cils", "Soins")';
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="px-2 md:px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Inspirations</h1>
        <p className="text-sm md:text-base text-gray-600">
          Organise tes inspirations comme sur Pinterest
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('social_media')}
            className={`flex-1 min-w-[120px] px-4 md:px-6 py-3 md:py-4 font-medium border-b-2 transition-colors flex items-center justify-center gap-2 text-sm md:text-base ${
              activeTab === 'social_media'
                ? 'border-belleya-500 text-belleya-primary bg-belleya-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {getTabIcon('social_media')}
            <span className="hidden sm:inline">Réseaux</span>
            <span className="sm:hidden">Social</span>
          </button>
          <button
            onClick={() => setActiveTab('salon')}
            className={`flex-1 min-w-[120px] px-4 md:px-6 py-3 md:py-4 font-medium border-b-2 transition-colors flex items-center justify-center gap-2 text-sm md:text-base ${
              activeTab === 'salon'
                ? 'border-belleya-500 text-belleya-primary bg-belleya-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {getTabIcon('salon')}
            Salon
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`flex-1 min-w-[120px] px-4 md:px-6 py-3 md:py-4 font-medium border-b-2 transition-colors flex items-center justify-center gap-2 text-sm md:text-base ${
              activeTab === 'service'
                ? 'border-belleya-500 text-belleya-primary bg-belleya-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {getTabIcon('service')}
            <span className="hidden sm:inline">Prestations</span>
            <span className="sm:hidden">Prestas</span>
          </button>
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-8 md:mb-10 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 mb-3">
                {getTabIcon(activeTab)}
                {getTabTitle(activeTab)}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{getTabDescription(activeTab)}</p>
            </div>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-belleya-primary to-[#f06bb4] text-white rounded-lg hover:from-belleya-deep hover:to-belleya-primary transition-all shadow-lg hover:shadow-xl text-sm md:text-base whitespace-nowrap flex-shrink-0"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Nouveau groupe</span>
              <span className="sm:hidden">Groupe</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-belleya-500 mx-auto"></div>
            </div>
          ) : groups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {groups.map((group) => (
                <InspirationGroupCard
                  key={group.id}
                  group={group}
                  category={activeTab}
                  onDeleted={handleGroupDeleted}
                  onPhotosUpdated={loadGroups}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 text-gray-500">
              <FolderPlus className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-base md:text-lg font-medium">Aucun groupe pour le moment</p>
              <p className="text-xs md:text-sm mt-1">{getEmptyStateText(activeTab)}</p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="mt-4 md:mt-6 inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-belleya-primary to-[#f06bb4] text-white rounded-lg hover:from-belleya-deep hover:to-belleya-primary transition-all shadow-lg hover:shadow-xl text-sm md:text-base"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                Créer mon premier groupe
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateGroup && companyId && (
        <CreateGroupModal
          companyId={companyId}
          category={activeTab}
          onClose={() => setShowCreateGroup(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
