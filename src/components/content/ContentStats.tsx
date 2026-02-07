import { TrendingUp, Calendar, Target, Film } from 'lucide-react';

interface ContentStatsProps {
  contents: any[];
  startDate?: string;
  endDate?: string;
}

export default function ContentStats({ contents, startDate, endDate }: ContentStatsProps) {
  const filteredContents = contents.filter(c => {
    if (!startDate || !endDate) return true;
    const pubDate = new Date(c.publication_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return pubDate >= start && pubDate <= end;
  });

  const totalContents = filteredContents.length;

  const publishedContents = filteredContents.filter(c => c.status === 'published');
  const weeksWithContent = new Set(
    publishedContents.map(c => {
      const date = new Date(c.publication_date);
      const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
      return week;
    })
  ).size;

  const allWeeks = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 4;

  const objectives = filteredContents.reduce((acc, c) => {
    if (c.objective) {
      acc[c.objective] = (acc[c.objective] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const dominantObjective = Object.entries(objectives).sort((a, b) => b[1] - a[1])[0];
  const dominantObjectiveLabel = dominantObjective ? {
    'attirer': 'Visibilité',
    'éduquer': 'Éducation',
    'convertir': 'Conversion',
    'fidéliser': 'Engagement'
  }[dominantObjective[0]] || dominantObjective[0] : '-';
  const dominantObjectivePercent = dominantObjective
    ? Math.round((dominantObjective[1] / totalContents) * 100)
    : 0;

  const contentTypes = filteredContents.reduce((acc, c) => {
    if (c.content_type) {
      acc[c.content_type] = (acc[c.content_type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const dominantFormat = Object.entries(contentTypes).sort((a, b) => b[1] - a[1])[0];
  const dominantFormatLabel = dominantFormat ? {
    'reel': 'Reel',
    'carrousel': 'Carrousel',
    'post': 'Post statique',
    'story': 'Story',
    'video': 'Vidéo',
    'live': 'Live'
  }[dominantFormat[0]] || dominantFormat[0] : '-';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        Chiffres clés
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Nombre de contenus
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalContents}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Régularité
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {weeksWithContent}/{allWeeks}
          </div>
          <div className="text-xs text-gray-500">semaines actives</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <Target className="w-4 h-4" />
            Objectif principal
          </div>
          <div className="text-lg font-bold text-gray-900">{dominantObjectiveLabel}</div>
          <div className="text-xs text-gray-500">{dominantObjectivePercent}%</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <Film className="w-4 h-4" />
            Format dominant
          </div>
          <div className="text-lg font-bold text-gray-900">{dominantFormatLabel}</div>
        </div>
      </div>
    </div>
  );
}
