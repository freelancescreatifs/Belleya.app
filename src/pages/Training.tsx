import { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, CheckCircle, Clock, AlertTriangle, Plus, Search, Filter, Settings, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BelayaLoader from '../components/shared/BelayaLoader';
import type { StudentWithDetails, TrainingDashboardStats, StudentStatus } from '../types/training';
import { calculateStudentStatus, getStatusLabel, getStatusColor } from '../lib/studentHelpers';
import StudentForm from '../components/training/StudentForm';
import StudentDetailDrawer from '../components/training/StudentDetailDrawer';

interface TrainingProps {
  onPageChange?: (page: string) => void;
}

export default function Training({ onPageChange }: TrainingProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<TrainingDashboardStats>({
    total_students_trained: 0,
    trainings_in_progress: 0,
    trainings_completed: 0,
    upcoming_students: 0,
    incomplete_folders: 0,
  });
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [folderFilter, setFolderFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [editingStudent, setEditingStudent] = useState<StudentWithDetails | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    } else if (profile && !profile.company_id) {
      setLoading(false);
      setError('Profil entreprise non configuré');
    }
  }, [profile?.company_id, profile]);

  async function loadData() {
    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await supabase.rpc('seed_default_training_templates', { p_company_id: profile.company_id });

      const [studentsRes, templatesRes] = await Promise.all([
        supabase
          .from('students')
          .select(`
            *,
            trainings:student_trainings(
              *,
              training_program:training_programs(*)
            ),
            documents:student_documents(*)
          `)
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('training_document_templates')
          .select('id')
          .eq('company_id', profile.company_id)
          .eq('is_required', true),
      ]);

      if (studentsRes.error) throw studentsRes.error;

      const requiredTemplateIds = new Set((templatesRes.data || []).map((t: any) => t.id));

      const studentsWithDetails: StudentWithDetails[] = (studentsRes.data || []).map(student => {
        const uploadedTemplateIds = new Set(
          (student.documents || [])
            .filter((d: any) => d.template_id)
            .map((d: any) => d.template_id)
        );
        const missingCount = [...requiredTemplateIds].filter(id => !uploadedTemplateIds.has(id)).length;

        const calculatedStatus = calculateStudentStatus(student.training_start_date, student.training_end_date);

        return {
          ...student,
          status: calculatedStatus,
          missing_documents_count: missingCount,
        };
      });

      setStudents(studentsWithDetails);

      const totalStudentsTrained = studentsWithDetails.filter(s => s.status === 'completed').length;
      const trainingsInProgress = studentsWithDetails.filter(s => s.status === 'in_progress').length;
      const upcomingStudents = studentsWithDetails.filter(s => s.status === 'upcoming').length;
      const incompleteFolders = studentsWithDetails.filter(s => (s.missing_documents_count || 0) > 0).length;

      setStats({
        total_students_trained: totalStudentsTrained,
        trainings_in_progress: trainingsInProgress,
        trainings_completed: 0,
        upcoming_students: upcomingStudents,
        incomplete_folders: incompleteFolders,
      });
    } catch (err) {
      console.error('Error loading training data:', err);
      setError('Erreur lors du chargement des élèves');
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      searchTerm === '' ||
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

    const matchesFolder =
      folderFilter === 'all' ||
      (folderFilter === 'complete' && (student.missing_documents_count || 0) === 0) ||
      (folderFilter === 'incomplete' && (student.missing_documents_count || 0) > 0);

    return matchesSearch && matchesStatus && matchesFolder;
  });

  async function handleDeleteStudent(e: React.MouseEvent, studentId: string, studentName: string) {
    e.stopPropagation();

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${studentName} ? Cette action est irréversible.`)) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Erreur lors de la suppression');
    }
  }

  const getNextTrainingDate = (student: StudentWithDetails) => {
    const upcomingTrainings = student.trainings?.filter((t: any) => t.status === 'upcoming') || [];
    if (upcomingTrainings.length === 0) return null;
    const sorted = upcomingTrainings.sort((a: any, b: any) =>
      new Date(a.training_date).getTime() - new Date(b.training_date).getTime()
    );
    return sorted[0]?.training_date;
  };

  if (loading) {
    return <BelayaLoader variant="section" />;
  }

  if (!profile?.company_id && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full">
              <GraduationCap className="w-12 h-12 text-pink-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Configuration requise</h2>
              <p className="text-gray-600">
                Pour utiliser le module "Élèves", commencez par compléter votre profil entreprise.
              </p>
            </div>

            <div className="w-full space-y-3 pt-4">
              <button
                onClick={() => onPageChange?.('settings')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-md font-medium"
              >
                <Settings className="w-5 h-5" />
                Compléter mon profil entreprise
              </button>

              <button
                onClick={() => onPageChange?.('dashboard')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour au tableau de bord
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600 text-center">
          <p className="font-semibold">Impossible de charger les élèves</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Élèves</h1>
          <p className="text-gray-600 mt-1">Gérez vos élèves et leurs formations</p>
        </div>
        <button
          onClick={() => setShowAddStudent(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-belaya-primary to-belaya-bright text-white rounded-lg hover:from-belaya-primary hover:to-belaya-deep transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Nouvel élève
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Élèves formés</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_students_trained}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.trainings_in_progress}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">À venir</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcoming_students}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <button
          onClick={() => setFolderFilter('incomplete')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dossiers incomplets</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.incomplete_folders}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StudentStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="upcoming">À venir</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
              </select>
              <select
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value as 'all' | 'complete' | 'incomplete')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">Tous les dossiers</option>
                <option value="complete">Complets</option>
                <option value="incomplete">Incomplets</option>
              </select>
            </div>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <GraduationCap className="w-12 h-12 text-gray-300" />
              <div>
                <p className="text-gray-900 font-medium">
                  {students.length === 0 ? 'Aucun élève pour le moment' : 'Aucun élève trouvé'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {students.length === 0 ? 'Commencez par ajouter votre premier élève' : 'Essayez de modifier vos filtres'}
                </p>
              </div>
              {students.length === 0 && (
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-600 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un élève
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map((student) => {
                const nextDate = getNextTrainingDate(student);
                const isComplete = (student.missing_documents_count || 0) === 0;

                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
                  >
                    <div className="relative h-32 bg-gradient-to-br from-pink-400/10 to-pink-100 flex items-center justify-center">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={`${student.first_name} ${student.last_name}`}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
                          {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStudent(student);
                          }}
                          className="p-1.5 bg-white rounded-lg shadow-md hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteStudent(e, student.id, `${student.first_name} ${student.last_name}`)}
                          className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-center">
                          {student.first_name} {student.last_name}
                        </h3>
                        {student.email && (
                          <p className="text-xs text-gray-500 text-center truncate mt-0.5">{student.email}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                          {getStatusLabel(student.status)}
                        </span>
                      </div>

                      {student.trainings && student.trainings.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {student.trainings.slice(0, 2).map((t: any) => (
                            <span
                              key={t.id}
                              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {t.training_program?.name || 'Formation'}
                            </span>
                          ))}
                          {student.trainings.length > 2 && (
                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              +{student.trainings.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        {nextDate && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Prochaine date:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(nextDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Dossier:</span>
                          {isComplete ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                              Complet
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {student.missing_documents_count} manquant{(student.missing_documents_count || 0) > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showAddStudent && (
        <StudentForm
          onClose={() => setShowAddStudent(false)}
          onSuccess={loadData}
          onStudentCreated={(studentId) => {
            setSelectedStudentId(studentId);
          }}
        />
      )}

      {selectedStudentId && (
        <StudentDetailDrawer
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          onDeleted={() => {
            setSelectedStudentId(null);
            loadData();
          }}
          onUpdated={loadData}
        />
      )}

      {editingStudent && (
        <StudentForm
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
