import { useState } from 'react';
import { Lightbulb, MessageSquare, Shield, Clock, ChevronDown, ChevronUp, Target, Sparkles, XCircle, Instagram, Copy, Check, AlertTriangle } from 'lucide-react';

const QUICK_GUIDES = [
  {
    icon: MessageSquare,
    title: 'Proposer Belaya en 1 message',
    color: 'text-blue-600 bg-blue-50',
    content: `Commence par un compliment sincere sur son travail (photos, realisations).
Enchaine naturellement : "Tu geres comment tes clientes et ton planning au quotidien ?"
Ecoute sa reponse, puis propose : "Il y a une appli qui aide les pros beaute a tout centraliser, tu peux tester 14 jours gratuitement si ca t'interesse."
Ne force rien. L'essai gratuit fait le travail.`,
  },
  {
    icon: Clock,
    title: 'Relances J-3 / J-2 / J-1',
    color: 'text-amber-600 bg-amber-50',
    content: `J-3 : "Hello ! Tu as eu le temps de regarder l'appli ? N'hesite pas si tu as des questions."
J-2 : "Tu as teste quoi pour l'instant ? L'agenda, les fiches clientes ? Je peux te montrer les fonctions les plus utiles."
J-1 : "Ton essai se termine demain. Ca serait dommage de ne pas profiter de tout ce que tu as commence a mettre en place !"`,
  },
  {
    icon: Target,
    title: 'Relance "essai termine"',
    color: 'text-rose-600 bg-rose-50',
    content: `"Hello ! Ton essai s'est termine. Qu'est-ce que tu en as pense ? Si tu veux continuer, le premier mois est super accessible."
Si pas de reponse apres 2j : "Je me permets de revenir vers toi. Beaucoup de pros hesitent au debut et finissent par ne plus pouvoir s'en passer. Tu veux qu'on en reparle ?"`,
  },
  {
    icon: Sparkles,
    title: 'Questions pour comprendre le blocage',
    color: 'text-teal-600 bg-teal-50',
    content: `"Qu'est-ce qui t'a manque pendant ton essai ?"
"Tu as eu le temps de tout explorer ?"
"C'est le prix qui te bloque, ou tu n'as pas vu l'utilite ?"
"Tu geres comment tes clientes aujourd'hui ?"
Ecouter > argumenter. Plus tu comprends son quotidien, mieux tu peux l'aider.`,
  },
  {
    icon: Target,
    title: 'Vendre les benefices concrets',
    color: 'text-emerald-600 bg-emerald-50',
    content: `Organisation : "Tu centralises tout au meme endroit : clientes, rdv, paiements."
Clientes : "Ton profil en ligne permet aux clientes de te trouver et reserver directement."
Reseaux sociaux : "L'outil t'aide a planifier tes posts et a organiser ton contenu."
Temps : "Tu passes moins de temps sur l'administratif et plus sur tes prestations."`,
  },
  {
    icon: XCircle,
    title: 'A ne pas faire vs bon message',
    color: 'text-red-600 bg-red-50',
    content: `Mauvais message :
"Bonjour nous avons une application merci de tester."

Pourquoi ca ne marche pas : c'est impersonnel, generique, sans interet pour la personne. Personne ne va cliquer.

Bon message :
"Hello ! Je vois que tu fais beaucoup de poses volume russe. On a cree une app pour aider les lash artists a gerer leurs clientes et leurs reseaux. Tu veux tester gratuitement ?"

Pourquoi ca marche : tu montres que tu connais son travail, tu parles son langage et tu lui proposes quelque chose d'utile sans forcer.`,
  },
  {
    icon: Lightbulb,
    title: 'Rappel cle : 14 jours gratuits',
    color: 'text-blue-600 bg-blue-50',
    content: `C'est ton argument le plus puissant. Aucun engagement, aucune carte bancaire.
"Tu ne risques rien a tester, c'est 14 jours offerts."
"Le mieux c'est d'essayer toi-meme pour voir si ca te convient."
"Beaucoup de pros pensaient ne pas en avoir besoin et ne peuvent plus s'en passer."`,
  },
];

