import { CheckCircle, Clock, FileText, Video, Scissors, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PublishedStatusTagProps {
  scriptChecked: boolean;
  tournageChecked: boolean;
  montageChecked: boolean;
  planifieChecked: boolean;
  publicationDate?: string;
  publicationTime?: string;
  contentType?: string;
  className?: string;
}

const STEP_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  script: { label: 'A Scripter', icon: FileText, color: 'bg-orange-50 text-orange-700 border border-orange-300' },
  shooting: { label: 'A Tourner', icon: Video, color: 'bg-rose-50 text-rose-700 border border-rose-300' },
  editing: { label: 'A Monter', icon: Scissors, color: 'bg-teal-50 text-teal-700 border border-teal-300' },
  scheduling: { label: 'A Planifier', icon: Calendar, color: 'bg-blue-50 text-blue-700 border border-blue-300' },
};

function getRelevantSteps(contentType: string): string[] {
  switch (contentType) {
    case 'post':
    case 'story':
    case 'live':
      return ['script', 'scheduling'];
    case 'carrousel':
      return ['script', 'editing', 'scheduling'];
    case 'reel':
    case 'video':
      return ['script', 'shooting', 'editing', 'scheduling'];
    default:
      return ['script', 'shooting', 'editing', 'scheduling'];
  }
}

function getCheckedMap(scriptChecked: boolean, tournageChecked: boolean, montageChecked: boolean, planifieChecked: boolean): Record<string, boolean> {
  return {
    script: scriptChecked,
    shooting: tournageChecked,
    editing: montageChecked,
    scheduling: planifieChecked,
  };
}

export default function PublishedStatusTag({
  scriptChecked,
  tournageChecked,
  montageChecked,
  planifieChecked,
  publicationDate,
  publicationTime,
  contentType = 'reel',
  className = ''
}: PublishedStatusTagProps) {
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const checkPublishedStatus = () => {
      const allStepsChecked = scriptChecked && tournageChecked && montageChecked && planifieChecked;

      if (!allStepsChecked) {
        setIsPublished(false);
        return;
      }

      if (!publicationDate) {
        setIsPublished(false);
        return;
      }

      const pubDate = new Date(publicationDate);
      const now = new Date();

      if (publicationTime) {
        const [hours, minutes] = publicationTime.split(':').map(Number);
        pubDate.setHours(hours, minutes, 0, 0);
        now.setMilliseconds(0);
      } else {
        pubDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
      }

      setIsPublished(now >= pubDate);
    };

    checkPublishedStatus();
    const interval = setInterval(checkPublishedStatus, 60000);

    return () => clearInterval(interval);
  }, [scriptChecked, tournageChecked, montageChecked, planifieChecked, publicationDate, publicationTime]);

  if (isPublished) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-belaya-100 text-belaya-700 border border-belaya-300 ${className}`}>
        <CheckCircle className="w-3 h-3" />
        Publie
      </span>
    );
  }

  const checkedMap = getCheckedMap(scriptChecked, tournageChecked, montageChecked, planifieChecked);
  const relevantSteps = getRelevantSteps(contentType);
  const nextStep = relevantSteps.find(step => !checkedMap[step]);

  if (nextStep && STEP_CONFIG[nextStep]) {
    const config = STEP_CONFIG[nextStep];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.color} ${className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 ${className}`}>
      <Clock className="w-3 h-3" />
      Non publie
    </span>
  );
}
