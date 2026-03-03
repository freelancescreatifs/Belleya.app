import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, AlertTriangle, ExternalLink, Loader, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentAccount {
  id: string;
  provider: 'stripe' | 'paypal';
  account_id: string;
  status: 'pending' | 'active' | 'incomplete' | 'disabled';
  charges_enabled: boolean;
  payouts_enabled: boolean;
  account_link_url: string | null;
  account_link_expires_at: string | null;
}

interface PaymentProviderSetupProps {
  depositRequired: boolean;
  onStatusChange?: () => void;
}

export default function PaymentProviderSetup({ depositRequired, onStatusChange }: PaymentProviderSetupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [connectingPayPal, setConnectingPayPal] = useState(false);
  const [refreshingStripe, setRefreshingStripe] = useState(false);
  const [refreshingPayPal, setRefreshingPayPal] = useState(false);
  const [stripeAccount, setStripeAccount] = useState<PaymentAccount | null>(null);
  const [paypalAccount, setPaypalAccount] = useState<PaymentAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentAccounts();
  }, [user]);

  const loadPaymentAccounts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) return;

      const { data: accounts } = await supabase
        .from('provider_payment_accounts')
        .select('*')
        .eq('company_id', companyData.id);

      if (accounts) {
        const stripe = accounts.find(acc => acc.provider === 'stripe');
        const paypal = accounts.find(acc => acc.provider === 'paypal');

        setStripeAccount(stripe || null);
        setPaypalAccount(paypal || null);
      }
    } catch (err: any) {
      console.error('Error loading payment accounts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect?action=create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect Stripe');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Error connecting Stripe:', err);
      setError(err.message);
      setConnectingStripe(false);
    }
  };

  const handleConnectPayPal = async () => {
    setConnectingPayPal(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-connect?action=create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect PayPal');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Error connecting PayPal:', err);
      setError(err.message);
      setConnectingPayPal(false);
    }
  };

  const handleRefreshStripeStatus = async () => {
    setRefreshingStripe(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect?action=status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh Stripe status');
      }

      await loadPaymentAccounts();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      console.error('Error refreshing Stripe status:', err);
      setError(err.message);
    } finally {
      setRefreshingStripe(false);
    }
  };

  const handleRefreshPayPalStatus = async () => {
    setRefreshingPayPal(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-connect?action=status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh PayPal status');
      }

      await loadPaymentAccounts();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      console.error('Error refreshing PayPal status:', err);
      setError(err.message);
    } finally {
      setRefreshingPayPal(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect?action=dashboard`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to open Stripe dashboard');
      }

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Error opening Stripe dashboard:', err);
      setError(err.message);
    }
  };

  const hasActivePaymentMethod = stripeAccount?.status === 'active' || paypalAccount?.status === 'active';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {depositRequired && !hasActivePaymentMethod && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">Acompte activé sans moyen de paiement</p>
            <p className="text-sm text-amber-700 mt-1">
              Vous avez activé la demande d'acompte mais aucun moyen de paiement n'est configuré.
              Connectez Stripe ou PayPal pour permettre à vos clientes de payer en ligne.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Erreur</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stripe Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Stripe</h3>
                <p className="text-xs text-gray-500">Cartes bancaires</p>
              </div>
            </div>

            {stripeAccount?.status === 'active' && (
              <CheckCircle className="w-6 h-6 text-belaya-vivid" />
            )}
          </div>

          {!stripeAccount && (
            <>
              <p className="text-sm text-gray-600">
                Acceptez les paiements par carte bancaire avec Stripe Connect.
                Commission plateforme : 1,5% + frais Stripe.
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {connectingStripe ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Connecter Stripe'
                )}
              </button>
            </>
          )}

          {stripeAccount && stripeAccount.status === 'pending' && (
            <>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">Configuration en attente</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Terminez la configuration de votre compte Stripe.
                </p>
              </div>
              <button
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all font-medium disabled:opacity-50"
              >
                Terminer la configuration
              </button>
            </>
          )}

          {stripeAccount && stripeAccount.status === 'incomplete' && (
            <>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">Configuration incomplète</p>
                <p className="text-xs text-orange-700 mt-1">
                  Certaines informations sont manquantes pour activer les paiements.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium disabled:opacity-50"
                >
                  Compléter
                </button>
                <button
                  onClick={handleRefreshStripeStatus}
                  disabled={refreshingStripe}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Rafraîchir le statut"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingStripe ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </>
          )}

          {stripeAccount && stripeAccount.status === 'active' && (
            <>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Connecté et actif
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Paiements activés • Virements activés
                </p>
              </div>
              <button
                onClick={handleOpenStripeDashboard}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Accéder au dashboard Stripe
              </button>
            </>
          )}
        </div>

        {/* PayPal Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">PayPal</h3>
                <p className="text-xs text-gray-500">Compte PayPal</p>
              </div>
            </div>

            {paypalAccount?.status === 'active' && (
              <CheckCircle className="w-6 h-6 text-belaya-vivid" />
            )}
          </div>

          {!paypalAccount && (
            <>
              <p className="text-sm text-gray-600">
                Acceptez les paiements via PayPal. Vos clientes peuvent payer avec leur compte PayPal ou par carte.
              </p>
              <button
                onClick={handleConnectPayPal}
                disabled={connectingPayPal}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg hover:from-blue-700 hover:to-blue-500 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {connectingPayPal ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Connecter PayPal'
                )}
              </button>
            </>
          )}

          {paypalAccount && paypalAccount.status === 'pending' && (
            <>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">Configuration en attente</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Terminez la configuration de votre compte PayPal.
                </p>
              </div>
              <button
                onClick={handleConnectPayPal}
                disabled={connectingPayPal}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all font-medium disabled:opacity-50"
              >
                Terminer la configuration
              </button>
            </>
          )}

          {paypalAccount && paypalAccount.status === 'incomplete' && (
            <>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">Configuration incomplète</p>
                <p className="text-xs text-orange-700 mt-1">
                  Certaines informations sont manquantes pour activer les paiements.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConnectPayPal}
                  disabled={connectingPayPal}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium disabled:opacity-50"
                >
                  Compléter
                </button>
                <button
                  onClick={handleRefreshPayPalStatus}
                  disabled={refreshingPayPal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Rafraîchir le statut"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingPayPal ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </>
          )}

          {paypalAccount && paypalAccount.status === 'active' && (
            <>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Connecté et actif
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Paiements activés
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Frais de transaction :</strong><br />
          • Stripe : 1,5% + 0,25€ par transaction + commission plateforme 1,5%<br />
          • PayPal : 2,9% + 0,35€ par transaction + commission plateforme 1,5%<br />
          Les frais de la plateforme (1,5%) peuvent être à la charge du prestataire ou du client selon vos paramètres.
        </p>
      </div>
    </div>
  );
}
