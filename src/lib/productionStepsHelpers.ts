import { FileEdit, Camera, Scissors, CheckCircle, CalendarCheck, MessageSquare } from 'lucide-react';
import { createElement } from 'react';

export type ContentStatus = 'idea' | 'to_produce' | 'to_shoot' | 'to_edit' | 'scheduled' | 'published';
export type ContentType = 'post' | 'reel' | 'carrousel' | 'story' | 'video' | 'live';
export type StepKey = 'date_script' | 'date_shooting' | 'date_editing' | 'date_scheduling';

export interface ContentItem {
  id: string;
  status: ContentStatus;
  content_type: string;
  date_script?: string;
  date_shooting?: string;
  date_editing?: string;
  date_scheduling?: string;
  publication_date: string;
}

export interface ProductionStep {
  key: StepKey;
  date?: string;
  label: string;
  icon: any;
  color: string;
  stepDate?: string;
  diffDays: number;
  isOverdue: boolean;
  isToday: boolean;
  isPast: boolean;
  isCompleted: boolean;
}

function getCompletedStepsForStatus(status: ContentStatus, contentType: string): StepKey[] {
  return [];
}

export function getRelevantStepsForContentType(contentType: string): string[] {
  switch (contentType) {
    case 'post':
      return ['date_script', 'date_scheduling'];
    case 'story':
      return ['date_script', 'date_scheduling'];
    case 'carrousel':
      return ['date_script', 'date_editing', 'date_scheduling'];
    case 'reel':
    case 'video':
      return ['date_script', 'date_shooting', 'date_editing', 'date_scheduling'];
    case 'live':
      return ['date_script', 'date_scheduling'];
    default:
      return ['date_script', 'date_shooting', 'date_editing', 'date_scheduling'];
  }
}

