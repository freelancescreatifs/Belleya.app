import { useState, useEffect } from 'react';
import { Calendar, Lightbulb, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Marronnier {
  id: string;
  date: string;
  title: string;
  theme: string;
  industry: string[];
  suggestions: { title: string; type: string }[];
  is_global: boolean;
}

export default function MarronniersCalendar() {
  const { user } = useAuth();
  const [marronniers, setMarronniers] = useState<Marronnier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user) {
      loadMarronniers();
    }
  }, [user, selectedMonth]);

  async function loadMarronniers() {
    if (!user) return;

    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('marronniers')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      setMarronniers(data || []);
    } catch (error) {
      console.error('Error loading marronniers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAlert(marronnier: Marronnier) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('content_alerts')
        .insert([{
          user_id: user.id,
          alert_type: 'marronnier',
          title: `${marronnier.title} approche`,
          message: `Le ${new Date(marronnier.date).toLocaleDateString('fr-FR')} : ${marronnier.theme}. Pensez à préparer votre contenu !`,
          related_date: marronnier.date,
          status: 'active'
        }]);

      if (error) throw error;
      alert('Alerte créée avec succès !');
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Erreur lors de la création de l\'alerte');
    }
  }

  async function handleAddToCalendar(marronnier: Marronnier, suggestion: { title: string; type: string }) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('content_calendar')
        .insert([{
          user_id: user.id,
          title: suggestion.title,
          description: `${marronnier.title} - ${marronnier.theme}`,
          content_type: suggestion.type,
          platform: 'instagram',
          publication_date: marronnier.date,
          status: 'idea',
          notes: `Marronnier : ${marronnier.title}`
        }]);

      if (error) throw error;
      alert('Ajouté au calendrier éditorial !');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      alert('Erreur lors de l\'ajout au calendrier');
    }
  }

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Calendrier des marronniers</h2>
          <p className="text-sm text-gray-600 mt-1">
            Dates clés et événements pour inspirer votre contenu
          </p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          {months.map((month, index) => (
            <option key={index} value={index + 1}>
              {month} {selectedYear}
            </option>
          ))}
        </select>
      </div>

      {marronniers.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun marronnier ce mois-ci</p>
        </div>
      ) : (
        <div className="space-y-4">
          {marronniers.map((marronnier) => {
            const marDate = new Date(marronnier.date);
            const today = new Date();
            const daysUntil = Math.ceil((marDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isUpcoming = daysUntil > 0 && daysUntil <= 14;

            return (
              <div
                key={marronnier.id}
                className={`p-5 rounded-xl border-2 transition-all ${
                  isUpcoming
                    ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-pink-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className={`text-3xl font-bold ${isUpcoming ? 'text-orange-600' : 'text-gray-900'}`}>
                      {marDate.getDate()}
                    </div>
                    <div className="text-xs text-gray-600 uppercase">
                      {months[marDate.getMonth()].slice(0, 4)}
                    </div>
                    {isUpcoming && (
                      <div className="mt-2 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium">
                        Dans {daysUntil}j
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{marronnier.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{marronnier.theme}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {marronnier.industry.map((ind, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                              {ind === 'beauty' ? 'Beauté' :
                               ind === 'formation' ? 'Formation' : 'Général'}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isUpcoming && (
                        <button
                          onClick={() => handleCreateAlert(marronnier)}
                          className="px-3 py-1.5 bg-white border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Créer une alerte
                        </button>
                      )}
                    </div>

                    {marronnier.suggestions && marronnier.suggestions.length > 0 && (
                      <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-semibold text-gray-900">Idées de contenu</span>
                        </div>
                        <div className="space-y-2">
                          {marronnier.suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-700">{suggestion.title}</span>
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                  {suggestion.type}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddToCalendar(marronnier, suggestion)}
                                className="px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all text-xs font-medium"
                              >
                                Ajouter
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Conseils d'utilisation</p>
            <ul className="list-disc list-inside opacity-90 space-y-1">
              <li>Préparez votre contenu 7 à 14 jours avant la date</li>
              <li>Créez des alertes pour ne rien oublier</li>
              <li>Adaptez les suggestions à votre style et votre audience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
