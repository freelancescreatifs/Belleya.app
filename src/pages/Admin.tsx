import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Users, Bell, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AffiliatePartnersTab from '../components/admin/AffiliatePartnersTab';
import AdminNotifications from '../components/admin/AdminNotifications';
import LoadingScreen from '../components/shared/LoadingScreen';

export default function Admin() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'affiliates' | 'notifications'>('affiliates');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count || 0));
  }, [user]);

  if (authLoading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Belaya</h1>
            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={async () => { await signOut(); navigate('/login'); }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 border-b border-gray-200 mt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'affiliates' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1.5" />
            Affilies Belaya
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'notifications' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-1.5" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'affiliates' && <AffiliatePartnersTab />}
        {activeTab === 'notifications' && <AdminNotifications onRead={() => setUnreadCount(c => Math.max(0, c - 1))} />}
      </div>
    </div>
  );
}
