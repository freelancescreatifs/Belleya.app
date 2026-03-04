import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Loader2, CheckCircle, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/shared/ToastContainer';

interface AffiliateApplyProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AffiliateApply({ onBack, onSuccess }: AffiliateApplyProps) {
  const { user } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    instagram: '',
    tiktok: '',
    linkedin: '',
    audience: '',
    motivation: ''
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (!authForm.firstName.trim() || !authForm.lastName.trim()) {
          throw new Error('Le prenom et le nom sont requis');
        }
        const { error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              role: 'pro',
              first_name: authForm.firstName.trim(),
              last_name: authForm.lastName.trim()
            }
          }
        });
        if (error) throw error;
        setForm(prev => ({
          ...prev,
          firstName: authForm.firstName.trim(),
          lastName: authForm.lastName.trim(),
          email: authForm.email
        }));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erreur d\'authentification');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.motivation.trim()) {
      showToast('error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('affiliate_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        showToast('error', 'Tu as deja soumis une candidature.');
        setLoading(false);
        setTimeout(() => onSuccess(), 1000);
        return;
      }

      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;

      const { error } = await supabase
        .from('affiliate_applications')
        .insert({
          user_id: user.id,
          full_name: fullName,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          instagram_url: form.instagram.trim() || null,
          tiktok_url: form.tiktok.trim() || null,
          linkedin_url: form.linkedin.trim() || null,
          audience: form.audience.trim() || null,
          motivation: form.motivation.trim(),
          experience_level: 'intermediaire',
          status: 'pending'
        });

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      showToast('error', error.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Candidature envoyee !</h2>
          <p className="text-gray-600 mb-6">
            Ton dossier est en cours d'examen. Tu seras notifie(e) une fois valide(e).
          </p>
          <p className="text-sm text-gray-400">Redirection vers ton dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Candidature partenaire</h1>
              <p className="text-sm text-gray-500">Connecte-toi ou cree un compte pour postuler</p>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  authMode === 'signup'
                    ? 'bg-belaya-deep text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Creer un compte
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  authMode === 'login'
                    ? 'bg-belaya-deep text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Se connecter
              </button>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                    <input
                      type="text"
                      value={authForm.firstName}
                      onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={authForm.lastName}
                      onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-lg font-semibold transition-all hover:shadow-lg disabled:opacity-50"
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {authMode === 'signup' ? 'Creer mon compte' : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Candidature partenaire</h1>
            <p className="text-sm text-gray-500">Programme d'affiliation Belleya</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prenom *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  placeholder="Ton prenom"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                  placeholder="Ton nom"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="ton@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telephone (optionnel)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+33 6 00 00 00 00"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-colors"
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Reseaux sociaux</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    placeholder="@toncompte ou URL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                  <input
                    type="text"
                    value={form.tiktok}
                    onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                    placeholder="@toncompte ou URL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="text"
                    value={form.linkedin}
                    onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                    placeholder="URL de ton profil"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Taille d'audience (optionnel)</label>
              <input
                type="text"
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                placeholder="Ex: 5 000 abonnes Instagram"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pourquoi veux-tu rejoindre le programme ? *</label>
              <textarea
                value={form.motivation}
                onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                required
                rows={4}
                placeholder="Parle-nous de toi, de ta motivation et de ton experience..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Envoyer ma candidature
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
