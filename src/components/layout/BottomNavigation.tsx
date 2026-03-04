import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  MoreHorizontal,
  Video,
  Euro,
  Package,
  Target,
  Scissors,
  GraduationCap,
  Eye,
  Lightbulb,
  Mail,
  Handshake,
  X,
  Settings,
  Shield,
  LogOut,
  Lock,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useMenuPreferences } from '../../lib/useMenuPreferences';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';

interface BottomNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const mainTabDefs = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { id: 'agenda', labelKey: 'nav.agenda', icon: Calendar },
  { id: 'clients', labelKey: 'nav.clients', icon: Users },
  { id: 'tasks', labelKey: 'nav.tasks', icon: CheckSquare },
];

const moreTabDefs = [
  { id: 'content', labelKey: 'nav.content', icon: Video },
  { id: 'training', labelKey: 'training.title', icon: GraduationCap },
  { id: 'services', labelKey: 'nav.services', icon: Scissors },
  { id: 'finances', labelKey: 'nav.finances', icon: Euro },
  { id: 'stock', labelKey: 'nav.stock', icon: Package },
  { id: 'goals', labelKey: 'nav.goals', icon: Target },
  { id: 'public-profile', labelKey: 'nav.publicProfile', icon: Eye },
  { id: 'inspiration', labelKey: 'nav.inspiration', icon: Lightbulb },
  { id: 'marketing', labelKey: 'nav.marketing', icon: Mail },
  { id: 'partnerships', labelKey: 'nav.partnerships', icon: Handshake },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings },
  { id: 'admin', labelKey: 'nav.admin', icon: Shield },
];

export default function BottomNavigation({ currentPage, onPageChange }: BottomNavigationProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { menuVisibility } = useMenuPreferences(user?.id);
  const { canAccess, isActive: subscriptionActive } = useSubscription();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = mainTabDefs.map(tab => ({ ...tab, label: t(tab.labelKey) }));
  const moreTabs = moreTabDefs.map(tab => ({ ...tab, label: t(tab.labelKey) }));

  const visibleMainTabs = mainTabs.filter(tab => menuVisibility[tab.id as keyof typeof menuVisibility] !== false);
  const visibleMoreTabs = moreTabs.filter(tab => menuVisibility[tab.id as keyof typeof menuVisibility] !== false);

  const isMainTabActive = visibleMainTabs.some(tab => tab.id === currentPage);
  const isMoreTabActive = visibleMoreTabs.some(tab => tab.id === currentPage);

  const handleTabClick = (id: string) => {
    if (id === 'more') {
      setShowMoreMenu(true);
    } else {
      onPageChange(id);
    }
  };

  const handleMoreItemClick = (id: string) => {
    onPageChange(id);
    setShowMoreMenu(false);
  };

  const handleLogout = async () => {
    if (confirm(t('nav.confirmLogout'))) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {visibleMainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors ${
                  isActive
                    ? 'text-belaya-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-6 h-6 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => handleTabClick('more')}
            className={`flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors ${
              isMoreTabActive && !isMainTabActive
                ? 'text-belaya-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MoreHorizontal className={`w-6 h-6 mb-0.5 ${isMoreTabActive && !isMainTabActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className={`text-[10px] leading-tight ${isMoreTabActive && !isMainTabActive ? 'font-semibold' : 'font-medium'}`}>
              {t('nav.more')}
            </span>
          </button>
        </div>
      </nav>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity"
            onClick={() => setShowMoreMenu(false)}
          />

          {/* Menu Panel */}
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col safe-area-bottom">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('nav.moreOptions')}</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                {visibleMoreTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentPage === tab.id;
                  const hasAccess = !subscriptionActive || canAccess(tab.id);
                  const locked = subscriptionActive && !hasAccess;

                  if (locked) {
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setShowMoreMenu(false);
                          window.location.href = '/pricing';
                        }}
                        className="relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all bg-gray-50 text-gray-400"
                      >
                        <Icon className="w-7 h-7 mb-2 stroke-2 opacity-40" />
                        <span className="text-xs text-center leading-tight font-medium opacity-60">
                          {tab.label}
                        </span>
                        <Lock className="absolute top-2 right-2 w-3.5 h-3.5 text-gray-400" />
                      </button>
                    );
                  }

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleMoreItemClick(tab.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
                        isActive
                          ? 'bg-gradient-main text-white shadow-md'
                          : 'bg-gradient-soft text-belaya-deep hover:shadow-sm'
                      }`}
                    >
                      <Icon className={`w-7 h-7 mb-2 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                      <span className={`text-xs text-center leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout Button */}
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