const OBJECTIONS = [
  {
    question: '"Je n\'ai pas le temps"',
    answer: 'Justement, l\'appli sert a gagner du temps sur la gestion. Tout est centralise : clientes, rdv, factures. 14 jours gratuits pour tester a ton rythme.',
  },
  {
    question: '"Je n\'en ai pas besoin"',
    answer: 'Le mieux c\'est de tester gratuitement. Beaucoup de pros pensaient pareil et ont decouvert des fonctions qu\'elles utilisent tous les jours.',
  },
  {
    question: '"Je reflechis"',
    answer: 'Bien sur, prends ton temps. L\'essai est gratuit 14 jours. Tu peux tester sans engagement et voir si ca correspond a tes besoins.',
  },
  {
    question: '"C\'est trop cher"',
    answer: 'Les plans commencent a moins d\'1 EUR par jour. Et le temps que tu gagnes sur la gestion, ca vaut largement l\'investissement. Teste gratuitement pour voir.',
  },
  {
    question: '"J\'utilise deja un outil"',
    answer: 'Tu peux tester Belaya en parallele pendant 14 jours et comparer. Beaucoup de pros ont change apres avoir vu la difference.',
  },
  {
    question: '"Je ne suis pas organisee"',
    answer: 'C\'est exactement pour ca que Belaya existe. L\'appli te guide pas a pas pour organiser tes clientes, ton planning et tes finances.',
  },
  {
    question: '"Je veux plus de clientes"',
    answer: 'Avec Belaya, tu as un profil visible en ligne ou tes clientes peuvent te trouver et reserver. C\'est comme une vitrine professionnelle.',
  },
  {
    question: '"Je galere avec les reseaux sociaux"',
    answer: 'L\'outil inclut un studio de contenu qui t\'aide a planifier tes posts. Tu peux organiser tes publications et tes idees au meme endroit.',
  },
  {
    question: '"Je n\'ai pas encore teste"',
    answer: 'Pas de souci ! Tu veux que je t\'envoie le lien ? C\'est gratuit 14 jours, sans carte bancaire. Tu peux commencer quand tu veux.',
  },
];

const BIO_MENTION = '@Affilie certifie de Belaya';

export default function SalesTips() {
  const [expandedGuide, setExpandedGuide] = useState<number | null>(0);
  const [bioCopied, setBioCopied] = useState(false);

  const handleCopyBio = async () => {
    try {
      await navigator.clipboard.writeText(BIO_MENTION);
      setBioCopied(true);
      setTimeout(() => setBioCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = BIO_MENTION;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setBioCopied(true);
      setTimeout(() => setBioCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-blue-200 p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700 leading-relaxed">
            Inspire-toi de ces guides, mais adapte toujours ton message a la personne.
            Les meilleurs resultats viennent des conversations humaines et sinceres.
            <span className="font-medium text-blue-700 block mt-1">
              Rappel : 14 jours gratuits pour tester Belaya, sans engagement.
            </span>
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Guides rapides
        </h3>
        <div className="space-y-2">
          {QUICK_GUIDES.map((guide, i) => {
            const isOpen = expandedGuide === i;
            const Icon = guide.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedGuide(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${guide.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900">{guide.title}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {guide.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          Exemple de premier message
        </h3>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2.5">
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "Hello ! J'ai vu ton travail sur Instagram, franchement tes realisations sont super."
            </p>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "Je travaille avec une application qui aide les professionnelles de la beaute a mieux gerer leurs clientes, leur planning et meme leurs reseaux sociaux."
            </p>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "Tu peux tester gratuitement pendant 14 jours sans engagement si ca t'interesse. Je t'envoie le lien ?"
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Adapte ce message a ton style. L'important est d'etre naturelle et de montrer que tu connais leur metier.
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <Instagram className="w-4 h-4 text-pink-500" />
          Utiliser ton compte personnel pour prospecter
        </h3>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Contacte les professionnelles de la beaute <span className="font-semibold">avec ton compte personnel Instagram</span> pour garder une approche naturelle et humaine.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">Mention obligatoire dans ta bio</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Pour garantir la transparence, tu dois indiquer dans ta bio Instagram que tu es affilie au programme Belaya.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-3">
            <code className="text-sm font-medium text-gray-800">{BIO_MENTION}</code>
            <button
              onClick={handleCopyBio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                bioCopied
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {bioCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copie !
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copier
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-800 mb-2">Pourquoi cette regle ?</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              La prospection fonctionne mieux lorsqu'elle est faite par une personne reelle.
              Mais il est important que les prospects sachent que tu fais partie du programme partenaire Belaya.
              Cette mention dans ta bio permet d'etre clair, professionnel et transparent.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Rappel important</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                Utilise ton <span className="font-medium">compte personnel</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                Envoie des <span className="font-medium">messages personnalises</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                Evite le spam ou les copier-coller automatiques
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                Propose l'<span className="font-medium">essai gratuit de 14 jours</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-amber-500" />
          Gestion des objections
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {OBJECTIONS.map((obj, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">{obj.question}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{obj.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
