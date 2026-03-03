import { useState, useEffect } from 'react';
import { Save, Link2, Copy, Check } from 'lucide-react';
import InfoTooltip from '../shared/InfoTooltip';
import { updateBookingSlug, getBookingUrl } from '../../lib/slugHelpers';
import { supabase } from '../../lib/supabase';
import { PROFESSIONS, type ProfessionKey } from '../../lib/professionHelpers';
import { convertWeeklyAvailabilityToSchedule } from '../../lib/availabilityHelpers';

type LegalStatus = 'MICRO' | 'EI' | 'SASU_EURL' | 'OTHER' | '';
type TaxCategory =
  | 'MICRO_BNC' | 'MICRO_BIC_SERVICES' | 'MICRO_BIC_SALES'
  | 'BIC_REAL_SIMPLIFIED' | 'BIC_REAL_NORMAL' | 'BNC_CONTROLLED'
  | 'BIC_SERVICES' | 'BIC_SALES'
  | '';
type TaxationRegime = 'IS' | 'IR' | '';
type VatMode = 'VAT_FRANCHISE' | 'VAT_LIABLE' | '';

interface WeeklyAvailability {
  monday: any[];
  tuesday: any[];
  wednesday: any[];
  thursday: any[];
  friday: any[];
  saturday: any[];
  sunday: any[];
}

interface CompanyProfile {
  id?: string;
  company_name: string;
  activity_type: string;
  activity_types: string[];
  primary_profession: ProfessionKey | '';
  additional_professions: ProfessionKey[];
  creation_date: string;
  country: string;
  legal_status: LegalStatus;
  tax_category: TaxCategory;
  taxation_regime: TaxationRegime;
  vat_mode: VatMode;
  acre: boolean;
  versement_liberatoire: boolean;
  other_legal_status_label: string;
  booking_slug?: string;
  weekly_availability: WeeklyAvailability;
  default_appointment_duration: number;
  advance_booking_hours: number;
  buffer_time_minutes: number;
  max_bookings_per_day: number | null;
  auto_accept_bookings: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  welcome_message: string;
  booking_instructions: string;
  cancellation_policy: string;
  deposit_required: boolean;
  deposit_amount: number | null;
}

interface CompanyProfileFormProps {
  userId: string;
  onSaved?: () => void;
  onProfileUpdated?: () => void;
}

