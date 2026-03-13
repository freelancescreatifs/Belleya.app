import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Landing from './pages/Landing';
import PublicBooking from './pages/PublicBooking';
import BookingDirectory from './pages/BookingDirectory';
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
import AffiliateLanding from './pages/AffiliateLanding';
import AffiliateApply from './pages/AffiliateApply';
import PartnerDashboard from './pages/PartnerDashboard';
import ChatBot from './components/shared/ChatBot';
import BelayaLoader from './components/shared/BelayaLoader';
import { supabase } from './lib/supabase';
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
  const [awaitingGoogleProfile, setAwaitingGoogleProfile] = useState(
    () => !!localStorage.getItem('pending_google_role')
  );
  const awaitingGoogleRef = useRef(awaitingGoogleProfile);
  const [affiliatePage, setAffiliatePage] = useState<'landing' | 'apply' | 'dashboard' | null>(null);
  const [affiliateCodeChecked, setAffiliateCodeChecked] = useState(false);

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
    if (!user && !loading) {
      awaitingGoogleRef.current = false;
      setAwaitingGoogleProfile(false);
      console.log('[NAVIGATION] User logged out, resetting to home');
      setSelectedRole(null);
      setProfileRetryCount(0);
      safeNavigate('home', 'auth-change');
    }
  }, [user, loading]);

  useEffect(() => {
    if (user && profile) {
      const wasAwaitingGoogle = awaitingGoogleRef.current;
      awaitingGoogleRef.current = false;
      setAwaitingGoogleProfile(false);

      const storedPlan = localStorage.getItem('pending_plan');
      if (storedPlan) {
        localStorage.removeItem('pending_plan');
        setPendingCheckoutPlan(storedPlan);
        return;
      }

      if (wasAwaitingGoogle) {
        const isNewSignup = localStorage.getItem('pending_google_new_signup') === '1';
        localStorage.removeItem('pending_google_new_signup');

        if (profile.role === 'affiliate') {
          setAffiliatePage('dashboard');
          window.history.pushState({}, '', '/partner/dashboard');
        } else if (profile.role === 'client') {
          setCurrentPage('home');
        } else {
          if (isNewSignup) {
            setCurrentPage('settings');
          } else {
            setCurrentPage('dashboard');
          }
        }
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
    const isSupabaseAuthHash = (hash: string) => {
      return hash.includes('access_token=') ||
        hash.includes('refresh_token=') ||
        hash.includes('error_description=') ||
        hash.includes('type=recovery');
    };

    const handleHashChange = () => {
      const rawHash = window.location.hash;
      if (isSupabaseAuthHash(rawHash)) {
        return;
      }
      const hash = rawHash.replace('#', '');
      if (hash) {
        safeNavigate(hash, 'hashchange');
        window.location.hash = '';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    const handleBelayaNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.page) {
        safeNavigate(detail.page, 'custom-event');
      }
    };
    window.addEventListener('belaya_navigate', handleBelayaNavigate);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('belaya_navigate', handleBelayaNavigate);
    };
  }, []);

  useEffect(() => {
    const syncAffiliateState = () => {
      const loc = window.location.pathname;
      if (loc === '/partenaire') {
        setAffiliatePage('landing');
      } else if (loc === '/partenaire/apply') {
        setAffiliatePage('apply');
      } else if (loc === '/partner/dashboard') {
        setAffiliatePage('dashboard');
      } else if (affiliatePage !== null) {
        setAffiliatePage(null);
      }
    };

    window.addEventListener('popstate', syncAffiliateState);
    return () => window.removeEventListener('popstate', syncAffiliateState);
  }, [affiliatePage]);

  const pathname = window.location.pathname;
  const isBookingPage = pathname.startsWith('/book/');
  const isProviderProfilePage = pathname.startsWith('/provider/');
  const isPublicProfilePage = pathname.startsWith('/profile/');
  const isStudentDetailPage = pathname.startsWith('/training/students/');
  const isSettingsRedirect = pathname === '/settings';
  const isPricingPage = pathname === '/pricing';
  const isSubscriptionSuccessPage = pathname === '/subscription-success';
  const isSubscriptionCancelPage = pathname === '/subscription-cancel';
  const isMentionsLegalesPage = pathname === '/mentions-legales';
  const isCGVPage = pathname === '/cgv';
  const isAffiliateLandingPage = pathname === '/partenaire';
  const isAffiliateApplyPage = pathname === '/partenaire/apply';
  const isPartnerDashboardPage = pathname === '/partner/dashboard';

  const KNOWN_ROUTES = [
    '/', '/book', '/partenaire', '/partenaire/apply', '/partner/dashboard',
    '/pricing', '/subscription-success', '/subscription-cancel',
    '/mentions-legales', '/cgv', '/settings', '/diag-auth',
  ];
  const KNOWN_PREFIXES = ['/book/', '/provider/', '/profile/', '/training/students/'];

  const isKnownRoute = KNOWN_ROUTES.includes(pathname)
    || KNOWN_PREFIXES.some(p => pathname.startsWith(p))
    || pathname === '';

  const refParam = new URLSearchParams(window.location.search).get('ref');
  if (refParam && !localStorage.getItem('belaya_ref')) {
    localStorage.setItem('belaya_ref', refParam);
    localStorage.setItem('belaya_ref_date', new Date().toISOString());
    window.history.replaceState({}, '', pathname);
  }

  useEffect(() => {
    if (affiliateCodeChecked) return;
    if (isKnownRoute || pathname === '/') {
      setAffiliateCodeChecked(true);
      return;
    }

    const segments = pathname.replace(/^\//, '').split('/');
    if (segments.length === 1 && /^[a-zA-Z0-9_-]{3,30}$/.test(segments[0])) {
      const code = segments[0];
      localStorage.setItem('belaya_ref', code);
      localStorage.setItem('belaya_ref_date', new Date().toISOString());
      window.history.replaceState({}, '', '/');
      window.location.reload();
      return;
    }

    setAffiliateCodeChecked(true);
  }, [pathname, isKnownRoute, affiliateCodeChecked]);

  if (!affiliateCodeChecked && !isKnownRoute) {
    return <BelayaLoader variant="full" />;
  }

  if (pathname === '/book') {
    return (
      <>
        <BookingDirectory />
        <ChatBot />
      </>
    );
  }

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

  if (isAffiliateLandingPage || affiliatePage === 'landing') {
    return (
      <AffiliateLanding
        onApply={() => {
          setAffiliatePage('apply');
          window.history.pushState({}, '', '/partenaire/apply');
        }}
        onDashboard={() => {
          setAffiliatePage('dashboard');
          window.history.pushState({}, '', '/partner/dashboard');
        }}
      />
    );
  }

  if (isAffiliateApplyPage || affiliatePage === 'apply') {
    return (
      <AffiliateApply
        onBack={() => {
          setAffiliatePage('landing');
          window.history.pushState({}, '', '/partenaire');
        }}
        onSuccess={() => {
          setAffiliatePage('dashboard');
          window.history.pushState({}, '', '/partner/dashboard');
        }}
      />
    );
  }

  if (isPartnerDashboardPage || affiliatePage === 'dashboard') {
    return (
      <PartnerDashboard
        onBack={() => {
          setAffiliatePage('landing');
          window.history.pushState({}, '', '/partenaire');
        }}
        onApply={() => {
          setAffiliatePage('apply');
          window.history.pushState({}, '', '/partenaire/apply');
        }}
      />
    );
  }

  useEffect(() => {
    if (isStudentDetailPage && user) {
      safeNavigate(pathname, 'student-detail-route');
    }
  }, [pathname, isStudentDetailPage, user]);

  useEffect(() => {
    if (isSettingsRedirect && user && profile) {
      safeNavigate('settings', 'settings-redirect');
    }
  }, [isSettingsRedirect, user, profile]);

  if (loading || awaitingGoogleProfile) {
    return <BelayaLoader variant="full" showTimer showTips />;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-belaya-50 flex flex-col items-center justify-center px-6">
        <BelayaLoader variant="section" message="Chargement du profil..." />
        {profileRetryCount > 0 && (
          <div className="text-sm text-gray-400 mb-4">
            Tentative {profileRetryCount}/10
          </div>
        )}
        {profileRetryCount >= 10 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 max-w-sm">
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
