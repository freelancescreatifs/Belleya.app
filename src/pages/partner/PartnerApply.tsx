import { useState } from 'react';
import {
  ArrowLeft,
  LogIn,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ExperienceLevel = 'debutant' | 'intermediaire' | 'confirme';

interface FormData {
  fullName: string;
  email: string;
  instagramUrl: string;
  experienceLevel: ExperienceLevel;
  motivation: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export default function PartnerApply() {
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    instagramUrl: '',
    experienceLevel: 'debutant',
    motivation: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = (): string | null => {
    if (!form.fullName.trim()) return 'Le nom complet est requis.';
    if (!form.email.trim()) return 'L\'email est requis.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email invalide.';
    if (!form.motivation.trim()) return 'La motivation est requise.';
    if (form.password.length < 6) return 'Le mot de passe doit contenir au moins 6 caracteres.';
    if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas.';
    if (!form.acceptTerms) return 'Tu dois accepter les conditions.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            role: 'affiliate',
            first_name: form.fullName.split(' ')[0] || form.fullName,
            last_name: form.fullName.split(' ').slice(1).join(' ') || '',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email.trim(),
            password: form.password,
          });
          if (signInError) {
            throw new Error('Ce compte existe deja. Verifie ton mot de passe ou connecte-toi directement.');
          }
        } else {
          throw signUpError;
        }
      }

      const userId = signUpData?.user?.id;
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user?.id) {
          throw new Error('Erreur lors de la creation du compte.');
        }
      }

      const finalUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
      if (!finalUserId) throw new Error('Impossible de recuperer l\'identifiant utilisateur.');

      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('user_id', finalUserId)
        .maybeSingle();

      if (existingProfile && existingProfile.role !== 'affiliate') {
        await supabase
          .from('user_profiles')
          .update({ role: 'affiliate' })
          .eq('user_id', finalUserId);
      }

      const { data: existingApp } = await supabase
        .from('affiliate_applications')
        .select('id')
        .eq('user_id', finalUserId)
        .maybeSingle();

      if (!existingApp) {
        const { error: appError } = await supabase
          .from('affiliate_applications')
          .insert({
            user_id: finalUserId,
            full_name: form.fullName.trim(),
            email: form.email.trim(),
            instagram_url: form.instagramUrl.trim() || null,
            experience_level: form.experienceLevel,
            motivation: form.motivation.trim(),
            status: 'pending',
          });

        if (appError) {
          console.error('Application insert error:', appError);
          throw new Error('Erreur lors de l\'envoi de la candidature: ' + appError.message);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/partner/dashboard';
      }, 1500);
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAAA83] via-[#fdd5b8] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-belleya-200/30">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#efaa9a] to-[#d9629b] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Candidature envoyee !</h2>
          <p className="text-gray-600 mb-6">Redirection vers ton espace partenaire...</p>
          <Loader2 className="w-6 h-6 animate-spin text-[#d9629b] mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAAA83] via-[#fdd5b8] to-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </a>
          <a
            href="/partenaire/connexion"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#efaa9a] text-[rgb(113,19,65)] hover:bg-[#efaa9a]/10 transition-colors text-sm font-medium"
          >
            <LogIn className="w-4 h-4" />
            Connexion partenaires
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Belleya" className="h-12 w-auto mx-auto mb-6" />
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'rgb(113, 19, 65)' }}>
              Devenir partenaire Belleya
            </h1>
            <p className="text-gray-600 mt-2">Remplis ce formulaire pour postuler au programme d'affiliation.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-belleya-200/30">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-6">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => handleChange('fullName', e.target.value)}
                  placeholder="Ton prenom et nom"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Instagram URL</label>
                <input
                  type="url"
                  value={form.instagramUrl}
                  onChange={e => handleChange('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/ton_profil"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Niveau d'experience *</label>
                <select
                  value={form.experienceLevel}
                  onChange={e => handleChange('experienceLevel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary transition-all bg-white"
                >
                  <option value="debutant">Debutant(e)</option>
                  <option value="intermediaire">Intermediaire</option>
                  <option value="confirme">Confirme(e)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Motivation *</label>
                <textarea
                  value={form.motivation}
                  onChange={e => handleChange('motivation', e.target.value)}
                  rows={4}
                  placeholder="Pourquoi souhaites-tu rejoindre le programme partenaire Belleya ?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary transition-all resize-none"
                />
              </div>

              <div className="border-t border-gray-200 pt-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">Creation de ton compte</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Mot de passe *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => handleChange('password', e.target.value)}
                        placeholder="Minimum 6 caracteres"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary transition-all pr-12"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Confirmer le mot de passe *</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={e => handleChange('confirmPassword', e.target.value)}
                        placeholder="Retape ton mot de passe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={e => handleChange('acceptTerms', e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-belleya-deep focus:ring-belleya-primary"
                />
                <span className="text-sm text-gray-600">
                  J'accepte les{' '}
                  <a href="/cgv" target="_blank" className="text-[#d9629b] underline">conditions generales</a>
                  {' '}et la{' '}
                  <a href="/mentions-legales" target="_blank" className="text-[#d9629b] underline">politique de confidentialite</a>.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-[length:200%_auto] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] animate-[shimmer_3s_linear_infinite] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  'Envoyer ma candidature'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
