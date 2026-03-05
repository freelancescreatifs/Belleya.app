import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, Check, Loader2, Flame, ExternalLink } from 'lucide-react';

interface AdminNotif {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  priority: string;
  related_id: string | null;
  created_at: string;
}

export default function AdminNotifications({ onRead }: { onRead: () => void }) {
  const [notifications, setNotifications] = useState<AdminNotif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setNotifications(data || []);
        setLoading(false);
      });
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    onRead();
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    await supabase.from('admin_notifications').update({ is_read: true }).in('id', unread.map(n => n.id));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllRead} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            <Check className="w-4 h-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border p-4 transition-colors ${
                n.is_read ? 'border-gray-200' : 'border-brand-200 bg-brand-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  n.type === 'affiliate_conversion' ? 'bg-emerald-100' :
                  n.priority === 'high' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {n.type === 'affiliate_conversion' ? (
                    <Flame className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Bell className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {new Date(n.created_at).toLocaleDateString('fr-FR')} - {new Date(n.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {n.link && (
                      <a href={n.link} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
                        Voir <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {!n.is_read && (
                      <button onClick={() => markAsRead(n.id)} className="text-xs text-gray-500 hover:text-gray-700">
                        Marquer lu
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
