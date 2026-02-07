interface ClientMinimal {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  instagram_handle: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  banned?: boolean;
  appointmentCount?: number;
}

interface CacheEntry {
  data: ClientMinimal[];
  timestamp: number;
  hasMore: boolean;
  offset: number;
  filter: string;
  search: string;
}

class ClientsCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private readonly SESSION_KEY = 'clients_cache';

  constructor() {
    this.loadFromSession();
  }

  private getCacheKey(filter: string, search: string, offset: number): string {
    return `${filter}:${search}:${offset}`;
  }

  private loadFromSession() {
    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as CacheEntry);
        });
        console.log('[ClientsCache] Loaded from sessionStorage', this.cache.size, 'entries');
      }
    } catch (error) {
      console.error('[ClientsCache] Failed to load from sessionStorage:', error);
    }
  }

  private saveToSession() {
    try {
      const obj = Object.fromEntries(this.cache);
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('[ClientsCache] Failed to save to sessionStorage:', error);
    }
  }

  get(filter: string, search: string, offset: number): CacheEntry | null {
    const key = this.getCacheKey(filter, search, offset);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > this.CACHE_TTL) {
      this.cache.delete(key);
      this.saveToSession();
      return null;
    }

    return entry;
  }

  set(
    filter: string,
    search: string,
    offset: number,
    data: ClientMinimal[],
    hasMore: boolean
  ) {
    const key = this.getCacheKey(filter, search, offset);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      hasMore,
      offset,
      filter,
      search,
    };

    this.cache.set(key, entry);
    this.saveToSession();
  }

  invalidate(filter?: string) {
    if (filter) {
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.startsWith(`${filter}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
    this.saveToSession();
  }

  clear() {
    this.cache.clear();
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  getStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const clientsCache = new ClientsCache();
export type { ClientMinimal };

export async function prefetchClients(
  userId: string,
  filter: 'all' | 'archived' = 'all',
  supabaseClient: any
) {
  const cached = clientsCache.get(filter, '', 0);
  if (cached) {
    console.log('[Clientes] prefetch skipped (already cached)');
    return;
  }

  const startTime = performance.now();

  try {
    let query = supabaseClient
      .from('clients')
      .select('id, first_name, last_name, phone, email, instagram_handle, created_at, updated_at, is_archived, banned', { count: 'exact' })
      .eq('user_id', userId);

    if (filter === 'archived') {
      query = query.eq('is_archived', true).eq('banned', false);
    } else {
      query = query.eq('is_archived', false).eq('banned', false);
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    let clientsData: ClientMinimal[] = data || [];

    if (clientsData.length > 0) {
      const clientIds = clientsData.map(c => c.id);
      const { data: eventsData } = await supabaseClient
        .from('events')
        .select('client_id')
        .in('client_id', clientIds)
        .neq('status', 'cancelled');

      const appointmentCounts = new Map<string, number>();
      eventsData?.forEach((event: any) => {
        if (event.client_id) {
          appointmentCounts.set(
            event.client_id,
            (appointmentCounts.get(event.client_id) || 0) + 1
          );
        }
      });

      clientsData.forEach(client => {
        client.appointmentCount = appointmentCounts.get(client.id) || 0;
      });
    }

    const hasMoreResults = (count || 0) > 30;
    clientsCache.set(filter, '', 0, clientsData, hasMoreResults);

    const endTime = performance.now();
    console.log('[Clientes] prefetch completed', {
      returned: clientsData.length,
      tookMs: Math.round(endTime - startTime)
    });
  } catch (error) {
    console.error('[Clientes] prefetch failed:', error);
  }
}
