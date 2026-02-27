import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Landing from './pages/Landing';
import PublicBooking from './pages/PublicBooking';
import Sidebar from './components/layout/Sidebar';
import BottomNavigation from './components/layout/BottomNavigation';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Agenda from './pages/Agenda';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Finances from './pages/Finances';
import Stock from './pages/Stock';
import Profitability from './pages/Profitability';
import Tasks from './pages/Tasks';
import Goals from './pages/Goals';
import Training from './pages/Training';
import StudentDetail from './pages/StudentDetail';
import Placeholder from './pages/Placeholder';
import Content from './pages/Content';
import Partnerships from './pages/Partnerships';
import Admin from './pages/Admin';
import Marketing from './pages/Marketing';
import Inspiration from './pages/Inspiration';
import PublicProfile from './pages/PublicProfile';
import Notifications from './pages/Notifications';
import ProviderPublicProfile from './pages/ProviderPublicProfile';
import Pricing from './pages/Pricing';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import MentionsLegales from './pages/MentionsLegales';
import CGV from './pages/CGV';
import ClientLayout from './components/client/ClientLayout';
import ClientHome from './pages/client/ClientHome';
import ClientBookings from './pages/client/ClientBookings';
import ClientMap from './pages/client/ClientMap';
import ClientFavorites from './pages/client/ClientFavorites';
import ClientProfile from './pages/client/ClientProfile';
import ProviderProfile from './pages/client/ProviderProfile';
import ChatBot from './components/shared/ChatBot';
import TrialBanner from './components/shared/TrialBanner';
import {
  Handshake,
  Video,
  Lightbulb,
  Mail,
  Loader2,
} from 'lucide-react';

