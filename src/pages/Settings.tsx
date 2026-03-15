import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, FileText, Calculator, LayoutGrid, Globe, Crown, Plug, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CompanyProfileForm from '../components/settings/CompanyProfileForm';
import MyDocuments from '../components/settings/MyDocuments';
import ProfitabilityCalculator from '../components/settings/ProfitabilityCalculator';
import SocialMediaSettings from '../components/settings/SocialMediaSettings';
import LanguageSettings from '../components/settings/LanguageSettings';
import SubscriptionStatus from '../components/settings/SubscriptionStatus';
import GoogleCalendarIntegration from '../components/settings/GoogleCalendarIntegration';
import SocialAccountConnections from '../components/settings/SocialAccountConnections';
import LoyaltySettings from '../components/settings/LoyaltySettings';
import { useSubscription } from '../hooks/useSubscription';
import UpgradeOverlay from '../components/shared/UpgradeOverlay';

export default function Settings() {
  const { user, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const { canAccess } = useSubscription();
  const [activeTab, setActiveTab] = useState<'company' | 'documents' | 'profitability' | 'tabs' | 'language' | 'subscription' | 'integrations' | 'loyalty'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'integrations' || params.get('google_connected') || params.get('google_error')) {
      return 'integrations';
    }
    return 'company';
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('settings.title')}</h1>
        <p className="text-gray-600">{t('settings.subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('company')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'company'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-5 h-5" />
              {t('settings.tabs.company')}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'documents'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              {t('settings.tabs.documents')}
            </button>
            <button
              onClick={() => setActiveTab('profitability')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'profitability'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calculator className="w-5 h-5" />
              {t('settings.tabs.profitability')}
            </button>
            <button
              onClick={() => setActiveTab('tabs')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'tabs'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              {t('settings.tabs.social')}
            </button>
            <button
              onClick={() => setActiveTab('language')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'language'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-5 h-5" />
              {t('settings.tabs.language')}
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'integrations'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plug className="w-5 h-5" />
              Integrations
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'loyalty'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Gift className="w-5 h-5" />
              Fidélité
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'subscription'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Crown className="w-5 h-5" />
              Mon abonnement
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'company' && user && (
            <CompanyProfileForm
              userId={user.id}
              onProfileUpdated={refreshProfile}
            />
          )}

          {activeTab === 'documents' && (
            <MyDocuments />
          )}

          {activeTab === 'profitability' && user && (
            canAccess('profitability') ? (
              <ProfitabilityCalculator userId={user.id} />
            ) : (
              <UpgradeOverlay requiredPlan="studio">
                <ProfitabilityCalculator userId={user.id} />
              </UpgradeOverlay>
            )
          )}

          {activeTab === 'tabs' && user && (
            <SocialMediaSettings userId={user.id} />
          )}

          {activeTab === 'language' && user && (
            <LanguageSettings userId={user.id} />
          )}

          {activeTab === 'integrations' && user && (
            <div className="space-y-10">
              <SocialAccountConnections />
              <div className="border-t border-gray-200 pt-10">
                <GoogleCalendarIntegration />
              </div>
            </div>
          )}

          {activeTab === 'loyalty' && user && (
            <LoyaltySettings userId={user.id} />
          )}

          {activeTab === 'subscription' && user && (
            <SubscriptionStatus />
          )}
        </div>
      </div>
    </div>
  );
}
