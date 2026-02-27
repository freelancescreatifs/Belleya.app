import { Clock, ArrowLeft, Mail, XCircle, AlertCircle } from 'lucide-react';
import DashboardHeader from './DashboardHeader';

interface PendingStateProps {
  status: 'pending' | 'rejected' | 'none';
  createdAt?: string;
  onSignOut: () => void;
}

export default function PendingState({ status, createdAt, onSignOut }: PendingStateProps) {
  if (status === 'none') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune candidature trouvee</h2>
          <p className="text-gray-600 mb-6">Tu n'as pas encore postule au programme partenaire.</p>
          <a
            href="/partenaire/postuler"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#efaa9a] to-[#d9629b] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Postuler maintenant
          </a>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader onSignOut={onSignOut} />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Candidature non retenue</h2>
            <p className="text-gray-600 mb-6">
              Ta candidature n'a pas ete retenue pour le moment. N'hesite pas a postuler a nouveau.
            </p>
            <a
              href="/partenaire"
              className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Page partenaire
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onSignOut={onSignOut} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Candidature en cours d'examen</h2>
          <p className="text-gray-600 mb-6">
            Ton acces sera active des validation par notre equipe. Tu recevras un email de confirmation.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Statut</span>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                En attente
              </span>
            </div>
            {createdAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date de candidature</span>
                <span className="text-gray-900 font-medium">
                  {new Date(createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-blue-800 font-medium mb-1">Que se passe-t-il ensuite ?</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>1. Notre equipe examine ta candidature</li>
              <li>2. Tu recois un email de confirmation</li>
              <li>3. Ton dashboard partenaire s'active automatiquement</li>
              <li>4. Tu commences a generer des commissions !</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/partenaire"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Page partenaire
            </a>
            <a
              href="mailto:support@belleya.app"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              <Mail className="w-4 h-4" />
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
