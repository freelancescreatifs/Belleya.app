import { useState, useEffect } from 'react';
import {
  Search, MapPin, Star, ArrowRight, Scissors, Heart,
  Sparkles, Clock, Filter, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Provider {
  user_id: string;
  company_name: string;
  activity_type: string;
  city: string | null;
  profile_photo: string | null;
  bio: string | null;
  booking_slug: string | null;
  is_accepting_bookings: boolean;
  followers_count: number;
  reviews_count: number;
  average_rating: number;
}

const CATEGORIES = [
  { key: 'all', label: 'Toutes', icon: Sparkles },
  { key: 'nail_artist', label: 'Nail artist', icon: Sparkles },
  { key: 'estheticienne', label: 'Estheticienne', icon: Heart },
  { key: 'coiffeuse', label: 'Coiffeuse', icon: Scissors },
  { key: 'lash_artist', label: 'Lash artist', icon: Star },
  { key: 'brow_artist', label: 'Brow artist', icon: Star },
  { key: 'facialiste', label: 'Facialiste', icon: Heart },
  { key: 'prothesiste_ongulaire', label: 'Prothesiste ongulaire', icon: Sparkles },
  { key: 'maquilleuse', label: 'Maquilleuse', icon: Sparkles },
  { key: 'masseuse', label: 'Masseuse', icon: Heart },
];

export default function BookingDirectory() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('public_provider_profiles')
        .select('user_id, company_name, activity_type, city, profile_photo, bio, booking_slug, is_accepting_bookings, followers_count, reviews_count, average_rating')
        .eq('is_accepting_bookings', true)
        .not('booking_slug', 'is', null);

      if (!error && data) {
        setProviders(data);
      }
    } catch (err) {
      console.error('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = searchQuery.trim() === '' ||
      p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.activity_type && p.activity_type.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' ||
      (p.activity_type && p.activity_type.toLowerCase().includes(
        CATEGORIES.find(c => c.key === selectedCategory)?.label.toLowerCase() || ''
      ));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFFDF8 0%, #FFF5F3 50%, #FFFDF8 100%)' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZGUyZTQiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCAzLjk5OC00SDQwYzIuMjEgMCA0IDEuNzkgNCAzLjk5OFY0MGMwIDIuMjEtMS43OSA0LTMuOTk4IDRINDBjLTIuMjEgMC00LTEuNzktNC0zLjk5OFYzNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>

        <div className="container mx-auto px-4 relative">
          <header className="py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <img src="/belaya-logo.png" alt="Belaya" className="h-10 w-auto" />
            </a>
            <a
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Accueil
            </a>
          </header>

          <div className="py-12 md:py-20 text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: 'rgb(113, 19, 65)' }}>
              Trouvez votre prestataire beaute
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Decouvrez les meilleures professionnelles beaute pres de chez vous et reservez en quelques clics.
            </p>

            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, ville ou specialite..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 text-lg bg-white rounded-2xl shadow-xl border-2 border-transparent focus:border-brand-300 focus:ring-4 focus:ring-brand-100 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.key
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun resultat</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? `Aucun prestataire ne correspond a "${searchQuery}"` : 'Aucun prestataire disponible dans cette categorie'}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
            >
              Voir tous les prestataires
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{filteredProviders.length}</span> prestataire{filteredProviders.length > 1 ? 's' : ''} disponible{filteredProviders.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProviders.map((provider) => (
                <a
                  key={provider.user_id}
                  href={`/book/${provider.booking_slug}`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-brand-200 transition-all transform hover:-translate-y-1"
                >
                  <div className="relative h-48 bg-gradient-to-br from-brand-100 to-brand-50 overflow-hidden">
                    {provider.profile_photo ? (
                      <img
                        src={provider.profile_photo}
                        alt={provider.company_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl font-bold text-brand-300">
                          {provider.company_name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {provider.reviews_count > 0 && (
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1 shadow-sm">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-gray-900">{provider.average_rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({provider.reviews_count})</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-brand-600 transition-colors">
                          {provider.company_name}
                        </h3>
                        {provider.activity_type && (
                          <p className="text-sm text-brand-600 font-medium">{provider.activity_type}</p>
                        )}
                      </div>
                    </div>

                    {provider.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{provider.bio}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {provider.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {provider.city}
                          </span>
                        )}
                        {provider.followers_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" />
                            {provider.followers_count}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-brand-600 font-medium text-sm group-hover:gap-2 transition-all">
                        Reserver
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/belaya-logo.png" alt="Belaya" className="h-8 w-auto" />
              <span className="text-sm text-gray-600">La beaute accessible a toutes</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="/mentions-legales" className="hover:text-gray-900 transition-colors">Mentions legales</a>
              <a href="/cgv" className="hover:text-gray-900 transition-colors">CGV</a>
              <a href="/" className="hover:text-gray-900 transition-colors">Accueil</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
