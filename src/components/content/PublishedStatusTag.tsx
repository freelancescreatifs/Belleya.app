import { CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PublishedStatusTagProps {
  scriptChecked: boolean;
  tournageChecked: boolean;
  montageChecked: boolean;
  planifieChecked: boolean;
  publicationDate?: string;
  publicationTime?: string;
  className?: string;
}

export default function PublishedStatusTag({
  scriptChecked,
  tournageChecked,
  montageChecked,
  planifieChecked,
  publicationDate,
  publicationTime,
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

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
        ${isPublished
          ? 'bg-belaya-100 text-belaya-700 border border-belaya-300'
          : 'bg-brand-50 text-brand-700 border border-brand-200'
        }
        ${className}
      `}
    >
      {isPublished ? (
        <>
          <CheckCircle className="w-3 h-3" />
          Publié
        </>
      ) : (
        <>
          <Clock className="w-3 h-3" />
          Non publié
        </>
      )}
    </span>
  );
}
