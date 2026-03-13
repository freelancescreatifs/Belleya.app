import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import BelayaLoader from '../components/shared/BelayaLoader';

export default function DiagAuth() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);

      if (sessionData.session?.user) {
        const userId = sessionData.session.user.id;

        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) {
          setError(`Profile error: ${profileError.message}`);
        } else {
          setProfile(profileData);

          if (profileData?.company_id) {
            const { data: companyData, error: companyError } = await supabase
              .from('company_profiles')
              .select('*')
              .eq('id', profileData.company_id)
              .maybeSingle();

            if (companyError) {
              setError(`Company error: ${companyError.message}`);
            } else {
              setCompany(companyData);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await loadData();
    } catch (err: any) {
      setError(`Login error: ${err.message}`);
    }
  };

  if (loading) {
    return <BelayaLoader variant="full" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Diagnostic Auth</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">Session</h2>
          {session ? (
            <div className="space-y-2 text-sm">
              <p><strong>User ID:</strong> {session.user.id}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Created:</strong> {new Date(session.user.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-gray-500">Non connecté</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">User Profile</h2>
          {profile ? (
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {profile.id}</p>
              <p><strong>User ID:</strong> {profile.user_id}</p>
              <p><strong>Role:</strong> {profile.role}</p>
              <p><strong>Nom:</strong> {profile.first_name} {profile.last_name}</p>
              <p><strong>Company ID:</strong> {profile.company_id || 'null'}</p>
            </div>
          ) : (
            <p className="text-gray-500">Aucun profil trouvé</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">Company Profile</h2>
          {company ? (
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {company.id}</p>
              <p><strong>User ID:</strong> {company.user_id}</p>
              <p><strong>Nom:</strong> {company.company_name}</p>
              <p><strong>Type:</strong> {company.activity_type}</p>
            </div>
          ) : (
            <p className="text-gray-500">Aucun profil entreprise trouvé</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Recharger
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              await loadData();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
