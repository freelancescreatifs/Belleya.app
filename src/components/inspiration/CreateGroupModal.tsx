import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Category = 'social_media' | 'salon' | 'service';

interface Props {
  companyId: string;
  category: Category;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateGroupModal({ companyId, category, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const { data: groups } = await supabase
        .from('inspiration_groups')
        .select('display_order')
        .eq('company_id', companyId)
        .eq('category', category)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = groups && groups.length > 0 ? groups[0].display_order + 1 : 0;

      const { error } = await supabase
        .from('inspiration_groups')
        .insert({
          company_id: companyId,
          category,
          name: name.trim(),
          description: description.trim() || null,
          display_order: nextOrder
        });

      if (error) throw error;

      onCreated();
    } catch (error: any) {
      console.error('Error creating group:', error);
      alert(error.message || 'Erreur lors de la création du groupe');
    } finally {
      setCreating(false);
    }
  };

  const getPlaceholders = () => {
    switch (category) {
      case 'social_media':
        return {
          name: 'Ex: Idées Reels, Feed inspiration...',
          description: 'Contenu pour mon compte Instagram...'
        };
      case 'salon':
        return {
          name: 'Ex: Réalisations, Ambiance salon...',
          description: 'Photos de mon salon et mes créations...'
        };
      case 'service':
        return {
          name: 'Ex: Ongles, Cils, Soins...',
          description: 'Inspirations pour ce type de prestation...'
        };
    }
  };

  const placeholders = getPlaceholders();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-5 md:p-7 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-0.5">Nouveau groupe</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-7 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du groupe *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent text-sm md:text-base"
              placeholder={placeholders.name}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent text-sm md:text-base"
              rows={3}
              placeholder={placeholders.description}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="flex-1 px-4 py-2 bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary transition-colors disabled:opacity-50 text-sm md:text-base font-medium"
            >
              {creating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
