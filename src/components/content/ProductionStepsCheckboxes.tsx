import { FileText, Video, Scissors, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';

interface ProductionStep {
  key: 'script_checked' | 'tournage_checked' | 'montage_checked' | 'planifie_checked';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dateField?: string;
  timeField?: string;
}

interface ProductionStepsCheckboxesProps {
  contentId: string;
  scriptChecked: boolean;
  tournageChecked: boolean;
  montageChecked: boolean;
  planifieChecked: boolean;
  dateScript?: string;
  dateScriptTime?: string;
  dateShooting?: string;
  dateShootingTime?: string;
  dateEditing?: string;
  dateEditingTime?: string;
  dateScheduling?: string;
  dateSchedulingTime?: string;
  onUpdate?: () => void;
  showDates?: boolean;
  compact?: boolean;
}

const PRODUCTION_STEPS: ProductionStep[] = [
  { key: 'script_checked', label: 'Script', icon: FileText, dateField: 'date_script', timeField: 'date_script_time' },
  { key: 'tournage_checked', label: 'Tournage', icon: Video, dateField: 'date_shooting', timeField: 'date_shooting_time' },
  { key: 'montage_checked', label: 'Montage', icon: Scissors, dateField: 'date_editing', timeField: 'date_editing_time' },
  { key: 'planifie_checked', label: 'Planifié', icon: Calendar, dateField: 'date_scheduling', timeField: 'date_scheduling_time' },
];

export default function ProductionStepsCheckboxes({
  contentId,
  scriptChecked,
  tournageChecked,
  montageChecked,
  planifieChecked,
  dateScript,
  dateScriptTime,
  dateShooting,
  dateShootingTime,
  dateEditing,
  dateEditingTime,
  dateScheduling,
  dateSchedulingTime,
  onUpdate,
  showDates = true,
  compact = false
}: ProductionStepsCheckboxesProps) {
  const [updating, setUpdating] = useState(false);
  const [currentValues, setCurrentValues] = useState({
    script_checked: scriptChecked,
    tournage_checked: tournageChecked,
    montage_checked: montageChecked,
    planifie_checked: planifieChecked
  });

  useEffect(() => {
    setCurrentValues({
      script_checked: scriptChecked,
      tournage_checked: tournageChecked,
      montage_checked: montageChecked,
      planifie_checked: planifieChecked
    });
  }, [scriptChecked, tournageChecked, montageChecked, planifieChecked]);

  const handleCheckboxChange = async (stepKey: string, currentValue: boolean) => {
    if (updating) return;

    setUpdating(true);
    try {
      const newValue = !currentValue;
      const updates: Record<string, boolean> = {};

      const stepOrder = ['script_checked', 'tournage_checked', 'montage_checked', 'planifie_checked'];
      const currentStepIndex = stepOrder.indexOf(stepKey);

      if (newValue) {
        for (let i = 0; i <= currentStepIndex; i++) {
          updates[stepOrder[i]] = true;
        }
      } else {
        for (let i = currentStepIndex; i < stepOrder.length; i++) {
          updates[stepOrder[i]] = false;
        }
      }

      const { error, data } = await supabase
        .from('content_calendar')
        .update(updates)
        .eq('id', contentId)
        .select();

      if (error) {
        console.error('Error updating checkbox - Full error:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }

      console.log('Update successful:', data);

      setCurrentValues(prev => ({
        ...prev,
        ...updates
      }));

      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Error updating checkbox:', error);
      alert(`Erreur lors de la mise à jour: ${error.message || 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const isStepLate = (dateStr?: string, timeStr?: string, isChecked?: boolean): boolean => {
    if (isChecked || !dateStr) return false;

    const stepDate = new Date(dateStr);
    const now = new Date();

    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      stepDate.setHours(hours, minutes, 0, 0);
      now.setMilliseconds(0);
      return now > stepDate;
    }

    stepDate.setHours(23, 59, 59, 999);
    return now > stepDate;
  };

  const getStepDate = (step: ProductionStep): string | undefined => {
    switch (step.dateField) {
      case 'date_script': return dateScript;
      case 'date_shooting': return dateShooting;
      case 'date_editing': return dateEditing;
      case 'date_scheduling': return dateScheduling;
      default: return undefined;
    }
  };

  const getStepTime = (step: ProductionStep): string | undefined => {
    switch (step.timeField) {
      case 'date_script_time': return dateScriptTime;
      case 'date_shooting_time': return dateShootingTime;
      case 'date_editing_time': return dateEditingTime;
      case 'date_scheduling_time': return dateSchedulingTime;
      default: return undefined;
    }
  };

  const formatDateTime = (dateStr?: string, timeStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    return timeStr ? `${formatted} à ${timeStr}` : formatted;
  };

  const hasProductionDates = dateScript || dateShooting || dateEditing || dateScheduling;

  if (!hasProductionDates) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {PRODUCTION_STEPS.map((step) => {
          const Icon = step.icon;
          const isChecked = currentValues[step.key];
          const stepDate = getStepDate(step);
          const stepTime = getStepTime(step);
          const isLate = isStepLate(stepDate, stepTime, isChecked);

          if (!stepDate) return null;

          return (
            <button
              key={step.key}
              onClick={() => handleCheckboxChange(step.key, isChecked)}
              disabled={updating}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
                transition-all duration-200
                ${isChecked
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : isLate
                  ? 'bg-red-50 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }
                ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isChecked ? (
                <CheckCircle className="w-3 h-3" />
              ) : isLate ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <Icon className="w-3 h-3" />
              )}
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {PRODUCTION_STEPS.map((step) => {
        const Icon = step.icon;
        const isChecked = currentValues[step.key];
        const stepDate = getStepDate(step);
        const stepTime = getStepTime(step);
        const isLate = isStepLate(stepDate, stepTime, isChecked);

        if (!stepDate) return null;

        return (
          <div key={step.key} className="flex items-center gap-3">
            <button
              onClick={() => handleCheckboxChange(step.key, isChecked)}
              disabled={updating}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg font-medium
                transition-all duration-200 flex-1
                ${isChecked
                  ? 'bg-green-50 text-green-700 border-2 border-green-300'
                  : isLate
                  ? 'bg-red-50 text-red-700 border-2 border-red-300'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                }
                ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isChecked ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : isLate ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-400 rounded" />
              )}
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{step.label}</span>
              {isLate && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  En retard
                </span>
              )}
            </button>
            {showDates && (
              <div className={`text-sm ${isLate ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                {formatDateTime(stepDate, stepTime)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
