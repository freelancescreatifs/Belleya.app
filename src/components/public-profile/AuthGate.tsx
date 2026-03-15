import { useState } from 'react';
import { User, Mail, Phone, Lock, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../shared/ToastContainer';

interface BookingContext {
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  selectedSupplements: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  }>;
  selectedDate: Date;
  selectedTime: string;
}

interface AuthGateProps {
  onAuthenticated: (userId: string, clientId: string) => void;
  bookingContext: BookingContext;
  providerId: string;
  companyId?: string;
}

export default function AuthGate({
  onAuthenticated,
  bookingContext,
  providerId,
  companyId,
}: AuthGateProps) {
  const { signIn, signUp } = useAuth();
  const { showToast, toasts, dismissToast } = useToast();
  const [hasAccount, setHasAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (hasAccount) {
        await handleSignIn();
      } else {
        await handleSignUp();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const message = err?.message || 'Une erreur est survenue';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    const signInResponse = await signIn(formData.email, formData.password);

    let authUser = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (sessionData?.session?.user) {
        authUser = sessionData.session.user;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 300 + attempt * 200));
    }

    if (!authUser) {
      showToast('error', 'Erreur de connexion. Vérifiez vos identifiants.');
      setError('Erreur de connexion. Vérifiez vos identifiants.');
      return;
    }

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', providerId)
      .eq('belaya_user_id', authUser.id)
      .maybeSingle();

    if (clientError) throw clientError;

    if (clientData) {
      onAuthenticated(authUser.id, clientData.id);
    } else {
      const insertPayload: any = {
        user_id: providerId,
        belaya_user_id: authUser.id,
        first_name: signInResponse?.first_name || formData.firstName || 'Client',
        last_name: signInResponse?.last_name || formData.lastName || '',
        email: formData.email,
        phone: formData.phone || null,
        source: 'public_booking',
      };
      if (companyId) insertPayload.company_id = companyId;

      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert(insertPayload)
        .select()
        .single();

      if (createError) throw createError;

      onAuthenticated(authUser.id, newClient.id);
    }
  }

  async function handleSignUp() {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      throw new Error('Tous les champs obligatoires sont manquants (prénom, nom, email, mot de passe)');
    }

    await signUp(formData.email, formData.password, 'client', formData.firstName, formData.lastName);

    let userId: string | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (sessionData?.session?.user?.id) {
        userId = sessionData.session.user.id;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500 + attempt * 300));
    }

    if (!userId) {
      setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.');
      showToast('success', 'Compte créé ! Vérifiez votre email pour confirmer.');
      return;
    }

    await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'client',
      }, {
        onConflict: 'user_id',
      });

    const signUpPayload: any = {
      user_id: providerId,
      belaya_user_id: userId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone || null,
      source: 'public_booking',
    };
    if (companyId) signUpPayload.company_id = companyId;

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert(signUpPayload)
      .select()
      .single();

    if (clientError) throw clientError;

    setSuccess('Compte créé avec succès !');
    setTimeout(() => {
      onAuthenticated(userId, clientData.id);
    }, 1000);
  }

  return (
    <>
    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    <div className="bg-white rounded-xl max-w-md w-full">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">
          {hasAccount ? 'Connexion' : 'Créer un compte'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {hasAccount
            ? 'Connectez-vous pour finaliser votre réservation'
            : 'Créez votre compte pour réserver'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-belaya-200 rounded-lg flex items-start gap-2">
            <Check className="w-5 h-5 text-belaya-bright flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-900">{success}</p>
          </div>
        )}

        {!hasAccount && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {!hasAccount && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>
          {!hasAccount && (
            <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
        >
          {loading ? 'Chargement...' : hasAccount ? 'Se connecter' : 'Créer mon compte'}
        </button>

        <button
          type="button"
          onClick={() => setHasAccount(!hasAccount)}
          className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {hasAccount ? "Je n'ai pas encore de compte" : "J'ai déjà un compte"}
        </button>
      </form>
    </div>
    </>
  );
}
