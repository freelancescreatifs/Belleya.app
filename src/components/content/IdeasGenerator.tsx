import { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, Target, Loader, Trash2, Star, StarOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { type ProfessionKey } from '../../lib/professionHelpers';

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
  target_audience?: string;
  awareness_level?: string;
}

interface EditorialPillar {
  id: string;
  pillar_name: string;
  color: string;
}

interface TargetAudience {
  id: string;
  audience_name: string;
  description?: string;
  keywords: string[];
}

interface IdeasGeneratorProps {
  onClose: () => void;
  onIdeaSaved: (ideaId: string) => void;
}

function mapContentTypeToDbValue(formValue: string): string {
  const mapping: { [key: string]: string } = {
    'reel': 'video',
    'carrousel': 'carousel',
    'story': 'story',
    'post': 'post',
    'live': 'video',
    'video': 'video',
    'carousel': 'carousel'
  };
  return mapping[formValue] || 'video';
}

async function callContentAI(
  mode: 'ideas' | 'produce',
  params: {
    title?: string;
    content_type: string;
    platform: string;
    objective: string;
    editorial_pillar?: string;
    profession: string;
    target_audience?: string;
    awareness_level?: string;
  }
) {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content-script`;
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('Session expirée, veuillez vous reconnecter.');
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ mode, ...params }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        errorMsg = err.error || err.details || errorMsg;
      } catch {
        const text = await response.text();
        if (text) errorMsg = text.substring(0, 200);
      }
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erreur de connexion avec le serveur AI');
  }
}

export default function IdeasGenerator({ onClose, onIdeaSaved }: IdeasGeneratorProps) {
  const { user } = useAuth();
  const [profession, setProfession] = useState<ProfessionKey | null>(null);
  const [pillars, setPillars] = useState<EditorialPillar[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [producing, setProducing] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai' | 'saved'>('manual');
  const [manualIdea, setManualIdea] = useState({
    title: '',
    content_type: 'video',
    platform: 'instagram',
    objective: 'attirer',
    notes: '',
    editorial_pillar: ''
  });
  const [aiIdea, setAiIdea] = useState({
    title: '',
    content_type: 'video',
    platform: 'instagram',
    objective: 'attirer',
    editorial_pillar: '',
    target_audience_id: '',
    awareness_level: 'conscient_probleme'
  });
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);
  const [productionDate, setProductionDate] = useState('');
  const [productionTime, setProductionTime] = useState('09:00');
  const [errorMessage, setErrorMessage] = useState('');
  const [showNewAudienceModal, setShowNewAudienceModal] = useState(false);
  const [newAudience, setNewAudience] = useState({ audience_name: '', keywords: '' });

  useEffect(() => {
    loadProfession();
    loadSavedIdeas();
    loadPillars();
    loadTargetAudiences();
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

  async function loadTargetAudiences() {
    if (!user) return;

    try {
      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!companyData?.id) return;

      const { data: audiencesData } = await supabase
        .from('target_audiences')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at');

      if (audiencesData) {
        setTargetAudiences(audiencesData);
      }
    } catch (error) {
      console.error('Error loading target audiences:', error);
    }
  }

  async function loadSavedIdeas() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'saved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedIdeas(data || []);
    } catch (error) {
      console.error('Error loading saved ideas:', error);
    }
  }

  async function handleRemoveFromIdeas(ideaId: string) {
    try {
      setSavedIdeas(prev => prev.filter(idea => idea.id !== ideaId));

      const { error } = await supabase
        .from('content_ideas')
        .delete()
        .eq('id', ideaId);

      if (error) {
        await loadSavedIdeas();
        throw error;
      }
    } catch (error) {
      console.error('Error removing from ideas:', error);
      await loadSavedIdeas();
    }
  }

  const manualIdeas = savedIdeas.filter(idea => (idea.source === 'manual' || !idea.source) && !idea.is_saved);
  const aiIdeas = savedIdeas.filter(idea => idea.source === 'ai' && !idea.is_saved);
  const starredIdeas = savedIdeas.filter(idea => idea.is_saved === true);

  async function handleCreateTargetAudience() {
    if (!user || !newAudience.audience_name.trim()) {
      alert('Le nom du profil cible est obligatoire');
      return;
    }

    try {
      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!companyData?.id) {
        alert('Impossible de trouver votre entreprise');
        return;
      }

      const keywordsArray = newAudience.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k);

      const { data, error } = await supabase
        .from('target_audiences')
        .insert({
          company_id: companyData.id,
          audience_name: newAudience.audience_name.trim(),
          keywords: keywordsArray
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTargetAudiences(prev => [...prev, data]);
        setAiIdea({ ...aiIdea, target_audience_id: data.id });
        setNewAudience({ audience_name: '', keywords: '' });
        setShowNewAudienceModal(false);
        alert('Profil cible créé avec succès!');
      }
    } catch (error) {
      console.error('Error creating target audience:', error);
      alert('Erreur lors de la création du profil cible');
    }
  }

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
        publication_date: null,
        publication_time: null,
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
        alert(`Erreur lors de la creation: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after insert');
        setErrorMessage('Aucune donnee retournee');
        alert('Erreur: Aucune donnee retournee');
        return;
      }

      const newIdea = data[0] as SavedIdea;
      setSavedIdeas(prev => [newIdea, ...prev]);

      setManualIdea({
        title: '',
        content_type: 'video',
        platform: 'instagram',
        objective: 'attirer',
        notes: '',
        editorial_pillar: ''
      });

      alert('Idee creee avec succes !');
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
      alert('Vous devez etre connecte');
      return;
    }

    if (!profession) {
      setErrorMessage('Veuillez d\'abord configurer votre profession dans les parametres');
      alert('Veuillez d\'abord configurer votre profession dans les parametres');
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

      const selectedAudience = targetAudiences.find(a => a.id === aiIdea.target_audience_id);
      const audienceLabel = selectedAudience?.audience_name || undefined;

      const aiResponse = await callContentAI('ideas', {
        title: aiIdea.title.trim() || undefined,
        content_type: aiIdea.content_type,
        platform: aiIdea.platform,
        objective: aiIdea.objective,
        editorial_pillar: aiIdea.editorial_pillar || undefined,
        target_audience: audienceLabel,
        awareness_level: aiIdea.awareness_level,
        profession: profession,
      });

      const ideas = Array.isArray(aiResponse) ? aiResponse : [];

      if (ideas.length === 0) {
        alert('Aucune idee generee. Essayez avec d\'autres parametres.');
        return;
      }

      const insertData = ideas.map((idea: any) => ({
        user_id: user.id,
        company_id: companyData?.id || null,
        title: idea.title || 'Idee sans titre',
        hooks_alternatives: idea.hooks_alternatives || [],
        psychological_triggers: idea.psychological_triggers || [],
        content_angle: idea.content_angle || '',
        retention_structure: idea.retention_structure || [],
        conversion_version: idea.conversion_version || '',
        visual_alignment: idea.visual_alignment || [],
        story_ideas: idea.story_ideas || [],
        pro_tip: idea.pro_tip || '',
        content_type: mapContentTypeToDbValue(aiIdea.content_type),
        platform: [aiIdea.platform],
        objective: aiIdea.objective,
        editorial_pillar: aiIdea.editorial_pillar || null,
        target_audience: aiIdea.target_audience_id || null,
        awareness_level: aiIdea.awareness_level || null,
        status: 'saved' as const
      }));

      const { data, error } = await supabase
        .from('content_ideas')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Error generating AI ideas:', error);
        setErrorMessage(`Erreur: ${error.message}`);
        alert(`Erreur lors de la generation: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No data returned after AI insert');
        alert('Erreur: Aucune donnee retournee');
        return;
      }

      const newIdeas = data as SavedIdea[];
      setSavedIdeas(prev => [...newIdeas, ...prev]);

      setActiveTab('ai');

      setAiIdea({
        title: '',
        content_type: 'video',
        platform: 'instagram',
        objective: 'attirer',
        editorial_pillar: '',
        target_audience_id: '',
        awareness_level: 'conscient_probleme'
      });

      alert(`${ideas.length} idees generees avec succes !`);
    } catch (error: any) {
      console.error('Exception generating AI ideas:', error);
      const errorMsg = error?.message || 'Erreur inconnue';
      setErrorMessage(errorMsg);
      alert(`Erreur: ${errorMsg}`);
    } finally {
      setGenerating(false);
    }
  }

  async function confirmProduction() {
    if (!user || !selectedIdea || producing) return;

    setProducing(true);

    try {
      let generatedScript = '';
      if (profession) {
        try {
          const platforms = Array.isArray(selectedIdea.platform)
            ? selectedIdea.platform[0]
            : selectedIdea.platform;

          const scriptResult = await callContentAI('produce', {
            title: selectedIdea.title,
            content_type: selectedIdea.content_type,
            platform: platforms || 'instagram',
            objective: selectedIdea.objective || 'attirer',
            editorial_pillar: selectedIdea.editorial_pillar || undefined,
            profession: profession,
          });

          generatedScript = scriptResult?.script || '';
        } catch (aiError) {
          console.error('AI script generation failed, proceeding without script:', aiError);
        }
      }

      const updateData: Record<string, any> = {
        status: 'script',
        publication_date: productionDate,
        publication_time: productionTime,
        date_script: productionDate,
        date_script_time: productionTime,
      };

      if (generatedScript) {
        updateData.description = generatedScript;
      }

      const { error } = await supabase
        .from('content_calendar')
        .update(updateData)
        .eq('id', selectedIdea.id);

      if (error) throw error;

      setSavedIdeas(prev => prev.filter(idea => idea.id !== selectedIdea.id));

      setShowProductionModal(false);
      setSelectedIdea(null);
      alert('Idee ajoutee a la production !');
      onIdeaSaved(selectedIdea.id);
    } catch (error) {
      console.error('Error converting to production:', error);
      alert('Erreur lors de la conversion');
      await loadSavedIdeas();
    } finally {
      setProducing(false);
    }
  }

  function getFormatLabel(contentType: string) {
    const formatMap: Record<string, string> = {
      'reel': 'Reel',
      'carrousel': 'Carrousel',
      'story': 'Story',
      'post': 'Post Classique',
      'live': 'Live',
      'video': 'Video'
    };
    return formatMap[contentType] || contentType;
  }

  function getPillarColor(pillarName: string | undefined) {
    if (!pillarName) return 'bg-gray-100 text-gray-700';
    const pillar = pillars.find(p => p.pillar_name === pillarName);
    if (!pillar) return 'bg-gray-100 text-gray-700';
    return `bg-${pillar.color}-100 text-${pillar.color}-700`;
  }

  async function handleToProduce(ideaId: string) {
    try {
      const idea = savedIdeas.find(i => i.id === ideaId);
      if (!idea) return;

      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const insertData = {
        user_id: user.id,
        company_id: companyData?.id || null,
        title: idea.title,
        description: '',
        content_type: idea.content_type,
        platform: Array.isArray(idea.platform) ? idea.platform : [idea.platform],
        publication_date: null,
        publication_time: null,
        status: 'script' as const,
        objective: idea.objective || null,
        editorial_pillar: idea.editorial_pillar || null,
        target_audience: idea.target_audience || null,
        awareness_level: idea.awareness_level || null,
        notes: '',
        is_saved: false,
        feed_order: 0,
        image_url: ''
      };

      const { error } = await supabase
        .from('content_calendar')
        .insert([insertData]);

      if (error) throw error;

      setSavedIdeas(prev => prev.filter(i => i.id !== ideaId));
      alert('Idée ajoutée au calendrier !');
    } catch (error) {
      console.error('Error moving idea to production:', error);
      alert('Erreur lors du déplacement de l\'idée');
    }
  }

  async function handleToggleSave(ideaId: string, isSaved: boolean) {
    try {
      const { error } = await supabase
        .from('content_ideas')
        .update({ status: isSaved ? 'saved' : 'saved' })
        .eq('id', ideaId)
        .eq('user_id', user.id);

      if (error) throw error;
      loadSavedIdeas();
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  }

  async function handleDelete(ideaId: string) {
    if (confirm('Supprimer cette idée ?')) {
      await handleRemoveFromIdeas(ideaId);
    }
  }

  function renderIdeaCard(idea: SavedIdea, cardColor: string) {
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
          <div className="mb-3 p-3 bg-white/70 rounded-lg max-h-[500px] overflow-y-auto">
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
            className="flex-1 px-3 py-1.5 bg-gradient-to-r from-belaya-bright to-belaya-bright text-white rounded-lg hover:from-belaya-deep hover:to-belaya-deep transition-all text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            A produire
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
              <h2 className="text-2xl font-bold text-gray-900">Boite a idees</h2>
              <p className="text-sm text-gray-600">Genere et organise tes idees de contenu</p>
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
                ? 'bg-white text-orange-600 shadow-md'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Target className="w-5 h-5" />
            Mes idees ({manualIdeas.length})
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
            Idees generees par IA ({aiIdeas.length})
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
            Idees sauvegardees ({starredIdeas.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-5 bg-white border-2 border-orange-300 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Nouvelle idee</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                    <input
                      type="text"
                      value={manualIdea.title}
                      onChange={(e) => setManualIdea({ ...manualIdea, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: Tutoriel French Manucure"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Format *</label>
                      <select
                        value={manualIdea.content_type}
                        onChange={(e) => setManualIdea({ ...manualIdea, content_type: e.target.value })}
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
                        value={manualIdea.platform}
                        onChange={(e) => setManualIdea({ ...manualIdea, platform: e.target.value })}
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
                        value={manualIdea.objective}
                        onChange={(e) => setManualIdea({ ...manualIdea, objective: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="attirer">Attirer</option>
                        <option value="éduquer">Éduquer</option>
                        <option value="convertir">Convertir</option>
                        <option value="fidéliser">Fidéliser</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pilier editorial</label>
                      <select
                        value={manualIdea.editorial_pillar}
                        onChange={(e) => setManualIdea({ ...manualIdea, editorial_pillar: e.target.value })}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                    <textarea
                      value={manualIdea.notes}
                      onChange={(e) => setManualIdea({ ...manualIdea, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder="Decris ton idee, ajoute des details..."
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
                        content_type: 'video',
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
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Creation...
                        </>
                      ) : (
                        'Creer l\'idee'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {manualIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">Aucune idee</p>
                  <p className="text-gray-400 text-sm">Ajoute tes propres idees manuellement</p>
                </div>
              ) : (
                manualIdeas.map((idea) => renderIdeaCard(idea, 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100'))
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-5 bg-white border-2 border-orange-300 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Generateur d'idees strategiques</h3>
                <p className="text-sm text-gray-600 mb-4">L'IA va creer 5 idees strategiques avec hooks, angles et justifications</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme ou sujet (optionnel)</label>
                    <input
                      type="text"
                      value={aiIdea.title}
                      onChange={(e) => setAiIdea({ ...aiIdea, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: Transformation client, Erreurs courantes, Technique signature..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Laisse vide pour des idees adaptees a tes criteres</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Format *</label>
                      <select
                        value={aiIdea.content_type}
                        onChange={(e) => setAiIdea({ ...aiIdea, content_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="video">Reel / Video</option>
                        <option value="carousel">Carrousel</option>
                        <option value="story">Story</option>
                        <option value="post">Post Classique</option>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pilier editorial</label>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profil cible</label>
                      <div className="flex gap-2">
                        <select
                          value={aiIdea.target_audience_id}
                          onChange={(e) => setAiIdea({ ...aiIdea, target_audience_id: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Aucun profil</option>
                          {targetAudiences.map(audience => (
                            <option key={audience.id} value={audience.id}>
                              {audience.audience_name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowNewAudienceModal(true)}
                          className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors font-medium"
                          title="Créer un nouveau profil cible"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Conscience du prospect *</label>
                      <select
                        value={aiIdea.awareness_level || 'conscient_probleme'}
                        onChange={(e) => setAiIdea({ ...aiIdea, awareness_level: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="probleme_inconscient">Problème inconscient</option>
                        <option value="conscient_probleme">Conscient du problème</option>
                        <option value="conscient_solution">Conscient de la solution</option>
                        <option value="conscient_produit">Conscient du produit</option>
                        <option value="pret_acheter">Prêt à acheter</option>
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
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Génération en cours... Cela peut prendre quelques secondes</span>
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

              {generating ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">Génération des idées en cours...</p>
                  <p className="text-gray-400 text-sm">Cela peut prendre 10-15 secondes</p>
                </div>
              ) : aiIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">Aucune idee generee par IA</p>
                  <p className="text-gray-400 text-sm">Utilise le formulaire ci-dessus pour generer des idees</p>
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
                  <p className="text-gray-500 text-lg font-medium mb-2">Aucune idee sauvegardee</p>
                  <p className="text-gray-400 text-sm">Sauvegarde tes idees favorites depuis les autres onglets</p>
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

          {producing && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-orange-600" />
              <p className="text-sm text-orange-700">Generation du script IA en cours...</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de production *</label>
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={producing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heure de production *</label>
              <input
                type="time"
                value={productionTime}
                onChange={(e) => setProductionTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={producing}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!producing) {
                  setShowProductionModal(false);
                  setSelectedIdea(null);
                }
              }}
              disabled={producing}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={confirmProduction}
              disabled={producing}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-belaya-bright to-belaya-bright text-white rounded-lg hover:from-belaya-deep hover:to-belaya-deep transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {producing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Production...
                </>
              ) : (
                'Confirmer'
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {showNewAudienceModal && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Créer un profil cible</h3>
          <p className="text-sm text-gray-600 mb-6">
            Définis un nouveau profil cible que tu pourras réutiliser dans tes générations
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du profil *</label>
              <input
                type="text"
                value={newAudience.audience_name}
                onChange={(e) => setNewAudience({ ...newAudience, audience_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ex: Freelances débutants, PME beauté..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mots-clés (optionnel)</label>
              <input
                type="text"
                value={newAudience.keywords}
                onChange={(e) => setNewAudience({ ...newAudience, keywords: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ex: Premium, Économe, Créatif (séparés par des virgules)"
              />
              <p className="text-xs text-gray-500 mt-1">Ajoute des mots-clés pour affiner la description</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowNewAudienceModal(false);
                setNewAudience({ audience_name: '', keywords: '' });
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateTargetAudience}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all font-medium"
            >
              Créer
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
