import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, Users, Target, TrendingUp,
  DollarSign, Package, GraduationCap, Lightbulb, Handshake, Scissors,
  Eye, CheckSquare, Video, Lock, Check, AlertCircle, Loader
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SocialMediaSettingsProps {
  userId: string;
}

interface MenuVisibility {
  dashboard: boolean;
  agenda: boolean;
  clients: boolean;
  training: boolean;
  services: boolean;
  finances: boolean;
  stock: boolean;
  tasks: boolean;
  goals: boolean;
  content: boolean;
  'public-profile': boolean;
  inspiration: boolean;
  marketing: boolean;
  partnerships: boolean;
}

interface SocialViews {
  viewByPostType: boolean;
  productionCalendar: boolean;
}

const menuTabs = [
  { id: 'dashboard', name: 'Tableau de bord', icon: LayoutDashboard, locked: true },
  { id: 'agenda', name: 'Agenda', icon: Calendar, locked: false },
  { id: 'clients', name: 'Clientes', icon: Users, locked: false },
  { id: 'training', name: 'Élèves', icon: GraduationCap, locked: false },
  { id: 'services', name: 'Services', icon: Scissors, locked: false },
  { id: 'finances', name: 'Transactions', icon: DollarSign, locked: false },
  { id: 'stock', name: 'Stock', icon: Package, locked: false },
  { id: 'tasks', name: 'Tâches', icon: CheckSquare, locked: false },
  { id: 'goals', name: 'Objectifs', icon: Target, locked: false },
  { id: 'content', name: 'Contenu', icon: Video, locked: false },
  { id: 'public-profile', name: 'Profil public', icon: Eye, locked: false },
  { id: 'inspiration', name: 'Inspiration', icon: Lightbulb, locked: false },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp, locked: false },
  { id: 'partnerships', name: 'Partenariats', icon: Handshake, locked: false },
];

const socialViewOptions = [
  { id: 'viewByPostType', name: 'Vue par type de post', description: 'Afficher la vue organisée par type de contenu' },
  { id: 'productionCalendar', name: 'Calendrier de production', description: 'Afficher le calendrier de production' },
];

