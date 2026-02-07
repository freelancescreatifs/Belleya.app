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
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { prefetchClients } from '../../lib/clientsCache';
import { useMenuPreferences } from '../../lib/useMenuPreferences';
import NotificationCenter from '../dashboard/NotificationCenter';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'training', label: 'Élèves', icon: GraduationCap },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'finances', label: 'Transactions', icon: Euro },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'tasks', label: 'Tâches', icon: CheckSquare },
  { id: 'goals', label: 'Objectifs', icon: Target },
  { id: 'content', label: 'Contenu', icon: Video },
  { id: 'public-profile', label: 'Profil public', icon: Eye },
  { id: 'inspiration', label: 'Inspiration', icon: Lightbulb },
  { id: 'marketing', label: 'Marketing', icon: Mail },
  { id: 'partnerships', label: 'Partenariats', icon: Handshake },
];

export default function Sidebar({ currentPage, onPageChange, isMobileOpen = false, onMobileToggle }: SidebarProps) {
  const { signOut, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>();
  const hasPrefetchedRef = useRef(false);
  const { menuVisibility } = useMenuPreferences(user?.id);

  const mobileOpen = onMobileToggle !== undefined ? isMobileOpen : internalMobileOpen;
  const setMobileOpen = onMobileToggle !== undefined ? onMobileToggle : setInternalMobileOpen;

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      setIsAdmin(false);
    }
  };

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

  return (
    <>
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div>
                <img src="/logo-1.png" alt="BelleYa" className="h-8 w-auto" />
                <p className="text-xs text-gray-500 mt-1">Contrôle ton business, pas l'inverse</p>
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
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  onMouseEnter={item.id === 'clients' ? handleMouseEnterClients : undefined}
                  onMouseLeave={item.id === 'clients' ? handleMouseLeaveClients : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-main text-white font-medium shadow-md'
                      : 'text-gray-600 hover:bg-gradient-soft hover:text-belleya-deep'
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
                : 'text-gray-600 hover:bg-gradient-soft hover:text-belleya-deep'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-sm">Administration</span>
          </button>
        )}
        <button
          onClick={() => handlePageChange('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentPage === 'settings'
              ? 'bg-gradient-main text-white font-medium shadow-md'
              : 'text-gray-600 hover:bg-gradient-soft hover:text-belleya-deep'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-sm">Paramètres</span>
        </button>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">
            {isSigningOut ? 'Déconnexion...' : 'Déconnexion'}
          </span>
        </button>
      </div>
      </div>
    </>
  );
}
