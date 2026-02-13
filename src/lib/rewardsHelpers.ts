import { supabase } from './supabase';

export interface RewardSubmission {
  id: string;
  provider_id: string;
  mission_type: 'follow_comment' | 'video_review';
  status: 'pending' | 'approved' | 'rejected';
  instagram_handle?: string;
  proof_image_url?: string;
  comment_text?: string;
  comment_post_url?: string;
  video_url?: string;
  video_storage_url?: string;
  consent_commercial?: boolean;
  admin_note?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LandingReview {
  id: string;
  submission_id?: string;
  provider_id: string;
  display_name: string;
  job_title?: string;
  avatar_url?: string;
  video_url: string;
  quote?: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
}

export async function getProviderSubmissions(providerId: string): Promise<RewardSubmission[]> {
  const { data, error } = await supabase
    .from('belleya_rewards_submissions')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createFollowCommentSubmission(
  providerId: string,
  data: {
    instagram_handle: string;
    proof_image_url: string;
    comment_text: string;
    comment_post_url?: string;
  }
): Promise<RewardSubmission> {
  const { data: submission, error } = await supabase
    .from('belleya_rewards_submissions')
    .insert({
      provider_id: providerId,
      mission_type: 'follow_comment',
      instagram_handle: data.instagram_handle,
      proof_image_url: data.proof_image_url,
      comment_text: data.comment_text,
      comment_post_url: data.comment_post_url,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return submission;
}

export async function createVideoReviewSubmission(
  providerId: string,
  data: {
    video_url?: string;
    video_storage_url?: string;
    consent_commercial: boolean;
    instagram_handle?: string;
  }
): Promise<RewardSubmission> {
  const { data: submission, error } = await supabase
    .from('belleya_rewards_submissions')
    .insert({
      provider_id: providerId,
      mission_type: 'video_review',
      video_url: data.video_url,
      video_storage_url: data.video_storage_url,
      consent_commercial: data.consent_commercial,
      instagram_handle: data.instagram_handle,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return submission;
}

export async function uploadProofImage(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('rewards-proof-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('rewards-proof-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function uploadRewardVideo(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('rewards-videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('rewards-videos')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function getAllSubmissions(): Promise<RewardSubmission[]> {
  const { data, error } = await supabase
    .from('belleya_rewards_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function approveSubmission(
  submissionId: string,
  adminNote?: string
): Promise<void> {
  const { error } = await supabase
    .from('belleya_rewards_submissions')
    .update({
      status: 'approved',
      admin_note: adminNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', submissionId);

  if (error) throw error;
}

export async function rejectSubmission(
  submissionId: string,
  adminNote: string
): Promise<void> {
  const { error } = await supabase
    .from('belleya_rewards_submissions')
    .update({
      status: 'rejected',
      admin_note: adminNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', submissionId);

  if (error) throw error;
}

export async function getPublishedReviews(): Promise<LandingReview[]> {
  const { data, error } = await supabase
    .from('landing_reviews')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAllReviews(): Promise<LandingReview[]> {
  const { data, error } = await supabase
    .from('landing_reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateReviewPublishStatus(
  reviewId: string,
  isPublished: boolean
): Promise<void> {
  const { error } = await supabase
    .from('landing_reviews')
    .update({ is_published: isPublished })
    .eq('id', reviewId);

  if (error) throw error;
}

export async function updateReview(
  reviewId: string,
  updates: Partial<LandingReview>
): Promise<void> {
  const { error } = await supabase
    .from('landing_reviews')
    .update(updates)
    .eq('id', reviewId);

  if (error) throw error;
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from('landing_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}

export async function getFreeMonthsBalance(providerId: string): Promise<number> {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('free_months_balance')
    .eq('id', providerId)
    .single();

  if (error) throw error;
  return data?.free_months_balance || 0;
}
