import { Clock, CheckCircle, XCircle } from 'lucide-react';
import PieChart from './PieChart';

interface ContentDetailedStatsProps {
  contents: any[];
  startDate?: string;
  endDate?: string;
}

export default function ContentDetailedStats({ contents, startDate, endDate }: ContentDetailedStatsProps) {
  const filteredContents = contents.filter(c => {
    if (!startDate || !endDate) return true;
    const pubDate = new Date(c.publication_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return pubDate >= start && pubDate <= end;
  });

  const contentTypeData = Object.entries(
    filteredContents.reduce((acc, c) => {
      const type = c.content_type || 'post';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, value], index) => ({
    label: {
      'reel': 'Reels',
      'carrousel': 'Carrousels',
      'post': 'Posts statiques',
      'story': 'Stories',
      'video': 'Vidéos',
      'live': 'Lives'
    }[key] || key,
    value,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
  }));

  const objectiveData = Object.entries(
    filteredContents.reduce((acc, c) => {
      const obj = c.objective || 'attirer';
      acc[obj] = (acc[obj] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, value]) => ({
    label: {
      'attirer': 'Visibilité',
      'éduquer': 'Éducation',
      'convertir': 'Conversion',
      'fidéliser': 'Engagement'
    }[key] || key,
    value,
    color: {
      'attirer': '#3b82f6',
      'éduquer': '#10b981',
      'convertir': '#f59e0b',
      'fidéliser': '#ec4899'
    }[key] || '#gray-400'
  }));

  const pillarData = Object.entries(
    filteredContents.reduce((acc, c) => {
      const pillar = c.editorial_pillar || 'Autre';
      acc[pillar] = (acc[pillar] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, value], index) => ({
    label: key,
    value,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'][index % 6]
  }));

  const platformData = Object.entries(
    filteredContents.reduce((acc, c) => {
      const platform = c.platform || 'instagram';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, value], index) => ({
    label: {
      'instagram': 'Instagram',
      'tiktok': 'TikTok',
      'linkedin': 'LinkedIn',
      'facebook': 'Facebook',
      'youtube': 'YouTube',
      'twitter': 'Twitter'
    }[key] || key,
    value,
    color: ['#E1306C', '#000000', '#0077B5', '#1877F2', '#FF0000', '#1DA1F2'][index % 6]
  }));

  const statusData = Object.entries(
    filteredContents.reduce((acc, c) => {
      const status = c.status || 'idea';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, value]) => ({
    label: {
      'idea': 'Idée',
      'script': 'En cours',
      'scheduled': 'Programmé',
      'published': 'Publié'
    }[key] || key,
    value,
    color: {
      'idea': '#9ca3af',
      'script': '#f59e0b',
      'scheduled': '#3b82f6',
      'published': '#10b981'
    }[key] || '#gray-400'
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PieChart data={contentTypeData} title="1. Répartition par type de contenu" />
        <PieChart data={objectiveData} title="2. Répartition par objectif" />
        <PieChart data={pillarData} title="3. Répartition par pilier de contenu" />
        <PieChart data={platformData} title="4. Répartition par réseaux" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Workflow & organisation
        </h3>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">Avancement</div>
            <div className="space-y-2">
              {statusData.map((status, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{status.label}</span>
                      <span className="text-sm font-medium text-gray-900">{status.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(status.value / filteredContents.length) * 100}%`,
                          backgroundColor: status.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 text-xs mb-1">
                <CheckCircle className="w-3 h-3" />
                Publiés
              </div>
              <div className="text-xl font-bold text-green-900">
                {filteredContents.filter(c => c.status === 'published').length}
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 text-xs mb-1">
                <XCircle className="w-3 h-3" />
                En retard
              </div>
              <div className="text-xl font-bold text-red-900">
                {filteredContents.filter(c => {
                  if (c.status === 'published') return false;
                  const pubDate = new Date(c.publication_date);
                  return pubDate < new Date();
                }).length}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
