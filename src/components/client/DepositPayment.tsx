import { useState } from 'react';
import { CreditCard, Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DepositPaymentProps {
  bookingId: string;
  amount: number;
  companyName: string;
  serviceName: string;
  clientEmail: string;
  clientName: string;
  stripeAvailable: boolean;
  paypalAvailable: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DepositPayment({
  bookingId,
  amount,
  companyName,
  serviceName,
  clientEmail,
  clientName,
  stripeAvailable,
  paypalAvailable,
  onSuccess,
  onCancel,
}: DepositPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | null>(
    stripeAvailable ? 'stripe' : paypalAvailable ? 'paypal' : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStripePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            clientEmail,
            clientName,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec du paiement');
      }

      const { clientSecret } = await response.json();

      if (typeof window !== 'undefined' && (window as any).Stripe) {
        const stripe = (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: {},
          },
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          setSuccess(true);
          setTimeout(() => onSuccess(), 1500);
        }
      } else {
        throw new Error('Stripe n\'est pas chargé');
      }
    } catch (err: any) {
      console.error('Error processing Stripe payment:', err);
      setError(err.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-payment?action=create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            clientEmail,
            clientName,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec du paiement');
      }

      const { orderId, approveLink } = await response.json();

      if (approveLink) {
        window.location.href = approveLink;
      } else {
        throw new Error('Lien de paiement non disponible');
      }
    } catch (err: any) {
      console.error('Error processing PayPal payment:', err);
      setError(err.message || 'Erreur lors du paiement');
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (selectedMethod === 'stripe') {
      handleStripePayment();
    } else if (selectedMethod === 'paypal') {
      handlePayPalPayment();
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-belleya-bright" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Paiement réussi !</h3>
        <p className="text-gray-600">Votre rendez-vous est confirmé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement de l'acompte</h2>
        <p className="text-gray-600">{companyName}</p>
        <p className="text-sm text-gray-500">{serviceName}</p>
      </div>

      <div className="bg-gradient-to-br from-belleya-primary to-belleya-deep text-white rounded-xl p-6 text-center">
        <p className="text-sm opacity-90 mb-1">Montant à payer</p>
        <p className="text-4xl font-bold">{amount.toFixed(2)} €</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Erreur de paiement</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {!stripeAvailable && !paypalAvailable && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">Paiement non disponible</p>
            <p className="text-sm text-amber-700">
              Le prestataire n'a pas encore configuré les moyens de paiement.
              Veuillez le contacter directement.
            </p>
          </div>
        </div>
      )}

      {(stripeAvailable || paypalAvailable) && (
        <>
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Choisissez votre moyen de paiement</p>

            {stripeAvailable && (
              <button
                onClick={() => setSelectedMethod('stripe')}
                className={`w-full p-4 border-2 rounded-lg transition-all flex items-center gap-3 ${
                  selectedMethod === 'stripe'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'stripe' ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'stripe' && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Carte bancaire</p>
                  <p className="text-xs text-gray-500">Paiement sécurisé par Stripe</p>
                </div>
                <CreditCard className="w-6 h-6 text-gray-400" />
              </button>
            )}

            {paypalAvailable && (
              <button
                onClick={() => setSelectedMethod('paypal')}
                className={`w-full p-4 border-2 rounded-lg transition-all flex items-center gap-3 ${
                  selectedMethod === 'paypal'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'paypal' ? 'border-blue-600' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'paypal' && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">PayPal</p>
                  <p className="text-xs text-gray-500">Paiement via votre compte PayPal</p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handlePayment}
              disabled={!selectedMethod || loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-belleya-primary to-belleya-deep text-white rounded-lg hover:from-belleya-deep hover:to-belleya-primary transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Payer {amount.toFixed(2)} €
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Paiement sécurisé • Vos données sont protégées
          </p>
        </>
      )}
    </div>
  );
}
