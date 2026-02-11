import { useState, useEffect } from 'react';
import { Save, Calendar, Clock, Image as ImageIcon, Upload, Sparkles, Info, Link as LinkIcon, Trash2, Wand2, FileText, Video, Scissors, CheckCircle, Send, FileEdit, AlertTriangle, Plus, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { generateContentAI } from '../../lib/contentAIGenerator';
import MediaUploader from './MediaUploader';
import { MediaFile, uploadMultipleMedia, getMediaType, urlsToMediaFiles } from '../../lib/mediaHelpers';
import InfoTooltip from '../shared/InfoTooltip';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  platform: string[] | string;
  publication_date: string;
  publication_time?: string;
  status: 'idea' | 'script' | 'shooting' | 'editing' | 'scheduled' | 'published';
  image_url?: string;
  caption?: string;
  content_structure?: string;
  media_urls?: string[];
  media_type?: string;
  editorial_pillar?: string;
  objective?: string;
  link?: string;
  reel_url?: string;
  notes?: string;
  date_script?: string;
  date_script_time?: string;
  date_script_end_time?: string;
  date_shooting?: string;
  date_shooting_time?: string;
  date_shooting_end_time?: string;
  date_editing?: string;
  date_editing_time?: string;
  date_editing_end_time?: string;
  date_scheduling?: string;
  date_scheduling_time?: string;
  date_scheduling_end_time?: string;
  production_auto_plan?: boolean;
  production_start_date?: string;
}

interface EditorialPillar {
  id: string;
  pillar_name: string;
  color: string;
}

interface ContentFormProps {
  mode: 'create' | 'edit';
  contentId?: string;
  prefillData?: Partial<ContentItem>;
  onSuccess: () => void;
  onCancel: () => void;
}

const CONTENT_TYPES = [
  { value: 'post', label: 'Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'carrousel', label: 'Carrousel' },
  { value: 'story', label: 'Story' },
  { value: 'video', label: 'Vidéo' },
  { value: 'live', label: 'Live' },
];

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
];

const STATUSES = [
  { value: 'idea', label: 'Idée' },
  { value: 'script', label: 'Script' },
  { value: 'shooting', label: 'Tournage' },
  { value: 'editing', label: 'Montage' },
  { value: 'scheduled', label: 'Programmé' },
  { value: 'published', label: 'Publié' },
];

const OBJECTIVES = [
  { value: 'attirer', label: 'Attirer' },
  { value: 'éduquer', label: 'Éduquer' },
  { value: 'convertir', label: 'Convertir' },
  { value: 'fidéliser', label: 'Fidéliser' },
];

const PRESET_COLORS = [
  '#EC4899', // Pink
  '#F59E0B', // Orange
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Deep Orange
  '#06B6D4', // Cyan
  '#A855F7', // Deep Purple
];

