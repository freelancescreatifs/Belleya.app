import { ArrowLeft } from 'lucide-react';

export default function MentionsLegales() {
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
              Mentions Légales
            </h1>
            <p className="text-gray-600 text-sm">
              Dernière mise à jour : Février 2026
            </p>
          </div>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                1. Éditeur du site
              </h2>
              <div className="space-y-2">
                <p><strong>Nom de la société :</strong> Belaya</p>
                <p><strong>Forme juridique :</strong> [À compléter]</p>
                <p><strong>Siège social :</strong> [Adresse à compléter]</p>
                <p><strong>SIRET :</strong> [Numéro à compléter]</p>
                <p><strong>Email :</strong> contact@belaya.fr</p>
                <p><strong>Téléphone :</strong> [Numéro à compléter]</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                2. Directeur de publication
              </h2>
              <p>
                Le directeur de la publication est : [Nom du directeur]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                3. Hébergement
              </h2>
              <div className="space-y-2">
                <p><strong>Hébergeur :</strong> Supabase Inc.</p>
                <p><strong>Adresse :</strong> 970 Toa Payoh North, #07-04, Singapore 318992</p>
                <p><strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-belaya-primary hover:underline">supabase.com</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                4. Propriété intellectuelle
              </h2>
              <p className="mb-3">
                L'ensemble du contenu de ce site (textes, images, logos, vidéos, etc.) est la propriété exclusive de Belaya,
                sauf mention contraire. Toute reproduction, distribution ou utilisation sans autorisation écrite préalable est interdite.
              </p>
              <p>
                Les marques, logos et éléments graphiques présents sur le site sont des marques déposées de Belaya ou de ses partenaires.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                5. Protection des données personnelles
              </h2>
              <p className="mb-3">
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés,
                vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition des données vous concernant.
              </p>
              <p className="mb-3">
                Pour exercer ces droits, vous pouvez nous contacter à l'adresse : contact@belaya.fr
              </p>
              <p>
                Les données collectées sont destinées à l'usage exclusif de Belaya et ne seront en aucun cas cédées à des tiers
                sans votre consentement préalable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                6. Cookies
              </h2>
              <p>
                Le site utilise des cookies pour améliorer l'expérience utilisateur et réaliser des statistiques de visite.
                Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités du site
                pourraient ne pas fonctionner correctement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                7. Responsabilité
              </h2>
              <p>
                Belaya s'efforce de fournir des informations exactes et à jour. Toutefois, nous ne pouvons garantir l'exactitude,
                la précision ou l'exhaustivité des informations mises à disposition sur ce site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-belaya-deep mb-4">
                8. Droit applicable
              </h2>
              <p>
                Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français
                seront seuls compétents.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600">
              Pour toute question concernant ces mentions légales, contactez-nous à{' '}
              <a href="mailto:contact@belaya.fr" className="text-belaya-primary hover:underline">
                contact@belaya.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
