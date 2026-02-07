import { useState, useEffect } from 'react';
import { Plus, Lightbulb, Calendar, Grid, AlertCircle, X, Kanban, ListFilter, Layers, Table, BarChart3, Clapperboard, Instagram } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useMenuPreferences } from '../lib/useMenuPreferences';
import IdeasGenerator from '../components/content/IdeasGenerator';
import InstagramFeed from '../components/content/InstagramFeed';
import EditorialCalendar from '../components/content/EditorialCalendar';
import EventsCalendar from '../components/content/EventsCalendar';
import ContentAlerts from '../components/content/ContentAlerts';
import KanbanView from '../components/content/KanbanView';
import ContentTable from '../components/content/ContentTable';
import ContentFormModal from '../components/content/ContentFormModal';
import ContentStats from '../components/content/ContentStats';
import ContentDetailedStats from '../components/content/ContentDetailedStats';
import ProductionCalendar from '../components/content/ProductionCalendar';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  platform: string;
  publication_date: string;
  publication_time?: string;
  status: 'idea' | 'script' | 'shooting' | 'editing' | 'scheduled' | 'published';
  image_url: string;
  feed_order: number;
  notes: string;
  caption?: string;
  content_structure?: string;
  media_urls?: string[];
  media_type?: string;
  editorial_pillar?: string;
  angle?: string;
  enriched_title?: string;
  objective?: string;
  is_recycled?: boolean;
  content_nature?: 'valeur' | 'promo';
  production_time?: 'court' | 'moyen' | 'long';
  blocking_point?: string;
  theme?: string;
  key_message?: string;
  adaptation_source?: string;
  date_script?: string;
  date_shooting?: string;
  date_editing?: string;
  date_scheduling?: string;
  is_published?: boolean;
}

interface EditorialPillar {
  id: string;
  pillar_name: string;
  color: string;
}

interface Alert {
  id: string;
  alert_type: 'marronnier' | 'tip' | 'reminder';
  title: string;
  message: string;
  related_date: string | null;
  status: 'active' | 'dismissed';
}

interface ViewPreferences {
  calendar_enabled: boolean;
  editorial_calendar_enabled: boolean;
  production_calendar_enabled: boolean;
  studio_enabled: boolean;
  type_view_enabled: boolean;
  table_view_enabled: boolean;
}

