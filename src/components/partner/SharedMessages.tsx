import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, X, Save, Loader2, Trash2, ChevronDown, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SharedMessage {
  id: string;
  affiliate_id: string;
  affiliate_name: string;
  content: string;
  category: string;
  created_at: string;
}

interface SharedMessagesProps {
  affiliateId: string;
  affiliateName: string;
  showToast: (type: string, msg: string) => void;
}

const CATEGORIES = [
  { value: 'pas_le_temps', label: 'Pas le temps' },
  { value: 'deja_un_outil', label: 'Utilise deja un outil' },
  { value: 'pas_interesse', label: 'Pas interesse' },
  { value: 'hesitant', label: 'Curieux mais hesitant' },
  { value: 'autre', label: 'Autre' },
];

function getCategoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

function getCategoryColor(value: string) {
  switch (value) {
    case 'pas_le_temps': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'deja_un_outil': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'pas_interesse': return 'bg-red-50 text-red-700 border-red-200';
    case 'hesitant': return 'bg-teal-50 text-teal-700 border-teal-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export default function SharedMessages({ affiliateId, affiliateName, showToast }: SharedMessagesProps) {
  const [messages, setMessages] = useState<SharedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({ content: '', category: 'autre' });

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('affiliate_shared_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setMessages(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSave = async () => {
    if (!form.content.trim()) {
      showToast('error', 'Le message ne peut pas etre vide');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('affiliate_shared_messages')
        .insert({
          affiliate_id: affiliateId,
          affiliate_name: affiliateName,
          content: form.content.trim(),
          category: form.category,
        });
      if (error) throw error;
      showToast('success', 'Message partage avec les autres affilies');
      setShowForm(false);
      setForm({ content: '', category: 'autre' });
      await loadMessages();
    } catch (err: any) {
      showToast('error', err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('affiliate_shared_messages').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Message supprime');
      await loadMessages();
    }
  };

  const filtered = messages.filter(
    (m) => filterCategory === 'all' || m.category === filterCategory
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200 p-5">
        <p className="text-sm text-gray-700">
          Partage les messages qui ont bien fonctionne pour toi. Les autres affilies pourront
          s'en inspirer pour contacter des entrepreneures beaute.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-belaya-primary"
          >
            <option value="all">Toutes les categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Partager un message
        </button>
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
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categorie *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-belaya-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="Ecris le message qui a bien fonctionne pour toi..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
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
          <p className="text-gray-500">Aucun message partage pour le moment</p>
          <p className="text-xs text-gray-400 mt-1">Sois le premier a partager un message qui fonctionne</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((msg) => (
            <div key={msg.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{msg.affiliate_name || 'Affilie'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(msg.category)}`}>
                    {getCategoryLabel(msg.category)}
                  </span>
                  {msg.affiliate_id === affiliateId && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed italic whitespace-pre-wrap">
                  "{msg.content}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 text-center">
        {messages.length} message{messages.length !== 1 ? 's' : ''} partage{messages.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
