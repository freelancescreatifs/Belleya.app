import { supabase } from './supabase';

export function generateSlug(text: string): string {
  let slug = text.toLowerCase().trim();

  slug = slug.replace(/[àáâãäå]/g, 'a');
  slug = slug.replace(/[èéêë]/g, 'e');
  slug = slug.replace(/[ìíîï]/g, 'i');
  slug = slug.replace(/[òóôõö]/g, 'o');
  slug = slug.replace(/[ùúûü]/g, 'u');
  slug = slug.replace(/[ç]/g, 'c');
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');

  return slug || 'salon';
}

export async function generateUniqueBookingSlug(
  companyName: string,
  userId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_booking_slug', {
    company_name_param: companyName,
    user_id_param: userId,
  });

  if (error) {
    console.error('Error generating unique slug:', error);
    return generateSlug(companyName);
  }

  return data;
}

export async function updateBookingSlug(
  userId: string,
  companyName: string
): Promise<string | null> {
  try {
    const newSlug = await generateUniqueBookingSlug(companyName, userId);

    const { error } = await supabase
      .from('company_profiles')
      .update({ booking_slug: newSlug })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating booking slug:', error);
      return null;
    }

    return newSlug;
  } catch (error) {
    console.error('Error in updateBookingSlug:', error);
    return null;
  }
}

export function getBookingUrl(slug: string): string {
  return `https://belaya.app/book/${slug}`;
}