export default function Content() {
  const { user } = useAuth();
  const { socialViews } = useMenuPreferences(user?.id);
  const [view, setView] = useState<'calendar' | 'studio' | 'stats' | 'events'>('studio');
  const [calendarSubView, setCalendarSubView] = useState<'editorial' | 'production'>('editorial');
  const [studioSubView, setStudioSubView] = useState<'columns' | 'lines' | 'social_post_type'>('social_post_type');
  const [showIdeasGenerator, setShowIdeasGenerator] = useState(false);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pillars, setPillars] = useState<EditorialPillar[]>([]);
  const [professionType, setProfessionType] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>({
    calendar_enabled: true,
    editorial_calendar_enabled: true,
    production_calendar_enabled: false,
    studio_enabled: true,
    type_view_enabled: false,
    table_view_enabled: true,
  });
  const [contentFormState, setContentFormState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    contentId?: string;
    prefillData?: Partial<ContentItem>;
  }>({
    isOpen: false,
    mode: 'create'
  });

  const [platformFilter, setPlatformFilter] = useState<string[]>([]);

  const [statsDateRange, setStatsDateRange] = useState<{
    start: string;
    end: string;
  }>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    if (user) {
      loadViewPreferences();
      loadContents();
      loadAlerts();
      loadProfessionAndPillars();
    }
  }, [user]);

  useEffect(() => {
    if (view === 'calendar') {
      const availableCalendarViews = [];
      if (viewPreferences.editorial_calendar_enabled) availableCalendarViews.push('editorial');
      if (socialViews.productionCalendar) availableCalendarViews.push('production');

      if (availableCalendarViews.length === 1) {
        setCalendarSubView(availableCalendarViews[0] as 'editorial' | 'production');
      }
    }

    if (view === 'studio') {
      const availableStudioViews = [];
      if (socialViews.viewByPostType) availableStudioViews.push('social_post_type');
      if (viewPreferences.type_view_enabled) availableStudioViews.push('columns');
      if (viewPreferences.table_view_enabled) availableStudioViews.push('lines');

      if (availableStudioViews.length >= 1) {
        setStudioSubView(availableStudioViews[0] as 'columns' | 'lines' | 'social_post_type');
      }
    }
  }, [view, viewPreferences, socialViews]);

  async function loadViewPreferences() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_view_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const prefs = {
          calendar_enabled: data.calendar_enabled,
          editorial_calendar_enabled: data.editorial_calendar_enabled,
          production_calendar_enabled: data.production_calendar_enabled,
          studio_enabled: data.studio_enabled,
          type_view_enabled: data.type_view_enabled,
          table_view_enabled: data.table_view_enabled,
        };
        setViewPreferences(prefs);

        const availableViews = [];
        if (prefs.studio_enabled) availableViews.push('studio');
        if (prefs.calendar_enabled) availableViews.push('calendar');
        availableViews.push('stats', 'events');

        if (availableViews.length > 0 && !availableViews.includes(view)) {
          setView(availableViews[0] as any);
        }

        if (view === 'calendar') {
          if (prefs.editorial_calendar_enabled && !prefs.production_calendar_enabled) {
            setCalendarSubView('editorial');
          } else if (!prefs.editorial_calendar_enabled && prefs.production_calendar_enabled) {
            setCalendarSubView('production');
          }
        }

        if (view === 'studio') {
          if (prefs.type_view_enabled && !prefs.table_view_enabled) {
            setStudioSubView('columns');
          } else if (!prefs.type_view_enabled && prefs.table_view_enabled) {
            setStudioSubView('lines');
          } else {
            setStudioSubView('social_post_type');
          }
        }
      }
    } catch (error) {
      console.error('Error loading view preferences:', error);
    }
  }

  async function loadProfessionAndPillars() {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('company_profiles')
        .select('primary_profession')
        .eq('user_id', user.id)
        .maybeSingle();

      const profession = profileData?.primary_profession || 'nail_artist';
      setProfessionType(profession);

      const { data: pillarsData } = await supabase
        .from('editorial_pillars')
        .select('*')
        .eq('user_id', user.id)
        .eq('profession_type', profession)
        .eq('is_active', true)
        .order('created_at');

      if (pillarsData) {
        setPillars(pillarsData);
      }
    } catch (error) {
      console.error('Error loading profession/pillars:', error);
    }
  }

  async function loadContents() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('user_id', user.id)
        .order('publication_date', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error loading contents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAlerts() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }

  async function handleDismissAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from('content_alerts')
        .update({ status: 'dismissed' })
        .eq('id', alertId);

      if (error) throw error;
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  }

  function handleContentCreated(content: ContentItem) {
    setContents([...contents, content]);
    loadContents();
  }

  function handleContentUpdated() {
    loadContents();
  }

  async function handleKanbanContentUpdate(contentId: string, updates: Partial<ContentItem>) {
    try {
      const { error } = await supabase
        .from('content_calendar')
        .update(updates)
        .eq('id', contentId);

      if (error) throw error;
      loadContents();
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Erreur lors de la mise à jour');
    }
  }

  async function handleContentDelete(id: string) {
    if (!confirm('Supprimer ce contenu ?')) return;

    try {
      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadContents();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function openContentForm(options: { mode: 'create' | 'edit'; contentId?: string; prefillData?: Partial<ContentItem> }) {
    setContentFormState({
      isOpen: true,
      mode: options.mode,
      contentId: options.contentId,
      prefillData: options.prefillData
    });
  }

  function closeContentForm() {
    setContentFormState({
      isOpen: false,
      mode: 'create'
    });
  }

  function handleContentEdit(content: ContentItem) {
    openContentForm({ mode: 'edit', contentId: content.id });
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-belleya-50">
      <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-belleya-primary bg-clip-text text-transparent">
              Contenu & Réseaux Sociaux
            </h1>
            <p className="text-gray-600 mt-2">
              Planifiez, organisez et visualisez votre stratégie de contenu
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => openContentForm({ mode: 'create' })}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-orange-500 to-belleya-primary text-white rounded-xl hover:from-orange-600 hover:to-belleya-primary transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nouveau contenu</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
            <button
              onClick={() => setShowIdeasGenerator(true)}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white text-orange-600 border-2 border-orange-500 rounded-xl hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Lightbulb className="w-5 h-5" />
              <span className="hidden sm:inline">Boîte à idées</span>
              <span className="sm:hidden">Idées</span>
            </button>
          </div>
        </div>

        {alerts.length > 0 && (
          <ContentAlerts alerts={alerts} onDismiss={handleDismissAlert} />
        )}

        <div className="space-y-4 mb-6">
          <div className="flex gap-2 flex-wrap overflow-x-hidden">
            {viewPreferences.studio_enabled && (
              <button
                onClick={() => setView('studio')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                  view === 'studio'
                    ? 'bg-white text-orange-600 shadow-lg'
                    : 'bg-white/50 text-gray-600 hover:bg-white/80'
                }`}
              >
                <Clapperboard className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="hidden sm:inline">Studio de contenu</span>
                <span className="sm:hidden">Studio</span>
              </button>
            )}
            {viewPreferences.calendar_enabled && (
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                  view === 'calendar'
                    ? 'bg-white text-orange-600 shadow-lg'
                    : 'bg-white/50 text-gray-600 hover:bg-white/80'
                }`}
              >
                <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="hidden sm:inline">Calendrier</span>
                <span className="sm:hidden">Cal.</span>
              </button>
            )}
            <button
              onClick={() => setView('stats')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                view === 'stats'
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Statistiques</span>
              <span className="sm:hidden">Stats</span>
            </button>
            <button
              onClick={() => setView('events')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                view === 'events'
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Événements à prévoir</span>
              <span className="sm:hidden">Événements</span>
            </button>
          </div>

          {view === 'calendar' && (viewPreferences.editorial_calendar_enabled && socialViews.productionCalendar) && (
            <div className="flex gap-2 pl-0 sm:pl-4 sm:border-l-2 border-orange-300 flex-wrap overflow-x-hidden">
              {viewPreferences.editorial_calendar_enabled && (
                <button
                  onClick={() => setCalendarSubView('editorial')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    calendarSubView === 'editorial'
                      ? 'bg-orange-100 text-orange-700 font-medium'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="hidden sm:inline">Calendrier éditorial</span>
                  <span className="sm:hidden">Éditorial</span>
                </button>
              )}
              {socialViews.productionCalendar && (
                <button
                  onClick={() => setCalendarSubView('production')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    calendarSubView === 'production'
                      ? 'bg-orange-100 text-orange-700 font-medium'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clapperboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendrier de production</span>
                  <span className="sm:hidden">Production</span>
                </button>
              )}
            </div>
          )}

          {view === 'studio' && (() => {
            const availableStudioViews = [
              socialViews.viewByPostType,
              viewPreferences.type_view_enabled,
              viewPreferences.table_view_enabled
            ].filter(Boolean).length;
            return availableStudioViews > 1;
          })() && (
            <div className="flex gap-2 pl-0 sm:pl-4 sm:border-l-2 border-orange-300 flex-wrap overflow-x-hidden">
              {socialViews.viewByPostType && (
                <button
                  onClick={() => setStudioSubView('social_post_type')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    studioSubView === 'social_post_type'
                      ? 'bg-orange-100 text-orange-700 font-medium'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Instagram className="w-4 h-4" />
                  <span className="hidden sm:inline">Réseaux sociaux</span>
                  <span className="sm:hidden">Réseaux</span>
                </button>
              )}
              {viewPreferences.type_view_enabled && (
                <button
                  onClick={() => setStudioSubView('columns')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    studioSubView === 'columns'
                      ? 'bg-orange-100 text-orange-700 font-medium'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Kanban className="w-4 h-4" />
                  <span className="hidden sm:inline">Vue Colonnes</span>
                  <span className="sm:hidden">Colonnes</span>
                </button>
              )}
              {viewPreferences.table_view_enabled && (
                <button
                  onClick={() => setStudioSubView('lines')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    studioSubView === 'lines'
                      ? 'bg-orange-100 text-orange-700 font-medium'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span className="hidden sm:inline">Vue Lignes</span>
                  <span className="sm:hidden">Lignes</span>
                </button>
              )}
            </div>
          )}
        </div>

        {view === 'calendar' && calendarSubView === 'editorial' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <EditorialCalendar
                contents={contents.filter(c => c.status !== 'idea')}
                onContentCreated={handleContentCreated}
                onContentUpdated={handleContentUpdated}
                onContentEdit={openContentForm}
              />
            </div>
            <div className="lg:col-span-5">
              <InstagramFeed
                contents={contents.filter(c => c.status !== 'idea')}
                onContentUpdated={handleContentUpdated}
                onContentEdit={openContentForm}
              />
            </div>
          </div>
        )}

        {view === 'calendar' && calendarSubView === 'production' && (
          <ProductionCalendar
            onContentEdit={(contentId) => {
              const content = contents.find(c => c.id === contentId);
              if (content) {
                handleContentEdit(content);
              }
            }}
          />
        )}

        {view === 'studio' && studioSubView === 'columns' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Vue par type de contenu</h2>
              <p className="text-sm text-gray-600 mt-1">Organisez vos contenus par format</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Filtrer par réseau social</label>
              <div className="flex flex-wrap gap-2">
                {['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter'].map((platform) => {
                  const isSelected = platformFilter.includes(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => {
                        if (isSelected) {
                          setPlatformFilter(platformFilter.filter(p => p !== platform));
                        } else {
                          setPlatformFilter([...platformFilter, platform]);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  );
                })}
                {platformFilter.length > 0 && (
                  <button
                    onClick={() => setPlatformFilter([])}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            <KanbanView
              contents={contents.filter(c => {
                if (c.status === 'idea') return false;
                if (platformFilter.length === 0) return true;
                const contentPlatforms = c.platform.split(',');
                return contentPlatforms.some(p => platformFilter.includes(p));
              })}
              pillars={pillars}
              viewMode="type"
              onContentEdit={handleContentEdit}
              onContentDelete={handleContentDelete}
              onContentUpdated={handleKanbanContentUpdate}
              onContentCreate={openContentForm}
            />
          </div>
        )}

        {view === 'studio' && studioSubView === 'lines' && (
          <ContentTable
            contents={contents}
            pillars={pillars}
            onContentUpdated={handleContentUpdated}
            onContentEdit={handleContentEdit}
          />
        )}

        {view === 'studio' && studioSubView === 'social_post_type' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Vue par type de post</h2>
              <p className="text-sm text-gray-600 mt-1">Organisez vos contenus réseaux sociaux par format</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Filtrer par réseau social</label>
              <div className="flex flex-wrap gap-2">
                {['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter'].map((platform) => {
                  const isSelected = platformFilter.includes(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => {
                        if (isSelected) {
                          setPlatformFilter(platformFilter.filter(p => p !== platform));
                        } else {
                          setPlatformFilter([...platformFilter, platform]);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  );
                })}
                {platformFilter.length > 0 && (
                  <button
                    onClick={() => setPlatformFilter([])}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            <KanbanView
              contents={contents.filter(c => {
                if (c.status === 'idea') return false;
                if (platformFilter.length === 0) return true;
                const contentPlatforms = c.platform.split(',');
                return contentPlatforms.some(p => platformFilter.includes(p));
              })}
              pillars={pillars}
              viewMode="type"
              onContentEdit={handleContentEdit}
              onContentDelete={handleContentDelete}
              onContentUpdated={handleKanbanContentUpdate}
              onContentCreate={openContentForm}
            />
          </div>
        )}

        {view === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filtres de période</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const now = new Date();
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      setStatsDateRange({
                        start: firstDay.toISOString().split('T')[0],
                        end: lastDay.toISOString().split('T')[0]
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    Mois en cours
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      setStatsDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    3 derniers mois
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getFullYear(), 0, 1);
                      const end = new Date(now.getFullYear(), 11, 31);
                      setStatsDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    Année en cours
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={statsDateRange.start}
                    onChange={(e) => setStatsDateRange({ ...statsDateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={statsDateRange.end}
                    onChange={(e) => setStatsDateRange({ ...statsDateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                ℹ️ Les filtres de période n'impactent que les statistiques, pas le calendrier éditorial
              </div>
            </div>

            <ContentStats
              contents={contents}
              startDate={statsDateRange.start}
              endDate={statsDateRange.end}
            />

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Statistiques détaillées</h2>
              <ContentDetailedStats
                contents={contents}
                startDate={statsDateRange.start}
                endDate={statsDateRange.end}
              />
            </div>
          </div>
        )}

        {view === 'events' && <EventsCalendar onContentAdded={loadContents} />}

        {showIdeasGenerator && (
          <IdeasGenerator
            onClose={() => setShowIdeasGenerator(false)}
            onIdeaSaved={(idea) => {
              setShowIdeasGenerator(false);
              loadContents();
            }}
          />
        )}

        {contentFormState.isOpen && (
          <ContentFormModal
            mode={contentFormState.mode}
            contentId={contentFormState.contentId}
            prefillData={contentFormState.prefillData}
            onSuccess={loadContents}
            onClose={closeContentForm}
          />
        )}
      </div>
    </div>
  );
}
