import { Image as ImageIcon, Award, MessageSquare, FileText, AlertCircle } from 'lucide-react';

interface InstituteTabContentProps {
  institutePhotos: Array<{ id: string; url: string; order: number }>;
  diplomas?: Array<{ id: string; name: string; year?: string }>;
  conditions?: Array<{ id: string; text: string }>;
  welcomeMessage?: string;
  bookingInstructions?: string;
  cancellationPolicy?: string;
  compact?: boolean;
}

export default function InstituteTabContent({
  institutePhotos,
  diplomas = [],
  conditions = [],
  welcomeMessage,
  bookingInstructions,
  cancellationPolicy,
  compact = false,
}: InstituteTabContentProps) {
  const hasPhotos = institutePhotos.length > 0;
  const hasDiplomas = diplomas.filter(d => d.name?.trim()).length > 0;
  const hasConditions = conditions.filter(c => c.text?.trim()).length > 0;
  const hasWelcome = !!welcomeMessage?.trim();
  const hasInstructions = !!bookingInstructions?.trim();
  const hasCancellation = !!cancellationPolicy?.trim();
  const hasAnyContent = hasPhotos || hasDiplomas || hasConditions || hasWelcome || hasInstructions || hasCancellation;

  if (!hasAnyContent) {
    return (
      <div className="text-center py-12">
        <ImageIcon className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} text-gray-300 mx-auto mb-4`} />
        <p className="text-gray-600">Aucune information sur l'institut</p>
      </div>
    );
  }

  const photoGridCols = compact ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3';
  const photoGap = compact ? 'gap-2' : 'gap-4';
  const sectionSpacing = compact ? 'space-y-4' : 'space-y-6';
  const titleSize = compact ? 'text-sm' : 'text-base';
  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={sectionSpacing}>
      {hasPhotos && (
        <div>
          <h4 className={`font-bold text-gray-900 mb-3 flex items-center gap-2 ${titleSize}`}>
            <ImageIcon className="w-4 h-4 text-brand-500" />
            Photos de l'institut
          </h4>
          <div className={`grid ${photoGridCols} ${photoGap}`}>
            {(compact ? institutePhotos.slice(0, 6) : institutePhotos).map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden">
                <img
                  src={photo.url}
                  alt="Institut"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {hasWelcome && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
          <h4 className={`font-bold text-gray-900 mb-2 flex items-center gap-2 ${titleSize}`}>
            <MessageSquare className="w-4 h-4 text-brand-500" />
            Message d'accueil
          </h4>
          <p className={`text-gray-700 leading-relaxed ${textSize}`}>{welcomeMessage}</p>
        </div>
      )}

      {hasInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className={`font-bold text-gray-900 mb-2 flex items-center gap-2 ${titleSize}`}>
            <FileText className="w-4 h-4 text-blue-500" />
            Instructions de reservation
          </h4>
          <p className={`text-gray-700 leading-relaxed ${textSize}`}>{bookingInstructions}</p>
        </div>
      )}

      {hasDiplomas && (
        <div>
          <h4 className={`font-bold text-gray-900 mb-3 flex items-center gap-2 ${titleSize}`}>
            <Award className="w-4 h-4 text-amber-500" />
            Diplomes & Certificats
          </h4>
          <div className={compact ? 'space-y-1' : 'space-y-2'}>
            {diplomas.filter(d => d.name?.trim()).map((diploma) => (
              <div
                key={diploma.id}
                className={`flex items-center gap-2 ${compact ? 'p-2' : 'p-3'} bg-amber-50 border border-amber-200 rounded-lg`}
              >
                <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className={`text-gray-800 font-medium ${textSize}`}>{diploma.name}</span>
                {diploma.year && (
                  <span className={`ml-auto text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium ${compact ? 'text-xs' : 'text-xs'}`}>
                    {diploma.year}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCancellation && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h4 className={`font-bold text-gray-900 mb-2 flex items-center gap-2 ${titleSize}`}>
            <AlertCircle className="w-4 h-4 text-gray-500" />
            Politique d'annulation
          </h4>
          <p className={`text-gray-700 leading-relaxed ${textSize}`}>{cancellationPolicy}</p>
        </div>
      )}

      {hasConditions && (
        <div>
          <h4 className={`font-bold text-gray-900 mb-3 flex items-center gap-2 ${titleSize}`}>
            <FileText className="w-4 h-4 text-gray-500" />
            Conditions generales
          </h4>
          <div className={compact ? 'space-y-1' : 'space-y-2'}>
            {conditions.filter(c => c.text?.trim()).map((condition) => (
              <div
                key={condition.id}
                className={`flex items-start gap-2 ${compact ? 'p-2' : 'p-3'} bg-gray-50 border border-gray-200 rounded-lg`}
              >
                <span className="text-brand-400 mt-0.5">&#8226;</span>
                <p className={`text-gray-700 ${textSize}`}>{condition.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
