import { useState } from 'react';
import { MapPin, Star, Heart, Calendar, Image as ImageIcon } from 'lucide-react';
import { ProviderProfile, followProvider, unfollowProvider, likeContent, unlikeContent } from '../../lib/socialHelpers';
import { useAuth } from '../../contexts/AuthContext';

interface ProviderFeedCardProps {
  provider: ProviderProfile;
  showDistance?: boolean;
  onViewProfile: () => void;
}

export default function ProviderFeedCard({ provider, showDistance = true, onViewProfile }: ProviderFeedCardProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(provider.is_following || false);
  const [isLiked, setIsLiked] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Vous devez être connecté pour suivre un prestataire');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const result = await unfollowProvider(provider.user_id);
        if (result.success) {
          setIsFollowing(false);
        }
      } else {
        const result = await followProvider(provider.user_id);
        if (result.success) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Vous devez être connecté pour aimer un contenu');
      return;
    }

    try {
      if (isLiked) {
        setIsLiked(false);
      } else {
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div
      onClick={onViewProfile}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="relative">
        {provider.profile_photo ? (
          <div className="relative h-64 w-full">
            <img
              src={provider.profile_photo}
              alt={provider.company_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-64 bg-gradient-to-br from-brand-600 to-brand-100 flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-white/40" />
          </div>
        )}

        <button
          onClick={handleLikeToggle}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'text-brand-500 fill-brand-500' : 'text-gray-600'}`} />
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
            {provider.company_name}
          </h3>
          <p className="text-brand-100 text-sm drop-shadow-lg">
            {provider.activity_type || 'Professionnelle'}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {showDistance && provider.distance !== undefined && (
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-brand-500" />
              <span className="font-medium">
                {provider.distance < 1
                  ? `${Math.round(provider.distance * 1000)} m`
                  : `${provider.distance.toFixed(1)} km`}
              </span>
            </div>
          )}

          {!showDistance && provider.city && (
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-brand-500" />
              <span>{provider.city}</span>
            </div>
          )}

          {provider.reviews_count > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-gray-900">
                {provider.average_rating.toFixed(1)}
              </span>
              <span className="text-gray-600">
                ({provider.reviews_count})
              </span>
            </div>
          )}
        </div>

        {provider.bio && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {provider.bio}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-xl font-semibold hover:from-brand-600 hover:to-brand-600 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Réserver
          </button>

          {user && (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-brand-100 text-brand-600 hover:bg-brand-200'
              } disabled:opacity-50`}
            >
              {isFollowing ? 'Abonné' : 'Suivre'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
