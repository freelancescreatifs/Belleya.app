import { X, Upload, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Partnership {
  id: string;
  company_name: string;
  logo_url: string | null;
  partnership_type: 'affiliation' | 'recommandation' | 'sponsoring' | 'formation';
  commission_rate: number;
  compensation_mode: 'percentage' | 'fixed' | 'recurring';
  affiliate_link: string | null;
  promo_code: string | null;
  status: 'active' | 'pending' | 'completed';
  start_date: string | null;
  end_date: string | null;
  conditions: string | null;
  estimated_goal: number;
  last_action: string | null;
  next_action: string | null;
  promotion_frequency: string | null;
  notes: string | null;
}

interface PartnershipFormModalProps {
  partnership: Partnership | null;
  onClose: () => void;
  onSave: () => void;
}

export default function PartnershipFormModal({ partnership, onClose, onSave }: PartnershipFormModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isBelleya = partnership?.is_default && partnership?.company_name === 'Belleya';
  const [form, setForm] = useState({
    company_name: '',
    logo_url: '',
    partnership_type: 'affiliation' as const,
    commission_rate: 0,
    compensation_mode: 'percentage' as const,
    affiliate_link: '',
    promo_code: '',
    status: 'active' as const,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    conditions: '',
    estimated_goal: 0,
    last_action: '',
    next_action: '',
    promotion_frequency: '',
    notes: ''
  });

  useEffect(() => {
    if (partnership) {
      setForm({
        company_name: partnership.company_name,
        logo_url: partnership.logo_url || '',
        partnership_type: partnership.partnership_type,
        commission_rate: partnership.commission_rate,
        compensation_mode: partnership.compensation_mode,
        affiliate_link: partnership.affiliate_link || '',
        promo_code: partnership.promo_code || '',
        status: partnership.status,
        start_date: partnership.start_date || new Date().toISOString().split('T')[0],
        end_date: partnership.end_date || '',
        conditions: partnership.conditions || '',
        estimated_goal: partnership.estimated_goal,
        last_action: partnership.last_action || '',
        next_action: partnership.next_action || '',
        promotion_frequency: partnership.promotion_frequency || '',
        notes: partnership.notes || ''
      });
    }
  }, [partnership]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2 MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `partnership-logo-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-photos')
        .getPublicUrl(filePath);

      setForm({ ...form, logo_url: publicUrl });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Erreur lors de l\'upload du logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setForm({ ...form, logo_url: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.company_name.trim()) return;

    setLoading(true);
    try {
      let data;

      if (isBelleya) {
        data = {
          estimated_goal: form.estimated_goal,
          notes: form.notes.trim() || null
        };
      } else {
        data = {
          user_id: user.id,
          company_name: form.company_name.trim(),
          logo_url: form.logo_url.trim() || null,
          partnership_type: form.partnership_type,
          commission_rate: form.commission_rate,
          compensation_mode: form.compensation_mode,
          affiliate_link: form.affiliate_link.trim() || null,
          promo_code: form.promo_code.trim() || null,
          status: form.status,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          conditions: form.conditions.trim() || null,
          estimated_goal: form.estimated_goal,
          last_action: form.last_action.trim() || null,
          next_action: form.next_action.trim() || null,
          promotion_frequency: form.promotion_frequency.trim() || null,
          notes: form.notes.trim() || null
        };
      }

      if (partnership) {
        const { error } = await supabase
          .from('partnerships')
          .update(data)
          .eq('id', partnership.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partnerships')
          .insert(data);

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving partnership:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-gray-900">
              {partnership ? 'Modifier le partenariat' : 'Nouveau partenariat'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {isBelleya && (
              <div className="bg-gradient-to-br from-belleya-50 to-belleya-100 rounded-lg p-4 border border-belleya-200 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-belleya-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-belleya-deep mb-1">Partenariat officiel Belleya</p>
                    <p className="text-xs text-belleya-deep">
                      Ce partenariat ne peut pas être supprimé. Seuls les objectifs et les notes internes peuvent être modifiés.
                      Pour modifier la commission (25% ou 30%), utilisez le toggle "Service client impliqué" dans les détails du partenariat.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isBelleya && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  required
                  placeholder="Ex: Shopify, Instagram, etc."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-500"
                />
              </div>
            )}

            {!isBelleya && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo du partenaire
                  </label>
                  <div className="space-y-3">
                    {form.logo_url ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={form.logo_url}
                          alt="Logo"
                          className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-belleya-400 hover:bg-gray-50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            {uploading ? 'Upload en cours...' : 'Cliquez pour uploader une image'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 2MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de partenariat *
                    </label>
                    <select
                      value={form.partnership_type}
                      onChange={(e) => setForm({ ...form, partnership_type: e.target.value as any })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary"
                    >
                      <option value="affiliation">Affiliation</option>
                      <option value="recommandation">Recommandation</option>
                      <option value="sponsoring">Sponsoring</option>
                      <option value="formation">Partenariat formation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut *
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary"
                    >
                      <option value="active">Actif</option>
                      <option value="pending">En attente</option>
                      <option value="completed">Terminé</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission (%) *
                    </label>
                    <input
                      type="number"
                      value={form.commission_rate}
                      onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })}
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mode de rémunération *
                    </label>
                    <select
                      value={form.compensation_mode}
                      onChange={(e) => setForm({ ...form, compensation_mode: e.target.value as any })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary"
                    >
                      <option value="percentage">% sur vente</option>
                      <option value="fixed">Montant fixe</option>
                      <option value="recurring">Récurrent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lien affilié
                  </label>
                  <input
                    type="url"
                    value={form.affiliate_link}
                    onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code promo
                  </label>
                  <input
                    type="text"
                    value={form.promo_code}
                    onChange={(e) => setForm({ ...form, promo_code: e.target.value })}
                    placeholder="Ex: PROMO2024"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objectif estimé (€)
              </label>
              <input
                type="number"
                value={form.estimated_goal}
                onChange={(e) => setForm({ ...form, estimated_goal: Number(e.target.value) })}
                min="0"
                step="0.01"
                placeholder="1000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-500"
              />
            </div>

            {!isBelleya && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conditions principales
                </label>
                <textarea
                  value={form.conditions}
                  onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                  rows={3}
                  placeholder="Décrivez les conditions du partenariat..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-500 resize-none"
                />
              </div>
            )}

            {!isBelleya && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Suivi & actions</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dernière action réalisée
                    </label>
                    <input
                      type="text"
                      value={form.last_action}
                      onChange={(e) => setForm({ ...form, last_action: e.target.value })}
                      placeholder="Ex: Story Instagram le 15/01"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prochaine action prévue
                    </label>
                    <input
                      type="text"
                      value={form.next_action}
                      onChange={(e) => setForm({ ...form, next_action: e.target.value })}
                      placeholder="Ex: Post prévu fin du mois"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence de mise en avant
                    </label>
                    <input
                      type="text"
                      value={form.promotion_frequency}
                      onChange={(e) => setForm({ ...form, promotion_frequency: e.target.value })}
                      placeholder="Ex: 1x par mois"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes internes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      placeholder="Ressenti, contraintes, feedback..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {isBelleya && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes internes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Ressenti, contraintes, feedback..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-belleya-500 resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading || !form.company_name.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-belleya-primary to-belleya-500 text-white rounded-lg hover:from-belleya-primary hover:to-belleya-primary transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Enregistrement...' : partnership ? 'Modifier' : 'Créer le partenariat'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
