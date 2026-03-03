import { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard as Edit, Trash2, Upload, Download, FileText, Plus, X, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { StudentWithDetails, TrainingProgram, StudentTraining, StudentDocument, DocumentStage, DocumentType } from '../types/training';
import { DOCUMENT_TYPES_BY_STAGE } from '../types/training';
import { calculateStudentStatus, getStatusLabel, getStatusColor } from '../lib/studentHelpers';
import StudentForm from '../components/training/StudentForm';

interface StudentDetailProps {
  onPageChange?: (page: string) => void;
}

export default function StudentDetail({ onPageChange }: StudentDetailProps) {
  const pathname = window.location.pathname;
  const id = pathname.split('/').pop();
  const { profile } = useAuth();
  const [student, setStudent] = useState<StudentWithDetails | null>(null);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile?.company_id && id) {
      loadData(true);
    }
  }, [profile?.company_id, id]);

  async function loadData(isInitialLoad: boolean = false) {
    if (!profile?.company_id || !id) {
      setLoading(false);
      setError('Données manquantes');
      return;
    }

    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);

    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          trainings:student_trainings(
            *,
            training_program:training_programs(*)
          ),
          documents:student_documents(*)
        `)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (studentError) {
        console.error('Student error:', studentError);
        throw new Error('Erreur lors du chargement de l\'élève');
      }

      if (!studentData) {
        setError('Élève non trouvé');
        if (isInitialLoad) {
          setTimeout(() => onPageChange?.('training'), 2000);
        }
        return;
      }

      const calculatedStatus = calculateStudentStatus(studentData.training_start_date, studentData.training_end_date);

      setStudent({
        ...studentData,
        status: calculatedStatus,
      } as StudentWithDetails);

      const { data: programsData, error: programsError } = await supabase
        .from('training_programs')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (programsError) {
        console.error('Programs error:', programsError);
      } else {
        setPrograms(programsData || []);
      }
    } catch (err) {
      console.error('Error loading student:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }

  async function handleDeleteStudent() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élève ? Cette action est irréversible.')) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onPageChange?.('training');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function handleFileUpload(documentType: DocumentType, documentStage: DocumentStage, file: File) {
    if (!profile?.company_id || !id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.company_id}/${id}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('student_documents')
        .insert({
          student_id: id,
          document_type: documentType,
          document_stage: documentStage,
          file_path: fileName,
        });

      if (dbError) throw dbError;

      loadData();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(doc: StudentDocument) {
    if (!confirm('Supprimer ce document ?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('student-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function handleDownloadDocument(doc: StudentDocument) {
    try {
      const { data, error } = await supabase.storage
        .from('student-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_path.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Erreur lors du téléchargement');
    }
  }

  function getDocumentByType(type: DocumentType): StudentDocument | undefined {
    return student?.documents?.find(d => d.document_type === type);
  }

  function getDocumentsByStage(stage: DocumentStage): StudentDocument[] {
    return student?.documents?.filter(d => d.document_stage === stage) || [];
  }

  function handleOpenEmailModal() {
    if (!student?.email) {
      alert('Aucun email configuré pour cet élève');
      return;
    }
    setSelectedDocuments(new Set());
    setShowEmailModal(true);
  }

  async function handleSendEmail(subject: string, message: string) {
    setSendingEmail(true);
    try {
      const docsList = Array.from(selectedDocuments).map(id => {
        const doc = student?.documents?.find(d => d.id === id);
        return doc ? `- ${doc.file_path.split('/').pop()}` : '';
      }).filter(Boolean).join('\n');

      alert(
        `Email prêt à envoyer à: ${student?.email}\n\n` +
        `Sujet: ${subject}\n\n` +
        `Message: ${message}\n\n` +
        `Documents joints (${selectedDocuments.size}):\n${docsList || 'Aucun'}\n\n` +
        `Fonctionnalité d'envoi en cours de développement.`
      );

      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSendingEmail(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600 font-medium">{error}</div>
        <button
          onClick={() => loadData(true)}
          className="px-4 py-2 bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Aucune donnée disponible</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onPageChange?.('training')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-gray-600 mt-1">Fiche élève</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditStudent(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={handleDeleteStudent}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{student.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Téléphone</p>
            <p className="font-medium">{student.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Instagram</p>
            <p className="font-medium">{student.instagram_username || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date de début de formation</p>
            <p className="font-medium">{new Date(student.training_start_date).toLocaleDateString('fr-FR')}</p>
          </div>
          {student.training_level && (
            <div>
              <p className="text-sm text-gray-600">Niveau de formation</p>
              <p className="font-medium">{student.training_level}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Date de fin</p>
            <p className="font-medium">{new Date(student.training_end_date).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Statut (automatique)</p>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                {getStatusLabel(student.status)}
              </span>
            </div>
          </div>
          {student.internal_notes && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Notes internes</p>
              <p className="font-medium whitespace-pre-wrap">{student.internal_notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Formations</h2>
          <button
            onClick={() => setShowAddTraining(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        <div className="space-y-3">
          {student.trainings && student.trainings.length > 0 ? (
            student.trainings.map((training: any) => (
              <div key={training.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{training.training_program?.name || 'Formation'}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(training.training_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  {training.status === 'upcoming' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      À venir
                    </span>
                  )}
                  {training.status === 'in_progress' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      En cours
                    </span>
                  )}
                  {training.status === 'completed' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Terminé
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">Aucune formation</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Documents</h2>
          <button
            onClick={handleOpenEmailModal}
            disabled={!student.email}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              student.email
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={!student.email ? 'Email manquant' : 'Envoyer un email à l\'élève'}
          >
            <Mail className="w-4 h-4" />
            Envoyer un email
          </button>
        </div>

        {(['before', 'during', 'after'] as DocumentStage[]).map((stage) => {
          const stageDocs = getDocumentsByStage(stage);

          return (
            <div key={stage} className="mb-8 last:mb-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {stage === 'before' && 'Avant la formation'}
                  {stage === 'during' && 'Pendant la formation'}
                  {stage === 'after' && 'Après la formation'}
                </h3>
                <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Upload...' : 'Uploader'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload('contract', stage, file);
                      }
                    }}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="space-y-2">
                {stageDocs.length > 0 ? (
                  stageDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{doc.file_path.split('/').pop()}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">Aucun document</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showEditStudent && student && (
        <StudentForm
          student={student}
          onClose={() => setShowEditStudent(false)}
          onSuccess={loadData}
        />
      )}

      {showEmailModal && student && (
        <EmailModal
          student={student}
          documents={student.documents || []}
          selectedDocuments={selectedDocuments}
          onToggleDocument={(id) => {
            const newSelection = new Set(selectedDocuments);
            if (newSelection.has(id)) {
              newSelection.delete(id);
            } else {
              newSelection.add(id);
            }
            setSelectedDocuments(newSelection);
          }}
          onSend={handleSendEmail}
          onClose={() => setShowEmailModal(false)}
          sending={sendingEmail}
        />
      )}
    </div>
  );
}

interface EmailModalProps {
  student: StudentWithDetails;
  documents: StudentDocument[];
  selectedDocuments: Set<string>;
  onToggleDocument: (id: string) => void;
  onSend: (subject: string, message: string) => void;
  onClose: () => void;
  sending: boolean;
}

function EmailModal({ student, documents, selectedDocuments, onToggleDocument, onSend, onClose, sending }: EmailModalProps) {
  const [subject, setSubject] = useState(`Formation - ${student.first_name} ${student.last_name}`);
  const [message, setMessage] = useState(`Bonjour ${student.first_name},\n\nVeuillez trouver ci-joint les documents relatifs à votre formation.\n\nCordialement`);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Envoyer un email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinataire
            </label>
            <input
              type="email"
              value={student.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sujet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent resize-none"
            />
          </div>

          {documents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents à joindre ({selectedDocuments.size} sélectionné{selectedDocuments.size > 1 ? 's' : ''})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {documents.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(doc.id)}
                      onChange={() => onToggleDocument(doc.id)}
                      className="w-4 h-4 text-belaya-500 border-gray-300 rounded focus:ring-belaya-primary"
                    />
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 flex-1">
                      {doc.file_path.split('/').pop()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {doc.document_stage === 'before' && 'Avant'}
                      {doc.document_stage === 'during' && 'Pendant'}
                      {doc.document_stage === 'after' && 'Après'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onSend(subject, message)}
              disabled={sending || !subject || !message}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {sending ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