export default function SocialMediaSettings({ userId }: SocialMediaSettingsProps) {
  const [menuVisibility, setMenuVisibility] = useState<MenuVisibility | null>(null);
  const [socialViews, setSocialViews] = useState<SocialViews | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadPreferences = async () => {
    try {
      const [menuPrefsResult, contentViewResult] = await Promise.all([
        supabase
          .from('menu_preferences')
          .select('menu_visibility, social_views')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('content_view_preferences')
          .select('social_by_post_type_enabled, social_by_production_enabled')
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      if (menuPrefsResult.error && menuPrefsResult.error.code !== 'PGRST116') {
        throw menuPrefsResult.error;
      }

      const defaultMenuVisibility: MenuVisibility = {
        dashboard: true,
        agenda: true,
        clients: true,
        training: true,
        services: true,
        finances: true,
        stock: true,
        tasks: true,
        goals: true,
        content: true,
        'public-profile': true,
        inspiration: true,
        marketing: true,
        partnerships: true,
      };

      let socialViewsFromContentPrefs: SocialViews | null = null;
      if (contentViewResult.data) {
        socialViewsFromContentPrefs = {
          viewByPostType: contentViewResult.data.social_by_post_type_enabled ?? true,
          productionCalendar: contentViewResult.data.social_by_production_enabled ?? true,
        };
      }

      if (menuPrefsResult.data) {
        setMenuVisibility(menuPrefsResult.data.menu_visibility as MenuVisibility);
        const socialViewsFromMenu = menuPrefsResult.data.social_views as SocialViews;
        setSocialViews(socialViewsFromContentPrefs || socialViewsFromMenu);
      } else {
        const defaultSocialViews: SocialViews = socialViewsFromContentPrefs || {
          viewByPostType: true,
          productionCalendar: true,
        };
        setMenuVisibility(defaultMenuVisibility);
        setSocialViews(defaultSocialViews);

        await supabase
          .from('menu_preferences')
          .insert({
            user_id: userId,
            menu_visibility: defaultMenuVisibility,
            social_views: defaultSocialViews,
          });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const savePreferences = async (newMenuVisibility: MenuVisibility, newSocialViews: SocialViews) => {
    setSaving(true);
    try {
      const { error: menuError } = await supabase
        .from('menu_preferences')
        .update({
          menu_visibility: newMenuVisibility,
          social_views: newSocialViews,
        })
        .eq('user_id', userId);

      if (menuError) throw menuError;

      const { error: contentViewError } = await supabase
        .from('content_view_preferences')
        .upsert({
          user_id: userId,
          social_by_post_type_enabled: newSocialViews.viewByPostType,
          social_by_production_enabled: newSocialViews.productionCalendar,
        }, {
          onConflict: 'user_id'
        });

      if (contentViewError) throw contentViewError;

      window.dispatchEvent(new CustomEvent('menuPreferencesUpdated', {
        detail: { menuVisibility: newMenuVisibility, socialViews: newSocialViews }
      }));

      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showToast('Impossible d\'enregistrer', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getCurrentPage = (): string => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  };

  const handleMenuToggle = async (tabId: string) => {
    if (!menuVisibility || !socialViews) return;

    const currentPage = getCurrentPage();
    const isCurrentPage = currentPage === tabId;

    const newMenuVisibility = {
      ...menuVisibility,
      [tabId]: !menuVisibility[tabId as keyof MenuVisibility],
    };

    const oldState = menuVisibility[tabId as keyof MenuVisibility];
    setMenuVisibility(newMenuVisibility);

    const success = await savePreferences(newMenuVisibility, socialViews);

    if (success) {
      const newState = newMenuVisibility[tabId as keyof MenuVisibility];
      showToast(newState ? 'Onglet affiché' : 'Onglet masqué', 'success');

      if (!newState && isCurrentPage) {
        window.location.hash = '#dashboard';
      }
    } else {
      setMenuVisibility({
        ...menuVisibility,
        [tabId]: oldState,
      });
    }
  };

  const handleSocialViewToggle = async (viewId: string) => {
    if (!menuVisibility || !socialViews) return;

    const newSocialViews = {
      ...socialViews,
      [viewId]: !socialViews[viewId as keyof SocialViews],
    };

    const oldState = socialViews[viewId as keyof SocialViews];
    setSocialViews(newSocialViews);

    const success = await savePreferences(menuVisibility, newSocialViews);

    if (success) {
      const newState = newSocialViews[viewId as keyof SocialViews];
      showToast(newState ? 'Vue activée' : 'Vue masquée', 'success');
    } else {
      setSocialViews({
        ...socialViews,
        [viewId]: oldState,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-[#C43586] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion des onglets</h3>
        <p className="text-gray-600">
          Personnalisez les onglets visibles dans votre menu principal
        </p>
      </div>

      <div className="space-y-3">
        {menuTabs.map((tab) => {
          const Icon = tab.icon;
          const isEnabled = menuVisibility?.[tab.id as keyof MenuVisibility] ?? true;

          return (
            <div
              key={tab.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-gradient-soft' : 'bg-gray-100'}`}>
                  <Icon className={`w-5 h-5 ${isEnabled ? 'text-[#C43586]' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{tab.name}</h4>
                  {tab.locked && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Lock className="w-3 h-3" />
                      Onglet obligatoire
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => !tab.locked && handleMenuToggle(tab.id)}
                disabled={tab.locked || saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C43586] focus:ring-offset-2 ${
                  tab.locked
                    ? 'bg-gray-200 cursor-not-allowed'
                    : isEnabled
                    ? 'bg-gradient-main cursor-pointer'
                    : 'bg-gray-300 cursor-pointer'
                } ${saving ? 'opacity-50' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-gray-200">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Réseaux sociaux</h3>
          <p className="text-gray-600">
            Choisis les vues à afficher dans ton espace Réseaux sociaux
          </p>
        </div>

        <div className="space-y-3">
          {socialViewOptions.map((view) => {
            const isEnabled = socialViews?.[view.id as keyof SocialViews] ?? true;

            return (
              <div
                key={view.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{view.name}</h4>
                  <p className="text-sm text-gray-600 mt-0.5">{view.description}</p>
                </div>
                <button
                  onClick={() => handleSocialViewToggle(view.id)}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C43586] focus:ring-offset-2 ${
                    isEnabled
                      ? 'bg-gradient-main cursor-pointer'
                      : 'bg-gray-300 cursor-pointer'
                  } ${saving ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
