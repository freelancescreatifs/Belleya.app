import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Subproject {
  id: string;
  name: string;
  color: string;
  project_id: string;
}

interface SubprojectSelectorProps {
  projectId: string | null;
  value: string | null;
  onChange: (subprojectId: string | null) => void;
  className?: string;
}

export default function SubprojectSelector({
  projectId,
  value,
  onChange,
  className = '',
}: SubprojectSelectorProps) {
  const [subprojects, setSubprojects] = useState<Subproject[]>([]);

  useEffect(() => {
    if (projectId) {
      loadSubprojects();
    } else {
      setSubprojects([]);
    }
  }, [projectId]);

  async function loadSubprojects() {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('subprojects')
        .select('id, name, color, project_id')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) throw error;
      setSubprojects(data || []);
    } catch (error) {
      console.error('Error loading subprojects:', error);
    }
  }

  if (!projectId || subprojects.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Sous-projet (optionnel)
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
      >
        <option value="">Aucun sous-projet</option>
        {subprojects.map((subproject) => (
          <option key={subproject.id} value={subproject.id}>
            {subproject.name}
          </option>
        ))}
      </select>
      {value && (
        <div className="mt-2 flex items-center gap-2">
          {subprojects.find((sp) => sp.id === value) && (
            <>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: subprojects.find((sp) => sp.id === value)?.color }}
              />
              <span className="text-sm text-gray-600">
                {subprojects.find((sp) => sp.id === value)?.name}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
