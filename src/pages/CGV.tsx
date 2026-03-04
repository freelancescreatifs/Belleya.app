import { ArrowLeft } from 'lucide-react';

export default function CGV() {
  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAAA83] via-[#fdd5b8] to-white">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <button
          onClick={handleBackToHome}
          className="flex items-center gap-2 text-gray-600 hover:text-belaya-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <div className="mb-8">
            <img
              src="/logo.png"
              alt="Belaya"
              className="h-16 w-auto mb-6"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-belaya-deep mb-4">
              Conditions Générales de Vente
            </h1>
            <p className="text-gray-600 text-sm">
              Dernière mise à jour : Février 2026
            </p>
          </div>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                1. Objet
              </h2>
              <p>
                Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre Belaya
                et ses utilisateurs (ci-après "le Client") dans le cadre de la fourniture de services de gestion d'activité
                pour les professionnels de la beauté et de réservation en ligne pour les clients.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                2. Description des services
              </h2>
              <p className="mb-3">
                Belaya propose plusieurs forfaits d'abonnement :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Belaya Start :</strong> Outils de gestion essentiels pour professionnels indépendants</li>
                <li><strong>Belaya Studio :</strong> Solution complète pour professionnels en développement</li>
                <li><strong>Belaya Empire :</strong> Suite premium avec fonctionnalités avancées et automatisation</li>
              </ul>
              <p className="mt-3">
                Chaque forfait comprend une période d'essai gratuite de 14 jours donnant accès à toutes les fonctionnalités.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                3. Tarifs et modalités de paiement
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>3.1 Tarifs :</strong> Les tarifs en vigueur sont affichés sur le site et sont susceptibles de
                  modification. Les tarifs promotionnels sont garantis pour les premiers souscripteurs.
                </p>
                <p>
                  <strong>3.2 Facturation :</strong> L'abonnement est facturé mensuellement par prélèvement automatique
                  à la date anniversaire de la souscription.
                </p>
                <p>
                  <strong>3.3 Moyens de paiement :</strong> Les paiements sont acceptés par carte bancaire via des
                  plateformes sécurisées (Stripe, PayPal).
                </p>
                <p>
                  <strong>3.4 Période d'essai :</strong> Aucun paiement n'est requis pendant la période d'essai de 14 jours.
                  Le Client peut annuler à tout moment sans frais.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                4. Durée et résiliation
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>4.1 Durée :</strong> L'abonnement est souscrit pour une durée indéterminée, renouvelable
                  tacitement chaque mois.
                </p>
                <p>
                  <strong>4.2 Résiliation :</strong> Le Client peut résilier son abonnement à tout moment depuis son
                  espace personnel, sans frais ni pénalités. La résiliation prend effet à la fin de la période en cours.
                </p>
                <p>
                  <strong>4.3 Suspension :</strong> Belaya se réserve le droit de suspendre ou résilier un compte en cas
                  de non-paiement, d{"'"}utilisation frauduleuse ou de violation des conditions d{"'"}utilisation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                5. Obligations du Client
              </h2>
              <p className="mb-3">Le Client s'engage à :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fournir des informations exactes et à jour lors de l'inscription</li>
                <li>Utiliser les services de manière conforme à leur destination</li>
                <li>Respecter les droits de propriété intellectuelle de Belaya</li>
                <li>Ne pas tenter de contourner les mesures de sécurité du service</li>
                <li>Maintenir la confidentialité de ses identifiants de connexion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                6. Obligations de Belaya
              </h2>
              <p className="mb-3">Belaya s'engage à :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fournir un service accessible 24h/24, 7j/7 (sauf maintenance programmée)</li>
                <li>Assurer la sécurité et la confidentialité des données clients</li>
                <li>Fournir un support client réactif selon le forfait souscrit</li>
                <li>Informer les clients de toute modification importante des services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                7. Protection des données
              </h2>
              <p>
                Belaya traite les données personnelles conformément au RGPD. Les données collectées sont utilisées
                uniquement pour la fourniture des services et ne sont jamais vendues à des tiers. Pour plus d'informations,
                consultez notre Politique de Confidentialité.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                8. Propriété intellectuelle
              </h2>
              <p>
                Tous les éléments du service Belaya (logiciel, design, contenus) sont protégés par le droit d'auteur et
                restent la propriété exclusive de Belaya. Le Client bénéficie d'un droit d'utilisation non exclusif et
                non transférable limité à la durée de l'abonnement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                9. Responsabilité et garanties
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>9.1 Disponibilité :</strong> Belaya s'efforce d'assurer une disponibilité maximale du service,
                  mais ne peut garantir une disponibilité de 100%. Des interruptions pour maintenance sont possibles.
                </p>
                <p>
                  <strong>9.2 Données :</strong> Belaya met en œuvre des sauvegardes régulières mais recommande au Client
                  d'exporter régulièrement ses données importantes.
                </p>
                <p>
                  <strong>9.3 Limitation :</strong> La responsabilité de Belaya est limitée aux dommages directs et ne
                  peut excéder le montant des sommes versées par le Client au cours des 12 derniers mois.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                10. Droit de rétractation
              </h2>
              <p>
                Conformément à la législation en vigueur, le Client bénéficie d'un droit de rétractation de 14 jours à
                compter de la souscription. Ce droit peut être exercé sans motif ni pénalité en contactant le service client.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                11. Modifications des CGV
              </h2>
              <p>
                Belaya se réserve le droit de modifier les présentes CGV à tout moment. Les Clients seront informés des
                modifications par email au moins 30 jours avant leur entrée en vigueur. La poursuite de l'utilisation du
                service après l'entrée en vigueur des nouvelles CGV vaut acceptation de ces dernières.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                12. Droit applicable et juridiction
              </h2>
              <p>
                Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée
                avant toute action judiciaire. À défaut, les tribunaux français seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                13. Contact
              </h2>
              <p className="mb-2">
                Pour toute question concernant ces CGV, vous pouvez nous contacter :
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li><strong>Email :</strong> contact@belaya.app</li>
                <li><strong>WhatsApp :</strong> <a href={"https://chat.whatsapp.com/FkLVwP6EDMNCOO4PkASezY?mode=gi_t"} target={\"_blank"} rel={"noopener noreferrer"} className={"text-belaya-primary hover:underline"}>Rejoindre notre groupe</a></li>
              </ul>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600">
              En utilisant les services Belaya, vous acceptez les présentes Conditions Générales de Vente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
