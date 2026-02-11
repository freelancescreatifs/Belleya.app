import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

interface LanguageSettingsProps {
  userId: string;
  currentLanguage?: string;
}

export default function LanguageSettings({ userId, currentLanguage }: LanguageSettingsProps) {
  const { i18n, t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || i18n.language);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
    { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' }
  ];

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLanguage(langCode);
    setSaving(true);
    setMessage(null);

    try {
      await i18n.changeLanguage(langCode);

      const { error } = await supabase
        .from('user_profiles')
        .update({ preferred_language: langCode })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ type: 'success', text: t('settings.language.success') });
    } catch (error) {
      console.error('Error updating language:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour de la langue' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('settings.language.title')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('settings.language.description')}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={saving}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              selectedLanguage === lang.code
                ? 'border-belleya-500 bg-belleya-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{lang.flag}</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{lang.nativeName}</p>
                <p className="text-sm text-gray-500">{lang.name}</p>
              </div>
            </div>

            {selectedLanguage === lang.code && (
              <div className="w-6 h-6 rounded-full bg-belleya-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Globe className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Détection automatique</p>
          <p className="text-blue-700">
            Si aucune langue n'est définie, l'application utilisera automatiquement la langue de votre navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
