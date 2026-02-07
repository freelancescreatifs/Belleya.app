import { Calendar } from 'lucide-react';
import { getNextProductionStep, getProgressPercent, getTotalStepsCount, getCompletedStepsCount, ContentItem } from '../../lib/productionStepsHelpers';
import InfoTooltip from '../shared/InfoTooltip';

interface ProductionDates {
  date_script?: string;
  date_shooting?: string;
  date_editing?: string;
  date_scheduling?: string;
}

interface ProductionProgressBarProps {
  dates: ProductionDates;
  status: string;
  contentType?: string;
  contentId?: string;
  publicationDate?: string;
}

export default function ProductionProgressBar({ dates, status, contentType = 'post', contentId = '', publicationDate }: ProductionProgressBarProps) {
  const content: ContentItem = {
    id: contentId,
    status: status as any,
    content_type: contentType,
    publication_date: publicationDate || new Date().toISOString().split('T')[0],
    ...dates
  };

  const nextStep = getNextProductionStep(content);
  const progress = getProgressPercent(content);
  const totalSteps = getTotalStepsCount(content);
  const completedSteps = getCompletedStepsCount(content);

  const getBarColor = () => {
    if (status === 'published' || progress === 100) return 'bg-green-500';
    if (nextStep?.isOverdue) return 'bg-red-500';
    if (nextStep?.isToday) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getDaysText = () => {
    if (!nextStep) return '';
    if (nextStep.isOverdue) {
      const days = Math.abs(nextStep.diffDays);
      return `Retard de ${days}j`;
    }
    if (nextStep.isToday) return 'Aujourd\'hui';
    if (nextStep.diffDays === 1) return 'Demain';
    return `J-${nextStep.diffDays}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${getBarColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="ml-3 text-sm font-medium text-gray-700">{completedSteps}/{totalSteps}</span>
      </div>

      {nextStep && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          <span className="flex items-center gap-1">
            <span className="font-medium">{completedSteps}/{totalSteps}</span>
            <span className="mx-1">·</span>
            <span>Prochaine étape : <span className="font-medium text-blue-600">{nextStep.label}</span></span>
            {nextStep.key === 'date_scheduling' && (
              <InfoTooltip content="Planification : C'est le moment d'ajouter le post sur les réseaux sociaux et de le programmer (date / heure / plateformes)." />
            )}
            <span className="mx-1">·</span>
            <span className="font-medium">{getDaysText()}</span>
          </span>
        </div>
      )}

      {!nextStep && progress === 100 && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <Calendar className="w-3 h-3" />
          <span className="font-medium">Production terminée</span>
        </div>
      )}
    </div>
  );
}
