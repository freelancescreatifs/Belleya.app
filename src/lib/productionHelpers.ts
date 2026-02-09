/**
 * Helpers pour la gestion de la production de contenu
 *
 * RÈGLES MÉTIER STRICTES :
 *
 * 1. TAG "PUBLIÉ" = TAG, pas une étape
 *    - Calculé automatiquement : toutes étapes cochées + date passée = Publié
 *    - Peut être forcé manuellement
 *
 * 2. CHECKBOXES = État des étapes (séparées des dates)
 *    - Synchronisées bidirectionnellement avec les tâches
 *
 * 3. DATES = Deadlines des étapes (NE CHANGENT JAMAIS automatiquement)
 *    - Toujours visibles sous les étapes
 *    - Servent à calculer les retards
 *
 * 4. RETARDS = Étapes non cochées dont la deadline est passée
 */

import { supabase } from './supabase';

export type ProductionStep = 'script' | 'shooting' | 'editing' | 'scheduling';

export interface ProductionStepState {
  step: ProductionStep;
  label: string;
  completed: boolean;
  deadline: string | null;
  isLate?: boolean;
  daysLate?: number;
}

export interface ProductionDelay {
  step: ProductionStep;
  label: string;
  deadline: string;
  days_late: number;
}

export interface PublishedTagState {
  isPublished: boolean;
  reason: 'all_steps_completed_date_past' | 'all_steps_completed_date_future' | 'steps_incomplete' | 'unknown';
  missingSteps?: string[];
  publicationInFuture?: boolean;
}

/**
 * Obtient les étapes pertinentes selon le type de contenu
 */
export function getRelevantSteps(contentType: string): ProductionStep[] {
  switch (contentType) {
    case 'story':
      return ['script', 'shooting', 'scheduling'];
    case 'post':
      return ['script', 'scheduling'];
    default:
      return ['script', 'shooting', 'editing', 'scheduling'];
  }
}

/**
 * Labels des étapes de production
 */
export function getStepLabel(step: ProductionStep): string {
  const labels: Record<ProductionStep, string> = {
    script: 'Script',
    shooting: 'Tournage',
    editing: 'Montage',
    scheduling: 'Programmation'
  };
  return labels[step];
}

/**
 * Calcule l'état du tag "Publié/Non publié" côté client
 * (Pour affichage avant sync avec le serveur)
 */
export function calculatePublishedTagState(
  contentType: string,
  publicationDate: string,
  publicationTime: string,
  stepScriptCompleted: boolean,
  stepShootingCompleted: boolean,
  stepEditingCompleted: boolean,
  stepSchedulingCompleted: boolean
): PublishedTagState {
  const relevantSteps = getRelevantSteps(contentType);
  const stepStates: Record<ProductionStep, boolean> = {
    script: stepScriptCompleted,
    shooting: stepShootingCompleted,
    editing: stepEditingCompleted,
    scheduling: stepSchedulingCompleted
  };

  // Vérifier si toutes les étapes pertinentes sont cochées
  const allStepsCompleted = relevantSteps.every(step => stepStates[step]);

  if (!allStepsCompleted) {
    const missingSteps = relevantSteps
      .filter(step => !stepStates[step])
      .map(step => getStepLabel(step));

    return {
      isPublished: false,
      reason: 'steps_incomplete',
      missingSteps
    };
  }

  // Si toutes les étapes sont cochées, vérifier la date
  try {
    const pubTime = publicationTime || '00:00';
    const pubDateTime = new Date(`${publicationDate}T${pubTime}`);
    const now = new Date();

    if (pubDateTime <= now) {
      return {
        isPublished: true,
        reason: 'all_steps_completed_date_past'
      };
    } else {
      return {
        isPublished: false,
        reason: 'all_steps_completed_date_future',
        publicationInFuture: true
      };
    }
  } catch (error) {
    return {
      isPublished: false,
      reason: 'unknown'
    };
  }
}

