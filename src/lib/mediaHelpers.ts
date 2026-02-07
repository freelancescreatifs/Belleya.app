import { supabase } from './supabase';

export type MediaType = 'image' | 'video' | 'carousel';

export interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export async function uploadMedia(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('content-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('content-media')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading media:', error);
    return null;
  }
}

export async function uploadMultipleMedia(
  userId: string,
  files: File[]
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadMedia(userId, file));
  const results = await Promise.all(uploadPromises);
  return results.filter(url => url !== null) as string[];
}

export async function deleteMedia(url: string, userId: string): Promise<boolean> {
  try {
    const urlParts = url.split('/');
    const fileName = `${userId}/${urlParts[urlParts.length - 1]}`;

    const { error } = await supabase.storage
      .from('content-media')
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
}

export function getMediaType(files: MediaFile[]): MediaType {
  if (files.length === 0) return 'image';

  const hasVideo = files.some(f => f.type === 'video');
  if (hasVideo) return 'video';

  if (files.length > 1) return 'carousel';

  return 'image';
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeFilePreview(preview: string): void {
  URL.revokeObjectURL(preview);
}

export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024;

  if (file.size > maxSize) {
    return { valid: false, error: 'Le fichier est trop volumineux (max 50MB)' };
  }

  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non supporté' };
  }

  return { valid: true };
}

export async function urlToMediaFile(url: string): Promise<MediaFile | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const fileName = url.split('/').pop() || 'media';
    const file = new File([blob], fileName, { type: blob.type });

    const type = blob.type.startsWith('video/') ? 'video' : 'image';

    return {
      file,
      preview: url,
      type
    };
  } catch (error) {
    console.error('Error converting URL to MediaFile:', error);
    return null;
  }
}

export async function urlsToMediaFiles(urls: string[]): Promise<MediaFile[]> {
  const promises = urls.map(url => urlToMediaFile(url));
  const results = await Promise.all(promises);
  return results.filter(file => file !== null) as MediaFile[];
}
