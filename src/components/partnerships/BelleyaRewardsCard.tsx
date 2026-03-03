import { useState, useEffect } from 'react';
import { Gift, Instagram, Video, CheckCircle, Clock, XCircle, Star, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProviderSubmissions,
  getFreeMonthsBalance,
  type RewardSubmission
} from '../../lib/rewardsHelpers';
import MissionOneModal from './MissionOneModal';
import MissionTwoModal from './MissionTwoModal';

export default function BelayaRewardsCard() {
  const { user, companyProfile } = useAuth();
  const [submissions, setSubmissions] = useState<RewardSubmission[]>([]);
  const [freeMonths, setFreeMonths] = useState(0);
  const [showMissionOne, setShowMissionOne] = useState(false);
  const [showMissionTwo, setShowMissionTwo] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (companyProfile?.id) {
        loadData();
      } else {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [companyProfile]);

  async function loadData() {
    if (!companyProfile?.id) {
      setLoading(false);
      return;
    }

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
  const mission2Approved = mission2?.status === 'approved';

  const getMainStatus = () => {
    if (mission1Approved && mission2Approved) {
      return { label: 'Complété', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
    }
    if (mission1?.status === 'pending' || mission2?.status === 'pending') {
      return { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
    }
    return { label: 'Actif', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
  };

  const status = getMainStatus();
  const StatusIcon = status.icon;

  console.log('[BelayaRewardsCard] Rendering - loading:', loading, 'companyProfile:', companyProfile?.id, 'submissions:', submissions.length);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (showDetail) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg flex items-center justify-center border border-belaya-200">
                  <span className="text-xl font-bold text-belaya-primary">B</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Programme Belaya</h3>
                  <p className="text-sm text-gray-600">Jusqu'à 2 mois gratuits</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
                <div className="flex items-start gap-2 mb-3">
                  <Gift className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <strong className="text-gray-900">Comment ça marche ?</strong>
                    <p className="mt-1">Soutenez Belaya sur Instagram et gagnez des mois gratuits !</p>
                  </div>
                </div>
                {freeMonths > 0 && (
                  <div className="mt-3 bg-white rounded-lg px-4 py-3 border border-pink-300 text-center">
                    <div className="flex items-center justify-center gap-2 text-pink-600">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-lg font-bold">{freeMonths} mois offerts</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={`bg-white rounded-lg p-5 border-2 ${mission1Approved ? 'border-green-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Mission #1</h4>
                      <p className="text-sm text-gray-600">Follow + Commentaire</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">+1 mois</div>
                    {mission1 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        mission1.status === 'approved' ? 'bg-green-100 text-green-700' :
                        mission1.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {mission1.status === 'approved' ? 'Validé' :
                         mission1.status === 'pending' ? 'En attente' : 'Refusé'}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    S'abonner à @belaya.app
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    Laisser un commentaire (min. 100 caractères)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    Fournir une capture d'écran
                  </li>
                </ul>

                {mission1?.status === 'rejected' && mission1.admin_note && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Raison du refus :</strong> {mission1.admin_note}
                  </div>
                )}

                {!mission1 || mission1.status === 'rejected' ? (
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      setShowMissionOne(true);
                    }}
                    className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                  >
                    Participer à la Mission #1
                  </button>
                ) : null}
              </div>

              <div className={`bg-white rounded-lg p-5 border-2 ${
                !mission1Approved ? 'border-gray-200 opacity-60' :
                mission2Approved ? 'border-green-200' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Video className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        Mission #2
                        {!mission1Approved && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            Bloqué
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">Vidéo Avis</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">+1 mois</div>
                    {mission2 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        mission2.status === 'approved' ? 'bg-green-100 text-green-700' :
                        mission2.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {mission2.status === 'approved' ? 'Validé' :
                         mission2.status === 'pending' ? 'En attente' : 'Refusé'}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    Publier une vidéo avec tag @belaya.app
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    Autoriser la réutilisation commerciale
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    Apparaître sur notre landing page
                  </li>
                </ul>

                {mission2?.status === 'rejected' && mission2.admin_note && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Raison du refus :</strong> {mission2.admin_note}
                  </div>
                )}

                {!mission1Approved && (
                  <p className="text-sm text-gray-500 italic">
                    Complétez d'abord la Mission #1 pour débloquer
                  </p>
                )}

                {mission1Approved && (!mission2 || mission2.status === 'rejected') && (
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      setShowMissionTwo(true);
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Participer à la Mission #2
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500 text-center">
                Les récompenses sont validées par notre équipe sous 48h
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

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="bg-white rounded-xl border-2 border-belaya-300 bg-gradient-to-br from-rose-50/50 to-pink-50/50 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center border border-belaya-200 flex-shrink-0">
            <span className="text-2xl font-bold text-belaya-primary">B</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-bold text-gray-900">Belaya</h3>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                <Sparkles className="w-3 h-3" />
                Officiel
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">Affiliation</p>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2 ${status.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Missions complétées</span>
            <span className="text-sm font-semibold text-gray-900">
              {(mission1Approved ? 1 : 0) + (mission2Approved ? 1 : 0)}/2
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Mois offerts</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-pink-600 fill-current" />
              <span className="text-lg font-bold text-pink-600">{freeMonths}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Récompense</span>
            <span className="text-sm font-semibold text-belaya-bright">Jusqu'à 2 mois</span>
          </div>
        </div>

        <div className="flex items-center justify-center text-sm text-belaya-600 font-medium group-hover:text-belaya-700 transition-colors">
          <span>Voir les missions</span>
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
