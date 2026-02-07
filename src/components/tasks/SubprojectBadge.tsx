import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Subproject {
  id: string;
  name: string;
  color: string;
}

interface SubprojectBadgeProps {
  subprojectId: string | null;
}

export default function SubprojectBadge({ subprojectId }: SubprojectBadgeProps) {
  const [subproject, setSubproject] = useState<Subproject | null>(null);

  useEffect(() => {
    if (subprojectId) {
      loadSubproject();
    }
  }, [subprojectId]);

  async function loadSubproject() {
    if (!subprojectId) return;

    try {
      const { data, error } = await supabase
        .from('subprojects')
        .select('id, name, color')
        .eq('id', subprojectId)
        .maybeSingle();

      if (error) throw error;
      setSubproject(data);
    } catch (error) {
      console.error('Error loading subproject:', error);
    }
  }

  if (!subproject) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-white"
      style={{ backgroundColor: subproject.color }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full bg-white opacity-70"
      />
      {subproject.name}
    </div>
  );
}