function AppContent() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedRole, setSelectedRole] = useState<'client' | 'pro' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [navigationLocked, setNavigationLocked] = useState(false);
  const [profileRetryCount, setProfileRetryCount] = useState(0);
  const [pendingCheckoutPlan, setPendingCheckoutPlan] = useState<string | null>(null);

  const safeNavigate = (to: string, source?: string) => {
    console.trace('[NAVIGATION TRACE] safeNavigate called →', { to, source, currentPage, navigationLocked });

    if (navigationLocked && source !== 'user-action') {
      console.error('[NAVIGATION BLOCKED] Navigation forbidden - lock is active', { to, source });
      return;
    }

    if (source === 'agenda') {
      console.error('[NAVIGATION BLOCKED] Navigation forbidden from Agenda flow', { to });
      return;
    }

    console.log('[NAVIGATION ALLOWED] Navigating to:', to);
    setCurrentPage(to);
  };

  useEffect(() => {
    if (!user) {
      console.log('[NAVIGATION] User logged out, resetting to home');
      setSelectedRole(null);
      setProfileRetryCount(0);
      safeNavigate('home', 'auth-change');
    }
  }, [user]);

  useEffect(() => {
    if (user && profile) {
      const storedPlan = localStorage.getItem('pending_plan');
      if (storedPlan) {
        localStorage.removeItem('pending_plan');
        setPendingCheckoutPlan(storedPlan);
      }
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && !profile && !loading && profileRetryCount < 10) {
      const timer = setTimeout(async () => {
        console.log(`[App] Retrying profile load (${profileRetryCount + 1}/10)`);
        setProfileRetryCount(prev => prev + 1);
        await refreshProfile();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, profile, loading, profileRetryCount, refreshProfile]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        safeNavigate(hash, 'hashchange');
        window.location.hash = '';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const pathname = window.location.pathname;
  const isBookingPage = pathname.startsWith('/book/');
  const isProviderProfilePage = pathname.startsWith('/provider/');
  const isPublicProfilePage = pathname.startsWith('/profile/');
  const isStudentDetailPage = pathname.startsWith('/training/students/');
  const isPricingPage = pathname === '/pricing';
  const isSubscriptionSuccessPage = pathname === '/subscription-success';
  const isSubscriptionCancelPage = pathname === '/subscription-cancel';
  const isMentionsLegalesPage = pathname === '/mentions-legales';
  const isCGVPage = pathname === '/cgv';

  if (isBookingPage) {
    const slug = pathname.replace('/book/', '');
    return (
      <>
        <PublicBooking slug={slug} />
        <ChatBot />
      </>
    );
  }

  if (isProviderProfilePage) {
    const slug = pathname.replace('/provider/', '');
    return (
      <>
        <ProviderProfile slug={slug} />
        <ChatBot />
      </>
    );
  }

  if (isPublicProfilePage) {
    const slug = pathname.replace('/profile/', '');
    return (
      <>
        <ProviderPublicProfile />
        <ChatBot />
      </>
    );
  }

  if (isPricingPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPlan = urlParams.get('auto') === 'true' ? urlParams.get('plan') : undefined;
    return (
      <>
        <Pricing autoPlan={urlPlan || undefined} />
        <ChatBot />
      </>
    );
  }

  if (isSubscriptionSuccessPage) {
    return <SubscriptionSuccess />;
  }

  if (isSubscriptionCancelPage) {
    return <SubscriptionCancel />;
  }

  if (isMentionsLegalesPage) {
    return (
      <>
        <MentionsLegales />
        <ChatBot />
      </>
    );
  }

  if (isCGVPage) {
    return (
      <>
        <CGV />
        <ChatBot />
      </>
    );
  }

  useEffect(() => {
    if (isStudentDetailPage && user) {
      safeNavigate(pathname, 'student-detail-route');
    }
  }, [pathname, isStudentDetailPage, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    if (!selectedRole) {
      return (
        <>
          <Landing onSelectRole={(role, plan) => {
            setSelectedRole(role);
            if (plan) {
              setSelectedPlan(plan);
              localStorage.setItem('pending_plan', plan);
            }
          }} />
          <ChatBot />
        </>
      );
    }
    return (
      <>
        <AuthPage role={selectedRole} selectedPlan={selectedPlan} onBack={() => { setSelectedRole(null); setSelectedPlan(null); }} />
        <ChatBot />
      </>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-gray-500 mb-2">Chargement du profil...</div>
          {profileRetryCount > 0 && (
            <div className="text-sm text-gray-400 mb-4">
              Tentative {profileRetryCount}/10
            </div>
          )}
          {profileRetryCount >= 10 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                Le profil prend plus de temps que prévu à se charger.
              </p>
              <p className="text-xs text-yellow-600">
                Veuillez vous déconnecter et vous reconnecter.
              </p>
            </div>
          )}
          <button
            onClick={async () => {
              await signOut();
              setSelectedRole(null);
              setProfileRetryCount(0);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (pendingCheckoutPlan) {
    return (
      <>
        <Pricing autoPlan={pendingCheckoutPlan} onDone={() => setPendingCheckoutPlan(null)} />
        <ChatBot />
      </>
    );
  }

  if (profile.role === 'client') {
    const renderClientPage = () => {
      switch (currentPage) {
        case 'home':
          return <ClientHome onNavigateToMap={() => setCurrentPage('map')} />;
        case 'bookings':
          return <ClientBookings />;
        case 'map':
          return <ClientMap />;
        case 'favorites':
          return <ClientFavorites />;
        case 'profile':
          return <ClientProfile />;
        default:
          return <ClientHome onNavigateToMap={() => setCurrentPage('map')} />;
      }
    };

    return (
      <>
        <ClientLayout currentPage={currentPage} onPageChange={setCurrentPage}>
          {renderClientPage()}
        </ClientLayout>
        <ChatBot />
      </>
    );
  }

  const renderPage = () => {
    if (currentPage.startsWith('training/students/')) {
      return <StudentDetail onPageChange={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'home':
      case 'dashboard':
        return <Dashboard onPageChange={setCurrentPage} />;
      case 'settings':
        return <Settings />;
      case 'agenda':
        return <Agenda />;
      case 'clients':
        return <Clients />;
      case 'services':
        return <Services />;
      case 'finances':
        return <Finances />;
      case 'stock':
        return <Stock />;
      case 'tasks':
        return <Tasks />;
      case 'goals':
        return <Goals />;
      case 'training':
        return <Training onPageChange={setCurrentPage} />;
      case 'content':
        return <Content />;
      case 'public-profile':
        return <PublicProfile />;
      case 'inspiration':
        return <Inspiration />;
      case 'marketing':
        return <Marketing />;
      case 'profitability':
        return <Profitability />;
      case 'partnerships':
        return <Partnerships />;
      case 'admin':
        return <Admin />;
      case 'notifications':
        return <Notifications />;
      case 'pricing':
        return <Pricing autoPlan={undefined} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar desktop only */}
      <div className="hidden lg:block">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Trial Banner */}
        <TrialBanner />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto w-full lg:w-auto pb-20 lg:pb-0">
          {renderPage()}
        </main>
      </div>

      {/* Bottom Navigation mobile only */}
      <BottomNavigation currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* ChatBot accessible from all pages */}
      <ChatBot />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
