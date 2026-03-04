import { X, Upload, AlertCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../shared/ToastContainer';

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
  is_default?: boolean;
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

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function PartnershipFormModal({ partnership, onClose, onSave }: PartnershipFormModalProps) {
  const { user } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBelaya = partnership?.is_default && partnership?.company_name === 'Belaya';
  const [form, setForm] = useState({
    company_name: '',
    logo_url: '',
    partnership_type: 'affiliation' as const,
    commission_rate: '' as string | number,
    compensation_mode: 'percentage' as const,
    affiliate_link: '',
    promo_code: '',
    status: 'active' as const,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    conditions: '',
    estimated_goal: '' as string | number,
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
        commission_rate: partnership.commission_rate || '',
        compensation_mode: partnership.compensation_mode,
        affiliate_link: partnership.affiliate_link || '',
        promo_code: partnership.promo_code || '',
        status: partnership.status,
        start_date: partnership.start_date || new Date().toISOString().split('T')[0],
        end_date: partnership.end_date || '',
        conditions: partnership.conditions || '',
        estimated_goal: partnership.estimated_goal || '',
        last_action: partnership.last_action || '',
        next_action: partnership.next_action || '',
        promotion_frequency: partnership.promotion_frequency || '',
        notes: partnership.notes || ''
      });
      if (partnership.logo_url) {
        setLogoPreview(partnership.logo_url);
      }
    }
  }, [partnership]);

  const handleFileSelect = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('error', 'Format non supporté. Utilisez JPG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('error', 'Fichier trop volumineux (max 5 Mo).');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setForm({ ...form, logo_url: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;
    setUploading(true);
    try {
      const ext = logoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/partnerships/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(path, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!isBelaya && !form.company_name.trim())) return;

    setLoading(true);
    try {
      let logoUrl = form.logo_url.trim() || null;

      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) logoUrl = uploadedUrl;
      }

      let data;

      if (isBelaya) {
        data = {
          estimated_goal: Number(form.estimated_goal) || 0,
          notes: form.notes.trim() || null
        };
      } else {
        data = {
          user_id: user.id,
          company_name: form.company_name.trim(),
          logo_url: logoUrl,
          partnership_type: form.partnership_type,
          commission_rate: Number(form.commission_rate) || 0,
          compensation_mode: form.compensation_mode,
          affiliate_link: form.affiliate_link.trim() || null,
          promo_code: form.promo_code.trim() || null,
          status: form.status,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          conditions: form.conditions.trim() || null,
          estimated_goal: Number(form.estimated_goal) || 0,
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
      showToast('error', 'Erreur lors de l\'enregistrement');
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
            {isBelaya && (
              <div className="bg-gradient-to-br from-belaya-50 to-belaya-100 rounded-lg p-4 border border-belaya-200 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-belaya-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-belaya-deep mb-1">Partenariat officiel Belaya.app</p>
                    <p className="text-xs text-belaya-deep">
                      Ce partenariat ne peut pas être supprimé. Seuls les objectifs et les notes internes peuvent être modifiés.
                      Pour modifier la commission (25% ou 30%), utilisez le toggle "Service client impliqué" dans les détails du partenariat.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isBelaya && (
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
                />
              </div>
            )}

            {!isBelaya && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo
                  </label>
                  {logoPreview ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Changer
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-belaya-400 hover:bg-rose-50/30 transition-all"
                    >
                      <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-belaya-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          Cliquez ou glissez une image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG ou WebP (max 5 Mo)
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
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
                      onChange={(e) => setForm({ ...form, commission_rate: e.target.value === '' ? '' : Number(e.target.value) })}
                      onFocus={(e) => e.target.select()}
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
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
                onChange={(e) => setForm({ ...form, estimated_goal: e.target.value === '' ? '' : Number(e.target.value) })}
                onFocus={(e) => e.target.select()}
                min="0"
                step="0.01"
                placeholder="1000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500"
              />
            </div>

            {!isBelaya && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conditions principales
                </label>
                <textarea
                  value={form.conditions}
                  onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                  rows={3}
                  placeholder="Décrivez les conditions du partenariat..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 resize-none"
                />
              </div>
            )}

            {!isBelaya && (
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {isBelaya && (
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-belaya-500 resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading || uploading || (!isBelaya && !form.company_name.trim())}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-belaya-primary to-belaya-500 text-white rounded-lg hover:from-belaya-primary hover:to-belaya-primary transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {uploading ? 'Upload en cours...' : loading ? 'Enregistrement...' : partnership ? 'Modifier' : 'Créer le partenariat'}
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
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
