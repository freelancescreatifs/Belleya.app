import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import i18n from '../i18n';

export interface UserProfile {
  id: string;
  user_id: string;
  role: 'client' | 'pro' | 'admin';
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  photo_url: string | null;
  company_id: string | null;
  preferred_language: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'client' | 'pro', firstName?: string, lastName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signInWithGoogle: (role: 'client' | 'pro') => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);
  const profileLoadingRef = useRef(false);

  const loadProfile = useCallback(async (userId: string) => {
    if (profileLoadingRef.current) return;
    profileLoadingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[LoadProfile] Error:', error.message);
        setProfile(null);
        return;
      }

      if (data) {
        if (data.preferred_language && data.preferred_language !== i18n.language) {
          await i18n.changeLanguage(data.preferred_language);
        }
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('[LoadProfile] Exception loading profile:', err);
      setProfile(null);
    } finally {
      profileLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        currentUserIdRef.current = session.user.id;
        await loadProfile(session.user.id);
      } else {
        currentUserIdRef.current = null;
        setProfile(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        return;
      }

      const newUserId = session?.user?.id ?? null;

      if (event === 'SIGNED_IN' && newUserId === currentUserIdRef.current) {
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        currentUserIdRef.current = session.user.id;
        if (!profileLoadingRef.current) {
          loadProfile(session.user.id);
        }
      } else {
        currentUserIdRef.current = null;
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = async (
    email: string,
    password: string,
    role: 'client' | 'pro',
    firstName?: string,
    lastName?: string
  ) => {
    try {
      console.log('[SignUp] Starting signup process with role:', role);
      console.log('[SignUp] Email:', email);
      console.log('[SignUp] First name:', firstName);
      console.log('[SignUp] Last name:', lastName);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            first_name: firstName || null,
            last_name: lastName || null,
          }
        }
      });

      if (error) {
        console.error('[SignUp] ❌ SIGNUP FAILED - Supabase auth.signUp error:');
        console.error('[SignUp] Error message:', error.message);
        console.error('[SignUp] Error status:', error.status);
        console.error('[SignUp] Error name:', error.name);
        console.error('[SignUp] Full error object:', JSON.stringify(error, null, 2));

        if (error.message.includes('Database error')) {
          throw new Error(
            `Erreur de base de données lors de l'inscription. ` +
            `Détails: ${error.message}. ` +
            `Veuillez contacter le support si le problème persiste.`
          );
        }

        throw error;
      }

      if (data.user) {
        const refCode = localStorage.getItem('belaya_ref');
        if (refCode) {
          try {
            await supabase.rpc('attribute_affiliate_signup', {
              p_ref_code: refCode,
              p_first_name: firstName || null,
            });
            localStorage.removeItem('belaya_ref');
            localStorage.removeItem('belaya_ref_date');
          } catch (refErr) {
            console.error('[SignUp] Error attributing affiliate:', refErr);
          }
        }

        const maxRetries = 5;
        let retryCount = 0;
        let profileLoaded = false;

        while (retryCount < maxRetries && !profileLoaded) {
          const delay = 500 + (retryCount * 500);
          await new Promise(resolve => setTimeout(resolve, delay));

          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (profileError) {
            console.error(`[SignUp] Error checking profile (retry ${retryCount + 1}):`, profileError);
          } else if (profileData) {
            setProfile(profileData);
            profileLoaded = true;
          }

          retryCount++;
        }
      }
    } catch (err: any) {
      console.error('[SignUp] ❌ SIGNUP PROCESS FAILED');
      console.error('[SignUp] Error type:', typeof err);
      console.error('[SignUp] Error name:', err?.name);
      console.error('[SignUp] Error message:', err?.message);
      console.error('[SignUp] Error stack:', err?.stack);
      console.error('[SignUp] Full error:', err);

      throw new Error(err?.message || 'Erreur lors de l\'inscription');
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[SignIn] Error loading profile:', profileError);
        console.error('[SignIn] Profile error details:', profileError.message);
        // Ne pas bloquer la connexion si le profil n'est pas accessible
        // Le loadProfile dans useEffect s'occupera de le charger
        return null;
      }

      if (profileData) {
        console.log('[SignIn] Profile loaded successfully:', profileData.role);
        return profileData;
      } else {
        console.warn('[SignIn] No profile found for user:', data.user.id);
        return null;
      }
    }

    return null;
  };

  const signInWithGoogle = async (role: 'client' | 'pro') => {
    try {
      console.log('[SignInWithGoogle] Starting Google OAuth with role:', role);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          data: {
            role,
          }
        }
      });

      if (error) {
        console.error('[SignInWithGoogle] Error:', error);
        throw error;
      }

      console.log('[SignInWithGoogle] OAuth initiated successfully');
    } catch (err: any) {
      console.error('[SignInWithGoogle] Exception:', err);
      throw new Error(err?.message || 'Erreur lors de la connexion avec Google');
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      setProfile(null);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erreur Supabase signOut:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
