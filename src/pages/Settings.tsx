import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, FileText, Calculator, LayoutGrid, Globe } from 'lucide-react';
import CompanyProfileForm from '../components/settings/CompanyProfileForm';
import MyDocuments from '../components/settings/MyDocuments';
import ProfitabilityCalculator from '../components/settings/ProfitabilityCalculator';
import SocialMediaSettings from '../components/settings/SocialMediaSettings';
import LanguageSettings from '../components/settings/LanguageSettings';

export default function Settings() {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'documents' | 'profitability' | 'tabs' | 'language'>('company');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
        <p className="text-gray-600">Gérez votre profil et les informations de votre entreprise</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('company')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'company'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Profil d'entreprise
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              Mes documents
            </button>
            <button
              onClick={() => setActiveTab('profitability')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'profitability'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calculator className="w-5 h-5" />
              Rentabilité
            </button>
            <button
              onClick={() => setActiveTab('tabs')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'tabs'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              Onglets
            </button>
            <button
              onClick={() => setActiveTab('language')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'language'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-5 h-5" />
              Langue
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
            <ProfitabilityCalculator userId={user.id} />
          )}

          {activeTab === 'tabs' && user && (
            <SocialMediaSettings userId={user.id} />
          )}

          {activeTab === 'language' && user && (
            <LanguageSettings userId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
}
