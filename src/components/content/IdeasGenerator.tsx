import { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, Target, Zap, Loader, Plus, Trash2, Star, StarOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { generateContentIdeas } from '../../lib/contentAIGenerator';
import { getProfessionLabel, type ProfessionKey } from '../../lib/professionHelpers';

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  content_type: string;
  platform: string[] | string;
  objective: string;
  notes: string;
  status: string;
  source?: string;
  is_saved?: boolean;
  editorial_pillar?: string;
  publication_date?: string;
  publication_time?: string;
}

interface EditorialPillar {
  id: string;
  pillar_name: string;
  color: string;
}

interface IdeasGeneratorProps {
  onClose: () => void;
  onIdeaSaved: (ideaId: string) => void;
}

export default function IdeasGenerator({ onClose, onIdeaSaved }: IdeasGeneratorProps) {
  const { user } = useAuth();
  const [profession, setProfession] = useState<ProfessionKey | null>(null);
  const [professionLabel, setProfessionLabel] = useState('');
  const [pillars, setPillars] = useState<EditorialPillar[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai' | 'saved'>('manual');
  const [manualIdea, setManualIdea] = useState({
    title: '',
    content_type: 'reel',
    platform: 'instagram',
    objective: 'attirer',
    notes: '',
    editorial_pillar: ''
  });
  const [aiIdea, setAiIdea] = useState({
    title: '',
    content_type: 'reel',
    platform: 'instagram',
    objective: 'attirer',
    editorial_pillar: ''
  });
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);
  const [productionDate, setProductionDate] = useState('');
  const [productionTime, setProductionTime] = useState('09:00');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProfession();
    loadSavedIdeas();
    loadPillars();
  }, [user]);

  async function loadProfession() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('primary_profession')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.primary_profession) {
        setProfession(data.primary_profession as ProfessionKey);
        setProfessionLabel(getProfessionLabel(data.primary_profession as ProfessionKey));
      }
    } catch (error) {
      console.error('Error loading profession:', error);
    }
  }

  async function loadPillars() {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('company_profiles')
        .select('primary_profession')
        .eq('user_id', user.id)
        .maybeSingle();

      const professionType = profileData?.primary_profession || 'nail_artist';

      const { data: pillarsData } = await supabase
        .from('editorial_pillars')
        .select('*')
        .eq('user_id', user.id)
        .eq('profession_type', professionType)
        .eq('is_active', true)
        .order('created_at');

      if (pillarsData) {
        setPillars(pillarsData);
      }
    } catch (error) {
      console.error('Error loading pillars:', error);
    }
  }

  async function loadSavedIdeas() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'script')
        .in('source', ['manual', 'ai'])
        .is('date_script', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedIdeas(data || []);
    } catch (error) {
      console.error('Error loading saved ideas:', error);
    }
  }

  const manualIdeas = savedIdeas.filter(idea => (idea.source === 'manual' || !idea.source) && !idea.is_saved);
  const aiIdeas = savedIdeas.filter(idea => idea.source === 'ai' && !idea.is_saved);
  const starredIdeas = savedIdeas.filter(idea => idea.is_saved === true);

  async function handleCreateManualIdea() {
    if (!user || !manualIdea.title.trim()) {
      alert('Le titre est obligatoire');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const insertData = {
        user_id: user.id,
        company_id: companyData?.id || null,
        title: manualIdea.title.trim(),
        description: '',
        content_type: manualIdea.content_type,
        platform: [manualIdea.platform],
        publication_date: new Date().toISOString().split('T')[0],
        publication_time: '12:00',
        status: 'script' as const,
        source: 'manual' as const,
        objective: manualIdea.objective,
        editorial_pillar: manualIdea.editorial_pillar || null,
        notes: manualIdea.notes || '',
        is_saved: false,
        feed_order: 0,
        image_url: ''
      };

      const { data, error } = await supabase
        .from('content_calendar')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Error creating manual idea:', error);
        setErrorMessage(`Erreur: ${error.message}`);
        alert(`Erreur lors de la création: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after insert');
        setErrorMessage('Aucune donnée retournée');
        alert('Erreur: Aucune donnée retournée');
        return;
      }

      const newIdea = data[0] as SavedIdea;
      setSavedIdeas(prev => [newIdea, ...prev]);

      setManualIdea({
        title: '',
        content_type: 'reel',
        platform: 'instagram',
        objective: 'attirer',
        notes: '',
        editorial_pillar: ''
      });

      alert('Idée créée avec succès !');
    } catch (error: any) {
      console.error('Exception creating manual idea:', error);
      const errorMsg = error?.message || 'Erreur inconnue';
      setErrorMessage(errorMsg);
      alert(`Erreur: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateAI() {
    if (!user) {
      alert('Vous devez être connecté');
      return;
    }

    if (!profession) {
      setErrorMessage('Veuillez d\'abord configurer votre profession dans les paramètres');
      alert('Veuillez d\'abord configurer votre profession dans les paramètres');
      return;
    }

    setGenerating(true);
    setErrorMessage('');

    try {
      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const ideas = generateContentIdeas(
        profession,
        aiIdea.content_type,
        aiIdea.platform,
        aiIdea.objective,
        aiIdea.editorial_pillar,
        aiIdea.title.trim() || undefined
      );

      if (ideas.length === 0) {
        alert('Aucune idée générée. Essayez avec d\'autres paramètres.');
        return;
      }

      const insertData = ideas.map(idea => ({
        user_id: user.id,
        company_id: companyData?.id || null,
        title: idea.title,
        description: idea.description || '',
        content_type: idea.content_type,
        platform: Array.isArray(idea.platform) ? idea.platform : [idea.platform],
        publication_date: new Date().toISOString().split('T')[0],
        publication_time: '12:00',
        status: 'script' as const,
        source: 'ai' as const,
        objective: idea.objective,
        editorial_pillar: aiIdea.editorial_pillar || null,
        notes: `Angle: ${idea.angle}`,
        is_saved: false,
        feed_order: 0,
        image_url: ''
      }));

      const { data, error } = await supabase
        .from('content_calendar')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Error generating AI ideas:', error);
        setErrorMessage(`Erreur: ${error.message}`);
        alert(`Erreur lors de la génération: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after AI insert');
        alert('Erreur: Aucune donnée retournée');
        return;
      }

      const newIdeas = data as SavedIdea[];
      setSavedIdeas(prev => [...newIdeas, ...prev]);

      setActiveTab('ai');

      setAiIdea({
        title: '',
        content_type: 'reel',
        platform: 'instagram',
        objective: 'attirer',
        editorial_pillar: ''
      });

      alert(`${ideas.length} idées générées avec succès !`);
    } catch (error: any) {
      console.error('Exception generating AI ideas:', error);
      const errorMsg = error?.message || 'Erreur inconnue';
      setErrorMessage(errorMsg);
      alert(`Erreur: ${errorMsg}`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleSave(ideaId: string, currentSavedStatus: boolean) {
    try {
      setSavedIdeas(prev => prev.map(idea =>
        idea.id === ideaId ? { ...idea, is_saved: !currentSavedStatus } : idea
      ));

      const { error } = await supabase
        .from('content_calendar')
        .update({ is_saved: !currentSavedStatus })
        .eq('id', ideaId);

      if (error) {
        setSavedIdeas(prev => prev.map(idea =>
          idea.id === ideaId ? { ...idea, is_saved: currentSavedStatus } : idea
        ));
        throw error;
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(ideaId: string) {
    if (!confirm('Supprimer cette idée ?')) return;

    try {
      const deletedIdea = savedIdeas.find(idea => idea.id === ideaId);
      setSavedIdeas(prev => prev.filter(idea => idea.id !== ideaId));

      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', ideaId);

      if (error) {
        if (deletedIdea) {
          setSavedIdeas(prev => [deletedIdea, ...prev]);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function handleToProduce(ideaId: string) {
    const idea = savedIdeas.find(i => i.id === ideaId);
    if (!idea) return;

    setSelectedIdea(idea);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setProductionDate(tomorrow.toISOString().split('T')[0]);
    setShowProductionModal(true);
  }

  async function confirmProduction() {
    if (!user || !selectedIdea) return;

    try {
      const movedIdea = savedIdeas.find(idea => idea.id === selectedIdea.id);
      setSavedIdeas(prev => prev.filter(idea => idea.id !== selectedIdea.id));

      const updateData = {
        status: 'script',
        publication_date: productionDate,
        publication_time: productionTime,
        date_script: productionDate,
        date_script_time: productionTime
      };

      const { error } = await supabase
        .from('content_calendar')
        .update(updateData)
        .eq('id', selectedIdea.id);

      if (error) {
        if (movedIdea) {
          setSavedIdeas(prev => [movedIdea, ...prev]);
        }
        throw error;
      }

      setShowProductionModal(false);
      setSelectedIdea(null);
      alert('Idée ajoutée à la production !');
      onIdeaSaved(selectedIdea.id);
    } catch (error) {
      console.error('Error converting to production:', error);
      alert('Erreur lors de la conversion');
    }
  }

  function getFormatLabel(contentType: string) {
    const formatMap: Record<string, string> = {
      'reel': 'Reel',
      'carrousel': 'Carrousel',
      'story': 'Story',
      'post': 'Post Classique',
      'live': 'Live',
      'video': 'Vidéo'
    };
    return formatMap[contentType] || contentType;
  }

  function getPillarColor(pillarName: string | undefined) {
    if (!pillarName) return 'bg-gray-100 text-gray-700';
    const pillar = pillars.find(p => p.pillar_name === pillarName);
    if (!pillar) return 'bg-gray-100 text-gray-700';
    return `bg-${pillar.color}-100 text-${pillar.color}-700`;
  }

  function renderIdeaCard(idea: SavedIdea, cardColor: string) {
    const isAIGenerated = idea.source === 'ai';

    return (
      <div key={idea.id} className={`p-4 ${cardColor} rounded-xl border`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-2">{idea.title}</h4>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-gray-900 border border-gray-300">
                {getFormatLabel(idea.content_type)}
              </span>
              {(Array.isArray(idea.platform) ? idea.platform : [idea.platform]).map((plat, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200 capitalize">
                  {plat}
                </span>
              ))}
              {idea.objective && (
                <span className="px-2.5 py-1 bg-white rounded-lg text-xs font-medium text-blue-700 border border-blue-200 capitalize">
                  {idea.objective}
                </span>
              )}
              {idea.editorial_pillar && (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getPillarColor(idea.editorial_pillar)}`}>
                  {idea.editorial_pillar}
                </span>
              )}
            </div>
          </div>
        </div>

        {idea.description && (
          <div className="mb-3 p-3 bg-white/70 rounded-lg max-h-64 overflow-y-auto">
            <div className="text-xs text-gray-700 whitespace-pre-line">
              {idea.description}
            </div>
          </div>
        )}

        {idea.notes && idea.source !== 'ai' && (
          <div className="mb-3 p-2 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-700 line-clamp-2">{idea.notes}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleToProduce(idea.id)}
            className="flex-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            À produire
          </button>
          <button
            onClick={() => handleToggleSave(idea.id, idea.is_saved || false)}
            className={`px-3 py-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1.5 ${
              idea.is_saved
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {idea.is_saved ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleDelete(idea.id)}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Boîte à idées</h2>
              <p className="text-sm text-gray-600">Génère et organise tes idées de contenu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="border-b border-gray-200 flex gap-2 px-6 py-3 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Target className="w-5 h-5" />
            Mes idées ({manualIdeas.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-white text-orange-600 shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Idées générées par IA ({aiIdeas.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-white text-yellow-600 shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Star className="w-5 h-5" />
            Idées sauvegardées ({starredIdeas.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-5 bg-white border-2 border-purple-300 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Nouvelle idée</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                    <input
                      type="text"
                      value={manualIdea.title}
                      onChange={(e) => setManualIdea({ ...manualIdea, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: Tutoriel French Manucure"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Format *</label>
                      <select
                        value={manualIdea.content_type}
                        onChange={(e) => setManualIdea({ ...manualIdea, content_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="reel">Reel</option>
                        <option value="carrousel">Carrousel</option>
                        <option value="story">Story</option>
                        <option value="post">Post Classique</option>
                        <option value="live">Live</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plateforme *</label>
                      <select
                        value={manualIdea.platform}
                        onChange={(e) => setManualIdea({ ...manualIdea, platform: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="facebook">Facebook</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Objectif *</label>
                      <select
                        value={manualIdea.objective}
                        onChange={(e) => setManualIdea({ ...manualIdea, objective: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="attirer">Attirer</option>
                        <option value="éduquer">Éduquer</option>
                        <option value="convertir">Convertir</option>
                        <option value="fidéliser">Fidéliser</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pilier éditorial</label>
                      <select
                        value={manualIdea.editorial_pillar}
                        onChange={(e) => setManualIdea({ ...manualIdea, editorial_pillar: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Aucun pilier</option>
                        {pillars.map(pillar => (
                          <option key={pillar.id} value={pillar.pillar_name}>
                            {pillar.pillar_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                    <textarea
                      value={manualIdea.notes}
                      onChange={(e) => setManualIdea({ ...manualIdea, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Décris ton idée, ajoute des détails..."
                    />
                  </div>

                  {errorMessage && activeTab === 'manual' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setManualIdea({
                        title: '',
                        content_type: 'reel',
                        platform: 'instagram',
                        objective: 'attirer',
                        notes: '',
                        editorial_pillar: ''
                      })}
                      disabled={saving}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCreateManualIdea}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        'Créer l\'idée'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {manualIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">Aucune idée</p>
                  <p className="text-gray-400 text-sm">Ajoute tes propres idées manuellement</p>
                </div>
              ) : (
                manualIdeas.map((idea) => renderIdeaCard(idea, 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100'))
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-5 bg-white border-2 border-orange-300 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Générateur d'idées stratégiques</h3>
                <p className="text-sm text-gray-600 mb-4">L'IA va créer 5 idées stratégiques avec hooks, angles et justifications</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thème ou sujet (optionnel)</label>
                    <input
                      type="text"
                      value={aiIdea.title}
                      onChange={(e) => setAiIdea({ ...aiIdea, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: Transformation client, Erreurs courantes, Technique signature..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Laisse vide pour des idées génériques adaptées à tes critères</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Format *</label>
                      <select
                        value={aiIdea.content_type}
                        onChange={(e) => setAiIdea({ ...aiIdea, content_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="reel">Reel</option>
                        <option value="carrousel">Carrousel</option>
                        <option value="story">Story</option>
                        <option value="post">Post Classique</option>
                        <option value="live">Live</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plateforme *</label>
                      <select
                        value={aiIdea.platform}
                        onChange={(e) => setAiIdea({ ...aiIdea, platform: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="facebook">Facebook</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Objectif *</label>
                      <select
                        value={aiIdea.objective}
                        onChange={(e) => setAiIdea({ ...aiIdea, objective: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="attirer">Attirer</option>
                        <option value="éduquer">Éduquer</option>
                        <option value="convertir">Convertir</option>
                        <option value="fidéliser">Fidéliser</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pilier éditorial</label>
                      <select
                        value={aiIdea.editorial_pillar}
                        onChange={(e) => setAiIdea({ ...aiIdea, editorial_pillar: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Aucun pilier</option>
                        {pillars.map(pillar => (
                          <option key={pillar.id} value={pillar.pillar_name}>
                            {pillar.pillar_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {errorMessage && activeTab === 'ai' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateAI}
                    disabled={generating}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Génération de 5 idées stratégiques...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Générer 5 idées stratégiques
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">Aucune idée générée par IA</p>
                  <p className="text-gray-400 text-sm">Utilise le formulaire ci-dessus pour générer des idées</p>
                </div>
              ) : (
                aiIdeas.map((idea) => renderIdeaCard(idea, 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100'))
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-4">
              {starredIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">Aucune idée sauvegardée</p>
                  <p className="text-gray-400 text-sm">Sauvegarde tes idées favorites depuis les autres onglets</p>
                </div>
              ) : (
                starredIdeas.map((idea) => renderIdeaCard(idea, 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'))
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {showProductionModal && selectedIdea && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Planifier la production</h3>
          <p className="text-sm text-gray-600 mb-6">
            Choisis la date et l'heure pour commencer la production de : <span className="font-semibold">{selectedIdea.title}</span>
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de production *</label>
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heure de production *</label>
              <input
                type="time"
                value={productionTime}
                onChange={(e) => setProductionTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowProductionModal(false);
                setSelectedIdea(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={confirmProduction}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
