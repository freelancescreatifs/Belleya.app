import { useState } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function PartnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileData?.role !== 'affiliate') {
          await supabase.auth.signOut();
          setError('Ce compte n\'est pas un compte partenaire. Utilise l\'espace correspondant a ton profil.');
          setLoading(false);
          return;
        }
      }

      window.location.href = '/partner/dashboard';
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else {
        setError(err.message || 'Erreur de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAAA83] via-[#fdd5b8] to-white flex flex-col">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/partenaire" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Programme partenaire
          </a>
          <a
            href="/partenaire/postuler"
            className="text-sm font-medium text-[rgb(113,19,65)] hover:underline"
          >
            Pas encore inscrit ? Postuler
          </a>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Belleya" className="h-12 w-auto mx-auto mb-6" />
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(113, 19, 65)' }}>
              Connexion partenaire
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              Accede a ton espace partenaire Belleya
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="ton@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d9629b] focus:border-[#d9629b] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Ton mot de passe"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d9629b] focus:border-[#d9629b] transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#efaa9a] to-[#d9629b] text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Se connecter
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore partenaire ?{' '}
            <a href="/partenaire/postuler" className="text-[#d9629b] font-semibold hover:underline">
              Postuler maintenant
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
