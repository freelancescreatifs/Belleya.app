import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ChevronDown, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Student {
  id: string;
  name: string;
}

interface StudentSelectorProps {
  value: string;
  onChange: (studentId: string, studentName: string) => void;
  onCreateNew?: () => void;
  className?: string;
  placeholder?: string;
}

const PAGE_SIZE = 30;

export default function StudentSelector({
  value,
  onChange,
  onCreateNew,
  className = '',
  placeholder = 'Sélectionner un élève'
}: StudentSelectorProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isSearching) {
      loadInitialStudents();
    }
  }, [isOpen, profile?.company_id]);

  useEffect(() => {
    loadRecentStudents();
  }, [profile?.company_id]);

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
        searchStudents(searchQuery);
      }, 250);
    } else if (searchQuery.length === 0) {
      setIsSearching(false);
      loadInitialStudents();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const loadRecentStudents = async () => {
    if (!profile?.company_id) return;

    const storedRecent = localStorage.getItem(`recent_students_${profile.company_id}`);
    if (storedRecent) {
      try {
        const recentIds = JSON.parse(storedRecent) as string[];

        console.log('[StudentSelector] loadRecentStudents using table=students, company_id=', profile.company_id);

        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('company_id', profile.company_id)
          .in('id', recentIds)
          .limit(5);

        if (error) {
          console.log('[StudentSelector] loadRecentStudents error:', error);
        }

        if (!error && data) {
          console.log('[StudentSelector] loadRecentStudents fetched', data.length, 'students');
          const studentsWithNames = data.map(student => ({
            id: student.id,
            name: `${student.first_name} ${student.last_name}`.trim()
          }));

          const orderedStudents = recentIds
            .map(id => studentsWithNames.find(s => s.id === id))
            .filter(s => s !== undefined) as Student[];

          setRecentStudents(orderedStudents);
        }
      } catch (error) {
        console.error('[StudentSelector] Error loading recent students:', error);
      }
    }
  };

  const loadInitialStudents = async () => {
    if (!profile?.company_id) return;

    setLoading(true);
    setOffset(0);

    console.log('[StudentSelector] loadInitialStudents using table=students, company_id=', profile.company_id);

    try {
      const { data, error, count } = await supabase
        .from('students')
        .select('id, first_name, last_name', { count: 'exact' })
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) {
        console.error('[StudentSelector] loadInitialStudents error:', error);
        throw error;
      }

      console.log('[StudentSelector] students fetched', data?.length, 'total count:', count, 'first student:', data?.[0]);

      if (data) {
        const studentsWithNames = data.map(student => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`.trim()
        }));
        setStudents(studentsWithNames);
        setHasMore((count || 0) > PAGE_SIZE);
        setOffset(PAGE_SIZE);
      }
    } catch (error) {
      console.error('[StudentSelector] Error loading initial students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreStudents = async () => {
    if (!profile?.company_id || loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const { data, error, count } = await supabase
        .from('students')
        .select('id, first_name, last_name', { count: 'exact' })
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      if (data) {
        const studentsWithNames = data.map(student => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`.trim()
        }));
        setStudents(prev => [...prev, ...studentsWithNames]);
        setHasMore((count || 0) > offset + PAGE_SIZE);
        setOffset(prev => prev + PAGE_SIZE);
      }
    } catch (error) {
      console.error('[StudentSelector] Error loading more students:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const searchStudents = async (query: string) => {
    if (!profile?.company_id) return;

    setLoading(true);

    console.log('[StudentSelector] searchStudents using table=students, company_id=', profile.company_id, 'query=', query);

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('company_id', profile.company_id)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.error('[StudentSelector] searchStudents error:', error);
        throw error;
      }

      console.log('[StudentSelector] search results for query:', query, 'count:', data?.length);

      if (data) {
        const studentsWithNames = data.map(student => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`.trim()
        }));
        setStudents(studentsWithNames);
        setHasMore(false);
      }
    } catch (error) {
      console.error('[StudentSelector] Error searching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student: Student) => {
    onChange(student.id, student.name);
    setIsOpen(false);
    setSearchQuery('');

    if (profile?.company_id) {
      const storedRecent = localStorage.getItem(`recent_students_${profile.company_id}`);
      let recentIds: string[] = [];

      if (storedRecent) {
        try {
          recentIds = JSON.parse(storedRecent) as string[];
        } catch (e) {
          recentIds = [];
        }
      }

      recentIds = [student.id, ...recentIds.filter(id => id !== student.id)].slice(0, 5);
      localStorage.setItem(`recent_students_${profile.company_id}`, JSON.stringify(recentIds));
      loadRecentStudents();
    }
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    setSearchQuery('');
    if (onCreateNew) {
      onCreateNew();
    }
  };

  const selectedStudent = students.find(s => s.id === value) || recentStudents.find(s => s.id === value);
  const displayedStudents = students.filter(s => !recentStudents.some(rs => rs.id === s.id));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent text-left flex items-center justify-between ${className}`}
      >
        <span className={selectedStudent ? 'text-gray-900' : 'text-gray-500'}>
          {selectedStudent ? selectedStudent.name : placeholder}
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
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>

          {onCreateNew && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full px-3 py-3 text-left hover:bg-belleya-50 transition-colors border-b border-gray-200 flex items-center gap-2 text-belleya-primary font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Créer un nouvel élève
            </button>
          )}

          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : (
              <>
                {recentStudents.length > 0 && !isSearching && (
                  <div className="border-b border-gray-200">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Récents
                    </div>
                    {recentStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleSelectStudent(student)}
                        className={`w-full px-3 py-2 text-left hover:bg-belleya-50 transition-colors ${
                          value === student.id ? 'bg-belleya-100 text-belleya-deep font-medium' : 'text-gray-900'
                        }`}
                      >
                        {student.name}
                      </button>
                    ))}
                  </div>
                )}

                {displayedStudents.length === 0 && recentStudents.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-gray-500">
                    {searchQuery ? 'Aucun élève trouvé' : 'Aucun élève'}
                  </div>
                ) : (
                  <>
                    {displayedStudents.length > 0 && (
                      <>
                        {recentStudents.length > 0 && !isSearching && (
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-t border-gray-100">
                            Tous les élèves
                          </div>
                        )}
                        {displayedStudents.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleSelectStudent(student)}
                            className={`w-full px-3 py-2 text-left hover:bg-belleya-50 transition-colors ${
                              value === student.id ? 'bg-belleya-100 text-belleya-deep font-medium' : 'text-gray-900'
                            }`}
                          >
                            {student.name}
                          </button>
                        ))}
                      </>
                    )}

                    {hasMore && !isSearching && (
                      <button
                        type="button"
                        onClick={loadMoreStudents}
                        disabled={loadingMore}
                        className="w-full px-3 py-3 text-sm text-belleya-primary hover:bg-belleya-50 transition-colors border-t border-gray-200 flex items-center justify-center gap-2 disabled:opacity-50"
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
