import { MessageSquare, Lightbulb, Shield } from 'lucide-react';

const OBJECTIONS = [
  {
    question: '"Je n\'ai pas le temps"',
    answer: 'Justement, l\'application sert a gagner du temps sur la gestion des clientes et l\'organisation. Tout est centralise au meme endroit.',
  },
  {
    question: '"Je n\'en ai pas besoin"',
    answer: 'Le mieux est simplement de tester gratuitement pendant 14 jours pour voir si ca peut t\'aider. Aucun engagement.',
  },
  {
    question: '"J\'utilise deja un outil"',
    answer: 'Tu peux tester Belaya pendant 14 jours et comparer avec ce que tu utilises deja. Beaucoup de pros ont change apres avoir teste.',
  },
];

const APPROACH_TIPS = [
  {
    title: 'Comprendre les besoins',
    items: [
      'Manque d\'organisation au quotidien',
      'Difficulte a trouver de nouvelles clientes',
      'Gestion des reseaux sociaux chronophage',
      'Pas de suivi client centralise',
    ],
  },
  {
    title: 'Les benefices a mettre en avant',
    items: [
      'Gagner du temps sur la gestion',
      'Attirer plus de clientes',
      'Centraliser toute l\'activite',
      'Avoir un profil pro visible en ligne',
    ],
  },
  {
    title: 'Le bon timing de relance',
    items: [
      'J-3 : rappel que l\'essai se termine bientot',
      'J-2 : demander s\'ils ont teste les fonctionnalites',
      'J-1 : proposer de repondre aux dernieres questions',
    ],
  },
];

export default function SalesTips() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Conseils pour convertir tes prospects</h3>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Les affilies contactent des entrepreneures de la beaute (nail artists, techniciennes cils,
          estheticiennes, coiffeuses) pour leur proposer de tester Belaya gratuitement pendant 14 jours.
          Parle naturellement, evite les copier-coller automatiques.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {APPROACH_TIPS.map((tip, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <h4 className="text-sm font-semibold text-gray-900">{tip.title}</h4>
              </div>
              <ul className="space-y-1.5">
                {tip.items.map((item, j) => (
                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Exemple de message naturel</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed italic">
            "Hello ! J'ai vu ton travail sur Instagram, c'est super.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed italic mt-2">
            Je travaille avec une application qui aide les professionnelles de la beaute
            a mieux gerer leurs clientes et leur organisation.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed italic mt-2">
            Tu peux tester gratuitement pendant 14 jours si ca t'interesse."
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Adapte ce message a ton style. L'important est d'etre naturel et de montrer que tu connais leur metier.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Gestion des objections</h3>
        </div>
        <div className="space-y-4">
          {OBJECTIONS.map((obj, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-sm font-semibold text-gray-800 mb-2">{obj.question}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{obj.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
