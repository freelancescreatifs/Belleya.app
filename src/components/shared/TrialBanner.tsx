import { useState, useEffect } from 'react';
import { Clock, Sparkles, X, Link2, Copy, Check } from 'lucide-react';
import { getUserCompanyId, getSubscriptionStatus, type SubscriptionStatus } from '../../lib/subscriptionHelpers';
import { getBookingUrl } from '../../lib/slugHelpers';
import { supabase } from '../../lib/supabase';

export default function TrialBanner() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingSlug, setBookingSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  async function loadSubscriptionStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const companyId = await getUserCompanyId();
      if (!companyId) {
        setLoading(false);
        return;
      }

      const [subscriptionStatus, profileData] = await Promise.all([
        getSubscriptionStatus(companyId),
        supabase
          .from('company_profiles')
          .select('booking_slug')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      setStatus(subscriptionStatus);
      if (profileData.data?.booking_slug) {
        setBookingSlug(profileData.data.booking_slug);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!bookingSlug) return;
    try {
      await navigator.clipboard.writeText(getBookingUrl(bookingSlug));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent fail
    }
  }

  if (loading || !status || dismissed) return null;

  if (status.subscriptionStatus === 'active') return null;

  if (status.isTrial && status.daysRemaining > 0) {
    return (
      <div className="bg-gradient-to-r from-belaya-bright to-belaya-vivid text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                Essai gratuit - {status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''} restant{status.daysRemaining > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-belaya-100">
                Profite de toutes les fonctionnalités sans engagement
              </p>
              {bookingSlug && (
                <div className="flex items-center gap-2 mt-2">
                  <Link2 className="w-4 h-4 flex-shrink-0 text-white/80" />
                  <span className="text-sm font-mono text-white/90 truncate">
                    {getBookingUrl(bookingSlug)}
                  </span>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex-shrink-0 p-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                    title="Copier le lien de réservation"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => window.location.href = '/pricing'}
              className="bg-white text-belaya-bright px-4 py-2 rounded-lg font-medium hover:bg-belaya-50 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Choisir mon offre
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status.subscriptionStatus === 'expired' || !status.isActive) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">
                Votre essai gratuit est terminé
              </p>
              <p className="text-sm text-red-100">
                Choisissez une offre pour continuer à utiliser Belaya
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/pricing'}
            className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Voir les offres
          </button>
        </div>
      </div>
    );
  }

  return null;
}
