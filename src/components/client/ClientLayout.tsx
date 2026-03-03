import { Home, Map, Calendar, Heart, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from './NotificationBell';

interface ClientLayoutProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  children: React.ReactNode;
}

const navItems = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'map', label: 'Carte', icon: Map },
  { id: 'bookings', label: 'RDV', icon: Calendar },
  { id: 'favorites', label: 'Favoris', icon: Heart },
  { id: 'profile', label: 'Profil', icon: User },
];

export default function ClientLayout({ currentPage, onPageChange, children }: ClientLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 h-16 flex items-center justify-end px-4">
        {user && <NotificationBell userId={user.id} onNavigate={onPageChange} />}
      </header>

      <main className="flex-1 overflow-y-auto pt-16 pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-belaya-primary' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-belaya-primary' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