export default function CompanyProfileForm({ userId, onSaved, onProfileUpdated }: CompanyProfileFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedBookingUrl, setCopiedBookingUrl] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile>({
    company_name: '',
    activity_type: '',
    activity_types: [],
    primary_profession: '',
    additional_professions: [],
    creation_date: '',
    country: 'France',
    legal_status: '',
    tax_category: '',
    taxation_regime: '',
    vat_mode: '',
    acre: false,
    versement_liberatoire: false,
    other_legal_status_label: '',
    weekly_availability: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    default_appointment_duration: 60,
    advance_booking_hours: 24,
    buffer_time_minutes: 15,
    max_bookings_per_day: null,
    auto_accept_bookings: false,
    email_notifications: true,
    sms_notifications: false,
    welcome_message: '',
    booking_instructions: '',
    cancellation_policy: '',
    deposit_required: false,
    deposit_amount: null,
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          ...data,
          legal_status: data.legal_status || '',
          activity_types: data.activity_types || [],
          primary_profession: data.primary_profession || '',
          additional_professions: data.additional_professions || [],
          other_legal_status_label: data.other_legal_status_label || '',
          taxation_regime: data.taxation_regime || '',
          weekly_availability: data.weekly_availability || {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
          },
          default_appointment_duration: data.default_appointment_duration ?? 60,
          advance_booking_hours: data.advance_booking_hours ?? 24,
          buffer_time_minutes: data.buffer_time_minutes ?? 15,
          max_bookings_per_day: data.max_bookings_per_day ?? null,
          auto_accept_bookings: data.auto_accept_bookings ?? false,
          email_notifications: data.email_notifications ?? true,
          sms_notifications: data.sms_notifications ?? false,
          welcome_message: data.welcome_message || '',
          booking_instructions: data.booking_instructions || '',
          cancellation_policy: data.cancellation_policy || '',
          deposit_required: data.deposit_required ?? false,
          deposit_amount: data.deposit_amount ?? null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLegalStatusChange = (newStatus: LegalStatus) => {
    let defaultTaxCategory: TaxCategory = '';
    let defaultTaxationRegime: TaxationRegime = '';
    let defaultVatMode: VatMode = '';

    if (newStatus === 'MICRO') {
      defaultTaxCategory = 'MICRO_BIC_SERVICES';
      defaultVatMode = 'VAT_FRANCHISE';
    } else if (newStatus === 'EI') {
      defaultTaxCategory = 'BIC_REAL_SIMPLIFIED';
      defaultVatMode = 'VAT_LIABLE';
    } else if (newStatus === 'SASU_EURL') {
      defaultTaxationRegime = 'IS';
      defaultTaxCategory = 'BIC_SERVICES';
      defaultVatMode = 'VAT_LIABLE';
    } else if (newStatus === 'OTHER') {
      defaultTaxCategory = '';
      defaultVatMode = 'VAT_LIABLE';
    }

    setProfile({
      ...profile,
      legal_status: newStatus,
      tax_category: defaultTaxCategory,
      taxation_regime: defaultTaxationRegime,
      vat_mode: defaultVatMode,
      versement_liberatoire: newStatus === 'MICRO' ? profile.versement_liberatoire : false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.primary_profession) {
      alert('Veuillez sélectionner votre métier principal');
      return;
    }

    if (profile.primary_profession === 'multi_metiers' && profile.additional_professions.length === 0) {
      alert('Veuillez sélectionner au moins un métier pour le mode Multi-métiers');
      return;
    }

    if (!profile.legal_status || !profile.tax_category || !profile.vat_mode) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const newSlug = await updateBookingSlug(userId, profile.company_name);

      const weekSchedule = convertWeeklyAvailabilityToSchedule(profile.weekly_availability);

      const { error } = await supabase
        .from('company_profiles')
        .upsert({
          ...profile,
          user_id: userId,
          booking_slug: newSlug,
          legal_status: profile.legal_status || null,
          weekly_availability: profile.weekly_availability,
          week_schedule: weekSchedule,
          updated_at: new Date().toISOString(),
          other_legal_status_label: profile.legal_status === 'OTHER' ? profile.other_legal_status_label : null,
          taxation_regime: profile.legal_status === 'SASU_EURL' ? profile.taxation_regime : null,
        });

      if (error) {
        console.error('Supabase error saving profile:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      alert('Profil sauvegardé avec succès !');
      if (onSaved) onSaved();
      if (onProfileUpdated) onProfileUpdated();
      loadProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorMessage = error?.message || 'Erreur inconnue';
      const errorDetails = error?.details || '';
      alert(`Erreur lors de la sauvegarde du profil: ${errorMessage}\n${errorDetails}`);
    } finally {
      setSaving(false);
    }
  };

  const copyBookingUrl = () => {
    if (!profile.booking_slug) return;
    const url = getBookingUrl(profile.booking_slug);
    navigator.clipboard.writeText(url);
    setCopiedBookingUrl(true);
    setTimeout(() => setCopiedBookingUrl(false), 2000);
  };

  const getTaxCategoryOptions = (): Array<{ value: TaxCategory; label: string }> => {
    if (profile.legal_status === 'MICRO') {
      return [
        { value: 'MICRO_BNC', label: 'Micro-BNC — activité libérale' },
        { value: 'MICRO_BIC_SERVICES', label: 'Micro-BIC — prestations de services' },
        { value: 'MICRO_BIC_SALES', label: 'Micro-BIC — vente de marchandises' },
      ];
    } else if (profile.legal_status === 'EI') {
      return [
        { value: 'BIC_REAL_SIMPLIFIED', label: 'BIC — réel simplifié' },
        { value: 'BIC_REAL_NORMAL', label: 'BIC — réel normal' },
        { value: 'BNC_CONTROLLED', label: 'BNC — déclaration contrôlée' },
      ];
    } else if (profile.legal_status === 'SASU_EURL') {
      return [
        { value: 'BIC_SERVICES', label: 'BIC — prestations de services' },
        { value: 'BIC_SALES', label: 'BIC — vente de marchandises' },
      ];
    }
    return [];
  };

  const getTaxCategoryLabel = (): string => {
    if (profile.legal_status === 'MICRO') return 'Catégorie d\'activité (micro)';
    if (profile.legal_status === 'EI') return 'Régime fiscal';
    if (profile.legal_status === 'SASU_EURL') return 'Type d\'activité';
    return 'Catégorie fiscale';
  };

  const getTaxationRegimeOptions = (): Array<{ value: TaxationRegime; label: string }> => {
    if (profile.legal_status === 'SASU_EURL') {
      return [
        { value: 'IS', label: 'Impôt sur les sociétés (IS)' },
        { value: 'IR', label: 'Impôt sur le revenu (IR)' },
      ];
    }
    return [];
  };

  const getVatModeOptions = (): Array<{ value: VatMode; label: string }> => {
    if (profile.legal_status === 'MICRO') {
      return [
        { value: 'VAT_FRANCHISE', label: 'Franchise en base de TVA (non assujettie)' },
        { value: 'VAT_LIABLE', label: 'Assujettie à la TVA' },
      ];
    } else if (profile.legal_status === 'EI' || profile.legal_status === 'SASU_EURL') {
      return [
        { value: 'VAT_LIABLE', label: 'Assujettie à la TVA' },
        { value: 'VAT_FRANCHISE', label: 'Franchise en base (si éligible)' },
      ];
    }
    return [
      { value: 'VAT_LIABLE', label: 'Assujettie à la TVA' },
      { value: 'VAT_FRANCHISE', label: 'Franchise en base de TVA' },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {profile.booking_slug && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-belaya-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Link2 className="w-6 h-6 text-belaya-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Votre lien de réservation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Partagez ce lien avec vos clientes pour qu'elles puissent prendre rendez-vous directement
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-belaya-300 rounded-lg px-4 py-3">
                  <p className="text-belaya-primary font-mono text-sm break-all">
                    {getBookingUrl(profile.booking_slug)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyBookingUrl}
                  className="p-3 bg-white rounded-lg hover:bg-belaya-100 transition-colors border border-belaya-300 shadow-sm"
                  title="Copier le lien"
                >
                  {copiedBookingUrl ? (
                    <Check className="w-5 h-5 text-belaya-bright" />
                  ) : (
                    <Copy className="w-5 h-5 text-belaya-primary" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations générales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              required
              value={profile.company_name}
              onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
              placeholder="Ma Belle Entreprise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Métier principal *
              <InfoTooltip content="Sélectionnez votre métier principal. Choisissez Multi-métiers si vous exercez plusieurs métiers." />
            </label>
            <div className="space-y-2">
              {PROFESSIONS.map((profession) => (
                <label
                  key={profession.key}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="primary_profession"
                    value={profession.key}
                    checked={profile.primary_profession === profession.key}
                    onChange={(e) => {
                      setProfile({
                        ...profile,
                        primary_profession: e.target.value as ProfessionKey,
                        additional_professions: e.target.value !== 'multi_metiers' ? [] : profile.additional_professions,
                      });
                    }}
                    className="w-4 h-4 text-belaya-primary border-gray-300 focus:ring-belaya-primary"
                  />
                  <span className="text-sm text-gray-700">{profession.label}</span>
                </label>
              ))}
            </div>
            {!profile.primary_profession && (
              <p className="text-sm text-red-500 mt-2">Veuillez sélectionner votre métier principal</p>
            )}
          </div>

          {profile.primary_profession === 'multi_metiers' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Métiers *
                <InfoTooltip content="Sélectionnez tous les métiers que vous exercez" />
              </label>
              <div className="space-y-2">
                {PROFESSIONS.filter(p => p.key !== 'multi_metiers').map((profession) => (
                  <label
                    key={profession.key}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={profile.additional_professions.includes(profession.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfile({
                            ...profile,
                            additional_professions: [...profile.additional_professions, profession.key],
                          });
                        } else {
                          setProfile({
                            ...profile,
                            additional_professions: profile.additional_professions.filter((p) => p !== profession.key),
                          });
                        }
                      }}
                      className="w-4 h-4 text-belaya-primary border-gray-300 rounded focus:ring-belaya-primary"
                    />
                    <span className="text-sm text-gray-700">{profession.label}</span>
                  </label>
                ))}
              </div>
              {profile.additional_professions.length === 0 && (
                <p className="text-sm text-red-500 mt-2">Veuillez sélectionner au moins un métier</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de création *
            </label>
            <input
              type="date"
              required
              value={profile.creation_date}
              onChange={(e) => setProfile({ ...profile, creation_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pays
            </label>
            <input
              type="text"
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Statut juridique *
          <InfoTooltip content="Votre statut juridique détermine vos obligations fiscales et sociales" />
        </h2>
        <div className="space-y-3">
          {[
            { value: 'MICRO', label: 'Micro-entreprise / auto-entrepreneur' },
            { value: 'EI', label: 'Entreprise individuelle' },
            { value: 'SASU_EURL', label: 'SASU / EURL' },
            { value: 'OTHER', label: 'Autre' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                profile.legal_status === option.value
                  ? 'border-belaya-500 bg-belaya-50'
                  : 'border-gray-200 hover:border-belaya-200'
              }`}
            >
              <input
                type="radio"
                name="legal_status"
                value={option.value}
                checked={profile.legal_status === option.value}
                onChange={(e) => handleLegalStatusChange(e.target.value as LegalStatus)}
                className="w-4 h-4 text-belaya-500 focus:ring-belaya-primary"
                required
              />
              <span className="ml-3 text-gray-900 font-medium">{option.label}</span>
            </label>
          ))}
        </div>

        {profile.legal_status === 'OTHER' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Préciser le statut *
            </label>
            <input
              type="text"
              required
              value={profile.other_legal_status_label}
              onChange={(e) => setProfile({ ...profile, other_legal_status_label: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
              placeholder="Ex: SARL, SAS..."
            />
          </div>
        )}
      </div>

      {profile.legal_status && profile.legal_status !== 'OTHER' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Régime fiscal</h2>
          <div className="space-y-4">
            {profile.legal_status === 'SASU_EURL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Régime d'imposition *
                  <InfoTooltip content="L'IS est le régime par défaut pour les SASU/EURL" />
                </label>
                <select
                  required
                  value={profile.taxation_regime}
                  onChange={(e) => setProfile({ ...profile, taxation_regime: e.target.value as TaxationRegime })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  {getTaxationRegimeOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {getTaxCategoryLabel()} *
                <InfoTooltip
                  content={
                    profile.legal_status === 'MICRO'
                      ? 'BIC pour activités commerciales/artisanales, BNC pour activités libérales'
                      : profile.legal_status === 'EI'
                      ? 'Le réel simplifié est le plus courant pour les entreprises individuelles'
                      : 'Prestations de services pour les métiers de la beauté'
                  }
                />
              </label>
              <select
                required
                value={profile.tax_category}
                onChange={(e) => setProfile({ ...profile, tax_category: e.target.value as TaxCategory })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                {getTaxCategoryOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {profile.legal_status && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">TVA et options</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                TVA *
                <InfoTooltip
                  content={
                    profile.legal_status === 'MICRO'
                      ? 'En franchise si CA < 36 800€ (services) ou 91 900€ (biens)'
                      : 'Assujettie à la TVA par défaut, franchise possible si éligible'
                  }
                />
              </label>
              <select
                required
                value={profile.vat_mode}
                onChange={(e) => setProfile({ ...profile, vat_mode: e.target.value as VatMode })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                {getVatModeOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={profile.acre}
                  onChange={(e) => setProfile({ ...profile, acre: e.target.checked })}
                  className="w-4 h-4 text-belaya-500 focus:ring-belaya-primary rounded mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">ACRE (ex-ACCRE)</span>
                    <InfoTooltip content="Réduction de charges sociales pour créateurs d'entreprise" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Exonération partielle de charges la 1ère année
                  </p>
                </div>
              </label>

              {profile.legal_status === 'MICRO' && (
                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={profile.versement_liberatoire}
                    onChange={(e) => setProfile({ ...profile, versement_liberatoire: e.target.checked })}
                    className="w-4 h-4 text-belaya-500 focus:ring-belaya-primary rounded mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">Versement libératoire</span>
                      <InfoTooltip content="Paiement de l'impôt avec les cotisations sociales" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Option micro-entreprise selon conditions de revenus
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

    </form>
  );
}
