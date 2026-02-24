import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthPageProps {
  role: 'client' | 'pro';
  selectedPlan?: string | null;
  onBack: () => void;
}

export default function AuthPage({ role, selectedPlan, onBack }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, signOut } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (selectedPlan) localStorage.setItem('pending_plan', selectedPlan);

    try {
      if (isSignUp) {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error('Le prenom et le nom sont requis');
        }

        console.log('[AuthPage] Starting signup process...');
        await signUp(email, password, role, firstName, lastName);
        console.log('[AuthPage] Signup completed successfully');
      } else {
        console.log('[AuthPage] Starting signin process...');
        const userProfile = await signIn(email, password);

        if (userProfile && userProfile.role !== role) {
          await signOut();
          throw new Error(
            role === 'client'
              ? 'Ce compte est un compte professionnel. Veuillez utiliser l\'espace pro.'
              : 'Ce compte est un compte client. Veuillez utiliser l\'espace cliente.'
          );
        }
        console.log('[AuthPage] Signin completed successfully');
      }
    } catch (err: any) {
      console.error('[AuthPage] Auth error:', {
        message: err?.message,
        status: err?.status,
        name: err?.name,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        fullError: err
      });

      const errorMessage = err?.message || err?.details || 'Une erreur est survenue lors de l\'authentification';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    if (selectedPlan) localStorage.setItem('pending_plan', selectedPlan);

    try {
      await signInWithGoogle(role);
    } catch (err: any) {
      console.error('[AuthPage] Google sign-in error:', err);
      setError(err?.message || 'Erreur lors de la connexion avec Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAAA83] via-[#fdd5b8] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-belleya-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Belleya"
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-auth bg-clip-text text-transparent mb-2">
            {role === 'client' ? 'Espace Cliente' : 'Espace Pro'}
          </h1>
          <p className="text-gray-600">
            {role === 'client'
              ? 'Reservez vos prestations beaute'
              : 'Gerez votre activite beaute'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-belleya-200/30">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                !isSignUp
                  ? 'bg-gradient-auth text-white shadow-lg'
                  : 'bg-gradient-to-r from-belleya-50 to-belleya-100 text-belleya-deep hover:shadow-md'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                isSignUp
                  ? 'bg-gradient-auth text-white shadow-lg'
                  : 'bg-gradient-to-r from-belleya-50 to-belleya-100 text-belleya-deep hover:shadow-md'
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prenom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-transparent transition-all"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-belleya-deep text-white py-3 rounded-xl font-semibold hover:shadow-xl hover:bg-[#a82d70] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02]"
            >
              {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">OU</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-belleya-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isSignUp ? "S'inscrire avec Google" : 'Se connecter avec Google'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          En vous connectant, vous acceptez nos conditions d'utilisation
        </p>
      </div>
    </div>
  );
}