/**
 * Récupère l'état complet des étapes de production pour un contenu
 */
export function getProductionStepsState(
  contentType: string,
  data: {
    date_script?: string | null;
    date_shooting?: string | null;
    date_editing?: string | null;
    date_scheduling?: string | null;
    step_script_completed?: boolean;
    step_shooting_completed?: boolean;
    step_editing_completed?: boolean;
    step_scheduling_completed?: boolean;
  }
): ProductionStepState[] {
  const relevantSteps = getRelevantSteps(contentType);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const steps: ProductionStepState[] = relevantSteps.map(step => {
    const deadlineKey = `date_${step}` as keyof typeof data;
    const completedKey = `step_${step}_completed` as keyof typeof data;
    const deadline = data[deadlineKey] as string | null | undefined;
    const completed = data[completedKey] as boolean | undefined;

    let isLate = false;
    let daysLate = 0;

    if (deadline && !completed) {
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        isLate = true;
        daysLate = Math.floor((today.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    return {
      step,
      label: getStepLabel(step),
      completed: completed || false,
      deadline: deadline || null,
      isLate,
      daysLate: isLate ? daysLate : undefined
    };
  });

  return steps;
}

/**
 * Met à jour une checkbox d'étape de production
 * (La synchronisation avec les tâches est automatique côté DB)
 */
export async function updateProductionStepCompleted(
  contentId: string,
  step: ProductionStep,
  completed: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const columnName = `step_${step}_completed`;

    const { error } = await supabase
      .from('content_calendar')
      .update({ [columnName]: completed })
      .eq('id', contentId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating production step:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    };
  }
}

/**
 * Force le tag "Publié" manuellement
 * Coche toutes les étapes + marque toutes les tâches comme terminées
 * Les dates NE CHANGENT PAS
 */
export async function forcePublishContent(
  contentId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('force_publish_content', { p_content_id: contentId });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error forcing publish:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du forçage de la publication'
    };
  }
}

/**
 * Récupère les retards de production pour un contenu
 */
export async function getProductionDelays(
  contentId: string
): Promise<{ hasDelays: boolean; delays: ProductionDelay[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('get_production_delays', { p_content_id: contentId });

    if (error) throw error;

    return {
      hasDelays: data.has_delays || false,
      delays: data.delays || []
    };
  } catch (error: any) {
    console.error('Error getting production delays:', error);
    return {
      hasDelays: false,
      delays: [],
      error: error.message || 'Erreur lors de la récupération des retards'
    };
  }
}

/**
 * Styles recommandés pour les badges de statut
 */
export function getPublishedTagStyles(isPublished: boolean): {
  bgColor: string;
  textColor: string;
  label: string;
} {
  if (isPublished) {
    return {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      label: 'Publié'
    };
  } else {
    return {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      label: 'Non publié'
    };
  }
}

/**
 * Styles recommandés pour les étapes en retard
 */
export function getDelayStyles(daysLate: number): {
  bgColor: string;
  textColor: string;
  label: string;
} {
  if (daysLate === 0) {
    return {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      label: 'Aujourd\'hui'
    };
  } else if (daysLate === 1) {
    return {
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      label: '1 jour de retard'
    };
  } else {
    return {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      label: `${daysLate} jours de retard`
    };
  }
}

/**
 * Formate une date de deadline
 */
export function formatDeadline(dateString: string | null): string {
  if (!dateString) return 'Non définie';

  try {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateString);
    deadline.setHours(0, 0, 0, 0);

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short'
    };

    const formatted = date.toLocaleDateString('fr-FR', options);

    // Ajouter un indicateur si c'est aujourd'hui
    if (deadline.getTime() === today.getTime()) {
      return `${formatted} (Aujourd'hui)`;
    }

    // Ajouter un indicateur si c'est passé
    if (deadline < today) {
      return `${formatted} (Passé)`;
    }

    return formatted;
  } catch (error) {
    return dateString;
  }
}
