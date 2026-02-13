import { useState, useEffect } from 'react';
import { Star, Play } from 'lucide-react';
import { getPublishedReviews, type LandingReview } from '../../lib/rewardsHelpers';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<LandingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const data = await getPublishedReviews();
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-pink-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ils ont essayé Belleya
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez les témoignages authentiques de nos utilisateurs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative aspect-[9/16] bg-gray-900">
                {selectedVideo === review.id ? (
                  <video
                    src={review.video_url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onEnded={() => setSelectedVideo(null)}
                  />
                ) : (
                  <>
                    <video
                      src={review.video_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <button
                      onClick={() => setSelectedVideo(review.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-50 transition-opacity group"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-pink-600 ml-1" fill="currentColor" />
                      </div>
                    </button>
                  </>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {review.avatar_url && (
                    <img
                      src={review.avatar_url}
                      alt={review.display_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.display_name}</h3>
                    {review.job_title && (
                      <p className="text-sm text-gray-600">{review.job_title}</p>
                    )}
                  </div>
                </div>

                {review.quote && (
                  <p className="text-gray-700 text-sm italic line-clamp-3">
                    "{review.quote}"
                  </p>
                )}

                <div className="flex items-center gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedVideo && (
        <button
          onClick={() => setSelectedVideo(null)}
          className="fixed inset-0 bg-black bg-opacity-75 z-40"
          aria-label="Close video"
        />
      )}
    </section>
  );
}
