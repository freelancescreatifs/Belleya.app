import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Client {
  id: string;
  name: string;
}

interface ClientSelectorProps {
  value: string;
  onChange: (clientId: string, clientName: string) => void;
  className?: string;
  placeholder?: string;
}

const PAGE_SIZE = 30;

export default function ClientSelector({ value, onChange, className = '', placeholder = 'Sélectionner une cliente' }: ClientSelectorProps) {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isSearching) {
      loadInitialClients();
    }
  }, [isOpen, user]);

  useEffect(() => {
    loadRecentClients();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchClients(searchQuery);
      }, 250);
    } else if (searchQuery.length === 0) {
      setIsSearching(false);
      loadInitialClients();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const loadRecentClients = async () => {
    if (!user || !profile?.company_id) return;

    const storedRecent = localStorage.getItem(`recent_clients_${user.id}`);
    if (storedRecent) {
      try {
        const recentIds = JSON.parse(storedRecent) as string[];

        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name')
          .eq('company_id', profile.company_id)
          .eq('is_archived', false)
          .in('id', recentIds)
          .limit(5);

        if (!error && data) {
          const clientsWithNames = data.map(client => ({
            id: client.id,
            name: `${client.first_name} ${client.last_name}`.trim()
          }));

          const orderedClients = recentIds
            .map(id => clientsWithNames.find(c => c.id === id))
            .filter(c => c !== undefined) as Client[];

          setRecentClients(orderedClients);
        }
      } catch (error) {
        console.error('Error loading recent clients:', error);
      }
    }
  };

  const loadInitialClients = async () => {
    if (!user || !profile?.company_id) return;

    setLoading(true);
    setOffset(0);

    try {
      const { data, error, count } = await supabase
        .from('clients')
        .select('id, first_name, last_name', { count: 'exact' })
        .eq('company_id', profile.company_id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;

      if (data) {
        const clientsWithNames = data.map(client => ({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`.trim()
        }));
        setClients(clientsWithNames);
        setHasMore((count || 0) > PAGE_SIZE);
        setOffset(PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading initial clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreClients = async () => {
    if (!user || !profile?.company_id || loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const { data, error, count } = await supabase
        .from('clients')
        .select('id, first_name, last_name', { count: 'exact' })
        .eq('company_id', profile.company_id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      if (data) {
        const clientsWithNames = data.map(client => ({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`.trim()
        }));
        setClients(prev => [...prev, ...clientsWithNames]);
        setHasMore((count || 0) > offset + PAGE_SIZE);
        setOffset(prev => prev + PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more clients:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const searchClients = async (query: string) => {
    if (!user || !profile?.company_id) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('company_id', profile.company_id)
        .eq('is_archived', false)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      if (data) {
        const clientsWithNames = data.map(client => ({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`.trim()
        }));
        setClients(clientsWithNames);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    onChange(client.id, client.name);
    setIsOpen(false);
    setSearchQuery('');

    if (user) {
      const storedRecent = localStorage.getItem(`recent_clients_${user.id}`);
      let recentIds: string[] = [];

      if (storedRecent) {
        try {
          recentIds = JSON.parse(storedRecent) as string[];
        } catch (e) {
          recentIds = [];
        }
      }

      recentIds = [client.id, ...recentIds.filter(id => id !== client.id)].slice(0, 5);
      localStorage.setItem(`recent_clients_${user.id}`, JSON.stringify(recentIds));
      loadRecentClients();
    }
  };

  const selectedClient = clients.find(c => c.id === value) || recentClients.find(c => c.id === value);
  const displayedClients = clients.filter(c => !recentClients.some(rc => rc.id === c.id));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-left flex items-center justify-between ${className}`}
      >
        <span className={selectedClient ? 'text-gray-900' : 'text-gray-500'}>
          {selectedClient ? selectedClient.name : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : (
              <>
                {recentClients.length > 0 && !isSearching && (
                  <div className="border-b border-gray-200">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Récentes
                    </div>
                    {recentClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className={`w-full px-3 py-2 text-left hover:bg-belaya-50 transition-colors ${
                          value === client.id ? 'bg-belaya-100 text-belaya-deep font-medium' : 'text-gray-900'
                        }`}
                      >
                        {client.name}
                      </button>
                    ))}
                  </div>
                )}

                {displayedClients.length === 0 && recentClients.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-gray-500">
                    {searchQuery ? 'Aucune cliente trouvée' : 'Aucune cliente'}
                  </div>
                ) : (
                  <>
                    {displayedClients.length > 0 && (
                      <>
                        {recentClients.length > 0 && !isSearching && (
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-t border-gray-100">
                            Toutes les clientes
                          </div>
                        )}
                        {displayedClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => handleSelectClient(client)}
                            className={`w-full px-3 py-2 text-left hover:bg-belaya-50 transition-colors ${
                              value === client.id ? 'bg-belaya-100 text-belaya-deep font-medium' : 'text-gray-900'
                            }`}
                          >
                            {client.name}
                          </button>
                        ))}
                      </>
                    )}

                    {hasMore && !isSearching && (
                      <button
                        type="button"
                        onClick={loadMoreClients}
                        disabled={loadingMore}
                        className="w-full px-3 py-3 text-sm text-belaya-primary hover:bg-belaya-50 transition-colors border-t border-gray-200 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          'Charger plus'
                        )}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
