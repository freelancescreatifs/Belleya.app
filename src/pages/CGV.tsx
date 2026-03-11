import { ArrowLeft } from 'lucide-react';

export default function CGV() {
  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const waLink = "https://chat.whatsapp.com/FkLVwP6EDMNCOO4PkASezY?mode=gi_t";
  const blankTarget = "_blank";
  const relAttr = "noopener noreferrer";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAAA83] via-[#fdd5b8] to-white">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <button
          onClick={handleBackToHome}
          className="flex items-center gap-2 text-gray-600 hover:text-belaya-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {"Retour \u00e0 l\u2019accueil"}
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <div className="mb-8">
            <img
              src="/belaya_logo.png"
              alt="Belaya"
              className="h-16 w-auto mb-6"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-belaya-deep mb-4">
              {"Conditions G\u00e9n\u00e9rales de Vente"}
            </h1>
            <p className="text-gray-600 text-sm">
              {"Derni\u00e8re mise \u00e0 jour : F\u00e9vrier 2026"}
            </p>
          </div>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                1. Objet
              </h2>
              <p>
                {"Les pr\u00e9sentes Conditions G\u00e9n\u00e9rales de Vente (CGV) r\u00e9gissent les relations contractuelles entre Belaya et ses utilisateurs (ci-apr\u00e8s \u201cle Client\u201d) dans le cadre de la fourniture de services de gestion d\u2019activit\u00e9 pour les professionnels de la beaut\u00e9 et de r\u00e9servation en ligne pour les clients."}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                2. Description des services
              </h2>
              <p className="mb-3">
                {"Belaya propose plusieurs forfaits d\u2019abonnement :"}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Belaya Start :</strong> Outils de gestion essentiels pour professionnels ind&#233;pendants</li>
                <li><strong>Belaya Studio :</strong> Solution compl&#232;te pour professionnels en d&#233;veloppement</li>
                <li><strong>Belaya Empire :</strong> Suite premium avec fonctionnalit&#233;s avanc&#233;es et automatisation</li>
              </ul>
              <p className="mt-3">
                {"Chaque forfait comprend une p\u00e9riode d\u2019essai gratuite de 14 jours donnant acc\u00e8s \u00e0 toutes les fonctionnalit\u00e9s."}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                {"3. Tarifs et modalit\u00e9s de paiement"}
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>3.1 Tarifs :</strong> Les tarifs en vigueur sont affich&#233;s sur le site et sont susceptibles de modification. Les tarifs promotionnels sont garantis pour les premiers souscripteurs.
                </p>
                <p>
                  <strong>3.2 Facturation :</strong> {"L\u2019abonnement est factur\u00e9 mensuellement par pr\u00e9l\u00e8vement automatique \u00e0 la date anniversaire de la souscription."}
                </p>
                <p>
                  <strong>3.3 Moyens de paiement :</strong> {"Les paiements sont accept\u00e9s par carte bancaire via des plateformes s\u00e9curis\u00e9es (Stripe, PayPal)."}
                </p>
                <p>
                  <strong>{"3.4 P\u00e9riode d\u2019essai :"}</strong> {"Aucun paiement n\u2019est requis pendant la p\u00e9riode d\u2019essai de 14 jours. Le Client peut annuler \u00e0 tout moment sans frais."}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                {"4. Dur\u00e9e et r\u00e9siliation"}
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>{"4.1 Dur\u00e9e :"}</strong> {"L\u2019abonnement est souscrit pour une dur\u00e9e ind\u00e9termin\u00e9e, renouvelable tacitement chaque mois."}
                </p>
                <p>
                  <strong>{"4.2 R\u00e9siliation :"}</strong> {"Le Client peut r\u00e9silier son abonnement \u00e0 tout moment depuis son espace personnel, sans frais ni p\u00e9nalit\u00e9s. La r\u00e9siliation prend effet \u00e0 la fin de la p\u00e9riode en cours."}
                </p>
                <p>
                  <strong>4.3 Suspension :</strong> {"Belaya se r\u00e9serve le droit de suspendre ou r\u00e9silier un compte en cas de non-paiement, d\u2019utilisation frauduleuse ou de violation des conditions d\u2019utilisation."}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                5. Obligations du Client
              </h2>
              <p className="mb-3">{"Le Client s\u2019engage \u00e0 :"}</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{"Fournir des informations exactes et \u00e0 jour lors de l\u2019inscription"}</li>
                <li>{"Utiliser les services de mani\u00e8re conforme \u00e0 leur destination"}</li>
                <li>{"Respecter les droits de propri\u00e9t\u00e9 intellectuelle de Belaya"}</li>
                <li>{"Ne pas tenter de contourner les mesures de s\u00e9curit\u00e9 du service"}</li>
                <li>{"Maintenir la confidentialit\u00e9 de ses identifiants de connexion"}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                6. Obligations de Belaya
              </h2>
              <p className="mb-3">{"Belaya s\u2019engage \u00e0 :"}</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{"Fournir un service accessible 24h/24, 7j/7 (sauf maintenance programm\u00e9e)"}</li>
                <li>{"Assurer la s\u00e9curit\u00e9 et la confidentialit\u00e9 des donn\u00e9es clients"}</li>
                <li>{"Fournir un support client r\u00e9actif selon le forfait souscrit"}</li>
                <li>Informer les clients de toute modification importante des services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                {"7. Protection des donn\u00e9es"}
              </h2>
              <p>
                {"Belaya traite les donn\u00e9es personnelles conform\u00e9ment au RGPD. Les donn\u00e9es collect\u00e9es sont utilis\u00e9es uniquement pour la fourniture des services et ne sont jamais vendues \u00e0 des tiers. Pour plus d\u2019informations, consultez notre Politique de Confidentialit\u00e9."}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                {"8. Propri\u00e9t\u00e9 intellectuelle"}
              </h2>
              <p>
                {"Tous les \u00e9l\u00e9ments du service Belaya (logiciel, design, contenus) sont prot\u00e9g\u00e9s par le droit d\u2019auteur et restent la propri\u00e9t\u00e9 exclusive de Belaya. Le Client b\u00e9n\u00e9ficie d\u2019un droit d\u2019utilisation non exclusif et non transf\u00e9rable limit\u00e9 \u00e0 la dur\u00e9e de l\u2019abonnement."}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                {"9. Responsabilit\u00e9 et garanties"}
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>{"9.1 Disponibilit\u00e9 :"}</strong> {"Belaya s\u2019efforce d\u2019assurer une disponibilit\u00e9 maximale du service, mais ne peut garantir une disponibilit\u00e9 de 100%. Des interruptions pour maintenance sont possibles."}
                </p>
                <p>
                  <strong>{"9.2 Donn\u00e9es :"}</strong> {"Belaya met en \u0153uvre des sauvegardes r\u00e9guli\u00e8res mais recommande au Client d\u2019exporter r\u00e9guli\u00e8rement ses donn\u00e9es importantes."}
                </p>
                <p>
                  <strong>9.3 Limitation :</strong> {"La responsabilit\u00e9 de Belaya est limit\u00e9e aux dommages directs et ne peut exc\u00e9der le montant des sommes vers\u00e9es par le Client au cours des 12 derniers mois."}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                {"10. Droit de r\u00e9tractation"}
              </h2>
              <p>
                {"Conform\u00e9ment \u00e0 la l\u00e9gislation en vigueur, le Client b\u00e9n\u00e9ficie d\u2019un droit de r\u00e9tractation de 14 jours \u00e0 compter de la souscription. Ce droit peut \u00eatre exerc\u00e9 sans motif ni p\u00e9nalit\u00e9 en contactant le service client."}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                11. Modifications des CGV
              </h2>
              <p>
                {"Belaya se r\u00e9serve le droit de modifier les pr\u00e9sentes CGV \u00e0 tout moment. Les Clients seront inform\u00e9s des modifications par email au moins 30 jours avant leur entr\u00e9e en vigueur. La poursuite de l\u2019utilisation du service apr\u00e8s l\u2019entr\u00e9e en vigueur des nouvelles CGV vaut acceptation de ces derni\u00e8res."}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                {"12. Droit applicable et juridiction"}
              </h2>
              <p>
                {"Les pr\u00e9sentes CGV sont soumises au droit fran\u00e7ais. En cas de litige, une solution amiable sera recherch\u00e9e avant toute action judiciaire. \u00c0 d\u00e9faut, les tribunaux fran\u00e7ais seront seuls comp\u00e9tents."}
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
                <li><strong>WhatsApp :</strong> <a href={waLink} target={blankTarget} rel={relAttr} className="text-belaya-primary hover:underline">Rejoindre notre groupe</a></li>
              </ul>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600">
              {"En utilisant les services Belaya, vous acceptez les pr\u00e9sentes Conditions G\u00e9n\u00e9rales de Vente."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
