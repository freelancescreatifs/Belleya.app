import { useState, useRef } from 'react';
import { Camera, Loader2, Save, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardSettingsProps {
  affiliate: {
    id: string;
    full_name: string;
    commission_rate: number;
    base_commission_rate: number;
    active_sub_count: number;
    status: string;
    created_at: string;
    is_special: boolean;
    disable_tiers: boolean;
    avatar_url?: string | null;
    level: string;
  };
  rank: { label: string };
  commissionRate: number;
  showToast: (type: string, msg: string) => void;
  onAvatarUpdated: (url: string) => void;
}

export default function DashboardSettings({ affiliate, rank, commissionRate, showToast, onAvatarUpdated }: DashboardSettingsProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Seules les images sont acceptees');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image trop lourde (max 2 Mo)');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${affiliate.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('affiliate-avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('affiliate-avatars')
        .getPublicUrl(path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('affiliates')
        .update({ avatar_url: publicUrl })
        .eq('id', affiliate.id);

      if (updateError) throw updateError;

      onAvatarUpdated(publicUrl);
      showToast('success', 'Photo de profil mise a jour');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Photo de profil</h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              {affiliate.avatar_url ? (
                <img src={affiliate.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{affiliate.full_name || 'Affilie'}</p>
            <p className="text-xs text-gray-500 mt-1">Clique sur la photo pour la modifier</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG - max 2 Mo</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Informations du compte</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          {!affiliate.disable_tiers && (
            <InfoItem label="Niveau" value={rank.label} />
          )}
          <InfoItem
            label="Taux de commission"
            value={`${commissionRate}%${affiliate.is_special ? ' (fixe)' : ''}`}
          />
          <InfoItem
            label="Membre depuis"
            value={affiliate.created_at ? new Date(affiliate.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
          />
          <div>
            <p className="text-sm text-gray-500 mb-1">Statut</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              affiliate.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              affiliate.status === 'observation' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {affiliate.status === 'active' ? 'Actif' : affiliate.status === 'observation' ? 'Observation' : 'Desactive'}
            </span>
          </div>
          <InfoItem label="Abonnements actifs" value={String(affiliate.active_sub_count)} />
          <InfoItem label="Code parrain" value={affiliate.id.slice(0, 8) + '...'} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
