import { useState, useRef, useEffect } from 'react';
import { Edit2, Save, X, Image as ImageIcon, Calendar, Target, Filter, Instagram, Linkedin, Facebook, Youtube, Twitter, Sparkles, AlertCircle, ChevronDown, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PublishDateGuardModal from './PublishDateGuardModal';
import { forcePublishContent, updateProductionStepCompleted, getRelevantSteps, type ProductionStep } from '../../lib/productionHelpers';

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
  editorial_pillar?: string;
  objective?: string;
  caption?: string;
  media_urls?: string[];
  date_script?: string;
  date_shooting?: string;
  date_editing?: string;
  date_scheduling?: string;
  step_script_completed?: boolean;
  step_shooting_completed?: boolean;
  step_editing_completed?: boolean;
  step_scheduling_completed?: boolean;
  is_published?: boolean;
}

interface EditorialPillar {
  id: string;
  pillar_name: string;
  color: string;
}

interface ContentTableProps {
  contents: ContentItem[];
  pillars: EditorialPillar[];
  onContentUpdated: () => void;
  onContentEdit?: (content: ContentItem) => void;
}

export default function ContentTable({ contents, pillars, onContentUpdated, onContentEdit }: ContentTableProps) {
  const { user } = useAuth();
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [pillarFilter, setPillarFilter] = useState<string[]>([]);
  const [formatFilter, setFormatFilter] = useState<string[]>([]);
  const [objectiveFilter, setObjectiveFilter] = useState<string[]>([]);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showPillarDropdown, setShowPillarDropdown] = useState(false);
  const [showObjectiveDropdown, setShowObjectiveDropdown] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);
  const pillarDropdownRef = useRef<HTMLDivElement>(null);
  const objectiveDropdownRef = useRef<HTMLDivElement>(null);
  const platformDropdownRef = useRef<HTMLDivElement>(null);

  const [showDateGuardModal, setShowDateGuardModal] = useState(false);
  const [pendingPublishContent, setPendingPublishContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
      if (pillarDropdownRef.current && !pillarDropdownRef.current.contains(event.target as Node)) {
        setShowPillarDropdown(false);
      }
      if (objectiveDropdownRef.current && !objectiveDropdownRef.current.contains(event.target as Node)) {
        setShowObjectiveDropdown(false);
      }
      if (platformDropdownRef.current && !platformDropdownRef.current.contains(event.target as Node)) {
        setShowPlatformDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const PLATFORM_OPTIONS = [
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'tiktok', label: 'TikTok', icon: ImageIcon },
    { value: 'twitter', label: 'Twitter', icon: Twitter },
  ];

  const FORMAT_OPTIONS = [
    { value: 'post', label: 'Post' },
    { value: 'reel', label: 'Reel' },
    { value: 'carrousel', label: 'Carrousel' },
    { value: 'story', label: 'Story' },
    { value: 'video', label: 'Vidéo' },
  ];

  const OBJECTIVE_OPTIONS = [
    { value: 'attirer', label: 'Attirer' },
    { value: 'éduquer', label: 'Éduquer' },
    { value: 'convertir', label: 'Convertir' },
    { value: 'fidéliser', label: 'Fidéliser' },
  ];

  function togglePlatformFilter(platform: string) {
    setPlatformFilter(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  }

  function togglePillarFilter(pillar: string) {
    setPillarFilter(prev =>
      prev.includes(pillar) ? prev.filter(p => p !== pillar) : [...prev, pillar]
    );
  }

  function toggleFormatFilter(format: string) {
    setFormatFilter(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  }

  function toggleObjectiveFilter(objective: string) {
    setObjectiveFilter(prev =>
      prev.includes(objective) ? prev.filter(o => o !== objective) : [...prev, objective]
    );
  }

  const filteredContents = contents.filter(content => {
    const platforms = Array.isArray(content.platform) ? content.platform : [content.platform];
    const platformMatch = platformFilter.length === 0 || platforms.some(p => platformFilter.includes(p));
    const pillarMatch = pillarFilter.length === 0 || (content.editorial_pillar && pillarFilter.includes(content.editorial_pillar));
    const formatMatch = formatFilter.length === 0 || formatFilter.includes(content.content_type);
    const objectiveMatch = objectiveFilter.length === 0 || (content.objective && objectiveFilter.includes(content.objective));
    return platformMatch && pillarMatch && formatMatch && objectiveMatch;
  });


  async function handleQuickUpdate(contentId: string, field: string, value: any) {
    try {
      const { error } = await supabase
        .from('content_calendar')
        .update({ [field]: value })
        .eq('id', contentId);

      if (error) throw error;
      onContentUpdated();
    } catch (error) {
      console.error('Error updating content:', error);
    }
  }

  async function handleDelete(contentId: string) {
    try {
      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
      onContentUpdated();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function handleProductionStepChange(content: ContentItem, step: string) {
    if (!user) return;

    try {
      if (step === 'none') {
        // Décocher toutes les étapes
        const relevantSteps = getRelevantSteps(content.content_type);
        for (const s of relevantSteps) {
          await updateProductionStepCompleted(content.id, s as ProductionStep, false);
        }
      } else if (step === 'published') {
        // Forcer le tag "Publié" (coche toutes les étapes + marque tâches terminées)
        const result = await forcePublishContent(content.id);
        if (!result.success) {
          throw new Error(result.error || 'Erreur lors du forçage de la publication');
        }
      } else {
        // Cocher l'étape spécifique (la synchronisation avec les tâches est automatique)
        await updateProductionStepCompleted(content.id, step as ProductionStep, true);
      }

      onContentUpdated();
    } catch (error) {
      console.error('Error updating production step:', error);
      alert('Erreur lors de la mise à jour de l\'étape');
    }
  }

  async function handleDateGuardConfirm(newDate: string) {
    if (!pendingPublishContent) return;

    try {
      const { error: updateError } = await supabase
        .from('content_calendar')
        .update({ publication_date: newDate })
        .eq('id', pendingPublishContent.id);

      if (updateError) throw updateError;

      // Forcer le tag "Publié"
      const result = await forcePublishContent(pendingPublishContent.id);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du forçage de la publication');
      }

      setShowDateGuardModal(false);
      setPendingPublishContent(null);
      onContentUpdated();
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Erreur lors de la mise à jour');
    }
  }

  function getHighestProductionStep(content: ContentItem): string {
    // Le tag "Publié" est prioritaire
    if (content.is_published) return 'published';

    // Sinon, chercher la dernière étape cochée
    const relevantSteps = getRelevantSteps(content.content_type);

    // Vérifier dans l'ordre inverse (de la fin vers le début)
    if (relevantSteps.includes('scheduling') && content.step_scheduling_completed) return 'scheduling';
    if (relevantSteps.includes('editing') && content.step_editing_completed) return 'editing';
    if (relevantSteps.includes('shooting') && content.step_shooting_completed) return 'shooting';
    if (relevantSteps.includes('script') && content.step_script_completed) return 'script';

    return 'none';
  }

  function getPlatformIcon(platform: string) {
    const p = PLATFORM_OPTIONS.find(opt => opt.value === platform);
    return p ? p.icon : Instagram;
  }

  function getPillarColor(pillarName: string) {
    const pillar = pillars.find(p => p.pillar_name === pillarName);
    return pillar?.color || '#3B82F6';
  }

  const today = new Date().toISOString().split('T')[0];
  const overdueContents = contents.filter(content => {
    const isOverdue = content.publication_date < today;
    const isInProduction = ['script', 'shooting', 'editing'].includes(content.status);
    return isOverdue && isInProduction;
  });

  const uniquePillars = [...new Set(contents.map(c => c.editorial_pillar).filter(Boolean))];
  const uniqueFormats = [...new Set(contents.map(c => c.content_type).filter(Boolean))];
  const uniqueObjectives = [...new Set(contents.map(c => c.objective).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Studio de contenu</h2>
        <p className="text-gray-600">Visualisez et modifiez tous vos contenus en un coup d'œil</p>
      </div>

      {overdueContents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">
                  {overdueContents.length} contenu{overdueContents.length > 1 ? 's' : ''} en retard de production
                </h3>
                <p className="text-sm text-red-700">
                  Ces contenus ont dépassé leur date prévue et sont toujours en production
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Titre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                <div className="relative" ref={platformDropdownRef}>
                  <button
                    onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                    className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                  >
                    Réseaux sociaux
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showPlatformDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                      <div className="p-2 space-y-1">
                        {PLATFORM_OPTIONS.map(platform => {
                          const Icon = platform.icon;
                          return (
                            <label key={platform.value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={platformFilter.includes(platform.value)}
                                onChange={() => togglePlatformFilter(platform.value)}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <Icon className="w-3.5 h-3.5 text-gray-600" />
                                <span className="text-xs text-gray-700">{platform.label}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      {platformFilter.length > 0 && (
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={() => setPlatformFilter([])}
                            className="w-full px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          >
                            Réinitialiser
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                <div className="relative" ref={formatDropdownRef}>
                  <button
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                  >
                    Format
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showFormatDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                      <div className="p-2 space-y-1">
                        {FORMAT_OPTIONS.map(format => (
                          <label key={format.value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formatFilter.includes(format.value)}
                              onChange={() => toggleFormatFilter(format.value)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-xs text-gray-700">{format.label}</span>
                          </label>
                        ))}
                      </div>
                      {formatFilter.length > 0 && (
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={() => setFormatFilter([])}
                            className="w-full px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          >
                            Réinitialiser
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                <div className="relative" ref={pillarDropdownRef}>
                  <button
                    onClick={() => setShowPillarDropdown(!showPillarDropdown)}
                    className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                  >
                    Pilier
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showPillarDropdown && uniquePillars.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
                      <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                        {uniquePillars.map(pillarName => (
                          <label key={pillarName} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pillarFilter.includes(pillarName)}
                              onChange={() => togglePillarFilter(pillarName)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getPillarColor(pillarName) }}
                              />
                              <span className="text-xs text-gray-700">{pillarName}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      {pillarFilter.length > 0 && (
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={() => setPillarFilter([])}
                            className="w-full px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          >
                            Réinitialiser
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Étape de production</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Date de Publication</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                <div className="relative" ref={objectiveDropdownRef}>
                  <button
                    onClick={() => setShowObjectiveDropdown(!showObjectiveDropdown)}
                    className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                  >
                    Objectif
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showObjectiveDropdown && uniqueObjectives.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                      <div className="p-2 space-y-1">
                        {OBJECTIVE_OPTIONS.filter(obj => uniqueObjectives.includes(obj.value)).map(objective => (
                          <label key={objective.value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={objectiveFilter.includes(objective.value)}
                              onChange={() => toggleObjectiveFilter(objective.value)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <Target className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-700">{objective.label}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      {objectiveFilter.length > 0 && (
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={() => setObjectiveFilter([])}
                            className="w-full px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          >
                            Réinitialiser
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredContents.map(content => {
              return (
                <tr
                  key={content.id}
                  className="hover:bg-orange-50 transition-colors cursor-pointer"
                  onClick={() => onContentEdit && onContentEdit(content)}
                >
                  <td className="px-4 py-3">
                    {content.image_url ? (
                      <img
                        src={content.image_url}
                        alt={content.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">{content.title}</p>
                      {content.caption && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{content.caption}</p>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(content.platform) ? content.platform : [content.platform]).map((platform) => {
                        const Icon = getPlatformIcon(platform);
                        const platformOption = PLATFORM_OPTIONS.find(p => p.value === platform);
                        return (
                          <span
                            key={platform}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200 rounded-full"
                          >
                            <Icon className="w-3 h-3" />
                            {platformOption?.label || platform}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={content.content_type}
                      onChange={(e) => handleQuickUpdate(content.id, 'content_type', e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:border-orange-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer bg-white"
                    >
                      {FORMAT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={content.editorial_pillar || ''}
                      onChange={(e) => handleQuickUpdate(content.id, 'editorial_pillar', e.target.value || null)}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:border-orange-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer bg-white"
                    >
                      <option value="">Aucun pilier</option>
                      {pillars.map(p => (
                        <option key={p.id} value={p.pillar_name}>{p.pillar_name}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={getHighestProductionStep(content)}
                      onChange={(e) => handleProductionStepChange(content, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:border-orange-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer bg-white"
                    >
                      <option value="none">Aucune étape</option>
                      <option value="script">Script</option>
                      <option value="shooting">Tournage</option>
                      <option value="editing">Montage</option>
                      <option value="scheduling">Planifié</option>
                      <option value="published">Publié</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    {content.is_published ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                        Publié
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                        Non publié
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {new Date(content.publication_date).toLocaleDateString('fr-FR')}
                    </div>
                  </td>

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={content.objective || ''}
                      onChange={(e) => handleQuickUpdate(content.id, 'objective', e.target.value || null)}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:border-orange-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer bg-white"
                    >
                      <option value="">Aucun objectif</option>
                      {OBJECTIVE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onContentEdit) {
                            onContentEdit(content);
                          }
                        }}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all hover:shadow-sm"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Supprimer ce contenu ?')) {
                            handleDelete(content.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-sm"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredContents.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun contenu ne correspond aux filtres</p>
          </div>
        )}
      </div>

      {showDateGuardModal && pendingPublishContent && (
        <PublishDateGuardModal
          isOpen={showDateGuardModal}
          contentTitle={pendingPublishContent.title}
          currentDate={pendingPublishContent.publication_date}
          onConfirm={handleDateGuardConfirm}
          onCancel={() => {
            setShowDateGuardModal(false);
            setPendingPublishContent(null);
          }}
        />
      )}
    </div>
  );
}