export default function ContentForm({
  mode,
  contentId,
  prefillData,
  onSuccess,
  onCancel
}: ContentFormProps) {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    title: prefillData?.title || '',
    description: prefillData?.description || '',
    content_type: prefillData?.content_type || 'post',
    platform: prefillData?.platform || 'instagram',
    status: prefillData?.status || 'idea',
    publication_date: prefillData?.publication_date || new Date().toISOString().split('T')[0],
    publication_time: prefillData?.publication_time || '12:00',
    editorial_pillar: prefillData?.editorial_pillar || '',
    objective: prefillData?.objective || '',
    caption: prefillData?.caption || '',
    content_structure: prefillData?.content_structure || '',
    link: prefillData?.link || '',
    reel_url: prefillData?.reel_url || '',
    notes: prefillData?.notes || '',
    date_script: prefillData?.date_script || '',
    date_script_time: prefillData?.date_script_time || '09:00',
    date_script_end_time: prefillData?.date_script_end_time || '10:00',
    date_shooting: prefillData?.date_shooting || '',
    date_shooting_time: prefillData?.date_shooting_time || '09:00',
    date_shooting_end_time: prefillData?.date_shooting_end_time || '10:00',
    date_editing: prefillData?.date_editing || '',
    date_editing_time: prefillData?.date_editing_time || '09:00',
    date_editing_end_time: prefillData?.date_editing_end_time || '10:00',
    date_scheduling: prefillData?.date_scheduling || '',
    date_scheduling_time: prefillData?.date_scheduling_time || '09:00',
    date_scheduling_end_time: prefillData?.date_scheduling_end_time || '10:00',
    production_start_date: prefillData?.production_start_date || '',
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(() => {
    const platformData = prefillData?.platform;
    if (Array.isArray(platformData)) {
      return platformData;
    }
    if (typeof platformData === 'string') {
      return platformData.includes(',') ? platformData.split(',') : [platformData];
    }
    return ['instagram'];
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [pillars, setPillars] = useState<EditorialPillar[]>([]);
  const [professionType, setProfessionType] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [showProductionDates, setShowProductionDates] = useState(false);
  const [showAddPillar, setShowAddPillar] = useState(false);
  const [newPillarName, setNewPillarName] = useState('');
  const [newPillarColor, setNewPillarColor] = useState('#EC4899');
  const [productionDefaults, setProductionDefaults] = useState({
    script_delay: 5,
    shooting_delay: 4,
    editing_delay: 2,
    scheduling_delay: 1,
  });

  useEffect(() => {
    if (user) {
      loadProfessionAndPillars();
      loadProductionDefaults();
    }
  }, [user]);

  useEffect(() => {
    if (mode === 'edit' && contentId && user) {
      loadContent();
    }
  }, [mode, contentId, user]);

  async function loadProfessionAndPillars() {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('company_profiles')
        .select('primary_profession')
        .eq('user_id', user.id)
        .maybeSingle();

      const profession = profileData?.primary_profession || 'nail_artist';
      setProfessionType(profession);

      const { data: pillarsData } = await supabase
        .from('editorial_pillars')
        .select('*')
        .eq('user_id', user.id)
        .eq('profession_type', profession)
        .eq('is_active', true)
        .order('created_at');

      if (pillarsData) {
        setPillars(pillarsData);
      }
    } catch (error) {
      console.error('Error loading profession and pillars:', error);
    }
  }

  async function loadProductionDefaults() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('production_defaults')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProductionDefaults({
          script_delay: data.script_delay ?? 5,
          shooting_delay: data.shooting_delay ?? 4,
          editing_delay: data.editing_delay ?? 2,
          scheduling_delay: data.scheduling_delay ?? 1,
        });
      }
    } catch (error) {
      console.error('Error loading production defaults:', error);
    }
  }

  async function handleAddPillar() {
    if (!user || !newPillarName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('editorial_pillars')
        .insert([{
          user_id: user.id,
          profession_type: professionType,
          pillar_name: newPillarName.trim(),
          color: newPillarColor,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      await loadProfessionAndPillars();
      setFormData({ ...formData, editorial_pillar: newPillarName.trim() });
      setNewPillarName('');
      setNewPillarColor(PRESET_COLORS[0]);
      setShowAddPillar(false);
    } catch (error) {
      console.error('Error adding pillar:', error);
      alert('Erreur lors de l\'ajout du pilier');
    }
  }

  async function handleDeletePillar(pillarId: string, pillarName: string) {
    if (!confirm(`Supprimer le pilier "${pillarName}" ?`)) return;

    try {
      const { error } = await supabase
        .from('editorial_pillars')
        .update({ is_active: false })
        .eq('id', pillarId);

      if (error) throw error;

      if (formData.editorial_pillar === pillarName) {
        setFormData({ ...formData, editorial_pillar: '' });
      }

      await loadProfessionAndPillars();
    } catch (error) {
      console.error('Error deleting pillar:', error);
      alert('Erreur lors de la suppression du pilier');
    }
  }

  async function loadContent() {
    if (!contentId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('id', contentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          content_type: data.content_type || 'post',
          platform: data.platform || 'instagram',
          status: data.status || 'script',
          publication_date: data.publication_date || new Date().toISOString().split('T')[0],
          publication_time: data.publication_time || '12:00',
          editorial_pillar: data.editorial_pillar || '',
          objective: data.objective || '',
          caption: data.caption || '',
          content_structure: data.content_structure || '',
          link: data.link || '',
          reel_url: data.reel_url || '',
          notes: data.notes || '',
          date_script: data.date_script || '',
          date_script_time: data.date_script_time || '09:00',
          date_script_end_time: data.date_script_end_time || '10:00',
          date_shooting: data.date_shooting || '',
          date_shooting_time: data.date_shooting_time || '09:00',
          date_shooting_end_time: data.date_shooting_end_time || '10:00',
          date_editing: data.date_editing || '',
          date_editing_time: data.date_editing_time || '09:00',
          date_editing_end_time: data.date_editing_end_time || '10:00',
          date_scheduling: data.date_scheduling || '',
          date_scheduling_time: data.date_scheduling_time || '09:00',
          date_scheduling_end_time: data.date_scheduling_end_time || '10:00',
          production_start_date: data.production_start_date || '',
        });

        const platformData = data.platform;
        if (Array.isArray(platformData)) {
          setSelectedPlatforms(platformData);
        } else if (typeof platformData === 'string') {
          setSelectedPlatforms(platformData.includes(',') ? platformData.split(',') : [platformData]);
        } else {
          setSelectedPlatforms(['instagram']);
        }

        if (data.date_script || data.date_shooting || data.date_editing || data.date_scheduling) {
          setShowProductionDates(true);
        }

        if (data.media_urls) {
          const urls = typeof data.media_urls === 'string'
            ? JSON.parse(data.media_urls)
            : data.media_urls;
          const existingMediaFiles = await urlsToMediaFiles(urls);
          setMediaFiles(existingMediaFiles);
        }
      }
    } catch (error) {
      console.error('Error loading content:', error);
      alert('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAI() {
    if (!formData.title) {
      alert('Veuillez d\'abord saisir un titre');
      return;
    }

    setGeneratingCaption(true);
    try {
      const primaryPlatform = (selectedPlatforms[0] || 'instagram') as 'instagram' | 'tiktok' | 'linkedin' | 'facebook' | 'youtube' | 'twitter';
      const contentType = formData.content_type as 'post' | 'reel' | 'carrousel' | 'story' | 'video' | 'live';

      const generated = generateContentAI({
        title: formData.title,
        contentType: contentType,
        platform: primaryPlatform,
        description: formData.description,
        objective: formData.objective as any,
        pillar: formData.editorial_pillar || undefined,
        profession: professionType || undefined
      });

      let finalCaption = generated.caption;

      if (formData.editorial_pillar) {
        finalCaption = `${finalCaption}\n\n#${formData.editorial_pillar}`;
      }

      if (formData.objective) {
        const objectiveEmojis: Record<string, string> = {
          'attirer': '🎯',
          'éduquer': '📚',
          'convertir': '🎁',
          'fidéliser': '❤️',
        };
        const emoji = objectiveEmojis[formData.objective] || '';
        if (emoji) {
          finalCaption = `${emoji} ${finalCaption}`;
        }
      }

      setFormData({
        ...formData,
        caption: finalCaption,
        description: generated.script || formData.description
      });

      alert('Contenu généré avec succès ! Script et légende sont prêts.');
    } catch (error) {
      console.error('Error generating AI content:', error);
      alert('Erreur lors de la génération du contenu');
    } finally {
      setGeneratingCaption(false);
    }
  }

  function handleAutoPlanning() {
    const publicationDate = formData.publication_date;

    if (!publicationDate) {
      alert('Veuillez d\'abord définir une date de publication');
      return;
    }

    const subtractDays = (dateStr: string, days: number) => {
      const date = new Date(dateStr);
      date.setDate(date.getDate() - days);
      return date.toISOString().split('T')[0];
    };

    const relevantSteps = getProductionSteps();
    const updatedData: any = {
      ...formData,
    };

    relevantSteps.forEach(step => {
      const delayKey = step.key.replace('date_', '') + '_delay';
      const delay = productionDefaults[delayKey as keyof typeof productionDefaults] || 0;
      updatedData[step.key] = subtractDays(publicationDate, delay);
    });

    setFormData(updatedData);
    setShowProductionDates(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (selectedPlatforms.length === 0) {
      alert('Veuillez sélectionner au moins une plateforme');
      return;
    }

    setSaving(true);
    try {
      let mediaUrls: string[] = [];
      let mediaType = '';

      if (mediaFiles.length > 0) {
        const existingUrls: string[] = [];
        const filesToUpload: File[] = [];

        for (const mediaFile of mediaFiles) {
          if (mediaFile.preview.startsWith('blob:')) {
            filesToUpload.push(mediaFile.file);
          } else {
            existingUrls.push(mediaFile.preview);
          }
        }

        if (filesToUpload.length > 0) {
          const uploadedUrls = await uploadMultipleMedia(user.id, filesToUpload);
          mediaUrls = [...existingUrls, ...uploadedUrls];
        } else {
          mediaUrls = existingUrls;
        }

        mediaType = getMediaType(mediaFiles);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const publicationDate = new Date(formData.publication_date);
      publicationDate.setHours(0, 0, 0, 0);

      let finalStatus = formData.status;
      if (mode === 'create' && formData.status === 'idea') {
        if (publicationDate > today) {
          finalStatus = 'scheduled';
        } else if (publicationDate.getTime() === today.getTime()) {
          finalStatus = 'scheduled';
        } else {
          finalStatus = 'published';
        }
      }

      const dataToSave = {
        title: formData.title,
        description: formData.description,
        content_type: formData.content_type,
        platform: selectedPlatforms,
        status: finalStatus,
        publication_date: formData.publication_date,
        publication_time: formData.publication_time || null,
        editorial_pillar: formData.editorial_pillar || null,
        objective: formData.objective || null,
        caption: formData.caption || null,
        content_structure: formData.content_structure || null,
        link: formData.link || null,
        reel_url: formData.reel_url || null,
        notes: formData.notes || null,
        image_url: mediaUrls[0] || null,
        media_urls: mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
        media_type: mediaType || null,
        date_script: formData.date_script || null,
        date_script_time: formData.date_script_time || null,
        date_script_end_time: formData.date_script_end_time || null,
        date_shooting: formData.date_shooting || null,
        date_shooting_time: formData.date_shooting_time || null,
        date_shooting_end_time: formData.date_shooting_end_time || null,
        date_editing: formData.date_editing || null,
        date_editing_time: formData.date_editing_time || null,
        date_editing_end_time: formData.date_editing_end_time || null,
        date_scheduling: formData.date_scheduling || null,
        date_scheduling_time: formData.date_scheduling_time || null,
        date_scheduling_end_time: formData.date_scheduling_end_time || null,
        production_start_date: formData.production_start_date || null,
      };

      if (mode === 'edit' && contentId) {
        const { error } = await supabase
          .from('content_calendar')
          .update(dataToSave)
          .eq('id', contentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('content_calendar')
          .insert([{
            user_id: user.id,
            company_id: profile?.company_id,
            ...dataToSave,
            feed_order: 0
          }]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving content:', error);

      let errorMessage = 'Erreur lors de la sauvegarde';

      if (error?.message) {
        errorMessage += ': ' + error.message;
      }

      if (error?.details) {
        errorMessage += '\nDétails: ' + error.details;
      }

      if (error?.hint) {
        errorMessage += '\nSuggestion: ' + error.hint;
      }

      console.error('Détails complets de l\'erreur:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        error: error
      });

      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  function getContentStructurePlaceholder() {
    switch (formData.content_type) {
      case 'reel':
        return 'Ex: Hook (3s) → Problème (5s) → Solution (10s) → CTA (2s)';
      case 'carrousel':
        return 'Ex: Slide 1: Hook | Slide 2-4: Points clés | Slide 5: CTA';
      case 'post':
        return 'Ex: Image captivante + légende engageante';
      case 'story':
        return 'Ex: Sondage → Texte → Lien swipe-up';
      default:
        return 'Plan, scénario, découpage...';
    }
  }

  function getContentStructureHelper() {
    switch (formData.content_type) {
      case 'reel':
      case 'video':
        return 'Organisez votre vidéo par secondes : Hook accrocheur → Problème/Contexte → Solution → CTA';
      case 'carrousel':
        return 'Planifiez chaque slide : Slide 1 (Hook) → Slides 2-X (Contenu détaillé) → Slide finale (CTA)';
      case 'post':
        return 'Structurez votre post : Accroche visuelle forte + Légende qui complète l\'image';
      case 'story':
        return 'Découpez vos stories : Story 1 (Hook) → Stories 2-3 (Contenu) → Story 4 (Interaction)';
      default:
        return 'Organisez votre contenu de manière claire et logique pour votre audience';
    }
  }

  function getProTips() {
    switch (formData.content_type) {
      case 'reel':
      case 'video':
        return [
          'Les 3 premières secondes sont cruciales - créez un hook visuel fort',
          'Utilisez des transitions dynamiques pour maintenir l\'attention',
          'Ajoutez des sous-titres : 85% des vidéos sont vues sans son',
          'Terminez avec un CTA clair et actionnable'
        ];
      case 'carrousel':
        return [
          'Créez une couverture accrocheuse avec une promesse claire',
          'Un message par slide : simplicité et clarté avant tout',
          'Utilisez des éléments visuels cohérents (couleurs, fonts)',
          'Slide finale = CTA fort + rappel de la promesse initiale'
        ];
      case 'post':
        return [
          'Image haute qualité : c\'est ce qui arrête le scroll',
          'Testez différents formats (portrait, carré, paysage)',
          'L\'émotion prime sur la perfection technique',
          'Une image vaut mille mots - assurez-vous qu\'elle raconte une histoire'
        ];
      case 'story':
        return [
          'Alternez contenu et interactions pour maintenir l\'engagement',
          'Utilisez les stickers natifs (sondages, questions, quiz)',
          'Montrez les coulisses : authenticité > perfection',
          'Pensez mobile : gros textes lisibles, visuels verticaux'
        ];
      default:
        return [
          'Connaissez votre audience et parlez leur langage',
          'Un message clair vaut mieux qu\'un message complexe',
          'Testez, mesurez, ajustez - l\'itération est la clé',
          'L\'authenticité crée la connexion avec votre communauté'
        ];
    }
  }

  function getProductionSteps() {
    const contentType = formData.content_type;
    const allSteps = {
      script: { key: 'date_script', label: 'Script', icon: FileText, color: 'blue' },
      shooting: { key: 'date_shooting', label: 'Tournage', icon: Video, color: 'red' },
      editing: { key: 'date_editing', label: 'Montage', icon: Scissors, color: 'purple' },
      scheduling: { key: 'date_scheduling', label: 'Planifié', icon: Send, color: 'green' }
    };

    switch (contentType) {
      case 'post':
        return [allSteps.script, allSteps.scheduling];
      case 'story':
        return [allSteps.script, allSteps.scheduling];
      case 'carrousel':
        return [allSteps.script, allSteps.editing, allSteps.scheduling];
      case 'reel':
      case 'video':
        return [allSteps.script, allSteps.shooting, allSteps.editing, allSteps.scheduling];
      case 'live':
        return [allSteps.script, allSteps.scheduling];
      default:
        return [allSteps.script, allSteps.shooting, allSteps.editing, allSteps.scheduling];
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Chargement...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 pb-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Titre *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base"
          placeholder="Ex: Tendance ongles été 2024"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Type de contenu *
          </label>
          <select
            value={formData.content_type}
            onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
            className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base"
            required
          >
            {CONTENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Plateformes * (multi)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {PLATFORMS.map(platform => (
              <label
                key={platform.value}
                className={`flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 border rounded-lg cursor-pointer transition-all ${
                  selectedPlatforms.includes(platform.value)
                    ? 'bg-orange-50 border-orange-500 text-orange-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-orange-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlatforms([...selectedPlatforms, platform.value]);
                    } else {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.value));
                    }
                  }}
                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-xs md:text-sm font-medium">{platform.label}</span>
              </label>
            ))}
          </div>
          {selectedPlatforms.length === 0 && (
            <p className="text-xs text-red-600">Sélectionnez au moins une plateforme</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Pilier éditorial
            </label>
            <button
              type="button"
              onClick={() => setShowAddPillar(!showAddPillar)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              Ajouter
            </button>
          </div>

          {showAddPillar && (
            <div className="p-3 bg-orange-50 rounded-lg space-y-3 border border-orange-200">
              <input
                type="text"
                value={newPillarName}
                onChange={(e) => setNewPillarName(e.target.value)}
                placeholder="Nom du pilier"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewPillarColor(color)}
                    className={`w-full h-8 rounded-lg transition-all ${
                      newPillarColor === color ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {newPillarColor === color && (
                      <Check className="w-4 h-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPillar(false);
                    setNewPillarName('');
                    setNewPillarColor(PRESET_COLORS[0]);
                  }}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddPillar}
                  disabled={!newPillarName.trim()}
                  className="flex-1 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {pillars.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucun pilier disponible</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, editorial_pillar: '' })}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                    formData.editorial_pillar === ''
                      ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Aucun
                </button>
                {pillars.map(pillar => (
                  <div key={pillar.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, editorial_pillar: pillar.pillar_name })}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                        formData.editorial_pillar === pillar.pillar_name
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                      style={{
                        borderColor: formData.editorial_pillar === pillar.pillar_name ? pillar.color : undefined,
                        backgroundColor: formData.editorial_pillar === pillar.pillar_name ? `${pillar.color}15` : undefined,
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pillar.color }}
                      />
                      {pillar.pillar_name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePillar(pillar.id, pillar.pillar_name)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      title="Supprimer ce pilier"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Objectif
          </label>
          <select
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Aucun objectif</option>
            {OBJECTIVES.map(obj => (
              <option key={obj.value} value={obj.value}>{obj.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 inline mr-1.5" />
            Date de publication *
          </label>
          <input
            type="date"
            value={formData.publication_date}
            onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
            className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base"
            required
          />
          {formData.publication_date && new Date(formData.publication_date + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0)) && (
            <div className="flex items-start gap-1.5 p-2 md:p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-amber-800">
                Date passée → sera marqué comme "publié"
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 inline mr-1.5" />
            Heure de publication
          </label>
          <input
            type="time"
            value={formData.publication_time}
            onChange={(e) => setFormData({ ...formData, publication_time: e.target.value })}
            className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-3 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-base md:text-lg font-semibold text-blue-900 flex items-center gap-1.5 md:gap-2">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            Planning Production
          </h3>
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => setShowProductionDates(!showProductionDates)}
              className="text-xs md:text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              {showProductionDates ? 'Masquer' : 'Afficher'}
            </button>
            {showProductionDates && (
              <button
                type="button"
                onClick={handleAutoPlanning}
                className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md"
              >
                <Wand2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Auto-plan
              </button>
            )}
          </div>
        </div>

        {showProductionDates && (
          <div className="space-y-3 md:space-y-4">
            <div className="bg-white/60 border border-blue-200 rounded-lg p-2.5 md:p-4">
              <p className="text-xs md:text-sm text-blue-900 font-medium mb-1.5 md:mb-2">
                Dates calculées EN ARRIÈRE depuis la publication
              </p>
              <p className="text-xs text-blue-800 hidden md:block">
                Exemple : Pub 20/01 → Programme 19/01 (J-1) → Montage 17/01 (J-3) → Tournage 16/01 (J-4) → Script 15/01 (J-5)
              </p>
              <p className="text-[10px] md:text-xs text-blue-700 mt-1.5 md:mt-2">
                Génère automatiquement des tâches dans l'agenda.
              </p>
            </div>

            <div className="space-y-4">
              {getProductionSteps().map((step) => {
                const Icon = step.icon;
                const dateKey = step.key as keyof typeof formData;
                const timeKey = (step.key + '_time') as keyof typeof formData;
                const endTimeKey = (step.key + '_end_time') as keyof typeof formData;
                return (
                  <div key={step.key} className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-3">
                      <Icon className={`w-4 h-4 text-${step.color}-500`} />
                      {step.label}
                      {step.key === 'date_scheduling' && (
                        <InfoTooltip content="Planification : C'est le moment d'ajouter le post sur les réseaux sociaux et de le programmer (date / heure / plateformes)." />
                      )}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-600 font-medium">Date</label>
                        <input
                          type="date"
                          value={formData[dateKey] as string}
                          onChange={(e) => setFormData({ ...formData, [dateKey]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-600 font-medium">Heure début</label>
                        <input
                          type="time"
                          value={formData[timeKey] as string}
                          onChange={(e) => setFormData({ ...formData, [timeKey]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-600 font-medium">Heure fin</label>
                        <input
                          type="time"
                          value={formData[endTimeKey] as string}
                          onChange={(e) => setFormData({ ...formData, [endTimeKey]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-purple-50 via-orange-50 to-pink-50 border-2 border-orange-300 rounded-xl p-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Génération IA Intelligente</h3>
          <p className="text-sm text-gray-600">
            L'IA génère automatiquement le script détaillé ET la légende, adaptés à votre contexte
          </p>
        </div>

        <div className="bg-white/70 border border-orange-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-2">Le contenu sera adapté selon :</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-orange-500" />
              <span>Type de contenu ({formData.content_type})</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-orange-500" />
              <span>Plateformes ({selectedPlatforms.join(', ')})</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-orange-500" />
              <span>Objectif ({formData.objective || 'Non défini'})</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-orange-500" />
              <span>Pilier ({formData.editorial_pillar || 'Aucun'})</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setUseAI(true);
            handleGenerateAI();
          }}
          disabled={generatingCaption || !formData.title}
          className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white rounded-xl hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          {generatingCaption ? 'Génération en cours...' : 'Générer le contenu'}
        </button>

        {!formData.title && (
          <p className="text-xs text-center text-red-600 mt-2">Veuillez d'abord saisir un titre</p>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-blue-900">
              <FileText className="w-4 h-4" />
              Script détaillé
            </label>
            <p className="text-xs text-blue-700 mt-1">
              {selectedPlatforms.includes('linkedin') || selectedPlatforms.includes('facebook')
                ? 'Ton professionnel adapté à LinkedIn/Facebook'
                : selectedPlatforms.includes('tiktok')
                ? 'Script rythmé et punchline pour TikTok'
                : selectedPlatforms.includes('instagram')
                ? 'Hook rapide et format engageant pour Instagram'
                : 'Script optimisé pour la plateforme sélectionnée'}
            </p>
          </div>
        </div>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 md:px-4 md:py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-mono text-xs md:text-sm"
          placeholder="Cliquez sur 'Générer le contenu' pour créer un script détaillé adapté à votre format et plateforme..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            Légende
            <div className="relative group">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Texte affiché en bas de votre post (généré automatiquement avec le script)
              </div>
            </div>
          </label>
        </div>
        <textarea
          value={formData.caption}
          onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base"
          placeholder="La légende sera générée automatiquement avec le script..."
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          Note
          <div className="relative group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Notes personnelles sur cette idée de contenu
            </div>
          </div>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base"
          placeholder="Ajoute tes notes et réflexions personnelles sur ce contenu..."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <LinkIcon className="w-4 h-4 inline mr-2" />
          Lien (optionnel)
        </label>
        <input
          type="url"
          value={formData.link}
          onChange={(e) => setFormData({ ...formData, link: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="https://... (Canva, Drive, doc, brief)"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <Video className="w-4 h-4 inline mr-2" />
          URL Reel Instagram (optionnel)
        </label>
        <input
          type="url"
          value={formData.reel_url}
          onChange={(e) => setFormData({ ...formData, reel_url: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="https://www.instagram.com/reel/... (inspiration)"
        />
        <p className="text-xs text-gray-500">
          Ajoutez un lien vers un reel Instagram pour référence ou inspiration
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <ImageIcon className="w-4 h-4 inline mr-2" />
          Images / Médias
        </label>
        <MediaUploader
          mediaFiles={mediaFiles}
          onMediaFilesChange={setMediaFiles}
        />
      </div>

      <div className="flex justify-end gap-2 md:gap-3 pt-4 md:pt-6 pb-20 md:pb-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 md:px-6 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4 md:w-5 md:h-5" />
          {saving ? 'Enregistrement...' : mode === 'edit' ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
