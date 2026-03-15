import { useState, useEffect, useRef } from 'react';
import { Gift, Upload, X, Save, Loader, Award, ToggleLeft, ToggleRight, Image, RefreshCw, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface LoyaltySettingsData {
  loyalty_enabled: boolean;
  loyalty_program_name: string;
  loyalty_visits_required: number;
  loyalty_reward_description: string;
  loyalty_card_background_url: string | null;
  loyalty_card_accent_color: string;
  loyalty_reset_on_redeem: boolean;
}

interface LoyaltySettingsProps {
  userId: string;
}

const ACCENT_PRESETS = [
  { label: 'Or', value: '#F59E0B' },
  { label: 'Rose', value: '#C43586' },
  { label: 'Corail', value: '#EF4444' },
  { label: 'Vert', value: '#10B981' },
  { label: 'Bleu', value: '#3B82F6' },
  { label: 'Gris', value: '#6B7280' },
];

export default function LoyaltySettings({ userId }: LoyaltySettingsProps) {
  const { showToast } = useToast();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [data, setData] = useState<LoyaltySettingsData>({
    loyalty_enabled: true,
    loyalty_program_name: '',
    loyalty_visits_required: 10,
    loyalty_reward_description: '',
    loyalty_card_background_url: null,
    loyalty_card_accent_color: '#F59E0B',
    loyalty_reset_on_redeem: false,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  async function loadSettings() {
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('company_profiles')
        .select('id, loyalty_enabled, loyalty_program_name, loyalty_visits_required, loyalty_reward_description, loyalty_card_background_url, loyalty_card_accent_color, loyalty_reset_on_redeem')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (profile) {
        setCompanyId(profile.id);
        setData({
          loyalty_enabled: profile.loyalty_enabled ?? true,
          loyalty_program_name: profile.loyalty_program_name ?? '',
          loyalty_visits_required: profile.loyalty_visits_required ?? 10,
          loyalty_reward_description: profile.loyalty_reward_description ?? '',
          loyalty_card_background_url: profile.loyalty_card_background_url ?? null,
          loyalty_card_accent_color: profile.loyalty_card_accent_color ?? '#F59E0B',
          loyalty_reset_on_redeem: profile.loyalty_reset_on_redeem ?? false,
        });
      }
    } catch (err) {
      console.error('Error loading loyalty settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_profiles')
        .update({
          loyalty_enabled: data.loyalty_enabled,
          loyalty_program_name: data.loyalty_program_name || null,
          loyalty_visits_required: Math.max(1, Math.min(100, data.loyalty_visits_required)),
          loyalty_reward_description: data.loyalty_reward_description || null,
          loyalty_card_background_url: data.loyalty_card_background_url,
          loyalty_card_accent_color: data.loyalty_card_accent_color || null,
          loyalty_reset_on_redeem: data.loyalty_reset_on_redeem,
        })
        .eq('id', companyId);

      if (error) throw error;
      showToast('success', 'Programme de fidélité mis à jour');
    } catch (err) {
      console.error('Error saving loyalty settings:', err);
      showToast('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    if (!companyId) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `loyalty-backgrounds/${companyId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(path);

      setData(prev => ({ ...prev, loyalty_card_background_url: urlData.publicUrl }));
      showToast('success', 'Image téléchargée avec succès');
    } catch (err) {
      console.error('Error uploading image:', err);
      showToast('error', "Erreur lors du téléchargement de l'image");
    } finally {
      setUploadingImage(false);
    }
  }

  function handleRemoveImage() {
    setData(prev => ({ ...prev, loyalty_card_background_url: null }));
  }

  const visitsRequired = data.loyalty_visits_required || 10;
  const accentColor = data.loyalty_card_accent_color || '#F59E0B';
  const previewCompleted = Math.min(3, visitsRequired);
  const previewStamps = Array.from({ length: Math.min(visitsRequired, 10) }, (_, i) => i < previewCompleted);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-6 h-6 text-[#C43586] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Gift className="w-6 h-6 text-[#C43586]" />
          <h2 className="text-xl font-bold text-gray-900">Programme de fidélité</h2>
        </div>
        <p className="text-sm text-gray-500 ml-9">
          Configurez votre programme de fidélité client. Ces paramètres s'affichent sur la fiche client.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Activer le programme</p>
            <p className="text-sm text-gray-500 mt-0.5">Afficher le programme de fidélité sur les fiches clients</p>
          </div>
          <button
            onClick={() => setData(prev => ({ ...prev, loyalty_enabled: !prev.loyalty_enabled }))}
            className="focus:outline-none"
          >
            {data.loyalty_enabled ? (
              <ToggleRight className="w-10 h-10 text-[#C43586]" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-400" />
            )}
          </button>
        </div>

        {data.loyalty_enabled && (
          <>
            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nom du programme
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Donnez un nom à votre programme (ex: "Club VIP", "Carte Or", "Fidélité Premium")
              </p>
              <input
                type="text"
                placeholder="Ex : Club VIP, Carte Or, Fidélité Premium..."
                value={data.loyalty_program_name}
                onChange={e => setData(prev => ({ ...prev, loyalty_program_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C43586] focus:border-transparent"
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre de RDV avant récompense
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Le client débloque une récompense après ce nombre de rendez-vous validés.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={data.loyalty_visits_required}
                  onChange={e => setData(prev => ({ ...prev, loyalty_visits_required: parseInt(e.target.value) || 1 }))}
                  className="w-28 border border-gray-300 rounded-xl px-4 py-2.5 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#C43586] focus:border-transparent"
                />
                <span className="text-gray-600 text-sm">rendez-vous</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description de la récompense
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Décrivez ce que le client reçoit en cadeau (ex: "Soin offert", "Réduction 20%", "Extension gratuite")
              </p>
              <input
                type="text"
                placeholder="Ex : Soin offert, Réduction 20%, Extension gratuite..."
                value={data.loyalty_reward_description}
                onChange={e => setData(prev => ({ ...prev, loyalty_reward_description: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C43586] focus:border-transparent"
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                    <p className="font-semibold text-gray-900">Réinitialiser après récompense</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 ml-6">
                    Le compteur repart à 0 une fois la récompense débloquée
                  </p>
                </div>
                <button
                  onClick={() => setData(prev => ({ ...prev, loyalty_reset_on_redeem: !prev.loyalty_reset_on_redeem }))}
                  className="focus:outline-none"
                >
                  {data.loyalty_reset_on_redeem ? (
                    <ToggleRight className="w-10 h-10 text-[#C43586]" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 ml-6">
                {data.loyalty_reset_on_redeem
                  ? 'Le client recommence à 0 après chaque récompense — idéal pour récompenser régulièrement.'
                  : 'La récompense reste débloquée — le badge "Débloqué" reste affiché.'
                }
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Palette className="w-4 h-4 text-gray-500" />
                Couleur d'accent
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Couleur utilisée pour les tampons et accents de la carte (si pas d'image de fond)
              </p>
              <div className="flex flex-wrap gap-3">
                {ACCENT_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setData(prev => ({ ...prev, loyalty_card_accent_color: preset.value }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      data.loyalty_card_accent_color === preset.value
                        ? 'border-gray-900 shadow-sm scale-105'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.value }}
                    />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Image de fond de la carte
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Personnalisez votre carte de fidélité avec une image (recommandé : 800×400px)
              </p>

              {data.loyalty_card_background_url ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={data.loyalty_card_background_url}
                    alt="Fond de carte"
                    className="w-full h-36 object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#C43586] hover:text-[#C43586] transition-colors"
                >
                  {uploadingImage ? (
                    <Loader className="w-6 h-6 animate-spin" />
                  ) : (
                    <Image className="w-6 h-6" />
                  )}
                  <span className="text-sm font-medium">
                    {uploadingImage ? 'Téléchargement...' : 'Ajouter une image de fond'}
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Aperçu de la carte
              </p>

              <LoyaltyCardPreview
                programName={data.loyalty_program_name || 'Programme fidélité'}
                rewardDescription={data.loyalty_reward_description || 'Votre récompense'}
                backgroundUrl={data.loyalty_card_background_url}
                accentColor={accentColor}
                visitsRequired={visitsRequired}
                previewCompleted={previewCompleted}
                previewStamps={previewStamps}
              />
              <p className="text-xs text-gray-400 mt-2 text-center">Aperçu avec 3 RDV validés</p>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-[#C43586] text-white rounded-xl font-semibold hover:bg-[#a82d72] transition-colors disabled:opacity-60"
      >
        {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  );
}

interface LoyaltyCardPreviewProps {
  programName: string;
  rewardDescription: string;
  backgroundUrl: string | null;
  accentColor: string;
  visitsRequired: number;
  previewCompleted: number;
  previewStamps: boolean[];
}

export function LoyaltyCardPreview({
  programName,
  rewardDescription,
  backgroundUrl,
  accentColor,
  visitsRequired,
  previewCompleted,
  previewStamps,
}: LoyaltyCardPreviewProps) {
  const rewardUnlocked = previewCompleted >= visitsRequired;

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-lg"
      style={{
        background: backgroundUrl
          ? `url(${backgroundUrl}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        minHeight: '180px',
      }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
              {programName}
            </p>
            <p className="text-white font-bold text-base leading-tight">
              {rewardDescription}
            </p>
          </div>
          {rewardUnlocked ? (
            <span
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full shrink-0"
              style={{ backgroundColor: accentColor, color: '#1a1a2e' }}
            >
              <Gift className="w-3 h-3" />
              Débloqué !
            </span>
          ) : (
            <Gift className="w-7 h-7 shrink-0" style={{ color: accentColor }} />
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {previewStamps.map((filled, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all"
              style={filled
                ? { backgroundColor: accentColor, borderColor: accentColor }
                : { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.08)' }
              }
            >
              {filled && <Award className="w-3.5 h-3.5 text-white" />}
            </div>
          ))}
          {visitsRequired > 10 && (
            <span className="text-white/60 text-xs self-center ml-0.5">+{visitsRequired - 10}</span>
          )}
        </div>

        <p className="text-white/60 text-xs">
          {rewardUnlocked
            ? `${previewCompleted} / ${visitsRequired} RDV — Récompense débloquée !`
            : `${previewCompleted} / ${visitsRequired} RDV — encore ${visitsRequired - previewCompleted} pour la récompense`
          }
        </p>
      </div>
    </div>
  );
}
