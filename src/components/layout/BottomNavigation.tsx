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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useMenuPreferences } from '../../lib/useMenuPreferences';
import { useAuth } from '../../contexts/AuthContext';

interface BottomNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const mainTabs = [
  { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'tasks', label: 'Tâches', icon: CheckSquare },
];

const moreTabs = [
  { id: 'content', label: 'Contenu', icon: Video },
  { id: 'training', label: 'Élèves', icon: GraduationCap },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'finances', label: 'Transactions', icon: Euro },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'goals', label: 'Objectifs', icon: Target },
  { id: 'public-profile', label: 'Profil public', icon: Eye },
  { id: 'inspiration', label: 'Inspiration', icon: Lightbulb },
  { id: 'marketing', label: 'Marketing', icon: Mail },
  { id: 'partnerships', label: 'Partenariats', icon: Handshake },
  { id: 'settings', label: 'Paramètres', icon: Settings },
  { id: 'admin', label: 'Administration', icon: Shield },
];

export default function BottomNavigation({ currentPage, onPageChange }: BottomNavigationProps) {
  const { user } = useAuth();
  const { menuVisibility } = useMenuPreferences(user?.id);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
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
              Plus
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
              <h3 className="text-lg font-semibold text-gray-900">Plus d'options</h3>
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
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
