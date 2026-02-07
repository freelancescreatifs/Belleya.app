import { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface MenuVisibility {
  dashboard: boolean;
  agenda: boolean;
  clients: boolean;
  training: boolean;
  services: boolean;
  finances: boolean;
  stock: boolean;
  tasks: boolean;
  goals: boolean;
  content: boolean;
  'public-profile': boolean;
  inspiration: boolean;
  marketing: boolean;
  partnerships: boolean;
}

interface SocialViews {
  viewByPostType: boolean;
  productionCalendar: boolean;
}

const defaultMenuVisibility: MenuVisibility = {
  dashboard: true,
  agenda: true,
  clients: true,
  training: true,
  services: true,
  finances: true,
  stock: true,
  tasks: true,
  goals: true,
  content: true,
  'public-profile': true,
  inspiration: true,
  marketing: true,
  partnerships: true,
};

const defaultSocialViews: SocialViews = {
  viewByPostType: false,
  productionCalendar: false,
};

export function useMenuPreferences(userId: string | undefined) {
  const [menuVisibility, setMenuVisibility] = useState<MenuVisibility>(defaultMenuVisibility);
  const [socialViews, setSocialViews] = useState<SocialViews>(defaultSocialViews);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadPreferences();

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.menuVisibility) {
        setMenuVisibility(customEvent.detail.menuVisibility);
      }
      if (customEvent.detail?.socialViews) {
        setSocialViews(customEvent.detail.socialViews);
      }
    };

    window.addEventListener('menuPreferencesUpdated', handleUpdate);

    return () => {
      window.removeEventListener('menuPreferencesUpdated', handleUpdate);
    };
  }, [userId]);

  const loadPreferences = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('menu_preferences')
        .select('menu_visibility, social_views')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setMenuVisibility(data.menu_visibility as MenuVisibility);
        if (data.social_views) {
          setSocialViews(data.social_views as SocialViews);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
    } finally {
      setLoading(false);
    }
  };

  return { menuVisibility, socialViews, loading };
}
