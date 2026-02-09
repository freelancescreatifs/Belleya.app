import { Star, Heart, Sparkles, Instagram, MapPin } from 'lucide-react';

interface ProfileHeaderProps {
  companyName: string;
  profilePhoto: string | null;
  bio: string | null;
  instagramUrl: string | null;
  address: string | null;
  city: string | null;
  averageRating: number;
  reviewsCount: number;
  followersCount: number;
  likesCount: number;
  photosCount: number;
  profileColor?: string;
  isOwnProfile?: boolean;
}

export default function ProfileHeader({
  companyName,
  profilePhoto,
  bio,
  instagramUrl,
  address,
  city,
  averageRating,
  reviewsCount,
  followersCount,
  likesCount,
  photosCount,
  profileColor = 'from-rose-400 to-pink-500',
  isOwnProfile = false,
}: ProfileHeaderProps) {
  return (
    <div className={`bg-gradient-to-r ${profileColor} text-white p-6 rounded-t-xl`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={companyName}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/30">
              <span className="text-white font-bold text-2xl">
                {companyName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-1 truncate">{companyName}</h1>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            {reviewsCount > 0 && (
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-sm backdrop-blur-sm">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="font-bold">{averageRating.toFixed(1)}</span>
                <span className="text-white/90">({reviewsCount})</span>
              </div>
            )}

            {followersCount > 0 && (
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                <Heart className="w-3 h-3" />
                <span>{followersCount} abonné{followersCount > 1 ? 's' : ''}</span>
              </div>
            )}

            {(likesCount > 0 || photosCount > 0) && (
              <div className="flex items-center gap-1 text-xs text-white/90">
                <Sparkles className="w-3 h-3" />
                <span>
                  {likesCount > 0 && `${likesCount} likes`}
                  {likesCount > 0 && photosCount > 0 && ' • '}
                  {photosCount > 0 && `${photosCount} photos`}
                </span>
              </div>
            )}
          </div>

          {bio && (
            <p className="text-white/90 text-sm mb-3 line-clamp-3">
              {bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white transition-colors"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </a>
            )}

            {address && (
              <div className="flex items-start gap-1 text-xs text-white/80">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
