import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Plus, X, Save, Loader2, Trash2, ChevronDown,
  User, Copy, Check, ThumbsUp, Bookmark, BookmarkCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TipMessage {
  id: string;
  affiliate_id: string;
  category: string;
  message_type: string;
  message_body: string;
  when_to_use: string | null;
  status: string;
  upvotes_count: number;
  created_at: string;
  affiliate_name: string;
  affiliate_avatar: string | null;
  has_upvoted: boolean;
  has_favorited: boolean;
}

interface SharedMessagesProps {
  affiliateId: string;
  affiliateName: string;
  affiliateAvatar?: string | null;
  showToast: (type: string, msg: string) => void;
}

const CATEGORIES = [
  { value: 'pas_le_temps', label: 'Je n\'ai pas le temps' },
  { value: 'pas_besoin', label: 'Je n\'en ai pas besoin' },
  { value: 'je_reflechis', label: 'Je reflechis' },
  { value: 'trop_cher', label: 'C\'est trop cher' },
  { value: 'deja_un_outil', label: 'J\'utilise deja un outil' },
  { value: 'pas_organisee', label: 'Je ne suis pas organisee' },
  { value: 'plus_de_clientes', label: 'Je veux plus de clientes' },
  { value: 'galere_reseaux', label: 'Je galere avec les reseaux' },
  { value: 'pas_encore_teste', label: 'Je n\'ai pas encore teste' },
  { value: 'autre', label: 'Autre' },
];

const MESSAGE_TYPES = [
  { value: 'premier_contact', label: 'Premier contact' },
  { value: 'relance', label: 'Relance' },
  { value: 'closing', label: 'Closing' },
];

function getCategoryLabel(value: string) {
  return CATEGORIES.find(c => c.value === value)?.label || value;
}

function getTypeLabel(value: string) {
  return MESSAGE_TYPES.find(t => t.value === value)?.label || value;
}

