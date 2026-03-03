import {
  LayoutDashboard,
  Users,
  Euro,
  Package,
  Handshake,
  Video,
  Lightbulb,
  Target,
  CheckSquare,
  LogOut,
  Sparkles,
  Calendar,
  Mail,
  Settings as SettingsIcon,
  Scissors,
  GraduationCap,
  Shield,
  Eye,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { prefetchClients } from '../../lib/clientsCache';
import { useMenuPreferences } from '../../lib/useMenuPreferences';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useSubscription } from '../../hooks/useSubscription';
import { getPlanName } from '../../lib/subscriptionHelpers';
import NotificationCenter from '../dashboard/NotificationCenter';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export default function Sidebar({ currentPage, onPageChange, isMobileOpen = false, onMobileToggle }: SidebarProps) {
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { isAdmin } = useIsAdmin();
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>();
  const hasPrefetchedRef = useRef(false);
  const { menuVisibility } = useMenuPreferences(user?.id);
  const { canAccess, getRequiredPlan, isActive } = useSubscription();

  const mobileOpen = onMobileToggle !== undefined ? isMobileOpen : internalMobileOpen;
  const setMobileOpen = onMobileToggle !== undefined ? onMobileToggle : setInternalMobileOpen;

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'agenda', label: t('nav.agenda'), icon: Calendar },
    { id: 'clients', label: t('nav.clients'), icon: Users },
    { id: 'training', label: t('training.title'), icon: GraduationCap },
    { id: 'services', label: t('nav.services'), icon: Scissors },
    { id: 'finances', label: t('nav.finances'), icon: Euro },
    { id: 'stock', label: t('nav.stock'), icon: Package },
    { id: 'tasks', label: t('nav.tasks'), icon: CheckSquare },
    { id: 'goals', label: t('nav.goals'), icon: Target },
    { id: 'content', label: t('nav.content'), icon: Video },
    { id: 'public-profile', label: 'Profil public', icon: Eye },
    { id: 'inspiration', label: t('nav.inspiration'), icon: Lightbulb },
    { id: 'marketing', label: t('nav.marketing'), icon: Mail },
    { id: 'partnerships', label: t('nav.partnerships'), icon: Handshake },
  ];

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      alert('Erreur lors de la déconnexion. Veuillez réessayer.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleMouseEnterClients = () => {
    if (hasPrefetchedRef.current || !user) return;

    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    prefetchTimeoutRef.current = setTimeout(() => {
      hasPrefetchedRef.current = true;
      prefetchClients(user.id, 'all', supabase);
    }, 300);
  };

  const handleMouseLeaveClients = () => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
  };

  const handlePageChange = (page: string) => {
    onPageChange(page);
    if (window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  };

  const handleLockedClick = () => {
    window.location.href = '/pricing';
  };

  return (
    <>
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div>
                <img src="/logo-1.png" alt="Belaya" className="h-8 w-auto" />
                <p className="text-xs text-gray-500 mt-1">{t('nav.tagline')}</p>
              </div>
            </div>
            <NotificationCenter compact={true} />
          </div>
        </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems
            .filter((item) => menuVisibility[item.id as keyof typeof menuVisibility] !== false)
            .map((item) => {
              const Icon = item.icon;
              const isActivePage = currentPage === item.id;
              const hasAccess = !isActive || canAccess(item.id);
              const locked = isActive && !hasAccess;

              if (locked) {
                const requiredPlan = getRequiredPlan(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={handleLockedClick}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-gray-50 group relative"
                    title={`Disponible avec ${requiredPlan ? getPlanName(requiredPlan) : 'une offre superieure'}`}
                  >
                    <Icon className="w-5 h-5 opacity-50" />
                    <span className="text-sm flex-1 text-left opacity-60">{item.label}</span>
                    <Lock className="w-4 h-4 text-gray-400 group-hover:text-belaya-deep transition-colors" />
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  onMouseEnter={item.id === 'clients' ? handleMouseEnterClients : undefined}
                  onMouseLeave={item.id === 'clients' ? handleMouseLeaveClients : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActivePage
                      ? 'bg-gradient-main text-white font-medium shadow-md'
                      : 'text-gray-600 hover:bg-gradient-soft hover:text-belaya-deep'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-1">
        {isAdmin && (
          <button
            onClick={() => handlePageChange('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === 'admin'
                ? 'bg-gradient-main text-white font-medium shadow-md'
                : 'text-gray-600 hover:bg-gradient-soft hover:text-belaya-deep'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-sm">{t('nav.admin')}</span>
          </button>
        )}
        <button
          onClick={() => handlePageChange('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentPage === 'settings'
              ? 'bg-gradient-main text-white font-medium shadow-md'
              : 'text-gray-600 hover:bg-gradient-soft hover:text-belaya-deep'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-sm">{t('nav.settings')}</span>
        </button>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">
            {isSigningOut ? t('nav.loggingOut') : t('nav.logout')}
          </span>
        </button>
      </div>
      </div>
    </>
  );
}
