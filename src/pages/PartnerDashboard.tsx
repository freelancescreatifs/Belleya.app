import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAffiliate } from '../hooks/useAffiliate';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/shared/LoadingScreen';
import DashboardLevel from '../components/partner/DashboardLevel';
import DashboardStats from '../components/partner/DashboardStats';
import DashboardLeaderboard from '../components/partner/DashboardLeaderboard';
import DashboardZoneRouge from '../components/partner/DashboardZoneRouge';
import DashboardCommissions from '../components/partner/DashboardCommissions';
import { LogOut, Copy, Check, TriangleAlert as AlertTriangle, Circle as XCircle, RefreshCw } from 'lucide-react';

export default function PartnerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { affiliate, loading: affLoading, error: affError, reload } = useAffiliate(user?.id);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  if (authLoading || affLoading) {
    return <LoadingScreen message="Chargement du dashboard..." />;
  }

  if (!user) {
    return null;
  }

  if (affError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
        <p className="text-gray-500 text-sm mb-4 text-center">{affError}</p>
        <button
          onClick={reload}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reessayer
        </button>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acces restreint</h2>
        <p className="text-gray-500 text-sm mb-4 text-center max-w-md">
          Vous devez etre affilie Belaya pour acceder a ce dashboard.
        </p>
        <a
          href="/partenaire"
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          Devenir partenaire
        </a>
      </div>
    );
  }

  if (affiliate.status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Candidature en attente</h2>
        <p className="text-gray-500 text-sm text-center max-w-md">
          Votre candidature est en cours de validation. Vous recevrez un acces des qu'elle sera approuvee.
        </p>
      </div>
    );
  }

  if (affiliate.status === 'disabled') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Compte desactive</h2>
        <p className="text-gray-500 text-sm text-center max-w-md">
          Votre compte affilie a ete desactive pour inactivite. Contactez le support pour le reactiver.
        </p>
      </div>
    );
  }

  const affiliateLink = `https://belaya.app/?ref=${affiliate.ref_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Belaya</h1>
            <span className="text-xs font-medium bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Partenaire</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{affiliate.email}</span>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Deconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {affiliate.status === 'observation' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">14 jours sans inscription</p>
              <p className="text-amber-700 text-sm">Passe a l'action pour conserver ton statut actif.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-500 mb-2">Ton lien affilie</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 truncate">
              {affiliateLink}
            </code>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-brand-500 text-white hover:bg-brand-600 active:scale-95'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copie' : 'Copier'}
            </button>
          </div>
        </div>

        <DashboardLevel affiliate={affiliate} />
        <DashboardStats affiliateId={affiliate.id} />
        <DashboardLeaderboard />
        <DashboardZoneRouge affiliate={affiliate} />
        <DashboardCommissions affiliateId={affiliate.id} />
      </main>
    </div>
  );
}
