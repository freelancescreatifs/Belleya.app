import { supabase } from './supabase';

export const DEFAULT_PRESTATION_CATEGORIES = [
  'Ongles', 'Cils', 'Soins', 'Manucure', 'Pédicure', 'Pose', 'Remplissage', 'Autre'
] as const;

export const DEFAULT_FORMATION_CATEGORIES = [
  'Ongles', 'Cils', 'Pédicure', 'Manucure', 'Business', 'Marketing', 'Technique', 'Autre'
] as const;

export const SERVICE_CATEGORIES = DEFAULT_PRESTATION_CATEGORIES;

export type ServiceCategory = string;

export interface CustomCategory {
  id: string;
  name: string;
  display_order: number;
}

export async function fetchUserCategories(userId: string): Promise<CustomCategory[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name, display_order')
    .eq('user_id', userId)
    .order('display_order')
    .order('name');

  if (error || !data) return [];
  return data;
}

export async function fetchCategoriesByProviderUserId(userId: string): Promise<string[]> {
  const categories = await fetchUserCategories(userId);
  if (categories.length > 0) {
    return categories.map(c => c.name);
  }
  const { data } = await supabase
    .from('services')
    .select('category')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!data) return [];
  return [...new Set(data.map(s => s.category).filter(Boolean))].sort();
}

export async function createCategory(userId: string, name: string): Promise<CustomCategory | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from('service_categories')
    .insert({ user_id: userId, name: trimmed })
    .select('id, name, display_order')
    .single();

  if (error) {
    if (error.code === '23505') return null;
    console.error('Error creating category:', error);
    return null;
  }
  return data;
}

export async function deleteCategory(categoryId: string): Promise<boolean> {
  const { error } = await supabase
    .from('service_categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }
  return true;
}
