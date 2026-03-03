import { Check, X, AlertCircle, Sparkles } from 'lucide-react';

export default function ComparisonSection() {
  const features = [
    { category: "Visibilité & Découverte", name: "Page profil publique partageable", belaya: true, others: true },
    { category: "Visibilité & Découverte", name: "Découverte par les clientes potentielles", belaya: true, others: false },
    { category: "Réservation", name: "Prise de rendez-vous en ligne", belaya: true, others: true },
    { category: "Réservation", name: "Gestion des disponibilités", belaya: true, others: true },
    { category: "Paiement", name: "Paiement intégré (acompte/solde)", belaya: true, others: true },
    { category: "Paiement", name: "Gestion des encaissements", belaya: true, others: false },
    { category: "Gestion Cliente", name: "CRM avec historique complet", belaya: true, others: false },
    { category: "Gestion Cliente", name: "Galerie photos avant/après", belaya: true, others: false },
    { category: "Gestion Cliente", name: "Champs métier personnalisables", belaya: true, others: false },
    { category: "Finances", name: "Suivi CA, charges et bénéfices", belaya: true, others: true },
    { category: "Finances", name: "Calculs TVA et seuils fiscaux", belaya: true, others: false },
    { category: "Contenu & Marketing", name: "Calendrier éditorial avec IA", belaya: true, others: false },
    { category: "Contenu & Marketing", name: "Planification posts Instagram", belaya: true, others: false },
    { category: "Contenu & Marketing", name: "Relances clients automatiques", belaya: true, others: false },
    { category: "Organisation", name: "Agenda unifié (RDV + tâches)", belaya: true, others: false },
    { category: "Organisation", name: "Gestion des objectifs", belaya: true, others: false },
    { category: "Organisation", name: "Gestion du stock", belaya: true, others: true }
  ];

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-rose-50/30 to-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,170,154,0.08),rgba(255,255,255,0))]"></div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 bg-gradient-to-r from-belaya-powder via-belaya-bright to-belaya-deep bg-clip-text text-transparent">
              Belaya VS les autres outils
            </h2>

            <div className="max-w-5xl mx-auto mb-10">
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border-2 border-brand-100/50 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-brand-50/50 rounded-3xl -z-10"></div>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4 text-left">
                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-belaya-powder/20 to-belaya-bright/20 rounded-full border border-belaya-powder/30">
                      <span className="text-sm font-bold text-belaya-deep">Les autres outils</span>
                    </div>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                      Les solutions du marché excellent dans <span className="font-bold text-belaya-deep">leur domaine spécifique</span> :
                      les plateformes de réservation gèrent très bien les RDV, les outils de gestion optimisent votre organisation,
                      les CRM structurent vos données.
                    </p>
                    <div className="flex items-center gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-200/50">
                      <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-amber-900">
                        Le problème ? Vous jonglez entre <span className="font-bold">3, 4, voire 5 plateformes</span> différentes.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 text-left">
                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-belaya-powder to-belaya-bright rounded-full shadow-md">
                      <span className="text-sm font-bold text-white">Belaya</span>
                    </div>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                      Une <span className="font-bold text-belaya-deep">plateforme tout-en-un</span> pensée pour les professionnelles de la beauté.
                      Au-delà de la gestion administrative, Belaya intègre une dimension unique : <span className="font-bold text-belaya-bright">la visibilité, vos objectifs, vos tâches et tout ce que vous avez besoin dans votre business</span>.
                    </p>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border border-belaya-200/50">
                      <Sparkles className="w-6 h-6 text-belaya-bright flex-shrink-0" />
                      <p className="text-sm font-medium text-green-900">
                        Votre profil public devient votre <span className="font-bold">vitrine</span> : visibilité + gestion au même endroit.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-brand-100/50">
                  <p className="text-lg md:text-xl font-bold text-center bg-gradient-to-r from-belaya-powder via-belaya-bright to-belaya-deep bg-clip-text text-transparent">
                    Là où les autres outils restent des solutions spécifiques,
                    Belaya combine TOUTE la gestion de votre business.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-brand-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-50 to-brand-100/50 border-b-2 border-brand-100">
                    <th className="text-left p-6 font-bold text-gray-900 text-lg">
                      Fonctionnalité
                    </th>
                    <th className="text-center p-6 font-bold text-belaya-deep text-lg border-l-2 border-brand-100 bg-white/50">
                      Belaya
                      <div className="text-xs font-normal text-gray-600 mt-1">
                        Tout-en-un
                      </div>
                    </th>
                    <th className="text-center p-6 font-bold text-gray-600 text-lg">
                      Les autres outils
                      <div className="text-xs font-normal text-gray-500 mt-1">
                        Spécialisés
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 hover:bg-rose-50/20 transition-colors ${
                        index === 0 || features[index - 1]?.category !== feature.category
                          ? 'border-t-2 border-brand-100/30'
                          : ''
                      }`}
                    >
                      <td className="p-5 text-gray-800">
                        {index === 0 || features[index - 1]?.category !== feature.category ? (
                          <div className="font-bold text-belaya-deep text-sm mb-2">
                            {feature.category}
                          </div>
                        ) : null}
                        <div className="pl-4">{feature.name}</div>
                      </td>
                      <td className="text-center p-5 border-l-2 border-brand-100/30 bg-gradient-to-r from-white to-rose-50/10">
                        {feature.belaya ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-belaya-powder to-belaya-bright shadow-md">
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                            <X className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="text-center p-5">
                        {feature.others ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300">
                            <Check className="w-5 h-5 text-gray-600" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                            <X className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gradient-to-r from-brand-50 to-brand-100/50 p-6 text-center border-t-2 border-brand-100">
              <p className="text-gray-700 font-medium mb-4">
                Les autres outils excellent dans leur spécialité, mais vous obligent à multiplier les abonnements.
              </p>
              <p className="text-lg font-bold text-belaya-deep">
                Belaya réunit tout ce dont vous avez besoin au même endroit.
              </p>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-brand-100/50 text-center">
              <div className="text-3xl font-bold text-belaya-deep mb-2">1 seul outil</div>
              <p className="text-gray-600">Au lieu de 4 ou 5 plateformes différentes</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-brand-100/50 text-center">
              <div className="text-3xl font-bold text-belaya-deep mb-2">1 seul prix</div>
              <p className="text-gray-600">Au lieu de cumuler plusieurs abonnements</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-brand-100/50 text-center">
              <div className="text-3xl font-bold text-belaya-deep mb-2">1 seule connexion</div>
              <p className="text-gray-600">Tout centralisé, rien à synchroniser</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
