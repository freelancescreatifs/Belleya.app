import { useState, useEffect } from 'react';
import { Gift, Instagram, Video, CheckCircle, Clock, XCircle, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProviderSubmissions,
  getFreeMonthsBalance,
  type RewardSubmission
} from '../../lib/rewardsHelpers';
import MissionOneModal from './MissionOneModal';
import MissionTwoModal from './MissionTwoModal';

export default function BelleyaRewardsCard() {
  const { user, companyProfile } = useAuth();
  const [submissions, setSubmissions] = useState<RewardSubmission[]>([]);
  const [freeMonths, setFreeMonths] = useState(0);
  const [showMissionOne, setShowMissionOne] = useState(false);
  const [showMissionTwo, setShowMissionTwo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyProfile?.id) {
      loadData();
    }
  }, [companyProfile?.id]);

  async function loadData() {
    if (!companyProfile?.id) return;

    try {
      const [submissionsData, balance] = await Promise.all([
        getProviderSubmissions(companyProfile.id),
        getFreeMonthsBalance(companyProfile.id)
      ]);
      setSubmissions(submissionsData);
      setFreeMonths(balance);
    } catch (error) {
      console.error('Error loading rewards data:', error);
    } finally {
      setLoading(false);
    }
  }

  const mission1 = submissions.find(s => s.mission_type === 'follow_comment');
  const mission2 = submissions.find(s => s.mission_type === 'video_review');
  const mission1Approved = mission1?.status === 'approved';
  const mission2Locked = !mission1Approved;

  const getStatusBadge = (submission?: RewardSubmission) => {
    if (!submission) return null;

    const statusConfig = {
      pending: {
        icon: Clock,
        text: 'En attente',
        className: 'bg-yellow-100 text-yellow-800'
      },
      approved: {
        icon: CheckCircle,
        text: 'Validé',
        className: 'bg-green-100 text-green-800'
      },
      rejected: {
        icon: XCircle,
        text: 'Refusé',
        className: 'bg-red-100 text-red-800'
      }
    };

    const config = statusConfig[submission.status];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg shadow-sm border-2 border-pink-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/belleyaa.png"
              alt="Belleya"
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                Belleya
                <span className="text-xs font-normal bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                  Officiel
                </span>
              </h3>
              <a
                href="https://www.instagram.com/belleya.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-pink-600 flex items-center gap-1"
              >
                <Instagram className="w-3 h-3" />
                @belleya.app
              </a>
            </div>
          </div>

          {freeMonths > 0 && (
            <div className="bg-white rounded-lg px-3 py-2 border-2 border-pink-300">
              <div className="flex items-center gap-1 text-pink-600">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-semibold">{freeMonths} mois offerts</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-gray-700 mb-6">
          Gagne jusqu'à 2 mois gratuits en soutenant Belleya sur Instagram
        </p>

        <div className="space-y-4">
          <div className={`bg-white rounded-lg p-4 border-2 ${mission1Approved ? 'border-green-200' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <Instagram className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Mission #1 - Follow + Commentaire</h4>
                  <p className="text-sm text-green-600 font-medium">+1 mois gratuit</p>
                </div>
              </div>
              {getStatusBadge(mission1)}
            </div>

            <ul className="text-sm text-gray-600 mb-4 space-y-1 ml-10">
              <li>• S'abonner à @belleya.app</li>
              <li>• Laisser un commentaire (min. 100 caractères)</li>
              <li>• Fournir une capture d'écran</li>
            </ul>

            {mission1?.status === 'rejected' && mission1.admin_note && (
              <div className="ml-10 mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Raison du refus :</strong> {mission1.admin_note}
              </div>
            )}

            {!mission1 || mission1.status === 'rejected' ? (
              <button
                onClick={() => setShowMissionOne(true)}
                className="ml-10 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
              >
                Participer
              </button>
            ) : null}
          </div>

          <div className={`bg-white rounded-lg p-4 border-2 ${
            mission2Locked ? 'border-gray-200 opacity-60' :
            mission2?.status === 'approved' ? 'border-green-200' : 'border-gray-200'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Video className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    Mission #2 - Vidéo Avis
                    {mission2Locked && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Bloqué
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-green-600 font-medium">+1 mois gratuit additionnel</p>
                </div>
              </div>
              {getStatusBadge(mission2)}
            </div>

            <ul className="text-sm text-gray-600 mb-4 space-y-1 ml-10">
              <li>• Publier une vidéo avec tag @belleya.app</li>
              <li>• Autoriser la réutilisation commerciale</li>
              <li>• Apparaître sur notre landing page</li>
            </ul>

            {mission2?.status === 'rejected' && mission2.admin_note && (
              <div className="ml-10 mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Raison du refus :</strong> {mission2.admin_note}
              </div>
            )}

            {mission2Locked && (
              <p className="ml-10 text-sm text-gray-500 italic">
                Complétez d'abord la Mission #1 pour débloquer
              </p>
            )}

            {!mission2Locked && (!mission2 || mission2.status === 'rejected') && (
              <button
                onClick={() => setShowMissionTwo(true)}
                className="ml-10 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Participer
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <Gift className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <strong className="text-gray-900">Total possible :</strong> 2 mois gratuits
              <br />
              Les récompenses sont validées par notre équipe sous 48h.
            </div>
          </div>
        </div>
      </div>

      {showMissionOne && (
        <MissionOneModal
          onClose={() => setShowMissionOne(false)}
          onSuccess={() => {
            setShowMissionOne(false);
            loadData();
          }}
        />
      )}

      {showMissionTwo && (
        <MissionTwoModal
          onClose={() => setShowMissionTwo(false)}
          onSuccess={() => {
            setShowMissionTwo(false);
            loadData();
          }}
        />
      )}
    </>
  );
}
