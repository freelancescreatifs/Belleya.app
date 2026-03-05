import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Save, AlertTriangle, Clock,
  Instagram, Phone, MapPin, StickyNote, Calendar, ChevronDown, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CRMLead {
  id: string;
  affiliate_id: string;
  name: string;
  city: string;
  instagram: string;
  phone: string;
  status: string;
  first_contact_date: string | null;
  next_follow_up: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface LeadsCRMProps {
  affiliateId: string;
  showToast: (type: string, msg: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'nouveau', label: 'Nouveau lead', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'contacte', label: 'Contacte', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'interesse', label: 'Interesse', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'en_essai', label: 'En essai', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'abonne', label: 'Client abonne', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'pas_interesse', label: 'Pas interesse', color: 'bg-gray-100 text-gray-600 border-gray-200' },
];

function getStatusConfig(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

const EMPTY_FORM = {
  name: '',
  city: '',
  instagram: '',
  phone: '',
  status: 'nouveau',
  first_contact_date: new Date().toISOString().slice(0, 10),
  next_follow_up: '',
  notes: '',
};

export default function LeadsCRM({ affiliateId, showToast }: LeadsCRMProps) {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [igWarning, setIgWarning] = useState('');

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('affiliate_crm_leads')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (!error && data) setLeads(data);
    setLoading(false);
  }, [affiliateId]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const checkInstagramDuplicate = async (ig: string) => {
    if (!ig.trim()) { setIgWarning(''); return; }
    const { count } = await supabase
      .from('affiliate_crm_leads')
      .select('id', { count: 'exact', head: true })
      .eq('instagram', ig.trim())
      .neq('affiliate_id', affiliateId);

    if (count && count > 0) {
      setIgWarning('Ce compte Instagram existe peut-etre deja chez un autre affilie. Tu peux quand meme l\'ajouter, mais evite les doublons.');
    } else {
      setIgWarning('');
    }
  };

  const openNewForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIgWarning('');
    setShowForm(true);
    setSelectedLead(null);
  };

  const openEditForm = (lead: CRMLead) => {
    setForm({
      name: lead.name,
      city: lead.city,
      instagram: lead.instagram,
      phone: lead.phone,
      status: lead.status,
      first_contact_date: lead.first_contact_date || '',
      next_follow_up: lead.next_follow_up || '',
      notes: lead.notes,
    });
    setEditingId(lead.id);
    setIgWarning('');
    setShowForm(true);
    setSelectedLead(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('error', 'Le nom est requis');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('affiliate_crm_leads')
          .update({
            name: form.name.trim(),
            city: form.city.trim(),
            instagram: form.instagram.trim(),
            phone: form.phone.trim(),
            status: form.status,
            first_contact_date: form.first_contact_date || null,
            next_follow_up: form.next_follow_up || null,
            notes: form.notes.trim(),
          })
          .eq('id', editingId);
        if (error) throw error;
        showToast('success', 'Lead mis a jour');
      } else {
        const { error } = await supabase
          .from('affiliate_crm_leads')
          .insert({
            affiliate_id: affiliateId,
            name: form.name.trim(),
            city: form.city.trim(),
            instagram: form.instagram.trim(),
            phone: form.phone.trim(),
            status: form.status,
            first_contact_date: form.first_contact_date || null,
            next_follow_up: form.next_follow_up || null,
            notes: form.notes.trim(),
          });
        if (error) throw error;
        showToast('success', 'Lead ajoute');
      }
      setShowForm(false);
      setEditingId(null);
      await loadLeads();
    } catch (err: any) {
      showToast('error', err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('affiliate_crm_leads').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Lead supprime');
      setSelectedLead(null);
      await loadLeads();
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const todayFollowUps = leads.filter((l) => l.next_follow_up === today);
  const overdueFollowUps = leads.filter((l) => l.next_follow_up && l.next_follow_up < today);

  const filtered = leads.filter((l) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase()) || l.instagram.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(todayFollowUps.length > 0 || overdueFollowUps.length > 0) && (
        <div className="space-y-3">
          {overdueFollowUps.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-red-800 text-sm">{overdueFollowUps.length} relance{overdueFollowUps.length > 1 ? 's' : ''} en retard</h4>
                <p className="text-xs text-red-600 mt-0.5">
                  {overdueFollowUps.map((l) => l.name).join(', ')}
                </p>
              </div>
            </div>
          )}
          {todayFollowUps.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-amber-800 text-sm">{todayFollowUps.length} relance{todayFollowUps.length > 1 ? 's' : ''} aujourd'hui</h4>
                <p className="text-xs text-amber-600 mt-0.5">
                  {todayFollowUps.map((l) => l.name).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-belaya-primary"
            >
              <option value="all">Tous</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Ajouter un lead
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border-2 border-belaya-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {editingId ? 'Modifier le lead' : 'Nouveau lead'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom du prospect"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Paris, Lyon..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Instagram</label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                onBlur={() => checkInstagramDuplicate(form.instagram)}
                placeholder="@compte"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary"
              />
              {igWarning && (
                <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {igWarning}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telephone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="06 XX XX XX XX"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-belaya-primary"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Premier contact</label>
              <input
                type="date"
                value={form.first_contact_date}
                onChange={(e) => setForm({ ...form, first_contact_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prochaine relance</label>
              <input
                type="date"
                value={form.next_follow_up}
                onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Notes libres..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
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
              {editingId ? 'Mettre a jour' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">{selectedLead.name}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => openEditForm(selectedLead)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{selectedLead.city || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Instagram className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{selectedLead.instagram || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{selectedLead.phone || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                Contact: {selectedLead.first_contact_date ? new Date(selectedLead.first_contact_date).toLocaleDateString('fr-FR') : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                Relance: {selectedLead.next_follow_up ? new Date(selectedLead.next_follow_up).toLocaleDateString('fr-FR') : '-'}
              </span>
            </div>
            <div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusConfig(selectedLead.status).color}`}>
                {getStatusConfig(selectedLead.status).label}
              </span>
            </div>
            {selectedLead.notes && (
              <div className="sm:col-span-2 flex items-start gap-2 text-sm">
                <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 whitespace-pre-wrap">{selectedLead.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Plus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun lead pour le moment</p>
          <p className="text-xs text-gray-400 mt-1">Ajoute tes prospects pour suivre tes relances</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Ville</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Instagram</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Relance</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const isOverdue = lead.next_follow_up && lead.next_follow_up < today;
                  const isToday = lead.next_follow_up === today;
                  return (
                    <tr
                      key={lead.id}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${
                        isOverdue ? 'bg-red-50/40' : isToday ? 'bg-amber-50/40' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.city || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.instagram || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusConfig(lead.status).color}`}>
                          {getStatusConfig(lead.status).label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {lead.next_follow_up ? (
                          <span className={`font-medium ${isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-gray-600'}`}>
                            {new Date(lead.next_follow_up).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            {isOverdue && ' (retard)'}
                            {isToday && ' (auj.)'}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditForm(lead)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 text-center">
        {leads.length} lead{leads.length !== 1 ? 's' : ''} au total
      </div>
    </div>
  );
}