function getCategoryColor(value: string) {
  const colors: Record<string, string> = {
    pas_le_temps: 'bg-amber-50 text-amber-700 border-amber-200',
    pas_besoin: 'bg-gray-100 text-gray-600 border-gray-200',
    je_reflechis: 'bg-sky-50 text-sky-700 border-sky-200',
    trop_cher: 'bg-red-50 text-red-700 border-red-200',
    deja_un_outil: 'bg-blue-50 text-blue-700 border-blue-200',
    pas_organisee: 'bg-teal-50 text-teal-700 border-teal-200',
    plus_de_clientes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    galere_reseaux: 'bg-rose-50 text-rose-700 border-rose-200',
    pas_encore_teste: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };
  return colors[value] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function getTypeColor(value: string) {
  switch (value) {
    case 'premier_contact': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'relance': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'closing': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

type SortMode = 'recent' | 'popular';

export default function SharedMessages({ affiliateId, affiliateName, affiliateAvatar, showToast }: SharedMessagesProps) {
  const [tips, setTips] = useState<TipMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: 'autre',
    message_type: 'premier_contact',
    message_body: '',
    when_to_use: '',
  });

  const loadTips = useCallback(async () => {
    setLoading(true);
    try {
      const { data: tipsData, error } = await supabase
        .from('affiliate_tips_messages')
        .select('*, affiliates(full_name, avatar_url)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const [upvotesRes, favoritesRes] = await Promise.all([
        supabase.from('affiliate_tips_upvotes').select('tip_id').eq('affiliate_id', affiliateId),
        supabase.from('affiliate_tips_favorites').select('tip_id').eq('affiliate_id', affiliateId),
      ]);

      const myUpvotes = new Set((upvotesRes.data || []).map((u: any) => u.tip_id));
      const myFavorites = new Set((favoritesRes.data || []).map((f: any) => f.tip_id));

      const mapped: TipMessage[] = (tipsData || []).map((t: any) => ({
        id: t.id,
        affiliate_id: t.affiliate_id,
        category: t.category,
        message_type: t.message_type,
        message_body: t.message_body,
        when_to_use: t.when_to_use,
        status: t.status,
        upvotes_count: t.upvotes_count,
        created_at: t.created_at,
        affiliate_name: t.affiliates?.full_name || 'Affilie',
        affiliate_avatar: t.affiliates?.avatar_url || null,
        has_upvoted: myUpvotes.has(t.id),
        has_favorited: myFavorites.has(t.id),
      }));

      setTips(mapped);
    } catch (err) {
      console.error('Load tips error:', err);
    } finally {
      setLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  const handleSave = async () => {
    if (!form.message_body.trim()) {
      showToast('error', 'Le message ne peut pas etre vide');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('affiliate_tips_messages')
        .insert({
          affiliate_id: affiliateId,
          category: form.category,
          message_type: form.message_type,
          message_body: form.message_body.trim(),
          when_to_use: form.when_to_use.trim() || null,
          status: 'approved',
        });
      if (error) throw error;
      showToast('success', 'Message partage avec les autres affilies');
      setShowForm(false);
      setForm({ category: 'autre', message_type: 'premier_contact', message_body: '', when_to_use: '' });
      await loadTips();
    } catch (err: any) {
      showToast('error', err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('affiliate_tips_messages').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Message supprime');
      setTips(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleUpvote = async (tipId: string) => {
    const tip = tips.find(t => t.id === tipId);
    if (!tip) return;

    if (tip.has_upvoted) {
      await supabase.from('affiliate_tips_upvotes').delete().eq('tip_id', tipId).eq('affiliate_id', affiliateId);
      await supabase.from('affiliate_tips_messages').update({ upvotes_count: Math.max(0, tip.upvotes_count - 1) }).eq('id', tipId);
      setTips(prev => prev.map(t => t.id === tipId ? { ...t, has_upvoted: false, upvotes_count: Math.max(0, t.upvotes_count - 1) } : t));
    } else {
      await supabase.from('affiliate_tips_upvotes').insert({ tip_id: tipId, affiliate_id: affiliateId });
      await supabase.from('affiliate_tips_messages').update({ upvotes_count: tip.upvotes_count + 1 }).eq('id', tipId);
      setTips(prev => prev.map(t => t.id === tipId ? { ...t, has_upvoted: true, upvotes_count: t.upvotes_count + 1 } : t));
    }
  };

  const handleFavorite = async (tipId: string) => {
    const tip = tips.find(t => t.id === tipId);
    if (!tip) return;

    if (tip.has_favorited) {
      await supabase.from('affiliate_tips_favorites').delete().eq('tip_id', tipId).eq('affiliate_id', affiliateId);
      setTips(prev => prev.map(t => t.id === tipId ? { ...t, has_favorited: false } : t));
    } else {
      await supabase.from('affiliate_tips_favorites').insert({ tip_id: tipId, affiliate_id: affiliateId });
      setTips(prev => prev.map(t => t.id === tipId ? { ...t, has_favorited: true } : t));
    }
  };

  const filtered = tips
    .filter(t => {
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterType !== 'all' && t.message_type !== filterType) return false;
      if (showFavoritesOnly && !t.has_favorited) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortMode === 'popular') return b.upvotes_count - a.upvotes_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-blue-200 p-4">
        <p className="text-sm text-gray-700">
          Inspire-toi, mais adapte toujours ton message a la personne.
          Les meilleurs resultats viennent des conversations humaines.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
        <FilterSelect value={filterCategory} onChange={setFilterCategory} options={[{ value: 'all', label: 'Toutes objections' }, ...CATEGORIES]} />
        <FilterSelect value={filterType} onChange={setFilterType} options={[{ value: 'all', label: 'Tous types' }, ...MESSAGE_TYPES]} />
        <FilterSelect
          value={sortMode}
          onChange={(v) => setSortMode(v as SortMode)}
          options={[{ value: 'recent', label: 'Plus recents' }, { value: 'popular', label: 'Plus populaires' }]}
        />
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
            showFavoritesOnly ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {showFavoritesOnly ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          Favoris
        </button>
        <div className="sm:ml-auto">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Partager un message
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border-2 border-belaya-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Partager un message efficace</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categorie (objection) *</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-belaya-primary"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                <select
                  value={form.message_type}
                  onChange={e => setForm({ ...form, message_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-belaya-primary"
                >
                  {MESSAGE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
              <textarea
                value={form.message_body}
                onChange={e => setForm({ ...form, message_body: e.target.value })}
                rows={4}
                placeholder="Ecris le message qui a bien fonctionne pour toi..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quand l'utiliser ? (optionnel)</label>
              <input
                value={form.when_to_use}
                onChange={e => setForm({ ...form, when_to_use: e.target.value })}
                placeholder="Ex : quand il reste 1 jour d'essai"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Partager
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {showFavoritesOnly ? 'Aucun favori pour le moment' : 'Aucun message partage pour le moment'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {showFavoritesOnly ? 'Ajoute des messages en favoris pour les retrouver ici' : 'Sois le premier a partager un message qui fonctionne'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(tip => (
            <TipCard
              key={tip.id}
              tip={tip}
              isOwn={tip.affiliate_id === affiliateId}
              copiedId={copiedId}
              onCopy={handleCopy}
              onUpvote={handleUpvote}
              onFavorite={handleFavorite}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 text-center">
        {tips.length} message{tips.length !== 1 ? 's' : ''} partage{tips.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-belaya-primary"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function TipCard({ tip, isOwn, copiedId, onCopy, onUpvote, onFavorite, onDelete }: {
  tip: TipMessage;
  isOwn: boolean;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  onUpvote: (id: string) => void;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isCopied = copiedId === tip.id;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
            {tip.affiliate_avatar ? (
              <img src={tip.affiliate_avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Partage par {tip.affiliate_name}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(tip.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getCategoryColor(tip.category)}`}>
            {getCategoryLabel(tip.category)}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeColor(tip.message_type)}`}>
            {getTypeLabel(tip.message_type)}
          </span>
        </div>
      </div>

      {tip.when_to_use && (
        <div className="mb-2.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-700">
            <span className="font-medium">Quand l'utiliser :</span> {tip.when_to_use}
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-3">
        <p className="text-sm text-gray-700 leading-relaxed italic whitespace-pre-wrap">
          "{tip.message_body}"
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onCopy(tip.id, tip.message_body)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isCopied ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {isCopied ? 'Copie' : 'Copier'}
        </button>
        <button
          onClick={() => onUpvote(tip.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            tip.has_upvoted ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          {tip.upvotes_count > 0 ? tip.upvotes_count : 'Utile'}
        </button>
        <button
          onClick={() => onFavorite(tip.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            tip.has_favorited ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {tip.has_favorited ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          {tip.has_favorited ? 'Sauvegarde' : 'Sauvegarder'}
        </button>
        {isOwn && (
          <button
            onClick={() => onDelete(tip.id)}
            className="ml-auto p-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
}