function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getProductionSteps(content: ContentItem): ProductionStep[] {
  const today = formatDateToLocal(new Date());
  const steps: ProductionStep[] = [];

  const allStepsConfig = [
    { key: 'date_script' as StepKey, date: content.date_script, label: 'Script', icon: createElement(FileEdit, { className: 'w-4 h-4' }), color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'date_shooting' as StepKey, date: content.date_shooting, label: 'Tournage', icon: createElement(Camera, { className: 'w-4 h-4' }), color: 'bg-red-50 text-red-700 border-red-200' },
    { key: 'date_editing' as StepKey, date: content.date_editing, label: 'Montage', icon: createElement(Scissors, { className: 'w-4 h-4' }), color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { key: 'date_scheduling' as StepKey, date: content.date_scheduling, label: 'Planifié', icon: createElement(CalendarCheck, { className: 'w-4 h-4' }), color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ];

  const relevantStepKeys = getRelevantStepsForContentType(content.content_type);
  const completedStepKeys = getCompletedStepsForStatus(content.status, content.content_type);
  const stepsConfig = allStepsConfig.filter(step => relevantStepKeys.includes(step.key));

  for (const step of stepsConfig) {
    const isCompleted = completedStepKeys.includes(step.key);

    if (step.date) {
      const stepDate = new Date(step.date);
      const todayDate = new Date(today);
      const diffTime = stepDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      steps.push({
        ...step,
        stepDate: step.date,
        diffDays,
        isOverdue: !isCompleted && diffDays < 0,
        isToday: !isCompleted && diffDays === 0,
        isPast: isCompleted || diffDays < 0,
        isCompleted
      });
    } else {
      steps.push({
        ...step,
        stepDate: undefined,
        diffDays: 999,
        isOverdue: false,
        isToday: false,
        isPast: isCompleted,
        isCompleted
      });
    }
  }

  return steps.sort((a, b) => {
    if (a.isCompleted && !b.isCompleted) return -1;
    if (!a.isCompleted && b.isCompleted) return 1;
    return a.diffDays - b.diffDays;
  });
}

export function getNextProductionStep(content: ContentItem): ProductionStep | null {
  const steps = getProductionSteps(content);

  const overdueSteps = steps.filter(s => !s.isCompleted && s.isOverdue);
  if (overdueSteps.length > 0) {
    return overdueSteps[0];
  }

  const upcomingSteps = steps.filter(s => !s.isCompleted && !s.isPast);
  if (upcomingSteps.length > 0) {
    return upcomingSteps[0];
  }

  const futureSteps = steps.filter(s => !s.isCompleted);
  return futureSteps.length > 0 ? futureSteps[0] : null;
}

export function getCompletedStepsCount(content: ContentItem): number {
  const steps = getProductionSteps(content);
  return steps.filter(s => s.isCompleted).length;
}

export function getTotalStepsCount(content: ContentItem): number {
  return getProductionSteps(content).length;
}

export function getProgressPercent(content: ContentItem): number {
  const total = getTotalStepsCount(content);
  if (total === 0) return 0;
  const completed = getCompletedStepsCount(content);
  return (completed / total) * 100;
}

export const stepIconsMap: Record<string, any> = {
  script: FileEdit,
  shooting: Camera,
  editing: Scissors,
  subtitles: MessageSquare,
  validation: CheckCircle,
  scheduling: CalendarCheck
};

export const stepColorMap: Record<string, string> = {
  script: 'text-blue-600',
  shooting: 'text-red-600',
  editing: 'text-purple-600',
  subtitles: 'text-yellow-600',
  validation: 'text-green-600',
  scheduling: 'text-indigo-600'
};

export const stepLabelMap: Record<string, string> = {
  script: 'Script',
  shooting: 'Tournage',
  editing: 'Montage',
  subtitles: 'Sous-titres',
  validation: 'Validation',
  scheduling: 'Planifié'
};

export function getStepIcon(step: string) {
  return stepIconsMap[step] || FileEdit;
}

export function getStepColor(step: string) {
  return stepColorMap[step] || 'text-gray-600';
}

export function getStepLabel(step: string) {
  return stepLabelMap[step] || step;
}

export const stepEmojiMap: Record<string, string> = {
  script: '✍️',
  shooting: '🎥',
  editing: '🎬',
  subtitles: '💬',
  validation: '✅',
  scheduling: '📅'
};

export function getStepEmoji(step: string): string {
  return stepEmojiMap[step] || '📝';
}

/**
 * Normalise un nom d'étape de production vers le format DB (anglais)
 *
 * IMPORTANT: Les valeurs de production_step dans la DB sont EN ANGLAIS
 * pour respecter la contrainte CHECK de la table tasks.
 *
 * Valeurs autorisées (SOURCE OF TRUTH):
 * - 'script'
 * - 'shooting'
 * - 'editing'
 * - 'subtitles'
 * - 'validation'
 * - 'scheduling'
 *
 * Cette fonction convertit les variantes françaises vers l'anglais.
 */
export type ProductionStepValue = 'script' | 'shooting' | 'editing' | 'subtitles' | 'validation' | 'scheduling';

export function normalizeProductionStep(step: string | null | undefined): ProductionStepValue | null {
  if (!step) return null;

  const normalized = step.toLowerCase().trim();

  switch (normalized) {
    case 'script':
    case 'écriture':
      return 'script';

    case 'shooting':
    case 'tournage':
      return 'shooting';

    case 'editing':
    case 'montage':
      return 'editing';

    case 'subtitles':
    case 'sous-titres':
    case 'soustitres':
      return 'subtitles';

    case 'validation':
      return 'validation';

    case 'scheduling':
    case 'planification':
    case 'planifie':
    case 'planifié':
      return 'scheduling';

    default:
      console.error(`Invalid production step: ${step}`);
      return null;
  }
}

/**
 * Vérifie si une valeur est une étape de production valide
 */
export function isValidProductionStep(step: string | null | undefined): step is ProductionStepValue {
  if (!step) return false;
  return ['script', 'shooting', 'editing', 'subtitles', 'validation', 'scheduling'].includes(step);
}

/**
 * Obtient toutes les étapes de production disponibles
 */
export function getAllProductionSteps(): ProductionStepValue[] {
  return ['script', 'shooting', 'editing', 'subtitles', 'validation', 'scheduling'];
}

/**
 * Mapping des étapes de production vers les colonnes de date dans content_calendar
 */
export function getDateColumnForStep(step: ProductionStepValue): string | null {
  switch (step) {
    case 'script':
      return 'date_script';
    case 'shooting':
      return 'date_shooting';
    case 'editing':
      return 'date_editing';
    case 'scheduling':
      return 'date_scheduling';
    default:
      return null;
  }
}

/**
 * Mapping inverse: colonne de date → étape de production
 */
export function getStepFromDateColumn(column: string): ProductionStepValue | null {
  switch (column) {
    case 'date_script':
      return 'script';
    case 'date_shooting':
      return 'shooting';
    case 'date_editing':
      return 'editing';
    case 'date_scheduling':
      return 'scheduling';
    default:
      return null;
  }
}
